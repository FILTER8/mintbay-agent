import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const hash=x=>createHash('sha256').update(x).digest('hex');
import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
for(const count of [3,260]){
 const dir=await mkdtemp(join(tmpdir(),'mb-gen-'));
 const traits=Array.from({length:count},(_,i)=>({id:`trait${i}`,name:`Trait ${i}`,weight:1,pixels:['#000000','transparent','transparent','transparent'],incompatibleWith:[]}));
 if(count===260){traits[0].incompatibleWith=['trait259'];traits[259].incompatibleWith=['trait0'];}
 const artwork={name:'Test  " A',supply:300,gridSize:2,layers:[{id:'l0',name:'Layer',traits:traits.slice(0,count===3?1:1)},{id:'l1',name:'Next',traits:traits.slice(1)}]};
 const words=Math.ceil(count/256);const compiledTraits=traits.map((t,i)=>({globalId:i,layerIndex:i===0?0:1,indexInLayer:i===0?0:i-1,id:t.id,name:t.name,weight:1,pixelsHex:'01000000',exclusionMask:Array(words).fill('0x0')}));
 if(count===260){compiledTraits[0].exclusionMask[1]='0x8';compiledTraits[259].exclusionMask[0]='0x1';}
 const config={collection:{name:artwork.name,symbol:'TST',chainId:4663,maxSupply:300,maxMintsPerWallet:0,creatorReserve:2,royaltyBps:600,royaltyReceiver:'0x1111111111111111111111111111111111111111',payoutRecipient:'0x1111111111111111111111111111111111111111',platformFeeBps:500,mintPriceEth:'0.001',sourceHeaderArt:'██'},deployment:{adminMode:'standard',expectedDeployer:'0x1111111111111111111111111111111111111111'},mintbayV5:{schemaVersion:5,platformFeeBps:500,sharedLifetimeSupply:true,creatorMint:{enabled:true,allowance:2},holderClaim:{enabled:true,claimsPerToken:1,sourceCollections:[{contract:'0x2222222222222222222222222222222222222222',mintPriceEth:'0'}]},burnAndClaim:{enabled:false},oneShot:{enabled:true},supplyReduction:{enabled:true},ownershipTransfer:{enabled:true},royalties:{enabled:true,mode:'erc2981',bps:600,recipient:'0x1111111111111111111111111111111111111111'}}};
 if(count===3)config.mintbayV5.burnAndClaim={enabled:true,sourceCollections:['0x4e68e1f912d5d9c3fb6795b2af87ffac87882575']};
 config.collection.payoutRecipient='0xb316e8ea7bc9b24ea5fd4ebd07051678c27ffe79';config.collection.royaltyReceiver=config.collection.payoutRecipient;config.deployment.expectedDeployer=config.collection.payoutRecipient;config.mintbayV5.royalties.recipient=config.collection.payoutRecipient;config.mintbayV5.holderClaim.sourceCollections[0].contract='0x2ee6305804dd94f7ff695c5ab1f3ae805f317653';
 const a=JSON.stringify(artwork);const c={format:'mintbay-compiled-artwork-v1',source:{rawArtworkSha256:hash(a),gridSize:2},encoding:{wordsPerTrait:words},palette:['transparent','#000000'],layers:[{name:'Layer',offset:0,count:1},{name:'Next',offset:1,count:count-1}],traits:compiledTraits};
 const data={'config.json':JSON.stringify(config),'artwork.json':a,'compiled-artwork.json':JSON.stringify(c)};const manifest={schemaVersion:1,id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',chainId:4663,files:{}};
 for(const [fn,content] of Object.entries(data)){await writeFile(join(dir,fn),content);manifest.files[fn.replace('.json','').replace('compiled-artwork','compiledArtwork')]={sha256:hash(content)};}
 await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest));
 execFileSync('node',[join(root,'scripts/generate-collection.mjs'),'--local','--dir',dir,'--out',join(dir,'out')]);
 const src=await readFile(join(dir,'out','TestAData.sol'),'utf8');if(!src.includes('returns (uint256, uint256)'))throw Error('tuple return regression');if(count===260&&!src.includes('id==0 && word==1'))throw Error('multiword regression');
 const col=await readFile(join(dir,'out','TestA.sol'),'utf8');if(!col.includes('██'))throw Error('unicode missing');if(!col.includes('renderer.fingerprint(choice)'))throw Error('External trait lookup missing');if(!col.includes('renderer.tokenURI(tokenId,_tokenToSeed[tokenId])'))throw Error('External renderer hookup missing');if(!col.includes('_usedTraitCombinations'))throw Error('uniqueness missing');if(count===3&&!col.includes('approvedBurnClaimCollections[0x4e68e1F912d5D9c3fb6795B2af87FfaC87882575]'))throw Error('burn allowlist missing');if(!col.includes('0xB316e8ea7bC9B24ea5Fd4eBd07051678C27Ffe79'))throw Error('deployer checksum regression');if(!col.includes('0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653'))throw Error('claim checksum regression');
 const record=JSON.parse(await readFile(join(dir,'out','generation.json'),'utf8'));if(record.contractName!=='TestA')throw Error('contract name regression');
 console.log(`PASS ${count} traits generator and checksum checks`);
}

// Burn & Claim constructor configuration is tested on a separate local fixture below.
