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
import { bodyLinkEntries } from '@/lib/anatomy-link-registry';
import { ImagingLink, useImagingLink } from './imaging-link';
import {
  dissectionProfiles,
  dissectionReducer,
  initialDissection,
  resolveDissection,
  matchesRule,
  type DissectionView,
} from './dissection-data';
import { DissectionControls, DissectionGuide } from './dissection-controls';
import './body-explorer.css';
import { Brand } from './brand';
import { ReviewStatus } from './review-status';
import { InspectionControls } from './inspection-controls';
import { initialInspection } from '@/lib/inspection-state';
import {
  createPracticeSession,
  practiceReducer,
  initialPractice,
  practiceScore,
  practicePool,
  practiceRenderIds,
  missedPracticeIds,
  type PracticeMode,
  type PracticeSampling,
} from '@/lib/anatomy-practice';
import { StudyViews } from './study-views';
import { StructureNavigator } from './structure-navigator';
import { RelatedStudy } from './related-study';
import { StudyLinks } from './study-links';
import {
  noStudyLink,
  resolveStudyLink,
  type ParsedStudyLink,
  type StudySide,
} from '@/lib/study-links';
import { relatedStudyViews } from '@/lib/study-navigation';
import type { StudyCamera, StudyView } from '@/lib/study-views';
import { anatomyRetryPlan } from '@/lib/anatomy-load-retry';
import type { BodyLayout } from '@/lib/body-arrangement';
import {
  bodySystemPresets,
  bodyPresetSystems,
  bodyPresetMatches,
} from '@/lib/body-system-presets';

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
  studyLink = noStudyLink,
}: {
  initialRegion: string;
  studyLink?: ParsedStudyLink;
}) {
  const profile = Object.hasOwn(dissectionProfiles, initialRegion)
    ? dissectionProfiles[initialRegion]
    : dissectionProfiles['whole-body'];
  const appliedStudyLink = useRef(studyLink.status === 'none');
  const [linkedStudyReady, setLinkedStudyReady] = useState(
    studyLink.status === 'none',
  );
  const [linkIssue, setLinkIssue] = useState<string | null>(null);
  const [dissection, dispatch] = useReducer(dissectionReducer, {
    ...initialDissection,
    stageId: initialRegion === 'whole-body' ? 'free' : 'assembled',
  });
  const [ghostRemoved, setGhostRemoved] = useState(false),
    [illustrated, setIllustrated] = useState(true);
  const [catalog, setCatalog] = useState<BodyCatalog | null>(null),
    [error, setError] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [selectionNotice, setSelectionNotice] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [retries, setRetries] = useState<Record<string, number>>({});
  const [retrying, setRetrying] = useState(false),
    [retryError, setRetryError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [systems, setSystems] = useState(
      initialRegion === 'whole-body' ? initialSystems : allBodySystems,
    );
  const [side, setSide] = useState('both'),
    [isolated, setIsolated] = useState(false),
    [focus, setFocus] = useState(false);
  const [explode, setExplode] = useState(0),
    [labels, setLabels] = useState(true);
  const [layout, setLayout] = useState<BodyLayout>('spatial');
  const [anchorSkeleton, setAnchorSkeleton] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false);
  const [inspection, setInspection] = useState(initialInspection);
  const [plate, setPlate] = useState(false);
  const cameraCapture = useRef<StudyCamera | null>(null);
  const cameraRestore = useRef<StudyCamera | null>(null);
  const [view, setView] = useState<DissectionView>(profile.stages[0].view),
    [zoom, setZoom] = useState(1),
    [reset, setReset] = useState(0);
  const [loaded, setLoaded] = useState<string[]>([]),
    [failed, setFailed] = useState<string[]>([]);
  const [practice, practiceDispatch] = useReducer(
    practiceReducer,
    initialPractice,
  );
  const practiceSerial = useRef(0);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('find');
  const [practiceSampling, setPracticeSampling] =
    useState<PracticeSampling>('landmarks');
  const exam = practice.status === 'active';
  const examTargets = practice.questions.map((q) => q.target);
  const question = practice.index;
  const response = practice.responses[question];
  const answered = !!response;
  const answer = response?.chosen;
  const score = practiceScore(practice);
  const practiceResult =
    practice.status === 'complete' ? practice.responses : null;
  const [practiceCount, setPracticeCount] = useState(5);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setError(true);
      controller.abort();
    }, 30000);
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
        bodyLinkEntries(value); // Validate reference transforms before committing loaded data.
        if (active) {
          if (!appliedStudyLink.current) {
            const result = resolveStudyLink(value, initialRegion, studyLink);
            // Commit the linked selection with the loaded catalogue, before
            // mounting the scene. Never emit an imaging event from URL input.
            if (result.status === 'ready') {
              setSide(result.side);
              setSelectedId(result.selected.id);
              setSystems(allBodySystems);
              dispatch(
                result.focusId
                  ? { type: 'focus', id: result.focusId }
                  : { type: 'stage', id: 'assembled' },
              );
              setView(result.view);
              setSelectionNotice({
                id: result.selected.id,
                message: `Linked ${result.focusTitle ?? 'assembled anatomy'} view opened. ${result.selected.name} selected.`,
              });
            } else if (result.status === 'rejected') {
              setLinkIssue(
                result.reason === 'source-changed'
                  ? 'This study link refers to a different source model. No structure was selected. Choose a structure from the current atlas to create a new link.'
                  : 'This study link is incomplete or does not match the available region, side or focused view. No structure was substituted; the standard regional view is open.',
              );
            }
            appliedStudyLink.current = true;
            setLinkedStudyReady(true);
          }
          setCatalog(value);
        }
      })
      .catch((e) => {
        if (active && e.name !== 'AbortError') setError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [catalogAttempt, initialRegion, studyLink]);
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
  const focusedStudy = profile.focuses.find((s) => s.id === dissection.focusId);
  const stageLandmarks = useMemo(
    () =>
      [
        ...new Set(
          (focusedStudy?.landmarks ?? stage?.landmarks ?? []).flatMap(
            (pattern) =>
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
    [stage, focusedStudy, resolved, systems],
  );
  const selected = catalog?.structures.find((s) => s.id === selectedId) ?? null;
  const relatedViews = useMemo(
    () =>
      exam ? [] : relatedStudyViews(regionStructures, profile, selectedId),
    [exam, regionStructures, profile, selectedId],
  );
  const available = regionStructures.filter(
    (s) => systems[s.system] && !hiddenIds.includes(s.id),
  );
  const enabledIds = new Set(available.map((item) => item.id));
  function structureDetail(item: BodyStructure) {
    if (hiddenIds.includes(item.id)) return 'Removed · select to restore';
    if (!systems[item.system]) return 'System off · select to enable';
    if (failed.includes(item.bundle))
      return 'Model unavailable · retry required';
    if (!loaded.includes(item.bundle)) return 'Model loading';
    return 'Enabled in dissection';
  }
  const focusTargetIds = focusedStudy
    ? available
        .filter((s) => matchesRule(s, focusedStudy.rule))
        .map((s) => s.id)
    : [];
  const practiceEligible = practicePool(
    available,
    loaded,
    practiceSampling === 'focus' ? focusTargetIds : undefined,
  );
  const practiceReady =
    practiceEligible.length >= (practiceMode === 'name' ? 2 : 1);
  const retryIds = missedPracticeIds(practiceResult ?? []).filter((id) =>
    practiceEligible.some((s) => s.id === id),
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
  async function retryAnatomy() {
    if (!catalog || retrying) return;
    const plan = anatomyRetryPlan(catalog.bundles, failed, required);
    if (!plan.length) return;
    setRetrying(true);
    setRetryError('');
    try {
      const { retryBodyAssets } = await import('./body-scene');
      retryBodyAssets(plan.map((b) => b.url));
      const ids = new Set(plan.map((b) => b.id));
      setFailed((old) => old.filter((id) => !ids.has(id)));
      setLoaded((old) => old.filter((id) => !ids.has(id)));
      setRetries((old) => {
        const next = { ...old };
        for (const id of ids) next[id] = (next[id] ?? 0) + 1;
        return next;
      });
    } catch {
      setRetryError(
        'The retry could not start. Your view is unchanged; try again when the connection returns.',
      );
    } finally {
      setRetrying(false);
    }
  }
  const applySelection = useCallback(
    (id: string) => {
      const s = regionStructures.find((item) => item.id === id);
      if (exam || !s) return;
      setSelectedId(id);
      setSelectionNotice({
        id,
        message: `${s.name} selected.${hiddenIds.includes(id) ? ' Restored to the dissection.' : ''}${!systems[s.system] ? ` ${bodySystems[s.system].name} enabled.` : ''}`,
      });
      setSystems((prev) =>
        prev[s.system] ? prev : { ...prev, [s.system]: true },
      );
      if (hiddenIds.includes(id)) dispatch({ type: 'restore', id });
    },
    [regionStructures, hiddenIds, systems, exam],
  );
  const linkEntries = useMemo(
    () => (catalog ? bodyLinkEntries(catalog) : []),
    [catalog],
  );
  const imagingLink = useImagingLink({
    entries: linkEntries,
    allowedIds: regionStructures.map((s) => s.id),
    disabled: exam,
    onSelect: (id) => {
      applySelection(id);
      setInspection(initialInspection);
    },
  });
  const publishSelection = imagingLink.publish;
  const select = useCallback(
    (id: string) => {
      if (exam || !regionStructures.some((item) => item.id === id)) return;
      applySelection(id);
      publishSelection(id);
    },
    [applySelection, publishSelection, exam, regionStructures],
  );
  function changeStage(id: string) {
    if (
      exam ||
      (id !== 'free' && !profile.stages.some((item) => item.id === id))
    )
      return;
    setInspection(initialInspection);
    if (layout === 'tray') setPlate(false);
    setLayout('spatial');
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
    if (exam || !profile.focuses.some((item) => item.id === id)) return;
    setInspection(initialInspection);
    if (layout === 'tray') setPlate(false);
    setLayout('spatial');
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
  function openRelatedStudy(id: string) {
    const next = relatedViews.find((item) => item.focusId === id);
    if (exam || !selectedId || !next?.visibleIds.includes(selectedId)) return;
    changeFocus(id);
    setSelectedId(selectedId);
    setSelectionNotice({
      id: selectedId,
      message: `${next.title} opened. ${selected?.name} remains selected.`,
    });
    publishSelection(selectedId);
  }
  function undoDissection() {
    dispatch({ type: 'undo' });
    setSelectedId(null);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
  }
  function restoreStructure(id: string) {
    if (exam) return;
    dispatch({ type: 'restore', id });
    const s = catalog?.structures.find((s) => s.id === id);
    if (s) setSystems((prev) => ({ ...prev, [s.system]: true }));
  }
  function restoreStructures(ids: string[]) {
    if (exam) return;
    const requested = new Set(ids);
    const allowed = resolved.removed.filter((item) => requested.has(item.id));
    if (!allowed.length) return;
    dispatch({ type: 'restore-many', ids: allowed.map((item) => item.id) });
    setSystems((prev) => {
      const next = { ...prev };
      for (const item of allowed) next[item.system] = true;
      return next;
    });
  }
  function onSceneSelect(id: string) {
    if (exam) {
      if (practice.mode === 'find') submitPractice(id);
    } else select(id);
  }
  function submitPractice(chosen: string | null) {
    practiceDispatch({
      type: 'answer',
      sessionId: practice.id,
      index: question,
      chosen,
    });
  }
  function preset(id: string) {
    const next = bodyPresetSystems(id);
    if (exam || !next) return;
    setInspection(initialInspection);
    dispatch({ type: 'free' });
    setSystems(next);
    setSelectedId(null);
    setIsolated(false);
    setFocus(false);
    setZoom(1);
    setReset((n) => n + 1);
  }
  function changeLayout(next: BodyLayout) {
    if (exam) return;
    setLayout(next);
    setPlate(next === 'tray');
    setExplode(next === 'tray' ? 100 : 0);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
    setReset((n) => n + 1);
  }
  function startExam(retry = false) {
    const session = createPracticeSession(available, loaded, {
      id: ++practiceSerial.current,
      mode: practiceMode,
      count: retry ? retryIds.length : practiceCount,
      sampling: practiceSampling,
      focusIds: focusTargetIds,
      retryIds: retry ? retryIds : undefined,
    });
    if (!session) return;
    if (layout === 'tray') setPlate(false);
    setLayout('spatial');
    practiceDispatch({ type: 'start', session });
    setSelectedId(null);
    setIsolated(false);
    setFocus(false);
    setExplode(0);
    setZoom(1);
    setReset((n) => n + 1);
  }
  function nextQuestion() {
    practiceDispatch({ type: 'next', sessionId: practice.id, index: question });
    if (practice.mode === 'name') {
      setZoom(1);
      setReset((n) => n + 1);
    }
  }
  function resetView() {
    setLayout('spatial');
    setInspection(initialInspection);
    setPlate(false);
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
        <p>The anatomy catalogue is unavailable or the connection timed out.</p>
        <Button
          onClick={() => {
            setError(false);
            setCatalogAttempt((n) => n + 1);
          }}
        >
          Retry anatomy library
        </Button>
        <Link href="/shoulder">Open the shoulder explorer</Link>
      </main>
    );
  if (!catalog || !linkedStudyReady)
    return (
      <main className="body-status">
        <Brand surface="light" />
        <p>
          {catalog
            ? 'Preparing the linked dissection…'
            : 'Loading the body-region library…'}
        </p>
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
  // Exact bundle hashes, not a clinical approval. A changed source invalidates display bookmarks.
  const studyRevision = `${catalog.sourceVersion}/${catalog.bundles
    .map((b) => `${b.id}:${b.sha256}`)
    .sort()
    .join('|')}`;
  const studyScope = {
    kind: 'body' as const,
    region: initialRegion,
    revision: studyRevision,
    structureIds: catalog.structures
      .filter((s) => whole || s.regions.includes(initialRegion))
      .map((s) => s.id),
  };
  function captureView(): StudyView {
    return {
      kind: 'body',
      region: initialRegion,
      revision: studyRevision,
      selectedId,
      view,
      side: side as StudyView['side'],
      layer: 'cuff',
      systems,
      hiddenIds,
      explode,
      layout,
      zoom,
      isolated,
      focus,
      labels,
      ghostRemoved,
      illustrated,
      anchorSkeleton,
      showOrigins,
      plate,
      inspection,
      camera: cameraCapture.current,
    };
  }
  function restoreView(state: StudyView) {
    practiceDispatch({ type: 'dismiss' });
    setSide(state.side);
    setSelectedId(state.selectedId);
    setView(state.view as DissectionView);
    setSystems(state.systems as Record<BodySystem, boolean>);
    dispatch({ type: 'load-view', hiddenIds: state.hiddenIds });
    setExplode(state.explode);
    setLayout(state.layout ?? 'spatial');
    setZoom(state.zoom);
    setIsolated(state.isolated);
    setFocus(state.focus);
    setLabels(state.labels);
    setGhostRemoved(state.ghostRemoved);
    setIllustrated(state.illustrated);
    setAnchorSkeleton(state.anchorSkeleton);
    setShowOrigins(state.showOrigins);
    setPlate(state.plate);
    setInspection(state.inspection);
    cameraRestore.current = state.camera;
    setReset((n) => n + 1);
  }
  const target = catalog.structures.find((s) => s.id === examTargets[question]);
  const studyGuide = (
    <DissectionGuide
      profile={profile}
      stage={stage}
      focus={focusedStudy}
      removed={resolved.removed}
      visible={available}
      onRestore={restoreStructure}
      onRestoreMany={restoreStructures}
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
        <div className="vm-practice-start">
          <Select
            value={String(practiceCount)}
            onValueChange={(value) => value && setPracticeCount(Number(value))}
          >
            <SelectTrigger disabled={exam} aria-label="Practice session length">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} questions
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() =>
              exam ? practiceDispatch({ type: 'exit' }) : startExam()
            }
            disabled={!exam && (pending.length > 0 || !practiceReady)}
          >
            <GraduationCap />
            {exam ? 'Exit practice' : 'Start practice'}
          </Button>
        </div>
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
          <div className="body-system-presets" aria-label="Quick anatomy views">
            {bodySystemPresets.map((item) => {
              const count = regionStructures.filter((structure) =>
                item.systems.includes(structure.system),
              ).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={exam || count === 0}
                  aria-pressed={
                    !hiddenIds.length && bodyPresetMatches(item.id, systems)
                  }
                  title={`Restore ${count} available source entries in this preset`}
                  onClick={() => preset(item.id)}
                >
                  {item.title}
                  <small>{count}</small>
                </button>
              );
            })}
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
          <details className="body-study-tools" open={!whole}>
            <summary>Dissection, inspection & study tools</summary>
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
              structures={regionStructures}
              visibleIds={available.map((item) => item.id)}
              loaded={loaded}
              failed={failed}
              disabled={exam}
            />
            <InspectionControls
              value={inspection}
              onChange={setInspection}
              systems={systemKeys.map((id) => ({
                id,
                name: bodySystems[id].name,
                enabled:
                  systems[id] && regionStructures.some((s) => s.system === id),
              }))}
              plate={plate}
              onPlate={(value) => {
                if (!value && layout === 'tray') changeLayout('spatial');
                else setPlate(value);
              }}
              disabled={exam}
            />
            <StudyViews
              scope={studyScope}
              capture={captureView}
              restore={restoreView}
              disabled={exam || pending.length > 0}
            />
            <ImagingLink link={imagingLink} />
          </details>
          <div className="body-layout-controls" aria-label="Model arrangement">
            <div>
              <button
                type="button"
                aria-pressed={layout === 'spatial'}
                disabled={exam}
                onClick={() => changeLayout('spatial')}
              >
                Spatial anatomy
              </button>
              <button
                type="button"
                aria-pressed={layout === 'tray'}
                disabled={exam || !available.length}
                onClick={() => changeLayout('tray')}
              >
                Arrange structures
              </button>
            </div>
            <p>
              {layout === 'tray' && !exam
                ? 'Same-scale surfaces, grouped by system. At 100%, each catalogue entry has its own space—not an anatomical position.'
                : 'Source anatomy at 0% separation. Rotate freely or choose a standard direction.'}
            </p>
          </div>
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
                    setInspection(initialInspection);
                    practiceDispatch({ type: 'dismiss' });
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
                  ? regionStructures.filter((s) =>
                      practiceRenderIds(practice).includes(s.id),
                    )
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
              layout={exam ? 'spatial' : layout}
              anchorSkeleton={anchorSkeleton}
              showOrigins={showOrigins && !exam}
              labels={labels && !exam}
              view={view}
              zoom={zoom}
              reset={reset}
              focus={focus}
              exam={exam}
              inspection={exam ? initialInspection : inspection}
              plate={plate && !exam}
              cameraCapture={cameraCapture}
              cameraRestore={cameraRestore}
              retries={retries}
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
                <p>
                  Some anatomy could not load. Your dissection settings are
                  retained.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retrying}
                  onClick={() => void retryAnatomy()}
                >
                  {retrying ? 'Retrying…' : 'Retry missing anatomy'}
                </Button>
                {retryError && <p role="alert">{retryError}</p>}
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
                <strong>
                  {practice.mode === 'name'
                    ? 'Name the isolated structure'
                    : `Find ${target?.name.toLowerCase()}`}
                </strong>
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
                <span>
                  {layout === 'tray' && !exam ? 'Arrange' : 'Explode'}
                </span>
                <Slider
                  value={[explode]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={exam}
                  onValueChange={(v) => setExplode(Array.isArray(v) ? v[0] : v)}
                  aria-label={
                    layout === 'tray'
                      ? 'Arranged separation'
                      : 'Exploded separation'
                  }
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
              {layout === 'tray' && !exam
                ? explode === 100
                  ? 'Arranged view · Pan / pinch to zoom · Choose a direction · Not anatomical positions'
                  : `Arrangement in progress · ${explode}% · Overlap is possible before 100%`
                : explode > 0
                  ? 'Exploded teaching view · Positions are not anatomical'
                  : !exam && inspection.plane !== 'off'
                    ? `${inspection.plane} surface cutaway · ${inspection.position}% · Not CT/MRI`
                    : plate && !exam
                      ? 'Orthographic illustration · Choose a direction · Use + / − to zoom'
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
                segments; red = artery, blue = vein, grey = unclassified vessel,
                not oxygenation. Connective coverage includes selected discs,
                cartilage, ligaments, interosseous membranes and Achilles
                tendons; it is incomplete.
              </span>
            </div>
          )}
          {!exam && (
            <div className="body-preset-row">
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
                disabled={layout === 'tray'}
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
              {layout === 'tray' && (
                <span>
                  All entries move in the tray. Select and frame a structure, or
                  choose a system/region for fine detail.
                </span>
              )}
            </div>
          )}
        </section>
        <aside className="body-info" aria-label="Anatomy study panel">
          {!exam && linkIssue && (
            <div className="body-study-link-issue">
              <output aria-live="polite">{linkIssue}</output>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinkIssue(null)}
              >
                Dismiss link notice
              </Button>
            </div>
          )}
          {exam ? (
            <>
              <output className="sr-only" aria-live="polite" aria-atomic="true">
                {`Question ${question + 1} of ${examTargets.length}. ${
                  answered
                    ? `${answer === target?.id ? 'Correct.' : answer === null ? 'Skipped.' : 'Not quite.'} ${target?.name ?? ''}.`
                    : practice.mode === 'name'
                      ? 'Name the isolated structure.'
                      : `Find ${target?.name ?? 'the requested structure'}.`
                }`}
              </output>
              <div className="eyebrow">IDENTIFICATION PRACTICE</div>
              <h2>
                {question + 1} / {examTargets.length}
              </h2>
              <p>
                {practice.mode === 'name'
                  ? 'Rotate the isolated structure and choose its name. You can use the keyboard to move between answer buttons.'
                  : 'Find the named structure on the model. Labels and selection hints are hidden.'}
              </p>
              {answered ? (
                <div
                  className={`body-answer ${answer === target?.id ? 'correct' : ''}`}
                >
                  <Check />
                  <strong>
                    {answer === target?.id
                      ? 'Correct'
                      : answer === null
                        ? 'Skipped'
                        : 'Not quite'}
                  </strong>
                  <p>
                    {answer === null
                      ? 'No answer recorded.'
                      : `You selected ${catalog.structures.find((s) => s.id === answer)?.name}.`}
                  </p>
                  {answer !== target?.id && (
                    <p>
                      Correct answer: <strong>{target?.name}</strong>.
                    </p>
                  )}
                  <Button onClick={nextQuestion}>
                    {question + 1 === examTargets.length
                      ? 'Finish practice'
                      : 'Next structure'}
                    <ChevronRight />
                  </Button>
                </div>
              ) : (
                <>
                  {practice.mode === 'name' ? (
                    <fieldset className="vm-practice-choices">
                      <legend>Choose the anatomical name</legend>
                      {practice.questions[question].choices.map((id) => (
                        <Button
                          key={`${practice.id}-${question}-${id}`}
                          variant="outline"
                          onClick={() => submitPractice(id)}
                        >
                          {catalog.structures.find((s) => s.id === id)?.name}
                        </Button>
                      ))}
                    </fieldset>
                  ) : (
                    <div className="body-practice-wait">
                      <Focus />
                      <span>
                        Rotate and inspect the model, then select your answer.
                      </span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => submitPractice(null)}
                  >
                    Skip & reveal
                  </Button>
                </>
              )}
              <div className="body-practice-score">
                Score{' '}
                <strong>
                  {score} / {practice.responses.length}
                </strong>
              </div>
              <small>
                Formative practice only. Targets are chosen from currently
                loaded, visible structures; overlap may require rotation.
              </small>
            </>
          ) : (
            <>
              {practiceResult && (
                <section
                  className="vm-practice-result"
                  aria-label="Completed practice results"
                >
                  <h2>
                    {practiceResult.length === practice.questions.length
                      ? 'Practice complete'
                      : 'Practice ended'}
                  </h2>
                  <p>
                    {practiceResult.filter((r) => r.target === r.chosen).length}{' '}
                    / {practiceResult.length} correct. Select a structure below
                    to study it.
                  </p>
                  <ul>
                    {practiceResult.map((r) => (
                      <li key={r.target}>
                        <button
                          type="button"
                          onClick={() => {
                            select(r.target);
                            setInspection(initialInspection);
                            setFocus(true);
                            setZoom(1);
                          }}
                        >
                          {r.target === r.chosen ? '✓' : 'Review'} ·{' '}
                          {
                            catalog.structures.find((s) => s.id === r.target)
                              ?.name
                          }
                        </button>
                      </li>
                    ))}
                  </ul>
                  {missedPracticeIds(practiceResult).length > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startExam(true)}
                        disabled={
                          !practiceReady ||
                          retryIds.length === 0 ||
                          pending.length > 0
                        }
                      >
                        Retry missed ({retryIds.length} available)
                      </Button>
                      <p className="vm-practice-note">
                        Retries respect the current visible, loaded scope and
                        practice options. Skipped questions count as missed.
                      </p>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => practiceDispatch({ type: 'dismiss' })}
                  >
                    Dismiss results
                  </Button>
                </section>
              )}
              <details className="vm-practice-options">
                <summary>
                  Practice options ·{' '}
                  {practiceMode === 'name'
                    ? 'Name isolated anatomy'
                    : 'Find on model'}
                </summary>
                <label htmlFor="practice-answer-mode">Answer mode</label>
                <Select
                  value={practiceMode}
                  onValueChange={(value) => {
                    if (value === 'find' || value === 'name')
                      setPracticeMode(value);
                  }}
                >
                  <SelectTrigger
                    id="practice-answer-mode"
                    aria-label="Practice answer mode"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="find">Find on model</SelectItem>
                    <SelectItem value="name">
                      Name isolated structure
                    </SelectItem>
                  </SelectContent>
                </Select>
                <label htmlFor="practice-target-selection">
                  Target selection
                </label>
                <Select
                  value={practiceSampling}
                  onValueChange={(value) => {
                    if (
                      value === 'landmarks' ||
                      value === 'all' ||
                      value === 'focus'
                    )
                      setPracticeSampling(value);
                  }}
                >
                  <SelectTrigger
                    id="practice-target-selection"
                    aria-label="Practice target selection"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landmarks">Major landmarks</SelectItem>
                    <SelectItem value="all">All visible anatomy</SelectItem>
                    <SelectItem value="focus" disabled={!focusedStudy}>
                      Current focus targets only
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="vm-practice-note">
                  {practiceEligible.length} loaded candidates.{' '}
                  {practiceSampling === 'landmarks'
                    ? 'Emphasises larger surfaces.'
                    : practiceSampling === 'focus'
                      ? 'Uses the selected focus targets, excluding its added context. Choose a focus in Guided dissection first.'
                      : 'Includes small structures without the landmark size cutoff.'}{' '}
                  {practiceMode === 'name' &&
                    'Naming needs at least two distinct candidates; there may be fewer than four answer choices.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => startExam()}
                  disabled={!practiceReady || pending.length > 0}
                >
                  Start {Math.min(practiceCount, practiceEligible.length)}{' '}
                  questions
                </Button>
              </details>
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
              <output
                className="body-selection-notice"
                aria-live="polite"
                aria-atomic="true"
              >
                {selected
                  ? `${selectionNotice?.id === selected.id ? selectionNotice.message : `${selected.name} selected.`} ${structureDetail(selected)}. Cutaway and opacity can affect visibility; use Reveal uncut if needed.`
                  : 'No structure selected.'}
              </output>
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
                        setInspection((current) => ({
                          ...current,
                          plane: 'off',
                          opacity: {
                            ...current.opacity,
                            [selected.system]: 100,
                          },
                        }));
                        setFocus(true);
                        setZoom(1);
                      }}
                    >
                      Reveal uncut
                    </Button>
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
                  <RelatedStudy
                    views={relatedViews}
                    selectedId={selected.id}
                    currentFocusId={dissection.focusId}
                    onOpen={openRelatedStudy}
                    onSelect={select}
                    detail={structureDetail}
                  />
                  <StudyLinks
                    catalog={catalog}
                    selected={selected}
                    region={initialRegion}
                    side={side as StudySide}
                    focusId={dissection.focusId}
                  />
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
                              onClick={() => startExam()}
                              disabled={!practiceReady || pending.length > 0}
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
                <StructureNavigator
                  key={`${initialRegion}-${side}`}
                  items={regionStructures}
                  selectedId={selectedId}
                  onSelect={select}
                  label="Regional structures"
                  detail={structureDetail}
                  enabledIds={enabledIds}
                />
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
