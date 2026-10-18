import poplitealPins from '../content/popliteal-vessel-study-pins.json' with {type:'json'};
import tibialPins from '../content/limb-vascular-study-pins.json' with {type:'json'};
import genicularPins from '../content/genicular-imaging-pins.json' with {type:'json'};
import {legArterialXrayTopics} from '../content/leg-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'right-popliteal-artery':{fma:'FMA77380',side:'right',bundle:'leg-vessels-recovery',topic:'popliteal-artery'},
  'left-popliteal-artery':{fma:'FMA77381',side:'left',bundle:'leg-vessels-recovery',topic:'popliteal-artery'},
  'right-anterior-tibial-artery':{fma:'FMA43896',side:'right',bundle:'leg-vessels-recovery',topic:'anterior-tibial-artery'},
  'left-anterior-tibial-artery':{fma:'FMA43897',side:'left',bundle:'leg-vessels-recovery',topic:'anterior-tibial-artery'},
  'right-posterior-tibial-artery':{fma:'FMA43898',side:'right',bundle:'leg-vessels-recovery',topic:'posterior-tibial-artery'},
  'left-posterior-tibial-artery':{fma:'FMA43899',side:'left',bundle:'leg-vessels-recovery',topic:'posterior-tibial-artery'},
  'right-medial-superior-genicular-artery':{fma:'FMA22586',side:'right',bundle:'genicular-arteries',topic:'medial-superior-genicular-artery'},
  'left-medial-superior-genicular-artery':{fma:'FMA22587',side:'left',bundle:'genicular-arteries',topic:'medial-superior-genicular-artery'},
  'right-lateral-superior-genicular-artery':{fma:'FMA22588',side:'right',bundle:'genicular-arteries',topic:'lateral-superior-genicular-artery'},
  'left-lateral-superior-genicular-artery':{fma:'FMA22589',side:'left',bundle:'genicular-arteries',topic:'lateral-superior-genicular-artery'},
  'right-inferior-medial-genicular-artery':{fma:'FMA43890',side:'right',bundle:'genicular-arteries',topic:'inferior-medial-genicular-artery'},
  'left-inferior-medial-genicular-artery':{fma:'FMA43891',side:'left',bundle:'genicular-arteries',topic:'inferior-medial-genicular-artery'},
  'right-inferior-lateral-genicular-artery':{fma:'FMA43892',side:'right',bundle:'genicular-arteries',topic:'inferior-lateral-genicular-artery'},
  'left-inferior-lateral-genicular-artery':{fma:'FMA43893',side:'left',bundle:'genicular-arteries',topic:'inferior-lateral-genicular-artery'},
  'right-middle-genicular-artery':{fma:'FMA22562',side:'right',bundle:'genicular-arteries',topic:'middle-genicular-artery'},
  'left-middle-genicular-artery':{fma:'FMA22563',side:'left',bundle:'genicular-arteries',topic:'middle-genicular-artery'},
} as const;

const records=[...poplitealPins.entries,...tibialPins.entries,...genicularPins.entries.map(e=>e.identity)];
const bindings=new Map(Object.entries(expected).map(([name,{fma,side,bundle,topic}])=>{
  const id=`vm:anatomy:body:leg:${side}:vessel:${name}`;
  const matches=records.filter(s=>s.id===id&&s.fmaId===fma&&s.laterality===side&&s.bundle===bundle&&
    s.region==='leg'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact leg arterial source identity: ${name}`);
  const identity=matches[0];return[id,{signature:sourceCanonical(identity),topic,coverageNote:identity.coverageNote}]as const;
}));

/** Exact source-bound orientation, not an acquired angiogram or anatomical approval. */
export function legArterialXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=legArterialXrayTopics[binding.topic];
  return{readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.coverageNote?[binding.coverageNote]:[]),
      'Contrast catheter angiography and digital subtraction angiography (DSA) use X-rays; an unopacified plain leg radiograph does not ordinarily delineate these arterial lumens. CTA, MRA and ultrasound are distinct examinations. No acquired angiogram is supplied here.',
      'Reassemble before comparison. Projection overlap, model colour, screen position and retained source laterality are not patient-side markers. These surfaces do not validate genicular junctions or networks, lumen, patency, perfusion, supply territory, procedural route or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No patient scan, publisher image, procedure advice, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
