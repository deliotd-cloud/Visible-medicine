import pins from '../content/foot-muscle-imaging-pins.json' with {type:'json'};
import { footMuscleImagingGroups, footMuscleImagingModes, footMuscleImagingReferences, type FootMuscleImagingGroup, type FootImagingModality, type FootImagingFact } from '../content/foot-muscle-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as FootMuscleImagingGroup}]));
const names={ct:'CT',mri:'MRI',ultrasound:'Ultrasound',xray:'X-ray'};
/** Exact existing source records only; neither new anatomy nor a patient mapping. */
export function footMuscleImagingLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!Object.hasOwn(footMuscleImagingModes,tab))return undefined;
  const binding=bound.get(structure.id);
  if(!binding||sourceCanonical(structure)!==binding.signature)return undefined;
  const modality=tab as FootImagingModality, group=footMuscleImagingGroups[binding.group];
  const mode=footMuscleImagingModes[modality],focus=(group.focus as Partial<Record<FootImagingModality,FootImagingFact>>)[modality];
  const facts=[mode,group.landmark,...(focus?[focus]:[])];
  return {
    readiness:'draft', title:`${structure.name} · ${names[modality]} orientation · draft`,
    body:mode.text,
    bullets:[group.landmark.text,...(focus?[focus.text]:[]),group.limitation],
    citations:[...new Set(facts.flatMap(f=>f.references.map(key=>footMuscleImagingReferences[key])))],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No patient images, scan registration or paid-lecture access is supplied. Confirm patient, side, orientation and series in the separate Education viewer; this draft does not provide a diagnosis, acquisition protocol, needle route or treatment decision.',
  };
}
