// Exact offline bridge for later source admissions and pelvic copy. Never runtime.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import record from '../content/lower-arterial-source-history.json' with {type:'json'};
import pins from '../content/lower-arterial-imaging-pins.json' with {type:'json'};
import authored from '../content/lower-arterial-imaging.transition.json' with {type:'json'};
import shortCiliary from '../content/short-ciliary-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
export function restoreLowerArterialSourceHistory(api,catalog,{arterialStage='pending',deferWholeSnapshot=false}={}){
 assert.equal(hash(record),'4c2ab793d535618bb8fd9b68220297b9aa1fffd4782a84f78993ad1414bcc4d0');
 assert.equal(hash(pins),'c816e752384e9b1fe3a5d76c096f875badf94794d1c16710ce86e98075d2f9e0');
 assert.equal(hash(authored),'ac6927c48c954848ff0f86755fc11bfceca867567b0ebebc8a5cd1002443dcce');
 assert.equal(hash(shortCiliary),'8031a86e4593373cc3ff12c04c2cfc4138692220c9c2d01eb6114b338f6567a8');
 assert(['pending','draft'].includes(arterialStage));
 const arterial=new Map();
 for(const [i,e] of pins.entries.entries())for(const t of e.topics){
  const lesson=api.bodyLesson(e.identity,t);
  if(arterialStage==='pending')assert.deepEqual(lesson,e.previous[t],'Unrecorded earlier arterial topic');
  else assert.equal(hash(lesson),authored.entries[i].sections[t],'Unrecorded authored arterial topic');
  arterial.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});
 }
 // Both phases normalize only the independently recorded 36 arterial edits.
 const normalize=a=>({...a,bodyLesson(s,t){const e=arterial.get(s.id+'|'+t);if(!e)return a.bodyLesson(s,t);assert.deepEqual(s,e.identity);return structuredClone(e.lesson);}});
 const display=api.bodyDisplayCatalog(catalog),catalogHash=hash(display);
 if(catalogHash===record.originalCatalogHash){
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(normalize(api),display)),record.originalSnapshotHash,'Unrecorded restored history');
  else {
   assert.equal(hash(api.dissectionProfiles),shortCiliary.previousRecipesHash,'Unrecorded restored recipes');
   for(const e of record.changes){assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.deepEqual(api.bodyLesson(e.identity,e.tab),e.previous,'Unrecorded restored lesson');}
  }
  return api;
 }
 assert.equal(catalogHash,record.reconstructedCatalogHash,'Unrecorded source admission or identity');
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(normalize(api),display)),record.reconstructedSnapshotHash,'Unrecorded reconstructed teaching or recipes');
 else assert.equal(hash(api.dissectionProfiles),shortCiliary.previousRecipesHash,'Unrecorded reconstructed recipes');
 const prior=new Map(record.changes.map(e=>[e.identity.id+'|'+e.tab,e]));
 assert.equal(prior.size,46);
 for(const e of record.changes){assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.deepEqual(api.bodyLesson(e.identity,e.tab),e.current,'Unrecorded reconstructed lesson');}
 const restored={...display,structures:display.structures.filter(s=>!record.removedStructures.includes(s.id)),bundles:display.bundles.filter(b=>!record.removedBundles.includes(b.id))};
 assert.equal(hash(restored),record.originalCatalogHash);
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);if(!e)return api.bodyLesson(s,t);assert(isDeepStrictEqual(s,e.identity),'Different historical source identity');return structuredClone(e.previous);};
 const result={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;},bodyDisplayCatalog(input){assert.equal(hash(api.bodyDisplayCatalog(input)),record.reconstructedCatalogHash,'Unrecorded historical input catalogue');return structuredClone(restored);}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(normalize(result),restored)),record.originalSnapshotHash,'Original complete fixture must still match');
 return result;
}
