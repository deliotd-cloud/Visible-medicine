import type {HeadEntry,LoadedStudy,Modality} from './head-atlas-import.ts';
import {headStudySetEntries,type HeadStudySet} from './head-study-set.ts';
import {headImageConcept,resolveHeadImageConcept} from './head-image-only-links.ts';
import {headImageHref} from './head-atlas-navigation.ts';
import {headLinksCurrent} from './head-link-availability.ts';

export type HeadStudyComparison={entry:HeadEntry;links:{modality:'3D'|'CT'|'MRI';href:string}[];scopeNote?:string};

/** Concept-only navigation for the exact current shortlist; no scan state is transferred. */
export function headStudyComparisons(state:HeadStudySet,study:LoadedStudy|null,revision:string,modality:Modality):HeadStudyComparison[]{
  if(!headLinksCurrent()||(modality!=='CT'&&modality!=='MRI'))return [];
  return headStudySetEntries(state,study,revision).map(entry=>{
    const concept=headImageConcept(entry,modality);
    if(!concept||resolveHeadImageConcept(study!.definition.entries,concept.conceptId,modality)!==entry||
      study!.definition.entries.filter(candidate=>headImageConcept(candidate,modality)?.conceptId===concept.conceptId).length!==1)return {entry,links:[]};
    const links:HeadStudyComparison['links']=[];
    if(concept.atlasHref)links.push({modality:'3D',href:concept.atlasHref});
    const other=modality==='CT'?'MRI':'CT';
    const href=headImageHref(other,concept.conceptId,null,revision);
    if(href)links.push({modality:other,href});
    return {entry,links,scopeNote:concept.scopeNote};
  });
}
