import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from './head-atlas-import.ts';
import {practiceEntries} from './head-atlas-practice.ts';

export const HEAD_STUDY_SET_LIMIT=50;
export type HeadStudySet={study:LoadedStudy;revision:string;entries:HeadEntry[]}|null;

/** Keep only an exact current-study shortlist of canonical, scored mask entries. */
export function headStudySetEntries(state:HeadStudySet,study:LoadedStudy|null,revision:string):HeadEntry[]{
  if(!study||revision!==HEAD_MANIFEST_SHA256||!state||state.study!==study||state.revision!==revision)return [];
  const entries=state.entries;
  if(!Array.isArray(entries)||entries.length>HEAD_STUDY_SET_LIMIT)return [];
  const eligible=new Set(practiceEntries(study.definition.entries));
  const seen=new Set<HeadEntry>();
  for(const entry of entries){
    if(!eligible.has(entry)||seen.has(entry))return [];
    seen.add(entry);
  }
  return [...entries];
}

/** Toggle in selection order. An invalid candidate or full set leaves the valid set intact. */
export function toggleHeadStudySet(state:HeadStudySet,study:LoadedStudy|null,revision:string,entry:HeadEntry):HeadStudySet{
  if(!study||revision!==HEAD_MANIFEST_SHA256)return null;
  const entries=headStudySetEntries(state,study,revision);
  const eligible=new Set(practiceEntries(study.definition.entries));
  if(!eligible.has(entry))return entries.length?{study,revision,entries}:null;
  const index=entries.indexOf(entry);
  if(index!==-1)entries.splice(index,1);
  else if(entries.length<HEAD_STUDY_SET_LIMIT)entries.push(entry);
  return entries.length?{study,revision,entries}:null;
}

/** Append a filtered shortlist in its displayed order; never toggle, evict or promote aliases. */
export function appendHeadStudySet(state:HeadStudySet,study:LoadedStudy|null,revision:string,targets:readonly HeadEntry[]):HeadStudySet{
  if(!study||revision!==HEAD_MANIFEST_SHA256)return null;
  const entries=headStudySetEntries(state,study,revision);
  if(!Array.isArray(targets))return entries.length?{study,revision,entries}:null;
  const eligible=new Set(practiceEntries(study.definition.entries)),seen=new Set(entries);
  for(const entry of targets){
    if(entries.length>=HEAD_STUDY_SET_LIMIT)break;
    if(!eligible.has(entry)||seen.has(entry))continue;
    entries.push(entry);seen.add(entry);
  }
  return entries.length?{study,revision,entries}:null;
}

/** Move one exact saved mask by one position without changing membership. */
export function moveHeadStudySet(state:HeadStudySet,study:LoadedStudy|null,revision:string,entry:HeadEntry,direction:-1|1):HeadStudySet{
  if(!study||revision!==HEAD_MANIFEST_SHA256||!state||state.study!==study||state.revision!==revision)return null;
  try{
    if(!Array.isArray(state.entries))return null;
    const entries=headStudySetEntries(state,study,revision);
    if(!entries.length||entries.length!==state.entries.length)return null;
    // A stale, copied or otherwise absent entry cannot select a different mask.
    const index=entries.indexOf(entry);
    if((direction!==-1&&direction!==1)||index<0)return {study,revision,entries};
    const next=index+direction;
    if(next<0||next>=entries.length)return {study,revision,entries};
    [entries[index],entries[next]]=[entries[next],entries[index]];
    return {study,revision,entries};
  }catch{return null;}
}
