'use client';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Focus, RotateCcw, Tags, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { BodyScene, retryBodyAssets } from './body-scene';
import { allBodySystems } from './body-types';
import { ExplodeStyleSelect } from './explode-style-select';
import type { DissectionView } from './dissection-data';
import type { BodyLayout } from '@/lib/body-arrangement';
import { initialInspection } from '@/lib/inspection-state';
import { rendererReady, type RendererHealth } from '@/lib/renderer-health';
import { kneeTissueColours } from '@/lib/um-knee-study';
import { kneeDefinition } from '@/lib/um-limb-studies';
import { initialSpecimen, reduceSpecimen, activeSpecimenStudy, specimenAction, type SpecimenDefinition, type SpecimenAction, type SpecimenSurface } from '@/lib/independent-specimen';
import { SpecimenStructureSearch } from './specimen-structure-search';
import type { VentricularState } from '@/lib/ventricles';
import { createIdentification, type IdentificationState } from '@/lib/um-limb-teaching';
import { SpecimenLearning, SpecimenIdentification } from './um-limb-learning';
import { SpecimenStudyLink } from './specimen-study-link';
import { SpecimenMotorExplorer } from './um-limb-motor';
import { motorStudyAction, specimenMotorGroups } from '@/lib/um-limb-motor';
import type { ResolvedSpecimenNavigation } from '@/lib/um-limb-navigation';
import type { SpecimenPracticeAdapter } from '@/lib/specimen-identification';
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
};
export function KneeSpecimenView({ specimen = kneeDefinition, initialNavigation, supplement, assetBase }: { specimen?: SpecimenDefinition; initialNavigation?: Pick<ResolvedSpecimenNavigation, 'selectedId' | 'state' | 'structureOnly' | 'view' | 'topic'> & { focusSelection?: boolean }; supplement?: SpecimenSupplement; assetBase?: string } = {}) {
  const kneeSpecimen = { structures: specimen.surfaces, source: specimen.source };
  const kneeCatalog = specimen.catalog, kneeStructures = kneeCatalog.structures, kneeSpecimenStudies = specimen.studies;
  const [state, dispatch] = useReducer((state: VentricularState, action: SpecimenAction) => reduceSpecimen(specimen, state, action), specimen, value => initialNavigation?.state ?? initialSpecimen(value));
  const { selectedId, hidden, history, future } = state;
  const [query, setQuery] = useState(''), [isolated, setIsolated] = useState(!!initialNavigation?.structureOnly);
  const [explode, setExplode] = useState(0), [layout, setLayout] = useState<BodyLayout>('extract');
  const [view, setView] = useState<DissectionView>(initialNavigation?.view ?? specimen.studies.find((s) => s.id === specimen.initialStudy)?.view ?? 'anterior'), [labels, setLabels] = useState(true);
  const [focus, setFocus] = useState(!!initialNavigation?.focusSelection || !!initialNavigation?.structureOnly), [jointCloseUp, setJointCloseUp] = useState(!!specimen.closeUp && !initialNavigation?.focusSelection);
  const [showOrigins, setShowOrigins] = useState(false), [illustrated, setIllustrated] = useState(true);
  const [reset, setReset] = useState(0), [zoom, setZoom] = useState(1);
  const [health, setHealth] = useState<RendererHealth>('starting');
  const [practice, setPractice] = useState<IdentificationState | null>(null);
  const practiceLauncher = useRef<HTMLButtonElement | null>(null);
  const restorePracticeFocus = useRef(false);
  const [loaded, setLoaded] = useState<string[]>([]), [failed, setFailed] = useState<string[]>([]), [retry, setRetry] = useState(0);
  const onLoaded = useCallback((id: string) => { setLoaded((p) => p.includes(id) ? p : [...p, id]); setFailed((p) => p.filter((v) => v !== id)); }, []);
  const onFailure = useCallback((id: string) => setFailed((p) => p.includes(id) ? p : [...p, id]), []);
  const selected = kneeSpecimen.structures.find((s) => s.id === selectedId);
  const active = activeSpecimenStudy(specimen, hidden);
  const visible = kneeStructures.filter((s) => !hidden.includes(s.id));
  const required = kneeCatalog.bundles.filter((b) => visible.some((s) => s.bundle === b.id));
  const pending = required.filter((b) => !loaded.includes(b.id) && !failed.includes(b.id));
  const errors = required.filter((b) => failed.includes(b.id));
  const ready = required.length > 0 && !pending.length && !errors.length && rendererReady(health);
  const practiceAdapter = supplement?.identification;
  const practiceCount = practiceAdapter ? practiceAdapter.eligibleIds(specimen, visible.map(s => s.id)).length : supplement ? 0 : visible.length;
  useEffect(() => { if (ready && !practice && restorePracticeFocus.current) { practiceLauncher.current?.focus(); restorePracticeFocus.current = false; } }, [ready, practice]);
  const appearance = useMemo(() => Object.fromEntries(specimen.surfaces.map((s) => [s.id, { color: supplement?.colors[s.id] ?? kneeTissueColours[s.tissue], opacity: 1 }])), [specimen, supplement]);
  function assembledDisplay() {
    setExplode(0); setIsolated(false); setFocus(false); setZoom(1); setReset((n) => n + 1);
  }
  function preset(value: string) {
    const action = specimenAction(specimen, value);
    if (!action) return;
    dispatch(action); assembledDisplay();
    setView(kneeSpecimenStudies.find((s) => s.id === value)!.view);
  }
  function select(id: string) { dispatch({ type: 'select', id }); setFocus(false); }
  function historyStep(type: 'undo' | 'redo') { dispatch({ type }); assembledDisplay(); }
  function resetAll() {
    preset('all'); setQuery(''); setLayout('extract'); setJointCloseUp(!!specimen.closeUp);
    setLabels(true); setShowOrigins(false); setIllustrated(true);
  }
  if (practice) return <SpecimenIdentification assetBase={assetBase} definition={specimen} initial={practice} visibleIds={visible.map(s => s.id)} initialView={view} adapter={practiceAdapter}
    onClose={() => { restorePracticeFocus.current = true; setHealth('starting'); setPractice(null); }} />;
  return <div className="eye-layer-workbench um-knee-workbench">
    <section className="um-knee-image" aria-label={`Independent ${specimen.label.toLowerCase()} 3D specimen`}>
      <div className="um-knee-camera-tools">
        <Select value={view} items={cameraViews.map(v => ({ value:v, label:v[0].toUpperCase()+v.slice(1) }))} onValueChange={(v) => { if (cameraViews.includes(v as DissectionView)) setView(v as DissectionView); }}>
          <SelectTrigger aria-label={`${specimen.label} camera direction`}><SelectValue /></SelectTrigger>
          <SelectContent>{cameraViews.map((v) => <SelectItem key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out">−</Button>
        <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(3, z + 0.2))} aria-label="Zoom in">+</Button>
        <Button variant="outline" size="sm" aria-pressed={labels} onClick={() => setLabels((v) => !v)}><Tags />Labels</Button>
        <Button variant="outline" size="sm" onClick={resetAll}><RotateCcw />Reset</Button>
        {(!supplement || practiceAdapter) && <Button ref={practiceLauncher} variant="outline" size="sm" disabled={!ready || practiceCount < 2} onClick={() => setPractice((practiceAdapter?.createRound ?? createIdentification)(specimen, visible.map(s => s.id)))}>Practise identification</Button>}
      </div>
      <div className="eye-layer-viewport">
        <BodyScene assetBase={assetBase} catalog={kneeCatalog} structures={kneeStructures} selectedId={selectedId}
          systems={allBodySystems} isolated={isolated && !!selected} hiddenIds={hidden} ghostRemoved={false}
          illustrated={illustrated} landmarks={visible.filter((s) => s.system !== 'skeleton').map((s) => s.id)}
          explode={explode} layout={layout} anchorSkeleton={false} showOrigins={showOrigins} originStyle="selected-guide"
          labels={labels} view={view} zoom={zoom} reset={reset} focus={focus} exam={false}
          inspection={initialInspection} cameraBounds={jointCloseUp && explode === 0 && !isolated ? specimen.closeUp : null}
          plate={false} appearance={appearance} retries={Object.fromEntries(kneeCatalog.bundles.map((b) => [b.id, retry]))}
          onSelect={select} onLoaded={onLoaded} onFailure={onFailure} onRendererHealth={setHealth} />
        {!!pending.length && !errors.length && <output className="eye-layer-status">Loading {specimen.label.toLowerCase()} specimen… ({required.length - pending.length}/{required.length} groups)</output>}
        {!!errors.length && <div className="eye-layer-status" role="alert">Some specimen tissues could not load. <Button size="sm" onClick={() => {
          retryBodyAssets(kneeCatalog.bundles.map((b) => b.url), assetBase); setLoaded([]); setFailed([]); setRetry((n) => n + 1);
        }}>Retry</Button></div>}
        {!visible.length && <div className="eye-layer-status">All tissues are hidden. <Button size="sm" onClick={() => preset('all')}>Show all</Button></div>}
      </div>
      <p className="um-knee-scene-caption">{explode > 0 ? supplement ? 'Separated teaching view — not tissue motion or a surgical plane. Return to 0% for source positions.' : 'Separated teaching view — not joint motion. Return to 0% for source positions.' : 'Source positions · Drag to rotate · Scroll or pinch to zoom'}</p>
    </section>
    <aside className="eye-layer-controls um-knee-controls" aria-label={`${specimen.label} specimen controls`}>
      <label className="um-knee-label" htmlFor="um-knee-study">Study</label>
      <Select value={active?.id ?? 'custom'} items={[{value:'custom',label:'Custom dissection'},...kneeSpecimenStudies.map(s=>({value:s.id,label:s.title}))]} onValueChange={(v) => { if (v) preset(v); }}>
        <SelectTrigger id="um-knee-study" aria-label={`${specimen.label} dissection study`}><SelectValue /></SelectTrigger>
        <SelectContent>
          {!active && <SelectItem value="custom" disabled>Custom dissection</SelectItem>}
          {kneeSpecimenStudies.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="um-knee-guide">{active?.note ?? 'Your custom tissue selection. Undo restores the previous dissection step.'}</p>
      <div className="eye-layer-actions">
        <Button size="sm" variant="outline" disabled={!history.length} onClick={() => historyStep('undo')}><Undo2 />Undo</Button>
        <Button size="sm" variant="outline" disabled={!future.length} onClick={() => historyStep('redo')}><Redo2 />Redo</Button>
        <span aria-live="polite">{visible.length}/{kneeStructures.length} visible</span>
      </div>
      {!supplement && <SpecimenMotorExplorer definition={specimen} selectedId={selectedId} onSelect={select} onExplore={nerve => {
        const action = motorStudyAction(specimen, nerve), group = specimenMotorGroups(specimen).find(g => g.key === nerve);
        if (!action || !group) return;
        dispatch(action); assembledDisplay(); setQuery(''); setJointCloseUp(false); setView(group.view);
      }} />}
      <section className="um-knee-selection" aria-label="Selected specimen structure">
        <h3>{selected?.name ?? 'Select a structure'}</h3>
        {selected && <>
          <p>{selected.coverageNote ?? (selected.tissue === 'skeleton' ? 'Whole source bone; close-up does not divide the bone.' : selected.slug === 'meniscus-group' || selected.slug === 'tibial-cartilage' ? 'Grouped source surface. Medial and lateral components are not separately selectable.' : 'Source-segmented surface from this independent right-limb specimen.')}</p>
          {selected.sourceQuality && (selected.sourceQuality.components > 1 || selected.sourceQuality.nonManifoldEdges > 0) && <p className="um-source-caution">Source contains {selected.sourceQuality.components > 1 ? 'disconnected parts' : 'edge contacts'}{selected.sourceQuality.components > 1 && selected.sourceQuality.nonManifoldEdges > 0 ? ' and edge contacts' : ''}. These are retained, not reconstructed or separately named; geometry review is pending.</p>}
          <div className="eye-layer-actions">
            <Button size="sm" variant="outline" aria-pressed={isolated} onClick={() => { setIsolated((v) => !v); setFocus(false); }}>{isolated ? 'Show others' : 'Fade others'}</Button>
            <Button size="sm" variant="outline" disabled={!ready} onClick={() => { setFocus(true); setReset((n) => n + 1); }}><Focus />Frame</Button>
            <Button size="sm" variant="outline" onClick={() => { dispatch({ type: 'visibility', id: selected.id, visible: false }); setFocus(false); }}>Set aside</Button>
          </div>
          {supplement ? <>{supplement.learning(selected, specimen)}{supplement.studyLink?.(specimen,selected.id,active?.id ?? null,view)}</> : <>
            <SpecimenLearning definition={specimen} selected={selected} initialTopic={selected.id === initialNavigation?.selectedId ? initialNavigation.topic : null} />
            <SpecimenStudyLink key={`${selected.id}:${active?.id ?? 'custom'}:${view}`} definition={specimen} selectedId={selected.id} studyId={active?.id ?? null} view={view} />
          </>}
        </>}
      </section>
      <div className="um-knee-separation">
        <label className="um-knee-label">Separation <output>{explode}%</output></label>
        <ExplodeStyleSelect value={layout} disabled={false} onChange={(next) => { setLayout(next); setFocus(false); }} />
        <Slider value={[explode]} min={0} max={100} step={5} disabled={!ready || !visible.length || (layout === 'extract' && !selected)}
          onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (Number.isFinite(n)) { setExplode(n); setFocus(false); } }} aria-label={`${specimen.label} tissue separation`} />
        {explode > 0 && <Button size="sm" variant="ghost" onClick={() => setExplode(0)}>Return to source positions</Button>}
      </div>
      <details className="um-knee-details" open>
        <summary>Tissues & search</summary>
        <div className="um-knee-groups">{(supplement?.tissueGroups ?? tissueGroups).filter((group) => kneeSpecimen.structures.some((s) => s.tissue === group.id)).map((group) => {
          const members = kneeSpecimen.structures.filter((s) => s.tissue === group.id);
          const count = members.filter((s) => !hidden.includes(s.id)).length;
          return <label key={group.id}><span style={{ color: 'color' in group ? group.color as string : kneeTissueColours[group.id] }}>●</span>{group.name}<small>{count}/{members.length}</small>
            <Switch checked={count > 0} aria-label={`Show ${specimen.label.toLowerCase()} ${group.name.toLowerCase()}`} onCheckedChange={(checked) => {
              // One atomic history step for the entire group, not one per surface.
              dispatch({ type: 'group', tissue: group.id, visible: checked }); setFocus(false);
            }} /></label>;
        })}</div>
        <SpecimenStructureSearch specimen={specimen} query={query} onQueryChange={setQuery}
          selectedId={selectedId} hidden={hidden} onSelect={select}
          onVisibility={(id, visible) => { dispatch({ type: 'visibility', id, visible }); setFocus(false); }} />
      </details>
      <details className="um-knee-details"><summary>Display options</summary>
        {specimen.closeUp && <><label className="um-knee-toggle">Regional close-up<Switch checked={jointCloseUp} onCheckedChange={(v) => { setJointCloseUp(v); setFocus(false); }} /></label>
        <p>Close-up pauses while separated or fading others, so displaced tissues remain in view.</p></>}
        <label className="um-knee-toggle">Illustrated surfaces<Switch checked={illustrated} onCheckedChange={setIllustrated} /></label>
        <label className="um-knee-toggle">Selected origin guide<Switch checked={showOrigins} onCheckedChange={setShowOrigins} disabled={layout === 'tray'} /></label>
      </details>
      <details className="um-knee-details"><summary>Source & limitations</summary>
        {supplement ? supplement.sourceDetails : <>
        <p>{kneeSpecimen.source.credit}</p>
        <a href="https://researchdata.um.edu.my/dataset.xhtml?persistentId=doi:10.22452/RD/5T6TZ7" target="_blank" rel="noreferrer">Source dataset · CC0 1.0</a>
        <p>Different subject from the body atlas; no registration, mirrored opposite limb, scan synchronisation or clinical approval. {specimen.limitations}</p>
        <p>{specimen.omittedFaces} exactly zero-area source triangles are omitted from this view’s surfaces. Original files and the omission record are retained. Shapes are not sculpted or fitted to the other body model.</p>
        {selected && <p className="um-knee-source-id">{selected.id}<br />Ontology mapping: pending.</p>}
        <p>Source-bound anatomy and function drafts are available under Learn. Clinical, pathology and imaging lessons still require authoring and review. No CT/MRI/X-ray/US or paid lecture is unlocked by this view.</p>
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
