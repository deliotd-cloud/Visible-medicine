// Exact offline authoring reconstruction, never a runtime fallback or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/thoracic-bone-imaging-pins.json' with {type:'json'};
import after from '../content/thoracic-bone-imaging.transition.json' with {type:'json'};
export const thoracicBoneContentHash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeThoracicBoneImaging({api,catalog}) {
  assert.equal(thoracicBoneContentHash(pins),'ee1f110743a946bc73e840ba760a862a19b3b7629869483ac005aaa72e86354d');
  assert.equal(thoracicBoneContentHash(after),'32c432e6fdeafd1ceabf8b8b996868882da7f26340d59c4cd5e5e07e71711d4e');
  const prior=new Map();
  for(const [i,e] of pins.entries.entries()) {
    assert.deepEqual(catalog.structures.find(s=>s.id===e.identity.id),e.identity);
    assert.equal(after.entries[i].id,e.identity.id);
    for(const tab of e.topics) {
      assert.equal(e.previous[tab].readiness,'pending');
      assert.equal(thoracicBoneContentHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded thoracic-bone imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,108);
  const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);if(!e)return api.bodyLesson(s,t);assert.deepEqual(s,e.identity);return structuredClone(e.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...v}=bodyLesson(s,t);return v;}};
}
