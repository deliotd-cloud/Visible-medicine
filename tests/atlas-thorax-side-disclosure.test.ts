import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('shared Thorax focus discloses compound midline source limits under either side filter',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'01098b2fa54c4c08f044137eacddff123f54e51235fd50c933db03bc75664aa3');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'c55db3aba23f5f260ef09955b470650a8485800a');
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
  assert.equal(sha(inventoryBytes),'e6e07066329d93c212692e7ce84b0fe02a70fbbf6db404301bba32da0420e746');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
