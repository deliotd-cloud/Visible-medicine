import assert from 'node:assert/strict';
import test from 'node:test';
import {guardCurrentDelivery,runOriginalRole} from './neck-renal-original-context.mjs';

test('complete original two-case neck delivery transition runs in its authenticated source context',async()=>{
  guardCurrentDelivery();
  const result=await runOriginalRole('neck-transition');
  assert.equal(result.counts.tests,2);
});
test('the neck delivery transition remains historical under the fixed current role',()=>{
  const pin=guardCurrentDelivery();
  assert.notEqual(pin.source,'389bd0ca846a42c7f21055f55904bcf5df81a09f');
});
