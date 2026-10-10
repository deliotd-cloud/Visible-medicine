// Test-only exact reconstruction; never import into production dispatch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/cranial-bone-xray-pins.json' with {type:'json'};
import transition from '../content/cranial-bone-xray.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeCranialBoneXray({api,catalog}){
 assert.equal(hash(pins),'5497466123cc60d6542f4db556d118f00749ad8558f907d15b60e5861a420423');
 assert.equal(hash(transition),'4a20f41c45ad22b41a11410913bde6ed70196c2a7967b2418dd529b76faae9f9');
 assert.equal(transition.sourcePinsHash,hash(pins));assert.equal(transition.baseline,pins.baseline);
 assert.equal(pins.entries.length,8);const originals=new Map();let drafts=0,previous=0;
 for(const [i,e]of pins.entries.entries()){
  assert.equal(e.previous.readiness,'pending');assert.deepEqual(catalog.structures.find(s=>s.id===e.identity.id),e.identity,'Unrecorded xray source identity');
  assert.equal(transition.entries[i].id,e.identity.id);assert.equal(transition.entries[i].fmaId,e.identity.fmaId);
  assert.equal(hash(api.cranialBoneXrayLesson(e.identity,'xray')),transition.entries[i].draftHash,'Unrecorded xray draft');
  const current=api.bodyLesson(e.identity,'xray');if(hash(current)===transition.entries[i].draftHash)drafts++;else{assert.deepEqual(current,e.previous,'Unrecorded xray history');previous++;}
  const {readiness,...shown}=current;assert.deepEqual(api.bodyContent(e.identity,'xray'),shown);originals.set(e.identity.id,e);
 }
 assert(drafts===8||previous===8,'Mixed xray history');if(previous===8)return api;
 const bodyLesson=(s,tab)=>{const e=tab==='xray'&&originals.get(s.id);if(!e)return api.bodyLesson(s,tab);assert.deepEqual(s,e.identity,'Historical xray requires exact source identity');return structuredClone(e.previous);};
 const bodyContent=(s,tab)=>{if(tab!=='xray'||!originals.has(s.id))return api.bodyContent(s,tab);const {readiness,...shown}=bodyLesson(s,tab);return shown;};
 return{...api,bodyLesson,bodyContent};
}
