import pins from '../content/hand-arterial-ultrasound-pins.json' with {type:'json'};
import {handArterialUltrasoundTopics,handArterialUltrasoundCaution,type HandArterialUltrasoundGroup} from '../content/hand-arterial-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{
 identity:sourceCanonical(entry.identity),group:entry.group as HandArterialUltrasoundGroup,
}]));
/** Closed original ultrasound orientation for existing exact-source selections. */
export function handArterialUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='ultrasound')return undefined;
 const binding=bindings.get(s.id);if(!binding||binding.identity!==sourceCanonical(s))return undefined;
 const topic=handArterialUltrasoundTopics[binding.group];if(!topic)return undefined;
 return{readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
  bullets:[handArterialUltrasoundCaution,...topic.bullets,`Source limit: ${s.coverageNote}`],citations:[...topic.citations],
  note:'Educational draft for revision-bound radiologist review. Set separation to zero before comparing relationships. No patient images, registration or clinical approval are supplied. Atlas, imaging-case and paid-lecture access remain independent.'};
}
