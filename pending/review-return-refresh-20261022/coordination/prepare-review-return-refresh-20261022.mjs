import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
const proposal='F:/VisibleMedicine/staging/20261022-review-return-refresh-proposal';
const handoff=json(proposal+'/HANDOFF.json');
const sourceReceipt='F:/VisibleMedicine/staging/20261022-linked-tour-dismiss-successor/READY_SOURCE.json';
assert.equal(handoff.sourceReceipt,sourceReceipt);
assert.equal(sha(read(sourceReceipt)),'d72ddc1094db40b0a44cd1192f2362ca89b43a80c460a4423b401a7f61272013');
const root='F:/VisibleMedicine/staging/20261022-review-return-refresh-successor';
const planPath=path.resolve('review-return-refresh-successor-plan-20261022.json');
assert(!fs.existsSync(planPath));
const component=proposal+'/'+handoff.proposalComponent,test=proposal+'/'+handoff.test,before=proposal+'/'+handoff.preimage;
assert.equal(sha(read(component)),handoff.proposalComponentSha256);assert.equal(sha(read(test)),handoff.testSha256);
assert.equal(sha(read(before)),handoff.sourceComponentSha256);
const plan={root,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',
  overlays:[{path:'components/ClinicalReviewInbox.tsx',code:component,sha256:sha(read(component)),before,beforeSha256:sha(read(before))},
    {path:'tests/clinical-review-inbox-auto-return.test.mjs',code:test,sha256:sha(read(test)),beforeSha256:null}]};
fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
const source=prepareUiSuccessor(planPath),receipt=root+'/SOURCE.json';
const tests=source.sourceRows.map(row=>row.path).filter(path=>/^tests\/clinical-review-inbox(?:-[a-z-]+)?\.test\.(?:mjs|ts)$/.test(path)).sort();
assert.equal(tests.length,15);
const native={sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),evidence:root+'/native-integration',tests,
  scope:'All fourteen original inbox roots plus the additive actual-component return-refresh lifecycle, mismatch, pause and focus cases. Not a whole-suite or signed-in browser certificate.'};
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify(native,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(root+'/BROWSER_PLAN.json',JSON.stringify({sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt))},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,nativeRoots:tests.length,review:source.review,previewChanged:false}));
