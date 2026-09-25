// Test-only editorial replay; not runtime content or clinical approval.
import assert from 'node:assert/strict';
import {beforeEpigastricVeinPathology} from './epigastric-vein-pathology-history.mjs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import before from '../content/lamina-pathology.before.json' with {type:'json'};
import transition from '../content/lamina-pathology.transition.json' with {type:'json'};
import cranial from '../content/cranial-boundary-clinical-pins.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeLaminaPathology(api){
  api=beforeEpigastricVeinPathology(api);
  assert.equal(hash(before),'7d6bcdf0c2880da94062fef5aadd6bfdba8222d35ceb244c142f9d52027d263e');
  assert.equal(hash(transition),'7cc69cb19bdf00ea1214112a6e7f69dad10162d8c4e1e7cdf1a43eb2bba4010f');
  assert.equal(before.parentCommit,'e7e6b197e0cd25c1a9160b69f93fbe673192c755');
  assert.equal(transition.parentCommit,before.parentCommit);assert.equal(transition.beforeHash,hash(before));
  // Older replay callers have already unwound the original Clinical draft.
  // Accept only its immutable recorded state, never an arbitrary pending lesson.
  assert.equal(hash(cranial),'17c346a550a98c169becc90dfccbb407578ca854e23e8c09931b518f7daf7925');
  const legacy=cranial.entries.find(e=>e.identity.id===before.entries[0].identity.id);
  if(isDeepStrictEqual(api.bodyLesson(legacy.identity,'clinical'),legacy.previous.clinical)&&
    isDeepStrictEqual(api.bodyLesson(legacy.identity,'pathology'),before.entries[1].previous))return api;
  let old=0,current=0;
  for(const [i,e]of before.entries.entries()){
    assert.equal(transition.entries[i].id,e.identity.id);assert.equal(transition.entries[i].tab,e.tab);
    const lesson=api.bodyLesson(e.identity,e.tab);
    if(hash(lesson)===transition.entries[i].lessonHash)current++;
    else{assert.deepEqual(lesson,e.previous,'Unrecorded lamina revision');old++;}
  }
  assert(old===2||current===2,'Mixed lamina history');
  if(old===2)return api;
  const bodyLesson=(s,t)=>{
    const e=before.entries.find(e=>s.id===e.identity.id&&t===e.tab);
    if(!e)return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another lamina source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
