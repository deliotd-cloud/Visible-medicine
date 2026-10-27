import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
import{restoreHeadHistoryFlow}from'./head-history-flow-inverse.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const current=read('./head-image-history.test.ts'),spec=JSON.parse(read('./head-history-flow-inverse-hunks.json'));
test('history flow repair recovers every byte of the prior source, including assertions',()=>{
 assert.equal(sha(restoreHeadHistoryFlow(current)),'33f1aa202a5463e0899e58e6a10b552cd2cb44c5e91341bfe7988497fd62a2dc');
});
test('history repair refuses every one-byte hunk alteration',()=>{
 const lines=current.toString('utf8').split('\n');let count=0;
 for(const h of spec.hunks){const changed=lines.slice();changed[h.newStart]+=' ';assert.throws(()=>restoreHeadHistoryFlow(Buffer.from(changed.join('\n'))),/Exact current viewport harness/);count++;}assert(count>10);
});
test('history repair refuses stale source, non-buffer and appended assertions',()=>{
 assert.throws(()=>restoreHeadHistoryFlow(restoreHeadHistoryFlow(current)),/Exact current viewport harness/);
 assert.throws(()=>restoreHeadHistoryFlow(current.toString('utf8')),/Buffer source required/);
 assert.throws(()=>restoreHeadHistoryFlow(Buffer.concat([current,Buffer.from('\n')])),/Exact current viewport harness/);
});
