'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { NestedTeaching } from './nested-teaching';
import { ImagingLink } from './imaging-link';
import { useNestedEducationLink } from './nested-education-link';
import type { NestedImagingTopic } from '@/content/nested-teaching';
import { ArrowLeft, RotateCcw, Eye, Focus, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './study-surface';
import { BodyScene, retryBodyAssets } from './body-scene';
import { allBodySystems, type BodyCatalog, type BodyStructure } from './body-types';
import { initialInspection } from '@/lib/inspection-state';
import {
  CutawayControls as EyeCutawayControls,
  cutPlanes as eyeCutPlanes,
} from './cutaway-controls';
export { CutawayControls as EyeCutawayControls } from './cutaway-controls';
import {
  selectionBounds,
  selectionVisibility,
} from '@/lib/selection-visibility';
import {
  eyeCatalog,
  eyeLayersFor,
  eyeNotes,
  eyeReferences,
  type EyePreset,
} from '@/lib/eye-layers';
import {
  initialEyeLayers,
  reduceEyeLayers,
  type EyeAction,
  type EyeLayerState,
} from '@/lib/eye-layer-state';
import type { DissectionView } from './dissection-data';
import type { BodyLayout } from '@/lib/body-arrangement';
import type { RendererHealth } from '@/lib/renderer-health';
import type { StudyCamera } from '@/lib/study-views';
import { eyeLayerGuide } from '@/lib/eye-layer-guide';
import './eye-layers.css';

export function EyeLayerView({
  parent,
  initialSelectedId,
  initialTeachingTopic,
  educationCatalog,
  assetBase = '',
  initialGuidedLearningExpanded = false,
}: {
  parent: BodyStructure;
  initialSelectedId?: string;
  initialTeachingTopic?: NestedImagingTopic;
  educationCatalog?: BodyCatalog;
  assetBase?: string;
  initialGuidedLearningExpanded?: boolean;
}) {
  const layers = useMemo(() => eyeLayersFor(parent), [parent]);
  const initialSelection = layers.find((s) => s.id === initialSelectedId)?.id;
  const frame = useMemo(() => selectionBounds(layers), [layers]);
  const [manualInspection, setInspection] = useState(initialInspection);
  const [
    { selectedId: manualSelectedId, hidden: manualHidden, history, future, preset: manualPreset },
    dispatch,
  ] = useReducer(
    (state: EyeLayerState, action: EyeAction) =>
      reduceEyeLayers(layers, state, action),
    layers,
    (items) =>
      initialSelection
        ? {
            selectedId: initialSelection,
            hidden: [],
            history: [],
            future: [],
            preset: 'all' as const,
          }
        : initialEyeLayers(items),
  );
  const [manualExplode, setExplode] = useState(0),
    [manualLayout, setLayout] = useState<BodyLayout>('extract');
  const [manualOrigins, setShowOrigins] = useState(false);
  const [manualView, setView] = useState<DissectionView>('anterior'),
    [manualLabels, setLabels] = useState(true);
  const [manualIsolated, setIsolated] = useState(!!initialSelection),
    [manualFocus, setFocus] = useState(false),
    [reset, setReset] = useState(0);
  const [health, setHealth] = useState<RendererHealth>('starting');
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  const guide = useMemo(() => eyeLayerGuide(parent), [parent]);
  const cameraCapture = useRef<StudyCamera | null>(null), cameraRestore = useRef<StudyCamera | null>(null);
  const guideLauncher = useRef<HTMLButtonElement | null>(null), restoreGuideFocus = useRef(false);
  const [guideExpanded, setGuideExpanded] = useState(initialGuidedLearningExpanded);
  const [reducedMotion, setReducedMotion] = useState(true), [pageHidden, setPageHidden] = useState(false);
  const [guidance, setGuidance] = useState<{id: string; index: number; camera: StudyCamera | null} | null>(null);
  const step = guidance?.id === guide?.id ? guide?.steps[guidance!.index] : undefined;
  // Guidance is a reversible presentation overlay: manual state/history never changes.
  const selectedId = step?.selectedId ?? manualSelectedId;
  const hidden = step ? layers.filter(s => !step.ids.includes(s.id)).map(s => s.id) : manualHidden;
  const currentPreset = step?.preset ?? manualPreset;
  const inspection = step ? initialInspection : manualInspection;
  const explode = step ? 0 : manualExplode, layout = step ? 'spatial' : manualLayout;
  const showOrigins = step ? false : manualOrigins, view = step?.view ?? manualView;
  const labels = step ? true : manualLabels, isolated = step ? guide!.fadeOthers : manualIsolated;
  const focus = step ? false : manualFocus;
  const ready = health === 'ready' && loaded && !failed;
  useEffect(() => {
    if (!guide) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(preference.matches);
    const visibility = () => setPageHidden(document.hidden);
    motion(); visibility();
    preference.addEventListener('change', motion); document.addEventListener('visibilitychange', visibility);
    return () => { preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); };
  }, [guide]);
  useLayoutEffect(() => {
    if (!guidance && restoreGuideFocus.current) {
      guideLauncher.current?.focus(); restoreGuideFocus.current = false;
    }
  }, [guidance]);
  const onLoaded = useCallback(() => {
    setLoaded(true);
    setFailed(false);
  }, []);
  const onFailure = useCallback(() => setFailed(true), []);
  const selected = layers.find((s) => s.id === selectedId);
  const cutSelection = selected
    ? selectionVisibility({
        system: selected.system,
        enabled: true,
        bounds: selected.bounds,
        frame,
        inspection,
      })
    : null;
  const appearance = useMemo(
    () =>
      Object.fromEntries(
        layers.map((s) => [
          s.id,
          {
            color: eyeNotes[s.kind].color,
            opacity:
              s.id === selectedId
                ? Math.max(0.55, eyeNotes[s.kind].opacity)
                : eyeNotes[s.kind].opacity,
          },
        ]),
      ),
    [layers, selectedId],
  );
  function applySelection(id: string) {
    if (step) return;
    dispatch({ type: 'select', id });
    setFocus(false);
  }
  const educationAllowedIds = useMemo(
    () => loaded && !failed
      ? layers.filter((s) => !hidden.includes(s.id)).map((s) => s.id)
      : [],
    [layers, hidden, loaded, failed],
  );
  const educationLink = useNestedEducationLink({
    catalog: educationCatalog,
    parent,
    study: 'eye',
    layers,
    allowedIds: educationAllowedIds,
    disabled: !layers.length || (!!initialSelectedId && !initialSelection) ||
      health !== 'ready' || !loaded || failed ||
      !!step || isolated || inspection.plane !== 'off',
    onSelect: applySelection,
  });
  function select(id: string) {
    if (step) return;
    applySelection(id);
    educationLink.publish(id);
  }
  function preset(value: EyePreset) {
    if (step) return;
    dispatch({ type: 'preset', value });
    setExplode(0);
    setIsolated(false);
    setFocus(false);
    setInspection(initialInspection);
  }
  function guideStep(index: number) {
    if (!guide || !ready || pageHidden || !Number.isInteger(index) || !guide.steps[index] ||
      (!!initialSelectedId && !initialSelection)) return;
    setGuidance(previous => ({id: guide.id, index,
      camera: previous?.id === guide.id ? previous.camera : structuredClone(cameraCapture.current)}));
    setReset(n => n + 1); setGuideExpanded(true);
  }
  function exitGuide() {
    if (!guidance) return;
    cameraRestore.current = structuredClone(guidance.camera);
    restoreGuideFocus.current = true; setGuidance(null); setReset(n => n + 1);
  }
  const unavailable = eyeCatalog.excluded.filter(
    (s) => s.parentId === parent.id,
  );
  if (!layers.length)
    return (
      <p role="alert">
        This eye’s source binding has changed. Layer dissection is unavailable
        pending review.
      </p>
    );
  return (
    <div className="eye-layer-workbench">
      <div className="eye-layer-viewport">
        <BodyScene
          assetBase={assetBase}
          catalog={eyeCatalog}
          structures={layers}
          selectedId={selectedId}
          systems={allBodySystems}
          isolated={isolated && !!selected}
          hiddenIds={hidden}
          ghostRemoved={false}
          illustrated
          labels={labels}
          landmarks={layers.map((s) => s.id)}
          explode={explode}
          layout={layout}
          anchorSkeleton={false}
          showOrigins={showOrigins}
          originStyle="selected-guide"
          view={view}
          zoom={1}
          reset={reset}
          focus={focus}
          exam={false}
          inspection={inspection}
          plate={false}
          appearance={appearance}
          retries={{ 'eye-layers': retry }}
          cameraBounds={step ? selectionBounds(layers.filter(s => step.ids.includes(s.id))) : undefined}
          cameraCapture={cameraCapture} cameraRestore={cameraRestore}
          tourLocked={!!step}
          transitionMs={step && !reducedMotion ? guide!.transitionMs : 0}
          transitionPaused={!!step && (!ready || pageHidden)}
          onSelect={select}
          onLoaded={onLoaded}
          onFailure={onFailure}
          onRendererHealth={setHealth}
        />
        {!loaded && !failed && (
          <output className="eye-layer-status">Loading eye layers…</output>
        )}
        {failed && (
          <div className="eye-layer-status" role="alert">
            Eye layers could not load.{' '}
            <Button
              size="sm"
              onClick={() => {
                retryBodyAssets(eyeCatalog.bundles.map((b) => b.url), assetBase);
                setFailed(false);
                setLoaded(false);
                setRetry((r) => r + 1);
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {hidden.length === layers.length && (
          <p className="eye-layer-status">
            All components are hidden.{' '}
            <Button size="sm" onClick={() => preset('all')}>
              Show all
            </Button>
          </p>
        )}
        <div className="eye-layer-scene-tools">
          <Select
            disabled={!!step}
            value={view}
            onValueChange={(v) => {
              if (
                v &&
                [
                  'anterior',
                  'posterior',
                  'left',
                  'right',
                  'superior',
                  'inferior',
                ].includes(v)
              )
                setView(v as DissectionView);
            }}
          >
            <SelectTrigger aria-label="Eye camera view">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  'anterior',
                  'posterior',
                  'left',
                  'right',
                  'superior',
                  'inferior',
                ] as const
              ).map((v) => (
                <SelectItem key={v} value={v}>
                  {v[0].toUpperCase() + v.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={labels ? 'default' : 'outline'}
            disabled={!!step}
            aria-pressed={labels}
            onClick={() => setLabels((v) => !v)}
          >
            <Tags /> Labels
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!!step}
            onClick={() => {
              setReset((r) => r + 1);
              setFocus(false);
            }}
          >
            <RotateCcw /> Frame eye
          </Button>
        </div>
        {(explode > 0 || inspection.plane !== 'off') && (
          <p className="eye-layer-layout-note">
            <span>
              {explode > 0 &&
                'Separated teaching layout · not anatomical positions'}
              {explode > 0 && inspection.plane !== 'off' && ' · '}
              {inspection.plane !== 'off' &&
                `${eyeCutPlanes[inspection.plane]} cut · ${inspection.position}% · not a scan`}
            </span>
            {inspection.plane !== 'off' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInspection(initialInspection)}
              >
                Restore whole view
              </Button>
            )}
          </p>
        )}
      </div>
      <aside
        className="eye-layer-controls"
        aria-label="Eye dissection controls"
      >
        {guide && <details className="eye-layer-guided-learning" open={guideExpanded}
          onToggle={event => { if (!step) setGuideExpanded(event.currentTarget.open); }}>
          <summary>Guided learning</summary>
          {step ? <section aria-label="Eye-layer walkthrough" aria-live="polite">
            <p>Step {guidance!.index + 1} of {guide.steps.length} · Draft</p>
            <h3>{step.title}</h3><p>{step.caption}</p>
            {!ready || pageHidden ? <p role="status">Walkthrough paused until the model is ready and this page is visible.</p> : null}
            <div className="eye-layer-actions">
              <Button size="sm" variant="outline" disabled={!ready || pageHidden || guidance!.index === 0}
                onClick={() => guideStep(guidance!.index - 1)}>Previous step</Button>
              <Button size="sm" variant="outline" disabled={!ready || pageHidden || guidance!.index === guide.steps.length - 1}
                onClick={() => guideStep(guidance!.index + 1)}>Next step</Button>
              <Button size="sm" variant="outline" onClick={exitGuide}>End walkthrough</Button>
            </div>
            {step.references.map(url => <a key={url} href={url} target="_blank" rel="noreferrer">{eyeReferences.find(r => r.url === url)?.label ?? 'Source reference'}</a>)}
          </section> : <><p>{guide.title} · Four source-bound steps · Draft</p>
            <Button ref={guideLauncher} size="sm" variant="outline"
              disabled={!ready || pageHidden || (!!initialSelectedId && !initialSelection)}
              onClick={() => guideStep(0)}>Start eye walkthrough</Button></>}
          <p>{guide.limitation}</p>
        </details>}
        <fieldset className="eye-layer-manual-controls" disabled={!!step}>
        <legend className="sr-only">Manual eye dissection controls</legend>
        {educationLink.adapter && <ImagingLink link={educationLink} />}
        <div className="eye-layer-presets">
          <label htmlFor="eye-layer-preset">Study view</label>
          <Select
            value={currentPreset}
            onValueChange={(v) => {
              if (v && v !== 'custom') preset(v as EyePreset);
            }}
          >
            <SelectTrigger id="eye-layer-preset">
              <SelectValue>
                {
                  {
                    all: 'All available components',
                    anterior: 'Anterior structures',
                    lens: 'Lens and support',
                    wall: 'Wall layers',
                    custom: 'Custom selection',
                  }[currentPreset]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All available components</SelectItem>
              <SelectItem value="anterior">Anterior structures</SelectItem>
              <SelectItem value="lens">Lens and support</SelectItem>
              <SelectItem
                value="wall"
                disabled={!layers.some((s) => s.kind === 'sclera')}
              >
                Wall layers
              </SelectItem>
              <SelectItem value="custom" disabled>
                Custom selection
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ul className="eye-layer-list">
          {layers.map((s) => (
            <li key={s.id}>
              <Button
                size="sm"
                variant={selectedId === s.id ? 'secondary' : 'ghost'}
                aria-pressed={selectedId === s.id}
                onClick={() => select(s.id)}
              >
                {eyeNotes[s.kind].label}
              </Button>
              <Switch
                checked={!hidden.includes(s.id)}
                onCheckedChange={(visible) => {
                  dispatch({ type: 'visibility', id: s.id, visible });
                  setFocus(false);
                  if (!visible && selectedId === s.id) setIsolated(false);
                }}
                aria-label={`Show ${s.name.toLowerCase()}`}
              />
            </li>
          ))}
        </ul>
        <div className="eye-layer-actions">
          <Button
            size="sm"
            variant="outline"
            disabled={!history.length}
            onClick={() => {
              dispatch({ type: 'undo' });
              setFocus(false);
              setIsolated(false);
            }}
          >
            Undo layers
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!future.length}
            title="Reapply the last undone layer or selection change"
            onClick={() => {
              dispatch({ type: 'redo' });
              setFocus(false);
              setIsolated(false);
            }}
          >
            Redo layers
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              preset('all');
              setReset((r) => r + 1);
            }}
          >
            Reassemble
          </Button>
        </div>
        <EyeCutawayControls
          value={inspection}
          onChange={(next) => {
            setInspection(next);
            setFocus(false);
          }}
        />
        <details className="eye-layer-separation">
          <summary>Separate components</summary>
          <Select
            value={layout}
            onValueChange={(v) => {
              if (v === 'extract' || v === 'tray') {
                setLayout(v);
                setExplode(0);
              }
            }}
          >
            <SelectTrigger aria-label="Eye separation mechanism">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="extract">Lift selected component</SelectItem>
              <SelectItem value="tray">Spread all (flat plate)</SelectItem>
            </SelectContent>
          </Select>
          <label htmlFor="eye-layer-explode">Separation · {explode}%</label>
          <Slider
            id="eye-layer-explode"
            aria-label="Eye component separation"
            aria-valuetext={`${explode}%`}
            min={0}
            max={100}
            step={1}
            value={[explode]}
            disabled={layout === 'extract' && !selected}
            onValueChange={(v) => setExplode(Array.isArray(v) ? v[0] : v)}
          />
          <p>
            Drag to rotate in lift mode; spread mode uses a flat teaching
            plate.
          </p>
          <label className="origin-guide-toggle" htmlFor="eye-origin-guide">
            Show original position
            <Switch
              id="eye-origin-guide"
              checked={showOrigins}
              onCheckedChange={setShowOrigins}
              aria-label="Show original position"
              aria-describedby="eye-origin-guide-note"
            />
          </label>
          <p id="eye-origin-guide-note">
            Selected part only: a faint outline and line back to its source
            position, not a tissue connection. Hidden at 0%, in flat-plate or
            cutaway views, or when the part is hidden or not moving.
          </p>
        </details>
        {selected && (
          <section className="eye-layer-teaching" aria-live="polite">
            <h3>{selected.name}</h3>
            <span className="eye-layer-source-id">
              {selected.fmaId} · Draft
            </span>
            {cutSelection?.clipped && (
              <output className="eye-layer-cut-warning">
                {cutSelection.reasons.includes('Selection clipped by cutaway')
                  ? 'This component is fully cut away. Use Restore whole view to see it.'
                  : 'The cutaway may hide part of this component.'}
              </output>
            )}
            <p>{eyeNotes[selected.kind].anatomy}</p>
            <p>{eyeNotes[selected.kind].function}</p>
            <div className="eye-layer-actions">
              <Button
                size="sm"
                variant={isolated ? 'default' : 'outline'}
                aria-pressed={isolated}
                onClick={() => setIsolated((v) => !v)}
              >
                <Eye /> Fade others
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={health !== 'ready' || !loaded}
                onClick={() => setFocus((v) => !v)}
              >
                <Focus /> Frame
              </Button>
            </div>
            <NestedTeaching
              parent={parent}
              study="eye"
              selected={selected}
              reviewAvailable={!assetBase}
              initialTopic={
                selected.id === initialSelection
                  ? initialTeachingTopic
                  : undefined
              }
            />
          </section>
        )}
        {unavailable.length > 0 && (
          <details className="eye-layer-limits">
            <summary>
              {unavailable.length} right-eye components unavailable
            </summary>
            <p>
              Opposite-side source fragments require review. No mirrored
              substitutes are shown.
            </p>
            <ul>
              {unavailable.map((s) => (
                <li key={s.fmaId}>{s.name}</li>
              ))}
            </ul>
          </details>
        )}
        <details className="eye-layer-limits">
          <summary>Source and limitations</summary>
          {parent.laterality === 'right' && (
            <p>
              Four components use source-cleaned surfaces: 36 tiny
              disconnected triangles on the opposite side were removed.
              Retained surfaces were not moved or mirrored. Anatomical review
              remains pending.
            </p>
          )}
          <p>
            Colours and transparency aid viewing, not optical simulation.
            Retina and finer tissue layers are not separately segmented.
            CT/MRI/US links and clinical validation are pending.
          </p>
          <p>{eyeCatalog.credit}</p>
          <p>
            Components separated from the source aggregate, transformed,
            recoloured and normal-smoothed for this viewer. Pinned
            opposite-side fragments are suppressed on the right; retained
            surfaces are not moved or mirrored.
          </p>
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0 licence
          </a>
          {eyeReferences.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer">
              {r.label}
            </a>
          ))}
        </details>
        </fieldset>
      </aside>
    </div>
  );
}

export default function EyeLayers({
  parent,
  onClose,
  initialSelectedId,
  initialTeachingTopic,
  educationCatalog,
  assetBase = '',
}: {
  parent: BodyStructure;
  onClose: () => void;
  initialSelectedId?: string;
  initialTeachingTopic?: NestedImagingTopic;
  educationCatalog?: BodyCatalog;
  assetBase?: string;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="eye-layers-dialog" showCloseButton={false}>
        <header className="eye-layer-heading">
          <div>
            <DialogTitle>
              {parent.laterality === 'left' ? 'Left' : 'Right'} eye · layer
              dissection
            </DialogTitle>
            <DialogDescription>
              Rotate, select and remove available source components. Clinical
              validation pending.
            </DialogDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft /> Back to atlas
          </Button>
        </header>
        <EyeLayerView
          assetBase={assetBase}
          key={parent.id}
          parent={parent}
          initialSelectedId={initialSelectedId}
          initialTeachingTopic={initialTeachingTopic}
          educationCatalog={educationCatalog}
        />
      </DialogContent>
    </Dialog>
  );
}
