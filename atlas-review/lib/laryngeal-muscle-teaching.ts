import pins from '../content/laryngeal-muscle-teaching-pins.json' with {type:'json'};
import {laryngealMuscleTeachingTopics as topics,laryngealMuscleTeachingReferences as references,laryngealMuscleTeachingCredit as credit} from '../content/laryngeal-muscle-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof topics;
const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family}]));

/** Teaching belongs only to the exact admitted root, not a name/FMA lookalike. */
export function laryngealMuscleTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='anatomy'&&tab!=='function')return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const topic=topics[match.family][tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      'Motor context: recurrent-laryngeal branches of the vagus supply these selected intrinsic muscles. This is teaching context, not an included nerve segmentation or a test of nerve function.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} recorded component${s.sources.length===1?'':'s'} in ${s.bundle}. ${s.coverageNote ?? 'Attachment footprints and tissue boundaries remain unvalidated.'}`,
      credit],
    citations:[...references],
    note:'Source-bound educational draft for revision-bound radiologist review. No complete mucosal layers, validated airway lumen, recurrent-laryngeal nerve geometry, phonation or swallowing is simulated. Withheld laryngeal/pharyngeal sources remain withheld. Atlas, case and paid-lecture access remain independent.',
  };
}
