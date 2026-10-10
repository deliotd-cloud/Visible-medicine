import pins from '../content/spine-imaging-pins.json' with {type:'json'};
import {spinalDiscUltrasoundGroups,spinalDiscUltrasoundTopics} from '../content/spinal-disc-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Group=keyof typeof spinalDiscUltrasoundGroups;
const bindings=new Map<string,{signature:string;group:Group}>();
for(const [group,fmas] of Object.entries(spinalDiscUltrasoundGroups))for(const fma of fmas){
  const matches=pins.entries.filter(entry=>entry.identity.fmaId===fma&&entry.group===group);
  if(matches.length!==1)throw Error('Unexpected spinal-disc ultrasound source binding');
  const identity=matches[0].identity;
  if(bindings.has(identity.id))throw Error('Duplicate spinal-disc ultrasound identity');
  bindings.set(identity.id,{signature:sourceCanonical(identity),group:group as Group});
}

/** Only the nineteen previously pending, exact whole-disc source records. */
export function spinalDiscUltrasoundLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='ultrasound')return undefined;
  const bound=bindings.get(s.id);
  if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
  const topic=spinalDiscUltrasoundTopics[bound.group];
  return {readiness:'draft',title:`${s.name} · Ultrasound · draft`,body:topic.body,
    bullets:[...topic.bullets,
      'Confirm patient vertebral numbering independently. The source label does not assign a two-vertebra imaging interval; the unresolved source disc is not evidence of normal absence or fusion.',
      'Return separation to zero to study source relationships. Explode and cutaway reveal the model, not an acoustic window, acquired scan slice or validated patient registration.'],
    citations:[...topic.citations],
    note:'Original source-bound educational draft; revision-bound radiologist review pending. Whole-disc surfaces do not separately segment annulus, nucleus or endplates. No sonograms, publisher text, diagnostic thresholds or procedural instructions imported. This is not a protocol for diagnosis or intervention. Atlas, imaging-case and paid-lecture access remain independent.'};
}
