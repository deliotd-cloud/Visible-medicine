import {HEAD_LINK_REVISION,type HeadEntry,type HeadModality} from './head-atlas-links.ts';
import {headImageConcept as headAtlasConcept} from './head-image-only-links.ts';
import {headLearningLinks,headLearningSequencesForModality,type HeadLearningPosition} from './head-atlas-learning.ts';

/** Contextual navigation only; callers must withhold this until feedback or completed review.
 * No scores, answer state, private file handles or scan coordinates enter the URL.
 */
export function headPracticeGuides(entry:HeadEntry,modality:HeadModality,revision:string){
  if(revision!==HEAD_LINK_REVISION)return [];
  const concept=headAtlasConcept(entry,modality);
  if(!concept)return [];
  return headLearningSequencesForModality(modality).flatMap(sequence=>{
    if(!sequence.concepts.includes(concept.conceptId))return [];
    const position:HeadLearningPosition={sequenceId:sequence.id,conceptId:concept.conceptId};
    const links=headLearningLinks(position);
    const href=links?.atlasHref??(modality==='CT'?links?.ctHref:links?.mriHref);
    return href?[{id:sequence.id,label:sequence.label,href,position}]:[];
  });
}
