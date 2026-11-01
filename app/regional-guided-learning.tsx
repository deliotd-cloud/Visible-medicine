'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {Button} from '@/components/ui/button';
import {allBodySystems,type BodyCatalog} from './body-types';
import {regionalTourResolvedFrames,type RegionalTour} from '@/lib/regional-tours';
import {guidedSweepDuration,guidedPlaybackDuration,isGuidedPlaybackRate,type GuidedPlaybackRate} from '@/lib/guided-playback';
import {TourSpeedControl} from './tour-speed-control';
import {initialInspection} from '@/lib/inspection-state';
import {rendererReady,type RendererHealth} from '@/lib/renderer-health';
import {modelDeliveryUrl} from '@/lib/model-delivery';
import {anatomyRetryPlan} from '@/lib/anatomy-load-retry';
import {modelLoadAccessNotice,type ModelLoadFailure} from '@/lib/model-load-failure';
import {LazyBodyTeaching} from './lazy-body-teaching';
import {TourImagingNotes,tourImagingModalities} from './tour-imaging-notes';
import {TourQuickCheck} from './tour-quick-check';
import {TourStepPicker} from './tour-step-picker';
import {TourReadingNotes} from './tour-reading-notes';
import {PausedTourImagingLink} from './paused-tour-imaging-link';
import type {PausedTourImaging} from '@/lib/paused-tour-imaging';
import {tourExploreRequest,type TourExploreRequest} from '@/lib/tour-explore';
import './regional-guided-learning.css';
const Scene=dynamic(()=>import('./body-scene').then(m=>m.BodyScene),{ssr:false});
const empty:string[]=[];
const noSelection=()=>{};

export function RegionalGuidedLearning({catalog,tour,assetBase,onExit,onExplore,pausedImaging,pauseRequest=0,initialStep}:{catalog:BodyCatalog;tour:RegionalTour;assetBase?:string;onExit:()=>void;onExplore?:(request:TourExploreRequest)=>void;pausedImaging?:PausedTourImaging;pauseRequest?:number;initialStep?:number}) {
  const resolved=useMemo(()=>{try{return {...regionalTourResolvedFrames(catalog,tour),error:''};}catch{return {structures:[],frames:[],error:'This tour is unavailable for the current anatomy source.'};}},[catalog,tour]);
  const validInitialStep=typeof initialStep==='number'&&Number.isInteger(initialStep)&&initialStep>=0&&initialStep<tour.steps.length&&!resolved.error?initialStep:null;
  const [initialSeedInvalid]=useState(initialStep!==undefined&&validInitialStep===null);
  const availabilityError=initialSeedInvalid?'This linked tour step is unavailable. Exit and choose the tour again.':resolved.error;
  const [index,setIndex]=useState<number|null>(validInitialStep),[playing,setPlaying]=useState(false);
  const [continuous,setContinuous]=useState(index!==null);
  const [entryPendingMotion,setEntryPendingMotion]=useState(index!==null);
  const [finished,setFinished]=useState(false);
  const [playbackRate,setPlaybackRate]=useState<GuidedPlaybackRate>(1);
  const [motionPaused,setMotionPaused]=useState(validInitialStep!==null),[reduced,setReduced]=useState(false);
  const [explanationOpen,setExplanationOpen]=useState(true);
  const [quickCheckOpen,setQuickCheckOpen]=useState(false);
  const [health,setHealth]=useState<RendererHealth>('starting');
  const [loaded,setLoaded]=useState<string[]>([]),[failed,setFailed]=useState<string[]>([]);
  const [failureReasons,setFailureReasons]=useState<Record<string,ModelLoadFailure>>({});
  const [retries,setRetries]=useState<Record<string,number>>({}),[retrying,setRetrying]=useState(false),[retryError,setRetryError]=useState('');
  const required=useMemo(()=>[...new Set(resolved.structures.map(s=>s.bundle))],[resolved]);
  const scopeSerial=useRef(0);
  const scope=useMemo(()=>({active:false,retired:false,pending:false,finished:false,queued:[] as Array<()=>void>,key:++scopeSerial.current}),[catalog,tour,assetBase]);
  const currentScope=useRef<typeof scope|null>(null);
  const [renderedScope,setRenderedScope]=useState(scope);
  const isCurrent=()=>scope.active&&currentScope.current===scope;
  const renderTicket={committed:false};
  const committedStep=useRef(index);
  // Children can retain a callback across ordinary rerenders of the same stop.
  // Admit those committed callbacks, not speculative renders or previous stops.
  const isCurrentAction=()=>isCurrent()&&renderTicket.committed&&committedStep.current===index;
  const controls=useRef<HTMLDivElement>(null);
  const returnRetryFocus=useRef(false);
  const retryFocusScope=useRef(scope);
  const playbackEpoch=useRef(0);
  const exploreConsumed=useRef(false);
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
  const scopeChanged=renderedScope!==scope;
  // Reset our own state before React commits children for a changed source.
  // A passive reset could discard the new scene's mount/load callbacks.
  if(scopeChanged){
    exploreConsumed.current=false;
    setRenderedScope(scope);
    setLoaded([]);setFailed([]);setFailureReasons({});setRetries({});setRetrying(false);setRetryError('');setHealth('starting');setIndex(null);setPlaying(false);setContinuous(false);setEntryPendingMotion(false);setFinished(false);setMotionPaused(true);setQuickCheckOpen(false);
  }
  useLayoutEffect(()=>{
    if(retryFocusScope.current!==scope){retryFocusScope.current=scope;returnRetryFocus.current=false;}
    scope.active=true;scope.retired=false;currentScope.current=scope;
    const queued=scope.queued.splice(0);for(const callback of queued)callback();
    return()=>{scope.active=false;scope.retired=true;scope.queued.length=0;if(currentScope.current===scope)currentScope.current=null;};
  },[scope]);
  useLayoutEffect(()=>{renderTicket.committed=true;committedStep.current=index;},[renderTicket,index]);
  const deliverScene=useCallback((callback:()=>void)=>{
    if(scope.retired)return;
    if(scope.active&&currentScope.current===scope)callback();
    else if(!scope.active)scope.queued.push(callback);
  },[scope]);
  const onLoaded=useCallback((id:string)=>{if(required.includes(id))deliverScene(()=>setLoaded(current=>current.includes(id)?current:[...current,id]));},[required,deliverScene]);
  const onFailure=useCallback((id:string,reason:ModelLoadFailure='unavailable')=>{if(required.includes(id))deliverScene(()=>{pausedImaging?.suspend();revokePlayback();setFailureReasons(current=>({...current,[id]:reason}));setFailed(current=>current.includes(id)?current:[...current,id]);});},[required,deliverScene,pausedImaging,revokePlayback]);
  const accessNotice=modelLoadAccessNotice(failed.map(id=>failureReasons[id]??'unavailable'));
  const retryPlan=anatomyRetryPlan(catalog.bundles,failed,required);
  async function retryAnatomy(event?:{currentTarget:HTMLButtonElement}) {
    if(!isCurrentAction()||scope.pending||!retryPlan.length)return;
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
  const sourceReady=!scopeChanged&&!availabilityError&&failed.length===0&&resolved.structures.every(s=>loaded.includes(s.bundle));
  const ready=sourceReady&&rendererReady(health);
  // Written work may outlive the renderer only after this exact stop was ready.
  // Source/access/load failures still remove it immediately; a different stop
  // or source scope cannot inherit either admission or the local answer.
  const writtenAdmission=useRef<{scope:typeof scope;index:number|null}|null>(null);
  const writtenCheckReady=sourceReady&&(ready||writtenAdmission.current?.scope===scope&&writtenAdmission.current.index===index);
  useLayoutEffect(()=>{
    writtenAdmission.current=ready?{scope,index}:sourceReady&&writtenAdmission.current?.scope===scope&&writtenAdmission.current.index===index?writtenAdmission.current:null;
  },[scope,index,sourceReady,ready]);
  useEffect(()=>{
    if(!ready||!returnRetryFocus.current)return;
    returnRetryFocus.current=false;
    // Removing the retry button drops focus to body. Do not steal it if the
    // learner has moved to Exit, notes or another control while loading.
    if(document.activeElement===document.body)controls.current?.querySelector<HTMLButtonElement>('[data-tour-resume]')?.focus({preventScroll:true});
  },[ready]);
  const step=tour.steps[(scopeChanged?null:index)??0];
  const stepDuration=continuous?guidedPlaybackDuration(step.caption,step.durationMs,playbackRate):Math.ceil(step.durationMs/playbackRate);
  const changePlaybackRate=(next:GuidedPlaybackRate)=>{
    if(!isCurrentAction()||!isGuidedPlaybackRate(next)||next===playbackRate)return;
    // Retire a queued old-speed callback immediately, before effect cleanup.
    playbackEpoch.current++;pausedImaging?.suspend();setPlaybackRate(next);
  };
  const changeStep=useCallback((next:number)=>{if(!isCurrent()||!Number.isInteger(next)||next<0||next>=tour.steps.length)return;pausedImaging?.suspend();setEntryPendingMotion(false);setIndex(next);setMotionPaused(false);setQuickCheckOpen(false);},[tour,pausedImaging,scope]);
  // Manual navigation invalidates the old timer without changing whether Play
  // was active; the next committed stop gets its own full-duration timeout.
  const manualStep=useCallback((next:number)=>{
    if(!isCurrentAction()||index===null||!Number.isInteger(next)||next<0||next>=tour.steps.length||next===index)return;
    playbackEpoch.current++;scope.finished=false;setFinished(false);changeStep(next);
  },[changeStep,index,tour.steps.length,scope,renderTicket]);
  useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{if(!isCurrent())return;
    if(q.matches){playbackEpoch.current++;pausedImaging?.suspend();setPlaying(false);setMotionPaused(true);}
    setReduced(q.matches);
  };update();q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[pausedImaging,scope]);
  // Keep mobile anatomy in view; the complete teaching remains one disclosure away.
  useEffect(()=>{setExplanationOpen(!window.matchMedia('(max-width: 600px)').matches);},[]);
  useEffect(()=>{const pause=()=>{if(!isCurrent())return;pausedImaging?.suspend();revokePlayback();};const visibility=()=>{if(document.hidden)pause();};if(!ready)pause();document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pause);return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pause);};},[ready,pausedImaging,revokePlayback,scope]);
  useEffect(()=>{if(!playing||index===null||!ready||document.hidden)return;
    let active=true;const epoch=playbackEpoch.current;
    const timer=window.setTimeout(()=>{if(!active||!scope.active||currentScope.current!==scope||epoch!==playbackEpoch.current||document.hidden)return;
      if(index+1<tour.steps.length)changeStep(index+1);else{revokePlayback();scope.finished=true;setFinished(true);}},stepDuration);
    return()=>{active=false;window.clearTimeout(timer);};
  },[playing,index,ready,stepDuration,playbackRate,tour,scope,changeStep,revokePlayback]);
  const active=!scopeChanged&&index!==null;
  const selected=resolved.structures.find(s=>s.id===step.selectedId);
  useLayoutEffect(()=>{
    pausedImaging?.setStop(active&&selected?{tourId:tour.id,revision:tour.revision,stepId:step.id,structureId:selected.id,sources:selected.sources}:null,
      active&&ready&&!playing&&motionPaused&&!quickCheckOpen&&!document.hidden);
  },[pausedImaging,active,selected,tour,step,ready,playing,motionPaused,quickCheckOpen]);
  useLayoutEffect(()=>()=>pausedImaging?.suspend(),[pausedImaging,scope]);
  const exit=()=>{if(!isCurrentAction())return;pausedImaging?.suspend();revokePlayback();onExit();};
  const explore=()=>{
    if(!onExplore||!isCurrentAction()||exploreConsumed.current||!active||!ready||playing||
      quickCheckOpen||document.hidden||index===null)return;
    const request=tourExploreRequest(catalog,tour,index);
    if(!request)return;
    exploreConsumed.current=true;
    pausedImaging?.suspend();revokePlayback();
    onExplore(request);
  };
  const revokeIfCurrent=()=>{if(isCurrentAction())revokePlayback();};
  const onHealth=useCallback((next:RendererHealth)=>{deliverScene(()=>{
    if(!rendererReady(next)){pausedImaging?.suspend();revokePlayback();}
    setHealth(next);
  });},[deliverScene,pausedImaging,revokePlayback]);
  useEffect(()=>{if(active)controls.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll:true});},[active]);
  return <section className="regional-tour" aria-label={tour.title}>
    <div className="regional-tour-panel">
      <div className="regional-tour-heading"><h2 aria-live="polite" aria-atomic="true">{active?step.title:tour.title}</h2>{active&&<TourStepPicker steps={tour.steps} index={index} ready={ready}
        onPause={revokeIfCurrent}
        onStep={next=>{if(ready)manualStep(next);}}/>}</div>
      <div className="regional-tour-primary">
      <p className="regional-tour-caption" role="region" aria-label="Current step explanation" tabIndex={0} onFocus={revokeIfCurrent} aria-live="polite" aria-atomic="true">{active?step.caption:tour.description}</p>
      {!ready&&<output aria-live="polite" aria-atomic="true">{availabilityError||retryError||accessNotice?.message|| (failed.length?'Some anatomy failed to load. Retry the missing anatomy to continue.':health==='failed'?'The 3D renderer could not start. Use the scene recovery controls below or Exit tour.':health==='lost'||health==='restoring'?'The 3D view is recovering. Playback remains paused until it is ready.':'Preparing the model. Playback is paused until all tour anatomy is ready.')}</output>}
      <div className="regional-tour-controls" ref={controls}>
        <TourSpeedControl rate={playbackRate} onRateChange={changePlaybackRate}/>
        {retryPlan.length>0&&<Button variant="outline" disabled={retrying} onClick={retryAnatomy}>{retrying?'Retrying…':accessNotice?.retryLabel??'Retry missing anatomy'}</Button>}
        {!active?<>
          <Button data-tour-resume disabled={!ready} onClick={()=>{if(!isCurrentAction())return;playbackEpoch.current++;scope.finished=false;setFinished(false);setContinuous(true);setPlaying(!document.hidden&&!reduced);changeStep(0);if(document.hidden||reduced)setMotionPaused(true);}}>Play full tour</Button>
          <Button variant="outline" disabled={!ready} title="Manual step-by-step viewing" onClick={()=>{if(!isCurrentAction())return;playbackEpoch.current++;scope.finished=false;setFinished(false);setContinuous(false);setPlaying(false);changeStep(0);}}>Start guided tour</Button>
        </>:<>
          <Button variant="outline" disabled={!ready||index===0} onClick={()=>manualStep(index-1)}>Back</Button>
          <Button data-tour-resume variant="outline" disabled={!ready} aria-pressed={playing} onClick={()=>{if(!isCurrentAction()||!ready||finished!==scope.finished)return;pausedImaging?.suspend();if(playing)revokePlayback();else if(finished){playbackEpoch.current++;scope.finished=false;setFinished(false);setContinuous(true);setPlaying(!document.hidden&&!reduced);changeStep(0);if(document.hidden||reduced)setMotionPaused(true);}else{setEntryPendingMotion(false);setPlaying(true);setMotionPaused(false);}}}>{playing?'Pause':finished?'Replay full tour':'Play'}</Button>
          <Button variant="outline" disabled={!ready} onClick={()=>index===tour.steps.length-1?exit():manualStep(index+1)}>{index===tour.steps.length-1?'Finish':'Next'}</Button>
        </>}
        {onExplore&&active&&ready&&!playing&&!quickCheckOpen&&
          <Button variant="outline" onClick={explore}>Explore this structure</Button>}
        <Button variant="ghost" onClick={exit}>Exit tour</Button>
      </div>
      </div>
      {!availabilityError&&<TourReadingNotes key={scope.key} tour={tour} onRead={()=>{
        if(!isCurrentAction())return;
        pausedImaging?.suspend();revokePlayback();
      }}/>}
      <details className="regional-tour-explanation" open={explanationOpen} onToggle={event=>{
        if(!isCurrentAction())return;
        const open=event.currentTarget.open;setExplanationOpen(open);
        if(open)revokePlayback();
      }}>
      <summary>References, imaging & quick check · Draft</summary>
      <div className="regional-tour-resources" onFocusCapture={revokeIfCurrent}>
      {!active&&<p className="regional-tour-start-hint">Choose Play full tour or Start guided tour to open each stop's notes. Imaging links and quick checks appear where available.</p>}
      <details onToggle={event=>{if(isCurrentAction()&&event.currentTarget.open)revokePlayback();}}><summary>References & limits · Draft, review pending</summary>
        <p>{tour.limitations??'Selected exterior source surfaces in a common frame. Not a continuous airway lumen, complete bronchial tree or patient scan.'} Exit restores your previous workspace.</p>
        {step.references.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">Anatomy reference ↗</a>)}
      </details>
      {active&&selected&&<LazyBodyTeaching structure={selected} key={`teaching:${step.id}:${selected.id}`} enabled={explanationOpen}>
        {({bodyLesson}) => <>
      <TourImagingNotes key={`imaging:${step.id}`} structureName={selected.name}
        linkControl={<PausedTourImagingLink link={pausedImaging}/>}
        lessons={tourImagingModalities.map(({id,label})=>({id,label,content:bodyLesson(selected,id)}))}
        onOpen={revokeIfCurrent}/>
      {active&&writtenCheckReady&&selected&&<TourQuickCheck key={`quiz:${scope.key}:${index}:${step.id}`} lesson={bodyLesson(selected,'quiz')}
        onChange={open=>{if(!isCurrentAction())return;pausedImaging?.suspend();setQuickCheckOpen(open);}}
        onOpen={revokeIfCurrent}/>}
        </>}
      </LazyBodyTeaching>}
      </div>
      </details>
    </div>
    <div className="regional-tour-canvas">
      {!availabilityError&&<Scene key={scope.key} assetBase={assetBase} catalog={catalog} structures={resolved.structures} retries={retries}
        selectedId={step.selectedId} systems={allBodySystems} isolated={step.fadeOthers} hiddenIds={empty}
        ghostRemoved={false} illustrated landmarks={empty} explode={0} layout="spatial" anchorSkeleton={false}
        showOrigins={false} labels view={step.view} zoom={1} reset={index??0} focus={false} exam={false}
        inspection={initialInspection} presetBounds={resolved.frames[(scopeChanged?null:index)??0]} presetKey={tour.id} plate={false}
        tourLocked transitionMs={active&&!reduced&&!entryPendingMotion?(continuous?guidedSweepDuration(playbackRate):1800):0} transitionPaused={motionPaused||!ready}
        onSelect={noSelection} onLoaded={onLoaded} onFailure={onFailure} onRendererHealth={onHealth}/>}
    </div>
    <a className="regional-tour-credit" href={modelDeliveryUrl('/models/bodyparts3d/credits.html',assetBase)} target="_blank" rel="noreferrer">BodyParts3D · CC BY 4.0 · Adapted</a>
  </section>;
}
