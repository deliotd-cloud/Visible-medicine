import pins from '../content/iliac-venous-imaging-pins.json' with {type:'json'};
import {iliacVenousSelections} from '../content/iliac-venous-imaging';
import {iliacVenousXrayTopics} from '../content/iliac-venous-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={common:['FMA21387','FMA21388'],external:['FMA18885','FMA18886'],internal:['FMA18887','FMA18888']} as const;
type Group=keyof typeof expected;
if(pins.entries.length!==6||new Set(pins.entries.map(e=>e.identity.id)).size!==6||
  Object.entries(expected).some(([group,fmas])=>fmas.some(fma=>pins.entries.filter(e=>e.group===group&&e.identity.fmaId===fma).length!==1)))
  throw Error('Expected six exact common, external and internal iliac venous identities');
const bindings=new Map(pins.entries.map(({identity,group})=>[identity.id,{signature:sourceCanonical(identity),group:group as Group}]));

/** Exact source-bound draft only; never an acquired venogram or patient transform. */
export function iliacVenousXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const spec=iliacVenousSelections.find(item=>item.group===binding.group&&item.fmas.includes(s.fmaId));
  if(!spec)return undefined;
  const topic=iliacVenousXrayTopics[binding.group];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[
      'This section concerns contrast X-ray venography, not a routine plain pelvic radiograph. CT venography (CTV), MR venography (MRV) and IVUS are distinct examinations, not alternative renderings of this model.',
      spec.landmark,...topic.bullets,`Source limit: ${spec.limit}`,
      'Reassemble the model for gross relationships. Rotation, separation, colour and surface calibre reproduce neither an acquired venographic projection nor measured flow, reflux or disease.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No patient-space registration is supplied. No patient scan, venogram, publisher image, diagnostic threshold, procedural route or clinical approval is included. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
