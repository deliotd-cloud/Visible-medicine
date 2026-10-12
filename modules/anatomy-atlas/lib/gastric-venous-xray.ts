import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import {gastricVenousXrayTopics} from '../content/gastric-venous-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'left-gastric-vein':{side:'left',fma:'FMA15399',file:'FJ3500'},
  'right-gastric-vein':{side:'right',fma:'FMA15400',file:'FJ3595'},
  'left-gastroepiploic-vein':{side:'left',fma:'FMA15390',file:'FJ3502'},
  'right-gastroepiploic-vein':{side:'right',fma:'FMA15397',file:'FJ3597'},
} as const;
type Topic=keyof typeof expected;
const bindings=new Map(Object.entries(expected).map(([topic,{side,fma,file}])=>{
  const id=`vm:anatomy:body:abdomen:${side}:vessel:${topic}`;
  const matches=pins.entries.map(entry=>entry.identity).filter(s=>s.id===id&&s.fmaId===fma&&
    s.laterality===side&&s.bundle==='portal-veins'&&s.region==='abdomen'&&
    s.system==='vessels'&&s.category==='vessel'&&s.sources.length===1&&s.sources[0].file===file);
  if(matches.length!==1)throw Error(`Expected one exact gastric venous identity: ${topic}`);
  const identity=matches[0];
  return [id,{signature:sourceCanonical(identity),topic:topic as Topic,limitation:identity.coverageNote}] as const;
}));

/** Retained source orientation only; never an acquired examination or access plan. */
export function gastricVenousXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=gastricVenousXrayTopics[binding.topic];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.limitation?[binding.limitation]:[]),
      'Plain abdominal radiographs do not delineate these venous lumens. Contrast X-ray venography is a different examination. If an acquired venogram is available, compare only demonstrated segments; this lesson does not guarantee opacification of any vessel. CT venography (CTV), MR venography (MRV) and Doppler ultrasound remain separate modalities.',
      'Reassemble the model before comparing relationships, then use explode view to inspect selections. A venographic projection does not resolve depth from this scene. Source laterality is not a screen-side rule or a patient-side marker. Surface contact or separation cannot establish a lumen, blood-flow simulation or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No acquired venogram, publisher media, patient scan, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
