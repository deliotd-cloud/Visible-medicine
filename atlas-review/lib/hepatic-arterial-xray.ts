import pins from '../content/abdominal-arterial-pins.json' with {type:'json'};
import {hepaticArterialXrayTopics} from '../content/hepatic-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'common-hepatic-artery':{fma:'FMA14771',side:'midline'},
  'hepatic-artery-proper':{fma:'FMA14772',side:'unspecified'},
  'left-gastric-artery':{fma:'FMA14768',side:'left'},
} as const;
type Topic=keyof typeof expected;
const bindings=new Map(Object.entries(expected).map(([topic,{fma,side}])=>{
  const id=`vm:anatomy:body:abdomen:${side}:vessel:${topic}`;
  const matches=pins.entries.filter(s=>s.id===id&&s.fmaId===fma&&s.laterality===side&&
    s.region==='abdomen'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact hepatic arterial identity: ${topic}`);
  const identity=matches[0];
  return [id,{signature:sourceCanonical(identity),topic:topic as Topic,limitation:identity.coverageNote}] as const;
}));

/** Separate anatomical reference, never an acquired angiogram or procedural route. */
export function hepaticArterialXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=hepaticArterialXrayTopics[binding.topic];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[
      ...topic.bullets,
      ...(binding.limitation?[binding.limitation]:[]),
      'Contrast catheter angiography and digital subtraction angiography use X-rays. Plain abdominal radiography does not trace these arterial lumens; CT angiography and MR angiography are separate examinations. No acquired image is supplied here.',
      'Compare the assembled course before using explode view. Screen position, model colour and source laterality (including midline or unspecified) are not patient-side markers. Surface contact, calibre or separation does not establish a lumen, perfusion territory, blood-flow simulation or patient-space registration.',
    ],
    citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No acquired angiogram, publisher media, patient scan, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
