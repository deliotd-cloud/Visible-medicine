import test from 'node:test';
import {guardCurrentDelivery,runOriginalRole} from './neck-renal-original-context.mjs';

test('complete original renal delivery transition runs in its authenticated source context',async()=>{
  guardCurrentDelivery();
  await runOriginalRole('renal-transition');
});
