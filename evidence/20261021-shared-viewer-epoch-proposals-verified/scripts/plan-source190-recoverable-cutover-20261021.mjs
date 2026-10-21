// Read-only, virtual admission plan. This is deliberately NOT an installer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const source='F:/VisibleMedicine/staging/20261021-source190-website/website',target='F:/VisibleMedicine/website';
const stage='F:/VisibleMedicine/staging/20261021-source190-virtual-cutover-plan';
const frozen=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');assert.equal(frozen.length,5107);
const batch=json('F:/VisibleMedicine/staging/20261021-revision-guard-batch-v3/PREPARATION.json');assert.equal(batch.site,source);
const priorRows=json('F:/VisibleMedicine/staging/20261021-source190-cutover-inventory/NAMED_PATHS.json');
const prior=new Map(priorRows.map(row=>[row.path,row]));assert.equal(prior.size,5107);
const existingInstallation=json('F:/VisibleMedicine/recovery/checkpoints/20261020-local-review-cutover/PLAN.json');
assert.equal(sha(read(existingInstallation.inventory)),existingInstallation.inventorySha256);
const oldInstalled=new Map(json(existingInstallation.inventory).map(row=>[row.path,row]));
const preserve=new Set(priorRows.filter(row=>row.disposition.startsWith('preserve-')).map(row=>row.path));
const coordination=json('F:/VisibleMedicine/recovery/checkpoints/20261021-keyboard-epoch-proposals-verified/coordination-after.json');
assert.equal(coordination.checklistRevision,95);
const coordinatedHashes=new Map(coordination.files.map(row=>[row.from.replaceAll('\\','/'),row.sha256]));
const virtual=new Map();
for(const row of frozen){assert.equal(sha(read(source+'/'+row.path)),row.sha256,row.path);virtual.set(row.path,{...row,from:source+'/'+row.path,kind:'frozen-source'});}
for(const row of batch.changes){assert.equal(sha(read(row.from)),row.sha256,row.path);virtual.set(row.path,{path:row.path,bytes:row.bytes,sha256:row.sha256,from:row.from,kind:'queued-test-proposal'});}
assert.equal(virtual.size,5109);
const mergeRoot='F:/VisibleMedicine/staging/20261021-coverage-prose-merge',merge=json(mergeRoot+'/PREPARATION.json');
assert.equal(sha(read(merge.target)),merge.beforeSha256);assert.equal(sha(read(mergeRoot+'/README.md')),merge.proposedSha256);
virtual.set('docs/anatomy-coverage/README.md',{path:'docs/anatomy-coverage/README.md',from:mergeRoot+'/README.md',bytes:read(mergeRoot+'/README.md').length,sha256:merge.proposedSha256,kind:'queued-prose-merge'});
const changes=[],same=[],preserved=[];
for(const row of virtual.values()){
 const p=target+'/'+row.path,old=fs.existsSync(p)?read(p):null,beforeSha256=old?sha(old):null,known=prior.get(row.path);
 if(known){const expected=known.disposition==='preserve-canonical-coordination'?coordinatedHashes.get(p):known.beforeSha256;assert(expected!==undefined);assert.equal(beforeSha256,expected,row.path+' canonical preimage drift');}else assert.equal(old,null,row.path+' queued addition must remain absent');
 if(preserve.has(row.path)){preserved.push({path:row.path,sha256:beforeSha256,reason:known.disposition});continue;}
 if(beforeSha256===row.sha256)same.push(row.path);else changes.push({...row,beforeSha256,beforeBytes:old?.length??null});
}
const sourceModels=json(source+'/lib/atlas-model-inventory.json').models,targetModels=json(target+'/lib/atlas-model-inventory.json').models;
assert.deepEqual(sourceModels,targetModels);assert.equal(sourceModels.length,137);const modelHashes=new Set(sourceModels.map(row=>row.sha256));
const scopes=['atlas-review','public/atlas-review-viewer',...['shoulder','female-pelvis','lower-limb','head-neck'].map(name=>'public/atlas-runtime/'+name)];
const unsafe=[],generated=[];
function files(root,relative){
 const absolute=path.resolve(root,relative),base=path.resolve(root);assert(absolute.startsWith(base+path.sep));
 const stat=fs.lstatSync(absolute);assert(!stat.isSymbolicLink());assert.equal(fs.realpathSync(absolute),absolute);
 if(stat.isDirectory())return fs.readdirSync(absolute).flatMap(name=>files(root,relative+'/'+name));
 assert(stat.isFile());return[{path:relative,bytes:stat.size,sha256:sha(read(absolute))}];
}
for(const scope of scopes){
 const next=files(source,scope),old=files(target,scope),oldByPath=new Map(old.map(row=>[row.path,row]));
 for(const row of next){
  if(row.path.endsWith('.glb')){
   if(!modelHashes.has(row.sha256)||oldByPath.get(row.path)?.sha256!==row.sha256)unsafe.push({path:row.path,reason:'Unregistered or changed model: requires separate admission, not this cutover'});
  }else if(virtual.get(row.path)?.sha256!==row.sha256)unsafe.push({path:row.path,reason:'Not a frozen named generated source'});
 }
 for(const row of old){
  if(row.path.endsWith('.glb')){if(!modelHashes.has(row.sha256))unsafe.push({path:row.path,reason:'Unregistered canonical model; preserve, do not replace'});}
  else if(oldInstalled.get(row.path)?.sha256!==row.sha256)unsafe.push({path:row.path,reason:'Canonical generated path differs from exact installed inventory; preserve and review'});
 }
 generated.push({scope,sourceFiles:next.length,targetFiles:old.length,sourceModels:next.filter(row=>row.path.endsWith('.glb')).length,targetModels:old.filter(row=>row.path.endsWith('.glb')).length,replaceOnlyAsRecoverableDirectoryTransaction:true,inventorySource:next,inventoryTarget:old});
}
const canonicalAtlas='F:/VisibleMedicine/atlas',atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source';
assert.equal(runGit(['-C',target,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const beforeAtlas=runGit(['-C',canonicalAtlas,'rev-parse','HEAD']).toString().trim();assert.equal(beforeAtlas,'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
assert.equal(runGit(['-C',canonicalAtlas,'status','--porcelain=v1']).toString().trim(),'');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),batch.source);
runGit(['-C',atlas,'merge-base','--is-ancestor',beforeAtlas,batch.source]);
const privateCode='.local/plexus-review/assets.ts',privateSource=source+'/'+privateCode,privateTarget=target+'/'+privateCode;
const privateAssets={path:privateCode,sourceExists:fs.existsSync(privateSource),targetExists:fs.existsSync(privateTarget)};
if(privateAssets.sourceExists)privateAssets.sourceSha256=sha(read(privateSource));if(privateAssets.targetExists)privateAssets.targetSha256=sha(read(privateTarget));
privateAssets.unchanged=privateAssets.sourceSha256===privateAssets.targetSha256;
const summary={at:new Date().toISOString(),source,target,sourceRevision:batch.source,review:batch.review,currentNamedInputs:5107,virtualNamedInputs:virtual.size,changedNamedPaths:changes.length,unchangedNamedPaths:same.length,preservedNamedPaths:preserved.length,modelsUnchanged:137,generatedScopes:scopes.length,unresolvedGeneratedPaths:unsafe.length,atlasCleanFastForwardAvailable:true,privatePlexusCodeUnchanged:privateAssets.unchanged,
 requiredGates:['Genuine complete-suite terminal receipt with no frozen source drift','Guarded V3 admission and exact5109 inputs/1710Review bindings','Focused actual-site test checks and fresh TypeScript','Revalidate specialist state, every canonical preimage and any open unsaved drafts before preview switch','Preserve environment, native identity/permissions, private decisions, databases and all unlisted work','Before any directory move, resolve and verify exact absolute paths beneath canonical and create-only recovery roots; never recurse through a junction','Source190 coverage prose only accompanies coherent runtime/Review/coverage replacement','Restart only the exact confirmed owner-preview process and its verified children; no other processes'],
 proposalOnly:true,installerExecuted:false,candidateChanged:false,canonicalChanged:false,ownerPreviewStopped:false,privateDataCopied:false,publicDeployment:false,clinicalApproval:false,spatialRegistration:false};
assert(!fs.existsSync(stage));fs.mkdirSync(stage);fs.writeFileSync(stage+'/PLAN.json',JSON.stringify({...summary,changes,preserved,generated,unsafe,privateAssets},null,2)+'\n',{flag:'wx'});fs.writeFileSync(stage+'/SUMMARY.json',JSON.stringify({...summary,planSha256:sha(read(stage+'/PLAN.json'))},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...summary,unresolvedGeneratedPreview:unsafe.slice(0,6)}));
