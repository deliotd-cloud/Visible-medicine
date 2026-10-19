import pins from '../content/forearm-arterial-imaging-pins.json' with {type:'json'};
import ctPins from '../content/forearm-arterial-ct-pins.json' with {type:'json'};
import {forearmArterialSelections,forearmArterialTopics,forearmArterialReferences,type ForearmArterialGroup,type ForearmArterialModality} from '../content/forearm-arterial-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map([...pins.entries,...ctPins.entries].map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),group:e.group as ForearmArterialGroup}]));
const names={ct:'CT',mri:'MRI',ultrasound:'Ultrasound'};
/** Exact source identity only; neither a patient registration nor an access grant. */
export function forearmArterialImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(!Object.hasOwn(names,tab))return undefined;
 const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.identity)return undefined;
 const spec=forearmArterialSelections.find(p=>p.fmas.includes(s.fmaId));if(!spec||spec.group!==binding.group)return undefined;
 const topic=forearmArterialTopics[binding.group][tab as ForearmArterialModality];if(!topic)return undefined;
 return {readiness:'draft',title:`${s.name} · ${names[tab as ForearmArterialModality]} arterial orientation · draft`,body:topic.body,
  bullets:[spec.landmark,...topic.bullets,`Source limit: ${spec.limit}`],
  note:'Introductory teaching for revision-bound radiologist review. Compare anatomy with separation at zero; cutaway is not a scan. No patient images, registration, diagnostic protocol or clinical approval. Case, Atlas and paid-lecture access remain independent.',
  citations:[...new Set([...spec.references,...topic.references].map(key=>forearmArterialReferences[key]))]};
}
