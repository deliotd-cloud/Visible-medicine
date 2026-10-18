import pins from '../content/lacrimal-drainage-ultrasound-pins.json' with {type:'json'};
import {lacrimalDrainageUltrasoundTopics} from '../content/lacrimal-drainage-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = new Map([
  ['FMA59583',{id:'vm:anatomy:body:head-neck:left:organ:left-lacrimal-canaliculus',group:'canaliculus' as const}],
  ['FMA59582',{id:'vm:anatomy:body:head-neck:right:organ:right-lacrimal-canaliculus',group:'canaliculus' as const}],
  ['FMA59546',{id:'vm:anatomy:body:head-neck:left:organ:left-lacrimal-sac',group:'sac' as const}],
  ['FMA59545',{id:'vm:anatomy:body:head-neck:right:organ:right-lacrimal-sac',group:'sac' as const}],
]);
if(pins.entries.length!==expected.size||new Set(pins.entries.map(e=>e.identity.fmaId)).size!==expected.size||
  pins.entries.some(e=>expected.get(e.identity.fmaId)?.id!==e.identity.id||expected.get(e.identity.fmaId)?.group!==e.group||e.identity.nodeName!==e.identity.fmaId))
  throw Error('Unexpected lacrimal ultrasound source pins.');
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:expected.get(e.identity.fmaId)!.group}]));

/** Study-specific orientation only; no acquired image, full lumen or registration is encoded. */
export function lacrimalDrainageUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='ultrasound')return undefined;
  const match=bindings.get(s.id);if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const topic=lacrimalDrainageUltrasoundTopics[match.group];
  return {readiness:'draft',title:`${s.name} · Ultrasound acquisition and limits · draft`,body:topic.body,
    bullets:[...topic.bullets],citations:[...topic.citations],note:topic.note};
}
