import pins from '../content/forehead-nerve-ultrasound-pins.json' with {type:'json'};
import {foreheadNerveUltrasoundTopics} from '../content/forehead-nerve-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = new Map([
  ['FMA52656',{id:'vm:anatomy:body:head-neck:right:nerve:right-supra-orbital-nerve',group:'supraorbital' as const}],
  ['FMA52657',{id:'vm:anatomy:body:head-neck:left:nerve:left-supra-orbital-nerve',group:'supraorbital' as const}],
  ['FMA52643',{id:'vm:anatomy:body:head-neck:right:nerve:right-supratrochlear-nerve',group:'supratrochlear' as const}],
  ['FMA52644',{id:'vm:anatomy:body:head-neck:left:nerve:left-supratrochlear-nerve',group:'supratrochlear' as const}],
]);
if(pins.entries.length!==expected.size || new Set(pins.entries.map(e=>e.identity.fmaId)).size!==expected.size ||
  pins.entries.some(e=>expected.get(e.identity.fmaId)?.id!==e.identity.id || expected.get(e.identity.fmaId)?.group!==e.group || e.identity.nodeName!==e.identity.fmaId))
  throw Error('Unexpected forehead nerve ultrasound source pins.');
const bindings = new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:expected.get(e.identity.fmaId)!.group}]));

/** Selected-site research orientation only; no patient image or full nerve proof. */
export function foreheadNerveUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='ultrasound')return undefined;
  const match=bindings.get(s.id);
  if(!match || sourceCanonical(s)!==match.signature)return undefined;
  const topic=foreheadNerveUltrasoundTopics[match.group];
  return {readiness:'draft',title:`${s.name} · Ultrasound evidence and limits · draft`,body:topic.body,
    bullets:[...topic.bullets],citations:[...topic.citations],note:topic.note};
}
