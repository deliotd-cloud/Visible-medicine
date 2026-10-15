import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';
const compiled=await build({stdin:{contents:"export * from './lib/guided-playback';export {withSpecimenGuidedPlayback} from './lib/specimen-guided-dissection';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(api.GUIDED_SWEEP_MS,8000);assert.equal(api.GUIDED_MIN_STEP_MS,24000);assert.equal(api.GUIDED_CAPTION_WORDS_PER_MINUTE,180);
for(const authored of [undefined,0,-1,NaN,Infinity,14000])assert.equal(api.guidedPlaybackDuration('Short original caption.',authored),24000);
assert.equal(api.guidedPlaybackDuration('',60000),60000);
const long=Array(120).fill('anatomy').join(' ');assert.equal(api.guidedPlaybackDuration(long,14000),48000);
assert.equal(api.guidedPlaybackDuration('one\t two\nthree',0),24000);
assert.deepEqual(api.GUIDED_PLAYBACK_RATES,[0.5,1,1.5,2,3]);
for(const rate of api.GUIDED_PLAYBACK_RATES){
 assert.equal(api.isGuidedPlaybackRate(rate),true);
 assert.equal(api.guidedSweepDuration(rate),Math.ceil(8000/rate));
 assert.equal(api.guidedPlaybackDuration('Short original caption.',14000,rate),Math.ceil(24000/rate));
 assert.equal(api.guidedPlaybackDuration(long,14000,rate),Math.ceil(48000/rate));
 assert(api.guidedPlaybackDuration('Short',0,rate)>api.guidedSweepDuration(rate));
}
for(const invalid of [null,undefined,NaN,Infinity,-1,0,0.1,4,'2',{},[]]){
 assert.equal(api.isGuidedPlaybackRate(invalid),false);
 assert.equal(api.guidedSweepDuration(invalid),8000);
 assert.equal(api.guidedPlaybackDuration('Short',0,invalid),24000);
}
const steps=[{caption:'One short stop.',durationMs:14000},{caption:long},{caption:'Third',durationMs:90000}],before=structuredClone(steps);
assert.deepEqual(api.guidedPlaybackEvidence(steps),{version:1,start:'explicit-play-full-tour',transition:'quintic-orbit',transitionMs:8000,minimumStepMs:24000,captionWordsPerMinute:180,stepDurationsMs:[24000,48000,90000],final:'hold',reducedMotion:'no-camera-sweep'});
assert.deepEqual(steps,before);
const first=api.guidedPlaybackEvidence(steps);first.stepDurationsMs[0]=1;
assert.equal(api.guidedPlaybackEvidence(steps).stepDurationsMs[0],24000);
const plan={id:'synthetic-future-guide',title:'Synthetic future guide',status:'draft',specimenKey:'test',sourceFrame:'test',limitation:'Synthetic only.',steps:[{id:'first',title:'First',caption:long,ids:['test-id'],selectedId:'test-id',view:'anterior'}]};
const planBefore=structuredClone(plan),future=api.withSpecimenGuidedPlayback(plan);
assert.deepEqual(future.continuousPlayback,api.guidedPlaybackEvidence(plan.steps));
assert.deepEqual(plan,planBefore);future.steps[0].caption='Mutated copy';
assert.deepEqual(plan,planBefore);assert.equal(api.withSpecimenGuidedPlayback(plan).continuousPlayback.stepDurationsMs[0],48000);
console.log(JSON.stringify({verdict:'pass',slowSweepMs:8000,minimumStepMs:24000,longCaptionMs:48000,originalStepsPreserved:true,newTourDefaults:true}));
