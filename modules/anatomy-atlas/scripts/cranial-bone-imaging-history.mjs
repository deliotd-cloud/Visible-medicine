// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/cranial-bone-imaging-pins.json' with {type:'json'};
import after from '../content/cranial-bone-imaging.transition.json' with {type:'json'};
export const cranialBoneImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeCranialBoneImaging({api,catalog}) {
  assert.equal(cranialBoneImagingHash(pins),'d523e503beac8efdce674054c4d0e40d765763734f45fd1dc43c23751730a47a');
  assert.equal(cranialBoneImagingHash(after),'ef99aa613b9a53bfb6dd6c3c1a01d1ff8ad797ef45a550ea1c9ac904bc93c803');
  assert.equal(pins.sourceCommit,'ae9b0112b9980206b14c4676c941dc13a88834fc');
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
      assert.equal(cranialBoneImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded cranial-bone imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,46);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
