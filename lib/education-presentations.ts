import { safeText, sha256 } from "@/lib/domain";
import type { ImagePlane, PatientPoint } from "@/lib/education-viewer-adapter";

export const EDUCATION_ROLES = ["administrator", "instructor", "examiner", "learner"] as const;
export type EducationRole = (typeof EDUCATION_ROLES)[number];
export type PresentationVisibilityPolicy = "teaching-only" | "after-submission" | "after-results";

export type SceneAnnotation = {
  id: string;
  kind: "arrow" | "text" | "measurement";
  label: string;
  visible: boolean;
  answerBearing: boolean;
  points: number[];
};

export type SceneViewport = {
  id: string;
  order: number;
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  frame: number;
  sliceIndex: number;
  plane: ImagePlane | "slide";
  windowCenter: number | null;
  windowWidth: number | null;
  zoom: number;
  panX: number;
  panY: number;
};

export type ViewerScene = {
  schema: "didanix-education-viewer-scene-v1";
  layout: { rows: number; columns: number };
  viewports: SceneViewport[];
  crosshairPatient: PatientPoint | null;
  annotationVisibility: "visible" | "hidden";
  annotations: SceneAnnotation[];
  instructorNotes: string;
};

export type InstructorPresentation = {
  id: string;
  scopeType: "case" | "workbook";
  scopeId: string;
  title: string;
  ownerId: string;
  version: number;
  active: boolean;
  visibilityPolicy: PresentationVisibilityPolicy;
  scenes: ViewerScene[];
  createdAt: string;
  updatedAt: string;
  headEventHash: string;
};

export type LearnerBookmark = {
  id: string;
  learnerId: string;
  caseId: string;
  title: string;
  version: number;
  active: boolean;
  scene: ViewerScene;
  createdAt: string;
  updatedAt: string;
  headEventHash: string;
};

const UID = /^\d+(?:\.\d+)+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLANES = new Set<ImagePlane | "slide">(["axial", "coronal", "sagittal", "slide"]);
const ANNOTATION_KINDS = new Set(["arrow", "text", "measurement"]);

export class PresentationValidationError extends Error {}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PresentationValidationError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string) {
  const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
  if (unexpected) throw new PresentationValidationError(`${label} contains unsupported field ${unexpected}.`);
}

function number(value: unknown, label: string, minimum: number, maximum: number, integer = false) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum || (integer && !Number.isInteger(parsed))) throw new PresentationValidationError(`${label} is outside the permitted range.`);
  return parsed;
}

function dicomUid(value: unknown, label: string) {
  const parsed = safeText(value, 64);
  if (!UID.test(parsed) || parsed.length > 64) throw new PresentationValidationError(`${label} must be a valid DICOM UID.`);
  return parsed;
}

export function canonicalEventId(value: unknown) {
  const parsed = safeText(value, 36);
  if (!UUID.test(parsed)) throw new PresentationValidationError("eventId must be a UUID.");
  return parsed.toLowerCase();
}

export function canonicalRecordId(value: unknown, label: string) {
  const parsed = safeText(value, 36);
  if (!UUID.test(parsed)) throw new PresentationValidationError(`${label} must be a UUID.`);
  return parsed.toLowerCase();
}

export function validateViewerScene(value: unknown): ViewerScene {
  const scene = object(value, "scene");
  exactKeys(scene, ["schema", "layout", "viewports", "crosshairPatient", "annotationVisibility", "annotations", "instructorNotes"], "scene");
  if (scene.schema !== "didanix-education-viewer-scene-v1") throw new PresentationValidationError("The viewer scene schema is unsupported.");
  const layout = object(scene.layout, "layout");
  exactKeys(layout, ["rows", "columns"], "layout");
  const rows = number(layout.rows, "layout rows", 1, 2, true);
  const columns = number(layout.columns, "layout columns", 1, 3, true);
  if (!Array.isArray(scene.viewports) || scene.viewports.length < 1 || scene.viewports.length > 6) throw new PresentationValidationError("A scene must contain between one and six viewports.");
  const viewports = scene.viewports.map((raw, index): SceneViewport => {
    const viewport = object(raw, `viewport ${index + 1}`);
    exactKeys(viewport, ["id", "order", "studyInstanceUid", "seriesInstanceUid", "sopInstanceUid", "frame", "sliceIndex", "plane", "windowCenter", "windowWidth", "zoom", "panX", "panY"], `viewport ${index + 1}`);
    const plane = safeText(viewport.plane, 12) as ImagePlane | "slide";
    if (!PLANES.has(plane)) throw new PresentationValidationError(`viewport ${index + 1} has an unsupported plane.`);
    const windowCenter = viewport.windowCenter === null ? null : number(viewport.windowCenter, "window center", -100_000, 100_000);
    const windowWidth = viewport.windowWidth === null ? null : number(viewport.windowWidth, "window width", 0.001, 200_000);
    return {
      id: safeText(viewport.id, 40) || `viewport-${index + 1}`,
      order: number(viewport.order, "viewport order", 0, 5, true),
      studyInstanceUid: dicomUid(viewport.studyInstanceUid, "StudyInstanceUID"),
      seriesInstanceUid: dicomUid(viewport.seriesInstanceUid, "SeriesInstanceUID"),
      sopInstanceUid: dicomUid(viewport.sopInstanceUid, "SOPInstanceUID"),
      frame: number(viewport.frame, "frame", 0, 100_000, true),
      sliceIndex: number(viewport.sliceIndex, "slice index", 0, 100_000, true),
      plane, windowCenter, windowWidth,
      zoom: number(viewport.zoom, "zoom", 0.1, 40), panX: number(viewport.panX, "pan x", -100_000, 100_000), panY: number(viewport.panY, "pan y", -100_000, 100_000),
    };
  });
  if (new Set(viewports.map((viewport) => viewport.order)).size !== viewports.length) throw new PresentationValidationError("Viewport order values must be unique.");
  if (rows * columns < viewports.length) throw new PresentationValidationError("The viewport layout is too small for the saved viewport order.");
  let crosshairPatient: PatientPoint | null = null;
  if (scene.crosshairPatient !== null) {
    if (!Array.isArray(scene.crosshairPatient) || scene.crosshairPatient.length !== 3) throw new PresentationValidationError("crosshairPatient must be a DICOM patient-space coordinate.");
    crosshairPatient = scene.crosshairPatient.map((item) => number(item, "crosshair coordinate", -1_000_000, 1_000_000)) as [number, number, number];
  }
  const annotationVisibility = scene.annotationVisibility === "hidden" ? "hidden" : scene.annotationVisibility === "visible" ? "visible" : null;
  if (!annotationVisibility) throw new PresentationValidationError("annotationVisibility must be visible or hidden.");
  if (!Array.isArray(scene.annotations) || scene.annotations.length > 100) throw new PresentationValidationError("A scene may contain no more than 100 manual annotations.");
  const annotations = scene.annotations.map((raw, index): SceneAnnotation => {
    const annotation = object(raw, `annotation ${index + 1}`);
    exactKeys(annotation, ["id", "kind", "label", "visible", "answerBearing", "points"], `annotation ${index + 1}`);
    const kind = safeText(annotation.kind, 20) as SceneAnnotation["kind"];
    if (!ANNOTATION_KINDS.has(kind)) throw new PresentationValidationError(`annotation ${index + 1} has an unsupported kind.`);
    if (!Array.isArray(annotation.points) || annotation.points.length < 2 || annotation.points.length > 12) throw new PresentationValidationError(`annotation ${index + 1} has invalid points.`);
    return { id: safeText(annotation.id, 64) || `annotation-${index + 1}`, kind, label: safeText(annotation.label, 120), visible: annotation.visible === true, answerBearing: annotation.answerBearing === true, points: annotation.points.map((item) => number(item, "annotation point", -100_000, 100_000)) };
  });
  return { schema: "didanix-education-viewer-scene-v1", layout: { rows, columns }, viewports: [...viewports].sort((a, b) => a.order - b.order), crosshairPatient, annotationVisibility, annotations, instructorNotes: safeText(scene.instructorNotes, 1_200) };
}

export function validateSceneSequence(value: unknown): ViewerScene[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 24) throw new PresentationValidationError("An instructor presentation must contain between one and 24 scenes.");
  return value.map(validateViewerScene);
}

export function canManageInstructorPresentation(roles: readonly string[]) { return roles.includes("instructor") || roles.includes("administrator"); }
export function canUseLearnerBookmarks(roles: readonly string[]) { return roles.includes("learner"); }
export function canViewEducationCase(roles: readonly string[]) { return roles.some((role) => EDUCATION_ROLES.includes(role as EducationRole)); }

export function examPolicyAllowsPresentation(policy: PresentationVisibilityPolicy, attemptState: string) {
  if (policy === "teaching-only") return false;
  if (policy === "after-results") return attemptState === "released";
  return !["assigned", "in-progress", "reopened"].includes(attemptState);
}

export function redactSceneForExamination(scene: ViewerScene, answerReleasePermitted: boolean): ViewerScene {
  const validated = validateViewerScene(scene);
  if (answerReleasePermitted) return validated;
  return { ...validated, instructorNotes: "", annotations: validated.annotations.filter((annotation) => !annotation.answerBearing).map((annotation) => ({ ...annotation, label: annotation.kind === "text" ? "" : annotation.label })) };
}

export function restoreOrderedScene(scene: ViewerScene) {
  const validated = validateViewerScene(scene);
  return { ...validated, viewports: [...validated.viewports].sort((a, b) => a.order - b.order) };
}

export type VersionedEvent = { eventId: string; sequence: number; operation: string; requestHash: string; previousEventHash: string; eventHash: string; snapshot: unknown };

export async function appendVersionedEvent(history: readonly VersionedEvent[], input: { eventId: string; expectedVersion: number; operation: string; request: unknown; snapshot: unknown }) {
  const eventId = canonicalEventId(input.eventId);
  const requestHash = await sha256(JSON.stringify(input.request));
  const replay = history.find((event) => event.eventId === eventId);
  if (replay) {
    if (replay.requestHash !== requestHash) throw new PresentationValidationError("Event identifier is already in use for a different mutation.");
    return { history: [...history], event: replay, idempotent: true };
  }
  if (history.length !== input.expectedVersion) throw new PresentationValidationError("Version conflict; reload before saving.");
  const previousEventHash = history.at(-1)?.eventHash ?? "GENESIS";
  const sequence = input.expectedVersion + 1;
  const eventHash = await sha256(JSON.stringify({ eventId, sequence, operation: input.operation, requestHash, previousEventHash, snapshot: input.snapshot }));
  const event = { eventId, sequence, operation: input.operation, requestHash, previousEventHash, eventHash, snapshot: structuredClone(input.snapshot) };
  return { history: [...history, event], event, idempotent: false };
}
