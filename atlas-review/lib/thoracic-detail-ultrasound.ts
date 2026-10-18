import smallPins from '../content/thoracic-small-vessel-mri-pins.json' with {type:'json'};
import branchPins from '../content/thoracic-branch-imaging-pins.json' with {type:'json'};
import venousPins from '../content/systemic-venous-pins.json' with {type:'json'};
import {thoracicMediastinalUltrasoundTopics} from '../content/thoracic-mediastinal-ultrasound';
import {thoracicCardiacChestwallUltrasoundTopics} from '../content/thoracic-cardiac-chestwall-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected=[
  ['small','midline:vessel:esophageal-artery','FMA4149','thorax-vessels-thoracic-detail','FJ1934'],
  ['small','midline:vessel:variant-bronchial-artery','FMA10704','thorax-vessels-thoracic-detail','FJ3418'],
  ['small','midline:vessel:bronchial-artery','FMA68109','thorax-vessels-thoracic-detail','FJ1933'],
  ['small','midline:vessel:set-of-oesophageal-branches-of-thoracic-aorta','FMA71537','thorax-vessels-thoracic-detail','FJ3431'],
  ['small','unspecified:vessel:anterior-cardiac-vein','FMA76767','anterior-cardiac-vein','FJ2725','FJ2730'],
  ['branch','right:vessel:right-musculophrenic-artery','FMA10692','thorax-vessels-inventory','FJ1969'],
  ['branch','left:vessel:left-musculophrenic-artery','FMA4077','thorax-vessels-inventory','FJ1979'],
  ['branch','right:vessel:right-musculophrenic-vein','FMA4772','thorax-vessels-inventory','FJ1996'],
  ['branch','left:vessel:left-musculophrenic-vein','FMA4786','thorax-vessels-inventory','FJ1988'],
  ['venous','midline:vessel:hemiazygos-vein','FMA4944','thorax-vessels-recovery','FJ3434'],
] as const;
const identities={small:smallPins.entries.map(e=>e.identity),branch:branchPins.entries.map(e=>e.identity),venous:venousPins.entries};
const topics={...thoracicMediastinalUltrasoundTopics,...thoracicCardiacChestwallUltrasoundTopics};
type Topic=keyof typeof topics;
const bindings=new Map(expected.map(([pin,suffix,fma,bundle,...files])=>{
  const [side,category,slug]=suffix.split(':'),id='vm:anatomy:body:thorax:'+suffix;
  const matches=identities[pin].filter(s=>s.id===id&&s.fmaId===fma&&s.laterality===side&&
    s.category===category&&s.system==='vessels'&&s.region==='thorax'&&s.bundle===bundle&&
    s.sources.length===files.length&&s.sources.every((source,index)=>source.file===files[index]));
  if(matches.length!==1)throw Error('Expected one exact thoracic ultrasound identity: '+id);
  const identity=matches[0];
  return [id,{signature:sourceCanonical(identity),topic:slug as Topic,limitation:identity.coverageNote}] as const;
}));

/** Anatomical orientation only; modality feasibility is bounded by each cited source. */
export function thoracicDetailUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='ultrasound')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const topic=topics[binding.topic];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...(binding.limitation?[binding.limitation]:[]),
      'Reassemble the model before comparing surrounding anatomy; explode separation is a teaching layout, not physiological motion or an acoustic window. Source laterality is not a screen-side rule or patient-side marker. Static depth and surface colour are not Doppler direction or measured flow.',
      'This external reference surface supplies no acquired ultrasound image, insonation plane, spectral trace, lumen measurement, flow or patency assessment, procedural route or patient-space registration. Identify only structures actually demonstrated on the acquired study; anatomy or parent-vessel visibility alone is not evidence of a visible child vessel.',
    ],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No publisher media, patient scan, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
