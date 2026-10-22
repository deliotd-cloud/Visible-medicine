// Read-only source proof. No test module, validator, runtime, or model is loaded.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const stage=dirname(fileURLToPath(import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(root,path)=>readFileSync(join(root,path));
const preimage=read(stage,'CODE.preimage.ts.txt');
const proposal=read(stage,'atlas-nonregional-release-fixture.ts');
const original=read(website,'tests/atlas-nonregional-release-fixture.ts');
const before=Buffer.from('module,sourceCommit:pin.source,');
const after=Buffer.from('module,sourceCommit:pin.runtimeSources[module],');
const preimageSha='bb21e2f28fb7b3b8f815acbf2814e784fffbab454331a7569ea81224483d41ee';
assert.equal(sha(preimage),preimageSha,'Frozen complete CODE preimage');
assert.equal(sha(original),preimageSha,'Candidate fixture must be the exact frozen source');
assert.equal(preimage.indexOf(before),preimage.lastIndexOf(before),'Exactly one source seam');
assert.notEqual(preimage.indexOf(before),-1,'Expected source seam exists');
const offset=preimage.indexOf(before);
const rebuilt=Buffer.concat([preimage.subarray(0,offset),after,preimage.subarray(offset+before.length)]);
assert.deepEqual(proposal,rebuilt,'Proposal differs only at the one intended seam');
const inverseOffset=proposal.indexOf(after);
assert.equal(inverseOffset,proposal.lastIndexOf(after),'Exactly one inverse seam');
assert.deepEqual(Buffer.concat([proposal.subarray(0,inverseOffset),before,proposal.subarray(inverseOffset+after.length)]),preimage,'Full original source reconstructs byte for byte');

const expectedHelperSha='52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5';
const expectedPinSha='db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f';
const requireHash=(bytes,expected,label)=>assert.equal(sha(bytes),expected,label+' changed or unknown');
requireHash(read(website,'tests/current-atlas-delivery.mjs'),expectedHelperSha,'Strict current validator helper');
const pinBytes=read(website,'tests/fixtures/current-atlas-delivery.json');
requireHash(pinBytes,expectedPinSha,'Current source pin');
const pin=JSON.parse(pinBytes);
assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
assert.deepEqual(Object.keys(pin.runtimeSources).sort(),['female-pelvis','head-neck','lower-limb','shoulder']);
assert.equal(pin.runtimeSources['head-neck'],pin.source);
for(const module of ['shoulder','female-pelvis','lower-limb'])assert.equal(pin.runtimeSources[module],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.deepEqual(Object.keys(pin.documents).sort(),[
  'atlas-review/integration-inputs.json','atlas-review/manifest.json','lib/atlas-model-inventory.json',
  'public/atlas-review-viewer/manifest.json',
  ...['head-neck','shoulder','lower-limb','female-pelvis'].flatMap(module=>[
    `public/atlas-runtime/${module}/manifest.json`,`public/atlas-runtime/${module}/source-inputs.json`,
  ]),
].sort(),'Closed document inventory');
for(const [path,expected] of Object.entries(pin.documents))requireHash(read(website,path),expected,path);
const inventory=JSON.parse(read(website,'lib/atlas-model-inventory.json'));
const modules=['shoulder','female-pelvis','lower-limb'];
assert.deepEqual(inventory.sources.filter(row=>row.module!=='head-neck').map(({module})=>module),modules,'Current inventory order');
assert.equal(inventory.models.length,137);
assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
assert.equal(inventory.models.reduce((sum,model)=>sum+model.bytes,0),199072480);
const counts=[1,2,5];
for(let i=0;i<modules.length;i++){
  const module=modules[i],entry=inventory.sources.find(row=>row.module===module);
  assert.equal(entry.sourceCommit,pin.runtimeSources[module],module+' inventory revision');
  assert.equal(entry.manifestSha256,pin.documents[`public/atlas-runtime/${module}/manifest.json`],module+' manifest binding');
  const manifest=JSON.parse(read(website,`public/atlas-runtime/${module}/manifest.json`));
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module+' manifest revision');
  assert.equal(entry.modelPaths,counts[i],module+' model-path count');
}
function refuses(bytes,expected,label){assert.throws(()=>requireHash(bytes,expected,label),{code:'ERR_ASSERTION'});}
const modified=Buffer.from(original);modified[0]^=1;
refuses(modified,preimageSha,'Modified fixture');
const helper=read(website,'tests/current-atlas-delivery.mjs');
refuses(Buffer.concat([helper,Buffer.from(' ')]),expectedHelperSha,'Modified validator helper');
refuses(Buffer.concat([pinBytes,Buffer.from(' ')]),expectedPinSha,'Modified pin');
for(const path of ['lib/atlas-model-inventory.json','public/atlas-runtime/shoulder/manifest.json']){
  refuses(Buffer.concat([read(website,path),Buffer.from(' ')]),pin.documents[path],'Modified '+path);
}
console.log(JSON.stringify({result:'PASS_SOURCE_ONLY',preimageSha,proposalSha:sha(proposal),documents:Object.keys(pin.documents).length,nonregionalModules:modules,modelPaths:counts,negativeRefusals:5}));
