// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/shoulder-arm-muscle-imaging-pins.json' with {type:'json'};
import after from '../content/shoulder-arm-muscle-imaging.transition.json' with {type:'json'};
export const shoulderArmImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeShoulderArmMuscleImaging({api,catalog}) {
  assert.equal(shoulderArmImagingHash(pins),'08198dd3ccaa0f7c22941665376f081bdeec1132e5131e261dd2c37c883d1479');
  assert.equal(shoulderArmImagingHash(after),'fa9a59d6410d6875c9c39a5363c5a1d4ac9879b78c6fe006192b68ab7be0ac50');
  assert.equal(pins.sourceCommit,'b18335e1841f14ec631d2434a52f5d23638d9225');
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
      assert.equal(shoulderArmImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded shoulder-arm-muscle imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,96);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
