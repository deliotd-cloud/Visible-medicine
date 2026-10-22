// Test-only successor; retain the failed predecessor and all exact source roles.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const predecessor='F:/VisibleMedicine/staging/20261022-surface-spinal-consumer-successor',receipt=predecessor+'/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'9931820972d6b61ba1affa1f3d12378f35cc3e37ce180bb601f539f64e185bde');
const failed=json(predecessor+'/native-integration/TERMINAL.json');assert.equal(failed.counts.fail,1);assert.equal(failed.counts.pass,53);assert.deepEqual(failed.sourceDrift,[]);
assert(read(predecessor+'/native-integration/child.tap').toString().includes('Unexpected shoulder difference: content/regional-teaching/head-neck.json'));
const proposal='F:/VisibleMedicine/staging/20261022-spinal-shoulder-history-followup';
const rows=[['tests/atlas-spinal-muscle-xray.test.mjs','9ce897d60b62261f9ed75918700cba2580fdc58ca99bf9a487618a70a1c82e6d'],
 ['tests/spinal-current-source-inverse.mjs','ca8b00c2ae91d390e761a1d43a21f0c976a26aa8295dd5ddf274d3598adba7b7']];
const overlays=rows.map(([p,hash])=>{const code=proposal+'/CODE/'+p,before=proposal+'/RAW/'+p;assert.equal(sha(read(code)),hash);
 const old=source.sourceRows.find(r=>r.path===p);assert(old);assert.equal(sha(read(before)),old.sha256);return {path:p,code,sha256:hash,before,beforeSha256:old.sha256};});
const root='F:/VisibleMedicine/staging/20261022-spinal-shoulder-history-successor',planPath=path.resolve('spinal-shoulder-history-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const result=prepareUiSuccessor(planPath);assert.equal(result.sourcePaths,6183);assert.equal(result.review,source.review);assert.deepEqual(result.changedProductPaths,[]);
const oldPlan=json(predecessor+'/NATIVE_PLAN.json');
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests:oldPlan.tests,
 scope:'Actual seven-root rerun after exact two additional historical shoulder source-role guards. Complete preceding source proofs and all product/binding/runtime bytes retained; no whole-suite/clinical/deployment claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),nativeRoots:oldPlan.tests.length,sourcePaths:result.sourcePaths,productAndBindingUnchanged:true,ownerPreviewChanged:false}));
