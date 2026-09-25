import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('deep-brain formative practice ships tested source without new models or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'fa0425fb3bdcfe1518f52abafd85ef051fb4a970fc673860b7736c4033bc7d19');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'885ea54f69991f0e2d265bcde0e6580ecdb13653');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'lib/deep-brain-reasoning.ts':'0f18416cece4e887ff8916abf70667b6e9fcbbceff558863782e4e2038616a5f',
    'lib/reasoning-questions.ts':'6607e3b7beb311e0de5caf248c566ab010c480f38819d59e781109bf5cebcdae',
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
