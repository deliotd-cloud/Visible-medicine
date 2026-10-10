import pins from '../content/central-canal-imaging-pins.json' with {type:'json'};
import {centralCanalImagingTopics} from '../content/central-canal-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

if(pins.entries.length!==1||pins.entries[0].identity.fmaId!=='FMA78497'||
  pins.entries[0].identity.category!=='space'||pins.entries[0].identity.bundle!=='spine-nerves'||
  sourceCanonical(pins.entries[0].topics)!==sourceCanonical(['ct','mri','ultrasound']))
  throw Error('Unexpected central-canal imaging source pins.');
const identity=sourceCanonical(pins.entries[0].identity);
export function centralCanalImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(!Object.hasOwn(centralCanalImagingTopics,tab)||sourceCanonical(s)!==identity)return undefined;
  const topic=centralCanalImagingTopics[tab as keyof typeof centralCanalImagingTopics];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets],citations:[...topic.citations],
    note:'Original source-bound educational draft; radiologist review pending. No images or publisher text imported. No measured flow, patient registration, diagnostic threshold or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.'};
}
