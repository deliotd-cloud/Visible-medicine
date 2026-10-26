'use client';

import {useEffect,useId,useRef,useState,type ChangeEvent,type KeyboardEvent} from 'react';
import {loadLocalReferencePacket,type LoadedReferencePacket} from '../lib/local-reference-review.ts';
import './local-reference-packet-inspector.css';

type Context={loaded:LoadedReferencePacket;expectedRevision?:string;expectedPacketSha256?:string};
/** Inspection-only renderer. A protected parent supplies optional source pins; this component never registers a packet. */
export function LocalReferencePacketInspector({expectedRevision,expectedPacketSha256}:{expectedRevision?:string;expectedPacketSha256?:string}){
 const heading=useId(),fileRef=useRef<HTMLInputElement|null>(null),imageRef=useRef<HTMLImageElement|null>(null),selectedRef=useRef(0),mounted=useRef(false),request=useRef(0),pending=useRef<AbortController|null>(null);
 const active=useRef<Context|null>(null),retired=useRef<Context[]>([]),pins=useRef({expectedRevision,expectedPacketSha256});
 const [context,setContext]=useState<Context|null>(null),[selected,setSelected]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('Choose a local held reference folder.');
 const [displayError,setDisplayError]=useState('');
 function disposeAll(){active.current?.loaded.dispose();active.current=null;for(const old of retired.current)old.loaded.dispose();retired.current=[]}
 function close(focusPicker=false){request.current++;pending.current?.abort();pending.current=null;disposeAll();setContext(null);selectedRef.current=0;setSelected(0);setBusy(false);setError('');setDisplayError('');setStatus('Local reference folder closed.');if(fileRef.current){fileRef.current.value='';if(focusPicker)fileRef.current.focus()}}
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current++;pending.current?.abort();disposeAll()}},[]);
 useEffect(()=>{if(pins.current.expectedRevision===expectedRevision&&pins.current.expectedPacketSha256===expectedPacketSha256)return;
  pins.current={expectedRevision,expectedPacketSha256};close();setStatus('Expected packet identity changed. Choose its local folder again.');
 },[expectedRevision,expectedPacketSha256]);
 useEffect(()=>{if(!context)return;for(const old of retired.current)old.loaded.dispose();retired.current=[]},[context]);
 async function choose(files:File[]){if(!mounted.current||files.length===0)return;
  pending.current?.abort();const controller=new AbortController(),token=++request.current;pending.current=controller;
  setBusy(true);setError('');setDisplayError('');setStatus('Checking local packet and original JPEG bytes…');
  try{
   const loaded=await loadLocalReferencePacket(files,{signal:controller.signal,expectedRevision,expectedPacketSha256});
   if(!mounted.current||controller.signal.aborted||request.current!==token||pins.current.expectedRevision!==expectedRevision||pins.current.expectedPacketSha256!==expectedPacketSha256){loaded.dispose();return}
   const next={loaded,expectedRevision,expectedPacketSha256};const old=active.current;active.current=next;if(old)retired.current.push(old);
   pending.current=null;setContext(next);selectedRef.current=0;setSelected(0);setStatus(`${loaded.packet.figures.length} original JPEGs checked locally. All rights, privacy, clinical and publication checks remain pending.`);
  }catch(cause){if(!mounted.current||controller.signal.aborted||request.current!==token)return;
   pending.current=null;setError(cause instanceof Error?cause.message:'Local packet could not be checked.');
   setStatus(active.current?'The previous verified packet remains open.':'No packet is open.');
  }finally{if(mounted.current&&request.current===token)setBusy(false)}
 }
 function filesChanged(event:ChangeEvent<HTMLInputElement>){const files=Array.from(event.currentTarget.files??[]);event.currentTarget.value='';void choose(files)}
 const current=context&&active.current===context&&context.expectedRevision===expectedRevision&&context.expectedPacketSha256===expectedPacketSha256?context:null;
 const packet=current?.loaded.packet,figure=packet?.figures[selected];
 function navigate(event:KeyboardEvent<HTMLElement>){if(event.target!==event.currentTarget||!packet||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
  const next=event.key==='ArrowRight'?Math.min(selected+1,packet.figures.length-1):event.key==='ArrowLeft'?Math.max(selected-1,0):event.key==='Home'?0:event.key==='End'?packet.figures.length-1:null;
  if(next===null)return;event.preventDefault();selectedRef.current=next;setSelected(next);setDisplayError('');
 }
 return <section className="local-reference-inspector" aria-labelledby={heading}>
  <header className="local-reference-header"><div><p className="local-reference-eyebrow">Private Clinical Review · local inspection</p><h2 id={heading}>Held ultrasound reference packet</h2>
   <p>Choose a folder on this computer containing REVIEW_PACKET.json and its original JPEGs. Inspection stays in this tab; nothing is uploaded, saved, approved or published.</p></div>
   <div className="local-reference-actions"><label className="local-reference-picker">Choose local folder<input ref={element=>{fileRef.current=element;element?.setAttribute('webkitdirectory','');element?.setAttribute('directory','')}} type="file" multiple onChange={filesChanged} aria-label="Choose local held reference folder" /></label>
    <button type="button" onClick={()=>close(true)} disabled={!current&&!busy&&!error}>Close packet</button></div></header>
  <p role="status" aria-live="polite" className="local-reference-status">{busy?'Checking selected local files…':status}</p>
  {error&&<p role="alert" className="local-reference-error">{error} The selected replacement was not opened.</p>}
  {current&&packet&&<>
   <div className="local-reference-holds" aria-label="Pending clearance checks"><strong>Held for review</strong><span>Rights: pending</span><span>Privacy: pending</span><span>Clinical: pending</span><span>Publication: pending</span></div>
   <details className="local-reference-identities"><summary>Exact packet identity and verification</summary><p><strong>Packet revision:</strong> <code>{packet.revisionSha256}</code></p><p><strong>Selected packet SHA-256:</strong> <code>{current.loaded.packetSha256}</code></p><p>Matching bytes confirm local consistency. They do not establish source authenticity, identity, rights or clinical approval.</p></details>
   <div className="local-reference-layout"><nav className="local-reference-figures" aria-label="Packet figures"><h3>Original figures</h3><div>{packet.figures.map((item,index)=><button key={item.id} type="button" aria-current={selected===index?'true':undefined} onClick={()=>{selectedRef.current=index;setSelected(index);setDisplayError('')}}>Figure {item.figure}<small>{item.title}</small></button>)}</div></nav>
    {figure&&<article className="local-reference-detail" tabIndex={0} onKeyDown={navigate} aria-label="Figure detail. Left and right arrows, Home and End move between figures.">
     <div className="local-reference-figure-heading"><p>Source Figure {figure.figure} · Packet item {selected+1} of {packet.figures.length} · Original JPEG · {figure.widthPixels} × {figure.heightPixels} pixels</p><h3>{figure.title}</h3>{figure.figure===4&&<p role="note">{packet.mainVisualScreen.figure4}</p>}{figure.figure===6&&<p role="note">{figure.rightsHold}</p>}</div>
     <figure className="local-reference-image"><img ref={imageRef} key={current.loaded.images[figure.file]} src={current.loaded.images[figure.file]} width={figure.widthPixels} height={figure.heightPixels} alt={`Original published Figure ${figure.figure}. Draft interpretation below requires clinical review.`} onError={event=>{if(active.current===current&&imageRef.current===event.currentTarget&&selectedRef.current===selected)setDisplayError('This browser could not display the locally verified original JPEG. Close the packet and review the local file separately.')}} /><figcaption>Original pixels, scaled to fit this panel. No annotations or laterality mapping are applied.</figcaption></figure>
     {displayError&&<p role="alert" className="local-reference-error">{displayError}</p>}
     <div className="local-reference-copy"><section><h4>Draft review prompt</h4><p>{figure.draftPrompt}</p><h4>Extent and changes</h4><p>{figure.extent}</p><p>{figure.changes}</p></section>
      <section><h4>Figure provenance</h4><dl><dt>Packet ID</dt><dd>{figure.id}</dd><dt>JPEG file</dt><dd>{figure.file}</dd><dt>SHA-256</dt><dd><code>{figure.sha256}</code></dd><dt>Source URL</dt><dd className="local-reference-wrap">{figure.sourceUrl}</dd></dl>
       <h4>Figure holds</h4><p>Rights: pending{figure.rightsHold?` · Additional hold: ${figure.rightsHold}`:' · No additional hold recorded; this is not rights clearance.'}</p><p>Privacy: {figure.privacyReview} · Clinical: {figure.clinicalReview} · Publication: {figure.publication}</p></section></div>
    </article>}</div>
   <section className="local-reference-source"><p><strong>Source:</strong> {packet.article.author}, {packet.article.year} · {packet.article.journal} · DOI {packet.article.doi} · {packet.license.declared}</p><details><summary>Full source, copyright and usage notices</summary><h3>Source and attribution</h3><p>{packet.article.author}. {packet.article.title}. {packet.article.journal}, {packet.article.year}. DOI: {packet.article.doi}</p>
    <p>Article: {packet.article.url}</p><p>Copyright: {packet.license.copyright}</p><p>Declared licence: {packet.license.declared} · {packet.license.url}</p><p>{packet.license.notice}</p>
    <p>Asset rights review: pending · Privacy clearance: pending · Clinical approval: pending · Publication clearance: pending.</p></details></section>
   <details className="local-reference-screen"><summary>Preparation screen and warnings</summary><h3>Packet visual screen and warnings</h3><p>{packet.mainVisualScreen.meaning}</p><p>Originals viewed at native resolution in packet preparation: {packet.mainVisualScreen.all5OriginalsViewedAtNativeResolution?'recorded':'not recorded'}.</p>
    <p>Visible personal name, date or identifier observed in that limited screen: {packet.mainVisualScreen.visiblePersonalNameDateOrIdentifierObserved?'yes':'no observation recorded'}; this does not establish privacy clearance.</p>
    <p><strong>Figure 4:</strong> {packet.mainVisualScreen.figure4}</p><p><strong>Figure 6:</strong> {packet.mainVisualScreen.figure6}</p></details>
  </>}
 </section>
}
