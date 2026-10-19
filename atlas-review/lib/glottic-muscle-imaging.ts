import pins from '../content/glottic-muscle-imaging-pins.json' with {type:'json'};
import {glotticMuscleImagingReferences as references,glotticMuscleImagingTopics as topics} from '../content/glottic-muscle-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
type Family=keyof typeof topics;
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),family:e.family as Family}]));
/** Exact retained sources only. A mesh selection is not a resolved scan boundary. */
export function glotticMuscleImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='ct'&&tab!=='mri')return undefined;
 const bound=bindings.get(s.id);if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
 const topic=topics[bound.family];
 return{
  readiness:'draft',title:`${s.name} · ${tab.toUpperCase()} glottic orientation · draft`,body:topic[tab],
  bullets:[topic.landmark,
   `Retained source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} recorded component${s.sources.length===1?'':'s'}. Separate source labels do not validate tissue partitions or attachment footprints.`,
   'No airway, vocal ligament, mucosal layer or fold motion is generated. These muscle surfaces are not the whole true fold, false fold or paraglottic space.',
   ...(tab==='mri'?['Historical high-resolution laryngeal MR observations are not a guarantee of individual-muscle visibility on routine scans.']:[]),
  ],
  citations:[references.anatomy,references[tab]],
  note:'Original source-bound educational draft; revision-bound radiologist review pending. No scan is loaded or registered, and no denervation, tumour extent, vocal-fold mobility or diagnostic protocol is inferred. Atlas, case and paid-lecture access remain independent.',
 };
}
