// Read-only source proof: never loads the test, validator, runtime or model bytes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const stage=dirname(fileURLToPath(import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const read=(root,path)=>readFileSync(join(root,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const preimage=read(stage,'CODE.preimage.test.mjs.txt');
const proposal=read(stage,'nonregional-release-contract.test.mjs');
const candidate=read(website,'tests/nonregional-release-contract.test.mjs');
const preimageSha='aafa775313fbe5859a9749f868f9d643d1899adeac936d327a5d989bf0cc1a33';
const seams=[
  [Buffer.from('assert.equal(source.sourceCommit,pin.source);'),Buffer.from('assert.equal(source.sourceCommit,pin.runtimeSources[source.module]);')],
  [Buffer.from('assert.equal(manifest.sourceCommit,pin.source);'),Buffer.from('assert.equal(manifest.sourceCommit,pin.runtimeSources[source.module]);')],
];
const replaceOnce=(bytes,from,to)=>{
  const at=bytes.indexOf(from);
  assert.notEqual(at,-1,'Required seam exists');
  assert.equal(at,bytes.lastIndexOf(from),'Required seam is unique');
  return Buffer.concat([bytes.subarray(0,at),to,bytes.subarray(at+from.length)]);
};
assert.equal(sha(preimage),preimageSha,'Exact complete raw preimage');
assert.equal(sha(candidate),preimageSha,'Candidate source unchanged');
let reconstructed=preimage;
for(const [from,to] of seams)reconstructed=replaceOnce(reconstructed,from,to);
assert.deepEqual(proposal,reconstructed,'Only two intended assertions changed');
let inverse=proposal;
for(const [from,to] of seams)inverse=replaceOnce(inverse,to,from);
assert.deepEqual(inverse,preimage,'Every original byte reconstructs');

const requireHash=(bytes,expected,label)=>assert.equal(sha(bytes),expected,label+' changed or unknown');
const helperSha='52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5';
const pinSha='db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f';
const helper=read(website,'tests/current-atlas-delivery.mjs');
const pinBytes=read(website,'tests/fixtures/current-atlas-delivery.json');
requireHash(helper,helperSha,'Strict current validator');
requireHash(pinBytes,pinSha,'Current source pin');
const pin=JSON.parse(pinBytes);
assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
const modules=['shoulder','female-pelvis','lower-limb'];
const inventoryBytes=read(website,'lib/atlas-model-inventory.json');
requireHash(inventoryBytes,pin.documents['lib/atlas-model-inventory.json'],'Inventory');
const inventory=JSON.parse(inventoryBytes);
assert.deepEqual(inventory.sources.filter(row=>row.module!=='head-neck').map(row=>row.module),modules);
for(const module of modules){
  assert.equal(pin.runtimeSources[module],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  const row=inventory.sources.find(row=>row.module===module);
  assert.equal(row.sourceCommit,pin.runtimeSources[module]);
  const path=`public/atlas-runtime/${module}/manifest.json`;
  requireHash(read(website,path),pin.documents[path],module+' manifest');
  assert.equal(row.manifestSha256,pin.documents[path]);
  assert.equal(JSON.parse(read(website,path)).sourceCommit,pin.runtimeSources[module]);
}
const changed=Buffer.from(candidate);changed[0]^=1;
assert.notEqual(sha(changed),preimageSha,'Modified current test refused');
assert.notEqual(sha(Buffer.concat([helper,Buffer.from(' ')])),helperSha,'Modified validator refused');
assert.notEqual(sha(Buffer.concat([pinBytes,Buffer.from(' ')])),pinSha,'Modified pin refused');
console.log(JSON.stringify({result:'PASS_SOURCE_ONLY',preimageSha,proposalSha:sha(proposal),seams:2,modules,negativeRefusals:3}));
