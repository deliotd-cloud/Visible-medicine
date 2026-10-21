import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v11',prep=json(stage+'/PREPARATION.json');
assert(prep.admissionReady);const before=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
const expected=new Map(before.map(row=>[row.path,row.sha256]));for(const row of prep.changes)expected.set(row.path,row.sha256);
assert.equal(expected.size,5154);
const inputs=[...expected].map(([path,hash])=>{const bytes=read(prep.site+'/'+path);assert.equal(sha(bytes),hash,path);return{path,bytes:bytes.length,sha256:hash};}).sort((a,b)=>a.path.localeCompare(b.path));
const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,prep.review);assert.equal(bound.inputs.length,1710);
for(const row of bound.inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const admission=json(stage+'/CURRENT_MODULES_ADMISSION.json');assert.equal(admission.verdict,'passed');assert.equal(admission.selectedActualCases,39);
fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const proof={at:new Date().toISOString(),site:prep.site,source:prep.source,review:prep.review,appliedTestPaths:85,sourceInputs:5154,reviewBindings:1710,
 exactAllPostimagesAndUntouchedPreimages:true,sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),
 composedActualChecks:stage+'/CURRENT_MODULES_ADMISSION.json',composedActualChecksSha256:sha(read(stage+'/CURRENT_MODULES_ADMISSION.json')),
 cases:39,modules:22,canonicalInstalled:false,ownerPreviewChanged:false,fullSuitePassingClaim:false,clinicalApproval:false,spatialRegistration:false};
fs.writeFileSync(stage+'/ADMISSION_RESULT.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(proof));
