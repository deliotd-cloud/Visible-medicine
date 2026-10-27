import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import test from 'node:test';import {restoreRegionalDurationCatalogue} from './regional-duration-source-inverse.mjs';
const current=readFileSync('lib/regional-learning-catalogue.ts','utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
test('entire current catalogue inverses only the authored duration addition',()=>{assert.equal(sha(restoreRegionalDurationCatalogue(current)),'ce8ed296310c459fac979b4d8f1f52745e46a0877ec10801a728aeaebeedba93');});
test('changes to admission, order, bounds or duration and foreign additions cannot pass',()=>{
 for(const [from,to]of [["tour.status!=='draft'","false"],['tour.steps.map','tour.steps.reverse().map'],['continuousPlaybackMs<=24*60*60*1000','true'],['guidedPlaybackDuration(step.caption,step.durationMs,1)','0']]){
  assert(current.includes(from));assert.throws(()=>restoreRegionalDurationCatalogue(current.replace(from,to)));
 }
 assert.throws(()=>restoreRegionalDurationCatalogue(current+'\n// foreign\n'));
 assert.throws(()=>restoreRegionalDurationCatalogue(restoreRegionalDurationCatalogue(current)));
});
