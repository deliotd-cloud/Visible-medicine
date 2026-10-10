// Test-only exact reconstruction; never import into production dispatch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/hyoid-epiglottis-ultrasound-pins.json' with {type:'json'};
import transition from '../content/hyoid-epiglottis-ultrasound.transition.json' with {type:'json'};
import {beforeDescendingAortaUltrasound} from './descending-aorta-ultrasound-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function replay(api,catalog){
 api=beforeDescendingAortaUltrasound(api,catalog);
 assert.equal(hash(pins),'ea6399502b197a1a7aec1646d0808d74b0e207dbf69134fb74371ac915a9443b');
 assert.equal(hash(transition),'12b82038cdd0c6f45771cd25e1d450cb64319824da37200cff454d53e0f81ebd');
 assert.equal(transition.sourcePinsHash,hash(pins));assert.equal(transition.baseline,pins.baseline);
 assert.equal(pins.entries.length,2);assert.equal(transition.entries.length,2);
 if(catalog!==undefined)assert(catalog&&Array.isArray(catalog.structures),'Historical ultrasound requires source catalog');
 assert(api.hyoidEpiglottisUltrasoundLesson===undefined||typeof api.hyoidEpiglottisUltrasoundLesson==='function','Invalid ultrasound draft helper');
 if(typeof api.bodyLesson!=='function'){
  assert.equal(catalog,undefined,'Historical ultrasound requires body lesson');
  return api;
 }
 // Early synthetic APIs have no body display and no hyoid lesson yet.
 if(catalog===undefined&&typeof api.bodyDisplayCatalog!=='function'&&
    typeof api.hyoidEpiglottisUltrasoundLesson!=='function'&&
    pins.entries.every(e=>api.bodyLesson(e.identity,'ultrasound')===undefined))return api;
 const originals=new Map();let drafts=0,previous=0;
 for(const [i,e]of pins.entries.entries()){
  assert.equal(e.previous.readiness,'pending');
  if(catalog!==undefined)assert.deepEqual(catalog.structures.find(s=>s.id===e.identity.id),e.identity,'Unrecorded ultrasound source identity');
  assert.equal(transition.entries[i].id,e.identity.id);assert.equal(transition.entries[i].fmaId,e.identity.fmaId);
  if(typeof api.hyoidEpiglottisUltrasoundLesson==='function')
   assert.equal(hash(api.hyoidEpiglottisUltrasoundLesson(e.identity,'ultrasound')),transition.entries[i].draftHash,'Unrecorded ultrasound draft helper');
  const current=api.bodyLesson(e.identity,'ultrasound');
  if(isDeepStrictEqual(current,e.previous))previous++;
  else{assert.equal(hash(current),transition.entries[i].draftHash,'Unrecorded ultrasound history');drafts++;}
  if(typeof api.bodyContent==='function'){
   const {readiness,...shown}=current;assert.deepEqual(api.bodyContent(e.identity,'ultrasound'),shown,'Unrecorded ultrasound body content');
  }
  originals.set(e.identity.id,e);
 }
 assert(drafts===2||previous===2,'Mixed ultrasound history');if(previous===2)return api;
 assert.equal(typeof api.hyoidEpiglottisUltrasoundLesson,'function','Missing ultrasound draft helper');
 const bodyLesson=(s,tab)=>{const e=tab==='ultrasound'&&originals.get(s.id);if(!e)return api.bodyLesson(s,tab);assert.deepEqual(s,e.identity,'Historical ultrasound requires exact source identity');return structuredClone(e.previous);};
 const restored={...api,bodyLesson};
 if(typeof api.bodyContent==='function')restored.bodyContent=(s,tab)=>{if(tab!=='ultrasound'||!originals.has(s.id))return api.bodyContent(s,tab);const {readiness,...shown}=bodyLesson(s,tab);return shown;};
 return restored;
}
export function beforeHyoidEpiglottisUltrasound(api){return replay(api);}
export function authoringBeforeHyoidEpiglottisUltrasound({api,catalog}){
 assert(catalog&&Array.isArray(catalog.structures),'Historical ultrasound requires source catalog');
 return replay(api,catalog);
}
