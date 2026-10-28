// Test-only exact binder source roles. No product code or saved Review decisions.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePreKeyboardHelp} from './keyboard-help-source-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixtureBytes=readFileSync(new URL('./fixtures/binder-history-20261024.json',import.meta.url));
assert.equal(sha(fixtureBytes),'634943d1384052b71fcac402fa27acfde9d7c8fb165b60a194ae787b10ee8609');
const fixture=JSON.parse(fixtureBytes);
assert.equal(fixture.schema,'vm-binder-history-roles/1');

// Historical receipt and source-row hashes are authoring provenance. Runtime
// tests use a complete, immutable copy of those genuine historical bytes.
export function historicalBinderBytes(){
 assert.equal(fixture.historical.binderFixturePath,'tests/fixtures/binder-history-20261024/bind-clinical-review.mjs.raw');
 const bytes=readFileSync(new URL('./fixtures/binder-history-20261024/bind-clinical-review.mjs.raw',import.meta.url));
 assert.equal(bytes.length,fixture.historical.binderBytes);
 assert.equal(sha(bytes),fixture.historical.binderSha256,'authenticated historical binder fixture');
 return bytes;
}

export function currentBinderBytes(){
 assert.equal(fixture.current.binderPath,'scripts/bind-clinical-review.mjs');
 const bytes=readFileSync(new URL('./fixtures/binder-history-20261024/current-bind-clinical-review.mjs.raw',import.meta.url));
 assert.equal(sha(bytes),fixture.current.binderSha256,'actual current binder at test root');
 return bytes;
}

const helpSuccessors={
  'components/AtlasRuntimeFrame.tsx':{bytes:8962,sha256:'35ecba7a2f3bb94bb86f2d4a2662d3460bbfb04e93a080c1c3bbe711078ed75e'},
  'components/atlas-runtime-frame.css':{bytes:6222,sha256:'c4df9063e1d8577032fb4986ab0e8d114ad5e44824593b2e1f66f9fe42aef5bf'},
};
export function assertRealCurrentInputs(){
 const rows=fixture.realCurrentInputRows;
 assert.equal(rows.length,38);
 assert.equal(new Set(rows.map(row=>row.path)).size,rows.length);
 assert.deepEqual(rows.slice(3).map(row=>row.path),currentAddedBinderInputs());
 assert.deepEqual(rows.slice(0,3).map(row=>row.path),[
  'components/AtlasRuntimeFrame.tsx','components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',
 ]);
 for(const row of rows){
  const bytes=readFileSync(new URL('../'+row.path,import.meta.url));
  const successor=helpSuccessors[row.path];
  assert.equal(bytes.length,successor?.bytes??row.bytes,'source-bound input length: '+row.path);
  assert.equal(sha(bytes),successor?.sha256??row.sha256,'source-bound current input hash: '+row.path);
  const historical=row.path==='components/AtlasRuntimeFrame.tsx'
   ?Buffer.from(restorePreKeyboardHelp(bytes.toString('utf8')))
   :row.path==='components/atlas-runtime-frame.css'
    ?bytes.subarray(0,row.bytes)
    :bytes;
  assert.equal(historical.length,row.bytes,'authenticated historical input length: '+row.path);
  assert.equal(sha(historical),row.sha256,'authenticated historical input hash: '+row.path);
 }
}
export function currentAddedBinderInputs(){
 const groups=fixture.addedInputGroups;
 assert.deepEqual(Object.keys(groups).sort(),['privateReferencesAndAccess','guidedPacketInspection','headValidationAndNavigation'].sort());
 const paths=Object.values(groups).flat();
 assert.equal(paths.length,35);assert.equal(new Set(paths).size,paths.length);
 return paths;
}

export function assertCurrentBinderSourceDelta(historical,current){
 assert.equal(sha(historical),fixture.historical.binderSha256,'genuine two-input binder');
 assert.equal(sha(current),fixture.current.binderSha256,'exact current binder');
 const old=historical.toString('utf8'),now=current.toString('utf8');
 assert.deepEqual(Buffer.from(old),historical);assert.deepEqual(Buffer.from(now),current);
 const start='const adapterPaths = [',end='const inputs = [';
 const span=code=>{const a=code.indexOf(start),b=code.indexOf(end,a+start.length);
  assert(a>0&&b>a);assert.equal(code.indexOf(start,a+1),-1);assert.equal(code.indexOf(end,b+1),-1);
  return {prefix:code.slice(0,a),paths:code.slice(a,b),suffix:code.slice(b)};};
 const before=span(old),after=span(now);
 assert.equal(after.prefix,before.prefix,'all binder setup and source guards retained');
 assert.equal(after.suffix,before.suffix,'complete binding, revision and approval algorithm retained');
 assert.notEqual(after.paths,before.paths,'actual adapter graph advanced');
 return {historicalSha256:sha(historical),currentSha256:sha(current),declaredAdditionalPaths:currentAddedBinderInputs()};
}

const successorBinderSha256='13e794bca419bae893750261c197e14aa70e235675311833fd31fe7c120a157d';
const successorInputs=[
 ['components/atlas-runtime-state.ts',2134,'e407402b94c41b03fdec57cf0cdafe20e4d47515ff3b8e2dd0a071dd0d542b49'],
 ['components/AtlasIssueDetails.tsx',6490,'27417d1426e44fa250a98d08e83eadf54e5368724dc0b1609591421001694cab'],
 ['components/atlas-issue-details.css',1441,'dece33c030363b264b8756c03d79e072418fefa640c7dc01a8c94b1b2204b9cd'],
 ['lib/atlas-issue-context.ts',3630,'a6e42d112b75021a8c7c71862f26c826a16914dd08da991bb3ea407295b57c73'],
 ['components/HeadOtherViews.tsx',2731,'c7c78b27eba980396680e1601cc673e3a27b3e74de6103b6a0660a5ab96cc47b'],
 ['components/HeadImageLayoutControl.tsx',1306,'b05b57c48170efa434a3ab97009461e401c3e5727d7848d0ce241f1a27ebb38a'],
 ['lib/head-viewport-memory.ts',1049,'31e73078022e143ae16d2c82ac2ed5b6f27686b386581879543a1297ab0f732e'],
];
export function currentSuccessorAddedBinderInputs(){
 const paths=successorInputs.map(([path])=>path);
 assert.equal(paths.length,7);
 assert.equal(new Set(paths).size,paths.length);
 assert.equal(paths.filter(path=>currentAddedBinderInputs().includes(path)).length,0);
 return paths;
}
export function currentSuccessorBinderBytes(){
 const bytes=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url));
 assert.equal(bytes.length,10102,'exact successor binder length');
 assert.equal(sha(bytes),successorBinderSha256,'exact successor binder');
 return bytes;
}
export function assertRealSuccessorInputs(){
 for(const [path,length,expectedSha] of successorInputs){
  const bytes=readFileSync(new URL('../'+path,import.meta.url));
  assert.equal(bytes.length,length,'source-bound successor input length: '+path);
  assert.equal(sha(bytes),expectedSha,'source-bound successor input hash: '+path);
 }
}
export function assertCurrentBinderSuccessorDelta(historical,previous,successor){
 assertCurrentBinderSourceDelta(historical,previous);
 assert.equal(sha(successor),successorBinderSha256,'exact successor binder');
 const replacements=[
  ["'components/AtlasRuntimeFrame.tsx','components/AtlasBodyLearning.tsx','components/atlas-body-learning.css'",
   "'components/AtlasRuntimeFrame.tsx','components/AtlasBodyLearning.tsx','components/atlas-runtime-state.ts','components/atlas-body-learning.css'"],
  ["'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',",
   "'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n  'components/AtlasIssueDetails.tsx','components/atlas-issue-details.css','lib/atlas-issue-context.ts',"],
  ["'components/HeadAtlasViewer.tsx','lib/head-disclosure-keyboard.ts'",
   "'components/HeadAtlasViewer.tsx','components/HeadOtherViews.tsx','components/HeadImageLayoutControl.tsx','lib/head-disclosure-keyboard.ts'"],
  ["'lib/head-window-drag.ts','lib/head-practice-navigation.ts'",
   "'lib/head-window-drag.ts','lib/head-viewport-memory.ts','lib/head-practice-navigation.ts'"],
 ];
 let expected=previous.toString('utf8');
 for(const [before,after] of replacements){
  assert.equal(expected.split(before).length,2,'unique binder insertion seam');
  expected=expected.replace(before,after);
 }
 assert.equal(successor.toString('utf8'),expected,'only seven exact binder path insertions; all prior algorithm and paths retained');
 for(const path of currentSuccessorAddedBinderInputs())
  assert.equal(successor.toString('utf8').split("'"+path+"'").length,2,'new binder input occurs once: '+path);
 return {previousSha256:sha(previous),successorSha256:sha(successor),declaredAdditionalPaths:currentSuccessorAddedBinderInputs()};
}