import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('four pulmonary-vein ultrasound drafts reach the viewer without geometry or access changes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'7a9a7688193dbe83b990a3d1db62de486b629d8abbc71db73bc0bfa7986b6a8e');
  assert.equal(manifest.sourceCommit,'2b23603b4d7c9978d763b49053ae26eb2fa8b8c3');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(input=>input.path==='content/central-vessel-imaging.ts'),[{path:'content/central-vessel-imaging.ts',sha256:'829915273c8d8f8f2b8fb064662d9cbf27d3cfa147701e00625f016fc830427a'}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of [
    'An apical TTE left-atrial view may show right upper pulmonary venous inflow.',
    'The mid-esophageal TEE left-atrial-appendage/left-upper-vein view can place the left superior vein beside the appendage;',
    'In the mid-esophageal right-pulmonary-vein TEE view, seek the inferior right vein separately from its superior neighbour.',
    'A left-pulmonary-vein TEE view provides left atrial orientation;',
    'Multiple source files do not establish separate veins or ostia; seeing the superior vein does not confirm inferior identification.',
    'No imaging study loaded. This source surface is not registered to a CT or MRI acquisition.',
    'Atlas, case and paid-lecture access remain independent.',
    'https://www.asecho.org/wp-content/uploads/2014/05/2013_Performing-Comprehensive-TEE.pdf',
    'https://www.asecho.org/wp-content/uploads/2019/01/2019_Comprehensive-TTE.pdf',
  ])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','c4a3c0f1e5c048f3ba709ed948623028e0955297:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),previous.sources.filter((s:{module:string})=>s.module!=='head-neck'));
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
});
