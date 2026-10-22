import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-six-clinical-runtime-admission';
const diagnostic=stage+'/DIAGNOSTIC/main-composition-first.mjs';
assert.equal(sha(read(diagnostic)),'e2eb9dc4b81f6eddac069a746958be5d36a41866bccd1b2320fef87dfa86601d');
const output=stage+'/MAIN_COMPOSITION_REFUSAL.json';assert(!fs.existsSync(output));
const result={at:new Date().toISOString(),phase:'rejected-initial-tongue-proposal; correction and executed composition evidence required',
 failedProposal:'tests/tongue-palate-delivery.test.ts',failedProposalSha256:'fc616be2597560c66309a4fb53a40e93ba22be91ec36326dba4274132ab26f5a',
 failedSource:'content/regional-teaching/head-neck.json',
 authored:{commit:'6036a7a59dcc1fd75eee4a23af34ca2a568d86b6',blob:'03dbdf9daddc3a6943c0a48807f3e281bf29280f',bytes:2431462},
 current:{commit:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',blob:'efd5be8ab762293b74ee02be37c3961e547c9cc7',bytes:2457934},
 initialRun:{session:58443,code:1,error:'RangeError: Array buffer allocation failed'},
 diagnosticRun:{code:1,error:'AssertionError: Exact authored source retained: content/regional-teaching/head-neck.json',
  method:'Same source check, Buffer.equals with concise failure diagnostic instead of unbounded buffer-diff formatting'},
 classification:'An actual source mismatch is confirmed, not merely an unchanged-resource failure. Allocation error occurred in the first supplemental check; the concise check isolates the rejected assumption.',
 byteInverseProofDoesNotCertifyGitSourceComposition:true,workerCorrectionRequested:true,
 candidateChanged:false,canonicalChanged:false,ownerPreviewChanged:false,clinicalApproval:false,privateDataAdded:false};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingSixClinicalRuntimeAdmission={stage,phase:result.phase,refusal:output,refusalSha256:sha(read(output)),
 nativeTestsRun:false,candidateChanged:false,sourceCompositionAccepted:false};pointer.activeWork.updated=result.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:output,sha256:sha(read(output)),candidateChanged:false,sourceCompositionAccepted:false}));
