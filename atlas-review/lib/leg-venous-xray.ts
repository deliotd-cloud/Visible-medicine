import pins from '../content/lower-venous-imaging-pins.json' with {type:'json'};
import {legVenousXrayTopics} from '../content/leg-venous-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'right-popliteal-vein':{fma:'FMA44328',side:'right',bundle:'leg-vessels-recovery',topic:'popliteal-vein'},
  'left-popliteal-vein':{fma:'FMA44329',side:'left',bundle:'leg-vessels-recovery',topic:'popliteal-vein'},
  'right-small-saphenous-vein':{fma:'FMA44334',side:'right',bundle:'leg-vessels-recovery',topic:'small-saphenous-vein'},
  'left-small-saphenous-vein':{fma:'FMA44335',side:'left',bundle:'leg-vessels-recovery',topic:'small-saphenous-vein'},
  'right-anterior-tibial-vein':{fma:'FMA44336',side:'right',bundle:'deep-leg-veins',topic:'anterior-tibial-vein'},
  'left-anterior-tibial-vein':{fma:'FMA44337',side:'left',bundle:'deep-leg-veins',topic:'anterior-tibial-vein'},
  'right-posterior-tibial-vein':{fma:'FMA44338',side:'right',bundle:'deep-leg-veins',topic:'posterior-tibial-vein'},
  'left-posterior-tibial-vein':{fma:'FMA44339',side:'left',bundle:'deep-leg-veins',topic:'posterior-tibial-vein'},
} as const;
const sourceLimits={
  'popliteal-vein':'This popliteal source segment does not validate the complete tibial/fibular confluence, every tributary, duplication pattern, valves or lumen.',
  'small-saphenous-vein':'This superficial source segment does not validate a complete saphenopopliteal junction, thigh extension, all tributaries or valve leaflets.',
  'anterior-tibial-vein':'Each anterior tibial selection retains two ordered source parts. They are not separately validated companion veins and do not establish a complete paired-channel map, valves, lumen or an exact collecting junction.',
  'posterior-tibial-vein':'This posterior tibial source-labelled group does not validate complete companion veins, valves, lumen or an exact tibial–popliteal junction.',
} as const;
const bindings=new Map(Object.entries(expected).map(([name,{fma,side,bundle,topic}])=>{
  const id=`vm:anatomy:body:leg:${side}:vessel:${name}`;
  const matches=pins.entries.map(e=>e.identity).filter(s=>s.id===id&&s.fmaId===fma&&s.laterality===side&&
    s.bundle===bundle&&s.region==='leg'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact leg venous source identity: ${name}`);
  return[id,{signature:sourceCanonical(matches[0]),topic,coverageNote:matches[0].coverageNote}]as const;
}));

/** Exact reference surfaces, not acquired venograms, venous function or access routes. */
export function legVenousXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=legVenousXrayTopics[binding.topic];
  return{readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,sourceLimits[binding.topic],...(binding.coverageNote?[binding.coverageNote]:[]),
      'This section concerns acquired contrast X-ray venography, not an unopacified plain leg radiograph. CT venography (CTV), MR venography (MRV) and ultrasound are distinct examinations. No acquired image or venographic sequence is supplied here.',
      'Reassemble before comparison. Projection overlap, model colour, screen position and retained source laterality are not patient-side markers. Surface contact or separation cannot establish continuous lumen, patency, flow, reflux, valve competence, a procedural route or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No patient scan, venogram, publisher image, diagnostic threshold, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
