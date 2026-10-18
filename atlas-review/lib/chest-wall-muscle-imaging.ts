import pins from '../content/chest-wall-muscle-imaging-pins.json' with {type:'json'};
import {chestWallMuscleImagingGroups, chestWallMuscleImagingModes, chestWallMuscleImagingReferences, type ChestWallMuscleImagingGroup, type ChestWallImagingModality} from '../content/chest-wall-muscle-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as ChestWallMuscleImagingGroup}]));
const names={ct:'CT',mri:'MRI',ultrasound:'Ultrasound',xray:'X-ray'};
/** Only the retained source selections; never a patient-space correspondence. */
export function chestWallMuscleImagingLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!Object.hasOwn(chestWallMuscleImagingModes,tab))return undefined;
  const binding=bound.get(structure.id);
  if(!binding||sourceCanonical(structure)!==binding.signature)return undefined;
  const modality=tab as ChestWallImagingModality,group=chestWallMuscleImagingGroups[binding.group];
  const mode=chestWallMuscleImagingModes[modality],focus=group.focus[modality];
  return {
    readiness:'draft',title:`${structure.name} · ${names[modality]} orientation · draft`,
    body:focus.text,
    bullets:[group.landmark.text,mode.text,group.limitation],
    citations:[...new Set([focus,group.landmark,mode].flatMap(f=>f.references.map(key=>chestWallMuscleImagingReferences[key])))],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No patient images, scan registration or paid-lecture access is supplied. Confirm patient, side, orientation and series in the separate Education viewer; this draft does not provide a diagnosis, acquisition protocol, needle route or treatment decision.',
  };
}
