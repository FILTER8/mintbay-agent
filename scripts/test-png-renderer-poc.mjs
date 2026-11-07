#!/usr/bin/env node
/** Test packed shard offsets and generate locally composited, self-contained SVG. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash} from 'node:crypto';

const dir=resolve(process.argv[2]||'./png-shards');
const out=resolve(process.argv[3]||join(dir,'renderer-poc'));
const report=JSON.parse(await readFile(join(dir,'png-shards.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const assert=(b,m)=>{if(!b)throw Error(m);};
assert(report.format==='mintbay-png-shards-v1'&&report.validation?.allPngsReconstructed,'Not a verified PNG pack');
const shards=await Promise.all(report.shards.map(async (s,i)=>{
  const bytes=await readFile(join(dir,`pngShard${i}-runtime.bin`));
  assert(bytes.length===s.runtimeBytes&&sha(bytes)===s.runtimeSha256&&bytes[0]===0,`Shard ${i} integrity`);
  return bytes;
}));
const pngs=report.locations.map(loc=>{
  const pieces=loc.pieces.map(p=>{
    const shard=shards[p.shard];
    assert(shard&&p.offset>=1&&p.offset+p.length<=shard.length,'Shard slice out of range');
    return shard.subarray(p.offset,p.offset+p.length);
  });
  const data=Buffer.concat(pieces);
  assert(data.length===loc.bytes&&sha(data)===loc.sha256,`PNG trait ${loc.globalId} mismatch`);
  return data;
});
const byLayer=new Map();
for(const loc of report.locations){
  if(!byLayer.has(loc.layerIndex))byLayer.set(loc.layerIndex,[]);
  byLayer.get(loc.layerIndex).push(loc.globalId);
}
// Choose first trait from each layer, preserving Studio's bottom-to-top ordering.
const ids=[...byLayer.keys()].sort((a,b)=>a-b).map(layer=>byLayer.get(layer)[0]);
const g=report.gridSize;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g} ${g}" width="${g}" height="${g}">${ids.map(id=>`<image x="0" y="0" width="${g}" height="${g}" preserveAspectRatio="none" image-rendering="pixelated" href="data:image/png;base64,${pngs[id].toString('base64')}"/>`).join('')}</svg>`;
const json={name:'Mintbay PNG POC #0',description:'Local renderer proof of concept; not a production NFT',image:'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')};
const tokenURI='data:application/json;base64,'+Buffer.from(JSON.stringify(json)).toString('base64');
const parsed=JSON.parse(Buffer.from(tokenURI.split(',')[1],'base64').toString('utf8'));
const decoded=Buffer.from(parsed.image.split(',')[1],'base64').toString('utf8');
assert(decoded===svg,'tokenURI metadata roundtrip');
const decodedLayers=[...decoded.matchAll(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/g)].map(m=>Buffer.from(m[1],'base64'));
assert(decodedLayers.length===ids.length,'SVG PNG count');
for(let i=0;i<ids.length;i++)assert(decodedLayers[i].equals(pngs[ids[i]]),'SVG embedded PNG mismatch');
await mkdir(out,{recursive:true});
await Promise.all([
  writeFile(join(out,'sample.svg'),svg),
  writeFile(join(out,'sample-tokenuri.txt'),tokenURI+'\n'),
  writeFile(join(out,'sample-selection.json'),JSON.stringify({gridSize:g,selectedGlobalIds:ids},null,2)+'\n')
]);
console.log(JSON.stringify({status:'PASS_PNG_SVG_RECONSTRUCTION',traitCount:pngs.length,shardCount:shards.length,selectedGlobalIds:ids,embeddedPngs:ids.length,svgBytes:Buffer.byteLength(svg),tokenURIChars:tokenURI.length,out},null,2));
