import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('shared Thorax focus discloses compound midline source limits under either side filter',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'a3c561888fe760f3e3620737439203c7eeffe1f89fa25ce77cf5b6aa8d044474');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'64c1afa92b21c432b1c7f7817d67a616f3e129d3');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(row=>row.path==='content/thorax-respiratory-study.ts')?.sha256,
    '4631768eb5bf6e210231e0e3e9e3ba43a2fd6eccb23fda415c2964c964e9c0ba');
  assert.ok(!inputs.some(row=>/native-mr|local-mr-study|\.vmmr/i.test(row.path)),
    'private MRI checker remains outside the regional export');
  const scripts=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'));
  const runtime=scripts.map(file=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return bytes.toString();
  }).join('\n');
  for(const phrase of [
    'respiratory-wall-overview',
    'respiratory-intercostal-comparison',
    'respiratory-diaphragm',
    'Left and right filters retain the same midline-labelled compound source surfaces; neither filter isolates a side.',
    'neither hemidiaphragm is separately selectable',
    'not rib-space subdivisions, contraction, or breathing motion',
    'Anatomical relationships require revision-bound radiologist review',
  ])assert.ok(runtime.includes(phrase),phrase);
  const inventoryBytes=readFileSync('lib/atlas-model-inventory.json');
  assert.equal(sha(inventoryBytes),'553b5cbef2807ae8911e79d651d91d101f3372bd3af874e4a3a947c1a9492bd2');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,136);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,143);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
