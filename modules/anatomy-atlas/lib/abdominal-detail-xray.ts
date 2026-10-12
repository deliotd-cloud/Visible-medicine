import vesselPins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import connectivePins from '../content/abdominal-connective-quiz-pins.json' with {type:'json'};
import {abdominalDetailVascularXrayTopics} from '../content/abdominal-detail-vascular-xray';
import {abdominalDetailConnectiveXrayTopics} from '../content/abdominal-detail-connective-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected=[
  ['unspecified:vessel:appendicular-artery','FMA14818','abdomen-vessels-mesenteric','FJ3410'],
  ['unspecified:vessel:ascending-branch-of-inferior-branch-of-ileocolic-artery','FMA14820','abdomen-vessels-mesenteric','FJ3414'],
  ['unspecified:vessel:ileal-vein','FMA15405','abdomen-vessels-mesenteric','FJ3438'],
  ['midline:vessel:middle-colic-vein','FMA15406','abdomen-vessels-mesenteric','FJ3543'],
  ['unspecified:vessel:pancreaticoduodenal-vein','FMA15398','abdomen-vessels-visceral-detail','FJ3545','FJ3646','FJ3655'],
  ['right:vessel:right-colic-vein','FMA15407','abdomen-vessels-mesenteric','FJ3591'],
  ['left:vessel:left-inferior-epigastric-artery','FMA20689','inferior-epigastric-vessels','FJ3511'],
  ['left:vessel:left-inferior-epigastric-vein','FMA21164','inferior-epigastric-vessels','FJ3512'],
  ['right:vessel:right-inferior-epigastric-artery','FMA20688','inferior-epigastric-vessels','FJ3604'],
  ['right:vessel:right-inferior-epigastric-vein','FMA21163','inferior-epigastric-vessels','FJ3605'],
  ['left:vessel:tributary-of-left-hepatic-vein','FMA15794','hepatic-veins','FJ3097','FJ3098','FJ3099','FJ3100','FJ3101'],
  ['right:vessel:tributary-of-right-hepatic-vein','FMA15791','hepatic-veins','FJ3118','FJ3119','FJ3120','FJ3121'],
  ['midline:fascia:linea-alba','FMA11336','abdomen-connective-axial-detail','FJ1448'],
  ['midline:membrane:mesentery-of-small-intestine','FMA14643','abdomen-connective-mesenteric','FJ3396'],
  ['unspecified:membrane:mesoappendix','FMA16549','abdomen-connective-mesenteric','FJ3397'],
  ['midline:membrane:transverse-mesocolon','FMA14647','abdomen-connective-mesenteric','FJ3398'],
] as const;
const topics={...abdominalDetailVascularXrayTopics,...abdominalDetailConnectiveXrayTopics};
type Topic=keyof typeof topics;
const bindings=new Map(expected.map(([suffix,fma,bundle,...files])=>{
  const [side,category,slug]=suffix.split(':'),id='vm:anatomy:body:abdomen:'+suffix;
  const vascular=category==='vessel';
  const pins=vascular?vesselPins:connectivePins;
  const matches=pins.entries.map(entry=>entry.identity).filter(s=>s.id===id&&s.fmaId===fma&&
    s.laterality===side&&s.category===category&&s.bundle===bundle&&s.region==='abdomen'&&
    s.system===(vascular?'vessels':'connective')&&s.sources.length===files.length&&
    s.sources.every((source,index)=>source.file===files[index]));
  if(matches.length!==1)throw Error('Expected one exact abdominal detail identity: '+id);
  const identity=matches[0];
  return [id,{signature:sourceCanonical(identity),topic:slug as Topic,vascular,limitation:identity.coverageNote}] as const;
}));

/** Source-bound educational orientation, never acquired-image or procedure evidence. */
export function abdominalDetailXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=topics[binding.topic];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.limitation?[binding.limitation]:[]),
      binding.vascular?
        'Plain abdominal radiographs do not delineate these vascular lumens. Contrast X-ray angiography or venography is a separate examination; compare only acquired, demonstrated segments without assuming opacification. CTA, MRA, CTV, MRV and Doppler ultrasound are distinct modalities, not interchangeable projections.':
        'Plain abdominal radiographs show overlapping soft-tissue projections, not a directly delineated fascia or peritoneal membrane. Contrast X-ray bowel imaging outlines a different target, the lumen; it does not provide this source sheet or establish a patient correspondence.',
      'Reassemble the model before comparing relationships, then use explode view to inspect selections. A projection does not resolve depth from this scene. Source laterality is not a screen-side rule or a patient-side marker. Surface contact or separation cannot establish blood flow, patency, a procedural route or patient-space registration.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No acquired examination, publisher media, patient scan, procedure, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
