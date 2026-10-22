// Pure assertions and source hashing only; no native tests/website modules load.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {planReviewedRegressionCandidate,containedTarget,requireClosedPredecessor} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-planner-proof';assert(!existsSync(root));
const options={queuePath:'F:/VisibleMedicine/staging/20261022-cervical-cerebral-clinical-consolidated/QUEUE.json',queueSha256:'95a1317144b420492f9ffe49e1492ef5ee55d51b77f168eb69e38d450a5ea87d',expectedProposals:69,targetRoot:'F:/VisibleMedicine/staging/20261022-reviewed-regression-planned-69'};
const plan=planReviewedRegressionCandidate(options);assert.equal(plan.sourceRows.length,5887);assert.equal(plan.changes.length,69);assert.equal(plan.addedPaths.length,76);
let refusals=0;
for(const bad of ['../website','tests/../../file','/absolute','tests\\file','tests//empty','tests/C:/file','tests/.local/../secret']){assert.throws(()=>containedTarget(options.targetRoot,bad));refusals++;}
for(const changed of [{queueSha256:'0'.repeat(64)},{expectedProposals:70},{targetRoot:'F:/VisibleMedicine/website'},{targetRoot:'F:/VisibleMedicine/staging/20261022-reviewed-regression-../website'}]){assert.throws(()=>planReviewedRegressionCandidate({...options,...changed}));refusals++;}
assert.throws(()=>requireClosedPredecessor(),/Actual predecessor terminal receipt is required/);refusals++;
assert(!existsSync(options.targetRoot),'Planning and refused materialization create no target');
mkdirSync(root);
const result={at:new Date().toISOString(),status:'PASS_SOURCE_PLAN_ONLY',basePaths:5811,plannedPaths:5887,proposalPaths:69,fullCodePreimages:69,additionalCodePaths:7,changedNonTestPaths:0,mutationAndContainmentRefusals:refusals,actualTerminalGateRefused:true,assemblyPerformed:false,nativeTestsOrBuildRun:false,ownerPreviewChanged:false,helpers:[...['prepare-reviewed-regression-candidate-20261022.mjs','verify-reviewed-regression-planner-20261022.mjs'].map(path=>({path,sha256:sha(read(path))}))]};
writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...result,receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json'))}));
