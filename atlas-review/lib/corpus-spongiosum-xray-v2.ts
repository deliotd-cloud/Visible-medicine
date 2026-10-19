import data from '../public/models/bodyparts3d/corpus-spongiosum/catalog.json' with {type:'json'};
import {corpusSpongiosumXrayTopic} from '../content/corpus-spongiosum-xray-v2';
import {sourceCanonical,type BodySourceAddition} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const source=data as unknown as BodySourceAddition;

export function corpusSpongiosumXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  if(!source.structures.some(p=>sourceCanonical(p)===sourceCanonical(s)))return undefined;
  const topic=corpusSpongiosumXrayTopic;
  return {
    readiness:'draft',
    title:`${s.name} · ${topic.title} · draft`,
    body:topic.body,
    bullets:[...topic.bullets,`Visible source limit: ${s.coverageNote}`,`Reference and reuse: ${topic.credit}`],
    citations:[...topic.citations],
    note:'Source-bound educational draft for revision-bound radiologist review. Bulb/shaft representation only; no glans or paired cavernous surfaces. No acquired scan, patient image, lumen continuity, calibre, patency, injury finding or coordinate registration is represented. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
