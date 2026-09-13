// Offline authoring comparison only. Never changes runtime lessons or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/central-neural-imaging-pins.json' with {type:'json'};
import after from '../content/central-neural-imaging.transition.json' with {type:'json'};
export const centralImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeCentralNeuralImaging({api,catalog}) {
  assert.equal(centralImagingHash(pins),'03f123c51b8faddf4603c8083aba1f14cb1c6efcba75c1c3ad30dc10cd617cbe');
  assert.equal(centralImagingHash(after),'4ac4e56644ebaf7ab2cb5e5956c677fa1a291408e7a4680070b9bbdcdd41ee94');
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
      assert.equal(centralImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded central-neural imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,54);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const{readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
