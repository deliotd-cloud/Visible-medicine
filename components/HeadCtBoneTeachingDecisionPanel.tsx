'use client';
import {useEffect,useRef,useState} from 'react';
import {ctBoneTeachingDecisionContext,type CtBoneTeachingDecisionContext} from '../lib/head-ct-bone-teaching-decision-contract';
import {HeadCtBoneTeachingDecisionForm} from './HeadCtBoneTeachingDecisionForm';

/** Lazy form: closed evidence does not fetch six private histories eagerly. */
export function HeadCtBoneTeachingDecisionPanel({manifestRevision,conceptId,label}:{manifestRevision:string;conceptId:string;label:string}){
  const [context,setContext]=useState<CtBoneTeachingDecisionContext|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const active=useRef(true),inFlight=useRef(false);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  async function open(){
    if(inFlight.current)return;inFlight.current=true;setBusy(true);
    try{const verified=await ctBoneTeachingDecisionContext(manifestRevision,conceptId);if(active.current)setContext(verified);}
    catch{if(active.current)setError('The teaching source changed. Reload before reviewing; no substitute was used.');}
    finally{inFlight.current=false;if(active.current)setBusy(false);}
  }
  return context?<HeadCtBoneTeachingDecisionForm key={JSON.stringify(context)} context={context}/>:<div>
    <button type="button" disabled={busy||!!error} onClick={()=>void open()}>{busy?'Checking teaching…':`Review ${label} teaching`}</button>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
