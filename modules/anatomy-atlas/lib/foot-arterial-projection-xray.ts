import pins from '../content/foot-arterial-projection-xray-pins.json' with { type: 'json' };
import {footArterialProjectionXrayReferences,footArterialProjectionXrayShared,footArterialProjectionXrayTopics,type FootArterialProjectionXrayGroup} from '../content/foot-arterial-projection-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),group:entry.group as FootArterialProjectionXrayGroup}]));
/** Exact source identity only; never an acquired vessel or patient-space mapping. */
export function footArterialProjectionXrayLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bound.get(structure.id);
  if(!binding||sourceCanonical(structure)!==binding.signature)return undefined;
  const topic=footArterialProjectionXrayTopics[binding.group];
  return {
    readiness:'draft',title:`${structure.name} · X-ray arterial orientation · draft`,body:topic.body,
    bullets:[...footArterialProjectionXrayShared],
    citations:[...new Set([...topic.references.map(key=>footArterialProjectionXrayReferences[key]),footArterialProjectionXrayReferences.calcification])],
    note:'Independent anatomy/radiology review pending. Reading references only: no acquired images, contrast lumen, diagnosis, procedural planning, paid-lecture access or validated scan registration. Ordinary radiography and contrast angiography are distinct examinations.',
  };
}
