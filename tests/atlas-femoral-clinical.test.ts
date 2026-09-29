import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

test('named femoral clinical drafts retain exact source inputs, model limits and independent access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'9fe5ab420dbe49c45bd8b72e2b6ba83a87cb9840bd27c7aeed2436e9f20f5a3b');
  assert.equal(manifest.sourceCommit,'bd700a5528dd4b2a62653f530d3f474de1f8b5bb');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(input=>input.path==='content/femoral-component-teaching.ts'),[
    {path:'content/femoral-component-teaching.ts',sha256:'89dea170f1e583aa0d59806c1b210aaed8f39f0d02a32616b255fa0f25cb9dd4'},
  ]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of [
    'The selected lateral circumflex femoral component provides parent-vessel context for anterolateral thigh flap anatomy.',
    'No pseudoaneurysm, wall defect, bleeding, fracture or implant is represented in this reference model.',
    'Component-specific clinical teaching awaits review.',
    'https://pubmed.ncbi.nlm.nih.gov/29922539/',
    'https://aott.org.tr/index.php/pub/article/view/4018',
    'Atlas, case and paid-lecture access remain independent.',
  ])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','9d9106d3066cda7bf8359db98d29eed1fce94a28:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
