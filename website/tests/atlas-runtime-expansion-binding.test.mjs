import test from 'node:test';
import {replayPartition5History} from './partition5-history-context.mjs';

test('historical binder expansion replays every original case and inverse against its authenticated epoch',()=>{
 replayPartition5History('atlas-runtime-expansion-binding.test.mjs');
});
