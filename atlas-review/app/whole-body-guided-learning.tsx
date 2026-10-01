'use client';
import {useId,useState} from 'react';
import dynamic from 'next/dynamic';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/atlas-review/components/ui/select';
import {regionalTours} from '@/atlas-review/lib/regional-tours';
import {nestedGuidedStudyOptions} from '@/atlas-review/lib/nested-guided-learning';
import type {BodyCatalog} from './body-types';
import {RegionalGuidedLearning} from './regional-guided-learning';
import './whole-body-guided-learning.css';

// Selecting a nested tour must not eagerly load its 3D/teaching workbench
// for every region. Use the same deferred boundary as manual eye exploration.
const EyeLayerView=dynamic(()=>import('./eye-layers').then(module=>module.EyeLayerView),{ssr:false,
  loading:()=> <p role="status">Loading eye layers…</p>});

// Whole-body tours explicitly declare their same-catalog regional union.
// Regional membership is never rewritten, nor independent specimens combined.
const order=['whole-body','head-neck','spine','thorax','abdomen','pelvis','shoulder-arm','forearm','hand','thigh','leg','foot'];
export const wholeBodyTourOptions=order.flatMap(region=>regionalTours.filter(t=>t.region===region));

export function WholeBodyGuidedLearning({catalog,assetBase,onExit,region='whole-body'}:{catalog:BodyCatalog;assetBase?:string;onExit:()=>void;region?:string}) {
  const labelId=useId();
  const regional=region==='whole-body'?wholeBodyTourOptions:wholeBodyTourOptions.filter(t=>t.region===region);
  const nested=nestedGuidedStudyOptions(catalog,region);
  const options=order.flatMap(r=>[
    ...regional.filter(t=>t.region===r).map(t=>({id:t.id,title:t.title,region:t.region,tour:t,eye:null})),
    ...nested.filter(t=>t.region===r).map(t=>({id:t.id,title:t.title,region:t.region,tour:null,eye:t})),
  ]);
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
    {tour.tour ? <RegionalGuidedLearning key={`${tour.id}:${tour.tour.revision}`} catalog={catalog} tour={tour.tour} assetBase={assetBase} onExit={onExit}/>
      : tour.eye ? <div className="whole-body-nested-guidance" key={`${tour.id}:${tour.eye.parentHash}:${tour.eye.sourceHash}:${JSON.stringify(tour.eye.guide)}`}>
        <header><h2>{tour.title}</h2><button type="button" onClick={onExit}>Exit tour</button></header>
        <EyeLayerView parent={tour.eye.parent} educationCatalog={catalog} assetBase={assetBase} initialGuidedLearningExpanded/>
      </div> : null}
  </section>;
}
