'use client';

import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {regionalMri3dComparison,type Regional3dCatalogue} from '../lib/regional-mri-3d-comparison';
import {isRegionalMriLearning,regionalLearningLabels,regionalLearningTopics,resolveRegionalMriLearning,type RegionalLearningTopic,type RegionalMriLearning as Learning} from '../lib/regional-mri-learning';
import {regionalLearningReviewHref} from '../lib/regional-mri-learning-review-link';
import type {RegionalMriPackage,RegionalLoadedSeries,RegionalLoadedAnnotation} from '../lib/regional-mri-package';

type Props={source:{revision:string;region:string};catalogue:Regional3dCatalogue|null;pkg:RegionalMriPackage;study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation};
type Context=Pick<Props,'catalogue'|'pkg'|'study'|'overlay'>&{revision:string;region:string};
type Result={context:Context;targetId:string;topic:RegionalLearningTopic;proof:Learning|null;status:'loading'|'ready'|'unavailable'};
const same=(a:Context,b:Context)=>a.revision===b.revision&&a.region===b.region&&a.catalogue===b.catalogue&&a.pkg===b.pkg&&a.study===b.study&&a.overlay===b.overlay;

export function RegionalMriLearning({source,catalogue,pkg,study,overlay}:Props){
 const [open,setOpen]=useState(false),[choice,setChoice]=useState<{context:Context;id:string}|null>(null);
 const [topic,setTopic]=useState<RegionalLearningTopic>('anatomy');
 const [result,setResult]=useState<Result|null>(null);
 const current:Context={revision:source.revision,region:source.region,catalogue,pkg,study,overlay};
 const comparison=regionalMri3dComparison(source,catalogue,pkg,study,overlay);
 const eligible=!!comparison&&!comparison.provisional&&overlay.purpose==='scoped-display'&&overlay.annotation.review.status==='accepted-scoped';
 const targets=eligible?comparison.targets:[];
 const targetId=targets.length===1?targets[0].id:choice&&same(choice.context,current)&&targets.some(item=>item.id===choice.id)?choice.id:'';
 const selected=targets.find(item=>item.id===targetId);
 const visible=result&&same(result.context,current)&&result.targetId===targetId&&result.topic===topic&&open&&targetId&&result.status==='ready'&&isRegionalMriLearning(result.proof)?result.proof:null;
 const section=visible?.entry.topics.find(item=>item.id===topic&&item.readiness==='draft')??null;
 const reviewHref=regionalLearningReviewHref(visible);
 const serial=useRef(0),renderSerial=useRef(0),committed=useRef<{token:number;context:Context;targetId:string;topic:RegionalLearningTopic;open:boolean}|null>(null);
 const token=++renderSerial.current;
 useLayoutEffect(()=>{committed.current={token,context:current,targetId,topic,open};});
 const active=()=>{const c=committed.current;return c?.token===token&&same(c.context,current)&&c.targetId===targetId&&c.topic===topic&&c.open===open;};
 useEffect(()=>{
  const request=++serial.current;
  if(!open||!targetId||!eligible){setResult(null);return()=>{serial.current++;};}
  setResult({context:current,targetId,topic,proof:null,status:'loading'});
  void resolveRegionalMriLearning(source,catalogue,pkg,study,overlay,targetId).then(proof=>{
   const c=committed.current;
   if(serial.current===request&&c?.open&&c.targetId===targetId&&c.topic===topic&&same(c.context,current))
    setResult({context:current,targetId,topic,proof:isRegionalMriLearning(proof)?proof:null,status:isRegionalMriLearning(proof)?'ready':'unavailable'});
  },()=>{
   const c=committed.current;
   if(serial.current===request&&c?.open&&c.targetId===targetId&&c.topic===topic&&same(c.context,current))
    setResult({context:current,targetId,topic,proof:null,status:'unavailable'});
  });
  return()=>{serial.current++;};
 },[open,targetId,topic,current.revision,current.region,catalogue,pkg,study,overlay,eligible]);
 const currentResult=result&&same(result.context,current)&&result.targetId===targetId&&result.topic===topic&&open?result:null;
 return <details className="regional-mri-review__learning" open={open} onToggle={event=>{
  if(!active())return;
  const next=event.currentTarget.open;
  if(next!==open){serial.current++;setResult(null);setOpen(next);}
 }}>
  <summary>Reference teaching · Draft</summary>
  {open&&<div className="regional-mri-review__learning-content">
   <p className="regional-mri-review__learning-scope">General anatomical reference only; this is not a finding on this scan or confirmation of a live model selection. The MRI and 3D reference are separate, unregistered subjects.</p>
   <p>All teaching drafts await separate revision-bound radiologist review. Saving an MRI correction does not approve this teaching.</p>
   {!eligible||targets.length===0?<p role="status">Reference teaching is unavailable for this MRI selection. No substitute is shown.</p>:<>
    {targets.length>1&&<label>Reference target <select value={targetId} onChange={event=>{
     if(!active())return;
     const id=event.currentTarget.value;
     if(id!==targetId&&(id===''||targets.some(item=>item.id===id))){serial.current++;setResult(null);setChoice({context:current,id});}
    }}><option value="">Choose a reference target</option>{targets.map(item=><option key={item.id} value={item.id}>{item.label} · {item.kind==='specimen'?'independent specimen':'body reference'} · {item.relation==='same-structure'?'same structure':item.relation==='parent-reference'?'whole parent':'group reference'}</option>)}</select></label>}
    {selected&&<><p className="regional-mri-review__learning-limits">{selected.kind==='specimen'?'Independent specimen (source-reported)':'Body reference'} · {selected.oppositeSide?'opposite source side; not mirrored':`${selected.side} side`}. {selected.relation==='parent-reference'?'Whole parent only; the MRI subregion has no separate 3D selection.':selected.relation==='group-reference'?'Grouped surface only; the MRI component has no separate 3D selection.':'Reference anatomy is viewed independently.'}</p>
     {reviewHref&&<p><a href={reviewHref} target="_blank" rel="noopener noreferrer" aria-label="Review this exact reference teaching draft (opens in a new tab)">Review this exact teaching draft ↗</a></p>}
     <label>Teaching topic <select value={topic} onChange={event=>{
      if(!active())return;
      const next=event.currentTarget.value;
      if(next!==topic&&regionalLearningTopics.includes(next as RegionalLearningTopic)){serial.current++;setResult(null);setTopic(next as RegionalLearningTopic);}
     }}>{regionalLearningTopics.map(item=><option key={item} value={item}>{regionalLearningLabels[item]}</option>)}</select></label>
     {currentResult?.status==='loading'?<p role="status">Checking this exact draft reference…</p>:currentResult?.status==='unavailable'?<p role="status">Draft teaching is unavailable for this exact source and target. No substitute is shown.</p>:section&&visible?<>
      <h3>{section.title}</h3><p>{section.body}</p>
      {section.bullets.length>0&&<ul>{section.bullets.map((item,index)=><li key={index}>{item}</li>)}</ul>}
      {section.note&&<p>{section.note}</p>}
      {visible.entry.limitations.map((item,index)=><p key={index} className="regional-mri-review__learning-limits">{item}</p>)}
      {visible.entry.reflection&&<details className="regional-mri-review__learning-reflection" key={visible.key}><summary>Reflection</summary><p>{visible.entry.reflection.question}</p><details><summary>Reveal explanation</summary><p>{visible.entry.reflection.answer}</p><p>Reflection only · no score or completion recorded.</p></details></details>}
      <details className="regional-mri-review__learning-sources" key={`${visible.key}:${topic}`}><summary>Sources and exact draft revision</summary>
       {section.references.length>0&&<ul>{section.references.map((reference,index)=><li key={index}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title}</a></li>)}</ul>}
       {visible.entry.reflection?.references.length? <p>Reflection sources: {visible.entry.reflection.references.map((reference,index)=><span key={index}>{index>0?' · ':''}<a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title}</a></span>)}</p>:null}
       <p>Teaching draft revision: <code>{visible.entry.revision}</code>. This identifies exact content; it is not approval.</p>
      </details>
     </>:visible?<p role="status">This topic is pending or unavailable for the exact source and target. No substitute is shown.</p>:null}
    </>}
   </>}
  </div>}
 </details>;
}
