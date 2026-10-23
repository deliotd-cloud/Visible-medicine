'use client';

import {useRouter} from 'next/navigation';
import {headLinksCurrent,HEAD_LINK_REVISION_NOTICE} from '../lib/head-link-availability.ts';
import {headLearningLinks,headLearningSequencesForModality} from '../lib/head-atlas-learning';
import {headConceptById} from '../lib/head-atlas-links';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';

/** Explicit, wrapper-owned tour launch; never infer a match from live iframe selection. */
export function HeadAtlasLearningPicker({sequenceId,conceptId,onNavigate}:{sequenceId?:string;conceptId?:string|null;onNavigate?:(href:string)=>boolean}){
  const router=useRouter(),sequences=headLearningSequencesForModality().filter(sequence=>headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref);
  if(!headLinksCurrent())return <p role="status">{HEAD_LINK_REVISION_NOTICE}</p>;
  const current=sequences.find(sequence=>sequence.id===sequenceId)?.id??'';
  const active=sequences.find(sequence=>sequence.id===current&&!!conceptId&&sequence.concepts.includes(conceptId));
  const selected=!sequenceId&&conceptId?headConceptById(conceptId):null;
  const related=selected?sequences.flatMap(sequence=>{
    const index=sequence.concepts.indexOf(selected.conceptId);
    const link=index>=0?headLearningLinks({sequenceId:sequence.id,conceptId:selected.conceptId}):null;
    return link?[{id:sequence.id,label:sequence.label,step:index+1,total:sequence.concepts.length,href:link.atlasHref}]:[];
  }):[];
  return <details className="head-linked-tour-picker" onClick={event=>{
    if(!event.currentTarget.open||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!(event.target instanceof Element))return;
    const anchor=event.target.closest('a');
    if(!anchor||!event.currentTarget.contains(anchor)||!anchor.closest('.head-linked-tour-steps')||anchor.target||anchor.hasAttribute('download')||anchor.hasAttribute('data-head-reload'))return;
    event.currentTarget.removeAttribute('open');
    // The parent handles navigation after bubbling; a confirmed destination may then take focus.
    event.currentTarget.querySelector('summary')?.focus({preventScroll:true});
  }} onKeyDown={headDisclosureKeyDown}>
    <summary>Linked tours</summary>
    <form key={current} className="head-linked-tour-form" onSubmit={event=>{
      event.preventDefault();
      const choice=event.currentTarget.elements.namedItem('head-linked-tour') as HTMLSelectElement|null;
      const sequence=sequences.find(item=>item.id===choice?.value);
      const link=sequence?headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]}):null;
      if(!link?.atlasHref)return;
      const details=event.currentTarget.closest('details');
      details?.removeAttribute('open');
      // A handled launch may be blocked by active model practice. Keep focus
      // visible; focus before navigation so a confirmed step can take over.
      details?.querySelector('summary')?.focus({preventScroll:true});
      if(!onNavigate?.(link.atlasHref))router.push(link.atlasHref);
    }}>
      {selected&&related.length>0&&<section className="head-linked-tour-steps" aria-label="Tours through selected anatomy">
        <h3>Learn {selected.label} in context</h3>
        <ol>{related.map(tour=><li key={tour.id}><a href={tour.href}>{tour.label} · start at step {tour.step} of {tour.total}</a></li>)}</ol>
        <p>Starts at this structure in the existing 3D Atlas. Earlier steps remain available; nothing is marked complete.</p>
      </section>}
      <label><span>Linked tour</span><select name="head-linked-tour" defaultValue={current} required>
        <option value="" disabled>Choose a tour</option>
        {sequences.map(sequence=><option key={sequence.id} value={sequence.id}>{sequence.label} · {sequence.concepts.length} steps</option>)}
      </select></label>
      <p>Starts in the existing 3D Atlas. Draft comparisons of separate, unregistered subjects.</p>
      <button type="submit">Start at step 1</button>
      {active&&<section className="head-linked-tour-steps" aria-label="Current tour steps">
        <h3>{active.label} · steps</h3>
        <ol>{active.concepts.map((id,index)=>{
          const concept=headConceptById(id),link=headLearningLinks({sequenceId:active.id,conceptId:id});
          return concept&&link?<li key={id}><a href={link.atlasHref} aria-current={id===conceptId?'step':undefined}>{index+1}. {concept.label}{id===conceptId?' · current':''}</a></li>:null;
        })}</ol>
        <p>Jump to a step without recording a score or completion.</p>
      </section>}
    </form>
  </details>;
}
