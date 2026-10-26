#!/usr/bin/env node
// Mintbay: fetch verified build, generate sources, compile, emit an UNSIGNED creation transaction.
// No private keys, no RPC broadcasts, no secrets and no backend registration.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, join, dirname, posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const repo=resolve(fileURLToPath(new URL('..',import.meta.url)));
const args=process.argv.slice(2);
const flag=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1];};
assertEncodeOnly();
function assertEncodeOnly(){ assert(!args.includes('--broadcast'), 'Broadcasting is not available: use Bankr to sign and submit'); }
const build=args[0], output=resolve(flag('--out')||join(process.cwd(),'generated',build||'unknown'));
const sha=b=>createHash('sha256').update(b).digest('hex');
function assert(v, msg) { if (!v) throw Error(msg); }
const reference=join(repo,'assets/contracts/v6');
const requireFromDeps=createRequire(join(reference,'package.json'));

async function run(){
 assert(build && (/^[\da-f-]{36}$/i.test(build)||/^https:\/\/api\.mintbay\.fun\/v1\/builds\/[\da-f-]{36}\/?$/i.test(build)),'Usage: node scripts/prepare-deploy.mjs BUILD_ID [--out DIRECTORY]');
 let solc;
 try{solc=requireFromDeps('solc');}catch{throw Error('Install compiler dependencies once: npm install --prefix assets/contracts/v6 --no-audit --no-fund');}
 assert(solc.version().startsWith('0.8.24+'),'Pinned solc 0.8.24 required, found '+solc.version());
 const generated=join(output,'sources');
 const genArgs=[join(repo,'scripts/generate-collection.mjs'),build,'--out',generated];if(flag('--html'))genArgs.push('--html',flag('--html'));
 const generator=spawnSync(process.execPath,genArgs,{encoding:'utf8',maxBuffer:32*1024*1024});
 if(generator.status!==0)throw Error('Source generator failed:\n'+generator.stderr+'\n'+generator.stdout);
 const record=JSON.parse(await readFile(join(generated,'generation.json'),'utf8'));
 const chainNames={1:'mainnet',130:'unichain',137:'polygon',4663:'robinhood',8453:'base',42161:'arbitrum'};
 assert(Object.hasOwn(chainNames,record.chainId),'Unsupported Mintbay chain ID: '+record.chainId);
 const netEnabled=[1,130,4663,8453].includes(record.chainId);
 const nativeCurrency=record.chainId===137?'POL':'ETH';
 const main=record.contractName || `Mintbay_${record.buildId.replaceAll('-', '_')}`;
 const projectFiles=[`${main}.sol`,`${main}Data.sol`,`${main}Renderer.sol`,...Array.from({length:record.dataShardCount||0},(_,i)=>`${main}DataShard${i}.sol`),'contracts/MintbayCoreERC721A.sol'];
 const sources={};
 const normalize=s=>posix.normalize(s);
 const files=new Map();
 for(const p of projectFiles)files.set(p,join(generated,p));
 async function include(sourcePath,absolutePath){
  if(sources[sourcePath])return;
  const content=await readFile(absolutePath,'utf8');
  sources[sourcePath]={content};
  const imports=[...content.matchAll(/\bimport\s+(?:[^;]*?\s+from\s+)?["']([^"']+)["']\s*;/g)].map(m=>m[1]);
  for(const imported of imports){
   const next=imported.startsWith('.')?normalize(posix.join(posix.dirname(sourcePath),imported)):imported;
   const target=imported.startsWith('.')?resolve(dirname(absolutePath),imported):resolve(reference,'node_modules',imported);
   assert(target.startsWith(resolve(reference,'node_modules')+'/')||target.startsWith(generated+'/'),'Import escapes allowed source roots: '+imported);
   await include(next,target);
  }
 }
 for(const p of projectFiles)await include(p,files.get(p));
 const standardInput={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','metadata']}}}};
 const compilerOutput=JSON.parse(solc.compile(JSON.stringify(standardInput)));
 const errors=compilerOutput.errors||[];
 const failures=errors.filter(x=>x.severity==='error');
 if(failures.length)throw Error('Solidity compilation failed:\n'+failures.map(x=>x.formattedMessage).join('\n'));
 const contracts=[
  ...Array.from({length:record.dataShardCount||0},(_,i)=>({key:`dataShard${i}`,source:`${main}DataShard${i}.sol`,name:`${main}DataShard${i}`})),
  {key:'data',source:`${main}Data.sol`,name:`${main}Data`},
  {key:'renderer',source:`${main}Renderer.sol`,name:`${main}Renderer`},
  {key:'collection',source:`${main}.sol`,name:main}
 ];
 await mkdir(output,{recursive:true});
 await writeFile(join(output,'StandardInput.json'),JSON.stringify(standardInput,null,2)+'\n');
 const standardInputSha256=sha(await readFile(join(output,'StandardInput.json')));
 const components=[];
 for(const item of contracts){
  const artifact=compilerOutput.contracts?.[item.source]?.[item.name];
  assert(artifact?.evm?.bytecode?.object,'Missing creation bytecode '+item.name);
  const init=artifact.evm.bytecode.object, runtime=artifact.evm.deployedBytecode.object;
  assert(/^[a-f\d]+$/i.test(init)&&!init.includes('__'),'Unlinked bytecode '+item.name);
  assert(runtime.length/2<=24576,`EIP-170 exceeded for ${item.name}: ${runtime.length/2}`);
  assert(init.length/2<=49152,`EIP-3860 initcode exceeded for ${item.name}: ${init.length/2}`);
  await writeFile(join(output,`${item.key}-abi.json`),JSON.stringify(artifact.abi,null,2)+'\n');
  await writeFile(join(output,`${item.key}-initcode.txt`),'0x'+init+'\n');
  components.push({role:item.key,contractName:item.name,source:item.source,initCodeBytes:init.length/2,runtimeBytes:runtime.length/2,runtimeHeadroomBytes:24576-runtime.length/2,initCodeSha256:sha(Buffer.from(init,'hex')),abiFile:`${item.key}-abi.json`,initcodeFile:`${item.key}-initcode.txt`});
 }
 // Immutable media initcode: PUSH2 length, DUP1, PUSH1 0x0a, RETURNDATASIZE, CODECOPY, RETURNDATASIZE, RETURN, STOP + data.
 // Chunk pointers must be deployed and independently verified before renderer deployment.
 const mediaComponents=[];
 if(record.media){
  for(let i=0;i<1;i++){
   const raw=await readFile(join(generated,'media',`chunk${i}.bin`));
   assert(raw.length>0&&raw.length<=20000,'Invalid media chunk length '+i);
   const runtime=Buffer.concat([Buffer.from([0]),raw]);
   const length=runtime.length;
   const init=Buffer.concat([Buffer.from([0x61,length>>8,length&255,0x80,0x60,0x0a,0x3d,0x39,0x3d,0xf3]),runtime]);
   assert(runtime.length<=24576 && init.length<=49152,'Media bytecode exceeds EVM limits');
   const name=`chunk${i}`;
   await writeFile(join(output,`${name}-initcode.txt`),'0x'+init.toString('hex')+'\n');
   mediaComponents.push({role:name,initCodeBytes:init.length,runtimeBytes:runtime.length,runtimeSha256:sha(runtime),payloadSha256:sha(raw),initCodeSha256:sha(init),initcodeFile:`${name}-initcode.txt`});
  }
 }
 const manifest={version:6,buildId:record.buildId,chainId:record.chainId,bankrChain:chainNames[record.chainId],nativeCurrency,netEnabled,sourceHashes:record.sourceHashes,compiler:solc.version(),standardInputSha256,media:record.media,components:[...mediaComponents,...components],deploymentOrder:[...mediaComponents.map(x=>x.role),...components.filter(x=>x.role.startsWith('dataShard')).map(x=>x.role),'data','renderer','collection'],status:'V6_EXPERIMENTAL_NOT_READY_TO_BROADCAST',warnings:['Studio build input currently uses V5 fields; V6 schema migration required','Constructor arguments for data router, renderer and core require CREATE2 address chaining','On-chain chunk creation artifacts are generated but local EVM tokenURI reconstruction and ERC6551 execution remain untested','Do not broadcast from this manifest until validation gates are implemented']};
 await writeFile(join(output,'deployment-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));

}
run().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});
