import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('posterior mediastinal study ships with exact sources and no new assets or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'092b067ac64f9bb74fcc55b3a9a0fe0b4598a39365b04ec73db0a91059e7b447');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'52f6789aac9bc2af51b7f08e8c669714e47f608a');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/dissection-data.ts':'d3e0910115090f048057fcf47cecd2a27666c0248dd31e8d67f4d068e08739bc',
    'content/posterior-mediastinal-study.ts':'d07a11bda4ab63ad6ba2098efa80d5afa676aece071352599385b37549516924',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const marker of ['posterior-mediastinal-conduits','Posterior mediastinum: oesophagus & vessels',
    'FMA7131','FMA87217','FMA4838','FMA4944','Both left and right side filters retain all four targets',
    'No joined lumen or complete mediastinum','source boundaries and relationships await revision-bound radiologist review'])assert.ok(runtime.includes(marker),marker);
  const before=JSON.parse(execFileSync('git',['show','d9ae25cfbeb161bcbae00afb20b96d943fb93eaf:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),before.sources.filter((s:{module:string})=>s.module!=='head-neck'));
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((model:{paths:string[]})=>model.paths).length,143);
});
