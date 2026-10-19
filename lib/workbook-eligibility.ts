import { hasWorkbookStaffAccess } from "@/lib/workbook-access-policy";

// Internal server-side learner eligibility, shared by point access and course
// launch selection. Bind values come only from the authenticated user and clock.
export const learnerEligiblePublishedWorkbooksSql = `SELECT DISTINCT workbook_id FROM (
       SELECT a.workbook_id
         FROM workbook_assignments a
         JOIN workbooks w ON w.id = a.workbook_id
         JOIN modules m ON m.id = w.module_id
         JOIN enrolments e ON e.course_id = m.course_id AND e.user_id = a.learner_id
         LEFT JOIN workbook_assignment_rules r ON r.assignment_id = a.id
         LEFT JOIN workbook_progress p ON p.workbook_id = r.prerequisite_workbook_id AND p.learner_id = a.learner_id
        WHERE a.learner_id = ?
          AND a.status = 'active' AND w.status = 'published' AND e.status = 'active'
          AND (r.available_from IS NULL OR r.available_from <= ?)
          AND (r.expires_at IS NULL OR r.expires_at > ?)
          AND (r.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= r.prerequisite_min_percent)
       UNION ALL
       SELECT ca.workbook_id
         FROM cohort_workbook_assignments ca
         JOIN cohort_members cm ON cm.cohort_id = ca.cohort_id
         JOIN cohorts c ON c.id = ca.cohort_id
         JOIN workbooks w ON w.id = ca.workbook_id
         JOIN modules m ON m.id = w.module_id AND m.course_id = c.course_id
         JOIN enrolments e ON e.course_id = c.course_id AND e.user_id = cm.learner_id
         LEFT JOIN workbook_progress p ON p.workbook_id = ca.prerequisite_workbook_id AND p.learner_id = cm.learner_id
        WHERE cm.learner_id = ?
          AND cm.status = 'active' AND c.status = 'active' AND ca.status = 'active'
          AND w.status = 'published' AND e.status = 'active'
          AND (ca.available_from IS NULL OR ca.available_from <= ?)
          AND (ca.expires_at IS NULL OR ca.expires_at > ?)
          AND (ca.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= ca.prerequisite_min_percent)
     )`;

export function learnerEligibilityBindings(userId: string, at: string) {
  return [userId, at, at, userId, at, at] as const;
}

export function publishedWorkbookEligibilityForRoles(userId: string, roles: readonly string[], at: string) {
  if (hasWorkbookStaffAccess(roles))
    return { sql: "SELECT id AS workbook_id FROM workbooks WHERE status='published'", bindings: [] as string[] };
  return { sql: learnerEligiblePublishedWorkbooksSql, bindings: [...learnerEligibilityBindings(userId, at)] };
}
