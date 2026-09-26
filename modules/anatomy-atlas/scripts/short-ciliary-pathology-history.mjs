// Test-only exact replay; never alters runtime teaching or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import legacy from '../content/short-ciliary-transition.json' with {type:'json'};
import before from '../content/short-ciliary-pathology.before.json' with {type:'json'};
import transition from '../content/short-ciliary-pathology.transition.json' with {type:'json'};
import {beforeAnteriorCardiacPathology} from './anterior-cardiac-pathology-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeShortCiliaryPathology(api){
 api=beforeAnteriorCardiacPathology(api);
 assert.equal(hash(before),'b910428972cc24fb7008cf4e0b2b4a4ff293a5499330f6efad3cb4bae03b6e36');
 assert.equal(hash(transition),'2678c2ed9ed48c24a97efa159310a3f0080cda0880f2fe8a317d7e82205032eb');
 assert.equal(before.parentCommit,'0931b2da1151f04a2b6f0f623252879588178e08');
 assert.equal(transition.parentCommit,before.parentCommit);assert.equal(transition.beforeHash,hash(before));
 assert.equal(before.entries.length,1);assert.equal(transition.entries.length,1);
 const e=before.entries[0],next=transition.entries[0];
 assert.equal(next.id,e.identity.id);assert.equal(next.tab,e.tab);
 const lesson=api.bodyLesson(e.identity,e.tab);
 // Older replay callers may already have unwound the original pending wording.
 // Accept only that immutable lesson on the identical admitted source identity.
 assert.equal(hash(legacy),'8031a86e4593373cc3ff12c04c2cfc4138692220c9c2d01eb6114b338f6567a8');
 assert.deepEqual(legacy.structure,e.identity);
 if(isDeepStrictEqual(lesson,legacy.topics.pathology))return api;
 if(hash(lesson)!==next.lessonHash){assert.deepEqual(lesson,e.previous,'Unrecorded short ciliary pathology revision');return api;}
 const bodyLesson=(s,t)=>{
  if(s.id!==e.identity.id||t!==e.tab)return api.bodyLesson(s,t);
  assert.deepEqual(s,e.identity,'Cannot replay another short ciliary source');
  return structuredClone(e.previous);
 };
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
}
