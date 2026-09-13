// Offline authoring comparison only. Never changes runtime lessons or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/head-neck-vessel-imaging-pins.json' with {type:'json'};
import after from '../content/head-neck-vessel-imaging.transition.json' with {type:'json'};
export const headNeckVesselImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeHeadNeckVesselImaging({api,catalog}) {
  assert.equal(headNeckVesselImagingHash(pins),'c20625db085ffc2384347cdc2bc51a148e2a70cff8e83395a67482303c9b0b99');
  assert.equal(headNeckVesselImagingHash(after),'6d9b9de741c16c5181c2fa7e9ab35b06653b62e8f29d10a15e056b9fc3959ed6');
  assert.equal(pins.sourceCommit,'b76fe16e01197a475a82e1adb461f86f29e5792c');
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
      assert.equal(headNeckVesselImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded head-neck-vessel imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,36);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const{readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
