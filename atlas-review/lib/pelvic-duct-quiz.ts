import pins from '../content/pelvic-duct-quiz-pins.json' with {type:'json'};
import {pelvicDuctQuizQuestions, type PelvicDuctQuizGroup} from '../content/pelvic-duct-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),group:entry.group as PelvicDuctQuizGroup}]));

/** Exact retained adult-male roots only; never attaches by label or inferred side. */
export function pelvicDuctQuizLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='quiz')return undefined;
  const bound=bindings.get(s.id);
  if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
  const question=pelvicDuctQuizQuestions[bound.group];
  return {
    readiness:'draft',title:`${s.name} · Pelvic duct quick check · draft`,
    body:question.body,bullets:[...question.choices],correctAnswer:question.correctAnswer,
    explanation:question.explanation,citations:[...question.references],
    note:'Original source-backed question; revision-bound radiologist review pending. Adult-male reference anatomy only, not independently linked female anatomy. Paired organs share a general principle, not side-specific findings. External surfaces do not validate microscopic anatomy, duct continuity, fertility or patient-space registration. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
