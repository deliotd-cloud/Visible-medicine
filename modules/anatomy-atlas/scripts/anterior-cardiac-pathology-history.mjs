// Test-only immutable replay; never alters runtime teaching or approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import before from '../content/anterior-cardiac-pathology.before.json' with {type:'json'};
import transition from '../content/anterior-cardiac-pathology.transition.json' with {type:'json'};
import {beforeHilarVesselXray} from './hilar-vessel-xray-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeAnteriorCardiacPathology(api){
  api=beforeHilarVesselXray(api);
  assert.equal(hash(before),'b22c85810abc24f8d8903f04151a90b04eb72f8ebbaef41324c57d05c620a366');
  assert.equal(hash(transition),'4b5f97c0d23dc8fab14d9bbf28214e97d43331bba147ea3352f5c23e1692d4d6');
  assert.equal(before.parentCommit,'896bb439eca407539c1e683298b91d8d78530732');
  assert.equal(transition.parentCommit,before.parentCommit);
  assert.equal(transition.beforeHash,hash(before));
  assert.equal(before.entries.length,1);assert.equal(transition.entries.length,1);
  const e=before.entries[0],next=transition.entries[0];
  assert.equal(next.id,e.identity.id);assert.equal(next.tab,e.tab);
  const lesson=api.bodyLesson(e.identity,e.tab);
  if(hash(lesson)!==next.lessonHash){
    assert.deepEqual(lesson,e.previous,'Unrecorded anterior cardiac pathology revision');
    return api;
  }
  const bodyLesson=(s,t)=>{
    if(s.id!==e.identity.id||t!==e.tab)return api.bodyLesson(s,t);
    assert.deepEqual(s,e.identity,'Cannot replay another anterior cardiac source');
    return structuredClone(e.previous);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
