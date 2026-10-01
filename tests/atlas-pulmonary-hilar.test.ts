import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('shared runtime carries both source-pinned pulmonary-hilar studies without new assets or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'bc989060f3f77ed46da11d5092ee1aebac08dec5453b47c4fa0a643eb1101410');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'43072a948beda597e7a62439e8c093aa76cb94a7');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/dissection-data.ts':'e4612894eda280188f24aa96ea4095795ead893ff5509a4e07d0389a5623e6e4',
    'content/thoracic-hilar-study.ts':'29337537b45c066543ef0ee4010c4d6dfe2ca985b09726f3fc894535c34c4ac8',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const marker of ['right-pulmonary-hilum','left-pulmonary-hilum',
    'Right pulmonary hilum: bronchus & vessels','Left pulmonary hilum: bronchus & vessels',
    'FMA7395','FMA7396','FMA50872','FMA50873','FMA49914','FMA49916','FMA49911','FMA49913',
    'joined lumen or ostia','revision-bound radiologist review'])assert.ok(runtime.includes(marker),marker);
  const before=JSON.parse(execFileSync('git',['show','910edaccb90328881614f582bc99e8416627f5b7:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
});
