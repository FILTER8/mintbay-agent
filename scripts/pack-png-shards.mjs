#!/usr/bin/env node
/** Mintbay fully on-chain PNG shard packer. Pure unsigned local artifact generation. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
const option=k=>{const n=args.indexOf(k);return n<0?undefined:args[n+1];};
const source=args[0];
const output=resolve(option('--out')||'./png-shards');
const limit=Number(option('--payload-limit')||20000);
const API='https://api.mintbay.fun';
const sha=x=>createHash('sha256').update(x).digest('hex');
function must(test,message){if(!test)throw Error(message);}
function makeInit(runtime){
  must(runtime.length>0&&runtime.length<=24576,'EIP-170 runtime code limit exceeded');
  // PUSH2 length, DUP1, PUSH2 0x000b, PUSH0, CODECOPY, PUSH0, RETURN.
  // Creation code size = 11 bytes; deployed runtime begins with STOP (SSTORE2 guard).
  const prefix=Buffer.from([0x61,runtime.length>>8,runtime.length&255,0x80,0x61,0x00,0x0b,0x5f,0x39,0x5f,0xf3]);
  const init=Buffer.concat([prefix,runtime]);
  must(init.length<=49152,'EIP-3860 initcode size exceeded');
  return init;
}
function assertPng(bytes,grid){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  must(bytes.length>=45&&bytes.subarray(0,8).equals(sig),'Invalid PNG signature');
  must(bytes.toString('ascii',12,16)==='IHDR'&&bytes.readUInt32BE(8)===13,'Invalid PNG IHDR');
  must(bytes.readUInt32BE(16)===grid&&bytes.readUInt32BE(20)===grid,'PNG dimensions mismatch');
  must(bytes.readUInt8(24)===8&&[2,3,6].includes(bytes.readUInt8(25)),'Unsupported PNG color format');
  let offset=8, idat=false, ending=false;
  while(offset<bytes.length){
    must(offset+12<=bytes.length,'Truncated PNG chunk');
    const n=bytes.readUInt32BE(offset), type=bytes.toString('ascii',offset+4,offset+8);
    must(n<=bytes.length-offset-12,'Bad PNG chunk size');
    const crc=bytes.readUInt32BE(offset+8+n);let calc=0xffffffff;
    for(let j=offset+4;j<offset+8+n;j++){calc^=bytes[j];for(let k=0;k<8;k++)calc=(calc>>>1)^((calc&1)?0xedb88320:0);}
    must((calc^0xffffffff)>>>0===crc,`Bad PNG CRC ${type}`);
    must(!['acTL','fcTL','fdAT'].includes(type),'Animated PNG not supported');
    if(type==='IDAT')idat=true;
    offset+=n+12;
    if(type==='IEND'){must(n===0,'Bad IEND');ending=true;break;}
  }
  must(idat&&ending&&offset===bytes.length,'PNG incomplete');
}
async function fetchExact(url){
  const parsed=new URL(url);
  must(parsed.origin===API&&/^\/v1\/builds\/[0-9a-f-]{36}(?:\/.*)?$/i.test(parsed.pathname)&&!parsed.search&&!parsed.hash,'Untrusted build URL');
  const response=await fetch(url,{redirect:'error'});
  must(response.ok,`HTTP ${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
async function load(){
  if(source==='--local'){
    const dir=resolve(option('--dir')||'.');
    const mf=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
    const png=JSON.parse(await readFile(join(dir,'png-manifest.json'),'utf8'));
    return {build:mf,png,bytes:await Promise.all(png.assets.map(a=>readFile(join(dir,a.path))))};
  }
  must(typeof source==='string'&&(/^[0-9a-f-]{36}$/i.test(source)||/^https:\/\/api\.mintbay\.fun\/v1\/builds\/[0-9a-f-]{36}\/?$/i.test(source)),'Pass BUILD_ID or --local --dir DIRECTORY');
  const url=source.startsWith('http')?source.replace(/\/$/,''):`${API}/v1/builds/${source}`;
  const build=JSON.parse((await fetchExact(url)).toString('utf8'));
  must(build.id===url.split('/').at(-1),'Build ID mismatch');
  const field=build.files?.pngAssets;
  must(field&&/^[0-9a-f]{64}$/.test(field.sha256),'PNG manifest is missing');
  const raw=await fetchExact(field.url);
  must(sha(raw)===field.sha256,'PNG manifest hash mismatch');
  const png=JSON.parse(raw.toString('utf8'));
  const bytes=[];
  for(const a of png.assets){
    must(/^assets\/[0-9]{6}\.png$/.test(a.path),'Invalid PNG asset path');
    bytes.push(await fetchExact(`${url}/${a.path}`));
  }
  return {build,png,bytes};
}
async function main(){
  must(Number.isInteger(limit)&&limit>0&&limit<=24575,'Payload limit must be <=24575 bytes (guard byte excluded)');
  const {build,png,bytes}=await load();
  must(png.schemaVersion===1&&png.format==='mintbay-png-assets-v1','Unexpected PNG manifest format');
  must(Number.isInteger(png.gridSize)&&png.gridSize>=2&&png.gridSize<=128,'Bad gridSize');
  must(Array.isArray(png.assets)&&png.assets.length===bytes.length&&bytes.length>0,'Asset count mismatch');
  if(build.files?.pngAssets?.count!==undefined)must(build.files.pngAssets.count===bytes.length,'Build asset count mismatch');
  const shards=[];const locations=[];
  let active=[];let used=0;
  function flush(){if(used){shards.push(Buffer.concat(active));active=[];used=0;}}
  for(let i=0;i<bytes.length;i++){
    const a=png.assets[i], b=bytes[i];
    must(a.path===`assets/${String(i).padStart(6,'0')}.png`&&a.bytes===b.length&&a.width===png.gridSize&&a.height===png.gridSize,'Asset metadata mismatch '+i);
    must(/^[0-9a-f]{64}$/.test(a.sha256)&&sha(b)===a.sha256,`Asset hash mismatch ${i}`);
    assertPng(b,png.gridSize);
    let remaining=b.length, start=0;const pieces=[];
    while(remaining){
      if(used===limit)flush();
      const count=Math.min(remaining,limit-used);
      must(count>0,'Packer made no progress');
      pieces.push({shard:shards.length,offset:1+used,length:count});
      active.push(b.subarray(start,start+count));used+=count;start+=count;remaining-=count;
    }
    locations.push({globalId:i,layerIndex:a.layerIndex,traitIndex:a.traitIndex,traitId:a.traitId,sha256:a.sha256,bytes:b.length,pieces});
  }
  flush();
  await mkdir(output,{recursive:true});
  const deployed=[];
  for(let i=0;i<shards.length;i++){
    const payload=shards[i],runtime=Buffer.concat([Buffer.from([0]),payload]),init=makeInit(runtime);
    await writeFile(join(output,`pngShard${i}-initcode.txt`),'0x'+init.toString('hex')+'\n');
    await writeFile(join(output,`pngShard${i}-runtime.bin`),runtime);
    deployed.push({role:`pngShard${i}`,payloadBytes:payload.length,runtimeBytes:runtime.length,initCodeBytes:init.length,runtimeSha256:sha(runtime),initCodeSha256:sha(init),initcodeFile:`pngShard${i}-initcode.txt`});
  }
  // Independently reconstruct all assets from the exact emitted deployed-runtime bytes.
  const reconstructed=[];
  for(const trait of locations){
    const sections=trait.pieces.map(piece=>{
      const runtime=Buffer.concat([Buffer.from([0]),shards[piece.shard]]);
      must(piece.offset>=1&&piece.offset+piece.length<=runtime.length,'Out-of-range location');
      return runtime.subarray(piece.offset,piece.offset+piece.length);
    });
    const joined=Buffer.concat(sections);
    must(joined.length===trait.bytes&&sha(joined)===trait.sha256,`PNG reconstruction mismatch for ${trait.traitId}`);
    reconstructed.push(joined);
  }
  const report={format:'mintbay-png-shards-v1',buildId:build.id,gridSize:png.gridSize,traitCount:locations.length,shardCount:shards.length,payloadLimit:limit,totalPngBytes:bytes.reduce((n,b)=>n+b.length,0),shards:deployed,locations,validation:{allPngHashesMatch:true,allPngsReconstructed:true},deployment:{readyForBroadcast:false,requiresCREATE2AddressWiring:true}};
  await writeFile(join(output,'png-shards.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:'PNG_SHARDS_VERIFIED',shardCount:shards.length,traitCount:locations.length,totalPngBytes:report.totalPngBytes,out:output},null,2));
}
main().catch(error=>{console.error('ERROR:',error.message);process.exitCode=1;});
