import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from './head-atlas-import.ts';
import {practiceEntries,type HeadPracticeReviewItem} from './head-atlas-practice.ts';
import {appendHeadStudySet,headStudySetEntries,type HeadStudySet} from './head-study-set.ts';

/** Validate the whole review request before adding any exact, eligible missed masks. */
export function appendHeadReviewStudySet(state:HeadStudySet,study:LoadedStudy|null,revision:string,
  results:readonly HeadPracticeReviewItem[],targets:readonly HeadEntry[]):{state:HeadStudySet;added:number}|null{
  if(!study||revision!==HEAD_MANIFEST_SHA256||!Array.isArray(results)||!Array.isArray(targets)||!targets.length)return null;
  const before=headStudySetEntries(state,study,revision);
  if(state&&(state.study!==study||state.revision!==revision||!Array.isArray(state.entries)||before.length!==state.entries.length))return null;
  const eligible=new Set(practiceEntries(study.definition.entries));
  const missed=new Set(results.filter(item=>item&&['incorrect','revealed','unanswered'].includes(item.outcome)&&eligible.has(item.entry)).map(item=>item.entry));
  if(new Set(targets).size!==targets.length||targets.some(entry=>!missed.has(entry)))return null;
  const next=appendHeadStudySet(state,study,revision,targets);
  return {state:next,added:headStudySetEntries(next,study,revision).length-before.length};
}
