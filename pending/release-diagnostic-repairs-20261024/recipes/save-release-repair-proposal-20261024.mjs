import assert from 'node:assert/strict';
import fs from 'node:fs';
import {saveProposal} from './source-proposal-checkpoint.mjs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261024-release-repair-batch/main',site=stage+'/candidate';
const composition=json(stage+'/COMPOSED.json'),terminal=json(stage+'/checks/TERMINAL.json');
const parentReceipt=composition.parentReceipt,parent=json(parentReceipt),parentRows=new Map(parent.sourceRows.map(r=>[r.path,r]));
assert.equal(sha(read(parentReceipt)),'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
assert.equal(terminal.code,0);assert.deepEqual(terminal.counts,{tests:29,pass:29,fail:0,cancelled:0,skipped:0,todo:0});
assert.equal(terminal.syntax.length,13);assert(terminal.syntax.every(r=>r.code===0));
const rows=[];function walk(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){assert(!entry.isSymbolicLink());const p=prefix+entry.name;if(entry.isDirectory())walk(dir+'/'+entry.name,p+'/');else{assert(entry.isFile());const bytes=read(dir+'/'+entry.name);new TextDecoder('utf-8',{fatal:true}).decode(bytes);rows.push({path:p,bytes:bytes.length,sha256:sha(bytes)});}}}walk(site);rows.sort((a,b)=>a.path.localeCompare(b.path));assert.equal(rows.length,15);assert(rows.every(r=>r.path.startsWith('tests/')));
const evidencePath='tests/fixtures/release-diagnostic-repair-20261024.json',fixture=json(site+'/'+evidencePath);
assert.equal(fixture.schema,'vm-release-diagnostic-source-inverse-1');assert.equal(fixture.parentSha256,sha(read(parentReceipt)));assert.equal(fixture.records.length,11);
assert.deepEqual(fixture.records.map(r=>r.path),composition.changedTestPaths);
for(const row of fixture.records){assert.equal(row.beforeSha256,parentRows.get(row.path).sha256);assert.equal(row.afterSha256,rows.find(r=>r.path===row.path).sha256);let before=read(site+'/'+row.path).toString();for(const[a,b]of row.seams.toReversed()){assert.equal(before.split(b).length,2);before=before.replace(b,a);}assert.deepEqual(Buffer.from(before),read(parent.website+'/'+row.path));}
const remoteArtifacts=rows.filter(r=>r.path!==composition.unchangedSupport).map(r=>[r.path===evidencePath?r.path+'.raw':r.path,site+'/'+r.path]);
for(const name of ['compose-release-repair-batch-20261024.mjs','run-release-repair-pure-checks-20261024.mjs','observe-pancreatic-us-release-20261024.mjs','save-release-repair-proposal-20261024.mjs'])remoteArtifacts.push(['recipes/'+name,name]);
remoteArtifacts.push(['workers/b79-back/repair.mjs','F:/VisibleMedicine/staging/20261024-release-repair-batch/b79-back/repair.v2.mjs'],['workers/ae84/produce.mjs','F:/VisibleMedicine/staging/20261024-release-repair-batch/ae84/produce.v2.mjs']);
const verify=()=>{
 assert.equal(sha(read(parentReceipt)),composition.parentSha256);
 assert.equal(sha(read(stage+'/COMPOSED.json')),terminal.compositionSha256);
 const now=json(stage+'/checks/TERMINAL.json');assert.deepEqual(now,terminal);
 for(const row of rows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
 for(const p of [...composition.changedTestPaths,'tests/current-atlas-delivery.mjs','atlas-review/manifest.json','atlas-review/integration-inputs.json','lib/atlas-model-inventory.json'])assert.equal(sha(read(parent.website+'/'+p)),parentRows.get(p).sha256,'Frozen candidate unchanged '+p);
 const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.goal.status,'active');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
};
const id='release-diagnostic-repairs-20261024';
const result=saveProposal({id,key:'pendingReleaseRepairBatch',root:'F:/VisibleMedicine/recovery/checkpoints/20261024-release-repair-batch-proposal',stage,site,rows,verify,
 milestone:'Exact inverse-preserving partial test repairs, not a complete Website successor',
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261024-pancreatic-us-website-source-backup/github-backup.json',receiptSha256:'8da740574332d7211c259b21c094352c62a4bf1d8090870ce5deb26ca03a028d',repo:'F:/VisibleMedicine/history/website-work/github-pancreatic-us-website-20261024.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-release-diagnostic-repairs-20261024.git',
 sourceIdentity:{websiteParent:sha(read(parentReceipt)),native:parent.atlasHead,kind:'partial-source-only-test-repair-proposal'},
 backupScope:'Selected text/code ancestry plus eleven changed test files, two new test-only modules, one deterministic source-inverse fixture (retained as a byte-identical .json.raw text fixture), four recipes and two worker producers. The fixture contains only the eleven named, hash-bound code transformations; it is not runtime/clinical metadata. The original .json restore name is recorded in local recovery. No scans, masks, models, patient identifiers, private references/decisions, generated delivery, dependencies, build output or raw QA logs; not a whole/private/runnable off-device backup. No public deployment or installation.',
 proof:{partialOnly:true,changedTests:11,wholeOriginalsRecovered:11,pureUnitCounts:terminal.counts,syntaxSources:13,existingArterialCurrentRoleInverseUnchanged:true,existingCompleteReleaseArterialRowFunctionsExercised:2,coverageExtraSources:['lib/legacy-shoulder-bone-references.ts','lib/legacy-shoulder-muscle-references.ts','lib/legacy-shoulder-references.ts'],rawCodeFixture:{sourcePath:evidencePath,backupPath:evidencePath+'.raw',sha256:sha(read(site+'/'+evidencePath)),schema:fixture.schema,restore:'Remove only the final .raw suffix after byte verification; do not treat this partial tree as runnable.'},originalMedicalSuitesRun:false,currentProductionDeliveryRetested:false,fullStockRunStillSeparate:true},
 review:{at:new Date().toISOString(),classification:'Full run remains frozen. These are executable, narrowly reviewed context repairs outside it.',pureUnitCounts:terminal.counts,syntax:terminal.syntax,originals:fixture.records.map(({path,beforeSha256,afterSha256})=>({path,beforeSha256,afterSha256})),workerModel:'gpt-6-sol',workerEffort:'medium',workerPureCases:6,workerTokens:'unavailable',initialPreflightRefusalRetained:true,productionChanges:0,approvalTransfers:0,remaining:'Materialize coherent new Website after full diagnostic terminal; run all affected original integration/medical/native and current source-bound suites serially. Do not infer full suite, authenticated or clinical acceptance.'},
 localArtifacts:[[stage+'/COMPOSED.json','COMPOSED.json'],[stage+'/checks/TERMINAL.json','PURE_TERMINAL.json'],[stage+'/checks/pure-source-inverses.stdout.log','pure-source-inverses.stdout.log'],[stage+'/checks/pure-source-inverses.stderr.log','pure-source-inverses.stderr.log'],[stage+'/INITIAL_PREFLIGHT_REFUSAL.json','INITIAL_PREFLIGHT_REFUSAL.json'],['F:/VisibleMedicine/staging/20261024-release-repair-batch/b79-back/HANDOFF.v2.md','b79-HANDOFF.v2.md'],['F:/VisibleMedicine/staging/20261024-release-repair-batch/ae84/HANDOFF.v2.md','ae84-HANDOFF.v2.md']],
 remoteArtifacts,pending:'Partial repair source only; not installed or a complete Website. Original source cf remains the full diagnostic target. Keep the same verified full-run handle; after terminal classify full failures, compose the next coherent source and run original affected suites before acceptance.',summary:{pureCases:29,syntaxSources:13,changedTests:11,originalSuitesRun:false,integrated:false}});
console.log(JSON.stringify(result));
