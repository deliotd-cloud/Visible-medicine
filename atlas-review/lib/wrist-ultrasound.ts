import pins from '../content/wrist-ultrasound-pins.json' with {type:'json'};
import {wristUltrasoundTopics,wristUltrasoundReferences,type WristUltrasoundGroup} from '../content/wrist-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const identities=new Map(pins.entries.map(entry=>[entry.identity.id,{
 signature:sourceCanonical(entry.identity),group:entry.group as WristUltrasoundGroup,
}]));

/** Exact whole-record admission; no name/FMA fallback or patient registration. */
export function wristUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='ultrasound')return undefined;
 const bound=identities.get(s.id);
 if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
 const topic=wristUltrasoundTopics[bound.group];
 return {
  readiness:'draft',title:`${s.name} · Ultrasound orientation · draft`,body:topic.body,
  bullets:[topic.landmark,
   'Ultrasound assesses accessible outer bone surfaces, not internal marrow. An intact-looking model cannot exclude a fracture.',
   'Return separation to zero before comparison. Rotation and Explode do not simulate probe motion, tissue echoes or a dynamic examination.'],
  note:'Radiologist review pending for this exact source revision. Confirm patient side, image orientation, probe position and examination level independently. No diagnostic measurements, procedural planning or CT/MRI registration. Atlas, imaging-case and lecture access remain independent.',
  citations:[...wristUltrasoundReferences],
 };
}
