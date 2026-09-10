'use client';
import { useCallback, useMemo, useReducer, useState } from 'react';
import { ArrowLeft, Focus, RotateCcw, Tags, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { initialSpecimen, reduceSpecimen, activeSpecimenStudy, specimenAction, filterSpecimen, type SpecimenDefinition, type SpecimenAction } from '@/lib/independent-specimen';
import type { VentricularState } from '@/lib/ventricles';
import './eye-layers.css';
import './um-knee-study.css';

const cameraViews = ['anterior', 'posterior', 'right', 'left', 'superior', 'inferior'] as const;
const tissueGroups = [
  { id: 'skeleton', name: 'Bones' }, { id: 'cartilage', name: 'Cartilage' },
  { id: 'ligament', name: 'Ligaments' }, { id: 'meniscus', name: 'Menisci' },
  { id: 'tendon', name: 'Tendon' }, { id: 'muscle', name: 'Muscle' },
];

export function KneeSpecimenView({ specimen = kneeDefinition }: { specimen?: SpecimenDefinition } = {}) {
  const kneeSpecimen = { structures: specimen.surfaces, source: specimen.source };
  const kneeCatalog = specimen.catalog, kneeStructures = kneeCatalog.structures, kneeSpecimenStudies = specimen.studies;
  const [state, dispatch] = useReducer((state: VentricularState, action: SpecimenAction) => reduceSpecimen(specimen, state, action), specimen, initialSpecimen);
  const { selectedId, hidden, history, future } = state;
  const [query, setQuery] = useState(''), [isolated, setIsolated] = useState(false);
  const [explode, setExplode] = useState(0), [layout, setLayout] = useState<BodyLayout>('extract');
  const [view, setView] = useState<DissectionView>(specimen.studies.find((s) => s.id === specimen.initialStudy)?.view ?? 'anterior'), [labels, setLabels] = useState(true);
  const [focus, setFocus] = useState(false), [jointCloseUp, setJointCloseUp] = useState(!!specimen.closeUp);
  const [showOrigins, setShowOrigins] = useState(false), [illustrated, setIllustrated] = useState(true);
  const [reset, setReset] = useState(0), [zoom, setZoom] = useState(1);
  const [health, setHealth] = useState<RendererHealth>('starting');
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
  const results = filterSpecimen(specimen, query);
  const appearance = useMemo(() => Object.fromEntries(specimen.surfaces.map((s) => [s.id, { color: kneeTissueColours[s.tissue], opacity: 1 }])), [specimen]);
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
  return <div className="eye-layer-workbench um-knee-workbench">
    <section className="um-knee-image" aria-label={`Independent ${specimen.label.toLowerCase()} 3D specimen`}>
      <div className="um-knee-camera-tools">
        <Select value={view} onValueChange={(v) => { if (cameraViews.includes(v as DissectionView)) setView(v as DissectionView); }}>
          <SelectTrigger aria-label={`${specimen.label} camera direction`}><SelectValue /></SelectTrigger>
          <SelectContent>{cameraViews.map((v) => <SelectItem key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out">−</Button>
        <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(3, z + 0.2))} aria-label="Zoom in">+</Button>
        <Button variant="outline" size="sm" aria-pressed={labels} onClick={() => setLabels((v) => !v)}><Tags />Labels</Button>
        <Button variant="outline" size="sm" onClick={resetAll}><RotateCcw />Reset</Button>
      </div>
      <div className="eye-layer-viewport">
        <BodyScene catalog={kneeCatalog} structures={kneeStructures} selectedId={selectedId}
          systems={allBodySystems} isolated={isolated && !!selected} hiddenIds={hidden} ghostRemoved={false}
          illustrated={illustrated} landmarks={visible.filter((s) => s.system !== 'skeleton').map((s) => s.id)}
          explode={explode} layout={layout} anchorSkeleton={false} showOrigins={showOrigins} originStyle="selected-guide"
          labels={labels} view={view} zoom={zoom} reset={reset} focus={focus} exam={false}
          inspection={initialInspection} cameraBounds={jointCloseUp && explode === 0 && !isolated ? specimen.closeUp : null}
          plate={false} appearance={appearance} retries={Object.fromEntries(kneeCatalog.bundles.map((b) => [b.id, retry]))}
          onSelect={select} onLoaded={onLoaded} onFailure={onFailure} onRendererHealth={setHealth} />
        {!!pending.length && !errors.length && <output className="eye-layer-status">Loading {specimen.label.toLowerCase()} specimen… ({required.length - pending.length}/{required.length} groups)</output>}
        {!!errors.length && <div className="eye-layer-status" role="alert">Some specimen tissues could not load. <Button size="sm" onClick={() => {
          retryBodyAssets(kneeCatalog.bundles.map((b) => b.url)); setLoaded([]); setFailed([]); setRetry((n) => n + 1);
        }}>Retry</Button></div>}
        {!visible.length && <div className="eye-layer-status">All tissues are hidden. <Button size="sm" onClick={() => preset('all')}>Show all</Button></div>}
      </div>
      <p className="um-knee-scene-caption">{explode > 0 ? 'Separated teaching view — not joint motion. Return to 0% for source positions.' : 'Source positions · Drag to rotate · Scroll or pinch to zoom'}</p>
    </section>
    <aside className="eye-layer-controls um-knee-controls" aria-label={`${specimen.label} specimen controls`}>
      <label className="um-knee-label" htmlFor="um-knee-study">Study</label>
      <Select value={active?.id ?? 'custom'} onValueChange={(v) => { if (v) preset(v); }}>
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
        <div className="um-knee-groups">{tissueGroups.filter((group) => kneeSpecimen.structures.some((s) => s.tissue === group.id)).map((group) => {
          const members = kneeSpecimen.structures.filter((s) => s.tissue === group.id);
          const count = members.filter((s) => !hidden.includes(s.id)).length;
          return <label key={group.id}><span style={{ color: kneeTissueColours[group.id] }}>●</span>{group.name}<small>{count}/{members.length}</small>
            <Switch checked={count > 0} aria-label={`Show ${specimen.label.toLowerCase()} ${group.name.toLowerCase()}`} onCheckedChange={(checked) => {
              // One atomic history step for the entire group, not one per surface.
              dispatch({ type: 'group', tissue: group.id, visible: checked }); setFocus(false);
            }} /></label>;
        })}</div>
        <Input aria-label={`Search ${specimen.label.toLowerCase()} specimen structures`} placeholder="Find a tissue…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ul className="eye-layer-list um-knee-list">{results.map((s) => <li key={s.id}>
          <Button size="sm" variant={selectedId === s.id ? 'secondary' : 'ghost'} aria-pressed={selectedId === s.id} onClick={() => select(s.id)}>{s.name}</Button>
          <Switch checked={!hidden.includes(s.id)} aria-label={`Show ${s.name}`} onCheckedChange={(visible) => { dispatch({ type: 'visibility', id: s.id, visible }); setFocus(false); }} />
        </li>)}</ul>
        {!results.length && <p>No matching tissue in this specimen.</p>}
      </details>
      <details className="um-knee-details"><summary>Display options</summary>
        {specimen.closeUp && <><label className="um-knee-toggle">Regional close-up<Switch checked={jointCloseUp} onCheckedChange={(v) => { setJointCloseUp(v); setFocus(false); }} /></label>
        <p>Close-up pauses while separated or fading others, so displaced tissues remain in view.</p></>}
        <label className="um-knee-toggle">Illustrated surfaces<Switch checked={illustrated} onCheckedChange={setIllustrated} /></label>
        <label className="um-knee-toggle">Selected origin guide<Switch checked={showOrigins} onCheckedChange={setShowOrigins} disabled={layout === 'tray'} /></label>
      </details>
      <details className="um-knee-details"><summary>Source & limitations</summary>
        <p>{kneeSpecimen.source.credit}</p>
        <a href="https://researchdata.um.edu.my/dataset.xhtml?persistentId=doi:10.22452/RD/5T6TZ7" target="_blank" rel="noreferrer">Source dataset · CC0 1.0</a>
        <p>Different subject from the body atlas; no registration, mirrored opposite limb, scan synchronisation or clinical approval. {specimen.limitations}</p>
        <p>{specimen.omittedFaces} exactly zero-area source triangles are omitted from this view’s surfaces. Original files and the omission record are retained. Shapes are not sculpted or fitted to the other body model.</p>
        {selected && <p className="um-knee-source-id">{selected.id}<br />Ontology mapping: pending.</p>}
        <p>Anatomy, function, imaging and clinical teaching for this specimen still require source-specific authoring and review. No CT/MRI/X-ray/US or paid lecture is unlocked by this view.</p>
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
