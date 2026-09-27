import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('deep-brain formative practice ships tested source without new models or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'4a1cd52077527da3aee3977de42035f9e43cc39c10f64b31818a66ad597b1975');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'a0b0d1b4a3d57c07c5d1f6593d7151bf3fc24f74');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/deep-brain-reasoning.ts':'0f18416cece4e887ff8916abf70667b6e9fcbbceff558863782e4e2038616a5f',
    'lib/reasoning-questions.ts':'06e537e4f2f283547ec90da3144b21db06415e347e692fb6b139cecf641affdf',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const key of ['caudate','putamen','pallidum','thalamus','lateral-geniculate','medial-geniculate'])assert.ok(runtime.includes('deep-brain-'+key),key);
  const before=JSON.parse(execFileSync('git',['show','83fa723ec2babaecdd71ecc4919928f94d03081a:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,before.models,'all original model bytes and protected paths remain identical');
  assert.equal(current.models.length,136);
});
