import pins from '../content/iliac-arterial-imaging-pins.json' with {type:'json'};
import {internalIliacUltrasoundFacts,internalIliacUltrasoundReferences} from '../content/internal-iliac-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.filter(e=>Object.hasOwn(internalIliacUltrasoundFacts,e.identity.fmaId)).map(e=>[
  e.identity.id,{signature:sourceCanonical(e.identity),fmaId:e.identity.fmaId as keyof typeof internalIliacUltrasoundFacts},
]));

/** Exact retained source identity and ultrasound tab only; no patient registration or access grant. */
export function internalIliacUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='ultrasound')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const fact=internalIliacUltrasoundFacts[binding.fmaId];
  return {
    readiness:'draft',title:`${s.name} · ultrasound orientation · draft`,body:fact.body,
    bullets:[fact.pitfall],citations:[...internalIliacUltrasoundReferences],
    note:'Revision-bound radiologist review pending. No acquired ultrasound study, Doppler data or patient-to-atlas registration is supplied. This static source surface cannot establish flow, patency or diagnosis. Atlas, case and paid-lecture access remain independent.',
  };
}
