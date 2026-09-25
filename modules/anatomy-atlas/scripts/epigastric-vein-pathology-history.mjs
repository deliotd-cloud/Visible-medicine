// Strict test-only replay; never changes runtime teaching or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import before from '../content/epigastric-vein-pathology.before.json' with {type:'json'};
import transition from '../content/epigastric-vein-pathology.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeEpigastricVeinPathology(api){
  assert.equal(hash(before),'ce2c4920a302f7a5b89faa668a9a0ccbef39a3ce9983d033b38f3b04e31923a2');
  assert.equal(hash(transition),'96b0d661d1877d316b9e76db809e38533a789021830698cbd9b177ded640b246');
  assert.equal(before.parentCommit,'0cdca340b7a4b67b387389a0fa794e5d36d547e7');
  assert.equal(transition.parentCommit,before.parentCommit);assert.equal(transition.beforeHash,hash(before));
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(transition.entries[i].id,e.identity.id);assert.equal(transition.entries[i].tab,e.tab);
    const lesson=api.bodyLesson(e.identity,e.tab);
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded epigastric vein revision');old++;}
  }
  assert(old===2||current===2,'Mixed epigastric vein history');
  if(old===2)return api;
  const bodyLesson=(s,t)=>{
    const e=before.entries.find(e=>s.id===e.identity.id&&t===e.tab);
    if(!e)return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another epigastric vein source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
