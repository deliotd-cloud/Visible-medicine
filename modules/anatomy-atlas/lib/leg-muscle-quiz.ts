import pins from '../content/leg-muscle-quiz-pins.json' with {type:'json'};
import {legMuscleQuizQuestions,type LegMuscleQuizGroup} from '../content/leg-muscle-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{
  signature:sourceCanonical(entry.identity),group:entry.group as LegMuscleQuizGroup,
}]));

/** Original formative teaching bound to each complete retained bilateral identity. */
export function legMuscleQuizLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='quiz')return undefined;
  const bound=bindings.get(s.id);
  if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
  const question=legMuscleQuizQuestions[bound.group];
  return {readiness:'draft',title:`${s.name} · Leg muscle quick check · draft`,
    body:question.body,bullets:[...question.choices],correctAnswer:question.correctAnswer,
    explanation:question.explanation,citations:[...question.references],
    note:'Original source-backed question; revision-bound radiologist review pending. Usual anatomical relationships do not validate detailed attachments, tissue boundaries or movement in these reference surfaces. No diagnosis, procedural safety or patient-space registration is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
