import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=dirname(fileURLToPath(import.meta.url));
const parent='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance/website';
const baseline=readFileSync(resolve(root,'atlas-arterial-evidence-limits.test.mjs.raw'));
const proposed=readFileSync(resolve(root,'tests/atlas-arterial-evidence-limits.test.mjs'));
const original=readFileSync(resolve(parent,'tests/fixtures/atlas-arterial-evidence-limits.before-mra-6036.mjs.raw'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const from="assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');";
const to="assert.equal(CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');";
const marker="\ntest('original arterial Website contract survives the exact pre-MRA feature retention adapter'";
const retained="    same(git(atlas,'show',`6036a7a59dcc1fd75eee4a23af34ca2a568d86b6:${path}`),git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";
const earlier="    same(committed,git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";

function check(candidate){
  const before=baseline.toString(),after=candidate.toString();
  assert.equal(sha(baseline),'d04a1842fc6b68f0b7be42a2d0206e93598b29e9d34c40ec7b5d3b1914296dbb');
  assert.equal(sha(original),'d44aca96fd00b8b4ee926434acde3423ba2ca9d67197db3410f2e54908605627');
  assert.equal(before.split(from).length,2,'One named current-source seam');
  assert.equal(after,before.replace(from,to),'Every byte outside the named source seam is retained');
  assert.equal(after.split(marker).length,2,'One retention adapter');
  const adapted=after.slice(0,after.indexOf(marker));
  assert.equal(adapted.split(retained).length,2,'One earlier feature retention seam');
  const restored=adapted.replace(retained,earlier)
    .replace('assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);',
      'assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);')
    .replace('assert.equal(row.sourceCommit,pin.runtimeSources[name]);',
      'assert.equal(row.sourceCommit,CURRENT_ATLAS_REVISION);');
  assert.equal(restored,original.toString(),'Full original Website contract inverse');
}

check(proposed);
const altered=proposed.toString().replace('assert.equal(refused,142)','assert.equal(refused,141)');
assert.notEqual(altered,proposed.toString());
assert.throws(()=>check(Buffer.from(altered)),'Mutation of original refusal assertion must fail');
const stale=proposed.toString().replace(to,from);
assert.notEqual(stale,proposed.toString());
assert.throws(()=>check(Buffer.from(stale)),'Mutation to stale source must fail');
const pin=JSON.parse(readFileSync(resolve(parent,'tests/fixtures/current-atlas-delivery.json')));
assert.equal(pin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
assert.equal(pin.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');
assert.equal(pin.reviewSourceFiles,1562);
assert.deepEqual(pin.runtimeSources,{'head-neck':pin.source,
  shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9',
  'lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
  'female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9'});
console.log(JSON.stringify({status:'source-only-pass',baselineSha256:sha(baseline),proposalSha256:sha(proposed),
  originalFixtureSha256:sha(original),fullFileInverse:true,refusalMutationRejected:true,staleSourceMutationRejected:true}));
