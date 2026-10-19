import {headLearningLinks,headLearningSequencesForModality,type HeadLearningPosition} from './head-atlas-learning.ts';
import {headGuidedDestination} from './head-guided-focus.ts';

/** Keep every canonical slot. An unavailable model target is a gap, not Finish. */
export function headGuidedPlaybackPlan(position:HeadLearningPosition){
  const sequence=headLearningSequencesForModality().find(item=>item.id===position.sequenceId);
  const index=position.conceptId?sequence?.concepts.indexOf(position.conceptId):-1;
  const currentHref=headLearningLinks(position)?.atlasHref;
  if(!sequence||index===undefined||index<0||!currentHref||!headGuidedDestination(currentHref))return null;
  const nextId=sequence.concepts[index+1]??null;
  const nextHref=nextId?headLearningLinks({sequenceId:sequence.id,conceptId:nextId})?.atlasHref:null;
  const next=nextHref?headGuidedDestination(nextHref):null;
  return {index,total:sequence.concepts.length,nextId,nextHref:next?.href??null,gap:!!nextId&&!next};
}
