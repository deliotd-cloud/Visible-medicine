'use client';
import {useEffect,useLayoutEffect,useMemo,useRef,useState,type RefObject} from 'react';
import {atlasBodyLearningContext,matchesAtlasBodyLearningReady,parseAtlasBodyLearningSelection,
  ATLAS_BODY_LEARNING_PROTOCOL,type AtlasBodyLearningSelection} from '../lib/atlas-body-learning-selection';
import {bodyRelatedLectureHref} from '../lib/lecture-body-related-links';
import './atlas-body-learning.css';

/** Read-only root identity; it cannot move anatomy, open a scan, or grant access. */
export function AtlasBodyLearning({frame,src,dock='frame'}:{frame:RefObject<HTMLIFrameElement|null>;src:string;dock?:'frame'|'flow'}){
  const context=useMemo(()=>atlasBodyLearningContext(src),[src]);
  const identity=context?JSON.stringify([src,context.revision,context.region]):'';
  const committed=useRef<object|null>(null),token={};
  const [snapshot,setSnapshot]=useState<{identity:string;value:AtlasBodyLearningSelection|null}>({identity:'',value:null});
  useLayoutEffect(()=>{committed.current=token;return()=>{if(committed.current===token)committed.current=null;};});
  const snapshotRef=useRef(snapshot);useLayoutEffect(()=>{snapshotRef.current=snapshot;},[snapshot]);
  const liveSelection=useRef<AtlasBodyLearningSelection|null>(null);
  const liveFrame=useRef<(()=>boolean)|null>(null);
  useEffect(()=>{
    if(!context||!identity)return;
    const element=frame.current;if(!element)return;
    let active=true,pageActive=!document.hidden,session='',sequence=0,generation=0,timer:number|undefined,sessionDocument:Document|null=null;
    const structural=()=>active&&pageActive&&!document.hidden&&frame.current===element&&element.isConnected&&
      element.ownerDocument===document&&element.getAttribute('src')===src;
    const current=()=>{
      if(!structural())return false;
      try{return element.contentWindow?.location.href===new URL(src,window.location.href).href;}
      catch{return false;}
    };
    const currentSession=()=>{
      if(!session||!current()||!sessionDocument)return false;
      try{return element.contentDocument===sessionDocument;}catch{return false;}
    };
    liveFrame.current=currentSession;
    const clearTimer=()=>{generation++;if(timer!==undefined)window.clearTimeout(timer);timer=undefined;};
    const clear=()=>{clearTimer();session='';sessionDocument=null;sequence=0;liveSelection.current=null;setSnapshot({identity,value:null});};
    const request=()=>{
      clear();if(!current())return;
      sessionDocument=element.contentDocument;if(!sessionDocument)return;
      session=crypto.randomUUID();const epoch=generation;
      timer=window.setTimeout(()=>{if(active&&generation===epoch){session='';sequence=0;timer=undefined;liveSelection.current=null;setSnapshot({identity,value:{status:'blocked',reason:'unavailable',sequence:0}});}},15000);
      element.contentWindow?.postMessage({type:ATLAS_BODY_LEARNING_PROTOCOL+'-request',version:1,
        revision:context.revision,region:context.region,session},window.location.origin);
    };
    const receive=(event:MessageEvent)=>{
      if(!current()||event.origin!==window.location.origin||event.source!==element.contentWindow)return;
      if(matchesAtlasBodyLearningReady(event.data,context)){request();return;}
      if(!currentSession())return;
      const value=parseAtlasBodyLearningSelection(event.data,context,session,sequence);if(!value)return;
      clearTimer();sequence=value.sequence;liveSelection.current=value;setSnapshot({identity,value});
      if(value.status==='blocked'&&value.reason==='unavailable')session='';
    };
    const load=()=>request();
    const failed=()=>{if(structural()){clear();setSnapshot({identity,value:{status:'blocked',reason:'unavailable',sequence:0}});}};
    const hide=()=>{pageActive=false;clear();};
    const show=()=>{if(!document.hidden){pageActive=true;request();}};
    const visibility=()=>document.hidden?hide():show();
    window.addEventListener('message',receive);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
    document.addEventListener('visibilitychange',visibility);element.addEventListener('load',load);element.addEventListener('error',failed);
    request();
    return()=>{active=false;clearTimer();session='';sessionDocument=null;sequence=0;liveSelection.current=null;liveFrame.current=null;window.removeEventListener('message',receive);
      window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);document.removeEventListener('visibilitychange',visibility);
      element.removeEventListener('load',load);element.removeEventListener('error',failed);};
  },[identity,src,frame]);
  const value=snapshot.identity===identity?snapshot.value:null;
  const href=value?.status==='selected'?bodyRelatedLectureHref(value.reference):null;
  if(!context)return null;
  const message=value?.status==='blocked'
    ?value.reason==='practice'?'Lecture links are hidden during practice.':value.reason==='guided'?'Leave guided playback to follow a manual root selection.':'This model selection could not be confirmed. No previous or replacement lecture link is shown.'
    :value?.status==='empty'?'Select a main-body structure to find linked lectures.':'Waiting for this model’s source-bound selection…';
  return <details className={`atlas-body-learning${dock==='flow'?' atlas-body-learning-flow':''}`} data-learning-state={value?.status??'waiting'}>
    <summary>{value?.status==='selected'?`Lectures · ${value.label}`:'Linked teaching'}</summary>
    {value?.status==='selected'&&href?<div className="atlas-body-learning-action"><strong>{value.label}</strong><a href={href} target="_blank" rel="noopener noreferrer" onClick={event=>{
      const latest=liveSelection.current;
      if(committed.current!==token||!liveFrame.current?.()||document.hidden||snapshotRef.current.identity!==identity||latest?.status!=='selected'||
        bodyRelatedLectureHref(latest.reference)!==href||frame.current?.getAttribute('src')!==src)event.preventDefault();
    }}>Related teaching ↗</a></div>:<p role="status">{message}</p>}
    <details className="atlas-body-learning-source"><summary>Source &amp; access</summary>
      <p>Opens separately to preserve your view. Only accessible published lectures appear; Atlas access does not unlock paid lectures.</p>
      <p>Exact main-body references only. Separate specimens and nested parts are not inherited. No CT/MRI match or patient-space registration is inferred.</p>
    </details>
  </details>;
}

