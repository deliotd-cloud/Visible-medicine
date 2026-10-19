import {HEAD_LINK_REVISION,type HeadModality} from './head-atlas-links.ts';
import {headImageConceptById as headConceptById} from './head-image-only-links.ts';
import {headLearningLinks,headLearningSequencesForModality,parseHeadLearningIntent,type HeadLearningPosition} from './head-atlas-learning.ts';

export type HeadImageNavigation={conceptId:string|null;position:HeadLearningPosition|null;invalid:boolean};
export type HeadImageNavigationContext={conceptId:string|null;position:HeadLearningPosition|null;revision:string};
const invalid:HeadImageNavigation={conceptId:null,position:null,invalid:true};

/** Accept a canonical concept, a revision-bound sequence choice or a complete step. */
export function parseHeadImageNavigation(params:URLSearchParams,revision:string,modality?:HeadModality):HeadImageNavigation{
  if(revision!==HEAD_LINK_REVISION)return invalid;
  const keys=[...params.keys()];
  if(keys.length===0)return {conceptId:null,position:null,invalid:false};
  // An explicit chooser position is distinct from a missing/partial step link.
  // Exactly two unique keys: never relay scan metadata or silently repair a URL.
  if(keys.length===2&&keys.includes('headTour')&&keys.includes('headRevision')){
    const sequence=headLearningSequencesForModality(modality).find(item=>item.id===params.get('headTour'));
    return sequence&&params.get('headRevision')===revision
      ?{conceptId:null,position:{sequenceId:sequence.id,conceptId:null},invalid:false}:invalid;
  }
  const pinnedConcept=keys.length===2&&keys.includes('concept')&&keys.includes('headRevision');
  if(pinnedConcept&&params.get('headRevision')!==revision)return invalid;
  if((keys.length===1&&keys[0]==='concept')||pinnedConcept){
    const id=params.get('concept');
    const concept=id?headConceptById(id):null;
    return concept&&(modality==='CT'?concept.ctHref:modality==='MRI'?concept.mriHref:true)?{conceptId:id,position:null,invalid:false}:invalid;
  }
  const position=parseHeadLearningIntent(params,'image');
  const links=position?headLearningLinks(position):null;
  return position&&position.conceptId&&links&&(modality==='CT'?links.ctHref:modality==='MRI'?links.mriHref:true)
    ?{conceptId:position.conceptId,position,invalid:false}:invalid;
}

/** Construct only known first-party image routes and their canonical metadata. */
export function headImageHref(modality:HeadModality,conceptId:string|null,position:HeadLearningPosition|null,revision:string):string|null{
  if(revision!==HEAD_LINK_REVISION||modality!=='CT'&&modality!=='MRI')return null;
  const route=modality==='CT'?'/atlas/ct-head':'/atlas/mri-head';
  if(position){
    const sequence=headLearningSequencesForModality(modality).find(item=>item.id===position.sequenceId);
    if(!sequence)return null;
    if(position.conceptId===null)return conceptId===null?`${route}?${new URLSearchParams({headTour:sequence.id,headRevision:revision})}`:null;
    if(conceptId!==position.conceptId)return null;
    const links=headLearningLinks(position);
    return links?(modality==='CT'?links.ctHref:links.mriHref)??null:null;
  }
  if(conceptId===null)return route;
  const concept=headConceptById(conceptId);
  const mapped=concept&&(modality==='CT'?concept.ctHref:concept.mriHref);
  return mapped?`${route}?${new URLSearchParams({concept:conceptId,headRevision:revision})}`:null;
}
