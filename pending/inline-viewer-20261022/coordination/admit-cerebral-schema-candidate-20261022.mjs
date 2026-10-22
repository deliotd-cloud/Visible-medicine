import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate',candidate=root+'/website';
const stage='F:/VisibleMedicine/staging/20261022-cerebral-schema-proposal-v2';
const handoff=json(stage+'/HANDOFF.json'),prior=json(root+'/FRAME_EVENT_BUS_CORRECTION.json');
assert(!fs.existsSync(root+'/CEREBRAL_ADMISSION.json'));
assert.equal(prior.counts.pass,20);assert.equal(handoff.check.pass,2);assert.equal(handoff.check.fail,0);
const metadata=new Map(handoff.files.map(row=>[row.path,row]));
for(const row of handoff.files)assert.equal(sha(read(stage+'/'+row.path)),row.sha256,row.path);
const original='tests/atlas-cerebral-lobar-imaging.test.ts';
const raw='tests/fixtures/atlas-cerebral-lobar-imaging.before-schema-admission-20261022.test.ts.raw';
assert.equal(sha(read(candidate+'/'+original)),'15e7fe631d748d679dc8f7329916d051235abab6b22d3ce4da7f95412838b078');
assert(read(candidate+'/'+original).equals(read(stage+'/'+raw)));
assert(read('F:/VisibleMedicine/website/'+original).equals(read(stage+'/'+raw)));
const frozen=json('F:/VisibleMedicine/staging/20261022-complete-current-website/PREPARED.json');
assert(read(frozen.candidate+'/'+original).equals(read(stage+'/'+raw)));
const currentHelper='tests/current-atlas-delivery.mjs',oldHelperSha=sha(read(candidate+'/'+currentHelper));
const pin='tests/fixtures/current-atlas-delivery-59.json',oldPinSha=sha(read(candidate+'/'+pin));assert.equal(oldPinSha,'8f78fd9edc87dac6a8d9ef5fef681059bfb698eca39f0988ff470d44c0afd267');
const expected=new Map(prior.sourceRows.map(row=>[row.path,row]));
const selected=handoff.files.filter(row=>row.path.startsWith('tests/'));
assert.equal(selected.length,5);
const changes=[];
for(const row of selected){
 const before=expected.get(row.path)??null,target=path.resolve(candidate,row.path);assert(target.startsWith(path.resolve(candidate)+path.sep));
 if(before)assert.equal(sha(read(target)),before.sha256,row.path);else assert(!fs.existsSync(target));
 if(before?.sha256!==row.sha256){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(stage+'/'+row.path,target);changes.push({path:row.path,before,after:{bytes:row.bytes,sha256:row.sha256}});}
 assert.equal(sha(read(target)),row.sha256,row.path);expected.set(row.path,{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
assert.equal(changes.length,4);assert.equal(expected.size,5770);
assert.equal(sha(read(candidate+'/'+currentHelper)),oldHelperSha);assert.equal(sha(read(candidate+'/'+pin)),oldPinSha);
assert.equal(json(candidate+'/atlas-review/integration-inputs.json').sha256,prior.pendingReview);
const receipt={at:new Date().toISOString(),root,candidate,stage,source:prior.source,pendingReview:prior.pendingReview,
 phase:'main-reviewed historical/current cerebral assurance source admitted to isolated candidate only',sourceRows:[...expected.values()].sort((a,b)=>a.path.localeCompare(b.path)),sourcePaths:expected.size,
 files:selected,changes,workerProof:{command:handoff.check.command,exitCode:0,tests:2,pass:2,fail:0,log:handoff.check.log,logSha256:metadata.get('PROOF.log').sha256},
 review:'Complete V1 and V2 actual diffs, unchanged authenticated historical-validator closure and two-test source/inverse/refusal code read by main. Adapter requires the entire authenticated original closed59 pin bytes and deep equality, not merely compatible schema1. Current schema2 remains strict. All nine closed59 policy/raw checks remain; current raw learner Git bytes and current working checkout are independently verified, with only the already documented exact licence representation. Raw pin/validator/product/licence/model/review/approval content is not repinned or changed.',
 nativeOriginalRootRun:false,currentValidatorUnchanged:true,historicalPinUnchanged:true,canonicalChanged:false,frozenFullSuiteInputsChanged:false,clinicalApproval:false,legalClearance:false,
 limits:'Two worker pure historical/current source proofs, not the native cerebral lesson root or its downstream imported worksheet/model/UI assertions. Native cohorts, Review viewer build, strict current pin, full types/build and normal-site browser acceptance remain pending.'};
fs.writeFileSync(root+'/CEREBRAL_ADMISSION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/CEREBRAL_ADMISSION.json',sha256:sha(read(root+'/CEREBRAL_ADMISSION.json')),sourcePaths:5770,changedPaths:4,existingRawValidatorUnchanged:true,nativeOriginalRootRun:false}));
