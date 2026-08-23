import { env } from "cloudflare:workers";
export { hasWorkbookStaffAccess } from "@/lib/workbook-access-policy";
import { hasWorkbookStaffAccess } from "@/lib/workbook-access-policy";

export async function canAccessPublishedWorkbook(
  userId: string,
  roles: readonly string[],
  workbookId: string,
) {
  if (hasWorkbookStaffAccess(roles)) {
    const workbook = await env.DB.prepare(
      `SELECT id FROM workbooks WHERE id = ? AND status = 'published'`,
    )
      .bind(workbookId)
      .first<{ id: string }>();
    return Boolean(workbook);
  }
  const now = new Date().toISOString();
  const assignment = await env.DB.prepare(
    `SELECT source_id FROM (
       SELECT a.id AS source_id
         FROM workbook_assignments a
         JOIN workbooks w ON w.id = a.workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN enrolments e ON e.course_id = m.course_id AND e.user_id = a.learner_id
         LEFT JOIN workbook_assignment_rules r ON r.assignment_id = a.id
         LEFT JOIN workbook_progress p ON p.workbook_id = r.prerequisite_workbook_id AND p.learner_id = a.learner_id
        WHERE a.learner_id = ? AND a.workbook_id = ?
          AND a.status = 'active' AND w.status = 'published' AND e.status = 'active'
          AND (r.available_from IS NULL OR r.available_from <= ?)
          AND (r.expires_at IS NULL OR r.expires_at > ?)
          AND (r.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= r.prerequisite_min_percent)
       UNION ALL
       SELECT ca.id AS source_id
         FROM cohort_workbook_assignments ca
         JOIN cohort_members cm ON cm.cohort_id = ca.cohort_id
         JOIN cohorts c ON c.id = ca.cohort_id
         JOIN workbooks w ON w.id = ca.workbook_id
         JOIN modules m ON m.id = w.module_id AND m.course_id = c.course_id
         JOIN enrolments e ON e.course_id = c.course_id AND e.user_id = cm.learner_id
         LEFT JOIN workbook_progress p ON p.workbook_id = ca.prerequisite_workbook_id AND p.learner_id = cm.learner_id
        WHERE cm.learner_id = ? AND ca.workbook_id = ?
          AND cm.status = 'active' AND c.status = 'active' AND ca.status = 'active'
          AND w.status = 'published' AND e.status = 'active'
          AND (ca.available_from IS NULL OR ca.available_from <= ?)
          AND (ca.expires_at IS NULL OR ca.expires_at > ?)
          AND (ca.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= ca.prerequisite_min_percent)
     ) LIMIT 1`,
  )
    .bind(userId, workbookId, now, now, userId, workbookId, now, now)
    .first<{ source_id: string }>();
  return Boolean(assignment);
}

export async function canAccessPublishedCase(
  userId: string,
  roles: readonly string[],
  caseId: string,
) {
  if (hasWorkbookStaffAccess(roles)) {
    const publishedCase = await env.DB.prepare(
      `SELECT wc.case_id FROM workbook_cases wc JOIN workbooks w ON w.id = wc.workbook_id WHERE wc.case_id = ? AND w.status = 'published' LIMIT 1`,
    ).bind(caseId).first();
    return Boolean(publishedCase);
  }
  const now = new Date().toISOString();
  const assignment = await env.DB.prepare(
    `SELECT source_id FROM (
       SELECT a.id AS source_id
         FROM workbook_assignments a
         JOIN workbooks w ON w.id = a.workbook_id
         JOIN workbook_cases wc ON wc.workbook_id = w.id
         JOIN modules m ON m.id = w.module_id
         JOIN enrolments e ON e.course_id = m.course_id AND e.user_id = a.learner_id
         LEFT JOIN workbook_assignment_rules r ON r.assignment_id = a.id
         LEFT JOIN workbook_progress p ON p.workbook_id = r.prerequisite_workbook_id AND p.learner_id = a.learner_id
        WHERE a.learner_id = ? AND wc.case_id = ? AND a.status = 'active'
          AND w.status = 'published' AND e.status = 'active'
          AND (r.available_from IS NULL OR r.available_from <= ?)
          AND (r.expires_at IS NULL OR r.expires_at > ?)
          AND (r.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= r.prerequisite_min_percent)
       UNION ALL
       SELECT ca.id AS source_id
         FROM cohort_workbook_assignments ca
         JOIN cohort_members cm ON cm.cohort_id = ca.cohort_id
         JOIN cohorts c ON c.id = ca.cohort_id
         JOIN workbooks w ON w.id = ca.workbook_id
         JOIN workbook_cases wc ON wc.workbook_id = w.id
         JOIN enrolments e ON e.course_id = c.course_id AND e.user_id = cm.learner_id
         LEFT JOIN workbook_progress p ON p.workbook_id = ca.prerequisite_workbook_id AND p.learner_id = cm.learner_id
        WHERE cm.learner_id = ? AND wc.case_id = ? AND cm.status = 'active'
          AND c.status = 'active' AND ca.status = 'active' AND w.status = 'published' AND e.status = 'active'
          AND (ca.available_from IS NULL OR ca.available_from <= ?)
          AND (ca.expires_at IS NULL OR ca.expires_at > ?)
          AND (ca.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= ca.prerequisite_min_percent)
     ) LIMIT 1`,
  )
    .bind(userId, caseId, now, now, userId, caseId, now, now)
    .first<{ source_id: string }>();
  return Boolean(assignment);
}
