import pins from '../content/foot-venous-arch-imaging-pins.json' with {type:'json'};
import {footVenousArchImagingTopics} from '../content/foot-venous-arch-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

if(pins.entries.length!==2||pins.entries.some((entry,index)=>
  entry.identity.fmaId!==['FMA44881','FMA44882'][index]||entry.identity.laterality!==['right','left'][index]||
  entry.identity.category!=='vessel'||entry.identity.bundle!=='foot-vessels-foot-vascular'||
  sourceCanonical(entry.topics)!==sourceCanonical(['ct','mri','ultrasound'])))
  throw Error('Unexpected foot venous arch imaging pins.');
const identities=new Map(pins.entries.map(entry=>[entry.identity.id,sourceCanonical(entry.identity)]));
export function footVenousArchImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(!Object.hasOwn(footVenousArchImagingTopics,tab)||identities.get(s.id)!==sourceCanonical(s))return undefined;
  const topic=footVenousArchImagingTopics[tab as keyof typeof footVenousArchImagingTopics];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets],citations:[...topic.citations],
    note:'Original source-bound educational draft; radiologist review pending. No images or publisher text imported. No measured flow, normal calibre, diagnostic threshold, patient registration or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.'};
}
