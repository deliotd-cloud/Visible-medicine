import pins from '../content/connective-imaging-pins.json' with {type:'json'};
import {connectiveImagingTopics} from '../content/connective-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group,topics:e.topics}]));
export function connectiveImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri'&&tab!=='ultrasound')return undefined;
 const binding=bindings.get(s.id);
 if(!binding||binding.signature!==sourceCanonical(s)||!binding.topics.includes(tab))return undefined;
 const group=binding.group as keyof typeof connectiveImagingTopics;
 const topic=connectiveImagingTopics[group]?.[tab];if(!topic)return undefined;
 return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
  bullets:[...topic.bullets,`Source limit: ${s.coverageNote}`,`Evidence: ${topic.credit}`],citations:[...topic.citations],
  note:'Educational draft for revision-bound radiologist review. Set separation to zero before comparing relationships. No patient registration, scan or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.'};
}
