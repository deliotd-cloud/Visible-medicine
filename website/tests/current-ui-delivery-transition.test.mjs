import test from 'node:test';
import {replayHistorical9eRoot} from './historical-9e-ui-replay.mjs';

test('historical 9e current UI transition replays all three original cases',()=>
 replayHistorical9eRoot('current-ui-delivery-transition.test.mjs'));
