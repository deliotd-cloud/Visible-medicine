import pins from '../content/craniofacial-organ-imaging-pins.json' with {type:'json'};
import {craniofacialOrganImagingGroups as groups,craniofacialOrganImagingReferences as references,type CraniofacialOrganModality} from '../content/craniofacial-organ-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bound=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group,anatomy:e.anatomy}]));
const names={ct:'CT',mri:'MRI',ultrasound:'Ultrasound',xray:'X-ray'};
/** Exact original source only. Never authorises examination or imports a scan. */
export function craniofacialOrganImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!Object.hasOwn(names,tab))return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const modality=tab as CraniofacialOrganModality,g=groups[match.group],focus=g.focus[modality];
  return {
    readiness:'draft',title:`${s.name} · ${names[modality]} orientation · draft`,body:focus.body,
    bullets:[match.anatomy.body,focus.pitfall,g.limit],
    citations:[...new Set([...(match.anatomy.citations??[]),...focus.references.map(key=>references[key])])],
    note:'Anatomy/radiology review pending. Use reference positions with separation at zero. No imaging study or spatial registration is connected. Confirm patient, side, orientation and series in Didanix Education/light; these notes do not prescribe acquisition, diagnose disease or establish MRI/probe safety. Atlas, case and paid-lecture access remain independent.',
  };
}
