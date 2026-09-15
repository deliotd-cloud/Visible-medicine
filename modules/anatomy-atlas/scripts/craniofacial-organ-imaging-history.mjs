// Offline historical comparison only; never imported by the viewer/review API.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/craniofacial-organ-imaging-pins.json' with {type:'json'};
import after from '../content/craniofacial-organ-imaging.transition.json' with {type:'json'};
export const craniofacialOrganImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeCraniofacialOrganImaging({api,catalog}) {
  const hash=craniofacialOrganImagingHash;
  assert.equal(hash(pins),'ce9a6fdec291f57bf08151d11cf1ad9771f40478b3f3030e760813e8b670c3cd');
  assert.equal(hash(after),'14115f664bd64fcb743951cbe057489dc5e9da8b9aed488757198c2320d97223');
  assert.equal(pins.sourceCommit,'efc5ed08bd300540861161f8f823aedb359a789d');
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
      assert.equal(hash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded craniofacial organ imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,36);
  // Archived pre-correction eyes share IDs, but never receive this transition.
  const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);if(!e||!isDeepStrictEqual(s,e.identity))return api.bodyLesson(s,t);return structuredClone(e.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
