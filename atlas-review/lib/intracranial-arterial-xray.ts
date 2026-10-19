import pins from '../content/cerebral-arterial-quiz-pins.json' with {type:'json'};
import cranial from '../public/models/bodyparts3d/cranial-arteries/catalog.json' with {type:'json'};
import {intracranialArterialXrayTopics,type IntracranialArterialXrayGroup} from '../content/intracranial-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  anteriorCerebral:['FMA50029','FMA50030'],anteriorCommunicating:['FMA50169'],
  posteriorCerebral:['FMA50584','FMA50585'],posteriorCommunicating:['FMA50085','FMA50086'],
  middleCerebral:['FMA50082'],posteriorInferiorCerebellar:['FMA50519','FMA50520'],
  superiorCerebellar:['FMA50574','FMA50575'],
} as const;
// Reuse the original, retained whole records, never a name/FMA-only live match.
const originals=[...pins.entries.map(entry=>entry.identity),...cranial.structures];
const records=Object.entries(expected).flatMap(([group,fmas])=>fmas.map(fma=>{
  const matches=originals.filter(s=>s.fmaId===fma);
  if(matches.length!==1||matches[0].region!=='head-neck'||matches[0].system!=='vessels')
    throw Error('Expected twelve exact retained intracranial arterial identities');
  return {identity:matches[0],group:group as IntracranialArterialXrayGroup};
}));
if(records.length!==12||new Set(records.map(e=>e.identity.id)).size!==12)
  throw Error('Duplicate intracranial arterial teaching identity');
const bindings=new Map(records.map(({identity,group})=>[identity.id,{signature:sourceCanonical(identity),group}]));

/** Source-bound catheter-X-ray teaching only, not an angiogram or patient transform. */
export function intracranialArterialXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=intracranialArterialXrayTopics[binding.group];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[
      'This is catheter contrast X-ray/DSA orientation, not routine plain skull radiography. CT angiography (CTA) and MR angiography (MRA) are distinct examinations, not alternate renderings of this model.',
      ...topic.bullets,
      'Reassemble for source-position comparison. Rotation, explode, colour and surface calibre are not an acquired angiographic projection, contrast-filling sequence, blood-flow measurement or diagnostic test.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No patient-space registration is supplied. No patient angiogram, publisher figure, diagnostic threshold, procedural route or clinical approval is included. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
