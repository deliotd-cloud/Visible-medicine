'use client';

import {useRouter} from 'next/navigation';
import type {FocusEvent,KeyboardEvent,ReactNode} from 'react';
import {headLinksCurrent,HEAD_LINK_REVISION_NOTICE} from '../lib/head-link-availability.ts';
import {headAtlasConceptOptions,headConceptById,HEAD_LINK_REVISION} from '../lib/head-atlas-links';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {relatedLectureHref} from '../lib/lecture-related-links';
import {HeadAtlasLearningPicker} from './HeadAtlasLearningPicker';
import {LearningResourceStatus,LearningStatusKey} from './LearningResourceStatus.ts';

function closeComparisonPanel(event:KeyboardEvent<HTMLDetailsElement>){
  if(event.key!=='Escape'||!event.currentTarget.open)return;
  event.preventDefault();event.stopPropagation();
  event.currentTarget.open=false;
  event.currentTarget.querySelector('summary')?.focus({preventScroll:true});
}

function closeComparisonPanelOnFocusExit(event:FocusEvent<HTMLDetailsElement>){
  const next=event.relatedTarget;
  if(next instanceof Node&&!event.currentTarget.contains(next))event.currentTarget.open=false;
}

// The section survives the short ready → connecting → ready handoff while the
// guarded form does not. Store only a canonical, unsent anatomy ID on that DOM
// owner; replacing the component or rejecting the source discards it.
function comparisonDraftOwner(element:HTMLSelectElement){
  return element.closest?.<HTMLElement>('section.head-atlas-comparison')??null;
}

/** Host-validated semantic focus only; no cross-subject spatial alignment. */
export function HeadAtlasComparisonNavigation({conceptId,liveState,onRetry,onRetryOpeningModel,teaching}:{conceptId:string|null;liveState?:'connecting'|'ready'|'practice'|'guided'|'unavailable'|'sign-in'|'access-denied';onRetry?:()=>void;onRetryOpeningModel?:()=>void;teaching?:ReactNode}){
  const router=useRouter();
  if(!headLinksCurrent())return <section className="head-atlas-tour head-atlas-comparison" aria-label="Linked anatomy comparison" ref={element=>{if(element)delete element.dataset.headComparisonDraftValue;}}><p role="status">{HEAD_LINK_REVISION_NOTICE}</p></section>;
  const blocked=!!liveState&&liveState!=='ready';
  const concept=!blocked&&conceptId?headConceptById(conceptId):null;
  // Links stay bound to the reviewed source revision and confirmed model focus.
  const ctHref=concept?headImageHref('CT',concept.conceptId,null,HEAD_LINK_REVISION):null;
  const mriHref=concept?headImageHref('MRI',concept.conceptId,null,HEAD_LINK_REVISION):null;
  const lectureHref=concept?relatedLectureHref(concept.conceptId,HEAD_LINK_REVISION):null;
  const accessNotice=liveState==='sign-in'?'Sign in to Visible Medicine to load the required 3D model. Atlas and imaging access are checked separately; no matching model selection is confirmed.':liveState==='access-denied'?'Access to the required 3D model was refused. Check your Atlas access with the site owner. Atlas and imaging access are checked separately; no matching model selection is confirmed.':null;
  const scope=accessNotice??(liveState==='practice'?'Comparison controls are hidden during practice.':liveState==='guided'?'Finish the in-model guided sequence to compare selections.':liveState==='connecting'?'Connecting to the model selection…':liveState==='unavailable'?'Comparison is unavailable until the model is ready.':liveState==='ready'?(concept?'Links follow the selected structure.':'Select mapped anatomy in the model, or choose linked anatomy below.'):(concept?'Selecting inside the model does not change these links.':'Choose linked anatomy, then open it in the model.'));
  return <section className="head-atlas-tour head-atlas-comparison" aria-label="Linked anatomy comparison" tabIndex={onRetry?-1:undefined}>
    <div className="head-atlas-tour-context">
      <div className="structure-learning-heading"><h2>{concept?<>Learn this structure <span>· <strong>{concept.label}</strong></span></>:'Learn this structure'}</h2></div>
      <p className="head-atlas-tour-scope" role={liveState?'status':undefined}>{scope} CT/MRI are separate, unregistered subjects.</p>
    </div>
    {concept&&<nav aria-label="Compare focused anatomy">
      {ctHref&&<a href={ctHref} aria-label={`Compare ${concept.label} on CT`}>CT</a>}
      {mriHref&&<a href={mriHref} aria-label={`Compare ${concept.label} on MRI`}>MRI</a>}
      {!ctHref&&<span>No exact CT comparison mapped <LearningResourceStatus status="unavailable"/></span>}
      {!mriHref&&<span>No exact MRI comparison mapped <LearningResourceStatus status="unavailable"/></span>}
    </nav>}
    {liveState==='unavailable'&&onRetry&&<div className="head-atlas-comparison-recovery"><button type="button" onClick={event=>{event.currentTarget.closest('section')?.focus();onRetry();}}>Retry comparison</button><p className="head-atlas-tour-scope">Reconnect without reloading the model. If the model requests sign-in, sign in first.</p></div>}
    {(liveState==='sign-in'||liveState==='access-denied')&&onRetry&&<div className="head-atlas-comparison-recovery"><button type="button" onClick={event=>{event.currentTarget.closest('section')?.focus();onRetry();}}>Check model access again</button></div>}
    {liveState==='unavailable'&&onRetryOpeningModel&&<div className="head-atlas-comparison-recovery"><button type="button" onClick={event=>{event.currentTarget.closest('section')?.focus();onRetryOpeningModel();}}>Retry opening model</button><p className="head-atlas-tour-scope">Reopen this exact model after a blank frame. The current model view will reset.</p></div>}
    {!blocked&&<div className="head-comparison-actions">
      <details className="head-comparison-disclosure" onKeyDown={closeComparisonPanel} onBlur={closeComparisonPanelOnFocusExit}>
        <summary>{concept?'Change structure':'Choose linked anatomy'}</summary>
        <div className="head-comparison-panel">
          <form className="head-atlas-comparison-form" onSubmit={event=>{
            event.preventDefault();
            if(blocked)return;
            const choice=event.currentTarget.elements.namedItem('head-comparison') as HTMLSelectElement|null;
            const destination=choice?headConceptById(choice.value):null;
            if(destination)router.push(destination.atlasHref);
          }}>
            <label><span>Linked anatomy</span><select disabled={blocked} name="head-comparison" required defaultValue={concept?.conceptId??''}
              ref={element=>{
                if(!element)return;
                const owner=comparisonDraftOwner(element);
                const draft=owner?.dataset.headComparisonDraftValue;
                if(draft&&headConceptById(draft)){
                  element.value=draft;
                  element.dataset.headComparisonDraft='true';
                }else if(element.dataset.headComparisonDraft!=='true')element.value=concept?.conceptId??'';
              }}
              onChange={event=>{
                const choice=event.currentTarget,owner=comparisonDraftOwner(choice);
                choice.dataset.headComparisonDraft='true';
                if(owner){
                  if(headConceptById(choice.value))owner.dataset.headComparisonDraftValue=choice.value;
                  else delete owner.dataset.headComparisonDraftValue;
                }
              }}>
              <option value="" disabled>Choose linked anatomy</option>
              {headAtlasConceptOptions().map(option=>{
                const link=headConceptById(option.conceptId);
                return <option key={option.conceptId} value={option.conceptId}>{option.label}{!link?.ctHref?' · MRI only':!link.mriHref?' · CT only':''}</option>;
              })}
            </select></label>
            <button type="submit" disabled={blocked}>Open in model</button>
          </form>
          <p className="head-atlas-tour-scope">Your unsent choice stays here if the live selection changes. Open it explicitly; CT/MRI links above follow the live selection.</p>
        </div>
      </details>
      <details className="head-comparison-disclosure" onKeyDown={closeComparisonPanel} onBlur={closeComparisonPanelOnFocusExit}>
        <summary>More learning</summary>
        <div className="head-comparison-panel head-comparison-learning-panel">
          <HeadAtlasLearningPicker conceptId={concept?.conceptId}/>
          {concept&&teaching&&<details key={concept.conceptId} className="head-learning-material"><summary>Anatomy, clinical notes &amp; quick check · Draft</summary>{teaching}</details>}
          {concept&&!teaching&&liveState&&<p className="head-learning-unavailable"><LearningResourceStatus status="unavailable"/> No linked reference teaching note is available for this selection. Mapped scan links remain available.</p>}
          {lectureHref&&<details className="head-atlas-tour-scope"><summary>Related lectures</summary>
            <p>Find accessible lecture slides for this structure. Lecture access is separate from Atlas access. Access is checked when opened; no lecture is unlocked here.</p>
            <a href={lectureHref} target="_blank" rel="noopener noreferrer">Find related lectures</a>
          </details>}
          {concept&&<details className="head-atlas-tour-scope"><summary>Comparison limits</summary><p>{concept.scopeNote}</p></details>}
          {concept&&<LearningStatusKey/>}
        </div>
      </details>
    </div>}
  </section>;
}
