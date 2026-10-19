import {headLabel} from './head-atlas-display.ts';
import type {HeadPracticeReviewItem} from './head-atlas-practice.ts';

export type HeadReviewOutcomeFilter = 'all'|'needs-review'|'correct';

export function reviewOutcomeFilter(value:string):HeadReviewOutcomeFilter {
  return value==='needs-review'||value==='correct'?value:'all';
}

export function filterHeadPracticeReview(items:readonly HeadPracticeReviewItem[],search:string,outcome:HeadReviewOutcomeFilter) {
  const terms=search.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  return items.map((item,index)=>({item,index})).filter(({item})=>{
    if(outcome==='correct'&&item.outcome!=='correct')return false;
    if(outcome==='needs-review'&&item.outcome==='correct')return false;
    const searchable=`${headLabel(item.entry)} ${item.entry.laterality}`.toLocaleLowerCase();
    return terms.every(term=>searchable.includes(term));
  });
}

/** Bind local filter state to every result field that changes the visible review. */
export function headReviewIdentity(items:readonly HeadPracticeReviewItem[],modality:string,revision:string,label:string) {
  return JSON.stringify([modality,revision,label,items.map(({entry,outcome})=>[
    entry.id,entry.label,entry.laterality,entry.representation,outcome,
  ])]);
}
