'use client';
import {regionalTourLimitations,type RegionalTour} from '@/lib/regional-tours';

function referenceHref(value:string):string|null {
  try {
    const url=new URL(value);
    return (url.protocol==='https:'||url.protocol==='http:')&&!url.username&&!url.password?value:null;
  } catch {return null;}
}

/** Read the existing authored stops without starting or requiring a 3D renderer.
 * The parent retains tour/source admission and committed playback authority. */
export function TourReadingNotes({tour,onRead}:{tour:RegionalTour;onRead:()=>void}) {
  return <details className="tour-reading-notes" onFocusCapture={onRead} onPointerDownCapture={onRead}
    onToggle={event=>{if(event.currentTarget.open)onRead();}}
    onKeyDown={event=>{
      const details=event.currentTarget;
      if(event.key!=='Escape'||event.defaultPrevented||event.nativeEvent.isComposing||!details.open||!details.isConnected)return;
      event.preventDefault();event.stopPropagation();details.open=false;
      details.querySelector('summary')?.focus({preventScroll:true});
    }}>
    <summary>Read tour notes · {tour.steps.length} {tour.steps.length===1?'step':'steps'}</summary>
    <div className="tour-reading-content" role="region" aria-label="Draft tour notes" tabIndex={0}>
      <p>Draft notes from this tour, in their original order. Reading pauses playback. These notes do not confirm that the 3D model loaded, finish the tour, record a score or establish clinical approval.</p>
      <ol>{tour.steps.map(step=><li key={step.id}>
        <h3>{step.title}</h3><p>{step.caption}</p>
        {step.references.length>0&&<ul className="tour-reading-references" aria-label={`${step.title} references`}>{step.references.map((reference,index)=>{
          const href=referenceHref(reference);
          return href?<li key={`${index}:${reference}`}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Anatomy reference ${index+1} for ${step.title} (new tab)`}>Reference {index+1}<span aria-hidden="true"> ↗</span></a></li>:null;
        })}</ul>}
      </li>)}</ol>
      <p className="tour-reading-limits">{regionalTourLimitations(tour)}</p>
    </div>
  </details>;
}
