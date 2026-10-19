import pins from '../content/arterial-evidence-limits-pins.json' with {type:'json'};
import {arterialEvidenceLimits} from '../content/arterial-evidence-limits';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{identity:sourceCanonical(entry.identity),tab:entry.tab,family:entry.family}]));
/** Specific evidence limits are useful teaching, never proof of normal visibility. */
export function arterialEvidenceLimitLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  const binding=bindings.get(structure.id);
  if(!binding||binding.tab!==tab||binding.identity!==sourceCanonical(structure))return undefined;
  if(binding.family!=='middleCollateralUltrasound'&&binding.family!=='inferiorThyroidMri')return undefined;
  const topic=arterialEvidenceLimits[binding.family];
  return{readiness:'pending',title:`${structure.name} · ${topic.title} · evidence pending`,body:topic.body,bullets:[...topic.bullets],citations:[...topic.citations],note:topic.note};
}
