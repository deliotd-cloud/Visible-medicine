import test from 'node:test';
import {replayHistorical9eRoot} from './historical-9e-ui-replay.mjs';

test('historical 9e head pan Review binding replays all eight original cases',()=>
 replayHistorical9eRoot('head-pan-review-binding.test.mjs'));
