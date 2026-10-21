import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

const websiteRoot=resolve(process.env.VM_WEBSITE_ROOT ?? process.env.VM_WEBSITE_SOURCE_REPO ?? process.cwd());
const fixtureRoot=join(dirname(fileURLToPath(import.meta.url)),'fixtures/drawable-epoch-preimage');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const readFixture=path=>readFileSync(join(fixtureRoot,path));
const expectedRaw={
 'current-atlas-delivery.mjs.raw':'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5',
 'current-atlas-delivery.test.mjs.raw':'93eab7abd191466bc7bf103a611b9ca936d74e5426cacf0421d96e748f0737e9',
 'body-learning-current-admission.test.mjs.raw':'0c0ed48aad198a7c462e8f335250513ca39d3fe146c648e6add82aa04b481a4d',
 'body-learning-epoch-history-preservation.test.mjs.raw':'2228e985ad8a748a5934cff7e665484c7ed4715fa746101405a2863895cc7b9a',
 'body-learning-layout-history-preservation.test.mjs.raw':'a667894f46b8d6a71d0fd964d07f9115aca0e8e65c6feda1b8c11b3a76a038b6',
 'desktop-learning-row-history.test.mjs.raw':'440ad2646f5d06769994957f73e771544c2caefdd1a42dfa49d8c772dfa1108f',
 'atlas190-current-delivery.test.mjs.raw':'4e31d0bd60a4857419f0e18fbc0e1f6e0997fe50b0c67e2853b27c1f1199bb64',
 'head-neck-pilot.test.ts.raw':'9d496688c7b45d8d931466a8c87716382c70e99d9b695822910c3ce030d39e8a',
 'head-neck-pilot-current.test.mjs.raw':'416876fb43d5d87f86e4f29a447029ed66c22d907c6162affc1ad746da32d579',
 'current-190-coverage.test.mjs.raw':'569173789acc7d974aff177b083da6f6f6651b3a6f9716a9942cd915e12af10a',
 'clinical-review-desktop-layout.test.mjs.raw':'4986b31328ae291df5d98435ad1a88f702a8d915cda44a5b2664bf7e68257484',
 'current-atlas-delivery.json.raw':'48e78c04e4ac5c6da18e4d57ffb66616487f835b9e8574304c4798cd8c983627',
 'coverage-index-0df.json.raw':'99444c9b9038b44c6c504ef827d64c843ec07855ed5f38dbe412708c215d0123',
 'import-clinical-review.mjs.raw':'c372bad521d19bd7ed03a40208e3d911c64339ddd23cf7188ddf668cc905e192',
 'binding-inputs/atlas-review/app/body-explorer.css.raw':'9834c72543476b41ba5acb5a47427dced3596d56320c59502d91f9e9e2524dca',
 'binding-inputs/docs/anatomy-coverage/index.json.raw':'99444c9b9038b44c6c504ef827d64c843ec07855ed5f38dbe412708c215d0123',
 'binding-inputs/lib/anatomy-coverage-view.ts.raw':'698967e2b59fec32f81d14aa9c393b91b7ca5744fc5439330afa8a29c0e744f7',
 'binding-inputs/scripts/import-clinical-review.mjs.raw':'c372bad521d19bd7ed03a40208e3d911c64339ddd23cf7188ddf668cc905e192',
};
const old='0dfce15890cafc0a2b8e309193531daa29a672ed';
const oldTree='18f4fa612d0209123488a9104c2e26089b06cfe3';
const oldReview='c4a5647ec3e0047013747d1810b87939a1b8472cb5e334659f5f64ae961d5db3';
const earlier='190a63238eadcf906abe89dcbb6a67c88afe70b9';

test('complete 0df/c4a admission, layout and history preimages remain exact',()=>{
 for(const [path,digest]of Object.entries(expectedRaw))assert.equal(sha(readFixture(path)),digest,path);
});

test('all twelve 0df/c4a delivery documents remain an exact historical validator closure',async()=>{
 const pin=JSON.parse(readFixture('current-atlas-delivery.json.raw'));
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.equal(pin.source,old);
 assert.equal(pin.sourceTree,oldTree);
 assert.equal(pin.reviewIntegration,oldReview);
 assert.deepEqual(pin.runtimeSources,{
  'head-neck':old,shoulder:earlier,'lower-limb':earlier,'female-pelvis':earlier,
 });
 assert.equal(Object.keys(pin.documents).length,12);
 const readHistorical=path=>{
  assert(Object.hasOwn(pin.documents,path),'No unpinned historical document');
  const bytes=readFixture(join('documents',path));
  assert.equal(sha(bytes),pin.documents[path],path);
  return bytes;
 };
 for(const path of Object.keys(pin.documents))readHistorical(path);
 const {validateCurrentAtlasDelivery}=await import(pathToFileURL(join(websiteRoot,'tests/current-atlas-delivery.mjs')).href);
 assert.deepEqual(validateCurrentAtlasDelivery({pin,read:readHistorical}),pin);
});
