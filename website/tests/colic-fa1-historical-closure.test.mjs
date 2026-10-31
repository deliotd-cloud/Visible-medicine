import test from 'node:test';
import {replayPartition5History} from './partition5-history-context.mjs';

test('historical fa1 closure replays both original assertions under the authentic 46-file validator',()=>{
 replayPartition5History('colic-fa1-historical-closure.test.mjs');
});
