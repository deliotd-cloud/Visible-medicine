import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('regional export binds the liver display note without claiming segment validation',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'e21d3f8a844ac1260ee9b272ce1f0fc2124911b24e5846b327bcada42289540b');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'facf4a46d8a9380c890af16495a2c609ad74f5f3');
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(input=>input.path==='lib/organ-anatomy-curriculum.ts')?.sha256,
    '78279373aa15a8a239f133514cbb47ebb4e86657d77e299ac630603cafcedf1a');
  const bundle=(manifest.files as {path:string;sha256:string}[])
    .find(file=>file.path.startsWith('assets/slider-')&&file.path.endsWith('.js'));
  assert.ok(bundle,'teaching bundle');
  const bytes=readFileSync(base+bundle.path);
  assert.equal(sha(bytes),bundle.sha256);
  const runtime=bytes.toString();
  assert.ok(runtime.includes('The liver display aggregate excludes the separately selectable hepatic artery proper, right hepatic vein and left hepatic vein surfaces.'));
  assert.ok(runtime.includes('Source coordinates are unchanged; segment boundaries and clinical accuracy are unvalidated.'));
});
