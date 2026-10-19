import pins from '../content/thoracic-bone-imaging-pins.json' with {type:'json'};
import {thoracicBoneImagingTopics,thoracicBoneImagingLandmarks,thoracicBoneImagingReferences,thoracicBoneImagingFamily,type ThoracicBoneImagingGroup,type ThoracicBoneImagingModality} from '../content/thoracic-bone-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as ThoracicBoneImagingGroup}]));
const names={xray:'X-ray',ct:'CT',mri:'MRI',ultrasound:'Ultrasound'};
/** Exact source identity admission; never a name-only or patient-image match. */
export function thoracicBoneImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!['xray','ct','mri','ultrasound'].includes(tab))return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const modality=tab as ThoracicBoneImagingModality;
  const topic=thoracicBoneImagingTopics[thoracicBoneImagingFamily(match.group)][modality];
  return {readiness:'draft',title:`${s.name} · ${names[modality]} orientation · draft`,body:topic.body,
    bullets:[thoracicBoneImagingLandmarks[match.group],...topic.bullets,'Compare relationships with separation at zero. These are source bone surfaces; named landmarks and adjacent cartilages are not supplied by this selection.'],
    citations:[...new Set([thoracicBoneImagingReferences.landmarks,...topic.references.map(k=>thoracicBoneImagingReferences[k])])],
    note:'Independent anatomy/radiology review pending. No patient images, scan registration or paid-lecture access. Confirm patient, side, level, orientation and series before any future imaging comparison. Reference teaching only, not diagnosis or an acquisition protocol.'};
}
