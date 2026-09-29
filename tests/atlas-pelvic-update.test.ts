import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

test('pelvic framing and tributary imaging drafts are source-bound without new models or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'c5317420e5c183940e42f73606445595e826a09d33d31f5db777eaa759d95c58');
  assert.equal(manifest.sourceCommit,'e1aeae3e97e01fe059b7de505e3d901a4f6b3695');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256]of [
    ['content/pelvic-vein-teaching.ts','bfb85f8ecdea32105d9db39d8cc5e7466d0003347afa98c45adcb0b0b000c8db'],
    ['lib/regional-framing.ts','96c4e2c9690fdc93b3caadea4a36bad91a038e95ec7da08a362aadf142d8b575'],
  ])assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of [
    'Use the lower-lumbar region and iliac receiving veins to orient the selected iliolumbar segment.',
    'This is an orientation note, not an iliolumbar ultrasound protocol.',
    'Orient the obturator venous region using the superior pubic ramus and the iliac systems.',
    'Use the superior pubic ramus to understand where an obturator-to-external-iliac venous communication may lie;',
    'Start with the anterior sacrum and sacral foramina to orient the right lateral sacral region.',
    'Use the sacrum, foramina and piriformis region as anatomical context for the selected right lateral sacral vein.',
    'The selected right lateral sacral segment provides anatomical context near the sacral foramina and piriformis region, not a validated ultrasound target.',
    'Source-bound teaching draft for radiologist review.',
    'No imaging study loaded. This source surface is not registered to a CT or MRI acquisition.',
    'Atlas, case and paid-lecture access remain independent.',
  ])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','91f615831c0882e553cf205ee1da53f59e11eeaf:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
