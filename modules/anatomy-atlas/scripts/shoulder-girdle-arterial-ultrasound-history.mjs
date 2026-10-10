// Test-only exact reversal. Never import into learner dispatch or migrate approvals.
import assert from 'node:assert/strict';
import {beforeThoracoabdominalOrganQuiz} from './thoracoabdominal-organ-quiz-history.mjs';
import {createHash} from 'node:crypto';
import pins from '../content/shoulder-girdle-arterial-ultrasound-pins.json' with {type:'json'};
import transition from '../content/shoulder-girdle-arterial-ultrasound.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeShoulderGirdleArterialUltrasound({api,catalog}){
 api=beforeThoracoabdominalOrganQuiz(api);
 assert.equal(pins.baseline,'bbe33ea6ffff3503ae9cdabc0dd41350cece28cd');
 assert.equal(hash(pins),'2edc421ca9a85878625dc607e990d1136fbb4be63609c62ba565161ffa09e56d');
 assert.equal(hash(transition),'f8718d1d4428a8301a83bc0332c7e007c646dc579ea98354969c987d5eafd20f');
 assert.equal(transition.sourcePinsHash,hash(pins));assert.equal(transition.baseline,pins.baseline);
 assert.equal(pins.entries.length,10);assert.equal(transition.entries.length,10);
 const display=api.bodyDisplayCatalog(catalog),originals=new Map();let drafts=0,previous=0;
 for(const[index,entry]of pins.entries.entries()){
  assert.equal(entry.previous.readiness,'pending');
  assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity,'Unrecorded shoulder-girdle arterial source identity');
  const recorded=transition.entries[index];assert.equal(recorded.id,entry.identity.id);assert.equal(recorded.fmaId,entry.identity.fmaId);
  assert.equal(hash(api.shoulderGirdleArterialUltrasoundLesson(entry.identity,'ultrasound')),recorded.draftHash,'Unrecorded shoulder-girdle arterial draft');
  const current=api.bodyLesson(entry.identity,'ultrasound');
  if(hash(current)===recorded.draftHash)drafts++;else{assert.deepEqual(current,entry.previous,'Unrecorded shoulder-girdle arterial history');previous++;}
  const{readiness,...shown}=current;assert.deepEqual(api.bodyContent(entry.identity,'ultrasound'),shown);
  originals.set(entry.identity.id,entry);
 }
 assert(drafts===10||previous===10,'Mixed shoulder-girdle arterial history');
 if(previous===10)return api;
 const bodyLesson=(s,tab)=>{const entry=tab==='ultrasound'&&originals.get(s.id);if(!entry)return api.bodyLesson(s,tab);assert.deepEqual(s,entry.identity,'Historical shoulder-girdle teaching requires exact source identity');return structuredClone(entry.previous);};
 const bodyContent=(s,tab)=>{if(tab!=='ultrasound'||!originals.has(s.id))return api.bodyContent(s,tab);const{readiness,...shown}=bodyLesson(s,tab);return shown;};
 return {...api,bodyLesson,bodyContent};
}
