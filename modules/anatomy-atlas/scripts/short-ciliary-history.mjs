// Exact offline reconstruction only; never changes runtime or review acceptance.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import record from '../content/short-ciliary-transition.json' with {type:'json'};
import teaching from '../content/short-ciliary-teaching.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const verify=()=>assert.equal(hash(record),'8031a86e4593373cc3ff12c04c2cfc4138692220c9c2d01eb6114b338f6567a8');
export function beforeShortCiliaryTeaching(api){
 verify();assert.equal(hash(teaching),'0321886e5de0d75eff6a709008408ff91cc0cd38b546dc6902db3b4b2f10dfe8');
 assert.equal(teaching.catalogHash,record.currentCatalogHash);assert.equal(teaching.id,record.structure.id);
 assert.equal(teaching.previousAllLessonsAndRecipesHash,record.currentAllLessonsAndRecipesHash);
 const topics=Object.keys(teaching.sections);assert.deepEqual(topics,['function','ct','mri','xray','ultrasound','pathology','clinical','quiz']);let old=0,current=0;
 for(const t of topics){const lesson=api.bodyLesson(record.structure,t);if(isDeepStrictEqual(lesson,record.topics[t]))old++;else{assert.equal(hash(lesson),teaching.sections[t],'Unrecorded short-ciliary teaching');current++;}}
 assert(old===topics.length||current===topics.length,'Mixed short-ciliary teaching history');if(old===topics.length)return api;
 const bodyLesson=(s,t)=>topics.includes(t)&&isDeepStrictEqual(s,record.structure)?structuredClone(record.topics[t]):api.bodyLesson(s,t);
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
export function preShortCiliaryProfiles(profiles){
 verify();const additions=profiles['head-neck'].focuses.filter(f=>f.id===record.addedFocus.id);
 if(!additions.length)return profiles; // Historical caller still checks its immutable hash.
 assert.deepEqual(additions,[record.addedFocus]);assert.equal(hash(profiles),record.currentRecipesHash);
 const prior=structuredClone(profiles);prior['head-neck'].focuses=prior['head-neck'].focuses.filter(f=>f.id!==record.addedFocus.id);assert.equal(hash(prior),record.previousRecipesHash);return prior;
}
export function preShortCiliaryAuthoring(api,catalog){
 verify();const display=api.bodyDisplayCatalog(catalog),matches=display.structures.filter(s=>s.id===record.structure.id||s.fmaId===record.structure.fmaId);
 if(!matches.length)return api;
 assert.deepEqual(matches,[record.structure]);assert.equal(hash(display),record.currentCatalogHash);
 api=beforeShortCiliaryTeaching(api);
 const prior={...display,structures:display.structures.filter(s=>s.id!==record.structure.id),bundles:display.bundles.filter(b=>b.id!==record.bundle.id)};assert.equal(hash(prior),record.previousCatalogHash);
 for(const [tab,lesson] of Object.entries(record.topics))assert.deepEqual(api.bodyLesson(record.structure,tab),lesson);
 const dissectionProfiles=preShortCiliaryProfiles(api.dissectionProfiles);
 return {...api,dissectionProfiles,bodyDisplayCatalog(input){const actual=api.bodyDisplayCatalog(input);assert.equal(hash(actual),record.currentCatalogHash);return structuredClone(prior);}};
}
