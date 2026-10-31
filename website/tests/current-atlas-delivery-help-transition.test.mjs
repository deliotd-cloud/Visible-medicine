import test from 'node:test';
import {replayPartition5History} from './partition5-history-context.mjs';

test('historical help transition replays all original source, pin and inverse assertions against its authenticated epoch',()=>{
 replayPartition5History('current-atlas-delivery-help-transition.test.mjs');
});
