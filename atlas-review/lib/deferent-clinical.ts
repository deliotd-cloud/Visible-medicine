import pins from '../content/deferent-clinical-pins.json' with {type:'json'};
import {deferentClinicalReferences as references,deferentClinicalTopics as topics} from '../content/deferent-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),side:entry.side,anatomy:entry.anatomy}]));

/** Exact original source and recorded side only; this does not validate a patient or duct lumen. */
export function deferentClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  const match=bound.get(s.id);
  if(!match||s.laterality!==match.side||sourceCanonical(s)!==match.signature)return undefined;
  const topic=topics[tab];
  return {
    readiness:'draft',
    title:`${s.name} · ${topic.title} · draft`,
    body:topic.body,
    bullets:[match.anatomy.body,...topic.bullets],
    citations:[...new Set([...(match.anatomy.citations??[]),...topic.references.map(key=>references[key])])],
    note:`Source-bound teaching draft for revision-bound radiologist review. ${s.coverageNote??'This surface model does not establish anatomical completeness, duct continuity, function or patient correspondence.'} The model cannot establish patency, obstruction, inflammation, congenital status, fertility or an individual diagnosis. Atlas, case and paid-lecture access remain independent.`,
  };
}
