import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-website',prep=json(stage+'/PREPARATION.json'),site=prep.site;
const labels=['SOURCE190_FINAL_FOCUSED','SOURCE190_TYPES_RETRY','SOURCE190_WEBSITE_BUILD'];
const receipts=labels.map(label=>{const r=json(stage+'/'+label+'.json');assert.equal(r.code,0,label);assert.equal(r.signal,null);assert.equal(sha(read(r.log)),r.logSha256);return r;});
assert(receipts[0].footer.includes('ℹ tests 29')&&receipts[0].footer.includes('ℹ pass 29')&&receipts[0].footer.includes('ℹ skipped 0'));
const negative=spawnSync(process.execPath,['run-visible-medicine-check.mjs',stage,'SOURCE190_MISSING_ENTRY_NEGATIVE','node','--test','tests/definitely-missing-source190.test.mjs'],{cwd:process.cwd(),windowsHide:true,encoding:'utf8'});
assert.equal(negative.status,1);assert(negative.stderr.includes('Explicit test entry is unavailable'));assert(!fs.existsSync(stage+'/SOURCE190_MISSING_ENTRY_NEGATIVE.log'));assert(!negative.stdout.trim());
const scopeCorrection={firstBatchActualRegisteredCases:15,firstBatchActualEntries:4,omittedRequestedPath:'tests/atlas-delivery-access.test.ts',omittedPathWasNotTested:true,subsequentActualSecurityCases:13,finalRegisteredCases:29,finalPassed:29,finalSkipped:0,finalEntries:6,explicitMissingEntryNowRefusedBeforeLogOrSpawn:true,negativeStderrSha256:sha(negative.stderr)};
fs.writeFileSync(stage+'/EXPLICIT_ENTRY_SCOPE.json',JSON.stringify(scopeCorrection,null,2)+'\n',{flag:'wx'});
process.env.VM_ATLAS_SOURCE_REPO=prep.atlas;
const {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs'));
const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,prep.sourceCommit);assert.equal(currentAtlasDeliveryRoot().replaceAll('\\','/').replace(/\/$/,''),prep.atlas);
const before=json(stage+'/ORIGINAL_485_INPUTS.json');assert.equal(before.length,5087);
const generated=p=>p.startsWith('atlas-review/')||p.startsWith('public/atlas-review-viewer/')||p.startsWith('public/atlas-runtime/');
const allowed=new Set(['.gitattributes','scripts/import-clinical-review.mjs','scripts/check-anatomy-coverage.mjs','lib/anatomy-coverage-view.ts','lib/atlas-delivery-policy.ts','lib/atlas-model-inventory.json','tests/fixtures/current-atlas-delivery.json','tests/clinical-review-salivary-stylohyoid-quiz.test.ts',...['root','nested','independent','reference','index'].map(n=>'docs/anatomy-coverage/'+n+'.json')]);
const rows=[],changed=[],seen=new Set();
function add(p){assert(!seen.has(p),'Duplicate source input:'+p);assert(!/\.(?:glb|dcm|nii(?:\.gz)?|sqlite|db)$/i.test(p)&&!p.startsWith('.local/'));const s=fs.lstatSync(site+'/'+p);assert(s.isFile()&&!s.isSymbolicLink());const b=read(site+'/'+p);rows.push({path:p,bytes:b.length,sha256:sha(b)});seen.add(p);}
for(const old of before){
 assert.equal(sha(read(prep.original+'/'+old.path)),old.sha256,'Original485changed:'+old.path);
 if(generated(old.path))continue;
 const b=read(site+'/'+old.path);if(sha(b)!==old.sha256){assert(allowed.has(old.path),'Unexpected native edit:'+old.path);changed.push({path:old.path,beforeSha256:old.sha256,sha256:sha(b)});}add(old.path);
}
const added=['tests/atlas190-current-delivery.test.mjs',...['admission.json','previous-current.json','importer-before.mjs.raw','salivary-before-type-annotation.ts.raw'].map(n=>'tests/fixtures/source190-admission/'+n)];
for(const p of added)add(p);
const review=json(site+'/atlas-review/manifest.json'),binding=json(site+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
assert.equal(review.files.length,1553);assert.equal(binding.inputs.length,1710);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
for(const row of review.files){assert.equal(sha(read(site+'/atlas-review/'+row.path)),row.importedSha256);add('atlas-review/'+row.path);}
for(const p of ['atlas-review/manifest.json','atlas-review/integration-inputs.json'])add(p);
for(const row of binding.inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
for(const row of viewer.files){assert.equal(sha(read(site+'/public/atlas-review-viewer/'+row.path)),row.sha256);add('public/atlas-review-viewer/'+row.path);}add('public/atlas-review-viewer/manifest.json');
for(const module of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base='public/atlas-runtime/'+module+'/',m=json(site+'/'+base+'manifest.json');assert.equal(m.sourceCommit,prep.sourceCommit);assert.equal(m.patientDataIncluded,false);
 for(const row of m.files){const b=read(site+'/'+base+row.path);assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256);if(!row.path.endsWith('.glb'))add(base+row.path);}add(base+'manifest.json');
}
const localRows=prep.rows.filter(r=>r.kind==='existing-local-only-private-context');assert.equal(localRows.length,3);for(const row of localRows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,'Local private context changed');
assert.deepEqual(json(site+'/lib/atlas-model-inventory.json').models,json(prep.original+'/lib/atlas-model-inventory.json').models);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
assert.equal(json('F:/VisibleMedicine/website/atlas-review/integration-inputs.json').sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
rows.sort((a,b)=>a.path.localeCompare(b.path));fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
const result={at:new Date().toISOString(),source:prep.sourceCommit,tree:prep.sourceTree,review:binding.sha256,sourceFiles:review.files.length,boundInputs:binding.inputs.length,viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,namedInputs:rows.length,changedNative:changed,newTestInputs:added,allOtherNativeSourcePreserved:true,allOriginal485InputsPreserved:true,all137ModelsUnchanged:true,all22ViewerPackagesUnchanged:true,privateLocalContextHashesUnchanged:3,exactSourceCoverageInputs:168,focusedTests:29,focusedPassed:29,focusedSkipped:0,freshTypesPass:true,fullProductionBuildPass:true,receipts:labels.map((label,i)=>({label,sha256:sha(read(stage+'/'+label+'.json')),logSha256:receipts[i].logSha256})),
 corrections:'Missing read-only sibling Atlas source junction and one strict Map inference repaired without runtime changes;Map source has complete inverse,exact immutable preimage and identical transpiled code. Initial clone refused historical local private-module pin;native current verifier and exact current manifest/module bytes gate resume. Node missing-path omission recorded separately,guard now refuses before spawn;final six actual modules29/29pass. Initial type failures remain retained,not hidden.',
 limits:'Original full-suite144failures retained,not freshly rerun or declared green. Current485historical contract/source remains preserved;new190admission tested separately,not broad historical repinning. This local production build is not a prepared hosted/model-delivery package,browser acceptance,clinical approval,spatial registration or public deployment.',
 original485StillAvailable:true,canonicalInstalled:false,ownerPreviewUnchanged:true,ownerFormsRefreshed:false,fullWebsiteSuitePass:false,browserAcceptance:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true};
fs.writeFileSync(stage+'/FINAL_SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({source:result.source,review:result.review,namedInputs:rows.length,changedNative:changed.length,focused:29,fullTypes:true,productionBuild:true,canonicalInstalled:false}));
