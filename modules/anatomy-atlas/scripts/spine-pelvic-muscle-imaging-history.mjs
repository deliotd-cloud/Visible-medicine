// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/spine-pelvic-muscle-imaging-pins.json' with {type:'json'};
import after from '../content/spine-pelvic-muscle-imaging.transition.json' with {type:'json'};
export const spinePelvicImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeSpinePelvicMuscleImaging({api,catalog}) {
  assert.equal(spinePelvicImagingHash(pins),'eca0c2b76336b10fec7f6ca924451e778956f5e479214aae9d5c65daa995d876');
  assert.equal(spinePelvicImagingHash(after),'b834a52b1536b06f294f6f87f0ecb4066c2245e225cf4381a475ab8797f7795f');
  assert.equal(pins.sourceCommit,'213699f56adf0f25055913c906f3a976df80a10a');
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
      assert.equal(spinePelvicImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded spine-pelvic-muscle imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,192);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
