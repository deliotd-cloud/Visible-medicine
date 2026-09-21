// Exact offline editorial reconstruction, not a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/laryngeal-imaging-pins.json' with {type:'json'};
import transition from '../content/laryngeal-imaging-transition.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Remove only the six source-bound laryngeal CT/MRI teaching placements. */
export function beforeLaryngealImaging(api){
 if(typeof api.bodyLesson!=='function')return api;
 assert.equal(hash(pins),'39a88149f295a65222ed321af3a6c888d4e0067a838af122a2a0fe80b1dd28d5');
 assert.equal(hash(transition),'35baff1130f3a9f97da71b434eb96edff1c4ea00b6737f463c1ab90072371987');
 assert.equal(transition.sourceCommit,pins.sourceCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.equal(pins.entries.length,3);assert.equal(transition.entries.length,6);
 const recorded=new Map(),prior=new Map();
 for(const entry of transition.entries){
  const key=entry.id+'|'+entry.tab;assert(!recorded.has(key),'Duplicate laryngeal transition topic');recorded.set(key,entry);
 }
 let old=0,current=0;
 for(const entry of pins.entries)for(const topic of ['ct','mri']){
  const key=entry.identity.id+'|'+topic,record=recorded.get(key),previous=entry.previous[topic];
  assert(record,'Missing laryngeal transition topic');assert.equal(previous.readiness,'pending');
  assert.equal(record.previousHash,hash(previous),'Changed pinned laryngeal prior');
  const lesson=api.bodyLesson(entry.identity,topic);
  if(isDeepStrictEqual(lesson,previous))old++;
  else{assert.equal(hash(lesson),record.currentHash,'Unrecorded laryngeal imaging teaching');current++;}
  prior.set(key,{identity:entry.identity,lesson:previous});
 }
 assert.equal(prior.size,6);assert.equal(recorded.size,prior.size);
 assert(old===prior.size||current===prior.size,'Mixed laryngeal imaging history');
 if(old===prior.size)return api;
 const bodyLesson=(structure,topic)=>{
  const entry=prior.get(structure.id+'|'+topic);
  return entry&&isDeepStrictEqual(structure,entry.identity)?structuredClone(entry.lesson):api.bodyLesson(structure,topic);
 };
 return {...api,bodyLesson,bodyContent(structure,topic){const {readiness:_readiness,...content}=bodyLesson(structure,topic);return content;}};
}
