// Offline comparison only: never imported by the viewer or approval workflow.
import assert from 'node:assert/strict';
import {authoringBeforeCraniofacialOrganImaging} from './craniofacial-organ-imaging-history.mjs';
import {createHash} from 'node:crypto';
import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import after from '../content/abdominal-branch-imaging.transition.json' with {type:'json'};
export const abdominalBranchImagingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeAbdominalBranchImaging(context) {
  const {catalog}=context,api=authoringBeforeCraniofacialOrganImaging(context);
  assert.equal(abdominalBranchImagingHash(pins),'e174a782378af2b538060a93bb77c1e3189d75e6b144f474dd0c8e0dd2cb69fe');
  assert.equal(abdominalBranchImagingHash(after),'edb6f0714df72f9e6abcdb535df320746c8c4840ae41fe5aeadd547fddb3ff43');
  assert.equal(pins.sourceCommit,'193de0e4273fee3ae69cf3f4402b74b6cde5e118');
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
      assert.equal(abdominalBranchImagingHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded abdominal branch imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,48);
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry)return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...content}=bodyLesson(s,t);return content;}};
}
