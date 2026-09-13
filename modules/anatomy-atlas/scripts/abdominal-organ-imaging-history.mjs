// Offline authoring reconstruction only; never a runtime or approval migration.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import pins from '../content/abdominal-organ-imaging-pins.json' with {type:'json'};
import after from '../content/abdominal-organ-imaging.transition.json' with {type:'json'};
import correction from '../public/models/bodyparts3d/pancreas/display-correction.json' with {type:'json'};
import {authoringBeforePelvicOrganImaging} from './pelvic-organ-imaging-history.mjs';
import {authoringBeforeThighMuscleImaging} from './thigh-muscle-imaging-history.mjs';
import {authoringBeforeLegMuscleImaging} from './leg-muscle-imaging-history.mjs';
import {authoringBeforeFootMuscleImaging} from './foot-muscle-imaging-history.mjs';
import {authoringBeforeForearmMuscleImaging} from './forearm-muscle-imaging-history.mjs';
export const abdominalOrganContentHash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeAbdominalOrganImaging({api,catalog}) {
  api=authoringBeforeForearmMuscleImaging({api,catalog});
  api=authoringBeforeFootMuscleImaging({api,catalog});
  api=authoringBeforeLegMuscleImaging({api,catalog});
  api=authoringBeforeThighMuscleImaging({api,catalog});
  api=authoringBeforePelvicOrganImaging({api,catalog});
  assert.equal(abdominalOrganContentHash(pins),'4eaecd43646f4f7f2df08ee3dfb0846e3f372341009b4034b26695b38a5bfc69');
  assert.equal(abdominalOrganContentHash(after),'5c36a2d12cdd8c7db209be1e1cf78cdd0cadf01cdd3f856870818f238d7f30d8');
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();
  for(const [i,e] of pins.entries.entries()) {
    assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);
    assert.equal(after.entries[i].id,e.identity.id);
    for(const tab of e.topics) {
      assert.equal(e.previous[tab].readiness,'pending');
      assert.equal(abdominalOrganContentHash(api.bodyLesson(e.identity,tab)),after.entries[i].sections[tab],'Unrecorded abdominal-organ imaging change');
      prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
    }
  }
  assert.equal(prior.size,32);
  const bodyLesson=(s,t)=>{
    const e=prior.get(s.id+'|'+t);
    if(!e)return api.bodyLesson(s,t);
    // Older milestones address the unchanged four-source archive, not the corrected display.
    // Never transfer these new three-source lessons to that distinct representation.
    if(s.id===correction.original.id&&isDeepStrictEqual(s,correction.original)) {
      const lesson=api.bodyLesson(s,t);assert.equal(lesson.readiness,'pending');return lesson;
    }
    assert.deepEqual(s,e.identity);return structuredClone(e.lesson);
  };
  return {...api,bodyLesson,bodyContent(s,t){const {readiness:_r,...v}=bodyLesson(s,t);return v;}};
}
