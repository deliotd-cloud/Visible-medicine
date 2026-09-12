// Offline authoring comparison only. Never changes runtime lessons or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/thigh-muscle-imaging-pins.json' with {type:'json'};
import after from '../content/thigh-muscle-imaging.transition.json' with {type:'json'};
export const thighImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeThighMuscleImaging({api,catalog}) {
  assert.equal(thighImagingHash(pins),'5c8e70ed518288e829886e58aa348556f59fc885fdbc5ccb379e201f8dec3b4a');
  assert.equal(thighImagingHash(after),'998c642af2788c2b995d252f07c374c8ce71d10355ff472a46a078375c2b6be6');
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
      assert.equal(thighImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded thigh-muscle imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,112);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const{readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
