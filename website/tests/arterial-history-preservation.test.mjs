import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION} from 'file:///F:/VisibleMedicine/staging/20261024-adjacent-regression-current/website/tests/current-atlas-delivery.mjs';

// Proposal only. Install into candidate/tests after the frozen broad run ends.
const original=new URL('./fixtures/atlas-arterial-evidence-limits-before-current-admission.txt',import.meta.url);
const admitted=new URL('./atlas-arterial-evidence-limits.test.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15';
const currentSubjectSha6d7='d04a1842fc6b68f0b7be42a2d0206e93598b29e9d34c40ec7b5d3b1914296dbb';
const approvedSourceSha='d44aca96fd00b8b4ee926434acde3423ba2ca9d67197db3410f2e54908605627';
const previousSubjectSha='7b105f5146aab1653aedca9a7150a73733575f87e7e848063cb07e8faea9b843';
const currentSubjectSha='840d4ecb8bef4c4bf725f1cecd39fa6e53dfa9a7c4d2922a750851509806451a';
const renalSubjectSha='35aa317814977114af7caf761ca5b4504b319b92a76e3e18dd8b281fa50d608d';
const renalSubjectRevision='2381efe43b75f8a7fb768a069eecd7268c508dac';
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

// The subject is a historical renal admission proof. Restore its one declared
// scalar from the exact 2381 source role, independent of current b79 delivery.
function nativeSource6d7(bytes){
 bytes=restoreReleaseDiagnosticContext('tests/atlas-arterial-evidence-limits.test.mjs',bytes);
 const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text,'utf8'),bytes);
 assert.equal(sha(bytes),renalSubjectSha,'Complete immutable renal-era subject');
 const currentPin="  assert.equal(CURRENT_ATLAS_REVISION,'"+renalSubjectRevision+"');";
 const closedPin="  assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');";
 const restored=Buffer.from(replaceUnique(text,currentPin,closedPin));
 assert.equal(sha(restored),currentSubjectSha6d7,'Complete closed6d7 subject after only the current native-source scalar inverse');
 return restored;
}

test('arterial admission retains the complete prior contract across the native source epoch',()=>{
 assert.equal(CURRENT_ATLAS_REVISION,'b79e110d2d28f18993263926ba35aa7a3f478b20','Explicit current source remains separately bound');
 const originalBytes=readFileSync(original),admittedBytes=nativeSource6d7(readFileSync(admitted));
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

test('native role restoration refuses source edits outside its one declared scalar',()=>{
 const bytes=readFileSync(admitted);
 assert.equal(sha(nativeSource6d7(bytes)),currentSubjectSha6d7);
 assert.throws(()=>nativeSource6d7(Buffer.concat([bytes,Buffer.from('/* foreign source */')])));
 const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>nativeSource6d7(changed));
 const originalAssertion='assert.equal(refused,142);';
 const historical=nativeSource6d7(bytes).toString('utf8');
 assert.equal(historical.split(originalAssertion).length,2,'One exact historical refusal assertion');
 const weakened=historical.replace(originalAssertion,'assert.equal(refused,141);');
 assert.notEqual(sha(Buffer.from(weakened)),currentSubjectSha6d7,'Historical assertion change cannot match bound whole source');
 assert.throws(()=>nativeSource6d7(Buffer.from(weakened)));
});

test('a foreign native-source scalar cannot be admitted by the historical inverse',()=>{
 const text=restoreReleaseDiagnosticContext('tests/atlas-arterial-evidence-limits.test.mjs',readFileSync(admitted)).toString(),native="assert.equal(CURRENT_ATLAS_REVISION,'"+renalSubjectRevision+"');";
 assert.equal(text.split(native).length,2);
 assert.throws(()=>nativeSource6d7(Buffer.from(text.replace(native,"assert.equal(CURRENT_ATLAS_REVISION,'"+'0'.repeat(40)+"');"))));
});
