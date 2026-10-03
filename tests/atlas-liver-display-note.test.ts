import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('regional export binds the liver display note without claiming segment validation',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'8117b8423c52def3be7591264420b2cdeb319adcf0e125932104aacf0bc5aa99');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'6d5caefe7cc90c03c16775126c939ac31956d90e');
  for(const flag of ['clinicalApproved','patientDataIncluded','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);

  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(input=>input.path==='lib/organ-anatomy-curriculum.ts')?.sha256,
    '78279373aa15a8a239f133514cbb47ebb4e86657d77e299ac630603cafcedf1a');
  const runtime=emittedTeaching(base,manifest.files);
  assert.ok(runtime.includes('The liver display aggregate excludes the separately selectable hepatic artery proper, right hepatic vein and left hepatic vein surfaces.'));
  assert.ok(runtime.includes('Source coordinates are unchanged; segment boundaries and clinical accuracy are unvalidated.'));
});
