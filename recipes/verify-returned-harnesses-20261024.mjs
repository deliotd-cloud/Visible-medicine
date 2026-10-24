// Independent, source-only proposal review. No application transpilation or IO simulation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const website='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const studio='F:/VisibleMedicine/staging/20261024-studio-draft-harness-repair';
const binder='F:/VisibleMedicine/staging/20261024-binder-history-repair';
const read=path=>fs.readFileSync(path);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(read(path));
const source=read(website+'/../SOURCE_BOUND.json');
assert.equal(sha(source),'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
const rows=new Map(JSON.parse(source).sourceRows.map(row=>[row.path,row]));
function exact(relative,bytes){
  const row=rows.get(relative);assert.ok(row,relative);
  assert.equal(bytes.length,row.bytes,relative);assert.equal(sha(bytes),row.sha256,relative);
}
function replaceOnce(text,from,to){assert.equal(text.split(from).length,2,from);return text.replace(from,to);}
function removeLine(text,line){
  const matches=[line+'\r\n',line+'\n'].filter(item=>text.includes(item));
  assert.equal(matches.length,1);return replaceOnce(text,matches[0],'');
}
const studioSeams={
  'studio-course-draft-discard.test.mjs':[
    ["const realDraftDependencies = loadStudioDraftDependencies(new URL('../', import.meta.url), ts);",null],
    ['    ...realDraftDependencies,',"    '../lib/studio-session-drafts.ts': requireSite('../lib/studio-session-drafts.ts'),"],
  ],
  'studio-draft-scope.test.mjs':[
    ['const realDraftDependencies = loadStudioDraftDependencies(source, ts);',null],
    ["  new Function('require', 'module', 'exports', code)((name) => {\n    if (name === '../lib/studio-mutation-context.ts') return stableMutationContext;\n    if (Object.hasOwn(imports, name)) return imports[name];\n    if (Object.hasOwn(realDraftDependencies, name)) return realDraftDependencies[name];\n    throw new Error(`Unexpected Studio compile import: ${name}`);\n  }, module, module.exports);","  new Function('require', 'module', 'exports', code)((name) => name === '../lib/studio-mutation-context.ts' ? stableMutationContext : imports[name] ?? require(name), module, module.exports);"],
  ],
};
function studioInverse(name,bytes){
  let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);
  const line=name==='studio-draft-scope.test.mjs'
    ?"import {loadStudioDraftDependencies} from './studio-draft-dependency-source.mjs';"
    :"import { loadStudioDraftDependencies } from './studio-draft-dependency-source.mjs';";
  text=removeLine(text,line);
  for(const [after,before] of studioSeams[name])text=before===null?removeLine(text,after):replaceOnce(text,after,before);
  exact('tests/'+name,Buffer.from(text));return Buffer.from(text);
}
function binderInverse(bytes){
  let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);
  const title="test('current binder independently binds every later Review, private-reference and head input without changing source or approval',()=>{";
  const approved=read(binder+'/candidate/tests/atlas-runtime-expansion-binding.test.mjs');
  assert.equal(sha(approved),'8e0185da3020249853a6704f5bec0f0e02c98cae0ecc9344aa59bf87c098087f');
  assert.equal(text.split(title).length,2);
  assert.equal(text.slice(text.indexOf(title)),approved.toString().slice(approved.toString().indexOf(title)),'complete declared new case, no unknown appended bytes');
  text=text.slice(0,text.indexOf(title));
  text=removeLine(text,"import {historicalBinderBytes,currentBinderBytes,currentAddedBinderInputs,assertCurrentBinderSourceDelta,assertRealCurrentInputs} from './binder-history-controls.mjs';");
  text=replaceOnce(text,'const proposal=historicalBinderBytes().toString();',"const proposal=read('scripts/bind-clinical-review.mjs').toString();");
  text=removeLine(text,'assertRealCurrentInputs();');
  // The append introduced exactly one blank separator after the original EOF.
  assert.ok(text.endsWith('\r\n')||text.endsWith('\n'));
  const original=read(website+'/tests/atlas-runtime-expansion-binding.test.mjs');
  const suffix=text.slice(original.length);assert.ok(suffix==='\n'||suffix==='\r\n');
  text=text.slice(0,original.length);exact('tests/atlas-runtime-expansion-binding.test.mjs',Buffer.from(text));
  return Buffer.from(text);
}

test('Studio full-file inverses preserve all twenty original cases and their complete suffixes',()=>{
  const inverse=json(studio+'/INVERSE.json');
  for(const row of inverse.restoreWholeFiles){
    const name=row.candidate.split('/').at(-1),candidate=read(studio+'/'+row.candidate);
    const before=read(studio+'/'+row.preimage);exact('tests/'+name,before);
    assert.equal(sha(candidate),row.candidateSha256);assert.equal(sha(before),row.preimageSha256);
    assert.deepEqual(studioInverse(name,candidate),before);
    const body=bytes=>bytes.subarray(bytes.indexOf(Buffer.from('test(')));
    assert.deepEqual(body(candidate),body(before));assert.equal(sha(body(candidate)),row.originalTestSectionSha256);
    assert.equal((candidate.toString().match(/^test\(/mg)||[]).length,name.includes('discard')?8:12);
  }
});

test('Studio inverse refuses assertion deletion and undeclared source changes',()=>{
  for(const name of Object.keys(studioSeams)){
    const bytes=read(studio+'/candidate/tests/'+name),text=bytes.toString();
    for(const changed of [text+'\n// undeclared',text.replace('assert.equal(', 'assert.notEqual('),text.replace('loadStudioDraftDependencies(source, ts)','loadStudioDraftDependencies(source, null)').replace("loadStudioDraftDependencies(new URL('../', import.meta.url), ts)","loadStudioDraftDependencies(new URL('../', import.meta.url), null)")])
      assert.throws(()=>studioInverse(name,Buffer.from(changed)));
  }
});

test('binder originals reconstruct exactly; historical bytes and all 38 real current input identities are authentic',()=>{
  const candidate=read(binder+'/candidate/tests/atlas-runtime-expansion-binding.test.mjs');
  assert.equal(sha(candidate),'8e0185da3020249853a6704f5bec0f0e02c98cae0ecc9344aa59bf87c098087f');
  const before=read(binder+'/preimage/atlas-runtime-expansion-binding.test.mjs');
  assert.deepEqual(binderInverse(candidate),before);
  const fixtureBytes=read(binder+'/candidate/tests/fixtures/binder-history-20261024.json');
  assert.equal(sha(fixtureBytes),'634943d1384052b71fcac402fa27acfde9d7c8fb165b60a194ae787b10ee8609');
  const fixture=JSON.parse(fixtureBytes),historicalReceipt=read(fixture.historical.receipt);
  assert.equal(sha(historicalReceipt),fixture.historical.receiptSha256);
  const historicalRow=JSON.parse(historicalReceipt).sourceRows.find(row=>row.path===fixture.historical.binderPath);
  const historical=read(binder+'/candidate/'+fixture.historical.binderFixturePath);
  assert.equal(sha(historical),historicalRow.sha256);assert.equal(historical.length,historicalRow.bytes);
  assert.equal(sha(historical),fixture.historical.binderSha256);
  exact(fixture.current.binderPath,read(website+'/'+fixture.current.binderPath));
  assert.equal(fixture.realCurrentInputRows.length,38);
  for(const row of fixture.realCurrentInputRows){const bytes=read(website+'/'+row.path);exact(row.path,bytes);assert.equal(sha(bytes),row.sha256);assert.equal(bytes.length,row.bytes);}
  for(const changed of [Buffer.concat([candidate,Buffer.from('\n')]),Buffer.from(candidate.toString().replace('assert.equal(', 'assert.notEqual('))])assert.throws(()=>binderInverse(changed));
});

test('Studio real-module loader refuses unexpected executable imports without transpiling the application',async()=>{
  const path=studio+'/candidate/tests/studio-draft-dependency-source.mjs';
  assert.equal(sha(read(path)),'7dcc1e1b0bc35519b8b3790d6d422377f73c667744a0dfd6edf40ea93c00a6b5');
  const {loadStudioDraftDependencies}=await import(pathToFileURL(path));
  // A deliberately hostile compiler stand-in checks only the require guard.
  // This is not execution or acceptance of the actual TypeScript application.
  const standIn={ModuleKind:{CommonJS:1},ScriptTarget:{ES2022:1},transpileModule(){return {outputText:"require('undeclared-module')"};}};
  assert.throws(()=>loadStudioDraftDependencies(pathToFileURL(website+'/'),standIn),/Unexpected real Studio dependency import/);
  for(const relative of ['lib/studio-session-drafts.ts','lib/studio-release-note-recovery.ts']){
    const bytes=read(website+'/'+relative);exact(relative,bytes);
    assert.ok(!/^import\s(?!type\b)/m.test(bytes.toString()),'no omitted executable dependency');
  }
});
