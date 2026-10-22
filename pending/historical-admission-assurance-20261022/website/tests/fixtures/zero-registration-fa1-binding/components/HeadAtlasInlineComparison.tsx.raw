'use client';

import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection,type LiveHeadSelection} from '../lib/head-live-selection.ts';
import {HEAD_FOCUS_PROTOCOL,headFocusResult} from '../lib/head-guided-focus.ts';
import {headInlineDestination,headInlineMatches,headInlineReverseConcept,type InlineHeadDestination} from '../lib/head-inline-comparison.ts';
import type {HeadModality} from '../lib/head-atlas-links.ts';

export type HeadInlinePlaybackStatus={conceptId:string;status:'waiting'|'matched'|'blocked'};
type Props={conceptId:string;revision:string;modality:HeadModality;selectionReady?:boolean;onSelectConcept:(conceptId:string)=>void;onClose:()=>void;onPlaybackStatus?:(status:HeadInlinePlaybackStatus)=>void};
type Status='loading'|'connecting'|'waiting'|'matched'|'different'|'empty'|'practice'|'guided'|'unavailable'|'refused';

function InlineFrame({destination,modality,selectionReady,onSelectConcept,onClose,onPlaybackStatus}:{destination:InlineHeadDestination;modality:HeadModality;selectionReady:boolean;onSelectConcept:Props['onSelectConcept'];onClose:Props['onClose'];onPlaybackStatus?:Props['onPlaybackStatus']}){
  const frame=useRef<HTMLIFrameElement>(null),session=useRef(''),sequence=useRef(0),command=useRef(0),pending=useRef<number|null>(null);
  const timer=useRef<number|null>(null),waitGeneration=useRef(0),active=useRef(false);
  const desired=useRef(destination),shownFor=useRef(destination.conceptId),ready=useRef(selectionReady),latest=useRef<LiveHeadSelection|null>(null);
  const latestStatus=useRef<Status>('loading'),needsFocus=useRef(false),wanted=useRef(false),accepted=useRef(false),refused=useRef(false),acceptedAfter=useRef(0);
  const actions=useRef({connect:()=>{},requestFocus:()=>{},disconnect:()=>{}});
  const committed=useRef<object|null>(null),token={};
  const isCurrent=()=>committed.current===token;
  const [status,setStatus]=useState<Status>('loading'),[selection,setSelection]=useState<LiveHeadSelection|null>(null);
  // The loaded URL stays stable across compatible concepts; retry starts at the current authored URL.
  const [src,setSrc]=useState(destination.src),[attempt,setAttempt]=useState(0);
  function clearTimer(){waitGeneration.current++;if(timer.current!==null)window.clearTimeout(timer.current);timer.current=null;}
  function show(next:Status){
    latestStatus.current=next;setStatus(next);
    if(isCurrent())onPlaybackStatus?.({conceptId:desired.current.conceptId,status:!ready.current?'waiting':next==='matched'?'matched':['loading','connecting','waiting'].includes(next)?'waiting':'blocked'});
  }
  function wait(milliseconds:number){
    clearTimer();const epoch=waitGeneration.current,current=session.current;
    timer.current=window.setTimeout(()=>{
      if(!active.current||waitGeneration.current!==epoch||session.current!==current)return;
      actions.current.disconnect();
    },milliseconds);
  }
  function disconnect(){
    if(!isCurrent())return;
    clearTimer();session.current='';sequence.current=0;pending.current=null;accepted.current=false;
    latest.current=null;setSelection(null);wanted.current=false;show('unavailable');
  }
  function connect(){
    if(!isCurrent()||!active.current)return;
    // Reconnect retires the old command/session, but preserves its outstanding
    // intent. A fresh valid snapshot must arrive before a new command is sent.
    const resumeFocus=ready.current&&(pending.current!==null||wanted.current);
    session.current=crypto.randomUUID();sequence.current=0;command.current=0;pending.current=null;
    wanted.current=resumeFocus;if(resumeFocus)needsFocus.current=true;
    // Document load is not evidence that the model app has responded or rendered.
    accepted.current=false;refused.current=false;latest.current=null;setSelection(null);show('connecting');wait(15000);
    frame.current?.contentWindow?.postMessage({type:HEAD_SELECTION_PROTOCOL+'-request',version:1,session:session.current},window.location.origin);
  }
  function requestFocus(){
    if(!isCurrent()||!active.current||!ready.current||!session.current||!latest.current||pending.current!==null||!wanted.current)return;
    if(latest.current.status==='blocked'){
      wanted.current=false;needsFocus.current=false;show(latest.current.reason!);return;
    }
    const number=++command.current;pending.current=number;accepted.current=false;refused.current=false;wanted.current=false;
    show('waiting');wait(10000);
    frame.current?.contentWindow?.postMessage({type:HEAD_FOCUS_PROTOCOL,version:1,revision:desired.current.sourceRevision,
      session:session.current,command:number,target:desired.current.target},window.location.origin);
  }
  // Publish protocol intent only for the committed UI. A speculative compatible
  // render must not replace the visible selection, readiness or event actions.
  useLayoutEffect(()=>{
    committed.current=token;desired.current=destination;ready.current=selectionReady;
    actions.current={connect,requestFocus,disconnect};
    return()=>{if(committed.current===token)committed.current=null;};
  });
  // Retire an old target/command during commit, before messages can acknowledge
  // it against a newly visible scan selection while passive effects are pending.
  useLayoutEffect(()=>{
    if(shownFor.current===destination.conceptId&&selectionReady&&!needsFocus.current)return;
    const wasUnavailable=latestStatus.current==='unavailable';
    shownFor.current=destination.conceptId;
    clearTimer();pending.current=null;accepted.current=false;refused.current=false;show('waiting');setSelection(null);
    needsFocus.current=true;wanted.current=true;
    if(!selectionReady){wanted.current=false;return;}
    if(latest.current?.status==='blocked'){
      wanted.current=false;needsFocus.current=false;show(latest.current.reason!);
    }else if(session.current&&latest.current)actions.current.requestFocus();
    else if(session.current)wait(15000);
    else if(wasUnavailable){wanted.current=false;show('unavailable');}
    else wait(15000);
  },[destination.conceptId,selectionReady]);
  useEffect(()=>{
    active.current=true;latest.current=null;latestStatus.current='loading';
    const loadEpoch=++waitGeneration.current;
    timer.current=window.setTimeout(()=>{if(active.current&&committed.current!==null&&waitGeneration.current===loadEpoch&&latestStatus.current==='loading')actions.current.disconnect();},15000);
    const receive=(event:MessageEvent)=>{
      if(!active.current||committed.current===null)return;
      if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
      const data=event.data;
      if(data?.type===HEAD_SELECTION_PROTOCOL+'-ready'&&data.version===1&&data.revision===desired.current.sourceRevision&&
        Object.keys(data).sort().join('|')==='revision|type|version'){
        if(!session.current)actions.current.connect();return;
      }
      if(!session.current)return;
      const result=pending.current===null?null:headFocusResult(data,desired.current.sourceRevision,session.current,pending.current);
      if(result){
        if(!ready.current)return;
        if(result==='refused'){
          clearTimer();pending.current=null;accepted.current=false;wanted.current=false;needsFocus.current=false;refused.current=true;show('refused');
        }else{accepted.current=true;acceptedAfter.current=sequence.current;}
        return;
      }
      const next=parseHeadSelection(data,desired.current.sourceRevision,session.current,sequence.current);
      if(!next)return;
      sequence.current=next.sequence;latest.current=next;setSelection(next);
      if(!ready.current){clearTimer();pending.current=null;accepted.current=false;wanted.current=false;return;}
      if(next.status==='blocked'){
        clearTimer();pending.current=null;accepted.current=false;wanted.current=false;needsFocus.current=false;
        show(next.reason!);if(next.reason==='unavailable')session.current='';return;
      }
      if(refused.current){show('refused');return;}
      if(needsFocus.current){
        if(pending.current!==null){
          if(accepted.current&&next.sequence>acceptedAfter.current&&headInlineMatches(next,desired.current.conceptId)){
            clearTimer();pending.current=null;accepted.current=false;needsFocus.current=false;show('matched');
          }
          return;
        }
        if(wanted.current){actions.current.requestFocus();return;}
      }
      clearTimer();show(next.status==='empty'?'empty':headInlineMatches(next,desired.current.conceptId)?'matched':'different');
    };
    window.addEventListener('message',receive);
    return()=>{active.current=false;window.removeEventListener('message',receive);clearTimer();session.current='';pending.current=null;latest.current=null;};
  },[destination.scope,attempt]);
  const current=shownFor.current===destination.conceptId;
  const visibleStatus=selectionReady?(current?status:'waiting'):'annotation';
  // Report only the already source/session/command-checked selection. This is
  // semantic readiness, never a registration or a patient-space coordinate.
  useEffect(()=>{
    if(isCurrent())onPlaybackStatus?.({conceptId:destination.conceptId,status:visibleStatus==='matched'?'matched':['loading','connecting','waiting','annotation'].includes(visibleStatus)?'waiting':'blocked'});
  },[destination.conceptId,visibleStatus,onPlaybackStatus]);
  const reverse=current&&visibleStatus==='different'?headInlineReverseConcept(selection,destination.conceptId,modality,destination.headRevision):null;
  return <section className="head-inline-comparison" aria-label="3D Atlas comparison">
    <div className="head-inline-comparison-header"><h3>3D Atlas comparison · {destination.label}</h3><button type="button" onClick={()=>{if(isCurrent())onClose();}}>Close comparison</button></div>
    <details className="head-inline-limits"><summary>Anatomical comparison · not spatial alignment</summary><p>CT/MRI and this 3D model are separate, unregistered subjects. This is a semantic anatomy comparison, not a spatial match.</p></details>
    <p role="status">{visibleStatus==='annotation'?'The selected scan annotation is not ready; model comparison is paused.':visibleStatus==='loading'?'Loading 3D model…':visibleStatus==='connecting'?'Connecting to the 3D model; waiting to confirm the matching structure…':visibleStatus==='waiting'?'Comparison is waiting to confirm the matching structure…':visibleStatus==='matched'?`${destination.label} is selected in the model.`:visibleStatus==='different'?selection?.concept?`The model selected ${selection.concept.label}, which differs from ${destination.label}.`:`The model selected anatomy without an exact CT/MRI concept mapping. ${destination.label} is not confirmed.`:visibleStatus==='empty'?`No model structure is selected; ${destination.label} is not confirmed.`:visibleStatus==='practice'?'Model practice is active. Comparison changes are paused.':visibleStatus==='guided'?'An in-model guide is active. Comparison changes are paused.':visibleStatus==='refused'?'The current model view cannot select that structure.':'The 3D model has not confirmed a matching selection yet. It may still be loading or unavailable; retry or open the full Atlas.'}</p>
    {reverse&&selection?.concept&&<button type="button" onClick={()=>{if(isCurrent()&&active.current&&ready.current&&desired.current.conceptId===destination.conceptId&&shownFor.current===destination.conceptId&&latestStatus.current==='different'&&headInlineReverseConcept(latest.current,desired.current.conceptId,modality,desired.current.headRevision)===reverse)onSelectConcept(reverse);}}>Show {selection.concept.label} on {modality}</button>}
    {current&&['different','empty','refused'].includes(visibleStatus)&&<button type="button" onClick={()=>{
      if(!isCurrent()||!active.current||!ready.current||desired.current.conceptId!==destination.conceptId||shownFor.current!==destination.conceptId||latest.current?.status==='blocked')return;
      needsFocus.current=true;wanted.current=true;actions.current.requestFocus();
    }}>Show {destination.label} in model</button>}
    {(visibleStatus==='unavailable'||visibleStatus==='refused')&&<button type="button" onClick={()=>{
      if(!isCurrent()||!active.current||!ready.current||desired.current.conceptId!==destination.conceptId||shownFor.current!==destination.conceptId)return;
      disconnect();needsFocus.current=false;wanted.current=false;setSrc(desired.current.src);show('loading');setAttempt(value=>value+1);
    }}>{visibleStatus==='refused'?'Reload model for this structure':'Retry model comparison'}</button>}
    {(visibleStatus==='unavailable'||visibleStatus==='refused')&&<a className="head-inline-fallback" href={destination.atlasHref} target="_blank" rel="noopener noreferrer" aria-label={`Open ${destination.label} in the full 3D Atlas (new tab)`}>Open full 3D Atlas ↗ <span>· keeps this scan open</span></a>}
    <iframe key={attempt} ref={frame} src={src} title={`3D Atlas model comparison for ${destination.label}`} referrerPolicy="same-origin" allowFullScreen onLoad={event=>{if(isCurrent()&&event.currentTarget===frame.current)actions.current.connect();}} onError={event=>{if(isCurrent()&&event.currentTarget===frame.current)actions.current.disconnect();}}/>
  </section>;
}

export function HeadAtlasInlineComparison({conceptId,revision,modality,selectionReady=true,onSelectConcept,onClose,onPlaybackStatus}:Props){
  const destination=headInlineDestination(conceptId,revision,modality);
  if(!destination)return <section className="head-inline-comparison" aria-label="3D Atlas comparison"><div className="head-inline-comparison-header"><h3>3D Atlas comparison</h3><button type="button" onClick={onClose}>Close comparison</button></div><p role="status">This source-pinned comparison is unavailable for the current selection or revision.</p></section>;
  return <InlineFrame key={destination.scope} destination={destination} modality={modality} selectionReady={selectionReady} onSelectConcept={onSelectConcept} onClose={onClose} onPlaybackStatus={onPlaybackStatus}/>;
}
