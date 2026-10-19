'use client';

import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {isRegionalMriInlineInspection,regionalMriInlineReferenceFamilyKey,regionalMriInlineManifestCurrent,type RegionalMriInlineInspection as Inspection} from '../lib/regional-mri-inline-inspection';
import {createRegionalMriSpecimenFocus,type SpecimenFocusState} from '../lib/regional-mri-specimen-focus';
import {createRegionalMriBodyFocus} from '../lib/regional-mri-body-focus';
import {isCurrentRegionalMriReferenceSelection,regionalMriReferenceMatchesRequested,type RegionalMriReferenceSelection} from '../lib/regional-mri-reference-selection';

const checks=[
 'Confirm the MRI source sequence, side and annotation scope.',
 'Inspect the saved MRI geometry and its partial or derived coverage.',
 'Check the named 3D reference, source side and whole-parent/group limitations.',
 'Record clinical corrections separately; this checklist grants no approval.',
] as const;
type Status='checking'|'loading'|'loaded'|'failed';
/** Existing model only. Loading is never an acknowledged anatomical match. */
export function RegionalMriInlineInspection({inspection,onClose,suspended=false,getMriSelectionLabel,onSelectMri}:{inspection:Inspection;onClose:()=>void;suspended?:boolean;
 getMriSelectionLabel?:(selection:RegionalMriReferenceSelection)=>string|null;onSelectMri?:(selection:RegionalMriReferenceSelection)=>void}){
 const [display,setDisplay]=useState<{key:string;attempt:number;status:Status}>({key:'',attempt:0,status:'checking'});
 const [attempt,setAttempt]=useState(0),[checklist,setChecklist]=useState<{key:string;attempt:number;values:boolean[]}>({key:'',attempt:0,values:checks.map(()=>false)});
 const [focus,setFocus]=useState<SpecimenFocusState>('waiting');
 const [reported,setReported]=useState<{key:string;attempt:number;selection:RegionalMriReferenceSelection|null}>({key:'',attempt:0,selection:null});
 const iframe=useRef<HTMLIFrameElement>(null),area=useRef<HTMLElement>(null),live=useRef(false),renderCount=useRef(0),committed=useRef<{token:number;key:string;attempt:number;suspended:boolean}|null>(null);
 const channel=useRef<ReturnType<typeof createRegionalMriSpecimenFocus>|ReturnType<typeof createRegionalMriBodyFocus>|null>(null),ready=useRef(false);
 const channelKind=useRef<Inspection['target']['kind']|null>(null);
 const readyFrame=useRef<{key:string;attempt:number}|null>(null);
 const verifiedManifest=useRef<{key:string;attempt:number;value:unknown}|null>(null);
 const pageActive=useRef(true),returnPending=useRef(false);
 const token=++renderCount.current,key=isRegionalMriInlineInspection(inspection)?inspection.key:'';
 const family=key?regionalMriInlineReferenceFamilyKey(inspection):null,frameKey=family??key;
 const frameSource=useRef<{family:string;src:string}|null>(null);
 const stableSrc=frameSource.current?.family===frameKey?frameSource.current.src:inspection.src;
 const status=display.key===frameKey&&display.attempt===attempt?display.status:'checking';
 const selection=reported.key===key&&reported.attempt===attempt?reported.selection:null;
 const currentModelSelection=family&&!suspended&&status==='loaded'&&selection&&isCurrentRegionalMriReferenceSelection(selection)?selection:null;
 const browsing=!!currentModelSelection&&!regionalMriReferenceMatchesRequested(currentModelSelection,inspection);
 const currentStatus=useRef<Status>(status),currentInspection=useRef(inspection);
 const checked=!suspended&&checklist.key===key&&checklist.attempt===attempt?checklist.values:checks.map(()=>false);
 const setStatus=(next:Status)=>setDisplay({key:frameKey,attempt,status:next});
 const actionable=()=>live.current&&!suspended&&pageActive.current&&(typeof document==='undefined'||!document.hidden)&&key!==''&&committed.current?.token===token&&committed.current.key===key&&committed.current.attempt===attempt;
 useLayoutEffect(()=>{committed.current={token,key,attempt,suspended};frameSource.current={family:frameKey,src:stableSrc};currentStatus.current=status;currentInspection.current=inspection;});
 useLayoutEffect(()=>{
  setChecklist({key:'',attempt,values:checks.map(()=>false)});
  channel.current?.retire();
  if(!family){ready.current=false;return;}
  if(verifiedManifest.current?.key===frameKey&&verifiedManifest.current.attempt===attempt&&
   !regionalMriInlineManifestCurrent(inspection,verifiedManifest.current.value)){setStatus('failed');return;}
  if(readyFrame.current?.key!==frameKey||readyFrame.current.attempt!==attempt){ready.current=false;readyFrame.current={key:frameKey,attempt};}
  if(suspended){setFocus('waiting');return;}
  if(channelKind.current!==inspection.target.kind){channel.current?.close();channel.current=null;channelKind.current=inspection.target.kind;}
  if(!channel.current)channel.current=(inspection.target.kind==='body'?createRegionalMriBodyFocus:createRegionalMriSpecimenFocus)(message=>{
   if(typeof window!=='undefined'&&iframe.current?.contentWindow)iframe.current.contentWindow.postMessage(message,window.location.origin);
  },setFocus,undefined,selection=>setReported({key:committed.current?.key??'',attempt:committed.current?.attempt??-1,selection}));
  channel.current.begin(inspection,ready.current);
  return()=>{channel.current?.retire();};
 },[key,attempt,suspended]);
 useEffect(()=>{if(key)area.current?.focus({preventScroll:true});},[key]);
 useEffect(()=>{
  live.current=true;const controller=new AbortController();setStatus('checking');setChecklist({key,attempt,values:checks.map(()=>false)});
  if(key)void(async()=>{
   try{
    const response=await fetch(inspection.manifestUrl,{signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error'});
    if(!response.ok||response.redirected)throw Error('Reference changed');
    const manifest=await response.json();
    if(!regionalMriInlineManifestCurrent(inspection,manifest))throw Error('Reference changed');
    if(live.current&&!controller.signal.aborted&&committed.current?.attempt===attempt){
     if(!regionalMriInlineManifestCurrent(currentInspection.current,manifest))throw Error('Reference changed');
     verifiedManifest.current={key:frameKey,attempt,value:manifest};setStatus('loading');
    }
   }catch{if(live.current&&!controller.signal.aborted&&committed.current?.attempt===attempt)setStatus('failed');}
  })();
  return()=>{live.current=false;controller.abort();};
 },[frameKey,attempt]);
 useEffect(()=>{
  if(!family||typeof window==='undefined')return;
  const receive=(event:MessageEvent)=>{
   if(suspended||committed.current?.key!==key||committed.current.attempt!==attempt||committed.current.suspended!==suspended||
    !pageActive.current||document.hidden||event.origin!==window.location.origin||event.source!==iframe.current?.contentWindow)return;
   const outcome=channel.current?.receive(event.data);
   if(outcome===true||outcome==='available')ready.current=true;
   if(outcome==='unavailable')ready.current=false;
  };
  const hide=()=>{pageActive.current=false;ready.current=false;returnPending.current=true;channel.current?.retire();setFocus('waiting');};
  const show=()=>{
   if(document.hidden)return;
   pageActive.current=true;
   if(returnPending.current&&currentStatus.current==='loaded'&&iframe.current?.contentWindow&&
    committed.current?.key===key&&committed.current.attempt===attempt&&!committed.current.suspended){
    returnPending.current=false;channel.current?.begin(currentInspection.current,true);
   }
  };
  const visibility=()=>{if(document.hidden)hide();else show();};
  window.addEventListener('message',receive);window.addEventListener('pagehide',hide);
  window.addEventListener('pageshow',show);
  document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('message',receive);window.removeEventListener('pagehide',hide);
   window.removeEventListener('pageshow',show);
   document.removeEventListener('visibilitychange',visibility);};
 },[frameKey,key,attempt,suspended]);
 useEffect(()=>{if(!family||status!=='loaded'||suspended||!['waiting','requesting','focusing'].includes(focus))return;
  const timer=setTimeout(()=>channel.current?.fail(),7000);return()=>clearTimeout(timer);},[family,status,suspended,focus,key,attempt]);
 useEffect(()=>()=>{channel.current?.close();channel.current=null;ready.current=false;},[]);
 if(!key)return <section className="regional-mri-review__comparison" aria-label="3D reference inspection"><p role="alert">The verified source context is unavailable. No model is substituted.</p></section>;
 const {mri,target}=inspection;
 const reverseLabel=family&&!suspended&&status==='loaded'&&onSelectMri&&selection&&isCurrentRegionalMriReferenceSelection(selection)
  ?getMriSelectionLabel?.(selection):null;
 return <section id="regional-mri-inline-reference" ref={area} tabIndex={-1} className="regional-mri-review__comparison" aria-label="3D reference inspection">
  <header><div><p className="regional-mri-review__eyebrow">Requested 3D reference · not a confirmed match</p><h3>{target.label}</h3></div>
   <button type="button" onClick={()=>{if(live.current&&committed.current?.token===token)onClose();}}>Close 3D reference</button></header>
  <p>{target.kind==='specimen'?'Independent right-sided specimen (source-reported)':'Same-side body reference'} · {target.oppositeSide?'opposite side to MRI; not mirrored':target.side+' side'}.
   {target.relation==='parent-reference'?' Whole parent only; the MRI subregion has no separate 3D selection.':target.relation==='group-reference'?' Grouped surface only; the MRI component has no separate 3D selection.':''}</p>
  {inspection.provisional&&<p className="regional-mri-review__badge">Provisional MRI source · inspection only</p>}
  <p role="status">{suspended?'Prior reference retained. MRI step not verified; this is not a current match.':status==='checking'?'Checking the current public reference source…':status==='loading'?'Loading the existing 3D reference…':status==='loaded'?
   browsing?reverseLabel?'Viewing another model selection. MRI is unchanged. Use the button below to show its saved annotation.':
    'Viewing another model selection. No supported MRI link is available in this sequence; MRI is unchanged.':
   family&&(focus==='confirmed'||currentModelSelection)?'Model reports this named selection. This is not an MRI match or registration.':
   family&&focus==='blocked'?'Model selection unavailable in practice, guided learning or the current model state.':
   family&&focus==='failed'?'Model focus could not be confirmed. Retry with a fresh session or open the full Atlas.':
   'Reference frame loaded. Its current model selection is not independently confirmed.':'The reference could not load or its source changed. No substitute is shown.'}</p>
  {(status==='loading'||status==='loaded')&&<iframe key={`${frameKey}:${attempt}`} ref={iframe} src={stableSrc} title={`Existing 3D reference for ${mri.label}: ${target.label}`}
   referrerPolicy="no-referrer" allowFullScreen onLoad={event=>{if(actionable()&&event.currentTarget===iframe.current){
    if(family){ready.current=false;channel.current?.begin(inspection,true);}
    setStatus('loaded');
   }}}
   onError={event=>{if(actionable()&&event.currentTarget===iframe.current){channel.current?.retire();setStatus('failed');}}}/>}
  {status==='failed'&&!suspended&&<button type="button" onClick={()=>{if(actionable())setAttempt(value=>value+1);}}>Retry this reference</button>}
  {family&&status==='loaded'&&!suspended&&(browsing||focus==='blocked'||focus==='failed'&&!currentModelSelection)&&<button type="button" onClick={()=>{if(actionable()){if(ready.current)channel.current?.retry();else setAttempt(value=>value+1);}}}>{browsing?'Restore requested selection':'Retry model focus'}</button>}
  {reverseLabel&&<button type="button" onClick={()=>{
   if(actionable()&&status==='loaded'&&selection&&channel.current?.selection===selection&&
    isCurrentRegionalMriReferenceSelection(selection)&&getMriSelectionLabel?.(selection))onSelectMri?.(selection);
  }}>Show {reverseLabel} on MRI</button>}
  <p className="regional-mri-review__limits">Rotate or explore the reference independently. Model interactions do not change this MRI. No MRI anatomical match, spatial registration, mirroring or synchronized camera completion is implied.</p>
  <details><summary>Inspection checklist · not saved</summary><p>Private visual worksheet for this exact source and target. Ticks are temporary, not a saved review or sign-off, and reset when the context changes or closes. Do not enter patient information.</p>
   {checks.map((label,index)=><label key={label}><input type="checkbox" checked={checked[index]} disabled={suspended} onChange={event=>{if(actionable()){const value=event.currentTarget.checked;setChecklist(previous=>({key,attempt,values:(previous.key===key&&previous.attempt===attempt?previous.values:checks.map(()=>false)).map((old,i)=>i===index?value:old)}));}}}/>{label}</label>)}
   <dl><dt>MRI structure / sequence</dt><dd>{mri.label} · {mri.seriesLabel} · {mri.side} · {mri.coverage} coverage</dd>
    <dt>Source review scope</dt><dd>{mri.reviewScope} · {mri.reviewStatus}</dd><dt>Display geometry</dt><dd>{mri.gridKind??mri.geometryKind}</dd>
    <dt>MRI package revision</dt><dd><code>{mri.revision}</code></dd><dt>Sequence image SHA-256</dt><dd><code>{mri.imageSha256}</code></dd>
    <dt>Annotation / anatomical ID</dt><dd><code>{mri.annotationId} · {mri.anatomyId}</code></dd><dt>Source review revision</dt><dd><code>{mri.reviewRevision}</code></dd>
    {mri.geometryMappingRevision&&<><dt>Geometry mapping revision</dt><dd><code>{mri.geometryMappingRevision}</code></dd></>}
    <dt>Atlas source / semantic mapping</dt><dd><code>{inspection.atlasRevision} · {inspection.mappingRevision}</code></dd>
    <dt>3D identity / bundle</dt><dd><code>{target.id} · {target.sourceHash}</code></dd>
    {target.specimenRevision&&<><dt>Specimen navigation revision</dt><dd><code>{target.specimenRevision}</code></dd></>}
   </dl>
  </details>
  <p><a href={target.href} target="_blank" rel="noopener noreferrer" onClick={event=>{if(!actionable())event.preventDefault();}}>Open full 3D Atlas ↗</a></p>
 </section>;
}
