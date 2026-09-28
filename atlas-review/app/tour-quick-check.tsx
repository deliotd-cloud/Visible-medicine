'use client';
import type {ContentLesson} from '@/atlas-review/lib/content-types';
import {StructureQuickCheck} from './structure-quick-check';
import './tour-imaging-notes.css';

/** Only existing explicitly keyed source-bound lessons; never infer an answer. */
export function TourQuickCheck({lesson,onOpen}:{lesson:ContentLesson;onOpen:()=>void}) {
  const choices=lesson.bullets??[];
  if(lesson.readiness!=='draft'||!lesson.correctAnswer||
    choices.filter(choice=>choice===lesson.correctAnswer).length!==1||
    choices.some(choice=>!choice.trim())||new Set(choices.map(choice=>choice.trim())).size!==choices.length)return null;
  return <details className="tour-imaging-notes tour-quick-check" onToggle={event=>{if(event.currentTarget.open)onOpen();}}>
    <summary>Quick check</summary>
    <div className="tour-imaging-reader" role="region" aria-label="Tour quick check" tabIndex={0}>
      <p>Opening this check pauses the tour. Use Play when you are ready to continue.</p>
      <StructureQuickCheck question={lesson.body} choices={choices}
        correctAnswer={lesson.correctAnswer} explanation={lesson.explanation}/>
      <details><summary>References & limits</summary>
        {lesson.note&&<p>{lesson.note}</p>}
        {lesson.citations?.filter(url=>/^https?:\/\//i.test(url)).map((url,index)=><a key={url} href={url} target="_blank" rel="noreferrer">Reference {index+1} ↗</a>)}
      </details>
    </div>
  </details>;
}
