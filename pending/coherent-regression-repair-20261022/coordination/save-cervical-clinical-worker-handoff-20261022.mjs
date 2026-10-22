import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const pointer=json('CURRENT_CHECKPOINT.json');
assert.equal(pointer.activeWork.pendingRegressionRepairQueue.sha256,'95a1317144b420492f9ffe49e1492ef5ee55d51b77f168eb69e38d450a5ea87d');
pointer.activeWork.pendingRegressionWorkerHandoffs={
 at:new Date().toISOString(),sourceOnly:true,mainIntegrationRequired:true,noNativeRerunWhileSession92110Live:true,
 workers:[
  {agent:'/root/paused_pelvic_source_families_1022',stage:'F:/VisibleMedicine/staging/20261022-clinical-arm-axillary-colic-admission',task:'Three exclusive staged clinical test proposals; full original preimages and source inverses',paths:['tests/clinical-review-arm-arterial-xray.test.ts','tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-colic-arterial-xray.test.ts'],mainReviewed:false},
  {agent:'/root/nonhead_expansion_harness_1022',stage:'F:/VisibleMedicine/staging/20261022-cervical-continuous-dependency-audit',task:'Read-only actual failure and whole-source dependency audit; no proposals authorized yet',paths:['tests/clinical-review-cervical-disc-tour.test.ts','tests/clinical-review-continuous-guided-playback.test.ts'],mainReviewed:false},
 ],
};
pointer.activeWork.latestMainCoordinationMapSha256=sha(read('WORKSPACE_MAP.md'));
writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({workerHandoffsSaved:true,canonicalOrPreviewEdited:false}));
