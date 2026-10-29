// The predecessor's executable assertions live in current-atlas-delivery.test.mjs.
// Its stale current-context copy is preserved below, not repinned or discarded.
// This exact inverse proves all non-transition assertions remain in the active root.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {predecessorDeliverySource} from './current-delivery-predecessor-inverse.mjs';
const current=readFileSync(new URL('./current-atlas-delivery.test.mjs',import.meta.url),'utf8');
const historical=readFileSync(new URL('./fixtures/current-delivery-replacement-ea2413.mjs.raw',import.meta.url),'utf8');
const sha=s=>createHash('sha256').update(s).digest('hex');
test('whole predecessor delivery contract survives the explicit current-source transition and final-case split',()=>{
 assert.equal(sha(historical),'ad5a1db42623b9a35d023c5b867a85a6cc776c8cf4982c1d2664628161bf900e');
 assert.equal(predecessorDeliverySource(current),historical);
});
test('predecessor mapping refuses removed refusal assertions or duplicated transition seams',()=>{
 assert.throws(()=>predecessorDeliverySource(current.replace("assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));",'')));
 assert.throws(()=>predecessorDeliverySource(current+"\n9cef8900417bf592d3130f6ff92bf3e748cb55fc"));
});
test('predecessor mapping refuses unreviewed current source identities and lost playback binding',()=>{
 assert.throws(()=>predecessorDeliverySource(current.replace('9cef8900417bf592d3130f6ff92bf3e748cb55fc','0'.repeat(40))));
 assert.throws(()=>predecessorDeliverySource(current.replace('assert.equal(preferences.length,1);','')));
});
