import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';
import {restoreSpinalOriginalRuntime} from './spinal-current-runtime-inverse-1031.mjs';
import {restoreQuestionFamilyPrior} from './question-source-family-inverse.mjs';
const name='clinical-review-spinal-disc-ultrasound.test.ts',current=readFileSync(new URL('./'+name,import.meta.url));
test('spinal runtime update preserves the entire earlier lesson and source contract',()=>{
 assert.equal(restoreSpinalOriginalRuntime(current).includes(Buffer.from("assert.equal(pin.runtimeSources.shoulder,revision)")),true);
 assert.deepEqual(restoreQuestionFamilyPrior(name,current),readFileSync(new URL('./fixtures/question-family-prior/'+name+'.raw',import.meta.url)));
});
test('altered lesson, source and refusal checks cannot pass the spinal inverse',()=>{
 for(const from of ['assert.equal(entries.length,19);',"assert.equal(lesson.readiness,'draft',id);",'assert.equal(response.status,409,']){
  assert(current.toString().includes(from));assert.throws(()=>restoreSpinalOriginalRuntime(Buffer.from(current.toString().replace(from,from+'/* changed */'))));
 }
 assert.throws(()=>restoreSpinalOriginalRuntime(Buffer.concat([current,Buffer.from('\n// unrelated')])));
});
