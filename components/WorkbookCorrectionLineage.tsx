"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { WORKBOOK_CORRECTION_LINEAGE_ACTION, parseWorkbookCorrectionLineageRequest,
  parseWorkbookCorrectionLineage, type WorkbookCorrectionLineage } from '../lib/workbook-correction-lineage-contract.ts';
import './workbook-correction-lineage.css';

type Snapshot = {revision:number; pending:boolean};
export type WorkbookCorrectionLineageContext = {
  key:string; getSnapshot:()=>Snapshot; subscribe:(listener:()=>void)=>()=>void;
  invalidate:()=>void; begin:()=>symbol; finish:(operation:symbol)=>void;
};
/** One editor instance; only events and committed effects may change this store. */
export function createWorkbookCorrectionLineageContext():WorkbookCorrectionLineageContext {
  let snapshot:Snapshot={revision:0,pending:false};
  const listeners=new Set<()=>void>(),operations=new Set<symbol>();
  function invalidate(){snapshot={revision:snapshot.revision+1,pending:operations.size>0};for(const listener of listeners)listener();}
  return {key:crypto.randomUUID(),getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return()=>{listeners.delete(listener);};},invalidate,
    begin(){const operation=Symbol();operations.add(operation);invalidate();return operation;},
    finish(operation){if(operations.delete(operation))invalidate();},
  };
}
type Props = {id:string; version:number; mode:string; status:string; authorityKey:string;
  context?:WorkbookCorrectionLineageContext; contextKey?:string; disabled?:boolean};
type State = {busy:boolean; result:WorkbookCorrectionLineage|null; error:boolean};
const initial=():State=>({busy:false,result:null,error:false});

/** Explicit, read-only provenance check. Context changes revoke old handlers/replies. */
export function WorkbookCorrectionLineage(props:Props) {
  const [ownContext]=useState(createWorkbookCorrectionLineageContext);
  const context=props.context??ownContext;
  const snapshot=useSyncExternalStore(context.subscribe,context.getSnapshot,context.getSnapshot);
  const identity=JSON.stringify([context.key,snapshot.revision,props.id,props.version,props.mode,props.status,
    props.authorityKey,props.contextKey??'',props.disabled??false]);
  return <LineageCheck key={identity} {...props} context={context} snapshot={snapshot} />;
}
function LineageCheck({id,version,mode,status,authorityKey,disabled=false,context,snapshot}:Props&{
  context:WorkbookCorrectionLineageContext;snapshot:Snapshot}) {
  const live=useRef(false),flight=useRef(false);
  const controller=useRef<AbortController|null>(null),ticket=useRef(0);
  const [state,setState]=useState<State>(initial);
  const displayed=useRef<State>(state);
  const request=parseWorkbookCorrectionLineageRequest({action:WORKBOOK_CORRECTION_LINEAGE_ACTION,
    id,expectedVersion:version,expectedMode:mode,expectedStatus:status},id);
  useLayoutEffect(()=>{live.current=true;return()=>{live.current=false;ticket.current++;flight.current=false;controller.current?.abort();};},[]);
  useLayoutEffect(()=>{displayed.current=state;},[state]);
  function active(){return live.current&&!disabled&&!snapshot.pending&&context.getSnapshot()===snapshot;}
  async function check() {
    if(!active()||flight.current||!request||!authorityKey) return;
    flight.current=true;const current=++ticket.current;
    controller.current=new AbortController();
    setState({...initial(),busy:true});
    try {
      const response=await fetch(`/api/studio/workbooks/${encodeURIComponent(id)}/correction-lineage`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),
        credentials:'same-origin',cache:'no-store',signal:controller.current.signal});
      const body:unknown=await response.json();
      if(!active()||ticket.current!==current) return;
      const result=response.ok?parseWorkbookCorrectionLineage(body,request):null;
      setState({...initial(),result,error:!result});
    } catch {
      if(active()&&ticket.current===current) setState({...initial(),error:true});
    } finally { if(active()&&ticket.current===current) flight.current=false; }
  }
  if(!request||!authorityKey) return null;
  const unavailable=disabled||snapshot.pending;
  const source=!unavailable&&state.result?.outcome==='verified'?state.result.source:null;
  return <details className="workbook-correction-lineage" onToggle={event=>{
    if(event.currentTarget.open && !displayed.current.result && !displayed.current.error) void check();
  }}>
    <summary>Correction source and next steps</summary>
    {state.busy && <p role="status">Checking the published source and your Studio access…</p>}
    {source && <div role="status">
      <p>This draft was created from <a href={`/studio/workbooks/${encodeURIComponent(source.workbookId)}`} onClick={event=>{if(!active())event.preventDefault();}}>published source version {source.version}</a>.</p>
      <p className="workbook-correction-lineage-hash">Verified publication hash: <code>{source.hash}</code></p>
      <ol>
        <li>Finish the correction and submit it through the ordinary independent review workflow.</li>
        <li>Complete publication checks for this workbook. Source approval does not transfer.</li>
        <li>Create and review an updated course release when the correction is ready for learners.</li>
      </ol>
      <p>Creating this draft does not replace or retire the source. Existing learner links, allocations and attempts remain unchanged. Any notices or retirement require a separate decision.</p>
    </div>}
    {(state.error||state.result?.outcome==='unavailable') && <p role={state.error?'alert':'status'}>A correction source could not be verified for this draft with your current access.</p>}
    <button type="button" disabled={state.busy||unavailable} onClick={()=>void check()}>{state.busy?'Checking…':state.result||state.error?'Recheck correction source':'Check correction source'}</button>
  </details>;
}
