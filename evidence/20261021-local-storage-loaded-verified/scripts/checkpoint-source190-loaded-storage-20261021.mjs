import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const qa='F:/VisibleMedicine/staging/20261021-source190-loaded-qa-v2';
const admission='F:/VisibleMedicine/staging/20261021-local-r2-persistence-application-v2';
const prep=json('F:/VisibleMedicine/staging/20261021-review-destination-application/PREPARATION.json');
const site=prep.site,rows=json(qa+'/SOURCE_INPUTS.json');assert.equal(rows.length,5107);
const old=json('F:/VisibleMedicine/staging/20261021-review-destination-application/SOURCE_INPUTS_AFTER_NAV.json');
assert.equal(old.length,5103);
const native='scripts/stage-clinical-review-candidate-local.mjs';
const additions=['.gitignore','scripts/local-r2-persistence.mjs','tests/local-r2-persistence.test.mjs','tests/local-preview-data-boundaries.test.mjs'];
assert.deepEqual(rows.filter(r=>!old.some(o=>o.path===r.path)).map(r=>r.path).sort(),additions.slice().sort());
for(const r of old){const now=rows.find(n=>n.path===r.path);assert(now);if(r.path===native)assert.equal(sha(read(admission+'/preimages/'+native)),r.sha256);else assert.equal(now.sha256,r.sha256,r.path);}
const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,prep.review);assert.equal(bound.inputs.length,1710);
const storage=json('F:/VisibleMedicine/staging/20261021-source190-persistent-models/RESULT.json');
assert.equal(storage.reopened,137);assert.equal(storage.bytes,199072480);assert(storage.exactFullReadbackAfterReopen);
const regression=json(admission+'/STORAGE_DELIVERY_REGRESSION.json');
assert.equal(regression.code,0);assert.equal(sha(read(regression.log)),regression.logSha256);
assert(regression.footer.includes('ℹ tests 17')&&regression.footer.includes('ℹ pass 17')&&regression.footer.includes('ℹ skipped 0'));
const route=json(qa+'/MODEL_ROUTE_PASS.json');assert.equal(route.authenticatedRangeStatus,206);assert.equal(route.anonymousStatus,401);
const browser=json(qa+'/BROWSER_OBSERVATION.json');assert.equal(browser.localScreenshot.sha256,sha(read(browser.localScreenshot.path)));
const stopped=json(qa+'/STOPPED.json');assert.equal(stopped.code,4294967295);assert.equal(stopped.logSha256,sha(read(qa+'/PREVIEW.log')));
const db=json('F:/VisibleMedicine/staging/20261021-source190-local-storage/DATABASE.json');
assert(db.sourceOpenedReadOnly&&db.onlineBackup&&db.integrity==='ok'&&!db.permissionsEdited&&!db.identitiesEdited&&!db.rowsInspected);
const closedPrep=json('F:/VisibleMedicine/staging/20261021-source190-website/PREPARATION.json');
function verify(){
 for(const r of rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,'Review binding: '+r.path);
 for(const r of json('F:/VisibleMedicine/staging/20261021-source190-website/ORIGINAL_485_INPUTS.json'))assert.equal(sha(read(closedPrep.original+'/'+r.path)),r.sha256,'Closed485: '+r.path);
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),prep.source);
 assert.equal(runGit(['-C',prep.atlas,'status','--porcelain=v1','--untracked-files=all']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/integration-inputs.json').sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
}verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-local-storage-loaded-verified';
assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!/(^|\/)(?:private|\.wrangler|\.env|\.local)(?:\/|$)|\.(?:sqlite|db|glb|jpg|png|dcm|nii)$/i.test(p));
 const b=read(from),to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});
 selected.push({path:p,bytes:b.length,sha256:sha(b)});
}
for(const p of [native,...additions])copy(site+'/'+p,'website/'+p);
copy(admission+'/preimages/'+native,'preimages/'+native);
for(const p of ['ADMISSION.json','LOCAL_PERSISTENCE_BOUNDARIES.json','STORAGE_DELIVERY_REGRESSION.json'])copy(admission+'/'+p,'evidence/'+p);
for(const p of ['MODEL_ROUTE_PASS.json','STARTED.json','STOPPED.json'])copy(qa+'/'+p,'evidence/'+p);
for(const p of ['admit-local-r2-persistence-20261021.mjs','stage-source190-persistent-models-20261021.mjs',
 'launch-source190-loaded-qa-v2-20261021.mjs','verify-source190-loaded-preview-20261021.mjs',
 'checkpoint-source190-loaded-storage-20261021.mjs'])copy(p,'scripts/'+p);
// Public backup contains only non-patient observations/counts, never browser
// pixels, DOM, the full model inventory, private SQLite or its records.
const observation={at:browser.at,viewport:browser.viewport,observed:browser.observed,unresolved:browser.unresolved,
 limits:browser.limits,modelsReadBackAcrossFreshEmulator:137,modelBytes:199072480,
 source:prep.source,review:prep.review,sourceInputs:5107,tests:17,passed:17,skipped:0,
 authenticationChanged:false,permissionsChanged:false,canonicalInstalled:false,publicDeployment:false,
 localOnlyPrivateDatabaseCopy:true,sourceDatabaseOpenedReadOnly:true,privateDataUploaded:false,
 ownerTabsTouched:false,ownerPort3000Untouched:true,temporaryPort3002Stopped:true,
 originalFullSuiteFailures:144,fullSuiteAcceptance:false,clinicalApproval:false,spatialRegistration:false};
fs.writeFileSync(root+'/observed-summary.json',JSON.stringify(observation,null,2)+'\n',{flag:'wx'});
selected.push({path:'observed-summary.json',bytes:read(root+'/observed-summary.json').length,sha256:sha(read(root+'/observed-summary.json'))});
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-review-navigation-verified-backup';
const parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'e870cee0b1fa01cf39bdd97ebde8a9441c42dcc3');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{
 const b=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(b),r.sha256);return[r.path,b];
}));
for(const r of selected)values.set('evidence/20261021-local-storage-loaded-verified/'+r.path,read(root+'/'+r.path));
backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-local-storage-loaded-20261021.git',
 branch:'backup/local-storage-loaded-20261021',files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),
 bytesFor:p=>values.get(p),verifySource:verify,sourceIdentity:{atlas:prep.source,review:prep.review,websiteInputCount:5107},
 parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof:observation,
 scope:'Selected owned local developer storage helper, native stager fix, private-state Git ignore boundary, regression tests, exact stager preimage and small non-patient proof/control sources. Prior filtered ancestry only. No private SQLite/rows/cookies/identities, scans/masks, full private inventory/modules/manifests, geometry/full runtimes/dist/dependencies/raw canonical history/browser pixels or DOM. Not a whole runnable or private-data backup, public deployment or clinical/spatial acceptance.'});
const remote=json(root+'-backup/github-backup.json');
const result={...observation,at:new Date().toISOString(),site,atlas:prep.atlas,stage:qa,
 sourceSnapshot:qa+'/SOURCE_INPUTS.json',sourceSnapshotSha256:sha(read(qa+'/SOURCE_INPUTS.json')),
 sourceChanges:{existing:[native],added:additions},all1710ReviewInputsPreserved:true,allClosed485InputsPreserved:true,
 verification:{regressionReceipt:admission+'/STORAGE_DELIVERY_REGRESSION.json',regressionLogSha256:regression.logSha256,
 route:qa+'/MODEL_ROUTE_PASS.json',browserObservation:qa+'/BROWSER_OBSERVATION.json',
 persistence:'F:/VisibleMedicine/staging/20261021-source190-persistent-models/RESULT.json',
 privateDatabaseCopyMetadata:'F:/VisibleMedicine/staging/20261021-source190-local-storage/DATABASE.json'},
 selectedFiles:selected,backup:{head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths,
 receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json'))},
 limits:'Previous source190 navigation types/build remain valid for unchanged production bytes; this milestone changes developer .mjs/ignore/test source only. No fresh full-suite or all-tour acceptance. One unclassified MutationObserver console error remains. Initial empty-D1 503 and ephemeral-staging404 evidence retained. Raw SQLite copy is F-local only; never part of source recovery or remote backup. Source scan/mask files untouched. Owner review forms/session were not refreshed.',
 next:'Continue independent roadmap improvements; reproduce/classify the isolated console error and broaden bounded loaded regional/CT-MRI semantic-link checks. Integrate the verified candidate only at a safe owner-preview cutover protecting open edits; no public release or clinical approval inferred.',fullGoalActive:true};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
