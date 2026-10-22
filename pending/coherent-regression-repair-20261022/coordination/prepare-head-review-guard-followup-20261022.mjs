import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {overlayRuntimeTestRepairs} from './overlay-regional-runtime-test-repairs-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const priorReceipt=root+'/PRODUCT_SOURCE_V3.json';
assert.equal(sha(read(priorReceipt)),'51f4b8be426c996381e105eb60ad78ded0827076185d865c3726b14c2904747c');
const paths=['head-cerebellar-review.test.ts','head-deep-grey-review.test.ts','head-hippocampal-clinical.test.ts','head-lobar-review.test.ts','head-ventricular-review.test.ts'].map(name=>'tests/'+name);
const result=overlayRuntimeTestRepairs({priorReceipt,outputReceipt:root+'/PRODUCT_SOURCE_V4.json',priorTerminal:root+'/quality-build-v3/TERMINAL.json',
 packets:[{stage:'F:/VisibleMedicine/staging/20261022-head-review-guard-harness',paths}]});
const old=json(priorReceipt),changed=result.sourceRows.filter(row=>old.sourceRows.find(prior=>prior.path===row.path)?.sha256!==row.sha256).map(row=>row.path);
assert.deepEqual(changed.toSorted(),paths.toSorted());
assert.equal(result.sourceRows.length,6042);
const pointer=json('CURRENT_CHECKPOINT.json');
pointer.activeWork.pendingHeadReviewGuardFollowup={at:new Date().toISOString(),previousGoalTurnClassification:'progress',
 sourceReceipt:root+'/PRODUCT_SOURCE_V4.json',sourceReceiptSha256:sha(read(root+'/PRODUCT_SOURCE_V4.json')),sourcePaths:6042,
 priorVerifiedProductReceipt:priorReceipt,priorVerifiedProductReceiptSha256:sha(read(priorReceipt)),
 changedPaths:paths,productionBytesChanged:0,canonicalInstalled:false,ownerPreviewChanged:false,phase:'prepared-native-followup-pending',
 recovery:'Full five exact preimages and CODE proposals already restored by verified filtered GitHub backup2f6559f27e18a3363315a84a411555e506235fb3. V3 is historical source evidence; V4 is now the actual staged test state.'};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
