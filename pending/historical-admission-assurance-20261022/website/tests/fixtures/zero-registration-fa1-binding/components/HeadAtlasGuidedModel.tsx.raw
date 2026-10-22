'use client';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {HeadAtlasLearningNavigation} from './HeadAtlasLearningNavigation';
import {HeadAtlasReferenceTeaching} from './HeadAtlasReferenceTeaching';
import {HeadTourPlayback} from './HeadTourPlayback';
import {AtlasBodyLearning} from './AtlasBodyLearning';
import {headGuidedPlaybackPlan} from '../lib/head-guided-playback';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import';
import {headLinksCurrent} from '../lib/head-link-availability';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection,type LiveHeadSelection} from '../lib/head-live-selection';
import {HEAD_FOCUS_PROTOCOL,headGuidedDestination,headFocusResult,headGuidedMatches} from '../lib/head-guided-focus';

type Status='connecting'|'waiting'|'ready'|'different'|'refused'|'practice'|'guided'|'unavailable';
/** Retain the iframe. Only exact, acknowledged model selections unlock comparison. */
export function HeadAtlasGuidedModel({initialHref,sourceRevision,coverage}:{initialHref:string;sourceRevision:string;coverage:ReactNode}){
  const initial=headGuidedDestination(initialHref);
  if(!initial)throw Error('Invalid guided model destination');
  const [destination,setDestination]=useState(initial),[status,setStatus]=useState<Status>('connecting');
  const liveStatus=useRef<Status>('connecting'),confirmedSource=useRef<string|null>(null);
  function showStatus(next:Status){liveStatus.current=next;setStatus(next);}
  const [src]=useState(initial.src);
  const frame=useRef<HTMLIFrameElement>(null),desired=useRef(destination);
  const session=useRef(''),sequence=useRef(0),command=useRef(0),pending=useRef<number|null>(null);
  const focusOutstanding=useRef(false),accepted=useRef(false);
  const snapshot=useRef<LiveHeadSelection|null>(null),wanted=useRef(true),focusHeading=useRef(false);
  const deferredHistory=useRef<string|null>(null),[historyPending,setHistoryPending]=useState(false);
  const timer=useRef<number|null>(null),epoch=useRef(0),mounted=useRef(false);
  const committed=useRef<object|null>(null),channel=useRef<object|null>(null),token={};
  const isCurrent=()=>mounted.current&&committed.current===token;
  const actions=useRef({connect:()=>{},request:()=>{}});
  function clearWait(){epoch.current++;if(timer.current!==null)window.clearTimeout(timer.current);timer.current=null;}
  function wait(milliseconds:number){clearWait();const serial=epoch.current;timer.current=window.setTimeout(()=>{
    if(!mounted.current||serial!==epoch.current)return;pending.current=null;wanted.current=false;showStatus('unavailable');
  },milliseconds);}
  function confirm(){clearWait();pending.current=null;focusOutstanding.current=false;accepted.current=false;wanted.current=false;confirmedSource.current=sourceRevision;showStatus('ready');
    if(focusHeading.current){focusHeading.current=false;frame.current?.parentElement?.querySelector<HTMLElement>('[data-head-guided-heading]')?.focus({preventScroll:true});}}
  function request(){
    if(!isCurrent()||!headLinksCurrent()||!session.current||!snapshot.current)return;
    const current=snapshot.current;
    if(current.status==='blocked'){wanted.current=false;pending.current=null;clearWait();showStatus(current.reason!);return;}
    if(!focusOutstanding.current&&headGuidedMatches(current,desired.current)){confirm();return;}
    if(!wanted.current||pending.current!==null)return;
    wanted.current=false;const number=++command.current;pending.current=number;focusOutstanding.current=true;accepted.current=false;showStatus('waiting');wait(10000);
    frame.current?.contentWindow?.postMessage({type:HEAD_FOCUS_PROTOCOL,version:1,revision:sourceRevision,session:session.current,command:number,target:desired.current.target},window.location.origin);
  }
  function connect(){
    if(!isCurrent())return;clearWait();session.current=crypto.randomUUID();sequence.current=0;command.current=0;
    pending.current=null;accepted.current=false;snapshot.current=null;confirmedSource.current=null;showStatus('connecting');wait(15000);
    frame.current?.contentWindow?.postMessage({type:HEAD_SELECTION_PROTOCOL+'-request',version:1,session:session.current},window.location.origin);
  }
  function deferHistory(href:string|null){deferredHistory.current=href;setHistoryPending(href!==null);}
  function navigate(href:string,push=true,fromHistory=false,requireFreshConfirmation=false,automatic=false){
    const next=headGuidedDestination(href);if(!isCurrent()||!next||!headLinksCurrent())return false;
    if(snapshot.current?.status==='blocked'&&['practice','guided'].includes(snapshot.current.reason!)){
      if(fromHistory)deferHistory(href===desired.current.href?null:href);
      showStatus(snapshot.current.reason as 'practice'|'guided');return true;
    }
    deferHistory(null);
    clearWait();pending.current=null;desired.current=next;wanted.current=true;focusHeading.current=!automatic;
    if(requireFreshConfirmation)focusOutstanding.current=true;
    setDestination(next);showStatus('waiting');
    if(push&&window.location.pathname+window.location.search!==next.href)window.history.pushState(window.history.state,'',next.href);
    if(!session.current||!snapshot.current)actions.current.connect();else actions.current.request();return true;
  }
  function advancePlayback(conceptId:string){
    if(!isCurrent()||liveStatus.current!=='ready'||confirmedSource.current!==sourceRevision||!session.current||pending.current!==null||focusOutstanding.current||deferredHistory.current||!snapshot.current||!headGuidedMatches(snapshot.current,desired.current)||!headLinksCurrent())return;
    const plan=headGuidedPlaybackPlan(desired.current.position);
    if(!plan||plan.gap||plan.nextId!==conceptId||!plan.nextHref)return;
    navigate(plan.nextHref,true,false,true,true);
  }
  const navigation=useRef(navigate);
  // A speculative render cannot replace the visible controls or protocol
  // actions. Layout cleanup also retires callbacks before passive unmount.
  useLayoutEffect(()=>{
    committed.current=token;actions.current={connect,request};navigation.current=navigate;
    return()=>{if(committed.current===token)committed.current=null;};
  });
  useEffect(()=>{
    deferHistory(null);
    mounted.current=true;const currentChannel={};channel.current=currentChannel;
    const receive=(event:MessageEvent)=>{
      if(!mounted.current||committed.current===null||channel.current!==currentChannel)return;
      if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
      const data=event.data;
      if(data?.type===HEAD_SELECTION_PROTOCOL+'-ready'&&data.version===1&&data.revision===sourceRevision&&Object.keys(data).sort().join('|')==='revision|type|version'){actions.current.connect();return;}
      if(!session.current)return;
      const result=pending.current===null?null:headFocusResult(data,sourceRevision,session.current,pending.current);
      if(result){if(result==='refused'){clearWait();pending.current=null;focusOutstanding.current=false;accepted.current=false;wanted.current=false;showStatus('refused');}else accepted.current=true;return;}
      const next=parseHeadSelection(data,sourceRevision,session.current,sequence.current);if(!next)return;
      sequence.current=next.sequence;snapshot.current=next;
      if(next.status==='blocked'){
        clearWait();pending.current=null;focusOutstanding.current=false;accepted.current=false;wanted.current=false;showStatus(next.reason!);
        if(next.reason==='unavailable')session.current='';return;
      }
      const deferred=deferredHistory.current;
      if(deferred){
        const actual=window.location.pathname+window.location.search+window.location.hash;
        if(deferred===actual&&headGuidedDestination(deferred)&&headLinksCurrent()){
          navigation.current(deferred,false,false,true);return;
        }
        deferHistory(null);
      }
      if(headGuidedMatches(next,desired.current)&&(!focusOutstanding.current||accepted.current)){confirm();return;}
      if(pending.current!==null)return;
      if(wanted.current)actions.current.request();else {clearWait();showStatus('different');}
    };
    const pop=()=>{if(!mounted.current||committed.current===null||channel.current!==currentChannel)return;
      const href=window.location.pathname+window.location.search+window.location.hash;
      if(!navigation.current(href,false,true))window.location.assign(href);};
    window.addEventListener('message',receive);window.addEventListener('popstate',pop);actions.current.connect();
    return()=>{window.removeEventListener('message',receive);window.removeEventListener('popstate',pop);
      if(channel.current!==currentChannel)return;channel.current=null;mounted.current=false;deferredHistory.current=null;clearWait();session.current='';pending.current=null;};
  },[sourceRevision]);
  useEffect(()=>{if(initialHref!==desired.current.href)navigation.current(initialHref,false);},[initialHref]);
  const ready=status==='ready'&&confirmedSource.current===sourceRevision&&headLinksCurrent();
  const playback=headGuidedPlaybackPlan(destination.position);
  const playbackBlocked=!headLinksCurrent()||historyPending||!playback||playback.gap||!['ready','waiting'].includes(status);
  const notice=status==='ready'?'Model selection matches this step.':status==='practice'?historyPending?'Finish model practice to open the requested history step.':'Finish model practice before changing linked steps.':status==='guided'?historyPending?'Finish the in-model guide to open the requested history step.':'Finish the in-model guide before changing linked steps.':status==='different'?'The model selection differs from this tour step.':status==='connecting'?'Connecting to the model…':status==='waiting'?'Waiting for the model to select this step…':'This step cannot be focused in the current model view.';
  return <>
    <HeadAtlasLearningNavigation position={destination.position} onNavigate={href=>navigate(href)} comparisonReady={ready} recoveryLinks={!ready&&(status==='unavailable'||status==='refused'||status==='different')} status={<div className="head-guided-status">
      {playback&&<HeadTourPlayback key={destination.position.sequenceId} context={{identity:`${sourceRevision}:${session.current}`,revision:HEAD_MANIFEST_SHA256,sequenceId:destination.position.sequenceId,stepId:destination.position.conceptId,index:playback.index,total:playback.total,nextId:playback.nextId,ready,blocked:playbackBlocked,onAdvance:advancePlayback}} blockedReason={playback.gap?'Paused · the next canonical step has no exact 3D mapping.':playbackBlocked?'Playback paused · confirm this model step first.':undefined}/>}
      <p role="status">{notice}</p>
      {ready&&<HeadAtlasReferenceTeaching key={`caption:${destination.position.conceptId}`} compact conceptId={destination.position.conceptId!} revision={HEAD_MANIFEST_SHA256}/>}
      {!ready&&status!=='waiting'&&status!=='connecting'&&status!=='practice'&&status!=='guided'&&<>
        <button type="button" onClick={()=>{if(!isCurrent())return;wanted.current=true;focusHeading.current=true;if(!session.current)actions.current.connect();else actions.current.request();}}>Show this step</button>
        <a data-head-reload href={destination.href}>Open step in a fresh model view</a>
      </>}
      <a href={destination.src} target="_blank" rel="noopener noreferrer" aria-label="Open model only in a new tab, without guided learning controls">Open model only</a>
    </div>}/>
    <iframe ref={frame} className="shoulder-module-frame" src={src} title="Interactive head and neck: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen onLoad={()=>{if(isCurrent())actions.current.connect();}} onError={()=>{if(!isCurrent())return;clearWait();session.current='';pending.current=null;showStatus('unavailable');}}/>
    <AtlasBodyLearning frame={frame} src={src} dock="flow"/>
    <details className="shoulder-module-notes"><summary>Guided learning, coverage &amp; sources</summary>
      {ready&&<HeadAtlasReferenceTeaching key={destination.position.conceptId} conceptId={destination.position.conceptId!} revision={HEAD_MANIFEST_SHA256}/>}
      {coverage}<p>Steps keep the current model open when its exact source and visible anatomy support focus. A different study or hidden target may require a fresh model view. CT/MRI are separate, unregistered subjects; no patient-space synchronization or lecture access is granted.</p>
    </details>
  </>;
}
