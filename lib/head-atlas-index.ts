import {HEAD_LINK_REVISION,headAtlasConcept,type HeadConceptLink,type HeadEntry,type HeadModality} from './head-atlas-links.ts';
import {headImageConcept,type HeadImageConceptLink} from './head-image-only-links.ts';

export type HeadAnatomyRow<T extends HeadEntry & {family:string}> = {
  entry:T;
  /** Exact 3D mapping only: controls the linked filter and count. */
  concept:HeadConceptLink|null;
  /** Includes image-only concepts for search, not 3D mapping or quiz eligibility. */
  imageConcept:HeadImageConceptLink|null;
};

/** Discovery metadata only. It must never widen the source mapping or practice pool. */
export function indexHeadAnatomy<T extends HeadEntry & {family:string}>(entries:readonly T[],modality:HeadModality,revision:string):HeadAnatomyRow<T>[] {
  return entries.map(entry=>({entry,concept:revision===HEAD_LINK_REVISION?headAtlasConcept(entry,modality):null,imageConcept:revision===HEAD_LINK_REVISION?headImageConcept(entry,modality):null}));
}

export function filterHeadAnatomyIndex<T extends HeadEntry & {family:string}>(rows:readonly HeadAnatomyRow<T>[],options:{query:string;family:string;linkedOnly:boolean;side?:string;representation?:string}):HeadAnatomyRow<T>[] {
  // Discovery only: every literal term must occur in this row, in any order.
  // Keep source IDs intact; do not infer aliases, sides or new concept bindings.
  const terms=[...new Set(options.query.toLowerCase().split(/\s+/u).filter(Boolean))];
  return rows.filter(({entry,concept,imageConcept})=>{
    if(options.family!=='All systems'&&entry.family!==options.family||options.linkedOnly&&concept===null)return false;
    if(options.side!==undefined&&(entry.laterality??'')!==options.side)return false;
    if(options.representation!==undefined&&(entry.representation??'')!==options.representation)return false;
    const text=`${entry.label} ${entry.id} ${entry.laterality??''} ${imageConcept?.label??concept?.label??''} ${imageConcept?.conceptId??concept?.conceptId??''}`.toLowerCase();
    return terms.every(term=>text.includes(term));
  });
}
