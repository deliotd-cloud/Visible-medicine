'use client';
import {Component,useId,useState,type ReactNode} from 'react';
import dynamic from 'next/dynamic';
import {regionalTours} from '@/lib/regional-tours';
import {nestedGuidedStudyOptions} from '@/lib/nested-guided-learning';
import type {BodyCatalog} from './body-types';
import type {PausedTourImaging} from '@/lib/paused-tour-imaging';
import {RegionalGuidedLearning} from './regional-guided-learning';
import './whole-body-guided-learning.css';

// Selecting a nested tour must not eagerly load its 3D/teaching workbench
// for every region. Use the same deferred boundary as manual eye exploration.
const nestedLoadFailure='This tour could not load. Choose another tour or Exit tour.';
class NestedTourLoadBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="alert">{nestedLoadFailure}</p>:this.props.children;}
}
const EyeLayerView=dynamic(()=>import('./eye-layers').then(module=>module.EyeLayerView),{ssr:false,
  loading:({error})=>error?<p role="alert">{nestedLoadFailure}</p>:<p role="status">Loading eye layers…</p>});
const VentricularView=dynamic(()=>import('./ventricles').then(module=>module.VentricularView),{ssr:false,
  loading:({error})=>error?<p role="alert">{nestedLoadFailure}</p>:<p role="status">Loading anatomy spaces…</p>});

// Whole-body tours explicitly declare their same-catalog regional union.
// Regional membership is never rewritten, nor independent specimens combined.
const order=['whole-body','head-neck','spine','thorax','abdomen','pelvis','shoulder-arm','forearm','hand','thigh','leg','foot'];
const regionTitle=(region:string)=>region==='whole-body'?'Whole body':region.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
export const wholeBodyTourOptions=order.flatMap(region=>regionalTours.filter(t=>t.region===region));

export function WholeBodyGuidedLearning({catalog,assetBase,onExit,region='whole-body',pausedImaging}:{catalog:BodyCatalog;assetBase?:string;onExit:()=>void;region?:string;pausedImaging?:PausedTourImaging}) {
  const labelId=useId();
  const [query,setQuery]=useState('');
  const [regionFilter,setRegionFilter]=useState('all');
  const [pauseRequest,setPauseRequest]=useState(0);
  const pauseForLibrary=()=>setPauseRequest(request=>request+1);
  const regional=region==='whole-body'?wholeBodyTourOptions:wholeBodyTourOptions.filter(t=>t.region===region);
  const nested=nestedGuidedStudyOptions(catalog,region);
  const options=order.flatMap(r=>[
    ...regional.filter(t=>t.region===r).map(t=>({id:t.id,title:t.title,region:t.region,tour:t,eye:null})),
    ...nested.filter(t=>t.region===r).map(t=>({id:t.id,title:t.title,region:t.region,tour:null,eye:t})),
  ]);
  const [tourId,setTourId]=useState(options[0]?.id??'');
  const tour=options.find(t=>t.id===tourId)??options[0];
  if(!tour)return <section aria-label="Guided tour library"><p role="status">No guided tours are available for this region.</p><button type="button" onClick={onExit}>Exit tour</button></section>;
  const discover=region==='whole-body';
  const search=query.trim().toLocaleLowerCase();
  const visible=discover?options.filter(option=>
    (regionFilter==='all'||option.region===regionFilter)&&
    (!search||[option.title,regionTitle(option.region),
      ...(option.tour?.steps.map(step=>step.title)??option.eye?.guide.steps.map(step=>step.title)??[])]
      .some(value=>value.toLocaleLowerCase().includes(search)))):options;
  const filtersActive=!!query||regionFilter!=='all';
  const currentVisible=visible.some(option=>option.id===tour.id);
  return <section className="whole-body-guided-learning" aria-label="Guided tour library">
    <div className="whole-body-tour-picker" onFocusCapture={pauseForLibrary} onPointerDownCapture={pauseForLibrary}>
      <div className="whole-body-tour-choice">
        <label htmlFor={`${labelId}-tour`}>Choose a tour</label>
        <select id={`${labelId}-tour`} aria-label="Choose a tour" value={tour.id} disabled={!visible.length} onChange={event=>{
          const id=event.target.value;
          if(visible.some(option=>option.id===id)&&id!==tour.id){pausedImaging?.suspend();setTourId(id);}
        }}>
          {!currentVisible&&<option value={tour.id} disabled>Current tour: {tour.title} (outside filters)</option>}
          {visible.map(option=><option key={option.id} value={option.id}>{option.title}</option>)}
        </select>
      </div>
      {discover&&<details className="whole-body-tour-discovery" onToggle={event=>{if(event.currentTarget.open)pauseForLibrary();}} onKeyDown={event=>{
        const details=event.currentTarget;
        if(event.key!=='Escape'||event.defaultPrevented||event.nativeEvent.isComposing||!details.open||!details.isConnected)return;
        event.preventDefault();event.stopPropagation();details.open=false;
        details.querySelector('summary')?.focus({preventScroll:true});
      }}>
        <summary>Find a tour{filtersActive?' · filtered':''}</summary>
        <div className="whole-body-tour-filters">
          <label htmlFor={`${labelId}-search`}>Search tours</label>
          <input id={`${labelId}-search`} type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Title, region or step"/>
          <label htmlFor={`${labelId}-region`}>Region</label>
          <select id={`${labelId}-region`} value={regionFilter} onChange={event=>setRegionFilter(event.target.value)}>
            <option value="all">All regions</option>
            {order.filter(r=>options.some(option=>option.region===r)).map(r=><option key={r} value={r}>{regionTitle(r)}</option>)}
          </select>
          {filtersActive&&<button type="button" onClick={()=>{setQuery('');setRegionFilter('all');}}>Clear filters</button>}
        </div>
        <p className="whole-body-tour-results" role="status">{visible.length?`${visible.length} ${visible.length===1?'tour':'tours'} available`:'No tours match. Clear filters to see all tours.'}</p>
      </details>}
    </div>
    {/* A new key discards old timers, step, readiness, reading and camera state.
        The next tour waits for its own sources and an explicit Start action. */}
    {tour.tour ? <RegionalGuidedLearning key={`${tour.id}:${tour.tour.revision}`} catalog={catalog} tour={tour.tour} assetBase={assetBase} pausedImaging={pausedImaging} pauseRequest={pauseRequest} onExit={onExit}/>
      : tour.eye ? <div className="whole-body-nested-guidance" key={`${tour.id}:${tour.eye.parentHash}:${tour.eye.sourceHash}:${JSON.stringify(tour.eye.guide)}`}>
        <header><h2>{tour.title}</h2><button type="button" onClick={onExit}>Exit tour</button></header>
        <NestedTourLoadBoundary>
          {tour.eye.kind==='eye'?<EyeLayerView parent={tour.eye.parent} educationCatalog={catalog} assetBase={assetBase} initialGuidedLearningExpanded pauseRequest={pauseRequest}/>
            :<VentricularView parent={tour.eye.parent} study={tour.eye.kind} educationCatalog={catalog} assetBase={assetBase} initialGuidedLearningExpanded pauseRequest={pauseRequest}/>}
        </NestedTourLoadBoundary>
      </div> : null}
  </section>;
}
