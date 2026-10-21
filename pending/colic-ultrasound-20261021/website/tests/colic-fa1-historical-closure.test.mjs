import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'fixtures/colic-fa1-preimage');
const website=resolve(process.env.VM_WEBSITE_ROOT ?? process.cwd());
const read=path=>readFileSync(join(root,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frozen={
 'atlas190-current-delivery.test.mjs.raw':'68f170aa438a01fc548ebe009e780190cfafcf7a0704506b5b6d6add4dd1dee2',
 'body-learning-current-admission.test.mjs.raw':'cce010099839e867ebdd1fd379da1da99b7ca5681c8563b2db5d7a28ec051755',
 'body-learning-epoch-history-preservation.test.mjs.raw':'28c825e3bbdd69ef9b90f5b722e55727ecd9a40e2c065a9d8efd038f27af5f87',
 'body-learning-layout-history-preservation.test.mjs.raw':'de95cdf5b16db2679b45b915fb7933ccbb42bdc3c83e06548fd700858f60e530',
 'clinical-review-desktop-layout.test.mjs.raw':'218948fa1d5e7e5a42a2de03a540ce122feeda87d599012a49dd367d634cc1fb',
 'current-190-coverage.test.mjs.raw':'902e58cb7c44ea29a56f21fbf91648df059d25870ea7250925c6de471b07c457',
 'current-atlas-delivery.test.mjs.raw':'9d17e32eced75ffd5b6f670251bd6f36983e6e21d5654b7dec9bc8ed5fc1ab91',
 'desktop-learning-row-history.test.mjs.raw':'837fa885e9f71db663a87016f460235248f698faf3fc0d02c0bca117b994e9a1',
 'drawable-epoch-adapter-inverse.test.mjs.raw':'a4c39facc63df9e987bba44aaec677d9382f542e4f1689fa0e7de3dfa2fda780',
 'drawable-epoch-current-admission.test.mjs.raw':'bcf5aae29cf8dcabd824682f2592bda8064f2957ece3e0104d000d3a7cb3b78a',
 'drawable-epoch-historical-closure.test.mjs.raw':'cfeba268a313baab1ccf63858a4da09bd61e78354e86b3d0b090a4329e1a68d5',
 'head-neck-pilot-current.test.mjs.raw':'fdfdbaad3d26b8b6d5e4f137718563ef3e5b242b7dbd15fe049e131eb941cc2a',
 'head-neck-pilot.test.ts.raw':'520649d10168b76fe7e78f28738deebb8f0472ae58bc91eacda24f4dc46aedd8',
 'current-atlas-delivery.json.raw':'df332899853867a1f36f5da5afdcf80a1a9b1868e9b26f29885df45f2583fde6',
 'coverage-index.json.raw':'09f2c672f1853930eaf8cfa68711ced35d33fa0a3dabab90a7304f75d0c34248',
 'import-clinical-review.mjs.raw':'6e2d69b70dde4b6efef3bf63036e043be900c729314386ca60ff477ae5733cbc',
};
const fa='fa1bf9a233c6989fef42b533bbbac9d6ab034311';
const old='190a63238eadcf906abe89dcbb6a67c88afe70b9';

test('all 13 fa1/Review0931 admission roots and companion bytes are exact historical witnesses',()=>{
 for(const [path,digest] of Object.entries(frozen))assert.equal(sha(read(path)),digest,path);
});

test('complete fa1 delivery remains separately authentic under the unchanged schema2 validator',async()=>{
 const pin=JSON.parse(read('current-atlas-delivery.json.raw'));
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.equal(pin.source,fa);
 assert.equal(pin.sourceTree,'5418fc0ba22673c086edea7afe13617e34e69f98');
 assert.equal(pin.reviewIntegration,'0931a6f0042f2973a0d766c1c55f177f76bb3000867dad197e2bcc2ce6461823');
 assert.equal(pin.reviewSourceFiles,1556);
 assert.deepEqual(pin.runtimeSources,{'head-neck':fa,shoulder:old,'lower-limb':old,'female-pelvis':old});
 assert.equal(Object.keys(pin.documents).length,12);
 const historicalRead=path=>{
  assert(Object.hasOwn(pin.documents,path),'Only pinned historical documents may be read');
  const bytes=read('documents/'+path+'.raw');
  assert.equal(sha(bytes),pin.documents[path],path);
  return bytes;
 };
 for(const path of Object.keys(pin.documents))historicalRead(path);
 const {validateCurrentAtlasDelivery}=await import(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href);
 assert.deepEqual(validateCurrentAtlasDelivery({pin,read:historicalRead}),pin);
 assert.throws(()=>validateCurrentAtlasDelivery({pin}),
  'Complete old fa1 delivery must not be current after a new source admission');
});
