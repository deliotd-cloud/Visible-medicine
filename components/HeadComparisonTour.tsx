"use client";

import {useLayoutEffect,useRef} from 'react';
import {HEAD_MANIFEST_SHA256,type LoadedStudy,type Modality} from '../lib/head-atlas-import';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {headLearningSequencesForModality,headLearningSteps,type HeadLearningPosition} from '../lib/head-atlas-learning';

type Props={
  study:LoadedStudy;
  modality:Modality;
  position:HeadLearningPosition;
  onNavigate:(position:HeadLearningPosition)=>void;
  onFinish:()=>void;
};

/** Compact navigation for the model comparison; the parent owns loading and selection. */
export function HeadComparisonTour({study,modality,position,onNavigate,onFinish}:Props){
  const committedToken=useRef<object|null>(null);
  const token={};
  // An abandoned render must not retire the controls still visible on screen.
  useLayoutEffect(()=>{
    committedToken.current=token;
    return()=>{if(committedToken.current===token)committedToken.current=null;};
  });

  if(!study||!Array.isArray(study.definition?.entries)||!position?.conceptId||!headLinksCurrent())return null;
  const sequence=headLearningSequencesForModality(modality).find(item=>item.id===position.sequenceId);
  if(!sequence)return null;
  const steps=headLearningSteps(study.definition.entries,sequence.id,modality,HEAD_MANIFEST_SHA256);
  const index=steps.findIndex(item=>item.conceptId===position.conceptId);
  if(index<0||steps.length!==sequence.concepts.length)return null;
  const current=steps[index];
  const isCurrent=()=>committedToken.current===token;
  const navigate=(targetIndex:number)=>{
    if(!isCurrent())return;
    const target=steps[targetIndex];
    if(target)onNavigate({sequenceId:sequence.id,conceptId:target.conceptId});
  };
  return <nav className="head-comparison-tour" aria-label="Guided comparison tour">
    <p className="head-panel-kicker">{sequence.label} · Step {index+1}/{steps.length} · {current.label}</p>
    {!current.entry&&<p role="status">This step is unavailable in the loaded study. No other structure has been substituted.</p>}
    <div className="head-comparison-tour-controls">
      <button type="button" disabled={index===0} onClick={()=>navigate(index-1)}>Previous tour step</button>
      <button type="button" onClick={()=>{if(!isCurrent())return;if(index+1<steps.length)navigate(index+1);else onFinish();}}>{index+1<steps.length?'Next tour step':'Finish tour'}</button>
    </div>
  </nav>;
}
