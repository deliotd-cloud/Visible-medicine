'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Focus, RotateCcw, Tags, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/atlas-review/components/ui/button';
import { Switch } from '@/atlas-review/components/ui/switch';
import { Slider } from '@/atlas-review/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/atlas-review/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/atlas-review/components/ui/dialog';
import { BodyScene, retryBodyAssets } from './body-scene';
import { allBodySystems } from './body-types';
import { ExplodeStyleSelect } from './explode-style-select';
import { restoreSpecimenRemovalFocus, restoreSpecimenHistoryFocus, focusSpecimenSeparation } from './specimen-removal-focus';
import type { DissectionView } from './dissection-data';
import type { BodyLayout } from '@/atlas-review/lib/body-arrangement';
import { initialInspection } from '@/atlas-review/lib/inspection-state';
import { rendererReady, type RendererHealth } from '@/atlas-review/lib/renderer-health';
import { modelLoadAccessNotice, type ModelLoadFailure } from '@/atlas-review/lib/model-load-failure';
import { kneeTissueColours } from '@/atlas-review/lib/um-knee-study';
import { kneeDefinition } from '@/atlas-review/lib/um-limb-studies';
import { initialSpecimen, reduceSpecimen, activeSpecimenStudy, specimenAction, type SpecimenDefinition, type SpecimenAction, type SpecimenSurface } from '@/atlas-review/lib/independent-specimen';
import { SpecimenStructureSearch } from './specimen-structure-search';
import type { VentricularState } from '@/atlas-review/lib/ventricles';
import { createIdentification, type IdentificationState } from '@/atlas-review/lib/um-limb-teaching';
import { SpecimenLearning, SpecimenIdentification } from './um-limb-learning';
import { SpecimenStudyLink } from './specimen-study-link';
import { SpecimenMotorExplorer } from './um-limb-motor';
import { motorStudyAction, specimenMotorGroups } from '@/atlas-review/lib/um-limb-motor';
import type { ResolvedSpecimenNavigation } from '@/atlas-review/lib/um-limb-navigation';
import { specimenTarget, specimenChannelState, specimenFocusAllowed, createSpecimenLoadAttempt, type SpecimenTarget } from '@/atlas-review/lib/specimen-selection-channel';
import { useSpecimenSelectionChannel } from './specimen-selection-channel';
import type { SpecimenPracticeAdapter } from '@/atlas-review/lib/specimen-identification';
import { guidedDissectionAction, type SpecimenGuidedDissection } from '@/atlas-review/lib/specimen-guided-dissection';
import { guidedPlaybackDuration, guidedSweepDuration, isGuidedPlaybackRate, type GuidedPlaybackRate } from '@/atlas-review/lib/guided-playback';
import { TourSpeedControl } from './tour-speed-control';
import { umLimbGuidedDissection } from '@/atlas-review/lib/um-limb-guided-dissection';
import type { StudyCamera } from '@/atlas-review/lib/study-views';
import './eye-layers.css';
import './um-knee-study.css';

const cameraViews = ['anterior', 'posterior', 'right', 'left', 'superior', 'inferior'] as const;
const tissueGroups = [
  { id: 'skeleton', name: 'Bones' }, { id: 'cartilage', name: 'Cartilage' },
  { id: 'ligament', name: 'Ligaments' }, { id: 'meniscus', name: 'Menisci' },
  { id: 'tendon', name: 'Tendon' }, { id: 'muscle', name: 'Muscle' },
];

// Non-limb specimens reuse the dissection controls, never UM identity/teaching bindings.
export type SpecimenSupplement = {
  colors: Record<string, string>;
  tissueGroups?: ReadonlyArray<{ id: string; name: string; color: string }>;
  learning: (surface: SpecimenSurface, definition: SpecimenDefinition) => ReactNode;
  sourceDetails: ReactNode;
  identification?: SpecimenPracticeAdapter;
  studyLink?: (definition: SpecimenDefinition, selectedId: string, studyId: string | null, view: DissectionView) => ReactNode;
  studySupplement?: (definition: SpecimenDefinition, studyId: string | null) => ReactNode;
  guidedDissection?: (definition: SpecimenDefinition) => SpecimenGuidedDissection | null;
};
export function KneeSpecimenView({ specimen = kneeDefinition, initialNavigation, supplement, assetBase, studyLink, selectionChannelRevision }: { specimen?: SpecimenDefinition; initialNavigation?: Pick<ResolvedSpecimenNavigation, 'selectedId' | 'state' | 'structureOnly' | 'view' | 'topic'> & { focusSelection?: boolean }; supplement?: SpecimenSupplement; assetBase?: string; studyLink?: SpecimenSupplement['studyLink']; selectionChannelRevision?: string } = {}) {
  const kneeSpecimen = { structures: specimen.surfaces, source: specimen.source };
  const kneeCatalog = specimen.catalog, kneeStructures = kneeCatalog.structures, kneeSpecimenStudies = specimen.studies;
  const [state, dispatch] = useReducer((state: VentricularState, action: SpecimenAction) => reduceSpecimen(specimen, state, action), specimen, value => initialNavigation?.state ?? initialSpecimen(value));
  const { selectedId, hidden, history, future } = state;
  const [query, setQuery] = useState(''), [isolated, setIsolated] = useState(!!initialNavigation?.structureOnly);
  const [explode, setExplode] = useState(0), [layout, setLayout] = useState<BodyLayout>('extract');
  const [view, setView] = useState<DissectionView>(initialNavigation?.view ?? specimen.studies.find((s) => s.id === specimen.initialStudy)?.view ?? 'anterior'), [labels, setLabels] = useState(true);
  const [focus, setFocus] = useState(!!initialNavigation?.focusSelection || !!initialNavigation?.structureOnly), [jointCloseUp, setJointCloseUp] = useState(!!specimen.closeUp && !initialNavigation?.focusSelection);
  const [liveFocus, setLiveFocus] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false), [illustrated, setIllustrated] = useState(true);
  const [reset, setReset] = useState(0), [zoom, setZoom] = useState(1);
  const [zoomStep, setZoomStep] = useState(0);
  const [health, setHealth] = useState<RendererHealth>('starting');
  const healthNow = useRef<RendererHealth>('starting');
  const [practice, setPractice] = useState<IdentificationState | null>(null);
  const guide = useMemo(() => supplement === undefined
    ? umLimbGuidedDissection(specimen) : supplement?.guidedDissection?.(specimen) ?? null, [supplement, specimen]);
  const cameraCapture = useRef<StudyCamera | null>(null), cameraRestore = useRef<StudyCamera | null>(null);
  const guideLauncher = useRef<HTMLButtonElement | null>(null), manualGuideLauncher = useRef<HTMLButtonElement | null>(null);
  const lastGuideLauncher = useRef<'full' | 'manual'>('manual'), restoreGuideFocus = useRef(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true), [pageHidden, setPageHidden] = useState(false);
  const pageHiddenNow = useRef(false);
  const [guidance, setGuidance] = useState<{
    id: string; index: number;
    before: { state: VentricularState; query: string; isolated: boolean; explode: number; layout: BodyLayout;
      view: DissectionView; labels: boolean; focus: boolean; jointCloseUp: boolean; showOrigins: boolean;
      illustrated: boolean; zoom: number; zoomStep: number; camera: StudyCamera | null };
  } | null>(null);
  const [fullTour, setFullTour] = useState(false), [tourPlaying, setTourPlaying] = useState(false);
  const [tourRate, setTourRate] = useState<GuidedPlaybackRate>(1);
  const [tourMotionPaused, setTourMotionPaused] = useState(false);
  const playbackEpoch = useRef(0);
  const playbackOwner = useRef<{ guide: typeof guide; specimen: typeof specimen; guidance: typeof guidance;
    ready: boolean; hidden: boolean; playing: boolean; fullTour: boolean } | null>(null);
  const pauseTour = useCallback(() => {
    playbackEpoch.current++;
    setTourPlaying(false);
    setTourMotionPaused(true);
  }, []);
  const changeTourRate = (rate: GuidedPlaybackRate) => {
    if (!isGuidedPlaybackRate(rate) || rate === tourRate) return;
    playbackEpoch.current++;
    setTourRate(rate);
  };
  useEffect(() => {
    // Conservative SSR default; no sweep until the actual device preference is known.
    if (!guide && !selectionChannelRevision) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { setReducedMotion(preference.matches); if (preference.matches) pauseTour(); };
    const visibility = () => { pageHiddenNow.current = document.hidden; setPageHidden(document.hidden); if (document.hidden) pauseTour(); };
    const leaving = () => { pageHiddenNow.current = true; setPageHidden(true); pauseTour(); };
    motion(); visibility();
    preference.addEventListener('change', motion); document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', leaving);
    window.addEventListener('pageshow', visibility);
    return () => { preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', leaving);
      window.removeEventListener('pageshow', visibility); };
  }, [guide, selectionChannelRevision, pauseTour]);
  useLayoutEffect(() => {
    if (!guidance && restoreGuideFocus.current) {
      (lastGuideLauncher.current === 'full' ? guideLauncher : manualGuideLauncher).current?.focus();
      restoreGuideFocus.current = false;
    }
  }, [guidance]);
  const practiceLauncher = useRef<HTMLButtonElement | null>(null);
  const restorePracticeFocus = useRef(false);
  const removalFocusOrigin = useRef<HTMLButtonElement | null>(null);
  const undoButton = useRef<HTMLButtonElement | null>(null);
  const redoButton = useRef<HTMLButtonElement | null>(null);
  const historyFocusOrigin = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    const trigger = removalFocusOrigin.current;
    removalFocusOrigin.current = null;
    restoreSpecimenRemovalFocus(trigger, undoButton.current);
    const historyTrigger = historyFocusOrigin.current;
    historyFocusOrigin.current = null;
    restoreSpecimenHistoryFocus(historyTrigger,
      historyTrigger === undoButton.current ? redoButton.current : undoButton.current);
  }, [state]);
  const [loaded, setLoaded] = useState<string[]>([]), [failed, setFailed] = useState<string[]>([]), [retry, setRetry] = useState(0);
  const loadAttempt = useMemo(()=>createSpecimenLoadAttempt(),[]);
  const loadFailureNow = useRef(false);
  useLayoutEffect(() => { loadAttempt.commit(retry); }, [loadAttempt,retry]);
  const [failureReasons, setFailureReasons] = useState<Record<string, ModelLoadFailure>>({});
  const onLoaded = useCallback((id: string) => {
    if (!loadAttempt.accepts(retry)) return;
    setLoaded((p) => p.includes(id) ? p : [...p, id]); setFailed((p) => p.filter((v) => v !== id));
    setFailureReasons(p => { const next = {...p}; delete next[id]; return next; });
  }, [loadAttempt,retry]);
  const onFailure = useCallback((id: string, reason: ModelLoadFailure = 'unavailable') => {
    if (!loadAttempt.accepts(retry)) return;
    pauseTour();
    loadFailureNow.current = true;
    setFailed((p) => p.includes(id) ? p : [...p, id]);
    setFailureReasons(p => ({...p, [id]: reason}));
  }, [loadAttempt,retry,pauseTour]);
  const selected = kneeSpecimen.structures.find((s) => s.id === selectedId);
  const active = activeSpecimenStudy(specimen, hidden);
  const closeUpBounds = (guidance ? guide?.steps[guidance.index]?.cameraBounds : null)
    ?? (jointCloseUp && !focus && explode === 0 && !isolated ? specimen.closeUp : null);
  const visible = kneeStructures.filter((s) => !hidden.includes(s.id));
  const required = kneeCatalog.bundles.filter((b) => visible.some((s) => s.bundle === b.id));
  const pending = required.filter((b) => !loaded.includes(b.id) && !failed.includes(b.id));
  const errors = required.filter((b) => failed.includes(b.id));
  const accessNotice = modelLoadAccessNotice(errors.map(b => failureReasons[b.id] ?? 'unavailable'));
  const ready = required.length > 0 && !pending.length && !errors.length && rendererReady(health);
  const guideBundles = useMemo(() => [...new Set(guide?.steps.flatMap(step => step.ids.map(id =>
    kneeStructures.find(surface => surface.id === id)?.bundle).filter((id): id is string => !!id)) ?? [])],
    [guide, kneeStructures]);
  const fullReady = ready && guideBundles.every(id => loaded.includes(id) && !failed.includes(id));
  useLayoutEffect(() => { playbackOwner.current = {guide, specimen, guidance, ready,
    hidden: pageHidden, playing: tourPlaying, fullTour}; });
  useEffect(() => {
    if (!fullTour || !tourPlaying || !guidance || guidance.id !== guide?.id || !fullReady || pageHidden || document.hidden) return;
    let active = true;
    const epoch = playbackEpoch.current, index = guidance.index;
    const timer = window.setTimeout(() => {
      const owner = playbackOwner.current;
      if (!active || epoch !== playbackEpoch.current || document.hidden || !owner ||
        owner.guide !== guide || owner.specimen !== specimen || owner.guidance !== guidance ||
        !owner.ready || owner.hidden || !owner.playing || !owner.fullTour) return;
      if (index + 1 < guide.steps.length) guideStep(index + 1);
      else pauseTour();
    }, guidedPlaybackDuration(guide.steps[index].caption, 0, tourRate));
    return () => { active = false; window.clearTimeout(timer); };
  }, [fullTour, tourPlaying, guidance, guide, specimen, fullReady, pageHidden, tourRate, pauseTour]);
  useEffect(() => { if (fullTour && (!fullReady || pageHidden || guidance?.id !== guide?.id)) pauseTour(); },
    [fullTour, fullReady, pageHidden, guidance?.id, guide?.id, pauseTour]);
  useEffect(() => () => { playbackEpoch.current++; playbackOwner.current = null; }, []);
  const currentTarget = selectionChannelRevision && selectedId && !hidden.includes(selectedId)
    ? specimenTarget(specimen, selectedId, view) : null;
  const channelState = specimenChannelState({practice:!!practice,guided:!!guidance,ready,
    hidden:pageHidden || (typeof document !== 'undefined' && document.hidden),target:currentTarget});
  useSpecimenSelectionChannel(selectionChannelRevision, channelState, (target:SpecimenTarget) => {
    if (loadAttempt.pending() || loadFailureNow.current || !rendererReady(healthNow.current) || !specimenFocusAllowed(specimen,{current:currentTarget,requested:target,view,hiddenIds:hidden,
      loadedBundles:loaded,failedBundles:failed,practice:!!practice,guided:!!guidance,ready,
      pageHidden:pageHidden||pageHiddenNow.current||document.hidden}))return false;
    dispatch({type:'select',id:target.id}); setFocus(true); setJointCloseUp(false); setLiveFocus(true);
    return true;
  },()=>!loadAttempt.pending()&&!loadFailureNow.current&&rendererReady(healthNow.current)&&
    !pageHiddenNow.current&&!document.hidden);
  const practiceAdapter = supplement?.identification;
  const practiceCount = practiceAdapter ? practiceAdapter.eligibleIds(specimen, visible.map(s => s.id)).length : supplement ? 0 : visible.length;
  useEffect(() => { if (ready && !practice && restorePracticeFocus.current) { practiceLauncher.current?.focus(); restorePracticeFocus.current = false; } }, [ready, practice]);
  const appearance = useMemo(() => Object.fromEntries(specimen.surfaces.map((s) => [s.id, { color: supplement?.colors[s.id] ?? kneeTissueColours[s.tissue], opacity: 1 }])), [specimen, supplement]);
  function assembledDisplay() {
    setExplode(0); setIsolated(false); setFocus(false); setLiveFocus(false); setZoom(1); setReset((n) => n + 1);
  }
  function preset(value: string) {
    if (guidance) return;
    const action = specimenAction(specimen, value);
    if (!action) return;
    dispatch(action); assembledDisplay();
    setView(kneeSpecimenStudies.find((s) => s.id === value)!.view);
  }
  function select(id: string) { if (guidance) return; dispatch({ type: 'select', id }); setFocus(false); setLiveFocus(false); }
  function historyStep(type: 'undo' | 'redo', trigger?: HTMLButtonElement) {
    if (guidance) return;
    if (trigger && trigger.ownerDocument.activeElement === trigger) historyFocusOrigin.current = trigger;
    dispatch({ type }); assembledDisplay();
  }
  function showAll() {
    if (guidance) return;
    const all = kneeSpecimenStudies.find((s) => s.id === 'all');
    const target = all?.selectedId ?? kneeStructures[0]?.id;
    if (!target) return;
    dispatch({ type: 'show-only', ids: kneeStructures.map((s) => s.id), selectedId: target });
    assembledDisplay(); setView(all?.view ?? 'anterior');
  }
  function resetAll() {
    showAll(); setQuery(''); setLayout('extract'); setJointCloseUp(!!specimen.closeUp);
    setLabels(true); setShowOrigins(false); setIllustrated(true);
  }
  function guideStep(index: number) {
    if (!guide || !ready || pageHidden || document.hidden) return;
    const action = guidedDissectionAction(specimen, guide, index);
    if (!action) return;
    if (!guidance) {
      setGuidance({ id: guide.id, index, before: structuredClone({ state, query, isolated, explode, layout,
        view, labels, focus, jointCloseUp, showOrigins, illustrated, zoom, zoomStep, camera: cameraCapture.current }) });
    } else {
      if (guidance.id !== guide.id) return;
      setGuidance({ ...guidance, index });
    }
    dispatch(action); assembledDisplay(); setView(guide.steps[index].view);
    setJointCloseUp(!!specimen.closeUp); setLayout('spatial'); setLabels(true);
    setQuery(''); setShowOrigins(false); setIllustrated(true); setZoomStep(0); setGuideExpanded(true);
  }
  function manualGuideStep(index: number) {
    pauseTour(); setFullTour(false); setTourMotionPaused(false);
    guideStep(index);
  }
  function exitGuide() {
    if (!guidance) return;
    pauseTour(); setFullTour(false);
    const before = guidance.before;
    cameraRestore.current = structuredClone(before.camera);
    dispatch({ type: 'restore-state', state: before.state });
    setQuery(before.query); setIsolated(before.isolated); setExplode(before.explode); setLayout(before.layout);
    setView(before.view); setLabels(before.labels); setFocus(before.focus); setJointCloseUp(before.jointCloseUp);
    setShowOrigins(before.showOrigins); setIllustrated(before.illustrated); setZoom(before.zoom); setZoomStep(before.zoomStep);
    setReset(n => n + 1); restoreGuideFocus.current = true; setGuidance(null);
  }
  if (practice) return <SpecimenIdentification assetBase={assetBase} definition={specimen} initial={practice} visibleIds={visible.map(s => s.id)} initialView={view} adapter={practiceAdapter}
    onClose={() => { restorePracticeFocus.current = true; setHealth('starting'); setPractice(null); }} />;
  return <div className="eye-layer-workbench um-knee-workbench">
    <section className="um-knee-image" aria-label={`Independent ${specimen.label.toLowerCase()} 3D specimen`}>
      <div className="um-knee-camera-tools">
        <Select disabled={!!guidance} value={view} items={cameraViews.map(v => ({ value:v, label:v[0].toUpperCase()+v.slice(1) }))} onValueChange={(v) => { if (!guidance && cameraViews.includes(v as DissectionView)) setView(v as DissectionView); }}>
          <SelectTrigger aria-label={`${specimen.label} camera direction`}><SelectValue /></SelectTrigger>
          <SelectContent>{cameraViews.map((v) => <SelectItem key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={!!guidance} onClick={() => { if (!guidance) setZoomStep(s => s - 1); }} aria-label="Zoom out">−</Button>
        <Button variant="outline" size="sm" disabled={!!guidance} onClick={() => { if (!guidance) setZoomStep(s => s + 1); }} aria-label="Zoom in">+</Button>
        <Button variant="outline" size="sm" disabled={!!guidance} aria-pressed={labels} onClick={() => { if (!guidance) setLabels((v) => !v); }}><Tags />Labels</Button>
        <Button variant="outline" size="sm" disabled={!!guidance} onClick={resetAll}><RotateCcw />Reset</Button>
        {(!supplement || practiceAdapter) && <Button ref={practiceLauncher} variant="outline" size="sm" disabled={!!guidance || !ready || practiceCount < 2} onClick={() => { if (!guidance) setPractice((practiceAdapter?.createRound ?? createIdentification)(specimen, visible.map(s => s.id))); }}>Practise identification</Button>}
      </div>
      <div className="eye-layer-viewport">
        <BodyScene assetBase={assetBase} catalog={kneeCatalog} structures={kneeStructures} loadBundleIds={guideBundles} selectedId={selectedId}
          systems={allBodySystems} isolated={isolated && !!selected} hiddenIds={hidden} ghostRemoved={false}
          illustrated={illustrated} landmarks={visible.filter((s) => s.system !== 'skeleton').map((s) => s.id)}
          explode={explode} layout={layout} anchorSkeleton={false} showOrigins={showOrigins} originStyle="selected-guide"
          labels={labels} view={view} zoom={zoom} zoomStep={zoomStep} reset={reset} focus={focus} exam={false}
          inspection={initialInspection} cameraBounds={closeUpBounds}
          cameraCapture={cameraCapture} cameraRestore={cameraRestore}
          guidedRecovery={!!guidance} transitionMs={(guidance || (selectionChannelRevision && liveFocus)) && !reducedMotion ? guidance && fullTour ? guidedSweepDuration(tourRate) : 1800 : 0} transitionPaused={(!!guidance && tourMotionPaused) || (!!(guidance || liveFocus) && (!ready || pageHidden))}
          plate={false} appearance={appearance} retries={Object.fromEntries(kneeCatalog.bundles.map((b) => [b.id, retry]))}
          onSelect={select} onLoaded={onLoaded} onFailure={onFailure} onRendererHealth={value=>{if(value!=='ready')pauseTour();healthNow.current=value;setHealth(value);}} />
        {!!pending.length && !errors.length && <output className="eye-layer-status">Loading {specimen.label.toLowerCase()} specimen… ({required.length - pending.length}/{required.length} groups)</output>}
        {(!!errors.length || !!guide && guideBundles.some(id => failed.includes(id))) && <div className="eye-layer-status" role="alert">{accessNotice?.message ?? 'Some guided specimen tissues could not load.'} <Button size="sm" onClick={() => {
          pauseTour();
          loadAttempt.retire();
          retryBodyAssets(kneeCatalog.bundles.map((b) => b.url), assetBase); loadFailureNow.current=false; setLoaded([]); setFailed([]); setFailureReasons({}); setRetry((n) => n + 1);
        }}>{accessNotice?.retryLabel ?? 'Retry'}</Button></div>}
        {!visible.length && <div className="eye-layer-status">All tissues are hidden. <Button size="sm" onClick={showAll}>Show all</Button></div>}
      </div>
      <p className="um-knee-scene-caption">{explode > 0 ? supplement ? 'Separated teaching view — not tissue motion or a surgical plane. Return to 0% for source positions.' : 'Separated teaching view — not joint motion. Return to 0% for source positions.' : closeUpBounds ? 'Source positions · Regional close-up · Long structures continue beyond this view. Drag to rotate; scroll or pinch to zoom.' : 'Source positions · Drag to rotate · Scroll or pinch to zoom'}</p>
    </section>
    <aside className="eye-layer-controls um-knee-controls" aria-label={`${specimen.label} specimen controls`}>
      {guide && <details className="um-knee-details um-specimen-guided-learning" open={guideExpanded}
        onToggle={event => { if (!event.currentTarget.open) pauseTour(); if (!guidance) setGuideExpanded(event.currentTarget.open); }}>
        <summary>Guided learning</summary>
        <TourSpeedControl rate={tourRate} onRateChange={changeTourRate} />
        {guidance ? <section aria-label="Guided dissection" aria-live="polite">
          <p className="um-knee-label">Step {guidance.index + 1} of {guide.steps.length} · Draft</p>
          <h3>{guide.steps[guidance.index].title}</h3>
          <p tabIndex={0} onFocus={pauseTour}>{guide.steps[guidance.index].caption}</p>
          <div className="eye-layer-actions">
            {fullTour && <Button size="sm" variant="outline" disabled={!fullReady || pageHidden}
              aria-pressed={tourPlaying} onClick={() => { if (tourPlaying) pauseTour(); else { setTourMotionPaused(false); setTourPlaying(true); } }}>
              {tourPlaying ? 'Pause full tour' : 'Resume full tour'}</Button>}
            <Button size="sm" variant="outline" disabled={!ready || pageHidden || guidance.index === 0} onClick={() => manualGuideStep(guidance.index - 1)}>Previous</Button>
            {guidance.index < guide.steps.length - 1
              ? <Button size="sm" disabled={!ready || pageHidden} onClick={() => manualGuideStep(guidance.index + 1)}>Next</Button>
              : <Button size="sm" onClick={exitGuide}>Finish</Button>}
            <Button size="sm" variant="ghost" onClick={exitGuide}>Exit guided dissection</Button>
          </div>
          <p>{!ready ? 'Rendering unavailable — progression paused. You can still exit.' : 'Drag to rotate and inspect. Exit restores your previous view and dissection history.'}</p>
        </section> : <>
          <p>{guide.title} · {guide.steps.length} source-visibility steps · Draft</p>
          <Button ref={guideLauncher} size="sm" disabled={!fullReady || pageHidden} onClick={() => {
            lastGuideLauncher.current = 'full'; playbackEpoch.current++; setFullTour(true); setTourPlaying(!reducedMotion); guideStep(0);
            if (reducedMotion) setTourMotionPaused(true); else setTourMotionPaused(false);
          }}>Play full tour</Button>
          <Button ref={manualGuideLauncher} size="sm" variant="outline" disabled={!ready || pageHidden} onClick={() => {
            lastGuideLauncher.current = 'manual'; playbackEpoch.current++; setFullTour(false); setTourPlaying(false); setTourMotionPaused(false); guideStep(0);
          }}>Start guided dissection</Button>
        </>}
        <details onToggle={event => { if (event.currentTarget.open) pauseTour(); }}><summary>Source limits</summary><p>{guide.limitation}</p></details>
      </details>}
      <fieldset className="um-specimen-manual-controls" disabled={!!guidance} inert={!!guidance}>
      <legend className="sr-only">Manual dissection controls{guidance ? ' — exit guided learning to change tissues' : ''}</legend>
      <label className="um-knee-label" htmlFor="um-knee-study">Study</label>
      <Select disabled={!!guidance} value={active?.id ?? 'custom'} items={[{value:'custom',label:'Custom dissection'},...kneeSpecimenStudies.map(s=>({value:s.id,label:s.title}))]} onValueChange={(v) => { if (v) preset(v); }}>
        <SelectTrigger id="um-knee-study" aria-label={`${specimen.label} dissection study`}><SelectValue /></SelectTrigger>
        <SelectContent>
          {/* Keep registered option indices stable as Undo enters/leaves a custom view. */}
          <SelectItem value="custom" disabled>Custom dissection</SelectItem>
          {kneeSpecimenStudies.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="um-knee-guide">{active?.note ?? 'Your custom tissue selection. Undo restores the previous dissection step.'}</p>
      {supplement?.studySupplement?.(specimen, active?.id ?? null)}
      <div className="eye-layer-actions">
        <Button ref={undoButton} size="sm" variant="outline" disabled={!!guidance || !history.length} onClick={(event) => historyStep('undo', event.currentTarget)}><Undo2 />Undo</Button>
        <Button ref={redoButton} size="sm" variant="outline" disabled={!!guidance || !future.length} onClick={(event) => historyStep('redo', event.currentTarget)}><Redo2 />Redo</Button>
        <span aria-live="polite">{visible.length}/{kneeStructures.length} visible</span>
      </div>
      {!supplement && <SpecimenMotorExplorer definition={specimen} selectedId={selectedId} disabled={!!guidance} onSelect={select} onExplore={nerve => {
        if (guidance) return;
        const action = motorStudyAction(specimen, nerve), group = specimenMotorGroups(specimen).find(g => g.key === nerve);
        if (!action || !group) return;
        dispatch(action); assembledDisplay(); setQuery(''); setJointCloseUp(false); setView(group.view);
      }} />}
      </fieldset>
      <section className="um-knee-selection" aria-label="Selected specimen structure" onFocusCapture={pauseTour}>
        <h3>{selected?.name ?? 'Select a structure'}</h3>
        {selected && <>
          <p>{selected.coverageNote ?? (selected.tissue === 'skeleton' ? 'Whole source bone; close-up does not divide the bone.' : selected.slug === 'meniscus-group' || selected.slug === 'tibial-cartilage' ? 'Grouped source surface. Medial and lateral components are not separately selectable.' : 'Source-segmented surface from this independent right-limb specimen.')}</p>
          {selected.sourceQuality && (selected.sourceQuality.components > 1 || selected.sourceQuality.nonManifoldEdges > 0) && <p className="um-source-caution">Source contains {selected.sourceQuality.components > 1 ? 'disconnected parts' : 'edge contacts'}{selected.sourceQuality.components > 1 && selected.sourceQuality.nonManifoldEdges > 0 ? ' and edge contacts' : ''}. These are retained, not reconstructed or separately named; geometry review is pending.</p>}
          <div className="eye-layer-actions">
            <Button size="sm" variant="outline" disabled={!!guidance} aria-pressed={isolated} onClick={() => { if (!guidance) { setIsolated((v) => !v); setFocus(false); } }}>{isolated ? 'Show others' : 'Fade others'}</Button>
            <Button size="sm" variant="outline" disabled={!!guidance || !ready} onClick={() => { if (!guidance) { setFocus(true); setReset((n) => n + 1); } }}><Focus />Frame</Button>
            <Button size="sm" variant="outline" disabled={!!guidance} onClick={(event) => {
              if (guidance) return;
              if (event.currentTarget.ownerDocument.activeElement === event.currentTarget)
                removalFocusOrigin.current = event.currentTarget;
              dispatch({ type: 'visibility', id: selected.id, visible: false }); setFocus(false);
            }}>Set aside</Button>
          </div>
          {supplement ? <>{supplement.learning(selected, specimen)}{supplement.studyLink?.(specimen,selected.id,active?.id ?? null,view)}</> : <>
            <SpecimenLearning definition={specimen} selected={selected} initialTopic={selected.id === initialNavigation?.selectedId ? initialNavigation.topic : null} />
            {studyLink ? studyLink(specimen, selected.id, active?.id ?? null, view) : <SpecimenStudyLink key={`${selected.id}:${active?.id ?? 'custom'}:${view}`} definition={specimen} selectedId={selected.id} studyId={active?.id ?? null} view={view} />}
          </>}
        </>}
      </section>
      <fieldset className="um-specimen-manual-controls" disabled={!!guidance} inert={!!guidance}>
      <legend className="sr-only">Tissue visibility and display controls</legend>
      <div className="um-knee-separation">
        <label className="um-knee-label">Separation <output>{explode}%</output></label>
        <ExplodeStyleSelect value={layout} disabled={!!guidance} onChange={(next) => { if (!guidance) { setLayout(next); setFocus(false); } }} />
        <Slider value={[explode]} min={0} max={100} step={5} disabled={!!guidance || !ready || !visible.length || (layout === 'extract' && !selected)}
          aria-valuetext={`${explode}%`}
          onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (!guidance && Number.isFinite(n)) { setExplode(n); setFocus(false); } }} aria-label={`${specimen.label} tissue separation`} />
        {explode > 0 && <Button size="sm" variant="ghost" disabled={!!guidance} onClick={(event) => { if (guidance) return; focusSpecimenSeparation(event.currentTarget); setExplode(0); }}>Return to source positions</Button>}
      </div>
      <details className="um-knee-details" open>
        <summary>Tissues & search</summary>
        <div className="um-knee-groups">{(supplement?.tissueGroups ?? tissueGroups).filter((group) => kneeSpecimen.structures.some((s) => s.tissue === group.id)).map((group) => {
          const members = kneeSpecimen.structures.filter((s) => s.tissue === group.id);
          const count = members.filter((s) => !hidden.includes(s.id)).length;
          return <label key={group.id}><span style={{ color: 'color' in group ? group.color as string : kneeTissueColours[group.id] }}>●</span>{group.name}<small>{count}/{members.length}</small>
            <Switch checked={count > 0} disabled={!!guidance} aria-label={`Show ${specimen.label.toLowerCase()} ${group.name.toLowerCase()}`} onCheckedChange={(checked) => {
              if (guidance) return;
              // One atomic history step for the entire group, not one per surface.
              dispatch({ type: 'group', tissue: group.id, visible: checked }); setFocus(false);
            }} /></label>;
        })}</div>
        <SpecimenStructureSearch specimen={specimen} query={query} onQueryChange={next => { if (!guidance) setQuery(next); }}
          selectedId={selectedId} hidden={hidden} onSelect={select}
          onVisibility={(id, visible) => { if (!guidance) { dispatch({ type: 'visibility', id, visible }); setFocus(false); } }} />
      </details>
      <details className="um-knee-details"><summary>Display options</summary>
        {specimen.closeUp && <><label className="um-knee-toggle">Regional close-up<Switch checked={jointCloseUp} disabled={!!guidance} onCheckedChange={(v) => { if (guidance) return; setJointCloseUp(v); setFocus(false); }} /></label>
        <p>Turn off for the full visible model. Close-up pauses while separated, fading others or framing a selected structure; geometry is unchanged.</p></>}
        <label className="um-knee-toggle">Illustrated surfaces<Switch checked={illustrated} disabled={!!guidance} onCheckedChange={v => { if (!guidance) setIllustrated(v); }} /></label>
        <label className="um-knee-toggle">Selected origin guide<Switch checked={showOrigins} onCheckedChange={v => { if (!guidance) setShowOrigins(v); }} disabled={!!guidance || layout === 'tray'} /></label>
      </details>
      </fieldset>
      <details className="um-knee-details" onToggle={event => { if (event.currentTarget.open) pauseTour(); }} onFocusCapture={pauseTour}><summary>Source & limitations</summary>
        {supplement ? supplement.sourceDetails : <>
        <p>{kneeSpecimen.source.credit}</p>
        <a href="https://researchdata.um.edu.my/dataset.xhtml?persistentId=doi:10.22452/RD/5T6TZ7" target="_blank" rel="noreferrer">Source dataset · CC0 1.0</a>
        <p>Different subject from the body atlas; no registration, mirrored opposite limb, scan synchronisation or clinical approval. {specimen.limitations}</p>
        <p>{specimen.omittedFaces} exactly zero-area source triangles are omitted from this view’s surfaces. Original files and the omission record are retained. Shapes are not sculpted or fitted to the other body model.</p>
        {selected && <p className="um-knee-source-id">{selected.id}<br />Ontology mapping: pending.</p>}
        <p>Source-bound anatomy and function drafts are available under Learn, with clinical, pathology and partial imaging-topic teaching. All remain subject to clinical review; grouped entries and missing topics are identified. No scan or paid lecture is unlocked by this view.</p>
        </>}
      </details>
    </aside>
  </div>;
}

export default function KneeSpecimenDialog({ onClose }: { onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="eye-layers-dialog um-knee-dialog" showCloseButton={false}>
      <div className="eye-layer-heading">
        <div><DialogTitle>Right knee · independent specimen</DialogTitle>
          <DialogDescription>15 source surfaces · Clinical validation pending · Not registered to the body atlas</DialogDescription></div>
        <Button variant="outline" size="sm" onClick={onClose}><ArrowLeft />Back to atlas</Button>
      </div>
      <KneeSpecimenView />
    </DialogContent>
  </Dialog>;
}
