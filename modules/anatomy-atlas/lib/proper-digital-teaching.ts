import pins from '../content/palmar-arterial-imaging-pins.json' with {type:'json'};
import {properDigitalTeachingFacts,properDigitalTeachingReferences,properDigitalTeachingSelections} from '../content/proper-digital-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type FmaId=keyof typeof properDigitalTeachingSelections;
const bindings=new Map(pins.entries
  .filter(entry=>entry.group==='proper-digital' && Object.hasOwn(properDigitalTeachingSelections,entry.identity.fmaId))
  .map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),fmaId:entry.identity.fmaId as FmaId}]));

/** Source-bound anatomy and function drafts for the ten retained proper-digital selections. */
export function properDigitalTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='anatomy' && tab!=='function')return undefined;
  const binding=bindings.get(s.id);
  if(!binding || sourceCanonical(s)!==binding.signature)return undefined;
  const selection=properDigitalTeachingSelections[binding.fmaId];
  const namedDigit=`${selection.side} ${selection.digit}`;
  return tab==='anatomy' ? {
    readiness:'draft',
    title:`${s.name} · anatomy · draft`,
    body:`The source names this proper palmar digital artery on the ${selection.border} border of the ${namedDigit}, facing the ${selection.faces}.`,
    bullets:[properDigitalTeachingFacts.anatomy.trunk,properDigitalTeachingFacts.anatomy.orientation],
    note:'Anatomy and radiology review pending for this revision. The ten retained selections are incomplete bilateral coverage. Case, Atlas and lecture access remain independent.',
    citations:[...properDigitalTeachingReferences],
  } : {
    readiness:'draft',
    title:`${s.name} · function · draft`,
    body:`This named branch contributes to blood supply on the ${selection.border} side of the ${namedDigit}.`,
    bullets:[properDigitalTeachingFacts.function.supply,properDigitalTeachingFacts.function.limit],
    note:'Anatomy and radiology review pending for this revision. The ten retained selections are incomplete bilateral coverage. Case, Atlas and lecture access remain independent.',
    citations:[...properDigitalTeachingReferences],
  };
}
