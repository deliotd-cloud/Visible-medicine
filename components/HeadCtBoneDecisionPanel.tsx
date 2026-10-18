'use client';
import {useEffect,useRef,useState} from 'react';
import {ctBoneDecisionContext,type CtBoneDecisionContext} from '../lib/head-ct-bone-decision-contract';
import {HeadCtBoneDecisionForm} from './HeadCtBoneDecisionForm';

/** Lazy form: closed evidence does not fetch six private histories eagerly. */
export function HeadCtBoneDecisionPanel({manifestRevision,conceptId,label}:{manifestRevision:string;conceptId:string;label:string}){
  const [context,setContext]=useState<CtBoneDecisionContext|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const active=useRef(true),inFlight=useRef(false);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  async function open(){
    if(inFlight.current)return;inFlight.current=true;setBusy(true);
    try{const verified=await ctBoneDecisionContext(manifestRevision,conceptId);if(active.current)setContext(verified);}
    catch{if(active.current)setError('The comparison source changed. Reload before reviewing; no substitute was used.');}
    finally{inFlight.current=false;if(active.current)setBusy(false);}
  }
  return context?<HeadCtBoneDecisionForm key={JSON.stringify(context)} context={context}/>:<div>
    <button type="button" disabled={busy||!!error} onClick={()=>void open()}>{busy?'Checking comparison…':`Review ${label} comparison`}</button>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
