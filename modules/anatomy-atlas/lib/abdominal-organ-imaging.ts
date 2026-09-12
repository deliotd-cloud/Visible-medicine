import pins from '../content/abdominal-organ-imaging-pins.json' with {type:'json'};
import {abdominalOrganImagingTopics,abdominalOrganImagingLandmarks,abdominalOrganImagingScope,abdominalOrganImagingReferences,type AbdominalOrganImagingGroup,type AbdominalOrganImagingModality} from '../content/abdominal-organ-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as AbdominalOrganImagingGroup}]));
const names={xray:'X-ray',ct:'CT',mri:'MRI',ultrasound:'Ultrasound'};
/** Source-specific teaching; no archival, independent-specimen or scan aliasing. */
export function abdominalOrganImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!['xray','ct','mri','ultrasound'].includes(tab))return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const modality=tab as AbdominalOrganImagingModality,topic=abdominalOrganImagingTopics[match.group][modality];
  return {readiness:'draft',title:`${s.name} · ${names[modality]} orientation · draft`,body:topic.body,
    bullets:[abdominalOrganImagingLandmarks[match.group],...topic.bullets,abdominalOrganImagingScope[match.group]],
    citations:[...new Set([abdominalOrganImagingReferences.landmarks,...topic.references.map(k=>abdominalOrganImagingReferences[k])])],
    note:'Independent anatomy/radiology review pending. Compare spatial relationships with separation at zero. No patient images, scan registration or paid-lecture access. Confirm patient, organ, side, sequence and contrast phase before future image comparison. Not a diagnosis, acquisition protocol or management guideline.'};
}
