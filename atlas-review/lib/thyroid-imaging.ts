import pins from '../content/thyroid-imaging-pins.json' with {type:'json'};
import {thyroidImagingTopics} from '../content/thyroid-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,sourceCanonical(e.identity)]));
export function thyroidImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='ct'&&tab!=='ultrasound')return undefined;
 if(bindings.get(s.id)!==sourceCanonical(s))return undefined;
 const topic=thyroidImagingTopics[tab];
 return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
  bullets:[...topic.bullets,
   'Source limit: one source-labelled inferior thyroid artery, not complete glandular supply, a verified patent junction, a lumen or the recurrent laryngeal nerve. No lesion or scan has been added.',
   `Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,
   `Reference: ${topic.credit}`],citations:[...topic.citations],
  note:'Educational draft for revision-bound radiologist review, not a diagnostic test or procedure plan. Matching a structure name does not register the reference mesh to a patient. No scan, clinical approval or imaging entitlement is supplied. Atlas, imaging-case and paid-lecture access remain independent.'};
}
