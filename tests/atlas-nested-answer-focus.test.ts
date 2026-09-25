import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional delivery includes verified nested answer focus with clinical and imaging gates closed',()=>{
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  const manifest=JSON.parse(bytes.toString());
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const registered=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
  assert(registered);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),registered.manifestSha256);
  assert.equal(manifest.sourceCommit,registered.sourceCommit);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(i=>i.path==='app/nested-practice.tsx'),[{
    path:'app/nested-practice.tsx',sha256:'b5541c479f67dd518556f99fd4ca6b8ceefad1a54dac3b29175798fe8dcdfb44',
  }]);
  assert(!inputs.some(i=>/test-nested-practice|\.local\//.test(i.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])
    assert.equal(manifest[flag],false);
});
