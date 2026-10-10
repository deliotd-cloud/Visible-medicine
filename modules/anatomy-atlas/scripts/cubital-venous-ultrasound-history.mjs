// Frozen original author-epoch replay; no learner dispatch or clinical approval.
import assert from 'node:assert/strict';
import epoch from './cubital-venous-ultrasound-epoch.json' with {type:'json'};
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
assert.equal(epoch.pinsHash,'863e323361382c3beb9afa7683f9b2260c8e588997cf1f0fc8dea208c3feb05a');
assert.equal(epoch.transitionHash,'4318c014769b968707058e832721971e86dd5195baa816613decce96075c2f5d');
assert.equal(epoch.transition.authorCommit,'fa7dcf45efbad1dc908b02e6c699dcb02e6b3c06');
assert.equal(epoch.pins.baseline,'5f1a0c86d76089a35c711caa951ade1a162a1dbf');
assert.equal(epoch.verifiedChanged,4);assert.equal(epoch.verifiedUnchanged,9932);
export const cubitalConfig={name:'cubital-venous-ultrasound',pins:epoch.pins,transition:epoch.transition,
 pinsHash:epoch.pinsHash,transitionHash:epoch.transitionHash,singleTab:'ultrasound',
 helper:'cubitalVenousUltrasoundLesson',optionalHelper:true};
export function beforeCubitalVenousUltrasound(api,catalog){
 if(typeof api.bodyLesson!=='function')return api;
 return replayPinnedTeaching(api,cubitalConfig,catalog);
}
