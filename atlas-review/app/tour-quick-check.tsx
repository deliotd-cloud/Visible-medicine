'use client';
import type {ContentLesson} from '@/atlas-review/lib/content-types';
import {StructureQuickCheck} from './structure-quick-check';
import {SupplementalQuizChecks} from './supplemental-quiz-checks';
import './tour-imaging-notes.css';

/** Only existing explicitly keyed source-bound lessons; never infer an answer. */
export function TourQuickCheck({lesson,onOpen,onChange}:{lesson:ContentLesson;onOpen:()=>void;onChange?:(open:boolean)=>void}) {
  const choices=lesson.bullets??[];
  if(lesson.readiness!=='draft'||!lesson.correctAnswer||
    choices.filter(choice=>choice===lesson.correctAnswer).length!==1||
    choices.some(choice=>!choice.trim())||new Set(choices.map(choice=>choice.trim())).size!==choices.length)return null;
  return <details className="tour-imaging-notes tour-quick-check" onToggle={event=>{const open=event.currentTarget.open;if(open)onOpen();onChange?.(open);}}>
    <summary>Quick check</summary>
    <div className="tour-imaging-reader" role="region" aria-label="Tour quick check" tabIndex={0}>
      <p>Opening this check pauses the tour. Use Play when you are ready to continue.</p>
      {onChange&&<p>Imaging linking stays paused while this check is open.</p>}
      <StructureQuickCheck question={lesson.body} choices={choices}
        correctAnswer={lesson.correctAnswer} explanation={lesson.explanation}/>
      {lesson.additionalChecks&&<SupplementalQuizChecks checks={lesson.additionalChecks}/>}
      <details><summary>References & limits</summary>
        {lesson.note&&<p>{lesson.note}</p>}
        {lesson.citations?.filter(url=>/^https?:\/\//i.test(url)).map((url,index)=><a key={url} href={url} target="_blank" rel="noreferrer">Reference {index+1} ↗</a>)}
      </details>
    </div>
  </details>;
}
