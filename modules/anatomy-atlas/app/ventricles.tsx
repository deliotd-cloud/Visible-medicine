'use client';
import { useCallback, useMemo, useReducer, useState } from 'react';
import { ArrowLeft, RotateCcw, Tags } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { BodyScene, retryBodyAssets } from './body-scene';
import { allBodySystems, type BodyStructure } from './body-types';
import { initialInspection } from '@/lib/inspection-state';
import {
  initialVentricles,
  reduceVentricles,
  ventricleCatalog as ventricularCatalog,
  ventricleNotes,
  ventricleReference,
  ventriclesFor,
  type VentricularAction,
  type VentricularState,
} from '@/lib/ventricles';
import {
  brainstemCatalog,
  brainstemFor,
  brainstemNotes,
  brainstemReferences,
  brainstemPresets,
} from '@/lib/brainstem';
import {
  cerebralCatalog,
  cerebralFor,
  cerebralGroups,
  cerebralNotes,
  cerebralReferences,
  cerebralPresets,
  type CerebralStructure,
} from '@/lib/cerebral';
import { CerebralLayers } from './cerebral-layers';
import type { DissectionView } from './dissection-data';
import type { BodyLayout } from '@/lib/body-arrangement';
import type { RendererHealth } from '@/lib/renderer-health';
import './eye-layers.css';

const cameraViews = [
  'anterior',
  'posterior',
  'left',
  'right',
  'superior',
  'inferior',
] as const;
const colours = ['#71b6ca', '#a1c8a1', '#cdad65', '#b396bd'];

export type BrainStudy = 'ventricles' | 'brainstem' | 'cerebral';
// Shared compact source-component workbench; the keyed parent resets state between studies.
export function VentricularView({
  parent,
  study = 'ventricles',
}: {
  parent: BodyStructure;
  study?: BrainStudy;
}) {
  const isBrainstem = study === 'brainstem';
  const isCerebral = study === 'cerebral';
  const ventricleCatalog = isCerebral
    ? cerebralCatalog
    : isBrainstem
      ? brainstemCatalog
      : ventricularCatalog;
  const layers = useMemo(
    () =>
      isCerebral
        ? cerebralFor(parent)
        : isBrainstem
          ? brainstemFor(parent)
          : ventriclesFor(parent),
    [parent, isBrainstem, isCerebral],
  );
  const selectableIds = useMemo(() => layers.map((s) => s.id), [layers]);
  const presets = useMemo<Record<string, string[]>>(
    () =>
      isCerebral
        ? cerebralPresets(layers)
        : isBrainstem
          ? brainstemPresets(layers)
          : {
              all: layers.map((s) => s.id),
              lateral: layers
                .filter((s) => s.laterality !== 'midline')
                .map((s) => s.id),
              midline: layers
                .filter((s) => s.laterality === 'midline')
                .map((s) => s.id),
            },
    [isBrainstem, isCerebral, layers],
  );
  const presetNames: Record<string, string> = isCerebral
    ? {
        all: 'All supplied regions',
        left: 'Left regions',
        right: 'Right regions',
        insula: 'Insulae',
        temporal: 'Temporal regions',
      }
    : isBrainstem
      ? {
          all: 'Brainstem and cerebellum',
          brainstem: 'Brainstem only',
          cerebellum: 'Cerebellum only',
        }
      : {
          all: 'All four spaces',
          lateral: 'Lateral ventricles',
          midline: 'Third and fourth',
        };
  const title = isCerebral
    ? 'Cerebral'
    : isBrainstem
      ? 'Brainstem'
      : 'Ventricular';
  const notes = isCerebral
    ? cerebralNotes
    : isBrainstem
      ? brainstemNotes
      : ventricleNotes;
  const [{ selectedId, hidden, history }, dispatch] = useReducer(
    (state: VentricularState, action: VentricularAction) =>
      reduceVentricles(layers, state, action, presets),
    layers,
    initialVentricles,
  );
  const [context, setContext] = useState(false),
    [labels, setLabels] = useState(true);
  const [explode, setExplode] = useState(0),
    [layout, setLayout] = useState<BodyLayout>('extract');
  const [view, setView] = useState<DissectionView>('anterior'),
    [reset, setReset] = useState(0);
  const [focus, setFocus] = useState(false),
    [isolated, setIsolated] = useState(false);
  const [loaded, setLoaded] = useState<string[]>([]),
    [failed, setFailed] = useState<string[]>([]),
    [retry, setRetry] = useState(0);
  const [health, setHealth] = useState<RendererHealth>('starting');
  const onLoaded = useCallback((id: string) => {
    setLoaded((v) => (v.includes(id) ? v : [...v, id]));
    setFailed((v) => v.filter((s) => s !== id));
  }, []);
  const onFailure = useCallback(
    (id: string) => setFailed((v) => (v.includes(id) ? v : [...v, id])),
    [],
  );
  const selected = layers.find((s) => s.id === selectedId);
  const hiddenIds = [
    ...hidden,
    ...(!context || explode > 0 ? ventricleCatalog.contextIds : []),
  ];
  const required = [
    ...new Set(
      ventricleCatalog.structures
        .filter((s) => !hiddenIds.includes(s.id))
        .map((s) => s.bundle),
    ),
  ];
  const loading = required.some(
    (id) => !loaded.includes(id) && !failed.includes(id),
  );
  const hasFailed = required.some((id) => failed.includes(id));
  const appearance = useMemo(
    () =>
      Object.fromEntries(
        ventricleCatalog.structures.map((s) => {
          const index = selectableIds.indexOf(s.id);
          return [
            s.id,
            {
              color:
                index < 0
                  ? '#9ba7a5'
                  : isCerebral
                    ? (cerebralGroups.find(
                        (g) => g.id === (s as CerebralStructure).group,
                      )?.colour ?? '#9ba7a5')
                    : colours[index],
              opacity: index < 0 ? 0.12 : 1,
            },
          ];
        }),
      ),
    [ventricleCatalog, selectableIds, isCerebral],
  );
  function select(id: string) {
    dispatch({ type: 'select', id });
    setFocus(false);
  }
  function preset(value: string) {
    dispatch({ type: 'preset', value });
    setExplode(0);
    setFocus(false);
    setIsolated(false);
  }
  const presetValue =
    Object.keys(presets).find((value) =>
      layers.every(
        (s) => hidden.includes(s.id) === !presets[value].includes(s.id),
      ),
    ) ?? 'custom';
  if (!layers.length)
    return (
      <p role="alert">
        The brain source binding has changed. This dissection is unavailable
        pending review.
      </p>
    );
  return (
    <div className="eye-layer-workbench">
      <div className="eye-layer-viewport">
        <BodyScene
          catalog={ventricleCatalog}
          structures={ventricleCatalog.structures}
          selectedId={selectedId}
          systems={allBodySystems}
          isolated={isolated && !!selected}
          hiddenIds={hiddenIds}
          ghostRemoved={false}
          illustrated
          labels={labels}
          landmarks={selectableIds}
          explode={explode}
          layout={layout}
          anchorSkeleton={false}
          showOrigins={false}
          view={view}
          zoom={1}
          reset={reset}
          focus={focus}
          exam={false}
          inspection={initialInspection}
          plate={false}
          appearance={appearance}
          retries={Object.fromEntries(
            ventricleCatalog.bundles.map((b) => [b.id, retry]),
          )}
          onSelect={select}
          onLoaded={onLoaded}
          onFailure={onFailure}
          onRendererHealth={setHealth}
        />
        {loading && (
          <output className="eye-layer-status">
            Loading {title.toLowerCase()} view…
          </output>
        )}
        {hasFailed && (
          <div className="eye-layer-status" role="alert">
            Some structures could not load.{' '}
            <Button
              size="sm"
              onClick={() => {
                retryBodyAssets(
                  ventricleCatalog.bundles
                    .filter((b) => failed.includes(b.id))
                    .map((b) => b.url),
                );
                setLoaded((v) => v.filter((id) => !failed.includes(id)));
                setFailed([]);
                setRetry((v) => v + 1);
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {hidden.length === layers.length && (
          <p className="eye-layer-status">
            All selectable structures are hidden.{' '}
            <Button size="sm" onClick={() => preset('all')}>
              Show all
            </Button>
          </p>
        )}
        <div className="eye-layer-scene-tools">
          <Select
            value={view}
            onValueChange={(v) => {
              if (v && cameraViews.includes(v as DissectionView))
                setView(v as DissectionView);
            }}
          >
            <SelectTrigger aria-label={`${title} camera view`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cameraViews.map((v) => (
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
              setReset((v) => v + 1);
              setFocus(false);
            }}
          >
            <RotateCcw /> Frame all
          </Button>
        </div>
        {explode > 0 && (
          <p className="eye-layer-layout-note">
            Separated teaching layout · not anatomical positions. Context hidden
            until reassembled.
          </p>
        )}
      </div>
      <aside
        className="eye-layer-controls"
        aria-label={`${title} dissection controls`}
      >
        <div className="eye-layer-presets">
          <label htmlFor="ventricular-preset">Study view</label>
          <Select
            value={presetValue}
            onValueChange={(v) => {
              if (v && Object.hasOwn(presets, v)) preset(v);
            }}
          >
            <SelectTrigger id="ventricular-preset">
              <SelectValue>
                {presetNames[presetValue] ?? 'Custom selection'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(presetNames).map(([value, name]) => (
                <SelectItem key={value} value={value}>
                  {name}
                </SelectItem>
              ))}
              <SelectItem value="custom" disabled>
                Custom selection
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isCerebral ? (
          <CerebralLayers
            layers={layers as CerebralStructure[]}
            selectedId={selectedId}
            hidden={hidden}
            onSelect={select}
            onVisibility={(id, visible) => {
              dispatch({ type: 'visibility', id, visible });
              setFocus(false);
              if (!visible && selectedId === id) setIsolated(false);
            }}
          />
        ) : (
          <ul className="eye-layer-list">
            {layers.map((s) => (
              <li key={s.id}>
                <Button
                  size="sm"
                  variant={selectedId === s.id ? 'secondary' : 'ghost'}
                  aria-pressed={selectedId === s.id}
                  onClick={() => select(s.id)}
                >
                  {s.name.replace(' ventricle', '')}
                </Button>
                <Switch
                  checked={!hidden.includes(s.id)}
                  aria-label={`Show ${s.name.toLowerCase()}`}
                  onCheckedChange={(visible) => {
                    dispatch({ type: 'visibility', id: s.id, visible });
                    setFocus(false);
                    if (!visible && selectedId === s.id) setIsolated(false);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
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
            onClick={() => {
              preset('all');
              setReset((v) => v + 1);
            }}
          >
            Reassemble
          </Button>
          <Button
            size="sm"
            variant={context ? 'default' : 'outline'}
            aria-pressed={context}
            disabled={explode > 0}
            onClick={() => setContext((v) => !v)}
          >
            {isCerebral
              ? 'Show lateral ventricles'
              : isBrainstem
                ? 'Show fourth ventricle'
                : 'Show brain context'}
          </Button>
        </div>
        {context && explode === 0 && (
          <p>
            {isCerebral
              ? 'Faint lateral ventricular spaces provide orientation, not a registered scan or cortical boundary.'
              : isBrainstem
                ? 'Faint context shows the fourth ventricular space, not tissue or a measured cavity wall.'
                : 'Faint context: thalami, caudate nuclei and corpus callosum. These are whole structures, not separately segmented ventricular walls.'}
          </p>
        )}
        <details className="eye-layer-separation">
          <summary>
            {study !== 'ventricles' ? 'Separate structures' : 'Separate spaces'}
          </summary>
          <Select
            value={layout}
            onValueChange={(v) => {
              if (v === 'extract' || v === 'tray' || v === 'spatial') {
                setLayout(v);
                setExplode(0);
              }
            }}
          >
            <SelectTrigger aria-label={`${title} separation mechanism`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="extract">Lift selected</SelectItem>
              <SelectItem value="spatial">Spread in 3D</SelectItem>
              <SelectItem value="tray">Spread on flat plate</SelectItem>
            </SelectContent>
          </Select>
          <label htmlFor="ventricular-explode">Separation · {explode}%</label>
          <Slider
            id="ventricular-explode"
            aria-label={`${title} separation`}
            min={0}
            max={100}
            step={1}
            value={[explode]}
            disabled={layout === 'extract' && !selected}
            onValueChange={(v) => setExplode(Array.isArray(v) ? v[0] : v)}
          />
          <p>
            Separate for shape comparison; return to 0% to study anatomical
            relationships. This is not a surgical or fluid-flow simulation.
          </p>
        </details>
        {selected && (
          <section className="eye-layer-teaching" aria-live="polite">
            <h3>{selected.name}</h3>
            <span className="eye-layer-source-id">
              {selected.fmaId} ·{' '}
              {isCerebral
                ? cerebralCatalog.supplementalIds.includes(selected.id)
                  ? 'Additional source part'
                  : 'Partial source coverage'
                : isBrainstem
                  ? 'Source compound'
                  : 'Space representation'}{' '}
              · Draft
            </span>
            <p>{notes[selected.fmaId]}</p>
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
                disabled={health !== 'ready' || loading || hasFailed}
                onClick={() => setFocus((v) => !v)}
              >
                Frame selected
              </Button>
            </div>
          </section>
        )}
        <details className="eye-layer-limits">
          <summary>Learning and limitations</summary>
          {isCerebral ? (
            <>
              <p>
                These are supplied cortical regions, not a complete cortex.
                Eight original lobe representations and two insulae are
                supplemented by four separately labelled superior temporal
                subdivisions from the same source version.
              </p>
              <p>
                The added parts were absent from the original brain. Reference
                surfaces agree in source coordinates, but this is not clinical
                registration. Small detached frontal components remain
                unchanged. Limbic lobes, full white matter and functional
                territories are not independently delineated.
              </p>
            </>
          ) : isBrainstem ? (
            <>
              <p>
                Four complete source-table compounds, not proof of complete
                anatomy. Both source halves are retained. Colours distinguish
                structures, not MRI signal or functional territories.
              </p>
              <p>
                Internal nuclei, tracts and cerebellar lobules are not
                independently segmented. The pons source retains tiny
                disconnected remnants and duplicate faces; it has not been
                repaired or clinically validated.
              </p>
            </>
          ) : (
            <>
              <p>
                Ventricles contain cerebrospinal fluid; coloured shapes
                represent spaces, not solid tissue. Aqueduct, foramina,
                subdivisions and flow are not independently modelled.
              </p>
            </>
          )}
          <p>
            No CT/MRI correspondence, diagnostic measurement or clinical
            approval is provided. The main brain is not rendered over these
            components.
          </p>
          {(isCerebral
            ? cerebralReferences
            : isBrainstem
              ? brainstemReferences
              : [ventricleReference]
          ).map((href, i) => (
            <p key={href}>
              <a href={href} target="_blank" rel="noreferrer">
                University neuroanatomy reference {i + 1}
              </a>
            </p>
          ))}
          <p>{ventricleCatalog.credit}</p>
          <p>
            Source components separated, transformed, normal-smoothed and
            recoloured; no triangles intentionally removed or coordinates
            reconstructed. Context reuses existing source surfaces.
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

export default function Ventricles({
  parent,
  onClose,
}: {
  parent: BodyStructure;
  onClose: () => void;
}) {
  const [study, setStudy] = useState<BrainStudy>('brainstem');
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="eye-layers-dialog" showCloseButton={false}>
        <header className="eye-layer-heading brain-study-heading">
          <div>
            <DialogTitle>Brain · source dissection</DialogTitle>
            <DialogDescription>
              Source-based anatomy studies. Clinical validation pending.
            </DialogDescription>
          </div>
          <Select
            value={study}
            onValueChange={(v) => {
              if (v === 'brainstem' || v === 'ventricles' || v === 'cerebral')
                setStudy(v);
            }}
          >
            <SelectTrigger aria-label="Brain dissection study">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brainstem">
                Brainstem and cerebellum
              </SelectItem>
              <SelectItem value="ventricles">Ventricular spaces</SelectItem>
              <SelectItem value="cerebral">Cerebral regions</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft /> Back to atlas
          </Button>
        </header>
        <VentricularView
          key={`${parent.id}:${study}`}
          parent={parent}
          study={study}
        />
      </DialogContent>
    </Dialog>
  );
}
