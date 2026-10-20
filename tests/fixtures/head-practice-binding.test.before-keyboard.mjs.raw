import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import test from 'node:test';

const root=fileURLToPath(new URL('../',import.meta.url));
const before=readFileSync(new URL('./fixtures/head-practice-binding.before.mjs.raw',import.meta.url),'utf8');
const candidate=readFileSync(join(root,'scripts/bind-clinical-review.mjs'),'utf8');
const added="  'components/HeadAtlasPractice.tsx','components/HeadAtlasPracticeReview.tsx','components/HeadPracticeSummaryDownload.tsx',\n  'lib/head-atlas-practice.ts','lib/head-practice-summary.ts','lib/head-practice-learning.ts','lib/head-practice-review-filter.ts','lib/head-study-set.ts','lib/head-atlas-focus.ts','lib/head-atlas-geometry.mjs',\n";
const paths=[
  'components/HeadAtlasPractice.tsx','components/HeadAtlasPracticeReview.tsx','components/HeadPracticeSummaryDownload.tsx',
  'lib/head-atlas-practice.ts','lib/head-practice-summary.ts','lib/head-practice-learning.ts',
  'lib/head-practice-review-filter.ts','lib/head-study-set.ts','lib/head-atlas-focus.ts','lib/head-atlas-geometry.mjs',
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const immutableFiles=new Map();
const originalFile=file=>{
  if(!immutableFiles.has(file))immutableFiles.set(file,readFileSync(join(root,file)));
  return immutableFiles.get(file);
};

function run(source,overrides=new Map()){
  const writes=new Map();
  // Execute the exact binder body with only its two declared native imports
  // supplied. This stays compatible with the normal serial Node test runner.
  for(const statement of [
    "import { readFileSync, writeFileSync, readdirSync } from 'node:fs';",
    "import { createHash } from 'node:crypto';",
  ]){
    assert.equal(source.split(statement).length,2,'One exact native import');
    source=source.replace(statement,'');
  }
  assert(!/^\s*import\s/m.test(source),'Unexpected binder import');
  new Function('readFileSync','writeFileSync','readdirSync','createHash','console',source)(
    file=>overrides.get(file)??originalFile(file),
    (file,value)=>writes.set(file,value),
    (file,options)=>readdirSync(join(root,file),options),createHash,{log(){}});
  assert.deepEqual([...writes.keys()].sort(),[
    'atlas-review/content/body-renderer-revision.json','atlas-review/integration-inputs.json',
    'atlas-review/manifest.json','atlas-review/content/review-revisions.json',
  ].sort(),'Only derived source bindings may be written, never saved decisions');
  return {
    inputs:JSON.parse(writes.get('atlas-review/integration-inputs.json')),
    body:JSON.parse(writes.get('atlas-review/content/body-renderer-revision.json')),
    shoulder:JSON.parse(writes.get('atlas-review/content/review-revisions.json')),
    manifest:JSON.parse(writes.get('atlas-review/manifest.json')),
  };
}

function exactCoverage(result){
  const counts=new Map();
  for(const input of result.inputs.inputs)counts.set(input.path,(counts.get(input.path)??0)+1);
  for(const file of paths){
    assert.equal(counts.get(file),1,`Missing or duplicate bound input: ${file}`);
    assert.equal(result.inputs.inputs.find(input=>input.path===file).sha256,hash(readFileSync(join(root,file))),`Wrong exact source hash: ${file}`);
  }
  assert.equal(new Set(result.inputs.inputs.map(input=>input.path)).size,result.inputs.inputs.length);
  assert.equal(result.inputs.sha256,hash(JSON.stringify(result.inputs.inputs)));
}

test('practice binding retains the original binder and covers every new source and mutation',()=>{
  assert.equal(hash(before),'0ead614d03c5f0d9c7f4589a6ad5767a0efc95a97206932a8bfd0d1dc150e0f3');
  assert.equal(candidate.split(added).length,2);
  assert.equal(candidate.replace(added,''),before,'Complete original binder byte inverse');
  const baseline=run(before),bound=run(candidate);
  exactCoverage(bound);
  assert.notEqual(bound.inputs.sha256,baseline.inputs.sha256);
  const old=new Map(baseline.inputs.inputs.map(input=>[input.path,input.sha256]));
  for(const input of bound.inputs.inputs)if(old.has(input.path))assert.equal(input.sha256,old.get(input.path),`Existing input retained: ${input.path}`);
  assert.equal(bound.inputs.inputs.length,baseline.inputs.inputs.length+paths.length);
  const originalBody=JSON.parse(readFileSync(join(root,'atlas-review/content/body-renderer-revision.json')));
  const originalShoulder=JSON.parse(readFileSync(join(root,'atlas-review/content/review-revisions.json')));
  assert.equal(bound.body.sourceRendererSha256,baseline.body.sourceRendererSha256);
  assert.equal(bound.body.sourceRendererSha256,originalBody.sourceRendererSha256??originalBody.sha256);
  assert.deepEqual(bound.shoulder.sourceRevisions,baseline.shoulder.sourceRevisions);
  assert.deepEqual(bound.shoulder.sourceRevisions,originalShoulder.sourceRevisions??originalShoulder.revisions);
  assert.equal(bound.manifest.revision,baseline.manifest.revision);
  for(const file of paths){
    const changed=Buffer.concat([readFileSync(join(root,file)),Buffer.from('\nmutation')]);
    const mutated=run(candidate,new Map([[file,changed]]));
    assert.notEqual(mutated.inputs.sha256,bound.inputs.sha256,`Mutation escaped binding: ${file}`);
    assert.equal(mutated.inputs.inputs.find(input=>input.path===file).sha256,hash(changed));
    const quoted=`'${file}',`;
    assert.equal(candidate.split(quoted).length,2);
    assert.throws(()=>exactCoverage(run(candidate.replace(quoted,''))),/Missing or duplicate bound input/);
    assert.throws(()=>exactCoverage(run(candidate.replace(quoted,quoted+quoted))),/Missing or duplicate bound input/);
  }
});
