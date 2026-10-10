// Frozen test-only editorial replay. Never learner dispatch or approval migration.
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import {beforeRespiratoryCoreDepth} from './respiratory-core-depth-history.mjs';
import pins from '../content/pelvic-reproductive-core-pins.json' with {type:'json'};
import transition from '../content/pelvic-reproductive-core.transition.json' with {type:'json'};
export function beforePelvicReproductiveCore(api){
 if(typeof api?.bodyLesson!=='function')return api;
 api=beforeRespiratoryCoreDepth(api);
 return replayPinnedTeaching(api,{
  name:'pelvic-reproductive-core',pins,transition,
  pinsHash:'d343309d262a854581d85b332d74254d69bbecfe16d03efe9fdf021cd2729633',
  transitionHash:'3a0be27bf5b89d4d41fb74d80c3b3083b04a451155bb9ce438ff1ed70bc0d2ac',
  helper:'pelvicReproductiveCoreLesson',optionalHelper:true,
 });
}
