import centralPins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import branchPins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import {portalVenousXrayTopics} from '../content/portal-venous-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected={
  'hepatic-portal-vein':{fma:'FMA50735',bundle:'abdomen-vessels-recovery',pins:centralPins},
  'splenic-vein':{fma:'FMA14331',bundle:'portal-veins',pins:centralPins},
  'superior-mesenteric-vein':{fma:'FMA14332',bundle:'abdomen-vessels-mesenteric',pins:centralPins},
  'inferior-mesenteric-vein':{fma:'FMA15391',bundle:'abdomen-vessels-mesenteric',pins:branchPins},
} as const;
type Topic=keyof typeof expected;
const bindings=new Map(Object.entries(expected).map(([topic,{fma,bundle,pins}])=>{
  const id=`vm:anatomy:body:abdomen:unspecified:vessel:${topic}`;
  const matches=pins.entries.map(entry=>entry.identity).filter(s=>s.id===id&&s.fmaId===fma&&
    s.laterality==='unspecified'&&s.bundle===bundle&&s.region==='abdomen'&&s.system==='vessels'&&s.category==='vessel');
  if(matches.length!==1)throw Error(`Expected one exact portal venous identity: ${topic}`);
  const identity=matches[0];
  return [id,{signature:sourceCanonical(identity),topic:topic as Topic,limitation:identity.coverageNote}] as const;
}));

/** Exact retained anatomy only, never an acquired venogram or procedural route. */
export function portalVenousXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=portalVenousXrayTopics[binding.topic];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.limitation?[binding.limitation]:[]),
      'Contrast X-ray venography, including digital subtraction angiography (DSA), is not a plain abdominal radiograph. Plain radiographs do not delineate these venous lumens. CT venography (CTV), MR venography (MRV) and Doppler ultrasound are separate examinations; no acquired image is supplied here.',
      'Compare the assembled anatomy before using explode view. A venographic projection does not resolve depth from this 3D view. Screen position, model colour and source unspecified laterality are not patient-side markers. Surface contact and separation do not establish a patent lumen, blood-flow simulation or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No acquired venogram, publisher media, patient scan, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
