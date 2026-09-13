// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import after from '../content/central-vessel-imaging.transition.json' with {type:'json'};
export const centralVesselImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeCentralVesselImaging({api,catalog}) {
  assert.equal(centralVesselImagingHash(pins),'a857867b80d31d01ab55c688264010759dce0a0a802a6a7cd76b9f7d68b467c4');
  assert.equal(centralVesselImagingHash(after),'fdfb91c066f5286eb46aaa992e796fec8aa586f9b307ae2e647f54a02f143ebb');
  assert.equal(pins.sourceCommit,'6d8c900b4f80843ca7568e4222ffb49d0d22e1f1');
  assert.equal(after.parentCommit,pins.sourceCommit);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();
  assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);
  assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const b of pins.bundles)assert.deepEqual(display.bundles.find(x=>x.id===b.id),b);
  for(const [i,e] of pins.entries.entries()) {
    assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);
    assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);
    assert.deepEqual(api.bodyLesson(e.identity,'anatomy'),e.anatomy);
    assert.equal(after.entries[i].id,e.identity.id);
    for(const tab of e.topics) {
      assert.equal(e.previous[tab].readiness,'pending');
      assert.equal(centralVesselImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded central vessel imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,79);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
