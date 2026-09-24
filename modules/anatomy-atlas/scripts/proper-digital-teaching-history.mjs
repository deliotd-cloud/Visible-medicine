// Exact editorial replay only. Never imported by the viewer or used as approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/proper-digital-teaching.before.json' with {type:'json'};
import transition from '../content/proper-digital-teaching.transition.json' with {type:'json'};
import {beforeSpinalDiscFunction} from './spinal-disc-function-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeProperDigitalTeaching(api){
 api=beforeSpinalDiscFunction(api);
 assert.equal(hash(pins),'d695e407a86e7b3cdaf635fb9a7a089ed5b4a1f734b3ebd8789597e50305d689');
 assert.equal(hash(transition),'fbf954169ed47c65936165ae74dfbd5958f28dc3d323c1cee301e21596948b2e');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.deepEqual(transition.entries.map(e=>e.id),pins.entries.map(e=>e.identity.id));
 let old=0,current=0;
 for(const [i,e]of pins.entries.entries())for(const t of ['anatomy','function']){
  const value=api.bodyLesson(e.identity,t);
  if(hash(value)===transition.entries[i].topics[t])current++;
  else {assert.deepEqual(value,e.previous[t],'Unrecorded proper digital teaching');old++;}
 }
 assert(old===20||current===20,'Mixed proper digital teaching history');
 if(old===20)return api;
 const bindings=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,t)=>{
  const entry=bindings.get(s.id);
  if(!entry||!['anatomy','function'].includes(t))return api.bodyLesson(s,t);
  assert.deepEqual(s,entry.identity,'Cannot replay another digital artery source');
  return structuredClone(entry.previous[t]);
 };
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...shown}=bodyLesson(s,t);return shown;}};
}
