'use client';
import { useCallback, useMemo, useReducer, useState } from 'react';
import { NestedTeaching } from './nested-teaching';
import type { NestedImagingTopic } from '@/content/nested-teaching';
import {
  pancreaticCatalog,
  pancreaticFor,
  pancreaticViewCatalog,
  pancreaticPresets,
  pancreaticNotes,
  pancreaticColour,
  pancreaticReferences,
} from '@/lib/pancreatic';
import {
  cricothyroidCatalog,
  cricothyroidFor,
  cricothyroidViewCatalog,
  cricothyroidPresets,
  cricothyroidNotes,
  cricothyroidColour,
  cricothyroidReferences,
} from '@/lib/cricothyroid';
import {
  visualPathwayCatalog,
  visualPathwayFor,
  visualPathwayPresets,
  visualPathwayNotes,
  visualPathwayColour,
  visualPathwayReferences,
} from '@/lib/visual-pathway';
import {
  visualContextViewCatalog,
  visualRelationshipsFor,
} from '@/lib/visual-pathway-context';
import {
  renalFor,
  renalPresets,
  renalNotes,
  renalColour,
  renalReferences,
} from '@/lib/renal';
import {
  renalRelationshipsFor,
  renalRelationshipViewCatalog,
} from '@/lib/renal-relationships';
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
  selectionBounds,
  selectionVisibility,
} from '@/lib/selection-visibility';
import { CutawayControls, cutPlanes } from './cutaway-controls';
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
import {
  cardiacCatalog,
  cardiacFor,
  cardiacNotes,
  cardiacPresets,
  cardiacReference,
} from '@/lib/cardiac';
import { ventricularRelationshipsFor } from '@/lib/ventricular-relationships';
import {
  hepaticBiliaryRelationshipsFor,
  hepaticBiliaryViewCatalog,
  hepaticBiliaryColour,
} from '@/lib/hepatic-biliary-context';
import {
  cardiacRelationshipsFor,
  cardiacContextViewCatalog,
  cardiacVesselColour,
} from '@/lib/cardiac-context';
import {
  pulmonaryFor,
  pulmonaryViewCatalog,
  pulmonaryNotes,
  pulmonaryPresets,
  pulmonaryReferences,
} from '@/lib/pulmonary';
import { neuroGroupFor } from '@/lib/neuroanatomy';
import {
  hepaticFor,
  hepaticViewCatalog,
  hepaticNotes,
  hepaticPresets,
  hepaticCatalog,
  hepaticReference,
} from '@/lib/hepatic';
import {
  pulmonaryAirwayFor,
  pulmonaryContextViewCatalog,
  pulmonaryAirwayColour,
  pulmonaryAirwayReference,
} from '@/lib/pulmonary-context';
import type { DissectionView } from './dissection-data';
import type { BodyLayout } from '@/lib/body-arrangement';
import type { RendererHealth } from '@/lib/renderer-health';
import './eye-layers.css';
import './ventricular-relationships.css';

const cameraViews = [
  'anterior',
  'posterior',
  'left',
  'right',
  'superior',
  'inferior',
] as const;
const colours = ['#71b6ca', '#a1c8a1', '#cdad65', '#b396bd'];
const relationshipSelectionIds = (r: {
  spaceId: string;
  visibleIds?: string[];
}) => r.visibleIds ?? [r.spaceId];

export type BrainStudy =
  'ventricles' | 'brainstem' | 'cerebral' | 'visual-pathway';
export type ComponentStudy =
  | BrainStudy
  | 'cardiac'
  | 'pulmonary'
  | 'hepatic'
  | 'pancreatic'
  | 'renal'
  | 'cricothyroid';
// Shared compact source-component workbench; the keyed parent resets state between studies.
export function VentricularView({
  parent,
  study = 'ventricles',
  initialSelectedId,
  initialTeachingTopic,
}: {
  parent: BodyStructure;
  study?: ComponentStudy;
  initialSelectedId?: string;
  initialTeachingTopic?: NestedImagingTopic;
}) {
  const isBrainstem = study === 'brainstem';
  const isCerebral = study === 'cerebral';
  const isCardiac = study === 'cardiac';
  const isPulmonary = study === 'pulmonary';
  const isHepatic = study === 'hepatic';
  const isRenal = study === 'renal';
  const isPancreatic = study === 'pancreatic';
  const isCricothyroid = study === 'cricothyroid';
  const isVisual = study === 'visual-pathway';
  const lungCatalog = useMemo(() => pulmonaryViewCatalog(parent), [parent]);
  const baseCatalog = isCricothyroid
    ? cricothyroidCatalog
    : isPancreatic
      ? pancreaticCatalog
      : isVisual
        ? visualPathwayCatalog
        : isPulmonary
          ? lungCatalog
          : isCardiac
            ? cardiacCatalog
            : isCerebral
              ? cerebralCatalog
              : isBrainstem
                ? brainstemCatalog
                : ventricularCatalog;
  const layers = useMemo(
    () =>
      isCricothyroid
        ? cricothyroidFor(parent)
        : isPancreatic
          ? pancreaticFor(parent)
          : isVisual
            ? visualPathwayFor(parent)
            : isRenal
              ? renalFor(parent)
              : isHepatic
                ? hepaticFor(parent)
                : isPulmonary
                  ? pulmonaryFor(parent)
                  : isCardiac
                    ? cardiacFor(parent)
                    : isCerebral
                      ? cerebralFor(parent)
                      : isBrainstem
                        ? brainstemFor(parent)
                        : ventriclesFor(parent),
    [
      parent,
      isCricothyroid,
      isPancreatic,
      isBrainstem,
      isCerebral,
      isCardiac,
      isPulmonary,
      isHepatic,
      isRenal,
      isVisual,
    ],
  );
  const selectableIds = useMemo(() => layers.map((s) => s.id), [layers]);
  // Only the complete selectable source set defines the cut; context/hiding never shifts it.
  const inspectionBounds = useMemo(() => selectionBounds(layers), [layers]);
  const [inspection, setInspection] = useState(initialInspection);
  const initialSelection = layers.find((s) => s.id === initialSelectedId)?.id;
  const relationships = useMemo(
    () =>
      isVisual
        ? visualRelationshipsFor(parent)
        : isRenal
          ? renalRelationshipsFor(parent)
          : isHepatic
            ? hepaticBiliaryRelationshipsFor(parent)
            : isCardiac
              ? cardiacRelationshipsFor(parent)
              : study === 'ventricles'
                ? ventricularRelationshipsFor(parent)
                : [],
    [parent, study, isCardiac, isVisual, isRenal, isHepatic],
  );
  const presets = useMemo<Record<string, string[]>>(
    () =>
      isCricothyroid
        ? cricothyroidPresets(layers)
        : isPancreatic
          ? pancreaticPresets(layers)
          : isVisual
            ? {
                ...visualPathwayPresets(layers),
                ...Object.fromEntries(
                  relationships.map((r) => [r.id, [r.spaceId]]),
                ),
              }
            : isRenal
              ? {
                  ...renalPresets(layers),
                  ...Object.fromEntries(
                    relationships.map((r) => [
                      r.id,
                      relationshipSelectionIds(r),
                    ]),
                  ),
                }
              : isHepatic
                ? {
                    ...hepaticPresets(layers),
                    ...Object.fromEntries(
                      relationships.map((r) => [
                        r.id,
                        relationshipSelectionIds(r),
                      ]),
                    ),
                  }
                : isPulmonary
                  ? pulmonaryPresets(layers)
                  : isCardiac
                    ? {
                        ...cardiacPresets(layers),
                        ...Object.fromEntries(
                          relationships.map((r) => [r.id, [r.spaceId]]),
                        ),
                      }
                    : isCerebral
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
                            ...Object.fromEntries(
                              relationships.map((r) => [r.id, [r.spaceId]]),
                            ),
                          },
    [
      isCricothyroid,
      isPancreatic,
      isBrainstem,
      isCerebral,
      isCardiac,
      isPulmonary,
      isHepatic,
      isRenal,
      isVisual,
      layers,
      relationships,
    ],
  );
  const presetNames: Record<string, string> = isCricothyroid
    ? {
        all: 'All four muscle parts',
        straight: 'Straight parts',
        oblique: 'Oblique parts',
        right: 'Right muscle parts',
        left: 'Left muscle parts',
      }
    : isPancreatic
      ? {
          all: 'Both duct sources',
          duct: 'Pancreatic duct',
          tree: 'Duct-tree source',
        }
      : isVisual
        ? {
            all: 'Chiasm and both tracts',
            chiasm: 'Chiasm only',
            tracts: 'Both optic tracts',
            right: 'Chiasm and right tract',
            left: 'Chiasm and left tract',
            ...Object.fromEntries(relationships.map((r) => [r.id, r.title])),
          }
        : isRenal
          ? {
              all: 'All supplied vessels',
              arteries: 'Arterial branches',
              veins: 'Venous groups',
              adrenal: 'Adrenal vessels',
              ...Object.fromEntries(
                relationships.map((r) => [r.id, r.title]),
              ),
            }
          : isHepatic
            ? {
                all: 'All internal branches',
                artery: 'Hepatic arterial branches',
                portal: 'Portal vein branches',
                biliary: 'Bile ducts',
                venous: 'Middle hepatic vein tributary',
                ...Object.fromEntries(
                  relationships.map((r) => [r.id, r.title]),
                ),
              }
            : isPulmonary
              ? Object.fromEntries(
                  Object.keys(presets).map((key) => [
                    key,
                    key === 'all'
                      ? 'All supplied branch groups'
                      : `${key[0].toUpperCase() + key.slice(1)} lobe branches`,
                  ]),
                )
              : isCardiac
                ? {
                    all: 'Four chamber spaces',
                    right: 'Right heart spaces',
                    left: 'Left heart spaces',
                    atria: 'Atrial spaces',
                    ventricles: 'Ventricular spaces',
                    ...Object.fromEntries(
                      relationships.map((r) => [r.id, r.title]),
                    ),
                  }
                : isCerebral
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
                        ...Object.fromEntries(
                          relationships.map((r) => [r.id, r.title]),
                        ),
                      };
  const title = isCricothyroid
    ? 'Cricothyroid'
    : isPancreatic
      ? 'Pancreatic'
      : isVisual
        ? 'Optic pathway'
        : isRenal
          ? 'Renal vascular'
          : isHepatic
            ? 'Liver'
            : isPulmonary
              ? 'Lung'
              : isCardiac
                ? 'Cardiac'
                : isCerebral
                  ? 'Cerebral'
                  : isBrainstem
                    ? 'Brainstem'
                    : 'Ventricular';
  const notes = isCricothyroid
    ? cricothyroidNotes
    : isPancreatic
      ? pancreaticNotes
      : isVisual
        ? visualPathwayNotes
        : isRenal
          ? renalNotes
          : isHepatic
            ? hepaticNotes
            : isPulmonary
              ? pulmonaryNotes
              : isCardiac
                ? cardiacNotes
                : isCerebral
                  ? cerebralNotes
                  : isBrainstem
                    ? brainstemNotes
                    : ventricleNotes;
  const [{ selectedId, hidden, history, future }, dispatch] = useReducer(
    (state: VentricularState, action: VentricularAction) =>
      reduceVentricles(layers, state, action, presets),
    layers,
    (items) => ({
      ...initialVentricles(items),
      ...(initialSelection ? { selectedId: initialSelection } : {}),
    }),
  );
  const [context, setContext] = useState(
      isRenal || isPancreatic || isCricothyroid,
    ),
    [labels, setLabels] = useState(true);
  const [explode, setExplode] = useState(0),
    [layout, setLayout] = useState<BodyLayout>('extract');
  const [showOrigins, setShowOrigins] = useState(false);
  const [view, setView] = useState<DissectionView>(
      isVisual ? 'inferior' : 'anterior',
    ),
    [reset, setReset] = useState(0);
  const [focus, setFocus] = useState(false),
    [isolated, setIsolated] = useState(!!initialSelection);
  const [loaded, setLoaded] = useState<string[]>([]),
    [failed, setFailed] = useState<string[]>([]),
    [retry, setRetry] = useState(0);
  const [health, setHealth] = useState<RendererHealth>('starting');
  const [relationshipId, setRelationshipId] = useState<string | null>(null);
  const airwayContext = useMemo(
    () => (isPulmonary ? pulmonaryAirwayFor(parent) : []),
    [isPulmonary, parent],
  );
  const ventricleCatalog = useMemo(
    () =>
      isCricothyroid
        ? cricothyroidViewCatalog(parent, context && explode === 0)
        : isPancreatic
          ? pancreaticViewCatalog(parent, context && explode === 0)
          : isVisual
            ? visualContextViewCatalog(
                parent,
                context && explode === 0,
                relationshipId,
              )
            : isRenal
              ? renalRelationshipViewCatalog(
                  parent,
                  context && explode === 0,
                  relationshipId,
                )
              : isCardiac
                ? cardiacContextViewCatalog(
                    parent,
                    context && explode === 0 ? relationshipId : null,
                  )
                : isHepatic
                  ? hepaticBiliaryViewCatalog(
                      parent,
                      context && explode === 0,
                      relationshipId,
                    )
                  : isPulmonary
                    ? pulmonaryContextViewCatalog(
                        parent,
                        context && explode === 0,
                      )
                    : baseCatalog,
    [
      isCricothyroid,
      isPancreatic,
      isCardiac,
      isPulmonary,
      isHepatic,
      parent,
      isRenal,
      isVisual,
      context,
      explode,
      baseCatalog,
      relationshipId,
    ],
  );
  const relationship = relationships.find((r) => r.id === relationshipId);
  const guidedAppearance = !!relationship && context && explode === 0;
  const onLoaded = useCallback((id: string) => {
    setLoaded((v) => (v.includes(id) ? v : [...v, id]));
    setFailed((v) => v.filter((s) => s !== id));
  }, []);
  const onFailure = useCallback(
    (id: string) => setFailed((v) => (v.includes(id) ? v : [...v, id])),
    [],
  );
  const selected = layers.find((s) => s.id === selectedId);
  const cutSelection = selected
    ? selectionVisibility({
        system: selected.system,
        enabled: true,
        bounds: selected.bounds,
        frame: inspectionBounds,
        inspection,
      })
    : null;
  const hiddenIds = [
    ...hidden,
    ...(!context || explode > 0 ? ventricleCatalog.contextIds : []),
    ...(relationship
      ? ventricleCatalog.contextIds.filter(
          (id) => !relationship.context.some((s) => s.id === id),
        )
      : []),
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
              color: isCricothyroid
                ? cricothyroidColour(s)
                : isPancreatic
                  ? pancreaticColour(s)
                  : isVisual
                    ? visualPathwayColour(s)
                    : isRenal
                      ? renalColour(s)
                      : isHepatic
                        ? hepaticBiliaryColour(s)
                        : index < 0
                          ? isPulmonary
                            ? pulmonaryAirwayColour(s)
                            : isCardiac && guidedAppearance
                              ? cardiacVesselColour(s)
                              : guidedAppearance
                                ? (neuroGroupFor(s.fmaId)?.color ?? '#9ba7a5')
                                : '#9ba7a5'
                          : isCerebral
                            ? (cerebralGroups.find(
                                (g) =>
                                  g.id === (s as CerebralStructure).group,
                              )?.colour ?? '#9ba7a5')
                            : colours[index],
              opacity:
                index < 0
                  ? isCricothyroid
                    ? 0.3
                    : isRenal
                      ? s.system === 'organs'
                        ? 0.12
                        : 0.35
                      : isHepatic
                        ? hepaticCatalog.contextIds.includes(s.id)
                          ? 0.12
                          : 0.45
                        : isPulmonary
                          ? 0.34
                          : guidedAppearance
                            ? 0.42
                            : 0.12
                  : guidedAppearance
                    ? 0.7
                    : 1,
            },
          ];
        }),
      ),
    [
      ventricleCatalog,
      isCricothyroid,
      isPancreatic,
      selectableIds,
      isCerebral,
      isPulmonary,
      isHepatic,
      isCardiac,
      guidedAppearance,
      isRenal,
      isVisual,
    ],
  );
  function select(id: string) {
    if (!selectableIds.includes(id)) return;
    dispatch({ type: 'select', id });
    if (relationship && !relationshipSelectionIds(relationship).includes(id))
      setRelationshipId(null);
    setFocus(false);
  }
  function preset(value: string) {
    if (!Object.hasOwn(presets, value)) return;
    const nextRelationship = relationships.find((r) => r.id === value);
    dispatch({
      type: 'preset',
      value,
      ...(nextRelationship ? { selectedId: nextRelationship.spaceId } : {}),
    });
    setRelationshipId(nextRelationship?.id ?? null);
    if (nextRelationship) {
      setContext(true);
      setView(nextRelationship.view);
      setReset((v) => v + 1);
    }
    setExplode(0);
    setFocus(false);
    setIsolated(false);
    setInspection(initialInspection);
  }
  const presetValue =
    relationship?.id ??
    Object.keys(presets)
      .filter((value) => !relationships.some((r) => r.id === value))
      .find((value) =>
        layers.every(
          (s) => hidden.includes(s.id) === !presets[value].includes(s.id),
        ),
      ) ??
    'custom';
  if (!layers.length)
    return (
      <p role="alert">
        The{' '}
        {isCricothyroid
          ? 'thyroid cartilage'
          : isPancreatic
            ? 'pancreas'
            : isRenal
              ? 'kidney'
              : isHepatic
                ? 'liver'
                : isPulmonary
                  ? 'lung'
                  : isCardiac
                    ? 'heart'
                    : 'brain'}{' '}
        source binding has changed. This dissection is unavailable pending
        review.
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
          contextIds={ventricleCatalog.contextIds}
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
          inspectionBounds={inspectionBounds}
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
        {(explode > 0 || inspection.plane !== 'off') && (
          <p className="eye-layer-layout-note">
            <span>
              {explode > 0 &&
                'Separated teaching layout · not anatomical positions. Context hidden until reassembled.'}
              {explode > 0 && inspection.plane !== 'off' && ' · '}
              {inspection.plane !== 'off' &&
                `${cutPlanes[inspection.plane]} cut · ${inspection.position}% · not a scan`}
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
        aria-label={`${title} dissection controls`}
      >
        {isPulmonary && (
          <p className="muted">
            Airway and vessel groups only. Lobe tissue and fissure surfaces
            are not supplied.
          </p>
        )}
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
              setRelationshipId(null);
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
                  {isCardiac
                    ? s.name.replace(/^Cavity of (.)/, (_, first: string) =>
                        first.toUpperCase(),
                      ) + ' space'
                    : s.name.replace(' ventricle', '')}
                </Button>
                <Switch
                  checked={!hidden.includes(s.id)}
                  aria-label={`Show ${s.name.toLowerCase()}`}
                  onCheckedChange={(visible) => {
                    setRelationshipId(null);
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
              setRelationshipId(null);
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
              setRelationshipId(null);
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
              setReset((v) => v + 1);
            }}
          >
            Reassemble
          </Button>
          {(!isPulmonary || airwayContext.length > 0) && (
            <Button
              size="sm"
              variant={context ? 'default' : 'outline'}
              aria-pressed={context}
              disabled={explode > 0}
              onClick={() => {
                if (!isCardiac && !isVisual && !isRenal && !isHepatic)
                  setRelationshipId(null);
                setContext((v) => !v);
              }}
            >
              {isCricothyroid
                ? 'Show cartilage landmarks'
                : isPancreatic
                  ? 'Show pancreatic envelope'
                  : isVisual
                    ? relationship
                      ? 'Show pituitary landmark'
                      : 'Show brain landmarks'
                    : isRenal
                      ? relationship
                        ? 'Show drainage landmarks'
                        : 'Show kidney & vessel context'
                      : isHepatic
                        ? relationship
                          ? 'Show biliary landmarks'
                          : 'Show liver tissue context'
                        : isPulmonary
                          ? 'Show airway landmarks'
                          : isCardiac
                            ? relationship
                              ? 'Show vessel landmarks'
                              : 'Show atrial walls'
                            : isCerebral
                              ? 'Show lateral ventricles'
                              : isBrainstem
                                ? 'Show fourth ventricle'
                                : 'Show brain context'}
            </Button>
          )}
        </div>
        {isCricothyroid ? (
          <section
            className="ventricular-relationship"
            aria-label="Cricothyroid source guide"
          >
            <p>
              Four supplied straight/oblique muscle parts. Faint thyroid and
              cricoid cartilages are orientation landmarks, not selectable
              muscle tissue. They disappear during separation.
            </p>
          </section>
        ) : isPancreatic ? (
          <section
            className="ventricular-relationship"
            aria-label="Pancreatic duct guide"
          >
            <ul aria-label="Pancreatic source colour key">
              <li>
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: '#67ad9b' }}
                />
                Pancreatic duct
              </li>
              <li>
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: '#c7ac68' }}
                />
                Duct-tree source
              </li>
            </ul>
            <p>
              Two source selections, not two complete independent duct trees.
              The faint envelope is orientation only and disappears during
              separation.
            </p>
          </section>
        ) : isVisual && !relationship && context && explode === 0 ? (
          <section
            className="ventricular-relationship"
            aria-label="Optic pathway landmarks"
          >
            <p>
              Faint thalami and lateral geniculate bodies provide orientation.
              Surface proximity does not prove fibre connections.
            </p>
          </section>
        ) : isRenal && !relationship ? (
          <section
            className="ventricular-relationship"
            aria-label="Renal vessel guide"
          >
            <ul aria-label="Renal vessel colour key">
              <li>
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: '#c86059' }}
                />
                Arterial
              </li>
              <li>
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: '#657fb0' }}
                />
                Venous
              </li>
            </ul>
            <p>
              Partial vascular groups, not kidney internal tissue or a
              continuous circulation.
            </p>
            {parent.laterality === 'left' && (
              <p>
                The left inferior adrenal artery is withheld because of a
                source defect.
              </p>
            )}
          </section>
        ) : isHepatic && !guidedAppearance ? (
          <section
            className="ventricular-relationship"
            aria-label="Liver branch guide"
          >
            <ul aria-label="Liver branch colour key">
              {[
                ['Arterial', '#c86059'],
                ['Portal venous', '#657fb0'],
                ['Biliary', '#54a88a'],
                ['Venous tributary', '#a181be'],
              ].map(([name, color]) => (
                <li key={name}>
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: color }}
                  />
                  {name}
                </li>
              ))}
            </ul>
            <p>
              Partial source branches, not a complete connected tree or a
              validated liver segment map.
            </p>
            {context && explode === 0 && (
              <p>
                Tissue is orientation context only. Source segment VI/VII
                overlap and the VIII grouping require review.
              </p>
            )}
          </section>
        ) : isPulmonary &&
          context &&
          explode === 0 &&
          airwayContext.length > 0 ? (
          <section
            className="ventricular-relationship"
            aria-label="Lung airway landmarks"
          >
            <p>
              Compare the trachea and the main bronchus on this side with the
              lobe branch groups.
            </p>
            <ul aria-label="Airway landmark colour key">
              {airwayContext.map((s) => (
                <li key={s.id}>
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: pulmonaryAirwayColour(s) }}
                  />
                  {s.name}
                </li>
              ))}
            </ul>
            <p>
              Orientation surfaces only; continuous airway connections and
              lobar boundaries are not validated.
            </p>
            {isolated && (
              <p>Turn off Fade others to compare the landmarks.</p>
            )}
            <a
              href={pulmonaryAirwayReference}
              target="_blank"
              rel="noreferrer"
            >
              Anatomy reference · NCI SEER
            </a>
          </section>
        ) : relationship && context && explode === 0 ? (
          <section
            className="ventricular-relationship"
            aria-label={
              isVisual
                ? 'Chiasm and pituitary relationship guide'
                : isRenal
                  ? 'Renal venous relationship guide'
                  : isHepatic
                    ? 'Biliary and gallbladder relationship guide'
                    : isCardiac
                      ? 'Cardiac vessel relationship guide'
                      : 'Ventricular relationship guide'
            }
          >
            <p>{relationship.guide}</p>
            <ul aria-label="Context colour key">
              {relationship.context.map((s) => (
                <li key={s.id}>
                  <span
                    aria-hidden="true"
                    style={{
                      backgroundColor: isVisual
                        ? visualPathwayColour(s)
                        : isRenal
                          ? renalColour(s)
                          : isHepatic
                            ? hepaticBiliaryColour(s)
                            : isCardiac
                              ? cardiacVesselColour(s)
                              : neuroGroupFor(s.fmaId)?.color,
                    }}
                  />
                  {s.name}
                </li>
              ))}
            </ul>
            <p>
              {isVisual
                ? 'Orientation surfaces only: no tumour, compression, fibre crossing or patient scan is modelled. The gland is a landmark, not a selectable nerve structure.'
                : isRenal
                  ? 'Arterial red and venous blue identify supplied surfaces, not flow. Glands and large vessels are nonselectable landmarks. Drainage is anatomical teaching, not verified mesh continuity or a clinical assessment.'
                  : isHepatic
                    ? 'Landmarks are nonselectable source surfaces. The long common-hepatic-duct source retains its original label; its boundaries and junctions require review. No separate common bile duct, open lumen, flow or surgical plane is supplied.'
                    : isCardiac
                      ? 'Cavity and vessel surfaces are orientation aids, not a connected flow model. Valves and vessel openings are not validated. Colours distinguish landmarks, not scan signal.'
                      : 'Space shown translucently; nearby structures are orientation context, not selectable walls.'}
            </p>
            {isolated && (
              <p>Turn off Fade others to compare the nearby structures.</p>
            )}
            <a href={relationship.reference} target="_blank" rel="noreferrer">
              Anatomy reference ·{' '}
              {isVisual
                ? 'MRI anatomical study'
                : isRenal
                  ? 'Venous anatomy study'
                  : isHepatic
                    ? 'NIDDK'
                    : isCardiac
                      ? 'University of Minnesota'
                      : 'UTHealth'}
            </a>
          </section>
        ) : (
          context &&
          explode === 0 && (
            <p>
              {isCardiac
                ? 'Faint atrial-wall references only; ventricular walls and valves are not shown. Coloured shapes represent chamber spaces, not tissue.'
                : isCerebral
                  ? 'Faint lateral ventricular spaces provide orientation, not a registered scan or cortical boundary.'
                  : isBrainstem
                    ? 'Faint context shows the fourth ventricular space, not tissue or a measured cavity wall.'
                    : 'Faint context: thalami, caudate nuclei and corpus callosum. These are whole structures, not separately segmented ventricular walls.'}
            </p>
          )
        )}
        <CutawayControls
          value={inspection}
          subject={title}
          positionId={`nested-${study}-cut-position`}
          onChange={(next) => {
            setInspection(next);
            setFocus(false);
          }}
        />
        <details className="eye-layer-separation">
          <summary>
            {study !== 'ventricles' && !isCardiac
              ? 'Separate structures'
              : 'Separate spaces'}
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
          <label
            className="origin-guide-toggle"
            htmlFor="nested-origin-guide"
          >
            Show original position
            <Switch
              id="nested-origin-guide"
              checked={showOrigins}
              onCheckedChange={setShowOrigins}
              aria-label="Show original position"
              aria-describedby="nested-origin-guide-note"
            />
          </label>
          <p id="nested-origin-guide-note">
            Selected part only: a faint outline and line back to its source
            position, not a tissue connection. Hidden at 0%, in flat-plate or
            cutaway views, or when the part is hidden or not moving.
          </p>
        </details>
        {selected && (
          <section className="eye-layer-teaching" aria-live="polite">
            <h3>{selected.name}</h3>
            <span className="eye-layer-source-id">
              {selected.fmaId} ·{' '}
              {isCricothyroid
                ? 'Muscle-part source'
                : isPancreatic
                  ? 'Duct source'
                  : isVisual
                    ? 'Neural source surface'
                    : isRenal
                      ? 'Partial vascular group'
                      : isCerebral
                        ? cerebralCatalog.supplementalIds.includes(
                            selected.id,
                          )
                          ? 'Additional source part'
                          : 'Partial source coverage'
                        : isPulmonary || isHepatic
                          ? 'Partial branch group'
                          : isBrainstem
                            ? 'Source compound'
                            : 'Space representation'}{' '}
              · Draft
            </span>
            <p>{notes[selected.fmaId]}</p>
            {cutSelection?.clipped && (
              <output className="eye-layer-cut-warning">
                {cutSelection.reasons.includes('Selection clipped by cutaway')
                  ? 'This component is fully cut away. Use Restore whole view to see it.'
                  : 'The cutaway may hide part of this component.'}
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
                disabled={health !== 'ready' || loading || hasFailed}
                onClick={() => setFocus((v) => !v)}
              >
                Frame selected
              </Button>
            </div>
            <NestedTeaching
              parent={parent}
              study={study}
              selected={selected}
              initialTopic={
                selected.id === initialSelection
                  ? initialTeachingTopic
                  : undefined
              }
            />
          </section>
        )}
        <details className="eye-layer-limits">
          <summary>Learning and limitations</summary>
          {isCricothyroid ? (
            <>
              <p>
                Straight and oblique source parts are shown on each side. This
                is not complete cricothyroid anatomy: a horizontal belly
                described in human research and intramuscular nerve branches
                are not separately supplied.
              </p>
              <p>
                Cartilage is a navigation landmark, not a muscle tissue
                parent. Attachments, tissue intersections and functional
                movement need specialist review. No phonation, airway, thyroid
                gland or operative plane is simulated.
              </p>
            </>
          ) : isPancreatic ? (
            <>
              <p>
                The pancreatic duct and singleton IS-A duct-tree component are
                shown once each. In the source PART-OF index, the duct-tree
                group includes both components. No accessory duct has been
                inferred from these labels.
              </p>
              <p>
                The optional envelope uses one existing surface. A
                near-coincident parenchymal alternative is withheld; it is not
                presented as a separable tissue layer.
              </p>
              <p>
                Colour and separation distinguish source surfaces, not flow,
                an open lumen, an established junction or a papillary opening.
                CT, MRI and ultrasound matching remain unvalidated.
              </p>
            </>
          ) : isVisual ? (
            <>
              <p>
                Three source surfaces: one optic chiasm and two optic tracts.
                The chiasm retains two closed halves under one label; its seam
                does not show crossing axons.
              </p>
              <p>
                Optic nerves, optic radiations, fibre pathways and functional
                visual-field maps are not supplied by this study. Source
                tracts sit close to both lateral and medial geniculate
                surfaces; no termination or connection is validated.
              </p>
              <p>
                Optional landmarks are orientation only and disappear during
                separation. Colours identify surfaces, not visual fields or
                MRI signal.
              </p>
            </>
          ) : isRenal ? (
            <>
              <p>
                Four right-sided or three left-sided vessel groups preserve
                the supplied source geometry. Arterial red and venous blue
                distinguish vessel types, not flow, oxygenation or scan
                signal.
              </p>
              <p>
                Kidney cortex, medulla, calyces and pelvis are not
                individually represented. The left inferior suprarenal artery
                and overlapping alternative renal trunks are excluded. Source
                group components are not certified connected lumens or
                surgical planes.
              </p>
            </>
          ) : isHepatic ? (
            <>
              <p>
                Seven branch groups reuse 48 existing source files. The
                optional tissue context retains the other nine liver files
                unchanged, including source defects and internal remnants.
              </p>
              <p>
                Source segment VI and VII surfaces have nearly identical
                extents with substantial sampled near-contact; segment VIII
                contains two region surfaces. Individual segment labels are
                withheld. No segment has been relabelled, reconstructed or
                merged into a clinical territory.
              </p>
              <p>
                Arterial red, portal blue, biliary green and tributary purple
                distinguish source groups, not oxygenation or flow. The single
                middle-hepatic tributary is not complete venous outflow.
              </p>
            </>
          ) : isPulmonary ? (
            <>
              <p>
                Each selectable item combines the existing airway and vessel
                files assigned to one lobe in the source table. Colours
                distinguish groups, not oxygenation or tissue types.
              </p>
              <p>
                No lung tissue envelope, fissure surface, alveoli or complete
                bronchopulmonary segment is demonstrated. The left upper group
                retains one duplicate source face. Both source geometry and
                anatomical membership need specialist review.
              </p>
              <p>
                Optional airway landmarks reuse the trachea and the main
                bronchus on this side. Original bronchial remnants and
                duplicate faces remain; these are not measured lumen
                boundaries or proof of uninterrupted airway continuity.
              </p>
            </>
          ) : isCardiac ? (
            <>
              <p>
                Four source cavity shapes, not solid heart chambers, measured
                blood volumes or a registered cardiac scan. Colours
                distinguish spaces, not oxygenation or scan signal.
              </p>
              <p>
                Only the two atrial walls are available as faint context.
                Source mappings for ventricular walls, papillary muscles and
                the mitral valve contain overlapping identities and are
                excluded from this study pending adjudication. Valves, chordae
                and conduction pathways are not demonstrated.
              </p>
            </>
          ) : isCerebral ? (
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
            approval is provided.{' '}
            {isCricothyroid ? (
              'Cartilage landmarks are optional orientation surfaces. Separation is a teaching layout, not muscle action.'
            ) : isRenal ? (
              'The kidney surface is optional orientation context; it does not define the vascular lumen or tissue territories.'
            ) : (
              <>
                The main{' '}
                {isPancreatic
                  ? 'pancreas aggregate'
                  : isHepatic
                    ? 'liver aggregate'
                    : isPulmonary
                      ? 'lung'
                      : isCardiac
                        ? 'heart'
                        : 'brain'}{' '}
                is not rendered over these components.
              </>
            )}
          </p>
          {(isCricothyroid
            ? cricothyroidReferences
            : isPancreatic
              ? pancreaticReferences
              : isVisual
                ? visualPathwayReferences
                : isRenal
                  ? renalReferences
                  : isHepatic
                    ? [hepaticReference]
                    : isPulmonary
                      ? pulmonaryReferences
                      : isCardiac
                        ? [cardiacReference]
                        : isCerebral
                          ? cerebralReferences
                          : isBrainstem
                            ? brainstemReferences
                            : [ventricleReference]
          ).map((href, i) => (
            <p key={href}>
              <a href={href} target="_blank" rel="noreferrer">
                {isCricothyroid
                  ? 'Laryngeal anatomy'
                  : isPancreatic
                    ? 'NCI pancreatic anatomy'
                    : isRenal
                      ? 'Renal anatomy'
                      : isHepatic
                        ? 'NCI digestive anatomy'
                        : isPulmonary
                          ? 'NCI lung anatomy'
                          : `University ${isCardiac ? 'cardiac anatomy' : 'neuroanatomy'}`}{' '}
                reference {i + 1}
              </a>
            </p>
          ))}
          <p>{ventricleCatalog.credit}</p>
          <p>
            {isCricothyroid
              ? 'The display derivative omits 12 specifically audited faces from six detached, reversed duplicate-face islands. All retained coordinates, triangles and winding are unchanged; raw originals are preserved. Display normals and colours are adapted. This cleanup is not anatomical validation.'
              : 'Source components separated, transformed, normal-smoothed and recoloured; no triangles intentionally removed or coordinates reconstructed. Context reuses existing source surfaces.'}
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
  initialStudy,
  initialSelectedId,
  initialTeachingTopic,
}: {
  parent: BodyStructure;
  onClose: () => void;
  initialStudy?: ComponentStudy;
  initialSelectedId?: string;
  initialTeachingTopic?: NestedImagingTopic;
}) {
  const isCardiac = cardiacFor(parent).length > 0;
  const isPulmonary = pulmonaryFor(parent).length > 0;
  const isHepatic = hepaticFor(parent).length > 0;
  const isRenal = renalFor(parent).length > 0;
  const isPancreatic = pancreaticFor(parent).length > 0;
  const isCricothyroid = cricothyroidFor(parent).length > 0;
  const startingStudy =
    isCricothyroid || initialStudy === 'cricothyroid'
      ? 'cricothyroid'
      : isPancreatic || initialStudy === 'pancreatic'
        ? 'pancreatic'
        : isRenal
          ? 'renal'
          : isHepatic
            ? 'hepatic'
            : isPulmonary
              ? 'pulmonary'
              : isCardiac
                ? 'cardiac'
                : initialStudy === 'cardiac' ||
                    initialStudy === 'pulmonary' ||
                    initialStudy === 'hepatic' ||
                    initialStudy === 'renal'
                  ? 'brainstem'
                  : (initialStudy ?? 'brainstem');
  const [study, setStudy] = useState<ComponentStudy>(startingStudy);
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
            <DialogTitle>
              {isCricothyroid || study === 'cricothyroid'
                ? 'Larynx · cricothyroid muscle parts'
                : isPancreatic || study === 'pancreatic'
                  ? 'Pancreas · duct dissection'
                  : isRenal
                    ? `${parent.name} · vascular relationships`
                    : isHepatic
                      ? 'Liver · internal branch dissection'
                      : isPulmonary
                        ? `${parent.name} · branch dissection`
                        : isCardiac
                          ? 'Heart · chamber spaces'
                          : 'Brain · source dissection'}
            </DialogTitle>
            <DialogDescription>
              Source-based anatomy studies. Clinical validation pending.
            </DialogDescription>
          </div>
          {!isCardiac &&
            !isPulmonary &&
            !isHepatic &&
            !isRenal &&
            !isCricothyroid &&
            study !== 'cricothyroid' &&
            study !== 'pancreatic' && (
              <Select
                value={study}
                onValueChange={(v) => {
                  if (
                    v === 'brainstem' ||
                    v === 'ventricles' ||
                    v === 'cerebral' ||
                    v === 'visual-pathway'
                  )
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
                  <SelectItem value="ventricles">
                    Ventricular spaces
                  </SelectItem>
                  <SelectItem value="cerebral">Cerebral regions</SelectItem>
                  <SelectItem value="visual-pathway">
                    Optic chiasm and tracts
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft /> Back to atlas
          </Button>
        </header>
        <VentricularView
          key={`${parent.id}:${study}`}
          parent={parent}
          study={study}
          initialSelectedId={
            study === startingStudy ? initialSelectedId : undefined
          }
          initialTeachingTopic={
            study === startingStudy ? initialTeachingTopic : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
}
