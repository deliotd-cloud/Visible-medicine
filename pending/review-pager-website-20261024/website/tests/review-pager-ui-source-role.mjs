// This exact Website changes inbox focus only; native/Review epochs stay authentic.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {resolve} from 'node:path';import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';import {assertToolbarCurrentDisplay} from './toolbar-current-source-role.mjs';
const current='F:/VisibleMedicine/staging/20261024-review-pager-website/website',parent='F:/VisibleMedicine/staging/20261024-toolbar-website/website',receipt='F:/VisibleMedicine/staging/20261024-toolbar-website/SOURCE_BOUND.json',receiptSha='f03b2e81719843b3d62f6089d3362bb20404751f8f85f9f3525c85d386014ea1',sha=b=>createHash('sha256').update(b).digest('hex');
export const isReviewPagerUiRoot=root=>resolve(root)===resolve(current);
export function assertReviewPagerCurrentDisplay({root,read=p=>readFileSync(root+'/'+p)}){
 assert(isReviewPagerUiRoot(root),'Only the exact review-pager Website successor is admitted');assert.equal(sha(readFileSync(receipt)),receiptSha);const oldRead=p=>readFileSync(parent+'/'+p),parse=(get,p)=>JSON.parse(get(p));
 const oldManifest=parse(oldRead,'atlas-review/manifest.json'),oldBinding=parse(oldRead,'atlas-review/integration-inputs.json');assertToolbarCurrentDisplay({root:parent,manifest:oldManifest,binding:oldBinding,read:oldRead});
 assert.equal(sha(read('components/ClinicalReviewInbox.tsx')),'c80e693ec12ceae85f959563d1ee1746d4b543bc78ebf03c909bf6eb6e2a7897','Exact source-executed inbox');
 const oldPin=parse(oldRead,'tests/fixtures/current-atlas-delivery.json');assert.deepEqual(validateCurrentAtlasDelivery({root,read}),oldPin);assert.deepEqual(read('tests/fixtures/current-atlas-delivery.json'),oldRead('tests/fixtures/current-atlas-delivery.json'));
 for(const [path,digest]of Object.entries(oldPin.documents))assert.equal(sha(read(path)),digest,path);
 for(const row of oldBinding.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 for(const row of oldManifest.files)assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);
 const viewer=parse(oldRead,'public/atlas-review-viewer/manifest.json');for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){const base='public/atlas-runtime/'+name+'/';for(const row of parse(oldRead,base+'manifest.json').files)assert.equal(sha(read(base+row.path)),row.sha256,base+row.path);}
 return {source:oldPin.source,integration:oldPin.reviewIntegration,inputs:oldBinding.inputs.length,sourceFiles:oldManifest.files.length,onlyInboxUiChanged:true};
}
