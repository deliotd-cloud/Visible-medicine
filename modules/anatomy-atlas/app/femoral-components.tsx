'use client';
import { useCallback, useMemo, useReducer, useState } from 'react';
import {
  cranialArteryComponentsFor,
  cranialArteryComponentViewCatalog,
} from '@/lib/cranial-artery-components';
import { ArrowLeft, Focus, RotateCcw, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { BodyScene, retryBodyAssets } from './body-scene';
import { allBodySystems, type BodyStructure } from './body-types';
import { NestedTeaching } from './nested-teaching';
import { CutawayControls, cutPlanes } from './cutaway-controls';
import { initialInspection } from '@/lib/inspection-state';
import {
  selectionBounds,
  selectionVisibility,
} from '@/lib/selection-visibility';
import {
  initialVentricles,
  reduceVentricles,
  type VentricularState,
  type VentricularAction,
} from '@/lib/ventricles';
import {
  femoralComponentsFor,
  femoralComponentViewCatalog,
  femoralComponentPresets,
  femoralComponentLabel,
  femoralComponentColour,
} from '@/lib/femoral-components';
import type { BodyLayout } from '@/lib/body-arrangement';
import type { RendererHealth } from '@/lib/renderer-health';
import type { DissectionView } from './dissection-data';
import type { NestedImagingTopic } from '@/content/nested-teaching';
import './eye-layers.css';

type Props = {
  parent: BodyStructure;
  study?: 'femoral-components' | 'cranial-artery-components';
  initialSelectedId?: string;
  initialTeachingTopic?: NestedImagingTopic;
  assetBase?: string;
};
const views = [
  'anterior',
  'posterior',
  'left',
  'right',
  'superior',
  'inferior',
] as const;
const layouts = {
  extract: 'Lift selected',
  spatial: 'Spread in 3D',
  tray: 'Flat teaching plate',
};
const femoralPresetNames = {
  all: 'Both source components',
  lateral: 'Lateral circumflex',
  remainder: 'Source remainder',
};

export function FemoralComponentView({
  parent,
  study = 'femoral-components',
  initialSelectedId,
  initialTeachingTopic,
  assetBase = '',
}: Props) {
  const catalog = useMemo(
    () =>
      study === 'cranial-artery-components'
        ? cranialArteryComponentViewCatalog(parent)
        : femoralComponentViewCatalog(parent),
    [parent, study],
  );
  const parts = useMemo(
    () =>
      study === 'cranial-artery-components'
        ? cranialArteryComponentsFor(parent)
        : femoralComponentsFor(parent),
    [parent, study],
  );
  const presets: Record<string, string[]> = useMemo(
    () =>
      study === 'cranial-artery-components'
        ? { all: parts.map((s) => s.id) }
        : femoralComponentPresets(femoralComponentsFor(parent)),
    [parts, parent, study],
  );
  const presetNames: Record<string, string> =
    study === 'cranial-artery-components'
      ? { all: `All ${parts.length} source parts` }
      : femoralPresetNames;
  // All supplied components set the clipping frame, even after hiding a part.
  const frame = useMemo(() => selectionBounds(parts), [parts]);
  const initialSelection = parts.find((s) => s.id === initialSelectedId)?.id;
  const [{ selectedId, hidden, history, future }, dispatch] = useReducer(
    (s: VentricularState, a: VentricularAction) =>
      reduceVentricles(parts, s, a, presets),
    parts,
    (items) => ({
      ...initialVentricles(items),
      selectedId:
        initialSelection ??
        items.find((s) => s.role === 'lateral-circumflex')?.id ??
        (study === 'cranial-artery-components' ? items[0]?.id : null) ??
        null,
    }),
  );
  const [inspection, setInspection] = useState(initialInspection);
  const [layout, setLayout] = useState<BodyLayout>('extract');
  const [explode, setExplode] = useState(0),
    [showOrigins, setShowOrigins] = useState(false);
  const [view, setView] = useState<DissectionView>('anterior'),
    [labels, setLabels] = useState(true);
  const [isolated, setIsolated] = useState(!!initialSelection),
    [focus, setFocus] = useState(false),
    [reset, setReset] = useState(0);
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  const [health, setHealth] = useState<RendererHealth>('starting');
  const onLoaded = useCallback(() => {
    setLoaded(true);
    setFailed(false);
  }, []);
  const onFailure = useCallback(() => {
    setFailed(true);
    setLoaded(false);
  }, []);
  const selected = parts.find((s) => s.id === selectedId);
  const appearance = useMemo(
    () =>
      Object.fromEntries(
        parts.map((s) => [
          s.id,
          {
            color:
              s.role === 'source-part'
                ? s.sourceOrder % 2
                  ? '#be6157'
                  : '#975349'
                : femoralComponentColour(s),
            opacity: 1,
          },
        ]),
      ),
    [parts],
  );
  const preset =
    Object.entries(presets).find(([, ids]) =>
      parts.every((s) => ids.includes(s.id) === !hidden.includes(s.id)),
    )?.[0] ?? 'custom';
  const visibility = selected
    ? selectionVisibility({
        system: selected.system,
        enabled: true,
        bounds: selected.bounds,
        frame,
        inspection,
      })
    : null;
  function change(action: VentricularAction) {
    dispatch(action);
    setFocus(false);
    setIsolated(false);
  }
  function showPreset(value: string) {
    if (!Object.hasOwn(presets, value)) return;
    change({ type: 'preset', value });
    setExplode(0);
    setInspection(initialInspection);
  }
  if (!parts.length || (initialSelectedId !== undefined && !initialSelection))
    return (
      <p role="alert">
        This source binding is unavailable. Return to the atlas and select the
        current artery source.
      </p>
    );
  return (
    <div className="eye-layer-workbench">
      <div className="eye-layer-viewport">
        <BodyScene
          assetBase={assetBase}
          catalog={catalog}
          structures={parts}
          selectedId={selectedId}
          systems={allBodySystems}
          isolated={isolated && !!selected}
          hiddenIds={hidden}
          ghostRemoved={false}
          illustrated
          labels={labels}
          landmarks={parts.map((s) => s.id)}
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
          inspectionBounds={frame}
          plate={false}
          appearance={appearance}
          retries={{ [study]: retry }}
          onSelect={(id) => change({ type: 'select', id })}
          onLoaded={onLoaded}
          onFailure={onFailure}
          onRendererHealth={setHealth}
        />
        {!loaded && !failed && (
          <output className="eye-layer-status">
            Loading artery components…
          </output>
        )}
        {failed && (
          <div className="eye-layer-status" role="alert">
            Components could not load.{' '}
            <Button
              size="sm"
              onClick={() => {
                retryBodyAssets(catalog.bundles.map((b) => b.url), assetBase);
                setLoaded(false);
                setFailed(false);
                setHealth('starting');
                setRetry((r) => r + 1);
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {hidden.length === parts.length && (
          <p className="eye-layer-status">
            {study === 'cranial-artery-components'
              ? 'All source parts are hidden.'
              : 'Both components are hidden.'}{' '}
            <Button size="sm" onClick={() => showPreset('all')}>
              Show all
            </Button>
          </p>
        )}
        <div className="eye-layer-scene-tools">
          <Select
            value={view}
            onValueChange={(v) => {
              if (views.includes(v as DissectionView))
                setView(v as DissectionView);
            }}
          >
            <SelectTrigger aria-label="Artery camera view">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {views.map((v) => (
                <SelectItem key={v} value={v}>
                  {v[0].toUpperCase() + v.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={labels ? 'default' : 'outline'}
            aria-pressed={labels}
            onClick={() => setLabels((v) => !v)}
          >
            <Tags /> Labels
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFocus(false);
              setReset((r) => r + 1);
            }}
          >
            <RotateCcw /> Frame all
          </Button>
        </div>
        {(explode > 0 || inspection.plane !== 'off') && (
          <p className="eye-layer-layout-note">
            <span>
              {explode > 0 && 'Separated layout · not anatomical positions'}
              {explode > 0 && inspection.plane !== 'off' && ' · '}
              {inspection.plane !== 'off' &&
                `${cutPlanes[inspection.plane]} cut · not a scan`}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setExplode(0);
                setInspection(initialInspection);
                setFocus(false);
              }}
            >
              Restore source position
            </Button>
          </p>
        )}
      </div>
      <aside
        className="eye-layer-controls"
        aria-label="Artery component controls"
      >
        {study === 'femoral-components' && (
          <div className="eye-layer-presets">
            <label htmlFor="femoral-component-preset">Study view</label>
            <Select
              value={preset}
              onValueChange={(v) => {
                if (v) showPreset(v);
              }}
            >
              <SelectTrigger id="femoral-component-preset">
                <SelectValue>
                  {presetNames[preset as keyof typeof presetNames] ??
                    'Custom selection'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(presetNames).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <ul
          className={`eye-layer-list${study === 'cranial-artery-components' ? ' artery-source-part-list' : ''}`}
          aria-label="Artery source parts"
          tabIndex={study === 'cranial-artery-components' ? 0 : undefined}
        >
          {parts.map((s) => (
            <li key={s.id}>
              <Button
                size="sm"
                variant={s.id === selectedId ? 'secondary' : 'ghost'}
                aria-pressed={s.id === selectedId}
                onClick={() => change({ type: 'select', id: s.id })}
              >
                {s.role === 'source-part' ? s.name : femoralComponentLabel(s)}
              </Button>
              <Switch
                checked={!hidden.includes(s.id)}
                aria-label={`Show ${s.name.toLowerCase()}`}
                onCheckedChange={(visible) =>
                  change({ type: 'visibility', id: s.id, visible })
                }
              />
            </li>
          ))}
        </ul>
        <div className="eye-layer-actions">
          <Button
            size="sm"
            variant="outline"
            disabled={!history.length}
            onClick={() => change({ type: 'undo' })}
          >
            Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!future.length}
            onClick={() => change({ type: 'redo' })}
          >
            Redo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              showPreset('all');
              setReset((r) => r + 1);
            }}
          >
            Reassemble
          </Button>
        </div>
        <CutawayControls
          subject="Artery"
          positionId="femoral-component-cut-position"
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
              if (v && Object.hasOwn(layouts, v)) {
                setLayout(v as BodyLayout);
                setExplode(0);
                setFocus(false);
              }
            }}
          >
            <SelectTrigger aria-label="Artery separation mechanism">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(layouts).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label htmlFor="femoral-component-separation">
            Separation · {explode}%
          </label>
          <Slider
            id="femoral-component-separation"
            aria-label="Artery component separation"
            aria-valuetext={`${explode}%`}
            min={0}
            max={100}
            step={1}
            value={[explode]}
            disabled={layout === 'extract' && !selected}
            onValueChange={(v) => {
              const amount = Array.isArray(v) ? v[0] : v;
              if (Number.isFinite(amount)) {
                setExplode(Math.max(0, Math.min(100, amount)));
                setFocus(false);
              }
            }}
          />
          <label
            className="origin-guide-toggle"
            htmlFor="femoral-component-origin"
          >
            Show original position
            <Switch
              id="femoral-component-origin"
              checked={showOrigins}
              onCheckedChange={setShowOrigins}
            />
          </label>
          <p>
            The selected-part guide marks its source position, not a vessel
            connection. Hidden in cutaway and flat-plate views.
          </p>
        </details>
        {selected && (
          <section className="eye-layer-teaching" aria-live="polite">
            <h3>{selected.name}</h3>
            <span className="eye-layer-source-id">
              {selected.sources[0].file} · Source component · Draft
            </span>
            <p>{selected.coverageNote}</p>
            {visibility?.clipped && (
              <output className="eye-layer-cut-warning">
                The cutaway hides some or all of this component. Restore source
                position to remove the cut.
              </output>
            )}
            <div className="eye-layer-actions">
              <Button
                size="sm"
                variant={isolated ? 'default' : 'outline'}
                aria-pressed={isolated}
                onClick={() => setIsolated((v) => !v)}
              >
                Fade others
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!loaded || health !== 'ready'}
                onClick={() => setFocus((v) => !v)}
              >
                <Focus /> Frame selected
              </Button>
            </div>
            {study === 'femoral-components' ? (
              <NestedTeaching
                parent={parent}
                study="femoral-components"
                selected={selected}
                initialTopic={
                  selected.id === initialSelection
                    ? initialTeachingTopic
                    : undefined
                }
              />
            ) : (
              <p className="eye-layer-source-id">
                Parent concept: {parent.fmaId}. Unnamed source part; no
                independent clinical lesson, imaging registration or
                branch-order claim.
              </p>
            )}
          </section>
        )}
        <details className="eye-layer-limits">
          <summary>Source and limitations</summary>
          {study === 'femoral-components' ? (
            <p>
              These two components partition the existing aggregate without
              adding tissue. The remainder is not a complete artery or a
              separately named perforator. Vessel junctions and anatomical
              extent need review.
            </p>
          ) : (
            <p>
              These {parts.length} source-file parts partition the existing
              artery selection exactly. All original triangle corners and vertex
              normals are retained. A source file can contain several
              disconnected pieces. Numbering identifies archive parts, not named
              branches or clinical segments. No additional root anatomy is
              created.
            </p>
          )}
          <p>{catalog.credit}</p>
          <p>
            Source surfaces separated and recoloured; established coordinate
            transform retained
            {study === 'femoral-components'
              ? ' and normals recomputed'
              : ' with original rendered normals'}
            . No fitting, mirroring or invented connections.
          </p>
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0 licence
          </a>
        </details>
      </aside>
    </div>
  );
}

export default function FemoralComponents({
  onClose,
  ...props
}: Props & { onClose: () => void }) {
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
            <DialogTitle>{props.parent.name} · source dissection</DialogTitle>
            <DialogDescription>
              {props.study === 'cranial-artery-components'
                ? `${cranialArteryComponentsFor(props.parent).length} original source parts.`
                : 'Two supplied components.'}{' '}
              Anatomical validation pending.
            </DialogDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft /> Back to atlas
          </Button>
        </header>
        <FemoralComponentView
          key={`${props.parent.id}:${props.study ?? 'femoral-components'}`}
          {...props}
        />
      </DialogContent>
    </Dialog>
  );
}
