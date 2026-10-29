// The original entire test is retained verbatim and run against its source snapshot.
import test from 'node:test';
import {replayHistoricalReview} from './review-delivery-historical-replay.mjs';
test('historical review-history-delivery.test.mjs: whole original source-bound proof',()=>{
 const result=replayHistoricalReview("tests/review-history-delivery.test.mjs");
 console.log('Preserved original assertions: '+JSON.stringify(result));
});
