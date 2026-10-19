import pins from '../content/forearm-venous-imaging-pins.json' with {type:'json'};
import {forearmVenousTopics,forearmVenousReferences,type ForearmVenousGroup} from '../content/forearm-venous-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),group:e.group as ForearmVenousGroup}]));
/** Exact source identity only; never a patient-image registration or access grant. */
export function forearmVenousImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri')return undefined;
 const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.identity)return undefined;
 const topic=forearmVenousTopics[binding.group];
 return {readiness:'draft',title:`${s.name} · MRI venous orientation · draft`,body:topic.body,
  bullets:[topic.landmark,...topic.bullets,'Source limit: This is one archived source selection, not a complete superficial network or a validated vein map.'],
  note:'Introductory teaching for revision-bound radiologist review. Compare anatomy with separation at zero; cutaway is not a scan. No patient images, registration, diagnostic protocol or clinical approval. Case, Atlas and paid-lecture access remain independent.',
  citations:topic.references.map(key=>forearmVenousReferences[key])};
}
