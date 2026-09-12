// Exact offline authoring reconstruction, never a runtime fallback or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/limb-bone-imaging-pins.json' with {type:'json'};
import after from '../content/limb-bone-imaging.transition.json' with {type:'json'};
export const limbBoneContentHash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeLimbBoneImaging({api,catalog}) {
  assert.equal(limbBoneContentHash(pins),'68b406b6bf9611e56266ea9914a0c134fe81444ee361bfbe678659d8d2b62c10');
  assert.equal(limbBoneContentHash(after),'4b4a2b60f303c9a16d95027af4657e189328c572d1065f9dc3d9ba8bbbada51d');
  const prior=new Map();
  for(const [i,e] of pins.entries.entries()) {
    assert.deepEqual(catalog.structures.find(s=>s.id===e.identity.id),e.identity);
    assert.equal(after.entries[i].id,e.identity.id);
    for(const tab of e.topics) {
      assert.equal(e.previous[tab].readiness,'pending');
      assert.equal(limbBoneContentHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded limb-bone imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,24);
  const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);if(!e)return api.bodyLesson(s,t);assert.deepEqual(s,e.identity);return structuredClone(e.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...v}=bodyLesson(s,t);return v;}};
}
