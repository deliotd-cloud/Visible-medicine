import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-loading-followup-sources';
const prepared=json(stage+'/PREPARED.json');
assert.equal(sha(read(stage+'/PREPARED.json')),'30f4905ca41c8221f3c3ee5a62f92849b44a2da3525bca894a7efd5eb03dd85f');
const source=json(prepared.sourceReceipt),website=source.website;
assert.equal(sha(read(prepared.sourceReceipt)),prepared.sourceReceiptSha256);
assert.equal(source.review,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
const oldRoot='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const oldInputs=json(oldRoot+'/atlas-review/integration-inputs.json'),inputs=json(website+'/atlas-review/integration-inputs.json');
assert.equal(oldInputs.inputs.length,1723);assert.equal(inputs.inputs.length,1724);
const previous=new Map(oldInputs.inputs.map(row=>[row.path,row.sha256]));
const added=inputs.inputs.filter(row=>!previous.has(row.path));
assert.deepEqual(added,[{path:'app/workspace/atlas-review/loading.tsx',sha256:'ac2e48e14600448efcd5c259c39b386aab1fd672e6ea19c1d07a5c416b356415'}]);
for(const row of inputs.inputs)if(previous.has(row.path))assert.equal(row.sha256,previous.get(row.path),'No prior bound input changes: '+row.path);
const changed=new Set(['tests/native-focus-review-binding.test.mjs','tests/head-binding-role-preservation-20261021.test.mjs','tests/closed56-femoral-epoch.test.mjs']);
const proposals=[];
for(const row of prepared.proposals){
 const original=read(stage+'/PREVIOUS-CODE/'+row.path),code=read(row.proposal);
 assert.equal(sha(original),row.sha256,'Previously reviewed source proposal');
 if(changed.has(row.path)){
  assert.equal(code.toString().split('inputs.length,1724').length,2,'One current-count composition: '+row.path);
  assert.deepEqual(Buffer.from(code.toString().replace('inputs.length,1724','inputs.length,1723')),original,'Complete current-count inverse: '+row.path);
 }else assert.deepEqual(code,original,'Other reviewed proposal bytes unchanged: '+row.path);
 if(row.before)assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256,'Exact candidate preimage: '+row.path);
 else assert(!fs.existsSync(website+'/'+row.path));
 proposals.push({...row,previousProposalSha256:row.sha256,sha256:sha(code)});
}
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Source preflight: '+row.path);
assert(!fs.existsSync(stage+'/APPLIED_SOURCE.json'));
// All authored changes were reviewed above. Copy only these explicit test paths.
for(const row of proposals)fs.copyFileSync(row.proposal,website+'/'+row.path,row.before?0:fs.constants.COPYFILE_EXCL);
const names=new Set([...source.sourceRows.map(row=>row.path),...proposals.map(row=>row.path)]);
const sourceRows=[...names].sort().map(path=>({path,bytes:read(website+'/'+path).length,sha256:sha(read(website+'/'+path))}));
const nonTestBefore=source.sourceRows.filter(row=>!row.path.startsWith('tests/'));
assert.deepEqual(sourceRows.filter(row=>!row.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path)),nonTestBefore.sort((a,b)=>a.path.localeCompare(b.path)));
const receipt={at:new Date().toISOString(),website,sourceRows,sourcePaths:sourceRows.length,
 previousSource:prepared.sourceReceipt,previousSourceSha256:prepared.sourceReceiptSha256,review:source.review,
 boundInputs:1724,sourceOnlyRepairs:12,sourceOnlyAdditions:1,proposals,threeExactCurrentCountInverses:true,
 historicalBindingsChanged:false,currentValidatorOrPinChanged:false,nonTestProductBytesChanged:0,
 previousProductBuildVerified:true,typesForNewTestOverlayPassed:false,nativeAccepted:false,
 ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(stage+'/APPLIED_SOURCE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current,{currentCandidate:website,sourceReceipt:stage+'/APPLIED_SOURCE.json',sourceReceiptSha256:sha(read(stage+'/APPLIED_SOURCE.json')),sourcePaths:sourceRows.length,
 beforeFurtherWork:'13 source followups coherently overlaid into isolated built product, three current-only count seams composed exactly. Native and new-test types acceptance pending. Keep normal preview held.',pendingWorkers:['/root/lecture_context_source_1022','/root/vascular_guard_composition_1022']});
Object.assign(pointer.activeWork.current.bindingRepair,{typesPassed:true,websiteBuildRun:true,nativeAcceptanceScope:'Previous7 focused checks only;13-source test overlay pending'});
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:stage+'/APPLIED_SOURCE.json',sha256:sha(read(stage+'/APPLIED_SOURCE.json')),sourcePaths:sourceRows.length,proposals:proposals.length,nonTestProductBytesChanged:0}));
