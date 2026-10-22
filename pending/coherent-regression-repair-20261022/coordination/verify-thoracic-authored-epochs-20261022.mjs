import assert from 'node:assert/strict';
import {writeFileSync,existsSync} from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-runtime-admission-consolidated',queuePath=root+'/QUEUE.json';
assert.equal(sha(read(queuePath)),'e2b417a6b33191c66d7759c6a89adadf37aab33d6f14818e1980d24efde14562');
const queue=json(queuePath),atlas='F:/VisibleMedicine/atlas';assert(!existsSync(root+'/THORACIC_AUTHORED_SOURCE_PROOF.json'));
const epochs=['9fba9a1e24b6669aafd48e945d55fc0939d50ab2','190a63238eadcf906abe89dcbb6a67c88afe70b9',queue.source];
const paths={
 'content/central-vessel-imaging-pins.json':'29610e12ec6864a4131874e0d3f6520597af3e65179fd0f009b216aff1371a63',
 'content/thoracic-eus-orientation.ts':'d45a5ff866014539224a80ab3183f4737f72ca098f6c003fe0ef0ded92678b92',
 'lib/thoracic-eus-orientation.ts':'7ccab068671c7eea2eb05ce1bc62ed88e686d7d6336017b94a0c3048841b425e',
};
const evidence=[];
for(const [p,digest]of Object.entries(paths))for(const epoch of epochs){const bytes=runGit(['-C',atlas,'show',epoch+':'+p]);assert.equal(sha(bytes),digest);evidence.push({path:p,epoch,sha256:digest});}
const result={at:new Date().toISOString(),queue:queuePath,queueSha256:sha(read(queuePath)),authoredQuizPathsInQueue:6,additionalThoracicAuthoredPaths:3,totalIndependentAuthoredPaths:9,evidence,noSourceChange:true,noNativeTestsRun:true,noClinicalApproval:true};
writeFileSync(root+'/THORACIC_AUTHORED_SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.activeWork.pendingRegressionRepairQueue.receipt,queuePath);pointer.activeWork.pendingRegressionRepairQueue.additionalAuthoredSourceProof=root+'/THORACIC_AUTHORED_SOURCE_PROOF.json';pointer.activeWork.pendingRegressionRepairQueue.additionalAuthoredSourceProofSha256=sha(read(root+'/THORACIC_AUTHORED_SOURCE_PROOF.json'));writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/THORACIC_AUTHORED_SOURCE_PROOF.json',sha256:sha(read(root+'/THORACIC_AUTHORED_SOURCE_PROOF.json')),independentAuthoredPaths:9,epochs:3,nativeTestsRun:false}));
