'use client';
import { femoralComponentsFor } from '@/lib/femoral-components';
import { cranialArteryComponentsFor } from '@/lib/cranial-artery-components';
import './um-knee-entry.css';
import './upper-limb-motor.css';
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
import { ExplodeStyleSelect } from './explode-style-select';
import { RegionHeading } from './region-heading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  AtlasWorkspace,
  WorkspaceModes,
  WorkspaceOnly,
  WorkspaceModeButton,
  WorkspaceFocus,
  CameraViewMenu,
  GroupedAnatomyNotes,
  AtlasSearch,
  StructureDetailsButton,
  PracticeAttention,
  QuizNotes,
} from './atlas-workspace';
import {
  bodySystems,
  allBodySystems,
  type BodyCatalog,
  type BodyStructure,
  type BodySystem,
} from './body-types';
import { bodyContent } from './body-content';
import { ComponentImagingNotes } from './component-imaging-notes';
import { resolveComponentImagingTarget } from '@/lib/component-imaging-navigation';
import type { NestedImagingTopic } from '@/content/nested-teaching';
import { bodyLinkEntries } from '@/lib/anatomy-link-registry';
import { ImagingLink, useImagingLink } from './imaging-link';
import { ImagingComparisonWorkspace } from './imaging-comparison';
import {
  dissectionProfiles,
  dissectionReducer,
  initialDissection,
  resolveDissection,
  matchesRule,
  type DissectionView,
} from './dissection-data';
import { DissectionControls, DissectionGuide } from './dissection-controls';
import {
  dissectionGuidance,
  dissectionLandmarks,
  guidanceRecipeAction,
} from '@/lib/dissection-guidance';
import './body-explorer.css';
import './atlas-workspace.css';
import './vessel-system-control.css';
import { VesselSystemControl } from './vessel-system-control';
import { vesselVisibilityAction } from '@/lib/vessel-visibility';
import type { VesselKind } from '@/lib/anatomy-vessels';
import { AnatomyControlRail, AnatomyInfoPanel } from './anatomy-control-rail';
import { Brand } from './brand';
import { ReviewStatus } from './review-status';
import { InspectionControls } from './inspection-controls';
import { initialInspection } from '@/lib/inspection-state';
import { initialBodySide } from '@/lib/hand-framing';
import { regionalFramingBounds, regionalFramingRegion } from '@/lib/regional-framing';
import {
  selectionBounds,
  selectionVisibility,
  recoverSelectionInspection,
} from '@/lib/selection-visibility';
import { SelectionVisibilityNotice } from './selection-visibility-notice';
import {
  createPracticeSession,
  practiceReducer,
  initialPractice,
  practiceScore,
  practicePool,
  practiceRenderIds,
  practiceQuestionCount,
  missedPracticeIds,
  type PracticeMode,
  type PracticeSampling,
} from '@/lib/atlas-practice';
import { ReasoningFeedback } from './reasoning-feedback';
import { StudyViews } from './study-views';
import { StructureNavigator } from './structure-navigator';
import { RelatedStudy } from './related-study';
import { UpperLimbMotorExplorer } from './upper-limb-motor';
import { ArterialConnections } from './arterial-connections';
import { BoneJoints } from './bone-joints';
import { boneJointPlan } from '@/lib/bone-joints';
import { ArmAttachments } from './arm-attachments';
import { armAttachmentPlan } from '@/lib/arm-attachments';
import { thighAttachmentPlan } from '@/lib/thigh-attachments';
import { arterialPlan } from '../lib/arterial';
import { VenousDrainage } from './venous-drainage';
import { venousDrainagePlan } from '../lib/venous-drainage';
import { limbMotorPlan } from '@/lib/limb-motor';
import { StudyLinks } from './study-links';
import {
  noStudyLink,
  resolveStudyLink,
  type ParsedStudyLink,
  type StudySide,
} from '@/lib/study-links';
import { relatedStudyViews } from '@/lib/study-navigation';
import type { StudyCamera, StudyView } from '@/lib/study-views';
import { kneeStudyBounds } from '@/lib/knee-studies';
import { genicularStudyBounds } from '@/lib/genicular-study';
import { elbowStudyBounds } from '@/lib/elbow-studies';
import { limbVascularStudyReady } from '@/lib/limb-vascular-studies';
import { longusColliStudyReady } from '@/lib/longus-colli';
import { anatomyRetryPlan } from '@/lib/anatomy-load-retry';
import {
  copyRecoveryCamera,
  rendererReady,
  type RendererHealth,
} from '@/lib/renderer-health';
import { eyeLayersFor } from '@/lib/eye-layers';
import { ventriclesFor } from '@/lib/ventricles';
import { cardiacFor } from '@/lib/cardiac';
import { pulmonaryFor } from '@/lib/pulmonary';
import { hepaticFor } from '@/lib/hepatic';
import { renalFor } from '@/lib/renal';
import { pancreaticFor } from '@/lib/pancreatic';
import { cricothyroidFor } from '@/lib/cricothyroid';
import { bodyDisplayCatalog } from '@/lib/body-display-catalog';
import { modelDeliveryUrl } from '@/lib/model-delivery';
import {
  resolveNestedTarget,
  type NestedSelection,
  type NestedRequest,
} from '@/lib/nested-anatomy';
import {
  anatomyLoadReducer,
  initialAnatomyLoads,
  anatomyLoadSummary,
  requestedAnatomyBundles,
} from '@/lib/anatomy-load-state';
import type { BodyLayout } from '@/lib/body-arrangement';
import {
  bodySystemPresets,
  bodyPresetSystems,
  bodyPresetMatches,
} from '@/lib/body-system-presets';

const Scene = dynamic(() => import('./body-scene').then((m) => m.BodyScene), {
  ssr: false,
});
const EyeLayers = dynamic(() => import('./eye-layers'), { ssr: false });
const Ventricles = dynamic(() => import('./ventricles'), { ssr: false });
const KneeSpecimen = dynamic(() => import('./um-limb-study'), { ssr: false });
const AbdominalWallSpecimen = dynamic(() => import('./abdominal-wall-study'), {
  ssr: false,
});
const HraPelvisSpecimen = dynamic(() => import('./hra-pelvis-study'), {
  ssr: false,
});
const HraRenalSpecimen = dynamic(() => import('./hra-renal-study'), {
  ssr: false,
});
const BackLayersSpecimen = dynamic(() => import('./back-layers-study'), {
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
  assetBase = '',
  presentation = 'standalone',
}: {
  initialRegion: string;
  studyLink?: ParsedStudyLink;
  assetBase?: string;
  presentation?: 'standalone' | 'panel';
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
  const [rendererHealth, setRendererHealth] =
    useState<RendererHealth>('starting');
  const displayReady = rendererReady(rendererHealth);
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
  const [side, setSide] = useState<string>(() => initialBodySide(initialRegion)),
    [isolated, setIsolated] = useState(false),
    [focus, setFocus] = useState(false);
  const [regionalFraming, setRegionalFraming] = useState(true);
  const [explode, setExplode] = useState(0),
    [labels, setLabels] = useState(true);
  const [layout, setLayout] = useState<BodyLayout>('spatial');
  const [anchorSkeleton, setAnchorSkeleton] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false);
  const [inspection, setInspection] = useState(initialInspection);
  const [plate, setPlate] = useState(false);
  const cameraCapture = useRef<StudyCamera | null>(null);
  const cameraRestore = useRef<StudyCamera | null>(null);
  const [nestedSelection, setNestedSelection] = useState<
    (NestedSelection & { teachingTopic?: NestedImagingTopic }) | null
  >(null);
  const nestedReturnFocus = useRef<HTMLButtonElement | null>(null);
  const [eyeParent, setEyeParent] = useState<BodyStructure | null>(null);
  const [kneeSpecimenOpen, setKneeSpecimenOpen] = useState(false);
  const [abdominalWallOpen, setAbdominalWallOpen] = useState(false);
  const [backLayersOpen, setBackLayersOpen] = useState(false);
  const backLayersLauncher = useRef<HTMLButtonElement | null>(null);
  const closeBackLayers = useCallback(() => {
    setBackLayersOpen(false);
    requestAnimationFrame(() => backLayersLauncher.current?.focus());
  }, []);
  const [hraPelvisOpen, setHraPelvisOpen] = useState(false);
  const [hraRenalOpen, setHraRenalOpen] = useState(false);
  const hraRenalLauncher = useRef<HTMLButtonElement | null>(null);
  const closeHraRenal = useCallback(() => {
    setHraRenalOpen(false);
    requestAnimationFrame(() => hraRenalLauncher.current?.focus());
  }, []);
  const hraPelvisLauncher = useRef<HTMLButtonElement | null>(null);
  const closeHraPelvis = useCallback(() => {
    setHraPelvisOpen(false);
    requestAnimationFrame(() => hraPelvisLauncher.current?.focus());
  }, []);
  const abdominalWallLauncher = useRef<HTMLButtonElement | null>(null);
  const closeAbdominalWall = useCallback(() => {
    setAbdominalWallOpen(false);
    requestAnimationFrame(() => abdominalWallLauncher.current?.focus());
  }, []);
  const kneeSpecimenLauncher = useRef<HTMLButtonElement | null>(null);
  const closeKneeSpecimen = useCallback(() => {
    setKneeSpecimenOpen(false);
    requestAnimationFrame(() => kneeSpecimenLauncher.current?.focus());
  }, []);
  const eyeLauncher = useRef<HTMLButtonElement | null>(null);
  const closeEyeLayers = useCallback(() => {
    setEyeParent(null);
    setNestedSelection(null);
    const returnTo = nestedReturnFocus.current;
    nestedReturnFocus.current = null;
    requestAnimationFrame(() => (returnTo ?? eyeLauncher.current)?.focus());
  }, []);
  const [ventricleParent, setVentricleParent] = useState<BodyStructure | null>(
    null,
  );
  const ventricleLauncher = useRef<HTMLButtonElement | null>(null);
  const closeVentricles = useCallback(() => {
    setVentricleParent(null);
    setNestedSelection(null);
    const returnTo = nestedReturnFocus.current;
    nestedReturnFocus.current = null;
    requestAnimationFrame(() =>
      (returnTo ?? ventricleLauncher.current)?.focus(),
    );
  }, []);
  const [view, setView] = useState<DissectionView>(profile.stages[0].view),
    [zoom, setZoom] = useState(1),
    [zoomStep, setZoomStep] = useState(0),
    [reset, setReset] = useState(0);
  const [{ loaded, failed }, loadDispatch] = useReducer(
    anatomyLoadReducer,
    initialAnatomyLoads,
  );
  const [practice, practiceDispatch] = useReducer(
    practiceReducer,
    initialPractice,
  );
  const practiceSerial = useRef(0);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('find');
  const [practiceSampling, setPracticeSampling] =
    useState<PracticeSampling>('landmarks');
  const exam = practice.status === 'active';
  useEffect(() => {
    if (eyeParent && (exam || eyeParent.id !== selectedId)) closeEyeLayers();
  }, [exam, selectedId, eyeParent, closeEyeLayers]);
  useEffect(() => {
    if (ventricleParent && (exam || ventricleParent.id !== selectedId))
      closeVentricles();
  }, [exam, selectedId, ventricleParent, closeVentricles]);
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
    fetch(modelDeliveryUrl('/models/bodyparts3d/full-body/catalog.json', assetBase), {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error('Catalog unavailable');
        return r.json();
      })
      .then((data) => {
        const value = bodyDisplayCatalog(data as BodyCatalog);
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
              if (result.nested) {
                setNestedSelection(result.nested);
                if (result.nested.study === 'eye')
                  setEyeParent(result.selected);
                else setVentricleParent(result.selected);
              }
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
  }, [catalogAttempt, initialRegion, studyLink, assetBase]);
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
      dissectionLandmarks(
        resolved.visible.filter((s) => systems[s.system]),
        focusedStudy?.landmarks ?? stage?.landmarks ?? [],
      ).map((s) => s.id),
    [stage, focusedStudy, resolved, systems],
  );
  const selected = catalog?.structures.find((s) => s.id === selectedId) ?? null;
  const selectionFrame = useMemo(
    () => selectionBounds(regionStructures),
    [regionStructures],
  );
  const selectedVisibility =
    !exam && selected && regionStructures.some((s) => s.id === selected.id)
      ? selectionVisibility({
          system: selected.system,
          enabled: systems[selected.system],
          removed: hiddenIds.includes(selected.id),
          bounds: selected.bounds,
          frame: selectionFrame,
          inspection,
        })
      : null;
  function revealSelection() {
    if (exam || !selected || !selectedVisibility) return;
    if (selectedVisibility.removed)
      dispatch({ type: 'restore', id: selected.id });
    if (selectedVisibility.systemOff)
      setSystems((current) => ({ ...current, [selected.system]: true }));
    setInspection((current) =>
      recoverSelectionInspection(current, selectedVisibility),
    );
  }
  const relatedViews = useMemo(
    () =>
      exam ? [] : relatedStudyViews(regionStructures, profile, selectedId),
    [exam, regionStructures, profile, selectedId],
  );
  // Keep membership stable during camera, separation and presentation changes.
  // Loading, visibility and practice transitions still recompute their own data.
  const available = useMemo(
    () => regionStructures.filter(
      (s) => systems[s.system] && !hiddenIds.includes(s.id),
    ),
    [regionStructures, systems, hiddenIds],
  );
  const enabledIds = useMemo(() => new Set(available.map((item) => item.id)), [available]);
  const framingRegion = regionalFramingRegion(initialRegion, side);
  const regionalCloseUp = useMemo(() => regionalFramingBounds({
    region: initialRegion,
    side,
    structures: regionStructures,
    visibleIds: available.map((s) => s.id),
    selectedId,
    enabled: regionalFraming && !exam && !focus && !isolated &&
      !ghostRemoved && !showOrigins && explode === 0 &&
      layout === 'spatial' && inspection.plane === 'off',
  }), [initialRegion, side, regionStructures, available, selectedId,
    regionalFraming, exam, focus, isolated, ghostRemoved, showOrigins,
    explode, layout, inspection.plane]);
  const jointCloseUp = useMemo(() => {
    const input = {
      region: initialRegion,
      recipeId: dissection.focusId ?? dissection.stageId,
      structures: regionStructures,
      visibleIds: available.map((s) => s.id),
      enabled:
        !exam &&
        !focus &&
        !isolated &&
        !ghostRemoved &&
        !showOrigins &&
        explode === 0 &&
        layout === 'spatial' &&
        inspection.plane === 'off',
    };
    return (
      kneeStudyBounds(input) ??
      elbowStudyBounds({ ...input, catalog }) ??
      genicularStudyBounds({ ...input, catalog })
    );
  }, [
    catalog,
    initialRegion,
    dissection.focusId,
    dissection.stageId,
    regionStructures,
    available,
    exam,
    focus,
    isolated,
    ghostRemoved,
    showOrigins,
    explode,
    layout,
    inspection.plane,
  ]);
  const guidance = useMemo(
    () => dissectionGuidance(
      regionStructures,
      profile,
      dissection,
      available.map((s) => s.id),
      hiddenIds,
      loaded,
      failed,
    ),
    [regionStructures, profile, dissection, available, hiddenIds, loaded, failed],
  );
  function structureDetail(item: BodyStructure) {
    if (hiddenIds.includes(item.id)) return 'Removed · select to restore';
    if (!systems[item.system]) return 'System off · select to enable';
    if (failed.includes(item.bundle))
      return 'Model unavailable · retry required';
    if (!loaded.includes(item.bundle)) return 'Model loading';
    return 'Enabled in dissection';
  }
  const focusTargetIds = useMemo(
    () => focusedStudy
      ? available
          .filter((s) => matchesRule(s, focusedStudy.rule))
          .map((s) => s.id)
      : [],
    [focusedStudy, available],
  );
  const practiceEligible = useMemo(
    () => practicePool(
      available,
      anatomyLoadSummary(loaded, loaded, failed).loaded,
      practiceSampling === 'focus' ? focusTargetIds : undefined,
    ),
    [available, loaded, failed, practiceSampling, focusTargetIds],
  );
  const availableQuestions = useMemo(
    () => practiceQuestionCount(practiceEligible, practiceMode),
    [practiceEligible, practiceMode],
  );
  const practiceReady = availableQuestions > 0;
  const practiceLoadStatus = useMemo(
    () => anatomyLoadSummary(available.map((s) => s.bundle), loaded, failed),
    [available, loaded, failed],
  );
  const practiceBlocked =
    practiceLoadStatus.pending.length > 0 || !practiceReady || !displayReady;
  const retryIds = useMemo(
    () => missedPracticeIds(practiceResult ?? []).filter((id) =>
      practiceEligible.some((s) => s.id === id),
    ),
    [practiceResult, practiceEligible],
  );
  const retryCount = useMemo(
    () => retryIds.length ? practiceQuestionCount(practiceEligible, practiceMode, retryIds) : 0,
    [practiceEligible, practiceMode, retryIds],
  );
  const sceneStructures = useMemo(
    () => exam
      ? regionStructures.filter((s) => practiceRenderIds(practice).includes(s.id))
      : regionStructures,
    [exam, regionStructures, practice],
  );
  const required = useMemo(
    () => requestedAnatomyBundles(sceneStructures, systems, hiddenIds, ghostRemoved && !exam),
    [sceneStructures, systems, hiddenIds, ghostRemoved, exam],
  );
  const loadStatus = useMemo(
    () => anatomyLoadSummary(required, loaded, failed),
    [required, loaded, failed],
  );
  const pending = loadStatus.pending;
  const practicePaused =
    exam &&
    (pending.length > 0 || loadStatus.failed.length > 0 || !displayReady);
  const onLoaded = useCallback(
    (id: string) => loadDispatch({ type: 'loaded', id }),
    [],
  );
  const onFailure = useCallback(
    (id: string) => loadDispatch({ type: 'failed', id }),
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
      retryBodyAssets(plan.map((b) => b.url), assetBase);
      const ids = new Set(plan.map((b) => b.id));
      loadDispatch({ type: 'retry', ids: [...ids] });
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
  const openNested = useCallback(
    (
      request: NestedRequest,
      launcher: HTMLButtonElement | null,
      teachingTopic?: NestedImagingTopic,
    ) => {
      if (
        exam ||
        !catalog ||
        !regionStructures.some((s) => s.id === request.parentId)
      )
        return;
      const target = resolveNestedTarget(
        catalog,
        request.parentId,
        request,
        side,
      );
      const parent = regionStructures.find((s) => s.id === request.parentId);
      if (!target || !parent || target.parentHash !== request.parentHash)
        return;
      if (
        teachingTopic !== undefined &&
        !resolveComponentImagingTarget(catalog, request, teachingTopic, side)
      )
        return;
      cameraRestore.current = cameraCapture.current
        ? copyRecoveryCamera(cameraCapture.current)
        : null;
      nestedReturnFocus.current = launcher;
      // Select locally, without publishing a parent as if it were the requested child.
      applySelection(parent.id);
      setNestedSelection(teachingTopic ? { ...target, teachingTopic } : target);
      if (target.study === 'eye') setEyeParent(parent);
      else setVentricleParent(parent);
    },
    [exam, catalog, regionStructures, side, applySelection],
  );
  function changeStage(id: string) {
    if (
      exam ||
      (id !== 'free' && !profile.stages.some((item) => item.id === id))
    )
      return;
    cameraRestore.current = null;
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
    if (exam || !profile.focuses.some((item) => item.id === id)) return false;
    if (!limbVascularStudyReady(catalog, initialRegion, id)) return false;
    if (!longusColliStudyReady(catalog, initialRegion, id, side)) return false;
    cameraRestore.current = null;
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
    return true;
  }
  function openRelatedStudy(id: string) {
    const next = relatedViews.find((item) => item.focusId === id);
    if (exam || !selectedId || !next?.visibleIds.includes(selectedId)) return;
    if (!changeFocus(id)) return;
    setSelectedId(selectedId);
    setSelectionNotice({
      id: selectedId,
      message: `${next.title} opened. ${selected?.name} remains selected.`,
    });
    publishSelection(selectedId);
  }
  function exploreMotorGroup(key: string) {
    if (!catalog) return;
    const plan = limbMotorPlan(catalog, initialRegion, side, key, exam);
    if (!plan) return;
    dispatch(plan.action);
    setSystems((prev) => ({ ...prev, skeleton: true, muscles: true }));
    setInspection(initialInspection);
    setExplode(0);
    setLayout('spatial');
    setPlate(false);
    setGhostRemoved(false);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
    cameraRestore.current = null;
    setSelectedId(plan.selectedId);
    setSelectionNotice({
      id: plan.selectedId,
      message: `${plan.label}: available muscle relationships shown. No nerve path or territory is modelled.`,
    });
    setReset((n) => n + 1);
    // A motor study is local visibility, not a nerve selection or imaging event.
  }
  function openGuidanceRecipe(kind: 'recipe' | 'next') {
    const action = guidanceRecipeAction(guidance, kind, exam);
    if (!action) return;
    if (action.kind === 'focus') changeFocus(action.id);
    else changeStage(action.id);
  }
  function showMuscleAttachments() {
    if (!catalog || !selectedId || exam) return;
    const plan =
      armAttachmentPlan(catalog, initialRegion, side, selectedId, exam) ??
      thighAttachmentPlan(catalog, initialRegion, side, selectedId, exam);
    if (!plan) return;
    dispatch(plan.action);
    setSystems((prev) => ({ ...prev, skeleton: true, muscles: true }));
    setInspection(initialInspection);
    setExplode(0);
    setLayout('spatial');
    setPlate(false);
    setGhostRemoved(false);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
    cameraRestore.current = null;
    setSelectionNotice({
      id: plan.selectedId,
      message: plan.completeHere
        ? 'Muscle and attachment bones shown. Whole-bone relationships only; donor footprints are not verified.'
        : 'Muscle and available attachment bones shown. Some bones are outside this region; open whole body for the complete bony relationship set.',
    });
    setReset((n) => n + 1);
    // Visibility only; retain the existing selected-muscle and imaging identity.
  }
  function showJointPartners() {
    if (!catalog || !selectedId) return;
    const plan = boneJointPlan(catalog, initialRegion, side, selectedId, exam);
    if (!plan) return;
    dispatch(plan.action);
    setSystems((prev) => ({ ...prev, skeleton: true }));
    setInspection(initialInspection);
    setExplode(0);
    setLayout('spatial');
    setPlate(false);
    setGhostRemoved(false);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
    cameraRestore.current = null;
    setSelectionNotice({
      id: plan.selectedId,
      message: `${plan.label}: available ${plan.scopeLabel} joint partners shown; variable facets excluded. No donor contact or joint space is verified.`,
    });
    setReset((n) => n + 1);
    // Visibility only; existing selection and imaging identity are retained.
  }
  function showArterialConnections() {
    if (!catalog || !selectedId) return;
    const plan = arterialPlan(catalog, initialRegion, side, selectedId, exam);
    if (!plan) return;
    dispatch(plan.action);
    setSystems((prev) => ({ ...prev, skeleton: true, vessels: true }));
    setInspection(initialInspection);
    setExplode(0);
    setLayout('spatial');
    setPlate(false);
    setGhostRemoved(false);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
    cameraRestore.current = null;
    setSelectionNotice({
      id: plan.selectedId,
      message: `${plan.label}: available arterial relationships shown. Missing segments remain unmodelled.`,
    });
    setReset((n) => n + 1);
    // The existing selection is retained; this visibility action emits no imaging event.
  }
  function showVenousDrainage() {
    if (!catalog || !selectedId) return;
    const plan = venousDrainagePlan(
      catalog,
      initialRegion,
      side,
      selectedId,
      exam,
    );
    if (!plan) return;
    dispatch(plan.action);
    setSystems((prev) => ({ ...prev, skeleton: true, vessels: true }));
    setInspection(initialInspection);
    setExplode(0);
    setLayout('spatial');
    setPlate(false);
    setGhostRemoved(false);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
    cameraRestore.current = null;
    setSelectionNotice({
      id: plan.selectedId,
      message: `${plan.label}: available venous drainage shown. Missing routes remain unmodelled.`,
    });
    setReset((n) => n + 1);
    // Local visibility only; no imaging event, acquired flow or entitlement.
  }
  function reorientDissection() {
    if (exam) return;
    cameraRestore.current = null;
    setFocus(false);
    setZoom(1);
    setView(guidance.recipe?.view ?? view);
    setReset((n) => n + 1);
  }
  function undoDissection() {
    if (exam || !dissection.history.length) return;
    dispatch({ type: 'undo' });
    setSelectedId(null);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
  }
  function redoDissection() {
    if (exam || !dissection.future.length) return;
    dispatch({ type: 'redo' });
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
  function changeVesselVisibility(kind: VesselKind, show: boolean) {
    const action = vesselVisibilityAction(
      regionStructures,
      resolved.visible.map((s) => s.id),
      kind,
      show,
      exam || !systems.vessels,
    );
    if (!action) return;
    dispatch(action);
    // Retain camera, selection, source identity and other tissue visibility.
    // A local visibility change emits no imaging or entitlement event.
  }
  function onSceneSelect(id: string) {
    if (!displayReady) return;
    if (exam) {
      if (practice.mode === 'find' || practice.mode === 'reason')
        submitPractice(id);
    } else select(id);
  }
  function submitPractice(chosen: string | null) {
    if (practicePaused) return;
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
    if (exam || next === layout) return;
    setLayout(next);
    setPlate(next === 'tray');
    setExplode(next === 'spatial' ? 0 : 100);
    setFocus(false);
    setIsolated(false);
    setZoom(1);
    setReset((n) => n + 1);
  }
  function startExam(retry = false) {
    if (exam || practiceBlocked || (retry && !retryCount)) return;
    const session = createPracticeSession(
      available,
      practiceLoadStatus.loaded,
      {
        id: ++practiceSerial.current,
        mode: practiceMode,
        count: retry ? retryCount : practiceCount,
        sampling: practiceSampling,
        focusIds: focusTargetIds,
        retryIds: retry ? retryIds : undefined,
      },
    );
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
    if (practicePaused) return;
    practiceDispatch({
      type: 'next',
      sessionId: practice.id,
      index: question,
    });
    if (practice.mode === 'name' || practice.mode === 'reason') {
      setZoom(1);
      setReset((n) => n + 1);
    }
  }
  function resetView() {
    cameraRestore.current = null;
    setRegionalFraming(true);
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
    // The saved pose wins; do not reinterpret old full-source bookmarks as a
    // new regional preset. Camera capture uses the unchanged full-frame basis.
    setRegionalFraming(false);
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
      guidance={guidance}
      side={side}
      view={view}
      onOrient={reorientDissection}
      onRecipe={openGuidanceRecipe}
      profile={profile}
      stage={stage}
      focus={focusedStudy}
      removed={resolved.removed}
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

  const railContent = (
    <>
      {presentation === 'standalone' ? <details className="body-region-picker">
        <summary>
          {title}
          <small>Change region</small>
        </summary>

        <Link className={`body-region-link ${whole ? 'active' : ''}`} href="/">
          <Accessibility />
          <span>Whole body</span>
          <small>{catalog.structures.length}</small>
        </Link>

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
      </details> : <div className="body-rail-title">{title}</div>}
      <div className="body-rail-title">Anatomical systems</div>
      <div className="body-system-bar" aria-label="Anatomical systems">
        {systemKeys.map((system) => {
          if (system === 'vessels')
            return (
              <VesselSystemControl
                key={system}
                structures={regionStructures}
                visibleIds={resolved.visible.map((s) => s.id)}
                enabled={systems.vessels}
                disabled={exam}
                onEnabled={(checked) =>
                  setSystems((prev) => ({ ...prev, vessels: checked }))
                }
                onVisibility={changeVesselVisibility}
                canUndo={dissection.history.length > 0}
                canRedo={dissection.future.length > 0}
                onUndo={undoDissection}
                onRedo={redoDissection}
              />
            );
          const Icon = icons[system],
            count = regionStructures.filter((s) => s.system === system).length;
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

      <WorkspaceOnly modes={['explore']} className="atlas-dissection-entry">
        <WorkspaceModeButton mode="dissect">
          Dissect this region
        </WorkspaceModeButton>
      </WorkspaceOnly>
      <WorkspaceOnly modes={['dissect']}>
        <details className="body-study-tools" open>
          <summary>
            Dissection <small>{stage?.title ?? 'Custom view'}</small>
          </summary>
          <DissectionControls
            profile={profile}
            state={dissection}
            onStage={changeStage}
            onFocus={changeFocus}
            onUndo={undoDissection}
            onRedo={redoDissection}
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
        </details>
        <UpperLimbMotorExplorer
          catalog={catalog}
          region={initialRegion}
          side={side}
          selectedId={selectedId}
          disabled={exam}
          onSelect={select}
          onExplore={exploreMotorGroup}
        />
      </WorkspaceOnly>
      <WorkspaceOnly modes={['explore', 'dissect']}>
        {['spine', 'whole-body'].includes(initialRegion) && (
          <Button
            ref={backLayersLauncher}
            variant="outline"
            size="sm"
            className="um-knee-launch"
            disabled={exam}
            onClick={() => {
              if (!exam) setBackLayersOpen(true);
            }}
          >
            Back layers · separate specimen
          </Button>
        )}
        {initialRegion === 'abdomen' && (
          <Button
            ref={abdominalWallLauncher}
            variant="outline"
            size="sm"
            className="um-knee-launch"
            disabled={exam}
            onClick={() => setAbdominalWallOpen(true)}
          >
            Abdominal wall layers · separate specimen
          </Button>
        )}
        {['pelvis', 'whole-body'].includes(initialRegion) && (
          <Button
            ref={hraPelvisLauncher}
            variant="outline"
            size="sm"
            className="um-knee-launch"
            disabled={exam}
            onClick={() => {
              if (!exam) setHraPelvisOpen(true);
            }}
          >
            Female pelvis · separate reference
          </Button>
        )}
        {['abdomen', 'whole-body'].includes(initialRegion) && (
          <Button
            ref={hraRenalLauncher}
            variant="outline"
            size="sm"
            className="um-knee-launch"
            disabled={exam}
            onClick={() => {
              if (!exam) setHraRenalOpen(true);
            }}
          >
            Kidney layers · separate reference
          </Button>
        )}
        {['leg', 'foot', 'thigh', 'pelvis'].includes(initialRegion) && (
          <Button
            ref={kneeSpecimenLauncher}
            variant="outline"
            size="sm"
            className="um-knee-launch"
            disabled={exam}
            onClick={() => setKneeSpecimenOpen(true)}
          >
            {initialRegion === 'leg'
              ? 'Knee tissues'
              : initialRegion === 'foot'
                ? 'Foot dissection'
                : 'Hip & thigh dissection'}{' '}
            · separate specimen
          </Button>
        )}
        <details className="body-display-tools">
          <summary>
            Display options<small>Quick views · arrangement · surfaces</small>
          </summary>
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
          <div className="body-layout-controls" aria-label="Model arrangement">
            <p>
              {layout === 'tray' && !exam
                ? 'Same-scale surfaces, grouped by system. At 100%, each catalogue entry has its own space—not an anatomical position.'
                : layout === 'extract' && !exam
                  ? 'Only the selected structure moves. Others remain assembled. This is a teaching view, not a surgical extraction path.'
                  : 'Source anatomy at 0% separation. Rotate freely or choose a standard direction.'}
            </p>
          </div>
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
              {layout === 'tray' && (
                <span>
                  All entries move in the tray. Select and frame a structure, or
                  choose a system/region for fine detail.
                </span>
              )}
            </div>
          )}
        </details>
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
      </WorkspaceOnly>
      <StudyViews
        scope={studyScope}
        capture={captureView}
        restore={restoreView}
        disabled={exam || pending.length > 0}
      />
      <ImagingLink link={imagingLink} />

      <details className="body-coverage-tools">
        <summary>
          Coverage & sources<small>Reference anatomy · review pending</small>
        </summary>
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
              cartilage, ligaments, interosseous membranes and Achilles tendons;
              it is incomplete.
            </span>
          </div>
        )}
        <div className="body-rail-foot">
          <span>Adult reference anatomy</span>
          <p>One source model, preserved in a common spatial frame.</p>
          <a
            href={modelDeliveryUrl('/models/bodyparts3d/credits.html', assetBase)}
            target="_blank"
            rel="noreferrer"
          >
            Sources & commercial licence ↗
          </a>
        </div>
      </details>
    </>
  );

  return (
    <AtlasWorkspace exam={exam} presentation={presentation}>
      <PracticeAttention answered={answered} exam={exam} />
      <header className="body-topbar">
        <Brand />
        <WorkspaceModes />
        <AtlasSearch
          catalog={catalog}
          localRegionOnly={presentation === 'panel'}
          region={initialRegion}
          side={side as StudySide}
          onSelect={select}
          onWindow={changeStage}
          onFocus={changeFocus}
          onDissect={openNested}
        />
        <WorkspaceFocus />
        <WorkspaceOnly modes={['practice']} className="vm-practice-start">
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
            disabled={!exam && practiceBlocked}
          >
            <GraduationCap />
            {exam ? 'Exit practice' : 'Start practice'}
          </Button>
        </WorkspaceOnly>
      </header>
      <div className="body-layout">
        <AnatomyControlRail>{railContent}</AnatomyControlRail>
        <section className="body-workspace" aria-label={`${title} 3D anatomy`}>
          <RegionHeading title={title} count={regionStructures.length}
            compact={presentation === 'panel'}
            description={whole ? 'Explore the body by region or anatomical system.' : region!.description}/>
          {!exam && selected && (
            <SelectionVisibilityNotice
              name={selected.name}
              report={selectedVisibility}
              onRecover={revealSelection}
              onReapply={() => {
                if (!exam)
                  setInspection((current) => ({
                    ...current,
                    keepSelectedUncut: false,
                  }));
              }}
            />
          )}
          <ImagingComparisonWorkspace
            selected={
              linkEntries.find((entry) => entry.id === selected?.id) ?? null
            }
            link={imagingLink}
          >
            <div className="body-canvas illustration-mode">
              <div className="body-view-row">
                <CameraViewMenu
                  value={view}
                  region={initialRegion}
                  framingAction={framingRegion && available.some(s => s.region === framingRegion) && !exam &&
                    !focus && !isolated && !ghostRemoved && !showOrigins &&
                    explode === 0 && layout === 'spatial' && inspection.plane === 'off'
                    ? {
                      label: regionalCloseUp ? 'Fit all sources' : `Frame ${framingRegion}`,
                      run: () => {
                        cameraRestore.current = null;
                        setRegionalFraming(!regionalCloseUp);
                        if (!regionalCloseUp) setSelectedId(null);
                        setZoom(1);
                        setReset((n) => n + 1);
                      },
                    } : undefined}
                  onChange={(v) => {
                    setView(v);
                    setReset((n) => n + 1);
                  }}
                />
                {!exam && selected && <StructureDetailsButton />}
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
                <div className="body-zoom">
                  <Button size="icon" variant="outline" aria-label="Zoom in"
                    onClick={() => setZoomStep(s => s + 1)}><Plus /></Button>
                  <Button size="icon" variant="outline" aria-label="Zoom out"
                    onClick={() => setZoomStep(s => s - 1)}><Minus /></Button>
                </div>
              </div>
              {!eyeParent && !ventricleParent && (
                <Scene
                  assetBase={assetBase}
                  catalog={catalog}
                  structures={sceneStructures}
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
                  zoomStep={zoomStep}
                  reset={reset}
                  focus={focus}
                  exam={exam}
                  inspection={exam ? initialInspection : inspection}
                  cameraBounds={jointCloseUp}
                  presetBounds={regionalCloseUp}
                  presetKey={['hand', 'foot'].includes(initialRegion)
                    ? `${initialRegion}/${side}/${regionalCloseUp ? 'regional' : 'sources'}`
                    : undefined}
                  plate={plate && !exam}
                  cameraCapture={cameraCapture}
                  cameraRestore={cameraRestore}
                  retries={retries}
                  onSelect={onSceneSelect}
                  onLoaded={onLoaded}
                  onFailure={onFailure}
                  onRendererHealth={setRendererHealth}
                />
              )}
              {pending.length > 0 && (
                <output className="body-loading">
                  Loading anatomy · {loadStatus.loaded.length}/{required.length}{' '}
                  groups ready
                  {loadStatus.failed.length > 0
                    ? ` · ${loadStatus.failed.length} unavailable`
                    : ''}
                </output>
              )}
              {loadStatus.failed.length > 0 && (
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
                    {practice.mode === 'reason' ? 'APPLY ANATOMY' : 'IDENTIFY'}{' '}
                    {question + 1} OF {examTargets.length}
                  </span>
                  <strong>
                    {practice.mode === 'reason'
                      ? 'Choose the best match in Practice'
                      : practice.mode === 'name'
                        ? 'Name the isolated structure'
                        : `Find ${target?.name.toLowerCase()}`}
                  </strong>
                </div>
              )}
              <div className="body-toolbar">
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
                  <ExplodeStyleSelect
                    value={exam ? 'spatial' : layout}
                    disabled={exam || !available.length}
                    onChange={changeLayout}
                  />
                  <Slider
                    value={[explode]}
                    aria-valuetext={`${explode}%`}
                    min={0}
                    max={100}
                    step={1}
                    disabled={exam}
                    onValueChange={(v) =>
                      setExplode(Array.isArray(v) ? v[0] : v)
                    }
                    aria-label={
                      layout === 'tray'
                        ? 'Arranged separation'
                        : layout === 'extract'
                          ? 'Selected structure separation'
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
                {regionalCloseUp
                  ? initialRegion === 'foot'
                    ? 'Foot close-up · Full extent in View menu'
                    : 'Hand close-up · Proximal vessels off-screen'
                  : jointCloseUp
                  ? `${initialRegion === 'forearm' ? 'Elbow' : 'Knee'} close-up · Whole bones extend beyond the view · Pan / pinch to explore`
                  : layout === 'tray' && !exam
                    ? explode === 100
                      ? 'Arranged view · Pan / pinch to zoom · Choose a direction · Not anatomical positions'
                      : `Arrangement in progress · ${explode}% · Overlap is possible before 100%`
                    : layout === 'extract' && !exam
                      ? !selectedId ||
                        !available.some((item) => item.id === selectedId)
                        ? 'Select a visible structure to extract · Others stay assembled'
                        : explode > 0
                          ? 'Selected structure extracted · 0% restores anatomy · Overlap can recur when rotated'
                          : 'Assembled anatomy · Increase separation to extract the selected structure'
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
                href={modelDeliveryUrl('/models/bodyparts3d/credits.html', assetBase)}
                target="_blank"
                rel="noreferrer"
              >
                BodyParts3D · CC BY 4.0 · Adapted
              </a>
            </div>
          </ImagingComparisonWorkspace>
        </section>
        <AnatomyInfoPanel practice={exam}>
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
                    : practice.mode === 'reason'
                      ? practice.questions[question].reasoning?.prompt
                      : practice.mode === 'name'
                        ? 'Name the isolated structure.'
                        : `Find ${target?.name ?? 'the requested structure'}.`
                }`}
              </output>
              <div className="eyebrow">
                {practice.mode === 'reason'
                  ? 'APPLY ANATOMY · DRAFT'
                  : 'IDENTIFICATION PRACTICE'}
              </div>
              <h2>
                {question + 1} / {examTargets.length}
              </h2>
              <p>
                {practice.mode === 'reason'
                  ? practice.questions[question].reasoning?.prompt
                  : practice.mode === 'name'
                    ? 'Rotate the isolated structure and choose its name. You can use the keyboard to move between answer buttons.'
                    : 'Find the named structure on the model. Labels and selection hints are hidden.'}
              </p>
              {practicePaused && (
                <output aria-live="polite" className="vm-practice-note">
                  {!displayReady
                    ? 'Practice paused while the 3D view recovers. Use Restart 3D view or exit practice.'
                    : loadStatus.failed.length
                      ? 'Practice paused: required anatomy is unavailable. Use Retry missing anatomy or exit practice.'
                      : 'Practice paused while the required anatomy loads.'}{' '}
                  Your answers are retained.
                </output>
              )}
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
                  <ReasoningFeedback session={practice} />
                  <Button onClick={nextQuestion} disabled={practicePaused}>
                    {question + 1 === examTargets.length
                      ? 'Finish practice'
                      : practice.mode === 'reason'
                        ? 'Next question'
                        : 'Next structure'}
                    <ChevronRight />
                  </Button>
                </div>
              ) : (
                <>
                  {practice.mode !== 'find' ? (
                    <fieldset
                      className="vm-practice-choices"
                      disabled={practicePaused}
                    >
                      <legend>
                        {practice.mode === 'reason'
                          ? 'Choose the best match'
                          : 'Choose the anatomical name'}
                      </legend>
                      {practice.questions[question].choices.map((id) => (
                        <Button
                          key={`${practice.id}-${question}-${id}`}
                          variant="outline"
                          disabled={practicePaused}
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
                    disabled={practicePaused}
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
              <WorkspaceOnly
                modes={['practice']}
                className="atlas-practice-setup"
              >
                <h2>Anatomy practice</h2>
                <p>
                  Choose your question style and targets, then start. Use
                  Dissect to prepare a focused anatomy set.
                </p>
                <details className="vm-practice-options" open>
                  <summary>
                    Practice options ·{' '}
                    {practiceMode === 'reason'
                      ? 'Apply anatomy'
                      : practiceMode === 'name'
                        ? 'Name isolated anatomy'
                        : 'Find on model'}
                  </summary>
                  <label htmlFor="practice-answer-mode">Answer mode</label>
                  <Select
                    value={practiceMode}
                    onValueChange={(value) => {
                      if (
                        value === 'find' ||
                        value === 'name' ||
                        value === 'reason'
                      )
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
                      <SelectItem value="reason">
                        Apply anatomy · draft
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
                    {practiceMode === 'reason'
                      ? `${availableQuestions} source-bound draft questions available. One question per concept; both sides are not repeated. `
                      : `${practiceEligible.length} loaded candidates. `}
                    {practiceMode === 'reason' && practiceSampling !== 'focus'
                      ? 'Uses authored concepts available in this region, without the landmark size preference.'
                      : practiceSampling === 'landmarks'
                        ? 'Emphasises larger surfaces.'
                        : practiceSampling === 'focus'
                          ? 'Uses the selected focus targets, excluding its added context. Choose a focus in Guided dissection first.'
                          : 'Includes small structures without the landmark size cutoff.'}{' '}
                    {practiceMode === 'name' &&
                      'Naming needs at least two distinct candidates; there may be fewer than four answer choices.'}
                  </p>
                  {practiceMode === 'reason' && !practiceReady && (
                    <p className="vm-practice-note">
                      Show a target and at least one eligible alternative with
                      matching laterality (including grouped selections). Widen
                      the visible scope, try{' '}
                      <a href="/regions/spine">Spine &amp; back</a> or{' '}
                      <a href="/regions/thorax">Thorax</a>, or use an
                      identification mode.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => startExam()}
                    disabled={practiceBlocked}
                  >
                    Start {Math.min(practiceCount, availableQuestions)}{' '}
                    questions
                  </Button>
                </details>
                {selected && <QuizNotes structure={selected} />}
              </WorkspaceOnly>
              <output
                className="body-selection-notice"
                aria-live="polite"
                aria-atomic="true"
              >
                {selected
                  ? `${selectionNotice?.id === selected.id ? selectionNotice.message : `${selected.name} selected.`} ${structureDetail(selected)}. ${selectedVisibility?.reasons.join('. ') || ''}`
                  : 'No structure selected.'}
              </output>
              <WorkspaceOnly modes={['practice']}>
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
                      {
                        practiceResult.filter((r) => r.target === r.chosen)
                          .length
                      }{' '}
                      / {practiceResult.length} correct. Select a structure
                      below to study it.
                    </p>
                    <ul>
                      {practiceResult.map((r, index) => (
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
                          {practice.questions[index]?.reasoning && (
                            <details>
                              <summary>Review explanation</summary>
                              <p>
                                {practice.questions[index].reasoning?.prompt}
                              </p>
                              <ReasoningFeedback
                                session={practice}
                                index={index}
                              />
                            </details>
                          )}
                        </li>
                      ))}
                    </ul>
                    {missedPracticeIds(practiceResult).length > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startExam(true)}
                          disabled={practiceBlocked || retryCount === 0}
                        >
                          Retry missed ({retryCount} available)
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
              </WorkspaceOnly>
              <WorkspaceOnly modes={['explore', 'dissect']}>
                {selected ? (
                  <>
                    <div className="body-selection-heading">
                      <span
                        style={{
                          background: bodySystems[selected.system].color,
                        }}
                      />
                      {bodySystems[selected.system].name} · {selected.fmaId}
                    </div>
                    <h2>{selected.name}</h2>
                    <ReviewStatus structureId={selected.id} />
                    {!exam && hepaticFor(selected).length > 0 && (
                      <p className="vm-practice-note">
                        Liver segment boundaries are not validated. Explore the
                        supplied internal vessel and bile-duct groups
                        separately.
                      </p>
                    )}
                    {!exam && pulmonaryFor(selected).length > 0 && (
                      <p className="vm-practice-note">
                        This model shows airway and vessel branches. Lung tissue
                        and fissure surfaces are not modelled.
                      </p>
                    )}
                    {selected.bundle === 'eye-corrected-parent' && (
                      <p className="vm-practice-note">
                        Source-cleaned eye model · anatomical review pending.
                      </p>
                    )}
                    {!exam && eyeLayersFor(selected).length > 0 && (
                      <div className="body-selection-actions">
                        <Button
                          ref={eyeLauncher}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            cameraRestore.current = copyRecoveryCamera(
                              cameraCapture.current,
                            );
                            setEyeParent(selected);
                          }}
                        >
                          <Layers3 /> Explore eye layers
                        </Button>
                      </div>
                    )}
                    {!exam &&
                      (ventriclesFor(selected).length > 0 ||
                        cardiacFor(selected).length > 0 ||
                        pulmonaryFor(selected).length > 0 ||
                        hepaticFor(selected).length > 0 ||
                        renalFor(selected).length > 0 ||
                        pancreaticFor(selected).length > 0 ||
                        cricothyroidFor(selected).length > 0 ||
                        femoralComponentsFor(selected).length > 0 ||
                        cranialArteryComponentsFor(selected).length > 0) && (
                        <div className="body-selection-actions">
                          <Button
                            ref={ventricleLauncher}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              cameraRestore.current = copyRecoveryCamera(
                                cameraCapture.current,
                              );
                              setVentricleParent(selected);
                            }}
                          >
                            <Layers3 />{' '}
                            {femoralComponentsFor(selected).length ||
                            cranialArteryComponentsFor(selected).length
                              ? 'Explore artery components'
                              : cricothyroidFor(selected).length
                                ? 'Explore cricothyroid muscles'
                                : pancreaticFor(selected).length
                                  ? 'Explore pancreatic ducts'
                                  : renalFor(selected).length
                                    ? 'Explore renal vessels'
                                    : hepaticFor(selected).length
                                      ? 'Explore liver branches'
                                      : pulmonaryFor(selected).length
                                        ? 'Explore lung branches'
                                        : cardiacFor(selected).length
                                          ? 'Explore heart chambers'
                                          : 'Dissect brain'}
                          </Button>
                        </div>
                      )}
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
                      <details className="atlas-more-actions">
                        <summary>More</summary>{' '}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={revealSelection}
                        >
                          Reveal selection
                        </Button>{' '}
                        <Button
                          size="sm"
                          variant={isolated ? 'default' : 'ghost'}
                          aria-label="Fade other structures"
                          disabled={!selected || exam}
                          onClick={() => setIsolated((v) => !v)}
                        >
                          <Eye /> Fade others
                        </Button>
                        <Button
                          size="sm"
                          variant={focus ? 'default' : 'ghost'}
                          aria-label="Frame selected structure"
                          disabled={!selected || exam}
                          onClick={() => {
                            setFocus((v) => !v);
                            setZoom(1);
                          }}
                        >
                          <Focus /> Frame selection
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
                          <ArrowLeft /> Clear selection
                        </Button>
                      </details>
                    </div>
                    <GroupedAnatomyNotes>
                      {(value) => {
                        const content = bodyContent(selected, value);
                        return (
                          <div className="atlas-note-body">
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
                            <WorkspaceModeButton mode="practice">
                              Practise this anatomy
                            </WorkspaceModeButton>
                            {['ct', 'mri', 'xray', 'ultrasound'].includes(
                              value,
                            ) && (
                              <>
                                <ComponentImagingNotes
                                  key={`${selected.id}:${value}:${side}`}
                                  catalog={catalog}
                                  parentId={selected.id}
                                  topic={value}
                                  side={side}
                                  disabled={exam}
                                  onOpen={openNested}
                                />
                                <div className="body-no-imaging">
                                  <ScanLine />
                                  No imaging study loaded
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }}
                    </GroupedAnatomyNotes>
                    <RelatedStudy
                      views={relatedViews}
                      selectedId={selected.id}
                      currentFocusId={dissection.focusId}
                      onOpen={openRelatedStudy}
                      onSelect={select}
                      detail={structureDetail}
                    />
                    <StudyLinks
                      assetBase={assetBase}
                      catalog={catalog}
                      selected={selected}
                      region={initialRegion}
                      side={side as StudySide}
                      focusId={dissection.focusId}
                    />
                    <ArmAttachments
                      catalog={catalog}
                      region={initialRegion}
                      side={side}
                      selectedId={selected.id}
                      disabled={exam}
                      onSelect={select}
                      onShow={showMuscleAttachments}
                    />
                    <BoneJoints
                      catalog={catalog}
                      region={initialRegion}
                      side={side}
                      selectedId={selected.id}
                      disabled={exam}
                      onSelect={select}
                      onShow={showJointPartners}
                    />
                    <ArterialConnections
                      catalog={catalog}
                      region={initialRegion}
                      side={side}
                      selectedId={selected.id}
                      disabled={exam}
                      onSelect={select}
                      onShow={showArterialConnections}
                    />
                    <VenousDrainage
                      catalog={catalog}
                      region={initialRegion}
                      side={side}
                      selectedId={selected.id}
                      disabled={exam}
                      onSelect={select}
                      onShow={showVenousDrainage}
                    />
                    <dl className="body-facts">
                      <div>
                        <dt>Region</dt>
                        <dd>
                          {
                            catalog.regions.find(
                              (r) => r.id === selected.region,
                            )?.name
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
                    <h2>Choose a structure</h2>
                    <p>
                      Select a structure to inspect its identity, isolate it, or
                      explore the available teaching notes.
                    </p>
                    <div className="body-content-note">
                      The geometry is source-based. New teaching entries are
                      clearly marked where specialist content is still pending.
                    </div>
                  </>
                )}
              </WorkspaceOnly>
              <WorkspaceOnly modes={['dissect']}>
                <details className="dissection-guide-fold">
                  <summary>
                    Study guide · {stage?.title ?? 'Custom view'}
                  </summary>
                  {studyGuide}
                </details>
              </WorkspaceOnly>
              <WorkspaceOnly modes={['explore', 'dissect']}>
                <details className="body-structure-browser">
                  <summary>
                    Browse structures ({regionStructures.length})
                  </summary>
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
              </WorkspaceOnly>
              <div className="body-validation">
                Educational reference model · Independent clinical validation
                pending. Not for diagnosis or patient-specific decisions.
              </div>
            </>
          )}
        </AnatomyInfoPanel>
      </div>
      {eyeParent && !exam && eyeParent.id === selectedId && (
        <EyeLayers
          assetBase={assetBase}
          parent={eyeParent}
          initialSelectedId={nestedSelection?.structureId}
          initialTeachingTopic={nestedSelection?.teachingTopic}
          onClose={closeEyeLayers}
        />
      )}
      {kneeSpecimenOpen &&
        ['leg', 'foot', 'thigh', 'pelvis'].includes(initialRegion) &&
        !exam && (
          <KneeSpecimen
            initialRegion={initialRegion}
            onClose={closeKneeSpecimen}
          />
        )}
      {abdominalWallOpen && initialRegion === 'abdomen' && !exam && (
        <AbdominalWallSpecimen assetBase={assetBase} onClose={closeAbdominalWall} />
      )}
      {backLayersOpen &&
        ['spine', 'whole-body'].includes(initialRegion) &&
        !exam && <BackLayersSpecimen onClose={closeBackLayers} />}
      {hraPelvisOpen &&
        ['pelvis', 'whole-body'].includes(initialRegion) &&
        !exam && <HraPelvisSpecimen onClose={closeHraPelvis} />}
      {hraRenalOpen &&
        ['abdomen', 'whole-body'].includes(initialRegion) &&
        !exam && <HraRenalSpecimen assetBase={assetBase} onClose={closeHraRenal} />}
      {ventricleParent && !exam && ventricleParent.id === selectedId && (
        <Ventricles
          assetBase={assetBase}
          parent={ventricleParent}
          initialStudy={
            nestedSelection?.study === 'eye'
              ? undefined
              : nestedSelection?.study
          }
          initialSelectedId={nestedSelection?.structureId}
          initialTeachingTopic={nestedSelection?.teachingTopic}
          onClose={closeVentricles}
        />
      )}
    </AtlasWorkspace>
  );
}
