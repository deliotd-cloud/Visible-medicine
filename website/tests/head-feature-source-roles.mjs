// Exact closed 2381 contract and independent actual delivery, never aliases.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {readHistoricalHeadToolsRole} from './head-tools-current-role.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function sourceRole(file,digest){
 const bytes=readFileSync(file);assert.equal(sha(bytes),digest,'Independent exact source receipt');
 const receipt=JSON.parse(bytes),rows=new Map(receipt.sourceRows.map(r=>[r.path,r]));
 const read=path=>{const row=rows.get(path);assert(row,'Only named source paths: '+path);
  const bytes=readFileSync(receipt.website+'/'+path);assert.equal(sha(bytes),row.sha256,path);return bytes;};
 return {receipt,read,has:path=>rows.has(path),digest:path=>{const row=rows.get(path);assert(row,'Only named source paths: '+path);return row.sha256;}};
}
const closed=sourceRole('F:/VisibleMedicine/staging/20261022-historical-admission-assurance/SOURCE_V3.json',
 'd769eb7da674dd534f3e220a1b32b1a176c321ce39602d84ae9862a942c0989a');
for(const path of ['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs','tests/fixtures/current-atlas-delivery.json'])closed.read(path);
const historicalValidator=await import(pathToFileURL(closed.receipt.website+'/tests/current-atlas-delivery.mjs').href);
const historicalPin=JSON.parse(closed.read('tests/fixtures/current-atlas-delivery.json'));
assert.equal(historicalPin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
assert.equal(historicalPin.viewerFiles,46);
export const readHistorical2381Source=closed.read;
const c4a=JSON.parse(closed.read('tests/fixtures/drawable-epoch-preimage/documents/atlas-review/integration-inputs.json'));
assert.equal(c4a.sha256,'c4a5647ec3e0047013747d1810b87939a1b8472cb5e334659f5f64ae961d5db3');
assert.equal(sha(JSON.stringify(c4a.inputs)),c4a.sha256);
const c4aInputs=new Map(c4a.inputs.map(r=>[r.path,r.sha256]));
// The original desktop proof already supplies its explicit changed-input
// preimages. These are the unchanged source inputs it still reads directly.
export function readDesktopHistoricalSource(path){
 if(!path.startsWith('../'))return closed.read('tests/'+path);
 const rel=path.slice(3);
 assert(!rel.split('/').includes('..'));
 if(rel==='components/HeadAtlasViewer.tsx')return readHistoricalHeadToolsRole(rel);
 if(['components/AtlasRuntimeFrame.tsx','scripts/bind-clinical-review.mjs',
  'atlas-review/content/regional-teaching/head-neck.json'].includes(rel))return closed.read(rel);
 const expected=c4aInputs.get(rel);assert(expected,'Only a named c4a binding input: '+rel);
 for(const candidate of [rel,'tests/fixtures/zero-registration-fa1-binding/'+rel+'.raw']){
  if(!closed.has(candidate))continue;
  const bytes=closed.read(candidate);if(sha(bytes)===expected)return bytes;
 }
 assert.fail('No authenticated exact c4a source witness: '+rel);
}
export function validateHistorical2381Delivery(options={}){
 assert(options&&typeof options==='object'&&!Array.isArray(options));
 for(const key of Object.keys(options))assert(['pin','read'].includes(key));
 return historicalValidator.validateCurrentAtlasDelivery({pin:structuredClone(historicalPin),read:closed.read,...options});
}
export const historical2381Delivery={
 CURRENT_ATLAS_REVISION:historicalPin.source,
 validateCurrentAtlasDelivery:validateHistorical2381Delivery,
};
const current=sourceRole('F:/VisibleMedicine/staging/20261024-head-tools-proof/SOURCE_BOUND.json',
 '1071697c3bd7da15fa7b3daa563f4d55ce3d9b4ae1854d9eb36fe1790a6492e0');
for(const path of ['tests/current-atlas-delivery.mjs','tests/fixtures/current-atlas-delivery.json'])current.read(path);
const headFeatureValidator=await import(pathToFileURL(current.receipt.website+'/tests/current-atlas-delivery.mjs').href);
const headFeaturePin=JSON.parse(current.read('tests/fixtures/current-atlas-delivery.json'));
export function assertActualHeadFeatureDelivery(){
 // Legacy caller name: authenticate the exact closed head-feature role.
 const read=current.read;
 const pin=headFeatureValidator.validateCurrentAtlasDelivery({pin:structuredClone(headFeaturePin),read});
 assert.equal(pin.source,'d143c28fb1e5da200712af6629a375c25d17dad7');
 assert.equal(pin.sourceTree,'486287b25d968117cffdd27bb20009fa46cda6f3');
 assert.equal(pin.reviewIntegration,'35fdca381e22b1c9a5fad703d673fd8fdac427aeb9580f3375243be5f7c06709');
 assert.equal(pin.reviewSourceFiles,1593);assert.equal(pin.viewerFiles,54);assert.equal(pin.viewerPackages,24);
 for(const family of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[family],pin.source,family);
 const inputs=JSON.parse(read('atlas-review/integration-inputs.json'));assert.equal(inputs.inputs.length,1783);
 for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:historicalPin}));
 assert.throws(()=>validateHistorical2381Delivery({pin}));
 return pin;
}

const admitted=sourceRole('F:/VisibleMedicine/staging/20261027-coccygeus-website/HEAD_DELIVERY_ADMISSION.json',
 '7dfba957010ac293f0f1f20c474af66915abe3e0e8c08c95f608c2bebee1d592');
for(const path of ['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs','tests/fixtures/current-atlas-delivery.json'])admitted.read(path);
const admittedValidator=await import(pathToFileURL(admitted.receipt.website+'/tests/current-atlas-delivery.mjs').href);
// Legacy export name: this proves the sealed a9 import epoch, not the moving current website.
export const readHistoricalCoccygeusSource=admitted.read;
export function assertSealedCurrentHeadFeatureDelivery({readActual=admitted.read}={}){
 const actualRead=path=>{const bytes=readActual(path);assert.equal(sha(bytes),admitted.digest(path),path+': actual current source matches independent coccygeus import admission');return bytes;};
 const receiptPin=JSON.parse(actualRead('tests/fixtures/current-atlas-delivery.json'));
 const pin=admittedValidator.validateCurrentAtlasDelivery({pin:receiptPin,read:actualRead});
 assert.equal(pin.source,'a9f5930a853bfb7b419ffd756bb29cefc174f3da');
 assert.equal(pin.sourceTree,admitted.receipt.atlasTree);
 assert.equal(pin.reviewIntegration,admitted.receipt.reviewBindingSha256);
 assert.equal(pin.reviewSourceFiles,admitted.receipt.reviewSourceFiles);
 assert.equal(pin.viewerFiles,admitted.receipt.viewerFiles);assert.equal(pin.viewerPackages,admitted.receipt.viewerPackages);
 for(const family of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[family],pin.source,family);
 const inputs=JSON.parse(actualRead('atlas-review/integration-inputs.json'));
 assert.equal(inputs.inputs.length,admitted.receipt.reviewInputs);
 for(const row of inputs.inputs)assert.equal(sha(actualRead(row.path)),row.sha256,row.path);
 assert.throws(()=>admittedValidator.validateCurrentAtlasDelivery({pin:headFeaturePin,read:actualRead}));
 assert.throws(()=>headFeatureValidator.validateCurrentAtlasDelivery({pin,read:current.read}));
 return pin;
}
