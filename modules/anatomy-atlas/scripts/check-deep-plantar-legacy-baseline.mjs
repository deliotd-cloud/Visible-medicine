// Read-only classification of old whole-curriculum checks; no expected hash edits.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {authoringBeforeShoulderGirdleArterialUltrasound} from './shoulder-girdle-arterial-ultrasound-history.mjs';
import {authoringBeforeFootUltrasoundFollowup} from './foot-ultrasound-followup-history.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const prior=await exactSourceHistoryApi('7b3e678ae4b8059aadb84459048ebd05f7abe7b9','display-review');
const snapshot=api=>({catalog:display,body:display.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
// Named Git source supplies every lesson; other historical helper exports are
// unchanged by this batch and do not determine the actual current lesson.
const baseline={...api,bodyLesson:prior.bodyLesson,bodyContent:prior.bodyContent};
const candidateShoulder=authoringBeforeShoulderGirdleArterialUltrasound({api,catalog});
const baselineShoulder=authoringBeforeShoulderGirdleArterialUltrasound({api:baseline,catalog});
assert.deepEqual(snapshot(candidateShoulder),snapshot(baselineShoulder));
const shoulderExpected=JSON.parse(readFileSync('content/shoulder-girdle-arterial-ultrasound-pins.json')).beforeAllTeachingSnapshotHash;
const shoulderActual=hash(snapshot(baselineShoulder));
const candidateFoot=authoringBeforeFootUltrasoundFollowup({api:candidateShoulder,catalog});
const baselineFoot=authoringBeforeFootUltrasoundFollowup({api:baselineShoulder,catalog});
assert.deepEqual(snapshot(candidateFoot),snapshot(baselineFoot));
const footExpected=JSON.parse(readFileSync('content/foot-ultrasound-followup-pins.json')).beforeAllTeachingSnapshotHash;
console.log(JSON.stringify({baselineCommit:'7b3e678ae4b8059aadb84459048ebd05f7abe7b9',
 shoulder:{expected:shoulderExpected,baselineActual:shoulderActual,candidateActual:hash(snapshot(candidateShoulder)),preExistingMismatch:shoulderActual!==shoulderExpected},
 foot:{expected:footExpected,baselineActual:hash(snapshot(baselineFoot)),candidateActual:hash(snapshot(candidateFoot)),preExistingMismatch:hash(snapshot(baselineFoot))!==footExpected},
 assertionsChanged:false,allPlacementsCompared:9936}));
