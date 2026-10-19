'use client';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {gradeRegionalMriStructureCheck,revealRegionalMriStructureCheck,gradeRegionalMriLocationCheck,revealRegionalMriLocationCheck,type RegionalMriStructureCheck as Check,type RegionalMriLocationCheck as LocationCheck} from '../lib/regional-mri-structure-check';
import type {RegionalMriPackage,RegionalLoadedSeries,RegionalLoadedAnnotation} from '../lib/regional-mri-package';
import type {RegionalMriFrame} from '../lib/regional-mri-render';
import type {Plane} from '../lib/head-atlas-geometry.mjs';

export type RegionalMriPracticeMode='name'|'locate';
export type RegionalMriLocationPick={check:LocationCheck;frame:RegionalMriFrame;plane:Plane;slice:number;x:number;y:number;nonce:number};
type Context={check:Check|null;location:LocationCheck|null;mode:RegionalMriPracticeMode;pkg:RegionalMriPackage;study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation};
type Feedback=Context&{id:string;kind:'correct'|'incorrect'|'revealed'|'unavailable';label?:string;view?:{plane:Plane;slice:number;width:number;height:number}};
const same=(a:Context,b:Context)=>a.check===b.check&&a.location===b.location&&a.mode===b.mode&&a.pkg===b.pkg&&a.study===b.study&&a.overlay===b.overlay;

/** Local formative identification only. No score, persistence, approval or source writes. */
export function RegionalMriStructureCheck({check,pkg,study,overlay,retired,imageReady,annotationVisible,onClose,onFocus,onNext,onReturnToGuide,nextAvailable=false,location=null,mode='name',pick=null,frame=null,plane='axial',slice=0,onModeChange=()=>{},onShowAnswer=()=>{},followup=null}:
 Omit<Context,'mode'|'location'>&{retired:boolean;imageReady:boolean;annotationVisible:boolean;onClose:()=>void;onFocus:()=>void;
 onNext?:()=>void;onReturnToGuide?:()=>void;nextAvailable?:boolean;location?:LocationCheck|null;mode?:RegionalMriPracticeMode;pick?:RegionalMriLocationPick|null;frame?:RegionalMriFrame|null;plane?:Plane;slice?:number;onModeChange?:(mode:RegionalMriPracticeMode)=>void;onShowAnswer?:()=>void;followup?:ReactNode}){
 const context={check,location,mode,pkg,study,overlay},[feedback,setFeedback]=useState<Feedback|null>(null);
 const terminalFeedback=useRef<Feedback|null>(null);
 const handledPick=useRef<RegionalMriLocationPick|null>(null);
 const heading=useRef<HTMLHeadingElement|null>(null),focusedQuestion=useRef<Context|null>(null);
 const renders=useRef(0),committed=useRef<{context:Context;token:number;retired:boolean;imageReady:boolean;annotationVisible:boolean}|null>(null),token=++renders.current;
 useLayoutEffect(()=>{
  // Only a committed replacement question may release the terminal answer.
  // Speculative renders, image redraws and StrictMode replay cannot reopen it.
  if(terminalFeedback.current&&!same(terminalFeedback.current,context))terminalFeedback.current=null;
  committed.current={context,token,retired,imageReady,annotationVisible};return()=>{committed.current=null;};
 });
 const current=(needImage=true)=>!retired&&committed.current?.token===token&&!committed.current.retired&&same(committed.current.context,context)&&(!needImage||imageReady&&committed.current.imageReady&&annotationVisible&&committed.current.annotationVisible);
 useLayoutEffect(()=>{
  if(retired||focusedQuestion.current&&same(focusedQuestion.current,context)||typeof document==='undefined'||typeof HTMLElement==='undefined')return;
  const cancel=(event:FocusEvent)=>{
   const latest=committed.current,target=event.target;
   // This listener owns the question across image/feedback renders, not a
   // single render token. Only deliberate focus on a connected real control
   // consumes its pending intent; disabled-launcher blur to body is not intent.
   if(!latest||latest.retired||!same(latest.context,context)||!(target instanceof HTMLElement)||!target.isConnected||target===document.body||target===document.documentElement)return;
   focusedQuestion.current=context;
  };
  document.addEventListener('focusin',cancel);
  return()=>document.removeEventListener('focusin',cancel);
 },[check,location,mode,pkg,study,overlay,retired]);
 useEffect(()=>{
  if(!imageReady||!committed.current?.imageReady||!current(false)||!heading.current||focusedQuestion.current&&same(focusedQuestion.current,context))return;
  // Consume before focusin and StrictMode replay can observe this transition.
  focusedQuestion.current=context;heading.current.focus({preventScroll:true});
 });
 const ownedFeedback=feedback&&same(feedback,context)?feedback:null;
 const shown=!retired&&imageReady&&annotationVisible&&ownedFeedback&&(mode!=='locate'||ownedFeedback.view?.plane===plane&&ownedFeedback.view.slice===slice&&ownedFeedback.view.width===frame?.width&&ownedFeedback.view.height===frame?.height)?ownedFeedback:null;
 const finished=ownedFeedback?.kind==='correct'||ownedFeedback?.kind==='revealed';
 const completed=()=>finished||!!(terminalFeedback.current&&same(terminalFeedback.current,context));
 const publishFeedback=(value:Feedback)=>{
  // React state may not commit before another queued click or overlay callback.
  // Latch success/reveal first; incorrect attempts remain retryable.
  if(value.kind==='correct'||value.kind==='revealed')terminalFeedback.current=value;
  setFeedback(value);
 };
 const choose=(id:string)=>{
  if(!current()||completed()||mode!=='name'||!check)return;
  const kind=gradeRegionalMriStructureCheck(check,pkg,study,overlay,id);
  publishFeedback({...context,id,kind,label:kind==='correct'?check.options.find(option=>option.id===id)?.label:undefined});
 };
 const reveal=()=>{
  if(!current()||completed())return;
  if(mode==='locate'){
   if(!location)return;const label=revealRegionalMriLocationCheck(location,pkg,study,overlay);
   publishFeedback({...context,id:'reveal',kind:label?'revealed':'unavailable',label:label??undefined,view:frame?{plane,slice,width:frame.width,height:frame.height}:undefined});if(label)onShowAnswer();
  }else{
   if(!check)return;const answer=revealRegionalMriStructureCheck(check,pkg,study,overlay);
   publishFeedback({...context,id:answer?.id??'',kind:answer?'revealed':'unavailable',label:answer?.label});
  }
 };
 // Grade only after the owning viewer's layout/paint commit. The pick reference
 // prevents duplicate attempts across state updates and StrictMode replay.
 useEffect(()=>{
  if(!pick||handledPick.current===pick||mode!=='locate'||!location||!current()||completed()||pick.check!==location||pick.frame!==frame||pick.plane!==plane||pick.slice!==slice)return;
  handledPick.current=pick;
  const kind=gradeRegionalMriLocationCheck(location,pkg,study,overlay,pick.frame,plane,slice,pick.x,pick.y);
  publishFeedback({...context,id:String(pick.nonce),kind,label:kind==='correct'?location.targetLabel:undefined,view:{plane,slice,width:pick.frame.width,height:pick.frame.height}});if(kind==='correct')onShowAnswer();
 });
 return <section className="regional-mri-review__check" aria-labelledby="regional-mri-check-title">
  <p className="regional-mri-review__eyebrow">Structure check · private draft</p>
  <div className="regional-mri-review__guide-actions" role="group" aria-label="Structure check activity">
   <button type="button" disabled={!check||retired} aria-pressed={mode==='name'} onClick={()=>{if(current(false)&&check)onModeChange('name');}}>Name annotation</button>
   <button type="button" disabled={!location||retired} title={!location?'A verified accepted mask is required; point and curve annotations use naming only.':undefined} aria-pressed={mode==='locate'} onClick={()=>{if(current(false)&&location)onModeChange('locate');}}>Find on image</button>
  </div>
  <h3 id="regional-mri-check-title" ref={heading} tabIndex={-1}>{mode==='locate'?`Find ${location?.targetLabel??'the saved annotation'}`:'Identify the highlighted annotation'}</h3>
  <p>{mode==='locate'?'Click within the saved target extent. The answer overlay stays hidden until a correct attempt or reveal. Focus the image and use arrow keys (Shift for larger moves), then Enter to check with the keyboard.':'The overlay marks the saved source extent, not necessarily the whole structure.'} This is formative practice, not an exam or clinical assessment.</p>
  {retired?<p role="status">Question paused because the source changed or is loading. Previous feedback is no longer current.</p>:!imageReady?<p role="status">Waiting for the current annotation image to be drawn. Answers are paused.</p>:!annotationVisible?<p role="status">{mode==='locate'?'The saved target mask does not intersect this slice.':'No saved annotation is visible on this slice.'} Move to a slice showing it or return to saved focus. Answers are paused.</p>:<>
   {mode==='name'&&check?<fieldset><legend>{check.prompt}</legend>
    <div className="regional-mri-review__check-options">{check.options.map(option=><button key={option.id} type="button"
     disabled={!!finished} aria-pressed={shown?.id===option.id} onClick={()=>choose(option.id)}>{option.label}</button>)}</div>
   </fieldset>:<p>{location?.prompt}</p>}
   <p role="status" aria-live="polite" className={`regional-mri-review__check-feedback${shown?' is-'+shown.kind:''}`}>
    {shown?.kind==='correct'?(mode==='locate'?'Correct — your point is inside the saved mask extent on this displayed slice.':`Correct — this is the saved ${shown.label} annotation.`):
     shown?.kind==='incorrect'?(mode==='locate'?'That point is outside the saved mask extent on this slice. Try another point or reveal the answer.':'Not this saved annotation. Try another answer or reveal it.'):
     shown?.kind==='revealed'?(mode==='locate'?'Answer overlay revealed. This is not a correct attempt.':`Answer: ${shown.label}. This is a revealed answer, not a correct attempt.`):
     shown?.kind==='unavailable'?'This question is no longer available for the current source. Return to inspection.':mode==='locate'&&finished?'This check is complete; the answer overlay is shown. Change activity or return to inspection.':mode==='locate'?'Click the image, or move its keyboard pointer and press Enter. No score or completion is recorded.':'Choose an answer. No score or completion is recorded.'}
   </p>
   <div className="regional-mri-review__guide-actions">
    <button type="button" disabled={!!finished} onClick={reveal}>Reveal answer</button>
   </div>
  </>}
  {(shown?.kind==='correct'||shown?.kind==='revealed')&&followup}
  {onNext&&<button type="button" disabled={retired||!nextAvailable} onClick={()=>{if(nextAvailable&&current(false))onNext();}}>Next structure</button>}
  {onNext&&!retired&&!nextAvailable&&<p>No other unambiguous accepted annotation is available in this sequence for this activity.</p>}
  {!retired&&<button type="button" onClick={()=>{if(current(false))onFocus();}}>Return to saved annotation focus</button>}
  <button type="button" onClick={()=>{if(current(false))onClose();}} disabled={retired}>Return to inspection</button>
  {onReturnToGuide&&<button type="button" disabled={retired} onClick={()=>{if(current(false))onReturnToGuide();}}>Return to guided step</button>}
  <details><summary>Question scope &amp; revision</summary>
   <p>Question revision: <code>{mode==='locate'?location?.revision:check?.revision}</code>. Bound to this exact local source, sequence and current accepted-scoped annotation.
    {mode==='name'?' Alternative answers are distinct accepted-scoped concepts from the same sequence.':' Location grading uses the displayed raster’s saved mask occupancy, not a complete anatomical boundary. Point/curve annotations are not location targets.'}</p>
   <p>Annotation acceptance does not approve this question, anatomy, diagnosis, 3D correspondence or learner release. Radiologist review remains separate. No answers are sent to a server or saved.</p>
   {onNext&&<p>Next structure stays in this sequence. Multiple source variants require explicit inspection; a new target is verified before replacing this question.</p>}
  </details>
 </section>;
}
