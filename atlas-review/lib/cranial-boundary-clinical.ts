import pins from '../content/cranial-boundary-clinical-pins.json' with {type:'json'};
import {cranialBoundaryTopics} from '../content/cranial-boundary-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,sourceCanonical(e.identity)]));
export function cranialBoundaryClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(bindings.get(s.id)!==sourceCanonical(s))return undefined;
 const tentorium=s.fmaId==='FMA83966';
 const topic=tentorium?(tab==='clinical'||tab==='pathology'?cranialBoundaryTopics.tentorium[tab]:undefined):tab==='clinical'?cranialBoundaryTopics.lamina.clinical:undefined;
 if(!topic)return undefined;
 const limit=tentorium?'Incomplete right-sided tentorium only, not a paired organ or a complete bilateral fold. No complete notch, attachment footprints or dural venous sinuses are supplied.':'Two original lamina pieces, not a reconstructed continuous membrane. A shared source-coordinate vertex does not prove membrane continuity or patency.';
 return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
  bullets:[...topic.bullets,`Source limit: ${limit}`,`Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,`Reference: ${topic.credit}`],citations:[...topic.citations],
  note:'Educational draft for revision-bound radiologist review, not a diagnostic test or procedure plan. No patient registration, scan or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.'};
}
