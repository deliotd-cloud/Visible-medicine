import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('sided pes anserinus studies reach the shared viewer without geometry or access changes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'ec4786990f829d71819bc52f31c417946fbe7603563a5592102ccd3f29409024');
  assert.equal(manifest.sourceCommit,'acc99b3a2af285e068e0018b1644c4343ec1242b');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256]of Object.entries({
    'app/dissection-data.ts':'e4612894eda280188f24aa96ea4095795ead893ff5509a4e07d0389a5623e6e4',
    'content/pes-anserine-study.ts':'5de0780dc9640509da5cc0231b70e6186030e5b858821b0f2b4ea34d8d023388',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of ['right-pes-anserinus-muscle-convergence','left-pes-anserinus-muscle-convergence',
    'Right pes anserinus: muscle convergence','Left pes anserinus: muscle convergence',
    'Remove one, then Undo to restore it.','return separation to 0% to restore source positions.',
    'do not establish insertion order or tendon continuity, graft planning, or scan registration.',
    'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html'])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','7bed5b927ececa54d6f43168c204d0a77304dd55:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),previous.sources.filter((s:{module:string})=>s.module!=='head-neck'));
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
});
