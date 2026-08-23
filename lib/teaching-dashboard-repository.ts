import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { ensureEducationUser } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";

type Row = Record<string, string | number | null>;

async function requireManager(auth: AuthContext) {
  await ensureEducationUser(auth);
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(auth.userId)
    .first<{ roles: string }>();
  const roles = user?.roles.split(",").filter(Boolean) ?? [];
  if (!roles.some((role) => ["administrator", "instructor"].includes(role)))
    throw new EducationApiError(
      "Only an instructor or administrator can view the live teaching dashboard.",
      403,
    );
}

export type TeachingDashboard = {
  summary: {
    liveSessions: number;
    presentLearners: number;
    followingLearners: number;
    livePolls: number;
    pollResponses: number;
  };
  sessions: Array<{
    id: string;
    workbookId: string;
    workbookTitle: string;
    state: string;
    activeCaseTitle: string;
    participantCount: number;
    followingCount: number;
    exploringCount: number;
    startedAt: string;
    updatedAt: string;
    endedAt: string | null;
  }>;
  casePresence: Array<{
    caseId: string;
    caseTitle: string;
    displayCount: string;
    suppressed: boolean;
  }>;
  privacy: {
    identityLevel: "anonymous-aggregate";
    caseBreakdownMinimum: number;
    presenceWindowSeconds: number;
  };
  refreshedAt: string;
};

export async function getTeachingDashboard(
  auth: AuthContext,
): Promise<TeachingDashboard> {
  await requireManager(auth);
  const presenceWindowSeconds = 20;
  const presenceCutoff = new Date(
    Date.now() - presenceWindowSeconds * 1_000,
  ).toISOString();
  const sessionResult = await env.DB.prepare(
    `SELECT s.id, s.workbook_id, w.title AS workbook_title, s.state, c.title AS active_case_title, s.started_at, s.updated_at, s.ended_at,
      COUNT(p.learner_id) AS participant_count,
      SUM(CASE WHEN p.follow_state = 'following' THEN 1 ELSE 0 END) AS following_count,
      SUM(CASE WHEN p.follow_state = 'exploring' THEN 1 ELSE 0 END) AS exploring_count
     FROM teaching_sessions s
     JOIN workbooks w ON w.id = s.workbook_id
     JOIN cases c ON c.id = s.active_case_id
     LEFT JOIN teaching_session_participants p ON p.session_id = s.id AND p.last_seen_at >= ?
     GROUP BY s.id
     ORDER BY s.started_at DESC
     LIMIT 12`,
  ).bind(presenceCutoff).all<Row>();
  const sessions = (sessionResult.results ?? []).map((row) => ({
    id: String(row.id),
    workbookId: String(row.workbook_id),
    workbookTitle: String(row.workbook_title),
    state: String(row.state),
    activeCaseTitle: String(row.active_case_title),
    participantCount: Number(row.participant_count ?? 0),
    followingCount: Number(row.following_count ?? 0),
    exploringCount: Number(row.exploring_count ?? 0),
    startedAt: String(row.started_at),
    updatedAt: String(row.updated_at),
    endedAt: row.ended_at === null ? null : String(row.ended_at),
  }));
  const liveIds = sessions.filter((session) => session.state === "live").map((session) => session.id);
  let casePresence: TeachingDashboard["casePresence"] = [];
  if (liveIds.length) {
    const placeholders = liveIds.map(() => "?").join(",");
    const presenceResult = await env.DB.prepare(
      `SELECT p.current_case_id, c.title AS case_title, COUNT(*) AS learner_count
       FROM teaching_session_participants p
       JOIN cases c ON c.id = p.current_case_id
       WHERE p.session_id IN (${placeholders}) AND p.last_seen_at >= ?
       GROUP BY p.current_case_id, c.title
       ORDER BY learner_count DESC, c.title`,
    )
      .bind(...liveIds, presenceCutoff)
      .all<Row>();
    casePresence = (presenceResult.results ?? []).map((row) => {
      const count = Number(row.learner_count ?? 0);
      return {
        caseId: String(row.current_case_id),
        caseTitle: String(row.case_title),
        displayCount: count < 3 ? "<3" : String(count),
        suppressed: count < 3,
      };
    });
  }
  const pollSummary = await env.DB.prepare(
    `SELECT
      SUM(CASE WHEN r.state = 'open' THEN 1 ELSE 0 END) AS live_polls,
      COUNT(resp.learner_id) AS poll_responses
     FROM teaching_poll_runs r
     LEFT JOIN teaching_poll_responses resp ON resp.run_id = r.id
     WHERE r.opened_at >= datetime('now', '-1 day')`,
  ).first<Row>();
  const liveSessions = sessions.filter((session) => session.state === "live");
  return {
    summary: {
      liveSessions: liveSessions.length,
      presentLearners: liveSessions.reduce(
        (total, session) => total + session.participantCount,
        0,
      ),
      followingLearners: liveSessions.reduce(
        (total, session) => total + session.followingCount,
        0,
      ),
      livePolls: Number(pollSummary?.live_polls ?? 0),
      pollResponses: Number(pollSummary?.poll_responses ?? 0),
    },
    sessions,
    casePresence,
    privacy: {
      identityLevel: "anonymous-aggregate",
      caseBreakdownMinimum: 3,
      presenceWindowSeconds,
    },
    refreshedAt: new Date().toISOString(),
  };
}
