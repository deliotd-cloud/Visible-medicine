'use client';
import {useEffect,useRef,useState} from 'react';
import {facialDecisionContext,type FacialDecisionContext,type FacialDecisionKind} from '../lib/head-ct-facial-decision-contract';
import {HeadCtFacialDecisionForm} from './HeadCtFacialDecisionForm';

/** Closed evidence does not fetch private history. A changed identity retires pending verification. */
export function HeadCtFacialDecisionPanel({manifestRevision,conceptId,label,kind}:{manifestRevision:string;conceptId:string;label:string;kind:FacialDecisionKind}){
  const [context,setContext]=useState<FacialDecisionContext|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const active=useRef(true),inFlight=useRef(false),generation=useRef(0);
  const identity=JSON.stringify([manifestRevision,conceptId,kind]);
  useEffect(()=>{active.current=true;generation.current++;setContext(null);setBusy(false);setError('');inFlight.current=false;return()=>{active.current=false;generation.current++;};},[identity]);
  async function open(){
    if(inFlight.current)return;const ticket=generation.current;inFlight.current=true;setBusy(true);
    try{const verified=await facialDecisionContext(manifestRevision,conceptId,kind);if(active.current&&ticket===generation.current)setContext(verified);}
    catch{if(active.current&&ticket===generation.current)setError('The facial source changed. Reload before reviewing; no substitute was used.');}
    finally{if(active.current&&ticket===generation.current){inFlight.current=false;setBusy(false);}}
  }
  const matched=context&&context.headRevision===manifestRevision&&context.conceptId===conceptId&&context.kind===kind;
  return matched?<HeadCtFacialDecisionForm key={JSON.stringify(context)} context={context}/>:<div>
    <button type="button" disabled={busy||!!error} onClick={()=>void open()}>{busy?`Checking ${kind}…`:`Review ${label} ${kind==='teaching'?'teaching':'clinical orientation'}`}</button>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
