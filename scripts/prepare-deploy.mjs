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


// Canonical EIP-2470 singleton CREATE2 factory. No network transactions are made here.
const CREATE2_FACTORY='0x4e59b44847b379578588920ca78fbf26c0b4956c';
function hexAddress(address) { assert(/^0x[0-9a-fA-F]{40}$/.test(address),'Invalid address'); return address.slice(2).toLowerCase().padStart(64,'0'); }
function encodeAddresses(addresses) {
 const word=n=>BigInt(n).toString(16).padStart(64,'0');
 return word(32)+word(addresses.length)+addresses.map(hexAddress).join('');
}
function derivedSalt(buildId,role){return keccak256(Buffer.from('mintbay-v6:'+buildId+':'+role,'utf8'));}
function computeCreate2(salt,init){
 const payload=Buffer.concat([Buffer.from([255]),Buffer.from(CREATE2_FACTORY.slice(2),'hex'),Buffer.from(salt,'hex'),Buffer.from(keccak256(init),'hex')]);
 return '0x'+keccak256(payload).slice(24);
}
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
 const initByRole=new Map();
 for(const item of contracts){
  const artifact=compilerOutput.contracts?.[item.source]?.[item.name];
  assert(artifact?.evm?.bytecode?.object,'Missing creation bytecode '+item.name);
  const init=artifact.evm.bytecode.object, runtime=artifact.evm.deployedBytecode.object;
  assert(/^[a-f\d]+$/i.test(init)&&!init.includes('__'),'Unlinked bytecode '+item.name);
  assert(runtime.length/2<=24576,`EIP-170 exceeded for ${item.name}: ${runtime.length/2}`);
  assert(init.length/2<=49152,`EIP-3860 initcode exceeded for ${item.name}: ${init.length/2}`);
  await writeFile(join(output,`${item.key}-abi.json`),JSON.stringify(artifact.abi,null,2)+'\n');
  await writeFile(join(output,`${item.key}-initcode.txt`),'0x'+init+'\n');
  initByRole.set(item.key,Buffer.from(init,'hex'));
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
   initByRole.set(name,init);
   mediaComponents.push({role:name,initCodeBytes:init.length,runtimeBytes:runtime.length,runtimeSha256:sha(runtime),payloadSha256:sha(raw),initCodeSha256:sha(init),initcodeFile:`${name}-initcode.txt`});
  }
 }
 // Resolve creation bytecodes in dependency order. Constructor arguments are part of the CREATE2 hash.
 const byRole=new Map([...components,...mediaComponents].map(x=>[x.role,x]));
 const order=[...components.filter(x=>x.role.startsWith('dataShard')).map(x=>x.role),'data',...mediaComponents.map(x=>x.role),'renderer','collection'];
 const predicted={}; const steps=[];
 for(const role of order){
  const component=byRole.get(role); assert(component,'Missing deployment component '+role);
  const base=initByRole.get(role);assert(base,'Missing initcode '+role);
  let constructorArgs='';
  if(role==='data')constructorArgs=encodeAddresses(order.filter(x=>x.startsWith('dataShard')).map(x=>predicted[x]));
  if(role==='renderer')constructorArgs=hexAddress(predicted.data)+(record.media?hexAddress(predicted.chunk0):'');
  if(role==='collection')constructorArgs=hexAddress(predicted.renderer);
  const init=Buffer.concat([base,Buffer.from(constructorArgs,'hex')]);
  assert(init.length<=49152,`EIP-3860 constructor-expanded initcode exceeded for ${role}: ${init.length}`);
  const salt=derivedSalt(record.buildId,role);const address=computeCreate2(salt,init);
  predicted[role]=address;
  const calldata='0x'+salt+init.toString('hex');
  await writeFile(join(output,role+'-create2-calldata.txt'),calldata+'\n');
  steps.push({role,salt:'0x'+salt,factory:CREATE2_FACTORY,predictedAddress:address,initCodeKeccak256:'0x'+keccak256(init),initCodeSha256:sha(init),initCodeBytes:init.length,constructorArgsHex:'0x'+constructorArgs,create2CalldataFile:role+'-create2-calldata.txt',dependencies:role==='data'?order.filter(x=>x.startsWith('dataShard')):role==='renderer'?['data',...(record.media?['chunk0']:[])]:role==='collection'?['renderer']:[]});
 }
 const manifest={version:6,buildId:record.buildId,chainId:record.chainId,bankrChain:chainNames[record.chainId],nativeCurrency,netEnabled,sourceHashes:record.sourceHashes,compiler:solc.version(),standardInputSha256,media:record.media,components:[...mediaComponents,...components],deploymentOrder:order,predicted,create2Factory:CREATE2_FACTORY,steps,erc6551:record.chainId===4663?{registry:'0x000000006551c19487814612e58FE06813775758',implementation:'0x62DF5D2C60b9B434D017cf90765c4a96e0d486a5',salt:'0x'+BigInt(1).toString(16).padStart(64,'0'),mode:'lazy-account-creation'}:null,status:'V6_UNSIGNED_DEPLOYMENT_PREPARED',broadcastPolicy:{mode:'creator_approved_bankr',requiresExplicitApproval:true,preparedOnly:true},warnings:['Unsigned transaction preparation only; Bankr broadcasts solely after the creator explicitly approves each transaction','Verify chain ID, CREATE2 factory code, constructor arguments, deployed code and immutable configuration before sending or reusing transactions','Local EVM mint/tokenURI and ERC-6551 execution tests have not been proven by this preparer','The independent ArcadeGamingVault is NOT a Mintbay V6 deployment dependency and MUST NOT be deployed or enabled implicitly']};
 await writeFile(join(output,'deployment-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));

}
run().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;});
