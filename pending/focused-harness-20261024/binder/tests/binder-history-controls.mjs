// Test-only exact binder source roles. No product code or saved Review decisions.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

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
 const bytes=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url));
 assert.equal(sha(bytes),fixture.current.binderSha256,'actual current binder at test root');
 return bytes;
}

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
  assert.equal(bytes.length,row.bytes,'source-bound input length: '+row.path);
  assert.equal(sha(bytes),row.sha256,'source-bound input hash: '+row.path);
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
