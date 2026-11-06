#!/usr/bin/env node
// Offline/remote Mintbay PNG build audit. No transaction, no contract generation.
// Node.js built-ins only. Strict PNG decode and pixel-by-pixel comparison to artwork.json.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const args=process.argv.slice(2), value=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1]};
const sha=b=>createHash('sha256').update(b).digest('hex');
const assert=(v,m)=>{if(!v)throw Error(m)};
const base='https://api.mintbay.fun';
const local=args.includes('--local');
const dir=resolve(value('--dir')||'.');
const build=args[0];
const reportPath=value('--report');
function safeUrl(s){const u=new URL(s);assert(u.origin===base && /^\/v1\/builds\/[0-9a-f-]{36}(?:\/(?:artwork|png-manifest|assets\/\d{6}\.png))?$/.test(u.pathname) && !u.search && !u.hash,`Noncanonical URL: ${s}`);return u.toString()}
async function remote(url){const r=await fetch(safeUrl(url),{redirect:'error'});assert(r.ok,`HTTP ${r.status}: ${url}`);return Buffer.from(await r.arrayBuffer())}
async function get(f){return local?readFile(join(dir,f)):remote(`${base}/v1/builds/${build}/${f.replace(/\.json$/,'').replace(/^assets\//,'assets/')}`)}
const pngSig=Buffer.from([137,80,78,71,13,10,26,10]);
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function unpackPng(bytes){
 assert(bytes.length>=45 && bytes.subarray(0,8).equals(pngSig),'Bad PNG header');
 let pos=8,w=0,h=0,depth=0,color=0,palette=null,transparency=null,seenIHDR=false,ended=false;
 const idat=[];
 while(pos<bytes.length){assert(pos+12<=bytes.length,'Truncated PNG');const length=bytes.readUInt32BE(pos);assert(length<=bytes.length-pos-12,'PNG length invalid');const name=bytes.toString('ascii',pos+4,pos+8),data=bytes.subarray(pos+8,pos+8+length);assert(crc32(bytes.subarray(pos+4,pos+8+length))===bytes.readUInt32BE(pos+8+length),`CRC mismatch ${name}`);
  if(name==='IHDR'){assert(!seenIHDR && length===13,'Bad IHDR');seenIHDR=true;w=data.readUInt32BE(0);h=data.readUInt32BE(4);depth=data[8];color=data[9];assert(data[10]===0&&data[11]===0&&data[12]===0,'Unsupported PNG compression/filter/interlace');assert(depth===8&&[2,3,6].includes(color),'Unsupported PNG depth/type')}
  else if(name==='PLTE')palette=Buffer.from(data);
  else if(name==='tRNS')transparency=Buffer.from(data);
  else if(name==='IDAT')idat.push(data);
  else if(name==='acTL'||name==='fcTL'||name==='fdAT')throw Error('Animated PNG unsupported');
  else if(name==='IEND'){assert(length===0,'Bad IEND');ended=true;pos+=12;break}
  else assert(!/^[A-Z]/.test(name),'Unknown critical PNG chunk '+name);
  pos+=length+12;
 }
 assert(seenIHDR&&ended&&pos===bytes.length&&idat.length&&w>=2&&h>=2&&w<=128&&h<=128,'PNG incomplete or invalid dimensions');
 const channels=color===6?4:color===2?3:1,rowBytes=w*channels;
 const raw=inflateSync(Buffer.concat(idat));assert(raw.length===(rowBytes+1)*h,'Unexpected uncompressed size');
 const rgba=Buffer.alloc(w*h*4);let prev=Buffer.alloc(rowBytes),source=0;
 for(let y=0;y<h;y++){
  const filter=raw[source++],row=Buffer.from(raw.subarray(source,source+rowBytes));source+=rowBytes;assert(filter<=4,'Invalid PNG filter');
  for(let x=0;x<row.length;x++){
   const a=x>=channels?row[x-channels]:0,b=prev[x],c=x>=channels?prev[x-channels]:0;
   const p=a+b-c;const pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
   const predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;
   row[x]=(row[x]+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):predictor))&255;
  }
  for(let x=0;x<w;x++){
   const out=(y*w+x)*4,i=x*channels;
   if(color===6){rgba[out]=row[i];rgba[out+1]=row[i+1];rgba[out+2]=row[i+2];rgba[out+3]=row[i+3]}
   else if(color===2){rgba[out]=row[i];rgba[out+1]=row[i+1];rgba[out+2]=row[i+2];rgba[out+3]=255}
   else {assert(palette&&row[i]*3+2<palette.length,'Invalid palette index');rgba[out]=palette[row[i]*3];rgba[out+1]=palette[row[i]*3+1];rgba[out+2]=palette[row[i]*3+2];rgba[out+3]=transparency?.[row[i]]??255}
  }
  prev=row;
 }
 return {width:w,height:h,rgba};
}
function canonicalColor(c){assert(typeof c==='string','Invalid pixel');if(c==='transparent')return null;if(/^#[\da-f]{6}$/i.test(c))return c.slice(1).toLowerCase();if(/^#[\da-f]{3}$/i.test(c))return c.slice(1).split('').map(a=>a+a).join('').toLowerCase();const m=/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(c);assert(m,'Unsupported source pixel '+c);const nums=m.slice(1).map(Number);assert(nums.every(x=>x<=255),'RGB out of range');return nums.map(x=>x.toString(16).padStart(2,'0')).join('')}
function pixelEquals(rgba,i,color){const offset=i*4;if(color===null)return rgba[offset+3]===0;return rgba[offset+3]===255 && rgba.subarray(offset,offset+3).toString('hex')===color}
function verifiedArray(data){assert(Array.isArray(data),'Expected array');return data}
async function main(){assert(local || /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(build||''),'Usage: verify-png-build.mjs BUILD_ID [--report FILE] or --local --dir FOLDER');
 const [manifestBytes,artBytes,pngManifestBytes]=await Promise.all([local?readFile(join(dir,'manifest.json')):remote(`${base}/v1/builds/${build}`),get('artwork.json'),get('png-manifest.json')]);
 const manifest=JSON.parse(manifestBytes),art=JSON.parse(artBytes),p=JSON.parse(pngManifestBytes);
 assert(manifest.files?.artwork?.sha256===sha(artBytes),'artwork.json SHA mismatch');
 assert(manifest.files?.pngAssets?.sha256===sha(pngManifestBytes),'png-manifest.json SHA mismatch');
 assert(p.format==='mintbay-png-assets-v1'&&p.schemaVersion===1&&p.gridSize===art.gridSize,'Bad PNG manifest');
 const traits=verifiedArray(art.layers).flatMap((l,li)=>verifiedArray(l.traits).map((t,ti)=>({layer:l,li,trait:t,ti})));
 assert(traits.length===p.assets.length&&manifest.files.pngAssets.count===traits.length,'Asset count mismatch');
 let total=0,failed=0;const mismatches=[];let compressionBytes=0;
 const selected=Buffer.alloc(art.gridSize*art.gridSize*4);
 for(let i=0;i<traits.length;i++){
  const {layer,li,trait,ti}=traits[i],entry=p.assets[i];
  assert(entry.traitId===trait.id && entry.layerId===layer.id && entry.layerIndex===li && entry.traitIndex===ti,`Trait mapping mismatch at ${i}`);
  assert(entry.path===`assets/${String(i).padStart(6,'0')}.png`,'Noncanonical path');
  const bytes=local?await readFile(join(dir,entry.path)):await remote(`${base}/v1/builds/${build}/${entry.path}`);
  assert(bytes.length===entry.bytes && sha(bytes)===entry.sha256,`PNG hash/size mismatch at ${i}`);
  const png=unpackPng(bytes);assert(png.width===art.gridSize&&png.height===art.gridSize,'PNG dimension mismatch');
  assert(trait.pixels.length===png.width*png.height,'Trait pixel length mismatch');
  for(let pixel=0;pixel<trait.pixels.length;pixel++){
   const color=canonicalColor(trait.pixels[pixel]);if(!pixelEquals(png.rgba,pixel,color)){failed++;if(mismatches.length<12)mismatches.push({asset:i,layer:layer.name,trait:trait.name,pixel,source:trait.pixels[pixel],rgba:[...png.rgba.subarray(pixel*4,pixel*4+4)]})}
  }
  // Render baseline: first trait of every layer, in Studio layer order.
  if(ti===0)for(let j=0;j<selected.length;j+=4)if(png.rgba[j+3])png.rgba.copy(selected,j,j,j+4);
  total++;compressionBytes+=bytes.length;
 }
 const result={status:failed?'FAIL_PIXEL_PARITY':'PASS_PNG_ARTWORK_PARITY',buildId:manifest.id,gridSize:art.gridSize,traitCount:total,pngBytes:compressionBytes,changedPixels:failed,mismatches,notes:'Offline PNG bytes and Studio source parity only; no EVM gas, mint execution or marketplace rendering claims.'};
 if(reportPath){await mkdir(resolve(reportPath,'..'),{recursive:true}).catch(()=>{});await writeFile(resolve(reportPath),JSON.stringify(result,null,2)+'\n')}
 console.log(JSON.stringify(result,null,2));if(failed)process.exitCode=1;
}
main().catch(e=>{console.error('PNG VERIFICATION FAILED:',e.message);process.exitCode=1});
