"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import type { AppSnapshot, EducationCase } from "@/lib/repository";
import type {
  ImagePlane,
  LocalizerProjection,
  PatientPoint,
} from "@/lib/education-viewer-adapter";
import type {
  InstructorPresentation,
  LearnerBookmark,
  ViewerScene,
} from "@/lib/education-presentations";
import type { TeachingPollView } from "@/lib/teaching-polls";
import type {
  TeachingSessionBundle,
  TeachingViewerState,
} from "@/lib/teaching-sessions";
import {
  keyPointsFromBody,
  type TeachingContentBlockType,
  type TeachingContentBlockView,
} from "@/lib/teaching-content";
import type {
  QuestionBankItem,
  QuestionDifficulty,
  QuestionModality,
  QuestionResponseType,
} from "@/lib/question-bank";
import type { TeachingDashboard } from "@/lib/teaching-dashboard-repository";
import type { LearnerReviewBundle } from "@/lib/learner-review-repository";
import type { LtiIntegrationView } from "@/lib/education-integrations";
import { remainingAttemptSeconds } from "@/lib/attempt-policy";
import { liveRefreshDelay } from "@/lib/live-refresh-policy";

const LiveTeachingRoom = dynamic(
  () =>
    import("@/components/LiveTeachingRoom").then(
      (module) => module.LiveTeachingRoom,
    ),
  { ssr: false },
);

type WorkspaceView =
  | "home"
  | "exam"
  | "teaching"
  | "authoring"
  | "question-bank"
  | "session-dashboard"
  | "review"
  | "integrations"
  | "content"
  | "marking"
  | "insights"
  | "audit";
type ActionPayload = Record<string, string | number | boolean | object | null>;
type PendingAnswerDraft = {
  workbookId: string;
  questionId: string;
  response: string;
  generation: number;
};
type DisplayMessage = {
  type?: "workspace-state" | "navigation" | "prepare-close" | "handoff-ready";
  source?: "main" | "companion";
  sessionId?: string;
  workbookId?: string;
  view?: WorkspaceView;
  activeCaseId?: string;
  mixedAsset?: "radiology" | "pathology";
  frameIndex?: number;
  revealNote?: boolean;
  handoffSucceeded?: boolean;
};

const VIEW_LABELS: Array<{
  id: WorkspaceView;
  label: string;
  role?: string[];
  group?: "Authoring" | "Live teaching" | "Assessment" | "Governance";
}> = [
  { id: "home", label: "Home" },
  { id: "teaching", label: "Teaching" },
  { id: "exam", label: "Exam" },
  { id: "review", label: "My review", role: ["learner"] },
  {
    id: "authoring",
    label: "Workbook builder",
    role: ["instructor", "examiner", "administrator"],
    group: "Authoring",
  },
  {
    id: "question-bank",
    label: "Question bank",
    role: ["instructor", "examiner", "administrator"],
    group: "Authoring",
  },
  {
    id: "session-dashboard",
    label: "Live dashboard",
    role: ["instructor", "administrator"],
    group: "Live teaching",
  },
  {
    id: "content",
    label: "Content safety",
    role: ["instructor", "administrator"],
    group: "Governance",
  },
  {
    id: "integrations",
    label: "Integrations",
    role: ["administrator"],
    group: "Governance",
  },
  {
    id: "marking",
    label: "Marking & results",
    role: ["examiner", "administrator"],
    group: "Assessment",
  },
  {
    id: "insights",
    label: "Progress & insights",
    role: ["instructor", "examiner", "administrator"],
    group: "Assessment",
  },
  { id: "audit", label: "Audit", role: ["administrator"], group: "Governance" },
];

const TOOL_LABELS: Record<string, string> = {
  "window-level": "WL",
  zoom: "Zoom",
  pan: "Pan",
  cine: "Cine",
  measure: "Length",
  annotate: "Arrow",
  layouts: "Layout",
  overview: "Overview",
  "asset-switch": "Asset",
  crosshair: "Localizer",
};

type ViewerLayout = "1x1" | "mpr" | "2x2";
type WindowPreset = "auto" | "soft" | "lung" | "bone" | "brain" | "custom";
type ManualMarkupKind = "length" | "arrow" | "circle" | "text";
type ManualMarkup = {
  id: string;
  kind: ManualMarkupKind;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lineWidth: number;
};
type ViewerDrag = {
  pointerId: number;
  tool: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  initialZoom: number;
  initialPanX: number;
  initialPanY: number;
  initialWindowCenter: number;
  initialWindowWidth: number;
  markupId?: string;
};

const WINDOW_PRESETS: Record<Exclude<WindowPreset, "custom">, { center: number; width: number }> = {
  auto: { center: 40, width: 400 },
  soft: { center: 50, width: 350 },
  lung: { center: -600, width: 1_500 },
  bone: { center: 400, width: 1_800 },
  brain: { center: 40, width: 80 },
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function formatCountdown(totalSeconds: number | null) {
  if (totalSeconds === null) return "Not started";
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function answerDraftKey(workbookId: string, questionId: string) {
  return `${workbookId}::${questionId}`;
}

type PresentationBundle = {
  presentations: InstructorPresentation[];
  examPolicy?: {
    context: string;
    attemptState: string;
    answerMaterialReleased: boolean;
  };
};
type TeachingPollBundle = {
  polls: TeachingPollView[];
  permissions: { manage: boolean; answer: boolean };
  refreshedAt: string;
};
type TeachingLiveState = {
  polls: TeachingPollBundle;
  session: TeachingSessionBundle;
  refreshedAt: string;
};

type AccessibilityProfile = {
  textSize: "standard" | "large" | "extra-large";
  colourMode: "dark" | "light";
  palette: "teal" | "blue" | "indigo" | "violet" | "amber" | "emerald" | "cyan" | "rose" | "crimson" | "graphite";
  highContrast: boolean;
  largeTargets: boolean;
  reducedMotion: boolean;
};

const VISIBLE_MEDICINE_PALETTES = [
  ["teal", "Visible Medicine Teal"],
  ["blue", "Clinical Blue"],
  ["indigo", "Indigo"],
  ["violet", "Violet"],
  ["amber", "Amber"],
  ["emerald", "Emerald"],
  ["cyan", "Cyan"],
  ["rose", "Rose"],
  ["crimson", "Crimson"],
  ["graphite", "Graphite"],
] as const;

const DEFAULT_ACCESSIBILITY: AccessibilityProfile = {
  textSize: "standard",
  colourMode: "dark",
  palette: "teal",
  highContrast: false,
  largeTargets: false,
  reducedMotion: false,
};

function BrandLockup() {
  return (
    <span className="brand-lockup" aria-label="Visible Medicine, by Elivion">
      <Image
        className="brand-logo"
        src="/favicon.svg"
        alt=""
        width="24"
        height="24"
        priority
      />
      <span className="brand-word">
        <b>Visible</b>
        <em>Medicine</em>
        <i>by Elivion</i>
      </span>
    </span>
  );
}

function initialAccessibility(): AccessibilityProfile {
  if (typeof window === "undefined") return DEFAULT_ACCESSIBILITY;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem("visible-medicine-accessibility-v1") ??
        window.localStorage.getItem("elivion-education-accessibility-v2") ??
        window.localStorage.getItem("didanix-education-accessibility-v1") ??
        "{}",
    ) as Partial<AccessibilityProfile>;
    return {
      textSize: ["standard", "large", "extra-large"].includes(
        saved.textSize ?? "",
      )
        ? (saved.textSize as AccessibilityProfile["textSize"])
        : "standard",
      colourMode: ["dark", "light"].includes(saved.colourMode ?? "")
        ? (saved.colourMode as AccessibilityProfile["colourMode"])
        : "dark",
      palette: VISIBLE_MEDICINE_PALETTES.some(([value]) => value === saved.palette)
        ? (saved.palette as AccessibilityProfile["palette"])
        : "teal",
      highContrast: saved.highContrast === true,
      largeTargets: saved.largeTargets === true,
      reducedMotion: saved.reducedMotion === true,
    };
  } catch {
    return DEFAULT_ACCESSIBILITY;
  }
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortHash(value: string | null) {
  return value ? `${value.replace(/^sha256:/, "").slice(0, 12)}…` : "—";
}
function statusLabel(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function initialCompanionMode(): "exam" | "teaching" | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("companion");
  return value === "exam" || value === "teaching" ? value : null;
}
function initialCaseId(): string {
  return typeof window === "undefined"
    ? ""
    : (new URLSearchParams(window.location.search).get("case") ?? "");
}
function initialWorkbookId(): string {
  return typeof window === "undefined"
    ? ""
    : (new URLSearchParams(window.location.search).get("workbook") ?? "");
}

function initialWorkspaceView(): WorkspaceView {
  if (typeof window === "undefined") return "home";
  const companion = initialCompanionMode();
  if (companion) return companion;
  const requested = new URLSearchParams(window.location.search).get("view");
  return VIEW_LABELS.some((item) => item.id === requested)
    ? (requested as WorkspaceView)
    : "home";
}

function validDisplaySessionId(value: string | null) {
  return value && /^[a-zA-Z0-9-]{16,80}$/.test(value) ? value : "";
}

function createDisplaySessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function seriesFor(
  activeCase: EducationCase,
  mixedAsset: "radiology" | "pathology",
) {
  if (activeCase.classification === "pathology")
    return [
      { id: "he", label: "H&E slide", meta: "WSI · 40×", kind: "pathology" },
      {
        id: "overview",
        label: "Overview",
        meta: "Macro image",
        kind: "pathology",
      },
      {
        id: "roi",
        label: "Teaching region",
        meta: "Region A",
        kind: "pathology",
      },
    ];
  if (activeCase.classification === "mixed")
    return mixedAsset === "radiology"
      ? [
          {
            id: "ct-portal",
            label: "CT portal venous",
            meta: "96 images",
            kind: "radiology",
          },
          {
            id: "ct-coronal",
            label: "CT coronal",
            meta: "64 images",
            kind: "radiology",
          },
          {
            id: "paired-wsi",
            label: "Biopsy H&E",
            meta: "Paired asset",
            kind: "pathology",
          },
        ]
      : [
          {
            id: "paired-ct",
            label: "Staging CT",
            meta: "Paired asset",
            kind: "radiology",
          },
          {
            id: "biopsy-he",
            label: "Biopsy H&E",
            meta: "WSI · 40×",
            kind: "pathology",
          },
          {
            id: "biopsy-roi",
            label: "Teaching region",
            meta: "Region B",
            kind: "pathology",
          },
        ];
  return [
    {
      id: "portal",
      label:
        activeCase.visualKind === "ct-chest"
          ? "Chest soft tissue"
          : "Portal venous",
      meta: "96 images",
      kind: "radiology",
    },
    {
      id: "arterial",
      label: activeCase.visualKind === "ct-chest" ? "Lung window" : "Arterial",
      meta: "88 images",
      kind: "radiology",
    },
    { id: "coronal", label: "Coronal", meta: "64 images", kind: "radiology" },
    { id: "sagittal", label: "Sagittal", meta: "58 images", kind: "radiology" },
  ];
}

export function EducationRuntime({ workbookId: requestedWorkbookId = "", initialView }: { workbookId?: string; initialView?: WorkspaceView } = {}) {
  const [data, setData] = useState<AppSnapshot | null>(null);
  const [view, setView] = useState<WorkspaceView>(
    () => initialView ?? initialWorkspaceView(),
  );
  const [previewRole, setPreviewRole] = useState<"full" | "learner" | "instructor" | "examiner" | "administrator">("full");
  const staffMenuRef = useRef<HTMLDetailsElement>(null);
  const [activeCaseId, setActiveCaseId] = useState(initialCaseId);
  const [activeSeries, setActiveSeries] = useState("");
  const [mixedAsset, setMixedAsset] = useState<"radiology" | "pathology">(
    "radiology",
  );
  const [activeTool, setActiveTool] = useState("window-level");
  const [frameIndex, setFrameIndex] = useState(42);
  const [zoom, setZoom] = useState(112);
  const [cine, setCine] = useState(false);
  const [fourUp, setFourUp] = useState(false);
  const [windowPreset, setWindowPreset] = useState<WindowPreset>("soft");
  const [windowCenter, setWindowCenter] = useState(50);
  const [windowWidth, setWindowWidth] = useState(350);
  const [inverted, setInverted] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lineThickness, setLineThickness] = useState(2.25);
  const [manualMarkups, setManualMarkups] = useState<ManualMarkup[]>([]);
  const [selectedMarkupId, setSelectedMarkupId] = useState("");
  const [pendingTextAnnotation, setPendingTextAnnotation] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState("All changes saved");
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [online, setOnline] = useState(true);
  const [examPreflightPassed, setExamPreflightPassed] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<
    Record<string, PendingAnswerDraft>
  >({});
  const [accessibility, setAccessibility] =
    useState<AccessibilityProfile>(DEFAULT_ACCESSIBILITY);
  const [accessibilityLoaded, setAccessibilityLoaded] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [submissionReviewOpen, setSubmissionReviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [revealNote, setRevealNote] = useState(false);
  const [sidebarPinnedOpen, setSidebarPinnedOpen] = useState(false);
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);
  const [dualDisplay, setDualDisplay] = useState(false);
  const [activePlane, setActivePlane] = useState<ImagePlane>("axial");
  const [triPlanar, setTriPlanar] = useState(false);
  const [localizerPoint, setLocalizerPoint] = useState<PatientPoint | null>(
    null,
  );
  const [localizerProjections, setLocalizerProjections] = useState<
    LocalizerProjection[]
  >([]);
  const [presentations, setPresentations] = useState<InstructorPresentation[]>(
    [],
  );
  const [bookmarks, setBookmarks] = useState<LearnerBookmark[]>([]);
  const [savedViewBusy, setSavedViewBusy] = useState(false);
  const [pollBundle, setPollBundle] = useState<TeachingPollBundle>({
    polls: [],
    permissions: { manage: false, answer: false },
    refreshedAt: "",
  });
  const [pollBusy, setPollBusy] = useState(false);
  const [teachingSession, setTeachingSession] = useState<TeachingSessionBundle>(
    {
      session: null,
      participant: null,
      permissions: { manage: false, follow: false },
      refreshedAt: "",
    },
  );
  const [teachingSessionBusy, setTeachingSessionBusy] = useState(false);
  const [restoredScene, setRestoredScene] = useState<ViewerScene | null>(null);
  const [companionMode] = useState(initialCompanionMode);
  const answerSaveTimers = useRef(new Map<string, number>());
  const answerSaveChains = useRef(new Map<string, Promise<boolean>>());
  const answerQueuedGenerations = useRef(new Map<string, number>());
  const answerDraftGeneration = useRef(0);
  const deadlineFlushes = useRef(new Set<string>());
  const deadlineFinalizations = useRef(new Set<string>());
  const pendingAnswersRef = useRef(new Map<string, PendingAnswerDraft>());
  const answerRevisions = useRef(new Map<string, number>());
  const serverClockAnchor = useRef<{
    serverTime: number;
    monotonicTime: number;
  } | null>(null);
  const sidebarOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companionWindow = useRef<Window | null>(null);
  const displayChannel = useRef<BroadcastChannel | null>(null);
  const displaySessionId = useRef("");
  const publishedSessionSignature = useRef("");
  const progressRecorded = useRef(new Set<string>());
  const viewerDrag = useRef<ViewerDrag | null>(null);
  const currentWorkbookId = useRef("");
  const sidebarCollapsed = !sidebarPinnedOpen && !sidebarHoverOpen;
  const viewerLayout: ViewerLayout = fourUp ? "2x2" : triPlanar ? "mpr" : "1x1";

  function registerAnswerRevisions(snapshot: AppSnapshot) {
    for (const answer of snapshot.answers)
      answerRevisions.current.set(
        answerDraftKey(snapshot.course.workbookId, answer.questionId),
        answer.revision,
      );
  }

  function syncPendingAnswers() {
    setPendingAnswers(Object.fromEntries(pendingAnswersRef.current));
  }

  function rememberPendingAnswer(draft: PendingAnswerDraft) {
    pendingAnswersRef.current.set(
      answerDraftKey(draft.workbookId, draft.questionId),
      draft,
    );
    syncPendingAnswers();
  }

  function clearPendingAnswerIfCurrent(draft: PendingAnswerDraft) {
    const key = answerDraftKey(draft.workbookId, draft.questionId);
    if (pendingAnswersRef.current.get(key)?.generation !== draft.generation) return;
    pendingAnswersRef.current.delete(key);
    syncPendingAnswers();
  }

  function synchronizeServerClock(serverTime: string) {
    const parsed = Date.parse(serverTime);
    if (!Number.isFinite(parsed)) return;
    serverClockAnchor.current = {
      serverTime: parsed,
      monotonicTime: window.performance.now(),
    };
    setClockNow(parsed);
  }

  function clearSidebarTimers() {
    if (sidebarOpenTimer.current) clearTimeout(sidebarOpenTimer.current);
    if (sidebarCloseTimer.current) clearTimeout(sidebarCloseTimer.current);
    sidebarOpenTimer.current = null;
    sidebarCloseTimer.current = null;
  }

  function scheduleSidebarOpen() {
    if (sidebarPinnedOpen) return;
    if (sidebarCloseTimer.current) clearTimeout(sidebarCloseTimer.current);
    if (sidebarOpenTimer.current) clearTimeout(sidebarOpenTimer.current);
    sidebarOpenTimer.current = setTimeout(() => {
      setSidebarHoverOpen(true);
      sidebarOpenTimer.current = null;
    }, 550);
  }

  function scheduleSidebarClose() {
    if (sidebarPinnedOpen) return;
    if (sidebarOpenTimer.current) clearTimeout(sidebarOpenTimer.current);
    if (sidebarCloseTimer.current) clearTimeout(sidebarCloseTimer.current);
    sidebarCloseTimer.current = setTimeout(() => {
      setSidebarHoverOpen(false);
      sidebarCloseTimer.current = null;
    }, 220);
  }

  function toggleSidebarPin() {
    clearSidebarTimers();
    setSidebarPinnedOpen((current) => !current);
    setSidebarHoverOpen(false);
  }

  async function refresh() {
    try {
      const workbookId = requestedWorkbookId || initialWorkbookId();
      const response = await fetch(
        `/api/app${workbookId ? `?workbookId=${encodeURIComponent(workbookId)}` : ""}`,
        { cache: "no-store" },
      );
      const body = (await response.json()) as AppSnapshot & { error?: string };
      if (!response.ok)
        throw new Error(
          body.error || "Unable to load the education workspace.",
        );
      synchronizeServerClock(body.serverTime);
      registerAnswerRevisions(body);
      currentWorkbookId.current = body.course.workbookId;
      setData(body);
      setAnswers(
        Object.fromEntries(
          body.answers.map((answer) => [answer.questionId, answer.response]),
        ),
      );
      setActiveCaseId((current) => current || body.cases[0]?.id || "");
      setExamPreflightPassed(Boolean(body.attempt.preflightPassedAt));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the education workspace.",
      );
    }
  }

  // Fetching the authenticated snapshot is the component's initial external synchronization.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (companionMode)
      document.title = `${companionMode === "exam" ? "Answer workspace" : "Teaching notes"} · Visible Medicine`;
    if (!("BroadcastChannel" in window)) return;
    const requestedSession = validDisplaySessionId(
      new URLSearchParams(window.location.search).get("displaySession"),
    );
    const sessionId = companionMode
      ? requestedSession
      : requestedSession || createDisplaySessionId();
    if (!sessionId) return;
    displaySessionId.current = sessionId;
    const channel = new BroadcastChannel(
      `didanix-education-display-v2:${sessionId}`,
    );
    displayChannel.current = channel;
    channel.onmessage = (event: MessageEvent<DisplayMessage>) => {
      if (
        event.data.sessionId !== displaySessionId.current ||
        event.data.workbookId !== currentWorkbookId.current
      )
        return;
      if (companionMode) {
        if (
          event.data.type === "workspace-state" &&
          event.data.source === "main"
        ) {
          if (event.data.view === "exam" || event.data.view === "teaching")
            setView(event.data.view);
          if (event.data.activeCaseId) setActiveCaseId(event.data.activeCaseId);
          if (event.data.mixedAsset) setMixedAsset(event.data.mixedAsset);
          if (typeof event.data.frameIndex === "number")
            setFrameIndex(event.data.frameIndex);
          if (
            event.data.view === "teaching" &&
            typeof event.data.revealNote === "boolean"
          )
            setRevealNote(event.data.revealNote);
        } else if (
          event.data.type === "prepare-close" &&
          event.data.source === "main"
        ) {
          void (async () => {
            const succeeded = await flushPendingAnswers(event.data.workbookId!);
            channel.postMessage({
              type: "handoff-ready",
              source: "companion",
              sessionId: displaySessionId.current,
              workbookId: event.data.workbookId,
              handoffSucceeded: succeeded,
            } satisfies DisplayMessage);
          })();
        }
        return;
      }
      if (
        event.data.type === "navigation" &&
        event.data.source === "companion" &&
        event.data.activeCaseId
      ) {
        chooseCase(event.data.activeCaseId);
        return;
      }
      if (
        event.data.type === "handoff-ready" &&
        event.data.source === "companion"
      ) {
        if (!event.data.handoffSucceeded) {
          setError("The companion still has an unsaved answer. Resolve it before returning to one display.");
          return;
        }
        void (async () => {
          await refresh();
          companionWindow.current?.close();
          companionWindow.current = null;
          setDualDisplay(false);
          setNotice("Answers synchronized · one-display mode restored");
        })();
      }
    };
    return () => {
      channel.close();
      displayChannel.current = null;
      displaySessionId.current = "";
    };
    // The channel is intentionally session-lifetime scoped; handlers read mutable
    // workbook/save state through refs rather than recreating the channel per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companionMode]);

  useEffect(
    () => () => {
      if (sidebarOpenTimer.current)
        window.clearTimeout(sidebarOpenTimer.current);
      if (sidebarCloseTimer.current)
        window.clearTimeout(sidebarCloseTimer.current);
      for (const timer of answerSaveTimers.current.values())
        window.clearTimeout(timer);
      answerSaveTimers.current.clear();
    },
    [],
  );

  useEffect(() => {
    const synchronizeConnection = () => setOnline(window.navigator.onLine);
    synchronizeConnection();
    window.addEventListener("online", synchronizeConnection);
    window.addEventListener("offline", synchronizeConnection);
    return () => {
      window.removeEventListener("online", synchronizeConnection);
      window.removeEventListener("offline", synchronizeConnection);
    };
  }, []);

  useEffect(() => {
    const warnUnsaved = (event: BeforeUnloadEvent) => {
      if (!Object.keys(pendingAnswers).length && saveStatus !== "Saving…") return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnUnsaved);
    return () => window.removeEventListener("beforeunload", warnUnsaved);
  }, [pendingAnswers, saveStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAccessibility(initialAccessibility());
      setAccessibilityLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!accessibilityLoaded) return;
    try {
      window.localStorage.setItem(
        "visible-medicine-accessibility-v1",
        JSON.stringify(accessibility),
      );
    } catch {
      // Keep the active in-window preference when device storage is unavailable.
    }
  }, [accessibility, accessibilityLoaded]);

  useEffect(() => {
    function syncAccessibility(event: StorageEvent) {
      if (event.key === "visible-medicine-accessibility-v1" && event.newValue)
        setAccessibility(initialAccessibility());
    }
    window.addEventListener("storage", syncAccessibility);
    return () => window.removeEventListener("storage", syncAccessibility);
  }, []);

  useEffect(() => {
    function keyboardNavigation(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches(
        "input, textarea, select, [contenteditable='true']",
      );
      if (event.key === "Escape") {
        setAccessibilityOpen(false);
        setKeyboardHelpOpen(false);
        return;
      }
      if (editing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        if (!manualMarkups.length) return;
        event.preventDefault();
        undoLastMarkup();
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setAccessibilityOpen(false);
        setKeyboardHelpOpen(true);
        return;
      }
      if (
        !event.altKey ||
        (event.key !== "ArrowLeft" && event.key !== "ArrowRight") ||
        (view !== "teaching" && view !== "exam") ||
        !data
      )
        return;
      event.preventDefault();
      const currentIndex = data.cases.findIndex((item) => item.id === activeCaseId);
      const change = event.key === "ArrowLeft" ? -1 : 1;
      const next = data.cases[Math.max(0, Math.min(data.cases.length - 1, currentIndex + change))];
      if (next) {
        chooseCase(next.id);
        if (companionMode)
          displayChannel.current?.postMessage({
            type: "navigation",
            source: "companion",
            sessionId: displaySessionId.current,
            workbookId: data.course.workbookId,
            activeCaseId: next.id,
          } satisfies DisplayMessage);
      }
    }
    window.addEventListener("keydown", keyboardNavigation);
    return () => window.removeEventListener("keydown", keyboardNavigation);
  }, [activeCaseId, companionMode, data, manualMarkups.length, view]);
  useEffect(() => {
    if (!cine) return;
    const timer = setInterval(
      () => setFrameIndex((value) => (value + 1) % 96),
      250,
    );
    return () => clearInterval(timer);
  }, [cine]);

  useEffect(() => {
    if (
      data?.course.workbookMode !== "assessment" ||
      !["in-progress", "reopened"].includes(data.attempt.state)
    )
      return;
    const synchronizedNow = () => {
      const anchor = serverClockAnchor.current;
      return anchor
        ? anchor.serverTime + (window.performance.now() - anchor.monotonicTime)
        : Date.now();
    };
    const immediate = window.setTimeout(() => setClockNow(synchronizedNow()), 0);
    const timer = window.setInterval(() => setClockNow(synchronizedNow()), 1_000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [data?.attempt.state, data?.course.workbookId, data?.course.workbookMode]);

  const activeCase =
    data?.cases.find((item) => item.id === activeCaseId) ??
    data?.cases[0] ??
    null;
  const activeQuestionAnswer = activeCase
    ? data?.answers.find(
        (answer) => answer.questionId === activeCase.questions[0]?.id,
      )
    : undefined;
  const activeCaseFlag = activeCase
    ? data?.caseFlags.find((flag) => flag.caseId === activeCase.id)
    : undefined;
  const notes = activeCase
    ? (data?.teachingNotes.filter((note) => note.caseId === activeCase.id) ??
      [])
    : [];
  const teachingContentBlocks = activeCase
    ? (data?.teachingContentBlocks.filter(
        (block) => block.caseId === activeCase.id,
      ) ?? [])
    : [];
  const availableSeries = activeCase ? seriesFor(activeCase, mixedAsset) : [];
  const effectiveKind =
    activeCase?.classification === "mixed"
      ? mixedAsset
      : activeCase?.classification;
  const visibleTools =
    activeCase?.tools.filter(
      (tool) =>
        tool !== "asset-switch" &&
        (effectiveKind === "pathology"
          ? !["window-level", "cine", "crosshair"].includes(tool)
          : tool !== "overview"),
    ) ?? [];
  const radiologyBrightness = clamp(100 + (windowCenter - 50) / 8, 35, 190);
  const radiologyContrast = clamp((350 / windowWidth) * 100, 35, 320);
  const imageFilter = `grayscale(1) brightness(${radiologyBrightness}%) contrast(${radiologyContrast}%)${inverted ? " invert(1)" : ""}`;
  const pathologyZoom = effectiveKind === "pathology" ? clamp(zoom, 2, 40) : 20;
  const pathologyScale = 0.7 + pathologyZoom / 32;
  const calculatedExamTime =
    data?.course.workbookMode === "assessment" && data.attempt.preflightPassedAt
      ? remainingAttemptSeconds(data.attempt.deadlineAt, new Date(clockNow))
      : null;
  const maximumExamTime = data
    ? (data.course.durationMinutes + data.attempt.accommodationMinutes) * 60
    : 0;
  const remainingExamTime = calculatedExamTime === null
    ? null
    : Math.min(calculatedExamTime, maximumExamTime);
  const editable = data
    ? ["in-progress", "reopened"].includes(data.attempt.state) &&
      (data.course.workbookMode !== "assessment" ||
        (Boolean(data.attempt.preflightPassedAt) &&
          remainingExamTime !== null &&
          remainingExamTime > 0))
    : false;
  const pendingAnswerCount = data
    ? Object.values(pendingAnswers).filter(
        (draft) => draft.workbookId === data.course.workbookId,
      ).length
    : 0;
  useEffect(() => {
    if (
      !data ||
      data.course.workbookMode !== "assessment" ||
      !data.attempt.preflightPassedAt ||
      !["in-progress", "reopened"].includes(data.attempt.state) ||
      remainingExamTime === null ||
      !online
    )
      return;
    const workbookId = data.course.workbookId;
    const attemptId = data.attempt.id;
    if (
      remainingExamTime > 0 &&
      remainingExamTime <= 2 &&
      pendingAnswerCount > 0 &&
      !deadlineFlushes.current.has(attemptId)
    ) {
      deadlineFlushes.current.add(attemptId);
      void flushPendingAnswers(workbookId);
      return;
    }
    if (
      remainingExamTime !== 0 ||
      deadlineFinalizations.current.has(attemptId)
    )
      return;
    deadlineFinalizations.current.add(attemptId);
    void (async () => {
      const inFlight = Array.from(answerSaveChains.current.entries())
        .filter(([key]) => key.startsWith(`${workbookId}::`))
        .map(([, task]) => task);
      await Promise.allSettled(inFlight);
      let excludedDrafts = 0;
      for (const [key, draft] of pendingAnswersRef.current.entries()) {
        if (draft.workbookId !== workbookId) continue;
        const timer = answerSaveTimers.current.get(key);
        if (timer) window.clearTimeout(timer);
        answerSaveTimers.current.delete(key);
        pendingAnswersRef.current.delete(key);
        excludedDrafts += 1;
      }
      syncPendingAnswers();
      if (excludedDrafts)
        setSaveStatus(
          `Time expired · ${excludedDrafts} unsent edit${excludedDrafts === 1 ? "" : "s"} excluded from the receipt`,
        );
      const finalized = await postAction(
        { action: "finalize-timed-attempt" },
        "Time expired · saved answers submitted for marking",
      );
      if (!finalized) deadlineFinalizations.current.delete(attemptId);
    })();
    // The countdown, connection and pending count are the deadline synchronization inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data?.attempt.id,
    data?.attempt.preflightPassedAt,
    data?.attempt.state,
    data?.course.workbookId,
    data?.course.workbookMode,
    online,
    pendingAnswerCount,
    remainingExamTime,
  ]);
  const teachingWorkbook = data?.workbooks.find(
    (workbook) =>
      workbook.id === data.course.workbookId && workbook.mode === "teaching",
  ) ?? data?.workbooks.find(
    (workbook) =>
      workbook.mode === "teaching" && workbook.status === "published",
  );

  async function educationRequest<T>(
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: options?.body
        ? { "Content-Type": "application/json", ...(options.headers ?? {}) }
        : options?.headers,
    });
    const payload = (await response.json()) as T & { error?: string };
    if (!response.ok)
      throw new Error(
        payload.error || "The saved-view request could not be completed.",
      );
    return payload;
  }

  async function loadSavedViews(caseId: string, context: "teaching" | "exam") {
    const mayUseBookmarks = Boolean(
      data?.currentUser.roles.includes("learner"),
    );
    const [presentationResult, bookmarkResult] = await Promise.allSettled([
      educationRequest<PresentationBundle>(
        `/api/education/cases/${encodeURIComponent(caseId)}/presentations?context=${context}&workbookId=${encodeURIComponent(data?.course.workbookId ?? "")}`,
      ),
      mayUseBookmarks
        ? educationRequest<{ bookmarks: LearnerBookmark[] }>(
            `/api/education/learner/bookmarks?caseId=${encodeURIComponent(caseId)}`,
          )
        : Promise.resolve({ bookmarks: [] }),
    ]);
    if (presentationResult.status === "fulfilled")
      setPresentations(presentationResult.value.presentations);
    else setPresentations([]);
    if (bookmarkResult.status === "fulfilled")
      setBookmarks(bookmarkResult.value.bookmarks);
    else setBookmarks([]);
    const failed = [presentationResult, bookmarkResult].find(
      (result) => result.status === "rejected",
    );
    if (failed?.status === "rejected")
      setError(
        failed.reason instanceof Error
          ? failed.reason.message
          : "Some saved views are unavailable.",
      );
  }

  useEffect(() => {
    if (!activeCase || (view !== "teaching" && view !== "exam")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSavedViews(activeCase.id, view);
    // The scoped APIs are the authoritative synchronization source for saved scenes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCase?.id, view]);

  useEffect(() => {
    if (view !== "teaching" || !teachingWorkbook || !activeCase) return;
    const workbookId = teachingWorkbook.id;
    const caseId = activeCase.id;
    let active = true;
    let timer: number | undefined;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | null = null;
    let consecutiveFailures = 0;
    function schedule(delay: number) {
      if (!active || socket?.readyState === WebSocket.OPEN) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => void synchronizeLiveTeaching(), delay);
    }
    async function synchronizeLiveTeaching() {
      if (document.hidden) return;
      try {
        const result = await educationRequest<TeachingLiveState>(
          `/api/education/teaching-live-state?caseId=${encodeURIComponent(caseId)}&workbookId=${encodeURIComponent(workbookId)}`,
        );
        consecutiveFailures = 0;
        if (active) {
          setPollBundle(result.polls);
          setTeachingSession(result.session);
        }
      } catch (liveStateError) {
        consecutiveFailures += 1;
        if (active && consecutiveFailures >= 2)
          setError(
            liveStateError instanceof Error
              ? liveStateError.message
              : "Live teaching state is temporarily unavailable.",
          );
      } finally {
        if (!document.hidden && socket?.readyState !== WebSocket.OPEN)
          schedule(liveRefreshDelay(consecutiveFailures));
      }
    }
    function connectLiveNotifications() {
      if (!active || document.hidden || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING)
        return;
      const url = new URL("/api/education/teaching-live", window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("workbookId", workbookId);
      socket = new WebSocket(url);
      socket.addEventListener("open", () => {
        consecutiveFailures = 0;
        if (timer) window.clearTimeout(timer);
      });
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as {
            type?: string;
            workbookId?: string;
          };
          if (
            active &&
            message.workbookId === workbookId &&
            (message.type === "refresh" || message.type === "ready")
          )
            void synchronizeLiveTeaching();
        } catch {
          // Ignore malformed notification frames and retain authoritative polling.
        }
      });
      socket.addEventListener("close", () => {
        socket = null;
        if (!active || document.hidden) return;
        schedule(liveRefreshDelay(consecutiveFailures));
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(
          connectLiveNotifications,
          liveRefreshDelay(Math.max(1, consecutiveFailures)),
        );
      });
      socket.addEventListener("error", () => socket?.close());
    }
    function visibilityChanged() {
      if (!active || document.visibilityState === "hidden") {
        if (timer) window.clearTimeout(timer);
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        socket?.close(1000, "Teaching workspace hidden");
        return;
      }
      consecutiveFailures = 0;
      connectLiveNotifications();
      void synchronizeLiveTeaching();
    }
    connectLiveNotifications();
    void synchronizeLiveTeaching();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close(1000, "Teaching workspace changed");
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCase?.id, teachingWorkbook?.id, view]);

  useEffect(() => {
    const session = teachingSession.session;
    if (
      view !== "teaching" ||
      !teachingWorkbook ||
      !session ||
      !teachingSession.permissions.follow ||
      teachingSession.permissions.manage
    )
      return;
    async function heartbeat() {
      if (document.visibilityState === "hidden") return;
      try {
        const result = await educationRequest<TeachingSessionBundle>(
          "/api/education/teaching-sessions",
          {
            method: "POST",
            body: JSON.stringify({
              action: "heartbeat",
              workbookId: teachingWorkbook!.id,
              sessionId: session!.id,
              followState:
                teachingSession.participant?.followState ?? "following",
              currentCaseId: activeCaseId || session!.activeCaseId,
            }),
          },
        );
        setTeachingSession(result);
      } catch {
        // The combined authoritative read will recover transient heartbeat failures.
      }
    }
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 5000);
    function visibilityChanged() {
      if (document.visibilityState === "visible") void heartbeat();
    }
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    teachingSession.session?.id,
    teachingSession.participant?.followState,
    teachingSession.permissions.follow,
    teachingSession.permissions.manage,
    teachingWorkbook?.id,
    view,
  ]);

  useEffect(() => {
    const session = teachingSession.session;
    if (
      view !== "teaching" ||
      !session ||
      teachingSession.permissions.manage ||
      teachingSession.participant?.followState === "exploring"
    )
      return;
    const timer = window.setTimeout(() => {
      chooseCase(session.activeCaseId);
      setActiveSeries(session.viewerState.activeSeries);
      setFrameIndex(session.viewerState.frameIndex);
      setZoom(session.viewerState.zoom);
      setMixedAsset(session.viewerState.mixedAsset);
      setActivePlane(session.viewerState.activePlane);
      setTriPlanar(session.viewerState.triPlanar);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    teachingSession.session?.updatedAt,
    teachingSession.participant?.followState,
    teachingSession.permissions.manage,
    view,
  ]);

  useEffect(() => {
    const session = teachingSession.session;
    if (
      view !== "teaching" ||
      !teachingWorkbook ||
      !activeCase ||
      !session ||
      !teachingSession.permissions.manage ||
      session.instructorId !== data?.currentUser.id
    )
      return;
    const viewerState = currentTeachingViewerState();
    const signature = JSON.stringify({ caseId: activeCase.id, viewerState });
    if (publishedSessionSignature.current === signature) return;
    const expectedVersion = session.version;
    const timer = window.setTimeout(async () => {
      publishedSessionSignature.current = signature;
      try {
        const result = await educationRequest<TeachingSessionBundle>(
          "/api/education/teaching-sessions",
          {
            method: "POST",
            body: JSON.stringify({
              action: "update",
              workbookId: teachingWorkbook.id,
              sessionId: session.id,
              caseId: activeCase.id,
              viewerState,
              activeSceneIndex: null,
              expectedVersion,
            }),
          },
        );
        setTeachingSession(result);
      } catch {
        publishedSessionSignature.current = "";
      }
    }, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeCase?.id,
    activePlane,
    activeSeries,
    frameIndex,
    mixedAsset,
    teachingSession.permissions.manage,
    teachingSession.session?.id,
    teachingSession.session?.version,
    teachingWorkbook?.id,
    triPlanar,
    view,
    zoom,
  ]);

  useEffect(() => {
    if (
      companionMode ||
      !displayChannel.current ||
      (view !== "exam" && view !== "teaching")
    )
      return;
    displayChannel.current.postMessage({
      type: "workspace-state",
      source: "main",
      sessionId: displaySessionId.current,
      workbookId: data?.course.workbookId,
      view,
      activeCaseId,
      mixedAsset,
      frameIndex,
      revealNote: view === "teaching" ? revealNote : false,
    } satisfies DisplayMessage);
  }, [
    activeCaseId,
    companionMode,
    frameIndex,
    mixedAsset,
    revealNote,
    view,
    data?.course.workbookId,
  ]);

  useEffect(() => {
    // Case changes intentionally reset the coupled viewer controls to modality-safe defaults.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSeries(availableSeries[0]?.id || "");
    setRevealNote(false);
    setFrameIndex(effectiveKind === "pathology" ? 0 : 42);
    setZoom(effectiveKind === "pathology" ? 20 : 112);
    setActiveTool(
      effectiveKind === "pathology" ? "pan" : "window-level",
    );
    setActivePlane("axial");
    setTriPlanar(false);
    setFourUp(false);
    setCine(false);
    setWindowPreset("soft");
    setWindowCenter(50);
    setWindowWidth(350);
    setInverted(false);
    setPanOffset({ x: 0, y: 0 });
    setLineThickness(2.25);
    setManualMarkups([]);
    setSelectedMarkupId("");
    setPendingTextAnnotation(null);
    viewerDrag.current = null;
    setLocalizerPoint(null);
    setLocalizerProjections([]);
    setRestoredScene(null);
  }, [activeCaseId, mixedAsset]); // eslint-disable-line react-hooks/exhaustive-deps

  async function postAction(payload: ActionPayload, successMessage: string) {
    const requestWorkbookId = data?.course.workbookId ?? "";
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          selectedWorkbookId: data?.course.workbookId ?? null,
        }),
      });
      const body = (await response.json()) as AppSnapshot & { error?: string };
      if (!response.ok)
        throw new Error(body.error || "The action could not be completed.");
      if (
        currentWorkbookId.current &&
        currentWorkbookId.current !== requestWorkbookId
      )
        return body;
      registerAnswerRevisions(body);
      synchronizeServerClock(body.serverTime);
      currentWorkbookId.current = body.course.workbookId;
      setData(body);
      const serverAnswers = Object.fromEntries(
        body.answers.map((answer) => [answer.questionId, answer.response]),
      );
      for (const draft of pendingAnswersRef.current.values())
        if (draft.workbookId === body.course.workbookId)
          serverAnswers[draft.questionId] = draft.response;
      setAnswers(serverAnswers);
      setExamPreflightPassed(Boolean(body.attempt.preflightPassedAt));
      setNotice(successMessage);
      setTimeout(() => setNotice(""), 3500);
      return body;
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The action could not be completed.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveAnswerDraft(draft: PendingAnswerDraft): Promise<boolean> {
    const key = answerDraftKey(draft.workbookId, draft.questionId);
    if (!window.navigator.onLine) return false;
    try {
      const response = await fetch("/api/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-answer",
          selectedWorkbookId: draft.workbookId,
          questionId: draft.questionId,
          response: draft.response,
          expectedRevision: answerRevisions.current.get(key) ?? 0,
        }),
      });
      const body = (await response.json()) as AppSnapshot & { error?: string };
      if (!response.ok)
        throw new Error(body.error || "The answer could not be saved.");
      synchronizeServerClock(body.serverTime);

      const savedAnswer = body.answers.find(
        (answer) => answer.questionId === draft.questionId,
      );
      if (savedAnswer) answerRevisions.current.set(key, savedAnswer.revision);
      clearPendingAnswerIfCurrent(draft);

      if (currentWorkbookId.current === draft.workbookId && savedAnswer) {
        setData((current) => {
          if (!current || current.course.workbookId !== draft.workbookId)
            return current;
          const present = current.answers.some(
            (answer) => answer.questionId === savedAnswer.questionId,
          );
          return {
            ...current,
            serverTime: body.serverTime,
            attempt: body.attempt,
            answers: present
              ? current.answers.map((answer) =>
                  answer.questionId === savedAnswer.questionId
                    ? savedAnswer
                    : answer,
                )
              : [...current.answers, savedAnswer],
          };
        });
        setExamPreflightPassed(Boolean(body.attempt.preflightPassedAt));
      }
      const remaining = Array.from(pendingAnswersRef.current.values()).filter(
        (item) => item.workbookId === draft.workbookId,
      ).length;
      setSaveStatus(
        remaining
          ? `${remaining} answer${remaining === 1 ? "" : "s"} pending`
          : "Saved to attempt",
      );
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The answer could not be saved.",
      );
      setSaveStatus("Save needs attention · retry pending");
      return false;
    }
  }

  function enqueueAnswerSave(draft: PendingAnswerDraft) {
    const key = answerDraftKey(draft.workbookId, draft.questionId);
    const currentTask = answerSaveChains.current.get(key);
    if (
      currentTask &&
      answerQueuedGenerations.current.get(key) === draft.generation
    )
      return currentTask;

    const previous = currentTask ?? Promise.resolve(true);
    const task = previous
      .catch(() => false)
      .then(() => saveAnswerDraft(draft));
    answerSaveChains.current.set(key, task);
    answerQueuedGenerations.current.set(key, draft.generation);
    void task.finally(() => {
      if (answerSaveChains.current.get(key) !== task) return;
      answerSaveChains.current.delete(key);
      answerQueuedGenerations.current.delete(key);
    });
    return task;
  }

  function scheduleAnswerSave(draft: PendingAnswerDraft) {
    const key = answerDraftKey(draft.workbookId, draft.questionId);
    const existing = answerSaveTimers.current.get(key);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      answerSaveTimers.current.delete(key);
      if (!window.navigator.onLine) {
        const count = Array.from(pendingAnswersRef.current.values()).filter(
          (item) => item.workbookId === draft.workbookId,
        ).length;
        setSaveStatus(
          `Offline · ${count} answer${count === 1 ? "" : "s"} pending in this window`,
        );
        return;
      }
      setSaveStatus("Saving to attempt…");
      void enqueueAnswerSave(draft);
    }, 900);
    answerSaveTimers.current.set(key, timer);
  }

  function changeAnswer(questionId: string, value: string) {
    if (!data) return;
    const draft = {
      workbookId: data.course.workbookId,
      questionId,
      response: value,
      generation: ++answerDraftGeneration.current,
    };
    setAnswers((current) => ({ ...current, [questionId]: value }));
    rememberPendingAnswer(draft);
    setSaveStatus(window.navigator.onLine ? "Saving…" : "Offline · answer pending");
    scheduleAnswerSave(draft);
  }

  async function flushPendingAnswers(workbookId: string) {
    const drafts = Array.from(pendingAnswersRef.current.values()).filter(
      (draft) => draft.workbookId === workbookId,
    );
    const existingTasks = Array.from(answerSaveChains.current.entries())
      .filter(([key]) => key.startsWith(`${workbookId}::`))
      .map(([, task]) => task);
    if (!drafts.length && !existingTasks.length) return true;
    if (!window.navigator.onLine && drafts.length) {
      setError("Reconnect before leaving or submitting so every answer can be saved.");
      setSaveStatus("Offline · answers still pending");
      return false;
    }
    for (const draft of drafts) {
      const key = answerDraftKey(draft.workbookId, draft.questionId);
      const timer = answerSaveTimers.current.get(key);
      if (timer) window.clearTimeout(timer);
      answerSaveTimers.current.delete(key);
    }
    setSaveStatus("Saving all answers…");
    for (const draft of drafts) enqueueAnswerSave(draft);
    const activeTasks = Array.from(answerSaveChains.current.entries())
      .filter(([key]) => key.startsWith(`${workbookId}::`))
      .map(([, task]) => task);
    const results = await Promise.all([...new Set([...existingTasks, ...activeTasks])]);
    await Promise.resolve();
    const stillPending = Array.from(pendingAnswersRef.current.values()).some(
      (draft) => draft.workbookId === workbookId,
    );
    const stillSaving = Array.from(answerSaveChains.current.keys()).some((key) =>
      key.startsWith(`${workbookId}::`),
    );
    if (results.every(Boolean) && !stillPending && !stillSaving) {
      setSaveStatus("All answers saved");
      return true;
    }
    setError("At least one answer is still pending. Resolve the save issue before continuing.");
    return false;
  }

  useEffect(() => {
    if (!online || !pendingAnswersRef.current.size) return;
    const retry = window.setTimeout(() => {
      setSaveStatus("Connection restored · saving answers…");
      for (const draft of pendingAnswersRef.current.values())
        void enqueueAnswerSave(draft);
    }, 250);
    return () => window.clearTimeout(retry);
    // Connectivity is the trigger; refs hold the latest pending drafts without retry-loop churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  function chooseCase(caseId: string) {
    setActiveCaseId(caseId);
    setMixedAsset("radiology");
  }

  function setViewerLayout(layout: ViewerLayout) {
    setTriPlanar(layout === "mpr");
    setFourUp(layout === "2x2");
    if (layout === "mpr") {
      setCine(false);
      setNotice("Tri-planar teaching layout enabled");
    } else if (layout === "2x2") {
      setCine(false);
      setNotice("2 × 2 comparison layout enabled");
    } else setNotice("Single viewport layout enabled");
  }

  function undoLastMarkup() {
    setManualMarkups((current) => current.slice(0, -1));
    setSelectedMarkupId("");
    setNotice("Last viewer annotation removed");
  }

  function applyWindowPreset(preset: Exclude<WindowPreset, "custom">) {
    const next = WINDOW_PRESETS[preset];
    setWindowPreset(preset);
    setWindowCenter(next.center);
    setWindowWidth(next.width);
    setNotice(`${statusLabel(preset)} window applied · W ${next.width} · L ${next.center}`);
  }

  function activateViewerTool(tool: string) {
    setError("");
    if (tool === "cine") {
      setActiveTool("cine");
      setCine((current) => !current);
      setNotice(cine ? "Cine playback paused" : "Cine playback started");
      return;
    }
    if (tool === "crosshair") {
      setActiveTool("crosshair");
      setViewerLayout("mpr");
      setNotice("Localizer ready · select a point in a compatible teaching plane");
      return;
    }
    if (tool === "layouts") {
      const order: ViewerLayout[] =
        effectiveKind === "pathology" ? ["1x1", "2x2"] : ["1x1", "mpr", "2x2"];
      const next = order[(order.indexOf(viewerLayout) + 1) % order.length];
      setActiveTool("layouts");
      setViewerLayout(next);
      return;
    }
    if (tool === "overview") {
      setActiveTool("overview");
      setZoom(2);
      setPanOffset({ x: 0, y: 0 });
      setTriPlanar(false);
      setFourUp(false);
      setNotice("Whole-slide overview restored");
      return;
    }
    setActiveTool(tool);
    setCine(false);
    setNotice(`${TOOL_LABELS[tool] || statusLabel(tool)} tool ready`);
  }

  function resetViewer() {
    const pathology = effectiveKind === "pathology";
    setFrameIndex(pathology ? 0 : 42);
    setZoom(pathology ? 20 : 112);
    setCine(false);
    setViewerLayout("1x1");
    setWindowPreset("soft");
    setWindowCenter(50);
    setWindowWidth(350);
    setInverted(false);
    setPanOffset({ x: 0, y: 0 });
    setLineThickness(2.25);
    setManualMarkups([]);
    setSelectedMarkupId("");
    setActiveTool(pathology ? "pan" : "window-level");
    setLocalizerPoint(null);
    setLocalizerProjections([]);
    setRestoredScene(null);
    viewerDrag.current = null;
    setNotice("Viewer reset to the modality-safe default");
  }

  function viewportPoint(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function beginViewerInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, input, select, .navigator")) return;
    const point = viewportPoint(event);
    if (activeTool === "text") {
      setPendingTextAnnotation(point);
      return;
    }
    if (activeTool === "select") {
      const nearest = [...manualMarkups]
        .reverse()
        .find((markup) => Math.hypot(markup.x2 - point.x, markup.y2 - point.y) <= 12);
      setSelectedMarkupId(nearest?.id ?? "");
      setNotice(nearest ? "Annotation selected" : "Selection cleared");
      return;
    }
    let markupId: string | undefined;
    const markupKind =
      activeTool === "measure"
        ? "length"
        : activeTool === "annotate"
          ? "arrow"
          : activeTool === "circle"
            ? "circle"
            : null;
    if (markupKind) {
      markupId = crypto.randomUUID();
      setManualMarkups((current) => [
        ...current,
        {
          id: markupId!,
          kind: markupKind,
          label: markupKind === "length" ? "Measurement" : markupKind === "circle" ? "Circle ROI" : "Arrow",
          x1: point.x,
          y1: point.y,
          x2: point.x,
          y2: point.y,
          lineWidth: lineThickness,
        } as ManualMarkup,
      ].slice(-100));
      setSelectedMarkupId(markupId);
    } else if (!["window-level", "zoom", "pan"].includes(activeTool)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    viewerDrag.current = {
      pointerId: event.pointerId,
      tool: activeTool,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: point.x,
      startY: point.y,
      initialZoom: zoom,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
      initialWindowCenter: windowCenter,
      initialWindowWidth: windowWidth,
      markupId,
    };
  }

  function moveViewerInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = viewerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (drag.tool === "window-level") {
      setWindowPreset("custom");
      setWindowWidth(Math.round(clamp(drag.initialWindowWidth + dx * 4, 1, 4_000)));
      setWindowCenter(Math.round(clamp(drag.initialWindowCenter - dy * 2, -1_500, 1_500)));
    } else if (drag.tool === "zoom") {
      const maximum = effectiveKind === "pathology" ? 40 : 300;
      const minimum = effectiveKind === "pathology" ? 2 : 50;
      setZoom(Math.round(clamp(drag.initialZoom - dy * (effectiveKind === "pathology" ? 0.15 : 0.6), minimum, maximum)));
    } else if (drag.tool === "pan") {
      setPanOffset({ x: drag.initialPanX + dx, y: drag.initialPanY + dy });
    } else if (drag.markupId) {
      const point = viewportPoint(event);
      setManualMarkups((current) =>
        current.map((markup) =>
          markup.id === drag.markupId ? { ...markup, x2: point.x, y2: point.y } : markup,
        ),
      );
    }
  }

  function endViewerInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = viewerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    viewerDrag.current = null;
    if (drag.tool === "window-level")
      setNotice("Custom window/level applied");
    else if (drag.tool === "zoom") setNotice("Viewport zoom updated");
    else if (drag.tool === "pan") setNotice("Viewport position updated");
    else if (drag.markupId) setNotice(`${TOOL_LABELS[drag.tool] || statusLabel(drag.tool)} annotation added`);
  }

  function handleViewerWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (triPlanar) return;
    event.preventDefault();
    if (effectiveKind === "pathology" || event.ctrlKey || activeTool === "zoom") {
      const step = effectiveKind === "pathology" ? 2 : 10;
      const minimum = effectiveKind === "pathology" ? 2 : 50;
      const maximum = effectiveKind === "pathology" ? 40 : 300;
      setZoom((current) => clamp(current + (event.deltaY < 0 ? step : -step), minimum, maximum));
      return;
    }
    setFrameIndex((current) => clamp(current + (event.deltaY > 0 ? 1 : -1), 0, 95));
  }

  useEffect(() => {
    if (!data || !activeCaseId || !data.currentUser.roles.includes("learner")) return;
    const key = `${data.course.workbookId}:${activeCaseId}`;
    if (progressRecorded.current.has(key)) return;
    progressRecorded.current.add(key);
    void fetch("/api/app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record-workbook-progress", selectedWorkbookId: data.course.workbookId, caseId: activeCaseId }),
    }).then((response) => {
      if (!response.ok) progressRecorded.current.delete(key);
    }).catch(() => progressRecorded.current.delete(key));
  }, [activeCaseId, data]);

  async function chooseWorkbook(
    workbookId: string,
    nextView?: "teaching" | "exam",
    targetCaseId?: string,
  ) {
    if (!data || workbookId === data.course.workbookId) {
      if (targetCaseId) chooseCase(targetCaseId);
      if (nextView) setView(nextView);
      return;
    }
    if (dualDisplay) {
      setError("Return to one display before changing workbooks.");
      return;
    }
    if (!(await flushPendingAnswers(data.course.workbookId))) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/app?workbookId=${encodeURIComponent(workbookId)}`,
        { cache: "no-store" },
      );
      const body = (await response.json()) as AppSnapshot & { error?: string };
      if (!response.ok)
        throw new Error(body.error || "The workbook could not be opened.");
      registerAnswerRevisions(body);
      currentWorkbookId.current = body.course.workbookId;
      setData(body);
      setAnswers(
        Object.fromEntries(
          body.answers.map((answer) => [answer.questionId, answer.response]),
        ),
      );
      setActiveCaseId(
        targetCaseId && body.cases.some((item) => item.id === targetCaseId)
          ? targetCaseId
          : (body.cases[0]?.id ?? ""),
      );
      setExamPreflightPassed(Boolean(body.attempt.preflightPassedAt));
      setView(
        nextView ??
          (body.course.workbookMode === "assessment" ? "exam" : "teaching"),
      );
      const url = new URL(window.location.href);
      url.searchParams.set("workbook", workbookId);
      if (targetCaseId) url.searchParams.set("case", targetCaseId);
      else url.searchParams.delete("case");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      setNotice(`${body.course.workbookTitle} opened`);
      setTimeout(() => setNotice(""), 2500);
    } catch (workbookError) {
      setError(
        workbookError instanceof Error
          ? workbookError.message
          : "The workbook could not be opened.",
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseWorkspaceView(next: WorkspaceView) {
    if (dualDisplay && next !== view) {
      setError("Return to one display before changing workspaces.");
      return;
    }
    if (!data || (next !== "teaching" && next !== "exam")) {
      setView(next);
      return;
    }
    const targetMode = next === "exam" ? "assessment" : "teaching";
    if (data.course.workbookMode === targetMode) {
      setView(next);
      return;
    }
    const target = data.accessibleWorkbooks.find(
      (workbook) => workbook.mode === targetMode && workbook.available,
    );
    if (!target) {
      setError(`No allocated ${next} workbook is available to this account.`);
      return;
    }
    void chooseWorkbook(target.id, next);
  }

  function currentTeachingViewerState(): TeachingViewerState {
    return {
      activeSeries,
      frameIndex,
      zoom,
      mixedAsset,
      activePlane,
      triPlanar,
    };
  }

  function projectionFor(plane: ImagePlane) {
    return localizerProjections.find(
      (projection) => projection.plane === plane,
    );
  }

  async function placeLocalizer(plane: ImagePlane, x: number, y: number) {
    if (!activeCase || activeCase.viewerManifest.kind === "wsi") return;
    const source = activeCase.viewerManifest.series.find(
      (series) => series.plane === plane,
    );
    if (!source) {
      setError(
        "Series cannot be spatially linked: the requested teaching plane is unavailable.",
      );
      return;
    }
    setSavedViewBusy(true);
    setError("");
    try {
      const sourceSliceIndex =
        projectionFor(plane)?.sliceIndex ??
        (plane === "axial" ? frameIndex : 48);
      const result = await educationRequest<{
        patientPoint: PatientPoint;
        mapped: LocalizerProjection[];
      }>(
        `/api/education/cases/${encodeURIComponent(activeCase.id)}/localizer`,
        {
          method: "POST",
          body: JSON.stringify({
            sourceSeriesInstanceUid: source.seriesInstanceUid,
            sourceSopInstanceUid:
              source.sopInstanceUids[
                Math.max(
                  0,
                  Math.min(source.sopInstanceUids.length - 1, sourceSliceIndex),
                )
              ],
            sourceSliceIndex,
            x,
            y,
            targetSeriesInstanceUids: activeCase.viewerManifest.series
              .filter((series) => series.plane !== "slide")
              .map((series) => series.seriesInstanceUid),
          }),
        },
      );
      setLocalizerPoint(result.patientPoint);
      setLocalizerProjections(result.mapped);
      setTriPlanar(true);
      setFourUp(false);
      setActiveTool("crosshair");
      const axial = result.mapped.find(
        (projection) => projection.plane === "axial",
      );
      if (axial) setFrameIndex(axial.sliceIndex);
      setNotice(
        "Patient-space localizer synchronized across compatible teaching planes",
      );
    } catch (localizerError) {
      setError(
        localizerError instanceof Error
          ? localizerError.message
          : "Series cannot be spatially linked.",
      );
    } finally {
      setSavedViewBusy(false);
    }
  }

  function currentViewerScene(
    includeInstructorNotes: boolean,
  ): ViewerScene | null {
    if (!activeCase || !data) return null;
    const manifest = activeCase.viewerManifest;
    const selectedSeries =
      fourUp && activeCase.classification === "mixed"
        ? manifest.series.slice(0, 4)
        : effectiveKind === "pathology"
        ? manifest.series
            .filter((series) => series.plane === "slide")
            .slice(0, fourUp ? 4 : 1)
        : fourUp
          ? manifest.series.filter((series) => series.plane !== "slide").slice(0, 4)
          : triPlanar
          ? manifest.series.filter((series) => series.plane !== "slide")
          : manifest.series
              .filter((series) => series.plane === activePlane)
              .slice(0, 1);
    if (!selectedSeries.length) return null;
    const viewports = selectedSeries.map((series, order) => {
      const projected =
        series.plane === "slide"
          ? null
          : projectionFor(series.plane as ImagePlane);
      const sliceIndex =
        series.plane === "slide" ? 0 : (projected?.sliceIndex ?? frameIndex);
      return {
        id: `viewport-${series.plane}`,
        order,
        studyInstanceUid: series.studyInstanceUid,
        seriesInstanceUid: series.seriesInstanceUid,
        sopInstanceUid:
          series.sopInstanceUids[
            Math.max(0, Math.min(series.sopInstanceUids.length - 1, sliceIndex))
          ],
        frame: 0,
        sliceIndex,
        plane: series.plane,
        windowCenter: series.plane === "slide" ? null : windowCenter,
        windowWidth: series.plane === "slide" ? null : windowWidth,
        zoom: series.plane === "slide" ? pathologyZoom : zoom / 100,
        panX: panOffset.x,
        panY: panOffset.y,
      };
    });
    return {
      schema: "didanix-education-viewer-scene-v1",
      layout:
        fourUp
          ? { rows: 2, columns: 2 }
          : triPlanar && manifest.kind !== "wsi"
          ? { rows: 1, columns: 3 }
          : { rows: 1, columns: 1 },
      viewports,
      crosshairPatient: localizerPoint,
      annotationVisibility: "visible",
      annotations: [
        ...data.annotations
          .filter((annotation) => annotation.caseId === activeCase.id)
          .map((annotation) => ({
            id: annotation.id,
            kind:
              annotation.kind === "text"
                ? ("text" as const)
                : annotation.kind === "measure"
                  ? ("measurement" as const)
                  : ("arrow" as const),
            label: annotation.label,
            visible: true,
            answerBearing: false,
            points: [
              Number(annotation.geometry.x ?? 0) * 100,
              Number(annotation.geometry.y ?? 0) * 100,
            ],
          })),
        ...manualMarkups.map((markup) => ({
          id: markup.id,
          kind:
            markup.kind === "text"
              ? ("text" as const)
              : markup.kind === "arrow"
                ? ("arrow" as const)
                : ("measurement" as const),
          label: markup.label,
          visible: true,
          answerBearing: false,
          points: [markup.x1, markup.y1, markup.x2, markup.y2],
        })),
      ].slice(-100),
      instructorNotes: includeInstructorNotes ? (notes[0]?.body ?? "") : "",
    };
  }

  async function saveInstructorScene() {
    if (!activeCase || (view !== "teaching" && view !== "exam")) return;
    const scene = currentViewerScene(true);
    if (!scene) return;
    const existing = presentations[0];
    if (existing?.scenes.length === 24) {
      setError(
        "This instructor presentation already contains the maximum 24 scenes.",
      );
      return;
    }
    setSavedViewBusy(true);
    setError("");
    try {
      const body = existing
        ? {
            eventId: crypto.randomUUID(),
            expectedVersion: existing.version,
            presentationId: existing.id,
            title: existing.title,
            visibilityPolicy: existing.visibilityPolicy,
            scenes: [...existing.scenes, scene],
          }
        : {
            eventId: crypto.randomUUID(),
            expectedVersion: 0,
            presentationId: crypto.randomUUID(),
            title: `${activeCase.title} walkthrough`,
            visibilityPolicy:
              view === "exam" ? "after-results" : "teaching-only",
            scenes: [scene],
          };
      await educationRequest(
        `/api/education/cases/${encodeURIComponent(activeCase.id)}/presentations${existing ? `/${existing.id}` : ""}`,
        { method: existing ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      await loadSavedViews(activeCase.id, view);
      setNotice(
        existing
          ? "Instructor scene appended with immutable history"
          : "Instructor presentation created",
      );
    } catch (savedViewError) {
      setError(
        savedViewError instanceof Error
          ? savedViewError.message
          : "Instructor scene could not be saved.",
      );
    } finally {
      setSavedViewBusy(false);
    }
  }

  async function saveLearnerBookmark() {
    if (!activeCase || (view !== "teaching" && view !== "exam")) return;
    const scene = currentViewerScene(false);
    if (!scene) return;
    setSavedViewBusy(true);
    setError("");
    try {
      await educationRequest(`/api/education/learner/bookmarks`, {
        method: "POST",
        body: JSON.stringify({
          eventId: crypto.randomUUID(),
          expectedVersion: 0,
          bookmarkId: crypto.randomUUID(),
          caseId: activeCase.id,
          title: `${activeCase.title} · ${scene.viewports[0].plane} ${scene.viewports[0].sliceIndex + 1}`,
          scene,
        }),
      });
      await loadSavedViews(activeCase.id, view);
      setNotice("Private learner bookmark saved");
    } catch (savedViewError) {
      setError(
        savedViewError instanceof Error
          ? savedViewError.message
          : "Learner bookmark could not be saved.",
      );
    } finally {
      setSavedViewBusy(false);
    }
  }

  async function restoreViewerScene(scene: ViewerScene) {
    if (!activeCase) return;
    const first = [...scene.viewports].sort((a, b) => a.order - b.order)[0];
    if (!first) return;
    setRestoredScene(scene);
    setActivePlane(first.plane === "slide" ? "axial" : first.plane);
    setFrameIndex(first.sliceIndex);
    setZoom(
      first.plane === "slide" ? first.zoom : Math.round(first.zoom * 100),
    );
    setTriPlanar(scene.layout.rows === 1 && scene.layout.columns === 3 && first.plane !== "slide");
    setFourUp(scene.layout.rows === 2 && scene.layout.columns === 2);
    if (first.windowCenter !== null) setWindowCenter(first.windowCenter);
    if (first.windowWidth !== null) setWindowWidth(first.windowWidth);
    setWindowPreset(
      first.windowCenter === 50 && first.windowWidth === 350 ? "soft" : "custom",
    );
    setPanOffset({ x: first.panX, y: first.panY });
    setInverted(false);
    setManualMarkups(
      scene.annotations
        .filter((annotation) => annotation.visible)
        .map((annotation) => ({
          id: annotation.id,
          kind:
            annotation.kind === "text"
              ? ("text" as const)
              : annotation.kind === "arrow"
                ? ("arrow" as const)
                : ("length" as const),
          label: annotation.label,
          x1: annotation.points[0] ?? 50,
          y1: annotation.points[1] ?? 50,
          x2: annotation.points[2] ?? annotation.points[0] ?? 50,
          y2: annotation.points[3] ?? annotation.points[1] ?? 50,
          lineWidth: 2.25,
        })),
    );
    setSelectedMarkupId("");
    setLocalizerPoint(scene.crosshairPatient);
    if (scene.crosshairPatient && activeCase.viewerManifest.kind !== "wsi") {
      try {
        const result = await educationRequest<{
          mapped: LocalizerProjection[];
        }>(
          `/api/education/cases/${encodeURIComponent(activeCase.id)}/localizer`,
          {
            method: "POST",
            body: JSON.stringify({
              sourceFrameOfReferenceUid: first.seriesInstanceUid
                ? activeCase.viewerManifest.series.find(
                    (series) =>
                      series.seriesInstanceUid === first.seriesInstanceUid,
                  )?.frameOfReferenceUid
                : "",
              patientPoint: scene.crosshairPatient,
              targetSeriesInstanceUids: activeCase.viewerManifest.series
                .filter((series) => series.plane !== "slide")
                .map((series) => series.seriesInstanceUid),
            }),
          },
        );
        setLocalizerProjections(result.mapped);
      } catch (restoreError) {
        setError(
          restoreError instanceof Error
            ? restoreError.message
            : "Series cannot be spatially linked.",
        );
        return;
      }
    } else setLocalizerProjections([]);
    setNotice(
      scene.instructorNotes
        ? "Instructor scene restored with its permitted teaching note"
        : "Saved viewing state restored",
    );
  }

  async function mutateTeachingPoll(
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    setPollBusy(true);
    setError("");
    try {
      const result = await educationRequest<TeachingPollBundle>(
        "/api/education/teaching-polls",
        { method: "POST", body: JSON.stringify(payload) },
      );
      setPollBundle(result);
      setNotice(successMessage);
      setTimeout(() => setNotice(""), 3500);
    } catch (pollError) {
      setError(
        pollError instanceof Error
          ? pollError.message
          : "The live poll could not be updated.",
      );
    } finally {
      setPollBusy(false);
    }
  }

  async function mutateTeachingSession(
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    setTeachingSessionBusy(true);
    setError("");
    try {
      const result = await educationRequest<TeachingSessionBundle>(
        "/api/education/teaching-sessions",
        { method: "POST", body: JSON.stringify(payload) },
      );
      setTeachingSession(result);
      setNotice(successMessage);
      setTimeout(() => setNotice(""), 3500);
    } catch (sessionError) {
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "The teaching session could not be updated.",
      );
    } finally {
      setTeachingSessionBusy(false);
    }
  }

  async function launchCompanion() {
    if (!data || !activeCase || (view !== "exam" && view !== "teaching"))
      return;
    if (!displayChannel.current) {
      setError(
        "This browser cannot provide a synchronized companion window. Continue in one-display mode.",
      );
      return;
    }
    if (view === "exam" && !data.course.dualDisplayAllowed) {
      setError(
        "Dual display is disabled for this immutable assessment version.",
      );
      return;
    }
    if (view === "exam" && !examPreflightPassed) {
      setError("Complete the exam preflight before opening a companion answer window.");
      return;
    }
    if (view === "exam") {
      const saved = await flushPendingAnswers(data.course.workbookId);
      if (!saved) return;
    }
    const target = new URL(window.location.href);
    const sessionId = displaySessionId.current || createDisplaySessionId();
    displaySessionId.current = sessionId;
    target.searchParams.set("companion", view);
    target.searchParams.set("case", activeCase.id);
    target.searchParams.set("workbook", data.course.workbookId);
    target.searchParams.set("displaySession", sessionId);
    const popup = window.open(
      target.toString(),
      `didanix-education-companion-${sessionId}`,
      "popup=yes,width=560,height=900,resizable=yes,scrollbars=yes",
    );
    if (!popup) {
      setError(
        "The companion window was blocked. Allow pop-ups for this education site, then try again.",
      );
      return;
    }
    companionWindow.current = popup;
    setDualDisplay(true);
    setNotice(
      "Companion panel opened · move it to the second display if needed",
    );
    displayChannel.current?.postMessage({
      type: "workspace-state",
      source: "main",
      sessionId,
      workbookId: data.course.workbookId,
      view,
      activeCaseId,
      mixedAsset,
      frameIndex,
      revealNote: view === "teaching" ? revealNote : false,
    } satisfies DisplayMessage);
    void postAction(
      { action: "record-display-launch", mode: view, caseId: activeCase.id },
      "Dual-display launch recorded in the education audit",
    );
    try {
      const extendedWindow = window as Window & {
        getScreenDetails?: () => Promise<{
          screens: Array<{
            isPrimary: boolean;
            availLeft: number;
            availTop: number;
            availWidth: number;
            availHeight: number;
          }>;
        }>;
      };
      if (extendedWindow.getScreenDetails) {
        const details = await extendedWindow.getScreenDetails();
        const second = details.screens.find((screen) => !screen.isPrimary);
        if (second) {
          popup.moveTo(second.availLeft, second.availTop);
          popup.resizeTo(second.availWidth, second.availHeight);
        }
      }
    } catch {
      /* Permission was declined; the user can position the window manually. */
    }
    const watcher = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(watcher);
        companionWindow.current = null;
        setDualDisplay(false);
        void refresh();
      }
    }, 750);
  }

  async function submitAttemptSafely() {
    if (!data || data.course.workbookMode !== "assessment") return;
    if (!companionMode) {
      setSubmissionReviewOpen(true);
      return;
    }
    if (!window.confirm("Submit this immutable assessment attempt for marking?")) return;
    await confirmAttemptSubmission();
  }

  async function confirmAttemptSubmission() {
    if (!data || data.course.workbookMode !== "assessment") return;
    const saved = await flushPendingAnswers(data.course.workbookId);
    if (!saved) return;
    await postAction(
      { action: "submit-attempt" },
      "Attempt submitted and receipt issued",
    );
    setSubmissionReviewOpen(false);
  }

  function returnToOneDisplay() {
    if (!data || !companionWindow.current || companionWindow.current.closed) {
      companionWindow.current = null;
      setDualDisplay(false);
      void refresh();
      return;
    }
    setNotice("Synchronizing companion answers before returning…");
    displayChannel.current?.postMessage({
      type: "prepare-close",
      source: "main",
      sessionId: displaySessionId.current,
      workbookId: data.course.workbookId,
    } satisfies DisplayMessage);
  }

  const accessibilityClasses = [
    "runtime-theme",
    `theme-${accessibility.colourMode}`,
    `palette-${accessibility.palette}`,
    `a11y-text-${accessibility.textSize}`,
    accessibility.highContrast ? "a11y-high-contrast" : "",
    accessibility.largeTargets ? "a11y-large-targets" : "",
    accessibility.reducedMotion ? "a11y-reduced-motion" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!data)
    return (
      <main className={`loading-screen ${accessibilityClasses}`}>
        <BrandLockup />
        <p role={error ? "alert" : "status"}>{error || "Preparing your secure education workspace…"}</p>
        {error && <div className="loading-actions"><button onClick={() => void refresh()}>Try again</button><Link href="/courses">Browse courses</Link><Link href="/workspace">Return to workspace</Link></div>}
      </main>
    );

  const initials = data.currentUser.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hasTeachingWorkbook = data.accessibleWorkbooks.some(
    (workbook) => workbook.mode === "teaching" && workbook.available,
  );
  const hasExamWorkbook = data.accessibleWorkbooks.some(
    (workbook) => workbook.mode === "assessment" && workbook.available,
  );
  const uiRoles = previewRole === "full" ? data.currentUser.roles : [previewRole];
  const presentedData = previewRole === "full"
    ? data
    : { ...data, currentUser: { ...data.currentUser, roles: uiRoles } };
  const availableViews = VIEW_LABELS.filter((item) => {
    if (
      item.role &&
      !item.role.some((role) => uiRoles.includes(role))
    )
      return false;
    if (item.id === "teaching") return hasTeachingWorkbook;
    if (item.id === "exam") return hasExamWorkbook;
    if (item.id === "review") return hasTeachingWorkbook;
    return true;
  });
  const primaryViews = availableViews.filter((item) =>
    ["home", "teaching", "exam", "review"].includes(item.id),
  );
  const staffViews = availableViews.filter(
    (item) => !["home", "teaching", "exam", "review"].includes(item.id),
  );
  const staffGroups = (["Authoring", "Live teaching", "Assessment", "Governance"] as const)
    .map((group) => ({ group, items: staffViews.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length);
  const identityRoleLabel = uiRoles
    .map(statusLabel)
    .join(" · ");

  if (companionMode === "exam" && !data.course.dualDisplayAllowed)
    return (
      <main className={`loading-screen ${accessibilityClasses}`}>
        <BrandLockup />
        <h1>Companion display unavailable</h1>
        <p>
          This immutable assessment version permits one display only. Return to
          the main exam window.
        </p>
      </main>
    );

  if (companionMode === "exam" && !data.attempt.preflightPassedAt)
    return (
      <main className={`loading-screen ${accessibilityClasses}`}>
        <BrandLockup />
        <h1>Complete preflight in the main window</h1>
        <p>
          Assessment questions and media remain locked until the server records
          the readiness checks and starts the timer.
        </p>
      </main>
    );

  if (companionMode && activeCase)
    return (
      <main className={`companion-shell ${accessibilityClasses}`}>
        <div className="purpose-banner">
          <strong>Visible Medicine</strong>
          <span>
            Educational use only · Not for diagnosis, patient care or clinical
            reporting
          </span>
          <small>Companion panel</small>
        </div>
        <header className="companion-header">
          <BrandLockup />
          <span>
            <small>{data.course.code}</small>
            <strong>
              {companionMode === "exam" ? "Answer workspace" : "Teaching notes"}
            </strong>
          </span>
        </header>
        <CompanionCasePanel
          mode={companionMode}
          data={data}
          activeCase={activeCase}
          answers={answers}
          editable={editable}
          remainingExamTime={remainingExamTime}
          saveStatus={saveStatus}
          revealNote={revealNote}
          busy={busy}
          pollBundle={pollBundle}
          pollBusy={pollBusy}
          onAnswer={changeAnswer}
          onReveal={() => setRevealNote((value) => !value)}
          onCase={(caseId) => {
            chooseCase(caseId);
            displayChannel.current?.postMessage({
              type: "navigation",
              source: "companion",
              sessionId: displaySessionId.current,
              workbookId: data.course.workbookId,
              activeCaseId: caseId,
            } satisfies DisplayMessage);
          }}
          onSubmit={() => void submitAttemptSafely()}
          onPollStart={(pollId) =>
            void mutateTeachingPoll(
              { action: "start", caseId: activeCase.id, pollId },
              "Live teaching poll opened",
            )
          }
          onPollControl={(runId, operation, expectedVersion) =>
            void mutateTeachingPoll(
              {
                action: "control",
                caseId: activeCase.id,
                runId,
                operation,
                expectedVersion,
              },
              operation === "reveal"
                ? "Poll results released to learners"
                : `Live poll ${operation === "close" ? "closed" : "reopened"}`,
            )
          }
          onPollAnswer={(runId, selections, expectedRevision) =>
            void mutateTeachingPoll(
              {
                action: "answer",
                caseId: activeCase.id,
                runId,
                selections,
                expectedRevision,
              },
              "Your poll response was saved",
            )
          }
        />
        <div className="live-region" aria-live="polite">
          {notice && <span className="toast success">{notice}</span>}
          {error && (
            <span className="toast error">
              <b>{error}</b>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            </span>
          )}
        </div>
      </main>
    );

  return (
    <main className={`app-shell ${accessibilityClasses}`} id="main-education-workspace">
      <a className="skip-link" href="#education-primary-content">
        Skip to education workspace
      </a>
      <div className="purpose-banner">
        <strong>Visible Medicine</strong>
        <span>
          Educational use only · Not for diagnosis, patient care or clinical
          reporting
        </span>
        <small>Isolated education environment</small>
      </div>
      {data.currentUser.previewAvailable && previewRole !== "full" && (
        <div className="role-preview-banner" role="status">
          <strong>Local role preview: {statusLabel(previewRole)}</strong>
          <span>UI simulation only · not an account switch or authorization boundary</span>
          <button type="button" onClick={() => setPreviewRole("full")}>Exit preview</button>
        </div>
      )}
      <header className="app-header">
        <Link className="runtime-platform-return" href={view === "authoring" ? "/studio/workspace" : "/my-learning"} aria-label={view === "authoring" ? "Return to Visible Medicine Studio" : "Return to My Learning"}>
          <BrandLockup />
        </Link>
        <div className="mode-switch" aria-label="Education workspace mode">
          {primaryViews.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              disabled={dualDisplay && view !== item.id}
              title={
                dualDisplay && view !== item.id
                  ? "Return to one display before changing workspaces"
                  : undefined
              }
              onClick={() => chooseWorkspaceView(item.id)}
            >
              <span>{item.label}</span>
              <i />
            </button>
          ))}
          {staffViews.length > 0 && (
            <details
              className={`staff-tools-menu${staffViews.some((item) => item.id === view) ? " active" : ""}`}
              ref={staffMenuRef}
            >
              <summary
                aria-label="Staff tools"
                aria-disabled={dualDisplay}
                onClick={(event) => {
                  if (dualDisplay) event.preventDefault();
                }}
              >Staff tools</summary>
              <div className="staff-tools-popover" role="menu" aria-label="Staff workspaces">
                {staffGroups.map(({ group, items }) => (
                  <section key={group}>
                    <strong>{group}</strong>
                    {items.map((item) => (
                      <button
                        type="button"
                        role="menuitem"
                        className={view === item.id ? "active" : ""}
                        key={item.id}
                        onClick={() => {
                          chooseWorkspaceView(item.id);
                          staffMenuRef.current?.removeAttribute("open");
                        }}
                      >{item.label}</button>
                    ))}
                  </section>
                ))}
              </div>
            </details>
          )}
        </div>
        <div className="header-context">
          <small>
            {data.course.code} · {data.course.moduleTitle}
          </small>
          <strong>{data.course.workbookTitle}</strong>
        </div>
        <div className="header-actions">
          <Link className="runtime-atlas-link" href="/atlas/ct-head">Atlas reference</Link>
          {data.currentUser.previewAvailable && (
            <label className="role-preview-control">
              <span>Local preview</span>
              <select
                value={previewRole}
                onChange={(event) => {
                  setPreviewRole(event.target.value as typeof previewRole);
                  setView("home");
                }}
              >
                <option value="full">Full demo account</option>
                <option value="learner">Learner UI</option>
                <option value="instructor">Instructor UI</option>
                <option value="examiner">Examiner UI</option>
                <option value="administrator">Administrator UI</option>
              </select>
            </label>
          )}
          <button
            type="button"
            className="accessibility-button"
            aria-expanded={accessibilityOpen}
            onClick={() => setAccessibilityOpen((value) => !value)}
          >
            Accessibility
          </button>
          <span className="version-chip">
            {data.course.workbookMode === "assessment" ? "Assessment" : "Teaching"} v
            {data.course.workbookVersion}
          </span>
          <span className="identity-chip">
            <b>{initials}</b>
            <span>
              <strong>{data.currentUser.displayName}</strong>
              <small>{identityRoleLabel} · private education account</small>
            </span>
          </span>
        </div>
      </header>
      {accessibilityOpen && (
        <AccessibilityPanel
          profile={accessibility}
          onChange={setAccessibility}
          onKeyboardHelp={() => {
            setAccessibilityOpen(false);
            setKeyboardHelpOpen(true);
          }}
          onClose={() => setAccessibilityOpen(false)}
        />
      )}
      {keyboardHelpOpen && (
        <KeyboardHelp onClose={() => setKeyboardHelpOpen(false)} />
      )}
      {pendingTextAnnotation && (
        <ViewerTextAnnotationDialog
          onCancel={() => setPendingTextAnnotation(null)}
          onAdd={(label) => {
            const id = crypto.randomUUID();
            setManualMarkups((current) =>
              [
                ...current,
                {
                  id,
                  kind: "text",
                  label,
                  x1: pendingTextAnnotation.x,
                  y1: pendingTextAnnotation.y,
                  x2: pendingTextAnnotation.x,
                  y2: pendingTextAnnotation.y,
                  lineWidth: lineThickness,
                } as ManualMarkup,
              ].slice(-100),
            );
            setSelectedMarkupId(id);
            setPendingTextAnnotation(null);
            setNotice("Text annotation added");
          }}
        />
      )}
      <span id="education-primary-content" className="content-anchor" tabIndex={-1} />

      {view === "exam" && data.assessmentPreflight.required && (
        <section className="standalone-exam-preflight">
          <ExamPreflightPanel
            data={data}
            online={online}
            onComplete={async (checkCount) => {
              const updated = await postAction(
                {
                  action: "record-exam-preflight",
                  passed: true,
                  checkCount,
                },
                "Exam preflight passed and recorded",
              );
              if (updated) setExamPreflightPassed(true);
              return Boolean(updated);
            }}
          />
        </section>
      )}

      {(view === "exam" || view === "teaching") && activeCase && (
        <section
          className={`viewer-workspace${sidebarCollapsed ? " sidebar-collapsed" : ""}${dualDisplay ? " dual-display-main" : ""}`}
        >
          <aside
            className="case-browser"
            aria-label="Course workbook cases"
            onMouseEnter={scheduleSidebarOpen}
            onMouseLeave={scheduleSidebarClose}
            onFocusCapture={() => {
              if (sidebarCloseTimer.current)
                clearTimeout(sidebarCloseTimer.current);
            }}
            onBlurCapture={(event) => {
              const next = event.relatedTarget as Node | null;
              if (!sidebarPinnedOpen && !event.currentTarget.contains(next))
                scheduleSidebarClose();
            }}
          >
            <div
              className="workbook-switcher"
              title={
                dualDisplay
                  ? "Return to one display before changing workbooks"
                  : `${data.accessibleWorkbooks.length} allocated workbook${data.accessibleWorkbooks.length === 1 ? "" : "s"}`
              }
            >
              <span>
                <small>Available workbooks</small>
                <b>{data.accessibleWorkbooks.length}</b>
              </span>
              <select
                aria-label="Select an allocated workbook"
                name="allocated-workbook"
                value={data.course.workbookId}
                disabled={busy || dualDisplay}
                onChange={(event) => void chooseWorkbook(event.target.value)}
              >
                {data.accessibleWorkbooks.map((workbook) => (
                  <option key={workbook.id} value={workbook.id} disabled={!workbook.available}>
                    {!workbook.available ? "Unavailable" : workbook.mode === "assessment" ? "Exam" : "Teaching"} · {workbook.title}
                  </option>
                ))}
              </select>
              <strong className="workbook-abbrev" aria-hidden="true">
                {data.course.workbookMode === "assessment" ? "E" : "T"}
              </strong>
            </div>
            <div className="browser-heading">
              <span>Course workbook</span>
              <small>
                {data.course.workbookMode} · {data.cases.length} cases
              </small>
              <button
                className="collapse-button"
                onClick={toggleSidebarPin}
                aria-label={
                  sidebarPinnedOpen
                    ? "Collapse course workbook sidebar"
                    : "Pin course workbook sidebar open"
                }
                aria-pressed={sidebarPinnedOpen}
                title={
                  sidebarPinnedOpen
                    ? "Collapse course workbook"
                    : "Pin course workbook open"
                }
              >
                {sidebarPinnedOpen ? "‹" : "›"}
              </button>
            </div>
            <div className="hierarchy-path">
              <span>Course</span>
              <strong>{data.course.title}</strong>
              <span>Module</span>
              <strong>{data.course.moduleTitle}</strong>
              <span>Workbook</span>
              <strong>{data.course.workbookTitle}</strong>
            </div>
            <nav className="case-list" aria-label="Cases">
              {data.cases.map((item) => {
                const answered = item.questions.every((question) =>
                  data.answers.some(
                    (entry) =>
                      entry.questionId === question.id && entry.response.trim(),
                  ),
                );
                const flagged = data.caseFlags.some(
                  (flag) => flag.caseId === item.id && flag.flagged,
                );
                const caseNumber = String(item.position).padStart(2, "0");
                return (
                  <button
                    key={item.id}
                    className={`case-item${item.id === activeCase.id ? " active" : ""}${flagged ? " flagged" : ""}`}
                    onClick={() => chooseCase(item.id)}
                    aria-label={`Case ${item.position}: ${item.title}${item.id === activeCase.id ? ", current case" : ""}${answered ? ", answered" : ", not answered"}${flagged ? ", flagged for review" : ""}`}
                    title={`Case ${item.position} · ${item.title}`}
                  >
                    <span className="case-number" aria-hidden="true">
                      {caseNumber}
                    </span>
                    <span className={`modality-badge ${item.classification}`}>
                      {item.classification === "radiology"
                        ? "CT"
                        : item.classification === "pathology"
                          ? "WSI"
                          : "MIX"}
                    </span>
                    <span className="case-details">
                      <strong>
                        {caseNumber} · {item.title}
                      </strong>
                      <small>
                        {item.classification} · v{item.version}
                      </small>
                    </span>
                    <i
                      className={answered ? "complete" : ""}
                      aria-label={
                        answered ? "Answered" : "Not answered"
                      }
                    />
                    {flagged && (
                      <span className="case-flag-marker" aria-hidden="true">
                        ⚑
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="attempt-card">
              <span>
                <small>Attempt state</small>
                <strong>{statusLabel(data.attempt.state)}</strong>
              </span>
              <span>
                <small>Version pin</small>
                <code>{shortHash(data.course.assessmentHash)}</code>
              </span>
              <div className="progress-track">
                <i
                  style={{
                    width: `${Math.round((data.answers.filter((answer) => answer.response.trim()).length / data.cases.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </aside>

          <section
            className="didanix-viewer"
            aria-label={`${activeCase.classification} educational viewer`}
          >
            {view === "teaching" && teachingWorkbook && (
              <TeachingSessionBar
                bundle={teachingSession}
                busy={teachingSessionBusy}
                onStart={() =>
                  void mutateTeachingSession(
                    {
                      action: "start",
                      workbookId: teachingWorkbook.id,
                      caseId: activeCase.id,
                      viewerState: currentTeachingViewerState(),
                    },
                    "Live teaching session started · learners can now follow this viewer",
                  )
                }
                onEnd={() => {
                  if (
                    teachingSession.session &&
                    window.confirm(
                      "End this live teaching session for all learners?",
                    )
                  )
                    void mutateTeachingSession(
                      {
                        action: "end",
                        workbookId: teachingWorkbook.id,
                        sessionId: teachingSession.session.id,
                        expectedVersion: teachingSession.session.version,
                      },
                      "Live teaching session ended",
                    );
                }}
                onFollowState={(followState) => {
                  if (!teachingSession.session) return;
                  void mutateTeachingSession(
                    {
                      action: "heartbeat",
                      workbookId: teachingWorkbook.id,
                      sessionId: teachingSession.session.id,
                      followState,
                      currentCaseId: activeCase.id,
                    },
                    followState === "following"
                      ? "Rejoined the instructor viewer"
                      : "Independent exploration enabled",
                  );
                }}
              />
            )}
            {dualDisplay && (
              <button
                className="one-display-button"
                onClick={returnToOneDisplay}
              >
                Return to one display
              </button>
            )}
            {activeCase.classification === "mixed" && (
              <div className="asset-switch">
                <span>Mixed case</span>
                <button
                  className={mixedAsset === "radiology" ? "active" : ""}
                  onClick={() => setMixedAsset("radiology")}
                >
                  Radiology
                </button>
                <button
                  className={mixedAsset === "pathology" ? "active" : ""}
                  onClick={() => setMixedAsset("pathology")}
                >
                  Pathology
                </button>
                <small>Tools follow the active asset</small>
              </div>
            )}
            <div
              className="series-strip"
              aria-label="Series and slide thumbnails"
            >
              {availableSeries.map((series) => (
                <button
                  key={series.id}
                  className={`series-thumb ${series.kind}${activeSeries === series.id ? " active" : ""}`}
                  onClick={() => {
                    setActiveSeries(series.id);
                    if (activeCase.classification === "mixed")
                      setMixedAsset(series.kind as "radiology" | "pathology");
                  }}
                >
                  <span className={`thumb-image ${series.kind}`}>
                    <i />
                  </span>
                  <strong>{series.label}</strong>
                  <small>{series.meta}</small>
                </button>
              ))}
            </div>

            <div className="viewport-wrap">
              {/* The viewport is a composite canvas-like widget; focus and pointer handlers are required for its keyboard-equivalent imaging tools. */}
              <div tabIndex={0}
                className={`viewport${triPlanar && effectiveKind !== "pathology" ? " tri-planar" : ""}${fourUp ? " four-up" : ""} tool-${activeTool}`}
                role="application"
                aria-label={`Educational image viewport. ${TOOL_LABELS[activeTool] || statusLabel(activeTool)} tool active. Use the image number slider or arrow keys for keyboard navigation.`}
                data-active-tool={activeTool}
                data-layout={viewerLayout}
                data-inverted={inverted ? "true" : "false"}
                data-window-center={windowCenter}
                data-window-width={windowWidth}
                data-zoom={zoom}
                data-pan-x={Math.round(panOffset.x)}
                data-pan-y={Math.round(panOffset.y)}
                data-markup-count={manualMarkups.length}
                onPointerDown={beginViewerInteraction}
                onPointerMove={moveViewerInteraction}
                onPointerUp={endViewerInteraction}
                onPointerCancel={endViewerInteraction}
                onWheel={handleViewerWheel}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    setFrameIndex((current) => clamp(current - 1, 0, 95));
                  } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setFrameIndex((current) => clamp(current + 1, 0, 95));
                  } else if ((event.key === "Delete" || event.key === "Backspace") && selectedMarkupId) {
                    event.preventDefault();
                    setManualMarkups((current) => current.filter((markup) => markup.id !== selectedMarkupId));
                    setSelectedMarkupId("");
                    setNotice("Selected annotation removed");
                  }
                }}
              >
                <div className="corner tl">
                  EDU-{activeCase.id.toUpperCase()}
                  <br />
                  DE-IDENTIFIED TEACHING CASE
                </div>
                <div className="corner tr">
                  {effectiveKind === "pathology"
                    ? `H&E · ${zoom}×`
                    : `W ${windowWidth} · L ${windowCenter}${inverted ? " · INV" : ""}\nIMAGE ${frameIndex + 1} / 96`}
                </div>
                <div className="corner bl">
                  {effectiveKind === "pathology"
                    ? "SCALE 0.25 μm/px"
                    : "AXIAL · 3.0 mm"}
                </div>
                <div className="corner br didanix-credit"><small>Powered by</small> <b>Didanix</b></div>
                {fourUp ? (
                  <div className="quad-grid" aria-label="Two by two comparison layout">
                    {Array.from({ length: 4 }, (_, index) => availableSeries[index % Math.max(1, availableSeries.length)])
                      .filter(Boolean)
                      .map((series, index) => (
                        <button
                          type="button"
                          key={`${series.id}-${index}`}
                          className={`quad-viewport ${series.kind}${activeSeries === series.id ? " active" : ""}`}
                          onClick={() => {
                            setActiveSeries(series.id);
                            if (activeCase.classification === "mixed")
                              setMixedAsset(series.kind as "radiology" | "pathology");
                          }}
                          aria-label={`Select ${series.label} comparison viewport`}
                        >
                          <span className="quad-label">
                            {index + 1} · {series.label}
                            <small>{series.meta}</small>
                          </span>
                          {series.kind === "pathology" ? (
                            <span
                              className="pathology-stage mini"
                              style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${pathologyScale})` }}
                            >
                              <i className="tissue tissue-one" />
                              <i className="tissue tissue-two" />
                              <i className="tissue tissue-three" />
                            </span>
                          ) : (
                            <span
                              className={`scan-stage mini ${activeCase.visualKind}`}
                              style={{
                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 112})`,
                                filter: imageFilter,
                              }}
                            >
                              <i className="anatomy-core" />
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                ) : triPlanar && effectiveKind !== "pathology" ? (
                  <div
                    className="mpr-grid"
                    aria-label="Tri-planar patient-space localizer"
                  >
                    {(["axial", "coronal", "sagittal"] as ImagePlane[]).map(
                      (plane) => {
                        const projection = projectionFor(plane);
                        const left = `${Math.max(0, Math.min(100, ((projection?.x ?? 128) / 255) * 100))}%`;
                        const top = `${Math.max(0, Math.min(100, ((projection?.y ?? 128) / 255) * 100))}%`;
                        return (
                          <button
                            type="button"
                            className={`mpr-viewport ${activePlane === plane ? "active" : ""}`}
                            key={plane}
                            onClick={() => setActivePlane(plane)}
                            onPointerDown={(event) => {
                              if (activeTool !== "crosshair") return;
                              const rect =
                                event.currentTarget.getBoundingClientRect();
                              void placeLocalizer(
                                plane,
                                ((event.clientX - rect.left) / rect.width) *
                                  255,
                                ((event.clientY - rect.top) / rect.height) *
                                  255,
                              );
                            }}
                            aria-label={`${statusLabel(plane)} plane. ${activeTool === "crosshair" ? "Click or drag to place the patient-space localizer." : "Select this plane."}`}
                          >
                            <span className="mpr-plane-label">
                              {plane}
                              <small>
                                {projection
                                  ? `${projection.sliceIndex + 1} / 96`
                                  : "not linked"}
                              </small>
                            </span>
                            <span
                              className={`scan-stage mini ${activeCase.visualKind}`}
                              style={{ filter: imageFilter }}
                            >
                              <i className="anatomy-core" />
                            </span>
                            {projection && (
                              <>
                                <i
                                  className="crosshair-line horizontal"
                                  style={{ top }}
                                />
                                <i
                                  className="crosshair-line vertical"
                                  style={{ left }}
                                />
                                <b
                                  className="crosshair-point"
                                  style={{ left, top }}
                                />
                              </>
                            )}
                            {restoredScene?.annotations.some(
                              (annotation) => annotation.visible,
                            ) && (
                              <span
                                className="scene-annotation-mark"
                                title={
                                  restoredScene.annotations.find(
                                    (annotation) => annotation.visible,
                                  )?.label
                                }
                              >
                                ↗
                              </span>
                            )}
                          </button>
                        );
                      },
                    )}
                    <span className="patient-coordinate">
                      {localizerPoint
                        ? `DICOM LPS ${localizerPoint.map((value) => value.toFixed(1)).join(" · ")} mm`
                        : "Select Localizer, then click a plane"}
                    </span>
                  </div>
                ) : effectiveKind === "pathology" ? (
                  <div
                    className="pathology-stage"
                    style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${pathologyScale})` }}
                    role="img"
                    aria-label="De-identified illustrative H and E whole-slide view"
                  >
                    <i className="tissue tissue-one" />
                    <i className="tissue tissue-two" />
                    <i className="tissue tissue-three" />
                    <span className="path-marker">A</span>
                  </div>
                ) : (
                  <div
                    className={`scan-stage ${activeCase.visualKind}`}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 112})`,
                      filter: imageFilter,
                    }}
                    role="img"
                    aria-label="De-identified illustrative axial CT teaching image"
                  >
                    <i className="anatomy-core" />
                    <span className="measurement">18.4 mm</span>
                    {projectionFor(activePlane) && (
                      <>
                        <i
                          className="crosshair-line horizontal"
                          style={{
                            top: `${(projectionFor(activePlane)!.y / 255) * 100}%`,
                          }}
                        />
                        <i
                          className="crosshair-line vertical"
                          style={{
                            left: `${(projectionFor(activePlane)!.x / 255) * 100}%`,
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
                {!triPlanar && !fourUp && manualMarkups.length > 0 && (
                  <svg
                    className="manual-markup-layer"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-label={`${manualMarkups.length} visible manual annotation${manualMarkups.length === 1 ? "" : "s"}`}
                  >
                    <defs>
                      <marker id="education-arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 z" />
                      </marker>
                    </defs>
                    {manualMarkups.map((markup) => {
                      const selected = selectedMarkupId === markup.id;
                      const className = selected ? "manual-markup selected" : "manual-markup";
                      if (markup.kind === "circle")
                        return (
                          <ellipse
                            key={markup.id}
                            className={className}
                            cx={(markup.x1 + markup.x2) / 2}
                            cy={(markup.y1 + markup.y2) / 2}
                            rx={Math.max(0.5, Math.abs(markup.x2 - markup.x1) / 2)}
                            ry={Math.max(0.5, Math.abs(markup.y2 - markup.y1) / 2)}
                            vectorEffect="non-scaling-stroke"
                            strokeWidth={markup.lineWidth}
                          />
                        );
                      if (markup.kind === "text") return null;
                      const length = Math.round(Math.hypot(markup.x2 - markup.x1, markup.y2 - markup.y1) * 2.56);
                      return (
                        <g key={markup.id} className={className}>
                          <line
                            x1={markup.x1}
                            y1={markup.y1}
                            x2={markup.x2}
                            y2={markup.y2}
                            vectorEffect="non-scaling-stroke"
                            strokeWidth={markup.lineWidth}
                            markerEnd={markup.kind === "arrow" ? "url(#education-arrow-head)" : undefined}
                          />
                          {markup.kind === "length" && (
                            <text className="manual-length-label" x={(markup.x1 + markup.x2) / 2} y={(markup.y1 + markup.y2) / 2 - 1.5}>
                              {length} px
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                )}
                {!triPlanar && !fourUp && manualMarkups.some((markup) => markup.kind === "text") && (
                  <div className="manual-text-layer">
                    {manualMarkups
                      .filter((markup) => markup.kind === "text")
                      .map((markup) => {
                        const horizontalAnchor =
                          markup.x1 < 34
                            ? "anchor-start"
                            : markup.x1 > 66
                              ? "anchor-end"
                              : "anchor-center";
                        const verticalAnchor =
                          markup.y1 > 55 ? "anchor-above" : "anchor-below";
                        return (
                          <span
                            key={markup.id}
                            role="note"
                            className={`manual-text-label ${horizontalAnchor} ${verticalAnchor}${selectedMarkupId === markup.id ? " selected" : ""}`}
                            style={{
                              left: `${clamp(markup.x1, 2, 98)}%`,
                              top: `${clamp(markup.y1, 2, 98)}%`,
                            }}
                          >
                            {markup.label}
                          </span>
                        );
                      })}
                  </div>
                )}
                {effectiveKind === "pathology" && !fourUp && (
                  <div className="navigator">
                    <span />
                    <i />
                  </div>
                )}
                <div className="orientation north">A</div>
                <div className="orientation west">R</div>
                <div className="orientation east">L</div>
              </div>

              <ViewerSceneTray
                mode={view}
                presentations={presentations}
                bookmarks={bookmarks}
                busy={savedViewBusy}
                canManage={
                  view === "teaching" &&
                  uiRoles.some((role) =>
                    ["instructor", "administrator"].includes(role),
                  )
                }
                canBookmark={uiRoles.includes("learner")}
                onSaveInstructor={saveInstructorScene}
                onSaveBookmark={saveLearnerBookmark}
                onRestore={restoreViewerScene}
              />

              <div className="viewer-toolbar" aria-label="Viewer tools">
                {effectiveKind === "pathology" ? (
                  <div className="tool-row">
                    <span className="toolbar-label">Magnification</span>
                    {[2, 5, 10, 20, 40].map((value) => (
                      <button
                        key={value}
                        className={zoom === value ? "active" : ""}
                        aria-pressed={zoom === value}
                        title={`Set whole-slide magnification to ${value} times`}
                        onClick={() => {
                          setZoom(value);
                          setNotice(`Whole-slide magnification set to ${value}×`);
                        }}
                      >
                        {value}×
                      </button>
                    ))}
                    <span className="separator" />
                    {visibleTools.map((tool) => (
                      <button
                        key={tool}
                        className={activeTool === tool ? "active" : ""}
                        aria-pressed={activeTool === tool}
                        title={`Activate ${TOOL_LABELS[tool] || statusLabel(tool)} tool`}
                        onClick={() => activateViewerTool(tool)}
                      >
                        {TOOL_LABELS[tool] || tool}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="tool-row">
                      <button
                        className={activeTool === "select" ? "active" : ""}
                        aria-pressed={activeTool === "select"}
                        title="Select an annotation; press Delete to remove it"
                        onClick={() => activateViewerTool("select")}
                      >
                        Select
                      </button>
                      {visibleTools.map((tool) => (
                        <button
                          key={tool}
                          className={activeTool === tool ? "active" : ""}
                          aria-pressed={activeTool === tool || (tool === "cine" && cine)}
                          title={`Activate ${TOOL_LABELS[tool] || statusLabel(tool)} tool`}
                          onClick={() => activateViewerTool(tool)}
                        >
                          {TOOL_LABELS[tool] || tool}
                        </button>
                      ))}
                      <button
                        className={activeTool === "circle" ? "active" : ""}
                        aria-pressed={activeTool === "circle"}
                        title="Draw a circular region of interest"
                        onClick={() => activateViewerTool("circle")}
                      >
                        Circle ROI
                      </button>
                      <button
                        className={activeTool === "text" ? "active" : ""}
                        aria-pressed={activeTool === "text"}
                        title="Place a bounded text annotation"
                        onClick={() => activateViewerTool("text")}
                      >
                        Text
                      </button>
                      <span className="separator" />
                      <label>
                        Line{" "}
                        <input
                          type="range"
                          min="1"
                          max="4"
                          step=".25"
                          value={lineThickness}
                          name="measurement-line-thickness"
                          onInput={(event) => {
                            setLineThickness(Number(event.currentTarget.value));
                            setNotice(`Annotation line thickness ${event.currentTarget.value}`);
                          }}
                          aria-label="Measurement line thickness"
                        />
                      </label>
                    </div>
                    <div className="tool-row">
                      <select
                        aria-label="Window preset"
                        name="window-preset"
                        value={windowPreset}
                        onChange={(event) =>
                          applyWindowPreset(event.target.value as Exclude<WindowPreset, "custom">)
                        }
                      >
                        {windowPreset === "custom" && <option value="custom" disabled>Custom W/L</option>}
                        <option value="auto">Auto window</option>
                        <option value="soft">CT Soft tissue</option>
                        <option value="lung">CT Lung</option>
                        <option value="bone">CT Bone</option>
                        <option value="brain">CT Brain</option>
                      </select>
                      <button
                        className={inverted ? "active" : ""}
                        aria-pressed={inverted}
                        title="Invert the radiology grayscale"
                        onClick={() => {
                          setInverted((current) => !current);
                          setNotice(inverted ? "Image inversion removed" : "Image grayscale inverted");
                        }}
                      >
                        Invert
                      </button>
                      <button
                        aria-label="Zoom out"
                        title="Zoom out"
                        onClick={() => {
                          setZoom((value) => Math.max(50, value - 10));
                          setNotice("Zoomed out");
                        }}
                      >
                        −
                      </button>
                      <button
                        title="Fit image to viewport"
                        onClick={() => {
                          setZoom(100);
                          setPanOffset({ x: 0, y: 0 });
                          setNotice("Image fitted to viewport");
                        }}
                      >
                        Fit
                      </button>
                      <button
                        aria-label="Zoom in"
                        title="Zoom in"
                        onClick={() => {
                          setZoom((value) => Math.min(300, value + 10));
                          setNotice("Zoomed in");
                        }}
                      >
                        +
                      </button>
                      <button
                        className={cine ? "active" : ""}
                        aria-pressed={cine}
                        title={cine ? "Pause cine playback" : "Start cine playback"}
                        onClick={() => activateViewerTool("cine")}
                      >
                        {cine ? "Pause" : "Play"}
                      </button>
                      <input
                        className="slice-slider"
                        type="range"
                        min="0"
                        max="95"
                        name="image-number"
                        value={frameIndex}
                        onInput={(event) =>
                          setFrameIndex(Number(event.currentTarget.value))
                        }
                        aria-label="Image number"
                      />
                      <span className="slice-label">{frameIndex + 1} / 96</span>
                    </div>
                  </>
                )}
                <div className="tool-row layout-row">
                  <span className="toolbar-label">Layout</span>
                  <div className="segmented">
                    <button
                      className={viewerLayout === "1x1" ? "active" : ""}
                      aria-pressed={viewerLayout === "1x1"}
                      onClick={() => setViewerLayout("1x1")}
                    >
                      1×1
                    </button>
                    {effectiveKind !== "pathology" && (
                      <button
                        className={viewerLayout === "mpr" ? "active" : ""}
                        aria-pressed={viewerLayout === "mpr"}
                        onClick={() => setViewerLayout("mpr")}
                      >
                        1×3 MPR
                      </button>
                    )}
                    <button
                      className={viewerLayout === "2x2" ? "active" : ""}
                      aria-pressed={viewerLayout === "2x2"}
                      onClick={() => setViewerLayout("2x2")}
                    >
                      2×2
                    </button>
                  </div>
                  {selectedMarkupId && (
                    <button
                      onClick={() => {
                        setManualMarkups((current) => current.filter((markup) => markup.id !== selectedMarkupId));
                        setSelectedMarkupId("");
                        setNotice("Selected annotation removed");
                      }}
                    >
                      Delete mark
                    </button>
                  )}
                  {manualMarkups.length > 0 && (
                    <button
                      title="Remove the most recent viewer annotation (Ctrl+Z)"
                      onClick={undoLastMarkup}
                    >
                      Undo mark
                    </button>
                  )}
                  <button title="Reset all viewer controls" onClick={resetViewer}>
                    Reset
                  </button>
                  <span className="viewer-hint">
                    {effectiveKind === "pathology"
                      ? activeTool === "measure" || activeTool === "annotate"
                        ? "drag on the slide to add the selected manual annotation"
                        : "drag: pan · wheel: zoom · Overview returns to 2×"
                      : activeTool === "crosshair"
                        ? "click or drag: synchronize one DICOM patient-space point"
                        : ["measure", "annotate", "circle"].includes(activeTool)
                          ? "drag on the image to add the selected manual annotation"
                          : activeTool === "text"
                            ? "click on the image to place a short text annotation"
                            : "wheel/arrows: slices · drag: active tool · ctrl+wheel: zoom"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {view === "exam" ? (
            <aside className="answer-panel">
              <div className="panel-head">
                <span>
                  Question {activeCase.position} of {data.cases.length}
                </span>
                <span className="panel-head-actions">
                  <time
                    className={`exam-countdown${remainingExamTime === 0 ? " expired" : remainingExamTime !== null && remainingExamTime <= 300 ? " warning" : ""}`}
                    aria-label={`Assessment time remaining ${formatCountdown(remainingExamTime)}`}
                    dateTime={data.attempt.deadlineAt || undefined}
                  >
                    {formatCountdown(remainingExamTime)}
                  </time>
                  <small
                    className={
                      saveStatus.includes("attention")
                        ? "error-text"
                        : "saved-state"
                    }
                  >
                    {saveStatus}
                  </small>
                  <button
                    className="display-button"
                    disabled={
                      !data.course.dualDisplayAllowed || !examPreflightPassed
                    }
                    onClick={() => void launchCompanion()}
                    title={
                      data.course.dualDisplayAllowed
                        ? "Open synchronized answer workspace on another display"
                        : "Disabled by this assessment version"
                    }
                  >
                    Dual display
                  </button>
                </span>
              </div>
              <div
                className={
                  "panel-scroll" +
                  (examPreflightPassed ? "" : " exam-preflight-locked")
                }
              >
                {!examPreflightPassed && (
                  <ExamPreflightPanel
                    data={data}
                    online={online}
                    onComplete={async (checkCount) => {
                      const updated = await postAction(
                        {
                          action: "record-exam-preflight",
                          passed: true,
                          checkCount,
                        },
                        "Exam preflight passed and recorded",
                      );
                      if (updated) setExamPreflightPassed(true);
                      return Boolean(updated);
                    }}
                  />
                )}
                {examPreflightPassed && (
                  <ExamRecoveryStatus
                    online={online}
                    pending={pendingAnswerCount > 0}
                    saveStatus={saveStatus}
                    revision={activeQuestionAnswer?.revision ?? 0}
                    updatedAt={activeQuestionAnswer?.updatedAt ?? null}
                  />
                )}
                <span className="eyebrow">
                  Case {String(activeCase.position).padStart(2, "0")} ·{" "}
                  {activeCase.maxMarks} marks
                </span>
                <h1>{activeCase.title}</h1>
                <p className="case-description">{activeCase.description}</p>
                {activeCase.questions.map((question, index) => {
                  const response = answers[question.id] ?? "";
                  const saved = data.answers.find(
                    (answer) => answer.questionId === question.id,
                  );
                  const fieldId = `candidate-answer-${question.id}`;
                  return (
                    <section className="case-question" key={question.id}>
                      <h2>
                        Question {index + 1}
                        <small>{question.maxMarks} marks</small>
                      </h2>
                      <p>{question.prompt}</p>
                      <label htmlFor={fieldId}>Your answer</label>
                      <textarea
                        id={fieldId}
                        disabled={!editable}
                        value={response}
                        onChange={(event) =>
                          changeAnswer(question.id, event.target.value)
                        }
                        placeholder={
                          editable
                            ? "Enter your structured educational response…"
                            : "This submitted answer is read-only."
                        }
                      />
                      <div className="answer-meta">
                        <span>
                          {response.trim().split(/\s+/).filter(Boolean).length} words
                        </span>
                        <span>Revision {saved?.revision ?? 0}</span>
                      </div>
                    </section>
                  );
                })}
                <button
                  className="key-image-action"
                  disabled={!editable || busy}
                  onClick={() =>
                    void postAction(
                      {
                        action: "add-key-image",
                        caseId: activeCase.id,
                        frameIndex,
                        viewport: {
                          activeSeries,
                          zoom,
                          tool: activeTool,
                          asset: effectiveKind,
                        },
                      },
                      "Key image linked to this case",
                    )
                  }
                >
                  ＋ Add current view as key image
                </button>
                <div className="evidence-list">
                  {data.keyImages
                    .filter((image) => image.caseId === activeCase.id)
                    .map((image) => (
                      <div className="evidence-card" key={image.id}>
                        <span className={`thumb-image ${effectiveKind}`}>
                          <i />
                        </span>
                        <span>
                          <strong>
                            Key image ·{" "}
                            {effectiveKind === "pathology"
                              ? `${image.viewport.zoom ?? zoom}×`
                              : `image ${image.frameIndex + 1}`}
                          </strong>
                          <small>
                            {formatTime(image.createdAt)} · replayable
                          </small>
                        </span>
                      </div>
                    ))}
                </div>
                <button
                  className="annotation-action"
                  disabled={!editable || busy || !manualMarkups.length}
                  onClick={() => {
                    const markup = manualMarkups.at(-1);
                    if (!markup) return;
                    void postAction(
                      {
                        action: "add-annotation",
                        caseId: activeCase.id,
                        kind: markup.kind,
                        label: markup.label,
                        geometry: {
                          x1: markup.x1,
                          y1: markup.y1,
                          x2: markup.x2,
                          y2: markup.y2,
                          lineWidth: markup.lineWidth,
                          frame: frameIndex,
                        },
                      },
                      "Latest viewer annotation recorded",
                    );
                  }}
                >
                  Record latest viewer annotation
                </button>
                {data.result && (
                  <div className="released-result">
                    <span>Released result</span>
                    <strong>
                      {data.result.score}/{data.result.maxScore} ·{" "}
                      {data.result.outcome}
                    </strong>
                    <small>{formatTime(data.result.releasedAt)}</small>
                  </div>
                )}
              </div>
              <div className="panel-actions">
                <button
                  className={`secondary-button${activeCaseFlag?.flagged ? " active" : ""}`}
                  disabled={!examPreflightPassed || !editable || busy}
                  aria-pressed={Boolean(activeCaseFlag?.flagged)}
                  onClick={() =>
                    void postAction(
                      {
                        action: "set-case-flag",
                        caseId: activeCase.id,
                        flagged: !activeCaseFlag?.flagged,
                        expectedRevision: activeCaseFlag?.revision ?? 0,
                      },
                      activeCaseFlag?.flagged
                        ? "Case removed from review list"
                        : "Case flagged for review",
                    )
                  }
                >
                  {activeCaseFlag?.flagged ? "Unflag case" : "Flag case"}
                </button>
                <button
                  className="primary-button"
                  data-submit-attempt
                  disabled={!examPreflightPassed || !editable || busy}
                  onClick={() => void submitAttemptSafely()}
                >
                  {data.attempt.state === "submitted"
                    ? "Submitted"
                    : "Submit attempt"}
                </button>
              </div>
            </aside>
          ) : (
            <aside className="answer-panel teaching-panel">
              <div className="panel-head">
                <span>Teaching notes</span>
                <span className="panel-head-actions">
                  <small>Linked to case {activeCase.position}</small>
                  <button
                    className="display-button"
                    onClick={() => void launchCompanion()}
                  >
                    Dual display
                  </button>
                </span>
              </div>
              <div className="panel-scroll">
                <span className="eyebrow">
                  Guided review · {activeCase.classification}
                </span>
                <h1>{notes[0]?.title ?? activeCase.title}</h1>
                <p className="teaching-intro">
                  {notes[0]?.body ?? activeCase.description}
                </p>
                <div className="teaching-callout">
                  <strong>Look for</strong>
                  <ul>
                    {notes[0]?.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div className="teaching-link">
                  <span>Active case</span>
                  <strong>{activeCase.title}</strong>
                  <small>
                    Note automatically follows the case and active modality.
                  </small>
                </div>
                <TeachingContentBlocks blocks={teachingContentBlocks} />
                <button
                  className="reveal-button"
                  onClick={() => setRevealNote((value) => !value)}
                  aria-expanded={revealNote}
                >
                  {revealNote
                    ? "Hide teaching explanation"
                    : "Reveal teaching explanation"}
                </button>
                {revealNote && (
                  <div className="reveal-card">
                    <span>Teaching explanation</span>
                    <p>{notes[0]?.revealText}</p>
                    <small>For education only · not a clinical report</small>
                  </div>
                )}
                <TeachingPollsPanel
                  bundle={pollBundle}
                  busy={pollBusy}
                  onStart={(pollId) =>
                    void mutateTeachingPoll(
                      { action: "start", caseId: activeCase.id, pollId },
                      "Live teaching poll opened",
                    )
                  }
                  onControl={(runId, operation, expectedVersion) =>
                    void mutateTeachingPoll(
                      {
                        action: "control",
                        caseId: activeCase.id,
                        runId,
                        operation,
                        expectedVersion,
                      },
                      operation === "reveal"
                        ? "Poll results released to learners"
                        : `Live poll ${operation === "close" ? "closed" : "reopened"}`,
                    )
                  }
                  onAnswer={(runId, selections, expectedRevision) =>
                    void mutateTeachingPoll(
                      {
                        action: "answer",
                        caseId: activeCase.id,
                        runId,
                        selections,
                        expectedRevision,
                      },
                      "Your poll response was saved",
                    )
                  }
                />
                <div className="teaching-progress">
                  <span>
                    <strong>{activeCase.position}</strong> / {data.cases.length}
                  </span>
                  <div>
                    <i
                      style={{
                        width: `${(activeCase.position / data.cases.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="panel-actions">
                <button
                  className="secondary-button"
                  disabled={activeCase.position <= 1}
                  onClick={() =>
                    chooseCase(
                      data.cases[Math.max(0, activeCase.position - 2)].id,
                    )
                  }
                >
                  Previous
                </button>
                <button
                  className="primary-button"
                  disabled={activeCase.position >= data.cases.length}
                  onClick={() =>
                    chooseCase(
                      data.cases[
                        Math.min(data.cases.length - 1, activeCase.position)
                      ].id,
                    )
                  }
                >
                  Next case
                </button>
              </div>
            </aside>
          )}
        </section>
      )}

      {view === "home" && (
        <CandidateHome
          data={presentedData}
          onOpen={(workbook) =>
            void chooseWorkbook(
              workbook.id,
              workbook.mode === "assessment" ? "exam" : "teaching",
            )
          }
        />
      )}
      {view === "content" && (
        <ContentSafety
          data={presentedData}
          busy={busy}
          postAction={postAction}
          refresh={refresh}
        />
      )}
      {view === "integrations" && <IntegrationWorkspace />}
      {view === "authoring" && (
        <WorkbookBuilder data={presentedData} busy={busy} postAction={postAction} />
      )}
      {view === "question-bank" && <QuestionBankWorkspace />}
      {view === "session-dashboard" && (
        <TeachingDashboardWorkspace onOpenTeaching={() => setView("teaching")} />
      )}
      {view === "review" && (
        <LearnerReviewWorkspace
          workbookId={
            data.accessibleWorkbooks.find(
              (workbook) =>
                workbook.id === data.course.workbookId &&
                workbook.mode === "teaching",
            )?.id ??
            data.accessibleWorkbooks.find(
              (workbook) => workbook.mode === "teaching",
            )?.id ??
            ""
          }
          onOpenCase={(caseId, workbookId) =>
            void chooseWorkbook(workbookId, "teaching", caseId)
          }
        />
      )}
      {view === "marking" && (
        <MarkingWorkspace data={presentedData} busy={busy} postAction={postAction} />
      )}
      {view === "insights" && <ProgressInsights data={presentedData} />}
      {view === "audit" && <AuditWorkspace data={presentedData} />}

      {submissionReviewOpen && (
        <SubmissionReviewDialog
          unanswered={data.cases.flatMap((item) => item.questions).filter((question) => !(answers[question.id] ?? "").trim()).length}
          flagged={data.caseFlags.filter((item) => item.flagged).length}
          pendingSaves={pendingAnswerCount}
          remainingSeconds={remainingExamTime}
          annotations={data.annotations.length}
          keyImages={data.keyImages.length}
          busy={busy}
          onClose={() => setSubmissionReviewOpen(false)}
          onConfirm={() => void confirmAttemptSubmission()}
        />
      )}

      <div className="live-region" aria-live="polite">
        {notice && <span className="toast success">{notice}</span>}
        {error && (
          <span className="toast error">
            <b>{error}</b>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </span>
        )}
      </div>
    </main>
  );
}

function CandidateHome({
  data,
  onOpen,
}: {
  data: AppSnapshot;
  onOpen: (workbook: AppSnapshot["accessibleWorkbooks"][number]) => void;
}) {
  const learnerProgress = new Map(
    data.progressDashboard
      .filter((item) => item.learnerId === data.currentUser.id)
      .map((item) => [item.workbookId, item]),
  );
  const completed = data.accessibleWorkbooks.filter(
    (workbook) => learnerProgress.get(workbook.id)?.status === "completed",
  ).length;
  return (
    <section className="management-page candidate-home-page">
      <div className="page-heading">
        <span>
          <small>My learning</small>
          <h1>Allocated workbooks</h1>
          <p>
            Open only the teaching and assessment workbooks allocated to this course account.
          </p>
        </span>
        <div className="candidate-home-summary" aria-label="Workbook summary">
          <span><strong>{data.accessibleWorkbooks.length}</strong><small>Allocated</small></span>
          <span><strong>{completed}</strong><small>Completed</small></span>
          <span><strong>{data.accessibleWorkbooks.length - completed}</strong><small>Remaining</small></span>
        </div>
      </div>
      <div className="candidate-workbook-grid">
        {data.accessibleWorkbooks.map((workbook) => {
          const progress = learnerProgress.get(workbook.id);
          const percent = progress?.percentComplete ?? 0;
          const current = workbook.id === data.course.workbookId;
          return (
            <article className={`candidate-workbook-card ${workbook.mode}`} key={workbook.id}>
              <header>
                <span className={`mode-pill ${workbook.mode}`}>
                  {workbook.mode === "assessment" ? "Exam" : "Teaching"}
                </span>
                <span className={`status-pill ${workbook.available ? "green" : "amber"}`}>
                  {workbook.available ? (progress?.status ? statusLabel(progress.status) : "Available") : "Locked"}
                </span>
              </header>
              <h2>{workbook.title}</h2>
              <dl>
                <div><dt>Duration</dt><dd>{workbook.mode === "assessment" ? `${workbook.durationMinutes} minutes` : "Self-paced"}</dd></div>
                <div><dt>Available</dt><dd>{workbook.availableFrom ? formatTime(workbook.availableFrom) : "Now"}</dd></div>
                <div><dt>Due</dt><dd>{workbook.dueAt ? formatTime(workbook.dueAt) : "No due date"}</dd></div>
                <div><dt>Access ends</dt><dd>{workbook.expiresAt ? formatTime(workbook.expiresAt) : "No expiry"}</dd></div>
              </dl>
              <div className="candidate-progress-block">
                <span><small>Completion</small><strong>{percent}%</strong></span>
                <div className="progress-track"><i style={{ width: `${percent}%` }} /></div>
              </div>
              {!workbook.available && (
                <p className="candidate-workbook-blocker">
                  {workbook.unavailableReason ?? "This allocation is not currently available."}
                </p>
              )}
              <button
                type="button"
                className="primary-button"
                disabled={!workbook.available}
                onClick={() => onOpen(workbook)}
              >
                {current ? "Return to workbook" : percent > 0 ? "Continue workbook" : "Open workbook"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SubmissionReviewDialog({
  unanswered,
  flagged,
  pendingSaves,
  remainingSeconds,
  annotations,
  keyImages,
  busy,
  onClose,
  onConfirm,
}: {
  unanswered: number;
  flagged: number;
  pendingSaves: number;
  remainingSeconds: number | null;
  annotations: number;
  keyImages: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { dialogRef } = useModalDialogFocus<HTMLDivElement>(
    onClose,
    "[data-submit-attempt]",
    "[data-submission-cancel]",
  );
  return (
    <div className="viewer-dialog-backdrop" role="presentation">
      <div
        className="viewer-dialog submission-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-review-title"
        ref={dialogRef}
      >
        <span className="eyebrow">Final assessment check</span>
        <h2 id="submission-review-title">Review before submission</h2>
        <p>
          Submission freezes the saved answers and evidence into an immutable receipt for marking.
        </p>
        <div className="submission-review-grid">
          <span className={unanswered ? "warning" : "ready"}><small>Unanswered questions</small><strong>{unanswered}</strong></span>
          <span className={flagged ? "warning" : "ready"}><small>Flagged cases</small><strong>{flagged}</strong></span>
          <span className={pendingSaves ? "warning" : "ready"}><small>Pending saves</small><strong>{pendingSaves}</strong></span>
          <span><small>Time remaining</small><strong>{formatCountdown(remainingSeconds)}</strong></span>
          <span><small>Annotations</small><strong>{annotations}</strong></span>
          <span><small>Key images</small><strong>{keyImages}</strong></span>
        </div>
        {pendingSaves > 0 && (
          <p className="submission-save-note">Pending answers will be flushed to the server before the submission receipt is created.</p>
        )}
        {unanswered > 0 && (
          <p className="submission-save-note">Unanswered questions are permitted, but they will be submitted blank.</p>
        )}
        <div className="viewer-dialog-actions">
          <button type="button" data-submission-cancel onClick={onClose}>Return to exam</button>
          <button type="button" className="primary-button" disabled={busy} onClick={onConfirm}>
            {busy ? "Saving…" : "Save and submit attempt"}
          </button>
        </div>
      </div>
    </div>
  );
}

function useModalDialogFocus<T extends HTMLElement>(
  onClose: () => void,
  restoreSelector: string,
  initialFocusSelector?: string,
) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const restoreFocusRef = useRef(true);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute("disabled"));
    const initialFocus = initialFocusSelector
      ? dialog?.querySelector<HTMLElement>(initialFocusSelector)
      : null;
    (initialFocus ?? focusable()[0])?.focus();
    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keepFocusInside);
    return () => {
      document.removeEventListener("keydown", keepFocusInside);
      if (!restoreFocusRef.current) return;
      window.setTimeout(() => {
        if (
          previous?.isConnected &&
          previous !== document.body &&
          previous !== document.documentElement
        )
          previous.focus();
        else document.querySelector<HTMLElement>(restoreSelector)?.focus();
      }, 0);
    };
  }, [initialFocusSelector, restoreSelector]);
  return {
    dialogRef,
    suppressFocusRestore: () => {
      restoreFocusRef.current = false;
    },
  };
}

function AccessibilityPanel({
  profile,
  onChange,
  onKeyboardHelp,
  onClose,
}: {
  profile: AccessibilityProfile;
  onChange: React.Dispatch<React.SetStateAction<AccessibilityProfile>>;
  onKeyboardHelp: () => void;
  onClose: () => void;
}) {
  const { dialogRef, suppressFocusRestore } =
    useModalDialogFocus<HTMLDivElement>(onClose, ".accessibility-button");
  return (
    <div
      ref={dialogRef}
      className="accessibility-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Accessibility preferences"
    >
      <header>
        <span>
          <small>Saved on this device</small>
          <strong>Accessibility profile</strong>
        </span>
        <button type="button" onClick={onClose} aria-label="Close accessibility preferences">×</button>
      </header>
      <label>
        Text size
        <select
          value={profile.textSize}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              textSize: event.target.value as AccessibilityProfile["textSize"],
            }))
          }
        >
          <option value="standard">Standard</option>
          <option value="large">Large</option>
          <option value="extra-large">Extra large</option>
        </select>
      </label>
      <fieldset className="appearance-mode-picker">
        <legend>Appearance</legend>
        <div role="radiogroup" aria-label="Light or dark appearance">
          {(["dark", "light"] as const).map((mode) => (
            <label key={mode}>
              <input
                type="radio"
                name="education-colour-mode"
                value={mode}
                checked={profile.colourMode === mode}
                onChange={() => onChange((current) => ({ ...current, colourMode: mode }))}
              />
              <span aria-hidden="true">{mode === "dark" ? "☾" : "☀"}</span>
              {mode === "dark" ? "Dark" : "Light"}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="education-palette-picker">
        <legend>Visible Medicine colour palette</legend>
        <div role="radiogroup" aria-label="Education colour palette">
          {VISIBLE_MEDICINE_PALETTES.map(([value, label]) => (
            <label key={value} data-palette-choice={value} title={label}>
              <input
                type="radio"
                name="education-colour-palette"
                value={value}
                checked={profile.palette === value}
                onChange={() => onChange((current) => ({ ...current, palette: value }))}
              />
              <span className="palette-swatch" aria-hidden="true" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <small>Applies to Visible Medicine on this device only.</small>
      </fieldset>
      {[
        ["highContrast", "High contrast", "Increase panel and focus contrast"],
        ["largeTargets", "Larger controls", "Increase interactive target sizes"],
        ["reducedMotion", "Reduced motion", "Stop non-essential transitions"],
      ].map(([key, label, detail]) => (
        <label
          className="accessibility-check"
          key={key}
          aria-label={label + ": " + detail}
        >
          <input
            type="checkbox"
            checked={Boolean(profile[key as keyof AccessibilityProfile])}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                [key]: event.target.checked,
              }))
            }
          />
          <span>
            <strong>{label}</strong>
            <small>{detail}</small>
          </span>
        </label>
      ))}
      <div className="accessibility-presets">
        <button type="button" onClick={() => onChange(DEFAULT_ACCESSIBILITY)}>
          Default
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              textSize: "extra-large",
              colourMode: profile.colourMode,
              palette: profile.palette,
              highContrast: true,
              largeTargets: true,
              reducedMotion: false,
            })
          }
        >
          Low-vision preset
        </button>
      </div>
      <button
        type="button"
        className="keyboard-help-button"
        onClick={() => {
          suppressFocusRestore();
          onKeyboardHelp();
        }}
      >
        View keyboard shortcuts
      </button>
    </div>
  );
}

function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const { dialogRef } =
    useModalDialogFocus<HTMLElement>(onClose, ".accessibility-button");
  const shortcuts = [
    ["Alt + ← / →", "Previous or next case"],
    ["[ / ]", "Previous or next instructor scene"],
    ["Space", "Play or pause scene sequence when the scene tray is focused"],
    ["F", "Full-screen viewer when the scene tray is focused"],
    ["?", "Open this keyboard guide"],
    ["Esc", "Close open help or preference panels"],
  ];
  return (
    <section ref={dialogRef} className="keyboard-help" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <header>
        <span>
          <small>Keyboard operation</small>
          <strong>Visible Medicine shortcuts</strong>
        </span>
        <button type="button" onClick={onClose} aria-label="Close keyboard shortcuts">×</button>
      </header>
      <dl>
        {shortcuts.map(([keys, action]) => (
          <div key={keys}>
            <dt>{keys}</dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
      <p>
        Viewer controls, cases, questions and teaching content retain visible
        keyboard focus. Press Tab to move through controls.
      </p>
    </section>
  );
}

function ViewerTextAnnotationDialog({
  onAdd,
  onCancel,
}: {
  onAdd: (label: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("Teaching point");
  const { dialogRef } = useModalDialogFocus<HTMLDivElement>(
    onCancel,
    '.viewport[data-active-tool="text"]',
    "#viewer-annotation-text",
  );
  const trimmedLabel = label.trim().slice(0, 120);
  return (
    <div className="viewer-dialog-backdrop">
      <div
        ref={dialogRef}
        className="viewer-text-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewer-text-dialog-title"
      >
        <header>
          <span>
            <small>Manual viewer markup</small>
            <strong id="viewer-text-dialog-title">Add text annotation</strong>
          </span>
          <button type="button" onClick={onCancel} aria-label="Cancel text annotation">
            ×
          </button>
        </header>
        <label htmlFor="viewer-annotation-text">
          Annotation text
          <input
            id="viewer-annotation-text"
            value={label}
            maxLength={120}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && trimmedLabel) {
                event.preventDefault();
                onAdd(trimmedLabel);
              }
            }}
          />
        </label>
        <small>{label.length}/120 characters · educational markup only</small>
        <footer>
          <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="primary-button"
            disabled={!trimmedLabel}
            onClick={() => onAdd(trimmedLabel)}
          >
            Add annotation
          </button>
        </footer>
      </div>
    </div>
  );
}

function ExamPreflightPanel({
  data,
  online,
  onComplete,
}: {
  data: AppSnapshot;
  online: boolean;
  onComplete: (checkCount: number) => Promise<boolean>;
}) {
  const [checked, setChecked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaReady = data.assessmentPreflight.mediaReady;
  const checks = [
    {
      label: "Secure education connection",
      detail: online ? "Online and ready for server autosave" : "No network connection",
      pass: online,
      critical: true,
    },
    {
      label: "Assessment media manifests",
      detail: mediaReady
        ? `${data.assessmentPreflight.caseCount} cases passed server-side education media readiness`
        : "One or more cases is missing education media",
      pass: mediaReady,
      critical: true,
    },
    {
      label: "Answer recovery channel",
      detail: "Per-question save queue ready; answers remain server-authoritative",
      pass: true,
      critical: true,
    },
    {
      label: "Display policy",
      detail: data.course.dualDisplayAllowed
        ? "One or two displays permitted by this version"
        : "Single display required by this version",
      pass: true,
      critical: false,
    },
    {
      label: "Immutable assessment version",
      detail: `v${data.course.workbookVersion} · ${shortHash(data.course.assessmentHash)}`,
      pass: Boolean(data.course.assessmentHash),
      critical: true,
    },
  ];
  const allCriticalPass = checks.every((check) => !check.critical || check.pass);
  return (
    <section className="exam-preflight" aria-label="Exam readiness checks">
      <header>
        <span>
          <small>Before entering the answer workspace</small>
          <h1>Exam preflight</h1>
        </span>
        <span className={allCriticalPass ? "status-pill green" : "status-pill amber"}>
          {checked ? (allCriticalPass ? "Ready" : "Action needed") : "Not checked"}
        </span>
      </header>
      <p>
        Check connectivity, media readiness, version integrity and recovery
        before the timed assessment. No clinical system is contacted.
      </p>
      <div className="preflight-checks">
        {checks.map((check) => (
          <div key={check.label}>
            <span aria-hidden="true">{checked ? (check.pass ? "✓" : "!") : "·"}</span>
            <span>
              <strong>{check.label}</strong>
              <small>{check.detail}</small>
            </span>
            {check.critical && <i>Critical</i>}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setChecked(true)}>
        {checked ? "Run checks again" : "Run readiness checks"}
      </button>
      {checked && (
        <label className="preflight-acknowledgement">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          I understand this is an education-only assessment and answers save to
          this separate education environment.
        </label>
      )}
      <button
        type="button"
        className="primary-button"
        disabled={busy || !checked || !allCriticalPass || !acknowledged}
        onClick={async () => {
          setBusy(true);
          await onComplete(checks.length);
          setBusy(false);
        }}
      >
        {busy ? "Recording readiness…" : "Enter exam workspace"}
      </button>
    </section>
  );
}

function ExamRecoveryStatus({
  online,
  pending,
  saveStatus,
  revision,
  updatedAt,
}: {
  online: boolean;
  pending: boolean;
  saveStatus: string;
  revision: number;
  updatedAt: string | null;
}) {
  return (
    <section
      className={"exam-recovery-status" + (!online || pending ? " warning" : "")}
      aria-live="polite"
    >
      <span>
        <i aria-hidden="true" />
        <strong>{online ? (pending ? "Recovery pending" : "Connected") : "Offline"}</strong>
      </span>
      <span>{saveStatus}</span>
      <small>
        Server revision {revision} · {updatedAt ? formatTime(updatedAt) : "not yet saved"}
      </small>
    </section>
  );
}

function TeachingSessionBar({
  bundle,
  busy,
  onStart,
  onEnd,
  onFollowState,
}: {
  bundle: TeachingSessionBundle;
  busy: boolean;
  onStart: () => void;
  onEnd: () => void;
  onFollowState: (state: "following" | "exploring") => void;
}) {
  const session = bundle.session;
  const followState = bundle.participant?.followState ?? "following";
  return (
    <section
      className={`live-teaching-bar${session ? " active" : ""}`}
      aria-label="Instructor-led live teaching session"
    >
      <span className="live-session-status">
        <i aria-hidden="true" />
        <span>
          <strong>
            {session ? "Follow Me session live" : "Instructor-led teaching"}
          </strong>
          <small>
            {session
              ? `Started ${formatTime(session.startedAt)} · viewer revision ${session.version}`
              : "Broadcast the case, series, slice and zoom to enrolled learners"}
          </small>
        </span>
      </span>
      {session && bundle.permissions.manage && (
        <span className="live-session-metrics">
          <b>{session.followingCount}</b>
          <small>following</small>
          <b>{session.participantCount}</b>
          <small>present</small>
        </span>
      )}
      <span className="live-session-actions">
        {session && (
          <LiveTeachingRoom
            sessionId={session.id}
            workbookId={session.workbookId}
            canManage={bundle.permissions.manage}
          />
        )}
        {bundle.permissions.manage &&
          (session ? (
            <button type="button" disabled={busy} onClick={onEnd}>
              End session
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={onStart}
            >
              Start Follow Me
            </button>
          ))}
        {!bundle.permissions.manage && bundle.permissions.follow && session && (
          <button
            type="button"
            className={followState === "following" ? "following" : ""}
            disabled={busy}
            onClick={() =>
              onFollowState(
                followState === "following" ? "exploring" : "following",
              )
            }
          >
            {followState === "following"
              ? "Explore independently"
              : "Rejoin instructor"}
          </button>
        )}
      </span>
    </section>
  );
}

function TeachingPollsPanel({
  bundle,
  busy,
  onStart,
  onControl,
  onAnswer,
}: {
  bundle: TeachingPollBundle;
  busy: boolean;
  onStart: (pollId: string) => void;
  onControl: (
    runId: string,
    operation: "close" | "reopen" | "reveal",
    expectedVersion: number,
  ) => void;
  onAnswer: (
    runId: string,
    selections: string[],
    expectedRevision: number,
  ) => void;
}) {
  const [draftSelections, setDraftSelections] = useState<
    Record<string, string[]>
  >({});

  function selectionsFor(poll: TeachingPollView) {
    if (!poll.run) return [];
    return draftSelections[poll.run.id] ?? poll.ownResponse?.selections ?? [];
  }

  function toggleSelection(poll: TeachingPollView, optionId: string) {
    if (!poll.run) return;
    const current = selectionsFor(poll);
    const next =
      poll.selectionMode === "single"
        ? [optionId]
        : current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
    setDraftSelections((selections) => ({
      ...selections,
      [poll.run!.id]: next,
    }));
  }

  if (!bundle.polls.length)
    return (
      <section className="teaching-polls empty">
        <header>
          <span>
            <small>Interactive teaching</small>
            <strong>Live polls</strong>
          </span>
        </header>
        <p>No live polls are linked to this case.</p>
      </section>
    );

  return (
    <section
      className="teaching-polls"
      aria-label="Live case-linked teaching polls"
    >
      <header>
        <span>
          <small>Interactive teaching</small>
          <strong>Live polls</strong>
        </span>
        <span className="live-poll-refresh">Updates every 3 seconds</span>
      </header>
      {bundle.polls.map((poll, pollIndex) => {
        const run = poll.run;
        const selections = selectionsFor(poll);
        const answerOpen = Boolean(
          run &&
          run.state === "open" &&
          !run.resultsRevealed &&
          bundle.permissions.answer,
        );
        const showResults = Boolean(
          run?.results && (bundle.permissions.manage || run.resultsRevealed),
        );
        return (
          <article
            className={`teaching-poll-card${run?.state === "open" ? " live" : ""}`}
            key={poll.id}
          >
            <div className="poll-title-row">
              <span>
                <small>
                  Poll {pollIndex + 1} ·{" "}
                  {poll.selectionMode === "single"
                    ? "Choose one"
                    : "Choose all that apply"}
                </small>
                <strong>{poll.prompt}</strong>
              </span>
              <span className={`poll-state ${run?.state ?? "ready"}`}>
                {run
                  ? run.resultsRevealed
                    ? "Results released"
                    : run.state === "open"
                      ? "Live"
                      : "Closed"
                  : "Ready"}
              </span>
            </div>
            {answerOpen && (
              <form
                className="poll-answer"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (run && selections.length)
                    onAnswer(
                      run.id,
                      selections,
                      poll.ownResponse?.revision ?? 0,
                    );
                }}
              >
                <fieldset disabled={busy}>
                  <legend className="sr-only">{poll.prompt}</legend>
                  {poll.options.map((option) => (
                    <label
                      key={option.id}
                      className={
                        selections.includes(option.id) ? "selected" : ""
                      }
                    >
                      <input
                        type={
                          poll.selectionMode === "single" ? "radio" : "checkbox"
                        }
                        name={`poll-${run!.id}`}
                        checked={selections.includes(option.id)}
                        onChange={() => toggleSelection(poll, option.id)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                <button
                  className="primary-button"
                  disabled={busy || selections.length === 0}
                >
                  {poll.ownResponse ? "Update my response" : "Submit response"}
                </button>
                <small>
                  {poll.ownResponse
                    ? `Saved revision ${poll.ownResponse.revision} · you can change it while the poll is live`
                    : "Your individual response is private; the instructor sees anonymous totals."}
                </small>
              </form>
            )}
            {!answerOpen &&
              bundle.permissions.answer &&
              run?.state === "closed" &&
              !run.resultsRevealed && (
                <p className="poll-waiting">
                  Poll closed · awaiting instructor discussion.
                </p>
              )}
            {!run &&
              bundle.permissions.answer &&
              !bundle.permissions.manage && (
                <p className="poll-waiting">
                  Waiting for the instructor to open this poll.
                </p>
              )}
            {showResults && run && (
              <div
                className="poll-results"
                aria-label={`${run.responseCount} responses`}
              >
                <div className="poll-response-count">
                  <strong>{run.responseCount}</strong>
                  <span>
                    anonymous response{run.responseCount === 1 ? "" : "s"}
                  </span>
                </div>
                {poll.options.map((option) => {
                  const result = run.results?.find(
                    (item) => item.optionId === option.id,
                  );
                  const correct =
                    run.resultsRevealed &&
                    poll.correctOptionIds.includes(option.id);
                  return (
                    <div
                      className={`poll-result${correct ? " correct" : ""}`}
                      key={option.id}
                    >
                      <span>
                        <b>{option.label}</b>
                        <small>
                          {result?.count ?? 0} · {result?.percentage ?? 0}%
                          {correct ? " · teaching answer" : ""}
                        </small>
                      </span>
                      <div>
                        <i style={{ width: `${result?.percentage ?? 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {run?.resultsRevealed && poll.explanation && (
              <div className="poll-explanation">
                <strong>Teaching explanation</strong>
                <p>{poll.explanation}</p>
              </div>
            )}
            {bundle.permissions.manage && (
              <div className="poll-manager-controls">
                {!run && (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={busy}
                    onClick={() => onStart(poll.id)}
                  >
                    Open live poll
                  </button>
                )}
                {run?.state === "open" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onControl(run.id, "close", run.version)}
                  >
                    Close responses
                  </button>
                )}
                {run?.state === "closed" && !run.resultsRevealed && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onControl(run.id, "reopen", run.version)}
                    >
                      Reopen
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busy}
                      onClick={() => onControl(run.id, "reveal", run.version)}
                    >
                      Reveal results & answer
                    </button>
                  </>
                )}
                {run?.resultsRevealed && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onStart(poll.id)}
                  >
                    Run this poll again
                  </button>
                )}
                {run && (
                  <a
                    className="poll-export"
                    href={`/api/education/teaching-polls/export?runId=${encodeURIComponent(run.id)}`}
                    download
                  >
                    Export aggregate CSV
                  </a>
                )}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function ViewerSceneTray({
  mode,
  presentations,
  bookmarks,
  busy,
  canManage,
  canBookmark,
  onSaveInstructor,
  onSaveBookmark,
  onRestore,
}: {
  mode: "teaching" | "exam";
  presentations: InstructorPresentation[];
  bookmarks: LearnerBookmark[];
  busy: boolean;
  canManage: boolean;
  canBookmark: boolean;
  onSaveInstructor: () => Promise<void>;
  onSaveBookmark: () => Promise<void>;
  onRestore: (scene: ViewerScene) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [activeSceneKey, setActiveSceneKey] = useState("");
  const [playing, setPlaying] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const presentationScenes = presentations.flatMap((presentation) =>
    presentation.scenes.map((scene, index) => ({
      key: `${presentation.id}:${index}`,
      scene,
      title: presentation.title,
      index,
      total: presentation.scenes.length,
    })),
  );
  const activeSceneIndex = presentationScenes.findIndex(
    (item) => item.key === activeSceneKey,
  );

  useEffect(() => {
    if (!playing || !presentationScenes.length) return;
    const timer = window.setInterval(() => {
      const current = presentationScenes.findIndex(
        (item) => item.key === activeSceneKey,
      );
      const next = current < 0 ? 0 : current + 1;
      if (next >= presentationScenes.length) {
        setPlaying(false);
        return;
      }
      restorePresentationScene(next);
    }, 5000);
    return () => window.clearInterval(timer);
    // Playback advances the current immutable scene sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, activeSceneKey, presentationScenes.length]);

  useEffect(() => {
    const viewer = document.querySelector<HTMLElement>(".didanix-viewer");
    viewer?.classList.toggle("viewer-windowed-fullscreen", fallbackFullscreen);
    function exitFallback(event: KeyboardEvent) {
      if (event.key === "Escape") setFallbackFullscreen(false);
    }
    window.addEventListener("keydown", exitFallback);
    return () => {
      window.removeEventListener("keydown", exitFallback);
      viewer?.classList.remove("viewer-windowed-fullscreen");
    };
  }, [fallbackFullscreen]);

  function restorePresentationScene(index: number) {
    const item = presentationScenes[index];
    if (!item) return;
    setActiveSceneKey(item.key);
    void onRestore(item.scene);
  }

  function toggleViewerFullscreen() {
    const viewer = document.querySelector<HTMLElement>(".didanix-viewer");
    if (!viewer) return;
    const next = !viewer.classList.contains("viewer-windowed-fullscreen");
    viewer.classList.toggle("viewer-windowed-fullscreen", next);
    setFallbackFullscreen(next);
  }

  return (
    <div
      className={`viewer-scene-tray${open ? " open" : ""}`}
      role="toolbar"
      aria-label="Instructor presentations and learner bookmarks"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === " ") {
          event.preventDefault();
          setPlaying((value) => !value);
        } else if (event.key === "[") {
          event.preventDefault();
          restorePresentationScene(activeSceneIndex - 1);
        } else if (event.key === "]") {
          event.preventDefault();
          restorePresentationScene(activeSceneIndex < 0 ? 0 : activeSceneIndex + 1);
        } else if (event.key.toLocaleLowerCase() === "f") {
          event.preventDefault();
          toggleViewerFullscreen();
        }
      }}
    >
      <header className="scene-tray-bar">
        <button
          type="button"
          className="scene-tray-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{open ? "⌄" : "⌃"}</span>
          <strong>Scenes & bookmarks</strong>
          <small>
            {presentationScenes.length} instructor · {bookmarks.length} private
          </small>
        </button>
        <div
          className="scene-playback-controls"
          aria-label="Presentation playback"
        >
          <button
            type="button"
            disabled={!presentationScenes.length}
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "Pause instructor scene sequence" : "Play instructor scene sequence"}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
          <button
            type="button"
            disabled={!presentationScenes.length || activeSceneIndex <= 0}
            onClick={() => restorePresentationScene(activeSceneIndex - 1)}
            aria-label="Previous instructor scene"
          >
            ‹
          </button>
          <span>
            {presentationScenes.length
              ? `${Math.max(0, activeSceneIndex) + 1} / ${presentationScenes.length}`
              : "No scenes"}
          </span>
          <button
            type="button"
            disabled={
              !presentationScenes.length ||
              activeSceneIndex >= presentationScenes.length - 1
            }
            onClick={() =>
              restorePresentationScene(
                activeSceneIndex < 0 ? 0 : activeSceneIndex + 1,
              )
            }
            aria-label="Next instructor scene"
          >
            ›
          </button>
          <button
            type="button"
            onClick={toggleViewerFullscreen}
            aria-label="Toggle full-screen viewer"
            aria-pressed={fallbackFullscreen || undefined}
          >
            ⛶
          </button>
        </div>
        <div className="scene-tray-actions">
          {canManage && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSaveInstructor()}
            >
              ＋ Add instructor scene
            </button>
          )}
          {canBookmark && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSaveBookmark()}
            >
              ☆ Save private bookmark
            </button>
          )}
        </div>
      </header>
      {open && (
        <div className="scene-tray-content">
          {mode === "exam" && presentations.length === 0 && (
            <div className="exam-scene-lock compact">
              <b>Instructor material hidden</b>
              <small>
                Model scenes and answer-bearing labels remain unavailable until
                the examination policy permits release.
              </small>
            </div>
          )}
          {presentationScenes.length > 0 && (
            <nav
              className="scene-thumbnail-rail"
              aria-label="Instructor scenes"
            >
              {presentationScenes.map((item, index) => (
                <button
                  type="button"
                  key={item.key}
                  className={activeSceneKey === item.key ? "active" : ""}
                  onClick={() => restorePresentationScene(index)}
                >
                  <span className="scene-miniature" aria-hidden="true">
                    <i />
                    <b>
                      {item.scene.viewports[0]?.plane.slice(0, 3) ?? "view"}
                    </b>
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      Scene {item.index + 1}/{item.total} ·{" "}
                      {item.scene.crosshairPatient ? "localizer" : "saved view"}
                    </small>
                  </span>
                </button>
              ))}
            </nav>
          )}
          {bookmarks.length > 0 && (
            <nav
              className="bookmark-thumbnail-rail"
              aria-label="Private learner bookmarks"
            >
              {bookmarks.map((bookmark) => (
                <button
                  type="button"
                  key={bookmark.id}
                  onClick={() => void onRestore(bookmark.scene)}
                >
                  <span aria-hidden="true">★</span>
                  <span>
                    <strong>{bookmark.title}</strong>
                    <small>Private bookmark · v{bookmark.version}</small>
                  </span>
                </button>
              ))}
            </nav>
          )}
          {!presentationScenes.length &&
            !bookmarks.length &&
            mode === "teaching" && (
              <p className="scene-tray-empty">
                Save an instructor scene or private bookmark from the current
                viewer state.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function CompanionCasePanel({
  mode,
  data,
  activeCase,
  answers,
  editable,
  remainingExamTime,
  saveStatus,
  revealNote,
  busy,
  pollBundle,
  pollBusy,
  onAnswer,
  onReveal,
  onCase,
  onSubmit,
  onPollStart,
  onPollControl,
  onPollAnswer,
}: {
  mode: "exam" | "teaching";
  data: AppSnapshot;
  activeCase: EducationCase;
  answers: Record<string, string>;
  editable: boolean;
  remainingExamTime: number | null;
  saveStatus: string;
  revealNote: boolean;
  busy: boolean;
  pollBundle: TeachingPollBundle;
  pollBusy: boolean;
  onAnswer: (questionId: string, value: string) => void;
  onReveal: () => void;
  onCase: (caseId: string) => void;
  onSubmit: () => void;
  onPollStart: (pollId: string) => void;
  onPollControl: (
    runId: string,
    operation: "close" | "reopen" | "reveal",
    expectedVersion: number,
  ) => void;
  onPollAnswer: (
    runId: string,
    selections: string[],
    expectedRevision: number,
  ) => void;
}) {
  const note = data.teachingNotes.find((item) => item.caseId === activeCase.id);
  const teachingContentBlocks = data.teachingContentBlocks.filter(
    (block) => block.caseId === activeCase.id,
  );
  return (
    <section
      className={`companion-panel ${mode === "teaching" ? "teaching-panel" : ""}`}
    >
      <div className="panel-head">
        <span>
          {mode === "exam"
            ? `Question ${activeCase.position} of ${data.cases.length}`
            : "Teaching notes"}
        </span>
        {mode === "exam" && (
          <time
            className={`exam-countdown${remainingExamTime === 0 ? " expired" : remainingExamTime !== null && remainingExamTime <= 300 ? " warning" : ""}`}
            aria-label={`Assessment time remaining ${formatCountdown(remainingExamTime)}`}
            dateTime={data.attempt.deadlineAt || undefined}
          >
            {formatCountdown(remainingExamTime)}
          </time>
        )}
        <small
          className={
            saveStatus.includes("attention") ? "error-text" : "saved-state"
          }
        >
          {mode === "exam"
            ? saveStatus
            : `Linked to case ${activeCase.position}`}
        </small>
      </div>
      <div className="companion-case-picker">
        <label htmlFor="companion-case">Active case</label>
        <select
          id="companion-case"
          value={activeCase.id}
          onChange={(event) => onCase(event.target.value)}
        >
          {data.cases.map((item) => (
            <option value={item.id} key={item.id}>
              {String(item.position).padStart(2, "0")} · {item.title}
            </option>
          ))}
        </select>
        <span className={`modality-badge ${activeCase.classification}`}>
          {activeCase.classification === "radiology"
            ? "CT"
            : activeCase.classification === "pathology"
              ? "WSI"
              : "MIX"}
        </span>
      </div>
      {mode === "exam" ? (
        <div className="panel-scroll">
          <span className="eyebrow">
            Case {String(activeCase.position).padStart(2, "0")} ·{" "}
            {activeCase.maxMarks} marks
          </span>
          <h1>{activeCase.title}</h1>
          <p className="case-description">{activeCase.description}</p>
          {activeCase.questions.map((question, index) => {
            const response = answers[question.id] ?? "";
            const saved = data.answers.find(
              (item) => item.questionId === question.id,
            );
            const fieldId = `companion-answer-${question.id}`;
            return (
              <section className="case-question" key={question.id}>
                <h2>
                  Question {index + 1}
                  <small>{question.maxMarks} marks</small>
                </h2>
                <p>{question.prompt}</p>
                <label htmlFor={fieldId}>Your answer</label>
                <textarea
                  id={fieldId}
                  disabled={!editable}
                  value={response}
                  onChange={(event) => onAnswer(question.id, event.target.value)}
                  placeholder={
                    editable
                      ? "Enter your structured educational response…"
                      : "This submitted answer is read-only."
                  }
                />
                <div className="answer-meta">
                  <span>
                    {response.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  <span>Revision {saved?.revision ?? 0}</span>
                </div>
              </section>
            );
          })}
          <div className="companion-integrity">
            <strong>Synchronized assessment workspace</strong>
            <p>
              The image remains on display one. This answer is revision-safe and
              linked to the same immutable attempt.
            </p>
            <code>{shortHash(data.course.assessmentHash)}</code>
          </div>
        </div>
      ) : (
        <div className="panel-scroll">
          <span className="eyebrow">
            Guided review · {activeCase.classification}
          </span>
          <h1>{note?.title ?? activeCase.title}</h1>
          <p className="teaching-intro">
            {note?.body ?? activeCase.description}
          </p>
          <div className="teaching-callout">
            <strong>Look for</strong>
            <ul>
              {note?.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="teaching-link">
            <span>Active case</span>
            <strong>{activeCase.title}</strong>
            <small>
              This synchronized note follows the case selected beside the
              viewer.
            </small>
          </div>
          <TeachingContentBlocks blocks={teachingContentBlocks} />
          <button
            className="reveal-button"
            onClick={onReveal}
            aria-expanded={revealNote}
          >
            {revealNote
              ? "Hide teaching explanation"
              : "Reveal teaching explanation"}
          </button>
          {revealNote && (
            <div className="reveal-card">
              <span>Teaching explanation</span>
              <p>{note?.revealText}</p>
              <small>For education only · not a clinical report</small>
            </div>
          )}
          <TeachingPollsPanel
            bundle={pollBundle}
            busy={pollBusy}
            onStart={onPollStart}
            onControl={onPollControl}
            onAnswer={onPollAnswer}
          />
        </div>
      )}
      <div className="panel-actions">
        <button
          className="secondary-button"
          disabled={activeCase.position <= 1}
          onClick={() =>
            onCase(data.cases[Math.max(0, activeCase.position - 2)].id)
          }
        >
          Previous
        </button>
        {mode === "exam" ? (
          <button
            className="primary-button"
            disabled={!editable || busy}
            onClick={onSubmit}
          >
            {data.attempt.state === "submitted"
              ? "Submitted"
              : "Submit attempt"}
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={activeCase.position >= data.cases.length}
            onClick={() =>
              onCase(
                data.cases[Math.min(data.cases.length - 1, activeCase.position)]
                  .id,
              )
            }
          >
            Next case
          </button>
        )}
      </div>
    </section>
  );
}

function TeachingContentBlocks({
  blocks,
}: {
  blocks: TeachingContentBlockView[];
}) {
  if (!blocks.length) return null;
  return (
    <section className="structured-teaching-content" aria-label="Case teaching content">
      <header>
        <small>Instructor sequence</small>
        <strong>Teaching content</strong>
      </header>
      {blocks.map((block) => (
        <article className={"teaching-content-block " + block.type} key={block.id}>
          {block.type === "case-image" && (
            <span className="content-image-preview" aria-hidden="true"><i /></span>
          )}
          {block.type === "explanation" ? (
            <details>
              <summary>{block.title}</summary>
              <p>{block.body}</p>
            </details>
          ) : (
            <>
              <strong>{block.title}</strong>
              {block.type === "key-points" ? (
                <ul>
                  {keyPointsFromBody(block.body).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : block.type === "reading-link" ? (
                <>
                  {block.body && <p>{block.body}</p>}
                  <a href={block.url} target="_blank" rel="noreferrer">
                    Open approved reading ↗
                  </a>
                </>
              ) : (
                <p>{block.body}</p>
              )}
              {block.type === "scene" && (
                <small>Use Scenes &amp; bookmarks below the viewer to restore this view.</small>
              )}
            </>
          )}
        </article>
      ))}
    </section>
  );
}

type PollAuthoringDraft = {
  id: string;
  caseId: string;
  prompt: string;
  selectionMode: "single" | "multiple";
  options: Array<{ id: string; label: string; correct: boolean }>;
  explanation: string;
};

function newPollDraft(caseId: string): PollAuthoringDraft {
  return {
    id: crypto.randomUUID(),
    caseId,
    prompt: "",
    selectionMode: "single",
    options: [
      { id: crypto.randomUUID(), label: "", correct: false },
      { id: crypto.randomUUID(), label: "", correct: false },
    ],
    explanation: "",
  };
}

function PollAuthoringPanel({
  cases,
  selectedCaseIds,
  drafts,
  setDrafts,
}: {
  cases: EducationCase[];
  selectedCaseIds: string[];
  drafts: PollAuthoringDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<PollAuthoringDraft[]>>;
}) {
  const availableCases = cases.filter((item) =>
    selectedCaseIds.includes(item.id),
  );

  function updateDraft(id: string, change: Partial<PollAuthoringDraft>) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, ...change } : draft,
      ),
    );
  }

  function updateOption(
    draftId: string,
    optionId: string,
    change: { label?: string; correct?: boolean },
  ) {
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== draftId) return draft;
        return {
          ...draft,
          options: draft.options.map((option) => {
            if (change.correct && draft.selectionMode === "single")
              return { ...option, correct: option.id === optionId };
            return option.id === optionId ? { ...option, ...change } : option;
          }),
        };
      }),
    );
  }

  return (
    <section className="management-card poll-authoring-card">
      <div className="card-heading">
        <span>
          <small>Optional interactive teaching</small>
          <h2>Live polls</h2>
        </span>
        <span className="status-pill">{drafts.length} / 12</span>
      </div>
      <div className="poll-authoring-intro">
        <p>
          Add case-linked multiple-choice questions. Learners answer in the
          teaching notes panel; instructors control opening, closing and answer
          release while viewing anonymous totals.
        </p>
        <button
          type="button"
          disabled={!availableCases.length || drafts.length >= 12}
          onClick={() =>
            setDrafts((current) => [
              ...current,
              newPollDraft(availableCases[0]?.id ?? ""),
            ])
          }
        >
          ＋ Add poll
        </button>
      </div>
      {!drafts.length && (
        <div className="poll-authoring-empty">
          No poll added. This teaching workbook can still be created with notes
          only.
        </div>
      )}
      <div className="poll-draft-list">
        {drafts.map((draft, index) => {
          const linkedCaseSelected = selectedCaseIds.includes(draft.caseId);
          return (
            <article className="poll-draft" key={draft.id}>
              <header>
                <strong>Poll {index + 1}</strong>
                <button
                  type="button"
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter((item) => item.id !== draft.id),
                    )
                  }
                >
                  Remove
                </button>
              </header>
              <div className="poll-draft-fields">
                <label>
                  Linked case
                  <select
                    value={draft.caseId}
                    onChange={(event) =>
                      updateDraft(draft.id, { caseId: event.target.value })
                    }
                  >
                    {availableCases.map((item) => (
                      <option value={item.id} key={item.id}>
                        {String(item.position).padStart(2, "0")} · {item.title}
                      </option>
                    ))}
                    {!linkedCaseSelected && (
                      <option value={draft.caseId}>
                        Case is no longer selected
                      </option>
                    )}
                  </select>
                </label>
                <label>
                  Response type
                  <select
                    value={draft.selectionMode}
                    onChange={(event) => {
                      const selectionMode = event.target.value as
                        "single" | "multiple";
                      updateDraft(draft.id, {
                        selectionMode,
                        options:
                          selectionMode === "single"
                            ? draft.options.map((option, optionIndex) => ({
                                ...option,
                                correct:
                                  option.correct &&
                                  !draft.options
                                    .slice(0, optionIndex)
                                    .some((item) => item.correct),
                              }))
                            : draft.options,
                      });
                    }}
                  >
                    <option value="single">Choose one</option>
                    <option value="multiple">Choose all that apply</option>
                  </select>
                </label>
              </div>
              <label>
                Question
                <textarea
                  maxLength={500}
                  value={draft.prompt}
                  onChange={(event) =>
                    updateDraft(draft.id, { prompt: event.target.value })
                  }
                  placeholder="What is the most likely explanation for this appearance?"
                />
              </label>
              <fieldset className="poll-choice-editor">
                <legend>
                  Choices <small>Select the teaching answer before creation.</small>
                </legend>
                {draft.options.map((option, optionIndex) => (
                  <div key={option.id}>
                    <label className="correct-choice" title="Teaching answer">
                      <input
                        type={
                          draft.selectionMode === "single"
                            ? "radio"
                            : "checkbox"
                        }
                        name={`correct-${draft.id}`}
                        checked={option.correct}
                        onChange={(event) =>
                          updateOption(draft.id, option.id, {
                            correct: event.target.checked,
                          })
                        }
                      />
                      <span>Correct</span>
                    </label>
                    <label>
                      <span className="sr-only">Choice {optionIndex + 1}</span>
                      <input
                        maxLength={240}
                        value={option.label}
                        onChange={(event) =>
                          updateOption(draft.id, option.id, {
                            label: event.target.value,
                          })
                        }
                        placeholder={`Choice ${optionIndex + 1}`}
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Remove choice ${optionIndex + 1}`}
                      disabled={draft.options.length <= 2}
                      onClick={() =>
                        updateDraft(draft.id, {
                          options: draft.options.filter(
                            (item) => item.id !== option.id,
                          ),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="poll-choice-actions">
                  <button
                    type="button"
                    disabled={draft.options.length >= 8}
                    onClick={() =>
                      updateDraft(draft.id, {
                        options: [
                          ...draft.options,
                          {
                            id: crypto.randomUUID(),
                            label: "",
                            correct: false,
                          },
                        ],
                      })
                    }
                  >
                    ＋ Add choice
                  </button>
                  {draft.options.some((option) => option.correct) && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft(draft.id, {
                          options: draft.options.map((option) => ({
                            ...option,
                            correct: false,
                          })),
                        })
                      }
                    >
                      Clear teaching answer
                    </button>
                  )}
                </div>
              </fieldset>
              <label>
                Explanation shown after release
                <textarea
                  maxLength={1500}
                  value={draft.explanation}
                  onChange={(event) =>
                    updateDraft(draft.id, { explanation: event.target.value })
                  }
                  placeholder="Optional discussion point or teaching explanation"
                />
              </label>
              {!linkedCaseSelected && (
                <p className="poll-draft-warning">
                  Re-select the linked case or remove this poll before creating
                  the workbook.
                </p>
              )}
              {!draft.options.some((option) => option.correct) && (
                <p className="poll-draft-warning">
                  Select at least one correct choice so released poll results
                  can include a governed teaching answer.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

type TeachingBlockAuthoringDraft = {
  id: string;
  caseId: string;
  type: TeachingContentBlockType;
  title: string;
  body: string;
  url: string;
};

type QuestionAuthoringDraft = {
  questionId: string;
  caseId: string;
  prompt: string;
};

function newTeachingBlock(caseId: string): TeachingBlockAuthoringDraft {
  return {
    id: crypto.randomUUID(),
    caseId,
    type: "text",
    title: "",
    body: "",
    url: "",
  };
}

function TeachingContentComposer({
  cases,
  selectedCaseIds,
  drafts,
  setDrafts,
}: {
  cases: EducationCase[];
  selectedCaseIds: string[];
  drafts: TeachingBlockAuthoringDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<TeachingBlockAuthoringDraft[]>>;
}) {
  const availableCases = cases.filter((item) => selectedCaseIds.includes(item.id));
  function update(id: string, change: Partial<TeachingBlockAuthoringDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...change } : draft)),
    );
  }
  return (
    <section className="management-card content-composer-card">
      <div className="card-heading">
        <span>
          <small>Case-linked learning design</small>
          <h2>Teaching content composer</h2>
        </span>
        <span className="status-pill">{drafts.length} / 60</span>
      </div>
      <div className="content-composer-intro">
        <p>
          Build the notes panel from ordered text, key-point, explanation,
          reading, image and saved-scene blocks. The preview shows the learner view.
        </p>
        <button
          type="button"
          disabled={!availableCases.length || drafts.length >= 60}
          onClick={() =>
            setDrafts((current) => [
              ...current,
              newTeachingBlock(availableCases[0]?.id ?? ""),
            ])
          }
        >
          ＋ Add content block
        </button>
      </div>
      {!drafts.length && (
        <p className="content-composer-empty">
          No structured block added. Existing case notes remain available.
        </p>
      )}
      <div className="content-composer-list">
        {drafts.map((draft, index) => {
          const selected = selectedCaseIds.includes(draft.caseId);
          return (
            <article className="content-composer-item" key={draft.id}>
              <header>
                <strong>Block {index + 1}</strong>
                <span>
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label={"Move block " + (index + 1) + " up"}
                    onClick={() =>
                      setDrafts((current) => {
                        const next = [...current];
                        [next[index - 1], next[index]] = [next[index], next[index - 1]];
                        return next;
                      })
                    }
                  >↑</button>
                  <button
                    type="button"
                    disabled={index === drafts.length - 1}
                    aria-label={"Move block " + (index + 1) + " down"}
                    onClick={() =>
                      setDrafts((current) => {
                        const next = [...current];
                        [next[index], next[index + 1]] = [next[index + 1], next[index]];
                        return next;
                      })
                    }
                  >↓</button>
                  <button
                    type="button"
                    onClick={() =>
                      setDrafts((current) =>
                        current.filter((item) => item.id !== draft.id),
                      )
                    }
                  >Remove</button>
                </span>
              </header>
              <div className="content-composer-fields">
                <label>
                  Linked case
                  <select
                    value={draft.caseId}
                    onChange={(event) =>
                      update(draft.id, { caseId: event.target.value })
                    }
                  >
                    {availableCases.map((item) => (
                      <option value={item.id} key={item.id}>
                        {String(item.position).padStart(2, "0")} · {item.title}
                      </option>
                    ))}
                    {!selected && (
                      <option value={draft.caseId}>Case is no longer selected</option>
                    )}
                  </select>
                </label>
                <label>
                  Block type
                  <select
                    value={draft.type}
                    onChange={(event) => {
                      const type = event.target.value as TeachingContentBlockType;
                      update(draft.id, {
                        type,
                        url: type === "reading-link" ? draft.url : "",
                      });
                    }}
                  >
                    <option value="text">Text note</option>
                    <option value="key-points">Key points</option>
                    <option value="explanation">Expandable explanation</option>
                    <option value="reading-link">Approved reading link</option>
                    <option value="case-image">Case image callout</option>
                    <option value="scene">Saved viewer scene cue</option>
                  </select>
                </label>
              </div>
              <label>
                Heading
                <input
                  maxLength={160}
                  value={draft.title}
                  onChange={(event) => update(draft.id, { title: event.target.value })}
                  placeholder="What the learner should notice"
                />
              </label>
              <label>
                {draft.type === "key-points" ? "One key point per line" : "Content"}
                <textarea
                  maxLength={2000}
                  value={draft.body}
                  onChange={(event) => update(draft.id, { body: event.target.value })}
                  placeholder={
                    draft.type === "key-points"
                      ? "Finding one\nFinding two"
                      : "Concise educational guidance"
                  }
                />
              </label>
              {draft.type === "reading-link" && (
                <label>
                  HTTPS reading address
                  <input
                    type="url"
                    maxLength={1000}
                    value={draft.url}
                    onChange={(event) => update(draft.id, { url: event.target.value })}
                    placeholder="https://…"
                  />
                </label>
              )}
              {!selected && (
                <p className="poll-draft-warning">
                  Re-select the linked case or remove this block.
                </p>
              )}
              <div className="content-block-preview">
                <small>Learner preview</small>
                <strong>{draft.title || "Block heading"}</strong>
                {draft.type === "key-points" ? (
                  <ul>
                    {keyPointsFromBody(draft.body || "First key point").map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{draft.body || "Block content appears here."}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RecoveryComparison({
  comparison,
  data,
}: {
  comparison: AppSnapshot["recoveryComparisons"][number];
  data: AppSnapshot;
}) {
  const source = data.workbooks.find((item) => item.id === comparison.sourceWorkbookId);
  return (
    <details className="recovery-comparison">
      <summary>Recovery draft comparison</summary>
      <div>
        <p><strong>Source:</strong> {source?.title ?? comparison.sourceWorkbookId} · {shortHash(comparison.sourceIntegrityHash)}</p>
        <section>
          <strong>Copied from current reviewed links</strong>
          <ul>{comparison.copiedCaseIds.map((id) => <li key={id}>{data.cases.find((item) => item.id === id)?.title ?? id}</li>)}</ul>
        </section>
        <section>
          <strong>Not reconstructable</strong>
          <p>{comparison.historyReconstructed ? "Historical content was reconstructed." : "The failed historical manifest and its former question/viewer state were not reconstructed."}</p>
        </section>
        <section>
          <strong>Explicitly excluded</strong>
          <ul>{comparison.excludedEvidence.map((item) => <li key={item}>{statusLabel(item)}</li>)}</ul>
        </section>
        <small>Independent peer review is required before this recovery draft can be published.</small>
      </div>
    </details>
  );
}

function WorkbookStatusTimeline({
  workbook,
}: {
  workbook: AppSnapshot["workbooks"][number];
}) {
  const stages = ["draft", "in-review", "approved", "published", "archived"];
  const stage = workbook.status === "changes-requested"
    ? 1
    : workbook.status === "withdrawn"
      ? 3
      : Math.max(0, stages.indexOf(workbook.status));
  const nextAction = workbook.status === "draft"
    ? "Next: request peer review"
    : workbook.status === "changes-requested"
      ? "Blocked: address the reviewer’s requested changes"
      : workbook.status === "in-review"
        ? "Next: independent approval or requested changes"
        : workbook.status === "approved"
          ? "Next: publish the immutable version"
          : workbook.status === "published"
            ? "Live: archive when teaching and attempts are complete"
            : workbook.status === "withdrawn"
              ? "Withdrawn: access stopped; evidence retained"
              : "Archived: history and evidence retained";
  return (
    <div className="workbook-status-timeline" aria-label={`Workflow status: ${nextAction}`}>
      <ol>
        {stages.map((item, index) => (
          <li
            key={item}
            className={index < stage ? "complete" : index === stage ? "current" : ""}
          >
            <i aria-hidden="true" />
            <span>{item === "in-review" ? "Peer review" : statusLabel(item)}</span>
          </li>
        ))}
      </ol>
      <small>{nextAction}</small>
    </div>
  );
}

function WorkbookBuilder({
  data,
  busy,
  postAction,
}: {
  data: AppSnapshot;
  busy: boolean;
  postAction: (
    payload: ActionPayload,
    message: string,
  ) => Promise<AppSnapshot | null>;
}) {
  const [mode, setMode] = useState<"teaching" | "assessment">("teaching");
  const [templateId, setTemplateId] = useState("guided-teaching");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [dualDisplayAllowed, setDualDisplayAllowed] = useState(true);
  const [selectedCases, setSelectedCases] = useState<string[]>(
    data.cases.map((item) => item.id),
  );
  const [pollDrafts, setPollDrafts] = useState<PollAuthoringDraft[]>([]);
  const [teachingBlocks, setTeachingBlocks] = useState<
    TeachingBlockAuthoringDraft[]
  >([]);
  const [teachingDesignOpen, setTeachingDesignOpen] = useState(false);
  const [editingWorkbookId, setEditingWorkbookId] = useState("");
  const [questionDrafts, setQuestionDrafts] = useState<QuestionAuthoringDraft[]>([]);
  const publishedWorkbooks = data.workbooks.filter(
    (workbook) => workbook.status === "published",
  );
  const [accessWorkbookId, setAccessWorkbookId] = useState(
    publishedWorkbooks[0]?.id ?? "",
  );
  const [accessLearnerId, setAccessLearnerId] = useState(
    data.learners[0]?.id ?? "",
  );
  const [accessDueDate, setAccessDueDate] = useState("");
  const [accessAvailableDate, setAccessAvailableDate] = useState("");
  const [accessExpiryDate, setAccessExpiryDate] = useState("");
  const [accessPrerequisiteId, setAccessPrerequisiteId] = useState("");
  const [accessPrerequisitePercent, setAccessPrerequisitePercent] = useState(100);
  const selectedAssignment = data.workbookAssignments.find(
    (assignment) =>
      assignment.workbookId === accessWorkbookId &&
      assignment.learnerId === accessLearnerId,
  );
  const canManageAssignments = data.currentUser.roles.some((role) =>
    ["administrator", "instructor"].includes(role),
  );
  function applyTemplate() {
    const firstCaseId = selectedCases[0] ?? data.cases[0]?.id ?? "";
    if (templateId === "timed-assessment") {
      setMode("assessment");
      setTeachingDesignOpen(false);
      setTitle("End-of-module assessment");
      setDuration(75);
      setDualDisplayAllowed(false);
      return;
    }
    setMode("teaching");
    setTeachingDesignOpen(true);
    setDualDisplayAllowed(true);
    setTitle(
      templateId === "case-conference"
        ? "Interactive case conference"
        : "Guided teaching workbook",
    );
    setTeachingBlocks(
      templateId === "case-conference"
        ? [
            {
              ...newTeachingBlock(firstCaseId),
              type: "text",
              title: "Discussion prompt",
              body: "Review the case independently, then record the key observation for group discussion.",
            },
          ]
        : [
            {
              ...newTeachingBlock(firstCaseId),
              type: "key-points",
              title: "Learning objectives",
              body: "Use a systematic review sequence\nDescribe the key educational finding\nRelate the finding to the teaching explanation",
            },
            {
              ...newTeachingBlock(firstCaseId),
              type: "explanation",
              title: "Guided explanation",
              body: "Reveal this after the learner has completed an independent review.",
            },
            {
              ...newTeachingBlock(firstCaseId),
              type: "scene",
              title: "Instructor scene cue",
              body: "Restore the saved instructor scene from the viewer tray.",
            },
          ],
    );
  }
  function toggleCase(id: string) {
    setSelectedCases((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    if (editingWorkbookId && mode === "assessment" && !selectedCases.includes(id)) {
      const educationCase = data.cases.find((item) => item.id === id);
      if (educationCase)
        setQuestionDrafts((current) => [
          ...current,
          ...educationCase.questions
            .filter((question) => !current.some((item) => item.questionId === question.id))
            .map((question) => ({
              questionId: question.id,
              caseId: id,
              prompt: question.prompt,
            })),
        ]);
    }
  }
  function moveSelectedCase(id: string, direction: -1 | 1) {
    setSelectedCases((current) => {
      const index = current.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function resetEditor() {
    setEditingWorkbookId("");
    setTitle("");
    setPollDrafts([]);
    setTeachingBlocks([]);
    setQuestionDrafts([]);
  }
  function editWorkbook(workbook: AppSnapshot["workbooks"][number]) {
    const detail = data.draftWorkbookDetails.find(
      (item) => item.workbookId === workbook.id,
    );
    const overrides = new Map(
      (detail?.questionEdits ?? []).map((item) => [item.questionId, item.prompt]),
    );
    setEditingWorkbookId(workbook.id);
    setMode(workbook.mode === "assessment" ? "assessment" : "teaching");
    setTitle(workbook.title);
    setDuration(workbook.durationMinutes || 60);
    setDualDisplayAllowed(workbook.dualDisplayAllowed);
    setSelectedCases(workbook.caseIds);
    setTeachingBlocks(
      (detail?.teachingBlocks ?? []).map((block) => ({
        id: block.id,
        caseId: block.caseId,
        type: block.type,
        title: block.title,
        body: block.body,
        url: block.url,
      })),
    );
    setPollDrafts(
      (detail?.polls ?? []).map((poll) => ({
        id: poll.id,
        caseId: poll.caseId,
        prompt: poll.prompt,
        selectionMode: poll.selectionMode,
        options: poll.options.map((option) => ({
          id: option.id,
          label: option.label,
          correct: poll.correctOptionIds.includes(option.id),
        })),
        explanation: poll.explanation,
      })),
    );
    setQuestionDrafts(
      data.cases
        .filter((educationCase) => workbook.caseIds.includes(educationCase.id))
        .flatMap((educationCase) =>
          educationCase.questions.map((question) => ({
            questionId: question.id,
            caseId: educationCase.id,
            prompt: overrides.get(question.id) ?? question.prompt,
          })),
        ),
    );
    setTeachingDesignOpen(workbook.mode === "teaching");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const selected = selectedCases
    .map((id) => data.cases.find((item) => item.id === id))
    .filter((item): item is EducationCase => Boolean(item));
  const editingWorkbook = data.workbooks.find(
    (workbook) => workbook.id === editingWorkbookId,
  );
  const totalMarks = selected.reduce((sum, item) => sum + item.maxMarks, 0);
  const noteCount = data.teachingNotes.filter((note) =>
    selectedCases.includes(note.caseId),
  ).length;
  const pollsValid = pollDrafts.every((poll) => {
    const labels = poll.options.map((option) => option.label.trim());
    return (
      selectedCases.includes(poll.caseId) &&
      Boolean(poll.prompt.trim()) &&
      labels.length >= 2 &&
      labels.every(Boolean) &&
      poll.options.some((option) => option.correct) &&
      new Set(labels.map((label) => label.toLocaleLowerCase())).size ===
      labels.length
    );
  });
  const teachingBlocksValid = teachingBlocks.every((block) => {
    if (!selectedCases.includes(block.caseId) || !block.title.trim())
      return false;
    if (block.type !== "reading-link" && !block.body.trim()) return false;
    if (block.type === "reading-link") {
      try {
        return new URL(block.url).protocol === "https:";
      } catch {
        return false;
      }
    }
    return !block.url;
  });
  return (
    <section className="management-page builder-page">
      <div className="page-heading">
        <span>
          <small>Education authoring</small>
          <h1>Workbook builder</h1>
          <p>
            Create a guided teaching workbook or a governed exam from the same
            publication-cleared case library.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>Draft → review → immutable publication</strong>
          <small>Published versions never change existing attempts</small>
        </div>
      </div>
      <div className="mode-cards">
        <button
          className={mode === "teaching" ? "active" : ""}
          disabled={Boolean(editingWorkbookId) && mode !== "teaching"}
          onClick={() => {
            setMode("teaching");
            setDualDisplayAllowed(true);
          }}
        >
          <span className="mode-symbol">T</span>
          <span>
            <strong>Teaching workbook</strong>
            <small>
              Case-linked notes, key points and optional explanations appear
              beside the viewer.
            </small>
          </span>
          <i>Notes panel</i>
        </button>
        <button
          className={mode === "assessment" ? "active" : ""}
          disabled={Boolean(editingWorkbookId) && mode !== "assessment"}
          onClick={() => {
            setMode("assessment");
            setDualDisplayAllowed(false);
          }}
        >
          <span className="mode-symbol">E</span>
          <span>
            <strong>Exam workbook</strong>
            <small>
              Questions, autosaved answers, submission evidence and examiner
              marking.
            </small>
          </span>
          <i>Answer panel</i>
        </button>
      </div>
      {editingWorkbookId && (
        <div className="draft-edit-banner" role="status">
          <span>
            <strong>Editing an existing draft</strong>
            <small>
              Saving creates the next governed draft revision. Published versions remain unchanged.
            </small>
          </span>
          <button type="button" onClick={resetEditor}>Cancel editing</button>
        </div>
      )}
      <section className="management-card workbook-template-bar">
        <span>
          <small>Fast start</small>
          <strong>Workbook templates</strong>
          <p>Apply a safe starting structure, then edit every detail before publication.</p>
        </span>
        <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} aria-label="Workbook template">
          <option value="guided-teaching">Guided teaching</option>
          <option value="case-conference">Interactive case conference</option>
          <option value="timed-assessment">Timed assessment</option>
        </select>
        <button type="button" onClick={applyTemplate}>Apply template</button>
      </section>
      {mode === "teaching" && (
        <details
          className="teaching-design-disclosure"
          open={teachingDesignOpen}
          onToggle={(event) =>
            setTeachingDesignOpen(event.currentTarget.open)
          }
        >
          <summary>
            <span>
              <small>Optional teaching design</small>
              <strong>Case-linked notes, explanations & live polls</strong>
            </span>
            <span className="status-pill">
              {teachingBlocks.length} blocks · {pollDrafts.length} polls
            </span>
          </summary>
          <p className="teaching-design-guidance">
            Select the workbook cases below, then add only the learning content
            needed beside the viewer.
          </p>
          <TeachingContentComposer
            cases={data.cases}
            selectedCaseIds={selectedCases}
            drafts={teachingBlocks}
            setDrafts={setTeachingBlocks}
          />
          <PollAuthoringPanel
            cases={data.cases}
            selectedCaseIds={selectedCases}
            drafts={pollDrafts}
            setDrafts={setPollDrafts}
          />
        </details>
      )}
      <div className="builder-grid">
        <section className="management-card builder-form">
          <div className="card-heading">
            <span>
              <small>Step 1</small>
              <h2>Workbook details</h2>
            </span>
            <span
              className={`status-pill ${mode === "assessment" ? "amber" : ""}`}
            >
              {mode === "assessment" ? "Exam mode" : "Teaching mode"}
            </span>
          </div>
          <label>
            Workbook title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                mode === "teaching"
                  ? "e.g. Guided hepatobiliary cases"
                  : "e.g. End-of-module assessment"
              }
            />
          </label>
          {mode === "assessment" ? (
            <>
              <label>
                Time limit{" "}
                <span className="duration-field">
                  <input
                    type="number"
                    min="10"
                    max="480"
                    value={duration}
                    onChange={(event) =>
                      setDuration(Number(event.target.value))
                    }
                  />{" "}
                  minutes
                </span>
              </label>
              <div className="teaching-config exam-config">
                <strong>Exam display policy</strong>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={dualDisplayAllowed}
                    onChange={(event) =>
                      setDualDisplayAllowed(event.target.checked)
                    }
                  />
                  Allow synchronized two-display answer workspace
                </label>
                <small>
                  Off by default for invigilated exams. This choice is pinned
                  into the published version.
                </small>
              </div>
            </>
          ) : (
            <div className="teaching-config">
              <strong>Teaching behavior</strong>
              <p>
                Case-linked notes follow the active image automatically. Any
                teaching explanation remains outside exam mode.
              </p>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={dualDisplayAllowed}
                  onChange={(event) =>
                    setDualDisplayAllowed(event.target.checked)
                  }
                />
                Allow synchronized companion notes window
              </label>
            </div>
          )}
          <div className="builder-summary">
            <span>
              <small>Selected cases</small>
              <strong>{selected.length}</strong>
            </span>
            <span>
              <small>
                {mode === "assessment" ? "Available marks" : "Linked notes"}
              </small>
              <strong>{mode === "assessment" ? totalMarks : noteCount}</strong>
            </span>
            <span>
              <small>{mode === "teaching" ? "Blocks / polls" : "Displays"}</small>
              <strong>
                {mode === "teaching"
                  ? <>{teachingBlocks.length} / {pollDrafts.length}</>
                  : dualDisplayAllowed
                    ? "1 / 2"
                    : "1"}
              </strong>
            </span>
          </div>
        </section>
        <section className="management-card case-picker">
          <div className="card-heading">
            <span>
              <small>Step 2</small>
              <h2>Select cases</h2>
            </span>
            <span className="status-pill">Published library</span>
          </div>
          <div className="picker-list">
            {data.cases.map((item, index) => (
              <div
                key={item.id}
                className={`case-picker-row${selectedCases.includes(item.id) ? " selected" : ""}`}
              >
                <label className={selectedCases.includes(item.id) ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={selectedCases.includes(item.id)}
                    onChange={() => toggleCase(item.id)}
                  />
                  <span className={`modality-badge ${item.classification}`}>
                    {item.classification === "radiology"
                      ? "CT"
                      : item.classification === "pathology"
                        ? "WSI"
                        : "MIX"}
                  </span>
                  <span className="case-picker-details">
                    <strong>
                      {index + 1}. {item.title}
                    </strong>
                    <small>
                      {mode === "assessment"
                        ? `${item.maxMarks} marks · ${item.questions.length} question${item.questions.length === 1 ? "" : "s"}`
                        : `${data.teachingNotes.filter((note) => note.caseId === item.id).length} linked note · explanation ready`}
                    </small>
                  </span>
                  <code>v{item.version}</code>
                </label>
                <span className="case-order-actions" aria-label={`Order ${item.title}`}>
                  <button
                    type="button"
                    aria-label={`Move ${item.title} earlier`}
                    disabled={!selectedCases.includes(item.id) || selectedCases.indexOf(item.id) === 0}
                    onClick={() => moveSelectedCase(item.id, -1)}
                  >↑</button>
                  <button
                    type="button"
                    aria-label={`Move ${item.title} later`}
                    disabled={!selectedCases.includes(item.id) || selectedCases.indexOf(item.id) === selectedCases.length - 1}
                    onClick={() => moveSelectedCase(item.id, 1)}
                  >↓</button>
                </span>
              </div>
            ))}
          </div>
          {mode === "assessment" && editingWorkbookId && (
            <details className="draft-question-editor" open>
              <summary>
                <span>
                  <strong>Assessment questions</strong>
                  <small>Edit prompts for this draft only</small>
                </span>
                <span className="status-pill">{questionDrafts.length}</span>
              </summary>
              <p>
                Question identifiers, answer types and published rubrics stay stable. Prompt changes are frozen only into this workbook’s next immutable version.
              </p>
              {questionDrafts
                .filter((question) => selectedCases.includes(question.caseId))
                .map((question, index) => (
                  <label key={question.questionId}>
                    Question {index + 1}
                    <textarea
                      maxLength={2000}
                      value={question.prompt}
                      onChange={(event) =>
                        setQuestionDrafts((current) =>
                          current.map((item) =>
                            item.questionId === question.questionId
                              ? { ...item, prompt: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
            </details>
          )}
        </section>
        <aside className="management-card publish-preview">
          <div className="card-heading">
            <span>
              <small>Step 3</small>
              <h2>Review & create</h2>
            </span>
          </div>
          <div className={`preview-panel ${mode}`}>
            <span>{mode === "assessment" ? "Exam" : "Teaching"}</span>
            <h3>{title || "Untitled workbook"}</h3>
            <p>
              {selected.length} cases ·{" "}
              {mode === "assessment"
                ? `${duration} minutes · ${totalMarks} marks`
                : <>{noteCount} linked notes · {teachingBlocks.length} content blocks · {pollDrafts.length} live polls</>}{" "}
              · {dualDisplayAllowed ? "one/two displays" : "one display"}
            </p>
            <ol>
              {selected.map((item) => (
                <li key={item.id}>
                  {item.title}
                  <small>{item.classification}</small>
                </li>
              ))}
            </ol>
          </div>
          <div className="version-note">
            <strong>Versioning rule</strong>
            <p>
              Creation produces an editable draft. Publishing pins cases,
              question/note versions, viewer core and display policy into an
              integrity receipt.
            </p>
          </div>
          <button
            className="primary-button"
            disabled={
              busy ||
              !title.trim() ||
              selected.length === 0 ||
              (mode === "teaching" && (!pollsValid || !teachingBlocksValid)) ||
              (mode === "assessment" && Boolean(editingWorkbookId) && questionDrafts
                .filter((question) => selectedCases.includes(question.caseId))
                .some((question) => !question.prompt.trim()))
            }
            onClick={() =>
              void postAction(
                {
                  action: editingWorkbookId
                    ? "update-workbook-draft"
                    : "create-workbook",
                  ...(editingWorkbookId && editingWorkbook
                    ? {
                        id: editingWorkbookId,
                        expectedVersion: editingWorkbook.version,
                      }
                    : {}),
                  title,
                  mode,
                  durationMinutes: duration,
                  dualDisplayAllowed,
                  caseIds: selectedCases,
                  ...(mode === "teaching"
                    ? {
                        polls: pollDrafts.map((poll) => ({
                          caseId: poll.caseId,
                          prompt: poll.prompt,
                          selectionMode: poll.selectionMode,
                          options: poll.options.map((option) => option.label),
                          correctOptionIndexes: poll.options.flatMap(
                            (option, index) => (option.correct ? [index] : []),
                          ),
                          explanation: poll.explanation,
                        })),
                        teachingBlocks: teachingBlocks.map((block) => ({
                          caseId: block.caseId,
                          type: block.type,
                          title: block.title,
                          body: block.body,
                          url: block.url,
                        })),
                      }
                    : {}),
                  ...(mode === "assessment" && editingWorkbookId
                    ? {
                        questionEdits: questionDrafts
                          .filter((question) => selectedCases.includes(question.caseId))
                          .map((question) => ({
                            questionId: question.questionId,
                            prompt: question.prompt,
                          })),
                      }
                    : {}),
                },
                editingWorkbookId
                  ? "Workbook draft revision saved"
                  : `${mode === "assessment" ? "Exam" : "Teaching"} workbook draft created`,
              ).then((updated) => {
                if (updated) {
                  resetEditor();
                }
              })
            }
          >
            {editingWorkbookId
              ? `Save draft revision ${editingWorkbook ? editingWorkbook.version + 1 : ""}`
              : `Create ${mode === "assessment" ? "exam" : "teaching"} draft`}
          </button>
        </aside>
      </div>
      <section className="management-card existing-workbooks">
        <div className="card-heading">
          <span>
            <small>Version register</small>
            <h2>Course workbooks</h2>
          </span>
          <span className="status-pill">{data.workbooks.length}</span>
        </div>
        <div className="workbook-table">
          <div className="table-head">
            <span>Workbook</span>
            <span>Mode</span>
            <span>Cases</span>
            <span>Version</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {data.workbooks.map((workbook) => (
            <div className="table-row" key={workbook.id}>
              <span>
                <strong>{workbook.title}</strong>
                <small>
                  {workbook.durationMinutes
                    ? `${workbook.durationMinutes} minutes`
                    : "Self-paced"}{" "}
                  · {workbook.dualDisplayAllowed ? "1/2 displays" : "1 display"}
                </small>
                <WorkbookStatusTimeline workbook={workbook} />
                {data.recoveryComparisons.find((item) => item.draftWorkbookId === workbook.id) && (
                  <RecoveryComparison
                    comparison={data.recoveryComparisons.find((item) => item.draftWorkbookId === workbook.id)!}
                    data={data}
                  />
                )}
              </span>
              <span className={`mode-pill ${workbook.mode}`}>
                {workbook.mode === "assessment" ? "Exam" : "Teaching"}
              </span>
              <strong>{workbook.caseIds.length}</strong>
              <code>v{workbook.version}</code>
              <span
                className={`status-pill ${["draft", "changes-requested", "in-review"].includes(workbook.status) ? "amber" : workbook.status === "published" || workbook.status === "approved" ? "green" : workbook.status === "withdrawn" ? "danger" : "neutral"}`}
              >
                {statusLabel(workbook.status)}
              </span>
              <span>
                <span className="workbook-row-actions">
                  {["draft", "changes-requested"].includes(workbook.status) ? (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => editWorkbook(workbook)}
                      >Edit draft</button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Send this workbook to a separate education colleague for peer review?"))
                            void postAction({ action: "request-workbook-review", id: workbook.id }, "Workbook sent for independent peer review");
                        }}
                      >Request review</button>
                      {workbook.status === "draft" && (
                        <button
                          className="danger-button"
                          disabled={busy}
                          title="Available only before peer review or governed activity"
                          onClick={() => {
                            const confirmation = window.prompt(`Permanently delete the untouched draft “${workbook.title}”? Type DELETE to confirm.`);
                            if (confirmation === "DELETE") void postAction({ action: "delete-workbook-draft", id: workbook.id, expectedVersion: workbook.version, confirmation }, "Untouched workbook draft permanently deleted");
                          }}
                        >Delete draft</button>
                      )}
                    </>
                  ) : workbook.status === "in-review" ? (
                    <>
                      <button
                        disabled={busy || workbook.authorId === data.currentUser.id}
                        title={workbook.authorId === data.currentUser.id ? "A different education user must complete peer review" : "Approve after independent review"}
                        onClick={() => {
                          const comment = window.prompt("Record the approval rationale:");
                          if (comment?.trim()) void postAction({ action: "review-workbook", id: workbook.id, decision: "approved", comment }, "Peer review approved and preserved");
                        }}
                      >Approve</button>
                      <button
                        disabled={busy || workbook.authorId === data.currentUser.id}
                        onClick={() => {
                          const comment = window.prompt("Describe the changes required:");
                          if (comment?.trim()) void postAction({ action: "review-workbook", id: workbook.id, decision: "changes-requested", comment }, "Peer review requested changes");
                        }}
                      >Request changes</button>
                    </>
                  ) : workbook.status === "approved" ? (
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("Publish this peer-approved immutable workbook version?")) void postAction({ action: "publish-workbook", id: workbook.id }, "Workbook version published with integrity receipt");
                      }}
                    >Publish v{workbook.version}</button>
                  ) : (
                    <code>{shortHash(workbook.integrityHash)}</code>
                  )}
                  {workbook.status === "published" && (
                    <>
                      {workbook.mode === "assessment" &&
                        data.currentUser.roles.includes("administrator") &&
                        data.accessibleWorkbooks.some(
                          (candidate) =>
                            candidate.id === workbook.id && !candidate.available,
                        ) && (
                          <button
                            disabled={busy}
                            title="Creates a new v2-manifest draft from current reviewed case links; candidate evidence and the failed published version remain unchanged"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Create a separate v2 recovery draft from the current reviewed case links? This does not reconstruct the failed historical version and does not copy attempts, answers, marks or results. The new draft must pass independent peer review before publication.",
                                )
                              )
                                void postAction(
                                  {
                                    action: "create-assessment-recovery-draft",
                                    id: workbook.id,
                                  },
                                  "V2 recovery draft created; historical evidence was left unchanged",
                                );
                            }}
                          >
                            Create v2 recovery draft
                          </button>
                        )}
                      <button
                        disabled={busy}
                        onClick={() => {
                          const reason = window.prompt("Why is this workbook being archived? Routine archival requires no live teaching or open exam attempts.");
                          if (reason?.trim()) void postAction({ action: "retire-published-workbook", id: workbook.id, expectedVersion: workbook.version, disposition: "archived", reason }, "Workbook archived; historical evidence was preserved");
                        }}
                      >Archive</button>
                      <button
                        className="danger-button"
                        disabled={busy}
                        title="Urgently stops candidate access while preserving attempts and audit evidence"
                        onClick={() => {
                          const reason = window.prompt("Urgently withdraw this workbook from candidate access? Record the governance reason. Existing evidence will be preserved.");
                          if (reason?.trim() && window.confirm("Confirm immediate governed withdrawal? Active assignments and live teaching will be stopped.")) void postAction({ action: "retire-published-workbook", id: workbook.id, expectedVersion: workbook.version, disposition: "withdrawn", reason }, "Workbook withdrawn; access stopped and evidence preserved");
                        }}
                      >Withdraw</button>
                    </>
                  )}
                  {workbook.latestReviewDecision && <small title={workbook.latestReviewComment ?? ""}>Review: {statusLabel(workbook.latestReviewDecision)} · {workbook.latestReviewerName}</small>}
                  <button
                    disabled={busy}
                    onClick={() =>
                      void postAction(
                        { action: "clone-workbook", id: workbook.id },
                        "Workbook cloned as an editable draft",
                      )
                    }
                  >
                    Clone
                  </button>
                  {workbook.mode === "teaching" && (
                    <button
                      disabled={busy}
                      title="Copies cases only; teaching notes, poll answers and model material are excluded"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Create an exam draft from cases only? Teaching notes, poll answers and model material will not be copied.",
                          )
                        )
                          void postAction(
                            {
                              action: "convert-teaching-to-exam",
                              id: workbook.id,
                              durationMinutes: 60,
                            },
                            "Exam draft created from cases only; teaching disclosures were excluded",
                          );
                      }}
                    >
                      Convert to exam
                    </button>
                  )}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
      {canManageAssignments && (
        <details className="access-governance-disclosure">
        <summary>
          <span>
            <small>Access governance</small>
            <strong>Candidate assignments, cohorts & accommodations</strong>
          </span>
          <span className="status-pill green">
            {data.workbookAssignments.length} direct · {data.cohorts.length} cohorts
          </span>
        </summary>
        <div className="access-governance-body">
        <section className="management-card workbook-access-card">
          <div className="card-heading">
            <span>
              <small>Candidate access boundary</small>
              <h2>Workbook assignments</h2>
              <p>
                Learner accounts can open only published workbooks with an
                active assignment.
              </p>
            </span>
            <span className="status-pill green">
              {data.workbookAssignments.length} active
            </span>
          </div>
          <div className="assignment-controls">
            <label>
              Published workbook
              <select
                value={accessWorkbookId}
                onChange={(event) => setAccessWorkbookId(event.target.value)}
              >
                {publishedWorkbooks.map((workbook) => (
                  <option key={workbook.id} value={workbook.id}>
                    {workbook.mode === "assessment" ? "Exam" : "Teaching"} · {workbook.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Candidate
              <select
                value={accessLearnerId}
                onChange={(event) => setAccessLearnerId(event.target.value)}
              >
                {data.learners.map((learner) => (
                  <option key={learner.id} value={learner.id}>
                    {learner.displayName} · {learner.email}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Release date <small>optional</small>
              <input
                type="date"
                value={accessAvailableDate}
                onChange={(event) => setAccessAvailableDate(event.target.value)}
              />
            </label>
            <label>
              Due date <small>optional</small>
              <input
                type="date"
                value={accessDueDate}
                onChange={(event) => setAccessDueDate(event.target.value)}
              />
            </label>
            <label>
              Access expires <small>optional</small>
              <input
                type="date"
                value={accessExpiryDate}
                onChange={(event) => setAccessExpiryDate(event.target.value)}
              />
            </label>
            <label>
              Prerequisite <small>optional</small>
              <select value={accessPrerequisiteId} onChange={(event) => setAccessPrerequisiteId(event.target.value)}>
                <option value="">No prerequisite</option>
                {publishedWorkbooks.filter((workbook) => workbook.id !== accessWorkbookId).map((workbook) => <option key={workbook.id} value={workbook.id}>{workbook.title}</option>)}
              </select>
            </label>
            <label>
              Required completion
              <span className="duration-field"><input type="number" min="1" max="100" value={accessPrerequisitePercent} onChange={(event) => setAccessPrerequisitePercent(Number(event.target.value))} /> %</span>
            </label>
            <button
              type="button"
              className="primary-button"
              disabled={busy || !accessWorkbookId || !accessLearnerId}
              onClick={() =>
                void postAction(
                  {
                    action: "assign-workbook",
                    targetWorkbookId: accessWorkbookId,
                    learnerId: accessLearnerId,
                    availableFrom: accessAvailableDate
                      ? `${accessAvailableDate}T00:00:00.000Z`
                      : "",
                    dueAt: accessDueDate
                      ? `${accessDueDate}T23:59:59.000Z`
                      : "",
                    expiresAt: accessExpiryDate
                      ? `${accessExpiryDate}T23:59:59.000Z`
                      : "",
                    prerequisiteWorkbookId: accessPrerequisiteId,
                    prerequisiteMinPercent: accessPrerequisitePercent,
                    expectedVersion: selectedAssignment?.version ?? 0,
                  },
                  selectedAssignment
                    ? "Candidate workbook access updated"
                    : "Workbook assigned to candidate",
                )
              }
            >
              {selectedAssignment ? "Update access" : "Assign workbook"}
            </button>
          </div>
          <div className="assignment-list" aria-label="Active workbook assignments">
            {data.workbookAssignments.map((assignment) => {
              const workbook = data.workbooks.find(
                (item) => item.id === assignment.workbookId,
              );
              const learner = data.learners.find(
                (item) => item.id === assignment.learnerId,
              );
              return (
                <article key={assignment.id}>
                  <span>
                    <strong>{learner?.displayName ?? assignment.learnerId}</strong>
                    <small>{learner?.email ?? "Learner account"}</small>
                  </span>
                  <span>
                    <strong>{workbook?.title ?? assignment.workbookId}</strong>
                    <small>
                      {workbook?.mode === "assessment" ? "Exam" : "Teaching"} · assigned {formatTime(assignment.assignedAt)}
                    </small>
                  </span>
                  <span>
                    <small>Release · due · expiry</small>
                    <strong>{formatTime(assignment.availableFrom)} · {formatTime(assignment.dueAt)} · {formatTime(assignment.expiresAt)}</strong>
                    {assignment.prerequisiteWorkbookId && <small>Requires {data.workbooks.find((item) => item.id === assignment.prerequisiteWorkbookId)?.title ?? assignment.prerequisiteWorkbookId} at {assignment.prerequisiteMinPercent}%</small>}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Remove this candidate's access to the workbook?"))
                        void postAction(
                          {
                            action: "revoke-workbook-assignment",
                            assignmentId: assignment.id,
                            expectedVersion: assignment.version,
                          },
                          "Candidate workbook access removed",
                        );
                    }}
                  >
                    Revoke
                  </button>
                </article>
              );
            })}
            {!data.workbookAssignments.length && (
              <p>No candidate workbook assignments are active.</p>
            )}
          </div>
        </section>
        <CohortAccessManagement data={data} busy={busy} postAction={postAction} />
        <AccommodationManagement data={data} busy={busy} postAction={postAction} />
        </div>
        </details>
      )}
    </section>
  );
}

function CohortAccessManagement({ data, busy, postAction }: { data: AppSnapshot; busy: boolean; postAction: (payload: ActionPayload, message: string) => Promise<AppSnapshot | null> }) {
  const published = data.workbooks.filter((item) => item.status === "published");
  const [title, setTitle] = useState(""); const [code, setCode] = useState("");
  const [cohortId, setCohortId] = useState(data.cohorts[0]?.id ?? "");
  const [learnerId, setLearnerId] = useState(data.learners[0]?.id ?? "");
  const [workbookId, setWorkbookId] = useState(published[0]?.id ?? "");
  const [available, setAvailable] = useState(""); const [due, setDue] = useState(""); const [expiry, setExpiry] = useState("");
  const [prerequisiteId, setPrerequisiteId] = useState(""); const [minimum, setMinimum] = useState(100);
  const membership = data.cohortMembers.find((item) => item.cohortId === cohortId && item.learnerId === learnerId);
  const assignment = data.cohortAssignments.find((item) => item.cohortId === cohortId && item.workbookId === workbookId);
  return <section className="management-card workbook-access-card governance-card">
    <div className="card-heading"><span><small>Bulk allocation</small><h2>Cohorts</h2><p>Create course groups, manage membership and allocate a governed workbook once for the whole cohort.</p></span><span className="status-pill green">{data.cohorts.length} active</span></div>
    <div className="governance-grid">
      <div className="governance-block">
        <h3>Create cohort</h3>
        <label>Name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Autumn FRCR group" /></label>
        <label>Short code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="AUT-26" /></label>
        <button className="primary-button" disabled={busy || !title.trim() || !code.trim()} onClick={() => void postAction({ action: "create-cohort", title, code }, "Cohort created").then((updated) => { if (updated) { setTitle(""); setCode(""); } })}>Create cohort</button>
      </div>
      <div className="governance-block">
        <h3>Membership</h3>
        <label>Cohort<select value={cohortId} onChange={(event) => setCohortId(event.target.value)}>{data.cohorts.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.memberCount} members</option>)}</select></label>
        <label>Candidate<select value={learnerId} onChange={(event) => setLearnerId(event.target.value)}>{data.learners.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
        <button className="primary-button" disabled={busy || !cohortId || !learnerId} onClick={() => void postAction({ action: "add-cohort-member", cohortId, learnerId, expectedVersion: membership?.version ?? 0 }, membership ? "Cohort membership refreshed" : "Candidate added to cohort")}>{membership ? "Refresh membership" : "Add candidate"}</button>
      </div>
      <div className="governance-block cohort-allocation-block">
        <h3>Bulk workbook access</h3>
        <label>Workbook<select value={workbookId} onChange={(event) => setWorkbookId(event.target.value)}>{published.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Release<input type="date" value={available} onChange={(event) => setAvailable(event.target.value)} /></label>
        <label>Due<input type="date" value={due} onChange={(event) => setDue(event.target.value)} /></label>
        <label>Expiry<input type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label>
        <label>Prerequisite<select value={prerequisiteId} onChange={(event) => setPrerequisiteId(event.target.value)}><option value="">None</option>{published.filter((item) => item.id !== workbookId).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Completion %<input type="number" min="1" max="100" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} /></label>
        <button className="primary-button" disabled={busy || !cohortId || !workbookId} onClick={() => void postAction({ action: "assign-cohort-workbook", cohortId, targetWorkbookId: workbookId, availableFrom: available ? `${available}T00:00:00.000Z` : "", dueAt: due ? `${due}T23:59:59.000Z` : "", expiresAt: expiry ? `${expiry}T23:59:59.000Z` : "", prerequisiteWorkbookId: prerequisiteId, prerequisiteMinPercent: minimum, expectedVersion: assignment?.version ?? 0 }, assignment ? "Cohort workbook access updated" : "Workbook assigned to cohort")}>{assignment ? "Update bulk access" : "Assign to cohort"}</button>
      </div>
    </div>
    <div className="cohort-register">
      {data.cohorts.map((cohort) => <article key={cohort.id}><header><span><strong>{cohort.title}</strong><small>{cohort.code} · {cohort.memberCount} active candidates</small></span></header><div className="cohort-member-chips">{data.cohortMembers.filter((member) => member.cohortId === cohort.id).map((member) => { const learner = data.learners.find((item) => item.id === member.learnerId); return <span key={member.learnerId}>{learner?.displayName ?? member.learnerId}<button aria-label={`Remove ${learner?.displayName ?? "candidate"} from ${cohort.title}`} disabled={busy} onClick={() => void postAction({ action: "remove-cohort-member", cohortId: cohort.id, learnerId: member.learnerId, expectedVersion: member.version }, "Candidate removed from cohort")}>×</button></span>; })}</div><div className="cohort-assignments">{data.cohortAssignments.filter((item) => item.cohortId === cohort.id).map((item) => <span key={item.id}><b>{data.workbooks.find((workbook) => workbook.id === item.workbookId)?.title ?? item.workbookId}</b><small>{formatTime(item.availableFrom)} → {formatTime(item.expiresAt)}</small><button disabled={busy} onClick={() => void postAction({ action: "revoke-cohort-workbook-assignment", assignmentId: item.id, expectedVersion: item.version }, "Cohort workbook access revoked")}>Revoke</button></span>)}</div></article>)}
    </div>
  </section>;
}

function AccommodationManagement({ data, busy, postAction }: { data: AppSnapshot; busy: boolean; postAction: (payload: ActionPayload, message: string) => Promise<AppSnapshot | null> }) {
  const exams = data.workbooks.filter((item) => item.status === "published" && item.mode === "assessment");
  const [workbookId, setWorkbookId] = useState(exams[0]?.id ?? ""); const [learnerId, setLearnerId] = useState(data.learners[0]?.id ?? "");
  const [extra, setExtra] = useState(15); const [breaks, setBreaks] = useState(0); const [reason, setReason] = useState("");
  const existing = data.accommodations.find((item) => item.workbookId === workbookId && item.learnerId === learnerId);
  const canApprove = data.currentUser.roles.some((role) => ["examiner", "administrator"].includes(role)); const canRevoke = data.currentUser.roles.includes("administrator");
  return <section className="management-card workbook-access-card governance-card">
    <div className="card-heading"><span><small>Approved adjustments</small><h2>Candidate accommodations</h2><p>Extra time is applied server-side to the selected immutable exam attempt only after approval.</p></span><span className="status-pill amber">{data.accommodations.filter((item) => item.status === "pending").length} pending</span></div>
    <div className="assignment-controls accommodation-controls">
      <label>Exam workbook<select value={workbookId} onChange={(event) => setWorkbookId(event.target.value)}>{exams.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>Candidate<select value={learnerId} onChange={(event) => setLearnerId(event.target.value)}>{data.learners.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
      <label>Extra time<input type="number" min="0" max="240" value={extra} onChange={(event) => setExtra(Number(event.target.value))} /></label>
      <label>Rest breaks<input type="number" min="0" max="120" value={breaks} onChange={(event) => setBreaks(Number(event.target.value))} /></label>
      <label className="wide-field">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Document the approved basis without adding sensitive medical detail." /></label>
      <button className="primary-button" disabled={busy || !workbookId || !learnerId || !reason.trim()} onClick={() => void postAction({ action: "request-accommodation", targetWorkbookId: workbookId, learnerId, extraTimeMinutes: extra, restBreakMinutes: breaks, reason, expectedVersion: existing?.version ?? 0 }, "Accommodation sent for approval")}>Request approval</button>
    </div>
    <div className="assignment-list">{data.accommodations.map((item) => <article key={item.id}><span><strong>{data.learners.find((learner) => learner.id === item.learnerId)?.displayName ?? item.learnerId}</strong><small>{data.workbooks.find((workbook) => workbook.id === item.workbookId)?.title ?? item.workbookId}</small></span><span><strong>+{item.extraTimeMinutes} min · {item.restBreakMinutes} min breaks</strong><small>{item.reason}</small></span><span><small>Status</small><strong>{statusLabel(item.status)}</strong></span><span className="workbook-row-actions">{item.status === "pending" && canApprove && <button disabled={busy} onClick={() => void postAction({ action: "approve-accommodation", id: item.id, expectedVersion: item.version }, "Accommodation approved and attempt timing updated")}>Approve</button>}{canRevoke && <button disabled={busy} onClick={() => void postAction({ action: "revoke-accommodation", id: item.id, expectedVersion: item.version }, "Accommodation revoked; started attempts were not shortened")}>Revoke</button>}</span></article>)}</div>
  </section>;
}

type IntegrationBundle = {
  oidc: {
    status: string;
    purpose: string;
    productionRegistrationRequired: boolean;
  };
  lti: LtiIntegrationView | null;
  activation: {
    status: "inactive";
    launchEndpointImplemented: false;
    institutionalRegistrationRequired: true;
    secretsAcceptedByThisForm: false;
  };
  refreshedAt: string;
};

function IntegrationWorkspace() {
  const [bundle, setBundle] = useState<IntegrationBundle | null>(null);
  const [form, setForm] = useState({
    issuer: "",
    clientId: "",
    deploymentId: "",
    authorizationEndpoint: "",
    tokenEndpoint: "",
    jwksEndpoint: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/education/integrations/lti", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as IntegrationBundle & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error || "Integration settings are unavailable.");
        if (active) {
          setBundle(result);
          if (result.lti)
            setForm({
              issuer: result.lti.issuer,
              clientId: result.lti.clientId,
              deploymentId: result.lti.deploymentId,
              authorizationEndpoint: result.lti.authorizationEndpoint,
              tokenEndpoint: result.lti.tokenEndpoint,
              jwksEndpoint: result.lti.jwksEndpoint,
            });
        }
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Integration settings are unavailable.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  const complete = Object.values(form).every((value) => value.trim());
  async function saveDraft() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/education/integrations/lti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-draft",
          expectedVersion: bundle?.lti?.version ?? 0,
          configuration: form,
        }),
      });
      const result = (await response.json()) as IntegrationBundle & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "The LTI draft could not be saved.");
      setBundle(result);
      setMessage("LTI registration draft saved; launch remains inactive");
      window.setTimeout(() => setMessage(""), 3500);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The LTI draft could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="management-page integration-page">
      <div className="page-heading">
        <span>
          <small>Education interoperability</small>
          <h1>Authentication &amp; integrations</h1>
          <p>
            Keep course-site identity and future LMS launch configuration
            inside the separate Visible Medicine trust boundary.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>LTI 1.3 inactive by default</strong>
          <small>No launch endpoint · no secret capture</small>
        </div>
      </div>
      {(message || error) && (
        <p className={error ? "question-bank-message error" : "question-bank-message"} role="status">
          {error || message}
        </p>
      )}
      <div className="integration-layout">
        <section className="management-card identity-boundary-card">
          <div className="card-heading">
            <span>
              <small>Primary sign-in</small>
              <h2>Course website OIDC</h2>
            </span>
            <span className="status-pill amber">Host adapter</span>
          </div>
          <div className="identity-flow">
            <span><b>1</b><strong>Course website</strong><small>Starts education sign-in</small></span>
            <i>→</i>
            <span><b>2</b><strong>Education identity</strong><small>Issuer and subject validated</small></span>
            <i>→</i>
            <span><b>3</b><strong>Visible Medicine</strong><small>Role and enrolment applied</small></span>
          </div>
          <div className="integration-warning">
            <strong>Production registration still required</strong>
            <p>
              The private host identity adapter supports this preview. A
              production course-site OIDC issuer, client registration,
              redirect allow-list and operational ownership must be approved
              before institutional release.
            </p>
          </div>
        </section>
        <section className="management-card lti-draft-card">
          <div className="card-heading">
            <span>
              <small>Later LMS option</small>
              <h2>LTI 1.3 registration draft</h2>
            </span>
            <span className="status-pill amber">
              {bundle?.lti ? `Draft v${bundle.lti.version}` : "Not configured"}
            </span>
          </div>
          <p>
            Store public institutional registration metadata only. This form
            does not accept private keys, shared secrets or access tokens.
          </p>
          <div className="lti-form">
            {[
              ["issuer", "Platform issuer", "https://lms.example.edu"],
              ["clientId", "Client ID", "Institution-issued identifier"],
              ["deploymentId", "Deployment ID", "Institution-issued deployment"],
              ["authorizationEndpoint", "Authorization endpoint", "https://lms.example.edu/oidc/auth"],
              ["tokenEndpoint", "Token endpoint", "https://lms.example.edu/oauth2/token"],
              ["jwksEndpoint", "JWKS endpoint", "https://lms.example.edu/.well-known/jwks.json"],
            ].map(([key, label, placeholder]) => (
              <label key={key}>
                {label}
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(event) =>
                    update(key as keyof typeof form, event.target.value)
                  }
                  placeholder={placeholder}
                  autoComplete="off"
                />
              </label>
            ))}
          </div>
          <button type="button" className="primary-button" disabled={busy || !complete} onClick={() => void saveDraft()}>
            {busy ? "Saving draft…" : "Save inactive registration draft"}
          </button>
        </section>
        <aside className="management-card lti-readiness-card">
          <div className="card-heading">
            <span>
              <small>Activation gate</small>
              <h2>Readiness</h2>
            </span>
          </div>
          <ul>
            <li className={complete ? "pass" : ""}>Public registration metadata complete</li>
            <li className="pass">HTTPS-only endpoint validation</li>
            <li className="pass">Secrets prohibited from this form</li>
            <li>Institutional platform registration</li>
            <li>Launch and deep-link endpoints</li>
            <li>Security and accessibility acceptance</li>
          </ul>
          <div className="lti-inactive">
            <strong>Not active</strong>
            <p>
              Saving a draft cannot enable LTI launches. Activation requires a
              separately reviewed implementation and institutional approval.
            </p>
          </div>
          <a href="/api/education/question-bank/qti" download>
            QTI question exchange is available separately
          </a>
        </aside>
      </div>
    </section>
  );
}

function LearnerReviewWorkspace({
  workbookId,
  onOpenCase,
}: {
  workbookId: string;
  onOpenCase: (caseId: string, workbookId: string) => void;
}) {
  const [review, setReview] = useState<LearnerReviewBundle | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!workbookId) return;
    fetch(
      `/api/education/learner/review?workbookId=${encodeURIComponent(workbookId)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        const result = (await response.json()) as LearnerReviewBundle & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error || "Post-session review is unavailable.");
        if (active) setReview(result);
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Post-session review is unavailable.",
          );
      });
    return () => {
      active = false;
    };
  }, [workbookId]);
  const bookmarkCount =
    review?.cases.reduce((count, item) => count + item.bookmarks.length, 0) ?? 0;
  const pollCount =
    review?.cases.reduce((count, item) => count + item.pollReviews.length, 0) ?? 0;
  return (
    <section className="management-page learner-review-page">
      <div className="page-heading">
        <span>
          <small>Your private learning record</small>
          <h1>Post-session review</h1>
          <p>
            Revisit the teaching sequence, your private bookmarks and only
            those poll answers the instructor has released.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>Learner-owned review</strong>
          <small>No access to another candidate’s work</small>
        </div>
      </div>
      {review && <p className="review-workbook-label">Workbook: {review.workbook.title}</p>}
      {error && <p className="question-bank-message error" role="alert">{error}</p>}
      <div className="metric-grid review-metrics">
        <Metric label="Teaching cases" value={review?.cases.length ?? 0} />
        <Metric label="Private bookmarks" value={bookmarkCount} tone="green" />
        <Metric label="Released poll reviews" value={pollCount} tone="amber" />
        <Metric label="Sessions joined" value={review?.sessions.length ?? 0} />
      </div>
      <div className="review-timeline">
        {!review && !error && <p>Preparing your private review timeline…</p>}
        {review?.cases.map((item) => (
          <article key={item.id}>
            <div className="review-step">
              <b>{String(item.position).padStart(2, "0")}</b>
              <i />
            </div>
            <section className="management-card review-case-card">
              <header>
                <span>
                  <small>{statusLabel(item.classification)} teaching case</small>
                  <h2>{item.title}</h2>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCase(item.id, review.workbook.id)}
                >
                  Open case in viewer
                </button>
              </header>
              {item.note && (
                <div className="review-note-summary">
                  <strong>{item.note.title}</strong>
                  <p>{item.note.body}</p>
                  <ul>
                    {item.note.keyPoints.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  <details>
                    <summary>Teaching explanation</summary>
                    <p>{item.note.revealText}</p>
                  </details>
                </div>
              )}
              <TeachingContentBlocks blocks={item.content} />
              <div className="review-evidence-grid">
                <section>
                  <strong>Private bookmarks</strong>
                  {!item.bookmarks.length && <p>No bookmark saved for this case.</p>}
                  {item.bookmarks.map((bookmark) => (
                    <p key={bookmark.id}>
                      ☆ {bookmark.title} <small>{formatTime(bookmark.updatedAt)}</small>
                    </p>
                  ))}
                </section>
                <section>
                  <strong>Released poll review</strong>
                  {!item.pollReviews.length && (
                    <p>No released answer is available for this case.</p>
                  )}
                  {item.pollReviews.map((poll) => (
                    <div className="review-poll" key={poll.id}>
                      <b>{poll.prompt}</b>
                      <p>Your response: {poll.selectedLabels.join(", ") || "No selection"}</p>
                      <p className="correct">Teaching answer: {poll.correctLabels.join(", ") || "Not specified"}</p>
                      {poll.explanation && <small>{poll.explanation}</small>}
                    </div>
                  ))}
                </section>
              </div>
            </section>
          </article>
        ))}
      </div>
      <p className="review-boundary-note">
        Educational use only · this timeline is a learning aid, not a clinical
        report or diagnostic record.
      </p>
    </section>
  );
}

function TeachingDashboardWorkspace({
  onOpenTeaching,
}: {
  onOpenTeaching: () => void;
}) {
  const [dashboard, setDashboard] = useState<TeachingDashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    let consecutiveFailures = 0;
    function schedule() {
      if (!active || document.hidden) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(
        () => void load(),
        liveRefreshDelay(consecutiveFailures),
      );
    }
    async function load() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/education/teaching-dashboard", {
          cache: "no-store",
        });
        const result = (await response.json()) as TeachingDashboard & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error || "The teaching dashboard is unavailable.");
        if (active) {
          setDashboard(result);
          setError("");
          consecutiveFailures = 0;
        }
      } catch (loadError) {
        consecutiveFailures += 1;
        if (active && consecutiveFailures >= 2)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "The teaching dashboard is unavailable.",
          );
      } finally {
        schedule();
      }
    }
    function visibilityChanged() {
      if (!active || document.hidden) {
        if (timer) window.clearTimeout(timer);
        return;
      }
      consecutiveFailures = 0;
      void load();
    }
    void load();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, []);
  const summary = dashboard?.summary;
  return (
    <section className="management-page teaching-dashboard-page">
      <div className="page-heading">
        <span>
          <small>Instructor control room</small>
          <h1>Live teaching dashboard</h1>
          <p>
            Follow participation, viewer synchronization and live-poll activity
            without exposing individual learner answers.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>Anonymous teaching aggregates</strong>
          <small>Case breakdown hidden below three learners</small>
        </div>
      </div>
      {error && <p className="question-bank-message error" role="alert">{error}</p>}
      <div className="metric-grid teaching-dashboard-metrics">
        <Metric label="Live sessions" value={summary?.liveSessions ?? 0} tone="green" />
        <Metric label="Present learners" value={summary?.presentLearners ?? 0} />
        <Metric label="Following viewer" value={summary?.followingLearners ?? 0} />
        <Metric label="Open polls" value={summary?.livePolls ?? 0} tone="amber" />
        <Metric label="Poll responses (24h)" value={summary?.pollResponses ?? 0} />
      </div>
      <div className="teaching-dashboard-layout">
        <section className="management-card active-session-card">
          <div className="card-heading">
            <span>
              <small>Live overview</small>
              <h2>Session activity</h2>
            </span>
            <button type="button" className="primary-button" onClick={onOpenTeaching}>
              Open teaching viewer
            </button>
          </div>
          <div className="dashboard-session-list">
            {!dashboard && <p>Loading live session data…</p>}
            {dashboard && !dashboard.sessions.length && (
              <p>No session has been run yet. Start Follow Me in the teaching viewer.</p>
            )}
            {dashboard?.sessions.map((session) => (
              <article className={session.state === "live" ? "live" : ""} key={session.id}>
                <header>
                  <span>
                    <small>{session.state === "live" ? "Live now" : "Ended"} · {formatTime(session.startedAt)}</small>
                    <strong>{session.workbookTitle}</strong>
                  </span>
                  <span className={session.state === "live" ? "status-pill green" : "status-pill"}>
                    {statusLabel(session.state)}
                  </span>
                </header>
                <p>Active case: <b>{session.activeCaseTitle}</b></p>
                <div>
                  <span><b>{session.participantCount}</b><small>present</small></span>
                  <span><b>{session.followingCount}</b><small>following</small></span>
                  <span><b>{session.exploringCount}</b><small>exploring</small></span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="management-card case-presence-card">
          <div className="card-heading">
            <span>
              <small>Current learning route</small>
              <h2>Case presence</h2>
            </span>
            <span className="status-pill">≥3 threshold</span>
          </div>
          <div className="case-presence-list">
            {!dashboard?.casePresence.length && (
              <p>Case-level counts appear while learners are in a live session.</p>
            )}
            {dashboard?.casePresence.map((item) => (
              <div key={item.caseId}>
                <span>
                  <strong>{item.caseTitle}</strong>
                  <small>{item.suppressed ? "Small cohort suppressed" : "Anonymous aggregate"}</small>
                </span>
                <b>{item.displayCount}</b>
              </div>
            ))}
          </div>
          <div className="dashboard-privacy-note">
            <strong>Privacy control</strong>
            <p>
              This view contains counts only. Learner identity and individual
              poll selections are not returned by the dashboard API.
            </p>
          </div>
          <small className="dashboard-refreshed">
            Auto-refresh every 3 seconds · {formatTime(dashboard?.refreshedAt ?? null)}
          </small>
        </aside>
      </div>
    </section>
  );
}

type QuestionBankBundle = {
  items: QuestionBankItem[];
  permissions: { manage: boolean };
  refreshedAt: string;
};

function QuestionBankWorkspace() {
  const [bundle, setBundle] = useState<QuestionBankBundle>({
    items: [],
    permissions: { manage: false },
    refreshedAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [responseType, setResponseType] =
    useState<QuestionResponseType>("long-text");
  const [maxMarks, setMaxMarks] = useState(10);
  const [modality, setModality] = useState<QuestionModality>("radiology");
  const [difficulty, setDifficulty] =
    useState<QuestionDifficulty>("intermediate");
  const [tags, setTags] = useState("");
  const [options, setOptions] = useState("");
  const [correctOptions, setCorrectOptions] = useState("");
  const [rationale, setRationale] = useState("");
  const [filterModality, setFilterModality] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [qtiXml, setQtiXml] = useState("");

  async function request(payload?: Record<string, unknown>) {
    const response = await fetch("/api/education/question-bank", {
      method: payload ? "POST" : "GET",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    });
    const result = (await response.json()) as QuestionBankBundle & {
      error?: string;
    };
    if (!response.ok)
      throw new Error(result.error || "The question bank request failed.");
    setBundle(result);
    return result;
  }

  useEffect(() => {
    let active = true;
    fetch("/api/education/question-bank", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as QuestionBankBundle & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error || "The question bank is unavailable.");
        if (active) setBundle(result);
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "The question bank is unavailable.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function mutate(payload: Record<string, unknown>, success: string) {
    setBusy(true);
    setError("");
    try {
      await request(payload);
      setMessage(success);
      window.setTimeout(() => setMessage(""), 3500);
      return true;
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The question bank action failed.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  const visibleItems = bundle.items.filter(
    (item) =>
      (!filterModality || item.modality === filterModality) &&
      (!filterDifficulty || item.difficulty === filterDifficulty) &&
      (!filterTag.trim() ||
        item.tags.some((tag) =>
          tag.includes(filterTag.trim().toLocaleLowerCase()),
        )),
  );
  const optionLines = options
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
  const correctOptionIndexes = correctOptions
    .split(",")
    .map((value) => Number(value.trim()) - 1)
    .filter((value) => Number.isInteger(value) && value >= 0);

  return (
    <section className="management-page question-bank-page">
      <div className="page-heading">
        <span>
          <small>Reusable assessment content</small>
          <h1>Question bank</h1>
          <p>
            Create tagged radiology, pathology and mixed questions once, then
            reuse them across governed workbook versions.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>QTI exchange · education boundary</strong>
          <small>Strict subset import · executable XML rejected</small>
        </div>
      </div>
      {(message || error) && (
        <p className={error ? "question-bank-message error" : "question-bank-message"} role="status">
          {error || message}
        </p>
      )}
      <div className="question-bank-layout">
        <section className="management-card question-authoring-form">
          <div className="card-heading">
            <span>
              <small>New reusable item</small>
              <h2>Author question</h2>
            </span>
            <span className="status-pill">Draft input</span>
          </div>
          <label>
            Short title
            <input maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Hepatic enhancement pattern" />
          </label>
          <label>
            Question prompt
            <textarea maxLength={2000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe or identify the educational finding…" />
          </label>
          <div className="question-bank-fields">
            <label>
              Response
              <select value={responseType} onChange={(event) => setResponseType(event.target.value as QuestionResponseType)}>
                <option value="long-text">Long text</option>
                <option value="single-choice">Choose one</option>
                <option value="multiple-choice">Choose all</option>
              </select>
            </label>
            <label>
              Marks
              <input type="number" min="1" max="100" value={maxMarks} onChange={(event) => setMaxMarks(Number(event.target.value))} />
            </label>
            <label>
              Modality
              <select value={modality} onChange={(event) => setModality(event.target.value as QuestionModality)}>
                <option value="radiology">Radiology</option>
                <option value="pathology">Pathology</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label>
              Difficulty
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as QuestionDifficulty)}>
                <option value="foundation">Foundation</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>
          <label>
            Tags <small>Comma separated, up to 12</small>
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="liver, ct, enhancement" />
          </label>
          {responseType !== "long-text" && (
            <div className="choice-authoring">
              <label>
                Options <small>One per line</small>
                <textarea value={options} onChange={(event) => setOptions(event.target.value)} placeholder={"First option\nSecond option"} />
              </label>
              <label>
                Correct option numbers <small>e.g. 1 or 1,3</small>
                <input value={correctOptions} onChange={(event) => setCorrectOptions(event.target.value)} placeholder="1" />
              </label>
            </div>
          )}
          <label>
            Marking rationale
            <textarea maxLength={2000} value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Optional examiner rationale" />
          </label>
          <button
            type="button"
            className="primary-button"
            disabled={busy || !title.trim() || !prompt.trim()}
            onClick={() =>
              void mutate(
                {
                  action: "create",
                  item: {
                    title,
                    prompt,
                    responseType,
                    maxMarks,
                    modality,
                    difficulty,
                    tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                    options: responseType === "long-text" ? [] : optionLines,
                    correctOptionIndexes:
                      responseType === "long-text" ? [] : correctOptionIndexes,
                    rationale,
                  },
                },
                "Question added to the reusable education bank",
              ).then((created) => {
                if (created) {
                  setTitle("");
                  setPrompt("");
                  setOptions("");
                  setCorrectOptions("");
                  setRationale("");
                }
              })
            }
          >
            Add to question bank
          </button>
        </section>
        <section className="management-card question-bank-list">
          <div className="card-heading">
            <span>
              <small>Active library</small>
              <h2>Reusable items</h2>
            </span>
            <span className="status-pill">{visibleItems.length}</span>
          </div>
          <div className="question-bank-filters">
            <select aria-label="Filter question modality" value={filterModality} onChange={(event) => setFilterModality(event.target.value)}>
              <option value="">All modalities</option>
              <option value="radiology">Radiology</option>
              <option value="pathology">Pathology</option>
              <option value="mixed">Mixed</option>
            </select>
            <select aria-label="Filter question difficulty" value={filterDifficulty} onChange={(event) => setFilterDifficulty(event.target.value)}>
              <option value="">All difficulty</option>
              <option value="foundation">Foundation</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <input aria-label="Filter question tags" value={filterTag} onChange={(event) => setFilterTag(event.target.value)} placeholder="Filter tag" />
          </div>
          <div className="question-bank-items">
            {loading && <p>Loading education question bank…</p>}
            {!loading && !visibleItems.length && <p>No matching active item.</p>}
            {visibleItems.map((item) => (
              <article key={item.id}>
                <header>
                  <span>
                    <small>{statusLabel(item.modality)} · {statusLabel(item.difficulty)} · v{item.version}</small>
                    <strong>{item.title}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void mutate(
                        { action: "archive", id: item.id, expectedVersion: item.version },
                        "Question archived without changing published workbooks",
                      )
                    }
                  >Archive</button>
                </header>
                <p>{item.prompt}</p>
                <footer>
                  <span>{statusLabel(item.responseType)} · {item.maxMarks} marks</span>
                  <span>{item.tags.map((tag) => <i key={tag}>{tag}</i>)}</span>
                </footer>
              </article>
            ))}
          </div>
        </section>
        <aside className="management-card qti-exchange">
          <div className="card-heading">
            <span>
              <small>Interoperability</small>
              <h2>QTI exchange</h2>
            </span>
          </div>
          <p>
            Export the active bank or paste the supported QTI assessment-item
            subset. DTDs, entities, scripts and external references are rejected.
          </p>
          <a className="primary-button qti-download" href="/api/education/question-bank/qti" download>
            Export active bank
          </a>
          <label>
            QTI XML import
            <textarea value={qtiXml} onChange={(event) => setQtiXml(event.target.value)} placeholder="<qti-assessment-test>…" />
          </label>
          <button
            type="button"
            disabled={busy || !qtiXml.trim()}
            onClick={() =>
              void mutate(
                { action: "import-qti", xml: qtiXml },
                "Validated QTI items imported",
              ).then((imported) => {
                if (imported) setQtiXml("");
              })
            }
          >
            Validate &amp; import
          </button>
        </aside>
      </div>
    </section>
  );
}

function ContentSafety({
  data,
  busy,
  postAction,
  refresh,
}: {
  data: AppSnapshot;
  busy: boolean;
  postAction: (
    payload: ActionPayload,
    message: string,
  ) => Promise<AppSnapshot | null>;
  refresh: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [profile, setProfile] = useState("radiology");
  const [deidentified, setDeidentified] = useState(true);
  const [cleared, setCleared] = useState(true);
  const [media, setMedia] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const counts = useMemo(
    () =>
      Object.fromEntries(
        [
          "ready-for-review",
          "requires-review",
          "published",
          "unsupported",
          "rejected",
        ].map((status) => [
          status,
          data.ingestionJobs.filter((job) => job.status === status).length,
        ]),
      ),
    [data.ingestionJobs],
  );
  async function submitIntake(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage("");
    if (!media.length) {
      const updated = await postAction(
        {
          action: "create-ingestion",
          title,
          profile,
          deidentified,
          publicationCleared: cleared,
        },
        "Teaching set classified server-side",
      );
      if (updated) setTitle("");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("deidentified", String(deidentified));
      form.set("publicationCleared", String(cleared));
      media.forEach((file) => form.append("media", file));
      const response = await fetch("/api/ingestion", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "Teaching-media intake failed.");
      await refresh();
      setTitle("");
      setMedia([]);
      setUploadMessage(
        "Files stored in the isolated education quarantine and classified server-side.",
      );
    } catch (uploadError) {
      setUploadMessage(
        uploadError instanceof Error
          ? uploadError.message
          : "Teaching-media intake failed.",
      );
    } finally {
      setUploading(false);
    }
  }
  return (
    <section className="management-page">
      <div className="page-heading">
        <span>
          <small>Staff workspace</small>
          <h1>Content safety & publication</h1>
          <p>
            Server-side classification, de-identification evidence and
            publication review for education-only media.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>No clinical archive connection</strong>
          <small>Education quarantine and object storage only</small>
        </div>
      </div>
      <div className="metric-grid">
        <Metric
          label="Ready for review"
          value={counts["ready-for-review"]}
          tone="green"
        />
        <Metric
          label="Requires review"
          value={counts["requires-review"]}
          tone="amber"
        />
        <Metric label="Published" value={counts.published} />
        <Metric label="Unsupported" value={counts.unsupported} tone="red" />
      </div>
      <div className="management-grid">
        <section className="management-card">
          <div className="card-heading">
            <span>
              <small>Staff-only intake</small>
              <h2>Register teaching media</h2>
            </span>
            <span className="status-pill neutral">Quarantine</span>
          </div>
          <form
            className="intake-form"
            onSubmit={(event) => void submitIntake(event)}
          >
            <label>
              Teaching case title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Thoracic staging CT"
                required
              />
            </label>
            <label>
              Teaching media files{" "}
              <input
                className="file-input"
                type="file"
                multiple
                accept=".dcm,.dicom,.svs,.ndpi,.tif,.tiff,application/dicom,image/tiff"
                onChange={(event) =>
                  setMedia(Array.from(event.target.files ?? []))
                }
              />
              <small>
                Staff only · up to 12 files and 25 MB in the private MVP
              </small>
            </label>
            <label>
              Manifest profile (used when no file is selected)
              <select
                value={profile}
                onChange={(event) => setProfile(event.target.value)}
              >
                <option value="radiology">Supported radiology DICOM</option>
                <option value="pathology">Supported pathology WSI</option>
                <option value="mixed">Intentional mixed case</option>
                <option value="uncertain">Ambiguous metadata</option>
                <option value="unsupported">
                  Unsupported / encrypted format
                </option>
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={deidentified}
                onChange={(event) => setDeidentified(event.target.checked)}
              />
              De-identification checks complete
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={cleared}
                onChange={(event) => setCleared(event.target.checked)}
              />
              Educational publication rights confirmed
            </label>
            <p className="form-note">
              The server inspects file signatures and metadata markers, assigns
              one of five states, and records reason codes. Uncertain content
              never defaults to a viewer.
            </p>
            {uploadMessage && (
              <p className="upload-message" role="status">
                {uploadMessage}
              </p>
            )}
            <button className="primary-button" disabled={busy || uploading}>
              {uploading
                ? "Storing in quarantine…"
                : media.length
                  ? "Upload & classify"
                  : "Classify manifest"}
            </button>
          </form>
        </section>
        <section className="management-card wide-card">
          <div className="card-heading">
            <span>
              <small>Publication queue</small>
              <h2>Review decisions</h2>
            </span>
            <span className="status-pill">
              {data.ingestionJobs.length} records
            </span>
          </div>
          <div className="ingestion-list">
            {data.ingestionJobs.map((job) => (
              <article className="ingestion-row" key={job.id}>
                <div className={`classification-orb ${job.detectedType}`}>
                  <span>
                    {job.detectedType === "radiology"
                      ? "CT"
                      : job.detectedType === "pathology"
                        ? "WSI"
                        : job.detectedType === "mixed"
                          ? "MIX"
                          : "?"}
                  </span>
                </div>
                <div className="ingestion-copy">
                  <strong>{job.title}</strong>
                  <span>
                    <b>{statusLabel(job.detectedType)}</b> ·{" "}
                    {statusLabel(job.status)} · {formatTime(job.createdAt)}
                  </span>
                  <small>{job.reasonCodes.join(" · ")}</small>
                  <div className="check-chips">
                    <i className={job.deidentified ? "pass" : "fail"}>
                      {job.deidentified ? "De-ID checked" : "De-ID incomplete"}
                    </i>
                    <i className={job.publicationCleared ? "pass" : "fail"}>
                      {job.publicationCleared
                        ? "Rights cleared"
                        : "Rights missing"}
                    </i>
                    <code>{shortHash(job.contentHash)}</code>
                  </div>
                </div>
                <div className="row-actions">
                  {!["published", "rejected", "unsupported"].includes(
                    job.status,
                  ) && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void postAction(
                            {
                              action: "review-ingestion",
                              id: job.id,
                              decision: "published",
                            },
                            "Publication decision recorded",
                          )
                        }
                      >
                        Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void postAction(
                            {
                              action: "review-ingestion",
                              id: job.id,
                              decision: "requires-review",
                            },
                            "Case held for further review",
                          )
                        }
                      >
                        Hold
                      </button>
                      <button
                        className="danger"
                        disabled={busy}
                        onClick={() =>
                          void postAction(
                            {
                              action: "review-ingestion",
                              id: job.id,
                              decision: "rejected",
                            },
                            "Case rejected from publication",
                          )
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MarkingWorkspace({
  data,
  busy,
  postAction,
}: {
  data: AppSnapshot;
  busy: boolean;
  postAction: (
    payload: ActionPayload,
    message: string,
  ) => Promise<AppSnapshot | null>;
}) {
  function initialCriterionScores(item: AppSnapshot["markingQueue"][number] | undefined) {
    return Object.fromEntries((item?.answers ?? []).flatMap((answer) => answer.rubricCriteria.map((criterion) => {
      const saved = answer.criterionScores.find((score) => score.label === criterion.label)?.score ?? 0;
      return [`${answer.questionId}::${criterion.label}`, saved];
    })));
  }
  const [selectedId, setSelectedId] = useState(
    data.markingQueue[0]?.attemptId ?? "",
  );
  const selected =
    data.markingQueue.find((item) => item.attemptId === selectedId) ??
    data.markingQueue[0];
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>(() => initialCriterionScores(selected));
  const questionScores = (selected?.answers ?? []).map((answer) => ({ questionId: answer.questionId, score: answer.rubricCriteria.reduce((sum, criterion) => sum + (criterionScores[`${answer.questionId}::${criterion.label}`] ?? 0), 0) }));
  const score = questionScores.reduce((sum, item) => sum + item.score, 0);
  const maxAvailableScore = (selected?.answers ?? []).reduce((sum, answer) => sum + answer.maxMarks, 0) || 40;
  const [feedback, setFeedback] = useState(selected?.feedback ?? "");
  const [finalScore, setFinalScore] = useState(
    selected?.moderatedScore ?? selected?.latestScore ?? 24,
  );
  const [reason, setReason] = useState(selected?.moderationReason ?? "");
  function selectScript(attemptId: string) {
    const item = data.markingQueue.find(
      (entry) => entry.attemptId === attemptId,
    );
    if (!item) return;
    setSelectedId(attemptId);
    setCriterionScores(initialCriterionScores(item));
    setFeedback(item.feedback ?? "");
    setFinalScore(item.moderatedScore ?? item.latestScore ?? 24);
    setReason(item.moderationReason ?? "");
  }
  if (!selected)
    return (
      <section className="management-page">
        <div className="empty-state">
          <h1>No scripts await marking</h1>
          <p>
            Submitted attempts will appear here with their immutable assessment
            evidence.
          </p>
        </div>
      </section>
    );
  return (
    <section className="management-page marking-page">
      <div className="page-heading">
        <span>
          <small>Assessment governance</small>
          <h1>Marking, moderation & results</h1>
          <p>
            Review the exact submitted version, retain every mark revision and
            control result release.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>Evidence receipt</strong>
          <code>{shortHash(selected.evidenceHash)}</code>
        </div>
      </div>
      <div className="marking-layout">
        <aside className="script-list">
          <div className="card-heading">
            <span>
              <small>Submitted scripts</small>
              <h2>Queue</h2>
            </span>
            <span className="status-pill">{data.markingQueue.length}</span>
          </div>
          {data.markingQueue.map((item) => (
            <button
              className={item.attemptId === selected.attemptId ? "active" : ""}
              key={item.attemptId}
              onClick={() => selectScript(item.attemptId)}
            >
              <span className="candidate-avatar">
                {item.candidateName
                  .split(/\s+/)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span>
                <strong>{item.candidateName}</strong>
                <small>
                  {statusLabel(item.state)} · {formatTime(item.submittedAt)}
                </small>
              </span>
            </button>
          ))}
        </aside>
        <section className="script-review">
          <div className="script-meta">
            <span>
              <small>Candidate</small>
              <strong>{selected.candidateName}</strong>
            </span>
            <span>
              <small>Assessment version</small>
              <strong>{data.course.assessmentVersion}</strong>
            </span>
            <span>
              <small>Submitted</small>
              <strong>{formatTime(selected.submittedAt)}</strong>
            </span>
            <span>
              <small>Receipt</small>
              <code>{shortHash(selected.evidenceHash)}</code>
            </span>
          </div>
          {selected.answers.map((answer, index) => (
            <article className="script-answer" key={answer.questionId}>
              <header>
                <span>Question {index + 1}</span>
                <strong>{answer.maxMarks} marks</strong>
              </header>
              <h3>{answer.prompt}</h3>
              <p>{answer.response}</p>
              <div className="criterion-marking" aria-label={`Rubric for question ${index + 1}`}>
                {answer.rubricCriteria.map((criterion) => <label key={criterion.label}><span>{criterion.label}<small> / {criterion.marks}</small></span><input type="number" min="0" max={criterion.marks} value={criterionScores[`${answer.questionId}::${criterion.label}`] ?? 0} onChange={(event) => setCriterionScores((current) => ({ ...current, [`${answer.questionId}::${criterion.label}`]: Math.max(0, Math.min(criterion.marks, Number(event.target.value))) }))} /></label>)}
                <strong>{questionScores.find((item) => item.questionId === answer.questionId)?.score ?? 0} / {answer.maxMarks}</strong>
              </div>
            </article>
          ))}
        </section>
        <aside className="mark-controls">
          <div className="card-heading">
            <span>
              <small>Rubric v1</small>
              <h2>Examiner decision</h2>
            </span>
            <span className="status-pill neutral">{maxAvailableScore} marks</span>
          </div>
          <label>
            Total score{" "}
            <span>
              <input
                type="number"
                min="0"
                max={maxAvailableScore}
                value={score}
                readOnly
              />{" "}
              / {maxAvailableScore}
            </span>
          </label>
          <div className="rubric-bars">
            <span>
              <i style={{ width: `${Math.min(100, (score / maxAvailableScore) * 100)}%` }} />
            </span>
            <small>Observation · Interpretation · Clarity</small>
          </div>
          <label>
            Feedback
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Constructive candidate feedback…"
            />
          </label>
          <button
            className="primary-button"
            disabled={busy || !feedback.trim()}
            onClick={() =>
              void postAction(
                {
                  action: "save-mark",
                  attemptId: selected.attemptId,
                  score,
                  feedback,
                  questionScores,
                  criterionScores: selected.answers.flatMap((answer) => answer.rubricCriteria.map((criterion) => ({ questionId: answer.questionId, label: criterion.label, score: criterionScores[`${answer.questionId}::${criterion.label}`] ?? 0 }))),
                  expectedRevision: selected.markRevision ?? 0,
                },
                "Examiner mark revision saved",
              )
            }
          >
            Save examiner mark
          </button>
          <hr />
          <div className="card-heading">
            <span>
              <small>Second-stage review</small>
              <h2>Moderation</h2>
            </span>
          </div>
          <label>
            Final score{" "}
            <span>
              <input
                type="number"
                min="0"
                max={maxAvailableScore}
                value={finalScore}
                onChange={(event) => setFinalScore(Number(event.target.value))}
              />{" "}
              / {maxAvailableScore}
            </span>
          </label>
          <label>
            Moderation rationale
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Record agreement or adjustment rationale…"
            />
          </label>
          <button
            className="secondary-button"
            disabled={busy || selected.latestScore === null || !reason.trim()}
            onClick={() =>
              void postAction(
                {
                  action: "moderate-mark",
                  attemptId: selected.attemptId,
                  finalScore,
                  reason,
                  expectedMarkRevision: selected.markRevision ?? 0,
                },
                "Moderation decision preserved",
              )
            }
          >
            Complete moderation
          </button>
          <button
            className="release-button"
            disabled={busy || selected.state !== "moderated"}
            onClick={() => {
              if (
                window.confirm(
                  "Release this moderated result to the candidate?",
                )
              )
                void postAction(
                  { action: "release-result", attemptId: selected.attemptId },
                  "Result released with population receipt",
                );
            }}
          >
            {selected.resultOutcome
              ? `${selected.resultOutcome} · released`
              : "Release result"}
          </button>
        </aside>
      </div>
    </section>
  );
}

function ProgressInsights({ data }: { data: AppSnapshot }) {
  const completed = data.progressDashboard.filter((item) => item.status === "completed").length;
  const averageProgress = data.progressDashboard.length ? Math.round(data.progressDashboard.reduce((sum, item) => sum + item.percentComplete, 0) / data.progressDashboard.length) : 0;
  const averageFacility = data.itemAnalysis.length ? Math.round(data.itemAnalysis.reduce((sum, item) => sum + item.facilityPercent, 0) / data.itemAnalysis.length) : 0;
  return <section className="management-page insights-page">
    <div className="page-heading"><span><small>Education intelligence</small><h1>Progress & assessment insights</h1><p>Monitor allocated learning, identify difficult items and compare rubric performance without exposing clinical data.</p></span><div className="boundary-badge"><strong>Education records only</strong><small>Aggregated from governed workbook activity and marking</small></div></div>
    <div className="insight-summary">
      <article><small>Tracked allocations</small><strong>{data.progressDashboard.length}</strong><span>{completed} completed</span></article>
      <article><small>Mean completion</small><strong>{averageProgress}%</strong><span>across active learner progress</span></article>
      <article><small>Marked items</small><strong>{data.itemAnalysis.length}</strong><span>{averageFacility}% mean facility</span></article>
      <article><small>Rubric dimensions</small><strong>{data.rubricPerformance.length}</strong><span>latest mark revisions only</span></article>
    </div>
    <div className="insights-grid">
      <section className="management-card"><div className="card-heading"><span><small>Course dashboard</small><h2>Candidate progress</h2></span></div><div className="analytics-table"><div className="analytics-head"><span>Candidate</span><span>Workbook</span><span>Completion</span><span>Last activity</span></div>{data.progressDashboard.map((item) => <div key={`${item.workbookId}:${item.learnerId}`}><span><strong>{item.learnerName}</strong><small>{statusLabel(item.status)}</small></span><span>{item.workbookTitle}</span><span><b>{item.percentComplete}%</b><i><em style={{ width: `${item.percentComplete}%` }} /></i><small>{item.casesVisited}/{item.casesTotal} cases</small></span><span>{formatTime(item.lastActivityAt)}</span></div>)}{!data.progressDashboard.length && <p>No learner case activity has been recorded yet.</p>}</div></section>
      <section className="management-card"><div className="card-heading"><span><small>Question quality</small><h2>Exam item analysis</h2><p>Facility is the mean percentage score for the latest examiner revision.</p></span></div><div className="analysis-list">{data.itemAnalysis.map((item) => <article key={item.questionId}><span><strong>{item.prompt}</strong><small>{item.attempts} marked response{item.attempts === 1 ? "" : "s"} · mean {item.meanScore}/{item.maxScore}</small></span><span className={`facility-score ${item.facilityPercent < 50 ? "low" : item.facilityPercent > 85 ? "high" : ""}`}>{item.facilityPercent}%</span></article>)}{!data.itemAnalysis.length && <p>Item statistics will appear after rubric-aligned marking is saved.</p>}</div></section>
      <section className="management-card rubric-report"><div className="card-heading"><span><small>Rubric report</small><h2>Performance by criterion</h2></span></div>{data.rubricPerformance.map((item) => <article key={item.criterionLabel}><header><strong>{item.criterionLabel}</strong><span>{item.performancePercent}%</span></header><div><i style={{ width: `${item.performancePercent}%` }} /></div><small>{item.attempts} criterion marks · mean {item.meanScore}/{item.maxScore}</small></article>)}{!data.rubricPerformance.length && <p>Rubric performance will appear after criterion-level marking.</p>}</section>
    </div>
  </section>;
}

function AuditWorkspace({ data }: { data: AppSnapshot }) {
  return (
    <section className="management-page">
      <div className="page-heading">
        <span>
          <small>Immutable education audit</small>
          <h1>Evidence & activity trail</h1>
          <p>
            Assessment, publication and privileged actions are chained
            independently from clinical audit systems.
          </p>
        </span>
        <div className="boundary-badge">
          <strong>Integrity status</strong>
          <small>
            {data.auditEvents.length
              ? `${data.auditEvents.length} recent chained events`
              : "No material events yet"}
          </small>
        </div>
      </div>
      <section className="audit-card">
        <div className="audit-head">
          <span>Sequence</span>
          <span>Event</span>
          <span>Target</span>
          <span>Server time</span>
          <span>Details</span>
        </div>
        {data.auditEvents.length ? (
          data.auditEvents.map((event) => (
            <details className="audit-row" key={event.sequence}>
              <summary>
                <strong>#{event.sequence}</strong>
                <span>
                  <b>{statusLabel(event.action.replaceAll(".", "-"))}</b>
                  <small>{statusLabel(event.outcome)}</small>
                </span>
                <span>
                  <b>{statusLabel(event.targetType)}</b>
                  <small>{event.targetId}</small>
                </span>
                <time>{formatTime(event.occurredAt)}</time>
                <span className="audit-expand" aria-hidden="true">View</span>
              </summary>
              <div className="audit-details">
                <span><small>Target</small><b>{statusLabel(event.targetType)} · {event.targetId}</b></span>
                <span><small>Server time</small><time>{formatTime(event.occurredAt)}</time></span>
                <span><small>Actor</small><code>{event.actorId}</code></span>
                <span><small>Reason</small><b>{event.reason || event.outcome}</b></span>
                <span><small>Integrity</small><code>{event.integrityHash}</code></span>
              </div>
            </details>
          ))
        ) : (
          <div className="empty-state">
            <h2>No audit events yet</h2>
            <p>
              Save an answer, classify content, mark a script or release a
              result to create chained evidence.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
