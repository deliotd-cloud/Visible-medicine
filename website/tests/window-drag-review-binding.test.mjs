import test from 'node:test';
import {replayHistorical9eRoot} from './historical-9e-ui-replay.mjs';

test('historical 9e window drag Review binding replays all six original cases',()=>
 replayHistorical9eRoot('window-drag-review-binding.test.mjs'));
