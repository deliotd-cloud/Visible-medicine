import source from '../public/models/bodyparts3d/short-ciliary/catalog.json' with {type:'json'};
import {shortCiliaryPathologyTopic as topic} from '../content/short-ciliary-pathology';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings = new Map(source.structures.filter(s=>s.fmaId==='FMA7041').map(s=>[s.id,sourceCanonical(s)]));
export function shortCiliaryPathologyLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='pathology'||bindings.get(s.id)!==sourceCanonical(s))return undefined;
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,`Source limit: ${s.coverageNote}`,`Reference: ${topic.credit}`],
    citations:[...topic.citations],
    note:'Educational draft for revision-bound radiologist review. No individual-nerve imaging visibility, diagnostic test, treatment plan or patient registration is established. Atlas, imaging-case and paid-lecture access remain independent.'};
}
