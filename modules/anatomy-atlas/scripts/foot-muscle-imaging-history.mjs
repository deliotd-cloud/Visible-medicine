// Offline authoring comparison only. Never changes runtime lessons or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/foot-muscle-imaging-pins.json' with {type:'json'};
import after from '../content/foot-muscle-imaging.transition.json' with {type:'json'};
export const footImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeFootMuscleImaging({api,catalog}) {
  assert.equal(footImagingHash(pins),'7c893bedaab37787137d3ef3577505cdc354e5091d646cdac8d7c5c4d3c71bb8');
  assert.equal(footImagingHash(after),'5352ac8862dc4a0fed4dd8936460d19c41840f286f9060d038a3bf1bbb97658a');
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
      assert.equal(footImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded foot-muscle imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,144);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const{readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
