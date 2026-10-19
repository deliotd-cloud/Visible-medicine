import data from '../public/models/bodyparts3d/short-ciliary/catalog.json' with {type:'json'};
import {shortCiliaryQuizQuestions} from '../content/short-ciliary-quiz';
import {sourceCanonical,type BodySourceAddition} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const source=data as unknown as BodySourceAddition;
if(source.structures.length!==1||source.structures[0].fmaId!=='FMA7041'||
  source.structures[0].id!=='vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve'||
  source.structures[0].laterality!=='unspecified')throw Error('Unexpected short-ciliary quiz source.');
const identity=sourceCanonical(source.structures[0]);
const note='Original source-backed formative draft; exact-revision radiologist review pending. One unsided source group, not validated individual nerve counts, fibre maps or a complete ocular pathway. No acquired-scan visibility, diagnosis, procedure safety, physiological measurement or patient-space registration is established. Atlas, imaging-case and paid-lecture access remain independent.';

export function shortCiliaryQuizLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='quiz'||sourceCanonical(s)!==identity)return undefined;
  const [primary,...additional]=shortCiliaryQuizQuestions;
  return {readiness:'draft',title:`${s.name} · Ciliary pathway reasoning · draft`,
    body:primary.body,bullets:[...primary.choices],correctAnswer:primary.correctAnswer,
    explanation:primary.explanation,citations:[...primary.references],note,
    additionalChecks:additional.map(q=>({key:q.key,body:q.body,bullets:[...q.choices],
      correctAnswer:q.correctAnswer,explanation:q.explanation,citations:[...q.references],note})),
  };
}
