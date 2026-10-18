import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import {hepaticVenousXrayTopics} from '../content/hepatic-venous-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'inferior-vena-cava':{fma:'FMA10951',side:'unspecified',bundle:'abdomen-vessels-recovery'},
  'right-hepatic-vein':{fma:'FMA14338',side:'right',bundle:'abdomen-vessels-recovery'},
  'left-hepatic-vein':{fma:'FMA14339',side:'left',bundle:'abdomen-vessels-recovery'},
  'middle-hepatic-vein':{fma:'FMA14340',side:'unspecified',bundle:'hepatic-veins'},
} as const;
type Topic=keyof typeof expected;
const bindings=new Map(Object.entries(expected).map(([topic,{fma,side,bundle}])=>{
  const id=`vm:anatomy:body:abdomen:${side}:vessel:${topic}`;
  const matches=pins.entries.map(e=>e.identity).filter(s=>s.id===id&&s.fmaId===fma&&
    s.laterality===side&&s.bundle===bundle&&s.region==='abdomen'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact hepatic venous identity: ${topic}`);
  const identity=matches[0];
  return [id,{signature:sourceCanonical(identity),topic:topic as Topic,limitation:identity.coverageNote}] as const;
}));

/** Exact retained source only; no acquired venogram, flow or procedural route. */
export function hepaticVenousXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=hepaticVenousXrayTopics[binding.topic];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.limitation?[binding.limitation]:[]),
      'Contrast X-ray venography/DSA is not a plain radiograph; plain films do not delineate these venous lumens. CT venography, MR venography and Doppler ultrasound are separate examinations.',
      'Reassemble before comparing gross relationships. Projection overlap, screen position and model colour are not patient-side markers. Source laterality is retained. Surface contact, separation or contrast filling cannot establish a complete patent lumen, flow simulation, pressure, a procedural route or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No acquired image, publication media, patient scan, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
