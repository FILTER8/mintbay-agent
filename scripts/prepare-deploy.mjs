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
const assert=(v,msg)=>{if(!v)throw Error(msg);};
const reference=join(repo,'assets/contracts/v5');
const requireFromDeps=createRequire(join(reference,'package.json'));

async function run(){
 assert(build && (/^[\da-f-]{36}$/i.test(build)||/^https:\/\/api\.mintbay\.fun\/v1\/builds\/[\da-f-]{36}\/?$/i.test(build)),'Usage: node scripts/prepare-deploy.mjs BUILD_ID [--out DIRECTORY]');
 let solc;
 try{solc=requireFromDeps('solc');}catch{throw Error('Install compiler dependencies once: npm install --prefix assets/contracts/v5 --no-audit --no-fund');}
 assert(solc.version().startsWith('0.8.24+'),'Pinned solc 0.8.24 required, found '+solc.version());
 const generated=join(output,'sources');
 const genArgs=[join(repo,'scripts/generate-collection.mjs'),build,'--out',generated];
 const generator=spawnSync(process.execPath,genArgs,{encoding:'utf8',maxBuffer:32*1024*1024});
 if(generator.status!==0)throw Error('Source generator failed:\n'+generator.stderr+'\n'+generator.stdout);
 const record=JSON.parse(await readFile(join(generated,'generation.json'),'utf8'));
 assert(record.chainId===4663,'Only Robinhood Chain (4663) is supported in this command');
 const main=`Mintbay_${record.buildId.replaceAll('-','_')}`;
 const projectFiles=[`${main}.sol`,`${main}Data.sol`,`${main}Renderer.sol`,'contracts/MintbayNetIntegratedERC721A.sol'];
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
 const artifact=compilerOutput.contracts?.[`${main}.sol`]?.[main];
 assert(artifact?.evm?.bytecode?.object,'Missing collection creation bytecode');
 const bytecode=artifact.evm.bytecode.object, runtime=artifact.evm.deployedBytecode.object;
 assert(/^[a-f\d]+$/i.test(bytecode) && !bytecode.includes('__'),'Unlinked bytecode');
 assert(runtime.length/2<=24576,`EIP-170 runtime limit exceeded: ${runtime.length/2} bytes`);
 assert(bytecode.length/2<=49152,`EIP-3860 initcode limit exceeded: ${bytecode.length/2} bytes`);
 await mkdir(output,{recursive:true});
 await writeFile(join(output,'StandardInput.json'),JSON.stringify(standardInput,null,2)+'\n');
 await writeFile(join(output,'abi.json'),JSON.stringify(artifact.abi,null,2)+'\n');
 const tx={chainId:4663,to:null,data:'0x'+bytecode,value:'0'};
 await writeFile(join(output,'transaction.json'),JSON.stringify(tx,null,2)+'\n');
 const summary={buildId:record.buildId,chainId:4663,sourceHashes:record.sourceHashes,compiler:solc.version(),standardInputSha256:sha(await readFile(join(output,'StandardInput.json'))),initCodeBytes:bytecode.length/2,runtimeBytes:runtime.length/2,runtimeHeadroomBytes:24576-runtime.length/2,transactionFile:'transaction.json',standardInputFile:'StandardInput.json',warnings:errors.filter(x=>x.severity!=='error').map(x=>x.formattedMessage),status:'READY_FOR_REVIEW_AND_BANKR_CONTRACT_CREATION',note:'Compiled and encoded only. Not deployed, EVM-tested, audited, explorer-verified, or registered. Bankr must support to=null contract creation.'};
 await writeFile(join(output,'prepare-result.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({...summary,transaction:tx},null,2));
}
run().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});
