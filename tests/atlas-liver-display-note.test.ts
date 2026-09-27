import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('regional export binds the liver display note without claiming segment validation',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'6924d4885726bb9a14e7a0db9849c5d204312404924169b15dfb68e6070a8723');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'14581a6e2cbf82d8d57e98290c7d7b63c5bf3cb1');
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
