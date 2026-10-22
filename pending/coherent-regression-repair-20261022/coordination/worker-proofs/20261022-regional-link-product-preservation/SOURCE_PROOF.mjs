// Pure source-byte proof; imports no product or website test module.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {restoreRegionalMriInlinePrior} from './CODE/tests/regional-mri-inline-source-inverse.mjs';
const root=new URL('.',import.meta.url).pathname.replace(/^\/(?=[A-Z]:\/)/,'');
const product='F:/VisibleMedicine/staging/20261022-regional-mri-runtime-linking';
const sha=b=>createHash('sha256').update(b).digest('hex');
const current=readFileSync(join(product,'CODE/tests/regional-mri-inline-inspection.test.ts'));
const productRaw=readFileSync(join(product,'RAW/tests/regional-mri-inline-inspection.test.ts'));
const prior=readFileSync(join(root,'CODE/tests/fixtures/regional-mri-inline-prior/regional-mri-inline-inspection.test.ts.raw'));
const historical=readFileSync(join(root,'CODE/tests/fixtures/regional-mri-inline-prior/historical87ed.test.ts.raw'));
assert.equal(sha(current),'6467bfb098644b04464969d98cbae9f8ca2974d9a54c320d29af39c1c419e716','exact product proposed source');
assert.equal(sha(productRaw),'05435a2b21ff1036064bc5d8e83f6c11ff3990afa8360599050e0da49b4fcfd8','exact product frozen source');
assert.equal(sha(prior),'05435a2b21ff1036064bc5d8e83f6c11ff3990afa8360599050e0da49b4fcfd8','exact full CODE prior');
assert.deepEqual(productRaw,prior,'product RAW = witness predecessor');
assert.equal(sha(historical),'732bff1b7b9ffae2b3f2f4cbc54d8b38b6cd3fd7631aa5f2918a007bf1b2865f','exact historical87ed fixture');
assert.deepEqual(restoreRegionalMriInlinePrior(current),prior,'actual helper product→frozen whole-source inverse');
for(const mutant of [current.subarray(1),Buffer.concat([current,current]),
 Buffer.concat([current.subarray(0,1),Buffer.from([current[1]^1]),current.subarray(2)])])
 assert.throws(()=>restoreRegionalMriInlinePrior(mutant),'actual helper missing/duplicate/substitution refusal');
const bad=Buffer.concat([prior.subarray(0,1),Buffer.from([prior[1]^1]),prior.subarray(2)]);
assert.throws(()=>restoreRegionalMriInlinePrior(current,{readPrior:()=>bad}),'actual helper full fixture corruption refusal');

function once(source,before,after,label){
 const first=source.indexOf(before);
 assert.notEqual(first,-1,label+' missing seam');
 assert.equal(source.indexOf(before,first+before.length),-1,label+' duplicate seam');
 return source.slice(0,first)+after+source.slice(first+before.length);
}
let expected=historical.toString();
const historicalEdits=[
 [" const current='87ed7e343260c7df48a40d53503f25bbfd34cfa5';",
  " const current='190a63238eadcf906abe89dcbb6a67c88afe70b9';"],
 ["    'old 408 proof must not be admitted by current 87ed delivery');",
  "    'old 408 proof must not be admitted by current 190 delivery');"],
];
for(const [before,after] of historicalEdits)expected=once(expected,before,after,'historical87ed→190');
assert.deepEqual(Buffer.from(expected),prior,'original regional-link historical theorem retained');
for(const [before,after] of historicalEdits.toReversed())expected=once(expected,after,before,'190→historical87ed');
assert.deepEqual(Buffer.from(expected),historical,'full historical byte inverse');

const witnessName='regional-link-role-preservation-20261021.test.mjs';
const witnessRaw=readFileSync(join(root,'RAW/tests',witnessName));
const witnessCode=readFileSync(join(root,'CODE/tests',witnessName));
assert.equal(sha(witnessRaw),'252cd3796bcba91edd547a49a99bf25a26751f30881ef0deb8295615e853ed3b');
assert.equal(sha(witnessCode),'4f1e2acf53f5a814df453dc37c6fdc854bdb883e0beb6a5775f6b0ecc47bdb9d');
const witnessEdits=[
 ["import test from 'node:test';\n","import test from 'node:test';\nimport {restoreRegionalMriInlinePrior} from './regional-mri-inline-source-inverse.mjs';\n"],
 [" assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' must preserve the entire original test outside enumerated role seams');",
  " const current=readFileSync(join(here,name));\n const candidate=name==='regional-mri-inline-inspection.test.ts'\n  ?restoreRegionalMriInlinePrior(current):current;\n assert.deepEqual(candidate,Buffer.from(expected),name+' must preserve the entire original test outside enumerated role seams');"],
];
let projected=witnessRaw.toString();
for(const [before,after] of witnessEdits)projected=once(projected,before,after,'witness forward');
assert.deepEqual(Buffer.from(projected),witnessCode,'full witness forward equality');
for(const [before,after] of witnessEdits.toReversed())projected=once(projected,after,before,'witness inverse');
assert.deepEqual(Buffer.from(projected),witnessRaw,'full original witness byte inverse');
for(const mutant of [witnessCode.subarray(1),Buffer.concat([witnessCode,witnessCode]),
 Buffer.concat([witnessCode.subarray(0,1),Buffer.from([witnessCode[1]^1]),witnessCode.subarray(2)])])
 assert.notDeepEqual(mutant,Buffer.from(witnessCode),'witness source mutant refusal');
console.log('PASS: exact product→frozen→historical MRI source chain; actual inverse helper and mutants; complete witness forward/inverse; no native modules imported.');
