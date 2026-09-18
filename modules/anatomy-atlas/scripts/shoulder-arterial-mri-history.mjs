// Exact offline editorial reconstruction, not a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/shoulder-arterial-mri-pins.json' with {type:'json'};
import transition from '../content/shoulder-arterial-mri-transition.json' with {type:'json'};
import {beforeHandIntrinsicStudies} from './hand-intrinsic-study-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeShoulderArterialMri(api){
 api=beforeHandIntrinsicStudies(api);
 assert.equal(hash(pins),'0fc63c05e5775aabddc017ad243a68a06905b397bdd51488fe5c48bb81267176');
 assert.equal(hash(transition),'cc222ed6ce2404695ed986d4945ebeb101717e4539a2e95ef460d350db9c1902');
 assert.equal(transition.parentCommit,pins.sourceCommit);assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 let old=0,current=0;const prior=new Map();
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);assert.deepEqual(Object.keys(transition.entries[i].sections),['mri']);
  const lesson=api.bodyLesson(e.identity,'mri');
  if(isDeepStrictEqual(lesson,e.previous.mri))old++;
  else{assert.equal(hash(lesson),transition.entries[i].sections.mri,'Unrecorded shoulder-arterial MRI teaching');current++;}
  prior.set(e.identity.id,e);
 }
 assert(old===6||current===6,'Mixed shoulder-arterial MRI history');if(old===6)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id);return t==='mri'&&e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.previous.mri):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
