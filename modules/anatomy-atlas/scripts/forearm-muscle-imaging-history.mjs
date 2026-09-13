// Offline authoring comparison only. Never changes runtime lessons or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/forearm-muscle-imaging-pins.json' with {type:'json'};
import after from '../content/forearm-muscle-imaging.transition.json' with {type:'json'};
export const forearmImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeForearmMuscleImaging({api,catalog}) {
  assert.equal(forearmImagingHash(pins),'a38e3fec7782a866418f3e08c217857f36a631f0e667ab94c8df0bfd01aef49d');
  assert.equal(forearmImagingHash(after),'35f606d9e156a4695ef41bb56c15f5f5aae16540ca975380315f94d2c2d179f6');
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();
  assert.equal(display.sourceVersion,pins.sourceVersion);
  assert.equal(display.license,pins.license);
  assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const b of pins.bundles)assert.deepEqual(display.bundles.find(x=>x.id===b.id),b);
  for(const [i,e] of pins.entries.entries()) {
    assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);
    assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);
    assert.equal(after.entries[i].id,e.identity.id);
    for(const tab of e.topics) {
      assert.equal(e.previous[tab].readiness,'pending');
      assert.equal(forearmImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded forearm-muscle imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,168);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const{readiness:_r,...content}=bodyLesson(s,t);return content;}};
}


