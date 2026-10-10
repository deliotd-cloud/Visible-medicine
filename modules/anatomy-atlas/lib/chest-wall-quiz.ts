import pins from '../content/chest-wall-quiz-pins.json' with {type:'json'};
import {chestWallQuizQuestions,type ChestWallQuizGroup} from '../content/chest-wall-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),group:entry.group as ChestWallQuizGroup}]));

/** Bind full retained source identities; midline intercostal IDs remain bilateral groups. */
export function chestWallQuizLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='quiz')return undefined;
  const bound=bindings.get(s.id);
  if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
  const question=chestWallQuizQuestions[bound.group];
  return {readiness:'draft',title:`${s.name} · Chest-wall quick check · draft`,
    body:question.body,bullets:[...question.choices],correctAnswer:question.correctAnswer,
    explanation:question.explanation,citations:[...question.references],
    note:'Original source-backed question; revision-bound radiologist review pending. Midline intercostal records are bilateral source groups, not single unpaired muscles. Usual anatomy does not validate individual spaces, nerves, attachments or tissue planes in these surfaces. No respiratory motion, diagnosis, procedural safety or patient registration is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
