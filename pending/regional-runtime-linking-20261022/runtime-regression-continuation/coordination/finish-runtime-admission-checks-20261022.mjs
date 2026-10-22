import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-remaining-runtime-admissions';
const proof=json(stage+'/PROOF.json');assert.equal(proof.files.length,6);assert.equal(proof.sourceOnly,true);
const names=['posterior-fossa-coverage.test.mjs','regional-learning-catalogue-history.ts','regional-learning-catalogue.test.ts',
 'shoulder-us-renderer-migration.test.mjs','spinal-craniofacial-ct-current-compatibility.test.mjs','regional-link-role-preservation-20261021.test.mjs'];
assert.deepEqual(proof.files.map(row=>row.path).sort(),names.map(name=>'tests/'+name).sort());
const sourceReceipt='F:/VisibleMedicine/staging/20261022-closed56-followup-consumers/APPLIED_SOURCE.json';
assert.equal(sha(read(sourceReceipt)),'a5135943614b7a88ba7fa93e99be884fc6cf9e53004fc65a3fb588d6517b5216');
const rows=proof.files.map(row=>({path:row.path,code:stage+'/CODE/'+row.path,sha256:row.codeSha256,before:stage+'/RAW/'+row.path,beforeSha256:row.rawSha256}));
const plan={sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),receipt:stage+'/APPLIED_SOURCE.json',rows,sourceProofSha256:sha(read(stage+'/PROOF.json'))};
fs.writeFileSync(stage+'/OVERLAY_PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
const run=args=>{const result=spawnSync(process.execPath,args,{cwd:process.cwd(),env:process.env,windowsHide:true,stdio:'inherit'});assert(!result.error,result.error?.message);assert.equal(result.status,0,'Preserve failed stage: '+args.join(' '));};
run(['apply-isolated-test-overlay.mjs',stage+'/OVERLAY_PLAN.json']);
const current={sourceReceipt:plan.receipt,sourceReceiptSha256:sha(read(plan.receipt))};
const tests=names.filter(name=>name.includes('.test.')).map(name=>'tests/'+name);
fs.writeFileSync(stage+'/NATIVE_PLAN.json',JSON.stringify({...current,evidence:stage+'/native-current',tests,
 scope:'Four exact prior failures plus the changed regional complete-source consumer. Both original CT runtime emission checks, historical source obligations and current strict admission remain intact. Not whole-suite certification.'},null,2)+'\n',{flag:'wx'});
run(['verify-isolated-source-native.mjs',stage+'/NATIVE_PLAN.json']);
fs.writeFileSync(stage+'/TYPES_PLAN.json',JSON.stringify({...current,kind:'types',evidence:stage+'/types-current',tests:[],
 scope:'Full website TypeScript after all24 test/helper source updates; product bytes exactly match the already built loading-bound candidate.'},null,2)+'\n',{flag:'wx'});
run(['verify-isolated-source-native.mjs',stage+'/TYPES_PLAN.json']);
console.log(JSON.stringify({phase:'runtime-admission-native-and-types-terminal',sourceReceipt:current.sourceReceipt,sourceReceiptSha256:current.sourceReceiptSha256}));
