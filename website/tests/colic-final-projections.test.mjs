import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{projectColicDrawableEpoch,restoreBeforeColicFinalCompositionRoot}from'./colic-final-projections.mjs';
for(const[file,project]of [['drawable-epoch-current-admission.test.mjs',projectColicDrawableEpoch],['colic-adapter-inverse.test.mjs',restoreBeforeColicFinalCompositionRoot]])test('exact colic projection rejects stale and changed bytes: '+file,()=>{
 const current=readFileSync(new URL('./'+file,import.meta.url)),prior=project(current);assert(!current.equals(prior));
 assert.throws(()=>project(prior));assert.throws(()=>project(Buffer.concat([current,Buffer.from('foreign')])));
 const changed=Buffer.from(current);changed[0]^=1;assert.throws(()=>project(changed));
});
