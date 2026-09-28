'use client';
import {useId,useState} from 'react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/atlas-review/components/ui/select';
import {regionalTours} from '@/atlas-review/lib/regional-tours';
import type {BodyCatalog} from './body-types';
import {RegionalGuidedLearning} from './regional-guided-learning';
import './whole-body-guided-learning.css';

// Reuse reviewed regional scopes; do not invent whole-body memberships or
// combine independent specimens into a new camera/source frame.
const order=['head-neck','spine','thorax','abdomen','pelvis','shoulder-arm','forearm','hand','thigh','leg','foot'];
export const wholeBodyTourOptions=order.flatMap(region=>regionalTours.filter(t=>t.region===region));

export function WholeBodyGuidedLearning({catalog,assetBase,onExit}:{catalog:BodyCatalog;assetBase?:string;onExit:()=>void}) {
  const labelId=useId();
  const [tourId,setTourId]=useState(wholeBodyTourOptions[0].id);
  const tour=wholeBodyTourOptions.find(t=>t.id===tourId)!;
  return <section className="whole-body-guided-learning" aria-label="Guided tour library">
    <div className="whole-body-tour-picker">
      <span id={labelId}>Tour</span>
      <Select value={tour.id} onValueChange={id=>{
        if(wholeBodyTourOptions.some(t=>t.id===id))setTourId(id as string);
      }}>
        <SelectTrigger aria-labelledby={labelId}><SelectValue>{tour.title}</SelectValue></SelectTrigger>
        <SelectContent>{wholeBodyTourOptions.map(t=><SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    {/* A new key discards old timers, step, readiness, reading and camera state.
        The next tour waits for its own sources and an explicit Start action. */}
    <RegionalGuidedLearning key={`${tour.id}:${tour.revision}`} catalog={catalog} tour={tour} assetBase={assetBase} onExit={onExit}/>
  </section>;
}
