import arterialPins from '../content/lower-limb-arterial-pins.json' with {type:'json'};
import branchSource from '../public/models/bodyparts3d/circumflex-femoral/catalog.json' with {type:'json'};
import {femoralArterialXrayTopics} from '../content/femoral-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'right-femoral-artery':{fma:'FMA70249',side:'right',bundle:'thigh-vessels-recovery',topic:'femoral-artery'},
  'left-femoral-artery':{fma:'FMA70250',side:'left',bundle:'thigh-vessels-recovery',topic:'femoral-artery'},
  'right-deep-femoral-artery':{fma:'FMA20796',side:'right',bundle:'thigh-vessels-recovery',topic:'deep-femoral-artery'},
  'left-deep-femoral-artery':{fma:'FMA20797',side:'left',bundle:'thigh-vessels-recovery',topic:'deep-femoral-artery'},
  'descending-branch-of-right-lateral-circumflex-femoral-artery':{fma:'FMA21422',side:'right',bundle:'circumflex-femoral',topic:'descending-lateral-circumflex-femoral-artery'},
  'descending-branch-of-left-lateral-circumflex-femoral-artery':{fma:'FMA21423',side:'left',bundle:'circumflex-femoral',topic:'descending-lateral-circumflex-femoral-artery'},
} as const;
const records=[...arterialPins.entries,...branchSource.structures];
const bindings=new Map(Object.entries(expected).map(([name,{fma,side,bundle,topic}])=>{
  const id=`vm:anatomy:body:thigh:${side}:vessel:${name}`;
  const matches=records.filter(s=>s.id===id&&s.fmaId===fma&&s.laterality===side&&s.bundle===bundle&&
    s.region==='thigh'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact femoral arterial source identity: ${name}`);
  const identity=matches[0];return[id,{signature:sourceCanonical(identity),topic,limitation:identity.coverageNote}]as const;
}));

/** Exact reference surfaces, not acquired angiograms or catheter routes. */
export function femoralArterialXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=femoralArterialXrayTopics[binding.topic];
  return{readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.limitation?[binding.limitation]:[]),
      'Contrast catheter angiography and digital subtraction angiography (DSA) use X-rays. Plain thigh radiographs do not ordinarily delineate these unopacified arterial lumens; visible wall calcification is not a complete lumen map. CT angiography (CTA) and MR angiography (MRA) are separate examinations. No acquired image is supplied here.',
      'Reassemble before comparison. Projection overlap, model colour, screen position and retained source laterality are not patient-side markers. Surface contact or separation cannot establish continuous lumen, patency, perfusion, blood-flow simulation, a procedural route or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No acquired angiogram, publication media, patient scan, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
