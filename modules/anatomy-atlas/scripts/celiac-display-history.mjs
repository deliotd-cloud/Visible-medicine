// Offline reconstruction for historical checks; never used by runtime or approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/celiac-display-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeCeliacDisplay(api,catalog) {
 assert.equal(hash(record),'04fe1aeaba2bc1c5960b8bf5637d0f4ec498c49c63dd9997beddd06023c2c08e');
 const display=api.bodyDisplayCatalog(catalog),fingerprint=hash(display);
 if(fingerprint===record.beforeCatalog)return api;
 // Older adapters may already have removed later source additions. Leave an
 // entirely pre-correction record alone; that caller verifies its own immutable
 // catalogue hash. Never reconstruct or conceal an unrelated historical change.
 const candidates=display.structures.filter(s=>s.id===record.original.id);
 if(hash(candidates)===hash([record.original]) && !display.bundles.some(b=>b.id===record.bundle.id))return api;
 assert.equal(fingerprint,record.afterCatalog,'Unrecorded celiac display catalogue');
 assert.deepEqual(display.structures.filter(s=>s.id===record.original.id),[record.replacement]);
 assert.deepEqual(display.bundles.filter(b=>b.id===record.bundle.id),[record.bundle]);
 const prior={...display,structures:display.structures.map(s=>s.id===record.original.id?record.original:s),bundles:display.bundles.filter(b=>b.id!==record.bundle.id)};
 assert.equal(hash(prior),record.beforeCatalog,'Previous display catalogue must remain exact');
 return {...api,bodyDisplayCatalog(input){assert.equal(hash(api.bodyDisplayCatalog(input)),record.afterCatalog);return structuredClone(prior);}};
}
