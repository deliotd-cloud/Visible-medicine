import pins from '../content/neonatal-cranial-ultrasound-pins.json' with {type:'json'};
import {neonatalCranialUltrasoundReferences as references,neonatalCranialUltrasoundTeaching as teaching,neonatalCranialUltrasoundNote as note} from '../content/neonatal-cranial-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
type Family=keyof typeof teaching;
const bindings=new Map<string,{signature:string;family:Family}>(pins.entries.map(entry=>[entry.identity.id,
  {signature:sourceCanonical(entry.identity),family:entry.family as Family}]));
/** Infant evidence is contextual teaching, not neonatal mesh or adult US validation. */
export function neonatalCranialUltrasoundLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='ultrasound')return undefined;
  const binding=bindings.get(structure.id);
  if(!binding||sourceCanonical(structure)!==binding.signature)return undefined;
  const lesson=teaching[binding.family];
  return {readiness:'draft',title:`${structure.name} · neonatal/infant ultrasound orientation · draft`,
    body:lesson.body,bullets:[...lesson.bullets],citations:lesson.citations.map(key=>references[key]),note};
}
