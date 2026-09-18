// Exact offline editorial reconstruction, not a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/distal-palmar-mri-pins.json' with {type:'json'};
import transition from '../content/distal-palmar-mri-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeDistalPalmarMri(api){
 assert.equal(hash(pins),'d3014d56c191af8f829152be0511f9d1269b06aa8c481b56089bde0e05e7115f');
 assert.equal(hash(transition),'7344a51d45e082bca1e219b2169c4811fc032ffbfffe3c799896b1871ef14c40');
 assert.equal(transition.parentCommit,pins.sourceCommit);assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 let old=0,current=0;const prior=new Map();
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);assert.deepEqual(Object.keys(transition.entries[i].sections),['mri']);
  const lesson=api.bodyLesson(e.identity,'mri');
  if(isDeepStrictEqual(lesson,e.previous.mri))old++;
  else{assert.equal(hash(lesson),transition.entries[i].sections.mri,'Unrecorded distal-palmar MRI teaching');current++;}
  prior.set(e.identity.id,e);
 }
 assert(old===6||current===6,'Mixed distal-palmar MRI history');if(old===6)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id);return t==='mri'&&e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.previous.mri):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
