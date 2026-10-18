'use client';

import {useLayoutEffect,useRef,useState} from 'react';
import {regionalMri3dComparison,type Regional3dCatalogue} from '../lib/regional-mri-3d-comparison';
import type {RegionalMriPackage,RegionalLoadedSeries,RegionalLoadedAnnotation} from '../lib/regional-mri-package';
import {RegionalMriLearning} from './RegionalMriLearning';

type Props={source:{revision:string;region:string};catalogue:Regional3dCatalogue|null;pkg:RegionalMriPackage;
 study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation;retired:boolean;
 onInspect:(targetId:string,launcher:HTMLButtonElement)=>void};

/** Optional study after the parent has committed correct or revealed feedback. */
export function RegionalMriPracticeFollowup({source,catalogue,pkg,study,overlay,retired,onInspect}:Props){
 const [open,setOpen]=useState(false);
 const renderCount=useRef(0),committed=useRef<number|null>(null);
 const token=++renderCount.current;
 const comparison=!retired?regionalMri3dComparison(source,catalogue,pkg,study,overlay):null;
 const eligible=!!comparison&&!comparison.provisional&&comparison.reviewStatus==='accepted-scoped'&&
  overlay.purpose==='scoped-display'&&overlay.annotation.review.status==='accepted-scoped';
 useLayoutEffect(()=>{committed.current=token;return()=>{if(committed.current===token)committed.current=null;};});
 if(!eligible)return null;
 const active=()=>committed.current===token&&!retired;
 const currentTarget=(id:string)=>{
  if(!active())return null;
  const latest=regionalMri3dComparison(source,catalogue,pkg,study,overlay);
  if(!latest||latest.provisional||latest.reviewStatus!=='accepted-scoped'||overlay.purpose!=='scoped-display')return null;
  const original=comparison.targets.find(target=>target.id===id);
  const current=latest.targets.find(target=>target.id===id);
  return original&&current&&JSON.stringify(original)===JSON.stringify(current)?current:null;
 };
 return <details className="regional-mri-review__learning" open={open} onToggle={event=>{
  if(active())setOpen(event.currentTarget.open);
 }}>
  <summary>Study this answer</summary>
  {open&&<div className="regional-mri-review__learning-content">
   <p>These are separate public anatomical references, not this MRI subject. No spatial registration, mirrored view, scan finding or approval is implied.</p>
   <p>The saved annotation is accepted only within its stated review scope; its visible extent may be partial. Teaching drafts require separate revision-bound radiologist review.</p>
   {comparison.targets.map(target=><div key={target.id} className="regional-mri-review__learning-limits">
    <p>{target.label} · {target.kind==='specimen'?'independent specimen':'body reference'} · {target.oppositeSide?'opposite source side; not mirrored':`${target.side} source side`} · {target.relation==='same-structure'?'same structure':target.relation==='parent-reference'?'whole parent reference':'group reference'}.</p>
    {target.relation==='parent-reference'&&<p>Whole parent only; the MRI subregion has no separate 3D selection.</p>}
    {target.relation==='group-reference'&&<p>Grouped surface only; the MRI component has no separate 3D selection.</p>}
    <button type="button" onClick={event=>{if(currentTarget(target.id))onInspect(target.id,event.currentTarget);}}>Inspect {target.label} beside MRI</button>
    <a href={target.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${target.label} in Atlas (opens in a new tab)`} onClick={event=>{if(!currentTarget(target.id))event.preventDefault();}}>Open {target.label} in Atlas ↗</a>
   </div>)}
   {catalogue?.learning&&<RegionalMriLearning source={source} catalogue={catalogue} pkg={pkg} study={study} overlay={overlay}/>}
  </div>}
 </details>;
}
