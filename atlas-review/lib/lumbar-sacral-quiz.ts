import pins from '../content/lumbar-sacral-quiz-pins.json' with {type:'json'};
import {lumbarSacralQuizQuestions,type LumbarSacralQuizGroup} from '../content/lumbar-sacral-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const identities=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as LumbarSacralQuizGroup}]));
export function lumbarSacralQuizLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='quiz')return undefined;
 const bound=identities.get(s.id);if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
 const q=lumbarSacralQuizQuestions[bound.group];
 const scope=bound.group==='numbering'?' The unresolved source T12–L1 disc is not normally absent, collapsed or fused.':bound.group==='sacrum'?' The whole sacrum is selected; individual sacral segments and foramina are not separate reviewed selections.':'';
 return {readiness:'draft',title:`${s.name} · Lumbar/sacral quick check · draft`,body:q.body,bullets:[...q.choices],correctAnswer:q.correctAnswer,explanation:q.explanation,citations:[q.reference],
  note:'Original question based on AAOS and radiology publications; no source prose or images reproduced. Radiologist review pending for this source revision. Landmarks, foramina and neural structures are teaching facts, not individually segmented or validated structures. Source meshes are educational anatomy, not patient imaging or registered CT/MRI. This is not diagnosis, imaging clearance or treatment advice. Atlas, imaging-case and lecture access remain independent.'+scope};
}
