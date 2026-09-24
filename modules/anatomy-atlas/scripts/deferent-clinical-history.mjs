// Offline historical comparison only; never imported by the viewer/review API.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/deferent-clinical-pins.json' with {type:'json'};
import after from '../content/deferent-clinical.transition.json' with {type:'json'};
import {authoringBeforeClinicalReferenceRevision} from './clinical-reference-revision-history.mjs';

export const deferentClinicalHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeDeferentClinical({api,catalog},{sourceAtTransition=false}={}) {
  if(!sourceAtTransition)api=authoringBeforeClinicalReferenceRevision({api,catalog});
  const hash=deferentClinicalHash;
  assert.equal(hash(pins),'761af9526c4f86ec1fb7e7822f89fe1979b4276a20ab8b3bb5a86902b3cf1eea');
  assert.equal(hash(after),'2ac896dc902eecdd732ae7fa4a4a9858fca1b6a6debd204e22dd8185ca18f43f');
  assert.equal(pins.sourceCommit,'62f15bb1c1e20b0cb0bfad1e8484893f577240cb');
  assert.equal(after.parentCommit,pins.sourceCommit);
  assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();
  assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);
  assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  for(const [index,entry] of pins.entries.entries()){
    assert.equal(display.structures.filter(s=>s.id===entry.identity.id).length,1);
    assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity);
    assert.deepEqual(api.bodyLesson(entry.identity,'anatomy'),entry.anatomy);
    assert.equal(after.entries[index].id,entry.identity.id);
    for(const topic of entry.topics){
      assert.equal(entry.previous[topic].readiness,'pending');
      assert.equal(hash(api.bodyLesson(entry.identity,topic)),after.entries[index].sections[topic],'Unrecorded deferent clinical change');
      prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:entry.previous[topic]});
    }
  }
  assert.equal(prior.size,4);
  // The whole-body digest is checked against the exact transition Git tree by
  // validate-deferent-clinical; later teaching cannot reproduce that old tree.
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry||!isDeepStrictEqual(s,entry.identity))return api.bodyLesson(s,t);return structuredClone(entry.lesson);};
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
