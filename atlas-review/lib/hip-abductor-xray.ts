import pins from '../content/hip-imaging-pins.json' with {type:'json'};
import {hipAbductorXrayFacts,hipAbductorXrayReferences,hipAbductorXrayLimitations} from '../content/hip-abductor-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const groups: Record<string,keyof typeof hipAbductorXrayFacts> = {
  FMA22330:'medius',FMA22331:'medius',FMA22332:'minimus',FMA22333:'minimus',
};
const bindings=new Map(pins.entries.filter(e=>Object.hasOwn(groups,e.identity.fmaId)).map(e=>[
  e.identity.id,{signature:sourceCanonical(e.identity),group:groups[e.identity.fmaId]},
]));

/** Exact retained muscle sources only; never patient correspondence or approval. */
export function hipAbductorXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const fact=hipAbductorXrayFacts[binding.group];
  return {
    readiness:'draft',title:`${s.name} · X-ray orientation · draft`,body:fact.body,
    bullets:[fact.distinction,...hipAbductorXrayLimitations],
    citations:[...hipAbductorXrayReferences],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No X-ray image, detector geometry or scan registration is supplied. This is orientation teaching, not a diagnostic assessment. Imaging-atlas and paid-lecture access remain independent.',
  };
}
