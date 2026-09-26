import pins from '../content/laryngeal-imaging-pins.json' with {type:'json'};
import {laryngealImagingTopics,laryngealImagingReferences,type LaryngealImagingGroup} from '../content/laryngeal-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
import {laryngealFrameworkImagingLesson} from './laryngeal-framework-imaging';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),group:e.group as LaryngealImagingGroup}]));
export function laryngealImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  const supplemental=laryngealFrameworkImagingLesson(s,tab);
  if(supplemental)return supplemental;
  if(tab!=='ct'&&tab!=='mri')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.identity)return undefined;
  const topic=laryngealImagingTopics[binding.group];
  const bullets=[topic.scope,'Reassemble the existing epiglottis/laryngeal study before comparing relationships. Separation distances are display settings, not anatomical measurements.'];
  const citations=[laryngealImagingReferences[tab]];
  if(tab==='ct'&&binding.group!=='epiglottis'){
    bullets.push('Ossification varies between individuals and within the laryngeal cartilages. A gap or asymmetric mineralisation alone is not a diagnosis.');
    citations.push(laryngealImagingReferences.ossification);
  }
  if(tab==='mri')bullets.push('The cited T1 study compared contours in five patients; it does not validate this mesh, every MRI sequence or automatic scan correspondence.');
  return {readiness:'draft',title:`${s.name} · ${tab.toUpperCase()} orientation · draft`,body:topic[tab],bullets,citations,
    note:'Original teaching draft for revision-bound radiologist review. No acquired image, validated registration, contouring protocol or airway-management guidance is supplied. Atlas, imaging-case and paid-lecture access remain independent.'};
}
