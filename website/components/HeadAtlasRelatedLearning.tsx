"use client";
import type {HeadEntry,Modality} from '../lib/head-atlas-import';
import type {HeadLearningPosition} from '../lib/head-atlas-learning';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links';
import {headImageConcept} from '../lib/head-image-only-links';
import {headRelatedLearning} from '../lib/head-related-learning';
import {headGuidedComparisonForStep} from '../lib/head-guided-comparison.ts';
import {relatedLectureHref} from '../lib/lecture-related-links';

export function HeadAtlasRelatedLearning({entries,entry,modality,revision,onStart}:{entries:HeadEntry[];entry:HeadEntry;modality:Modality;revision:string;onStart:(position:HeadLearningPosition)=>void}){
  const tours=headRelatedLearning(entries,entry,modality,revision);
  const concept=revision===HEAD_LINK_REVISION&&entries.includes(entry)?headImageConcept(entry,modality):null;
  const lectureHref=concept?relatedLectureHref(concept.conceptId,revision):null;
  if(!tours.length&&!lectureHref)return null;
  return <details key={entry.id} className="head-practice-help">
    <summary>Learn this in context{tours.length?` · ${tours.length} ${tours.length===1?'tour':'tours'}`:''}</summary>
    {tours.length>0&&<>
      <p>Open Guided learning at this structure. Earlier steps remain available; nothing is marked complete.</p>
      <ul>{tours.map(tour=>{
        const comparison=headGuidedComparisonForStep(tour.position.sequenceId,tour.position.conceptId);
        return <li key={tour.position.sequenceId}>
        <button type="button" onClick={()=>onStart(tour.position)}>{tour.label} · step {tour.step} of {tour.total}</button>
        {comparison&&<> · <a href={comparison.activityHref} target="_blank" rel="noopener noreferrer" aria-label={`Compare views for ${tour.label}, step ${tour.step} of ${tour.total} (new tab)`}>Compare views (new tab)</a></>}
        {tour.available<tour.total&&<p>{tour.available} of {tour.total} steps available in this study. Missing anatomy is not substituted.</p>}
      </li>})}</ul>
    </>}
    {lectureHref&&<details className="head-practice-help"><summary>Related lectures</summary>
      <p>Find accessible lecture slides for this structure. Lecture access is separate from Atlas access.</p>
      <a href={lectureHref} target="_blank" rel="noopener noreferrer">Find related lectures</a>
    </details>}
  </details>;
}
