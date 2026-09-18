// Exact offline editorial reconstruction; never a runtime or approval migration.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import pins from '../content/anterior-cardiac-teaching-pins.json' with {type:'json'};
import transition from '../content/anterior-cardiac-teaching-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

export function beforeAnteriorCardiacTeaching(api){
 assert.equal(hash(pins),'1a25d4bbfd6c8ae720da915df13f2cc569941f523f8659abc912935a8c6f83c2');
 assert.equal(hash(transition),'8af4d600801debd551fda8a226818f188f12052b8d5874b2702231e0a10dcd11');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const topic of pins.entry.topics){
  const lesson=api.bodyLesson(pins.entry.identity,topic);
  if(isDeepStrictEqual(lesson,pins.entry.previous[topic]))old++;else current++;
  if(!isDeepStrictEqual(lesson,pins.entry.previous[topic]))assert.equal(hash(lesson),transition.entry.sections[topic],'Unrecorded anterior-cardiac teaching');
  prior.set(pins.entry.identity.id+'|'+topic,pins.entry.previous[topic]);
 }
 assert(old===6||current===6,'Mixed anterior-cardiac teaching history');
 if(old===6)return api;
 const bodyLesson=(s,t)=>{
  const lesson=isDeepStrictEqual(s,pins.entry.identity)&&prior.get(s.id+'|'+t);
  return lesson?structuredClone(lesson):api.bodyLesson(s,t);
 };
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
