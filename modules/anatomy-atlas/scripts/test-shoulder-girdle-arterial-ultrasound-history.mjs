import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeShoulderGirdleArterialUltrasound as history} from './shoulder-girdle-arterial-ultrasound-history.mjs';
import {authoringBeforeFootUltrasoundFollowup} from './foot-ultrasound-followup-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const pins=JSON.parse(readFileSync('content/shoulder-girdle-arterial-ultrasound-pins.json'));
const{api:current,catalog}=await contentContext(),display=current.bodyDisplayCatalog(catalog);
const snapshot=api=>({catalog:display,body:display.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const liveHash=hash(snapshot(current)),prior=history({api:current,catalog});
assert.equal(hash(snapshot(prior)),pins.beforeAllTeachingSnapshotHash);assert.equal(history({api:prior,catalog}),prior);
for(const{identity,previous}of pins.entries){
 assert.deepEqual(prior.bodyLesson(identity,'ultrasound'),previous);
 const exposed=prior.bodyLesson(identity,'ultrasound');exposed.body+=' foreign';exposed.bullets??=[];exposed.bullets.push('foreign');
 assert.deepEqual(prior.bodyLesson(identity,'ultrasound'),previous);
 const altered=structuredClone(identity);altered.sources[0].sha256='foreign';assert.throws(()=>prior.bodyLesson(altered,'ultrasound'),/exact source identity/i);
 for(const tab of current.contentTabs.filter(t=>t!=='ultrasound'))assert.deepEqual(prior.bodyLesson(identity,tab),current.bodyLesson(identity,tab));
}
const beforeFoot=authoringBeforeFootUltrasoundFollowup({api:prior,catalog}),footPins=JSON.parse(readFileSync('content/foot-ultrasound-followup-pins.json'));
assert.equal(hash(snapshot(beforeFoot)),footPins.beforeAllTeachingSnapshotHash);
const first=pins.entries[0],mixed={...current,bodyLesson(s,tab){return s.id===first.identity.id&&tab==='ultrasound'?structuredClone(first.previous):current.bodyLesson(s,tab);}};
mixed.bodyContent=(s,tab)=>{const{readiness,...shown}=mixed.bodyLesson(s,tab);return shown;};
assert.throws(()=>history({api:mixed,catalog}),/Mixed shoulder-girdle arterial history/);
assert.throws(()=>history({api:{...current,shoulderGirdleArterialUltrasoundLesson(){return {body:'foreign'};}},catalog}),/Unrecorded shoulder-girdle arterial draft/);
const foreign=structuredClone(catalog);foreign.structures.find(s=>s.id===first.identity.id).sources[0].sha256='foreign';
assert.throws(()=>history({api:current,catalog:foreign}),/Unrecorded shoulder-girdle arterial source identity/);
assert.equal(hash(snapshot(current)),liveHash);
console.log(JSON.stringify({restoredTopics:10,baselineSnapshotExact:true,previousFootAdmissionExact:true,mixedAndForeignRefused:true,liveTeachingUnchanged:true}));
