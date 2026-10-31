import assert from 'node:assert/strict';
import test from 'node:test';
import {lineDeltaHashes} from './release16-preservation-line-delta.mjs';

test('preservation line diff rejects an oversized matrix before allocation',()=>{
 const oversized=Buffer.from('x\n'.repeat(1500));
 assert.equal((oversized.toString().split('\n').length+1)**2,2_256_004);
 assert.throws(()=>lineDeltaHashes(oversized,oversized),/Line delta cell bound/);
});
