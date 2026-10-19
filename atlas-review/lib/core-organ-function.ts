import pins from '../content/core-organ-function-pins.json' with {type:'json'};
import {
  coreOrganFunctionReferences as references,
  coreOrganFunctionTopics as topics,
} from '../content/core-organ-function';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Concept=keyof typeof topics;
const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),concept:entry.concept as Concept,region:entry.region,side:entry.side}]));

/** Exact current display identity only; Function prose cannot validate physiology or a patient. */
export function coreOrganFunctionLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='function')return undefined;
  const match=bound.get(s.id);
  if(!match||s.system!=='organs'||s.category!=='organ'||s.laterality!==match.side||!s.regions.includes(match.region)||sourceCanonical(s)!==match.signature)return undefined;
  const topic=topics[match.concept];
  const sourceLimit=s.coverageNote
    ? `Visible source limit: ${s.coverageNote}`
    : `Visible source limit: this exact ${s.laterality} root combines ${s.sources.length} recorded source components in ${s.bundle}; nested detail is separately bound and does not establish completeness.`;
  return {
    readiness:'draft',
    title:`${s.name} · ${topic.title} · draft`,
    body:topic.body,
    bullets:[...topic.bullets,sourceLimit],
    citations:topic.references.map(key=>references[key]),
    note:'Source-bound educational draft for revision-bound radiologist review. Static reference surfaces do not simulate physiology, provide patient measurements, establish a diagnosis or recommend a procedure. Atlas, case and paid-lecture access remain independent.',
  };
}
