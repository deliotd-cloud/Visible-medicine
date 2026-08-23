import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";
import { safeText } from "@/lib/domain";
import {
  canFollowTeachingSessions,
  canManageTeachingSessions,
  validateTeachingViewerState,
  type TeachingSessionBundle,
  type TeachingSessionView,
  type TeachingViewerState,
} from "@/lib/teaching-sessions";
import { canAccessPublishedWorkbook } from "@/lib/workbook-access";

type Row = Record<string, string | number | null>;

function exactKeys(
  payload: Record<string, unknown>,
  allowed: readonly string[],
) {
  const unsupported = Object.keys(payload).find(
    (key) => !allowed.includes(key),
  );
  if (unsupported)
    throw new EducationApiError(`Unsupported field ${unsupported}.`, 422);
}

function optimisticVersion(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new EducationApiError(
      "expectedVersion must be a positive integer.",
      422,
    );
  return parsed;
}

function parseViewerState(value: unknown): TeachingViewerState {
  try {
    return validateTeachingViewerState(
      typeof value === "string" ? JSON.parse(value) : value,
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new EducationApiError(
        "The saved teaching viewer state is invalid.",
        500,
      );
    throw error;
  }
}

async function rolesFor(auth: AuthContext) {
  await ensureEducationUser(auth);
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(auth.userId)
    .first<{ roles: string }>();
  return user?.roles.split(",").filter(Boolean) ?? [];
}

async function requireManager(auth: AuthContext) {
  const roles = await rolesFor(auth);
  if (!canManageTeachingSessions(roles))
    throw new EducationApiError(
      "Only an instructor or administrator can control a live teaching session.",
      403,
    );
  return roles;
}

async function requireLearner(auth: AuthContext) {
  const roles = await rolesFor(auth);
  if (!canFollowTeachingSessions(roles))
    throw new EducationApiError(
      "A learner enrolment is required to follow a teaching session.",
      403,
    );
  return roles;
}

async function verifyTeachingWorkbookCase(workbookId: string, caseId: string) {
  const row = await env.DB.prepare(
    `SELECT w.id FROM workbooks w JOIN workbook_cases wc ON wc.workbook_id = w.id JOIN cases c ON c.id = wc.case_id WHERE w.id = ? AND w.mode = 'teaching' AND w.status = 'published' AND wc.case_id = ? AND c.status = 'published'`,
  )
    .bind(workbookId, caseId)
    .first<Row>();
  if (!row)
    throw new EducationApiError(
      "The live session requires a published teaching workbook and linked education case.",
      409,
    );
}

async function sessionRow(sessionId: string) {
  return env.DB.prepare(`SELECT * FROM teaching_sessions WHERE id = ?`)
    .bind(sessionId)
    .first<Row>();
}

async function latestLiveSession(workbookId?: string) {
  if (workbookId)
    return env.DB.prepare(
      `SELECT * FROM teaching_sessions WHERE workbook_id = ? AND state = 'live' ORDER BY updated_at DESC, rowid DESC LIMIT 1`,
    )
      .bind(workbookId)
      .first<Row>();
  return env.DB.prepare(
    `SELECT * FROM teaching_sessions WHERE state = 'live' ORDER BY updated_at DESC, rowid DESC LIMIT 1`,
  ).first<Row>();
}

async function sessionView(row: Row): Promise<TeachingSessionView> {
  const activeSince = new Date(Date.now() - 30_000).toISOString();
  const counts = await env.DB.prepare(
    `SELECT COUNT(*) AS participant_count, SUM(CASE WHEN follow_state = 'following' THEN 1 ELSE 0 END) AS following_count FROM teaching_session_participants WHERE session_id = ? AND last_seen_at >= ?`,
  )
    .bind(row.id, activeSince)
    .first<{ participant_count: number; following_count: number | null }>();
  return {
    id: String(row.id),
    workbookId: String(row.workbook_id),
    instructorId: String(row.instructor_id),
    state: String(row.state) as "live" | "ended",
    activeCaseId: String(row.active_case_id),
    viewerState: parseViewerState(row.viewer_state_json),
    activeSceneIndex:
      row.active_scene_index === null ? null : Number(row.active_scene_index),
    version: Number(row.version),
    startedAt: String(row.started_at),
    updatedAt: String(row.updated_at),
    endedAt: row.ended_at === null ? null : String(row.ended_at),
    participantCount: Number(counts?.participant_count ?? 0),
    followingCount: Number(counts?.following_count ?? 0),
  };
}

export async function getTeachingSessionBundle(
  auth: AuthContext,
  workbookId?: string,
): Promise<TeachingSessionBundle> {
  const roles = await rolesFor(auth);
  const safeWorkbookId = workbookId ? safeText(workbookId, 100) : undefined;
  if (
    safeWorkbookId &&
    !(await canAccessPublishedWorkbook(auth.userId, roles, safeWorkbookId))
  )
    throw new EducationApiError(
      "This teaching workbook is not allocated to your education account.",
      403,
    );
  const row = await latestLiveSession(safeWorkbookId);
  if (
    row &&
    !(await canAccessPublishedWorkbook(
      auth.userId,
      roles,
      String(row.workbook_id),
    ))
  )
    throw new EducationApiError(
      "This teaching workbook is not allocated to your education account.",
      403,
    );
  const participant =
    row && canFollowTeachingSessions(roles)
      ? await env.DB.prepare(
          `SELECT follow_state, current_case_id, last_seen_at FROM teaching_session_participants WHERE session_id = ? AND learner_id = ?`,
        )
          .bind(row.id, auth.userId)
          .first<Row>()
      : null;
  return {
    session: row ? await sessionView(row) : null,
    participant: participant
      ? {
          followState: String(participant.follow_state) as
            "following" | "exploring",
          currentCaseId: String(participant.current_case_id),
          lastSeenAt: String(participant.last_seen_at),
        }
      : null,
    permissions: {
      manage: canManageTeachingSessions(roles),
      follow: canFollowTeachingSessions(roles),
    },
    refreshedAt: new Date().toISOString(),
  };
}

export async function startTeachingSession(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  await requireManager(auth);
  exactKeys(payload, ["action", "workbookId", "caseId", "viewerState"]);
  const workbookId = safeText(payload.workbookId, 100);
  const caseId = safeText(payload.caseId, 100);
  await verifyTeachingWorkbookCase(workbookId, caseId);
  if (await latestLiveSession(workbookId))
    throw new EducationApiError(
      "A live teaching session is already running for this workbook.",
      409,
    );
  const viewerState = validateTeachingViewerState(payload.viewerState);
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO teaching_sessions (id, workbook_id, instructor_id, state, active_case_id, viewer_state_json, active_scene_index, version, started_at, updated_at, ended_at) VALUES (?, ?, ?, 'live', ?, ?, NULL, 1, ?, ?, NULL)`,
  )
    .bind(
      sessionId,
      workbookId,
      auth.userId,
      caseId,
      JSON.stringify(viewerState),
      now,
      now,
    )
    .run();
  await appendAudit(
    auth.userId,
    "teaching-session.started",
    "teaching-session",
    sessionId,
    "success",
    `workbook=${workbookId};case=${caseId}`,
  );
  return getTeachingSessionBundle(auth, workbookId);
}

export async function updateTeachingSession(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  const roles = await requireManager(auth);
  exactKeys(payload, [
    "action",
    "workbookId",
    "sessionId",
    "caseId",
    "viewerState",
    "activeSceneIndex",
    "expectedVersion",
  ]);
  const sessionId = safeText(payload.sessionId, 100);
  const expectedVersion = optimisticVersion(payload.expectedVersion);
  const row = await sessionRow(sessionId);
  if (!row || row.state !== "live")
    throw new EducationApiError("Live teaching session not found.", 404);
  if (
    !roles.includes("administrator") &&
    String(row.instructor_id) !== auth.userId
  )
    throw new EducationApiError(
      "Only the session owner or an administrator can move this teaching session.",
      403,
    );
  if (String(row.workbook_id) !== safeText(payload.workbookId, 100))
    throw new EducationApiError(
      "The session is not linked to this workbook.",
      409,
    );
  if (Number(row.version) !== expectedVersion)
    throw new EducationApiError(
      "The live teaching session changed; refresh before updating it.",
      409,
    );
  const caseId = safeText(payload.caseId, 100);
  await verifyTeachingWorkbookCase(String(row.workbook_id), caseId);
  const viewerState = validateTeachingViewerState(payload.viewerState);
  const activeSceneIndex =
    payload.activeSceneIndex === null
      ? null
      : Math.max(0, Math.min(23, Number(payload.activeSceneIndex)));
  if (
    activeSceneIndex !== null &&
    (!Number.isInteger(activeSceneIndex) || !Number.isFinite(activeSceneIndex))
  )
    throw new EducationApiError("activeSceneIndex is invalid.", 422);
  const nextVersion = expectedVersion + 1;
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE teaching_sessions SET active_case_id = ?, viewer_state_json = ?, active_scene_index = ?, version = ?, updated_at = ? WHERE id = ? AND version = ? AND state = 'live'`,
  )
    .bind(
      caseId,
      JSON.stringify(viewerState),
      activeSceneIndex,
      nextVersion,
      now,
      sessionId,
      expectedVersion,
    )
    .run();
  if (!result.meta.changes)
    throw new EducationApiError(
      "The live teaching session changed; refresh before updating it.",
      409,
    );
  await appendAudit(
    auth.userId,
    "teaching-session.viewer-updated",
    "teaching-session",
    sessionId,
    "success",
    `version=${nextVersion};case=${caseId}`,
  );
  return getTeachingSessionBundle(auth, String(row.workbook_id));
}

export async function endTeachingSession(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  const roles = await requireManager(auth);
  exactKeys(payload, ["action", "workbookId", "sessionId", "expectedVersion"]);
  const sessionId = safeText(payload.sessionId, 100);
  const expectedVersion = optimisticVersion(payload.expectedVersion);
  const row = await sessionRow(sessionId);
  if (!row || row.state !== "live")
    throw new EducationApiError("Live teaching session not found.", 404);
  if (
    !roles.includes("administrator") &&
    String(row.instructor_id) !== auth.userId
  )
    throw new EducationApiError(
      "Only the session owner or an administrator can end this teaching session.",
      403,
    );
  const endedAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE teaching_sessions SET state = 'ended', version = ?, updated_at = ?, ended_at = ? WHERE id = ? AND version = ? AND state = 'live'`,
  )
    .bind(expectedVersion + 1, endedAt, endedAt, sessionId, expectedVersion)
    .run();
  if (!result.meta.changes)
    throw new EducationApiError(
      "The live teaching session changed; refresh before ending it.",
      409,
    );
  await appendAudit(
    auth.userId,
    "teaching-session.ended",
    "teaching-session",
    sessionId,
    "success",
    `version=${expectedVersion + 1}`,
  );
  return getTeachingSessionBundle(auth, safeText(payload.workbookId, 100));
}

export async function heartbeatTeachingSession(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  const roles = await requireLearner(auth);
  exactKeys(payload, [
    "action",
    "workbookId",
    "sessionId",
    "followState",
    "currentCaseId",
  ]);
  const sessionId = safeText(payload.sessionId, 100);
  const followState =
    payload.followState === "following" || payload.followState === "exploring"
      ? payload.followState
      : null;
  if (!followState)
    throw new EducationApiError(
      "followState must be following or exploring.",
      422,
    );
  const row = await sessionRow(sessionId);
  if (!row || row.state !== "live")
    throw new EducationApiError("Live teaching session not found.", 404);
  if (String(row.workbook_id) !== safeText(payload.workbookId, 100))
    throw new EducationApiError(
      "The session is not linked to this workbook.",
      409,
    );
  if (
    !(await canAccessPublishedWorkbook(
      auth.userId,
      roles,
      String(row.workbook_id),
    ))
  )
    throw new EducationApiError(
      "This teaching workbook is not allocated to your education account.",
      403,
    );
  const currentCaseId = safeText(payload.currentCaseId, 100);
  await verifyTeachingWorkbookCase(String(row.workbook_id), currentCaseId);
  const current = await env.DB.prepare(
    `SELECT follow_state FROM teaching_session_participants WHERE session_id = ? AND learner_id = ?`,
  )
    .bind(sessionId, auth.userId)
    .first<{ follow_state: string }>();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO teaching_session_participants (session_id, learner_id, follow_state, current_case_id, joined_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(session_id, learner_id) DO UPDATE SET follow_state = excluded.follow_state, current_case_id = excluded.current_case_id, last_seen_at = excluded.last_seen_at`,
  )
    .bind(sessionId, auth.userId, followState, currentCaseId, now, now)
    .run();
  if (!current || current.follow_state !== followState)
    await appendAudit(
      auth.userId,
      `teaching-session.${followState}`,
      "teaching-session",
      sessionId,
      "success",
      `case=${currentCaseId}`,
    );
  return getTeachingSessionBundle(auth, String(row.workbook_id));
}
