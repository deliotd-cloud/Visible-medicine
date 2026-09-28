'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {Button} from '@/atlas-review/components/ui/button';
import {allBodySystems,type BodyCatalog} from './body-types';
import {regionalTourStructures,regionalTourFrame,type RegionalTour} from '@/atlas-review/lib/regional-tours';
import {initialInspection} from '@/atlas-review/lib/inspection-state';
import {rendererReady,type RendererHealth} from '@/atlas-review/lib/renderer-health';
import {modelDeliveryUrl} from '@/atlas-review/lib/model-delivery';
import {anatomyRetryPlan} from '@/atlas-review/lib/anatomy-load-retry';
import {bodyLesson} from './body-content';
import {TourImagingNotes,tourImagingModalities} from './tour-imaging-notes';
import {TourQuickCheck} from './tour-quick-check';
import './regional-guided-learning.css';
const Scene=dynamic(()=>import('./body-scene').then(m=>m.BodyScene),{ssr:false});
const empty:string[]=[];
const noSelection=()=>{};

export function RegionalGuidedLearning({catalog,tour,assetBase,onExit}:{catalog:BodyCatalog;tour:RegionalTour;assetBase?:string;onExit:()=>void}) {
  const resolved=useMemo(()=>{try{return {structures:regionalTourStructures(catalog,tour),frames:tour.steps.map((_,i)=>regionalTourFrame(catalog,tour,i)),error:''};}catch{return {structures:[],frames:[],error:'This tour is unavailable for the current anatomy source.'};}},[catalog,tour]);
  const [index,setIndex]=useState<number|null>(null),[playing,setPlaying]=useState(false);
  const [motionPaused,setMotionPaused]=useState(false),[reduced,setReduced]=useState(false);
  const [explanationOpen,setExplanationOpen]=useState(true);
  const [health,setHealth]=useState<RendererHealth>('starting');
  const [loaded,setLoaded]=useState<string[]>([]),[failed,setFailed]=useState<string[]>([]);
  const [retries,setRetries]=useState<Record<string,number>>({}),[retrying,setRetrying]=useState(false),[retryError,setRetryError]=useState('');
  const required=useMemo(()=>[...new Set(resolved.structures.map(s=>s.bundle))],[resolved]);
  const scopeSerial=useRef(0);
  const scope=useMemo(()=>({active:true,pending:false,key:++scopeSerial.current}),[catalog,tour,assetBase]);
  const currentScope=useRef(scope);
  const previousScope=useRef(scope);
  currentScope.current=scope;
  const controls=useRef<HTMLDivElement>(null);
  const returnRetryFocus=useRef(false);
  const scopeChanged=previousScope.current!==scope;
  // Reset our own state before React commits children for a changed source.
  // A passive reset could discard the new scene's mount/load callbacks.
  if(scopeChanged){
    previousScope.current=scope;
    setLoaded([]);setFailed([]);setRetries({});setRetrying(false);setRetryError('');setHealth('starting');setIndex(null);setPlaying(false);setMotionPaused(true);
  }
  useEffect(()=>{scope.active=true;return()=>{scope.active=false;};},[scope]);
  const onLoaded=useCallback((id:string)=>{if(scope.active&&currentScope.current===scope&&required.includes(id))setLoaded(current=>current.includes(id)?current:[...current,id]);},[required,scope]);
  const onFailure=useCallback((id:string)=>{if(scope.active&&currentScope.current===scope&&required.includes(id))setFailed(current=>current.includes(id)?current:[...current,id]);},[required,scope]);
  const retryPlan=anatomyRetryPlan(catalog.bundles,failed,required);
  async function retryAnatomy(event?:{currentTarget:HTMLButtonElement}) {
    if(!scope.active||currentScope.current!==scope||scope.pending||!retryPlan.length)return;
    returnRetryFocus.current=!!event&&document.activeElement===event.currentTarget;
    scope.pending=true;setRetrying(true);setRetryError('');setPlaying(false);setMotionPaused(true);
    const current=()=>scope.active&&currentScope.current===scope;
    try {
      const {retryBodyAssets}=await import('./body-scene');
      if(!current())return;
      retryBodyAssets(retryPlan.map(b=>b.url),assetBase);
      const ids=new Set(retryPlan.map(b=>b.id));
      setLoaded(old=>old.filter(id=>!ids.has(id)));setFailed(old=>old.filter(id=>!ids.has(id)));
      setRetries(old=>{const next={...old};for(const id of ids)next[id]=(next[id]??0)+1;return next;});
    } catch {
      if(current())setRetryError('The retry could not start. Try again when the connection returns.');
    } finally {
      scope.pending=false;
      if(current())setRetrying(false);
    }
  }
  const ready=!scopeChanged&&!resolved.error&&rendererReady(health)&&failed.length===0&&resolved.structures.every(s=>loaded.includes(s.bundle));
  useEffect(()=>{
    if(!ready||!returnRetryFocus.current)return;
    returnRetryFocus.current=false;
    // Removing the retry button drops focus to body. Do not steal it if the
    // learner has moved to Exit, notes or another control while loading.
    if(document.activeElement===document.body)controls.current?.querySelector<HTMLButtonElement>('[data-tour-resume]')?.focus({preventScroll:true});
  },[ready]);
  const step=tour.steps[(scopeChanged?null:index)??0];
  const changeStep=useCallback((next:number)=>{if(!Number.isInteger(next)||next<0||next>=tour.steps.length)return;setIndex(next);setMotionPaused(false);},[tour]);
  useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(q.matches);update();q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[]);
  // Keep mobile anatomy in view; the complete teaching remains one disclosure away.
  useEffect(()=>{setExplanationOpen(!window.matchMedia('(max-width: 600px)').matches);},[]);
  useEffect(()=>{const pause=()=>{setPlaying(false);setMotionPaused(true);};const visibility=()=>{if(document.hidden)pause();};if(!ready)pause();document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[ready]);
  useEffect(()=>{if(!playing||index===null||!ready||document.hidden)return;const timer=window.setTimeout(()=>{if(document.hidden)return;if(index+1<tour.steps.length)changeStep(index+1);else setPlaying(false);},step.durationMs);return()=>window.clearTimeout(timer);},[playing,index,ready,step.durationMs,tour,changeStep]);
  const active=!scopeChanged&&index!==null;
  const selected=resolved.structures.find(s=>s.id===step.selectedId);
  useEffect(()=>{if(active)controls.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll:true});},[active]);
  return <section className="regional-tour" aria-label={tour.title}>
    <div className="regional-tour-panel">
      <div className="regional-tour-heading" aria-live="polite" aria-atomic="true"><h2>{active?step.title:tour.title}</h2>{active&&<span>Step {index+1} of {tour.steps.length}</span>}</div>
      <details className="regional-tour-explanation" open={explanationOpen} onToggle={event=>{
        const open=event.currentTarget.open;setExplanationOpen(open);
        if(open){setPlaying(false);setMotionPaused(true);}
      }}>
      <summary>Step explanation & imaging · Draft</summary>
      <p aria-live="polite" aria-atomic="true">{active?step.caption:tour.description}</p>
      <details><summary>References & limits · Draft, review pending</summary>
        <p>{tour.limitations??'Selected exterior source surfaces in a common frame. Not a continuous airway lumen, complete bronchial tree or patient scan.'} Exit restores your previous workspace.</p>
        {step.references.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">Anatomy reference ↗</a>)}
      </details>
      {active&&selected&&<TourImagingNotes key={`imaging:${step.id}`} structureName={selected.name}
        lessons={tourImagingModalities.map(({id,label})=>({id,label,content:bodyLesson(selected,id)}))}
        onOpen={()=>{setPlaying(false);setMotionPaused(true);}}/>}
      {active&&ready&&selected&&<TourQuickCheck key={`quiz:${step.id}`} lesson={bodyLesson(selected,'quiz')}
        onOpen={()=>{setPlaying(false);setMotionPaused(true);}}/>}
      </details>
      {!ready&&<output>{resolved.error||retryError|| (failed.length?'Some anatomy failed to load. Retry the missing anatomy to continue.':'Preparing the model. Playback is paused until all tour anatomy is ready.')}</output>}
      <div className="regional-tour-controls" ref={controls}>
        {retryPlan.length>0&&<Button variant="outline" disabled={retrying} onClick={retryAnatomy}>{retrying?'Retrying…':'Retry missing anatomy'}</Button>}
        {!active?<Button data-tour-resume disabled={!ready} onClick={()=>{setPlaying(false);changeStep(0);}}>Start guided tour</Button>:<>
          <Button variant="outline" disabled={!ready||index===0} onClick={()=>changeStep(index-1)}>Back</Button>
          <Button data-tour-resume variant="outline" disabled={!ready} aria-pressed={playing} onClick={()=>{setPlaying(p=>!p);setMotionPaused(playing);}}>{playing?'Pause':'Play'}</Button>
          <Button variant="outline" disabled={!ready} onClick={()=>index===tour.steps.length-1?onExit():changeStep(index+1)}>{index===tour.steps.length-1?'Finish':'Next'}</Button>
        </>}
        <Button variant="ghost" onClick={onExit}>Exit tour</Button>
      </div>
    </div>
    <div className="regional-tour-canvas">
      {!resolved.error&&<Scene key={scope.key} assetBase={assetBase} catalog={catalog} structures={resolved.structures} retries={retries}
        selectedId={step.selectedId} systems={allBodySystems} isolated={step.fadeOthers} hiddenIds={empty}
        ghostRemoved={false} illustrated landmarks={empty} explode={0} layout="spatial" anchorSkeleton={false}
        showOrigins={false} labels view={step.view} zoom={1} reset={index??0} focus={false} exam={false}
        inspection={initialInspection} presetBounds={resolved.frames[(scopeChanged?null:index)??0]} presetKey={tour.id} plate={false}
        tourLocked transitionMs={active&&!reduced?1800:0} transitionPaused={motionPaused||!ready}
        onSelect={noSelection} onLoaded={onLoaded} onFailure={onFailure} onRendererHealth={setHealth}/>}
    </div>
    <a className="regional-tour-credit" href={modelDeliveryUrl('/models/bodyparts3d/credits.html',assetBase)} target="_blank" rel="noreferrer">BodyParts3D · CC BY 4.0 · Adapted</a>
  </section>;
}
