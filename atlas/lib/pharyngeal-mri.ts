import pins from '../content/pharyngeal-mri-pins.json' with {type:'json'};
import {pharyngealMriTopics} from '../content/pharyngeal-mri';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Group=keyof typeof pharyngealMriTopics;
const expected=new Map<string,Group>([
  ['FMA46729','levator'],['FMA46728','levator'],
  ['FMA46732','tensor'],['FMA46731','tensor'],
  ['FMA46672','palatopharyngeus'],['FMA46671','palatopharyngeus'],
  ['FMA46668','stylopharyngeus'],['FMA46667','stylopharyngeus'],
  ['FMA46733','uvular'],
]);
if(pins.entries.length!==9 || new Set(pins.entries.map(e=>e.identity.fmaId)).size!==9 ||
  pins.entries.some(e=>expected.get(e.identity.fmaId)!==e.group||e.identity.nodeName!==e.identity.fmaId))
  throw Error('Unexpected pharyngeal MRI source pins.');
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as Group}]));

/** Technique-specific teaching for these exact reference surfaces only. */
export function pharyngealMriLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='mri')return undefined;
  const match=bindings.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const topic=pharyngealMriTopics[match.group];
  return {readiness:'draft',title:`${s.name} · MRI orientation · draft`,body:topic.body,
    bullets:[...topic.bullets],citations:[...topic.citations],note:topic.note};
}
