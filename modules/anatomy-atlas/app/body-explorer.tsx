'use client';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Accessibility,
  Bone,
  Brain,
  Heart,
  Layers3,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  Focus,
  Plus,
  Minus,
  Tags,
  GraduationCap,
  Check,
  ArrowLeft,
  ScanLine,
  Network,
  Link2,
} from 'lucide-react';
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  bodySystems,
  allBodySystems,
  type BodyCatalog,
  type BodyStructure,
  type BodySystem,
} from './body-types';
import { bodyContent } from './body-content';
import type { ContentTab } from './anatomy-data';
import { emitImagingSync } from '@/lib/imaging-sync';
import {
  dissectionProfiles,
  dissectionReducer,
  initialDissection,
  resolveDissection,
  type DissectionView,
} from './dissection-data';
import { DissectionControls, DissectionGuide } from './dissection-controls';
import './body-explorer.css';
import { Brand } from './brand';
import { ReviewStatus } from './review-status';

const Scene = dynamic(() => import('./body-scene').then((m) => m.BodyScene), {
  ssr: false,
});
const systemKeys = Object.keys(bodySystems) as BodySystem[];
const icons = {
  skeleton: Bone,
  muscles: Layers3,
  organs: Heart,
  nerves: Brain,
  vessels: Network,
  connective: Link2,
};
const tabs: Array<[ContentTab, string]> = [
  ['anatomy', 'Anatomy'],
  ['function', 'Function'],
  ['ct', 'CT'],
  ['mri', 'MRI'],
  ['ultrasound', 'Ultrasound'],
  ['pathology', 'Pathology'],
  ['clinical', 'Clinical'],
  ['quiz', 'Quiz'],
];
const initialSystems: Record<BodySystem, boolean> = {
  skeleton: true,
  muscles: false,
  organs: false,
  nerves: false,
  vessels: false,
  connective: false,
};

export default function BodyExplorer({
  initialRegion,
}: {
  initialRegion: string;
}) {
  const profile =
    dissectionProfiles[initialRegion] ?? dissectionProfiles['whole-body'];
  const [dissection, dispatch] = useReducer(dissectionReducer, {
    ...initialDissection,
    stageId: initialRegion === 'whole-body' ? 'free' : 'assembled',
  });
  const [ghostRemoved, setGhostRemoved] = useState(false),
    [illustrated, setIllustrated] = useState(true);
  const [catalog, setCatalog] = useState<BodyCatalog | null>(null),
    [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [systems, setSystems] = useState(
      initialRegion === 'whole-body' ? initialSystems : allBodySystems,
    );
  const [side, setSide] = useState('both'),
    [isolated, setIsolated] = useState(false),
    [focus, setFocus] = useState(false);
  const [explode, setExplode] = useState(0),
    [labels, setLabels] = useState(true);
  const [anchorSkeleton, setAnchorSkeleton] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false);
  const [view, setView] = useState<DissectionView>(profile.stages[0].view),
    [zoom, setZoom] = useState(1),
    [reset, setReset] = useState(0);
  const [loaded, setLoaded] = useState<string[]>([]),
    [failed, setFailed] = useState<string[]>([]);
  const [exam, setExam] = useState(false),
    [examTargets, setExamTargets] = useState<string[]>([]),
    [question, setQuestion] = useState(0),
    [answer, setAnswer] = useState<string | null>(null),
    [score, setScore] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/models/bodyparts3d/full-body/catalog.json', {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error('Catalog unavailable');
        return r.json();
      })
      .then((data) => {
        const value = data as BodyCatalog;
        if (
          !Array.isArray(value.structures) ||
          !Array.isArray(value.bundles) ||
          !Array.isArray(value.regions)
        )
          throw new Error('Invalid anatomy catalog');
        setCatalog(value);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);
  const region = catalog?.regions.find((r) => r.id === initialRegion),
    whole = initialRegion === 'whole-body';
  const regionStructures = useMemo(
    () =>
      catalog?.structures.filter(
        (s) =>
          (whole || s.regions.includes(initialRegion)) &&
          (side === 'both' ||
            s.laterality === side ||
            ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
      ) ?? [],
    [catalog, whole, initialRegion, side],
  );
  const resolved = useMemo(
    () => resolveDissection(regionStructures, profile, dissection),
    [regionStructures, profile, dissection],
  );
  const hiddenIds = useMemo(
    () => resolved.removed.map((s) => s.id),
    [resolved],
  );
  const stage = profile.stages.find((s) => s.id === dissection.stageId);
  const stageLandmarks = useMemo(
    () =>
      [
        ...new Set(
          (stage?.landmarks ?? []).flatMap((pattern) =>
            resolved.visible
              .filter(
                (s) =>
                  systems[s.system] &&
                  new RegExp(pattern, 'i').test(s.sourceName),
              )
              .slice(0, 2)
              .map((s) => s.id),
          ),
        ),
      ].slice(0, 8),
    [stage, resolved, systems],
  );
  const selected = catalog?.structures.find((s) => s.id === selectedId) ?? null;
  const available = regionStructures.filter(
    (s) => systems[s.system] && !hiddenIds.includes(s.id),
  );
  const required = [
      ...new Set(
        (ghostRemoved && !exam
          ? regionStructures.filter((s) => systems[s.system])
          : available
        ).map((s) => s.bundle),
      ),
    ],
    pending = required.filter(
      (id) => !loaded.includes(id) && !failed.includes(id),
    );
  const onLoaded = useCallback(
    (id: string) =>
      setLoaded((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  );
  const onFailure = useCallback(
    (id: string) =>
      setFailed((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  );
  const select = useCallback(
    (id: string) => {
      const s = regionStructures.find((item) => item.id === id);
      if (!s) return;
      setSelectedId(id);
      setSystems((prev) =>
        prev[s.system] ? prev : { ...prev, [s.system]: true },
      );
      if (hiddenIds.includes(id)) dispatch({ type: 'restore', id });
      emitImagingSync({
        structureId: id,
        plane: 'axial',
        normalizedSlice: 0.5,
        source: '3d',
      });
    },
    [regionStructures, hiddenIds],
  );
  function changeStage(id: string) {
    dispatch(id === 'free' ? { type: 'free' } : { type: 'stage', id });
    setSystems(allBodySystems);
    setSelectedId(null);
    setFocus(false);
    setIsolated(false);
    setExplode(0);
    setZoom(1);
    setView(
      profile.stages.find((s) => s.id === id)?.view ?? profile.stages[0].view,
    );
    setReset((n) => n + 1);
  }
  function changeFocus(id: string) {
    dispatch({ type: 'focus', id });
    setSystems(allBodySystems);
    setSelectedId(null);
    setFocus(false);
    setIsolated(false);
    setExplode(0);
    setZoom(1);
    setView(profile.focuses.find((s) => s.id === id)?.view ?? 'anterior');
    setReset((n) => n + 1);
  }
  function undoDissection() {
    dispatch({ type: 'undo' });
    setSelectedId(null);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
  }
  function restoreStructure(id: string) {
    dispatch({ type: 'restore', id });
    const s = catalog?.structures.find((s) => s.id === id);
    if (s) setSystems((prev) => ({ ...prev, [s.system]: true }));
  }
  function onSceneSelect(id: string) {
    if (exam) {
      if (!answer) {
        setAnswer(id);
        if (id === examTargets[question]) setScore((v) => v + 1);
      }
    } else select(id);
  }
  function preset(system: BodySystem) {
    dispatch({ type: 'free' });
    setSystems({
      skeleton: system === 'skeleton',
      muscles: system === 'muscles',
      organs: system === 'organs',
      nerves: system === 'nerves',
      vessels: system === 'vessels',
      connective: system === 'connective',
    });
    setSelectedId(null);
    setIsolated(false);
    setFocus(false);
  }
  function startExam() {
    // Largest currently visible objects are practical canvas targets; do not ask for hidden nerves.
    const candidates = available
      .filter((s) => loaded.includes(s.bundle))
      .sort((a, b) => {
        const volume = (s: BodyStructure) =>
          s.bounds.max.reduce(
            (v, n, i) => v * Math.max(0.01, n - s.bounds.min[i]),
            1,
          );
        return volume(b) - volume(a);
      })
      .slice(0, 5);
    if (!candidates.length) return;
    setExamTargets(candidates.map((s) => s.id));
    setQuestion(0);
    setAnswer(null);
    setScore(0);
    setExam(true);
    setSelectedId(null);
    setIsolated(false);
    setFocus(false);
    setExplode(0);
  }
  function nextQuestion() {
    if (question + 1 === examTargets.length) {
      setExam(false);
      return;
    }
    setQuestion((n) => n + 1);
    setAnswer(null);
  }
  function resetView() {
    setZoom(1);
    setFocus(false);
    setIsolated(false);
    setExplode(0);
    setReset((n) => n + 1);
  }

  useEffect(() => {
    type Context = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => unknown;
    };
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context || !catalog) return;
    const lifecycle = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: 'select_body_structure',
          title: 'Select body structure',
          description:
            'Select a source-mapped structure in the current body region.',
          inputSchema: {
            type: 'object',
            properties: {
              structureId: {
                type: 'string',
                enum: regionStructures.map((s) => s.id),
              },
            },
            required: ['structureId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (exam) throw new Error('Selection tools disabled during exam');
            const id = (input as { structureId?: unknown }).structureId;
            if (
              typeof id !== 'string' ||
              !regionStructures.some((s) => s.id === id)
            )
              throw new Error('Structure not in this region');
            select(id);
            return { selectedId: id };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [catalog, regionStructures, select, exam]);

  if (error)
    return (
      <main className="body-status">
        <h1>The anatomy library could not load.</h1>
        <p>Please refresh to retry.</p>
        <Link href="/shoulder">Open the shoulder explorer</Link>
      </main>
    );
  if (!catalog)
    return (
      <main className="body-status">
        <Brand surface="light" />
        <p>Loading the body-region library…</p>
      </main>
    );
  if (!whole && !region)
    return (
      <main className="body-status">
        <h1>Region not found</h1>
        <Link href="/">Return to whole-body anatomy</Link>
      </main>
    );
  const title = whole ? 'Whole body' : region!.name;
  const target = catalog.structures.find((s) => s.id === examTargets[question]);
  const studyGuide = (
    <DissectionGuide
      profile={profile}
      stage={stage}
      focusTitle={
        profile.focuses.find((f) => f.id === dissection.focusId)?.title
      }
      removed={resolved.removed}
      visible={available}
      onRestore={restoreStructure}
      onSelect={select}
      customized={
        dissection.removed.length > 0 ||
        dissection.restored.length > 0 ||
        regionStructures.some((s) => !systems[s.system])
      }
    />
  );
  return (
    <main className="body-app">
      <header className="body-topbar">
        <Brand />
        <div className="body-breadcrumb">
          Anatomy <ChevronRight />
          <strong>{title}</strong>
        </div>
        <Button
          variant="outline"
          onClick={() => (exam ? setExam(false) : startExam())}
          disabled={!exam && (pending.length > 0 || available.length === 0)}
        >
          <GraduationCap />
          {exam ? 'Exit practice' : 'Identify structures'}
        </Button>
      </header>
      <div className="body-layout">
        <aside className="body-rail">
          <div className="body-rail-title">Explore anatomy</div>
          <Link
            className={`body-region-link ${whole ? 'active' : ''}`}
            href="/"
          >
            <Accessibility />
            <span>Whole body</span>
            <small>{catalog.structures.length}</small>
          </Link>
          <div className="body-rail-subtitle">Individual regions</div>
          <nav aria-label="Body regions">
            {catalog.regions.map((r) => (
              <Link
                key={r.id}
                className={`body-region-link ${initialRegion === r.id ? 'active' : ''}`}
                href={`/regions/${r.id}`}
              >
                <span>{r.name}</span>
                <ChevronRight />
              </Link>
            ))}
          </nav>
          <Link href="/shoulder" className="shoulder-feature">
            <Bone />
            <span>
              Shoulder dissection<small>Dedicated rotator-cuff explorer</small>
            </span>
            <ChevronRight />
          </Link>
          <div className="body-rail-foot">
            <span>Adult reference anatomy</span>
            <p>One source model, preserved in a common spatial frame.</p>
            <a
              href="/models/bodyparts3d/credits.html"
              target="_blank"
              rel="noreferrer"
            >
              Sources & commercial licence ↗
            </a>
          </div>
        </aside>
        <section className="body-workspace" aria-label={`${title} 3D anatomy`}>
          <div className="body-heading">
            <div>
              <div className="eyebrow">SPATIAL ANATOMY LIBRARY</div>
              <h1>{title}</h1>
              <p>
                {whole
                  ? 'Explore the body by region or anatomical system.'
                  : region!.description}
              </p>
            </div>
            <span className="body-count">
              {regionStructures.length}
              <small>structures</small>
            </span>
          </div>
          <div className="body-mobile-regions">
            <Select
              value={initialRegion}
              onValueChange={(value) => {
                if (value)
                  window.location.assign(
                    value === 'whole-body' ? '/' : `/regions/${value}`,
                  );
              }}
            >
              <SelectTrigger aria-label="Choose body region">
                <SelectValue>{title}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whole-body">Whole body</SelectItem>
                {catalog.regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="body-system-bar" aria-label="Anatomical systems">
            {systemKeys.map((system) => {
              const Icon = icons[system],
                count = regionStructures.filter(
                  (s) => s.system === system,
                ).length;
              return (
                <div key={system} className={systems[system] ? 'active' : ''}>
                  <Icon style={{ color: bodySystems[system].color }} />
                  <span>
                    {bodySystems[system].name}
                    <small>
                      {count}
                      {system === 'nerves' ? ' · partial' : ''}
                    </small>
                  </span>
                  <Switch
                    checked={systems[system]}
                    disabled={exam || count === 0}
                    onCheckedChange={(checked) =>
                      setSystems((prev) => ({ ...prev, [system]: checked }))
                    }
                    aria-label={`Show ${bodySystems[system].name}`}
                  />
                </div>
              );
            })}
          </div>
          <DissectionControls
            profile={profile}
            state={dissection}
            onStage={changeStage}
            onFocus={changeFocus}
            onUndo={undoDissection}
            onReset={() => changeStage('assembled')}
            ghost={ghostRemoved}
            onGhost={setGhostRemoved}
            visibleCount={available.length}
            disabled={exam}
          />
          <div className="body-canvas illustration-mode">
            <div className="body-view-row">
              <fieldset className="body-view-buttons">
                <legend className="sr-only">Camera direction</legend>
                {(
                  [
                    'anterior',
                    'posterior',
                    'right',
                    'left',
                    'inferior',
                    'superior',
                  ] as const
                ).map((v) => (
                  <button
                    type="button"
                    key={v}
                    className={view === v ? 'active' : ''}
                    aria-pressed={view === v}
                    onClick={() => {
                      setView(v);
                      setReset((n) => n + 1);
                    }}
                  >
                    {initialRegion === 'foot' && v === 'inferior'
                      ? 'Plantar'
                      : v}
                  </button>
                ))}
              </fieldset>
              <Select
                value={side}
                onValueChange={(value) => {
                  if (value) {
                    setSide(value);
                    setSelectedId(null);
                    setFocus(false);
                  }
                }}
              >
                <SelectTrigger aria-label="Laterality filter" disabled={exam}>
                  <SelectValue>
                    {side === 'both'
                      ? 'Both sides'
                      : `${side[0].toUpperCase() + side.slice(1)} side`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both sides</SelectItem>
                  <SelectItem value="right">Right side</SelectItem>
                  <SelectItem value="left">Left side</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Scene
              catalog={catalog}
              structures={
                exam
                  ? regionStructures.filter((s) => examTargets.includes(s.id))
                  : regionStructures
              }
              selectedId={selectedId}
              systems={systems}
              isolated={isolated && !exam}
              hiddenIds={hiddenIds}
              ghostRemoved={ghostRemoved && !exam}
              illustrated={illustrated}
              landmarks={exam ? [] : stageLandmarks}
              explode={explode}
              anchorSkeleton={anchorSkeleton}
              showOrigins={showOrigins && !exam}
              labels={labels && !exam}
              view={view}
              zoom={zoom}
              reset={reset}
              focus={focus}
              exam={exam}
              onSelect={onSceneSelect}
              onLoaded={onLoaded}
              onFailure={onFailure}
            />
            {pending.length > 0 && (
              <output className="body-loading">
                Loading anatomy · {required.length - pending.length}/
                {required.length} groups
              </output>
            )}
            {required.some((id) => failed.includes(id)) && (
              <div className="body-loading error" role="alert">
                Some anatomy could not load. Refresh to retry.
              </div>
            )}
            {!available.length && (
              <div className="body-empty">
                Choose a system with available anatomy, or restore hidden
                structures.
              </div>
            )}
            {exam && (
              <div className="body-exam-prompt">
                <span>
                  IDENTIFY {question + 1} OF {examTargets.length}
                </span>
                <strong>Find {target?.name.toLowerCase()}</strong>
              </div>
            )}
            <div className="body-zoom">
              <Button
                size="icon"
                variant="outline"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}
              >
                <Plus />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
              >
                <Minus />
              </Button>
            </div>
            <div className="body-toolbar">
              <Button
                size="icon"
                variant={isolated ? 'default' : 'ghost'}
                aria-label="Fade other structures"
                disabled={!selected || exam}
                onClick={() => setIsolated((v) => !v)}
              >
                <Eye />
              </Button>
              <Button
                size="icon"
                variant={focus ? 'default' : 'ghost'}
                aria-label="Frame selected structure"
                disabled={!selected || exam}
                onClick={() => {
                  setFocus((v) => !v);
                  setZoom(1);
                }}
              >
                <Focus />
              </Button>
              <Button
                size="icon"
                variant={labels ? 'secondary' : 'ghost'}
                aria-label="Toggle stage and selected labels"
                disabled={exam}
                onClick={() => setLabels((v) => !v)}
              >
                <Tags />
              </Button>
              <div className="body-explode">
                <Layers3 />
                <span>Explode</span>
                <Slider
                  value={[explode]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={exam}
                  onValueChange={(v) => setExplode(Array.isArray(v) ? v[0] : v)}
                  aria-label="Exploded separation"
                />
                <output>{explode}%</output>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Reset camera and separation"
                onClick={resetView}
              >
                <RotateCcw />
              </Button>
            </div>
            <div className="body-canvas-caption">
              {explode > 0
                ? 'Exploded teaching view · Positions are not anatomical'
                : 'Drag to rotate · Pinch to zoom · Select any visible structure'}
            </div>
            <a
              className="model-credit"
              href="/models/bodyparts3d/credits.html"
              target="_blank"
              rel="noreferrer"
            >
              BodyParts3D · CC BY 4.0 · Adapted
            </a>
          </div>
          {systems.nerves && (
            <div className="body-coverage">
              <Brain />
              <span>
                Partial nervous anatomy: brain and selected cranial/orbital
                nerves. The narrow spinal structure is the central canal, not a
                complete cord. Limb peripheral nerves are not included.
              </span>
            </div>
          )}
          {(systems.vessels || systems.connective) && (
            <div className="body-coverage">
              <Network />
              <span>
                Selected source anatomy · review pending. Vessels are incomplete
                segments; red = artery and blue = vein, not oxygenation.
                Connective coverage includes selected discs, cartilage,
                ligaments, interosseous membranes and Achilles tendons; it is
                incomplete.
              </span>
            </div>
          )}
          {!exam && (
            <div className="body-preset-row">
              <span>Quick system views</span>
              {systemKeys.map((system) => (
                <button
                  key={system}
                  type="button"
                  disabled={!regionStructures.some((s) => s.system === system)}
                  onClick={() => preset(system)}
                >
                  {bodySystems[system].name} only
                </button>
              ))}
              <button
                type="button"
                aria-pressed={illustrated}
                onClick={() => setIllustrated((v) => !v)}
              >
                {illustrated ? 'Illustrated surfaces' : 'Plain surfaces'}
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
        </section>
        <aside className="body-info" aria-live="polite">
          {exam ? (
            <>
              <div className="eyebrow">IDENTIFICATION PRACTICE</div>
              <h2>
                {question + 1} / {examTargets.length}
              </h2>
              <p>
                Find the named structure on the model. Labels and selection
                hints are hidden.
              </p>
              {answer ? (
                <div
                  className={`body-answer ${answer === target?.id ? 'correct' : ''}`}
                >
                  <Check />
                  <strong>
                    {answer === target?.id ? 'Correct' : 'Not quite'}
                  </strong>
                  <p>
                    You selected{' '}
                    {catalog.structures.find((s) => s.id === answer)?.name}.
                  </p>
                  <Button onClick={nextQuestion}>
                    {question + 1 === examTargets.length
                      ? 'Finish practice'
                      : 'Next structure'}
                    <ChevronRight />
                  </Button>
                </div>
              ) : (
                <div className="body-practice-wait">
                  <Focus />
                  <span>
                    Rotate and inspect the model, then select your answer.
                  </span>
                </div>
              )}
              <div className="body-practice-score">
                Score{' '}
                <strong>
                  {score} / {question + (answer ? 1 : 0)}
                </strong>
              </div>
              <small>
                Formative practice only. Targets are chosen from currently
                loaded, visible structures; overlap may require rotation.
              </small>
            </>
          ) : (
            <>
              {selected ? (
                <details className="dissection-guide-fold">
                  <summary>
                    Study guide · {stage?.title ?? 'Custom view'}
                  </summary>
                  {studyGuide}
                </details>
              ) : (
                studyGuide
              )}
              <div className="eyebrow">FIND A STRUCTURE</div>
              <Combobox<BodyStructure>
                items={regionStructures}
                value={selected}
                onValueChange={(s) => s && select(s.id)}
                itemToStringLabel={(s) => s.name}
                itemToStringValue={(s) => s.id}
                isItemEqualToValue={(a, b) => a.id === b.id}
              >
                <ComboboxInput placeholder="Search this region…" showClear />
                <ComboboxContent>
                  <ComboboxEmpty>No matching structures.</ComboboxEmpty>
                  <ComboboxList>
                    {regionStructures.map((s) => (
                      <ComboboxItem key={s.id} value={s}>
                        {s.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {selected ? (
                <>
                  <div className="body-selection-heading">
                    <span
                      style={{ background: bodySystems[selected.system].color }}
                    />
                    {bodySystems[selected.system].name} · {selected.fmaId}
                  </div>
                  <h2>{selected.name}</h2>
                  <ReviewStatus structureId={selected.id} />
                  <div className="body-selection-actions">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsolated(true);
                        setFocus(true);
                        setZoom(1);
                      }}
                    >
                      <Focus />
                      Isolate & frame
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        dispatch({ type: 'remove', id: selected.id });
                        setSelectedId(null);
                        setFocus(false);
                        setIsolated(false);
                      }}
                    >
                      <EyeOff />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedId(null);
                        setIsolated(false);
                        setFocus(false);
                      }}
                      aria-label="Clear selection"
                    >
                      <ArrowLeft />
                    </Button>
                  </div>
                  <Tabs defaultValue="anatomy" className="body-content-tabs">
                    <TabsList variant="line">
                      {tabs.map(([value, label]) => (
                        <TabsTrigger key={value} value={value}>
                          {label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {tabs.map(([value]) => {
                      const content = bodyContent(selected, value);
                      return (
                        <TabsContent key={value} value={value}>
                          <div className="eyebrow">{content.title}</div>
                          <p>{content.body}</p>
                          {content.bullets && (
                            <ul>
                              {content.bullets.map((b) => (
                                <li key={b}>{b}</li>
                              ))}
                            </ul>
                          )}
                          {content.note && (
                            <div className="body-content-note">
                              {content.note}
                            </div>
                          )}
                          {content.citations?.length ? (
                            <div className="body-reference-links">
                              {content.citations.map((url, i) => (
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
                          {value === 'quiz' && (
                            <Button
                              onClick={startExam}
                              disabled={!available.length || pending.length > 0}
                            >
                              <GraduationCap />
                              Start identification practice
                            </Button>
                          )}
                          {['ct', 'mri', 'ultrasound'].includes(value) && (
                            <div className="body-no-imaging">
                              <ScanLine />
                              No imaging study loaded
                            </div>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                  <dl className="body-facts">
                    <div>
                      <dt>Region</dt>
                      <dd>
                        {
                          catalog.regions.find((r) => r.id === selected.region)
                            ?.name
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>Laterality</dt>
                      <dd>
                        {selected.laterality === 'unspecified'
                          ? 'Not lateralised'
                          : selected.laterality}
                      </dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>BodyParts3D 4.0</dd>
                    </div>
                    <div>
                      <dt>Review</dt>
                      <dd>Draft · pending</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <>
                  <div className="body-intro-icon">
                    <Accessibility />
                  </div>
                  <h2>Explore in three dimensions</h2>
                  <p>
                    Select a structure to inspect its identity, isolate it, or
                    explore the available teaching notes.
                  </p>
                  <div className="body-summary-grid">
                    {systemKeys.map((system) => (
                      <div key={system}>
                        <strong>
                          {
                            regionStructures.filter((s) => s.system === system)
                              .length
                          }
                        </strong>
                        <span>{bodySystems[system].name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="body-content-note">
                    The geometry is source-based. New teaching entries are
                    clearly marked where specialist content is still pending.
                  </div>
                </>
              )}
              <details className="body-structure-browser" open={!whole}>
                <summary>Browse structures ({regionStructures.length})</summary>
                <div>
                  {regionStructures.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={s.id === selectedId ? 'active' : ''}
                      onClick={() => select(s.id)}
                    >
                      <i style={{ background: bodySystems[s.system].color }} />
                      <span>{s.name}</span>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </details>
              <div className="body-validation">
                Educational reference model · Independent clinical validation
                pending. Not for diagnosis or patient-specific decisions.
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
