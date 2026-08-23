import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { ensureEducationUser } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";
import type { TeachingContentBlockView } from "@/lib/teaching-content";
import { safeText } from "@/lib/domain";
import { canAccessPublishedWorkbook } from "@/lib/workbook-access";

type Row = Record<string, string | number | null>;
function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === "string" ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export type LearnerReviewBundle = {
  workbook: { id: string; title: string };
  sessions: Array<{
    id: string;
    state: string;
    joinedAt: string;
    lastSeenAt: string;
    endedAt: string | null;
  }>;
  cases: Array<{
    id: string;
    title: string;
    classification: string;
    position: number;
    note: {
      title: string;
      body: string;
      keyPoints: string[];
      revealText: string;
    } | null;
    content: TeachingContentBlockView[];
    bookmarks: Array<{ id: string; title: string; updatedAt: string }>;
    pollReviews: Array<{
      id: string;
      prompt: string;
      selectedLabels: string[];
      correctLabels: string[];
      explanation: string;
      releasedAt: string;
    }>;
  }>;
  refreshedAt: string;
};

export async function getLearnerReview(
  auth: AuthContext,
  requestedWorkbookId: string,
): Promise<LearnerReviewBundle> {
  await ensureEducationUser(auth);
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(auth.userId)
    .first<{ roles: string }>();
  const roles = user?.roles.split(",").filter(Boolean) ?? [];
  if (!roles.includes("learner"))
    throw new EducationApiError(
      "A learner enrolment is required to open post-session review.",
      403,
    );
  const workbookId = safeText(requestedWorkbookId, 100);
  if (!workbookId)
    throw new EducationApiError("A teaching workbook is required for review.", 422);
  const workbook = await env.DB.prepare(
    `SELECT w.id, w.title
       FROM workbooks w
       JOIN modules m ON m.id = w.module_id
       JOIN enrolments e ON e.course_id = m.course_id
      WHERE w.id = ? AND w.mode = 'teaching' AND w.status = 'published'
        AND e.user_id = ? AND e.status = 'active'`,
  )
    .bind(workbookId, auth.userId)
    .first<{ id: string; title: string }>();
  if (!workbook || !(await canAccessPublishedWorkbook(auth.userId, roles, workbookId)))
    throw new EducationApiError(
      "This teaching workbook is not allocated to your education account.",
      403,
    );
  const [caseResult, noteResult, contentResult, bookmarkResult, pollResult, sessionResult] =
    await Promise.all([
      env.DB.prepare(
        `SELECT c.id, c.title, c.classification, wc.position
         FROM workbook_cases wc
         JOIN cases c ON c.id = wc.case_id
         WHERE wc.workbook_id = ? AND c.status = 'published'
         ORDER BY wc.position`,
      ).bind(workbookId).all<Row>(),
      env.DB.prepare(
        `SELECT n.case_id, n.title, n.body, n.key_points_json, n.reveal_text
           FROM teaching_notes n
           JOIN workbook_cases wc ON wc.case_id = n.case_id
          WHERE wc.workbook_id = ?
          ORDER BY n.case_id, n.position`,
      ).bind(workbookId).all<Row>(),
      env.DB.prepare(
        `SELECT id, workbook_id, case_id, type, title, body, url, position, version
         FROM teaching_content_blocks
         WHERE status = 'published' AND workbook_id = ?
         ORDER BY case_id, position, id`,
      ).bind(workbookId).all<Row>(),
      env.DB.prepare(
        `SELECT b.id, b.case_id, b.title, b.updated_at
         FROM learner_bookmarks b
         JOIN workbook_cases wc ON wc.case_id = b.case_id
         WHERE b.learner_id = ? AND b.active = 1 AND wc.workbook_id = ?
         ORDER BY b.updated_at DESC`,
      )
        .bind(auth.userId, workbookId)
        .all<Row>(),
      env.DB.prepare(
        `SELECT p.id, p.case_id, p.prompt, p.options_json, p.correct_option_ids_json,
                p.explanation, r.opened_at, resp.selections_json
         FROM teaching_polls p
         JOIN teaching_poll_runs r ON r.poll_id = p.id AND r.results_revealed = 1
         JOIN teaching_poll_responses resp ON resp.run_id = r.id AND resp.learner_id = ?
         WHERE p.status = 'published' AND p.workbook_id = ?
         ORDER BY r.opened_at DESC`,
      )
        .bind(auth.userId, workbookId)
        .all<Row>(),
      env.DB.prepare(
        `SELECT s.id, s.state, p.joined_at, p.last_seen_at, s.ended_at
         FROM teaching_session_participants p
         JOIN teaching_sessions s ON s.id = p.session_id
         WHERE p.learner_id = ? AND s.workbook_id = ?
         ORDER BY s.started_at DESC
         LIMIT 12`,
      )
        .bind(auth.userId, workbookId)
        .all<Row>(),
    ]);
  const notes = new Map(
    (noteResult.results ?? []).map((row) => [
      String(row.case_id),
      {
        title: String(row.title),
        body: String(row.body),
        keyPoints: parseJson<string[]>(row.key_points_json, []),
        revealText: String(row.reveal_text),
      },
    ]),
  );
  const reviewedPolls = new Set<string>();
  const pollRows = (pollResult.results ?? []).filter((row) => {
    const id = String(row.id);
    if (reviewedPolls.has(id)) return false;
    reviewedPolls.add(id);
    return true;
  });
  return {
    workbook: { id: workbook.id, title: workbook.title },
    sessions: (sessionResult.results ?? []).map((row) => ({
      id: String(row.id),
      state: String(row.state),
      joinedAt: String(row.joined_at),
      lastSeenAt: String(row.last_seen_at),
      endedAt: row.ended_at === null ? null : String(row.ended_at),
    })),
    cases: (caseResult.results ?? []).map((row) => {
      const caseId = String(row.id);
      return {
        id: caseId,
        title: String(row.title),
        classification: String(row.classification),
        position: Number(row.position),
        note: notes.get(caseId) ?? null,
        content: (contentResult.results ?? [])
          .filter((content) => String(content.case_id) === caseId)
          .map((content) => ({
            id: String(content.id),
            workbookId: String(content.workbook_id),
            caseId,
            type: String(content.type) as TeachingContentBlockView["type"],
            title: String(content.title),
            body: String(content.body),
            url: String(content.url),
            position: Number(content.position),
            version: Number(content.version),
          })),
        bookmarks: (bookmarkResult.results ?? [])
          .filter((bookmark) => String(bookmark.case_id) === caseId)
          .map((bookmark) => ({
            id: String(bookmark.id),
            title: String(bookmark.title),
            updatedAt: String(bookmark.updated_at),
          })),
        pollReviews: pollRows
          .filter((poll) => String(poll.case_id) === caseId)
          .map((poll) => {
            const options = parseJson<Array<{ id: string; label: string }>>(
              poll.options_json,
              [],
            );
            const selected = new Set(parseJson<string[]>(poll.selections_json, []));
            const correct = new Set(
              parseJson<string[]>(poll.correct_option_ids_json, []),
            );
            return {
              id: String(poll.id),
              prompt: String(poll.prompt),
              selectedLabels: options
                .filter((option) => selected.has(option.id))
                .map((option) => option.label),
              correctLabels: options
                .filter((option) => correct.has(option.id))
                .map((option) => option.label),
              explanation: String(poll.explanation),
              releasedAt: String(poll.opened_at),
            };
          }),
      };
    }),
    refreshedAt: new Date().toISOString(),
  };
}
