// Offline editorial reconstruction only; no runtime content or approval changes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/lacrimal-drainage-imaging-pins.json' with {type:'json'};
import transition from '../content/lacrimal-drainage-imaging.transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Restore only the twelve recorded, exact-source lacrimal CT/MRI lessons. */
export function beforeLacrimalDrainageImaging(api){
  if(typeof api.bodyLesson!=='function')return api;
  assert.equal(hash(pins),'1007437af32bb2868c355766a294d72eb7f89e0677bb8215455ad045afc9eba9');
  assert.equal(hash(transition),'ce40221f110144e89d01217b1c11abaa0101eafb660c13b13a91c2307998298a');
  assert.equal(pins.sourceCommit,'37428be036515935e182682b3004d64ed2d02c18');
  assert.equal(transition.parentCommit,pins.sourceCommit);
  assert.equal(pins.entries.length,6);
  assert.deepEqual(transition.entries.map(e=>e.id),pins.entries.map(e=>e.identity.id));
  const prior=new Map();let old=0,current=0;
  for(const [i,e] of pins.entries.entries()){
    assert.deepEqual(Object.keys(e.previous),['ct','mri']);
    assert.deepEqual(Object.keys(transition.entries[i].sections),['ct','mri']);
    for(const topic of ['ct','mri']){
      const previous=e.previous[topic];assert.equal(previous.readiness,'pending');
      const lesson=api.bodyLesson(e.identity,topic);
      if(isDeepStrictEqual(lesson,previous))old++;
      else{assert.equal(hash(lesson),transition.entries[i].sections[topic],'Unrecorded lacrimal drainage imaging teaching');current++;}
      const key=e.identity.id+'|'+topic;assert(!prior.has(key),'Duplicate lacrimal topic');
      prior.set(key,{identity:e.identity,lesson:previous});
    }
  }
  assert.equal(prior.size,12);assert(old===12||current===12,'Mixed lacrimal drainage imaging history');
  if(old===12)return api;
  const bodyLesson=(structure,topic)=>{
    const entry=prior.get(structure.id+'|'+topic);
    return entry&&isDeepStrictEqual(structure,entry.identity)?structuredClone(entry.lesson):api.bodyLesson(structure,topic);
  };
  return {...api,bodyLesson,bodyContent(structure,topic){const{readiness:_r,...content}=bodyLesson(structure,topic);return content;}};
}
