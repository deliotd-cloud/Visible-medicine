import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

// Proposal only. Install into candidate/tests after the frozen broad run ends.
const original=new URL('./fixtures/atlas-arterial-evidence-limits-before-current-admission.txt',import.meta.url);
const admitted=new URL('./atlas-arterial-evidence-limits.test.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15';
const currentSubjectSha6d7='d04a1842fc6b68f0b7be42a2d0206e93598b29e9d34c40ec7b5d3b1914296dbb';
const approvedSourceSha='d44aca96fd00b8b4ee926434acde3423ba2ca9d67197db3410f2e54908605627';
const previousSubjectSha='7b105f5146aab1653aedca9a7150a73733575f87e7e848063cb07e8faea9b843';
const currentSubjectSha='840d4ecb8bef4c4bf725f1cecd39fa6e53dfa9a7c4d2922a750851509806451a';
const unchangedTail="test('actual imported resolver, regional reader and Review worksheet agree; forged identities and packets fail'";

function replaceUnique(source,from,to){
 assert.equal(source.split(from).length,2,`One exact inverse: ${from.slice(0,70)}`);
 return source.replace(from,to);
}
function replaceBounded(source,start,end,to){
 assert.equal(source.split(start).length,2,`One exact inverse start: ${start.slice(0,70)}`);
 const a=source.indexOf(start);
 assert.equal(source.slice(a+start.length).split(end).length,2,`One following inverse end: ${end.slice(0,70)}`);
 const b=source.indexOf(end,a+start.length);
 assert.ok(b>a,`Ordered exact inverse: ${start.slice(0,70)}`);
 return source.slice(0,a)+to+source.slice(b);
}

test('arterial admission retains the complete prior contract across the native source epoch',()=>{
 const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);
 assert.equal(sha(originalBytes),originalSha,'Exact frozen original whole-test bytes');
 assert.equal(sha(admittedBytes),currentSubjectSha6d7,'Exact source6d7 arterial whole-test bytes');
 let source190=admittedBytes.toString('utf8');
 source190=replaceUnique(source190,
  '    assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);',
  '    assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);');
 source190=replaceUnique(source190,
  '    assert.equal(row.sourceCommit,pin.runtimeSources[name]);',
  '    assert.equal(row.sourceCommit,CURRENT_ATLAS_REVISION);');
 source190=replaceBounded(source190,
  '  const restored=adapted.replace(replacement,previous)\n',
  '  const atlas=currentAtlasDeliveryRoot();\n',
  "  assert.equal(adapted.replace(replacement,previous),original.toString(),\n    'All original source, history, identity, packet, storage and emitted-output assertions remain exact');\n");
 source190=replaceBounded(source190,
  "  const pin=validateCurrentAtlasDelivery();\n  const historical='190a63238eadcf906abe89dcbb6a67c88afe70b9';\n",
  "  assert.equal(git(atlas,'rev-parse','6036a7a59dcc1fd75eee4a23af34ca2a568d86b6^{commit}').toString().trim(),\n",
  "  assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n");
 source190=replaceUnique(source190,
  "  assert.equal(git(atlas,'merge-base','6036a7a59dcc1fd75eee4a23af34ca2a568d86b6',historical).toString().trim(),\n    '6036a7a59dcc1fd75eee4a23af34ca2a568d86b6','Feature source is ancestor of historical runtime epoch');\n",
  '');
 assert.equal(sha(Buffer.from(source190)),'f2c10d8ced49d7049860487cc202c12ed3725b96863cdea1e3b74745588aede6','Exact source190 arterial whole-test bytes');
 const source190Pin="  assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');";
 const source485Pin="  assert.equal(CURRENT_ATLAS_REVISION,'485df97c2530e8e81a8d39a5ee61073ce76d93db');";
 const nativeCurrent=source190;
 assert.equal(nativeCurrent.split(source190Pin).length,2,'One exact source190 epoch assertion');
 const after=nativeCurrent.replace(source190Pin,source485Pin);
 assert.equal(sha(Buffer.from(after)),currentSubjectSha,'Complete previous485 whole-test body reconstructs');
 const before=originalBytes.toString('utf8');
 const previousPin="  assert.equal(CURRENT_ATLAS_REVISION,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');";
 const currentPin="  assert.equal(CURRENT_ATLAS_REVISION,'485df97c2530e8e81a8d39a5ee61073ce76d93db');";
 assert.equal(after.split(currentPin).length,2,'One exact current-source epoch pin');
 const priorSubject=after.replace(currentPin,previousPin);
 assert.equal(sha(Buffer.from(priorSubject)),previousSubjectSha,'Complete prior admitted subject reconstructs');
 const marker="\ntest('original arterial Website contract survives the exact pre-MRA feature retention adapter'";
 assert.equal(priorSubject.split(marker).length,2,'One exact MRA lineage assertion');
 const adapter="    same(git(atlas,'show',`6036a7a59dcc1fd75eee4a23af34ca2a568d86b6:${path}`),git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";
 const previous="    same(committed,git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";
 const adapted=priorSubject.slice(0,priorSubject.indexOf(marker));
 assert.equal(adapted.split(adapter).length,2,'One exact pre-MRA source comparison');
 const preMra=adapted.replace(adapter,previous);
 assert.equal(sha(Buffer.from(preMra)),approvedSourceSha,'Complete prior reviewed arterial source reconstructs');
 assert(before.includes(unchangedTail));assert(preMra.includes(unchangedTail));
 assert.equal(preMra.slice(preMra.indexOf(unchangedTail)),before.slice(before.indexOf(unchangedTail)),
  'Original negative mutations, storage refusal and emitted-output test stay byte-exact');
 for(const proof of [
  "assert.equal(git(atlas,'rev-parse',`${source}^`).toString().trim(),baseline);",
  'same([changed,preserved],[4,9932]);',
  'assert.equal(refused,142);assert.equal(malformedPackets,16);',
  'assert.equal(storageCalls,0);',
 ]){
  assert(before.includes(proof));assert(preMra.includes(proof),proof);
 }
 assert(preMra.includes('assert.equal(compared,9936);'));
});
