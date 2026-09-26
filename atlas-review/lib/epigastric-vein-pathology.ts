import source from '../public/models/bodyparts3d/inferior-epigastric-vessels/catalog.json' with {type:'json'};
import {epigastricVeinPathologyTopic as topic} from '../content/epigastric-vein-pathology';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(source.structures.filter(s=>['FMA21164','FMA21163'].includes(s.fmaId)).map(s=>[s.id,sourceCanonical(s)]));

/** Bind the reading to complete admitted identities, never a name match. */
export function epigastricVeinPathologyLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='pathology'||bindings.get(s.id)!==sourceCanonical(s))return undefined;
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets,`Reference: ${topic.credit}`],citations:[...topic.citations],
    note:'Educational draft for revision-bound radiologist review, not a diagnostic test or procedure plan. No patient registration, scan or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
