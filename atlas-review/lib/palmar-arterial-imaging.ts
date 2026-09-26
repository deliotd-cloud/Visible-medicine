import pins from '../content/palmar-arterial-imaging-pins.json' with {type:'json'};
import {palmarArterialSelections,palmarArterialTopics,palmarArterialReferences,type PalmarArterialGroup,type PalmarArterialModality} from '../content/palmar-arterial-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{identity:sourceCanonical(entry.identity),group:entry.group as PalmarArterialGroup,topics:new Set(entry.topics)}]));
const names={ct:'CT',mri:'MRI'};

/** Closed source-bound teaching only; this is neither scan registration nor procedural clearance. */
export function palmarArterialImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(!Object.hasOwn(names,tab))return undefined;
 const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.identity||!binding.topics.has(tab))return undefined;
 const spec=palmarArterialSelections.find(item=>item.fmaId===s.fmaId);
 if(!spec||spec.group!==binding.group||!spec.topics.includes(tab as PalmarArterialModality))return undefined;
 const topic=palmarArterialTopics[binding.group][tab as PalmarArterialModality];if(!topic)return undefined;
 return {
  readiness:'draft',title:`${s.name} · ${names[tab as PalmarArterialModality]} arterial orientation · draft`,body:topic.body,
  bullets:[...topic.bullets,...(binding.group==='proper-digital'?['The ten available proper-digital selections are not a complete bilateral digital arterial inventory.']:[]),'Reference geometry identifies the named selection; it does not establish patency, scan registration, collateral sufficiency or procedural clearance.'],
  note:'Introductory teaching for revision-bound radiologist review. Tailored angiographic acquisition is not routine MRI. No patient images, diagnostic protocol or clinical approval. Case, Atlas and paid-lecture access remain independent.',
  citations:[...new Set(topic.references.map(key=>palmarArterialReferences[key]))],
 };
}
