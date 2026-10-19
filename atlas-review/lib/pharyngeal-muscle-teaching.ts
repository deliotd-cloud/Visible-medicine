import pins from '../content/pharyngeal-muscle-teaching-pins.json' with {type:'json'};
import {pharyngealMuscleTeachingTopics as topics} from '../content/pharyngeal-muscle-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof topics;
const bindings=new Map(pins.entries.map(entry=>[
  entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family},
]));
const sourceLimit='The admitted sources are static, unvalidated exterior muscle surfaces. They do not supply mucosa, a complete middle constrictor, raphe, independently segmented IX/X nerves, verified fibre attachments, dynamic swallowing, patient registration or an operative plane.';
const reviewNote='Original educational draft; independent anatomy and revision-bound radiologist review pending. Atlas, imaging-case and paid-lecture access remain independent.';

/** Three draft tabs only, and only for the ten exact pinned root source records. */
export function pharyngealMuscleTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='anatomy'&&tab!=='function'&&tab!=='quiz')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||s.bundle!=='head-neck-muscles'||s.region!=='head-neck'||s.system!=='muscles'||s.category!=='muscle'||
    sourceCanonical(s)!==binding.signature)return undefined;
  const topic=topics[binding.family];
  if(!topic)return undefined;
  if(tab==='quiz')return {
    readiness:'draft',title:`${s.name} · Pharyngeal muscle quick check · draft`,
    body:topic.question,bullets:[...topic.choices],correctAnswer:topic.correctAnswer,
    explanation:topic.explanation,citations:[...topic.references],
    note:`${topic.limit} ${sourceLimit} ${reviewNote}`,
  };
  return {
    readiness:'draft',title:`${s.name} · ${tab==='anatomy'?'Attachments & relationships':'Role & limits'} · draft`,
    body:topic[tab],bullets:[topic.prompt,topic.limit,
      `Source identity: ${s.fmaId} · ${s.laterality} · ${s.sources.map(source=>source.file).join(', ')}. The source label does not verify an attachment.`,
      sourceLimit],citations:[...topic.references],note:reviewNote,
  };
}
