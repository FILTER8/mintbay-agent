#!/usr/bin/env node
/** Emit ABI-ready constructor arguments for MintbayPackedPngRendererPOC.
 * Supply the actually deployed shard addresses (in shard index order).
 * Does not broadcast transactions or guess addresses.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const dir=resolve(process.argv[2]||'./png-shards');
const addresses=process.argv.slice(3);
const data=JSON.parse(await readFile(join(dir,'png-shards.json'),'utf8'));
if(addresses.length!==data.shardCount||addresses.some(a=>!/^0x[0-9a-fA-F]{40}$/.test(a)))throw Error(`Provide exactly ${data.shardCount} valid shard address(es) after SHARD_DIRECTORY`);
const pieces=[],starts=[0];
for(const t of data.locations){for(const p of t.pieces)pieces.push([p.shard,p.offset,p.length]);starts.push(pieces.length);}
const args=[data.gridSize,addresses,pieces,starts];
const out=join(dir,'png-renderer-poc-args.json');
await writeFile(out,JSON.stringify(args,null,2)+'\n');
console.log(JSON.stringify({status:'PNG_POC_CONSTRUCTOR_ARGS',traitCount:data.locations.length,pieceCount:pieces.length,shardCount:addresses.length,out},null,2));
