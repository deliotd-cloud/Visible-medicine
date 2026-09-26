import pins from '../content/abdominal-connective-imaging-pins.json' with {type:'json'};
import {abdominalConnectiveSelections,abdominalConnectiveTopics,abdominalConnectiveReferences,type AbdominalConnectiveGroup,type AbdominalConnectiveModality} from '../content/abdominal-connective-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),group:e.group as AbdominalConnectiveGroup}]));
const names={ct:'CT',ultrasound:'Ultrasound'};
/** Exact source identity only; neither a patient registration nor an access grant. */
export function abdominalConnectiveImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(!Object.hasOwn(names,tab))return undefined;
 const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.identity)return undefined;
 const spec=abdominalConnectiveSelections.find(p=>p.fmas.includes(s.fmaId));if(!spec||spec.group!==binding.group)return undefined;
 const topic=abdominalConnectiveTopics[binding.group][tab as AbdominalConnectiveModality];if(!topic)return undefined;
 return {readiness:'draft',title:`${s.name} · ${names[tab as AbdominalConnectiveModality]} abdominal connective-tissue orientation · draft`,body:topic.body,
  bullets:[spec.landmark,...topic.bullets,`Source limit: ${spec.limit}`],
  note:'Introductory teaching for revision-bound radiologist review. Compare anatomy with separation at zero; cutaway is not a scan. No patient images, registration, diagnostic protocol or clinical approval. Case, Atlas and paid-lecture access remain independent.',
  citations:[...new Set([...spec.references,...topic.references].map(key=>abdominalConnectiveReferences[key]))]};
}
