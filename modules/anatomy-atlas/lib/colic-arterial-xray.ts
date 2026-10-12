import pins from '../content/abdominal-arterial-pins.json' with {type:'json'};
import {colicArterialXrayTopics} from '../content/colic-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'ileocolic-artery':{fma:'FMA14815',side:'unspecified'},
  'right-colic-artery':{fma:'FMA14811',side:'right'},
  'middle-colic-artery':{fma:'FMA14810',side:'midline'},
  'left-colic-artery':{fma:'FMA14826',side:'left'},
  'ascending-branch-of-left-colic-artery':{fma:'FMA14828',side:'left'},
  'descending-branch-of-left-colic-artery':{fma:'FMA14829',side:'left'},
  'marginal-colic-artery':{fma:'FMA14824',side:'midline'},
} as const;
type Topic=keyof typeof expected;
const bindings=new Map(Object.entries(expected).map(([topic,{fma,side}])=>{
  const id=`vm:anatomy:body:abdomen:${side}:vessel:${topic}`;
  const matches=pins.entries.filter(s=>s.id===id&&s.fmaId===fma&&s.laterality===side&&
    s.bundle==='abdomen-vessels-mesenteric'&&s.region==='abdomen'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact colic arterial identity: ${topic}`);
  const identity=matches[0];
  return [id,{signature:sourceCanonical(identity),topic:topic as Topic,limitation:identity.coverageNote}] as const;
}));

/** Exact retained surfaces only; no acquired angiogram or inferred perfusion. */
export function colicArterialXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=colicArterialXrayTopics[binding.topic];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.limitation?[binding.limitation]:[]),
      'Contrast catheter angiography and digital subtraction angiography (DSA) use X-rays; plain abdominal radiography does not delineate these arterial lumens. CT angiography and MR angiography are separate examinations.',
      'Reassemble before comparing anatomy. Projection overlap, model colour and screen position are not patient-side markers; source laterality is retained. Surface contact, separation or contrast filling cannot establish complete branch continuity, perfusion, flow simulation, a procedural route or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No acquired image, publication media, patient scan, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
