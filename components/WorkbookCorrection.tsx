"use client";

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  WORKBOOK_CORRECTION_ACTION, WORKBOOK_CORRECTION_LOOKUP_ACTION,
  parseWorkbookCorrectionSource, parseWorkbookCorrectionRequest,
  parseWorkbookCorrectionReceipt, parseWorkbookCorrectionLookupRequest, parseWorkbookCorrectionLookup, workbookCorrectionId,
  type WorkbookCorrectionMode, type WorkbookCorrectionSource, type WorkbookCorrectionReceipt,
} from '../lib/workbook-correction-contract.ts';
import './workbook-correction.css';

type Props = {id:string; title:string; version:number; mode:string; disabled?:boolean};
type State = {identity:string; source:WorkbookCorrectionSource|null; reason:string; confirmed:boolean;
  requestId:string; busy:boolean; uncertain:boolean; checkedCreation:boolean; error:string; receipt:WorkbookCorrectionReceipt|null};
const initial = (identity:string):State => ({identity,source:null,reason:'',confirmed:false,requestId:'',busy:false,uncertain:false,checkedCreation:false,error:'',receipt:null});
const uncertainMessage = 'Creation was not confirmed. Check Studio drafts before trying again; the original publication is unchanged.';
function responseError(body:unknown, fallback:string) {
  return body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' && body.error.length<=500 ? body.error : fallback;
}

/** An explicit draft copy, never an edit, replacement, approval or access grant. */
export function WorkbookCorrection({id,title,version,mode,disabled=false}:Props) {
  const identity=JSON.stringify([id,title,version,mode,disabled]);
  const context=useRef(identity),epoch=useRef(0),request=useRef(0),live=useRef(true),flight=useRef(false);
  const controller=useRef<AbortController|null>(null);
  if(context.current!==identity){context.current=identity;epoch.current++;request.current++;flight.current=false;controller.current?.abort();}
  const generation=epoch.current,stateKey=`${identity}:${generation}`;
  const [stored,setStored]=useState<State>(()=>initial(stateKey));
  const form=stored.identity===stateKey?stored:initial(stateKey);
  const checkedMode:WorkbookCorrectionMode|null=mode==='teaching'||mode==='assessment'||mode==='lecture'?mode:null;
  const valid=workbookCorrectionId(id)&&typeof title==='string'&&!!title.trim()&&Number.isSafeInteger(version)&&version>0&&!!checkedMode;
  const unavailable=disabled||!valid||form.busy||form.uncertain||!!form.receipt;
  useEffect(()=>{live.current=true;return()=>{live.current=false;request.current++;flight.current=false;controller.current?.abort();};},[]);
  function active(){return live.current&&context.current===identity&&epoch.current===generation;}
  function current(ticket:number){return active()&&request.current===ticket;}
  function change(update:Partial<State>){if(active()&&!flight.current&&!unavailable)setStored({...form,...update,error:''});}
  function start(){flight.current=true;controller.current?.abort();controller.current=new AbortController();return ++request.current;}
  async function loadSource(){
    if(!active()||flight.current||unavailable||form.source||!checkedMode)return;
    const ticket=start();setStored({...form,busy:true,error:''});
    try{
      const response=await fetch(`/api/studio/workbooks/${encodeURIComponent(id)}/corrections`,{
        method:'GET',cache:'no-store',credentials:'same-origin',signal:controller.current!.signal,
      });
      let body:unknown;try{body=await response.json();}catch{body=null;}
      if(!current(ticket))return;
      const source=response.ok?parseWorkbookCorrectionSource(body,{id,version,mode:checkedMode}):null;
      setStored({...form,busy:false,source,confirmed:false,error:source?'':responseError(body,'The published source could not be verified. Refresh this workbook before continuing.')});
    }catch{if(current(ticket))setStored({...form,busy:false,error:'The published source could not be checked. Retry when the connection is available.'});}
    finally{if(current(ticket))flight.current=false;}
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!active()||flight.current||unavailable||!form.source)return;
    if(!form.reason.trim()||form.reason.length>1000||!form.confirmed){setStored({...form,error:'Enter a reason of 1–1000 characters and confirm the draft copy.'});return;}
    const requestId=form.requestId||crypto.randomUUID();
    const input=parseWorkbookCorrectionRequest({action:WORKBOOK_CORRECTION_ACTION,id,expectedVersion:version,
      expectedStatus:'published',expectedMode:mode,expectedSourceHash:form.source.sourceHash,
      reason:form.reason,confirmed:form.confirmed,requestId},id);
    if(!input){setStored({...form,error:'The correction request is invalid. Check the reason and refresh the workbook.'});return;}
    const ticket=start(),pending={...form,requestId};setStored({...pending,busy:true,error:''});
    try{
      const response=await fetch(`/api/studio/workbooks/${encodeURIComponent(id)}/corrections`,{
        method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:controller.current!.signal,
      });
      let body:unknown;try{body=await response.json();}catch{body=null;}
      if(!current(ticket))return;
      const receipt=response.ok?parseWorkbookCorrectionReceipt(body,input):null;
      if(receipt){setStored({...pending,busy:false,receipt});return;}
      // An ambiguous commit is not retried. Retain the reason and request UUID.
      const uncertain=response.ok||response.status>=500;
      setStored({...pending,busy:false,uncertain,source:uncertain?form.source:null,confirmed:false,
        error:uncertain?uncertainMessage:responseError(body,'The correction was refused. Refresh and check the published source before continuing.')});
    }catch{if(current(ticket))setStored({...pending,busy:false,uncertain:true,confirmed:false,error:uncertainMessage});}
    finally{if(current(ticket))flight.current=false;}
  }
  async function checkCreation(){
    if(!active()||flight.current||disabled||!valid||!checkedMode||!form.uncertain||!form.source||!form.requestId)return;
    const input=parseWorkbookCorrectionLookupRequest({action:WORKBOOK_CORRECTION_LOOKUP_ACTION,id,
      expectedVersion:version,expectedMode:checkedMode,expectedSourceHash:form.source.sourceHash,
      requestId:form.requestId},id);
    if(!input)return;
    const ticket=start();setStored({...form,busy:true,error:''});
    try{
      const response=await fetch(`/api/studio/workbooks/${encodeURIComponent(id)}/corrections/lookup`,{
        method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(input),signal:controller.current!.signal,
      });
      let body:unknown;try{body=await response.json();}catch{body=null;}
      if(!current(ticket))return;
      const result=response.ok?parseWorkbookCorrectionLookup(body,input):null;
      if(result?.outcome==='confirmed'){
        setStored({...form,busy:false,uncertain:false,checkedCreation:true,receipt:result.receipt,error:''});return;
      }
      setStored({...form,busy:false,error:result?.outcome==='unconfirmed'
        ?'Creation is still unconfirmed. Check Studio drafts before any new attempt.'
        :'Creation status could not be verified. Check Studio drafts and try the status check again.'});
    }catch{if(current(ticket))setStored({...form,busy:false,error:'Creation status could not be checked. Check Studio drafts and try the status check again.'});}
    finally{if(current(ticket))flight.current=false;}
  }
  return <details className="workbook-correction" onToggle={event=>{if(event.currentTarget.open)void loadSource();}}>
    <summary>Create correction draft</summary>
    <p>Start a separate editable draft of this published version. The original stays available; nothing is replaced or approved.</p>
    {form.busy&&!form.source&&<p role="status">Checking the exact published source…</p>}
    {!form.source&&!form.busy&&<button type="button" disabled={unavailable} onClick={()=>void loadSource()}>Check published source</button>}
    {form.source&&<form onSubmit={submit} noValidate>
      <fieldset disabled={unavailable}>
        <legend>Correct {title} · version {version}</legend>
        <label htmlFor={`correction-reason-${id}`}>What needs correcting?</label>
        <textarea id={`correction-reason-${id}`} rows={3} maxLength={1000} required value={form.reason}
          aria-describedby={`correction-help-${id}`} onChange={event=>change({reason:event.currentTarget.value,confirmed:false})}/>
        <small id={`correction-help-${id}`}>Required, up to 1000 characters. Do not include patient or personal identifiers.</small>
        <label className="workbook-correction-confirm"><input type="checkbox" checked={form.confirmed}
          onChange={event=>change({confirmed:event.currentTarget.checked})}/>
          I understand this creates a new draft that requires fresh independent review and publication.</label>
        <button type="submit">{form.busy&&!form.uncertain?'Creating draft…':'Create correction draft'}</button>
      </fieldset>
    </form>}
    {form.error&&<p role="alert" className="workbook-correction-error">{form.error}</p>}
    {form.uncertain&&<>
      <button type="button" disabled={disabled||!valid||form.busy} onClick={()=>void checkCreation()}>
        {form.busy?'Checking creation status…':'Check creation status'}
      </button>
      <a href="/studio/workspace">Check Studio drafts</a>
    </>}
    {form.receipt&&<div role="status" className="workbook-correction-success">
      <p>{form.checkedCreation?'The earlier creation was confirmed. This receipt does not verify the workbook’s current draft status.':'Correction draft created.'} The original publication, learner access and existing attempts are unchanged.</p>
      <a href={`/studio/workbooks/${encodeURIComponent(form.receipt.draftWorkbookId)}/builder`}>{form.checkedCreation?'Open correction workbook →':'Open correction draft →'}</a>
    </div>}
  </details>;
}
