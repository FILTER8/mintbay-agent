import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const h=b=>createHash('sha256').update(b).digest('hex');
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),check=Buffer.alloc(4);length.writeUInt32BE(data.length);check.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([length,name,data,check])}
function makePng(colors){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(2,0);ihdr.writeUInt32BE(2,4);ihdr[8]=8;ihdr[9]=6;
const rows=[];for(let y=0;y<2;y++){const line=Buffer.from([0]);const pixels=[];for(let x=0;x<2;x++)pixels.push(...colors[y*2+x]);rows.push(Buffer.concat([line,Buffer.from(pixels)]))}
return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);}
const dir=await mkdtemp(join(tmpdir(),'mintbay-png-audit-'));await mkdir(join(dir,'assets'));
const colors=[[255,0,0,255],[0,0,0,0],[0,128,0,255],[0,0,255,255]];
const png=makePng(colors);await writeFile(join(dir,'assets/000000.png'),png);
const artwork={name:'Test',gridSize:2,layers:[{id:'bg',name:'Background',traits:[{id:'a',name:'RGB Test',pixels:['rgb(255, 0, 0)','transparent','#008000','#0000ff'],weight:100,incompatibleWith:[]}]}]};
const ab=Buffer.from(JSON.stringify(artwork));await writeFile(join(dir,'artwork.json'),ab);
const pm={schemaVersion:1,format:'mintbay-png-assets-v1',gridSize:2,assets:[{traitId:'a',layerId:'bg',layerIndex:0,traitIndex:0,path:'assets/000000.png',width:2,height:2,mimeType:'image/png',sha256:h(png),bytes:png.length}]};
const pb=Buffer.from(JSON.stringify(pm));await writeFile(join(dir,'png-manifest.json'),pb);
const m={schemaVersion:1,id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',files:{artwork:{sha256:h(ab)},pngAssets:{sha256:h(pb),count:1}}};await writeFile(join(dir,'manifest.json'),JSON.stringify(m));
function run(){return spawnSync(process.execPath,[join(root,'scripts/verify-png-build.mjs'),'--local','--dir',dir],{encoding:'utf8'})}
let r=run();if(r.status!==0||!r.stdout.includes('PASS_PNG_ARTWORK_PARITY'))throw Error('Valid PNG unexpectedly failed: '+r.stderr+r.stdout);
await writeFile(join(dir,'assets/000000.png'),Buffer.concat([png.subarray(0,45),Buffer.from([png[45]^1]),png.subarray(46)]));
r=run();if(r.status===0||!r.stderr.includes('hash/size mismatch'))throw Error('Tampered PNG unexpectedly passed: '+r.stderr+r.stdout);
console.log('PASS valid PNG artwork (including rgb source), rejects corrupted bytes');
