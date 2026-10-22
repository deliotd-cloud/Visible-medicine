// Pure synthetic metadata assertions; never creates or fakes a real run receipt.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {assertClosedPredecessorRecord,requireClosedPredecessor} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-terminal-gate-proof';assert(!existsSync(root));
const synthetic={terminal:true,suiteCompleted:true,sourceReceiptSha256:'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3',entryCount:1143,entrySha256:'99e7a288552a3f92623a3a9bc75cd28cf04942e8d2f3d2efd0f44e04b9b536b3',closedSourceDrift:[],testInputDrift:false,publicPreviewAssetDrift:false,driverPid:123,runnerPid:456};
assert.equal(assertClosedPredecessorRecord(synthetic,()=>true),true,'Only a synthetic schema contract, not actual terminal acceptance');
let refusals=0;
for(const changed of [{terminal:false},{suiteCompleted:false},{sourceReceiptSha256:'0'.repeat(64)},{entryCount:1142},{entrySha256:'0'.repeat(64)},{closedSourceDrift:['tests/changed']},{testInputDrift:true},{testInputDrift:null},{testInputDrift:[]},{publicPreviewAssetDrift:true},{publicPreviewAssetDrift:null},{publicPreviewAssetDrift:[]},{driverPid:0},{runnerPid:0}]){assert.throws(()=>assertClosedPredecessorRecord({...synthetic,...changed},()=>true));refusals++;}
for(const livePid of [123,456]){assert.throws(()=>assertClosedPredecessorRecord(synthetic,pid=>pid!==livePid));refusals++;}
assert.throws(()=>requireClosedPredecessor(),/Actual predecessor terminal receipt is required/);refusals++;
const result={at:new Date().toISOString(),status:'PASS_PURE_TERMINAL_SCHEMA_ONLY',syntheticCasesOnly:true,refusals,realPredecessorAccepted:false,realTerminalOrCandidateCreated:false,nativeTestsOrBuildRun:false,ownerPreviewChanged:false,sourcePlanProof:'F:/VisibleMedicine/staging/20261022-reviewed-regression-planner-proof/RESULT.json',helperSha256:sha(read('prepare-reviewed-regression-candidate-20261022.mjs')),scriptSha256:sha(read('verify-reviewed-regression-terminal-gates-20261022.mjs')),reviewCorrection:'Runner drift fields are booleans, not arrays. Corrected before any assembly; initial plan-only receipt preserves original helper identity.'};
mkdirSync(root);writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...result,receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json'))}));
