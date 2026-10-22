import test from 'node:test';
import assert from 'node:assert/strict';
test('parent containing native subtests',async t=>{
 await t.test('first child',()=>assert.equal(1,1));
 await t.test('second child',()=>assert.equal(2,2));
});
