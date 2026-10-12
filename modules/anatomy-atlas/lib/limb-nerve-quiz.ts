import pins from '../content/limb-nerve-quiz-pins.json' with {type:'json'};
import {limbNerveQuizQuestions,type LimbNerveQuizGroup} from '../content/limb-nerve-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentQuizCheck} from '../app/anatomy-data';
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{
  signature:sourceCanonical(entry.identity),group:entry.group as LimbNerveQuizGroup,
}]));

/** Compare factual supply on a retained muscle, never manufacture a nerve surface. */
export function limbNerveQuizChecks(s:BodyStructure):ContentQuizCheck[]|undefined{
  const bound=bindings.get(s.id);
  if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
  const question=limbNerveQuizQuestions[bound.group];
  return [{key:bound.group,body:question.body,bullets:[...question.choices],
    correctAnswer:question.correctAnswer,explanation:question.explanation,citations:[...question.references],
    note:'Original factual relationship check; revision-bound radiologist review pending. Usual supply is not a patient-specific map. The selected surface is muscle, not nerve geometry; no branch course, independent head territory, movement, diagnosis or patient-space registration is established. Atlas, imaging-case and paid-lecture access remain independent.',
  }];
}
