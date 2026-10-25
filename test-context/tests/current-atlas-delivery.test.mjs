// Proposal: install as tests/current-atlas-delivery.test.mjs in a new candidate.
// The runner must supply a separately verified SOURCE_CANDIDATE.json path and SHA-256.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const receiptPath=process.env.VM_CURRENT_SOURCE_RECEIPT;
const receiptSha=process.env.VM_CURRENT_SOURCE_SHA256;
assert(receiptPath&&/^[a-f0-9]{64}$/.test(receiptSha??''),'Sealed current source receipt required');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const receiptBytes=readFileSync(receiptPath);
assert.equal(sha(receiptBytes),receiptSha,'Source receipt changed');
const receipt=JSON.parse(receiptBytes);
assert.equal(resolve(receipt.website),resolve(root),'Receipt belongs to this Website');
const read=relative=>readFileSync(root+'/'+relative);
const pinBytes=read('tests/fixtures/current-atlas-delivery.json');
const pin=JSON.parse(pinBytes);
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
  assert.equal(sha(pinBytes),receiptRow('tests/fixtures/current-atlas-delivery.json').sha256);
  assert.equal(pin.source,receipt.atlasHead);
  assert.equal(pin.sourceTree,receipt.atlasTree);
  assert.equal(pin.reviewSourceFiles,receipt.reviewSourceFiles);
  assert.equal(pin.reviewIntegration,receipt.reviewBindingSha256);
  assert.deepEqual(validateCurrentAtlasDelivery(),pin);
  for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])
    assert.equal(pin.runtimeSources[name],receipt.atlasHead,`Sealed runtime source: ${name}`);
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
  assert.equal(review.files.length,receipt.reviewSourceFiles);
  for(const row of review.files){safe('atlas-review/'+row.path);
    assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);}
  const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
  assert.equal(binding.inputs.length,receipt.protectedReviewInputs);
  for(const row of binding.inputs){safe(row.path);assert.equal(sha(read(row.path)),row.sha256,row.path);}
  const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));
  for(const row of viewer.files){safe('public/atlas-review-viewer/'+row.path);
    assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);artifacts++;}
  assert(artifacts>100);
});

test('the sealed previous source epoch cannot admit the current delivery',()=>{
  const priorPath='F:/VisibleMedicine/staging/20261025-guided-comparison-title-website/SOURCE_CANDIDATE.json';
  const priorSha='7cc6069153af7e9d439296549df2d21da343d9545327d4ab77ce9398b6e950e2';
  const samePath='F:/VisibleMedicine/staging/20261025-nasal-bone-website/SOURCE_CANDIDATE.json';
  const sameSha='dac446fa73f452af6b073409af5908e7c8d1b7ad5ec42c7269937b39b23803d7';
  const accessPath='F:/VisibleMedicine/staging/20261025-compact-access-website/SOURCE_CANDIDATE.json';
  const accessSha='78fb4e35a0c9a20347232edfd881f4aeb19ad280fe0d1c6523e699c3496876c1';
  let priorLink=receipt;
  if(priorLink.parentSha256===accessSha){
    assert.equal(resolve(priorLink.parent),resolve(accessPath),'Known access-only predecessor path');
    const bytes=readFileSync(accessPath);
    assert.equal(sha(bytes),accessSha,'Access-only predecessor changed');
    priorLink=JSON.parse(bytes);
    assert.equal(priorLink.atlasHead,pin.source,'Access-only predecessor source');
    assert.equal(priorLink.parentSha256,sameSha,'Access-only predecessor parent');
  }
  if(priorLink.parentSha256===sameSha){
    assert.equal(resolve(priorLink.parent),resolve(samePath),'Known same-native predecessor path');
    const bytes=readFileSync(samePath);
    assert.equal(sha(bytes),sameSha,'Same-native predecessor changed');
    priorLink=JSON.parse(bytes);
    assert.equal(priorLink.atlasHead,pin.source,'Same-native predecessor source');
  }else assert.equal(priorLink.parentSha256,priorSha,'Unsupported current receipt ancestry shape');
  assert.equal(priorLink.parentSha256,priorSha,'Known previous-source predecessor');
  assert.equal(resolve(priorLink.parent),resolve(priorPath),'Known previous-source predecessor path');
  const priorBytes=readFileSync(priorPath);
  assert.equal(sha(priorBytes),priorSha,'Previous-source receipt changed');
  const prior=JSON.parse(priorBytes);
  assert.equal(resolve(prior.website),resolve('F:/VisibleMedicine/staging/20261025-guided-comparison-title-website/website'));
  const rows=prior.sourceRows.filter(row=>row.path==='tests/fixtures/current-atlas-delivery.json');
  assert.equal(rows.length,1);
  const bytes=readFileSync(resolve(prior.website,'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(sha(bytes),rows[0].sha256);
  const old=JSON.parse(bytes);
  assert.equal(old.source,'27b341001718b7d5bb4f45aad0c8d8784e287c3b');
  assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
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
