import {headLearningLinks,headLearningSequencesForModality,parseHeadLearningIntent} from './head-atlas-learning.ts';
import {headImageConceptById} from './head-image-only-links.ts';
import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';

type Query=URLSearchParams|Record<string,string|string[]|undefined>;
export type GuidedComparisonView={name:'3D Atlas'|'CT'|'MRI';href:string};
export const headLearningStepId=(sequenceId:string,conceptId:string)=>`linked-step-${sequenceId}-${conceptId}`;

/** A canonical, revision-bound learning handoff; no caller query is forwarded. */
export function resolveHeadGuidedComparison(query:Query){
  if(!headLinksCurrent())return null;
  const keys=query instanceof URLSearchParams?[...query.keys()]:Object.keys(query);
  if(keys.length!==4||new Set(keys).size!==4||keys.some(key=>!['concept','headTour','headStep','headRevision'].includes(key)))return null;
  const position=parseHeadLearningIntent(query);
  if(!position?.conceptId)return null;
  const sequence=headLearningSequencesForModality().find(item=>item.id===position.sequenceId);
  const index=sequence?.concepts.indexOf(position.conceptId)??-1;
  const concept=headImageConceptById(position.conceptId);
  const links=headLearningLinks(position);
  if(!sequence||index<0||!concept||!links||concept.headRevision!==HEAD_LINK_REVISION)return null;
  const availableViews:GuidedComparisonView[]=[];
  if(links.atlasHref)availableViews.push({name:'3D Atlas',href:links.atlasHref});
  if(links.ctHref)availableViews.push({name:'CT',href:links.ctHref});
  if(links.mriHref)availableViews.push({name:'MRI',href:links.mriHref});
  if(availableViews.length<2)return null;
  const canonical=new URLSearchParams({concept:position.conceptId,headTour:sequence.id,headStep:String(index),headRevision:HEAD_LINK_REVISION});
  const catalogue=new URLSearchParams({view:'all',region:'head-neck',q:sequence.label,returnTour:sequence.id,returnConcept:position.conceptId,returnStep:String(index),returnRevision:HEAD_LINK_REVISION});
  return {label:concept.label,sequence:{id:sequence.id,label:sequence.label,total:sequence.concepts.length},position:{...position,index},availableViews,sourceRevision:HEAD_LINK_REVISION,activityHref:`/atlas/guided-learning/compare?${canonical}`,catalogueHref:`/atlas/guided-learning?${catalogue}#${headLearningStepId(sequence.id,position.conceptId)}`,scopeNote:concept.scopeNote};
}

export function headGuidedComparisonForStep(sequenceId:string,conceptId:string){
  const sequence=headLearningSequencesForModality().find(item=>item.id===sequenceId);
  const index=sequence?.concepts.indexOf(conceptId)??-1;
  if(index<0)return null;
  return resolveHeadGuidedComparison(new URLSearchParams({concept:conceptId,headTour:sequenceId,headStep:String(index),headRevision:HEAD_LINK_REVISION}));
}
