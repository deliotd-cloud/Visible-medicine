// Offline historical comparison only; never imported by the viewer/review API.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/rectal-deferent-imaging-pins.json' with {type:'json'};
import after from '../content/rectal-deferent-imaging.transition.json' with {type:'json'};

export const rectalDeferentImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeRectalDeferentImaging({api,catalog}) {
  const hash=rectalDeferentImagingHash;
  assert.equal(hash(pins),'0361154e0406108f965ed83466a21ddc5f6468d5eefe93fc8524236604ceeb10');
  assert.equal(hash(after),'e160a2dad29e76c5e5a254744a18ca5a55ebcfe96589e2de8d80e1950e2385ae');
  assert.equal(pins.sourceCommit,'130fda71a2af14fbbe5c018beed52e4c1212ed45');
  assert.equal(after.parentCommit,pins.sourceCommit);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();
  assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);
  assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const b of pins.bundles)assert.deepEqual(display.bundles.find(x=>x.id===b.id),b);
  for(const [i,e] of pins.entries.entries()){
    assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);
    assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);
    assert.deepEqual(api.bodyLesson(e.identity,'anatomy'),e.anatomy);
    assert.equal(after.entries[i].id,e.identity.id);
    for(const tab of e.topics){
      assert.equal(e.previous[tab].readiness,'pending');
      assert.equal(hash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded rectal/deferent imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,12);
  const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);if(!e||!isDeepStrictEqual(s,e.identity))return api.bodyLesson(s,t);return structuredClone(e.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
