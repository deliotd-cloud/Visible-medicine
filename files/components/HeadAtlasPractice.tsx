"use client";

import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {loadHeadEntry,type HeadEntry,type LoadedEntry,type LoadedStudy,type LocalHeadPackage} from '../lib/head-atlas-import';
import type {Vec3} from '../lib/head-atlas-geometry.mjs';
import {headLabel} from '../lib/head-atlas-display';
import {focusHeadLearningContent} from '../lib/head-atlas-focus';
import {firstPracticeOutcome,labelIsCorrect,maskContainsVoxel,normalizePracticeLabel,practiceChoices,practiceEntries,practiceReviewEntries,practiceRevisitEntries,practiceScore,shuffled,typedLabelIsCorrect,type PracticeMode,type PracticeOutcome} from '../lib/head-atlas-practice';
import {HeadAtlasPracticeFeedback,HeadAtlasPracticeReview} from './HeadAtlasPracticeReview';
import {HeadPracticeSummaryDownload} from './HeadPracticeSummaryDownload';
import type {HeadModality} from '../lib/head-atlas-links';
import type {HeadLearningPosition} from '../lib/head-atlas-learning';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links';

export function useHeadAtlasPractice(pkg:LocalHeadPackage|null, study:LoadedStudy|null) {
  const [mode,setMode]=useState<PracticeMode>('locate'),[family,setFamily]=useState('All systems'),[length,setLength]=useState(5);
  const [deck,setDeck]=useState<HeadEntry[]>([]),[index,setIndex]=useState(0),[active,setActive]=useState(false),[finished,setFinished]=useState(false);
  const [target,setTarget]=useState<LoadedEntry|null>(null),[choices,setChoices]=useState<HeadEntry[]>([]),[choice,setChoice]=useState(''),[pick,setPick]=useState<Vec3|null>(null);
  const [outcome,setOutcome]=useState<PracticeOutcome|null>(null),[outcomes,setOutcomes]=useState<Record<string,PracticeOutcome>>({}),[error,setError]=useState('');
  const [loadAttempt,setLoadAttempt]=useState(0);
  const [originalScore,setOriginalScore]=useState<ReturnType<typeof practiceScore>|null>(null);
  const [originalReview,setOriginalReview]=useState<{deck:HeadEntry[];outcomes:Record<string,PracticeOutcome>}|null>(null);
  // Synchronous attempt identity keeps queued handlers, feedback and first scores
  // consistent before React commits state. A new question/retry retires old handlers.
  const answerAttempt=useRef<{target:LoadedEntry|null;answered:boolean;pick:Vec3|null;choice:string}|null>(null);
  const attempt=answerAttempt.current;
  // A navigation handler belongs to one rendered question/session. Retire it
  // synchronously so queued clicks cannot move a later question or new set.
  // Preparing a replacement scan must not retire the still-visible controls.
  // Publish its context only at commit; an abandoned render stays inert.
  const navigationVisit=useMemo(()=>({pkg,study,epoch:0}),[pkg,study]);
  const navigation=useRef<typeof navigationVisit|null>(null);
  const navigationEpoch=navigationVisit.epoch;
  const canNavigate=()=>navigation.current===navigationVisit&&navigationVisit.epoch===navigationEpoch;
  const retireNavigation=()=>{navigationVisit.epoch++;};
  useLayoutEffect(()=>{
    navigation.current=navigationVisit;
    return()=>{if(navigation.current===navigationVisit)navigation.current=null;};
  },[navigationVisit]);
  const headingRef=useRef<HTMLHeadingElement>(null),feedbackRef=useRef<HTMLHeadingElement>(null),entry=deck[index];
  const currentTarget=target?.entry===entry&&study?.definition.entries.includes(entry)?target:null;
  const currentOutcome=currentTarget?outcome:null;
  // A completed result is a specific session snapshot, not a reusable list of
  // identifiers. Retire its callbacks synchronously before starting a follow-up.
  const followUp=useMemo(()=>({pkg,study,deck,outcomes,originalReview,active,finished,valid:true}),[pkg,study,deck,outcomes,originalReview,active,finished]);
  const followUpIdentity=useRef<typeof followUp|null>(null);
  useLayoutEffect(()=>{
    followUpIdentity.current=followUp;
    return()=>{if(followUpIdentity.current===followUp)followUpIdentity.current=null;};
  },[followUp]);
  // A package/modality change invalidates both scores and all in-flight questions.
  useEffect(()=>{answerAttempt.current=null;setActive(false);setFinished(false);setDeck([]);setTarget(null);setOutcomes({});setOriginalScore(null);setOriginalReview(null);setFamily('All systems');setError('');},[pkg,study]);
  useEffect(()=>{
    answerAttempt.current=null;setTarget(null);setPick(null);setChoice('');setOutcome(null);setError('');
    if(!active||!pkg||!study||!entry)return;
    const controller=new AbortController();
    const opening={target:null as LoadedEntry|null,answered:false,pick:null as Vec3|null,choice:''};
    answerAttempt.current=opening;
    // Questions score the exact saved mask, not its optional 3D surface. A mesh
    // read failure must not prevent an independently verified mask question.
    loadHeadEntry(pkg,study,entry,controller.signal,{maskOnly:true}).then(value=>{
      if(controller.signal.aborted||answerAttempt.current!==opening)return;
      if(!value.mask?.some(v=>v===1)||!value.focus)throw Error('This annotation has no usable saved mask for a quiz. Skip this question or end the set and choose another system.');
      opening.target=value;setChoices(practiceChoices(study.definition.entries,entry));setTarget(value);
    }).catch(reason=>{if(!controller.signal.aborted&&answerAttempt.current===opening)setError(reason instanceof Error?reason.message:'The question could not be opened.');});
    return()=>{controller.abort();if(answerAttempt.current===opening)answerAttempt.current=null;};
  },[pkg,study,active,entry,loadAttempt]);
  useEffect(()=>{
    if(currentOutcome||!active&&!finished)return;
    const heading=headingRef.current;
    heading?.closest('.imaging-workspace-info')?.scrollTo({top:0,behavior:'instant'});
    heading?.focus({preventScroll:true});
  },[active,currentTarget,currentOutcome,finished,error,loadAttempt]);
  useEffect(()=>{
    if(!currentOutcome)return;
    const heading=feedbackRef.current,panel=heading?.closest('.imaging-workspace-info');
    heading?.focus({preventScroll:true});
    if(heading&&panel){const box=heading.getBoundingClientRect(),bounds=panel.getBoundingClientRect();if(box.bottom>bounds.bottom-32||box.top<bounds.top+64)panel.scrollTo({top:panel.scrollTop+box.top-bounds.top-64,behavior:'instant'});}
  },[currentOutcome]);
  const available=useMemo(()=>practiceEntries(study?.definition.entries??[],family),[study,family]);
  const revisitEntries=finished&&!active?practiceRevisitEntries(deck,outcomes,study?.definition.entries??[]):[];
  function start(){
    if(!canNavigate()||!pkg||!study||!available.length)return;
    retireNavigation();
    followUp.valid=false;
    answerAttempt.current=null;
    setOriginalScore(null);setOriginalReview(null);setDeck(shuffled(available).slice(0,length));setIndex(0);setOutcomes({});setFinished(false);setActive(true);
  }
  function startTarget(target:HeadEntry){
    return startTargets([target]);
  }
  function startTargets(targets:HeadEntry[],questionMode:PracticeMode='locate'){
    if(!canNavigate()||!pkg||!study||(questionMode!=='locate'&&questionMode!=='label'&&questionMode!=='recall'))return false;
    const eligible=new Set(practiceEntries(study.definition.entries));
    const selected=[...new Set(targets)].filter(target=>eligible.has(target));
    if(!selected.length)return false;
    retireNavigation();
    followUp.valid=false;
    answerAttempt.current=null;
    setOriginalScore(null);setOriginalReview(null);setMode(questionMode);setDeck(selected);setIndex(0);
    setTarget(null);setOutcome(null);setPick(null);setChoice('');setError('');
    setOutcomes({});setFinished(false);setActive(true);
    // A repeated first target must open a fresh question, not retain prior feedback.
    setLoadAttempt(value=>value+1);return true;
  }
  function revisit(){
    revisitSubset(revisitEntries,mode);
  }
  function revisitSubset(targets:HeadEntry[],questionMode:PracticeMode,source:'current'|'original'='current'){
    if(!canNavigate()||!followUp.valid||followUpIdentity.current!==followUp||active||!finished||!pkg||!study||
      !['locate','label','recall'].includes(questionMode)||(source!=='current'&&source!=='original'))return false;
    const review=source==='original'?originalReview:{deck,outcomes};
    if(!review||!Array.isArray(targets)||!targets.length)return false;
    const eligible=new Set(practiceRevisitEntries(review.deck,review.outcomes,study.definition.entries));
    // Reject a stale or mixed request as a whole; never substitute a matching ID.
    if(new Set(targets).size!==targets.length||targets.some(target=>!eligible.has(target)))return false;
    const selected=[...new Set(targets)];
    retireNavigation();
    followUp.valid=false;
    answerAttempt.current=null;
    setOriginalScore(previous=>previous??practiceScore(outcomes,deck.length));
    setOriginalReview(previous=>previous??{deck,outcomes});
    setMode(questionMode);setDeck(selected);setIndex(0);setTarget(null);setOutcome(null);setPick(null);setChoice('');setError('');
    setOutcomes({});setFinished(false);setActive(true);setLoadAttempt(value=>value+1);
    return true;
  }
  function canAnswer(){return !!(canNavigate()&&active&&currentTarget&&attempt&&answerAttempt.current===attempt&&attempt.target===currentTarget&&!attempt.answered);}
  function record(value:PracticeOutcome){
    if(!canAnswer()||!currentTarget||!attempt)return;
    retireNavigation();
    attempt.answered=true;
    setOutcome(value);setOutcomes(previous=>firstPracticeOutcome(previous,currentTarget.entry.id,value));
  }
  function submit(){
    if(!canAnswer()||!currentTarget||!study||!attempt)return;
    if(mode==='locate'){if(attempt.pick)record(maskContainsVoxel(currentTarget,study,attempt.pick)?'correct':'incorrect');}
    else if(mode==='recall'){
      if(normalizePracticeLabel(attempt.choice))record(typedLabelIsCorrect(currentTarget.entry,attempt.choice)?'correct':'incorrect');
    }else if(attempt.choice)record(labelIsCorrect(currentTarget.entry,attempt.choice,choices)?'correct':'incorrect');
  }
  function complete(){answerAttempt.current=null;setActive(false);setFinished(true);setTarget(null);}
  function finish(){if(!canNavigate()||!active)return;retireNavigation();complete();}
  function next(){
    if(!canNavigate()||!active)return;
    retireNavigation();answerAttempt.current=null;
    if(index+1>=deck.length)complete();else setIndex(index+1);
  }
  function retry(){
    if(!canNavigate()||!active||!currentTarget||!attempt||answerAttempt.current!==attempt||!attempt.answered)return;
    retireNavigation();
    answerAttempt.current={target:currentTarget,answered:false,pick:null,choice:''};
    setOutcome(null);setPick(null);setChoice('');
  }
  function retryOpening(){
    if(!canNavigate()||!active||!pkg||!study||!entry||!error||currentTarget)return;
    retireNavigation();
    answerAttempt.current=null;
    setError('');setLoadAttempt(value=>value+1);
  }
  function end(){if(!canNavigate())return;retireNavigation();followUp.valid=false;answerAttempt.current=null;setActive(false);setFinished(false);setTarget(null);setDeck([]);setOriginalScore(null);setOriginalReview(null);}
  function chooseLabel(value:string){if(canAnswer()&&attempt&&(mode==='label'||mode==='recall')){attempt.choice=value;setChoice(value);}}
  function choosePoint(point:Vec3|null){if(canAnswer()&&attempt&&mode==='locate'){attempt.pick=point;setPick(point);}}
  function clearPendingPick(point:Vec3){
    if(!canAnswer()||!attempt||mode!=='locate')return;
    if(attempt.pick?.some((value,index)=>value!==point[index]))choosePoint(null);
  }
  return {mode,setMode,family,setFamily,length,setLength,available,active,finished,target:currentTarget,choices,choice,setChoice:chooseLabel,pick,setPick:choosePoint,outcome:currentOutcome,outcomes,error,index,total:deck.length,headingRef,feedbackRef,
    results:finished&&!active?practiceReviewEntries(deck,outcomes,study?.definition.entries??[]):[],
    originalResults:finished&&!active&&originalReview?practiceReviewEntries(originalReview.deck,originalReview.outcomes,study?.definition.entries??[]):[],
    revisitEntries,revisit,revisitSubset,originalScore,
    score:practiceScore(outcomes,deck.length),start,startTarget,startTargets,submit,reveal:()=>record('revealed'),next,retry,retryOpening,finish,end,clearPendingPick,
    acceptPick:choosePoint,
  };
}

export type HeadPractice = ReturnType<typeof useHeadAtlasPractice>;
export function HeadAtlasPractice({practice:p,study,familyNames,onReturnToLearning,onStart,reviewContext}:{practice:HeadPractice;study:LoadedStudy|null;familyNames:Record<string,string>;onReturnToLearning?:()=>void;onStart?:()=>void;reviewContext?:{modality:HeadModality;revision:string;onSelect:(entry:HeadEntry)=>void;onReviewGuide?:(position:HeadLearningPosition,entry:HeadEntry)=>void;missedStudySet?:{count:number;total:number;onAdd:()=>void};reviewStudySet?:{entries:readonly HeadEntry[];onAdd:(entries:HeadEntry[],source:'current'|'original')=>number|false}}}) {
  useEffect(()=>{if(!p.active&&!p.finished)focusHeadLearningContent(p.headingRef.current);},[p.active,p.finished,p.headingRef]);
  const systems=['All systems',...new Set(practiceEntries(study?.definition.entries??[]).map(entry=>entry.family))];
  if(p.finished)return <section className="head-practice">
    <h2 ref={p.headingRef} tabIndex={-1}>{p.originalScore?'Follow-up complete':'Practice complete'}</h2>
    <p className="head-practice-score">{p.score.correct} / {p.score.attempted} correct first attempts</p>
    <p>{p.score.revealed} revealed · {p.score.remaining} unanswered · {p.total} in this set</p>
    {p.originalScore&&<p>Original set unchanged: {p.originalScore.correct} / {p.originalScore.attempted} correct first attempts · {p.originalScore.revealed} revealed · {p.originalScore.remaining} unanswered.</p>}
    <p>Retries do not change your first-attempt score. This is session-only practice, not a certified exam or clinical approval.</p>
    {!!p.revisitEntries?.length&&<><p>{p.revisitEntries.length} incorrect, revealed or unanswered {p.revisitEntries.length===1?'structure':'structures'} to revisit. Follow-up results are separate.</p><button type="button" onClick={p.revisit}>Revisit missed structures</button></>}
    {!p.active&&study&&reviewContext?.missedStudySet&&<details className="head-practice-help"><summary>Keep missed structures for later</summary>
      <button type="button" disabled={!reviewContext.missedStudySet.count} onClick={reviewContext.missedStudySet.onAdd}>Add missed structures to My study set</button>
      <p role="status">{reviewContext.missedStudySet.total===0?'All missed structures from this completed set are already in My study set.':reviewContext.missedStudySet.count===0?'My study set is full. Remove an item there to add a missed structure.':`${reviewContext.missedStudySet.count} of ${reviewContext.missedStudySet.total} new missed structures can be added, keeping your existing selections (50 maximum).`} This does not start practice, save a plan or change your score.</p>
    </details>}
    {reviewContext&&<><HeadAtlasPracticeReview items={p.results} modality={reviewContext.modality} revision={reviewContext.revision} active={p.active} finished={p.finished} label={p.originalScore?'Review follow-up set':undefined} onReviewEntry={reviewContext.onSelect} onReviewGuide={reviewContext.onReviewGuide} onPracticeEntries={reviewContext.revision===HEAD_LINK_REVISION&&p.revisitSubset?(entries,mode)=>p.revisitSubset(entries,mode,'current'):undefined}
      studySet={reviewContext.revision===HEAD_LINK_REVISION&&reviewContext.reviewStudySet?{entries:reviewContext.reviewStudySet.entries,onAdd:entries=>reviewContext.reviewStudySet!.onAdd(entries,'current')}:undefined}/>{p.originalScore&&<HeadAtlasPracticeReview items={p.originalResults} modality={reviewContext.modality} revision={reviewContext.revision} active={p.active} finished={p.finished} label="Review original set" onReviewEntry={reviewContext.onSelect} onReviewGuide={reviewContext.onReviewGuide} onPracticeEntries={reviewContext.revision===HEAD_LINK_REVISION&&p.revisitSubset?(entries,mode)=>p.revisitSubset(entries,mode,'original'):undefined}
      studySet={reviewContext.revision===HEAD_LINK_REVISION&&reviewContext.reviewStudySet?{entries:reviewContext.reviewStudySet.entries,onAdd:entries=>reviewContext.reviewStudySet!.onAdd(entries,'original')}:undefined}/>}</>}
    {!p.active&&study&&reviewContext&&!!p.results?.length&&<HeadPracticeSummaryDownload items={p.results} originalItems={p.originalScore?p.originalResults:undefined} entries={study.definition.entries} modality={reviewContext.modality} revision={reviewContext.revision} mode={p.mode}/>}
    {onReturnToLearning&&<><button type="button" onClick={onReturnToLearning}>Return to Guided learning</button><p>Your results remain available in Results while you revisit the tour. Choosing another set or changing the study replaces this session.</p></>}
    <button type="button" onClick={p.end}>Choose another set</button>
  </section>;
  if(!p.active)return <section className="head-practice"><h2 ref={p.headingRef} tabIndex={-1}>Structure practice</h2><p>Test yourself on this study's saved masks.</p>
    <fieldset disabled={!study}><legend>Question style</legend><label><input type="radio" name="head-practice-mode" checked={p.mode==='locate'} onChange={()=>p.setMode('locate')}/> Find it on the scan</label><label><input type="radio" name="head-practice-mode" checked={p.mode==='label'} onChange={()=>p.setMode('label')}/> Label the highlighted structure</label><label><input type="radio" name="head-practice-mode" checked={p.mode==='recall'} onChange={()=>p.setMode('recall')}/> Type the structure name</label></fieldset>
    <label>Practice system<select disabled={!study} value={p.family} onChange={event=>p.setFamily(event.target.value)}>{systems.map(system=><option key={system} value={system}>{familyNames[system]??system}</option>)}</select></label>
    <label>Questions<select disabled={!study} value={p.length} onChange={event=>p.setLength(Number(event.target.value))}>{[1,5,10].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <p>{study?`${p.available.length} distinct masked annotations available. Points, curves and shared-geometry aliases are excluded.`:'Load the approved scan to begin. Configured local previews open automatically; otherwise choose the approved atlas folder.'}</p>
    <button type="button" disabled={!study||!p.available.length} onClick={()=>{onStart?.();p.start();}}>Start practice</button><p>Some masks represent only part of a structure. Answers are checked against that saved portion, not an inferred full boundary. Results stay in this session.</p></section>;
  return <section className="head-practice">
    <p className="head-panel-kicker">Question {p.index+1} / {p.total}</p>
    {p.originalScore&&<p>Focused follow-up · your original result is unchanged.</p>}
    <h2 ref={p.headingRef} tabIndex={-1}>{!p.target?(p.error?'Question unavailable':'Opening question…'):p.mode==='locate'?`Find: ${headLabel(p.target.entry)}`:'Name the highlighted structure'}</h2>
    <p id="head-quiz-instructions">{p.mode==='locate'?'Click the named structure on the scan, then check your answer. Moving to another voxel clears an unchecked answer.':p.mode==='recall'?'Type the full name of the coloured structure, including its side. Case, punctuation and extra spaces are ignored; synonyms and approximate names are not accepted. The image label stays hidden until feedback.':'Choose the label for the coloured mask. The image label stays hidden until feedback.'}</p>
    <p>Scroll through slices. Only the saved mask is tested; it may be partial.</p>
    {p.mode==='locate'&&<details className="head-practice-help"><summary>Keyboard controls</summary><p>Focus the image, use arrow keys to move the crosshair, then press Enter to place your answer.</p></details>}
    {p.error&&<><p role="alert">{p.error}</p>{!p.target&&<><p>Retry the same saved annotation, or skip it without recording an answer.</p><button type="button" onClick={p.retryOpening}>Retry opening question</button><button type="button" className="head-practice-secondary" onClick={p.next}>Skip question (unanswered)</button></>}</>}
    {p.target&&!p.outcome&&p.mode==='label'&&<fieldset className="head-practice-choices"><legend>Structure label</legend>{p.choices.map(entry=><label key={entry.id}><input type="radio" name="head-structure-answer" value={entry.id} checked={p.choice===entry.id} onChange={()=>p.setChoice(entry.id)}/><span>{headLabel(entry)}</span></label>)}</fieldset>}
    {p.target&&!p.outcome&&p.mode==='recall'&&<label>Structure name<input type="text" value={p.choice} maxLength={200} autoComplete="off" spellCheck={false} aria-describedby="head-quiz-instructions" onChange={event=>p.setChoice(event.target.value.slice(0,200))} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing&&!event.repeat){event.preventDefault();p.submit();}}}/></label>}
    {p.target&&!p.outcome&&<><p role="status">{p.mode==='locate'?(p.pick?'Answer point placed. You can reposition it before checking.':'No answer point placed.'):p.mode==='recall'?(normalizePracticeLabel(p.choice)?'Name entered.':'No name entered.'):(p.choice?'Label selected.':'No label selected.')}</p><button type="button" disabled={p.mode==='locate'?!p.pick:p.mode==='recall'?!normalizePracticeLabel(p.choice):!p.choice} onClick={p.submit}>Check answer</button><button type="button" className="head-practice-secondary" onClick={p.reveal}>Reveal answer</button><button type="button" className="head-practice-secondary" onClick={p.next}>Skip question (unanswered)</button></>}
    {p.outcome&&<div className={`head-practice-feedback is-${p.outcome}`} role="status">
      <h3 ref={p.feedbackRef} tabIndex={-1}>{p.outcome==='correct'?'Correct':p.outcome==='incorrect'?'Not quite':'Answer revealed'}</h3>
      <p>{p.target?headLabel(p.target.entry):''}</p>
      {p.outcome==='correct'&&p.target&&(p.outcomes[p.target.entry.id]==='incorrect'||p.outcomes[p.target.entry.id]==='revealed')&&<p className="head-practice-retry-note">Correct on retry. Your first-attempt score is unchanged.</p>}
      <p>{p.mode==='locate'?(p.outcome==='correct'?'Your chosen voxel is inside the saved mask.':'The saved mask is now shown. Only voxels inside this represented portion count.'):p.mode==='recall'?(p.outcome==='correct'?'You typed the matching structure name.':'The highlighted mask has this source label.'):p.outcome==='correct'?'You selected the matching anatomical label.':'The highlighted mask has this source label.'}</p>
      <button type="button" onClick={p.next}>{p.index+1===p.total?'See results':'Next question'}</button>
      <details className="head-practice-help"><summary>Source scope &amp; limitations</summary>
        <p>{String(p.target?.entry.source?.declared_scope??'No anatomical scope supplied.')}</p>
        {Array.isArray(p.target?.entry.source?.flags)&&<p>{p.target.entry.source.flags.map(String).join(' · ')}</p>}
      </details>
      {p.outcome!=='correct'&&<button type="button" className="head-practice-secondary" onClick={p.retry}>Try again (unscored)</button>}
    </div>}
    {reviewContext&&p.outcome&&p.target&&study?.definition.entries.includes(p.target.entry)&&<HeadAtlasPracticeFeedback entry={p.target.entry} outcome={p.outcome} modality={reviewContext.modality} revision={reviewContext.revision} active={p.active} finished={p.finished}/>}
    <p className="head-practice-tally">First attempts: {p.score.correct} / {p.score.attempted} · revealed {p.score.revealed}</p><button type="button" className="head-practice-secondary" onClick={p.finish}>End set</button>
  </section>;
}
