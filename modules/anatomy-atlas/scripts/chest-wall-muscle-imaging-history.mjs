// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/chest-wall-muscle-imaging-pins.json' with {type:'json'};
import after from '../content/chest-wall-muscle-imaging.transition.json' with {type:'json'};
export const chestWallImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeChestWallMuscleImaging({api,catalog}) {
  assert.equal(chestWallImagingHash(pins),'383e8fcfb2cab0a4c644ae9772bea793b62a6298ad879a12e85285fcad948615');
  assert.equal(chestWallImagingHash(after),'d705dd1543cf84d773d18488434a699a13a3716a0383ef011bd3c547c5ee333e');
  assert.equal(pins.sourceCommit,'83bb1b6cd8bdb3f6b72ed9f8f6d98ee782e52fde');
  assert.equal(after.parentCommit,pins.sourceCommit);
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
      assert.equal(chestWallImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded chest-wall-muscle imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,48);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
