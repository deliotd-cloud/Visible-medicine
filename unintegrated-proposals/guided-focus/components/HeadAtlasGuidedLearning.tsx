"use client";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {HeadEntry,LoadedStudy,Modality} from '../lib/head-atlas-import';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import';
import {headLinksCurrent,HEAD_LINK_REVISION_NOTICE} from '../lib/head-link-availability.ts';
import {headImageConcept as headAtlasConcept} from '../lib/head-image-only-links.ts';
import {headLearningSequencesForModality,headLearningSteps,headLearningLinks,type HeadLearningPosition} from '../lib/head-atlas-learning';
import {practiceEntries,type PracticeMode} from '../lib/head-atlas-practice';
import {createHeadLearningFocusLease,focusHeadLearningContent} from '../lib/head-atlas-focus';
import {HeadAtlasTeaching} from './HeadAtlasTeaching';
import {HeadAtlasConceptTeaching} from './HeadAtlasConceptTeaching';
import {HeadLearningBookmark} from './HeadLearningBookmark';
import {createLectureTourContext} from '../lib/lecture-tour-context';
import {relatedLectureHref} from '../lib/lecture-related-links';
import {HeadSeparateComparisonLink} from './HeadSeparateComparisonLink';
export function HeadAtlasGuidedLearning({study,modality,position,onPositionChange,onSelect,onPractice,onPracticeSequence,studySetAdd,onCompare,comparisonReady=false,autoPlaying=false}:{study:LoadedStudy|null;modality:Modality;position:HeadLearningPosition;onPositionChange:(position:HeadLearningPosition)=>void;onSelect:(entry:HeadEntry)=>void;onPractice:(entry:HeadEntry)=>void;onPracticeSequence?:(entries:HeadEntry[],mode:PracticeMode)=>void;studySetAdd?:{count:number;total:number;onAdd:()=>void};onCompare?:(entry:HeadEntry)=>void;comparisonReady?:boolean;autoPlaying?:boolean}){
  const sequence=position.sequenceId;
  const [questionMode,setQuestionMode]=useState<PracticeMode>('locate');
  const headingRef=useRef<HTMLHeadingElement>(null),sequenceRef=useRef<HTMLSelectElement>(null);
  const focusLeaseRef=useRef<{key:string;lease:ReturnType<typeof createHeadLearningFocusLease>}|null>(null);
  const focusKey=JSON.stringify([modality,sequence,position.conceptId]);
  // Only committed controls may act. An abandoned render must not retire the
  // visible controls; layout cleanup retires a commit before new events run.
  const committed=useRef<{consumed:boolean}|null>(null);
  const action={consumed:false};
  useLayoutEffect(()=>{
    committed.current=action;
    return()=>{if(committed.current===action)committed.current=null;};
  });
  const canAct=()=>committed.current===action&&!action.consumed;
  const consume=()=>{if(!canAct())return false;action.consumed=true;return true;};
  const sequences=headLearningSequencesForModality(modality);
  const steps=headLearningSteps(study?.definition.entries??[],sequence,modality,HEAD_MANIFEST_SHA256);
  const availableSteps=steps.filter(item=>item.entry).length;
  const firstAvailableIndex=steps.findIndex(item=>item.entry);
  const firstAvailable=steps[firstAvailableIndex];
  const step=steps.findIndex(item=>item.conceptId===position.conceptId),current=steps[step];
  // Offer an explicit shortcut only across gaps. Ordinary Next keeps every
  // canonical slot, including unavailable anatomy, and never silently skips it.
  const nextAvailableIndex=step>=0?steps.findIndex((item,index)=>index>step&&!!item.entry):-1;
  const nextAvailable=nextAvailableIndex>step+1?steps[nextAvailableIndex]:null;
  const entry=current?.entry,link=entry?headAtlasConcept(entry,modality):null;
  // A missing local mask does not erase the canonical concept or its mapped
  // destinations. Only loaded entries may drive inline selection or practice.
  const handoff=current?headLearningLinks(position):null;
  const tourContext=current?createLectureTourContext(position,modality,HEAD_MANIFEST_SHA256):{kind:'none'} as const;
  const lectureHref=tourContext.kind==='ready'&&headLinksCurrent()?relatedLectureHref(current.conceptId,HEAD_MANIFEST_SHA256,0,tourContext):null;
  const otherHref=modality==='CT'?handoff?.mriHref:handoff?.ctHref;
  const canPractise=!!entry&&practiceEntries(study?.definition.entries??[]).includes(entry);
  const eligible=new Set(practiceEntries(study?.definition.entries??[]));
  const practiceSteps=[...new Set(steps.flatMap(item=>item.entry&&eligible.has(item.entry)?[item.entry]:[]))];
  useLayoutEffect(()=>{
    if(!position.conceptId||typeof document==='undefined'||typeof window==='undefined')return;
    const lease=createHeadLearningFocusLease(document,window);
    focusLeaseRef.current={key:focusKey,lease};
    return()=>{lease.cancel();if(focusLeaseRef.current?.lease===lease)focusLeaseRef.current=null;};
  },[modality,sequence,position.conceptId]);
  // Stopping playback must not replay a focus request created during playback.
  useLayoutEffect(()=>{if(autoPlaying)focusLeaseRef.current?.lease.cancel();},[autoPlaying,focusKey]);
  useEffect(()=>{
    if(!study||step<0||autoPlaying)return;
    const request=focusLeaseRef.current;
    if(request?.key===focusKey)request.lease.settle(headingRef.current);
  },[study,modality,sequence,position.conceptId,step]);
  function go(index:number){const target=steps[index];if(!study||!target||!consume())return;onPositionChange({sequenceId:sequence,conceptId:target.conceptId});if(target.entry)onSelect(target.entry);}
  function openSavedStep(savedPosition:HeadLearningPosition){
    // Consume a callback retained from a replaced study or older render.
    if(!canAct())return true;
    const target=headLearningSteps(study?.definition.entries??[],savedPosition.sequenceId,modality,HEAD_MANIFEST_SHA256)
      .find(item=>item.conceptId===savedPosition.conceptId);
    if(!target||!consume())return false;
    onPositionChange(savedPosition);
    if(target.entry)onSelect(target.entry);
    return true;
  }
  function finish(){if(!consume())return;onPositionChange({sequenceId:sequence,conceptId:null});focusHeadLearningContent(sequenceRef.current);}
  if(!headLinksCurrent())return <section className="head-practice head-guided-learning"><h2>Guided learning</h2><p role="status">{HEAD_LINK_REVISION_NOTICE}</p></section>;
  return <section className="head-practice head-guided-learning"><h2>Guided learning</h2><p>Work through a short anatomy sequence and compare available CT and MRI examples. A 3D Atlas comparison is offered only where an exact anatomical concept is mapped.</p>
    <p><Link href={`/atlas/guided-learning?view=${modality}`} prefetch={false} target="_blank" rel="noopener noreferrer">Browse {modality} linked tours (new tab)</Link></p>
    <label>Sequence<select ref={sequenceRef} value={sequence} disabled={!study} onChange={event=>{const id=event.target.value;if(study&&id!==sequence&&sequences.some(item=>item.id===id)&&consume())onPositionChange({sequenceId:id,conceptId:null});}}>{sequences.map(item=>{const tourSteps=study?headLearningSteps(study.definition.entries,item.id,modality,HEAD_MANIFEST_SHA256):[];return <option key={item.id} value={item.id}>{item.label}{tourSteps.length?` · ${tourSteps.filter(step=>step.entry).length} / ${tourSteps.length} available`:''}</option>;})}</select></label>
    <HeadLearningBookmark position={position} modality={modality} onOpenCurrent={openSavedStep}/>
    {!study?<p>The configured local preview opens the approved scan automatically. Otherwise choose the approved atlas folder {position.conceptId?'to resume this tour step.':'to start.'}</p>:step<0?<><p>{position.conceptId?'The requested step is not available in this loaded study. No other structure has been substituted. ':''}{availableSteps} / {steps.length} steps available. These orientation sequences are drafts for radiologist review.</p>{availableSteps===0&&<p role="status">No matching masks are available for this sequence in the loaded study. Choose another sequence.{steps.length>0?' You can also inspect Sequence steps below.':''}</p>}{firstAvailableIndex>0&&<p>Earlier steps are unavailable in this study. They remain in Sequence steps with their original numbering.</p>}<button type="button" disabled={firstAvailableIndex<0} onClick={()=>{if(firstAvailableIndex>=0)go(firstAvailableIndex);}}>{firstAvailableIndex>0?`Start at step ${firstAvailableIndex+1} · ${firstAvailable.label}`:'Start sequence'}</button></>:<>
      <p className="head-panel-kicker" role="status">Step {step+1} / {steps.length}</p><h3 ref={headingRef} tabIndex={-1}>{current.label}</h3>
      {entry?<><p>Scroll through the saved mask in each native plane. {link?.atlasHref?'Compare its shape and relationships in the 3D Atlas; CT and MRI show different subjects.':'Compare the available CT and MRI examples as separate subjects. No exact 3D Atlas part is mapped.'}</p><p>{String(entry.source?.declared_scope??'Saved representation only.')}</p></>:<p role="status">This step is unavailable in the loaded study. No other structure has been substituted. Continue to the next step or choose one from Sequence steps.</p>}
      {link&&<HeadAtlasTeaching key={link.conceptId} conceptId={link.conceptId} modality={modality} revision={HEAD_MANIFEST_SHA256}/>}
      {!entry&&current&&handoff&&<HeadAtlasConceptTeaching key={`${current.conceptId}:${modality}:${HEAD_MANIFEST_SHA256}`} conceptId={current.conceptId} modality={modality} revision={HEAD_MANIFEST_SHA256}/>}
      {!entry&&handoff&&<p>Mapped destinations remain available for this anatomical step. Mask availability is checked in the destination study; these links do not substitute a local mask or synchronize subjects.</p>}
      {lectureHref&&<details className="head-practice-help"><summary>Related lectures</summary><p>Find accessible lecture slides related to this authored {modality} step. Lecture access is separate from Atlas access; a lecture may be unavailable.</p><a href={lectureHref} target="_blank" rel="noopener noreferrer">Find related lectures</a></details>}
      <div className="head-concept-links">{handoff&&<>{handoff.atlasHref&&(onCompare&&entry&&comparisonReady?<button type="button" disabled={!comparisonReady} onClick={()=>{if(comparisonReady&&consume())onCompare(entry);}}>Compare this step beside 3D</button>:<a href={handoff.atlasHref} target="_blank" rel="noopener noreferrer" aria-label="Open this step in the 3D Atlas in a new tab">Open this step in the 3D Atlas</a>)}{otherHref?<><Link href={otherHref} prefetch={false}>Continue this step on {modality==='CT'?'MRI':'CT'}</Link><HeadSeparateComparisonLink href={otherHref} modality={modality==='CT'?'MRI':'CT'}/></>:<span>No exact {modality==='CT'?'MRI':'CT'} comparison mapped.</span>}</>}</div>
      <div className="head-guided-controls"><button type="button" disabled={step===0} onClick={()=>go(step-1)}>Previous</button>{entry&&<button type="button" onClick={()=>{if(consume())onSelect(entry);}}>Show this step</button>}{step+1<steps.length?<button type="button" onClick={()=>go(step+1)}>Next</button>:<button type="button" onClick={finish}>Finish sequence</button>}</div>
      {nextAvailable&&<div className="head-guided-gap"><p>{nextAvailableIndex-step-1} upcoming {nextAvailableIndex-step-1===1?'step has no matching mask':'steps have no matching masks'} in this study. Next visits each step; the shortcut below leaves their original positions in Sequence steps.</p><button type="button" onClick={()=>go(nextAvailableIndex)}>Next available · step {nextAvailableIndex+1} · {nextAvailable.label}</button></div>}
      {entry&&<><button type="button" disabled={!canPractise} onClick={()=>{if(canPractise&&consume())onPractice(entry);}}>Find this structure · quick check</button>{!canPractise&&<p>This saved representation is excluded from scored practice; you can still compare its anatomy.</p>}</>}
    </>}
{study&&steps.length>0&&<details className="head-practice-help head-sequence-steps" key={sequence}><summary>Sequence steps · {steps.filter(item=>item.entry).length} / {steps.length} available</summary><ol>{steps.map(item=><li key={item.conceptId}><button type="button" aria-current={item.index===step?'step':undefined} onClick={()=>go(item.index)}>{item.label}{!item.entry?' · unavailable':''}</button></li>)}</ol><p>Unavailable steps keep their original position; no saved anatomy is substituted. Finishing records no score or clinical approval.</p>{studySetAdd&&<><button type="button" disabled={studySetAdd.count===0} onClick={()=>{if(studySetAdd.count>0&&consume())studySetAdd.onAdd();}}>Add tour to study set ({studySetAdd.count})</button><p role="status">{studySetAdd.total===0?'No new eligible masks in this tour.':studySetAdd.count===0?'Study set is full; no new tour masks fit.':studySetAdd.count<studySetAdd.total?`${studySetAdd.count} of ${studySetAdd.total} new masks fit in the study set.`:`${studySetAdd.count} new tour masks can be added.`} Existing study set entries stay in place.</p></>}{onPracticeSequence&&<><label>Tour question style<select value={questionMode} disabled={!practiceSteps.length} onChange={event=>{const mode=event.target.value;if(practiceSteps.length&&mode!==questionMode&&(mode==='locate'||mode==='label'||mode==='recall')&&consume())setQuestionMode(mode);}}><option value="locate">Find it on the scan</option><option value="label">Label the highlighted structure</option><option value="recall">Type the structure name</option></select></label><button type="button" disabled={!practiceSteps.length} onClick={()=>{if(practiceSteps.length&&consume())onPracticeSequence(practiceSteps,questionMode);}}>Practise available steps</button><p>{practiceSteps.length} / {steps.length} steps have distinct saved masks for this set. Points, shared-geometry aliases and unavailable masks are excluded. Results stay in this session; you can return to this tour afterwards.</p></>}</details>}
    <details className="head-practice-help"><summary>Comparison limits &amp; access</summary><p>Links match anatomical concepts, not spatial coordinates. Partial masks stay partial. CT/MRI links continue in this tab by default; the optional new-tab link keeps this scan open. Each tab checks access independently. Enable Folder sharing to reuse a manually selected folder in this tab; sharing is off by default and does not transfer to a new tab. In new tabs, a configured local preview opens automatically; otherwise choose the approved folder. CT and MRI are separate, unregistered subjects. {onCompare?'Matching loaded scan structures can be compared beside this scan. Other mapped 3D Atlas links open separately in a new tab.':'Mapped 3D Atlas links open separately in a new tab.'} No lecture is opened or unlocked; paid lecture and imaging access are separate.</p></details>
  </section>;
}
