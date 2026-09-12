import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";
import { safeText, sha256 } from "@/lib/domain";
import {
  canManageInstructorPresentation, canUseLearnerBookmarks, canViewEducationCase,
  canonicalEventId, canonicalRecordId, examPolicyAllowsPresentation,
  redactSceneForExamination, validateSceneSequence, validateViewerScene,
  type InstructorPresentation, type LearnerBookmark, type PresentationVisibilityPolicy, type ViewerScene,
} from "@/lib/education-presentations";
import { educationGeometryForCase, educationWsiIdentifiersForCase, resolvePatientSpaceLocalizer, resolveStoredPatientSpaceLocalizer, type LocalizerMap, type PatientPoint } from "@/lib/education-viewer-adapter";
import { canAccessPublishedCase, canAccessPublishedWorkbook } from "@/lib/workbook-access";

type Row = Record<string, string | number | null>;
const VISIBILITY_POLICIES = new Set<PresentationVisibilityPolicy>(["teaching-only", "after-submission", "after-results"]);

function parseJson<T>(value: unknown, fallback: T): T { try { return typeof value === "string" ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function rows<T>(result: D1Result<T>) { return result.results ?? []; }
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
function exactKeys(payload: Record<string, unknown>, allowed: readonly string[]) {
  const unexpected = Object.keys(payload).find((key) => !allowed.includes(key));
  if (unexpected) throw new EducationApiError(`Unsupported field ${unexpected}.`, 422);
}
function title(value: unknown, label: string) {
  const parsed = safeText(value, 80).trim();
  if (!parsed) throw new EducationApiError(`${label} is required.`, 422);
  return parsed;
}
function expectedVersion(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new EducationApiError("expectedVersion must be a non-negative integer.", 422);
  return parsed;
}

export async function educationRolesFor(auth: AuthContext) {
  await ensureEducationUser(auth);
  const record = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`).bind(auth.userId).first<{ roles: string }>();
  return record?.roles.split(",").filter(Boolean) ?? [];
}

async function requireAnyEducationRole(auth: AuthContext) {
  const roles = await educationRolesFor(auth);
  if (!canViewEducationCase(roles)) throw new EducationApiError("Your education role does not permit access to this case.", 403);
  return roles;
}

async function requirePresentationManager(auth: AuthContext) {
  const roles = await educationRolesFor(auth);
  if (!canManageInstructorPresentation(roles)) throw new EducationApiError("Only an instructor or administrator can change the instructor master presentation.", 403);
  return roles;
}

async function requireLearner(auth: AuthContext) {
  const roles = await educationRolesFor(auth);
  if (!canUseLearnerBookmarks(roles)) throw new EducationApiError("Learner bookmarks are available only within the learner account boundary.", 403);
  return roles;
}

async function ensureScope(scopeType: "case" | "workbook", scopeId: string) {
  const table = scopeType === "case" ? "cases" : "workbooks";
  const record = await env.DB.prepare(`SELECT id, status FROM ${table} WHERE id = ?`).bind(scopeId).first<{ id: string; status: string }>();
  if (!record || record.status !== "published") throw new EducationApiError(`Published education ${scopeType} not found.`, 404);
}

async function ensureScopeAccess(auth: AuthContext, roles: string[], scopeType: "case" | "workbook", scopeId: string) {
  const allowed = scopeType === "workbook"
    ? await canAccessPublishedWorkbook(auth.userId, roles, scopeId)
    : await canAccessPublishedCase(auth.userId, roles, scopeId);
  if (!allowed) throw new EducationApiError(`This education ${scopeType} is not allocated to your account.`, 403);
}

async function validateSceneReferences(scopeType: "case" | "workbook", scopeId: string, scenes: readonly ViewerScene[]) {
  const caseRows = scopeType === "case"
    ? await env.DB.prepare(`SELECT id, classification FROM cases WHERE id = ? AND status = 'published'`).bind(scopeId).all<{ id: string; classification: string }>()
    : await env.DB.prepare(`SELECT c.id, c.classification FROM workbook_cases wc JOIN cases c ON c.id = wc.case_id WHERE wc.workbook_id = ? AND c.status = 'published'`).bind(scopeId).all<{ id: string; classification: string }>();
  const allowed = new Set<string>();
  for (const teachingCase of rows(caseRows)) {
    if (teachingCase.classification !== "pathology") {
      for (const series of educationGeometryForCase(teachingCase.id)) for (const frame of series.frames) allowed.add(`${series.studyInstanceUid}|${series.seriesInstanceUid}|${frame.sopInstanceUid}`);
    }
    if (teachingCase.classification === "pathology" || teachingCase.classification === "mixed") {
      const wsi = educationWsiIdentifiersForCase(teachingCase.id); allowed.add(`${wsi.studyInstanceUid}|${wsi.seriesInstanceUid}|${wsi.sopInstanceUid}`);
    }
  }
  for (const scene of scenes) {
    for (const viewport of scene.viewports) if (!allowed.has(`${viewport.studyInstanceUid}|${viewport.seriesInstanceUid}|${viewport.sopInstanceUid}`)) throw new EducationApiError("A saved scene references media outside the published Education scope.", 422);
    if (scene.crosshairPatient && scene.viewports.some((viewport) => viewport.plane === "slide")) throw new EducationApiError("A whole-slide scene cannot contain a tri-planar patient-space crosshair.", 422);
  }
}

function presentationFromRow(row: Row, scenes?: ViewerScene[]): InstructorPresentation {
  return {
    id: String(row.id), scopeType: String(row.scope_type) as "case" | "workbook", scopeId: String(row.scope_id), title: String(row.title), ownerId: String(row.owner_id), version: Number(row.version), active: Boolean(row.active), visibilityPolicy: String(row.visibility_policy) as PresentationVisibilityPolicy,
    scenes: scenes ?? validateSceneSequence(parseJson<unknown[]>(row.scenes_json, [])), createdAt: String(row.created_at), updatedAt: String(row.updated_at), headEventHash: String(row.head_event_hash),
  };
}

function bookmarkFromRow(row: Row): LearnerBookmark {
  return { id: String(row.id), learnerId: String(row.learner_id), caseId: String(row.case_id), title: String(row.title), version: Number(row.version), active: Boolean(row.active), scene: validateViewerScene(parseJson(row.scene_json, {})), createdAt: String(row.created_at), updatedAt: String(row.updated_at), headEventHash: String(row.head_event_hash) };
}

async function attemptStateFor(auth: AuthContext, workbookId: string) {
  if (!workbookId) return "assigned";
  const attempt = await env.DB.prepare(
    `SELECT a.state
       FROM attempts a
       JOIN assessment_versions av ON av.id = a.assessment_version_id
      WHERE a.user_id = ? AND av.workbook_id = ?
      ORDER BY a.started_at DESC LIMIT 1`,
  ).bind(auth.userId, workbookId).first<{ state: string }>();
  return attempt?.state ?? "assigned";
}

async function eventReplay(table: "instructor_presentation_events" | "learner_bookmark_events", eventId: string, requestHash: string) {
  const idColumn = table === "instructor_presentation_events" ? "presentation_id" : "bookmark_id";
  const event = await env.DB.prepare(`SELECT ${idColumn} AS record_id, request_hash FROM ${table} WHERE event_id = ?`).bind(eventId).first<{ record_id: string; request_hash: string }>();
  if (!event) return null;
  if (event.request_hash !== requestHash) throw new EducationApiError("Event identifier is already in use for a different mutation.", 409);
  return event.record_id;
}

async function buildEvent(input: { eventId: string; recordId: string; sequence: number; operation: string; actorId: string; requestHash: string; snapshot: unknown; previousEventHash: string }) {
  const createdAt = new Date().toISOString();
  const eventHash = await sha256(stableJson({ schema: "didanix-education-mutation-event-v1", ...input, createdAt }));
  return { ...input, createdAt, eventHash };
}

export async function listInstructorPresentations(auth: AuthContext, scopeType: "case" | "workbook", scopeId: string, context: "teaching" | "exam", includeHistory = false, requestedWorkbookId = "") {
  const roles = await requireAnyEducationRole(auth);
  await ensureScope(scopeType, scopeId);
  await ensureScopeAccess(auth, roles, scopeType, scopeId);
  const workbookId = scopeType === "workbook"
    ? scopeId
    : safeText(requestedWorkbookId, 100);
  if (scopeType === "case") {
    if (!workbookId)
      throw new EducationApiError("A workbook context is required for a case presentation.", 422);
    if (!(await canAccessPublishedWorkbook(auth.userId, roles, workbookId)))
      throw new EducationApiError("This education workbook is not allocated to your account.", 403);
    const membership = await env.DB.prepare(
      `SELECT wc.case_id
         FROM workbook_cases wc
         JOIN workbooks w ON w.id = wc.workbook_id
        WHERE wc.workbook_id = ? AND wc.case_id = ? AND w.status = 'published'`,
    ).bind(workbookId, scopeId).first();
    if (!membership)
      throw new EducationApiError("This case is not part of the requested workbook.", 409);
  }
  if (includeHistory && !canManageInstructorPresentation(roles)) throw new EducationApiError("Presentation history is restricted to instructors and administrators.", 403);
  const result = await env.DB.prepare(`SELECT * FROM instructor_presentations WHERE scope_type = ? AND scope_id = ? AND active = 1 ORDER BY updated_at DESC, id`).bind(scopeType, scopeId).all<Row>();
  const attemptState = context === "exam" ? await attemptStateFor(auth, workbookId) : "released";
  const presentations = rows(result).flatMap((row) => {
    const item = presentationFromRow(row);
    if (context === "exam" && !examPolicyAllowsPresentation(item.visibilityPolicy, attemptState)) return [];
    return [{ ...item, scenes: item.scenes.map((scene) => redactSceneForExamination(scene, context !== "exam" || examPolicyAllowsPresentation(item.visibilityPolicy, attemptState))) }];
  });
  const history = includeHistory ? await Promise.all(presentations.map(async (item) => ({ presentationId: item.id, events: rows(await env.DB.prepare(`SELECT event_id, sequence, operation, actor_id, request_hash, snapshot_json, previous_event_hash, event_hash, created_at FROM instructor_presentation_events WHERE presentation_id = ? ORDER BY sequence`).bind(item.id).all<Row>()).map((event) => ({ eventId: String(event.event_id), sequence: Number(event.sequence), operation: String(event.operation), actorId: String(event.actor_id), requestHash: String(event.request_hash), snapshot: parseJson(event.snapshot_json, null), previousEventHash: String(event.previous_event_hash), eventHash: String(event.event_hash), createdAt: String(event.created_at) })) }))) : undefined;
  return { presentations, history, examPolicy: { context, attemptState, answerMaterialReleased: context !== "exam" || presentations.length > 0 } };
}

export async function createInstructorPresentation(auth: AuthContext, scopeType: "case" | "workbook", scopeId: string, payload: Record<string, unknown>) {
  const roles = await requirePresentationManager(auth); await ensureScope(scopeType, scopeId); await ensureScopeAccess(auth, roles, scopeType, scopeId);
  exactKeys(payload, ["eventId", "expectedVersion", "presentationId", "title", "visibilityPolicy", "scenes"]);
  const eventId = canonicalEventId(payload.eventId); const version = expectedVersion(payload.expectedVersion);
  if (version !== 0) throw new EducationApiError("New instructor presentations must start at version zero.", 409);
  const id = canonicalRecordId(payload.presentationId, "presentationId"); const parsedTitle = title(payload.title, "Presentation title");
  const visibilityPolicy = safeText(payload.visibilityPolicy, 30) as PresentationVisibilityPolicy;
  if (!VISIBILITY_POLICIES.has(visibilityPolicy)) throw new EducationApiError("The examination visibility policy is invalid.", 422);
  const scenes = validateSceneSequence(payload.scenes);
  await validateSceneReferences(scopeType, scopeId, scenes);
  const requestMaterial = { scopeType, scopeId, id, title: parsedTitle, visibilityPolicy, scenes, expectedVersion: version };
  const requestHash = await sha256(stableJson(requestMaterial));
  const replayId = await eventReplay("instructor_presentation_events", eventId, requestHash);
  if (replayId) return { idempotent: true, presentation: presentationFromRow((await env.DB.prepare(`SELECT * FROM instructor_presentations WHERE id = ?`).bind(replayId).first<Row>())!) };
  const now = new Date().toISOString();
  const snapshot = { ...requestMaterial, version: 1, active: true, ownerId: auth.userId, createdAt: now, updatedAt: now };
  const event = await buildEvent({ eventId, recordId: id, sequence: 1, operation: "CREATED", actorId: auth.userId, requestHash, snapshot, previousEventHash: "GENESIS" });
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO instructor_presentations (id, scope_type, scope_id, title, owner_id, version, active, visibility_policy, scenes_json, created_at, updated_at, head_event_hash) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`).bind(id, scopeType, scopeId, parsedTitle, auth.userId, 1, visibilityPolicy, JSON.stringify(scenes), now, now, event.eventHash),
      env.DB.prepare(`INSERT INTO instructor_presentation_events (event_id, presentation_id, sequence, operation, actor_id, request_hash, snapshot_json, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(eventId, id, 1, event.operation, auth.userId, requestHash, JSON.stringify(snapshot), "GENESIS", event.eventHash, event.createdAt),
    ]);
  } catch { throw new EducationApiError("The instructor presentation changed; reload before saving.", 409); }
  await appendAudit(auth.userId, "education.presentation.created", "instructor-presentation", id, "success", `${scopeType}=${scopeId};version=1`);
  return { idempotent: false, presentation: presentationFromRow((await env.DB.prepare(`SELECT * FROM instructor_presentations WHERE id = ?`).bind(id).first<Row>())!) };
}

export async function updateInstructorPresentation(auth: AuthContext, scopeType: "case" | "workbook", scopeId: string, presentationId: string, payload: Record<string, unknown>, retire = false) {
  const roles = await requirePresentationManager(auth); await ensureScope(scopeType, scopeId);
  await ensureScopeAccess(auth, roles, scopeType, scopeId);
  exactKeys(payload, retire ? ["eventId", "expectedVersion"] : ["eventId", "expectedVersion", "presentationId", "title", "visibilityPolicy", "scenes"]);
  const id = canonicalRecordId(presentationId, "presentationId"); const eventId = canonicalEventId(payload.eventId); const version = expectedVersion(payload.expectedVersion);
  const current = await env.DB.prepare(`SELECT * FROM instructor_presentations WHERE id = ? AND scope_type = ? AND scope_id = ? AND active = 1`).bind(id, scopeType, scopeId).first<Row>();
  if (!current) throw new EducationApiError("Instructor presentation not found.", 404);
  if (String(current.owner_id) !== auth.userId && !roles.includes("administrator")) throw new EducationApiError("Only the owning instructor or an administrator can change this master presentation.", 403);
  const parsedTitle = retire ? String(current.title) : title(payload.title, "Presentation title");
  const visibilityPolicy = retire ? String(current.visibility_policy) as PresentationVisibilityPolicy : safeText(payload.visibilityPolicy, 30) as PresentationVisibilityPolicy;
  if (!VISIBILITY_POLICIES.has(visibilityPolicy)) throw new EducationApiError("The examination visibility policy is invalid.", 422);
  const scenes = retire ? validateSceneSequence(parseJson(current.scenes_json, [])) : validateSceneSequence(payload.scenes);
  await validateSceneReferences(scopeType, scopeId, scenes);
  if (!retire && canonicalRecordId(payload.presentationId, "presentationId") !== id) throw new EducationApiError("Path and payload presentation identifiers differ.", 422);
  const requestMaterial = { scopeType, scopeId, id, title: parsedTitle, visibilityPolicy, scenes, expectedVersion: version, retire };
  const requestHash = await sha256(stableJson(requestMaterial));
  const replayId = await eventReplay("instructor_presentation_events", eventId, requestHash);
  if (replayId) return { idempotent: true, presentation: presentationFromRow((await env.DB.prepare(`SELECT * FROM instructor_presentations WHERE id = ?`).bind(replayId).first<Row>())!) };
  if (Number(current.version) !== version) throw new EducationApiError("Instructor presentation changed; reload before saving.", 409);
  const nextVersion = version + 1; const now = new Date().toISOString(); const active = retire ? 0 : 1;
  const snapshot = { scopeType, scopeId, id, title: parsedTitle, ownerId: String(current.owner_id), version: nextVersion, active: Boolean(active), visibilityPolicy, scenes, createdAt: String(current.created_at), updatedAt: now };
  const event = await buildEvent({ eventId, recordId: id, sequence: nextVersion, operation: retire ? "RETIRED" : "UPDATED", actorId: auth.userId, requestHash, snapshot, previousEventHash: String(current.head_event_hash) });
  try {
    await env.DB.batch([
      env.DB.prepare(`UPDATE instructor_presentations SET title = ?, version = ?, active = ?, visibility_policy = ?, scenes_json = ?, updated_at = ?, head_event_hash = ? WHERE id = ? AND version = ? AND active = 1`).bind(parsedTitle, nextVersion, active, visibilityPolicy, JSON.stringify(scenes), now, event.eventHash, id, version),
      env.DB.prepare(`INSERT INTO instructor_presentation_events (event_id, presentation_id, sequence, operation, actor_id, request_hash, snapshot_json, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(eventId, id, nextVersion, event.operation, auth.userId, requestHash, JSON.stringify(snapshot), event.previousEventHash, event.eventHash, event.createdAt),
    ]);
  } catch { throw new EducationApiError("Instructor presentation changed; reload before saving.", 409); }
  await appendAudit(auth.userId, `education.presentation.${retire ? "retired" : "updated"}`, "instructor-presentation", id, "success", `version=${nextVersion}`);
  return { idempotent: false, presentation: presentationFromRow((await env.DB.prepare(`SELECT * FROM instructor_presentations WHERE id = ?`).bind(id).first<Row>())!) };
}

export async function listLearnerBookmarks(auth: AuthContext, caseId = "") {
  const roles = await requireLearner(auth);
  if (caseId) await ensureScope("case", caseId);
  if (caseId) await ensureScopeAccess(auth, roles, "case", caseId);
  const result = caseId
    ? await env.DB.prepare(`SELECT * FROM learner_bookmarks WHERE learner_id = ? AND case_id = ? AND active = 1 ORDER BY updated_at DESC, id`).bind(auth.userId, caseId).all<Row>()
    : await env.DB.prepare(`SELECT * FROM learner_bookmarks WHERE learner_id = ? AND active = 1 ORDER BY updated_at DESC, id`).bind(auth.userId).all<Row>();
  return { bookmarks: rows(result).map(bookmarkFromRow) };
}

export async function createLearnerBookmark(auth: AuthContext, payload: Record<string, unknown>) {
  const roles = await requireLearner(auth);
  exactKeys(payload, ["eventId", "expectedVersion", "bookmarkId", "caseId", "title", "scene"]);
  const eventId = canonicalEventId(payload.eventId); const version = expectedVersion(payload.expectedVersion);
  if (version !== 0) throw new EducationApiError("New learner bookmarks must start at version zero.", 409);
  const id = canonicalRecordId(payload.bookmarkId, "bookmarkId"); const caseId = safeText(payload.caseId, 100); await ensureScope("case", caseId); await ensureScopeAccess(auth, roles, "case", caseId);
  const parsedTitle = title(payload.title, "Bookmark title"); const scene = validateViewerScene(payload.scene);
  await validateSceneReferences("case", caseId, [scene]);
  const requestMaterial = { id, caseId, title: parsedTitle, scene, expectedVersion: version };
  const requestHash = await sha256(stableJson(requestMaterial)); const replayId = await eventReplay("learner_bookmark_events", eventId, requestHash);
  if (replayId) return { idempotent: true, bookmark: bookmarkFromRow((await env.DB.prepare(`SELECT * FROM learner_bookmarks WHERE id = ? AND learner_id = ?`).bind(replayId, auth.userId).first<Row>())!) };
  const count = await env.DB.prepare(`SELECT COUNT(*) AS count FROM learner_bookmarks WHERE learner_id = ? AND case_id = ? AND active = 1`).bind(auth.userId, caseId).first<{ count: number }>();
  if (Number(count?.count ?? 0) >= 30) throw new EducationApiError("A learner may save at most 30 bookmarks per case.", 409);
  const now = new Date().toISOString(); const snapshot = { id, learnerId: auth.userId, caseId, title: parsedTitle, version: 1, active: true, scene, createdAt: now, updatedAt: now };
  const event = await buildEvent({ eventId, recordId: id, sequence: 1, operation: "CREATED", actorId: auth.userId, requestHash, snapshot, previousEventHash: "GENESIS" });
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO learner_bookmarks (id, learner_id, case_id, title, version, active, scene_json, created_at, updated_at, head_event_hash) VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`).bind(id, auth.userId, caseId, parsedTitle, JSON.stringify(scene), now, now, event.eventHash),
      env.DB.prepare(`INSERT INTO learner_bookmark_events (event_id, bookmark_id, sequence, operation, actor_id, request_hash, snapshot_json, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(eventId, id, 1, event.operation, auth.userId, requestHash, JSON.stringify(snapshot), "GENESIS", event.eventHash, event.createdAt),
    ]);
  } catch { throw new EducationApiError("The learner bookmark changed; reload before saving.", 409); }
  await appendAudit(auth.userId, "education.bookmark.created", "learner-bookmark", id, "success", `case=${caseId};version=1`);
  return { idempotent: false, bookmark: bookmarkFromRow((await env.DB.prepare(`SELECT * FROM learner_bookmarks WHERE id = ?`).bind(id).first<Row>())!) };
}

export async function updateLearnerBookmark(auth: AuthContext, bookmarkId: string, payload: Record<string, unknown>, retire = false) {
  const roles = await requireLearner(auth);
  exactKeys(payload, retire ? ["eventId", "expectedVersion"] : ["eventId", "expectedVersion", "bookmarkId", "caseId", "title", "scene"]);
  const id = canonicalRecordId(bookmarkId, "bookmarkId"); const eventId = canonicalEventId(payload.eventId); const version = expectedVersion(payload.expectedVersion);
  const current = await env.DB.prepare(`SELECT * FROM learner_bookmarks WHERE id = ? AND learner_id = ? AND active = 1`).bind(id, auth.userId).first<Row>();
  if (!current) throw new EducationApiError("Learner bookmark not found.", 404);
  const caseId = retire ? String(current.case_id) : safeText(payload.caseId, 100); await ensureScope("case", caseId); await ensureScopeAccess(auth, roles, "case", caseId);
  if (!retire && canonicalRecordId(payload.bookmarkId, "bookmarkId") !== id) throw new EducationApiError("Path and payload bookmark identifiers differ.", 422);
  const parsedTitle = retire ? String(current.title) : title(payload.title, "Bookmark title");
  const scene = retire ? validateViewerScene(parseJson(current.scene_json, {})) : validateViewerScene(payload.scene);
  await validateSceneReferences("case", caseId, [scene]);
  const requestMaterial = { id, caseId, title: parsedTitle, scene, expectedVersion: version, retire };
  const requestHash = await sha256(stableJson(requestMaterial)); const replayId = await eventReplay("learner_bookmark_events", eventId, requestHash);
  if (replayId) return { idempotent: true, bookmark: bookmarkFromRow((await env.DB.prepare(`SELECT * FROM learner_bookmarks WHERE id = ? AND learner_id = ?`).bind(replayId, auth.userId).first<Row>())!) };
  if (Number(current.version) !== version) throw new EducationApiError("Learner bookmark changed; reload before saving.", 409);
  const nextVersion = version + 1; const now = new Date().toISOString(); const active = retire ? 0 : 1;
  const snapshot = { id, learnerId: auth.userId, caseId, title: parsedTitle, version: nextVersion, active: Boolean(active), scene, createdAt: String(current.created_at), updatedAt: now };
  const event = await buildEvent({ eventId, recordId: id, sequence: nextVersion, operation: retire ? "RETIRED" : "UPDATED", actorId: auth.userId, requestHash, snapshot, previousEventHash: String(current.head_event_hash) });
  try {
    await env.DB.batch([
      env.DB.prepare(`UPDATE learner_bookmarks SET case_id = ?, title = ?, version = ?, active = ?, scene_json = ?, updated_at = ?, head_event_hash = ? WHERE id = ? AND learner_id = ? AND version = ? AND active = 1`).bind(caseId, parsedTitle, nextVersion, active, JSON.stringify(scene), now, event.eventHash, id, auth.userId, version),
      env.DB.prepare(`INSERT INTO learner_bookmark_events (event_id, bookmark_id, sequence, operation, actor_id, request_hash, snapshot_json, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(eventId, id, nextVersion, event.operation, auth.userId, requestHash, JSON.stringify(snapshot), event.previousEventHash, event.eventHash, event.createdAt),
    ]);
  } catch { throw new EducationApiError("Learner bookmark changed; reload before saving.", 409); }
  await appendAudit(auth.userId, `education.bookmark.${retire ? "retired" : "updated"}`, "learner-bookmark", id, "success", `version=${nextVersion}`);
  return { idempotent: false, bookmark: bookmarkFromRow((await env.DB.prepare(`SELECT * FROM learner_bookmarks WHERE id = ?`).bind(id).first<Row>())!) };
}

export async function mapEducationLocalizer(auth: AuthContext, caseId: string, payload: Record<string, unknown>): Promise<LocalizerMap> {
  const roles = await requireAnyEducationRole(auth);
  await ensureScope("case", caseId);
  await ensureScopeAccess(auth, roles, "case", caseId);
  exactKeys(payload, ["sourceSeriesInstanceUid", "sourceSopInstanceUid", "sourceFrame", "sourceSliceIndex", "sourceFrameOfReferenceUid", "patientPoint", "x", "y", "targetSeriesInstanceUids"]);
  const teachingCase = await env.DB.prepare(`SELECT classification, status FROM cases WHERE id = ?`).bind(caseId).first<{ classification: string; status: string }>();
  if (!teachingCase || teachingCase.status !== "published") throw new EducationApiError("Published education case not found.", 404);
  if (teachingCase.classification === "pathology") throw new EducationApiError("Tri-planar localizer is unavailable for whole-slide pathology; use the WSI overview.", 422);
  const geometry = educationGeometryForCase(caseId);
  const requestedTargets = Array.isArray(payload.targetSeriesInstanceUids) ? payload.targetSeriesInstanceUids.filter((item): item is string => typeof item === "string").slice(0, 6) : geometry.map((series) => series.seriesInstanceUid);
  if (requestedTargets.some((uid) => !geometry.some((series) => series.seriesInstanceUid === uid))) throw new EducationApiError("A localizer target series is not part of this education case.", 422);
  const hasStoredPoint = Object.hasOwn(payload, "patientPoint");
  if (hasStoredPoint && (!Array.isArray(payload.patientPoint) || payload.patientPoint.length !== 3 || [...payload.patientPoint].some(value => typeof value !== "number" || !Number.isFinite(value)))) throw new EducationApiError("The stored patient coordinate is invalid.", 422);
  const storedPoint = hasStoredPoint ? payload.patientPoint as [number, number, number] : null;
  const sourceUid = safeText(payload.sourceSeriesInstanceUid, 64); const source = geometry.find((series) => series.seriesInstanceUid === sourceUid);
  const result = storedPoint
    ? resolveStoredPatientSpaceLocalizer({ sourceFrameOfReferenceUid: safeText(payload.sourceFrameOfReferenceUid, 64), patientPoint: storedPoint as PatientPoint, targetSeries: geometry.filter((series) => requestedTargets.includes(series.seriesInstanceUid)) })
    : (() => {
      if (!source) throw new EducationApiError("The localizer source series is not part of this education case.", 422);
      return resolvePatientSpaceLocalizer({ sourceSeries: source, sourceSopInstanceUid: payload.sourceSopInstanceUid as string | undefined, sourceFrame: payload.sourceFrame as number | undefined, sourceSliceIndex: payload.sourceSliceIndex as number | undefined, x: payload.x as number, y: payload.y as number, targetSeries: geometry.filter((series) => requestedTargets.includes(series.seriesInstanceUid)) });
    })();
  await appendAudit(auth.userId, "education.localizer.propagated", "case", caseId, "success", `frame-of-reference=${source?.frameOfReferenceUid ?? safeText(payload.sourceFrameOfReferenceUid, 64)};point=${result.patientPoint.map((item) => item.toFixed(2)).join(",")}`);
  return result;
}
