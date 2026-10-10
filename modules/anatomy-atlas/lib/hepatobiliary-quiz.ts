import pins from '../content/hepatobiliary-quiz-pins.json' with {type:'json'};
import {hepatobiliaryQuizQuestions,type HepatobiliaryQuizGroup} from '../content/hepatobiliary-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),group:entry.group as HepatobiliaryQuizGroup}]));

/** Full retained identities, including legacy region assignments; no name/FMA fallback. */
export function hepatobiliaryQuizLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='quiz')return undefined;
  const bound=bindings.get(s.id);
  if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
  const question=hepatobiliaryQuizQuestions[bound.group];
  return {readiness:'draft',title:`${s.name} · Hepatobiliary quick check · draft`,
    body:question.body,bullets:[...question.choices],correctAnswer:question.correctAnswer,
    explanation:question.explanation,citations:[...question.references],
    note:'Original source-backed question; revision-bound radiologist review pending. Usual anatomical relationships are teaching context, not verified continuity of these surfaces. No acquired imaging, diagnostic finding, flow, surgical safety or patient-space registration is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
