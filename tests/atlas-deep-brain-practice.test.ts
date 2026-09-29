import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('deep-brain formative practice ships tested source without new models or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'11aacce3bf243a5ec4014c6065a8ee8571643c7197f862f3f6449df7d329bebb');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'a3f12f72d660bcbe7b27e172eaadafa8d9d09e44');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/deep-brain-reasoning.ts':'0f18416cece4e887ff8916abf70667b6e9fcbbceff558863782e4e2038616a5f',
    'lib/reasoning-questions.ts':'317c6dc0a84590c8075a7cd07f18824e8eba989cda6baaa10c57091f4588bd66',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const key of ['caudate','putamen','pallidum','thalamus','lateral-geniculate','medial-geniculate'])assert.ok(runtime.includes('deep-brain-'+key),key);
  const before=JSON.parse(execFileSync('git',['show','83fa723ec2babaecdd71ecc4919928f94d03081a:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models,'all original model bytes and protected paths remain identical');
  assert.equal(current.models.length,137);
});
