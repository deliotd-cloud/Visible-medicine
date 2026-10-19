'use client';

import {useId,useRef,useState} from 'react';
import {headAnatomyCheckForConcept} from '../lib/head-anatomy-checks.ts';
import {headMriAnatomyCheckForConcept} from '../lib/head-mri-anatomy-checks.ts';
import {headCtFacialQuestionForConcept} from '../lib/head-ct-facial-teaching.ts';

type Props={conceptId:string;revision:string;surface:'CT'|'MRI'|'3D'};
type Check=NonNullable<ReturnType<typeof headAnatomyCheckForConcept>|ReturnType<typeof headMriAnatomyCheckForConcept>|ReturnType<typeof headCtFacialQuestionForConcept>>;

/** Keyed inner state cannot carry an answer into another source/selection. */
export function HeadAnatomyCheck({conceptId,revision,surface}:Props){
  const check=headAnatomyCheckForConcept(conceptId,revision)??headMriAnatomyCheckForConcept(conceptId,revision,surface)??(surface==='CT'||surface==='3D'?headCtFacialQuestionForConcept(conceptId,revision):null);
  if(!check||!['CT','MRI','3D'].includes(surface))return null;
  return <Question key={`${conceptId}:${revision}:${surface}:${check.revision}`} check={check}/>;
}

function Question({check}:{check:Check}){
  const name=useId(),[choice,setChoice]=useState(''),[answer,setAnswer]=useState<string|null>(null);
  const firstAnswer=useRef<string|null>(null),{question}=check;
  const correct=question.options.find(option=>option.id===question.correctOptionId)!;
  return <details className="head-anatomy-check">
    <summary>Check understanding · Draft</summary>
    <p>One answer per question view. Practice only; no exam score or saved completion.</p>
    <form onSubmit={event=>{
      event.preventDefault();
      if(firstAnswer.current!==null||!question.options.some(option=>option.id===choice))return;
      // Latch immediately, including two submissions before React renders.
      firstAnswer.current=choice;setAnswer(choice);
    }}>
      <fieldset disabled={answer!==null}>
        <legend>{question.prompt}</legend>
        {question.options.map(option=><label key={option.id}>
          <input type="radio" name={name} value={option.id} checked={choice===option.id} onChange={()=>{
            if(firstAnswer.current===null)setChoice(option.id);
          }}/><span>{option.label}</span>
        </label>)}
      </fieldset>
      <button type="submit" disabled={!choice||answer!==null}>Check answer</button>
    </form>
    <div className="head-anatomy-check-feedback" role="status" aria-live="polite" aria-atomic="true">
      {answer!==null&&<>
        <p><strong>{answer===question.correctOptionId?'Correct.':'Not quite.'}</strong>{answer!==question.correctOptionId&&<> Correct answer: {correct.label}.</>}</p>
        <p>{question.explanation}</p><p>Your first answer is kept while this question view remains open.</p>
      </>}
    </div>
    <details><summary>Sources &amp; separate question revision</summary>
      <ul>{check.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
      <p>{check.scope}</p><p>Question packet <code>{check.revision}</code> · not covered by earlier teaching-note reviews.</p>
    </details>
  </details>;
}
