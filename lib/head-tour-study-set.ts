import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy,type Modality} from './head-atlas-import.ts';
import {headLearningSequencesForModality,headLearningSteps} from './head-atlas-learning.ts';
import {headLinksCurrent} from './head-link-availability.ts';
import {headImageConcept} from './head-image-only-links.ts';
import {practiceEntries} from './head-atlas-practice.ts';
import {HEAD_STUDY_SET_LIMIT,headStudySetEntries,type HeadStudySet} from './head-study-set.ts';

/** Exact, eligible tour masks that are new to this study set, in canonical step order. */
export function headTourStudyAdditions(state:HeadStudySet,study:LoadedStudy|null,revision:string,modality:Modality,sequenceId:string):{entries:HeadEntry[];targets:HeadEntry[]}{
  const empty={entries:[],targets:[]};
  if(!study||revision!==HEAD_MANIFEST_SHA256||!headLinksCurrent()||
    (modality!=='CT'&&modality!=='MRI')||
    !headLearningSequencesForModality(modality).some(sequence=>sequence.id===sequenceId))return empty;
  const existing=headStudySetEntries(state,study,revision);
  const eligible=new Set(practiceEntries(study.definition.entries));
  const seen=new Set(existing);
  const entries=headLearningSteps(study.definition.entries,sequenceId,modality,revision).flatMap(step=>{
    const entry=step.entry;
    if(!entry||!eligible.has(entry)||seen.has(entry)||
      headImageConcept(entry,modality)?.conceptId!==step.conceptId||
      study.definition.entries.filter(candidate=>headImageConcept(candidate,modality)?.conceptId===step.conceptId).length!==1)return [];
    seen.add(entry);
    return [entry];
  });
  return {entries,targets:entries.slice(0,Math.max(0,HEAD_STUDY_SET_LIMIT-existing.length))};
}
