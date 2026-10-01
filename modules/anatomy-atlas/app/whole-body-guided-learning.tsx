'use client';
import {useId,useState} from 'react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {regionalTours} from '@/lib/regional-tours';
import type {BodyCatalog} from './body-types';
import {RegionalGuidedLearning} from './regional-guided-learning';
import './whole-body-guided-learning.css';

// Whole-body tours explicitly declare their same-catalog regional union.
// Regional membership is never rewritten, nor independent specimens combined.
const order=['whole-body','head-neck','spine','thorax','abdomen','pelvis','shoulder-arm','forearm','hand','thigh','leg','foot'];
export const wholeBodyTourOptions=order.flatMap(region=>regionalTours.filter(t=>t.region===region));

export function WholeBodyGuidedLearning({catalog,assetBase,onExit,region='whole-body'}:{catalog:BodyCatalog;assetBase?:string;onExit:()=>void;region?:string}) {
  const labelId=useId();
  const options=region==='whole-body'?wholeBodyTourOptions:wholeBodyTourOptions.filter(t=>t.region===region);
  const [tourId,setTourId]=useState(options[0]?.id??'');
  const tour=options.find(t=>t.id===tourId)??options[0];
  if(!tour)return <section aria-label="Guided tour library"><p role="status">No guided tours are available for this region.</p><button type="button" onClick={onExit}>Exit tour</button></section>;
  return <section className="whole-body-guided-learning" aria-label="Guided tour library">
    <div className="whole-body-tour-picker">
      <span id={labelId}>Tour</span>
      <Select value={tour.id} onValueChange={id=>{
        if(options.some(t=>t.id===id))setTourId(id as string);
      }}>
        <SelectTrigger aria-labelledby={labelId}><SelectValue>{tour.title}</SelectValue></SelectTrigger>
        <SelectContent>{options.map(t=><SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    {/* A new key discards old timers, step, readiness, reading and camera state.
        The next tour waits for its own sources and an explicit Start action. */}
    <RegionalGuidedLearning key={`${tour.id}:${tour.revision}`} catalog={catalog} tour={tour} assetBase={assetBase} onExit={onExit}/>
  </section>;
}
