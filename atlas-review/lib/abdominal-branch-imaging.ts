import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import {abdominalBranchImagingGroups,abdominalBranchImagingReferences,type AbdominalBranchImagingModality} from '../content/abdominal-branch-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group,anatomy:e.anatomy}]));
const names={ct:'CT',mri:'MRI',ultrasound:'Ultrasound'};
/** Exact retained source selections only, not same-name specimens or patient masks. */
export function abdominalBranchImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!Object.hasOwn(names,tab))return undefined;
  const binding=bound.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const modality=tab as AbdominalBranchImagingModality,focus=abdominalBranchImagingGroups[binding.group].focus[modality];
  if(!focus)return undefined;
  const limitation=binding.anatomy.bullets?.find(b=>!b.startsWith('Source identity:'));
  return {
    readiness:'draft',title:`${s.name} · ${names[modality]} orientation · draft`,body:focus.body,
    bullets:[binding.anatomy.body,focus.pitfall,...(limitation?[limitation]:[])],
    citations:[...new Set([...(binding.anatomy.citations??[]),...focus.references.map(key=>abdominalBranchImagingReferences[key])])],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No scan or spatial registration is connected. Confirm patient, vessel, side, orientation and series in the separate Education viewer. These notes are not a diagnosis, acquisition protocol, management guideline or procedural route. Paid-lecture access remains independent.',
  };
}
