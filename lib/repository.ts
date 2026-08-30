import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { ensurePlatformSchema, getPlatformSnapshot } from "@/db/platform";
import { canTransitionAttempt, classifyTeachingContent, outcomeFor, safeText, sha256, type ContentSignal } from "@/lib/domain";
import { educationGeometryForCase, educationWsiIdentifiersForCase, type ImagePlane } from "@/lib/education-viewer-adapter";
import { validatePollDraft } from "@/lib/teaching-polls";
import { validateTeachingContentBlock, type TeachingContentBlockView } from "@/lib/teaching-content";
import { canAccessPublishedWorkbook } from "@/lib/workbook-access";
import { validateAssignmentWindow } from "@/lib/assignment-policy";
import { decideAttemptWrite } from "@/lib/attempt-policy";
import { educationSnapshotPermissions } from "@/lib/education-role-projections";
import { decideWorkbookAuthoringAccess } from "@/lib/workbook-authoring-policy";
import { groupEducationCaseQuestions } from "@/lib/education-case-grouping";
import {
  AssessmentVersionIntegrityError,
  buildAssessmentManifestFromDatabase,
  EDUCATION_VIEWER_CORE_VERSION,
  getVerifiedAssessmentManifest,
  manifestQuestions,
  type VerifiedAssessmentVersion,
} from "@/lib/assessment-manifest-store";
import type { AssessmentManifest } from "@/lib/assessment-manifest";
import {
  ASSESSMENT_RECOVERY_EXCLUSIONS,
  ASSESSMENT_RECOVERY_TARGET_SCHEMA,
  assessmentRecoveryDraftTitle,
} from "@/lib/assessment-recovery";

export class DomainError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

type Row = Record<string, string | number | null>;

function rows<T extends Row>(result: D1Result<T>): T[] { return result.results ?? []; }
function parseJson<T>(value: unknown, fallback: T): T { try { return typeof value === "string" ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function exactActionFields(payload: Record<string, unknown>, allowed: readonly string[]) {
  const unexpected = Object.keys(payload).find((key) => !allowed.includes(key));
  if (unexpected) throw new DomainError(`Unsupported field ${unexpected}.`, 422);
}

function optionalIso(value: unknown, label: string) {
  const input = safeText(value, 50).trim();
  if (!input) return null;
  if (Number.isNaN(Date.parse(input))) throw new DomainError(`${label} is invalid.`, 422);
  return new Date(input).toISOString();
}

function viewerManifestFor(caseId: string, classification: string): EducationCase["viewerManifest"] {
  const wsi = educationWsiIdentifiersForCase(caseId);
  const wsiSeries: EducationCase["viewerManifest"]["series"][number] = { ...wsi, plane: "slide", frameCount: 1, sopInstanceUids: [wsi.sopInstanceUid] };
  if (classification === "pathology") return { kind: "wsi", overview: true, series: [wsiSeries] };
  const dicom = educationGeometryForCase(caseId).map((series) => ({ studyInstanceUid: series.studyInstanceUid, seriesInstanceUid: series.seriesInstanceUid, frameOfReferenceUid: series.frameOfReferenceUid, plane: series.plane as ImagePlane | "slide", frameCount: series.frames.length, sopInstanceUids: series.frames.map((frame) => frame.sopInstanceUid) }));
  return { kind: classification === "mixed" ? "mixed" : "dicom", overview: classification === "mixed", series: classification === "mixed" ? [...dicom, wsiSeries] : dicom };
}

export type EducationCase = {
  id: string; title: string; classification: string; status: string; version: number; description: string; visualKind: string; tools: string[]; publicationHash: string; position: number; questionId: string; prompt: string; maxMarks: number;
  questions: Array<{ id: string; prompt: string; maxMarks: number; responseType?: "long-text" | "single-choice" | "multiple-choice"; options?: Array<{ id: string; label: string; order: number }>; version?: number; position?: number }>;
  viewerManifest: { kind: "dicom" | "wsi" | "mixed"; overview: boolean; series: Array<{ studyInstanceUid: string; seriesInstanceUid: string; frameOfReferenceUid: string; plane: ImagePlane | "slide"; frameCount: number; sopInstanceUids: string[] }> };
};

function groupEducationCaseRows(caseRows: Row[]): EducationCase[] {
  const firstRowByCase = new Map<string, Row>();
  for (const item of caseRows)
    if (!firstRowByCase.has(String(item.id)))
      firstRowByCase.set(String(item.id), item);
  return groupEducationCaseQuestions(
    caseRows.map((item) => ({
      caseId: String(item.id),
      questionId: String(item.question_id),
      prompt: String(item.prompt),
      maxMarks: Number(item.max_marks),
    })),
  ).map((group) => {
    const item = firstRowByCase.get(group.caseId)!;
    const firstQuestion = group.questions[0];
    return {
      id: group.caseId,
      title: String(item.title),
      classification: String(item.classification),
      status: String(item.status),
      version: Number(item.version),
      description: String(item.description),
      visualKind: String(item.visual_kind),
      tools: parseJson<string[]>(item.tools_json, []),
      publicationHash: String(item.publication_hash),
      position: Number(item.position),
      questionId: firstQuestion.id,
      prompt: firstQuestion.prompt,
      maxMarks: group.maxMarks,
      questions: group.questions,
      viewerManifest: viewerManifestFor(group.caseId, String(item.classification)),
    };
  });
}

function educationCasesFromManifest(manifest: AssessmentManifest): EducationCase[] {
  return manifest.cases.map((assessmentCase) => {
    const questions = assessmentCase.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      maxMarks: question.maxMarks,
      responseType: question.responseType,
      options: question.options,
      version: question.version,
      position: question.order,
    }));
    const firstQuestion = questions[0];
    return {
      id: assessmentCase.id,
      title: assessmentCase.title,
      classification: assessmentCase.classification,
      status: "published",
      version: assessmentCase.version,
      description: assessmentCase.description,
      visualKind: assessmentCase.visualKind,
      tools: assessmentCase.tools,
      publicationHash: assessmentCase.publicationHash,
      position: assessmentCase.order,
      questionId: firstQuestion?.id ?? "",
      prompt: firstQuestion?.prompt ?? "",
      maxMarks: questions.reduce((total, question) => total + question.maxMarks, 0),
      questions,
      viewerManifest: {
        kind: assessmentCase.media.kind,
        overview: assessmentCase.media.overview,
        series: assessmentCase.media.series.map((series) => ({
          studyInstanceUid: series.studyInstanceUid,
          seriesInstanceUid: series.seriesInstanceUid,
          frameOfReferenceUid: series.frameOfReferenceUid,
          plane: series.plane,
          frameCount: series.frameCount,
          sopInstanceUids: series.sopInstanceUids,
        })),
      },
    };
  });
}

export type AppSnapshot = {
  serverTime: string;
  assessmentPreflight: { required: boolean; caseCount: number; mediaReady: boolean };
  currentUser: { id: string; email: string; displayName: string; roles: string[]; previewAvailable: boolean };
  course: { id: string; code: string; title: string; description: string; moduleTitle: string; workbookId: string; workbookTitle: string; workbookMode: string; workbookVersion: number; durationMinutes: number; dualDisplayAllowed: boolean; assessmentVersion: string; assessmentHash: string; viewerCoreVersion: string };
  workbooks: Array<{ id: string; title: string; mode: string; version: number; status: string; durationMinutes: number; dualDisplayAllowed: boolean; caseIds: string[]; integrityHash: string | null; publishedAt: string | null; authorId: string | null; latestReviewDecision: string | null; latestReviewComment: string | null; latestReviewerName: string | null }>;
  draftWorkbookDetails: Array<{ workbookId: string; teachingBlocks: TeachingContentBlockView[]; polls: Array<{ id: string; caseId: string; prompt: string; selectionMode: "single" | "multiple"; options: Array<{ id: string; label: string }>; correctOptionIds: string[]; explanation: string; position: number; version: number }>; questionEdits: Array<{ questionId: string; prompt: string; revision: number }> }>;
  recoveryComparisons: Array<{ draftWorkbookId: string; sourceWorkbookId: string; sourceAssessmentVersionId: string; sourceIntegrityHash: string; copiedCaseIds: string[]; excludedEvidence: string[]; historyReconstructed: boolean; createdAt: string }>;
  accessibleWorkbooks: Array<{ id: string; title: string; mode: string; version: number; durationMinutes: number; dualDisplayAllowed: boolean; availableFrom: string | null; dueAt: string | null; expiresAt: string | null; accessSource: string; available: boolean; unavailableReason: string | null }>;
  learners: Array<{ id: string; displayName: string; email: string }>;
  workbookAssignments: Array<{ id: string; workbookId: string; learnerId: string; status: string; assignedAt: string; availableFrom: string | null; dueAt: string | null; expiresAt: string | null; prerequisiteWorkbookId: string | null; prerequisiteMinPercent: number; version: number }>;
  cohorts: Array<{ id: string; title: string; code: string; status: string; version: number; memberCount: number }>;
  cohortMembers: Array<{ cohortId: string; learnerId: string; status: string; version: number }>;
  cohortAssignments: Array<{ id: string; cohortId: string; workbookId: string; status: string; assignedAt: string; availableFrom: string | null; dueAt: string | null; expiresAt: string | null; prerequisiteWorkbookId: string | null; prerequisiteMinPercent: number; version: number }>;
  accommodations: Array<{ id: string; workbookId: string; learnerId: string; extraTimeMinutes: number; restBreakMinutes: number; reason: string; status: string; requestedBy: string; approvedBy: string | null; requestedAt: string; approvedAt: string | null; version: number }>;
  workbookReviews: Array<{ id: string; workbookId: string; reviewerId: string; reviewerName: string; decision: string; comment: string; revision: number; createdAt: string }>;
  progressDashboard: Array<{ workbookId: string; workbookTitle: string; learnerId: string; learnerName: string; status: string; casesVisited: number; casesTotal: number; percentComplete: number; lastActivityAt: string | null; completedAt: string | null }>;
  itemAnalysis: Array<{ questionId: string; prompt: string; attempts: number; meanScore: number; maxScore: number; facilityPercent: number }>;
  rubricPerformance: Array<{ criterionLabel: string; attempts: number; meanScore: number; maxScore: number; performancePercent: number }>;
  cases: EducationCase[];
  teachingNotes: Array<{ id: string; caseId: string; title: string; body: string; keyPoints: string[]; revealText: string; position: number }>;
  teachingContentBlocks: TeachingContentBlockView[];
  attempt: { id: string; state: string; startedAt: string; deadlineAt: string; preflightPassedAt: string | null; submittedAt: string | null; receiptHash: string | null; accommodationMinutes: number };
  answers: Array<{ questionId: string; response: string; revision: number; updatedAt: string }>;
  annotations: Array<{ id: string; caseId: string; kind: string; label: string; geometry: Record<string, number>; createdAt: string }>;
  keyImages: Array<{ id: string; caseId: string; frameIndex: number; viewport: Record<string, number | string>; viewerCoreVersion: string; createdAt: string }>;
  caseFlags: Array<{ caseId: string; flagged: boolean; revision: number; updatedAt: string }>;
  ingestionJobs: Array<{ id: string; title: string; declaredType: string; detectedType: string; status: string; deidentified: boolean; publicationCleared: boolean; reasonCodes: string[]; contentHash: string; createdAt: string; reviewedAt: string | null }>;
  markingQueue: Array<{ attemptId: string; candidateName: string; candidateEmail: string; state: string; submittedAt: string; evidenceHash: string; answers: Array<{ questionId: string; prompt: string; response: string; maxMarks: number; rubricCriteria: Array<{ label: string; marks: number }>; questionScore: number | null; criterionScores: Array<{ label: string; score: number; maxScore: number }> }>; latestScore: number | null; maxScore: number | null; feedback: string | null; markRevision: number | null; moderatedScore: number | null; moderationReason: string | null; resultOutcome: string | null; releasedAt: string | null }>;
  auditEvents: Array<{ sequence: number; actorId: string; action: string; targetType: string; targetId: string; outcome: string; reason: string; occurredAt: string; integrityHash: string }>;
  result: { score: number; maxScore: number; outcome: string; releasedAt: string } | null;
};

async function rolesFor(userId: string): Promise<string[]> {
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`).bind(userId).first<{ roles: string }>();
  return user?.roles.split(",").filter(Boolean) ?? [];
}

async function accessibleWorkbookRows(userId: string, staff: boolean) {
  if (staff)
    return rows(await env.DB.prepare(`SELECT w.id, w.title, w.mode, w.version, w.status, w.duration_minutes, w.dual_display_allowed, av.id AS assessment_version_id, av.integrity_hash, av.published_at, NULL AS available_from, NULL AS due_at, NULL AS expires_at, 'staff' AS access_source, 1 AS allocation_ready, NULL AS prerequisite_workbook_id, NULL AS prerequisite_title, NULL AS prerequisite_min_percent, NULL AS prerequisite_progress FROM workbooks w JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version WHERE w.status = 'published' ORDER BY CASE w.mode WHEN 'teaching' THEN 0 ELSE 1 END, w.title`).all<Row>());
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `WITH allocations AS (
       SELECT a.workbook_id, a.learner_id, r.available_from, a.due_at, r.expires_at,
              r.prerequisite_workbook_id, COALESCE(r.prerequisite_min_percent, 100) AS prerequisite_min_percent,
              'individual' AS access_source
         FROM workbook_assignments a
         LEFT JOIN workbook_assignment_rules r ON r.assignment_id = a.id
        WHERE a.learner_id = ? AND a.status = 'active'
       UNION ALL
       SELECT ca.workbook_id, cm.learner_id, ca.available_from, ca.due_at, ca.expires_at,
              ca.prerequisite_workbook_id, ca.prerequisite_min_percent, 'cohort' AS access_source
         FROM cohort_workbook_assignments ca
         JOIN cohort_members cm ON cm.cohort_id = ca.cohort_id AND cm.status = 'active'
         JOIN cohorts c ON c.id = ca.cohort_id AND c.status = 'active'
        WHERE cm.learner_id = ? AND ca.status = 'active'
     )
     SELECT w.id, w.title, w.mode, w.version, w.status, w.duration_minutes, w.dual_display_allowed,
            av.id AS assessment_version_id, av.integrity_hash, av.published_at,
            CASE WHEN SUM(a.available_from IS NULL) > 0 THEN NULL ELSE MIN(a.available_from) END AS available_from,
            MIN(a.due_at) AS due_at,
            CASE WHEN SUM(a.expires_at IS NULL) > 0 THEN NULL ELSE MAX(a.expires_at) END AS expires_at,
            GROUP_CONCAT(DISTINCT a.access_source) AS access_source,
            MAX(a.prerequisite_workbook_id) AS prerequisite_workbook_id,
            MAX(pw.title) AS prerequisite_title,
            MAX(a.prerequisite_min_percent) AS prerequisite_min_percent,
            MAX(COALESCE(p.percent_complete, 0)) AS prerequisite_progress,
            MAX(CASE WHEN
              (a.available_from IS NULL OR a.available_from <= ?)
              AND (a.expires_at IS NULL OR a.expires_at > ?)
              AND (a.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= a.prerequisite_min_percent)
              THEN 1 ELSE 0 END) AS allocation_ready
       FROM allocations a
       JOIN workbooks w ON w.id = a.workbook_id
       JOIN modules m ON m.id = w.module_id
       JOIN enrolments e ON e.course_id = m.course_id AND e.user_id = a.learner_id
       JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version
       LEFT JOIN workbook_progress p ON p.workbook_id = a.prerequisite_workbook_id AND p.learner_id = a.learner_id
       LEFT JOIN workbooks pw ON pw.id = a.prerequisite_workbook_id
      WHERE w.status = 'published' AND e.status = 'active'
      GROUP BY w.id
      ORDER BY CASE w.mode WHEN 'teaching' THEN 0 ELSE 1 END, w.title`,
  ).bind(userId, userId, now, now).all<Row>();
  return rows(result);
}

async function approvedAccommodation(userId: string, workbookId: string) {
  const row = await env.DB.prepare(`SELECT extra_time_minutes, rest_break_minutes FROM learner_accommodations WHERE learner_id = ? AND workbook_id = ? AND status = 'approved'`).bind(userId, workbookId).first<{ extra_time_minutes: number; rest_break_minutes: number }>();
  return { extraTimeMinutes: Math.max(0, Number(row?.extra_time_minutes ?? 0)), restBreakMinutes: Math.max(0, Number(row?.rest_break_minutes ?? 0)) };
}

export async function getAppSnapshot(auth: AuthContext, requestedWorkbookId?: string): Promise<AppSnapshot> {
  await ensureEducationUser(auth);
  const roles = await rolesFor(auth.userId);
  const projection = educationSnapshotPermissions(roles);
  const staff = projection.staffWorkspace;
  const allocatedRows = await accessibleWorkbookRows(auth.userId, staff);
  const accessibleRows: Row[] = await Promise.all(allocatedRows.map(async (item): Promise<Row> => {
    if (Number(item.allocation_ready) !== 1) {
      const now = Date.now();
      const availableAt = item.available_from === null ? null : Date.parse(String(item.available_from));
      const expiresAt = item.expires_at === null ? null : Date.parse(String(item.expires_at));
      const reason = availableAt !== null && availableAt > now
        ? `Available ${new Date(availableAt).toLocaleString("en-GB")}`
        : expiresAt !== null && expiresAt <= now
          ? `Access expired ${new Date(expiresAt).toLocaleString("en-GB")}`
          : item.prerequisite_workbook_id
            ? `Complete ${String(item.prerequisite_title ?? "the prerequisite workbook")} to ${Number(item.prerequisite_min_percent ?? 100)}% (currently ${Number(item.prerequisite_progress ?? 0)}%)`
            : "This allocation is not currently available";
      return { ...item, available: 0, unavailable_reason: reason };
    }
    if (String(item.mode) !== "assessment")
      return { ...item, available: 1, unavailable_reason: null };
    try {
      await getVerifiedAssessmentManifest(String(item.assessment_version_id));
      return { ...item, available: 1, unavailable_reason: null };
    } catch {
      return {
        ...item,
        available: 0,
        unavailable_reason: "Immutable assessment content is unavailable",
      };
    }
  }));
  if (!accessibleRows.some((item) => Number(item.available) === 1))
    throw new DomainError("No available published workbook is allocated to this education account.", 403);
  const requested = safeText(requestedWorkbookId, 100);
  const selectedWorkbook = requested
    ? accessibleRows.find((item) => String(item.id) === requested)
    : accessibleRows.find((item) => Number(item.available) === 1);
  if (!selectedWorkbook) throw new DomainError("This workbook is not allocated to your education account.", 403);
  if (Number(selectedWorkbook.available) !== 1)
    throw new DomainError(
      "This assessment is unavailable because its immutable content could not be verified.",
      503,
    );
  const workbookId = String(selectedWorkbook.id);

  const course = await env.DB.prepare(`SELECT c.id, c.code, c.title, c.description, m.title AS module_title, w.id AS workbook_id, w.title AS workbook_title, w.mode AS workbook_mode, w.version AS workbook_version, w.duration_minutes, av.dual_display_allowed, av.id AS assessment_version, av.integrity_hash AS assessment_hash, av.viewer_core_version FROM courses c JOIN modules m ON m.course_id = c.id JOIN workbooks w ON w.module_id = m.id JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version WHERE c.id = ? AND w.id = ? AND w.status = 'published'`).bind("course-advanced-imaging", workbookId).first<Row>();
  if (!course) throw new DomainError("The published education course is unavailable.", 503);
  let verifiedAssessment: VerifiedAssessmentVersion | null = null;
  if (String(course.workbook_mode) === "assessment") {
    try {
      verifiedAssessment = await getVerifiedAssessmentManifest(
        String(course.assessment_version),
      );
    } catch {
      throw new DomainError(
        "This assessment version failed its immutable content integrity check.",
        503,
      );
    }
  }

  if (projection.assessmentScripts)
    await finalizeDueAttemptsForSnapshot();
  else if (String(course.workbook_mode) === "assessment")
    await finalizeDueAttemptsForSnapshot(auth.userId);

  const existing = await env.DB.prepare(`SELECT id FROM attempts WHERE user_id = ? AND assessment_version_id = ? ORDER BY started_at DESC LIMIT 1`).bind(auth.userId, course.assessment_version).first<{ id: string }>();
  const attemptId = existing?.id ?? `attempt:${auth.userId}:${String(course.assessment_version)}`;
  if (!existing && String(course.workbook_mode) !== "assessment") {
    const startedAt = new Date().toISOString();
    const durationMinutes = 365 * 24 * 60;
    const appliedExtraTime = 0;
    const deadlineAt = new Date(Date.now() + (durationMinutes + appliedExtraTime) * 60_000).toISOString();
    await env.DB.prepare(`INSERT OR IGNORE INTO attempts (id, user_id, assessment_version_id, state, started_at, deadline_at, preflight_passed_at, accommodation_minutes) VALUES (?, ?, ?, 'in-progress', ?, ?, NULL, ?)`).bind(attemptId, auth.userId, course.assessment_version, startedAt, deadlineAt, appliedExtraTime).run();
  }

  const caseResult = verifiedAssessment
    ? ({ results: [] } as unknown as D1Result<Row>)
    : await env.DB.prepare(`SELECT c.id, c.title, c.classification, c.status, c.version, c.description, c.visual_kind, c.tools_json, c.publication_hash, wc.position, q.id AS question_id, q.prompt, q.max_marks FROM workbook_cases wc JOIN cases c ON c.id = wc.case_id JOIN questions q ON q.case_id = c.id WHERE wc.workbook_id = ? AND c.status = 'published' ORDER BY wc.position, q.id`).bind(workbookId).all<Row>();
  const storedAttempt = await env.DB.prepare(`SELECT id, state, started_at, deadline_at, preflight_passed_at, submitted_at, receipt_hash, accommodation_minutes FROM attempts WHERE id = ? AND user_id = ?`).bind(attemptId, auth.userId).first<Row>();
  const attempt: Row = storedAttempt ?? {
    id: attemptId,
    state: "assigned",
    started_at: "",
    deadline_at: "",
    preflight_passed_at: null,
    submitted_at: null,
    receipt_hash: null,
    accommodation_minutes: 0,
  };

  const empty = Promise.resolve({ results: [] } as unknown as D1Result<Row>);
  const workbookPromise = staff
    ? env.DB.prepare(`SELECT w.id, w.title, w.mode, w.version, w.status, w.duration_minutes, w.dual_display_allowed, GROUP_CONCAT(wc.case_id) AS case_ids, av.integrity_hash, av.published_at, wa.author_id, (SELECT wr.decision FROM workbook_reviews wr WHERE wr.workbook_id = w.id ORDER BY wr.revision DESC LIMIT 1) AS latest_review_decision, (SELECT wr.comment FROM workbook_reviews wr WHERE wr.workbook_id = w.id ORDER BY wr.revision DESC LIMIT 1) AS latest_review_comment, (SELECT u.display_name FROM workbook_reviews wr JOIN users u ON u.id = wr.reviewer_id WHERE wr.workbook_id = w.id ORDER BY wr.revision DESC LIMIT 1) AS latest_reviewer_name FROM workbooks w LEFT JOIN workbook_cases wc ON wc.workbook_id = w.id LEFT JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version LEFT JOIN workbook_authorship wa ON wa.workbook_id = w.id WHERE w.status = 'published' GROUP BY w.id ORDER BY w.rowid DESC`).all<Row>()
    : env.DB.prepare(`SELECT w.id, w.title, w.mode, w.version, w.status, w.duration_minutes, w.dual_display_allowed, GROUP_CONCAT(wc.case_id) AS case_ids, av.integrity_hash, av.published_at, NULL AS author_id, NULL AS latest_review_decision, NULL AS latest_review_comment, NULL AS latest_reviewer_name FROM workbooks w LEFT JOIN workbook_cases wc ON wc.workbook_id = w.id LEFT JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version WHERE w.status = 'published' GROUP BY w.id ORDER BY w.title`).all<Row>();
  const [workbookResult, noteResult, contentResult, answerResult, annotationResult, keyImageResult, flagResult, ingestionResult, auditResult, learnerResult, assignmentResult, cohortResult, cohortMemberResult, cohortAssignmentResult, accommodationResult, reviewResult, progressResult, itemAnalysisResult, rubricPerformanceResult, resultRow] = await Promise.all([
    workbookPromise,
    env.DB.prepare(`SELECT id, case_id, title, body, key_points_json, reveal_text, position FROM teaching_notes WHERE ? = 'teaching' ORDER BY case_id, position`).bind(course.workbook_mode).all<Row>(),
    env.DB.prepare(`SELECT id, workbook_id, case_id, type, title, body, url, position, version FROM teaching_content_blocks WHERE workbook_id = ? AND status = 'published' AND ? = 'teaching' ORDER BY case_id, position, id`).bind(workbookId, course.workbook_mode).all<Row>(),
    env.DB.prepare(`SELECT question_id, response, revision, updated_at FROM answers WHERE attempt_id = ?`).bind(attemptId).all<Row>(),
    env.DB.prepare(`SELECT id, case_id, kind, label, geometry_json, created_at FROM annotations WHERE attempt_id = ? ORDER BY created_at`).bind(attemptId).all<Row>(),
    env.DB.prepare(`SELECT id, case_id, frame_index, viewport_json, viewer_core_version, created_at FROM key_images WHERE attempt_id = ? ORDER BY created_at`).bind(attemptId).all<Row>(),
    env.DB.prepare(`SELECT case_id, flagged, revision, updated_at FROM attempt_case_flags WHERE attempt_id = ? ORDER BY case_id`).bind(attemptId).all<Row>(),
    projection.contentSafety ? env.DB.prepare(`SELECT id, title, declared_type, detected_type, status, deidentified, publication_cleared, reason_codes_json, content_hash, created_at, reviewed_at FROM ingestion_jobs ORDER BY created_at DESC LIMIT 30`).all<Row>() : empty,
    projection.auditTrail ? env.DB.prepare(`SELECT sequence, actor_id, action, target_type, target_id, outcome, reason, occurred_at, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 80`).all<Row>() : empty,
    projection.learnerAdministration ? env.DB.prepare(`SELECT DISTINCT u.id, u.display_name, u.email FROM users u JOIN enrolments e ON e.user_id = u.id WHERE e.course_id = ? AND e.status = 'active' AND (',' || u.roles || ',') LIKE '%,learner,%' ORDER BY u.display_name, u.id`).bind("course-advanced-imaging").all<Row>() : empty,
    projection.learnerAdministration ? env.DB.prepare(`SELECT a.id, a.workbook_id, a.learner_id, a.status, a.assigned_at, r.available_from, a.due_at, r.expires_at, r.prerequisite_workbook_id, COALESCE(r.prerequisite_min_percent, 100) AS prerequisite_min_percent, a.version FROM workbook_assignments a LEFT JOIN workbook_assignment_rules r ON r.assignment_id = a.id WHERE a.status = 'active' ORDER BY a.assigned_at DESC, a.id`).all<Row>() : empty,
    projection.learnerAdministration ? env.DB.prepare(`SELECT c.id, c.title, c.code, c.status, c.version, COUNT(CASE WHEN cm.status = 'active' THEN 1 END) AS member_count FROM cohorts c LEFT JOIN cohort_members cm ON cm.cohort_id = c.id WHERE c.course_id = ? AND c.status = 'active' GROUP BY c.id ORDER BY c.title`).bind("course-advanced-imaging").all<Row>() : empty,
    projection.learnerAdministration ? env.DB.prepare(`SELECT cohort_id, learner_id, status, version FROM cohort_members WHERE status = 'active' ORDER BY cohort_id, learner_id`).all<Row>() : empty,
    projection.learnerAdministration ? env.DB.prepare(`SELECT id, cohort_id, workbook_id, status, assigned_at, available_from, due_at, expires_at, prerequisite_workbook_id, prerequisite_min_percent, version FROM cohort_workbook_assignments WHERE status = 'active' ORDER BY assigned_at DESC`).all<Row>() : empty,
    projection.accommodations ? env.DB.prepare(`SELECT id, workbook_id, learner_id, extra_time_minutes, rest_break_minutes, reason, status, requested_by, approved_by, requested_at, approved_at, version FROM learner_accommodations WHERE status IN ('pending','approved') ORDER BY requested_at DESC`).all<Row>() : env.DB.prepare(`SELECT id, workbook_id, learner_id, extra_time_minutes, rest_break_minutes, reason, status, requested_by, approved_by, requested_at, approved_at, version FROM learner_accommodations WHERE learner_id = ? AND status = 'approved' ORDER BY requested_at DESC`).bind(auth.userId).all<Row>(),
    staff ? env.DB.prepare(`SELECT wr.id, wr.workbook_id, wr.reviewer_id, u.display_name AS reviewer_name, wr.decision, wr.comment, wr.revision, wr.created_at FROM workbook_reviews wr JOIN users u ON u.id = wr.reviewer_id ORDER BY wr.created_at DESC LIMIT 80`).all<Row>() : empty,
    projection.analytics ? env.DB.prepare(`SELECT wp.workbook_id, w.title AS workbook_title, wp.learner_id, u.display_name AS learner_name, wp.status, wp.cases_visited, wp.cases_total, wp.percent_complete, wp.last_activity_at, wp.completed_at FROM workbook_progress wp JOIN workbooks w ON w.id = wp.workbook_id JOIN users u ON u.id = wp.learner_id ORDER BY wp.last_activity_at DESC`).all<Row>() : env.DB.prepare(`SELECT wp.workbook_id, w.title AS workbook_title, wp.learner_id, u.display_name AS learner_name, wp.status, wp.cases_visited, wp.cases_total, wp.percent_complete, wp.last_activity_at, wp.completed_at FROM workbook_progress wp JOIN workbooks w ON w.id = wp.workbook_id JOIN users u ON u.id = wp.learner_id WHERE wp.learner_id = ? ORDER BY wp.last_activity_at DESC`).bind(auth.userId).all<Row>(),
    projection.analytics ? env.DB.prepare(`SELECT a.assessment_version_id, qm.question_id, COUNT(qm.id) AS attempts, ROUND(AVG(qm.score), 2) AS mean_score, MAX(qm.max_score) AS max_score, ROUND(100.0 * AVG(qm.score) / NULLIF(MAX(qm.max_score), 0), 1) AS facility_percent FROM question_marks qm JOIN attempts a ON a.id = qm.attempt_id WHERE qm.revision = (SELECT MAX(qm2.revision) FROM question_marks qm2 WHERE qm2.attempt_id = qm.attempt_id AND qm2.question_id = qm.question_id) GROUP BY a.assessment_version_id, qm.question_id ORDER BY facility_percent, qm.question_id`).all<Row>() : empty,
    projection.analytics ? env.DB.prepare(`SELECT cm.criterion_label, COUNT(cm.id) AS attempts, ROUND(AVG(cm.score), 2) AS mean_score, MAX(cm.max_score) AS max_score, ROUND(100.0 * AVG(cm.score) / NULLIF(MAX(cm.max_score), 0), 1) AS performance_percent FROM criterion_marks cm WHERE cm.revision = (SELECT MAX(cm2.revision) FROM criterion_marks cm2 WHERE cm2.attempt_id = cm.attempt_id AND cm2.question_id = cm.question_id AND cm2.criterion_label = cm.criterion_label) GROUP BY cm.criterion_label ORDER BY cm.criterion_label`).all<Row>() : empty,
    env.DB.prepare(`SELECT score, max_score, outcome, released_at FROM results WHERE attempt_id = ?`).bind(attemptId).first<Row>(),
  ]);

  const [draftBlockResult, draftPollResult, draftQuestionEditResult, recoveryResult] = staff
    ? await Promise.all([
        env.DB.prepare(`SELECT b.id, b.workbook_id, b.case_id, b.type, b.title, b.body, b.url, b.position, b.version FROM teaching_content_blocks b JOIN workbooks w ON w.id = b.workbook_id WHERE b.status = 'draft' AND w.status IN ('draft','changes-requested') ORDER BY b.workbook_id, b.position, b.id`).all<Row>(),
        env.DB.prepare(`SELECT p.id, p.workbook_id, p.case_id, p.prompt, p.selection_mode, p.options_json, p.correct_option_ids_json, p.explanation, p.position, p.version FROM teaching_polls p JOIN workbooks w ON w.id = p.workbook_id WHERE p.status = 'draft' AND w.status IN ('draft','changes-requested') ORDER BY p.workbook_id, p.position, p.id`).all<Row>(),
        env.DB.prepare(`SELECT e.workbook_id, e.question_id, e.prompt, e.revision FROM workbook_draft_question_edits e JOIN workbooks w ON w.id = e.workbook_id WHERE w.status IN ('draft','changes-requested') ORDER BY e.workbook_id, e.question_id`).all<Row>(),
        env.DB.prepare(`SELECT draft_workbook_id, source_workbook_id, source_assessment_version_id, source_integrity_hash, copied_case_ids_json, excluded_evidence_json, history_reconstructed, created_at FROM workbook_recoveries ORDER BY created_at DESC`).all<Row>(),
      ])
    : await Promise.all([empty, empty, empty, empty]);

  const queueResult = projection.assessmentScripts
    ? await env.DB.prepare(`SELECT a.id AS attempt_id, a.assessment_version_id, u.display_name AS candidate_name, u.email AS candidate_email, a.state, s.submitted_at, s.evidence_hash, (SELECT score FROM marks WHERE attempt_id = a.id ORDER BY revision DESC LIMIT 1) AS latest_score, (SELECT max_score FROM marks WHERE attempt_id = a.id ORDER BY revision DESC LIMIT 1) AS max_score, (SELECT feedback FROM marks WHERE attempt_id = a.id ORDER BY revision DESC LIMIT 1) AS feedback, (SELECT revision FROM marks WHERE attempt_id = a.id ORDER BY revision DESC LIMIT 1) AS mark_revision, (SELECT final_score FROM moderation_decisions WHERE attempt_id = a.id ORDER BY created_at DESC LIMIT 1) AS moderated_score, (SELECT reason FROM moderation_decisions WHERE attempt_id = a.id ORDER BY created_at DESC LIMIT 1) AS moderation_reason, (SELECT outcome FROM results WHERE attempt_id = a.id LIMIT 1) AS result_outcome, (SELECT released_at FROM results WHERE attempt_id = a.id LIMIT 1) AS released_at FROM attempts a JOIN users u ON u.id = a.user_id JOIN submissions s ON s.attempt_id = a.id WHERE a.state IN ('submitted','accepted-for-marking','marked','moderated','approved','released') ORDER BY s.submitted_at`).all<Row>()
    : ({ results: [] } as unknown as D1Result<Row>);
  const markingQueue = (await Promise.all(rows(queueResult).map(async (item) => {
    let version: VerifiedAssessmentVersion;
    try {
      version = await getVerifiedAssessmentManifest(
        String(item.assessment_version_id),
      );
    } catch {
      // A corrupt or pre-manifest version must not expose a script, but it also
      // must not make unrelated teaching and administration work unavailable.
      return null;
    }
    const answerRows = await env.DB.prepare(
      `SELECT question_id, response FROM answers WHERE attempt_id = ?`,
    ).bind(item.attempt_id).all<Row>();
    const questionMarkRows = await env.DB.prepare(
      `SELECT question_id, score FROM question_marks WHERE attempt_id = ? AND revision = (SELECT MAX(qm2.revision) FROM question_marks qm2 WHERE qm2.attempt_id = question_marks.attempt_id AND qm2.question_id = question_marks.question_id)`,
    ).bind(item.attempt_id).all<Row>();
    const criterionRows = await env.DB.prepare(`SELECT question_id, criterion_label, score, max_score FROM criterion_marks WHERE attempt_id = ? AND revision = (SELECT MAX(cm2.revision) FROM criterion_marks cm2 WHERE cm2.attempt_id = criterion_marks.attempt_id AND cm2.question_id = criterion_marks.question_id AND cm2.criterion_label = criterion_marks.criterion_label) ORDER BY question_id, criterion_label`).bind(item.attempt_id).all<Row>();
    const answerByQuestion = new Map(
      rows(answerRows).map((answer) => [String(answer.question_id), String(answer.response)]),
    );
    const scoreByQuestion = new Map(
      rows(questionMarkRows).map((mark) => [String(mark.question_id), Number(mark.score)]),
    );
    return {
      attemptId: String(item.attempt_id), candidateName: String(item.candidate_name), candidateEmail: String(item.candidate_email), state: String(item.state), submittedAt: String(item.submitted_at), evidenceHash: String(item.evidence_hash),
      answers: manifestQuestions(version.manifest).map((question) => ({
        questionId: question.id, prompt: question.prompt, response: answerByQuestion.get(question.id) ?? "", maxMarks: question.maxMarks,
        rubricCriteria: question.rubric.criteria.map((criterion) => ({ label: criterion.label, marks: criterion.maxMarks })),
        questionScore: scoreByQuestion.get(question.id) ?? null,
        criterionScores: rows(criterionRows).filter((criterion) => String(criterion.question_id) === question.id).map((criterion) => ({ label: String(criterion.criterion_label), score: Number(criterion.score), maxScore: Number(criterion.max_score) })),
      })),
      latestScore: item.latest_score === null ? null : Number(item.latest_score), maxScore: item.max_score === null ? null : Number(item.max_score), feedback: item.feedback === null ? null : String(item.feedback), markRevision: item.mark_revision === null ? null : Number(item.mark_revision), moderatedScore: item.moderated_score === null ? null : Number(item.moderated_score), moderationReason: item.moderation_reason === null ? null : String(item.moderation_reason), resultOutcome: item.result_outcome === null ? null : String(item.result_outcome), releasedAt: item.released_at === null ? null : String(item.released_at),
    };
  }))).filter((item): item is NonNullable<typeof item> => item !== null);
  const accessibleIds = new Set(accessibleRows.map((item) => String(item.id)));
  const visibleWorkbookRows = staff ? rows(workbookResult) : rows(workbookResult).filter((item) => accessibleIds.has(String(item.id)));
  const fullCases = verifiedAssessment
    ? educationCasesFromManifest(verifiedAssessment.manifest)
    : groupEducationCaseRows(rows(caseResult));
  const assessmentPreflight = {
    required:
      String(course.workbook_mode) === "assessment" &&
      !attempt.preflight_passed_at,
    caseCount: fullCases.length,
    mediaReady:
      fullCases.length > 0 &&
      fullCases.every(
        (educationCase) =>
          educationCase.viewerManifest.series.length > 0 &&
          educationCase.viewerManifest.series.every(
            (series) =>
              series.frameCount > 0 && series.sopInstanceUids.length > 0,
          ),
      ),
  };
  const itemAnalysis = (await Promise.all(rows(itemAnalysisResult).map(async (item) => {
    let version: VerifiedAssessmentVersion;
    try {
      version = await getVerifiedAssessmentManifest(
        String(item.assessment_version_id),
      );
    } catch {
      return null;
    }
    const question = manifestQuestions(version.manifest).find(
      (candidate) => candidate.id === String(item.question_id),
    );
    if (!question) return null;
    return { questionId: question.id, prompt: question.prompt, attempts: Number(item.attempts), meanScore: Number(item.mean_score), maxScore: Number(item.max_score), facilityPercent: Number(item.facility_percent) };
  }))).filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    serverTime: new Date().toISOString(), assessmentPreflight, currentUser: { id: auth.userId, email: auth.email, displayName: auth.displayName, roles, previewAvailable: process.env.NODE_ENV !== "production" && auth.userId === "edu:local-demo-user" },
    course: { id: String(course.id), code: String(course.code), title: String(course.title), description: String(course.description), moduleTitle: String(course.module_title), workbookId: String(course.workbook_id), workbookTitle: verifiedAssessment?.manifest.workbook.title ?? String(course.workbook_title), workbookMode: verifiedAssessment?.manifest.workbook.mode ?? String(course.workbook_mode), workbookVersion: verifiedAssessment?.manifest.workbook.version ?? Number(course.workbook_version), durationMinutes: verifiedAssessment?.manifest.assessment.durationMinutes ?? Number(course.duration_minutes), dualDisplayAllowed: verifiedAssessment?.manifest.assessment.displayPolicy.dualDisplayAllowed ?? Boolean(course.dual_display_allowed), assessmentVersion: String(course.assessment_version), assessmentHash: verifiedAssessment?.integrityHash ?? String(course.assessment_hash), viewerCoreVersion: verifiedAssessment?.manifest.viewer.coreVersion ?? String(course.viewer_core_version) },
    workbooks: visibleWorkbookRows.map((item) => ({ id: String(item.id), title: String(item.title), mode: String(item.mode), version: Number(item.version), status: String(item.status), durationMinutes: Number(item.duration_minutes), dualDisplayAllowed: Boolean(item.dual_display_allowed), caseIds: staff && item.case_ids ? String(item.case_ids).split(",") : [], integrityHash: item.integrity_hash === null ? null : String(item.integrity_hash), publishedAt: item.published_at === null ? null : String(item.published_at), authorId: item.author_id === null ? null : String(item.author_id), latestReviewDecision: item.latest_review_decision === null ? null : String(item.latest_review_decision), latestReviewComment: item.latest_review_comment === null ? null : String(item.latest_review_comment), latestReviewerName: item.latest_reviewer_name === null ? null : String(item.latest_reviewer_name) })),
    draftWorkbookDetails: visibleWorkbookRows
      .filter((workbook) => ["draft", "changes-requested"].includes(String(workbook.status)))
      .map((workbook) => {
        const workbookId = String(workbook.id);
        return {
          workbookId,
          teachingBlocks: rows(draftBlockResult)
            .filter((item) => String(item.workbook_id) === workbookId)
            .map((item) => ({ id: String(item.id), workbookId, caseId: String(item.case_id), type: String(item.type) as TeachingContentBlockView["type"], title: String(item.title), body: String(item.body), url: String(item.url), position: Number(item.position), version: Number(item.version) })),
          polls: rows(draftPollResult)
            .filter((item) => String(item.workbook_id) === workbookId)
            .map((item) => ({ id: String(item.id), caseId: String(item.case_id), prompt: String(item.prompt), selectionMode: String(item.selection_mode) as "single" | "multiple", options: parseJson<Array<{ id: string; label: string }>>(item.options_json, []), correctOptionIds: parseJson<string[]>(item.correct_option_ids_json, []), explanation: String(item.explanation), position: Number(item.position), version: Number(item.version) })),
          questionEdits: rows(draftQuestionEditResult)
            .filter((item) => String(item.workbook_id) === workbookId)
            .map((item) => ({ questionId: String(item.question_id), prompt: String(item.prompt), revision: Number(item.revision) })),
        };
      }),
    recoveryComparisons: rows(recoveryResult).map((item) => ({ draftWorkbookId: String(item.draft_workbook_id), sourceWorkbookId: String(item.source_workbook_id), sourceAssessmentVersionId: String(item.source_assessment_version_id), sourceIntegrityHash: String(item.source_integrity_hash), copiedCaseIds: parseJson<string[]>(item.copied_case_ids_json, []), excludedEvidence: parseJson<string[]>(item.excluded_evidence_json, []), historyReconstructed: Boolean(item.history_reconstructed), createdAt: String(item.created_at) })),
    accessibleWorkbooks: accessibleRows.map((item) => ({ id: String(item.id), title: String(item.title), mode: String(item.mode), version: Number(item.version), durationMinutes: Number(item.duration_minutes), dualDisplayAllowed: Boolean(item.dual_display_allowed), availableFrom: item.available_from === null ? null : String(item.available_from), dueAt: item.due_at === null ? null : String(item.due_at), expiresAt: item.expires_at === null ? null : String(item.expires_at), accessSource: String(item.access_source), available: Boolean(item.available), unavailableReason: item.unavailable_reason === null ? null : String(item.unavailable_reason) })),
    learners: rows(learnerResult).map((item) => ({ id: String(item.id), displayName: String(item.display_name), email: String(item.email) })),
    workbookAssignments: rows(assignmentResult).map((item) => ({ id: String(item.id), workbookId: String(item.workbook_id), learnerId: String(item.learner_id), status: String(item.status), assignedAt: String(item.assigned_at), availableFrom: item.available_from === null ? null : String(item.available_from), dueAt: item.due_at === null ? null : String(item.due_at), expiresAt: item.expires_at === null ? null : String(item.expires_at), prerequisiteWorkbookId: item.prerequisite_workbook_id === null ? null : String(item.prerequisite_workbook_id), prerequisiteMinPercent: Number(item.prerequisite_min_percent), version: Number(item.version) })),
    cohorts: rows(cohortResult).map((item) => ({ id: String(item.id), title: String(item.title), code: String(item.code), status: String(item.status), version: Number(item.version), memberCount: Number(item.member_count) })),
    cohortMembers: rows(cohortMemberResult).map((item) => ({ cohortId: String(item.cohort_id), learnerId: String(item.learner_id), status: String(item.status), version: Number(item.version) })),
    cohortAssignments: rows(cohortAssignmentResult).map((item) => ({ id: String(item.id), cohortId: String(item.cohort_id), workbookId: String(item.workbook_id), status: String(item.status), assignedAt: String(item.assigned_at), availableFrom: item.available_from === null ? null : String(item.available_from), dueAt: item.due_at === null ? null : String(item.due_at), expiresAt: item.expires_at === null ? null : String(item.expires_at), prerequisiteWorkbookId: item.prerequisite_workbook_id === null ? null : String(item.prerequisite_workbook_id), prerequisiteMinPercent: Number(item.prerequisite_min_percent), version: Number(item.version) })),
    accommodations: rows(accommodationResult).map((item) => ({ id: String(item.id), workbookId: String(item.workbook_id), learnerId: String(item.learner_id), extraTimeMinutes: Number(item.extra_time_minutes), restBreakMinutes: Number(item.rest_break_minutes), reason: String(item.reason), status: String(item.status), requestedBy: String(item.requested_by), approvedBy: item.approved_by === null ? null : String(item.approved_by), requestedAt: String(item.requested_at), approvedAt: item.approved_at === null ? null : String(item.approved_at), version: Number(item.version) })),
    workbookReviews: rows(reviewResult).map((item) => ({ id: String(item.id), workbookId: String(item.workbook_id), reviewerId: String(item.reviewer_id), reviewerName: String(item.reviewer_name), decision: String(item.decision), comment: String(item.comment), revision: Number(item.revision), createdAt: String(item.created_at) })),
    progressDashboard: rows(progressResult).map((item) => ({ workbookId: String(item.workbook_id), workbookTitle: String(item.workbook_title), learnerId: String(item.learner_id), learnerName: String(item.learner_name), status: String(item.status), casesVisited: Number(item.cases_visited), casesTotal: Number(item.cases_total), percentComplete: Number(item.percent_complete), lastActivityAt: item.last_activity_at === null ? null : String(item.last_activity_at), completedAt: item.completed_at === null ? null : String(item.completed_at) })),
    itemAnalysis,
    rubricPerformance: rows(rubricPerformanceResult).map((item) => ({ criterionLabel: String(item.criterion_label), attempts: Number(item.attempts), meanScore: Number(item.mean_score), maxScore: Number(item.max_score), performancePercent: Number(item.performance_percent) })),
    cases: assessmentPreflight.required ? [] : fullCases,
    teachingNotes: rows(noteResult).map((item) => ({ id: String(item.id), caseId: String(item.case_id), title: String(item.title), body: String(item.body), keyPoints: parseJson<string[]>(item.key_points_json, []), revealText: String(item.reveal_text), position: Number(item.position) })),
    teachingContentBlocks: rows(contentResult).map((item) => ({ id: String(item.id), workbookId: String(item.workbook_id), caseId: String(item.case_id), type: String(item.type) as TeachingContentBlockView["type"], title: String(item.title), body: String(item.body), url: String(item.url), position: Number(item.position), version: Number(item.version) })),
    attempt: { id: String(attempt.id), state: String(attempt.state), startedAt: String(attempt.started_at), deadlineAt: String(attempt.deadline_at), preflightPassedAt: attempt.preflight_passed_at === null ? null : String(attempt.preflight_passed_at), submittedAt: attempt.submitted_at === null ? null : String(attempt.submitted_at), receiptHash: attempt.receipt_hash === null ? null : String(attempt.receipt_hash), accommodationMinutes: Number(attempt.accommodation_minutes) },
    answers: rows(answerResult).map((item) => ({ questionId: String(item.question_id), response: String(item.response), revision: Number(item.revision), updatedAt: String(item.updated_at) })),
    annotations: rows(annotationResult).map((item) => ({ id: String(item.id), caseId: String(item.case_id), kind: String(item.kind), label: String(item.label), geometry: parseJson<Record<string, number>>(item.geometry_json, {}), createdAt: String(item.created_at) })),
    keyImages: rows(keyImageResult).map((item) => ({ id: String(item.id), caseId: String(item.case_id), frameIndex: Number(item.frame_index), viewport: parseJson<Record<string, number | string>>(item.viewport_json, {}), viewerCoreVersion: String(item.viewer_core_version), createdAt: String(item.created_at) })),
    caseFlags: rows(flagResult).map((item) => ({ caseId: String(item.case_id), flagged: Boolean(item.flagged), revision: Number(item.revision), updatedAt: String(item.updated_at) })),
    ingestionJobs: rows(ingestionResult).map((item) => ({ id: String(item.id), title: String(item.title), declaredType: String(item.declared_type), detectedType: String(item.detected_type), status: String(item.status), deidentified: Boolean(item.deidentified), publicationCleared: Boolean(item.publication_cleared), reasonCodes: parseJson<string[]>(item.reason_codes_json, []), contentHash: String(item.content_hash), createdAt: String(item.created_at), reviewedAt: item.reviewed_at === null ? null : String(item.reviewed_at) })),
    markingQueue,
    auditEvents: rows(auditResult).map((item) => ({ sequence: Number(item.sequence), actorId: String(item.actor_id), action: String(item.action), targetType: String(item.target_type), targetId: String(item.target_id), outcome: String(item.outcome), reason: String(item.reason), occurredAt: String(item.occurred_at), integrityHash: String(item.integrity_hash) })),
    result: resultRow ? { score: Number(resultRow.score), maxScore: Number(resultRow.max_score), outcome: String(resultRow.outcome), releasedAt: String(resultRow.released_at) } : null,
  };
}

export async function getAuthoringAppSnapshot(
  auth: AuthContext,
  requestedWorkbookId: string,
): Promise<AppSnapshot> {
  await ensureEducationUser(auth);
  await ensurePlatformSchema();
  const roles = await rolesFor(auth.userId);
  if (!roles.some((role) => ["instructor", "examiner", "administrator"].includes(role)))
    throw new DomainError("An educator or administrator role is required to open Studio authoring.", 403);

  const platform = await getPlatformSnapshot(auth);
  if (!platform.entitlement.studioAccess)
    throw new DomainError("Studio is not enabled for this organization.", 403);

  const workbookId = safeText(requestedWorkbookId, 100);
  if (!workbookId)
    throw new DomainError("Choose a Studio workbook to open in the builder.", 422);

  const target = await env.DB.prepare(
    `SELECT c.id, c.code, c.title, c.description,
            m.id AS module_id, m.title AS module_title,
            w.id AS workbook_id, w.title AS workbook_title,
            w.mode AS workbook_mode, w.version AS workbook_version,
            w.status AS workbook_status, w.duration_minutes,
            w.dual_display_allowed, wa.author_id,
            ownership.organization_id
       FROM workbooks w
       JOIN modules m ON m.id = w.module_id
       JOIN courses c ON c.id = m.course_id
       JOIN course_ownership ownership ON ownership.course_id = c.id
       LEFT JOIN workbook_authorship wa ON wa.workbook_id = w.id
      WHERE w.id = ? AND ownership.organization_id = ?`,
  ).bind(workbookId, platform.organization.id).first<Row>();

  if (!target)
    throw new DomainError("This workbook is not available in your Studio workspace.", 404);

  const access = decideWorkbookAuthoringAccess({
    roles,
    studioAccess: platform.entitlement.studioAccess,
    activeOrganizationId: platform.organization.id,
    ownerOrganizationId: String(target.organization_id),
    status: String(target.workbook_status),
  });
  if (!access.allowed)
    throw new DomainError("This workbook is not available in your Studio workspace.", 404);

  const courseId = String(target.id);
  const empty = Promise.resolve({ results: [] } as unknown as D1Result<Row>);
  const [
    workbookResult,
    workbookCaseResult,
    caseResult,
    noteResult,
    publishedContentResult,
    draftBlockResult,
    draftPollResult,
    draftQuestionEditResult,
    reviewResult,
    recoveryResult,
  ] = await Promise.all([
    env.DB.prepare(
      `SELECT w.id, w.title, w.mode, w.version, w.status,
              w.duration_minutes, w.dual_display_allowed,
              av.integrity_hash, av.published_at, wa.author_id,
              (SELECT wr.decision FROM workbook_reviews wr WHERE wr.workbook_id = w.id ORDER BY wr.revision DESC LIMIT 1) AS latest_review_decision,
              (SELECT wr.comment FROM workbook_reviews wr WHERE wr.workbook_id = w.id ORDER BY wr.revision DESC LIMIT 1) AS latest_review_comment,
              (SELECT u.display_name FROM workbook_reviews wr JOIN users u ON u.id = wr.reviewer_id WHERE wr.workbook_id = w.id ORDER BY wr.revision DESC LIMIT 1) AS latest_reviewer_name
         FROM workbooks w
         JOIN modules m ON m.id = w.module_id
         JOIN course_ownership ownership ON ownership.course_id = m.course_id
         LEFT JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version
         LEFT JOIN workbook_authorship wa ON wa.workbook_id = w.id
        WHERE m.course_id = ? AND ownership.organization_id = ?
        ORDER BY w.rowid DESC`,
    ).bind(courseId, platform.organization.id).all<Row>(),
    env.DB.prepare(
      `SELECT wc.workbook_id, wc.case_id, wc.position
         FROM workbook_cases wc
         JOIN workbooks w ON w.id = wc.workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN course_ownership ownership ON ownership.course_id = m.course_id
        WHERE m.course_id = ? AND ownership.organization_id = ?
        ORDER BY wc.workbook_id, wc.position, wc.case_id`,
    ).bind(courseId, platform.organization.id).all<Row>(),
    env.DB.prepare(
      `SELECT c.id, c.title, c.classification, c.status, c.version,
              c.description, c.visual_kind, c.tools_json, c.publication_hash,
              c.rowid AS position, q.id AS question_id, q.prompt, q.max_marks
         FROM cases c
         JOIN questions q ON q.case_id = c.id
        WHERE c.status = 'published'
          AND c.deidentified = 1
          AND c.publication_cleared = 1
        ORDER BY c.rowid, q.position, q.id`,
    ).all<Row>(),
    env.DB.prepare(
      `SELECT n.id, n.case_id, n.title, n.body, n.key_points_json, n.reveal_text, n.position
         FROM teaching_notes n
         JOIN cases c ON c.id = n.case_id
        WHERE c.status = 'published' AND c.deidentified = 1 AND c.publication_cleared = 1
        ORDER BY n.case_id, n.position`,
    ).all<Row>(),
    env.DB.prepare(
      `SELECT id, workbook_id, case_id, type, title, body, url, position, version
         FROM teaching_content_blocks
        WHERE workbook_id = ? AND status = 'published'
        ORDER BY case_id, position, id`,
    ).bind(workbookId).all<Row>(),
    env.DB.prepare(
      `SELECT b.id, b.workbook_id, b.case_id, b.type, b.title, b.body, b.url, b.position, b.version
         FROM teaching_content_blocks b
         JOIN workbooks w ON w.id = b.workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN course_ownership ownership ON ownership.course_id = m.course_id
        WHERE m.course_id = ? AND ownership.organization_id = ?
          AND b.status = 'draft' AND w.status IN ('draft','changes-requested')
        ORDER BY b.workbook_id, b.position, b.id`,
    ).bind(courseId, platform.organization.id).all<Row>(),
    env.DB.prepare(
      `SELECT p.id, p.workbook_id, p.case_id, p.prompt, p.selection_mode,
              p.options_json, p.correct_option_ids_json, p.explanation, p.position, p.version
         FROM teaching_polls p
         JOIN workbooks w ON w.id = p.workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN course_ownership ownership ON ownership.course_id = m.course_id
        WHERE m.course_id = ? AND ownership.organization_id = ?
          AND p.status = 'draft' AND w.status IN ('draft','changes-requested')
        ORDER BY p.workbook_id, p.position, p.id`,
    ).bind(courseId, platform.organization.id).all<Row>(),
    env.DB.prepare(
      `SELECT e.workbook_id, e.question_id, e.prompt, e.revision
         FROM workbook_draft_question_edits e
         JOIN workbooks w ON w.id = e.workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN course_ownership ownership ON ownership.course_id = m.course_id
        WHERE m.course_id = ? AND ownership.organization_id = ?
          AND w.status IN ('draft','changes-requested')
        ORDER BY e.workbook_id, e.question_id`,
    ).bind(courseId, platform.organization.id).all<Row>(),
    env.DB.prepare(
      `SELECT wr.id, wr.workbook_id, wr.reviewer_id, u.display_name AS reviewer_name,
              wr.decision, wr.comment, wr.revision, wr.created_at
         FROM workbook_reviews wr
         JOIN users u ON u.id = wr.reviewer_id
         JOIN workbooks w ON w.id = wr.workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN course_ownership ownership ON ownership.course_id = m.course_id
        WHERE m.course_id = ? AND ownership.organization_id = ?
        ORDER BY wr.created_at DESC LIMIT 80`,
    ).bind(courseId, platform.organization.id).all<Row>(),
    env.DB.prepare(
      `SELECT r.draft_workbook_id, r.source_workbook_id, r.source_assessment_version_id,
              r.source_integrity_hash, r.copied_case_ids_json, r.excluded_evidence_json,
              r.history_reconstructed, r.created_at
         FROM workbook_recoveries r
         JOIN workbooks w ON w.id = r.draft_workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN course_ownership ownership ON ownership.course_id = m.course_id
        WHERE m.course_id = ? AND ownership.organization_id = ?
        ORDER BY r.created_at DESC`,
    ).bind(courseId, platform.organization.id).all<Row>().catch(() => empty),
  ]);

  const workbookCaseIds = new Map<string, string[]>();
  for (const item of rows(workbookCaseResult)) {
    const id = String(item.workbook_id);
    workbookCaseIds.set(id, [...(workbookCaseIds.get(id) ?? []), String(item.case_id)]);
  }
  const workbookRows = rows(workbookResult);
  const caseRows = rows(caseResult);
  const fullCases = groupEducationCaseRows(caseRows);
  const mediaReady = fullCases.length > 0 && fullCases.every(
    (educationCase) => educationCase.viewerManifest.series.length > 0 &&
      educationCase.viewerManifest.series.every(
        (series) => series.frameCount > 0 && series.sopInstanceUids.length > 0,
      ),
  );
  const mappedWorkbooks: AppSnapshot["workbooks"] = workbookRows.map((item) => ({
    id: String(item.id),
    title: String(item.title),
    mode: String(item.mode),
    version: Number(item.version),
    status: String(item.status),
    durationMinutes: Number(item.duration_minutes),
    dualDisplayAllowed: Boolean(item.dual_display_allowed),
    caseIds: workbookCaseIds.get(String(item.id)) ?? [],
    integrityHash: item.integrity_hash === null ? null : String(item.integrity_hash),
    publishedAt: item.published_at === null ? null : String(item.published_at),
    authorId: item.author_id === null ? null : String(item.author_id),
    latestReviewDecision: item.latest_review_decision === null ? null : String(item.latest_review_decision),
    latestReviewComment: item.latest_review_comment === null ? null : String(item.latest_review_comment),
    latestReviewerName: item.latest_reviewer_name === null ? null : String(item.latest_reviewer_name),
  }));

  const draftWorkbookDetails: AppSnapshot["draftWorkbookDetails"] = mappedWorkbooks
    .filter((workbook) => ["draft", "changes-requested"].includes(workbook.status))
    .map((workbook) => ({
      workbookId: workbook.id,
      teachingBlocks: rows(draftBlockResult)
        .filter((item) => String(item.workbook_id) === workbook.id)
        .map((item) => ({ id: String(item.id), workbookId: workbook.id, caseId: String(item.case_id), type: String(item.type) as TeachingContentBlockView["type"], title: String(item.title), body: String(item.body), url: String(item.url), position: Number(item.position), version: Number(item.version) })),
      polls: rows(draftPollResult)
        .filter((item) => String(item.workbook_id) === workbook.id)
        .map((item) => ({ id: String(item.id), caseId: String(item.case_id), prompt: String(item.prompt), selectionMode: String(item.selection_mode) as "single" | "multiple", options: parseJson<Array<{ id: string; label: string }>>(item.options_json, []), correctOptionIds: parseJson<string[]>(item.correct_option_ids_json, []), explanation: String(item.explanation), position: Number(item.position), version: Number(item.version) })),
      questionEdits: rows(draftQuestionEditResult)
        .filter((item) => String(item.workbook_id) === workbook.id)
        .map((item) => ({ questionId: String(item.question_id), prompt: String(item.prompt), revision: Number(item.revision) })),
    }));

  const now = new Date().toISOString();
  return {
    serverTime: now,
    assessmentPreflight: { required: false, caseCount: fullCases.length, mediaReady },
    currentUser: { id: auth.userId, email: auth.email, displayName: auth.displayName, roles, previewAvailable: false },
    course: {
      id: courseId,
      code: String(target.code),
      title: String(target.title),
      description: String(target.description),
      moduleTitle: String(target.module_title),
      workbookId,
      workbookTitle: String(target.workbook_title),
      workbookMode: String(target.workbook_mode),
      workbookVersion: Number(target.workbook_version),
      durationMinutes: Number(target.duration_minutes),
      dualDisplayAllowed: Boolean(target.dual_display_allowed),
      assessmentVersion: "",
      assessmentHash: "",
      viewerCoreVersion: EDUCATION_VIEWER_CORE_VERSION,
    },
    workbooks: mappedWorkbooks,
    draftWorkbookDetails,
    recoveryComparisons: rows(recoveryResult).map((item) => ({ draftWorkbookId: String(item.draft_workbook_id), sourceWorkbookId: String(item.source_workbook_id), sourceAssessmentVersionId: String(item.source_assessment_version_id), sourceIntegrityHash: String(item.source_integrity_hash), copiedCaseIds: parseJson<string[]>(item.copied_case_ids_json, []), excludedEvidence: parseJson<string[]>(item.excluded_evidence_json, []), historyReconstructed: Boolean(item.history_reconstructed), createdAt: String(item.created_at) })),
    accessibleWorkbooks: mappedWorkbooks.filter((workbook) => workbook.status === "published").map((workbook) => ({ id: workbook.id, title: workbook.title, mode: workbook.mode, version: workbook.version, durationMinutes: workbook.durationMinutes, dualDisplayAllowed: workbook.dualDisplayAllowed, availableFrom: null, dueAt: null, expiresAt: null, accessSource: "staff", available: true, unavailableReason: null })),
    learners: [],
    workbookAssignments: [],
    cohorts: [],
    cohortMembers: [],
    cohortAssignments: [],
    accommodations: [],
    workbookReviews: rows(reviewResult).map((item) => ({ id: String(item.id), workbookId: String(item.workbook_id), reviewerId: String(item.reviewer_id), reviewerName: String(item.reviewer_name), decision: String(item.decision), comment: String(item.comment), revision: Number(item.revision), createdAt: String(item.created_at) })),
    progressDashboard: [],
    itemAnalysis: [],
    rubricPerformance: [],
    cases: fullCases,
    teachingNotes: rows(noteResult).map((item) => ({ id: String(item.id), caseId: String(item.case_id), title: String(item.title), body: String(item.body), keyPoints: parseJson<string[]>(item.key_points_json, []), revealText: String(item.reveal_text), position: Number(item.position) })),
    teachingContentBlocks: rows(publishedContentResult).map((item) => ({ id: String(item.id), workbookId: String(item.workbook_id), caseId: String(item.case_id), type: String(item.type) as TeachingContentBlockView["type"], title: String(item.title), body: String(item.body), url: String(item.url), position: Number(item.position), version: Number(item.version) })),
    attempt: { id: `authoring:${workbookId}`, state: "authoring", startedAt: "", deadlineAt: "", preflightPassedAt: null, submittedAt: null, receiptHash: null, accommodationMinutes: 0 },
    answers: [],
    annotations: [],
    keyImages: [],
    caseFlags: [],
    ingestionJobs: [],
    markingQueue: [],
    auditEvents: [],
    result: null,
  };
}

async function requireRole(auth: AuthContext, ...required: string[]) {
  const roles = await rolesFor(auth.userId);
  if (!hasRole(roles, ...required)) throw new DomainError("Your education role does not permit this action.", 403);
}

export async function authorizeRoles(auth: AuthContext, ...required: string[]) {
  await ensureEducationUser(auth); await requireRole(auth, ...required);
}

async function attemptForSelectedWorkbook(
  auth: AuthContext,
  workbookIdValue: unknown,
  assessmentRequired = false,
  startAssessment = false,
) {
  await ensureEducationUser(auth);
  const roles = await rolesFor(auth.userId);
  const workbookId = safeText(workbookIdValue, 100) || "workbook-assessment";
  if (!(await canAccessPublishedWorkbook(auth.userId, roles, workbookId)))
    throw new DomainError("This workbook is not allocated to your education account.", 403);
  const workbook = await env.DB.prepare(`SELECT w.id, w.mode, w.duration_minutes, av.id AS assessment_version_id, av.dual_display_allowed FROM workbooks w JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version WHERE w.id = ? AND w.status = 'published'`).bind(workbookId).first<Row>();
  if (!workbook) throw new DomainError("Published education workbook not found.", 404);
  if (assessmentRequired && workbook.mode !== "assessment")
    throw new DomainError("This action requires an allocated exam workbook.", 409);
  let verifiedVersion: VerifiedAssessmentVersion | null = null;
  if (workbook.mode === "assessment") {
    try {
      verifiedVersion = await getVerifiedAssessmentManifest(
        String(workbook.assessment_version_id),
      );
    } catch {
      throw new DomainError(
        "This assessment version failed its immutable content integrity check.",
        503,
      );
    }
    workbook.duration_minutes = verifiedVersion.manifest.assessment.durationMinutes;
    workbook.dual_display_allowed = verifiedVersion.manifest.assessment.displayPolicy.dualDisplayAllowed ? 1 : 0;
  }
  const existing = await env.DB.prepare(`SELECT id FROM attempts WHERE user_id = ? AND assessment_version_id = ? ORDER BY started_at DESC LIMIT 1`).bind(auth.userId, workbook.assessment_version_id).first<{ id: string }>();
  const attemptId = existing?.id ?? `attempt:${auth.userId}:${String(workbook.assessment_version_id)}`;
  if (!existing) {
    if (workbook.mode === "assessment" && !startAssessment)
      throw new DomainError(
        "Complete the recorded exam preflight before entering this assessment.",
        409,
      );
    const startedAt = new Date().toISOString();
    const accommodation = await approvedAccommodation(auth.userId, workbookId);
    const durationMinutes = workbook.mode === "assessment"
      ? Math.max(10, Number(workbook.duration_minutes))
      : 365 * 24 * 60;
    const appliedExtraTime = workbook.mode === "assessment" ? accommodation.extraTimeMinutes : 0;
    const deadlineAt = new Date(Date.now() + (durationMinutes + appliedExtraTime) * 60_000).toISOString();
    await env.DB.prepare(`INSERT OR IGNORE INTO attempts (id, user_id, assessment_version_id, state, started_at, deadline_at, preflight_passed_at, accommodation_minutes) VALUES (?, ?, ?, 'in-progress', ?, ?, ?, ?)`).bind(attemptId, auth.userId, workbook.assessment_version_id, startedAt, deadlineAt, startAssessment ? startedAt : null, appliedExtraTime).run();
  }
  return { attemptId, workbookId, workbook, verifiedVersion };
}

async function caseBelongsToWorkbookVersion(
  workbookId: string,
  caseId: string,
  verifiedVersion: VerifiedAssessmentVersion | null,
) {
  if (verifiedVersion)
    return verifiedVersion.manifest.cases.some((item) => item.id === caseId);
  return Boolean(await env.DB.prepare(
    `SELECT case_id FROM workbook_cases WHERE workbook_id = ? AND case_id = ?`,
  ).bind(workbookId, caseId).first());
}

async function requireWritableAttempt(
  auth: AuthContext,
  attemptId: string,
  workbookMode: unknown,
) {
  const attempt = await env.DB.prepare(
    `SELECT state, deadline_at, preflight_passed_at FROM attempts WHERE id = ? AND user_id = ?`,
  )
    .bind(attemptId, auth.userId)
    .first<{
      state: string;
      deadline_at: string;
      preflight_passed_at: string | null;
    }>();
  if (!attempt) throw new DomainError("No authorized attempt is available.", 403);

  if (workbookMode !== "assessment") {
    if (!["in-progress", "reopened"].includes(attempt.state))
      throw new DomainError("This attempt is not open for editing.", 409);
    return;
  }

  const decision = decideAttemptWrite({
    state: attempt.state,
    deadlineAt: attempt.deadline_at,
    preflightPassedAt: attempt.preflight_passed_at,
    now: new Date(),
  });
  if (decision.allowed) return;
  if (decision.expire) {
    const expiredAt = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE attempts SET state = 'expired' WHERE id = ? AND user_id = ? AND state IN ('in-progress','reopened')`,
    )
      .bind(attemptId, auth.userId)
      .run();
    await appendAudit(
      auth.userId,
      "attempt.expired",
      "attempt",
      attemptId,
      "success",
      `deadline=${attempt.deadline_at};detected=${expiredAt}`,
    );
    throw new DomainError(
      "The assessment time has expired. Further answers and evidence are locked.",
      409,
    );
  }
  if (decision.reason === "preflight-required")
    throw new DomainError(
      "Complete the recorded exam preflight before entering this assessment.",
      409,
    );
  throw new DomainError("This assessment attempt is not open for editing.", 409);
}

export async function saveAnswer(auth: AuthContext, payload: Row) {
  exactActionFields(payload, ["action", "selectedWorkbookId", "questionId", "response", "expectedRevision"]);
  const { attemptId, workbook, verifiedVersion } = await attemptForSelectedWorkbook(auth, payload.selectedWorkbookId, true);
  const questionId = safeText(payload.questionId, 100);
  const response = safeText(payload.response);
  const expectedRevision = Number(payload.expectedRevision ?? 0);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0)
    throw new DomainError("A valid answer revision is required.", 422);
  await requireWritableAttempt(auth, attemptId, workbook.mode);
  if (!verifiedVersion || !manifestQuestions(verifiedVersion.manifest).some((item) => item.id === questionId))
    throw new DomainError("The question is not part of this assessment version.", 404);
  const revision = expectedRevision + 1;
  const updatedAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO answers (attempt_id, question_id, response, revision, updated_at)
     SELECT ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM attempts
         WHERE id = ? AND state IN ('in-progress','reopened')
           AND preflight_passed_at IS NOT NULL AND deadline_at > ?
      )
     ON CONFLICT(attempt_id, question_id) DO UPDATE SET
       response = excluded.response,
       revision = excluded.revision,
       updated_at = excluded.updated_at
     WHERE answers.revision = ?`,
  ).bind(
    attemptId,
    questionId,
    response,
    revision,
    updatedAt,
    attemptId,
    updatedAt,
    expectedRevision,
  ).run();
  if (Number(result.meta.changes ?? 0) !== 1) {
    await requireWritableAttempt(auth, attemptId, workbook.mode);
    throw new DomainError("A newer saved answer exists. Refresh before replacing it.", 409);
  }
  await appendAudit(auth.userId, "answer.saved", "attempt", attemptId, "success", `question=${questionId};revision=${revision}`);
}

export async function addAnnotation(auth: AuthContext, payload: Row) {
  exactActionFields(payload, ["action", "selectedWorkbookId", "caseId", "kind", "label", "geometry"]);
  const { attemptId, workbookId, workbook, verifiedVersion } = await attemptForSelectedWorkbook(auth, payload.selectedWorkbookId);
  const caseId = safeText(payload.caseId, 100); const kind = safeText(payload.kind, 40); const label = safeText(payload.label, 240);
  await requireWritableAttempt(auth, attemptId, workbook.mode);
  if (!(await caseBelongsToWorkbookVersion(workbookId, caseId, verifiedVersion)))
    throw new DomainError("The case is not part of the selected workbook version.", 404);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO annotations
       (id, attempt_id, case_id, kind, label, geometry_json, created_at)
     SELECT ?, ?, ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM attempts
         WHERE id = ? AND state IN ('in-progress','reopened')
           AND (
             ? <> 'assessment'
             OR (preflight_passed_at IS NOT NULL AND deadline_at > ?)
           )
      )`,
  ).bind(
    id,
    attemptId,
    caseId,
    kind || "marker",
    label || "Educational marker",
    JSON.stringify(payload.geometry ?? {}),
    createdAt,
    attemptId,
    String(workbook.mode),
    createdAt,
  ).run();
  if (Number(result.meta.changes ?? 0) !== 1) {
    await requireWritableAttempt(auth, attemptId, workbook.mode);
    throw new DomainError("This attempt changed while the annotation was being saved.", 409);
  }
  await appendAudit(auth.userId, "annotation.created", "annotation", id, "success", `case=${caseId}`);
}

export async function addKeyImage(auth: AuthContext, payload: Row) {
  exactActionFields(payload, ["action", "selectedWorkbookId", "caseId", "frameIndex", "viewport"]);
  const { attemptId, workbookId, workbook, verifiedVersion } = await attemptForSelectedWorkbook(auth, payload.selectedWorkbookId);
  const caseId = safeText(payload.caseId, 100); const frameIndex = Math.max(0, Number(payload.frameIndex ?? 0));
  await requireWritableAttempt(auth, attemptId, workbook.mode);
  if (!(await caseBelongsToWorkbookVersion(workbookId, caseId, verifiedVersion)))
    throw new DomainError("The case is not part of the selected workbook version.", 404);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO key_images
       (id, attempt_id, case_id, frame_index, viewport_json, viewer_core_version, created_at)
     SELECT ?, ?, ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM attempts
         WHERE id = ? AND state IN ('in-progress','reopened')
           AND (
             ? <> 'assessment'
             OR (preflight_passed_at IS NOT NULL AND deadline_at > ?)
           )
      )`,
  ).bind(
    id,
    attemptId,
    caseId,
    frameIndex,
    JSON.stringify(payload.viewport ?? {}),
    verifiedVersion?.manifest.viewer.coreVersion ?? EDUCATION_VIEWER_CORE_VERSION,
    createdAt,
    attemptId,
    String(workbook.mode),
    createdAt,
  ).run();
  if (Number(result.meta.changes ?? 0) !== 1) {
    await requireWritableAttempt(auth, attemptId, workbook.mode);
    throw new DomainError("This attempt changed while the key image was being saved.", 409);
  }
  await appendAudit(auth.userId, "key-image.created", "key-image", id, "success", `case=${caseId};frame=${frameIndex}`);
}

export async function setCaseFlag(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  exactActionFields(payload, [
    "action",
    "selectedWorkbookId",
    "caseId",
    "flagged",
    "expectedRevision",
  ]);
  const { attemptId, workbookId, workbook, verifiedVersion } = await attemptForSelectedWorkbook(
    auth,
    payload.selectedWorkbookId,
  );
  if (workbook.mode !== "assessment")
    throw new DomainError("Case review flags are available only in an assessment.", 409);
  await requireWritableAttempt(auth, attemptId, workbook.mode);
  const caseId = safeText(payload.caseId, 100);
  if (!(await caseBelongsToWorkbookVersion(workbookId, caseId, verifiedVersion)))
    throw new DomainError("The case is not part of this assessment version.", 404);
  if (typeof payload.flagged !== "boolean")
    throw new DomainError("The case flag state must be true or false.", 422);
  const expectedRevision = Number(payload.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0)
    throw new DomainError("A valid case flag revision is required.", 422);
  const nextRevision = expectedRevision + 1;
  const updatedAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO attempt_case_flags (attempt_id, case_id, flagged, revision, updated_at)
     SELECT ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM attempts
         WHERE id = ? AND state IN ('in-progress','reopened')
           AND preflight_passed_at IS NOT NULL AND deadline_at > ?
      )
     ON CONFLICT(attempt_id, case_id) DO UPDATE SET
       flagged = excluded.flagged,
       revision = excluded.revision,
       updated_at = excluded.updated_at
     WHERE attempt_case_flags.revision = ?`,
  ).bind(
    attemptId,
    caseId,
    payload.flagged ? 1 : 0,
    nextRevision,
    updatedAt,
    attemptId,
    updatedAt,
    expectedRevision,
  ).run();
  if (Number(result.meta.changes ?? 0) !== 1) {
    await requireWritableAttempt(auth, attemptId, workbook.mode);
    throw new DomainError("The case flag changed. Refresh before changing it again.", 409);
  }
  await appendAudit(
    auth.userId,
    payload.flagged ? "attempt.case-flagged" : "attempt.case-unflagged",
    "attempt",
    attemptId,
    "success",
    `case=${caseId};revision=${nextRevision}`,
  );
}

export async function recordWorkbookProgress(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth);
  exactActionFields(payload, ["action", "selectedWorkbookId", "caseId"]);
  const workbookId = safeText(payload.selectedWorkbookId, 100); const caseId = safeText(payload.caseId, 100);
  const roles = await rolesFor(auth.userId);
  if (!(await canAccessPublishedWorkbook(auth.userId, roles, workbookId))) throw new DomainError("This workbook is not allocated to your education account.", 403);
  const workbookCase = await env.DB.prepare(`SELECT w.mode, av.id AS assessment_version_id FROM workbooks w JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version WHERE w.id = ? AND w.status = 'published'`).bind(workbookId).first<{ mode: string; assessment_version_id: string }>();
  if (!workbookCase) throw new DomainError("Published education workbook not found.", 404);
  let frozenVersion: VerifiedAssessmentVersion | null = null;
  if (workbookCase.mode === "assessment") {
    try {
      frozenVersion = await getVerifiedAssessmentManifest(workbookCase.assessment_version_id);
    } catch {
      throw new DomainError("This assessment version failed its immutable content integrity check.", 503);
    }
  }
  if (!(await caseBelongsToWorkbookVersion(workbookId, caseId, frozenVersion)))
    throw new DomainError("The case is not part of the selected workbook version.", 404);
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO workbook_case_progress (workbook_id, learner_id, case_id, first_opened_at, last_opened_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(workbook_id, learner_id, case_id) DO UPDATE SET last_opened_at = excluded.last_opened_at`).bind(workbookId, auth.userId, caseId, now, now).run();
  const totals = await env.DB.prepare(`SELECT COUNT(*) AS visited FROM workbook_case_progress WHERE workbook_id = ? AND learner_id = ?`).bind(workbookId, auth.userId).first<{ visited: number }>();
  const liveTotal = frozenVersion
    ? null
    : await env.DB.prepare(`SELECT COUNT(*) AS count FROM workbook_cases WHERE workbook_id = ?`).bind(workbookId).first<{ count: number }>();
  const total = Math.max(1, frozenVersion?.manifest.cases.length ?? Number(liveTotal?.count ?? 1));
  const visited = Math.min(total, Number(totals?.visited ?? 0));
  const percent = Math.round(100 * visited / total);
  const existing = await env.DB.prepare(`SELECT first_opened_at, status, version FROM workbook_progress WHERE workbook_id = ? AND learner_id = ?`).bind(workbookId, auth.userId).first<{ first_opened_at: string; status: string; version: number }>();
  const completed = workbookCase.mode === "teaching" && visited === total;
  const status = completed || existing?.status === "completed" ? "completed" : "in-progress";
  const completedAt = status === "completed" ? (existing?.status === "completed" ? null : now) : null;
  await env.DB.prepare(`INSERT INTO workbook_progress (workbook_id, learner_id, status, cases_visited, cases_total, percent_complete, first_opened_at, last_activity_at, completed_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(workbook_id, learner_id) DO UPDATE SET status = excluded.status, cases_visited = excluded.cases_visited, cases_total = excluded.cases_total, percent_complete = CASE WHEN workbook_progress.status = 'completed' THEN 100 ELSE excluded.percent_complete END, last_activity_at = excluded.last_activity_at, completed_at = COALESCE(workbook_progress.completed_at, excluded.completed_at), version = workbook_progress.version + 1`).bind(workbookId, auth.userId, status, visited, total, status === "completed" ? 100 : percent, existing?.first_opened_at ?? now, now, completedAt).run();
  if (completed && existing?.status !== "completed") await appendAudit(auth.userId, "workbook.completed", "workbook", workbookId, "success", `cases=${visited}/${total};mode=teaching`);
}

async function completeWorkbookProgress(userId: string, workbookId: string, occurredAt: string, frozenCaseCount?: number) {
  const totalRow = frozenCaseCount === undefined
    ? await env.DB.prepare(`SELECT COUNT(*) AS count FROM workbook_cases WHERE workbook_id = ?`).bind(workbookId).first<{ count: number }>()
    : null;
  const total = Math.max(1, frozenCaseCount ?? Number(totalRow?.count ?? 1));
  await env.DB.prepare(`INSERT INTO workbook_progress (workbook_id, learner_id, status, cases_visited, cases_total, percent_complete, first_opened_at, last_activity_at, completed_at, version) VALUES (?, ?, 'completed', ?, ?, 100, ?, ?, ?, 1) ON CONFLICT(workbook_id, learner_id) DO UPDATE SET status = 'completed', cases_visited = MAX(workbook_progress.cases_visited, excluded.cases_visited), cases_total = excluded.cases_total, percent_complete = 100, last_activity_at = excluded.last_activity_at, completed_at = COALESCE(workbook_progress.completed_at, excluded.completed_at), version = workbook_progress.version + 1`).bind(workbookId, userId, total, total, occurredAt, occurredAt, occurredAt).run();
}

async function immutableAttemptEvidence(
  attemptId: string,
  assessmentVersion: string,
  assessmentIntegrityHash: string,
  submittedAt: string,
) {
  const [answerResult, annotationResult, keyResult, flagResult] = await Promise.all([
    env.DB.prepare(`SELECT question_id, response, revision, updated_at FROM answers WHERE attempt_id = ? ORDER BY question_id`).bind(attemptId).all<Row>(),
    env.DB.prepare(`SELECT id, case_id, kind, label, geometry_json, created_at FROM annotations WHERE attempt_id = ? ORDER BY id`).bind(attemptId).all<Row>(),
    env.DB.prepare(`SELECT id, case_id, frame_index, viewport_json, viewer_core_version, created_at FROM key_images WHERE attempt_id = ? ORDER BY id`).bind(attemptId).all<Row>(),
    env.DB.prepare(`SELECT case_id, flagged, revision, updated_at FROM attempt_case_flags WHERE attempt_id = ? ORDER BY case_id`).bind(attemptId).all<Row>(),
  ]);
  const evidenceHash = await sha256(JSON.stringify({
    attemptId,
    assessmentVersion,
    assessmentIntegrityHash,
    answers: rows(answerResult),
    annotations: rows(annotationResult),
    keyImages: rows(keyResult),
    caseFlags: rows(flagResult),
    submittedAt,
  }));
  return { answerResult, evidenceHash };
}

type DueAttempt = {
  id: string;
  user_id: string;
  state: string;
  deadline_at: string;
  preflight_passed_at: string | null;
  assessment_version_id: string;
  workbook_id: string;
};

async function finalizeDueAttempt(
  attempt: DueAttempt,
  auditActorId: string,
) {
  const submittedAt = new Date().toISOString();
  const version = await getVerifiedAssessmentManifest(
    attempt.assessment_version_id,
  );
  const { evidenceHash } = await immutableAttemptEvidence(
    attempt.id,
    attempt.assessment_version_id,
    version.integrityHash,
    submittedAt,
  );
  const [claimResult] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE attempts
          SET state = 'submitted', submitted_at = ?, receipt_hash = ?
        WHERE id = ?
          AND state IN ('in-progress','reopened','expired')
          AND preflight_passed_at IS NOT NULL
          AND deadline_at <= ?`,
    ).bind(submittedAt, evidenceHash, attempt.id, submittedAt),
    env.DB.prepare(
      `INSERT OR IGNORE INTO submissions
         (id, attempt_id, evidence_hash, submitted_at, status)
       SELECT ?, ?, ?, ?, 'timed-expiry'
        WHERE EXISTS (
          SELECT 1 FROM attempts
           WHERE id = ? AND state = 'submitted'
             AND submitted_at = ? AND receipt_hash = ?
        )`,
    ).bind(
      `submission:deadline:${attempt.id}`,
      attempt.id,
      evidenceHash,
      submittedAt,
      attempt.id,
      submittedAt,
      evidenceHash,
    ),
  ]);
  if (Number(claimResult.meta.changes ?? 0) !== 1) return false;

  await completeWorkbookProgress(
    attempt.user_id,
    attempt.workbook_id,
    submittedAt,
    version.manifest.cases.length,
  );
  await appendAudit(
    auditActorId,
    "attempt.deadline-finalized",
    "attempt",
    attempt.id,
    "success",
    `deadline=${attempt.deadline_at};receipt=${evidenceHash};server-finalized=true`,
  );
  return true;
}

async function finalizeDueAttemptsForSnapshot(userId?: string) {
  const dueAt = new Date().toISOString();
  const staleSubmissionClaim = new Date(Date.now() - 120_000).toISOString();
  const recoveryStatement = env.DB.prepare(
    `UPDATE attempts
        SET state = CASE WHEN deadline_at <= ? THEN 'expired' ELSE 'reopened' END,
            submitted_at = NULL
      WHERE state = 'submitting' AND receipt_hash IS NULL
        AND submitted_at IS NOT NULL AND submitted_at <= ?
        ${userId ? "AND user_id = ?" : ""}`,
  );
  if (userId)
    await recoveryStatement.bind(dueAt, staleSubmissionClaim, userId).run();
  else await recoveryStatement.bind(dueAt, staleSubmissionClaim).run();
  const statement = env.DB.prepare(
    `SELECT a.id, a.user_id, a.state, a.deadline_at,
            a.preflight_passed_at, a.assessment_version_id,
            av.workbook_id
       FROM attempts a
       JOIN assessment_versions av ON av.id = a.assessment_version_id
      WHERE a.state IN ('in-progress','reopened','expired')
        AND a.preflight_passed_at IS NOT NULL
        AND a.deadline_at <= ?
        ${userId ? "AND a.user_id = ?" : ""}
      ORDER BY a.deadline_at, a.id
      LIMIT 100`,
  );
  const dueResult = userId
    ? await statement.bind(dueAt, userId).all<Row>()
    : await statement.bind(dueAt).all<Row>();
  for (const row of rows(dueResult))
    await finalizeDueAttempt(
      {
        id: String(row.id),
        user_id: String(row.user_id),
        state: String(row.state),
        deadline_at: String(row.deadline_at),
        preflight_passed_at:
          row.preflight_passed_at === null
            ? null
            : String(row.preflight_passed_at),
        assessment_version_id: String(row.assessment_version_id),
        workbook_id: String(row.workbook_id),
      },
      "system:deadline",
    );
}

export async function submitAttempt(auth: AuthContext, payload: Row) {
  exactActionFields(payload, ["action", "selectedWorkbookId"]);
  const { attemptId, workbookId, workbook, verifiedVersion } = await attemptForSelectedWorkbook(auth, payload.selectedWorkbookId, true);
  if (!verifiedVersion)
    throw new DomainError("The immutable assessment version is unavailable.", 503);
  await requireWritableAttempt(auth, attemptId, workbook.mode);
  const attempt = await env.DB.prepare(`SELECT state, assessment_version_id FROM attempts WHERE id = ? AND user_id = ?`).bind(attemptId, auth.userId).first<{ state: string; assessment_version_id: string }>();
  if (!attempt || !canTransitionAttempt(attempt.state, "submitted")) throw new DomainError("This attempt cannot be submitted from its current state.", 409);
  const submittedAt = new Date().toISOString();
  const claim = await env.DB.prepare(
    `UPDATE attempts
        SET state = 'submitting', submitted_at = ?, receipt_hash = NULL
      WHERE id = ? AND user_id = ? AND state = ?
        AND preflight_passed_at IS NOT NULL AND deadline_at > ?
        AND NOT EXISTS (SELECT 1 FROM submissions WHERE attempt_id = ?)`,
  ).bind(
    submittedAt,
    attemptId,
    auth.userId,
    attempt.state,
    submittedAt,
    attemptId,
  ).run();
  if (Number(claim.meta.changes ?? 0) !== 1) {
    await requireWritableAttempt(auth, attemptId, workbook.mode);
    throw new DomainError("This attempt changed while submission was starting.", 409);
  }

  let committed = false;
  try {
    const { answerResult, evidenceHash } = await immutableAttemptEvidence(
      attemptId,
      attempt.assessment_version_id,
      verifiedVersion.integrityHash,
      submittedAt,
    );
    const responseByQuestion = new Map(
      rows(answerResult).map((answer) => [String(answer.question_id), String(answer.response)]),
    );
    if (manifestQuestions(verifiedVersion.manifest).some((question) => !responseByQuestion.get(question.id)?.trim()))
      throw new DomainError("Answer every question before submitting.", 422);
    const [submissionResult] = await env.DB.batch([
      env.DB.prepare(
        `UPDATE attempts
            SET state = 'submitted', receipt_hash = ?
          WHERE id = ? AND user_id = ? AND state = 'submitting'
            AND submitted_at = ? AND receipt_hash IS NULL`,
      ).bind(evidenceHash, attemptId, auth.userId, submittedAt),
      env.DB.prepare(
        `INSERT OR IGNORE INTO submissions
           (id, attempt_id, evidence_hash, submitted_at, status)
         SELECT ?, ?, ?, ?, 'accepted'
          WHERE EXISTS (
            SELECT 1 FROM attempts
             WHERE id = ? AND user_id = ? AND state = 'submitted'
               AND submitted_at = ? AND receipt_hash = ?
          )`,
      ).bind(
        `submission:manual:${attemptId}`,
        attemptId,
        evidenceHash,
        submittedAt,
        attemptId,
        auth.userId,
        submittedAt,
        evidenceHash,
      ),
    ]);
    if (Number(submissionResult.meta.changes ?? 0) !== 1)
      throw new DomainError("This attempt changed while the receipt was being issued.", 409);
    committed = true;
    await completeWorkbookProgress(auth.userId, workbookId, submittedAt, verifiedVersion.manifest.cases.length);
    await appendAudit(auth.userId, "attempt.submitted", "attempt", attemptId, "success", `receipt=${evidenceHash};evidence-frozen=true`);
  } finally {
    if (!committed)
      await env.DB.prepare(
        `UPDATE attempts
            SET state = ?, submitted_at = NULL
          WHERE id = ? AND user_id = ? AND state = 'submitting'
            AND submitted_at = ? AND receipt_hash IS NULL`,
      ).bind(attempt.state, attemptId, auth.userId, submittedAt).run();
  }
}

export async function finalizeTimedAttempt(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  exactActionFields(payload, ["action", "selectedWorkbookId"]);
  const { attemptId, workbook } = await attemptForSelectedWorkbook(
    auth,
    payload.selectedWorkbookId,
  );
  if (workbook.mode !== "assessment")
    throw new DomainError("Only a timed assessment can be finalized at its deadline.", 409);
  const attempt = await env.DB.prepare(
    `SELECT a.id, a.user_id, a.state, a.deadline_at,
            a.preflight_passed_at, a.assessment_version_id,
            av.workbook_id
       FROM attempts a
       JOIN assessment_versions av ON av.id = a.assessment_version_id
      WHERE a.id = ? AND a.user_id = ?`,
  ).bind(attemptId, auth.userId).first<DueAttempt>();
  if (!attempt || !attempt.preflight_passed_at)
    throw new DomainError("The assessment preflight was not completed.", 409);
  if (attempt.state === "submitted") return;
  if (!["in-progress", "reopened", "expired"].includes(attempt.state))
    throw new DomainError("This assessment cannot be finalized from its current state.", 409);
  if (
    !Number.isFinite(Date.parse(attempt.deadline_at)) ||
    Date.parse(attempt.deadline_at) > Date.now()
  )
    throw new DomainError("The assessment deadline has not been reached.", 409);
  if (await finalizeDueAttempt(attempt, auth.userId)) return;
  const current = await env.DB.prepare(
    `SELECT state FROM attempts WHERE id = ? AND user_id = ?`,
  ).bind(attemptId, auth.userId).first<{ state: string }>();
  if (current?.state === "submitted") return;
  throw new DomainError(
    "This assessment could not be finalized from its current state.",
    409,
  );
}

function signalsForProfile(profile: string, deidentified: boolean, publicationCleared: boolean): ContentSignal[] {
  const base = { supported: true, integrityValid: true, deidentified, publicationCleared };
  if (profile === "radiology") return [{ ...base, kind: "radiology", format: "DICOM CT" }];
  if (profile === "pathology") return [{ ...base, kind: "pathology", format: "DICOM WSI" }];
  if (profile === "mixed") return [{ ...base, kind: "radiology", format: "DICOM CT" }, { ...base, kind: "pathology", format: "DICOM WSI" }];
  if (profile === "unsupported") return [{ ...base, kind: "unknown", format: "encrypted archive", supported: false }];
  return [{ ...base, kind: "unknown", format: "ambiguous", metadataConflict: true }];
}

export async function createIngestion(auth: AuthContext, payload: Row) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  const title = safeText(payload.title, 160).trim(); const profile = safeText(payload.profile, 40); const deidentified = Boolean(payload.deidentified); const publicationCleared = Boolean(payload.publicationCleared);
  if (!title) throw new DomainError("A teaching-case title is required.");
  const decision = classifyTeachingContent(signalsForProfile(profile, deidentified, publicationCleared));
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString(); const contentHash = await sha256(`${id}|${title}|${profile}|${createdAt}`);
  const status = decision.classification === "unsupported" ? "unsupported" : decision.publishable ? "ready-for-review" : "requires-review";
  await env.DB.prepare(`INSERT INTO ingestion_jobs (id, title, declared_type, detected_type, status, deidentified, publication_cleared, reason_codes_json, content_hash, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, title, profile, decision.classification, status, deidentified ? 1 : 0, publicationCleared ? 1 : 0, JSON.stringify(decision.reasonCodes), contentHash, auth.userId, createdAt).run();
  await appendAudit(auth.userId, "ingestion.classified", "ingestion", id, "success", `${decision.classification}:${decision.reasonCodes.join(",")}`);
}

export async function reviewIngestion(auth: AuthContext, payload: Row) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  const id = safeText(payload.id, 100); const decision = safeText(payload.decision, 40);
  if (!new Set(["published", "rejected", "requires-review"]).has(decision)) throw new DomainError("Invalid publication review decision.");
  const job = await env.DB.prepare(`SELECT detected_type, status, deidentified, publication_cleared FROM ingestion_jobs WHERE id = ?`).bind(id).first<Row>();
  if (!job) throw new DomainError("Ingestion job not found.", 404);
  if (decision === "published" && (String(job.detected_type) === "unsupported" || String(job.detected_type) === "requires-review" || Number(job.deidentified) !== 1 || Number(job.publication_cleared) !== 1)) throw new DomainError("This case cannot be published until classification, de-identification and rights checks pass.", 409);
  await env.DB.prepare(`UPDATE ingestion_jobs SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?`).bind(decision, auth.userId, new Date().toISOString(), id).run();
  await appendAudit(auth.userId, `ingestion.${decision}`, "ingestion", id, "success", "publication-review");
}

export async function createWorkbook(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "examiner", "administrator");
  const title = safeText(payload.title, 160).trim(); const mode = safeText(payload.mode, 30); const durationMinutes = Math.max(0, Math.min(480, Number(payload.durationMinutes ?? 0))); const dualDisplayAllowed = Boolean(payload.dualDisplayAllowed);
  const caseIds = Array.isArray(payload.caseIds) ? [...new Set(payload.caseIds.filter((value): value is string => typeof value === "string").slice(0, 30))] : [];
  if (!title) throw new DomainError("A workbook title is required.");
  if (!new Set(["teaching", "assessment"]).has(mode)) throw new DomainError("Choose teaching or exam mode.");
  if (!caseIds.length) throw new DomainError("Select at least one published teaching case.");
  const pollDrafts = mode === "teaching" && Array.isArray(payload.polls) ? payload.polls.slice(0, 12).map(validatePollDraft) : [];
  if (pollDrafts.some((poll) => !caseIds.includes(poll.caseId))) throw new DomainError("Every live poll must be linked to a selected teaching case.", 422);
  const contentDrafts = mode === "teaching" && Array.isArray(payload.teachingBlocks) ? payload.teachingBlocks.slice(0, 60).map(validateTeachingContentBlock) : [];
  if (contentDrafts.some((block) => !caseIds.includes(block.caseId))) throw new DomainError("Every teaching content block must be linked to a selected case.", 422);
  const placeholders = caseIds.map(() => "?").join(",");
  const published = await env.DB.prepare(`SELECT id FROM cases WHERE status = 'published' AND id IN (${placeholders})`).bind(...caseIds).all<{ id: string }>();
  if (published.results.length !== caseIds.length) throw new DomainError("Every selected case must be a published education case.", 409);
  const id = crypto.randomUUID();
  const statements = [env.DB.prepare(`INSERT INTO workbooks (id, module_id, title, mode, version, status, duration_minutes, dual_display_allowed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, "module-integrated", title, mode, 1, "draft", mode === "assessment" ? durationMinutes || 60 : 0, dualDisplayAllowed ? 1 : 0)];
  caseIds.forEach((caseId, index) => statements.push(env.DB.prepare(`INSERT INTO workbook_cases (workbook_id, case_id, position) VALUES (?, ?, ?)`).bind(id, caseId, index + 1)));
  const createdAt = new Date().toISOString();
  statements.push(env.DB.prepare(`INSERT INTO workbook_authorship (workbook_id, author_id, created_at) VALUES (?, ?, ?)`).bind(id, auth.userId, createdAt));
  pollDrafts.forEach((poll, index) => statements.push(env.DB.prepare(`INSERT INTO teaching_polls (id, workbook_id, case_id, prompt, selection_mode, options_json, correct_option_ids_json, explanation, position, version, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'draft', ?, ?, ?)`).bind(crypto.randomUUID(), id, poll.caseId, poll.prompt, poll.selectionMode, JSON.stringify(poll.options), JSON.stringify(poll.correctOptionIds), poll.explanation, index + 1, auth.userId, createdAt, createdAt)));
  contentDrafts.forEach((block, index) => statements.push(env.DB.prepare(`INSERT INTO teaching_content_blocks (id, workbook_id, case_id, type, title, body, url, position, version, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'draft', ?, ?, ?)`).bind(crypto.randomUUID(), id, block.caseId, block.type, block.title, block.body, block.url, index + 1, auth.userId, createdAt, createdAt)));
  await env.DB.batch(statements);
  await appendAudit(auth.userId, "workbook.draft-created", "workbook", id, "success", `mode=${mode};cases=${caseIds.length};blocks=${contentDrafts.length};polls=${pollDrafts.length};dual-display=${dualDisplayAllowed}`);
}

export async function updateWorkbookDraft(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  await ensureEducationUser(auth);
  await requireRole(auth, "instructor", "examiner", "administrator");
  exactActionFields(payload, [
    "action",
    "selectedWorkbookId",
    "id",
    "expectedVersion",
    "title",
    "mode",
    "durationMinutes",
    "dualDisplayAllowed",
    "caseIds",
    "polls",
    "teachingBlocks",
    "questionEdits",
  ]);
  const id = safeText(payload.id, 100);
  const expectedVersion = Number(payload.expectedVersion);
  const title = safeText(payload.title, 160).trim();
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1)
    throw new DomainError("A valid draft version is required.", 422);
  if (!title) throw new DomainError("A workbook title is required.", 422);
  const workbook = await env.DB.prepare(
    `SELECT w.mode, w.status, w.version, wa.author_id
       FROM workbooks w
       LEFT JOIN workbook_authorship wa ON wa.workbook_id = w.id
      WHERE w.id = ?`,
  ).bind(id).first<Row>();
  if (!workbook) throw new DomainError("Workbook draft not found.", 404);
  if (!["draft", "changes-requested"].includes(String(workbook.status)))
    throw new DomainError("Only an editable draft can be changed.", 409);
  if (Number(workbook.version) !== expectedVersion)
    throw new DomainError("This draft changed. Reload it before saving again.", 409);
  const roles = await rolesFor(auth.userId);
  if (workbook.author_id !== auth.userId && !roles.includes("administrator"))
    throw new DomainError("Only the draft author or an education administrator can edit this workbook.", 403);

  const caseIds = Array.isArray(payload.caseIds)
    ? [...new Set(payload.caseIds.filter((value): value is string => typeof value === "string").slice(0, 30))]
    : [];
  if (!caseIds.length)
    throw new DomainError("Select at least one published teaching case.", 422);
  const placeholders = caseIds.map(() => "?").join(",");
  const published = await env.DB.prepare(
    `SELECT id FROM cases WHERE status = 'published' AND id IN (${placeholders})`,
  ).bind(...caseIds).all<{ id: string }>();
  if (published.results.length !== caseIds.length)
    throw new DomainError("Every selected case must be a published education case.", 409);

  const mode = String(workbook.mode);
  if (safeText(payload.mode, 30) !== mode)
    throw new DomainError("A workbook mode cannot change after draft creation.", 409);
  const durationMinutes = mode === "assessment"
    ? Math.max(10, Math.min(480, Number(payload.durationMinutes ?? 60)))
    : 0;
  const dualDisplayAllowed = Boolean(payload.dualDisplayAllowed);
  const pollDrafts = mode === "teaching" && Array.isArray(payload.polls)
    ? payload.polls.slice(0, 12).map(validatePollDraft)
    : [];
  const contentDrafts = mode === "teaching" && Array.isArray(payload.teachingBlocks)
    ? payload.teachingBlocks.slice(0, 60).map(validateTeachingContentBlock)
    : [];
  if (pollDrafts.some((poll) => !caseIds.includes(poll.caseId)))
    throw new DomainError("Every live poll must be linked to a selected teaching case.", 422);
  if (contentDrafts.some((block) => !caseIds.includes(block.caseId)))
    throw new DomainError("Every teaching content block must be linked to a selected case.", 422);

  const rawQuestionEdits = Array.isArray(payload.questionEdits)
    ? payload.questionEdits.slice(0, 120)
    : [];
  const questionEdits = rawQuestionEdits.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new DomainError("Question edits must be structured records.", 422);
    const item = value as Record<string, unknown>;
    const unsupported = Object.keys(item).find((key) => !["questionId", "prompt"].includes(key));
    if (unsupported) throw new DomainError(`Question edit contains unsupported field ${unsupported}.`, 422);
    const questionId = safeText(item.questionId, 100).trim();
    const prompt = safeText(item.prompt, 2_000).trim();
    if (!questionId || !prompt)
      throw new DomainError("Every assessment question requires a prompt.", 422);
    return { questionId, prompt };
  });
  if (questionEdits.length) {
    const questionIds = [...new Set(questionEdits.map((item) => item.questionId))];
    if (questionIds.length !== questionEdits.length)
      throw new DomainError("Each assessment question may be edited once per save.", 422);
    const questionPlaceholders = questionIds.map(() => "?").join(",");
    const validQuestions = await env.DB.prepare(
      `SELECT q.id
         FROM questions q
        WHERE q.id IN (${questionPlaceholders})
          AND q.case_id IN (${placeholders})`,
    ).bind(...questionIds, ...caseIds).all<{ id: string }>();
    if (validQuestions.results.length !== questionIds.length)
      throw new DomainError("Every edited question must belong to a selected case.", 422);
  }

  const nextVersion = expectedVersion + 1;
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(`DELETE FROM workbook_cases WHERE workbook_id = ? AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM teaching_polls WHERE workbook_id = ? AND status = 'draft' AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM teaching_content_blocks WHERE workbook_id = ? AND status = 'draft' AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM workbook_draft_question_edits WHERE workbook_id = ? AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(id, id, expectedVersion),
  ];
  caseIds.forEach((caseId, index) => statements.push(
    env.DB.prepare(`INSERT INTO workbook_cases (workbook_id, case_id, position) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(id, caseId, index + 1, id, expectedVersion),
  ));
  pollDrafts.forEach((poll, index) => statements.push(
    env.DB.prepare(`INSERT INTO teaching_polls (id, workbook_id, case_id, prompt, selection_mode, options_json, correct_option_ids_json, explanation, position, version, status, created_by, created_at, updated_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ? WHERE EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(crypto.randomUUID(), id, poll.caseId, poll.prompt, poll.selectionMode, JSON.stringify(poll.options), JSON.stringify(poll.correctOptionIds), poll.explanation, index + 1, nextVersion, auth.userId, now, now, id, expectedVersion),
  ));
  contentDrafts.forEach((block, index) => statements.push(
    env.DB.prepare(`INSERT INTO teaching_content_blocks (id, workbook_id, case_id, type, title, body, url, position, version, status, created_by, created_at, updated_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ? WHERE EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(crypto.randomUUID(), id, block.caseId, block.type, block.title, block.body, block.url, index + 1, nextVersion, auth.userId, now, now, id, expectedVersion),
  ));
  questionEdits.forEach((question) => statements.push(
    env.DB.prepare(`INSERT INTO workbook_draft_question_edits (workbook_id, question_id, prompt, revision, updated_by, updated_at) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND version = ? AND status IN ('draft','changes-requested'))`).bind(id, question.questionId, question.prompt, nextVersion - 1, auth.userId, now, id, expectedVersion),
  ));
  statements.push(
    env.DB.prepare(
      `UPDATE workbooks
          SET title = ?, version = ?, duration_minutes = ?, dual_display_allowed = ?
        WHERE id = ? AND version = ? AND status IN ('draft','changes-requested')`,
    ).bind(title, nextVersion, durationMinutes, dualDisplayAllowed ? 1 : 0, id, expectedVersion),
  );
  const results = await env.DB.batch(statements);
  if (Number(results.at(-1)?.meta.changes ?? 0) !== 1)
    throw new DomainError("This draft changed. Reload it before saving again.", 409);
  await appendAudit(auth.userId, "workbook.draft-updated", "workbook", id, "success", `version=${expectedVersion}->${nextVersion};cases=${caseIds.length};blocks=${contentDrafts.length};polls=${pollDrafts.length};question-edits=${questionEdits.length};dual-display=${dualDisplayAllowed}`);
}

export async function cloneWorkbook(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  await ensureEducationUser(auth);
  await requireRole(auth, "instructor", "examiner", "administrator");
  const sourceId = safeText(payload.id, 100);
  const source = await env.DB.prepare(
    `SELECT id, module_id, title, mode, duration_minutes, dual_display_allowed FROM workbooks WHERE id = ?`,
  )
    .bind(sourceId)
    .first<Row>();
  if (!source) throw new DomainError("Workbook to clone was not found.", 404);
  const caseResult = await env.DB.prepare(
    `SELECT case_id, position FROM workbook_cases WHERE workbook_id = ? ORDER BY position`,
  )
    .bind(sourceId)
    .all<Row>();
  if (!caseResult.results.length)
    throw new DomainError("The source workbook has no reusable cases.", 409);
  const [contentResult, pollResult, questionEditResult] =
    source.mode === "teaching"
      ? await Promise.all([
          env.DB.prepare(
            `SELECT case_id, type, title, body, url, position FROM teaching_content_blocks WHERE workbook_id = ? ORDER BY position, id`,
          )
            .bind(sourceId)
            .all<Row>(),
          env.DB.prepare(
            `SELECT case_id, prompt, selection_mode, options_json, correct_option_ids_json, explanation, position FROM teaching_polls WHERE workbook_id = ? ORDER BY position, id`,
          )
            .bind(sourceId)
            .all<Row>(),
          env.DB.prepare(
            `SELECT question_id, prompt, revision FROM workbook_draft_question_edits WHERE workbook_id = ? ORDER BY question_id`,
          ).bind(sourceId).all<Row>(),
        ])
      : await Promise.all([
          Promise.resolve({ results: [] } as unknown as D1Result<Row>),
          Promise.resolve({ results: [] } as unknown as D1Result<Row>),
          env.DB.prepare(`SELECT question_id, prompt, revision FROM workbook_draft_question_edits WHERE workbook_id = ? ORDER BY question_id`).bind(sourceId).all<Row>(),
        ]);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const title =
    safeText(payload.title, 160).trim() ||
    safeText(`${String(source.title)} copy`, 160);
  const statements = [
    env.DB.prepare(
      `INSERT INTO workbooks (id, module_id, title, mode, version, status, duration_minutes, dual_display_allowed) VALUES (?, ?, ?, ?, 1, 'draft', ?, ?)`,
    ).bind(
      id,
      source.module_id,
      title,
      source.mode,
      source.duration_minutes,
      source.dual_display_allowed,
    ),
    env.DB.prepare(`INSERT INTO workbook_authorship (workbook_id, author_id, created_at) VALUES (?, ?, ?)`).bind(id, auth.userId, now),
  ];
  caseResult.results.forEach((row) =>
    statements.push(
      env.DB.prepare(
        `INSERT INTO workbook_cases (workbook_id, case_id, position) VALUES (?, ?, ?)`,
      ).bind(id, row.case_id, row.position),
    ),
  );
  contentResult.results.forEach((row) =>
    statements.push(
      env.DB.prepare(
        `INSERT INTO teaching_content_blocks (id, workbook_id, case_id, type, title, body, url, position, version, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'draft', ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        row.case_id,
        row.type,
        row.title,
        row.body,
        row.url,
        row.position,
        auth.userId,
        now,
        now,
      ),
    ),
  );
  pollResult.results.forEach((row) =>
    statements.push(
      env.DB.prepare(
        `INSERT INTO teaching_polls (id, workbook_id, case_id, prompt, selection_mode, options_json, correct_option_ids_json, explanation, position, version, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'draft', ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        row.case_id,
        row.prompt,
        row.selection_mode,
        row.options_json,
        row.correct_option_ids_json,
        row.explanation,
        row.position,
        auth.userId,
        now,
        now,
      ),
    ),
  );
  questionEditResult.results.forEach((row) =>
    statements.push(
      env.DB.prepare(
        `INSERT INTO workbook_draft_question_edits (workbook_id, question_id, prompt, revision, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(id, row.question_id, row.prompt, row.revision, auth.userId, now),
    ),
  );
  await env.DB.batch(statements);
  await appendAudit(
    auth.userId,
    "workbook.cloned",
    "workbook",
    id,
    "success",
    `source=${sourceId};mode=${source.mode};cases=${caseResult.results.length};blocks=${contentResult.results.length};polls=${pollResult.results.length};question-edits=${questionEditResult.results.length}`,
  );
}

export async function createAssessmentRecoveryDraft(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  await ensureEducationUser(auth);
  await requireRole(auth, "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id"]);
  const sourceId = safeText(payload.id, 100);
  const source = await env.DB.prepare(
    `SELECT w.id, w.module_id, w.title, w.mode, w.status,
            w.duration_minutes, w.dual_display_allowed,
            av.id AS assessment_version_id, av.integrity_hash
       FROM workbooks w
       JOIN assessment_versions av
         ON av.workbook_id = w.id AND av.version = w.version
      WHERE w.id = ?`,
  ).bind(sourceId).first<Row>();
  if (!source)
    throw new DomainError("Published assessment to recover was not found.", 404);
  if (source.mode !== "assessment" || source.status !== "published")
    throw new DomainError(
      "Only an unavailable published assessment can create a recovery draft.",
      409,
    );

  let integrityFailure = false;
  try {
    await getVerifiedAssessmentManifest(String(source.assessment_version_id));
  } catch (error) {
    if (!(error instanceof AssessmentVersionIntegrityError)) throw error;
    integrityFailure = true;
  }
  if (!integrityFailure)
    throw new DomainError(
      "This assessment is integrity-verified. Use the normal clone action instead.",
      409,
    );

  const cases = await env.DB.prepare(
    `SELECT wc.case_id, wc.position, c.status, c.deidentified,
            c.publication_cleared, c.classification
       FROM workbook_cases wc
       JOIN cases c ON c.id = wc.case_id
      WHERE wc.workbook_id = ?
      ORDER BY wc.position, wc.case_id`,
  ).bind(sourceId).all<Row>();
  if (!cases.results.length)
    throw new DomainError(
      "The unavailable assessment has no current case links to review.",
      409,
    );
  const unsafeCase = cases.results.find(
    (item) =>
      item.status !== "published" ||
      Number(item.deidentified) !== 1 ||
      Number(item.publication_cleared) !== 1 ||
      ["unsupported", "requires-review"].includes(String(item.classification)),
  );
  if (unsafeCase)
    throw new DomainError(
      `Case ${String(unsafeCase.case_id)} must pass publication, de-identification and content review before recovery.`,
      409,
    );

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO workbooks
         (id, module_id, title, mode, version, status,
          duration_minutes, dual_display_allowed)
       VALUES (?, ?, ?, 'assessment', 1, 'draft', ?, ?)`,
    ).bind(
      id,
      source.module_id,
      assessmentRecoveryDraftTitle(String(source.title)),
      source.duration_minutes,
      source.dual_display_allowed,
    ),
    env.DB.prepare(
      `INSERT INTO workbook_authorship
         (workbook_id, author_id, created_at)
       VALUES (?, ?, ?)`,
    ).bind(id, auth.userId, now),
    env.DB.prepare(
      `INSERT INTO workbook_recoveries
         (draft_workbook_id, source_workbook_id, source_assessment_version_id,
          source_integrity_hash, copied_case_ids_json, excluded_evidence_json,
          history_reconstructed, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    ).bind(
      id,
      sourceId,
      source.assessment_version_id,
      source.integrity_hash,
      JSON.stringify(cases.results.map((item) => String(item.case_id))),
      JSON.stringify(ASSESSMENT_RECOVERY_EXCLUSIONS),
      auth.userId,
      now,
    ),
    ...cases.results.map((item) =>
      env.DB.prepare(
        `INSERT INTO workbook_cases (workbook_id, case_id, position)
         VALUES (?, ?, ?)`,
      ).bind(id, item.case_id, item.position),
    ),
  ]);
  await appendAudit(
    auth.userId,
    "workbook.recovery-draft-created",
    "workbook",
    id,
    "success",
    `source-workbook=${sourceId};source-version=${String(source.assessment_version_id)};source-hash=${String(source.integrity_hash)};source-history-not-reconstructed=true;target-schema=${ASSESSMENT_RECOVERY_TARGET_SCHEMA};cases=${cases.results.length};excluded=${ASSESSMENT_RECOVERY_EXCLUSIONS.join(",")};peer-review-required=true`,
  );
}

export async function convertTeachingWorkbookToExam(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  await ensureEducationUser(auth);
  await requireRole(auth, "instructor", "examiner", "administrator");
  const sourceId = safeText(payload.id, 100);
  const source = await env.DB.prepare(
    `SELECT id, module_id, title, mode FROM workbooks WHERE id = ?`,
  )
    .bind(sourceId)
    .first<Row>();
  if (!source) throw new DomainError("Teaching workbook was not found.", 404);
  if (source.mode !== "teaching")
    throw new DomainError("Only a teaching workbook can be converted to an exam.", 409);
  const cases = await env.DB.prepare(
    `SELECT case_id, position FROM workbook_cases WHERE workbook_id = ? ORDER BY position`,
  )
    .bind(sourceId)
    .all<Row>();
  if (!cases.results.length)
    throw new DomainError("The teaching workbook has no reusable cases.", 409);
  const id = crypto.randomUUID();
  const title =
    safeText(payload.title, 160).trim() ||
    safeText(`${String(source.title)} assessment`, 160);
  const duration = Math.max(10, Math.min(480, Number(payload.durationMinutes ?? 60)));
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO workbooks (id, module_id, title, mode, version, status, duration_minutes, dual_display_allowed) VALUES (?, ?, ?, 'assessment', 1, 'draft', ?, 0)`,
    ).bind(id, source.module_id, title, duration),
    env.DB.prepare(`INSERT INTO workbook_authorship (workbook_id, author_id, created_at) VALUES (?, ?, ?)`).bind(id, auth.userId, new Date().toISOString()),
    ...cases.results.map((row) =>
      env.DB.prepare(
        `INSERT INTO workbook_cases (workbook_id, case_id, position) VALUES (?, ?, ?)`,
      ).bind(id, row.case_id, row.position),
    ),
  ]);
  await appendAudit(
    auth.userId,
    "workbook.converted-to-exam",
    "workbook",
    id,
    "success",
    `source=${sourceId};copied=cases-only;teaching-content=excluded;poll-answers=excluded;model-answers=excluded`,
  );
}

export async function requestWorkbookReview(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id"]);
  const id = safeText(payload.id, 100);
  const workbook = await env.DB.prepare(`SELECT status FROM workbooks WHERE id = ?`).bind(id).first<{ status: string }>();
  if (!workbook) throw new DomainError("Workbook draft not found.", 404);
  if (!["draft", "changes-requested"].includes(workbook.status)) throw new DomainError("Only an editable workbook can be sent for review.", 409);
  const caseCount = await env.DB.prepare(`SELECT COUNT(*) AS count FROM workbook_cases WHERE workbook_id = ?`).bind(id).first<{ count: number }>();
  if (!caseCount?.count) throw new DomainError("Select at least one case before review.", 409);
  await env.DB.prepare(`UPDATE workbooks SET status = 'in-review' WHERE id = ? AND status IN ('draft','changes-requested')`).bind(id).run();
  await appendAudit(auth.userId, "workbook.review-requested", "workbook", id, "success", `cases=${caseCount.count}`);
}

export async function reviewWorkbook(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id", "decision", "comment"]);
  const id = safeText(payload.id, 100);
  const decision = safeText(payload.decision, 30);
  const comment = safeText(payload.comment, 2_000).trim();
  if (!new Set(["approved", "changes-requested"]).has(decision) || !comment)
    throw new DomainError("Choose a review decision and record a bounded review comment.", 422);
  const workbook = await env.DB.prepare(`SELECT w.status, wa.author_id FROM workbooks w LEFT JOIN workbook_authorship wa ON wa.workbook_id = w.id WHERE w.id = ?`).bind(id).first<Row>();
  if (!workbook) throw new DomainError("Workbook was not found.", 404);
  if (workbook.status !== "in-review") throw new DomainError("This workbook is not awaiting peer review.", 409);
  if (workbook.author_id === auth.userId) throw new DomainError("Peer review must be completed by a different education user.", 403);
  const latest = await env.DB.prepare(`SELECT revision FROM workbook_reviews WHERE workbook_id = ? ORDER BY revision DESC LIMIT 1`).bind(id).first<{ revision: number }>();
  const revision = (latest?.revision ?? 0) + 1;
  const createdAt = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO workbook_reviews (id, workbook_id, reviewer_id, decision, comment, revision, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), id, auth.userId, decision, comment, revision, createdAt),
    env.DB.prepare(`UPDATE workbooks SET status = ? WHERE id = ? AND status = 'in-review'`).bind(decision, id),
  ]);
  await appendAudit(auth.userId, `workbook.review-${decision}`, "workbook", id, "success", `revision=${revision};reviewer-separated=true`);
}

export async function publishWorkbook(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id"]);
  const id = safeText(payload.id, 100);
  const workbook = await env.DB.prepare(`SELECT id, title, mode, version, status, duration_minutes, dual_display_allowed FROM workbooks WHERE id = ?`).bind(id).first<Row>();
  if (!workbook) throw new DomainError("Workbook draft not found.", 404);
  if (workbook.status !== "approved") throw new DomainError("A separate education peer reviewer must approve this workbook before publication.", 409);
  const pollDefinitions = await env.DB.prepare(`SELECT id, case_id, prompt, selection_mode, options_json, correct_option_ids_json, explanation, position, version FROM teaching_polls WHERE workbook_id = ? AND status = 'draft' ORDER BY position, id`).bind(id).all<Row>();
  const contentDefinitions = await env.DB.prepare(`SELECT id, case_id, type, title, body, url, position, version FROM teaching_content_blocks WHERE workbook_id = ? AND status = 'draft' ORDER BY position, id`).bind(id).all<Row>();
  let frozenVersion: Awaited<ReturnType<typeof buildAssessmentManifestFromDatabase>>;
  try {
    frozenVersion = await buildAssessmentManifestFromDatabase(
      id,
      EDUCATION_VIEWER_CORE_VERSION,
      {
        teachingContent: contentDefinitions.results,
        teachingPolls: pollDefinitions.results,
      },
    );
  } catch (error) {
    throw new DomainError(
      error instanceof Error
        ? `Workbook publication manifest is invalid: ${error.message}`
        : "Workbook publication manifest is invalid.",
      422,
    );
  }
  const publishedAt = new Date().toISOString();
  const versionId = `version:${id}:${Number(workbook.version)}`;
  const published = await env.DB.batch([
    env.DB.prepare(`UPDATE workbooks SET status = 'published' WHERE id = ? AND status = 'approved'`).bind(id),
    env.DB.prepare(`INSERT INTO assessment_versions (id, workbook_id, version, integrity_hash, manifest_json, viewer_core_version, published_at, status, dual_display_allowed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(versionId, id, Number(workbook.version), frozenVersion.integrityHash, frozenVersion.manifestJson, EDUCATION_VIEWER_CORE_VERSION, publishedAt, "published", frozenVersion.manifest.assessment.displayPolicy.dualDisplayAllowed ? 1 : 0),
    env.DB.prepare(`UPDATE teaching_polls SET status = 'published', updated_at = ? WHERE workbook_id = ? AND status = 'draft'`).bind(publishedAt, id),
    env.DB.prepare(`UPDATE teaching_content_blocks SET status = 'published', updated_at = ? WHERE workbook_id = ? AND status = 'draft'`).bind(publishedAt, id),
  ]);
  if (Number(published[0]?.meta.changes ?? 0) !== 1)
    throw new DomainError("The workbook changed while its immutable version was being published.", 409);
  await appendAudit(auth.userId, "workbook.published", "workbook", id, "success", `mode=${workbook.mode};version=${Number(workbook.version)};hash=${frozenVersion.integrityHash};manifest-schema=${frozenVersion.manifest.schema};teaching-polls=${pollDefinitions.results.length};teaching-content=${contentDefinitions.results.length}`);
}

export async function deleteWorkbookDraft(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id", "expectedVersion", "confirmation"]);
  const id = safeText(payload.id, 100); const expectedVersion = Number(payload.expectedVersion);
  if (payload.confirmation !== "DELETE" || !Number.isInteger(expectedVersion) || expectedVersion < 1)
    throw new DomainError("Type DELETE to confirm permanent draft removal.", 422);
  const workbook = await env.DB.prepare(`SELECT w.title, w.status, w.version, wa.author_id FROM workbooks w LEFT JOIN workbook_authorship wa ON wa.workbook_id = w.id WHERE w.id = ?`).bind(id).first<Row>();
  if (!workbook) throw new DomainError("Workbook draft not found.", 404);
  if (workbook.status !== "draft" || Number(workbook.version) !== expectedVersion)
    throw new DomainError("Only an unchanged draft that has never entered review can be permanently deleted.", 409);
  const roles = await rolesFor(auth.userId);
  if (workbook.author_id && workbook.author_id !== auth.userId && !roles.includes("administrator"))
    throw new DomainError("Only the draft author or an education administrator can delete this workbook.", 403);
  const links = await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM assessment_versions WHERE workbook_id = ?) AS versions,
    (SELECT COUNT(*) FROM workbook_assignments WHERE workbook_id = ?) AS assignments,
    (SELECT COUNT(*) FROM workbook_assignment_rules WHERE prerequisite_workbook_id = ?) AS prerequisite_assignments,
    (SELECT COUNT(*) FROM cohort_workbook_assignments WHERE workbook_id = ?) AS cohort_assignments,
    (SELECT COUNT(*) FROM cohort_workbook_assignments WHERE prerequisite_workbook_id = ?) AS prerequisite_cohort_assignments,
    (SELECT COUNT(*) FROM teaching_sessions WHERE workbook_id = ?) AS sessions,
    (SELECT COUNT(*) FROM teaching_poll_runs r JOIN teaching_polls p ON p.id = r.poll_id WHERE p.workbook_id = ?) AS poll_runs,
    (SELECT COUNT(*) FROM instructor_presentations WHERE scope_type = 'workbook' AND scope_id = ?) AS presentations,
    (SELECT COUNT(*) FROM learner_accommodations WHERE workbook_id = ?) AS accommodations,
    (SELECT COUNT(*) FROM workbook_case_progress WHERE workbook_id = ?) AS case_progress,
    (SELECT COUNT(*) FROM workbook_progress WHERE workbook_id = ?) AS progress,
    (SELECT COUNT(*) FROM workbook_reviews WHERE workbook_id = ?) AS reviews`).bind(id, id, id, id, id, id, id, id, id, id, id, id).first<Row>();
  if (!links || Object.values(links).some((value) => Number(value) > 0))
    throw new DomainError("This draft has governed activity and cannot be permanently deleted. Retain it for audit or complete its current workflow.", 409);
  const deleted = await env.DB.batch([
    env.DB.prepare(`DELETE FROM teaching_content_blocks WHERE workbook_id = ? AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = 'draft' AND version = ?)`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM teaching_polls WHERE workbook_id = ? AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = 'draft' AND version = ?)`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM workbook_draft_question_edits WHERE workbook_id = ? AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = 'draft' AND version = ?)`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM workbook_cases WHERE workbook_id = ? AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = 'draft' AND version = ?)`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM workbook_authorship WHERE workbook_id = ? AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = 'draft' AND version = ?)`).bind(id, id, expectedVersion),
    env.DB.prepare(`DELETE FROM workbooks WHERE id = ? AND status = 'draft' AND version = ?`).bind(id, expectedVersion),
  ]);
  if (Number(deleted.at(-1)?.meta.changes ?? 0) !== 1)
    throw new DomainError("The draft changed before it could be deleted. Refresh and review the current version.", 409);
  await appendAudit(auth.userId, "workbook.draft-deleted", "workbook", id, "success", `title=${safeText(workbook.title, 160)};version=${expectedVersion};no-governed-activity=true`);
}

export async function retirePublishedWorkbook(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id", "expectedVersion", "disposition", "reason"]);
  const id = safeText(payload.id, 100); const expectedVersion = Number(payload.expectedVersion);
  const disposition = safeText(payload.disposition, 30); const reason = safeText(payload.reason, 1_000).trim();
  if (!new Set(["archived", "withdrawn"]).has(disposition) || !reason || !Number.isInteger(expectedVersion) || expectedVersion < 1)
    throw new DomainError("Choose archive or withdrawal and record a reason.", 422);
  const workbook = await env.DB.prepare(`SELECT id, title, status, version FROM workbooks WHERE id = ?`).bind(id).first<Row>();
  if (!workbook) throw new DomainError("Published workbook not found.", 404);
  if (workbook.status !== "published" || Number(workbook.version) !== expectedVersion)
    throw new DomainError("Only the current published workbook can be archived or withdrawn.", 409);
  const dependencies = await env.DB.prepare(`SELECT
    (SELECT COUNT(*)
       FROM workbook_assignment_rules r
       JOIN workbook_assignments a ON a.id = r.assignment_id
      WHERE r.prerequisite_workbook_id = ? AND a.status = 'active') +
    (SELECT COUNT(*)
       FROM cohort_workbook_assignments ca
       JOIN cohorts c ON c.id = ca.cohort_id
      WHERE ca.prerequisite_workbook_id = ? AND ca.status = 'active' AND c.status = 'active') AS count`).bind(id, id).first<{ count: number }>();
  if (Number(dependencies?.count ?? 0) > 0)
    throw new DomainError("Remove this workbook from active prerequisite rules before retiring it.", 409);
  const activity = await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM teaching_sessions WHERE workbook_id = ? AND state = 'live') AS live_sessions,
    (SELECT COUNT(*) FROM attempts a JOIN assessment_versions av ON av.id = a.assessment_version_id WHERE av.workbook_id = ? AND a.state IN ('assigned','in-progress','reopened','expired','submitting')) AS open_attempts,
    (SELECT COUNT(*) FROM workbook_assignments WHERE workbook_id = ? AND status = 'active') AS assignments,
    (SELECT COUNT(*) FROM cohort_workbook_assignments WHERE workbook_id = ? AND status = 'active') AS cohort_assignments`).bind(id, id, id, id).first<Row>();
  if (disposition === "archived" && (Number(activity?.live_sessions ?? 0) > 0 || Number(activity?.open_attempts ?? 0) > 0))
    throw new DomainError("End live teaching and open attempts before routine archival. Use governed withdrawal only for an urgent access stop.", 409);
  const retiredAt = new Date().toISOString();
  const retirementStatements = [
    env.DB.prepare(`UPDATE workbooks SET status = ? WHERE id = ? AND status = 'published' AND version = ?`).bind(disposition, id, expectedVersion),
    env.DB.prepare(`UPDATE workbook_assignments SET status = 'revoked', revoked_at = ?, version = version + 1 WHERE workbook_id = ? AND status = 'active' AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = ? AND version = ?)`).bind(retiredAt, id, id, disposition, expectedVersion),
    env.DB.prepare(`UPDATE cohort_workbook_assignments SET status = 'revoked', revoked_at = ?, version = version + 1 WHERE workbook_id = ? AND status = 'active' AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = ? AND version = ?)`).bind(retiredAt, id, id, disposition, expectedVersion),
    env.DB.prepare(`UPDATE teaching_poll_runs SET state = 'closed', closed_at = ?, version = version + 1 WHERE poll_id IN (SELECT id FROM teaching_polls WHERE workbook_id = ?) AND state = 'open' AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = ? AND version = ?)`).bind(retiredAt, id, id, disposition, expectedVersion),
    env.DB.prepare(`UPDATE teaching_sessions SET state = 'ended', ended_at = ?, updated_at = ?, version = version + 1 WHERE workbook_id = ? AND state = 'live' AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = ? AND version = ?)`).bind(retiredAt, retiredAt, id, id, disposition, expectedVersion),
  ];
  if (disposition === "withdrawn")
    retirementStatements.push(
      env.DB.prepare(
        `UPDATE attempts
            SET state = 'voided'
          WHERE assessment_version_id IN (SELECT id FROM assessment_versions WHERE workbook_id = ?)
            AND state IN ('assigned','in-progress','reopened','expired','submitting')
            AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.attempt_id = attempts.id)
            AND EXISTS (SELECT 1 FROM workbooks WHERE id = ? AND status = 'withdrawn' AND version = ?)`,
      ).bind(id, id, expectedVersion),
    );
  const retired = await env.DB.batch(retirementStatements);
  if (Number(retired[0]?.meta.changes ?? 0) !== 1)
    throw new DomainError("The published workbook changed before it could be retired. Refresh and review the current version.", 409);
  const attemptsVoided = disposition === "withdrawn" ? Number(retired[5]?.meta.changes ?? 0) : 0;
  await appendAudit(auth.userId, `workbook.${disposition}`, "workbook", id, "success", `title=${safeText(workbook.title, 160)};version=${expectedVersion};retirement=${disposition === "withdrawn" ? "urgent-withdrawal" : "routine-archive"};reason=${reason};assignments-revoked=${Number(retired[1]?.meta.changes ?? 0)};cohort-assignments-revoked=${Number(retired[2]?.meta.changes ?? 0)};attempts-voided=${attemptsVoided};evidence-preserved=true`);
}

export async function assignWorkbook(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "targetWorkbookId", "learnerId", "availableFrom", "dueAt", "expiresAt", "prerequisiteWorkbookId", "prerequisiteMinPercent", "expectedVersion"]);
  const workbookId = safeText(payload.targetWorkbookId, 100);
  const learnerId = safeText(payload.learnerId, 140);
  const expectedVersion = Number(payload.expectedVersion ?? 0);
  if (!workbookId || !learnerId || !Number.isInteger(expectedVersion) || expectedVersion < 0)
    throw new DomainError("Choose a published workbook and candidate with a valid assignment version.", 422);
  const workbook = await env.DB.prepare(`SELECT w.id FROM workbooks w JOIN modules m ON m.id = w.module_id WHERE w.id = ? AND w.status = 'published' AND m.course_id = ?`).bind(workbookId, "course-advanced-imaging").first();
  if (!workbook) throw new DomainError("Only a published course workbook can be assigned.", 409);
  const learner = await env.DB.prepare(`SELECT u.roles FROM users u JOIN enrolments e ON e.user_id = u.id WHERE u.id = ? AND e.course_id = ? AND e.status = 'active'`).bind(learnerId, "course-advanced-imaging").first<{ roles: string }>();
  if (!learner?.roles.split(",").includes("learner"))
    throw new DomainError("The selected account is not an active learner on this course.", 409);
  const current = await env.DB.prepare(`SELECT id, version FROM workbook_assignments WHERE workbook_id = ? AND learner_id = ?`).bind(workbookId, learnerId).first<{ id: string; version: number }>();
  if ((current?.version ?? 0) !== expectedVersion)
    throw new DomainError("A newer workbook assignment exists. Refresh before changing access.", 409);
  const availableFrom = optionalIso(payload.availableFrom, "The release date");
  const dueAt = optionalIso(payload.dueAt, "The workbook due date");
  const expiresAt = optionalIso(payload.expiresAt, "The access expiry date");
  if (!validateAssignmentWindow(availableFrom, dueAt, expiresAt))
    throw new DomainError("Release, due and expiry dates must be in chronological order.", 422);
  const prerequisiteWorkbookId = safeText(payload.prerequisiteWorkbookId, 100).trim() || null;
  const prerequisiteMinPercent = Math.max(1, Math.min(100, Number(payload.prerequisiteMinPercent ?? 100)));
  if (!Number.isInteger(prerequisiteMinPercent)) throw new DomainError("Prerequisite completion must be a whole percentage.", 422);
  if (prerequisiteWorkbookId === workbookId) throw new DomainError("A workbook cannot be its own prerequisite.", 422);
  if (prerequisiteWorkbookId) {
    const prerequisite = await env.DB.prepare(`SELECT id FROM workbooks WHERE id = ? AND status = 'published'`).bind(prerequisiteWorkbookId).first();
    if (!prerequisite) throw new DomainError("Choose a published prerequisite workbook.", 422);
  }
  const id = current?.id ?? crypto.randomUUID();
  const nextVersion = expectedVersion + 1;
  const assignedAt = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO workbook_assignments (id, workbook_id, learner_id, status, assigned_by, assigned_at, due_at, revoked_at, version) VALUES (?, ?, ?, 'active', ?, ?, ?, NULL, ?) ON CONFLICT(workbook_id, learner_id) DO UPDATE SET status = 'active', assigned_by = excluded.assigned_by, assigned_at = excluded.assigned_at, due_at = excluded.due_at, revoked_at = NULL, version = excluded.version`).bind(id, workbookId, learnerId, auth.userId, assignedAt, dueAt, nextVersion),
    env.DB.prepare(`INSERT INTO workbook_assignment_rules (assignment_id, available_from, expires_at, prerequisite_workbook_id, prerequisite_min_percent, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(assignment_id) DO UPDATE SET available_from = excluded.available_from, expires_at = excluded.expires_at, prerequisite_workbook_id = excluded.prerequisite_workbook_id, prerequisite_min_percent = excluded.prerequisite_min_percent, updated_at = excluded.updated_at`).bind(id, availableFrom, expiresAt, prerequisiteWorkbookId, prerequisiteMinPercent, assignedAt),
  ]);
  await appendAudit(auth.userId, "workbook-assignment.assigned", "workbook-assignment", id, "success", `workbook=${workbookId};learner=${learnerId};version=${nextVersion};release=${availableFrom ?? "now"};due=${dueAt ?? "none"};expiry=${expiresAt ?? "none"};prerequisite=${prerequisiteWorkbookId ?? "none"}@${prerequisiteMinPercent}`);
}

export async function revokeWorkbookAssignment(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "assignmentId", "expectedVersion"]);
  const id = safeText(payload.assignmentId, 140);
  const expectedVersion = Number(payload.expectedVersion);
  if (!id || !Number.isInteger(expectedVersion) || expectedVersion < 1)
    throw new DomainError("A valid active assignment version is required.", 422);
  const current = await env.DB.prepare(`SELECT id, workbook_id, learner_id, status, version FROM workbook_assignments WHERE id = ?`).bind(id).first<Row>();
  if (!current) throw new DomainError("Workbook assignment not found.", 404);
  if (current.status !== "active" || Number(current.version) !== expectedVersion)
    throw new DomainError("A newer workbook assignment exists. Refresh before changing access.", 409);
  const revokedAt = new Date().toISOString();
  await env.DB.prepare(`UPDATE workbook_assignments SET status = 'revoked', revoked_at = ?, version = ? WHERE id = ? AND status = 'active' AND version = ?`).bind(revokedAt, expectedVersion + 1, id, expectedVersion).run();
  await appendAudit(auth.userId, "workbook-assignment.revoked", "workbook-assignment", id, "success", `workbook=${String(current.workbook_id)};learner=${String(current.learner_id)};version=${expectedVersion + 1}`);
}

export async function createCohort(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "title", "code"]);
  const title = safeText(payload.title, 120).trim();
  const code = safeText(payload.code, 24).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!title || code.length < 2) throw new DomainError("A cohort name and short alphanumeric code are required.", 422);
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString();
  try {
    await env.DB.prepare(`INSERT INTO cohorts (id, course_id, title, code, status, created_by, created_at, version) VALUES (?, ?, ?, ?, 'active', ?, ?, 1)`).bind(id, "course-advanced-imaging", title, code, auth.userId, createdAt).run();
  } catch { throw new DomainError("That cohort code is already in use for this course.", 409); }
  await appendAudit(auth.userId, "cohort.created", "cohort", id, "success", `code=${code}`);
}

export async function addCohortMember(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "cohortId", "learnerId", "expectedVersion"]);
  const cohortId = safeText(payload.cohortId, 100); const learnerId = safeText(payload.learnerId, 140); const expectedVersion = Number(payload.expectedVersion ?? 0);
  const cohort = await env.DB.prepare(`SELECT id FROM cohorts WHERE id = ? AND course_id = ? AND status = 'active'`).bind(cohortId, "course-advanced-imaging").first();
  const learner = await env.DB.prepare(`SELECT u.id FROM users u JOIN enrolments e ON e.user_id = u.id WHERE u.id = ? AND e.course_id = ? AND e.status = 'active' AND (',' || u.roles || ',') LIKE '%,learner,%'`).bind(learnerId, "course-advanced-imaging").first();
  if (!cohort || !learner) throw new DomainError("Choose an active course cohort and learner.", 422);
  const current = await env.DB.prepare(`SELECT version FROM cohort_members WHERE cohort_id = ? AND learner_id = ?`).bind(cohortId, learnerId).first<{ version: number }>();
  if ((current?.version ?? 0) !== expectedVersion) throw new DomainError("A newer cohort membership exists. Refresh before changing it.", 409);
  const nextVersion = expectedVersion + 1; const addedAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO cohort_members (cohort_id, learner_id, status, added_by, added_at, version) VALUES (?, ?, 'active', ?, ?, ?) ON CONFLICT(cohort_id, learner_id) DO UPDATE SET status = 'active', added_by = excluded.added_by, added_at = excluded.added_at, version = excluded.version`).bind(cohortId, learnerId, auth.userId, addedAt, nextVersion).run();
  await appendAudit(auth.userId, "cohort.member-added", "cohort", cohortId, "success", `learner=${learnerId};version=${nextVersion}`);
}

export async function removeCohortMember(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "cohortId", "learnerId", "expectedVersion"]);
  const cohortId = safeText(payload.cohortId, 100); const learnerId = safeText(payload.learnerId, 140); const expectedVersion = Number(payload.expectedVersion);
  const current = await env.DB.prepare(`SELECT version, status FROM cohort_members WHERE cohort_id = ? AND learner_id = ?`).bind(cohortId, learnerId).first<{ version: number; status: string }>();
  if (!current || current.status !== "active" || current.version !== expectedVersion) throw new DomainError("A newer cohort membership exists. Refresh before changing it.", 409);
  await env.DB.prepare(`UPDATE cohort_members SET status = 'removed', version = ? WHERE cohort_id = ? AND learner_id = ? AND version = ?`).bind(expectedVersion + 1, cohortId, learnerId, expectedVersion).run();
  await appendAudit(auth.userId, "cohort.member-removed", "cohort", cohortId, "success", `learner=${learnerId};version=${expectedVersion + 1}`);
}

export async function assignCohortWorkbook(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "targetWorkbookId", "cohortId", "availableFrom", "dueAt", "expiresAt", "prerequisiteWorkbookId", "prerequisiteMinPercent", "expectedVersion"]);
  const workbookId = safeText(payload.targetWorkbookId, 100); const cohortId = safeText(payload.cohortId, 100); const expectedVersion = Number(payload.expectedVersion ?? 0);
  const workbook = await env.DB.prepare(`SELECT w.id FROM workbooks w JOIN modules m ON m.id = w.module_id WHERE w.id = ? AND w.status = 'published' AND m.course_id = ?`).bind(workbookId, "course-advanced-imaging").first();
  const cohort = await env.DB.prepare(`SELECT id FROM cohorts WHERE id = ? AND course_id = ? AND status = 'active'`).bind(cohortId, "course-advanced-imaging").first();
  if (!workbook || !cohort) throw new DomainError("Choose a published workbook and active course cohort.", 422);
  const current = await env.DB.prepare(`SELECT id, version FROM cohort_workbook_assignments WHERE cohort_id = ? AND workbook_id = ?`).bind(cohortId, workbookId).first<{ id: string; version: number }>();
  if ((current?.version ?? 0) !== expectedVersion) throw new DomainError("A newer cohort assignment exists. Refresh before changing it.", 409);
  const availableFrom = optionalIso(payload.availableFrom, "The release date"); const dueAt = optionalIso(payload.dueAt, "The due date"); const expiresAt = optionalIso(payload.expiresAt, "The expiry date");
  if (!validateAssignmentWindow(availableFrom, dueAt, expiresAt)) throw new DomainError("Release, due and expiry dates must be in chronological order.", 422);
  const prerequisiteWorkbookId = safeText(payload.prerequisiteWorkbookId, 100).trim() || null;
  const prerequisiteMinPercent = Math.max(1, Math.min(100, Number(payload.prerequisiteMinPercent ?? 100)));
  if (!Number.isInteger(prerequisiteMinPercent) || prerequisiteWorkbookId === workbookId) throw new DomainError("Choose a valid prerequisite and completion percentage.", 422);
  if (prerequisiteWorkbookId && !(await env.DB.prepare(`SELECT id FROM workbooks WHERE id = ? AND status = 'published'`).bind(prerequisiteWorkbookId).first())) throw new DomainError("Choose a published prerequisite workbook.", 422);
  const id = current?.id ?? crypto.randomUUID(); const version = expectedVersion + 1; const assignedAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO cohort_workbook_assignments (id, cohort_id, workbook_id, status, assigned_by, assigned_at, available_from, due_at, expires_at, prerequisite_workbook_id, prerequisite_min_percent, revoked_at, version) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, NULL, ?) ON CONFLICT(cohort_id, workbook_id) DO UPDATE SET status = 'active', assigned_by = excluded.assigned_by, assigned_at = excluded.assigned_at, available_from = excluded.available_from, due_at = excluded.due_at, expires_at = excluded.expires_at, prerequisite_workbook_id = excluded.prerequisite_workbook_id, prerequisite_min_percent = excluded.prerequisite_min_percent, revoked_at = NULL, version = excluded.version`).bind(id, cohortId, workbookId, auth.userId, assignedAt, availableFrom, dueAt, expiresAt, prerequisiteWorkbookId, prerequisiteMinPercent, version).run();
  await appendAudit(auth.userId, "cohort.workbook-assigned", "cohort", cohortId, "success", `workbook=${workbookId};version=${version};release=${availableFrom ?? "now"};expiry=${expiresAt ?? "none"};prerequisite=${prerequisiteWorkbookId ?? "none"}@${prerequisiteMinPercent}`);
}

export async function revokeCohortWorkbookAssignment(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "assignmentId", "expectedVersion"]);
  const id = safeText(payload.assignmentId, 140); const expectedVersion = Number(payload.expectedVersion);
  const current = await env.DB.prepare(`SELECT cohort_id, workbook_id, status, version FROM cohort_workbook_assignments WHERE id = ?`).bind(id).first<Row>();
  if (!current || current.status !== "active" || Number(current.version) !== expectedVersion) throw new DomainError("A newer cohort assignment exists. Refresh before changing it.", 409);
  const revokedAt = new Date().toISOString();
  await env.DB.prepare(`UPDATE cohort_workbook_assignments SET status = 'revoked', revoked_at = ?, version = ? WHERE id = ? AND version = ?`).bind(revokedAt, expectedVersion + 1, id, expectedVersion).run();
  await appendAudit(auth.userId, "cohort.workbook-revoked", "cohort", String(current.cohort_id), "success", `workbook=${String(current.workbook_id)};version=${expectedVersion + 1}`);
}

export async function requestAccommodation(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "instructor", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "targetWorkbookId", "learnerId", "extraTimeMinutes", "restBreakMinutes", "reason", "expectedVersion"]);
  const workbookId = safeText(payload.targetWorkbookId, 100); const learnerId = safeText(payload.learnerId, 140); const reason = safeText(payload.reason, 1_000).trim();
  const extraTimeMinutes = Number(payload.extraTimeMinutes); const restBreakMinutes = Number(payload.restBreakMinutes ?? 0); const expectedVersion = Number(payload.expectedVersion ?? 0);
  if (!reason || !Number.isInteger(extraTimeMinutes) || extraTimeMinutes < 0 || extraTimeMinutes > 240 || !Number.isInteger(restBreakMinutes) || restBreakMinutes < 0 || restBreakMinutes > 120) throw new DomainError("Record a reason and valid approved-adjustment request.", 422);
  const target = await env.DB.prepare(`SELECT w.id FROM workbooks w JOIN modules m ON m.id = w.module_id JOIN enrolments e ON e.course_id = m.course_id AND e.user_id = ? WHERE w.id = ? AND w.mode = 'assessment' AND w.status = 'published' AND e.status = 'active'`).bind(learnerId, workbookId).first();
  if (!target) throw new DomainError("Choose an enrolled learner and published exam workbook.", 422);
  const current = await env.DB.prepare(`SELECT id, version FROM learner_accommodations WHERE workbook_id = ? AND learner_id = ?`).bind(workbookId, learnerId).first<{ id: string; version: number }>();
  if ((current?.version ?? 0) !== expectedVersion) throw new DomainError("A newer accommodation decision exists. Refresh before changing it.", 409);
  const id = current?.id ?? crypto.randomUUID(); const requestedAt = new Date().toISOString(); const version = expectedVersion + 1;
  await env.DB.prepare(`INSERT INTO learner_accommodations (id, workbook_id, learner_id, extra_time_minutes, rest_break_minutes, reason, status, requested_by, approved_by, requested_at, approved_at, revoked_at, version) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?, NULL, NULL, ?) ON CONFLICT(workbook_id, learner_id) DO UPDATE SET extra_time_minutes = excluded.extra_time_minutes, rest_break_minutes = excluded.rest_break_minutes, reason = excluded.reason, status = 'pending', requested_by = excluded.requested_by, requested_at = excluded.requested_at, approved_by = NULL, approved_at = NULL, revoked_at = NULL, version = excluded.version`).bind(id, workbookId, learnerId, extraTimeMinutes, restBreakMinutes, reason, auth.userId, requestedAt, version).run();
  await appendAudit(auth.userId, "accommodation.requested", "accommodation", id, "success", `workbook=${workbookId};learner=${learnerId};extra=${extraTimeMinutes};breaks=${restBreakMinutes};version=${version}`);
}

export async function approveAccommodation(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id", "expectedVersion"]);
  const id = safeText(payload.id, 140); const expectedVersion = Number(payload.expectedVersion);
  const accommodation = await env.DB.prepare(`SELECT la.workbook_id, la.learner_id, la.extra_time_minutes, la.status, la.version, av.id AS assessment_version_id FROM learner_accommodations la JOIN workbooks w ON w.id = la.workbook_id JOIN assessment_versions av ON av.workbook_id = w.id AND av.version = w.version WHERE la.id = ?`).bind(id).first<Row>();
  if (!accommodation || accommodation.status !== "pending" || Number(accommodation.version) !== expectedVersion) throw new DomainError("A newer accommodation decision exists. Refresh before approval.", 409);
  let assessmentVersion: VerifiedAssessmentVersion;
  try {
    assessmentVersion = await getVerifiedAssessmentManifest(String(accommodation.assessment_version_id));
  } catch {
    throw new DomainError("This assessment version failed its immutable content integrity check.", 503);
  }
  const approvedAt = new Date().toISOString(); const nextVersion = expectedVersion + 1;
  const attempt = await env.DB.prepare(`SELECT id, started_at FROM attempts WHERE user_id = ? AND assessment_version_id = ? AND state IN ('in-progress','reopened') ORDER BY started_at DESC LIMIT 1`).bind(accommodation.learner_id, accommodation.assessment_version_id).first<{ id: string; started_at: string }>();
  const statements = [env.DB.prepare(`UPDATE learner_accommodations SET status = 'approved', approved_by = ?, approved_at = ?, revoked_at = NULL, version = ? WHERE id = ? AND status = 'pending' AND version = ?`).bind(auth.userId, approvedAt, nextVersion, id, expectedVersion)];
  if (attempt) {
    const deadline = new Date(Date.parse(attempt.started_at) + (assessmentVersion.manifest.assessment.durationMinutes + Number(accommodation.extra_time_minutes)) * 60_000).toISOString();
    statements.push(env.DB.prepare(`UPDATE attempts SET accommodation_minutes = ?, deadline_at = ? WHERE id = ? AND state IN ('in-progress','reopened')`).bind(accommodation.extra_time_minutes, deadline, attempt.id));
  }
  await env.DB.batch(statements);
  await appendAudit(auth.userId, "accommodation.approved", "accommodation", id, "success", `extra=${Number(accommodation.extra_time_minutes)};version=${nextVersion};open-attempt-updated=${Boolean(attempt)}`);
}

export async function revokeAccommodation(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "id", "expectedVersion"]);
  const id = safeText(payload.id, 140); const expectedVersion = Number(payload.expectedVersion);
  const current = await env.DB.prepare(`SELECT status, version FROM learner_accommodations WHERE id = ?`).bind(id).first<{ status: string; version: number }>();
  if (!current || !["pending", "approved"].includes(current.status) || current.version !== expectedVersion) throw new DomainError("A newer accommodation decision exists. Refresh before revocation.", 409);
  await env.DB.prepare(`UPDATE learner_accommodations SET status = 'revoked', revoked_at = ?, version = ? WHERE id = ? AND version = ?`).bind(new Date().toISOString(), expectedVersion + 1, id, expectedVersion).run();
  await appendAudit(auth.userId, "accommodation.revoked", "accommodation", id, "success", `version=${expectedVersion + 1};started-attempt-not-shortened=true`);
}

export async function recordDisplayLaunch(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth);
  const mode = safeText(payload.mode, 20); const caseId = safeText(payload.caseId, 100);
  if (!new Set(["teaching", "exam"]).has(mode)) throw new DomainError("Invalid display mode.");
  const workbookId = safeText(payload.selectedWorkbookId, 100) || "workbook-assessment";
  const roles = await rolesFor(auth.userId);
  if (!(await canAccessPublishedWorkbook(auth.userId, roles, workbookId)))
    throw new DomainError("This workbook is not allocated to your education account.", 403);
  if (mode === "exam") {
    const version = await env.DB.prepare(`SELECT av.id FROM assessment_versions av JOIN workbooks w ON w.id = av.workbook_id AND w.version = av.version WHERE w.id = ? AND w.mode = 'assessment' AND w.status = 'published'`).bind(workbookId).first<{ id: string }>();
    if (!version) throw new DomainError("Published assessment version not found.", 404);
    let verified: VerifiedAssessmentVersion;
    try {
      verified = await getVerifiedAssessmentManifest(version.id);
    } catch {
      throw new DomainError("This assessment version failed its immutable content integrity check.", 503);
    }
    if (!verified.manifest.assessment.displayPolicy.dualDisplayAllowed)
      throw new DomainError("Dual display is disabled for this assessment version.", 403);
  }
  await appendAudit(auth.userId, "display.companion-opened", "case", caseId, "success", `mode=${mode};workbook=${workbookId}`);
}

export async function recordExamPreflight(
  auth: AuthContext,
  payload: Record<string, unknown>,
) {
  exactActionFields(payload, [
    "action",
    "selectedWorkbookId",
    "passed",
    "checkCount",
  ]);
  const passed = payload.passed === true;
  const checkCount = Number(payload.checkCount);
  if (!passed || !Number.isInteger(checkCount) || checkCount < 4 || checkCount > 12)
    throw new DomainError(
      "All critical exam preflight checks must pass before entry.",
      422,
    );
  const { attemptId, workbook } = await attemptForSelectedWorkbook(
    auth,
    payload.selectedWorkbookId,
    true,
    true,
  );
  const attempt = await env.DB.prepare(
    `SELECT state, preflight_passed_at,
            EXISTS(SELECT 1 FROM answers WHERE attempt_id = attempts.id) AS has_answers,
            EXISTS(SELECT 1 FROM annotations WHERE attempt_id = attempts.id) AS has_annotations,
            EXISTS(SELECT 1 FROM key_images WHERE attempt_id = attempts.id) AS has_key_images
       FROM attempts WHERE id = ? AND user_id = ?`,
  )
    .bind(attemptId, auth.userId)
    .first<{
      state: string;
      preflight_passed_at: string | null;
      has_answers: number;
      has_annotations: number;
      has_key_images: number;
    }>();
  if (!attempt || !["in-progress", "reopened"].includes(attempt.state))
    throw new DomainError("This assessment attempt is not open.", 409);
  if (!attempt.preflight_passed_at) {
    const hasEvidence = Boolean(
      attempt.has_answers || attempt.has_annotations || attempt.has_key_images,
    );
    const passedAt = new Date().toISOString();
    if (hasEvidence)
      await env.DB.prepare(
        `UPDATE attempts SET preflight_passed_at = ? WHERE id = ? AND user_id = ? AND preflight_passed_at IS NULL`,
      )
        .bind(passedAt, attemptId, auth.userId)
        .run();
    else {
      const accommodation = await approvedAccommodation(auth.userId, String(workbook.id));
      const durationMinutes = Math.max(10, Number(workbook.duration_minutes));
      const deadlineAt = new Date(
        Date.parse(passedAt) +
          (durationMinutes + accommodation.extraTimeMinutes) * 60_000,
      ).toISOString();
      await env.DB.prepare(
        `UPDATE attempts
            SET started_at = ?, deadline_at = ?, preflight_passed_at = ?, accommodation_minutes = ?
          WHERE id = ? AND user_id = ? AND preflight_passed_at IS NULL`,
      )
        .bind(
          passedAt,
          deadlineAt,
          passedAt,
          accommodation.extraTimeMinutes,
          attemptId,
          auth.userId,
        )
        .run();
    }
  }
  await requireWritableAttempt(auth, attemptId, workbook.mode);
  await appendAudit(
    auth.userId,
    "exam.preflight-passed",
    "attempt",
    attemptId,
    "success",
    `critical-checks=${checkCount};answers=server-authoritative`,
  );
}

export async function saveMark(auth: AuthContext, payload: Record<string, unknown>) {
  await ensureEducationUser(auth); await requireRole(auth, "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "attemptId", "score", "feedback", "questionScores", "criterionScores", "expectedRevision"]);
  const attemptId = safeText(payload.attemptId, 140); const feedback = safeText(payload.feedback, 6_000).trim();
  if (!feedback) throw new DomainError("Examiner feedback is required.");
  const attempt = await env.DB.prepare(`SELECT a.state, a.assessment_version_id FROM attempts a WHERE a.id = ?`).bind(attemptId).first<{ state: string; assessment_version_id: string }>();
  if (!attempt || !["submitted", "accepted-for-marking", "marked"].includes(attempt.state)) throw new DomainError("This script is not available for marking.", 409);
  let version: VerifiedAssessmentVersion;
  try {
    version = await getVerifiedAssessmentManifest(attempt.assessment_version_id);
  } catch {
    throw new DomainError("This assessment version failed its immutable content integrity check.", 503);
  }
  const questions = manifestQuestions(version.manifest).map((question) => ({
    id: question.id,
    maxMarks: question.maxMarks,
    criteria: question.rubric.criteria.map((criterion) => ({
      label: criterion.label,
      marks: criterion.maxMarks,
    })),
  }));
  const questionScoresInput = Array.isArray(payload.questionScores) ? payload.questionScores : [];
  const criterionScoresInput = Array.isArray(payload.criterionScores) ? payload.criterionScores : [];
  if (questionScoresInput.length !== questions.length) throw new DomainError("Record a score for every assessment question.", 422);
  const questionScores = questions.map((question) => {
    const item = questionScoresInput.find((value) => typeof value === "object" && value !== null && (value as Record<string, unknown>).questionId === question.id) as Record<string, unknown> | undefined;
    if (!item || Object.keys(item).some((key) => !["questionId", "score"].includes(key))) throw new DomainError("Question scores use an unsupported shape.", 422);
    const value = Number(item.score);
    if (!Number.isInteger(value) || value < 0 || value > question.maxMarks) throw new DomainError(`Score for ${question.id} must be between 0 and ${question.maxMarks}.`, 422);
    return { questionId: question.id, score: value, maxScore: question.maxMarks };
  });
  const criterionScores = questions.flatMap((question) => question.criteria.map((criterion) => {
    const item = criterionScoresInput.find((value) => typeof value === "object" && value !== null && (value as Record<string, unknown>).questionId === question.id && (value as Record<string, unknown>).label === criterion.label) as Record<string, unknown> | undefined;
    if (!item || Object.keys(item).some((key) => !["questionId", "label", "score"].includes(key))) throw new DomainError("Record a rubric score for every criterion.", 422);
    const value = Number(item.score);
    if (!Number.isInteger(value) || value < 0 || value > criterion.marks) throw new DomainError(`Rubric score for ${criterion.label} must be between 0 and ${criterion.marks}.`, 422);
    return { questionId: question.id, label: criterion.label, score: value, maxScore: criterion.marks };
  }));
  const expectedCriterionCount = questions.reduce(
    (count, question) => count + question.criteria.length,
    0,
  );
  if (criterionScoresInput.length !== expectedCriterionCount)
    throw new DomainError("Record exactly one score for every rubric criterion.", 422);
  for (const question of questions) {
    const rubricTotal = criterionScores.filter((item) => item.questionId === question.id).reduce((sum, item) => sum + item.score, 0);
    const questionTotal = questionScores.find((item) => item.questionId === question.id)?.score ?? -1;
    if (question.criteria.length && rubricTotal !== questionTotal) throw new DomainError(`Rubric criteria for ${question.id} must add up to its question score.`, 422);
  }
  const maxScore = questions.reduce((sum, question) => sum + question.maxMarks, 0);
  const score = questionScores.reduce((sum, item) => sum + item.score, 0);
  if (Number(payload.score) !== score) throw new DomainError("The total score must equal the question scores.", 422);
  const latest = await env.DB.prepare(`SELECT revision FROM marks WHERE attempt_id = ? ORDER BY revision DESC LIMIT 1`).bind(attemptId).first<{ revision: number }>();
  const latestRevision = latest?.revision ?? 0;
  const expectedRevision = Number(payload.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision !== latestRevision)
    throw new DomainError("The marking script changed. Refresh before saving another revision.", 409);
  const revision = latestRevision + 1;
  const createdAt = new Date().toISOString();
  const markId = crypto.randomUUID();
  try {
    const saved = await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO marks (id, attempt_id, examiner_id, score, max_score, feedback, revision, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM attempts WHERE id = ? AND state IN ('submitted','accepted-for-marking','marked'))
            AND ? = COALESCE((SELECT MAX(revision) FROM marks WHERE attempt_id = ?), 0)`,
      ).bind(markId, attemptId, auth.userId, score, maxScore, feedback, revision, createdAt, attemptId, expectedRevision, attemptId),
      ...questionScores.map((item) => env.DB.prepare(
        `INSERT INTO question_marks (id, attempt_id, question_id, examiner_id, score, max_score, revision, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM marks WHERE id = ? AND attempt_id = ? AND revision = ?)`,
      ).bind(crypto.randomUUID(), attemptId, item.questionId, auth.userId, item.score, item.maxScore, revision, createdAt, markId, attemptId, revision)),
      ...criterionScores.map((item) => env.DB.prepare(
        `INSERT INTO criterion_marks (id, attempt_id, question_id, criterion_label, examiner_id, score, max_score, revision, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM marks WHERE id = ? AND attempt_id = ? AND revision = ?)`,
      ).bind(crypto.randomUUID(), attemptId, item.questionId, item.label, auth.userId, item.score, item.maxScore, revision, createdAt, markId, attemptId, revision)),
      env.DB.prepare(`UPDATE attempts SET state = 'marked' WHERE id = ? AND state IN ('submitted','accepted-for-marking','marked') AND EXISTS (SELECT 1 FROM marks WHERE id = ?)`).bind(attemptId, markId),
    ]);
    if (Number(saved[0]?.meta.changes ?? 0) !== 1 || Number(saved.at(-1)?.meta.changes ?? 0) !== 1)
      throw new DomainError("The marking script changed while it was being saved. Refresh and review the latest revision.", 409);
  } catch {
    throw new DomainError("The marking script changed while it was being saved. Refresh and review the latest revision.", 409);
  }
  await appendAudit(auth.userId, "mark.completed", "attempt", attemptId, "success", `score=${score}/${maxScore};questions=${questionScores.length};criteria=${criterionScores.length};revision=${revision}`);
}

export async function moderateMark(auth: AuthContext, payload: Row) {
  await ensureEducationUser(auth); await requireRole(auth, "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "attemptId", "finalScore", "reason", "expectedMarkRevision"]);
  const attemptId = safeText(payload.attemptId, 140); const reason = safeText(payload.reason, 2_000).trim();
  const attempt = await env.DB.prepare(`SELECT state FROM attempts WHERE id = ?`).bind(attemptId).first<{ state: string }>();
  const mark = await env.DB.prepare(`SELECT score, max_score, revision, examiner_id FROM marks WHERE attempt_id = ? ORDER BY revision DESC LIMIT 1`).bind(attemptId).first<{ score: number; max_score: number; revision: number; examiner_id: string }>();
  if (!attempt || attempt.state !== "marked" || !mark) throw new DomainError("Complete examiner marking before moderation.", 409);
  const expectedMarkRevision = Number(payload.expectedMarkRevision);
  if (!Number.isInteger(expectedMarkRevision) || expectedMarkRevision !== mark.revision)
    throw new DomainError("The examiner mark changed. Refresh before moderating it.", 409);
  if (mark.examiner_id === auth.userId)
    throw new DomainError("A different examiner must moderate the latest official mark.", 403);
  const finalScore = Number(payload.finalScore);
  if (!Number.isInteger(finalScore) || finalScore < 0 || finalScore > mark.max_score)
    throw new DomainError(`The moderated score must be a whole number from 0 to ${mark.max_score}.`, 422);
  if (!reason) throw new DomainError("A moderation rationale is required.");
  const decisionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    const moderated = await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO moderation_decisions (id, attempt_id, moderator_id, original_examiner_id, mark_revision, original_score, final_score, reason, created_at)
         SELECT ?, m.attempt_id, ?, m.examiner_id, m.revision, m.score, ?, ?, ?
           FROM marks m
           JOIN attempts a ON a.id = m.attempt_id
          WHERE m.attempt_id = ? AND m.revision = ? AND m.examiner_id <> ? AND a.state = 'marked'
            AND m.revision = (SELECT MAX(latest.revision) FROM marks latest WHERE latest.attempt_id = m.attempt_id)
            AND NOT EXISTS (SELECT 1 FROM moderation_decisions md WHERE md.attempt_id = m.attempt_id)`,
      ).bind(decisionId, auth.userId, finalScore, reason, createdAt, attemptId, expectedMarkRevision, auth.userId),
      env.DB.prepare(`UPDATE attempts SET state = 'moderated' WHERE id = ? AND state = 'marked' AND EXISTS (SELECT 1 FROM moderation_decisions WHERE id = ?)`).bind(attemptId, decisionId),
    ]);
    if (Number(moderated[0]?.meta.changes ?? 0) !== 1 || Number(moderated[1]?.meta.changes ?? 0) !== 1)
      throw new DomainError("The examiner mark changed or was already moderated. Refresh to view the preserved record.", 409);
  } catch {
    throw new DomainError("The examiner mark changed or was already moderated. Refresh to view the preserved record.", 409);
  }
  await appendAudit(auth.userId, "moderation.completed", "attempt", attemptId, "success", `original=${mark.score};final=${finalScore};mark-revision=${mark.revision};original-examiner=${mark.examiner_id};moderator-separated=true`);
}

export async function releaseResult(auth: AuthContext, payload: Row) {
  await ensureEducationUser(auth); await requireRole(auth, "examiner", "administrator");
  exactActionFields(payload, ["action", "selectedWorkbookId", "attemptId"]);
  const attemptId = safeText(payload.attemptId, 140);
  const attempt = await env.DB.prepare(`SELECT state FROM attempts WHERE id = ?`).bind(attemptId).first<{ state: string }>();
  const moderation = await env.DB.prepare(`SELECT md.final_score, m.max_score FROM moderation_decisions md JOIN marks m ON m.attempt_id = md.attempt_id AND m.revision = md.mark_revision WHERE md.attempt_id = ? ORDER BY md.created_at DESC LIMIT 1`).bind(attemptId).first<{ final_score: number; max_score: number }>();
  if (!attempt || attempt.state !== "moderated" || !moderation) throw new DomainError("A moderated script is required before release.", 409);
  const releasedAt = new Date().toISOString(); const releaseId = crypto.randomUUID(); const resultId = crypto.randomUUID(); const outcome = outcomeFor(moderation.final_score, moderation.max_score); const populationHash = await sha256(`${attemptId}|${moderation.final_score}|${releasedAt}`);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO result_releases (id, title, approved_by, status, released_at, population_hash) VALUES (?, ?, ?, ?, ?, ?)`).bind(releaseId, "Cross-modality assessment release", auth.userId, "released", releasedAt, populationHash),
    env.DB.prepare(`INSERT INTO results (id, attempt_id, release_id, score, max_score, outcome, released_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(resultId, attemptId, releaseId, moderation.final_score, moderation.max_score, outcome, releasedAt),
    env.DB.prepare(`UPDATE attempts SET state = 'released' WHERE id = ?`).bind(attemptId),
  ]);
  await appendAudit(auth.userId, "result.released", "attempt", attemptId, "success", `release=${releaseId};population=${populationHash}`);
}
