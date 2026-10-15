'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {Button} from '@/components/ui/button';
import {allBodySystems,type BodyCatalog} from './body-types';
import {regionalTourStructures,regionalTourFrame,type RegionalTour} from '@/lib/regional-tours';
import {GUIDED_SWEEP_MS,guidedPlaybackDuration} from '@/lib/guided-playback';
import {initialInspection} from '@/lib/inspection-state';
import {rendererReady,type RendererHealth} from '@/lib/renderer-health';
import {modelDeliveryUrl} from '@/lib/model-delivery';
import {anatomyRetryPlan} from '@/lib/anatomy-load-retry';
import {modelLoadAccessNotice,type ModelLoadFailure} from '@/lib/model-load-failure';
import {LazyBodyTeaching} from './lazy-body-teaching';
import {TourImagingNotes,tourImagingModalities} from './tour-imaging-notes';
import {TourQuickCheck} from './tour-quick-check';
import {TourStepPicker} from './tour-step-picker';
import {PausedTourImagingLink} from './paused-tour-imaging-link';
import type {PausedTourImaging} from '@/lib/paused-tour-imaging';
import './regional-guided-learning.css';
const Scene=dynamic(()=>import('./body-scene').then(m=>m.BodyScene),{ssr:false});
const empty:string[]=[];
const noSelection=()=>{};

export function RegionalGuidedLearning({catalog,tour,assetBase,onExit,pausedImaging,pauseRequest=0}:{catalog:BodyCatalog;tour:RegionalTour;assetBase?:string;onExit:()=>void;pausedImaging?:PausedTourImaging;pauseRequest?:number}) {
  const resolved=useMemo(()=>{try{return {structures:regionalTourStructures(catalog,tour),frames:tour.steps.map((_,i)=>regionalTourFrame(catalog,tour,i)),error:''};}catch{return {structures:[],frames:[],error:'This tour is unavailable for the current anatomy source.'};}},[catalog,tour]);
  const [index,setIndex]=useState<number|null>(null),[playing,setPlaying]=useState(false);
  const [continuous,setContinuous]=useState(false);
  const [motionPaused,setMotionPaused]=useState(false),[reduced,setReduced]=useState(false);
  const [explanationOpen,setExplanationOpen]=useState(true);
  const [quickCheckOpen,setQuickCheckOpen]=useState(false);
  const [health,setHealth]=useState<RendererHealth>('starting');
  const [loaded,setLoaded]=useState<string[]>([]),[failed,setFailed]=useState<string[]>([]);
  const [failureReasons,setFailureReasons]=useState<Record<string,ModelLoadFailure>>({});
  const [retries,setRetries]=useState<Record<string,number>>({}),[retrying,setRetrying]=useState(false),[retryError,setRetryError]=useState('');
  const required=useMemo(()=>[...new Set(resolved.structures.map(s=>s.bundle))],[resolved]);
  const scopeSerial=useRef(0);
  const scope=useMemo(()=>({active:true,pending:false,key:++scopeSerial.current}),[catalog,tour,assetBase]);
  const currentScope=useRef(scope);
  const previousScope=useRef(scope);
  currentScope.current=scope;
  const controls=useRef<HTMLDivElement>(null);
  const returnRetryFocus=useRef(false);
  const playbackEpoch=useRef(0);
  const revokePlayback=useCallback(()=>{playbackEpoch.current++;setPlaying(false);setMotionPaused(true);},[]);
  const previousPauseRequest=useRef(pauseRequest);
  useLayoutEffect(()=>{
    if(previousPauseRequest.current===pauseRequest)return;
    previousPauseRequest.current=pauseRequest;
    // Library interaction must stop the pending timer before another stop can
    // advance. Keep this player's key, selected stop and current camera pose;
    // leaving the picker never resumes playback without an explicit Play.
    pausedImaging?.suspend();revokePlayback();
  },[pauseRequest,pausedImaging,revokePlayback]);
  const scopeChanged=previousScope.current!==scope;
  // Reset our own state before React commits children for a changed source.
  // A passive reset could discard the new scene's mount/load callbacks.
  if(scopeChanged){
    previousScope.current=scope;
    setLoaded([]);setFailed([]);setFailureReasons({});setRetries({});setRetrying(false);setRetryError('');setHealth('starting');setIndex(null);setPlaying(false);setContinuous(false);setMotionPaused(true);setQuickCheckOpen(false);
  }
  useEffect(()=>{scope.active=true;return()=>{scope.active=false;};},[scope]);
  const onLoaded=useCallback((id:string)=>{if(scope.active&&currentScope.current===scope&&required.includes(id))setLoaded(current=>current.includes(id)?current:[...current,id]);},[required,scope]);
  const onFailure=useCallback((id:string,reason:ModelLoadFailure='unavailable')=>{if(scope.active&&currentScope.current===scope&&required.includes(id)){pausedImaging?.suspend();revokePlayback();setFailureReasons(current=>({...current,[id]:reason}));setFailed(current=>current.includes(id)?current:[...current,id]);}},[required,scope,pausedImaging,revokePlayback]);
  const accessNotice=modelLoadAccessNotice(failed.map(id=>failureReasons[id]??'unavailable'));
  const retryPlan=anatomyRetryPlan(catalog.bundles,failed,required);
  async function retryAnatomy(event?:{currentTarget:HTMLButtonElement}) {
    if(!scope.active||currentScope.current!==scope||scope.pending||!retryPlan.length)return;
    returnRetryFocus.current=!!event&&document.activeElement===event.currentTarget;
    pausedImaging?.suspend();scope.pending=true;setRetrying(true);setRetryError('');setPlaying(false);setMotionPaused(true);
    const current=()=>scope.active&&currentScope.current===scope;
    try {
      const {retryBodyAssets}=await import('./body-scene');
      if(!current())return;
      retryBodyAssets(retryPlan.map(b=>b.url),assetBase);
      const ids=new Set(retryPlan.map(b=>b.id));
      setLoaded(old=>old.filter(id=>!ids.has(id)));setFailed(old=>old.filter(id=>!ids.has(id)));
      setFailureReasons(old=>Object.fromEntries(Object.entries(old).filter(([id])=>!ids.has(id))));
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
  const stepDuration=continuous?guidedPlaybackDuration(step.caption,step.durationMs):step.durationMs;
  const changeStep=useCallback((next:number)=>{if(!Number.isInteger(next)||next<0||next>=tour.steps.length)return;pausedImaging?.suspend();setIndex(next);setMotionPaused(false);setQuickCheckOpen(false);},[tour,pausedImaging]);
  // Manual navigation invalidates the old timer without changing whether Play
  // was active; the next committed stop gets its own full-duration timeout.
  const manualStep=useCallback((next:number)=>{
    if(index===null||!Number.isInteger(next)||next<0||next>=tour.steps.length||next===index)return;
    playbackEpoch.current++;changeStep(next);
  },[changeStep,index,tour.steps.length]);
  useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{
    if(q.matches){playbackEpoch.current++;pausedImaging?.suspend();setPlaying(false);setMotionPaused(true);}
    setReduced(q.matches);
  };update();q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[pausedImaging]);
  // Keep mobile anatomy in view; the complete teaching remains one disclosure away.
  useEffect(()=>{setExplanationOpen(!window.matchMedia('(max-width: 600px)').matches);},[]);
  useEffect(()=>{const pause=()=>{pausedImaging?.suspend();revokePlayback();};const visibility=()=>{if(document.hidden)pause();};if(!ready)pause();document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pause);return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pause);};},[ready,pausedImaging,revokePlayback]);
  useEffect(()=>{if(!playing||index===null||!ready||document.hidden)return;
    let active=true;const epoch=playbackEpoch.current;
    const timer=window.setTimeout(()=>{if(!active||!scope.active||currentScope.current!==scope||epoch!==playbackEpoch.current||document.hidden)return;
      if(index+1<tour.steps.length)changeStep(index+1);else revokePlayback();},stepDuration);
    return()=>{active=false;window.clearTimeout(timer);};
  },[playing,index,ready,stepDuration,tour,scope,changeStep,revokePlayback]);
  const active=!scopeChanged&&index!==null;
  const selected=resolved.structures.find(s=>s.id===step.selectedId);
  useLayoutEffect(()=>{
    pausedImaging?.setStop(active&&selected?{tourId:tour.id,revision:tour.revision,stepId:step.id,structureId:selected.id,sources:selected.sources}:null,
      active&&ready&&!playing&&motionPaused&&!quickCheckOpen&&!document.hidden);
  },[pausedImaging,active,selected,tour,step,ready,playing,motionPaused,quickCheckOpen]);
  useLayoutEffect(()=>()=>pausedImaging?.suspend(),[pausedImaging,scope]);
  const exit=()=>{pausedImaging?.suspend();revokePlayback();onExit();};
  const onHealth=useCallback((next:RendererHealth)=>{
    if(!scope.active||currentScope.current!==scope)return;
    if(!rendererReady(next)){pausedImaging?.suspend();revokePlayback();}
    setHealth(next);
  },[scope,pausedImaging,revokePlayback]);
  useEffect(()=>{if(active)controls.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll:true});},[active]);
  return <section className="regional-tour" aria-label={tour.title}>
    <div className="regional-tour-panel">
      <div className="regional-tour-heading"><h2 aria-live="polite" aria-atomic="true">{active?step.title:tour.title}</h2>{active&&<TourStepPicker steps={tour.steps} index={index} ready={ready}
        onPause={revokePlayback}
        onStep={next=>{if(ready)manualStep(next);}}/>}</div>
      <div className="regional-tour-primary">
      <p className="regional-tour-caption" role="region" aria-label="Current step explanation" tabIndex={0} onFocus={revokePlayback} aria-live="polite" aria-atomic="true">{active?step.caption:tour.description}</p>
      {!ready&&<output aria-live="polite" aria-atomic="true">{resolved.error||retryError||accessNotice?.message|| (failed.length?'Some anatomy failed to load. Retry the missing anatomy to continue.':health==='failed'?'The 3D renderer could not start. Use the scene recovery controls below or Exit tour.':health==='lost'||health==='restoring'?'The 3D view is recovering. Playback remains paused until it is ready.':'Preparing the model. Playback is paused until all tour anatomy is ready.')}</output>}
      <div className="regional-tour-controls" ref={controls}>
        {retryPlan.length>0&&<Button variant="outline" disabled={retrying} onClick={retryAnatomy}>{retrying?'Retrying…':accessNotice?.retryLabel??'Retry missing anatomy'}</Button>}
        {!active?<>
          <Button data-tour-resume disabled={!ready} onClick={()=>{playbackEpoch.current++;setContinuous(true);setPlaying(!document.hidden&&!reduced);changeStep(0);if(document.hidden||reduced)setMotionPaused(true);}}>Play full tour</Button>
          <Button variant="outline" disabled={!ready} title="Manual step-by-step viewing" onClick={()=>{playbackEpoch.current++;setContinuous(false);setPlaying(false);changeStep(0);}}>Start guided tour</Button>
        </>:<>
          <Button variant="outline" disabled={!ready||index===0} onClick={()=>manualStep(index-1)}>Back</Button>
          <Button data-tour-resume variant="outline" disabled={!ready} aria-pressed={playing} onClick={()=>{pausedImaging?.suspend();if(playing)revokePlayback();else{setPlaying(true);setMotionPaused(false);}}}>{playing?'Pause':'Play'}</Button>
          <Button variant="outline" disabled={!ready} onClick={()=>index===tour.steps.length-1?exit():manualStep(index+1)}>{index===tour.steps.length-1?'Finish':'Next'}</Button>
        </>}
        <Button variant="ghost" onClick={exit}>Exit tour</Button>
      </div>
      </div>
      <details className="regional-tour-explanation" open={explanationOpen} onToggle={event=>{
        const open=event.currentTarget.open;setExplanationOpen(open);
        if(open)revokePlayback();
      }}>
      <summary>References, imaging & quick check · Draft</summary>
      <div className="regional-tour-resources" onFocusCapture={revokePlayback}>
      <details onToggle={event=>{if(event.currentTarget.open)revokePlayback();}}><summary>References & limits · Draft, review pending</summary>
        <p>{tour.limitations??'Selected exterior source surfaces in a common frame. Not a continuous airway lumen, complete bronchial tree or patient scan.'} Exit restores your previous workspace.</p>
        {step.references.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">Anatomy reference ↗</a>)}
      </details>
      {active&&selected&&<LazyBodyTeaching structure={selected} key={`teaching:${step.id}:${selected.id}`} enabled={explanationOpen}>
        {({bodyLesson}) => <>
      <TourImagingNotes key={`imaging:${step.id}`} structureName={selected.name}
        linkControl={<PausedTourImagingLink link={pausedImaging}/>}
        lessons={tourImagingModalities.map(({id,label})=>({id,label,content:bodyLesson(selected,id)}))}
        onOpen={revokePlayback}/>
      {active&&ready&&selected&&<TourQuickCheck key={`quiz:${step.id}`} lesson={bodyLesson(selected,'quiz')}
        onChange={open=>{pausedImaging?.suspend();setQuickCheckOpen(open);}}
        onOpen={revokePlayback}/>}
        </>}
      </LazyBodyTeaching>}
      </div>
      </details>
    </div>
    <div className="regional-tour-canvas">
      {!resolved.error&&<Scene key={scope.key} assetBase={assetBase} catalog={catalog} structures={resolved.structures} retries={retries}
        selectedId={step.selectedId} systems={allBodySystems} isolated={step.fadeOthers} hiddenIds={empty}
        ghostRemoved={false} illustrated landmarks={empty} explode={0} layout="spatial" anchorSkeleton={false}
        showOrigins={false} labels view={step.view} zoom={1} reset={index??0} focus={false} exam={false}
        inspection={initialInspection} presetBounds={resolved.frames[(scopeChanged?null:index)??0]} presetKey={tour.id} plate={false}
        tourLocked transitionMs={active&&!reduced?(continuous?GUIDED_SWEEP_MS:1800):0} transitionPaused={motionPaused||!ready}
        onSelect={noSelection} onLoaded={onLoaded} onFailure={onFailure} onRendererHealth={onHealth}/>}
    </div>
    <a className="regional-tour-credit" href={modelDeliveryUrl('/models/bodyparts3d/credits.html',assetBase)} target="_blank" rel="noreferrer">BodyParts3D · CC BY 4.0 · Adapted</a>
  </section>;
}
