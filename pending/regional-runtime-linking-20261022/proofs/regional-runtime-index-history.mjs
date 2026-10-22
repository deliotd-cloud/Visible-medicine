// Pure source-byte proof; no website test, validator, bundle, or production module is executed.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {restoreRegionalReferenceIndexPrior} from './CODE/tests/regional-reference-index-source-inverse.mjs';
// This is the already-selected, pure prior-stage proof of 4f1e → original and MRI inline → historical.
import '../20261022-regional-link-product-preservation/SOURCE_PROOF.mjs';

const stage=dirname(fileURLToPath(import.meta.url));
const selected='F:/VisibleMedicine/staging/20261022-regional-link-product-preservation';
const frozen='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(path);
const rawIndex=read(join(stage,'RAW/tests/regional-reference-review-index.test.ts'));
const currentIndex=read(join(stage,'CODE/tests/regional-reference-review-index.test.ts'));
const priorFixture=read(join(stage,'CODE/tests/fixtures/regional-reference-index-prior/regional-reference-review-index.test.ts.raw'));
assert.equal(sha(rawIndex),'9aa23fa7e8f91752145f5b3c1e4f9e99b77b8982032cc4df136dcc189cdc8811');
assert.equal(sha(currentIndex),'bc6c4172fe97f496320cb4d3170c83aeccbaa68f6b13b9786804fb2dd0f2e589');
assert.deepEqual(rawIndex,priorFixture,'full CODE prior fixture equals frozen current test');
assert.deepEqual(rawIndex,read(join(frozen,'tests/regional-reference-review-index.test.ts')));
assert.deepEqual(restoreRegionalReferenceIndexPrior(currentIndex),rawIndex,'actual helper new index → full selected input');
for(const mutant of [currentIndex.subarray(1),Buffer.concat([currentIndex,currentIndex]),
 Buffer.concat([currentIndex.subarray(0,1),Buffer.from([currentIndex[1]^1]),currentIndex.subarray(2)])])
 assert.throws(()=>restoreRegionalReferenceIndexPrior(mutant),'actual helper rejects missing/duplicate/substituted index source');
const badFixture=Buffer.concat([rawIndex.subarray(0,1),Buffer.from([rawIndex[1]^1]),rawIndex.subarray(2)]);
assert.throws(()=>restoreRegionalReferenceIndexPrior(currentIndex,{readPrior:()=>badFixture}),'actual helper rejects corrupt full fixture');

const selectedWitness=read(join(stage,'RAW/tests/regional-link-role-preservation-20261021.test.mjs'));
const finalWitness=read(join(stage,'CODE/tests/regional-link-role-preservation-20261021.test.mjs'));
assert.equal(sha(selectedWitness),'4f1e2acf53f5a814df453dc37c6fdc854bdb883e0beb6a5775f6b0ecc47bdb9d');
assert.equal(sha(finalWitness),'05f854f0315e7e83cc7af9d9d72971708a5ff42830bac5fd316496bad86c60c3');
assert.deepEqual(selectedWitness,read(join(selected,'CODE/tests/regional-link-role-preservation-20261021.test.mjs')));
function once(source,before,after,label){
 assert.equal(source.split(before).length-1,1,label+' unique exact seam');
 return source.replace(before,after);
}
const witnessEdits=[
 ["import {restoreRegionalMriInlinePrior} from './regional-mri-inline-source-inverse.mjs';\n",
  "import {restoreRegionalMriInlinePrior} from './regional-mri-inline-source-inverse.mjs';\nimport {restoreRegionalReferenceIndexPrior} from './regional-reference-index-source-inverse.mjs';\n"],
 ["  ?restoreRegionalMriInlinePrior(current):current;",
  "  ?restoreRegionalMriInlinePrior(current):name==='regional-reference-review-index.test.ts'\n   ?restoreRegionalReferenceIndexPrior(current):current;"],
];
let projected=selectedWitness.toString('utf8');
for(const [before,after] of witnessEdits)projected=once(projected,before,after,'selected → final witness');
assert.deepEqual(Buffer.from(projected),finalWitness,'complete final witness forward reconstruction');
for(const [before,after] of witnessEdits.toReversed())projected=once(projected,after,before,'final → selected witness');
assert.deepEqual(Buffer.from(projected),selectedWitness,'complete selected witness restored');
for(const mutant of [finalWitness.subarray(1),Buffer.concat([finalWitness,finalWitness]),
 Buffer.concat([finalWitness.subarray(0,1),Buffer.from([finalWitness[1]^1]),finalWitness.subarray(2)])])
 assert.notDeepEqual(mutant,finalWitness,'whole witness equality refuses source mutant');

// Existing selected witness independently authenticates its original 508a historical index fixture.
const historical=read(join(frozen,'tests/fixtures/regional-link-before-role-batch-20261021/regional-reference-review-index.test.ts.raw'));
assert.equal(sha(historical),'508a9df7dda87e65ccf6cee49fc289d88ad2d3ca26e1388896b35563865320ad');
const expectedDigests=[
 'e99b3f131ae2e7da2d5854127c0280253339c85fdff8d71dda0aef96436e96b4',
 '4d22913d3ac58cb122033fcf1f62bf39cabdd95772b55b54269f6f0cda23090f',
 'a7581bf14139bcabdc60b8de70768907261a340ec104013b74d8d8e57a4c39a4',
 'dc2520e613b19fed6f441ab82794fe8d3d8ff135b4271a93d47e9070a946a186',
 'a3f37792be262ffa37c239b80fbdc1556786e40c8f193ce037f1fa63d46f56ca',
];
for(const digest of expectedDigests)assert(currentIndex.toString('utf8').includes(digest),'historical mapping or teaching digest retained');
assert.equal((currentIndex.toString('utf8').match(/^test\('/gm)||[]).length,(rawIndex.toString('utf8').match(/^test\('/gm)||[]).length,'all registered test titles retained');
console.log('PASS: exact new index → selected prior → authenticated historical chain; final witness → selected witness → original selected proof; helper and fixture mutants; source bytes only.');
