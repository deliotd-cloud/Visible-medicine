import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{restoreLaterDisclosureHarness}from'./head-disclosure-later-harness-inverse.mjs';
const names=['head-image-history.test.ts','head-mask-picking-ui.test.ts','head-slice-keyboard.test.ts','head-slice-zoom.test.ts','head-view-history-client.test.mjs'];
for(const name of names)test('exact later harness projection rejects stale and altered inputs: '+name,()=>{
 const current=readFileSync(new URL('./'+name,import.meta.url)),prior=restoreLaterDisclosureHarness(name,current);
 assert.notDeepEqual(prior,current);assert.throws(()=>restoreLaterDisclosureHarness(name,prior));
 assert.throws(()=>restoreLaterDisclosureHarness(name,Buffer.concat([current,Buffer.from('\n// changed\n')])));
 const removed=Buffer.from(current.toString().replace('assert.','altered.'));assert.notDeepEqual(removed,current);assert.throws(()=>restoreLaterDisclosureHarness(name,removed));
 assert.throws(()=>restoreLaterDisclosureHarness('other-test.mjs',current));
});
