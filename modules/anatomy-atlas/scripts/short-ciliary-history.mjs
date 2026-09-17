// Exact offline reconstruction only; never changes runtime or review acceptance.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/short-ciliary-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const verify=()=>assert.equal(hash(record),'8031a86e4593373cc3ff12c04c2cfc4138692220c9c2d01eb6114b338f6567a8');
export function preShortCiliaryProfiles(profiles){
 verify();const additions=profiles['head-neck'].focuses.filter(f=>f.id===record.addedFocus.id);
 if(!additions.length)return profiles; // Historical caller still checks its immutable hash.
 assert.deepEqual(additions,[record.addedFocus]);assert.equal(hash(profiles),record.currentRecipesHash);
 const prior=structuredClone(profiles);prior['head-neck'].focuses=prior['head-neck'].focuses.filter(f=>f.id!==record.addedFocus.id);assert.equal(hash(prior),record.previousRecipesHash);return prior;
}
export function preShortCiliaryAuthoring(api,catalog){
 verify();const display=api.bodyDisplayCatalog(catalog),matches=display.structures.filter(s=>s.id===record.structure.id||s.fmaId===record.structure.fmaId);
 if(!matches.length)return api;
 assert.deepEqual(matches,[record.structure]);assert.equal(hash(display),record.currentCatalogHash);
 const prior={...display,structures:display.structures.filter(s=>s.id!==record.structure.id),bundles:display.bundles.filter(b=>b.id!==record.bundle.id)};assert.equal(hash(prior),record.previousCatalogHash);
 for(const [tab,lesson] of Object.entries(record.topics))assert.deepEqual(api.bodyLesson(record.structure,tab),lesson);
 const dissectionProfiles=preShortCiliaryProfiles(api.dissectionProfiles);
 return {...api,dissectionProfiles,bodyDisplayCatalog(input){const actual=api.bodyDisplayCatalog(input);assert.equal(hash(actual),record.currentCatalogHash);return structuredClone(prior);}};
}
