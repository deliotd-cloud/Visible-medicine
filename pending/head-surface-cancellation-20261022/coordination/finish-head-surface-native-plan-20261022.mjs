// Correct an orchestration-only nonexistent test path, retaining its failed receipt.
// No product source, pin, validator or existing test body is changed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor',source=json(root+'/SOURCE.json');
const initial=json(root+'/admission/TERMINAL.json');
assert.equal(initial.code,1);assert.match(initial.failure,/tests\/head-overlay-loading\.test\.ts/);
assert.equal(initial.commands.length,8);assert(initial.commands.every(r=>r.code===0));assert(!fs.existsSync(root+'/NATIVE_PLAN.json'));
for(const r of source.sourceRows)assert.equal(sha(read(source.website+'/'+r.path)),r.sha256,r.path);
const tests=['tests/head-surface-validation.test.ts','tests/head-entry-surface-cancellation.test.ts','tests/head-surface-review-binding.test.mjs',
 'tests/head-atlas-import.test.ts','tests/head-mask-reuse.test.ts','tests/head-mask-focus.test.ts','tests/head-mask-focus-preservation.test.mjs','tests/head-overlay-resource-budget.test.ts',
 'tests/head-study-buffer.test.ts','tests/head-asset-checksum.test.ts','tests/head-asset-checksum-binding.test.mjs','tests/head-loading-progress.test.ts','tests/head-loading-review-binding.test.mjs',
 'tests/head-atlas-overlays.test.ts','tests/head-practice-mask-only.test.ts','tests/head-surface-loading.test.ts','tests/head-surface-import-focus.test.mjs',
 'tests/current-atlas-delivery.test.mjs','tests/atlas-workspace-3d-context.test.mjs'];
for(const p of tests)assert(source.sourceRows.some(r=>r.path===p),p);
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Actual surface cancellation and source inverse, masks/reuse/budget/overlays/checksum/progress/renderer loading, protected Review and current delivery; no whole-suite, native scan, clinical or registration certificate.'},null,2)+'\n',{flag:'wx'});
const receipt={at:new Date().toISOString(),originalReceipt:root+'/admission/TERMINAL.json',originalReceiptSha256:sha(read(root+'/admission/TERMINAL.json')),
 reason:'Original plan named nonexistent head-overlay-loading.test.ts. Actual head-atlas-overlays and renderer loading/focus tests selected; none had executed yet.',
 allEightStockProducerQualityTypesAndBuildCommandsPassed:true,productOrExistingTestChanged:false,sourceReceiptSha256:sha(read(root+'/SOURCE.json')),nativeRoots:tests.length,ownerPreviewChanged:false};
fs.writeFileSync(root+'/NATIVE_PLAN_CORRECTION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
