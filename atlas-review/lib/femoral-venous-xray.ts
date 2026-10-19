import pins from '../content/lower-venous-imaging-pins.json' with {type:'json'};
import {femoralVenousXrayTopics} from '../content/femoral-venous-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'right-femoral-vein':{fma:'FMA21188',side:'right',bundle:'thigh-vessels-recovery',topic:'femoral-vein'},
  'left-femoral-vein':{fma:'FMA21189',side:'left',bundle:'thigh-vessels-recovery',topic:'femoral-vein'},
  'right-deep-femoral-vein':{fma:'FMA51042',side:'right',bundle:'deep-leg-veins',topic:'deep-femoral-vein'},
  'left-deep-femoral-vein':{fma:'FMA51043',side:'left',bundle:'deep-leg-veins',topic:'deep-femoral-vein'},
  'right-great-saphenous-vein':{fma:'FMA21379',side:'right',bundle:'thigh-vessels-recovery',topic:'great-saphenous-vein'},
  'left-great-saphenous-vein':{fma:'FMA21380',side:'left',bundle:'thigh-vessels-recovery',topic:'great-saphenous-vein'},
} as const;
const sourceLimits={
  'femoral-vein':'This whole source selection does not separately validate common femoral and femoral segments, a complete confluence, valves or lumen.',
  'deep-femoral-vein':'This deep femoral surface does not validate the complete profunda tributaries, exact collecting junction, valves or lumen. The neighbouring femoral and great saphenous selections remain separate.',
  'great-saphenous-vein':'This great saphenous surface does not validate a separate saphenofemoral-junction segment, all tributaries/perforators or valve leaflets.',
} as const;
const bindings=new Map(Object.entries(expected).map(([name,{fma,side,bundle,topic}])=>{
  const id=`vm:anatomy:body:thigh:${side}:vessel:${name}`;
  const matches=pins.entries.map(e=>e.identity).filter(s=>s.id===id&&s.fmaId===fma&&s.laterality===side&&
    s.bundle===bundle&&s.region==='thigh'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact femoral venous source identity: ${name}`);
  return[id,{signature:sourceCanonical(matches[0]),topic,coverageNote:matches[0].coverageNote}]as const;
}));

/** Exact reference surfaces, not acquired venograms, venous function or access routes. */
export function femoralVenousXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=femoralVenousXrayTopics[binding.topic];
  return{readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,sourceLimits[binding.topic],...(binding.coverageNote?[binding.coverageNote]:[]),
      'This section concerns acquired contrast X-ray venography, not an unopacified plain thigh radiograph. CT venography (CTV), MR venography (MRV) and ultrasound are distinct examinations. No acquired image or venographic sequence is supplied here.',
      'Reassemble before comparison. Projection overlap, model colour, screen position and retained source laterality are not patient-side markers. Surface contact or separation cannot establish continuous lumen, patency, flow, reflux, valve competence, a procedural route or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No patient scan, venogram, publisher image, diagnostic threshold, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
