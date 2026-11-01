import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

export const sourcePath='G:/VisibleMedicine-temp/staging/20261101-catalog-compiler/WEBSITE_SOURCE.json';
const checkpointPath='F:/VisibleMedicine/recovery/checkpoints/20261101-catalog-compiler/checkpoint.json';
export const nativeHead='d567863a5a8af08b3bbbfa22adf512a389cdc3a3';
export const nativeTree='850724de87929a24dda9cf03a3009f632d6dcaf7';
export const reviewCount=1672, bindingCount=1905;
export const budgets=Object.freeze({
 native:{heap:2304,aggregate:3072,minimum:5120},
 assembly:{heap:1024,aggregate:2048,minimum:4096},
 review:{heap:2304,aggregate:3072,minimum:5120},
 checks:{heap:1024,aggregate:2048,minimum:4096},
 types:{heap:3072,aggregate:3584,minimum:5632},
 build:{heap:2560,aggregate:3584,minimum:5632},
});
export function safeChild(root,relative){
 assert(typeof relative==='string'&&relative.length>0&&!path.isAbsolute(relative)&&!relative.includes('\\')&&!relative.includes(':')&&!relative.split('/').some(p=>!p||p==='.'||p==='..'),'Unsafe relative path');
 const absolute=path.resolve(root,relative);assert(absolute.startsWith(path.resolve(root)+path.sep),'Path outside attempt');return absolute;
}
export function currentContract(prior,head=nativeHead,tree=nativeTree){
 assert.match(head,/^[a-f0-9]{40}$/);assert.match(tree,/^[a-f0-9]{40}$/);
 const changes=[
  [" assert.equal(CURRENT_ATLAS_REVISION,'c0818c9e959544f04b54ef914ec62040f6cac2b3');",` assert.equal(CURRENT_ATLAS_REVISION,'${head}');`],
  [" assert.equal(pin.sourceTree,'dd9852dd608bdb323ef968e78cd12adbb3e9eca9');",` assert.equal(pin.sourceTree,'${tree}');`],
  ["  'head-neck':'c0818c9e959544f04b54ef914ec62040f6cac2b3',",`  'head-neck':'${head}',`],
  [' assert.equal(sourceFiles,1657);assert.equal(inputs,1876);assert(artifacts>100);',` assert.equal(sourceFiles,${reviewCount});assert.equal(inputs,${bindingCount});assert(artifacts>100);`],
 ];
 let after=prior;
 for(const [from,to]of changes){
  const pattern=new RegExp('^'+from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\r?$)','gm');
  assert.equal([...after.matchAll(pattern)].length,1,'Unexpected current delivery contract');
  after=after.replace(pattern,to);
 }
 let inverse=after;for(const[from,to]of [...changes].reverse())inverse=inverse.replace(to,from);
 assert.equal(inverse,prior,'Historical contract changed');return {text:after,changes};
}

export function inspect(){
 const cp=json(checkpointPath);assert.equal(hash(sourcePath),cp.source.sha256,'Candidate source seal changed');
 const source=json(sourcePath);assert.equal(source.atlasHead,nativeHead);assert.equal(source.sourceRows.length,7477);
 const git=(...args)=>execFileSync('git',['-C',source.native,...args],{encoding:'utf8',windowsHide:true}).trim();
 assert.equal(git('rev-parse','HEAD'),nativeHead);assert.equal(git('rev-parse','HEAD^{tree}'),nativeTree);assert.equal(git('status','--porcelain'),'');
 for(const row of source.sourceRows)assert.equal(hash(safeChild(source.website,row.path)),row.sha256,row.path);
 const imported=json(source.website+'/atlas-review/manifest.json'),binding=json(source.website+'/atlas-review/integration-inputs.json');
 assert.equal(imported.revision,nativeHead);assert.equal(imported.files.length,reviewCount);assert.equal(binding.inputs.length,bindingCount);assert.equal(binding.sha256,source.reviewBinding);
 for(const row of imported.files)assert.equal(hash(safeChild(source.website,'atlas-review/'+row.path)),row.importedSha256,row.path);
 for(const row of binding.inputs)assert.equal(hash(safeChild(source.website,row.path)),row.sha256,row.path);
 const original=fs.readFileSync(source.website+'/tests/current-atlas-delivery.test.mjs','utf8');
 currentContract(original);
 const pin=json(source.website+'/tests/fixtures/current-atlas-delivery.json');
 assert.equal(pin.source,'c0818c9e959544f04b54ef914ec62040f6cac2b3');assert.equal(pin.reviewSourceFiles,1657);
 const inventory=json(source.website+'/lib/atlas-model-inventory.json');
 assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(m=>m.paths).length,144);assert.equal(inventory.models.reduce((n,m)=>n+m.bytes,0),199072480);
 for(const limits of Object.values(budgets))assert(limits.minimum>=limits.aggregate+2048);
 return {source,proof:{at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},nativeHead,nativeTree,sourcePaths:7477,imported:reviewCount,boundInputs:bindingCount,reviewBinding:binding.sha256,modelCount:137,modelPaths:144,modelBytes:199072480,priorDeliverySource:pin.source,priorContractSha256:hash(source.website+'/tests/current-atlas-delivery.test.mjs'),budgets,fullChecksRun:false,installed:false}};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--inspect']);
 const {proof}=inspect();console.log(JSON.stringify(proof));
}
