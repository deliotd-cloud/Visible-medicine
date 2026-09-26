import pins from '../content/limb-bone-imaging-pins.json' with {type:'json'};
import {limbBoneImagingTopics,limbBoneImagingLandmarks,limbBoneImagingReferences,limbBoneUltrasoundLimit,type LimbBoneImagingGroup,type LimbBoneImagingModality} from '../content/limb-bone-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as LimbBoneImagingGroup}]));
const names={xray:'X-ray',ct:'CT',mri:'MRI',ultrasound:'Ultrasound'};
/** Full source record admission; preserves earlier knee CT/MRI and patellar US. */
export function limbBoneImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!['xray','ct','mri','ultrasound'].includes(tab))return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const modality=tab as LimbBoneImagingModality, topic=limbBoneImagingTopics[match.group][modality];
  if(!topic)return undefined;
  const landmark=limbBoneImagingLandmarks[match.group];
  return {readiness:'draft',title:`${s.name} · ${names[modality]} orientation · draft`,body:topic.body,
    bullets:[landmark.note,...topic.bullets,...(modality==='ultrasound'?[limbBoneUltrasoundLimit]:[]),'Set separation to zero before comparing relationships. These are whole source bones; named landmarks are not separately segmented or clinically validated.'],
    citations:[...new Set([landmark.reference,...topic.references,...(modality==='ultrasound'?['boneUS' as const]:[])].map(k=>limbBoneImagingReferences[k]))],
    note:'Independent anatomy/radiology review pending. No patient images, scan registration or paid-lecture access. Confirm patient, side, region, orientation and series for future imaging links. This is reference teaching, not diagnosis, an acquisition protocol or a treatment recommendation.'};
}
