// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/orbital-neck-muscle-imaging-pins.json' with {type:'json'};
import after from '../content/orbital-neck-muscle-imaging.transition.json' with {type:'json'};
export const orbitalNeckMuscleImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeOrbitalNeckMuscleImaging({api,catalog}) {
  assert.equal(orbitalNeckMuscleImagingHash(pins),'60b567bffd425213579f53f3ecd444b94f3746fa62943ea1fe4c578f232dd722');
  assert.equal(orbitalNeckMuscleImagingHash(after),'4319013a1a2c16ea7b9456385377b00f68b64aba8bf246e832d4bbbd4773d059');
  assert.equal(pins.sourceCommit,'d709e70a6678b7846053f39b4e7ebae8efb79f55');
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
      assert.equal(orbitalNeckMuscleImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded orbital/neck muscle imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,112);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
