import pins from '../content/genicular-mri-pins.json' with {type:'json'};
import {genicularMriReferences as references,genicularMriLandmarks as landmarks,genicularMriContext} from '../content/genicular-mri';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),family:e.family as keyof typeof landmarks}]));
/** Exact complete source identity; never a name match or a patient correspondence. */
export function genicularMriLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri')return undefined;
 const bound=bindings.get(s.id);if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
 return{readiness:'draft',title:`${s.name} · MRI / MRA orientation · draft`,body:genicularMriContext,
  bullets:[landmarks[bound.family],
   `Original ${s.laterality} source ${s.fmaId}: ${s.sources.map(p=>p.file).join(', ')}. No mirrored replacement or measured vessel calibre.`,
   'A mesh endpoint, gap or colour supplies no MR signal, enhancement, blood flow or evidence of stenosis. Source surfaces do not establish a complete genicular anastomotic network.',
   'Return separation to zero before anatomical comparison. Explode and cutaway do not create MRI slices, contrast phases, synovial enhancement or registered patient contours.',
  ],citations:[references.anatomy,references.variants,...(bound.family==='middle'?[references.middle]:[]),references.mra,references.acquisition],
  note:'Original educational draft; revision-bound radiologist sign-off pending, with no clinical or imaging approval. No acquisition or treatment recommendation, surgical safe zone or embolization target is inferred. Atlas, case and paid-lecture access remain independent.',
 };
}
