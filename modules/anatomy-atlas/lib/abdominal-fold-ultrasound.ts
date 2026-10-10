import pins from '../content/abdominal-fold-ultrasound-pins.json' with {type:'json'};
import {abdominalFoldUltrasoundTopics} from '../content/abdominal-fold-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected=[
  ['FMA14643','mesentery','FJ3396'],
  ['FMA14647','mesocolon','FJ3398'],
  ['FMA16549','mesoappendix','FJ3397'],
] as const;
if(pins.entries.length!==3||pins.entries.some((entry,index)=>
  entry.identity.fmaId!==expected[index][0]||entry.topic!==expected[index][1]||
  entry.identity.sources.length!==1||entry.identity.sources[0].file!==expected[index][2]||
  entry.identity.category!=='membrane'||entry.identity.system!=='connective'||
  entry.identity.bundle!=='abdomen-connective-mesenteric'||
  sourceCanonical(entry.topics)!==sourceCanonical(['ultrasound'])))
  throw Error('Unexpected abdominal fold ultrasound pins.');
const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,
  {signature:sourceCanonical(entry.identity),topic:entry.topic as keyof typeof abdominalFoldUltrasoundTopics}]));

export function abdominalFoldUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='ultrasound')return undefined;
  const bound=bindings.get(s.id);
  if(!bound||bound.signature!==sourceCanonical(s))return undefined;
  const topic=abdominalFoldUltrasoundTopics[bound.topic];
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets],citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. No images or publisher text imported. The selected source surface does not validate complete peritoneal folds, embedded structures, diagnostic thresholds, patient registration or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.'};
}
