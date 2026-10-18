import pins from '../content/thoracic-small-vessel-mri-pins.json' with {type:'json'};
import {thoracicSmallVesselMriGroups,thoracicSmallVesselMriReferences} from '../content/thoracic-small-vessel-mri';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),group:entry.group}]));
/** Draft orientation for exact retained donor identities, never patient MRI registration. */
export function thoracicSmallVesselMriLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='mri')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||binding.signature!==sourceCanonical(s))return undefined;
  const topic=thoracicSmallVesselMriGroups[binding.group];
  if(!topic||topic.fmaId!==s.fmaId||topic.laterality!==s.laterality)return undefined;
  return{readiness:'draft',title:`${s.name} · MRI orientation · draft`,body:topic.body,
    bullets:[topic.pitfall,
      'Routine MRI does not guarantee definition of these small vessels; inspect the actual acquisition and source images.',
      'This retained donor surface is an anatomical guide, not an image-derived branch, lumen, flow or perfusion map.',
      'Return separation to zero before comparing relationships. Atlas camera movement is not a patient acquisition plane.'],
    citations:[...new Set(topic.references.map(key=>thoracicSmallVesselMriReferences[key]))],
    note:'Independent anatomy/radiology review pending. No patient images, spatial registration or approved imaging link is connected. Confirm actual study, structure identity, orientation and sequence in the separate Education viewer. Reference teaching only, not diagnosis, acquisition protocol, management guidance or a procedural route. Paid-lecture access remains independent.'};
}
