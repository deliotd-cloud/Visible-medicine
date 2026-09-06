'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  type ContentTab,
  type SystemKey,
} from './anatomy-data';
import type { CameraView, AnatomyLayer } from './anatomy-scene';
import { emitImagingSync } from '@/lib/imaging-sync';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type Mode = 'study' | 'exam';
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

const tabs: Array<{ value: ContentTab; label: string }> = [
  { value: 'anatomy', label: 'Anatomy' },
  { value: 'function', label: 'Function' },
  { value: 'ct', label: 'CT' },
  { value: 'mri', label: 'MRI' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'quiz', label: 'Quiz' },
];

const systemIcons: Record<SystemKey, typeof Bone> = {
  skeleton: Bone,
  muscles: Layers3,
  'soft-tissue': CircleDot,
};
const AnatomyScene = dynamic(
  () => import('./anatomy-scene').then((module) => module.AnatomyScene),
  { ssr: false },
);

export default function ShoulderExplorer({
  initialSelectedId = structures[0].id,
}: {
  initialSelectedId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [view, setView] = useState<CameraView>('posterior');
  const [layer, setLayer] = useState<AnatomyLayer>('cuff');
  const [zoom, setZoom] = useState(1);
  const [visibleSystems, setVisibleSystems] = useState<
    Record<SystemKey, boolean>
  >({ skeleton: true, muscles: true, 'soft-tissue': true });
  const [isolated, setIsolated] = useState(false);
  const [explode, setExplode] = useState(0);
  const [anchorSkeleton, setAnchorSkeleton] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false);
  const [plate, setPlate] = useState(false);
  const [inspection, setInspection] = useState(initialInspection);
  const [showLabels, setShowLabels] = useState(true);
  const [syncPlane, setSyncPlane] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const [mode, setMode] = useState<Mode>('study');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const selected = structureById.get(selectedId) ?? structures[0];
  const currentQuestion = quizQuestions[questionIndex];

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

  const selectStructure = useCallback((id: string) => {
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
    setVisibleSystems((current) => ({ ...current, [structure.system]: true }));
    return true;
  }, []);

  const handleSceneSelect = (id: string) => {
    selectStructure(id);
    if (mode === 'exam' && !answerId) {
      setAnswerId(id);
      if (id === currentQuestion.answer) setScore((value) => value + 1);
    }
  };

  const nextQuestion = () => {
    if (questionIndex === quizQuestions.length - 1) setScore(0);
    setAnswerId(null);
    setQuestionIndex((value) => (value + 1) % quizQuestions.length);
    setIsolated(false);
  };

  const toggleMode = () => {
    setPlate(false);
    setSyncPlane(false);
    setMode((current) => (current === 'study' ? 'exam' : 'study'));
    setAnswerId(null);
    setQuestionIndex(0);
    setScore(0);
    setIsolated(false);
    setLayer('cuff');
    setVisibleSystems({ skeleton: true, muscles: true, 'soft-tissue': true });
    setExplode(0);
  };

  const toggleSync = () => {
    const next = !syncPlane;
    setSyncPlane(next);
    if (next)
      emitImagingSync({
        structureId: selectedId,
        plane: 'axial',
        normalizedSlice: 0.5,
        source: '3d',
      });
  };

  useEffect(() => {
    if (syncPlane)
      emitImagingSync({
        structureId: selectedId,
        plane: 'axial',
        normalizedSlice: 0.5,
        source: '3d',
      });
  }, [selectedId, syncPlane]);

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

  return (
    <TooltipProvider>
      <main className="app-shell">
        <header className="topbar">
          <Brand />
          <div className="workspace-name">
            <Bone /> Shoulder <span>/ Explorer</span>
          </div>
          <div className="top-actions">
            <Link
              className="body-return-link"
              href={`/review?structure=${encodeURIComponent(selectedId)}`}
            >
              Review workspace
            </Link>
            <Link href="/" className="body-return-link">
              Whole body & regions
            </Link>
            <Badge variant="outline" className="prototype-badge">
              3D anatomy · Right shoulder
            </Badge>
            <Button
              className="mode-button"
              variant={mode === 'exam' ? 'default' : 'outline'}
              onClick={toggleMode}
            >
              {mode === 'exam' ? <Brain /> : <GraduationCap />}
              {mode === 'exam' ? 'Exit exam' : 'Exam mode'}
            </Button>
          </div>
        </header>

        <div className="workspace-grid">
          <aside className="control-rail" aria-label="Anatomy controls">
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
                    {Object.values(visibleSystems).filter(Boolean).length}/3
                    visible
                  </small>
                </div>
                {(Object.keys(systemMeta) as SystemKey[]).map((system) => {
                  const Icon = systemIcons[system];
                  const meta = systemMeta[system];
                  return (
                    <div
                      key={system}
                      className={`system-card ${visibleSystems[system] ? 'active' : ''}`}
                    >
                      <span className={`system-icon ${system}`}>
                        <Icon />
                      </span>
                      <span>
                        <strong>{meta.name}</strong>
                        <small>{meta.description}</small>
                      </span>
                      <Switch
                        checked={visibleSystems[system]}
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

                <div className="rail-section-heading structure-heading">
                  <span>Structures</span>
                  <small>{structures.length}</small>
                </div>
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
                  onPlate={setPlate}
                />
                <div className="vm-plates">
                  <h2>Shoulder illustration plates</h2>
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
                    BodyParts3D · CC BY 4.0 · adapted. Hatching is illustrative,
                    not measured fascicle direction.
                  </small>
                </div>
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
          </aside>

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
            <div className="dissection-controls">
              <fieldset className="camera-selector">
                <legend>View</legend>
                {(['posterior', 'anterior', 'lateral'] as CameraView[]).map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      aria-pressed={view === item}
                      className={view === item ? 'active' : ''}
                      onClick={() => {
                        setView(item);
                        setResetNonce((n) => n + 1);
                      }}
                    >
                      {item}
                    </button>
                  ),
                )}
              </fieldset>
              <fieldset className="layer-selector">
                <legend>Dissection</legend>
                {(
                  [
                    { id: 'cuff', label: 'Rotator cuff' },
                    { id: 'surface', label: 'Deltoid on' },
                    { id: 'bones', label: 'Bones' },
                  ] as const
                ).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={layer === item.id}
                    className={layer === item.id ? 'active' : ''}
                    onClick={() => {
                      setLayer(item.id);
                      if (item.id === 'bones') setSelectedId(structures[0].id);
                      else if (
                        item.id === 'cuff' &&
                        ['deltoid', 'biceps-long-head'].includes(
                          selectedId.split(':').at(-1)!,
                        )
                      )
                        setSelectedId(structures[0].id);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </fieldset>
            </div>
            {mode === 'exam' && (
              <div className="exam-prompt">
                <span>QUESTION {questionIndex + 1}</span>
                <strong>{currentQuestion.prompt}</strong>
              </div>
            )}
            <AnatomyScene
              structures={structures}
              selectedId={selectedId}
              visibleSystems={visibleSystems}
              isolated={isolated && mode === 'study'}
              explode={explode}
              showLabels={showLabels && mode === 'study'}
              syncPlane={syncPlane}
              resetNonce={resetNonce}
              onSelect={handleSceneSelect}
              view={view}
              layer={layer}
              zoom={zoom}
              exam={mode === 'exam'}
              anchorSkeleton={anchorSkeleton}
              showOrigins={showOrigins && mode === 'study'}
              plate={plate}
              inspection={mode === 'exam' ? initialInspection : inspection}
            />
            {mode === 'study' && (
              <div className="vm-scene-options">
                <button
                  type="button"
                  aria-pressed={plate}
                  onClick={() => {
                    setPlate((v) => !v);
                    setResetNonce((n) => n + 1);
                  }}
                >
                  Orthographic plate
                </button>
                <button
                  type="button"
                  aria-pressed={anchorSkeleton}
                  onClick={() => setAnchorSkeleton((v) => !v)}
                >
                  Keep bones assembled
                </button>
                <button
                  type="button"
                  aria-pressed={showOrigins}
                  onClick={() => setShowOrigins((v) => !v)}
                >
                  Original positions
                </button>
              </div>
            )}
            <div className="zoom-controls">
              <Button
                size="icon"
                variant="outline"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.12))}
              >
                <Plus />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.min(1.6, z + 0.12))}
              >
                <Minus />
              </Button>
            </div>
            <div className="viewer-toolbar" aria-label="3D view controls">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon"
                      variant={isolated ? 'default' : 'ghost'}
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
                      aria-label="Toggle imaging sync plane"
                      onClick={toggleSync}
                    />
                  }
                >
                  <Crosshair />
                </TooltipTrigger>
                <TooltipContent>Preview 3D ↔ imaging plane hook</TooltipContent>
              </Tooltip>
              <span className="toolbar-divider" />
              <div className="explode-control">
                <Layers3 />
                <span>Explode</span>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[explode]}
                  onValueChange={(value) =>
                    setExplode(Array.isArray(value) ? value[0] : value)
                  }
                  aria-label="Exploded view separation"
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
              {mode === 'study' && inspection.plane !== 'off'
                ? `${inspection.plane} surface cutaway · ${inspection.position}% · Not CT/MRI`
                : explode > 0
                  ? 'Exploded teaching view · Positions are not anatomical'
                  : plate
                    ? 'Parallel projection · Click a structure · Use + / − to zoom'
                    : 'Drag to rotate · Pinch to zoom · Click to explore'}
            </div>
            <a
              className="model-credit"
              href="/models/bodyparts3d/credits.html"
              target="_blank"
              rel="noreferrer"
            >
              BodyParts3D · CC BY 4.0 · Adapted
            </a>
          </section>

          <aside className="info-panel" aria-live="polite">
            {mode === 'exam' ? (
              <div className="exam-panel">
                <div className="info-kicker">STRUCTURE IDENTIFICATION</div>
                <h1>Question {questionIndex + 1}</h1>
                <p className="exam-question">{currentQuestion.prompt}</p>
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
                      <strong>{answerCorrect ? 'Correct' : 'Not quite'}</strong>
                    </div>
                    <p>
                      You selected <b>{answerName}</b>.
                    </p>
                    {!answerCorrect && (
                      <p>
                        The correct structure is{' '}
                        <b>{structureById.get(currentQuestion.answer)?.name}</b>
                        .
                      </p>
                    )}
                    <Button onClick={nextQuestion}>
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
                <div className="info-head">
                  <div>
                    <div className="info-kicker">
                      {selected.category} · {selected.shortId}
                    </div>
                    <h1>{selected.name}</h1>
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
                <ReviewStatus structureId={selected.id} teachingDraft />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setInspection((current) => ({
                      ...current,
                      plane: 'off',
                      opacity: { ...current.opacity, [selected.system]: 100 },
                    }))
                  }
                >
                  Reveal uncut structure
                </Button>
                <Tabs defaultValue="anatomy" className="content-tabs">
                  <TabsList variant="line" className="content-tabs-list">
                    {tabs.map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {tabs.map((tab) => {
                    const section = selected.sections[tab.value];
                    return (
                      <TabsContent
                        key={`${selected.id}-${tab.value}`}
                        value={tab.value}
                        className="content-tab-panel"
                      >
                        {tab.value === 'quiz' ? (
                          <div className="quiz-entry">
                            <div className="quiz-mark">
                              <Brain />
                            </div>
                            <div className="eyebrow">Structure check</div>
                            <h2>{section.body}</h2>
                            {section.bullets?.map((choice, index) => (
                              <div className="quiz-choice" key={choice}>
                                <b>{String.fromCharCode(65 + index)}</b>
                                <span>{choice}</span>
                              </div>
                            ))}
                            <Button onClick={toggleMode}>
                              <GraduationCap />
                              Start identification exam
                            </Button>
                          </div>
                        ) : (
                          <>
                            {(tab.value === 'ct' ||
                              tab.value === 'mri' ||
                              tab.value === 'ultrasound') && (
                              <div className="imaging-empty">
                                <ScanLine />
                                <span>No {tab.label} study loaded</span>
                                <button type="button" onClick={toggleSync}>
                                  {syncPlane
                                    ? 'Hide reference plane'
                                    : 'Preview 3D reference plane'}
                                </button>
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
                          </>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
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
              </>
            )}
          </aside>
        </div>
      </main>
    </TooltipProvider>
  );
}
