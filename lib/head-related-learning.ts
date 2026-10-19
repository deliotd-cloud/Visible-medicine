import type {HeadEntry,Modality} from './head-atlas-import.ts';
import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {headImageConcept as headAtlasConcept} from './head-image-only-links.ts';
import {headLearningSequencesForModality,headLearningSteps} from './head-atlas-learning.ts';

/** Explicit entry points only: never infer a tour from a label or substitute anatomy. */
export function headRelatedLearning(entries:HeadEntry[],entry:HeadEntry,modality:Modality,revision:string){
  if(revision!==HEAD_LINK_REVISION||!entries.includes(entry))return [];
  const concept=headAtlasConcept(entry,modality);
  if(!concept)return [];
  return headLearningSequencesForModality(modality).flatMap(sequence=>{
    const steps=headLearningSteps(entries,sequence.id,modality,revision);
    const step=steps.find(item=>item.conceptId===concept.conceptId&&item.entry===entry);
    return step?[{position:{sequenceId:sequence.id,conceptId:concept.conceptId},label:sequence.label,
      step:step.index+1,total:steps.length,available:steps.filter(item=>item.entry).length}]:[];
  });
}
