'use client';
import type {ReactNode} from 'react';
import {headLearningNavigation,type HeadLearningPosition} from '../lib/head-atlas-learning';
import {headLinksCurrent,HEAD_LINK_REVISION_NOTICE} from '../lib/head-link-availability.ts';
import {HeadAtlasLearningPicker} from './HeadAtlasLearningPicker';
import {HeadLearningBookmark} from './HeadLearningBookmark';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links';
import {createLectureTourContext} from '../lib/lecture-tour-context';
import {relatedLectureHref} from '../lib/lecture-related-links';

export function HeadAtlasLearningNavigation({position,onNavigate,comparisonReady=true,recoveryLinks=false,status}:{position:HeadLearningPosition;onNavigate?:(href:string)=>boolean;comparisonReady?:boolean;recoveryLinks?:boolean;status?:ReactNode}){
  if(!headLinksCurrent())return <section className="head-atlas-tour" aria-label="Guided learning sequence"><p role="status">{HEAD_LINK_REVISION_NOTICE}</p></section>;
  const navigation=headLearningNavigation(position);
  if(!navigation)return null;
  const tourContext=createLectureTourContext(position,'3D',HEAD_LINK_REVISION);
  const lectureHref=tourContext.kind==='ready'&&position.conceptId?relatedLectureHref(position.conceptId,HEAD_LINK_REVISION,0,tourContext):null;
  return <section className="head-atlas-tour" aria-label="Guided learning sequence" onClick={event=>{
    if(!onNavigate||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!(event.target instanceof Element))return;
    const anchor=event.target.closest('a');
    if(!anchor||!event.currentTarget.contains(anchor)||anchor.target||anchor.hasAttribute('download')||anchor.hasAttribute('data-head-reload'))return;
    const href=anchor.getAttribute('href');if(href&&onNavigate(href))event.preventDefault();
  }}>
    <div className="head-atlas-tour-context">
      <h2 tabIndex={-1} data-head-guided-heading>Guided learning <span>· {navigation.sequenceLabel} · Draft</span></h2>
      <p className="head-atlas-tour-step">Step {navigation.index+1} / {navigation.total} · <strong>{navigation.label}</strong></p>
      <p className="head-atlas-tour-scope">Linked step only: selecting inside the model does not change these links. CT/MRI are separate, unregistered subjects.</p>
    </div>
    <nav aria-label="Guided learning step navigation">
      {navigation.previous?<a href={navigation.previous.href} rel="prev" aria-label={`Previous step: ${navigation.previous.label}`}>Previous</a>:<span aria-disabled="true">Previous</span>}
      {navigation.next?<a href={navigation.next.href} rel="next" aria-label={`Next step: ${navigation.next.label}`}>Next</a>:<a className="head-atlas-tour-exit" href={navigation.exitHref} aria-label={`Finish tour and explore ${navigation.label}`}>Finish tour</a>}
      {navigation.current.ctHref?(comparisonReady?<a href={navigation.current.ctHref} aria-label={`Continue ${navigation.label} on CT`}>CT</a>:<span aria-disabled="true">CT · awaiting model</span>):<span aria-disabled="true">No exact CT comparison mapped</span>}
      {navigation.current.mriHref?(comparisonReady?<a href={navigation.current.mriHref} aria-label={`Continue ${navigation.label} on MRI`}>MRI</a>:<span aria-disabled="true">MRI · awaiting model</span>):<span aria-disabled="true">No exact MRI comparison mapped</span>}
      {!comparisonReady&&recoveryLinks&&(navigation.current.ctHref||navigation.current.mriHref)&&<div className="head-atlas-tour-recovery head-guided-status">
        <p>These links open the authored tour step, not a confirmed live model selection. CT/MRI are separate, unregistered subjects.</p>
        {navigation.current.ctHref&&<a href={navigation.current.ctHref} target="_blank" rel="noopener noreferrer" aria-label={`Open authored ${navigation.label} step on CT in a new tab`}>Open authored step on CT</a>}
        {navigation.current.mriHref&&<a href={navigation.current.mriHref} target="_blank" rel="noopener noreferrer" aria-label={`Open authored ${navigation.label} step on MRI in a new tab`}>Open authored step on MRI</a>}
      </div>}
      {navigation.next&&<a className="head-atlas-tour-exit" href={navigation.exitHref} aria-label={`Leave tour and explore ${navigation.label}`}>Leave tour</a>}
      <HeadAtlasLearningPicker sequenceId={position.sequenceId} conceptId={position.conceptId} onNavigate={onNavigate}/>
      <HeadLearningBookmark position={position}/>
    </nav>
    {lectureHref&&<details className="head-practice-help"><summary>Related lectures</summary><p>Find accessible lecture slides related to this authored 3D step. This does not confirm the live model selection. Lecture access is separate from Atlas access; a lecture may be unavailable.</p><a href={lectureHref} target="_blank" rel="noopener noreferrer">Find related lectures</a></details>}
    {status}
  </section>;
}
