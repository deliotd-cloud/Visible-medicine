import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('orbital ultrasound and compact Search are delivered without changing geometry or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'7a9a7688193dbe83b990a3d1db62de486b629d8abbc71db73bc0bfa7986b6a8e');
  assert.equal(manifest.sourceCommit,'2b23603b4d7c9978d763b49053ae26eb2fa8b8c3');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['content/orbital-neck-muscle-imaging.ts','d8273c7b122422a39bd5239bd07714a13e4497ec927f8e82c24d829d0552e67e'],
    ['lib/orbital-neck-muscle-imaging.ts','d087d792653bab1640f37f30cd4930d2c5f95e34c3bfa23cc06c6df7556e3262'],
    ['app/atlas-workspace.tsx','e8a1ac9aaf77f0745c872a61686af3e454bbe59274e937237d6daa72761a3b28'],
    ['app/atlas-workspace.css','aaa75b3e4e42a68ac944d70bbca7957eee4c3ba71c4413436cd9bc9f64841c4d'],
  ])assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const files=manifest.files as {path:string;sha256:string}[];
  const readBundle=(extension:string)=>files.filter(f=>f.path.endsWith(extension)).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  const runtime=readBundle('.js'),css=readBundle('.css');
  for(const marker of [
    'Orient to the nasal side of the globe.',
    'Identify the temporal-side rectus independently of medial rectus.',
    'Superior rectus lies below levator.',
    'Identify the rectus below the globe.',
    'Relate a candidate oblique profile to the superomedial course and trochlear turn shown in Anatomy.',
    'Use the anterior medial origin and course below the globe to distinguish inferior oblique from an apex-based rectus.',
    'The thin levator lies above superior rectus and can be difficult to separate echographically.',
    'Image-orientation teaching only, not instructions for scanning an eye.',
    'No scan or spatial registration is connected.',
    'Paid-lecture access remains independent.',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC4250497/',
    'https://pubmed.ncbi.nlm.nih.gov/3062525/',
    'Search atlas','atlas-search-context',
  ])assert.ok(runtime.includes(marker),marker);
  assert.ok(/@media\s*\((?:max-width:\s*380px|width\s*<=\s*380px)\)/.test(css),'Compiled narrow-screen breakpoint is preserved');
  assert.ok(/\.atlas-search-context\{display:none\}/.test(css),'Only the redundant visible Search context is hidden');
  const previous=JSON.parse(execFileSync('git',['show','ba52f9e84f559ac3405737ccc0a0fe22d10831d3:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),previous.sources.filter((s:{module:string})=>s.module!=='head-neck'));
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
});
