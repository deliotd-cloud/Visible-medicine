// Preserve the sealed a01 title epoch independently of the moving current delivery.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const receiptPath='F:/VisibleMedicine/staging/20261026-title-tour-website/SOURCE_CANDIDATE.json';
const receiptSha='f0f68658da78d92bb631d8aeededf9134b1d736e6432870cae9ac1876a30b2df';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const receiptBytes=readFileSync(receiptPath);
assert.equal(sha(receiptBytes),receiptSha,'Source receipt changed');
const receipt=JSON.parse(receiptBytes);
assert.equal(resolve(receipt.website),resolve('F:/VisibleMedicine/staging/20261026-title-tour-website/website'));
const read=relative=>readFileSync(root+'/'+relative);
const pinBytes=read('tests/fixtures/current-atlas-delivery.json');
const pin=JSON.parse(pinBytes);
const currentReceiptBytes=readFileSync('G:/VisibleMedicine-temp/staging/20261031-release-partition9-title-ready/SOURCE.json');
assert.equal(sha(currentReceiptBytes),'0d4856c755796a748b38c530679e9a6bd30efc7906272a23bf8a2eff5ddaf5a1');
const currentReceipt=JSON.parse(currentReceiptBytes);
assert.equal(currentReceipt.review,pin.reviewIntegration,'Current receipt binds this Review');
const currentPinRows=currentReceipt.sourceRows.filter(row=>row.path==='tests/fixtures/current-atlas-delivery.json');
assert.equal(currentPinRows.length,1);
assert.equal(sha(pinBytes),currentPinRows[0].sha256,'Current candidate inherited the sealed delivery pin');
const receiptRow=relative=>{
  const rows=receipt.sourceRows.filter(row=>row.path===relative);
  assert.equal(rows.length,1,`One sealed source row: ${relative}`);
  return rows[0];
};
const safe=relative=>{
  assert(typeof relative==='string'&&
    (relative==='app/api/atlas-delivery/references/[...asset]/route.ts'||
      /^[A-Za-z0-9_./-]+$/.test(relative)&&
      !relative.split('/').some(part=>!part||part==='.'||part==='..')),
  'Unsafe source path');
  assert(lstatSync(root+'/'+relative).isFile()&&!lstatSync(root+'/'+relative).isSymbolicLink());
};

test('sealed current source, four emitted learners and complete protected Review are coherent',()=>{
  const historicalPinBytes=readFileSync(resolve(receipt.website,'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(sha(historicalPinBytes),receiptRow('tests/fixtures/current-atlas-delivery.json').sha256);
  const historicalPin=JSON.parse(historicalPinBytes);
  assert.equal(receipt.atlasHead,'a01ea4a00740dee0905204a33893761b8ae1ff1e');
  assert.equal(receipt.atlasTree,'362941c8dd6348d985622c4a21686bbf14c135f7');
  assert.equal(resolve(receipt.website),resolve('F:/VisibleMedicine/staging/20261026-title-tour-website/website'));
  assert.equal(sha(readFileSync(resolve(receipt.website,'tests/current-atlas-title-tour-delivery.test.mjs'))),receiptRow('tests/current-atlas-title-tour-delivery.test.mjs').sha256,'Sealed a01 test changed');
  assert.equal(historicalPin.source,receipt.atlasHead);
  assert.equal(historicalPin.sourceTree,receipt.atlasTree);
  assert.equal(historicalPin.reviewSourceFiles,receipt.reviewSourceFiles);
  assert.equal(historicalPin.reviewIntegration,receipt.reviewBindingSha256);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:historicalPin}),'The a01 pin cannot admit current delivery');
  assert.equal(pin.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
  assert.equal(pin.sourceTree,'d7ead7f3673ddf5c4b68db755b559b08b921eec6');
  assert.deepEqual(validateCurrentAtlasDelivery(),pin);
  for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])
    assert.equal(pin.runtimeSources[name],pin.source,`Sealed runtime source: ${name}`);
  const detached=validateCurrentAtlasDelivery();
  try{detached.documents.foreign='0'.repeat(64);}catch(error){assert(error instanceof TypeError);}
  assert.deepEqual(validateCurrentAtlasDelivery(),pin,'Detached result cannot mutate admitted default');
  assert(currentAtlasDeliveryRoot());
  let artifacts=0;
  for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
    const base=`public/atlas-runtime/${name}/`,manifest=JSON.parse(read(base+'manifest.json'));
    assert(manifest.files.some(row=>row.path==='LICENSES/THIRD_PARTY_NOTICES.md'));
    for(const row of manifest.files){safe(base+row.path);const bytes=read(base+row.path);
      assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);artifacts++;}
  }
  const review=JSON.parse(read('atlas-review/manifest.json'));
  assert.equal(review.files.length,pin.reviewSourceFiles);
  for(const row of review.files){safe('atlas-review/'+row.path);
    assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);}
  const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
  assert.equal(binding.inputs.length,currentReceipt.inputs);
  for(const row of binding.inputs){safe(row.path);assert.equal(sha(read(row.path)),row.sha256,row.path);}
  const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));
  for(const row of viewer.files){safe('public/atlas-review-viewer/'+row.path);
    assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);artifacts++;}
  assert(artifacts>100);
});

test('the exact 7e predecessor and 27b history cannot admit a01 delivery',()=>{
  const accessPath='F:/VisibleMedicine/staging/20261025-compact-access-website/SOURCE_CANDIDATE.json';
  const accessSha='78fb4e35a0c9a20347232edfd881f4aeb19ad280fe0d1c6523e699c3496876c1';
  const samePath='F:/VisibleMedicine/staging/20261025-nasal-bone-website/SOURCE_CANDIDATE.json';
  const sameSha='dac446fa73f452af6b073409af5908e7c8d1b7ad5ec42c7269937b39b23803d7';
  const priorPath='F:/VisibleMedicine/staging/20261025-guided-comparison-title-website/SOURCE_CANDIDATE.json';
  const priorSha='7cc6069153af7e9d439296549df2d21da343d9545327d4ab77ce9398b6e950e2';
  assert.equal(receipt.parentSha256,accessSha,'Exact immediate Website predecessor receipt');
  assert.equal(resolve(receipt.parent),resolve(accessPath),'Exact immediate Website predecessor path');
  const accessBytes=readFileSync(accessPath);
  assert.equal(sha(accessBytes),accessSha,'Exact 7e access Website receipt changed');
  const access=JSON.parse(accessBytes);
  assert.equal(access.atlasHead,'7e2552a300df29faf346be146929ffc727880ec5');
  assert.equal(access.atlasTree,'c756d5a038cca7d8fac429b908925c63915dc519');
  assert.equal(access.parentSha256,sameSha);
  assert.equal(resolve(access.parent),resolve(samePath));
  const accessPinRow=access.sourceRows.filter(row=>row.path==='tests/fixtures/current-atlas-delivery.json');
  assert.equal(accessPinRow.length,1);
  const accessPinBytes=readFileSync(resolve(access.website,'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(sha(accessPinBytes),accessPinRow[0].sha256,'Exact 7e predecessor pin changed');
  const accessPin=JSON.parse(accessPinBytes);
  assert.equal(accessPin.source,access.atlasHead);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:accessPin}));
  const sameBytes=readFileSync(samePath);
  assert.equal(sha(sameBytes),sameSha,'Exact same-native predecessor receipt changed');
  const same=JSON.parse(sameBytes);
  assert.equal(same.atlasHead,access.atlasHead);
  assert.equal(same.parentSha256,priorSha);
  assert.equal(resolve(same.parent),resolve(priorPath));
  const priorBytes=readFileSync(priorPath);
  assert.equal(sha(priorBytes),priorSha,'Exact 27b predecessor receipt changed');
  const prior=JSON.parse(priorBytes);
  assert.equal(resolve(prior.website),resolve('F:/VisibleMedicine/staging/20261025-guided-comparison-title-website/website'));
  assert.equal(prior.atlasHead,'27b341001718b7d5bb4f45aad0c8d8784e287c3b');
  const priorPinRow=prior.sourceRows.filter(row=>row.path==='tests/fixtures/current-atlas-delivery.json');
  assert.equal(priorPinRow.length,1);
  const priorPinBytes=readFileSync(resolve(prior.website,'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(sha(priorPinBytes),priorPinRow[0].sha256,'Exact 27b predecessor pin changed');
  const priorPin=JSON.parse(priorPinBytes);
  assert.equal(priorPin.source,prior.atlasHead);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:priorPin}));
});
for(const [label,edit] of [
  ['source commit',p=>{p.source='0'.repeat(40);}],
  ['missing document',p=>{delete p.documents['atlas-review/manifest.json'];}],
  ['foreign document',p=>{p.documents['.env.local']='0'.repeat(64);}],
  ['changed document',p=>{p.documents['atlas-review/manifest.json']='0'.repeat(64);}],
  ['wrong Review count',p=>{p.reviewSourceFiles++;}],
  ['wrong viewer count',p=>{p.viewerFiles++;}],
  ['wrong package count',p=>{p.viewerPackages++;}],
  ['invented clinical approval',p=>{p.clinicalApproval=true;}],
  ['malformed tree',p=>{p.sourceTree='HEAD';}],
  ['missing runtime source',p=>{delete p.runtimeSources.shoulder;}],
  ['foreign runtime source',p=>{p.runtimeSources.specimen='0'.repeat(40);}],
  ['malformed runtime source',p=>{p.runtimeSources['lower-limb']='HEAD';}],
])test('current fixture refuses '+label,()=>{
  const bad=structuredClone(pin);edit(bad);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));
});

for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
  test('current fixture refuses wrong '+name+' runtime source even with a repinned document',()=>{
    const relative=`public/atlas-runtime/${name}/manifest.json`,bad=structuredClone(pin),manifest=JSON.parse(read(relative));
    manifest.sourceCommit='0'.repeat(40);
    const bytes=Buffer.from(JSON.stringify(manifest));bad.documents[relative]=sha(bytes);
    assert.throws(()=>validateCurrentAtlasDelivery({pin:bad,read:p=>p===relative?bytes:read(p)}));
  });
  test('current fixture refuses wrong '+name+' admitted source',()=>{
    const bad=structuredClone(pin);bad.runtimeSources[name]='0'.repeat(40);
    assert.throws(()=>validateCurrentAtlasDelivery({pin:bad}));
  });
}

for(const [label,relative,edit]of [
  ['one stale learner','public/atlas-runtime/head-neck/manifest.json',d=>{d.sourceCommit='0'.repeat(40);}],
  ['clinical clearance','public/atlas-runtime/shoulder/manifest.json',d=>{d.clinicalApproved=true;}],
  ['patient data admission','public/atlas-runtime/shoulder/manifest.json',d=>{d.patientDataIncluded=true;}],
  ['mixed Review','atlas-review/manifest.json',d=>{d.revision='0'.repeat(40);}],
  ['personal records','public/atlas-review-viewer/manifest.json',d=>{d.personalRecordsIncluded=true;}],
  ['debug Review','public/atlas-review-viewer/manifest.json',d=>{d.mode='debug';}],
  ['model substitution','lib/atlas-model-inventory.json',d=>{d.models.pop();}],
])test('repinning a hash cannot hide '+label,()=>{
  const bad=structuredClone(pin),document=JSON.parse(read(relative));edit(document);
  const bytes=Buffer.from(JSON.stringify(document));bad.documents[relative]=sha(bytes);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:bad,read:p=>p===relative?bytes:read(p)}));
});
