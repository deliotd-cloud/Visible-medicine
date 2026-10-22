import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {overlayRuntimeTestRepairs} from './overlay-regional-runtime-test-repairs-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const prior=root+'/PRODUCT_SOURCE_V4.json';assert.equal(sha(read(prior)),'23130b7a27fb180dfb4330304d93784f64926441948ae69ce4b529e8f0a47823');
const result=overlayRuntimeTestRepairs({priorReceipt:prior,outputReceipt:root+'/PRODUCT_SOURCE_V5.json',priorTerminal:root+'/native-head-guard/TERMINAL.json',
 packets:[{stage:'F:/VisibleMedicine/staging/20261022-craniofacial-current-family-admission',paths:['tests/craniofacial-ct-current-delivery.test.mjs']}]});
const product=json(root+'/PRODUCT_SOURCE_V3.json');
assert.deepEqual(result.sourceRows.filter(row=>!row.path.startsWith('tests/')),product.sourceRows.filter(row=>!row.path.startsWith('tests/')),'Entire product/build input graph unchanged');
const pointer=json('CURRENT_CHECKPOINT.json');
pointer.activeWork.pendingHeadReviewGuardFollowup.phase='native-passed-46-of-46';
pointer.activeWork.pendingHeadReviewGuardFollowup.nativeReceipt=root+'/native-head-guard/TERMINAL.json';
pointer.activeWork.pendingCraniofacialCurrentFollowup={at:new Date().toISOString(),sourceReceipt:root+'/PRODUCT_SOURCE_V5.json',sourceReceiptSha256:sha(read(root+'/PRODUCT_SOURCE_V5.json')),
 sourcePaths:6042,productGraphIdenticalToVerifiedV3:true,phase:'prepared-native-followup-pending',ownerPreviewChanged:false,canonicalInstalled:false};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
