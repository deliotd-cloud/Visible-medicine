'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection,type LiveHeadSelection} from '../lib/head-live-selection';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {headReferenceLearningAvailable} from '../lib/head-learning-resource-availability.ts';
import {HeadAtlasComparisonNavigation} from './HeadAtlasComparisonNavigation';
import {HeadAtlasReferenceTeaching} from './HeadAtlasReferenceTeaching';
import {FACIAL_CONCEPTS,useVerifiedFacialTeaching} from './useVerifiedFacialTeaching';

/** Navigation snapshot only; authorization and patient-space matching stay elsewhere. */
export function HeadAtlasLinkedModel({src,sourceRevision,coverage,title='Interactive head and neck: explore, dissect and practise'}:{src:string;sourceRevision:string;coverage:ReactNode;title?:string}){
  const facialReady=useVerifiedFacialTeaching(HEAD_MANIFEST_SHA256);
  const frame=useRef<HTMLIFrameElement>(null),session=useRef(''),sequence=useRef(0);
  const timer=useRef<number|null>(null),generation=useRef(0);
  const [snapshot,setSnapshot]=useState<LiveHeadSelection|null>(null);
  const cancelWait=()=>{
    generation.current++;
    if(timer.current!==null)window.clearTimeout(timer.current);
    timer.current=null;
  };
  const disconnect=()=>{
    cancelWait();session.current='';sequence.current=0;
    setSnapshot({sequence:0,status:'blocked',reason:'unavailable',concept:null});
  };
  const connect=()=>{
    cancelWait();
    session.current=crypto.randomUUID();sequence.current=0;setSnapshot(null);
    const epoch=generation.current;
    timer.current=window.setTimeout(()=>{if(generation.current===epoch)disconnect();},15000);
    frame.current?.contentWindow?.postMessage({type:HEAD_SELECTION_PROTOCOL+'-request',version:1,session:session.current},window.location.origin);
  };
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
      if(event.data?.type===HEAD_SELECTION_PROTOCOL+'-ready'&&event.data.version===1&&event.data.revision===sourceRevision&&Object.keys(event.data).sort().join('|')==='revision|type|version'){connect();return;}
      if(!session.current)return;
      const next=parseHeadSelection(event.data,sourceRevision,session.current,sequence.current);
      if(!next)return;
      if(next.status==='blocked'&&next.reason==='unavailable'){disconnect();return;}
      cancelWait();sequence.current=next.sequence;setSnapshot(next);
    };
    window.addEventListener('message',receive);connect();
    return ()=>{window.removeEventListener('message',receive);cancelWait();session.current='';};
  },[src,sourceRevision]);
  const concept=headLinksCurrent()?snapshot?.concept??null:null;
  const state=!snapshot?'connecting':snapshot.status==='blocked'?snapshot.reason!:'ready';
  return <>
    <HeadAtlasComparisonNavigation conceptId={concept?.conceptId??null} liveState={state} onRetry={()=>{if(!session.current)connect();}} teaching={concept&&(headReferenceLearningAvailable(concept.conceptId,HEAD_MANIFEST_SHA256)||(facialReady&&FACIAL_CONCEPTS.has(concept.conceptId)))?<HeadAtlasReferenceTeaching key={concept.conceptId} conceptId={concept.conceptId} revision={HEAD_MANIFEST_SHA256} live/>:undefined}/>
    <iframe ref={frame} className="shoulder-module-frame" src={src} title={title} referrerPolicy="same-origin" allowFullScreen onLoad={connect} onError={disconnect}/>
    <details className="shoulder-module-notes">
      <summary>{concept?<>{concept.label} · coverage, guided learning &amp; sources</>:'Guided learning, coverage & sources'}</summary>
      {coverage}
      {concept&&!concept.ctHref&&<p>{concept.scopeNote}</p>}
      <p>Comparison links and linked teaching follow supported selections in the model. CT/MRI are separate, unregistered subjects—not spatial synchronization. Didanix Education delivery remains subject to mapping, release and independent access checks; paid lecture access remains separate.</p>
    </details>
  </>;
}
