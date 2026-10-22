'use client';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection,type LiveHeadSelection} from '../lib/head-live-selection';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {headReferenceLearningAvailable} from '../lib/head-learning-resource-availability.ts';
import {HeadAtlasComparisonNavigation} from './HeadAtlasComparisonNavigation';
import {HeadAtlasReferenceTeaching} from './HeadAtlasReferenceTeaching';
import {FACIAL_CONCEPTS,useVerifiedFacialTeaching} from './useVerifiedFacialTeaching';
import {AtlasBodyLearning} from './AtlasBodyLearning';

/** Navigation snapshot only; authorization and patient-space matching stay elsewhere. */
export function HeadAtlasLinkedModel({src,sourceRevision,coverage,title='Interactive head and neck: explore, dissect and practise'}:{src:string;sourceRevision:string;coverage:ReactNode;title?:string}){
  const facialReady=useVerifiedFacialTeaching(HEAD_MANIFEST_SHA256);
  const frame=useRef<HTMLIFrameElement>(null),session=useRef(''),sequence=useRef(0);
  const timer=useRef<number|null>(null),generation=useRef(0);
  const [frameAttempt,setFrameAttempt]=useState(0);
  const committed=useRef<{token:object;src:string;sourceRevision:string;attempt:number;active:boolean}|null>(null);
  const channel=useRef<object|null>(null),recoveryPending=useRef(false);
  const actions=useRef<{connect:()=>void;disconnect:()=>void;receive:(event:MessageEvent)=>void}|null>(null);
  const token={};
  const [blankFailure,setBlankFailure]=useState<{src:string;sourceRevision:string;attempt:number}|null>(null);
  const [snapshot,setSnapshot]=useState<LiveHeadSelection|null>(null);
  const isCurrent=()=>committed.current?.token===token&&committed.current.active;
  const currentFrameIsBlank=()=>{
    const element=frame.current;
    if(!element?.isConnected||element.ownerDocument!==document||element.getAttribute('src')!==src)return false;
    try{
      const windowFrame=element.contentWindow,doc=element.contentDocument;
      return windowFrame?.location.href==='about:blank'&&doc?.readyState==='complete'&&
        !!doc.body&&doc.body.childElementCount===0&&!doc.body.textContent?.trim();
    }catch{return false;}
  };
  const cancelWait=()=>{
    generation.current++;
    if(timer.current!==null)window.clearTimeout(timer.current);
    timer.current=null;
  };
  const disconnect=()=>{
    if(!isCurrent()||recoveryPending.current)return;
    cancelWait();session.current='';sequence.current=0;
    setBlankFailure(currentFrameIsBlank()?{src,sourceRevision,attempt:frameAttempt}:null);
    setSnapshot({sequence:0,status:'blocked',reason:'unavailable',concept:null});
  };
  const connect=()=>{
    if(!isCurrent()||recoveryPending.current)return;
    cancelWait();
    setBlankFailure(null);
    session.current=crypto.randomUUID();sequence.current=0;setSnapshot(null);
    const epoch=generation.current;
    timer.current=window.setTimeout(()=>{if(generation.current===epoch)actions.current?.disconnect();},15000);
    frame.current?.contentWindow?.postMessage({type:HEAD_SELECTION_PROTOCOL+'-request',version:1,session:session.current},window.location.origin);
  };
  const receive=(event:MessageEvent)=>{
    if(!isCurrent()||recoveryPending.current)return;
    if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
    if(event.data?.type===HEAD_SELECTION_PROTOCOL+'-ready'&&event.data.version===1&&event.data.revision===sourceRevision&&Object.keys(event.data).sort().join('|')==='revision|type|version'){connect();return;}
    if(!session.current)return;
    const next=parseHeadSelection(event.data,sourceRevision,session.current,sequence.current);
    if(!next)return;
    if(next.status==='blocked'&&next.reason==='unavailable'){disconnect();return;}
    cancelWait();sequence.current=next.sequence;setSnapshot(next);
  };
  useLayoutEffect(()=>{
    const prior=committed.current;
    if(prior&&(prior.src!==src||prior.sourceRevision!==sourceRevision||prior.attempt!==frameAttempt)){
      channel.current=null;cancelWait();session.current='';sequence.current=0;
    }
    committed.current={token,src,sourceRevision,attempt:frameAttempt,active:true};
    actions.current={connect,disconnect,receive};
    return()=>{if(committed.current?.token===token)committed.current.active=false;};
  });
  useEffect(()=>{
    recoveryPending.current=false;
    const currentChannel={};channel.current=currentChannel;
    const onMessage=(event:MessageEvent)=>{if(channel.current===currentChannel)actions.current?.receive(event);};
    window.addEventListener('message',onMessage);actions.current?.connect();
    return()=>{window.removeEventListener('message',onMessage);
      if(channel.current===currentChannel)channel.current=null;
      cancelWait();session.current='';};
  },[src,sourceRevision,frameAttempt]);
  const blankRecoveryReady=snapshot?.status==='blocked'&&snapshot.reason==='unavailable'&&blankFailure?.src===src&&
    blankFailure.sourceRevision===sourceRevision&&blankFailure.attempt===frameAttempt;
  const retryOpeningModel=()=>{
    if(!isCurrent()||!blankRecoveryReady||recoveryPending.current||!currentFrameIsBlank())return;
    recoveryPending.current=true;
    cancelWait();session.current='';sequence.current=0;
    setBlankFailure(null);setSnapshot(null);
    setFrameAttempt(previous=>previous+1);
  };
  const concept=headLinksCurrent()?snapshot?.concept??null:null;
  const state=!snapshot?'connecting':snapshot.status==='blocked'?snapshot.reason!:'ready';
  return <>
    <HeadAtlasComparisonNavigation conceptId={concept?.conceptId??null} liveState={state} onRetry={()=>{if(isCurrent()&&!session.current)connect();}} onRetryOpeningModel={blankRecoveryReady?retryOpeningModel:undefined} teaching={concept&&(headReferenceLearningAvailable(concept.conceptId,HEAD_MANIFEST_SHA256)||(facialReady&&FACIAL_CONCEPTS.has(concept.conceptId)))?<HeadAtlasReferenceTeaching key={concept.conceptId} conceptId={concept.conceptId} revision={HEAD_MANIFEST_SHA256} live/>:undefined}/>
    <iframe key={frameAttempt} ref={frame} className="shoulder-module-frame" src={src} title={title} referrerPolicy="same-origin" allowFullScreen onLoad={connect} onError={disconnect}/>
    <AtlasBodyLearning key={frameAttempt} frame={frame} src={src} dock="flow"/>
    <details className="shoulder-module-notes">
      <summary>{concept?<>{concept.label} · coverage, guided learning &amp; sources</>:'Guided learning, coverage & sources'}</summary>
      {coverage}
      {concept&&!concept.ctHref&&<p>{concept.scopeNote}</p>}
      <p>Comparison links and linked teaching follow supported selections in the model. CT/MRI are separate, unregistered subjects—not spatial synchronization. Didanix Education delivery remains subject to mapping, release and independent access checks; paid lecture access remains separate.</p>
    </details>
  </>;
}
