import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import{restoreBeforeHeadHistoryProjectionRoot,projectHeadEpoch}from'./head-epoch-projections.mjs';
test('head-history root preserves all original bytes and rejects stale or changed proofs',()=>{
 const bytes=readFileSync(new URL('./head-history-role-preservation.test.mjs',import.meta.url)),prior=restoreBeforeHeadHistoryProjectionRoot(bytes);
 assert.notDeepEqual(bytes,prior);assert.throws(()=>restoreBeforeHeadHistoryProjectionRoot(prior));assert.throws(()=>restoreBeforeHeadHistoryProjectionRoot(Buffer.concat([bytes,Buffer.from('foreign')])));
});
for(const[name,file]of [['native','head-native-history-current-transition.test.mjs'],['coverage','current-190-coverage.test.mjs'],['delivery','current-atlas-delivery.test.mjs']])test('exact source epoch refuses old or altered inputs: '+name,()=>{
 const bytes=readFileSync(new URL('./'+file,import.meta.url)),prior=projectHeadEpoch(name,bytes);assert.notDeepEqual(bytes,prior);
 if(name==='delivery')assert.equal(createHash('sha256').update(bytes).digest('hex'),'2bb765ce69cd47ca7821ba2320ac16659f9c0fc154939d82772228f75ec5f67d','Current bound head-focus successor is exact');
 assert.throws(()=>projectHeadEpoch(name,prior));assert.throws(()=>projectHeadEpoch(name,Buffer.concat([bytes,Buffer.from('foreign')])));assert.throws(()=>projectHeadEpoch('unknown',bytes));
});
