// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/acral-bone-imaging-pins.json' with {type:'json'};
import after from '../content/acral-bone-imaging.transition.json' with {type:'json'};
export const acralBoneImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeAcralBoneImaging({api,catalog}) {
  assert.equal(acralBoneImagingHash(pins),'668daecdc8f76d8c7d0d6648a36196587c486c0b0f091d14238a7e0b8980ef18');
  assert.equal(acralBoneImagingHash(after),'0f7526337d67dba5ab2adebd2c1c0bca4270071c0edae30e65bc2013c7b65dce');
  assert.equal(pins.sourceCommit,'4492d6bc47bd11f537cb6aa2bffe324ca3dc3881');
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
      assert.equal(acralBoneImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded acral-bone imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,152);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
