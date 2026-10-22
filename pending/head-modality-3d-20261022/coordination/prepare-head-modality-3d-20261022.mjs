import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
const proposal='F:/VisibleMedicine/staging/20261022-head-modality-3d-context-proposal';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate/SOURCE_V2.json';
assert.equal(sha(read(sourceReceipt)),'83df8fd5064b4598e21397864d7ab57c0824c652ec60d24fbf10860e54b7d0ae');
assert.equal(json(path.dirname(sourceReceipt)+'/verification-v2/TERMINAL.json').code,0);
const handoff=read(proposal+'/HANDOFF/HANDOFF.md').toString();
const paths=['components/AtlasWorkspaceNavigation.tsx','tests/atlas-workspace-simplification.test.ts','tests/atlas-workspace-3d-context.test.mjs'];
const overlays=paths.map(p=>{
 const code=proposal+'/CODE/'+p,before=proposal+'/RAW/'+p,b=read(code),hash=sha(b);assert(handoff.includes(hash),'Exact final handoff SHA must match actual file: '+p);
 return{path:p,code,sha256:hash,...(fs.existsSync(before)?{before,beforeSha256:sha(read(before))}:{beforeSha256:null})};
});
const root='F:/VisibleMedicine/staging/20261022-head-modality-3d-context-successor',planPath=path.resolve('head-modality-3d-plan-20261022.json');assert(!fs.existsSync(planPath));
const plan={root,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays};
fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});const result=prepareUiSuccessor(planPath),receipt=root+'/SOURCE.json';
assert.equal(result.review,'2c8e263eb4bbd04120eb79560314f372a10846f6fd5616477bde18a42e9f7ef3');assert.equal(result.atlasHead,'389bd0ca846a42c7f21055f55904bcf5df81a09f');
const tests=['tests/atlas-workspace-simplification.test.ts','tests/atlas-workspace-3d-context.test.mjs','tests/imaging-atlas-shell.test.ts','tests/atlas-region-picker.test.ts',
 'tests/atlas-navigation.test.ts','tests/head-atlas-navigation.test.ts','tests/head-atlas-learning.test.ts','tests/head-image-only-links.test.ts',
 'tests/current-atlas-delivery.test.mjs','tests/atlas-neck-landmark-xray.test.mjs','tests/atlas-neck-xray-delivery-transition.test.mjs'];
for(const p of tests)assert(result.sourceRows.some(row=>row.path===p),p);
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),evidence:root+'/native-integration',tests,
 scope:'Actual modality navigation/region picker/imaging shell/head mapping/tours, current delivery and preserved exact neck X-ray import. Not a whole-suite or native scan/model/sign-in certificate.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,sourcePaths:result.sourcePaths,sourceReceiptSha256:sha(read(receipt)),nativeRoots:tests.length,review:result.review,previewChanged:false}));
