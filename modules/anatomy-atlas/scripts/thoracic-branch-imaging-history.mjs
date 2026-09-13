// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/thoracic-branch-imaging-pins.json' with {type:'json'};
import after from '../content/thoracic-branch-imaging.transition.json' with {type:'json'};
export const thoracicBranchImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeThoracicBranchImaging({api,catalog}) {
  assert.equal(thoracicBranchImagingHash(pins),'0f63534f228382dbf196f4dd2c732f9824bd0727752da8a198fb27ab764234ad');
  assert.equal(thoracicBranchImagingHash(after),'e44a7a602db8b26ba1ae4081280a5647715fe106d6a117d0068ab8e6dbc1abd6');
  assert.equal(pins.sourceCommit,'270ef68dc7499672549ee3967b485f61eecf3139');
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
      assert.equal(thoracicBranchImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded thoracic branch imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,50);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
