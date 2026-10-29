import {parseHeadLearningDiscovery} from './head-learning-discovery.ts';
import {resolveHeadGuidedComparison} from './head-guided-comparison.ts';

export type HeadLearningReturnStep={sequenceId:string;conceptId:string;index:number;sourceRevision:string};

/** Only a current, canonical comparison can request a particular catalogue step. */
export function parseHeadLearningCatalogue(params:Record<string,string|string[]|undefined>,regions:readonly string[]){
  if(!params||typeof params!=='object'||Array.isArray(params))return null;
  const {returnTour,returnConcept,returnStep,returnRevision,...filters}=params;
  const filter=parseHeadLearningDiscovery(filters,regions);
  if(!filter)return null;
  if([returnTour,returnConcept,returnStep,returnRevision].every(value=>value===undefined))return {filter,returnPosition:undefined};
  if([returnTour,returnConcept,returnStep,returnRevision].some(value=>typeof value!=='string'))return null;
  const activity=resolveHeadGuidedComparison({concept:returnConcept,headTour:returnTour,headStep:returnStep,headRevision:returnRevision});
  if(!activity||!activity.position.conceptId||filter.view!=='all'||filter.region!=='head-neck'||filter.query!==activity.sequence.label||filter.headPage!==undefined||filter.regionalPage!==undefined)return null;
  return {filter,returnPosition:{sequenceId:activity.sequence.id,conceptId:activity.position.conceptId,index:activity.position.index,sourceRevision:activity.sourceRevision} satisfies HeadLearningReturnStep};
}
