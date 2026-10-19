import pins from '../content/thoracic-systemic-teaching-pins.json' with {type:'json'};
import {thoracicSystemicTeachingTopics as topics} from '../content/thoracic-systemic-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type FmaId=keyof typeof topics;
const bundle='thorax-vessels-thoracic-detail';
const bindings=new Map(pins.entries.map(entry=>[
  entry.identity.id,{signature:sourceCanonical(entry.identity),fmaId:entry.fmaId as FmaId},
]));
const sourceLimit='These source-labelled, unvalidated surfaces do not establish patent origins or junctions, complete branches, flow or perfusion territories, spinal arterial connections, a patient-specific diagnosis or an intervention route.';
const reviewNote='Original educational draft; independent anatomy and revision-bound radiologist review pending. Atlas, imaging-case and paid-lecture access remain independent.';

/** Three draft tabs for only the four exact current source identities. */
export function thoracicSystemicTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='anatomy'&&tab!=='function'&&tab!=='quiz')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||s.region!=='thorax'||s.bundle!==bundle||s.system!=='vessels'||s.category!=='vessel'||
    sourceCanonical(s)!==binding.signature)return undefined;
  const topic=topics[binding.fmaId];
  if(!topic)return undefined;
  if(tab==='quiz')return {
    readiness:'draft',title:`${s.name} · Thoracic systemic quick check · draft`,
    body:topic.question,bullets:[...topic.choices],correctAnswer:topic.correctAnswer,
    explanation:topic.explanation,citations:[...topic.references],
    note:`${topic.limit} ${sourceLimit} ${reviewNote}`,
  };
  return {
    readiness:'draft',title:`${s.name} · ${tab==='anatomy'?'Course & relationships':'Role & limits'} · draft`,
    body:topic[tab],bullets:[topic.prompt,topic.limit,
      `Source identity: ${s.fmaId} · ${s.laterality} · ${s.sources.map(source=>source.file).join(', ')}. The source label does not validate a patent attachment or a complete arterial tree.`,
      sourceLimit],citations:[...topic.references],note:reviewNote,
  };
}
