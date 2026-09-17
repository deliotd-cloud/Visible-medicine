import pins from '../content/corpus-imaging-pins.json' with {type:'json'};
import {corpusImagingTopics} from '../content/corpus-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,sourceCanonical(e.identity)]));
export function corpusImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri'&&tab!=='ultrasound')return undefined;
 if(bindings.get(s.id)!==sourceCanonical(s))return undefined;
 const topic=corpusImagingTopics[tab];
 return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
  bullets:[...topic.bullets,`Source limit: ${s.coverageNote}`,`Reference: ${topic.credit}`],citations:[...topic.citations],
  note:'Educational draft for revision-bound radiologist review, not a diagnostic test or procedure plan. No patient registration, scan or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.'};
}
