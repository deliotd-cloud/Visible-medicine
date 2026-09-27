'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import type {ContentSection} from './anatomy-data';
import './tour-imaging-notes.css';

export const tourImagingModalities = [
  {id:'ct',label:'CT'}, {id:'mri',label:'MRI'},
  {id:'xray',label:'X-ray'}, {id:'ultrasound',label:'Ultrasound'},
] as const;
export type TourImagingLesson = {id:typeof tourImagingModalities[number]['id'];label:string;content:ContentSection};

/** Existing source-bound teaching only. No case lookup, pixels or access grant. */
export function TourImagingNotes({structureName,lessons,onOpen}:{
  structureName:string;lessons:readonly TourImagingLesson[];onOpen:()=>void;
}) {
  const [selected,setSelected]=useState<TourImagingLesson['id']>('ct');
  const lesson=lessons.find(item=>item.id===selected);
  const content=lesson?.content;
  return <details className="tour-imaging-notes" onToggle={event=>{if(event.currentTarget.open)onOpen();}}>
    <summary>CT / MRI & imaging notes</summary>
    <div className="tour-imaging-reader" role="region" aria-label={`${structureName} imaging notes`} tabIndex={0}>
    <p><strong>{structureName}</strong> · Teaching notes only</p>
    <p className="tour-imaging-boundary">No scan loaded or spatial alignment. Opening these notes pauses the tour; Play resumes it. Imaging cases and paid lectures require their own access.</p>
    <div className="tour-imaging-options" role="group" aria-label="Imaging modality">
      {tourImagingModalities.map(({id,label})=><Button key={id} type="button" variant="outline" aria-pressed={selected===id} onClick={()=>setSelected(id)}>{label}</Button>)}
    </div>
    <div className="tour-imaging-content" aria-live="polite" aria-atomic="true">
      {content?<>
        <p className="tour-imaging-readiness">{content.readiness && content.readiness!=='draft'?'Teaching incomplete':'Draft teaching · radiologist review pending'}</p>
        <h3>{content.title}</h3><p>{content.body}</p>
        {content.bullets?.length?<ul>{content.bullets.map((bullet,index)=><li key={index}>{bullet}</li>)}</ul>:null}
        {content.note&&<p>{content.note}</p>}
        {content.citations?.filter(url=>/^https?:\/\//i.test(url)).map((url,index)=><a key={url} href={url} target="_blank" rel="noreferrer">Reference {index+1} ↗</a>)}
      </>:<p>Teaching for this modality is not yet available. You can continue the 3D tour.</p>}
    </div>
    </div>
  </details>;
}
