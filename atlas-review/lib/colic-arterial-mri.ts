import pins from '../content/colic-arterial-mri-pins.json' with {type:'json'};
import {colicArterialMriGroups,colicArterialMriReferences} from '../content/colic-arterial-mri';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),group:entry.group}]));
/** MRI teaching for nine complete retained source selections, not patient segmentation. */
export function colicArterialMriLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri')return undefined;
 const binding=bindings.get(s.id);
 if(!binding||binding.signature!==sourceCanonical(s))return undefined;
 const topic=colicArterialMriGroups[binding.group];
 if(!topic||topic.fmaId!==s.fmaId||topic.laterality!==s.laterality)return undefined;
 return{readiness:'draft',title:`${s.name} · MRI orientation · draft`,body:topic.body,
  bullets:[topic.pitfall,
   'Routine abdominal MRI is not dedicated MR angiography; small arteries and adjacent veins may be difficult to separate.',
   'This retained donor surface provides orientation, not a validated image-derived branch, flow measurement or perfusion map.',
   'Return separation to zero before comparing relationships. Atlas camera movement is not a patient acquisition plane.'],
  citations:[colicArterialMriReferences.anatomy,colicArterialMriReferences.mra],
  note:'Independent anatomy/radiology review pending. No patient images, spatial registration or approved imaging link is connected. Confirm study, vessel identity, side, orientation and actual series in the separate Education viewer. Reference teaching only, not diagnosis, acquisition protocol, management guidance or a procedural route. Paid-lecture access remains independent.'};
}
