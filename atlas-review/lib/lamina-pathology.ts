import pins from '../content/cranial-boundary-clinical-pins.json' with {type:'json'};
import {laminaPathologyTopic as topic} from '../content/lamina-pathology';
import {cranialBoundaryClinicalLesson} from './cranial-boundary-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.filter(e=>e.identity.fmaId==='FMA61975').map(e=>[e.identity.id,sourceCanonical(e.identity)]));

/** New editorial revision on the existing two-piece source; no mesh inference. */
export function laminaPathologyLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if((tab!=='clinical'&&tab!=='pathology')||bindings.get(s.id)!==sourceCanonical(s))return undefined;
  const clinical=cranialBoundaryClinicalLesson(s,'clinical');
  if(!clinical?.bullets)return undefined;
  if(tab==='clinical'){
    // Keep the normal-anatomy study and its limits; retire only the obsolete hold.
    return {...clinical,bullets:clinical.bullets.map(b=>b.replace(' Pathology remains pending for appropriate structure-specific evidence.',''))};
  }
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,...clinical.bullets.filter(b=>b.startsWith('Source limit:')||b.startsWith('Visible source:')),`Reference: ${topic.credit}`],
    citations:[...topic.citations],
    note:'Educational draft for revision-bound radiologist review, not a diagnostic test or procedure plan. No patient registration, scan or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
