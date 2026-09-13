import pins from '../content/spine-pelvic-muscle-imaging-pins.json' with {type:'json'};
import {spinePelvicImagingGroups,spinePelvicImagingModes,spinePelvicImagingReferences,type SpinePelvicImagingModality} from '../content/spine-pelvic-muscle-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group}]));
const names={ct:'CT',mri:'MRI',ultrasound:'Ultrasound'};
/** Exact retained source selections only; no name matching or inferred mirroring. */
export function spinePelvicMuscleImagingLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!Object.hasOwn(spinePelvicImagingModes,tab))return undefined;
  const binding=bound.get(structure.id);
  if(!binding||sourceCanonical(structure)!==binding.signature)return undefined;
  const modality=tab as SpinePelvicImagingModality,group=spinePelvicImagingGroups[binding.group];
  const mode=spinePelvicImagingModes[modality],focus=group.focus[modality];
  return {
    readiness:'draft',title:`${structure.name} · ${names[modality]} orientation · draft`,
    body:focus.text,bullets:[group.landmark,mode.text,group.limitation],
    citations:[...new Set([...group.anatomyReferences,...[focus,mode].flatMap(f=>f.references.map(key=>spinePelvicImagingReferences[key]))])],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No scan or spatial registration is connected. Confirm patient, side, orientation and series in the separate Education viewer; this draft is not a diagnosis, acquisition protocol or procedural route. Paid-lecture access remains independent.',
  };
}
