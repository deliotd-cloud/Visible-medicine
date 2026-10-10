import pins from '../content/vocal-tissue-teaching-pins.json' with {type:'json'};
import {vocalTissueTeachingTopics as topics} from '../content/vocal-tissue-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof topics;
const bindings=new Map(pins.entries.map(entry=>[
  entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family},
]));
const sourceLimit='These static, unvalidated source surfaces do not show the conus elasticus, complete mucosal vocal fold, histological layers, independent complete vocalis boundary, nerves, sound, vibration, airway dimensions, patient registration or an operative plane.';
const reviewNote='Original educational draft; independent anatomy and revision-bound radiologist review pending. Atlas, imaging-case and paid-lecture access remain independent.';

/** Anatomy and Function drafts only for the four exact current source identities. */
export function vocalTissueTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='anatomy'&&tab!=='function')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||s.region!=='head-neck'||
    (binding.family==='ligament' ? s.bundle!=='head-neck-connective-gaps'||s.system!=='connective'||s.category!=='ligament' :
      s.bundle!=='head-neck-muscles'||s.system!=='muscles'||s.category!=='muscle')||
    sourceCanonical(s)!==binding.signature)return undefined;
  const topic=topics[binding.family];
  return {
    readiness:'draft',title:`${s.name} · ${tab==='anatomy'?'Tissue & relationships':'Role & limits'} · draft`,
    body:topic[tab],bullets:[topic.prompt,topic.limit,
      `Source identity: ${s.fmaId} · ${s.laterality} · ${s.sources.map(source=>source.file).join(', ')}. The source label does not verify an attachment or tissue boundary.`,
      sourceLimit],citations:[...topic.references],note:reviewNote,
  };
}
