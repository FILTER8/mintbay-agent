#!/usr/bin/env node
// Mintbay V5 deterministic source generator. Standard Node.js only. NO transactions.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const sha = x => createHash('sha256').update(x).digest('hex');
const ok = (v,m) => { if(!v) throw Error(m); };
const repo = resolve(fileURLToPath(new URL('..',import.meta.url)));
const host = 'https://api.mintbay.fun';
const arg = process.argv.slice(2);
const pick = k => { const i=arg.indexOf(k); return i<0 ? undefined : arg[i+1]; };
const input = arg[0], dest = resolve(pick('--out') || './generated');
const safeJson = JSON.stringify;
const number = (x,min,max) => Number.isSafeInteger(x)&&x>=min&&x<=max;
const addr = x=>typeof x==='string'&&/^0x[\da-fA-F]{40}$/.test(x);
// Keccak-256 (Ethereum, not NIST SHA3-256), standard Node.js without dependencies.
const ROT=[[0,36,3,41,18],[1,44,10,45,2],[62,6,43,15,61],[28,55,25,21,56],[27,20,39,8,14]];
const RC=[0x1n,0x8082n,0x800000000000808an,0x8000000080008000n,0x808bn,0x80000001n,0x8000000080008081n,0x8000000000008009n,0x8an,0x88n,0x80008009n,0x8000000an,0x8000808bn,0x800000000000008bn,0x8000000000008089n,0x8000000000008003n,0x8000000000008002n,0x8000000000000080n,0x800an,0x800000008000000an,0x8000000080008081n,0x8000000000008080n,0x80000001n,0x8000000080008008n];
const MASK64=(1n<<64n)-1n;
const rotl=(x,n)=>n===0?x:((x<<BigInt(n))|(x>>BigInt(64-n)))&MASK64;
function keccak256(bytes){
 const state=Array(25).fill(0n), rate=136;
 const pad=Buffer.alloc(Math.ceil((bytes.length+1)/rate)*rate || rate);
 bytes.copy(pad);pad[bytes.length]=0x01;pad[pad.length-1]|=0x80;
 for(let pos=0;pos<pad.length;pos+=rate){
  for(let i=0;i<rate;i++)state[i>>3]^=BigInt(pad[pos+i])<<BigInt((i%8)*8);
  for(const rc of RC){
   const c=Array.from({length:5},(_,x)=>state[x]^state[x+5]^state[x+10]^state[x+15]^state[x+20]);
   const d=Array.from({length:5},(_,x)=>c[(x+4)%5]^rotl(c[(x+1)%5],1));
   for(let y=0;y<5;y++)for(let x=0;x<5;x++)state[x+5*y]^=d[x];
   const b=Array(25).fill(0n);
   for(let y=0;y<5;y++)for(let x=0;x<5;x++)b[y+5*((2*x+3*y)%5)]=rotl(state[x+5*y],ROT[x][y]);
   for(let y=0;y<5;y++)for(let x=0;x<5;x++)state[x+5*y]=b[x+5*y]^((~b[(x+1)%5+5*y])&b[(x+2)%5+5*y]);
   state[0]^=rc;
  }
 }
 const out=Buffer.alloc(32);for(let i=0;i<32;i++)out[i]=Number((state[i>>3]>>BigInt((i%8)*8))&255n);
 return out.toString('hex');
}
function checksumAddress(value){
 ok(addr(value),`Invalid Solidity address: ${value}`);
 const lower=value.slice(2).toLowerCase(), hashed=keccak256(Buffer.from(lower,'ascii'));
 return '0x'+Array.from(lower,(ch,i)=>parseInt(hashed[i],16)>=8?ch.toUpperCase():ch).join('');
}
const sol = x => JSON.stringify(x).replace(/[\u2028\u2029]/g, c=>c==='\u2028'?'\\u2028':'\\u2029');
const nameSafe = x => /^[a-zA-Z_][\w]*$/.test(x);
const money = x => {ok(typeof x==='string' && /^(0|[1-9]\d*)(\.\d{1,18})?$/.test(x), 'Invalid ETH decimal'); const [a,b='']=x.split('.'); return (BigInt(a)*10n**18n + BigInt(b.padEnd(18,'0'))).toString();};
const readJson = async f => JSON.parse(await readFile(f,'utf8'));
async function load() {
 if(input==='--local') {
  const p=resolve(pick('--dir')||'.'); const [manifest, config, artwork, compiledArtwork]=await Promise.all(['manifest.json','config.json','artwork.json','compiled-artwork.json'].map(x=>readJson(join(p,x))));
  const bytes=await Promise.all(['config.json','artwork.json','compiled-artwork.json'].map(x=>readFile(join(p,x))));
  for(const [i,k] of ['config','artwork','compiledArtwork'].entries()) ok(sha(bytes[i])===manifest.files[k].sha256,`${k} hash mismatch`);
  return {manifest,config,artwork,compiledArtwork};
 }
 ok(typeof input==='string' && /^[0-9a-f-]{36}$/i.test(input) || typeof input==='string'&& /^https:\/\/api\.mintbay\.fun\/v1\/builds\/[0-9a-f-]{36}\/?$/i.test(input),'Pass build UUID / URL or --local --dir PATH');
 const url=input.startsWith('http')?input.replace(/\/$/,''):`${host}/v1/builds/${input}`;
 async function get(u){const x=new URL(u);ok(x.origin===host && x.pathname.startsWith('/v1/builds/')&&!x.search&&!x.hash,'Untrusted artifact URL');const r=await fetch(u,{redirect:'error'});ok(r.ok,`HTTP ${r.status}: ${u}`);return Buffer.from(await r.arrayBuffer());}
 const manifest=JSON.parse((await get(url)).toString());
 ok(manifest.id===url.split('/').at(-1),'Manifest ID mismatch');
 const values={};
 for(const k of ['config','artwork','compiledArtwork']) {const f=manifest.files?.[k];ok(f&&typeof f.url==='string'&&/^[a-f0-9]{64}$/.test(f.sha256),`Missing ${k} metadata`);const b=await get(f.url);ok(sha(b)===f.sha256,`${k} SHA256 mismatch`);values[k]=JSON.parse(b.toString());}
 return {manifest,...values};
}
function check({manifest,config,artwork,compiledArtwork:c}) {
 ok(manifest.schemaVersion===1 && config.mintbayV5?.schemaVersion===5,'Not V5');
 ok(c.format==='mintbay-compiled-artwork-v1' && c.source?.rawArtworkSha256===manifest.files.artwork.sha256,'Compiled artwork lineage mismatch');
 const co=config.collection, v=config.mintbayV5;
 ok(co&&co.chainId===manifest.chainId && co.name===artwork.name && co.maxSupply===artwork.supply,'Config / artwork mismatch');
 ok(co.platformFeeBps===500 && v.platformFeeBps===500 && v.sharedLifetimeSupply===true,'Protocol fee/lifetime mismatch');
 ok(addr(co.payoutRecipient),'Invalid payout');
 ok(number(co.maxSupply,1,1000000) && number(co.maxMintsPerWallet,0,1000000),'Invalid supply/wallet limit');
 ok(v.creatorMint?.allowance===co.creatorReserve && number(co.creatorReserve,0,co.maxSupply),'Creator reserve mismatch');
 ok(['standard','hoodwallet'].includes(config.deployment?.adminMode),'Invalid admin mode');
 ok(config.deployment.adminMode==='standard','Candidate base only supports standard EOA administrator. HoodWallet mode is not yet supported.');
 ok(addr(config.deployment.expectedDeployer),'Standard EOA expectedDeployer address required');
 ok(v.royalties?.bps===co.royaltyBps && (v.royalties.enabled ? addr(co.royaltyReceiver):co.royaltyBps===0),'Royalty mismatch');
 ok(v.royalties.mode!=='enforced' || v.royalties.validatorConfiguredAtDeployment===false,'Validator activation cannot be asserted');
 const burnSources=v.burnAndClaim?.enabled ? v.burnAndClaim.sourceCollections : [];
 ok(Array.isArray(burnSources) && burnSources.length<=5 && (!v.burnAndClaim?.enabled || burnSources.length>0),'Burn & Claim requires 1-5 source collections');
 for(const source of burnSources) ok(addr(typeof source==='string'?source:source?.contract),'Invalid burn source collection');
 ok(new Set(burnSources.map(x=>(typeof x==='string'?x:x.contract).toLowerCase())).size===burnSources.length,'Duplicate burn source');
 const sources=v.holderClaim?.enabled ? v.holderClaim.sourceCollections : [];
 ok(Array.isArray(sources)&&sources.length<=5 && (v.holderClaim.enabled?sources.length>0:true),'Bad claim collections');
 for(const s of sources) {ok(addr(s.contract),'Bad claim source');money(s.mintPriceEth);}
 ok(new Set(sources.map(s=>s.contract.toLowerCase())).size===sources.length,'Duplicate source');
 ok(number(v.holderClaim.claimsPerToken,0,1000000),'Bad claim allowance');
 ok(Array.isArray(c.layers)&&Array.isArray(c.traits)&&c.layers.length>0&&c.traits.length>0,'Missing compiled traits');
 const n=c.traits.length,grid=c.source.gridSize,words=Math.ceil(n/256);
 ok(number(grid,2,128)&&grid===artwork.gridSize,'Invalid grid');
 ok(c.encoding?.wordsPerTrait===words && c.palette?.[0]==='transparent' && c.palette.length<=256,'Invalid encoding');
 let offset=0;const ids=new Map();
 for(const [li,layer] of c.layers.entries()) {const raw=artwork.layers[li];ok(raw&&layer.offset===offset&&layer.count===raw.traits.length&&layer.name===raw.name,'Layer mismatch');for(let j=0;j<layer.count;j++){const t=c.traits[offset+j],o=raw.traits[j];ok(t.globalId===offset+j && t.name===o.name && t.id===o.id && t.weight===o.weight && number(t.weight,1,65535),'Trait identity mismatch');ok(/^[\da-f]*$/i.test(t.pixelsHex) && t.pixelsHex.length===grid*grid*2,'Pixels invalid');for(let i=0;i<grid*grid;i++) {const ix=parseInt(t.pixelsHex.slice(i*2,i*2+2),16);ok(c.palette[ix]===o.pixels[i].toLowerCase(),'Pixel parity mismatch');}ok(t.exclusionMask.length===words,'Mask length mismatch');ids.set(t.id,offset+j);}offset+=layer.count;}
 ok(offset===n,'Total trait mismatch');
 const exp=Array.from({length:n},()=>Array(words).fill(0n));
 for(const [i,t] of c.traits.entries()) {const original=artwork.layers[t.layerIndex]?.traits[t.indexInLayer];ok(original?.id===t.id,'Wrong index');for(const other of original.incompatibleWith){ok(ids.has(other),'Unknown exclusion');const j=ids.get(other);ok(j!==i&&c.traits[j].layerIndex!==t.layerIndex,'Invalid exclusion');exp[i][Math.floor(j/256)]|=1n<<BigInt(j%256);exp[j][Math.floor(i/256)]|=1n<<BigInt(i%256);}}
 for(const [i,t] of c.traits.entries())for(let w=0;w<words;w++)ok(BigInt(t.exclusionMask[w])===exp[i][w],`Mask parity ${i}:${w}`);
 return {co,v,c,grid,n,words,sources,burnSources};
}
const RESERVED = new Set('abstract after alias apply as assembly auto break byte case catch constant constructor continue contract default delete do else emit enum error event external fallback false final for from function global if immutable implements import in indexed inline interface internal is let library mapping match memory modifier new null of override payable pragma private public pure receive reference relocatable return returns revert selfdestruct solidity static storage string struct super supports switch this throw true try type typeof unchecked using var view virtual while'.split(' '));
function toPascalCase(value){
 const parts=String(value||'').normalize('NFKD').replace(/[^a-zA-Z0-9 _-]/g,' ').split(/[ _-]+/).filter(Boolean);
 let name=parts.map(x=>x[0].toUpperCase()+x.slice(1)).join('').slice(0,64);
 if(!name || /^[0-9]/.test(name) || RESERVED.has(name.toLowerCase()))name='Mintbay'+name;
 return name;
}
const jsonFragment=x=>JSON.stringify(x).slice(1,-1);
const switchFn=(items, name, type, fallback='0')=>`    function ${name}(uint256 i) internal pure returns (${type}) {\n${items.map((s,i)=>`        if(i==${i}) return ${s};`).join('\n')}\n        return ${fallback};\n    }\n`;
function makeData(s,id) {
 const {c,grid,n,words}=s;
 const names=id+'Data';
 const layers=c.layers;
 const funcs=[];
 funcs.push(switchFn(layers.map(x=>`(${x.offset},${x.count})`),'layerOffset','uint256, uint256','(0,0)'));
 funcs.push(switchFn(c.traits.map(t=>String(t.weight)),'weight','uint256'));
 funcs.push(switchFn(c.traits.map(t=>'unicode'+sol(jsonFragment(t.name))),'traitName','string memory','""'));
 funcs.push(switchFn(layers.map(x=>'unicode'+sol(jsonFragment(x.name))),'layerName','string memory','""'));
 funcs.push(switchFn(c.traits.map(t=>`hex"${t.pixelsHex}"`),'pixels','bytes memory','hex""'));
 funcs.push(switchFn(c.palette.map((x,i)=>sol(x)),'paletteColor','string memory','"transparent"'));
 const maskLines=[];
 for(let i=0;i<n;i++)for(let w=0;w<words;w++){const x=BigInt(c.traits[i].exclusionMask[w]);if(x)maskLines.push(`        if (id==${i} && word==${w}) return ${'0x'+x.toString(16)};`);}
 return `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\nlibrary ${names} {\n    uint256 internal constant GRID = ${grid};\n    uint256 internal constant LAYERS = ${layers.length};\n    uint256 internal constant WORDS = ${words};\n${funcs.join('\n')}\n    function mask(uint256 id,uint256 word) internal pure returns(uint256) {\n${maskLines.join('\n')}\n        return 0;\n    }\n    function choose(bytes32 seed) internal pure returns (uint256[${layers.length}] memory chosen) {\n        uint256[${words}] memory excluded;\n        for(uint256 l=0;l<LAYERS;l++){\n            (uint256 first,uint256 count)=layerOffset(l);\n            uint256 total=0;\n            for(uint256 i=0;i<count;i++){uint256 id=first+i;if((excluded[id/256] & (uint256(1) << (id%256)))==0)total+=weight(id);}\n            require(total>0,"No compatible trait");\n            uint256 roll=uint256(keccak256(abi.encode(seed,l)))%total;\n            uint256 selected=first;\n            for(uint256 i=0;i<count;i++){uint256 id=first+i;if((excluded[id/256] & (uint256(1) << (id%256)))!=0)continue;uint256 w=weight(id);if(roll<w){selected=id;break;}roll-=w;}\n            chosen[l]=selected;\n            for(uint256 w=0;w<WORDS;w++)excluded[w] |= mask(selected,w);\n        }\n    }\n}\n`;
}
function makeRenderer(s,id){const {grid,c}=s;const nm=id+'Renderer',dt=id+'Data';return `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\nimport {Base64} from "solady/src/utils/Base64.sol";\nimport {LibString} from "solady/src/utils/LibString.sol";\nimport {${dt}} from "./${dt}.sol";\nlibrary ${nm} {\n    using LibString for uint256;\n    function svg(bytes32 seed) internal pure returns(string memory){\n        uint256[${c.layers.length}] memory chosen=${dt}.choose(seed);\n        uint8[${grid*grid}] memory pixels_;\n        for(uint256 l=0;l<${c.layers.length};l++){bytes memory p=${dt}.pixels(chosen[l]);for(uint256 i=0;i<${grid*grid};i++)if(uint8(p[i])!=0)pixels_[i]=uint8(p[i]);}\n        string memory rects="";\n        for(uint256 i=0;i<${grid*grid};i++)if(pixels_[i]!=0){rects=string.concat(rects,'<rect x="',(i%${grid}).toString(),'" y="',(i/${grid}).toString(),'" width="1" height="1" fill="',${dt}.paletteColor(pixels_[i]),'"/>');}\n        return string.concat('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid} ${grid}" shape-rendering="crispEdges">',rects,'</svg>');\n    }\n    function attributes(bytes32 seed) internal pure returns(string memory){\n        uint256[${c.layers.length}] memory chosen=${dt}.choose(seed);\n        string memory a="";\n        for(uint256 l=0;l<${c.layers.length};l++){a=string.concat(a,l==0?"":",",'{"trait_type":"',${dt}.layerName(l),'","value":"',${dt}.traitName(chosen[l]),'"}');}\n        return string.concat('[',a,']');\n    }\n    function tokenURI(uint256 id,bytes32 seed) internal pure returns(string memory){\n        string memory j=string.concat('{"name":',${sol(s.co.name+' #')},'"');\n        // Correct JSON escaping of user strings is done at generation time, not in Solidity.\n        j=string.concat('{"name":"',unicode${sol(jsonFragment(s.co.name+' #'))},id.toString(),'","description":"Fully on-chain Mintbay collection","image":"data:image/svg+xml;base64,',Base64.encode(bytes(svg(seed))),'","attributes":',attributes(seed),'}');\n        return string.concat('data:application/json;base64,',Base64.encode(bytes(j)));\n    }\n}\n` .replace(/        string memory j=string.concat\([^\n]+\n/, '        string memory j;\n');}
function makeCollection(s,id){const {co,v,sources}=s;const royalty=v.royalties;const header=typeof co.sourceHeaderArt==='string'?co.sourceHeaderArt.replace(/\r\n?/g,'\n').split('\n').map(x=>'// '+x).join('\n')+'\n':'';
 const claimLines=sources.map(x=>`        approvedClaimCollections[${checksumAddress(x.contract)}]=ApprovedClaim(true,${money(x.mintPriceEth)});`);
 const burnLines=s.burnSources.map(x=>`        approvedBurnClaimCollections[${checksumAddress(typeof x==='string'?x:x.contract)}]=true;`);
 const lines=[...claimLines,...burnLines].join('\n');
 const uniqueness=`    mapping(bytes32 => bool) private _usedTraitCombinations;
    function _selectMintSeed(uint256, bytes32 candidate) internal override returns (bytes32) {
        bytes32 choice = candidate;
        for (uint256 attempt = 0; attempt < 10; attempt++) {
            bytes32 fingerprint = keccak256(abi.encode(${id}Data.choose(choice)));
            if (!_usedTraitCombinations[fingerprint]) {
                _usedTraitCombinations[fingerprint] = true;
                return choice;
            }
            if (attempt < 9) choice = keccak256(abi.encode(choice, attempt));
        }
        // Best effort: a duplicate after ten collisions is permitted by design.
        return choice;
    }
`;
 return `// SPDX-License-Identifier: MIT\n${header}pragma solidity ^0.8.24;\nimport {MintbayNetIntegratedERC721A} from "./contracts/MintbayNetIntegratedERC721A.sol";\nimport {${id}Renderer} from "./${id}Renderer.sol";\nimport {${id}Data} from "./${id}Data.sol";\ncontract ${id} is MintbayNetIntegratedERC721A {\n    constructor() MintbayNetIntegratedERC721A(\n        unicode${sol(co.name)},unicode${sol(co.symbol)},${money(co.mintPriceEth)},${co.maxSupply},${co.maxMintsPerWallet},${co.creatorReserve},${v.holderClaim.claimsPerToken},\n        ${!!v.holderClaim.enabled},${!!v.burnAndClaim.enabled},${!!v.oneShot.enabled},${!!v.supplyReduction.enabled},${!!v.ownershipTransfer.enabled},\n        ${checksumAddress(configAddress(s))},${checksumAddress(co.payoutRecipient)},${checksumAddress(royalty.enabled?royalty.recipient:co.payoutRecipient)},${royalty.enabled?royalty.bps:0}\n    ) {\n${lines}\n    }\n${uniqueness}    function tokenURI(uint256 tokenId) public view override returns(string memory){require(_exists(tokenId),"Nonexistent token");return ${id}Renderer.tokenURI(tokenId,_tokenToSeed[tokenId]);}\n}\n`;
}
function configAddress(s){return s.expectedDeployer;}
async function main(){const all=await load();const s=check(all);s.expectedDeployer=all.config.deployment.expectedDeployer;
 const build=all.manifest.id;const id=toPascalCase(s.co.name);ok(nameSafe(id),'Bad identifier');
 const outputs={ [`${id}Data.sol`]:makeData(s,id),[`${id}Renderer.sol`]:makeRenderer(s,id),[`${id}.sol`]:makeCollection(s,id)};
 await mkdir(join(dest,'contracts'),{recursive:true});const base=join(repo,'assets/contracts/v5/MintbayNetIntegratedERC721A.sol');await copyFile(base,join(dest,'contracts/MintbayNetIntegratedERC721A.sol'));
 const hashes={};for(const [f,content] of Object.entries(outputs)){await writeFile(join(dest,f),content);hashes[f]=sha(content);}hashes['contracts/MintbayNetIntegratedERC721A.sol']=sha(await readFile(base));
 const record={buildId:build,contractName:id,chainId:all.manifest.chainId,sourceHashes:hashes,configSha256:all.manifest.files.config.sha256,artworkSha256:all.manifest.files.artwork.sha256,compiledSha256:all.manifest.files.compiledArtwork.sha256,note:'V5.1 source generation only; actual compilation, runtime sizing and execution must be checked before deployment.'};
 await writeFile(join(dest,'generation.json'),JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify({status:'GENERATED_UNVERIFIED',directory:dest,...record},null,2));
}
main().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});
