'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Bone,
  Brain,
  Check,
  ChevronRight,
  CircleDot,
  Crosshair,
  Eye,
  EyeOff,
  GraduationCap,
  Layers3,
  RotateCcw,
  ScanLine,
  Tags,
  Trophy,
  Plus,
  Minus,
} from 'lucide-react';
import {
  quizQuestions,
  structureById,
  structures,
  systemMeta,
  type SystemKey,
} from './anatomy-data';
import type { CameraView, AnatomyLayer } from './anatomy-scene';
import { shoulderLinkEntries } from '@/lib/anatomy-link-registry';
import { ImagingLink, useImagingLink } from './imaging-link';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Slider } from '@/components/ui/slider';
import { ExplodeStyleSelect } from './explode-style-select';
import type { BodyLayout } from '@/lib/body-arrangement';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { AnatomyControlRail, AnatomyInfoPanel } from './anatomy-control-rail';
import {
  AtlasWorkspace,
  WorkspaceModes,
  WorkspaceOnly,
  WorkspaceFocus,
  GroupedAnatomyNotes,
  PracticeAttention,
  StructureDetailsButton,
} from './atlas-workspace';
import './body-explorer.css';
import './atlas-workspace.css';
import './shoulder-workspace.css';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Brand } from './brand';
import { ReviewStatus } from './review-status';
import { InspectionControls } from './inspection-controls';
import { initialInspection } from '@/lib/inspection-state';
import {
  selectionBounds,
  selectionVisibility,
  recoverSelectionInspection,
} from '@/lib/selection-visibility';
import { SelectionVisibilityNotice } from './selection-visibility-notice';
import {
  practiceReducer,
  initialPractice,
  practiceScore,
  type PracticeSession,
} from '@/lib/anatomy-practice';
import { StudyViews } from './study-views';
import type { StudyCamera, StudyView } from '@/lib/study-views';
import manifest from '@/public/models/bodyparts3d/manifest.json';

type Mode = 'study' | 'exam';
import { rendererReady, type RendererHealth } from '@/lib/renderer-health';
type SearchOption = { value: string; label: string };
type ModelContextLike = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

const systemIcons: Record<SystemKey, typeof Bone> = {
  skeleton: Bone,
  muscles: Layers3,
  'soft-tissue': CircleDot,
};
const shoulderSelectionFrame = selectionBounds(manifest.parts, -3.15);
const shoulderSelectionBounds = new Map(
  structures.map((s) => [
    s.id,
    selectionBounds(
      manifest.parts.filter((p) => p.structureId === s.id),
      -3.15,
    ),
  ]),
);
const AnatomyScene = dynamic(
  () => import('./anatomy-scene').then((module) => module.AnatomyScene),
  { ssr: false },
);

export default function ShoulderExplorer({
  initialSelectedId = structures[0].id,
  presentation = 'standalone',
  assetBase = '',
  connectedReviews = true,
}: {
  initialSelectedId?: string;
  presentation?: 'standalone' | 'panel';
  assetBase?: string;
  connectedReviews?: boolean;
}) {
  const Title = presentation === 'panel' ? 'h2' : 'h1';
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [rendererHealth, setRendererHealth] =
    useState<RendererHealth>('starting');
  const [modelReady, setModelReady] = useState(false);
  const displayReady = rendererReady(rendererHealth) && modelReady;
  const [view, setView] = useState<CameraView>('posterior');
  const [layer, setLayer] = useState<AnatomyLayer>('cuff');
  const [zoom, setZoom] = useState(1);
  const [zoomStep, setZoomStep] = useState(0);
  const [visibleSystems, setVisibleSystems] = useState<
    Record<SystemKey, boolean>
  >({ skeleton: true, muscles: true, 'soft-tissue': true });
  const [isolated, setIsolated] = useState(false);
  const [explode, setExplode] = useState(0);
  const [layout, setLayout] = useState<BodyLayout>('spatial');
  const [anchorSkeleton, setAnchorSkeleton] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false);
  const [plate, setPlate] = useState(false);
  const [inspection, setInspection] = useState(initialInspection);
  const cameraCapture = useRef<StudyCamera | null>(null);
  const cameraRestore = useRef<StudyCamera | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [syncPlane, setSyncPlane] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const [mode, setMode] = useState<Mode>('study');
  const [shoulderPractice, practiceDispatch] = useReducer(
    practiceReducer,
    initialPractice,
  );
  const practiceSerial = useRef(0);
  const questionIndex = shoulderPractice.index;
  const answerId = shoulderPractice.responses[questionIndex]?.chosen ?? null;
  const score = practiceScore(shoulderPractice);
  function beginShoulderPractice() {
    if (!displayReady) return;
    const session: PracticeSession = {
      id: ++practiceSerial.current,
      mode: 'find',
      status: 'active',
      index: 0,
      questions: quizQuestions.map((q) => ({
        target: q.answer,
        choices: [],
      })),
      renderedIds: structures.map((s) => s.id),
      responses: [],
    };
    practiceDispatch({ type: 'start', session });
  }
  const selected = structureById.get(selectedId) ?? structures[0];
  const currentQuestion = quizQuestions[questionIndex];
  const studyScope = {
    kind: 'shoulder' as const,
    region: 'shoulder-pilot',
    revision: manifest.sha256,
    structureIds: structures.map((s) => s.id),
  };
  function captureView(): StudyView {
    return {
      kind: 'shoulder',
      region: 'shoulder-pilot',
      revision: manifest.sha256,
      selectedId,
      view,
      side: 'right',
      layer,
      systems: visibleSystems,
      hiddenIds: [],
      explode,
      layout,
      zoom,
      isolated,
      focus: false,
      labels: showLabels,
      ghostRemoved: false,
      illustrated: true,
      anchorSkeleton,
      showOrigins,
      plate,
      inspection,
      camera: cameraCapture.current,
    };
  }
  function restoreView(state: StudyView) {
    setMode('study');
    practiceDispatch({ type: 'dismiss' });
    setSyncPlane(false);
    setSelectedId(state.selectedId ?? structures[0].id);
    setView(state.view as CameraView);
    setLayer(state.layer);
    setVisibleSystems(state.systems as Record<SystemKey, boolean>);
    setExplode(state.explode);
    setLayout(state.layout ?? 'spatial');
    setZoom(state.zoom);
    setIsolated(state.isolated);
    setShowLabels(state.labels);
    setAnchorSkeleton(state.anchorSkeleton);
    setShowOrigins(state.showOrigins);
    setPlate(state.plate);
    setInspection(state.inspection);
    cameraRestore.current = state.camera;
    setResetNonce((n) => n + 1);
  }

  const searchOptions = useMemo<SearchOption[]>(
    () =>
      structures.map((structure) => ({
        value: structure.id,
        label: structure.name,
      })),
    [],
  );
  const selectedSearchOption =
    searchOptions.find((option) => option.value === selectedId) ?? null;

  const applySelection = useCallback((id: string) => {
    const structure = structureById.get(id);
    if (!structure) return false;
    setSelectedId(id);
    const slug = id.split(':').at(-1);
    if (slug === 'subscapularis' || slug === 'biceps-long-head')
      setView('anterior');
    if (
      slug === 'infraspinatus' ||
      slug === 'supraspinatus' ||
      slug === 'teres-minor'
    )
      setView('posterior');
    setVisibleSystems((current) => ({
      ...current,
      [structure.system]: true,
    }));
    return true;
  }, []);

  const linkEntries = useMemo(
    () => shoulderLinkEntries(manifest, structures),
    [],
  );
  const imagingLink = useImagingLink({
    entries: linkEntries,
    allowedIds: structures.map((s) => s.id),
    disabled: mode === 'exam',
    onSelect: (id) => {
      applySelection(id);
      setInspection(initialInspection);
    },
  });
  const publishSelection = imagingLink.publish;
  const selectStructure = useCallback(
    (id: string) => {
      if (!applySelection(id)) return false;
      publishSelection(id);
      return true;
    },
    [applySelection, publishSelection],
  );

  const handleSceneSelect = (id: string) => {
    if (!displayReady) return;
    selectStructure(id);
    if (mode === 'exam')
      practiceDispatch({
        type: 'answer',
        sessionId: shoulderPractice.id,
        index: questionIndex,
        chosen: id,
      });
  };

  const nextQuestion = () => {
    if (!displayReady) return;
    practiceDispatch({
      type: 'next',
      sessionId: shoulderPractice.id,
      index: questionIndex,
    });
    if (questionIndex === quizQuestions.length - 1) beginShoulderPractice();
    setIsolated(false);
  };

  const toggleMode = () => {
    if (mode === 'study' && !displayReady) return;
    setPlate(false);
    setLayout('spatial');
    setSyncPlane(false);
    setMode((current) => (current === 'study' ? 'exam' : 'study'));
    practiceDispatch({ type: 'dismiss' });
    if (mode === 'study') beginShoulderPractice();
    setIsolated(false);
    setLayer('cuff');
    setVisibleSystems({
      skeleton: true,
      muscles: true,
      'soft-tissue': true,
    });
    setExplode(0);
  };

  const toggleSync = () => {
    setSyncPlane((current) => !current);
  };

  function changeLayout(next: BodyLayout) {
    if (mode === 'exam' || next === layout) return;
    setLayout(next);
    setPlate(next === 'tray');
    setExplode(next === 'spatial' ? 0 : 100);
    setIsolated(false);
    setZoom(1);
    setResetNonce((n) => n + 1);
  }

  function changePlate(next: boolean) {
    if (!next && layout === 'tray') changeLayout('spatial');
    else setPlate(next);
  }

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContextLike })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const reportError = (error: unknown) =>
      console.warn('WebMCP registration failed', error);

    const register = async () => {
      await context.registerTool(
        {
          name: 'select_anatomy_structure',
          title: 'Select anatomy structure',
          description:
            'Select and reveal a shoulder structure in the Visible Medicine anatomy explorer.',
          inputSchema: {
            type: 'object',
            properties: {
              structureId: {
                type: 'string',
                enum: structures.map((item) => item.id),
              },
            },
            required: ['structureId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const id = (input as { structureId?: unknown })?.structureId;
            if (typeof id !== 'string' || !selectStructure(id))
              throw new Error('Unknown structureId');
            return {
              selectedStructureId: id,
              selectedStructureName: structureById.get(id)?.name,
            };
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: 'configure_anatomy_view',
          title: 'Configure anatomy view',
          description:
            'Configure the spatial 3D shoulder view, dissection layer, separation and labels.',
          inputSchema: {
            type: 'object',
            properties: {
              view: {
                type: 'string',
                enum: ['posterior', 'anterior', 'lateral'],
              },
              layer: { type: 'string', enum: ['cuff', 'surface', 'bones'] },
              explode: { type: 'number', minimum: 0, maximum: 100 },
              labels: { type: 'boolean' },
              isolateSelected: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const config = input as {
              view?: unknown;
              layer?: unknown;
              explode?: unknown;
              labels?: unknown;
              isolateSelected?: unknown;
            };
            if (
              config.view !== undefined &&
              (typeof config.view !== 'string' ||
                !['anterior', 'posterior', 'lateral'].includes(config.view))
            )
              throw new Error('Unknown view');
            if (
              config.layer !== undefined &&
              (typeof config.layer !== 'string' ||
                !['cuff', 'surface', 'bones'].includes(config.layer))
            )
              throw new Error('Unknown layer');
            if (
              config.explode !== undefined &&
              (typeof config.explode !== 'number' ||
                config.explode < 0 ||
                config.explode > 100)
            )
              throw new Error('explode must be between 0 and 100');
            if (
              config.labels !== undefined &&
              typeof config.labels !== 'boolean'
            )
              throw new Error('labels must be boolean');
            if (
              config.isolateSelected !== undefined &&
              typeof config.isolateSelected !== 'boolean'
            )
              throw new Error('isolateSelected must be boolean');
            if (typeof config.view === 'string')
              setView(config.view as CameraView);
            if (typeof config.layer === 'string')
              setLayer(config.layer as AnatomyLayer);
            if (typeof config.explode === 'number') setExplode(config.explode);
            if (typeof config.labels === 'boolean')
              setShowLabels(config.labels);
            if (typeof config.isolateSelected === 'boolean')
              setIsolated(config.isolateSelected);
            return {
              view: config.view,
              layer: config.layer,
              explode: config.explode,
              labels: config.labels,
              isolateSelected: config.isolateSelected,
            };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(reportError);
    return () => lifecycle.abort();
  }, [selectStructure]);

  const answerCorrect = answerId === currentQuestion.answer;
  const answerName = answerId ? structureById.get(answerId)?.name : '';
  const selectedVisibility =
    mode === 'study'
      ? selectionVisibility({
          system: selected.system,
          enabled: visibleSystems[selected.system],
          bounds: shoulderSelectionBounds.get(selected.id) ?? null,
          frame: shoulderSelectionFrame,
          inspection,
        })
      : null;
  function revealSelection() {
    if (mode !== 'study' || !selectedVisibility) return;
    if (selectedVisibility.systemOff)
      setVisibleSystems((current) => ({
        ...current,
        [selected.system]: true,
      }));
    setInspection((current) =>
      recoverSelectionInspection(current, selectedVisibility),
    );
  }

  return (
    <TooltipProvider>
      <AtlasWorkspace exam={mode === 'exam'} className="shoulder-workspace" presentation={presentation}>
        <PracticeAttention
          exam={mode === 'exam'}
          answered={Boolean(answerId)}
        />
        <header className="body-topbar">
          {presentation === 'standalone' && <Brand />}
          <WorkspaceModes />
          <div className="top-actions">
            {presentation === 'standalone' && <Link href="/" className="body-return-link">
              Whole body & regions
            </Link>}
            {presentation === 'panel' && <span className="atlas-panel-status">Educational · Review pending</span>}
            <WorkspaceFocus />
            {mode === 'exam' && (
              <Button
                className="mode-button"
                variant="outline"
                onClick={toggleMode}
              >
                <Brain /> Exit exam
              </Button>
            )}
          </div>
        </header>

        <div className="body-layout">
          <AnatomyControlRail>
            <div className="shoulder-tools">
              {mode === 'study' ? (
                <>
                  <div className="eyebrow">Find a structure</div>
                  <Combobox<SearchOption>
                    value={selectedSearchOption}
                    onValueChange={(option) =>
                      option && selectStructure(option.value)
                    }
                    items={searchOptions}
                    itemToStringLabel={(option) => option.label}
                    itemToStringValue={(option) => option.value}
                    isItemEqualToValue={(item, value) =>
                      item.value === value.value
                    }
                  >
                    <ComboboxInput
                      className="anatomy-search"
                      placeholder="Search name or landmark…"
                      showClear
                    />
                    <ComboboxContent className="anatomy-search-menu">
                      <ComboboxEmpty>No structures found.</ComboboxEmpty>
                      <ComboboxList>
                        {searchOptions.map((option) => (
                          <ComboboxItem key={option.value} value={option}>
                            {option.label}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>

                  <div className="rail-section-heading">
                    <span>Systems</span>
                    <small>
                      {
                        (Object.keys(systemMeta) as SystemKey[]).filter(
                          (system) =>
                            visibleSystems[system] &&
                            structures.some((s) => s.system === system),
                        ).length
                      }{' '}
                      shown
                    </small>
                  </div>
                  {(Object.keys(systemMeta) as SystemKey[]).map((system) => {
                    const Icon = systemIcons[system];
                    const meta = systemMeta[system];
                    const count = structures.filter(
                      (s) => s.system === system,
                    ).length;
                    return (
                      <div
                        key={system}
                        className={`system-card ${count && visibleSystems[system] ? 'active' : ''}`}
                      >
                        <span className={`system-icon ${system}`}>
                          <Icon />
                        </span>
                        <span>
                          <strong>{meta.name}</strong>
                          <small>
                            {count
                              ? `${count} structures`
                              : 'Not in this model'}
                          </small>
                        </span>
                        <Switch
                          checked={count > 0 && visibleSystems[system]}
                          disabled={!count}
                          onCheckedChange={(checked) =>
                            setVisibleSystems((current) => ({
                              ...current,
                              [system]: checked,
                            }))
                          }
                          aria-label={`Show ${meta.name}`}
                        />
                      </div>
                    );
                  })}

                  <details className="shoulder-tool-group">
                    <summary>Structures · {structures.length}</summary>
                    <div className="structure-list">
                      {structures.map((structure) => (
                        <button
                          key={structure.id}
                          className={`structure-row ${selectedId === structure.id ? 'selected' : ''}`}
                          type="button"
                          onClick={() => selectStructure(structure.id)}
                        >
                          <i
                            className="dot"
                            style={{ background: structure.color }}
                          />
                          <span>{structure.name}</span>
                          <ChevronRight />
                        </button>
                      ))}
                    </div>
                  </details>
                  <WorkspaceOnly modes={['dissect']}>
                    <div className="shoulder-scene-options">
                      <button
                        type="button"
                        aria-pressed={plate}
                        onClick={() => {
                          changePlate(!plate);
                          setResetNonce((n) => n + 1);
                        }}
                      >
                        Orthographic plate
                      </button>
                      <button
                        type="button"
                        aria-pressed={anchorSkeleton}
                        disabled={layout !== 'spatial'}
                        onClick={() => setAnchorSkeleton((v) => !v)}
                      >
                        Keep bones assembled
                      </button>
                      <button
                        type="button"
                        aria-pressed={showOrigins}
                        disabled={layout === 'tray'}
                        onClick={() => setShowOrigins((v) => !v)}
                      >
                        Original positions
                      </button>
                    </div>
                    <InspectionControls
                      value={inspection}
                      onChange={setInspection}
                      systems={(Object.keys(systemMeta) as SystemKey[]).map(
                        (id) => ({
                          id,
                          name: systemMeta[id].name,
                          enabled:
                            visibleSystems[id] &&
                            structures.some((s) => s.system === id),
                        }),
                      )}
                      plate={plate}
                      onPlate={changePlate}
                    />
                  </WorkspaceOnly>
                  <WorkspaceOnly modes={['explore', 'dissect']}>
                    <details className="shoulder-tool-group">
                      <summary>Saved views & imaging link</summary>
                      <StudyViews
                        scope={studyScope}
                        capture={captureView}
                        restore={restoreView}
                      />
                      <ImagingLink link={imagingLink} />
                    </details>
                  </WorkspaceOnly>
                  <WorkspaceOnly modes={['dissect']}>
                    <details className="shoulder-tool-group">
                      <summary>Illustration plates</summary>
                      <div className="vm-plates">
                        <p>
                          Fixed, parallel projections of these same 3D surfaces.
                          Select a structure on any plate.
                        </p>
                        {(
                          [
                            ['Anterior cuff', 'anterior', 'cuff'],
                            ['Posterior cuff', 'posterior', 'cuff'],
                            ['Lateral shoulder', 'lateral', 'surface'],
                            ['Deep skeletal view', 'anterior', 'bones'],
                          ] as const
                        ).map(([name, camera, dissection], i) => (
                          <button
                            type="button"
                            key={name}
                            onClick={() => {
                              setPlate(true);
                              setInspection(initialInspection);
                              setView(camera);
                              setLayer(dissection);
                              setExplode(0);
                              setLayout('spatial');
                              setZoom(1);
                              setIsolated(false);
                              setSelectedId(structures[0].id);
                              setShowLabels(true);
                              setVisibleSystems({
                                skeleton: true,
                                muscles: true,
                                'soft-tissue': true,
                              });
                              setResetNonce((n) => n + 1);
                            }}
                          >
                            <span>0{i + 1}</span>
                            {name}
                            <ChevronRight />
                          </button>
                        ))}
                        <small>
                          BodyParts3D · CC BY 4.0 · adapted. Hatching is
                          illustrative, not measured fascicle direction.
                        </small>
                      </div>
                    </details>
                  </WorkspaceOnly>
                  <Link
                    className="shoulder-review-link"
                    href={`/review?structure=${encodeURIComponent(selectedId)}`}
                  >
                    Review workspace
                  </Link>
                </>
              ) : (
                <div className="exam-rail">
                  <div className="exam-icon">
                    <Trophy />
                  </div>
                  <div className="eyebrow">Identification exam</div>
                  <h2>
                    {questionIndex + 1} <span>/ {quizQuestions.length}</span>
                  </h2>
                  <div className="question-dots">
                    {quizQuestions.map((_, index) => (
                      <i
                        key={index}
                        className={
                          index === questionIndex
                            ? 'current'
                            : index < questionIndex
                              ? 'done'
                              : ''
                        }
                      />
                    ))}
                  </div>
                  <p>
                    Rotate the model and select the structure that answers the
                    prompt. Labels are hidden.
                  </p>
                  <div className="score-card">
                    <span>Score</span>
                    <strong>{score}</strong>
                    <small>correct</small>
                  </div>
                  <Button variant="outline" onClick={toggleMode}>
                    Return to study
                  </Button>
                </div>
              )}
            </div>
          </AnatomyControlRail>

          <div className="shoulder-model-workspace body-workspace">
            <div className="shoulder-model-heading">
              <Title>Right shoulder</Title>
              {mode === 'study' && <StructureDetailsButton />}
            </div>
            <div className="shoulder-view-controls">
              <Select
                value={view}
                items={{
                  posterior: 'Posterior',
                  anterior: 'Anterior',
                  lateral: 'Lateral',
                }}
                onValueChange={(item) => {
                  if (
                    item !== 'posterior' &&
                    item !== 'anterior' &&
                    item !== 'lateral'
                  )
                    return;
                  setView(item);
                  setResetNonce((n) => n + 1);
                }}
              >
                <SelectTrigger aria-label="Shoulder camera view">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['posterior', 'anterior', 'lateral'] as const).map(
                    (item) => (
                      <SelectItem key={item} value={item}>
                        {item[0].toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select
                value={layer}
                disabled={mode === 'exam'}
                items={{
                  cuff: 'Rotator cuff',
                  surface: 'Deltoid on',
                  bones: 'Bones',
                }}
                onValueChange={(item) => {
                  if (
                    mode === 'exam' ||
                    (item !== 'cuff' && item !== 'surface' && item !== 'bones')
                  )
                    return;
                  setLayer(item);
                  if (item === 'bones') setSelectedId(structures[0].id);
                  else if (
                    item === 'cuff' &&
                    ['deltoid', 'biceps-long-head'].includes(
                      selectedId.split(':').at(-1)!,
                    )
                  )
                    setSelectedId(structures[0].id);
                }}
              >
                <SelectTrigger aria-label="Shoulder dissection layer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cuff">Rotator cuff</SelectItem>
                  <SelectItem value="surface">Deltoid on</SelectItem>
                  <SelectItem value="bones">Bones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === 'study' && (
              <SelectionVisibilityNotice
                name={selected.name}
                report={selectedVisibility}
                onRecover={revealSelection}
                onReapply={() => {
                  if (mode === 'study')
                    setInspection((current) => ({
                      ...current,
                      keepSelectedUncut: false,
                    }));
                }}
              />
            )}
            {mode === 'exam' && (
              <div className="shoulder-exam-prompt">
                <span>QUESTION {questionIndex + 1}</span>
                <strong>{currentQuestion.prompt}</strong>
              </div>
            )}
            <section
              className="viewer-panel illustration-mode"
              aria-label="Interactive 3D shoulder model"
            >
              <div className="viewer-meta">
                <span>
                  RIGHT SHOULDER · {plate ? 'ORTHOGRAPHIC PLATE' : '3D ANATOMY'}
                </span>
                <span className="live-dot">
                  {layer === 'cuff'
                    ? 'Rotator cuff exposed'
                    : layer === 'bones'
                      ? 'Skeletal anatomy'
                      : 'Superficial muscles'}
                </span>
              </div>
              <AnatomyScene
                modelUrl={`${assetBase}/models/bodyparts3d/shoulder-right.glb`}
                structures={structures}
                selectedId={selectedId}
                visibleSystems={visibleSystems}
                isolated={isolated && mode === 'study'}
                explode={explode}
                layout={mode === 'exam' ? 'spatial' : layout}
                showLabels={showLabels && mode === 'study'}
                syncPlane={syncPlane}
                resetNonce={resetNonce}
                onSelect={handleSceneSelect}
                view={view}
                layer={layer}
                zoom={zoom}
                zoomStep={zoomStep}
                exam={mode === 'exam'}
                anchorSkeleton={anchorSkeleton}
                showOrigins={showOrigins && mode === 'study'}
                plate={plate}
                inspection={mode === 'exam' ? initialInspection : inspection}
                cameraCapture={cameraCapture}
                cameraRestore={cameraRestore}
                onRendererHealth={setRendererHealth}
                onModelReady={setModelReady}
              />
              <div className="zoom-controls">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Zoom in"
                  onClick={() => setZoomStep(s => s + 1)}
                >
                  <Plus />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Zoom out"
                  onClick={() => setZoomStep(s => s - 1)}
                >
                  <Minus />
                </Button>
              </div>
            </section>
            <div className="shoulder-view-footer illustration-mode">
              <div className="viewer-toolbar" aria-label="3D view controls">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant={isolated ? 'default' : 'ghost'}
                        disabled={mode === 'exam'}
                        aria-label="Isolate selected structure"
                        onClick={() => setIsolated(!isolated)}
                      />
                    }
                  >
                    {isolated ? <Eye /> : <EyeOff />}
                  </TooltipTrigger>
                  <TooltipContent>
                    {isolated ? 'Show all structures' : 'Fade other structures'}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant={showLabels ? 'secondary' : 'ghost'}
                        aria-label="Toggle labels"
                        onClick={() => setShowLabels(!showLabels)}
                        disabled={mode === 'exam'}
                      />
                    }
                  >
                    <Tags />
                  </TooltipTrigger>
                  <TooltipContent>Toggle labels</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant={syncPlane ? 'default' : 'ghost'}
                        aria-label="Toggle reference plane illustration"
                        disabled={mode === 'exam'}
                        onClick={toggleSync}
                      />
                    }
                  >
                    <Crosshair />
                  </TooltipTrigger>
                  <TooltipContent>
                    Reference plane illustration — not a scan
                  </TooltipContent>
                </Tooltip>
                <span className="toolbar-divider" />
                <div className="explode-control">
                  <ExplodeStyleSelect
                    value={mode === 'exam' ? 'spatial' : layout}
                    disabled={mode === 'exam'}
                    onChange={changeLayout}
                  />
                  <Slider
                    min={0}
                    aria-valuetext={`${Math.round(explode)}%`}
                    max={100}
                    step={1}
                    value={[explode]}
                    disabled={mode === 'exam'}
                    onValueChange={(value) =>
                      setExplode(Array.isArray(value) ? value[0] : value)
                    }
                    aria-label={
                      layout === 'extract'
                        ? 'Selected structure separation'
                        : layout === 'tray'
                          ? 'Arranged separation'
                          : 'Exploded view separation'
                    }
                  />
                  <output>{Math.round(explode)}%</output>
                </div>
                <span className="toolbar-divider" />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Reset 3D view"
                        onClick={() => {
                          setResetNonce((value) => value + 1);
                          setInspection(initialInspection);
                          setExplode(0);
                          setLayout('spatial');
                          setPlate(false);
                          setIsolated(false);
                          setZoom(1);
                        }}
                      />
                    }
                  >
                    <RotateCcw />
                  </TooltipTrigger>
                  <TooltipContent>Reset view</TooltipContent>
                </Tooltip>
              </div>
              <div className="viewer-hint">
                {mode === 'study' && layout === 'tray'
                  ? explode === 100
                    ? 'Tray · Pan / pinch to zoom · Not anatomical positions'
                    : `Arrangement in progress · ${explode}% · Overlap is possible before 100%`
                  : mode === 'study' && layout === 'extract'
                    ? !visibleSystems[selected.system]
                      ? 'Select a visible structure to extract · Others stay assembled'
                      : explode > 0
                        ? 'Selected structure extracted · 0% restores anatomy · Not a surgical path'
                        : 'Assembled anatomy · Increase separation to extract the selected structure'
                    : mode === 'study' && inspection.plane !== 'off'
                      ? `${inspection.plane} surface cutaway · ${inspection.position}% · Not CT/MRI`
                      : explode > 0
                        ? 'Exploded teaching view · Positions are not anatomical'
                        : plate
                          ? 'Parallel projection · Click a structure · Use + / − to zoom'
                          : 'Drag to rotate · Pinch to zoom · Click to explore'}
              </div>
              <a
                className="model-credit"
                href={`${assetBase}/models/bodyparts3d/credits.html`}
                target="_blank"
                rel="noreferrer"
              >
                BodyParts3D · CC BY 4.0 · Adapted
              </a>
            </div>
          </div>

          <AnatomyInfoPanel practice={mode === 'exam'}>
            <div className="shoulder-info" aria-live="polite">
              {mode === 'exam' ? (
                <div className="exam-panel">
                  <div className="info-kicker">STRUCTURE IDENTIFICATION</div>
                  <Title>Question {questionIndex + 1}</Title>
                  <p className="exam-question">{currentQuestion.prompt}</p>
                  {!displayReady && (
                    <output className="vm-practice-note" aria-live="polite">
                      Practice paused until the 3D view and shoulder anatomy are
                      available. Your answers are retained; recovery controls
                      and Exit exam remain available.
                    </output>
                  )}
                  {!answerId ? (
                    <div className="waiting-card">
                      <ScanLine />
                      <strong>Choose on the model</strong>
                      <span>Rotate to inspect, then select a structure.</span>
                    </div>
                  ) : (
                    <div
                      className={`answer-card ${answerCorrect ? 'correct' : 'incorrect'}`}
                    >
                      <div className="answer-status">
                        {answerCorrect ? <Check /> : <Crosshair />}
                        <strong>
                          {answerCorrect ? 'Correct' : 'Not quite'}
                        </strong>
                      </div>
                      <p>
                        You selected <b>{answerName}</b>.
                      </p>
                      {!answerCorrect && (
                        <p>
                          The correct structure is{' '}
                          <b>
                            {structureById.get(currentQuestion.answer)?.name}
                          </b>
                          .
                        </p>
                      )}
                      <Button onClick={nextQuestion} disabled={!displayReady}>
                        {questionIndex === quizQuestions.length - 1
                          ? 'Restart exam'
                          : 'Next question'}
                        <ChevronRight />
                      </Button>
                    </div>
                  )}
                  <div className="exam-standard">
                    <span>Current result</span>
                    <strong>
                      {score} / {questionIndex + (answerId ? 1 : 0)}
                    </strong>
                    <p>
                      Prototype formative assessment; not a credentialed or
                      summative exam.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <WorkspaceOnly modes={['explore', 'dissect']}>
                    <div className="info-head">
                      <div>
                        <div className="info-kicker">
                          {selected.category} · {selected.shortId}
                        </div>
                        <Title>{selected.name}</Title>
                        <p className="latin-name">{selected.latinName}</p>
                      </div>
                      <button
                        className="isolate-quick"
                        type="button"
                        onClick={() => setIsolated(!isolated)}
                      >
                        {isolated ? <Eye /> : <EyeOff />}{' '}
                        {isolated ? 'Isolated' : 'Isolate'}
                      </button>
                    </div>
                    <ReviewStatus structureId={selected.id} teachingDraft connected={connectedReviews} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={revealSelection}
                    >
                      Reveal selection
                    </Button>
                    <GroupedAnatomyNotes>
                      {(tab) => {
                        const section = selected.sections[tab];
                        const modality = {
                          ct: 'CT',
                          mri: 'MRI',
                          xray: 'X-ray',
                          ultrasound: 'Ultrasound',
                        }[tab as 'ct' | 'mri' | 'xray' | 'ultrasound'];
                        return (
                          <div className="shoulder-note">
                            {modality && (
                              <div className="imaging-empty">
                                <ScanLine />
                                <span>No {modality} study loaded</span>
                                {tab !== 'xray' && (
                                  <button type="button" onClick={toggleSync}>
                                    {syncPlane
                                      ? 'Hide reference plane'
                                      : 'Preview 3D reference plane'}
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="eyebrow">{section.title}</div>
                            <p className="section-body">{section.body}</p>
                            {section.bullets && (
                              <ul className="clinical-list">
                                {section.bullets.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                            {section.note && (
                              <div className="content-note">{section.note}</div>
                            )}
                            {section.citations?.length ? (
                              <div className="body-reference-links">
                                {section.citations.map((url, i) => (
                                  <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Reference {i + 1} ↗
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      }}
                    </GroupedAnatomyNotes>
                    <dl className="fact-grid">
                      <div>
                        <dt>Region</dt>
                        <dd>{selected.region}</dd>
                      </div>
                      <div>
                        <dt>System</dt>
                        <dd>{systemMeta[selected.system].name}</dd>
                      </div>
                      <div>
                        <dt>Side</dt>
                        <dd>Right</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>Draft · Unvalidated</dd>
                      </div>
                    </dl>
                    <div className="validation-note">
                      <strong>Educational model · Review pending</strong>
                      <span>
                        Source-aligned BodyParts3D surfaces, with illustrative
                        shading. Upper arm cropped for this shoulder view. Not
                        patient-specific or validated for diagnosis.
                      </span>
                    </div>
                  </WorkspaceOnly>
                  <WorkspaceOnly modes={['practice']}>
                    <div className="quiz-entry">
                      <div className="quiz-mark">
                        <Brain />
                      </div>
                      <div className="eyebrow">
                        Structure check · {selected.name}
                      </div>
                      <h2>{selected.sections.quiz.body}</h2>
                      {selected.sections.quiz.bullets?.map((choice, index) => (
                        <div className="quiz-choice" key={choice}>
                          <b>{String.fromCharCode(65 + index)}</b>
                          <span>{choice}</span>
                        </div>
                      ))}
                      <Button onClick={toggleMode} disabled={!displayReady}>
                        <GraduationCap /> Start identification exam
                      </Button>
                      {!displayReady && (
                        <p>Practice is available once the 3D model is ready.</p>
                      )}
                      <p>
                        Formative practice only; not a credentialed examination.
                      </p>
                    </div>
                  </WorkspaceOnly>
                </>
              )}
            </div>
          </AnatomyInfoPanel>
        </div>
      </AtlasWorkspace>
    </TooltipProvider>
  );
}
