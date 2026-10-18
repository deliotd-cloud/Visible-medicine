// Exact offline editorial replay only; never runtime content or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/thoracoabdominal-organ-quiz-pins.json' with {type:'json'};
import transition from '../content/thoracoabdominal-organ-quiz.transition.json' with {type:'json'};
import {beforePelvicReproductiveCore} from './pelvic-reproductive-core-history.mjs';
import {beforeDeepPlantarUltrasound} from './deep-plantar-ultrasound-history.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function beforeThoracoabdominalOrganQuiz(api){
 api=beforeDeepPlantarUltrasound(api);
 if(typeof api.bodyLesson!=='function')return api;
 api=beforePelvicReproductiveCore(api);
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(pins.baseline,'fae8cf6abbfffe304d5190e44f53affa883a96a3');
 assert.equal(hash(pins),'cdbf0d312e3c4ba410048e165b145c141cc4ee533dd0903d21b0c8967525bb62');
 assert.equal(hash(transition),'5430f82020f772fe00295e872c4e7a2c6355233593785714826be37d7cd5b0ea');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.baseline,pins.baseline);
 assert.equal(transition.entries.length,8);assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 let current=0,previous=0;const originals=new Map();
 for(const e of pins.entries){
  const rows=transition.entries.filter(r=>r.id===e.identity.id&&r.tab==='quiz');assert.equal(rows.length,1);
  assert.equal(rows[0].fmaId,e.identity.fmaId);assert.equal(rows[0].previousHash,hash(e.previous.quiz));
  const lesson=api.bodyLesson(e.identity,'quiz');
  if(isDeepStrictEqual(lesson,e.previous.quiz))previous++;
  else{assert.equal(hash(lesson),rows[0].currentHash,'Unrecorded thoracoabdominal organ quiz');current++;}
  originals.set(e.identity.id,e);
 }
 assert(current===8||previous===8,'Mixed thoracoabdominal organ quiz history');if(previous===8)return api;
 const bodyLesson=(s,tab)=>{const e=tab==='quiz'&&originals.get(s.id);if(!e)return api.bodyLesson(s,tab);assert.deepEqual(s,e.identity,'Historical organ quiz requires exact source identity');return structuredClone(e.previous.quiz);};
 const bodyContent=(s,tab)=>{if(tab!=='quiz'||!originals.has(s.id))return api.bodyContent(s,tab);const{readiness,...shown}=bodyLesson(s,tab);return shown;};
 return {...api,bodyLesson,bodyContent,thoracoabdominalOrganQuizLesson(s,tab){return tab==='quiz'&&isDeepStrictEqual(s,originals.get(s.id)?.identity)?undefined:api.thoracoabdominalOrganQuizLesson?.(s,tab);}};
}
