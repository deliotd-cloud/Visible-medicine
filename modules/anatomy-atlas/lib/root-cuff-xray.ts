import pins from '../content/root-cuff-xray-pins.json' with {type:'json'};
import {rootCuffXrayFacts,rootCuffXrayLimitations,rootCuffXrayReferences} from '../content/root-cuff-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof rootCuffXrayFacts;
const bindings=new Map(pins.entries.filter(entry=>Object.hasOwn(rootCuffXrayFacts,entry.family)).map(entry=>[
  entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family},
]));

/** Root-display source identities only; no inference onto dedicated shoulder geometry. */
export function rootCuffXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const fact=rootCuffXrayFacts[binding.family];
  return {
    readiness:'draft',title:`${s.name} · X-ray orientation · draft`,body:fact.body,
    bullets:[fact.distinction,...rootCuffXrayLimitations],
    citations:[...rootCuffXrayReferences],
    note:'Revision-bound radiologist review pending. No acquired study, patient-to-atlas registration or diagnosis is supplied. Atlas, imaging-case and lecture access remain independent.',
  };
}
