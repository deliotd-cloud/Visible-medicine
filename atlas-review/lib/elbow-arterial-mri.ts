import pins from '../content/elbow-arterial-mri-pins.json' with {type:'json'};
import {elbowArterialMriReferences as references,elbowArterialMriLandmarks as landmarks,elbowArterialMriContext} from '../content/elbow-arterial-mri';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),family:e.family as keyof typeof landmarks}]));
/** Complete identity admits the original side, not an inferred patient correspondence. */
export function elbowArterialMriLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri')return undefined;
 const bound=bindings.get(s.id);if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
 return{readiness:'draft',title:`${s.name} · MRI / MRA orientation · draft`,body:elbowArterialMriContext,
  bullets:[landmarks[bound.family],
   `Original ${s.laterality} source ${s.fmaId}: ${s.sources.map(p=>p.file).join(', ')}. The opposite side is an independent source, not a mirrored replacement.`,
   'A gap, endpoint or mesh colour supplies no MR signal, enhancement, measured calibre, blood flow or stenosis finding. The donor surfaces do not establish complete elbow arcades or perforator territories.',
   'Return separation to zero before spatial comparison. Explode and cutaway do not create MRI slices, contrast phases or registered patient contours.',
  ],citations:[references.anatomy,references.cadaver,references.variation,references.imaging,references.acquisition],
  note:'Original educational draft; revision-bound radiologist sign-off pending, with no clinical or imaging approval. No acquisition or treatment protocol, embolization target, surgical safe zone or perfusion reserve is inferred. Atlas, case and paid-lecture access remain independent.',
 };
}
