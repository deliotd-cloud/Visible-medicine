import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

export const sourcePath='G:/VisibleMedicine-temp/staging/20261101-focus-website/WEBSITE_SOURCE.json';
const checkpointPath='F:/VisibleMedicine/recovery/checkpoints/20261101-focus-website-source/checkpoint.json';
export const nativeHead='7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc';
export const nativeTree='2e742b31600a6da39af99558d07ff6986fec6b9e';
export const reviewCount=1675, bindingCount=1908;
export const expectedSourceSha256='5b92c78d38b32e1f2549cd46ef45966b04259945f0289cffdf4a5d212e5742e4';
export const expectedReviewBinding='b19cc36239128192dc21bd32857bec87e03131c4c9f50a89ccecf51fac17420c';
const evidenceRoot='G:/VisibleMedicine-temp/staging/20261101-focus-website';
export const budgets=Object.freeze({
 native:{heap:2304,aggregate:3072,minimum:5120},
 nativeTypes:{heap:3072,aggregate:3584,minimum:5632},
 assembly:{heap:1024,aggregate:2048,minimum:4096},
 review:{heap:2304,aggregate:3072,minimum:5120},
 checks:{heap:1024,aggregate:2048,minimum:4096},
 types:{heap:3072,aggregate:3584,minimum:5632},
 build:{heap:2560,aggregate:3584,minimum:5632},
});
export function safeChild(root,relative){
 assert(typeof relative==='string'&&relative.length>0&&!path.isAbsolute(relative)&&!relative.includes('\\')&&!relative.includes(':')&&!relative.split('/').some(p=>!p||p==='.'||p==='..'),'Unsafe relative path');
 const absolute=path.resolve(root,relative);assert(absolute.startsWith(path.resolve(root)+path.sep),'Path outside attempt');return absolute.replaceAll('\\','/');
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

export function viewerContract(prior){
 const from=' assert.equal(pin.viewerFiles,62);assert.equal(pin.viewerPackages,24);';
 const to=' assert.equal(pin.viewerFiles,63);assert.equal(pin.viewerPackages,24);';
 assert.equal(prior.split(from).length,2,'Unexpected prior viewer count contract');
 const text=prior.replace(from,to);assert.equal(text.replace(to,from),prior);
 return {text,from,to};
}

export const requiredSourceChecks=['import','focus-import-binding','coverage','catalog-declarations','review-binding','atlas-catalog-types','regional-teaching-declarations','prostate-review-binding','prostate-review-inspection','hepatic-coverage-binding','renal-coverage-binding','head-hippocampal-current-source','binding-deterministic'];
export const deliveryPhases=['native-types','native-build','assemble','review-build','focused-checks','full-types','full-build'];
export function validateFinalSourceEvidence(proof,terminal){
 assert.equal(terminal.passing,true,'Guarded final source check did not pass');
 assert.equal(terminal.supervisor.code,0);assert(!terminal.supervisor.error&&!terminal.supervisor.signal);
 assert.equal(terminal.process.terminalObserved,true);assert.equal(terminal.process.exitCode,0);assert(!terminal.process.interrupted);
 assert.equal(proof.sourceRevision,nativeHead);assert.equal(proof.sourceTree,nativeTree);
 assert.equal(proof.imported,reviewCount);assert.equal(proof.bound,bindingCount);
 assert.equal(proof.reviewBinding,expectedReviewBinding);
 assert.equal(proof.installed,false);assert.equal(proof.clinicalApproval,false);assert.equal(proof.patientRegistration,false);
 assert.deepEqual(proof.added,['app/study-return-focus.ts','content/renal-venous-xray.ts']);assert.deepEqual(proof.removed,[]);
 assert.deepEqual(proof.changed,['app/prostate-zones.tsx','app/study-surface.tsx','content/body-renderer-revision.json','content/prostate-zones-revision.json','content/renal-teaching.ts']);
 const checks=new Map(proof.checks.map(row=>[row.name,row]));assert.equal(checks.size,proof.checks.length,'Duplicate source check');
 assert.deepEqual([...checks.keys()],requiredSourceChecks,'Source check phases omitted or reordered');
 for(const name of requiredSourceChecks)assert(/^[a-f0-9]{64}$/.test(checks.get(name)?.logSha256??''),`Missing ${name} result`);
}

export function finalSourceEvidence({required=false}={}){
 const proofPath=evidenceRoot+'/SOURCE_CHECKS.json',terminalPath=evidenceRoot+'/SOURCE_RUN_RESULT.json';
 if(!fs.existsSync(proofPath)||!fs.existsSync(terminalPath)){
  assert(!required,'Complete the exact focus website source checks first');
  return {ready:false,pending:requiredSourceChecks};
 }
 const proof=json(proofPath),terminal=json(terminalPath);
 const checks=new Map(proof.checks.map(row=>[row.name,row]));
 assert.equal(checks.size,proof.checks.length,'Duplicate source check');
 for(const name of requiredSourceChecks){
  const row=checks.get(name);assert(row&&/^[a-f0-9]{64}$/.test(row.logSha256),`Missing ${name} result`);
  assert.equal(hash(evidenceRoot+'/logs/'+name+'.log'),row.logSha256,`Changed ${name} log`);
 }
 validateFinalSourceEvidence(proof,terminal);
 assert.equal(hash(proofPath),json(sourcePath).sourceChecks.sha256,'Source check receipt changed');
 return {ready:true,path:proofPath,sha256:hash(proofPath),terminal:{path:terminalPath,sha256:hash(terminalPath)}};
}

export function inspect(){
 const cp=json(checkpointPath);assert.equal(cp.source.sha256,expectedSourceSha256);assert.equal(hash(sourcePath),expectedSourceSha256,'Candidate source seal changed');
 const source=json(sourcePath);assert.equal(source.atlasHead,nativeHead);assert.equal(source.atlasTree,nativeTree);assert.equal(source.sourceRows.length,7482);assert.equal(source.focusedTests,25);
 const git=(...args)=>execFileSync('git',['-C',source.native,...args],{encoding:'utf8',windowsHide:true}).trim();
 assert.equal(git('rev-parse','HEAD'),nativeHead);assert.equal(git('rev-parse','HEAD^{tree}'),nativeTree);assert.equal(git('status','--porcelain'),'');
 for(const row of source.sourceRows)assert.equal(hash(safeChild(source.website,row.path)),row.sha256,row.path);
 const imported=json(source.website+'/atlas-review/manifest.json'),binding=json(source.website+'/atlas-review/integration-inputs.json');
 assert.equal(imported.revision,nativeHead);assert.equal(imported.files.length,reviewCount);assert.equal(binding.inputs.length,bindingCount);assert.equal(binding.sha256,source.reviewBinding);assert.equal(binding.sha256,expectedReviewBinding);
 assert.deepEqual(source.newPaths,['atlas-review/app/study-return-focus.ts','atlas-review/content/renal-venous-xray.ts']);
 assert.equal(hash(source.website+'/atlas-review/app/study-return-focus.ts'),imported.files.find(r=>r.path==='app/study-return-focus.ts')?.importedSha256);
 for(const row of imported.files)assert.equal(hash(safeChild(source.website,'atlas-review/'+row.path)),row.importedSha256,row.path);
 for(const row of binding.inputs)assert.equal(hash(safeChild(source.website,row.path)),row.sha256,row.path);
 const original=fs.readFileSync(source.website+'/tests/current-atlas-delivery.test.mjs','utf8');
 currentContract(original);
 const pin=json(source.website+'/tests/fixtures/current-atlas-delivery.json');
 assert.equal(pin.source,'c0818c9e959544f04b54ef914ec62040f6cac2b3');assert.equal(pin.reviewSourceFiles,1657);
 const inventory=json(source.website+'/lib/atlas-model-inventory.json');
 assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(m=>m.paths).length,144);assert.equal(inventory.models.reduce((n,m)=>n+m.bytes,0),199072480);
 for(const limits of Object.values(budgets))assert(limits.minimum>=limits.aggregate+2048);
 return {source,proof:{at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},nativeHead,nativeTree,sourcePaths:7482,imported:reviewCount,boundInputs:bindingCount,reviewBinding:binding.sha256,modelCount:137,modelPaths:144,modelBytes:199072480,priorDeliverySource:pin.source,priorContractSha256:hash(source.website+'/tests/current-atlas-delivery.test.mjs'),budgets,finalSourceEvidence:finalSourceEvidence(),fullChecksRun:false,installed:false}};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--inspect']);
 const {proof}=inspect();console.log(JSON.stringify(proof));
}
