// Collector for the exact preserved original case and its complete historical delivery.
import test from 'node:test';
import {runOriginalEusDelivery} from './eus-original-delivery.mjs';
test('original three-topic EUS delivery remains exact at Atlas 6e810b',()=>{
 runOriginalEusDelivery();
});