import pins from '../content/head-neck-vessel-imaging-pins.json' with {type:'json'};
import { headNeckVesselImagingGroups, headNeckVesselImagingModes, headNeckVesselImagingReferences, type HeadNeckVesselImagingGroup, type HeadNeckVesselModality, type HeadNeckVesselFact } from '../content/head-neck-vessel-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as HeadNeckVesselImagingGroup}]));
const names={ct:'CT',mri:'MRI',ultrasound:'Ultrasound',xray:'X-ray'};
/** Exact existing source records only; neither new anatomy nor a patient mapping. */
export function headNeckVesselImagingLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!Object.hasOwn(headNeckVesselImagingModes,tab))return undefined;
  const binding=bound.get(structure.id);
  if(!binding||sourceCanonical(structure)!==binding.signature)return undefined;
  const modality=tab as HeadNeckVesselModality, group=headNeckVesselImagingGroups[binding.group];
  const mode=headNeckVesselImagingModes[modality],focus=(group.focus as Partial<Record<HeadNeckVesselModality,HeadNeckVesselFact>>)[modality];
  const facts=[mode,group.landmark,...(focus?[focus]:[])];
  return {
    readiness:'draft', title:`${structure.name} · ${names[modality]} orientation · draft`,
    body:focus?.text ?? mode.text,
    bullets:[group.landmark.text,...(focus?[mode.text]:[]),group.limitation],
    citations:[...new Set(facts.flatMap(f=>f.references.map(key=>headNeckVesselImagingReferences[key])))],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No patient images, scan registration or paid-lecture access is supplied. Confirm patient, side, orientation and series in the separate Education viewer; these drafts are not patient segmentations or surgical targets.',
  };
}
