import {headLearningSequencesForModality} from './head-atlas-learning.ts';
import {headGuidedComparisonForStep,resolveHeadGuidedComparison} from './head-guided-comparison.ts';

export type GuidedComparisonStepLink={href:string;label:string;step:number;total:number};

/** Adjacent authored steps only. No skipping missing mappings or carrying scan state. */
export function resolveHeadGuidedComparisonNavigation(query:Parameters<typeof resolveHeadGuidedComparison>[0]){
  const current=resolveHeadGuidedComparison(query);
  if(!current)return null;
  const sequence=headLearningSequencesForModality().find(item=>item.id===current.sequence.id);
  if(!sequence||sequence.concepts[current.position.index]!==current.position.conceptId||sequence.concepts.length!==current.sequence.total)return null;
  const {id,concepts}=sequence,revision=current.sourceRevision,index=current.position.index;
  function adjacent(index:number):GuidedComparisonStepLink|null{
    const conceptId=concepts[index];
    if(!conceptId)return null;
    const target=headGuidedComparisonForStep(id,conceptId);
    if(!target||target.sourceRevision!==revision||target.sequence.id!==id||target.sequence.total!==concepts.length||target.position.index!==index||target.position.conceptId!==conceptId)return null;
    return {href:target.activityHref,label:target.label,step:index+1,total:concepts.length};
  }
  return {previous:adjacent(index-1),next:adjacent(index+1),atStart:index===0,atEnd:index===concepts.length-1};
}
