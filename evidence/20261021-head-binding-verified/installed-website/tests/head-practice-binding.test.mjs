import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import test from 'node:test';
import {inflateSync} from 'node:zlib';

const root=fileURLToPath(new URL('../',import.meta.url));
const before=readFileSync(new URL('./fixtures/head-practice-binding.before.mjs.raw',import.meta.url),'utf8');
const candidate=readFileSync(join(root,'scripts/bind-clinical-review.mjs'),'utf8');
const historic=readFileSync(new URL('./fixtures/head-binding-before-role-batch-20261021/practice-binder-after-keyboard.mjs.raw',import.meta.url),'utf8');
const added="  'components/HeadAtlasPractice.tsx','components/HeadAtlasPracticeReview.tsx','components/HeadPracticeSummaryDownload.tsx',\n  'lib/head-atlas-practice.ts','lib/head-practice-summary.ts','lib/head-practice-learning.ts','lib/head-practice-review-filter.ts','lib/head-study-set.ts','lib/head-atlas-focus.ts','lib/head-atlas-geometry.mjs',\n";
const keyboardAdded="  'lib/head-index-keyboard.ts',\n";
const fullAdded=added+keyboardAdded;
const paths=[
  'components/HeadAtlasPractice.tsx','components/HeadAtlasPracticeReview.tsx','components/HeadPracticeSummaryDownload.tsx',
  'lib/head-atlas-practice.ts','lib/head-practice-summary.ts','lib/head-practice-learning.ts',
  'lib/head-practice-review-filter.ts','lib/head-study-set.ts','lib/head-atlas-focus.ts','lib/head-atlas-geometry.mjs',
];
paths.push('lib/head-index-keyboard.ts');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const witnessRoot='./fixtures/head-binding-before-role-batch-20261021/';
function decodeHistorical(encoded,length,sha256){
  assert(encoded.length<200000 && /^[A-Za-z0-9+/]+={0,2}\n$/.test(encoded),'Bounded canonical base64 witness');
  const compressed=Buffer.from(encoded.trim(),'base64');
  assert.equal(compressed.toString('base64')+'\n',encoded,'Canonical base64 encoding');
  const bytes=inflateSync(compressed,{maxOutputLength:length});
  assert.equal(bytes.length,length,'Exact historical witness byte length');
  assert.equal(hash(bytes),sha256,'Exact historical witness SHA-256');
  return bytes;
}
function historicalBytes(name,length,sha256){
  return decodeHistorical(readFileSync(new URL(witnessRoot+name+'.deflate-base64.raw',import.meta.url),'utf8'),length,sha256);
}
const historicalManifest=historicalBytes('practice-manifest-before-keyboard.json',376467,'1e3de01b08f3d1e9fefc3510f4996eb6e23615a5a23587f2d9d2e555dd0a1350');
const historicalBody=historicalBytes('practice-body-before-keyboard.json',214575,'191995f1f55843c4fc8f0996939da2313d76dd5dd2bf7526ff93f0d6753323fc');
const historicalRevisions=historicalBytes('practice-revisions-before-keyboard.json',12713,'25b9e20fe175ab4b75d8482929bb93e62725c4537c19a1f195968cf94f3bc99e');
const historicalBeforeInputs=JSON.parse(historicalBytes('practice-inputs-before-keyboard.json',266682,'0f82510f9243fa4615cf43a210bcdd4e284e6a4d771ab1e5ec17667eb867a746'));
const historicalAfterInputs=JSON.parse(historicalBytes('practice-inputs-after-keyboard.json',266822,'acbad30ecf452317221384c708022b3f5f2d4c3e8042ca82e572f91507bb43d7'));
const historicalOverride=new Map([
  ['atlas-review/manifest.json',historicalManifest],
  ['atlas-review/content/body-renderer-revision.json',historicalBody],
  ['atlas-review/content/review-revisions.json',historicalRevisions],
]);
test('historical witness decoder refuses malformed, oversized, and digest-altered input',()=>{
  const encoded=readFileSync(new URL(witnessRoot+'practice-revisions-before-keyboard.json.deflate-base64.raw',import.meta.url),'utf8');
  assert.throws(()=>decodeHistorical('!\n',12713,'25b9e20fe175ab4b75d8482929bb93e62725c4537c19a1f195968cf94f3bc99e'));
  assert.throws(()=>decodeHistorical(encoded,12712,'25b9e20fe175ab4b75d8482929bb93e62725c4537c19a1f195968cf94f3bc99e'));
  assert.throws(()=>decodeHistorical(encoded,12713,'0'.repeat(64)));
});
const immutableFiles=new Map();
const originalFile=file=>{
  if(!immutableFiles.has(file))immutableFiles.set(file,readFileSync(join(root,file)));
  return immutableFiles.get(file);
};

function run(source,overrides=new Map(),historicalInputs=null){
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
    file=>overrides.get(file)??(historicalInputs?.has(file)?historicalInputs.get(file):originalFile(file)),
    (file,value)=>writes.set(file,value),
    (file,options)=>historicalInputs ? historicalBeforeInputs.inputs
      .map(input=>input.path).filter(path=>path.startsWith(file+'/'))
      .map(path=>path.slice(file.length+1)).filter(path=>options?.recursive || !path.includes('/'))
      : readdirSync(join(root,file),options),createHash,{log(){}});
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

function runHistorical(source,overrides=new Map()){
  const inputs=new Map(historicalOverride);
  // Match the original test's same-run resolver: executed body varies, but
  // the bound source file is the unchanged archived candidate in each run.
  inputs.set('scripts/bind-clinical-review.mjs',Buffer.from(historic));
  return run(source,overrides,inputs);
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

test('historical practice binder inverse and current binding cover every new source and mutation',()=>{
  assert.equal(hash(before),'0ead614d03c5f0d9c7f4589a6ad5767a0efc95a97206932a8bfd0d1dc150e0f3');
  assert.equal(hash(historic),'ab50acaf277aec8b7385b342c4c1a36fc607a351e1612e482ec6d95d6da7f5b7');
  assert.equal(historic.split(fullAdded).length,2);
  assert.equal(historic.replace(fullAdded,''),before,'Complete original binder byte inverse');
  const baseline=runHistorical(before),bound=runHistorical(historic);
  exactCoverage(bound);
  assert.notEqual(bound.inputs.sha256,baseline.inputs.sha256);
  const old=new Map(baseline.inputs.inputs.map(input=>[input.path,input.sha256]));
  for(const input of bound.inputs.inputs)if(old.has(input.path))assert.equal(input.sha256,old.get(input.path),`Existing input retained: ${input.path}`);
  assert.equal(bound.inputs.inputs.length,baseline.inputs.inputs.length+paths.length);
  const originalBody=JSON.parse(historicalBody);
  const originalShoulder=JSON.parse(historicalRevisions);
  assert.equal(bound.body.sourceRendererSha256,baseline.body.sourceRendererSha256);
  assert.equal(bound.body.sourceRendererSha256,originalBody.sourceRendererSha256??originalBody.sha256);
  assert.deepEqual(bound.shoulder.sourceRevisions,baseline.shoulder.sourceRevisions);
  assert.deepEqual(bound.shoulder.sourceRevisions,originalShoulder.sourceRevisions??originalShoulder.revisions);
  assert.equal(bound.manifest.revision,baseline.manifest.revision);
  const current=run(candidate);
  exactCoverage(current);
  const currentRecorded=JSON.parse(readFileSync(join(root,'atlas-review/integration-inputs.json')));
  assert.equal(current.inputs.sourceCommit,currentRecorded.sourceCommit);
  assert.equal(current.inputs.sha256,currentRecorded.sha256,'Current binder matches recorded source binding');
  for(const file of paths){
    const changed=Buffer.concat([readFileSync(join(root,file)),Buffer.from('\nmutation')]);
    const mutated=run(candidate,new Map([[file,changed]]));
    assert.notEqual(mutated.inputs.sha256,current.inputs.sha256,`Mutation escaped binding: ${file}`);
    assert.equal(mutated.inputs.inputs.find(input=>input.path===file).sha256,hash(changed));
    const quoted=`'${file}',`;
    assert.equal(candidate.split(quoted).length,2);
    assert.throws(()=>exactCoverage(run(candidate.replace(quoted,''))),/Missing or duplicate bound input/);
    assert.throws(()=>exactCoverage(run(candidate.replace(quoted,quoted+quoted))),/Missing or duplicate bound input/);
  }
});

// Keyboard binding extension inverse proof
test('extended test preserves the complete executable ten-input test',()=>{
  const oldTest=readFileSync(new URL('./fixtures/head-practice-binding.test.before-keyboard.mjs.raw',import.meta.url),'utf8');
  assert.equal(hash(oldTest),'9f0eacd8f13c2845c239ba73fbd2bd4ad6216587eba11f1f2f6fb227557bb069');
  const liveTest=readFileSync(new URL(witnessRoot+'head-practice-binding.test.mjs.raw',import.meta.url),'utf8');
  assert.equal(hash(liveTest),'2419b38ce72e3c4a6ba292a2d94029b8b0707375d221d4abf5bdf2c6d72a16f9');
  const proofMarker='\n// Keyboard binding extension inverse proof\n';
  assert.equal(liveTest.split(proofMarker).length,2,'One appended inverse proof');
  let inverse=liveTest.split(proofMarker)[0];
  for(const [withKeyboard,original] of [
    ["const keyboardAdded=\"  'lib/head-index-keyboard.ts',\\n\";\nconst fullAdded=added+keyboardAdded;\n",''],
    ["paths.push('lib/head-index-keyboard.ts');\n",''],
    ['candidate.split(fullAdded)','candidate.split(added)'],
    ["candidate.replace(fullAdded,'')","candidate.replace(added,'')"],
  ]){
    assert.equal(inverse.split(withKeyboard).length,2,`One test extension seam: ${withKeyboard}`);
    inverse=inverse.replace(withKeyboard,original);
  }
  assert.equal(inverse,oldTest,'Complete archived old test byte inverse; its assertions still execute above');
  assert.equal(historic.split(keyboardAdded).length,2,'One historical keyboard binding line');
  const oldBinding=runHistorical(historic.replace(keyboardAdded,''));
  const newBinding=runHistorical(historic);
  assert.equal(oldBinding.inputs.inputs.length,1695,'All previously bound inputs');
  assert.equal(newBinding.inputs.inputs.length,1696,'Exactly one additional keyboard input');
  const newInputs=new Map(newBinding.inputs.inputs.map(input=>[input.path,input.sha256]));
  for(const input of oldBinding.inputs.inputs){
    assert.equal(newInputs.get(input.path),input.sha256,`Previous input retained: ${input.path}`);
  }
  assert.equal(newInputs.size,1696,'No duplicate bound paths');
  for(const input of newBinding.inputs.inputs){
    assert.equal(input.sha256,hash(input.path==='scripts/bind-clinical-review.mjs'?Buffer.from(historic):originalFile(input.path)),`Same-run source bytes bound: ${input.path}`);
  }
  assert.equal(newInputs.get('scripts/bind-clinical-review.mjs'),hash(historic));
  assert.notEqual(hash(historic),hash(historic.replace(keyboardAdded,'')),'Binder source changed for new input');
  for(const [archive,count,binderHash] of [
    [historicalBeforeInputs,1695,'b99a1e205774d68c5d8c65cf70e6e0f93e82a06e620177ea345aaacd66092bad'],
    [historicalAfterInputs,1696,hash(historic)],
  ]){
    assert.equal(archive.sourceCommit,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
    assert.equal(archive.inputs.length,count,'Authentic source-path inventory count');
    assert.equal(archive.sha256,hash(JSON.stringify(archive.inputs)),'Authentic source-path inventory digest');
    assert.equal(archive.inputs.find(input=>input.path==='scripts/bind-clinical-review.mjs').sha256,binderHash);
  }
  assert.deepEqual(oldBinding.inputs.inputs.map(input=>input.path),historicalBeforeInputs.inputs.map(input=>input.path));
  assert.deepEqual(newBinding.inputs.inputs.map(input=>input.path),historicalAfterInputs.inputs.map(input=>input.path));
  const archivedOld=new Map(historicalBeforeInputs.inputs.map(input=>[input.path,input.sha256]));
  const archivedNew=new Map(historicalAfterInputs.inputs.map(input=>[input.path,input.sha256]));
  assert.equal(archivedOld.has('lib/head-index-keyboard.ts'),false);
  assert.equal(archivedNew.has('lib/head-index-keyboard.ts'),true);
  assert.deepEqual([...archivedOld].filter(([path,digest])=>archivedNew.get(path)!==digest).map(([path])=>path),[
    'components/head-atlas.css','components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs',
  ],'The archived snapshots also contain the genuine contemporaneous CSS/viewer changes');
});
