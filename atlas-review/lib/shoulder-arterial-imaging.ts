import pins from '../content/shoulder-arterial-imaging-pins.json' with {type:'json'};
import {shoulderArterialImagingReferences as references,shoulderArterialImagingLandmarks as landmarks,shoulderArterialImagingContext as context,shoulderArterialImagingStudyNotes as studyNotes} from '../content/shoulder-arterial-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),family:e.family as keyof typeof landmarks}]));
/** Both sides require their complete independent original source identities. */
export function shoulderArterialImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri'&&tab!=='ultrasound')return undefined;
 const bound=bindings.get(s.id);if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
 const modality=tab==='mri'?'MRI / MRA':'Ultrasound';
 const citations=tab==='mri'?[references.anatomy,references.cadaver,references.mra]:
  [references.anatomy,references.cadaver,references.ultrasound,...(bound.family==='anterior-circumflex-humeral'?[references.anteriorDoppler]:bound.family==='thoracodorsal'?[references.thoracodorsalDoppler]:[])];
 return{readiness:'draft',title:`${s.name} · ${modality} orientation · draft`,body:context[tab],
  bullets:[landmarks[bound.family],
   `Independent original ${s.laterality} source ${s.fmaId}: ${s.sources.map(p=>p.file).join(', ')}. Compare with the opposite side only as another donor-source selection, never as a mirrored replacement or registered patient contour.`,
   ...(tab==='ultrasound'?[studyNotes[bound.family],
    'A colour signal and a traced spectral sample are acquired evidence, not properties of this surface. Non-visualisation in one window must not be converted into an absent vessel, and a published measurement is not a normal-value threshold for this learner case.']:
    ['Trace a candidate branch in the source acquisition rather than assigning it from one projection or an adjacent dark focus. Signal, enhancement, calibre and lumen continuity must come from the images, not the mesh.',
     'A standard joint study may not cover the full axillary or thoracodorsal course. Do not equate a limited field of view, unshown segment or source gap with occlusion, anatomical absence or a complete collateral map.']),
   'Return separation to zero before spatial comparison. Explode, clipping and camera movement do not define an acquisition plane, ultrasound probe position or patient-to-atlas transform.',
  ],citations,
  note:'Original educational draft; revision-bound radiologist sign-off pending, with no clinical or imaging approval. No scanning protocol, diagnostic cutoff, perfusion reserve, surgical safe zone or flap-planning recommendation is inferred. Atlas, case and paid-lecture access remain independent.',
 };
}
