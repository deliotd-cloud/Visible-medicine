// Exact offline reconstruction only; never used by runtime or clinical acceptance.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/anterior-cardiac-vein-transition.json' with {type:'json'};
import {preHandIntrinsicProfiles} from './hand-intrinsic-study-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const verify=()=>assert.equal(hash(record),'650049c5d329c5b077a64798df089caf22ae4b46677272f2e341ec7811853ee6');
export function preAnteriorCardiacVeinProfiles(profiles){
 profiles=preHandIntrinsicProfiles(profiles);
 verify();const added=profiles.thorax.focuses.filter(f=>f.id===record.focus.id);if(!added.length)return profiles;
 assert.deepEqual(added,[record.focus]);assert.equal(hash(profiles),record.afterProfiles,'Unrecorded cardiac-vein recipe change');
 const prior=structuredClone(profiles);prior.thorax.focuses=prior.thorax.focuses.filter(f=>f.id!==record.focus.id);assert.equal(hash(prior),record.beforeProfiles);return prior;
}
export function preAnteriorCardiacVeinAuthoring(api,catalog){
 verify();const display=api.bodyDisplayCatalog(catalog),matches=display.structures.filter(s=>s.id===record.structure.id||s.fmaId===record.structure.fmaId);
 if(!matches.length)return api;assert.deepEqual(matches,[record.structure]);assert.equal(hash(display),record.afterCatalog,'Unrecorded cardiac-vein catalogue');
 const prior={...display,structures:display.structures.filter(s=>s.id!==record.structure.id),bundles:display.bundles.filter(b=>b.id!==record.bundle.id)};assert.equal(hash(prior),record.beforeCatalog);
 return {...api,dissectionProfiles:preAnteriorCardiacVeinProfiles(api.dissectionProfiles),bodyDisplayCatalog(input){assert.equal(hash(api.bodyDisplayCatalog(input)),record.afterCatalog);return structuredClone(prior);}};
}
