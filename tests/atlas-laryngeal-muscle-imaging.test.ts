import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('laryngeal muscle CT/MRI drafts reach the shared viewer without new geometry or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'2e956520237c8639142d2dad44ea46edb7eb03e1e0a3f3ac95a21ee984b775af');
  assert.equal(manifest.sourceCommit,'944f57b801471c3b005a64ec83314188b2f06cf5');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256]of Object.entries({
    'app/body-content.ts':'8abdc0e09da92457bfa3c483ea8004cd5ef155621ff0b4fb3770e83ca2624502',
    'content/laryngeal-muscle-imaging.ts':'0a9c09e86550b6253c4796ef1f91cfc743d3029d098f2ebdd66bb34c40b9b7cb',
    'lib/laryngeal-muscle-imaging.ts':'2a00cc7372638c9cbf096f62327fb4e387e75db6cca4897cdb21f37bb18bcade',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of [
    'The posterior cricoarytenoid can be visible behind the cricoid;',
    'On MRI, locate the expected lateral cricoarytenoid region',
    'On MRI, orient to the expected transverse bridge behind both arytenoids;',
    'On MRI, consider the expected oblique route between opposite arytenoids;',
    'High-resolution cadaveric MRI supports anatomical research, not routine in-vivo visibility of each muscle.',
    'No imaging study loaded. This source surface is not registered to a CT or MRI acquisition.',
    'Atlas, case and paid-lecture access remain independent.',
    'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC7056085/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC8349453/',
  ])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','c9d149f603b5254a9b20744b6633cd4980133dbb:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});
