import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('regional spinal disc Function drafts reach the shared viewer without geometry or access changes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'ec8bd2cc47e9d09c449bc94be26d79783986dd4af17abb60fc1947ddfcd97bba');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'49db4337ad84bee7d1823050f5b90ed43cf647c1');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/body-content.ts':'7ca537e126e08bfb3622a1d54a99d83d724101b9a1fa2032734d5eca2513e457',
    'content/spinal-disc-function.ts':'1d7d5f9883edea19a2339dd0c7da90d711ea9df6c3dfede922dd380ca307d4ef',
    'lib/spinal-disc-function.ts':'402ffd000cf3566b9bee54b71bf3e6a135846ce5a0b77245f94b6deae0fd3607',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of [
    'This source-labelled cervical disc participates in load transfer during neck movement.',
    'This source-labelled thoracic disc contributes to load transfer within the thoracic column.',
    'This source-labelled lumbar disc helps distribute loads between vertebral bodies.',
    'one source level remains unresolved.',
    'Source names do not automatically assign a two-vertebra patient imaging interval.',
    'Revision-bound radiologist review is pending.',
    'Case, Atlas and lecture access remain independent.',
    'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2078298/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC7311578/',
    'https://pubmed.ncbi.nlm.nih.gov/8951017/',
  ])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','f7a09832ded47c0405ef378ad1d6a3f4ff223964:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});
