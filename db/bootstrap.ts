import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { allowedTools, sha256 } from "@/lib/domain";
import { educationGeometryForCase } from "@/lib/education-viewer-adapter";
import type { ViewerScene } from "@/lib/education-presentations";
import { isAuditSequenceCollision } from "@/lib/audit-errors";
import {
  decideEducationUserProvisioning,
  LOCAL_DEMO_EDUCATION_ROLES,
} from "@/lib/education-user-provisioning";
import { identityProviderForSubject } from "@/lib/account-policy";
import { backfillKnownAssessmentManifests } from "@/lib/assessment-manifest-store";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, external_subject TEXT NOT NULL UNIQUE, email TEXT NOT NULL, display_name TEXT NOT NULL, roles TEXT NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL, identity_provider TEXT NOT NULL, registered_at TEXT NOT NULL, last_authenticated_at TEXT NOT NULL, terms_version TEXT NOT NULL, privacy_version TEXT NOT NULL, terms_accepted_at TEXT, privacy_accepted_at TEXT, updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))`,
  `CREATE INDEX IF NOT EXISTS idx_account_security_status ON account_security_profiles(status)`,
  `CREATE TABLE IF NOT EXISTS account_consents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, document_key TEXT NOT NULL, document_version TEXT NOT NULL, decision TEXT NOT NULL, source TEXT NOT NULL, recorded_at TEXT NOT NULL, UNIQUE(user_id, document_key, document_version), FOREIGN KEY(user_id) REFERENCES users(id))`,
  `CREATE INDEX IF NOT EXISTS idx_account_consents_user_recorded ON account_consents(user_id, recorded_at)`,
  `CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS modules (id TEXT PRIMARY KEY, course_id TEXT NOT NULL, title TEXT NOT NULL, position INTEGER NOT NULL, FOREIGN KEY(course_id) REFERENCES courses(id))`,
  `CREATE TABLE IF NOT EXISTS workbooks (id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL, mode TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, duration_minutes INTEGER NOT NULL, dual_display_allowed INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(module_id) REFERENCES modules(id))`,
  `CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, title TEXT NOT NULL, classification TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, description TEXT NOT NULL, visual_kind TEXT NOT NULL, tools_json TEXT NOT NULL, publication_hash TEXT NOT NULL, deidentified INTEGER NOT NULL, publication_cleared INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS workbook_cases (workbook_id TEXT NOT NULL, case_id TEXT NOT NULL, position INTEGER NOT NULL, PRIMARY KEY(workbook_id, case_id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_draft_question_edits (workbook_id TEXT NOT NULL, question_id TEXT NOT NULL, prompt TEXT NOT NULL, revision INTEGER NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(workbook_id, question_id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(question_id) REFERENCES questions(id), FOREIGN KEY(updated_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, prompt TEXT NOT NULL, max_marks INTEGER NOT NULL, version INTEGER NOT NULL, response_type TEXT NOT NULL, options_json TEXT NOT NULL DEFAULT '[]', position INTEGER NOT NULL DEFAULT 1, FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS question_bank_items (id TEXT PRIMARY KEY, title TEXT NOT NULL, prompt TEXT NOT NULL, response_type TEXT NOT NULL, max_marks INTEGER NOT NULL, modality TEXT NOT NULL, difficulty TEXT NOT NULL, tags_json TEXT NOT NULL, options_json TEXT NOT NULL, correct_option_indexes_json TEXT NOT NULL, rationale TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(created_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS education_integrations (id TEXT PRIMARY KEY, kind TEXT NOT NULL UNIQUE, issuer TEXT NOT NULL, client_id TEXT NOT NULL, deployment_id TEXT NOT NULL, authorization_endpoint TEXT NOT NULL, token_endpoint TEXT NOT NULL, jwks_endpoint TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(created_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS teaching_notes (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, key_points_json TEXT NOT NULL, reveal_text TEXT NOT NULL, position INTEGER NOT NULL, FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS teaching_polls (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, case_id TEXT NOT NULL, prompt TEXT NOT NULL, selection_mode TEXT NOT NULL, options_json TEXT NOT NULL, correct_option_ids_json TEXT NOT NULL, explanation TEXT NOT NULL, position INTEGER NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(case_id) REFERENCES cases(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS teaching_poll_runs (id TEXT PRIMARY KEY, poll_id TEXT NOT NULL, instructor_id TEXT NOT NULL, state TEXT NOT NULL, results_revealed INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL, opened_at TEXT NOT NULL, closed_at TEXT, FOREIGN KEY(poll_id) REFERENCES teaching_polls(id), FOREIGN KEY(instructor_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS teaching_poll_responses (run_id TEXT NOT NULL, learner_id TEXT NOT NULL, selections_json TEXT NOT NULL, revision INTEGER NOT NULL, responded_at TEXT NOT NULL, PRIMARY KEY(run_id, learner_id), FOREIGN KEY(run_id) REFERENCES teaching_poll_runs(id), FOREIGN KEY(learner_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS teaching_sessions (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, instructor_id TEXT NOT NULL, state TEXT NOT NULL, active_case_id TEXT NOT NULL, viewer_state_json TEXT NOT NULL, active_scene_index INTEGER, version INTEGER NOT NULL, started_at TEXT NOT NULL, updated_at TEXT NOT NULL, ended_at TEXT, FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(instructor_id) REFERENCES users(id), FOREIGN KEY(active_case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS teaching_session_participants (session_id TEXT NOT NULL, learner_id TEXT NOT NULL, follow_state TEXT NOT NULL, current_case_id TEXT NOT NULL, joined_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, PRIMARY KEY(session_id, learner_id), FOREIGN KEY(session_id) REFERENCES teaching_sessions(id), FOREIGN KEY(learner_id) REFERENCES users(id), FOREIGN KEY(current_case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS teaching_content_blocks (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, case_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, url TEXT NOT NULL, position INTEGER NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(case_id) REFERENCES cases(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS rubrics (id TEXT PRIMARY KEY, question_id TEXT NOT NULL, version INTEGER NOT NULL, criteria_json TEXT NOT NULL, status TEXT NOT NULL, FOREIGN KEY(question_id) REFERENCES questions(id))`,
  `CREATE TABLE IF NOT EXISTS assessment_versions (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, version INTEGER NOT NULL, integrity_hash TEXT NOT NULL, manifest_json TEXT, viewer_core_version TEXT NOT NULL, published_at TEXT NOT NULL, status TEXT NOT NULL, dual_display_allowed INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(workbook_id) REFERENCES workbooks(id))`,
  `CREATE TABLE IF NOT EXISTS enrolments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, course_id TEXT NOT NULL, status TEXT NOT NULL, enrolled_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(course_id) REFERENCES courses(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_assignments (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, learner_id TEXT NOT NULL, status TEXT NOT NULL, assigned_by TEXT NOT NULL, assigned_at TEXT NOT NULL, due_at TEXT, revoked_at TEXT, version INTEGER NOT NULL, UNIQUE(workbook_id, learner_id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(learner_id) REFERENCES users(id), FOREIGN KEY(assigned_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_assignment_rules (assignment_id TEXT PRIMARY KEY, available_from TEXT, expires_at TEXT, prerequisite_workbook_id TEXT, prerequisite_min_percent INTEGER NOT NULL DEFAULT 100, updated_at TEXT NOT NULL, FOREIGN KEY(assignment_id) REFERENCES workbook_assignments(id), FOREIGN KEY(prerequisite_workbook_id) REFERENCES workbooks(id))`,
  `CREATE TABLE IF NOT EXISTS cohorts (id TEXT PRIMARY KEY, course_id TEXT NOT NULL, title TEXT NOT NULL, code TEXT NOT NULL, status TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, version INTEGER NOT NULL, UNIQUE(course_id, code), FOREIGN KEY(course_id) REFERENCES courses(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS cohort_members (cohort_id TEXT NOT NULL, learner_id TEXT NOT NULL, status TEXT NOT NULL, added_by TEXT NOT NULL, added_at TEXT NOT NULL, version INTEGER NOT NULL, PRIMARY KEY(cohort_id, learner_id), FOREIGN KEY(cohort_id) REFERENCES cohorts(id), FOREIGN KEY(learner_id) REFERENCES users(id), FOREIGN KEY(added_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS cohort_workbook_assignments (id TEXT PRIMARY KEY, cohort_id TEXT NOT NULL, workbook_id TEXT NOT NULL, status TEXT NOT NULL, assigned_by TEXT NOT NULL, assigned_at TEXT NOT NULL, available_from TEXT, due_at TEXT, expires_at TEXT, prerequisite_workbook_id TEXT, prerequisite_min_percent INTEGER NOT NULL DEFAULT 100, revoked_at TEXT, version INTEGER NOT NULL, UNIQUE(cohort_id, workbook_id), FOREIGN KEY(cohort_id) REFERENCES cohorts(id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(assigned_by) REFERENCES users(id), FOREIGN KEY(prerequisite_workbook_id) REFERENCES workbooks(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_case_progress (workbook_id TEXT NOT NULL, learner_id TEXT NOT NULL, case_id TEXT NOT NULL, first_opened_at TEXT NOT NULL, last_opened_at TEXT NOT NULL, PRIMARY KEY(workbook_id, learner_id, case_id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(learner_id) REFERENCES users(id), FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_progress (workbook_id TEXT NOT NULL, learner_id TEXT NOT NULL, status TEXT NOT NULL, cases_visited INTEGER NOT NULL, cases_total INTEGER NOT NULL, percent_complete INTEGER NOT NULL, first_opened_at TEXT NOT NULL, last_activity_at TEXT NOT NULL, completed_at TEXT, version INTEGER NOT NULL, PRIMARY KEY(workbook_id, learner_id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(learner_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS learner_accommodations (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, learner_id TEXT NOT NULL, extra_time_minutes INTEGER NOT NULL, rest_break_minutes INTEGER NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL, requested_by TEXT NOT NULL, approved_by TEXT, requested_at TEXT NOT NULL, approved_at TEXT, revoked_at TEXT, version INTEGER NOT NULL, UNIQUE(workbook_id, learner_id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(learner_id) REFERENCES users(id), FOREIGN KEY(requested_by) REFERENCES users(id), FOREIGN KEY(approved_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_authorship (workbook_id TEXT PRIMARY KEY, author_id TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(author_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_reviews (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, reviewer_id TEXT NOT NULL, decision TEXT NOT NULL, comment TEXT NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(workbook_id, revision), FOREIGN KEY(workbook_id) REFERENCES workbooks(id), FOREIGN KEY(reviewer_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS workbook_recoveries (draft_workbook_id TEXT PRIMARY KEY, source_workbook_id TEXT NOT NULL, source_assessment_version_id TEXT NOT NULL, source_integrity_hash TEXT NOT NULL, copied_case_ids_json TEXT NOT NULL, excluded_evidence_json TEXT NOT NULL, history_reconstructed INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(draft_workbook_id) REFERENCES workbooks(id), FOREIGN KEY(source_workbook_id) REFERENCES workbooks(id), FOREIGN KEY(source_assessment_version_id) REFERENCES assessment_versions(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, assessment_version_id TEXT NOT NULL, state TEXT NOT NULL, started_at TEXT NOT NULL, deadline_at TEXT NOT NULL, preflight_passed_at TEXT, submitted_at TEXT, receipt_hash TEXT, accommodation_minutes INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(assessment_version_id) REFERENCES assessment_versions(id))`,
  `CREATE TABLE IF NOT EXISTS answers (attempt_id TEXT NOT NULL, question_id TEXT NOT NULL, response TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(attempt_id, question_id), FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(question_id) REFERENCES questions(id))`,
  `CREATE TABLE IF NOT EXISTS annotations (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, case_id TEXT NOT NULL, kind TEXT NOT NULL, label TEXT NOT NULL, geometry_json TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS key_images (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, case_id TEXT NOT NULL, frame_index INTEGER NOT NULL, viewport_json TEXT NOT NULL, viewer_core_version TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS attempt_case_flags (attempt_id TEXT NOT NULL, case_id TEXT NOT NULL, flagged INTEGER NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(attempt_id, case_id), FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS instructor_presentations (id TEXT PRIMARY KEY, scope_type TEXT NOT NULL, scope_id TEXT NOT NULL, title TEXT NOT NULL, owner_id TEXT NOT NULL, version INTEGER NOT NULL, active INTEGER NOT NULL, visibility_policy TEXT NOT NULL, scenes_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, head_event_hash TEXT NOT NULL, FOREIGN KEY(owner_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS instructor_presentation_events (event_id TEXT PRIMARY KEY, presentation_id TEXT NOT NULL, sequence INTEGER NOT NULL, operation TEXT NOT NULL, actor_id TEXT NOT NULL, request_hash TEXT NOT NULL, snapshot_json TEXT NOT NULL, previous_event_hash TEXT NOT NULL, event_hash TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(presentation_id, sequence), FOREIGN KEY(presentation_id) REFERENCES instructor_presentations(id), FOREIGN KEY(actor_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS learner_bookmarks (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, case_id TEXT NOT NULL, title TEXT NOT NULL, version INTEGER NOT NULL, active INTEGER NOT NULL, scene_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, head_event_hash TEXT NOT NULL, FOREIGN KEY(learner_id) REFERENCES users(id), FOREIGN KEY(case_id) REFERENCES cases(id))`,
  `CREATE TABLE IF NOT EXISTS learner_bookmark_events (event_id TEXT PRIMARY KEY, bookmark_id TEXT NOT NULL, sequence INTEGER NOT NULL, operation TEXT NOT NULL, actor_id TEXT NOT NULL, request_hash TEXT NOT NULL, snapshot_json TEXT NOT NULL, previous_event_hash TEXT NOT NULL, event_hash TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(bookmark_id, sequence), FOREIGN KEY(bookmark_id) REFERENCES learner_bookmarks(id), FOREIGN KEY(actor_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE, evidence_hash TEXT NOT NULL, submitted_at TEXT NOT NULL, status TEXT NOT NULL, FOREIGN KEY(attempt_id) REFERENCES attempts(id))`,
  `CREATE TABLE IF NOT EXISTS marks (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, examiner_id TEXT NOT NULL, score INTEGER NOT NULL, max_score INTEGER NOT NULL, feedback TEXT NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(examiner_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS question_marks (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, question_id TEXT NOT NULL, examiner_id TEXT NOT NULL, score INTEGER NOT NULL, max_score INTEGER NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(attempt_id, question_id, revision), FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(question_id) REFERENCES questions(id), FOREIGN KEY(examiner_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS criterion_marks (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, question_id TEXT NOT NULL, criterion_label TEXT NOT NULL, examiner_id TEXT NOT NULL, score INTEGER NOT NULL, max_score INTEGER NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(attempt_id, question_id, criterion_label, revision), FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(question_id) REFERENCES questions(id), FOREIGN KEY(examiner_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS moderation_decisions (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, moderator_id TEXT NOT NULL, original_examiner_id TEXT NOT NULL, mark_revision INTEGER NOT NULL, original_score INTEGER NOT NULL, final_score INTEGER NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(moderator_id) REFERENCES users(id), FOREIGN KEY(original_examiner_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS result_releases (id TEXT PRIMARY KEY, title TEXT NOT NULL, approved_by TEXT NOT NULL, status TEXT NOT NULL, released_at TEXT NOT NULL, population_hash TEXT NOT NULL, FOREIGN KEY(approved_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE, release_id TEXT NOT NULL, score INTEGER NOT NULL, max_score INTEGER NOT NULL, outcome TEXT NOT NULL, released_at TEXT NOT NULL, FOREIGN KEY(attempt_id) REFERENCES attempts(id), FOREIGN KEY(release_id) REFERENCES result_releases(id))`,
  `CREATE TABLE IF NOT EXISTS ingestion_jobs (id TEXT PRIMARY KEY, title TEXT NOT NULL, declared_type TEXT NOT NULL, detected_type TEXT NOT NULL, status TEXT NOT NULL, deidentified INTEGER NOT NULL, publication_cleared INTEGER NOT NULL, reason_codes_json TEXT NOT NULL, content_hash TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, FOREIGN KEY(created_by) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, sequence INTEGER NOT NULL UNIQUE, actor_id TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, outcome TEXT NOT NULL, reason TEXT NOT NULL, occurred_at TEXT NOT NULL, integrity_hash TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_modules_course_position ON modules(course_id, position)`,
  `CREATE INDEX IF NOT EXISTS idx_workbooks_module ON workbooks(module_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_cases_order ON workbook_cases(workbook_id, position)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_draft_question_edits_workbook ON workbook_draft_question_edits(workbook_id)`,
  `CREATE INDEX IF NOT EXISTS idx_questions_case ON questions(case_id)`,
  `CREATE INDEX IF NOT EXISTS idx_question_bank_status_modality_difficulty ON question_bank_items(status, modality, difficulty)`,
  `CREATE INDEX IF NOT EXISTS idx_question_bank_creator ON question_bank_items(created_by)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_notes_case_position ON teaching_notes(case_id, position)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_polls_case_status_position ON teaching_polls(case_id, status, position)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_polls_workbook ON teaching_polls(workbook_id)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_poll_runs_poll_opened ON teaching_poll_runs(poll_id, opened_at)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_poll_runs_instructor ON teaching_poll_runs(instructor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_poll_responses_run ON teaching_poll_responses(run_id)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_sessions_workbook_state_updated ON teaching_sessions(workbook_id, state, updated_at)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_sessions_instructor ON teaching_sessions(instructor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_session_participants_session_state_seen ON teaching_session_participants(session_id, follow_state, last_seen_at)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_content_case_status_position ON teaching_content_blocks(case_id, status, position)`,
  `CREATE INDEX IF NOT EXISTS idx_teaching_content_workbook ON teaching_content_blocks(workbook_id)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_user_state ON attempts(user_id, state)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_assignments_learner_status ON workbook_assignments(learner_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_assignments_workbook_status ON workbook_assignments(workbook_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_assignment_rules_prerequisite ON workbook_assignment_rules(prerequisite_workbook_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cohorts_course_status ON cohorts(course_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_cohort_members_learner_status ON cohort_members(learner_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_cohort_workbook_assignments_cohort_status ON cohort_workbook_assignments(cohort_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_cohort_workbook_assignments_workbook_status ON cohort_workbook_assignments(workbook_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_case_progress_learner_recent ON workbook_case_progress(learner_id, last_opened_at)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_progress_workbook_status ON workbook_progress(workbook_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_progress_learner_status ON workbook_progress(learner_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_learner_accommodations_learner_status ON learner_accommodations(learner_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_authorship_author ON workbook_authorship(author_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_reviews_reviewer ON workbook_reviews(reviewer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workbook_recoveries_source ON workbook_recoveries(source_workbook_id)`,
  `CREATE INDEX IF NOT EXISTS idx_annotations_attempt_case ON annotations(attempt_id, case_id)`,
  `CREATE INDEX IF NOT EXISTS idx_key_images_attempt_case ON key_images(attempt_id, case_id)`,
  `CREATE INDEX IF NOT EXISTS idx_attempt_case_flags_attempt ON attempt_case_flags(attempt_id, flagged)`,
  `CREATE INDEX IF NOT EXISTS idx_instructor_presentations_scope ON instructor_presentations(scope_type, scope_id, active)`,
  `CREATE INDEX IF NOT EXISTS idx_instructor_presentations_owner ON instructor_presentations(owner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_instructor_presentation_events_actor ON instructor_presentation_events(actor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_learner_bookmarks_owner_case ON learner_bookmarks(learner_id, case_id, active)`,
  `CREATE INDEX IF NOT EXISTS idx_learner_bookmark_events_actor ON learner_bookmark_events(actor_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_marks_attempt_revision ON marks(attempt_id, revision)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_attempt ON moderation_decisions(attempt_id)`,
  `CREATE INDEX IF NOT EXISTS idx_question_marks_question_revision ON question_marks(question_id, revision)`,
  `CREATE INDEX IF NOT EXISTS idx_criterion_marks_label_revision ON criterion_marks(criterion_label, revision)`,
  `CREATE INDEX IF NOT EXISTS idx_ingestion_status_created ON ingestion_jobs(status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_events(target_type, target_id)`,
];

let initialized = false;

export async function ensureDatabase() {
  if (!initialized) {
    await env.DB.batch(SCHEMA.map((statement) => env.DB.prepare(statement)));
    await ensureColumn("workbooks", "dual_display_allowed", "INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("assessment_versions", "dual_display_allowed", "INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("assessment_versions", "manifest_json", "TEXT");
    await ensureColumn("attempts", "preflight_passed_at", "TEXT");
    await ensureColumn("questions", "options_json", "TEXT NOT NULL DEFAULT '[]'");
    const questionPositionAdded = await ensureColumn("questions", "position", "INTEGER NOT NULL DEFAULT 1");
    if (questionPositionAdded)
      await env.DB.prepare(`UPDATE questions SET position = (SELECT COUNT(*) FROM questions ordered WHERE ordered.case_id = questions.case_id AND ordered.id <= questions.id)`).run();
    await ensureModerationEvidenceColumns();
    await seedCatalog();
    await backfillKnownAssessmentManifests();
    await env.DB.prepare(`PRAGMA optimize`).run();
    initialized = true;
  }
}

async function ensureColumn(table: "workbooks" | "assessment_versions" | "attempts" | "questions" | "moderation_decisions", column: string, definition: string) {
  const columns = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (columns.results.some((item) => item.name === column)) return false;
  await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  return true;
}

async function ensureModerationEvidenceColumns() {
  await ensureColumn("moderation_decisions", "original_examiner_id", "TEXT REFERENCES users(id)");
  await ensureColumn("moderation_decisions", "mark_revision", "INTEGER");
  await env.DB.prepare(
    `UPDATE moderation_decisions
        SET original_examiner_id = (
              SELECT m.examiner_id
                FROM marks m
               WHERE m.attempt_id = moderation_decisions.attempt_id
               ORDER BY m.revision DESC
               LIMIT 1
            ),
            mark_revision = (
              SELECT m.revision
                FROM marks m
               WHERE m.attempt_id = moderation_decisions.attempt_id
               ORDER BY m.revision DESC
               LIMIT 1
            )
      WHERE original_examiner_id IS NULL OR mark_revision IS NULL`,
  ).run();
  const incomplete = await env.DB.prepare(
    `SELECT COUNT(*) AS count
       FROM moderation_decisions
      WHERE original_examiner_id IS NULL OR mark_revision IS NULL`,
  ).first<{ count: number }>();
  if (Number(incomplete?.count ?? 0) > 0)
    throw new Error("Moderation evidence backfill failed: a preserved decision has no official mark revision.");
}

async function seedCatalog() {
  const now = "2026-08-20T08:00:00.000Z";
  const caseRows = [
    ["case-liver", "Hepatic lesion characterisation", "radiology", "published", 1, "Characterise an incidental focal liver lesion on multiphase CT.", "ct-abdomen", JSON.stringify(allowedTools("radiology")), "sha256:edu-case-liver-v1", 1, 1],
    ["case-chest", "Thoracic staging", "radiology", "published", 1, "Review an axial chest CT for staging-relevant findings.", "ct-chest", JSON.stringify(allowedTools("radiology")), "sha256:edu-case-chest-v1", 1, 1],
    ["case-colon", "Colonic adenocarcinoma", "pathology", "published", 1, "Review an H&E whole-slide teaching case.", "wsi-colon", JSON.stringify(allowedTools("pathology")), "sha256:edu-case-colon-v1", 1, 1],
    ["case-mixed", "Radiology–pathology correlation", "mixed", "published", 1, "Correlate staging CT with the corresponding de-identified biopsy slide.", "mixed", JSON.stringify(allowedTools("mixed")), "sha256:edu-case-mixed-v1", 1, 1],
  ];
  const questionRows = [
    ["q-liver", "case-liver", "Describe the principal imaging finding and give the most likely diagnosis.", 10, 1, "long-text"],
    ["q-chest", "case-chest", "Identify the staging-relevant thoracic abnormality and explain its significance.", 10, 1, "long-text"],
    ["q-colon", "case-colon", "Describe the glandular and stromal features that support the diagnosis.", 10, 1, "long-text"],
    ["q-mixed", "case-mixed", "Correlate the radiological and histological findings in a single integrated conclusion.", 10, 1, "long-text"],
  ];
  const noteRows = [
    ["note-liver", "case-liver", "Peripheral nodular enhancement", "Work through the enhancement pattern across phases before naming the lesion. The educational goal is to distinguish progressive centripetal fill-in from washout.", JSON.stringify(["Confirm the phase before interpreting enhancement", "Compare the periphery and centre", "Use morphology and time together"]), "A haemangioma classically demonstrates discontinuous peripheral nodular enhancement with progressive centripetal fill-in.", 1],
    ["note-chest", "case-chest", "A systematic staging review", "Use a fixed review sequence: lungs, pleura, mediastinum, nodes, chest wall and bones. Record findings that would alter stage separately from incidental findings.", JSON.stringify(["Review both lung and mediastinal windows", "Separate stage-changing findings", "Check the available comparison series"]), "The teaching target is a small right lower lobe pulmonary nodule requiring comparison and multidisciplinary correlation, not an automated diagnosis.", 1],
    ["note-colon", "case-colon", "Architecture before detail", "At low magnification, identify the relationship between irregular glands and the surrounding stroma. Then confirm nuclear and luminal features at higher magnification.", JSON.stringify(["Start at low magnification", "Look for desmoplasia", "Confirm dirty necrosis and atypia"]), "Invasive irregular glands set in desmoplastic stroma, with luminal necrosis, support colorectal adenocarcinoma in this teaching example.", 1],
    ["note-mixed", "case-mixed", "Build an integrated conclusion", "Move deliberately between the CT series and the pathology slide. Each modality answers a different part of the case; the conclusion should state how the findings support one another.", JSON.stringify(["Keep the active asset visible", "Cite one finding from each modality", "Avoid adding a clinical management recommendation"]), "The image set demonstrates how radiological staging context and invasive gland-forming morphology can be combined into a concise educational correlation.", 1],
  ];

  const statements = [
    env.DB.prepare(`INSERT OR IGNORE INTO courses (id, code, title, description, status) VALUES (?, ?, ?, ?, ?)`).bind("course-advanced-imaging", "RADPATH-401", "Advanced imaging & pathology", "A four-case assessment combining radiology, digital pathology and cross-modality correlation.", "active"),
    env.DB.prepare(`INSERT OR IGNORE INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`).bind("module-integrated", "course-advanced-imaging", "Integrated oncologic imaging", 1),
    env.DB.prepare(`INSERT OR IGNORE INTO workbooks (id, module_id, title, mode, version, status, duration_minutes, dual_display_allowed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind("workbook-assessment", "module-integrated", "Cross-modality assessment", "assessment", 1, "published", 75, 0),
    env.DB.prepare(`INSERT OR IGNORE INTO workbooks (id, module_id, title, mode, version, status, duration_minutes, dual_display_allowed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind("workbook-teaching-demo", "module-integrated", "Guided imaging teaching session", "teaching", 1, "published", 0, 1),
    env.DB.prepare(`INSERT OR IGNORE INTO assessment_versions (id, workbook_id, version, integrity_hash, viewer_core_version, published_at, status, dual_display_allowed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind("assessment-v1", "workbook-assessment", 1, "sha256:assessment-cross-modality-v1", "visible-medicine-viewer@1.0.0", now, "published", 0),
    env.DB.prepare(`INSERT OR IGNORE INTO assessment_versions (id, workbook_id, version, integrity_hash, viewer_core_version, published_at, status, dual_display_allowed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind("teaching-demo-v1", "workbook-teaching-demo", 1, "sha256:teaching-demo-v1", "visible-medicine-viewer@1.0.0", now, "published", 1),
  ];
  for (const row of caseRows) statements.push(env.DB.prepare(`INSERT OR IGNORE INTO cases (id, title, classification, status, version, description, visual_kind, tools_json, publication_hash, deidentified, publication_cleared) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(...row));
  for (const row of caseRows) statements.push(env.DB.prepare(`UPDATE cases SET tools_json = ? WHERE id = ?`).bind(row[7], row[0]));
  caseRows.forEach((row, index) => statements.push(env.DB.prepare(`INSERT OR IGNORE INTO workbook_cases (workbook_id, case_id, position) VALUES (?, ?, ?)`).bind("workbook-assessment", row[0], index + 1)));
  caseRows.forEach((row, index) => statements.push(env.DB.prepare(`INSERT OR IGNORE INTO workbook_cases (workbook_id, case_id, position) VALUES (?, ?, ?)`).bind("workbook-teaching-demo", row[0], index + 1)));
  // A short-lived compatibility fixture once linked case_chest into both seeded
  // workbooks. Preserve any orphaned record for audit/evidence safety, but never
  // expose it as a second selectable teaching case.
  statements.push(env.DB.prepare(`DELETE FROM workbook_cases WHERE case_id = 'case_chest'`));
  for (const row of questionRows) statements.push(env.DB.prepare(`INSERT OR IGNORE INTO questions (id, case_id, prompt, max_marks, version, response_type, options_json, position) VALUES (?, ?, ?, ?, ?, ?, '[]', 1)`).bind(...row));
  for (const row of noteRows) statements.push(env.DB.prepare(`INSERT OR IGNORE INTO teaching_notes (id, case_id, title, body, key_points_json, reveal_text, position) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(...row));
  for (const row of questionRows) statements.push(env.DB.prepare(`INSERT OR IGNORE INTO rubrics (id, question_id, version, criteria_json, status) VALUES (?, ?, ?, ?, ?)`).bind(`rubric-${row[0]}`, row[0], 1, JSON.stringify([{ label: "Observation", marks: 4 }, { label: "Interpretation", marks: 4 }, { label: "Clarity", marks: 2 }]), "published"));
  await env.DB.batch(statements);

  const systemUser = ["edu:system-examiner", "seed:system-examiner", "examiner@example.edu", "Dr Samira Vale", "administrator,instructor,examiner", now, now];
  const sampleCandidate = ["edu:sample-candidate", "seed:sample-candidate", "jordan.lee@example.edu", "Jordan Lee", "learner", now, now];
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO users (id, external_subject, email, display_name, roles, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(...systemUser),
    env.DB.prepare(`INSERT OR IGNORE INTO users (id, external_subject, email, display_name, roles, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(...sampleCandidate),
    env.DB.prepare(`INSERT OR IGNORE INTO enrolments (id, user_id, course_id, status, enrolled_at) VALUES (?, ?, ?, ?, ?)`).bind("enrolment-sample", "edu:sample-candidate", "course-advanced-imaging", "active", now),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_assignments (id, workbook_id, learner_id, status, assigned_by, assigned_at, due_at, revoked_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("assignment-sample-teaching", "workbook-teaching-demo", "edu:sample-candidate", "active", "edu:system-examiner", now, null, null, 1),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_assignments (id, workbook_id, learner_id, status, assigned_by, assigned_at, due_at, revoked_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("assignment-sample-assessment", "workbook-assessment", "edu:sample-candidate", "active", "edu:system-examiner", now, "2026-09-30T16:00:00.000Z", null, 1),
    env.DB.prepare(`INSERT OR IGNORE INTO attempts (id, user_id, assessment_version_id, state, started_at, deadline_at, submitted_at, receipt_hash, accommodation_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("attempt-sample-submitted", "edu:sample-candidate", "assessment-v1", "submitted", now, "2026-08-20T09:15:00.000Z", "2026-08-20T08:52:00.000Z", "sha256:sample-submission-receipt", 0),
    env.DB.prepare(`INSERT OR IGNORE INTO submissions (id, attempt_id, evidence_hash, submitted_at, status) VALUES (?, ?, ?, ?, ?)`).bind("submission-sample", "attempt-sample-submitted", "sha256:sample-submission-receipt", "2026-08-20T08:52:00.000Z", "accepted"),
    env.DB.prepare(`INSERT OR IGNORE INTO answers (attempt_id, question_id, response, revision, updated_at) VALUES (?, ?, ?, ?, ?)`).bind("attempt-sample-submitted", "q-liver", "Segment VI contains a well-circumscribed low-attenuation lesion with peripheral nodular enhancement and progressive fill-in, most consistent with a haemangioma.", 3, "2026-08-20T08:31:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO answers (attempt_id, question_id, response, revision, updated_at) VALUES (?, ?, ?, ?, ?)`).bind("attempt-sample-submitted", "q-chest", "A solitary right lower lobe pulmonary nodule requires correlation with the primary tumour and interval imaging.", 2, "2026-08-20T08:37:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO answers (attempt_id, question_id, response, revision, updated_at) VALUES (?, ?, ?, ?, ?)`).bind("attempt-sample-submitted", "q-colon", "Infiltrative irregular glands with luminal necrosis are present in a desmoplastic stroma.", 2, "2026-08-20T08:44:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO answers (attempt_id, question_id, response, revision, updated_at) VALUES (?, ?, ?, ?, ?)`).bind("attempt-sample-submitted", "q-mixed", "The imaging stage and invasive gland-forming morphology together support primary colonic adenocarcinoma with thoracic staging concern.", 2, "2026-08-20T08:50:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_authorship (workbook_id, author_id, created_at) VALUES (?, ?, ?)`).bind("workbook-assessment", "edu:system-examiner", now),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_authorship (workbook_id, author_id, created_at) VALUES (?, ?, ?)`).bind("workbook-teaching-demo", "edu:system-examiner", now),
    env.DB.prepare(`INSERT OR IGNORE INTO cohorts (id, course_id, title, code, status, created_by, created_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind("cohort-autumn-2026", "course-advanced-imaging", "Autumn 2026 teaching group", "AUT-26", "active", "edu:system-examiner", now, 1),
    env.DB.prepare(`INSERT OR IGNORE INTO cohort_members (cohort_id, learner_id, status, added_by, added_at, version) VALUES (?, ?, ?, ?, ?, ?)`).bind("cohort-autumn-2026", "edu:sample-candidate", "active", "edu:system-examiner", now, 1),
    env.DB.prepare(`INSERT OR IGNORE INTO cohort_workbook_assignments (id, cohort_id, workbook_id, status, assigned_by, assigned_at, available_from, due_at, expires_at, prerequisite_workbook_id, prerequisite_min_percent, revoked_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("cohort-assignment-autumn-teaching", "cohort-autumn-2026", "workbook-teaching-demo", "active", "edu:system-examiner", now, now, "2026-09-25T23:59:59.000Z", "2026-09-30T23:59:59.000Z", null, 100, null, 1),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_case_progress (workbook_id, learner_id, case_id, first_opened_at, last_opened_at) VALUES (?, ?, ?, ?, ?)`).bind("workbook-teaching-demo", "edu:sample-candidate", "case-liver", now, "2026-08-20T08:10:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_case_progress (workbook_id, learner_id, case_id, first_opened_at, last_opened_at) VALUES (?, ?, ?, ?, ?)`).bind("workbook-teaching-demo", "edu:sample-candidate", "case-chest", now, "2026-08-20T08:16:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_case_progress (workbook_id, learner_id, case_id, first_opened_at, last_opened_at) VALUES (?, ?, ?, ?, ?)`).bind("workbook-teaching-demo", "edu:sample-candidate", "case-colon", now, "2026-08-20T08:24:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO workbook_progress (workbook_id, learner_id, status, cases_visited, cases_total, percent_complete, first_opened_at, last_activity_at, completed_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("workbook-teaching-demo", "edu:sample-candidate", "in-progress", 3, 4, 75, now, "2026-08-20T08:24:00.000Z", null, 3),
    env.DB.prepare(`INSERT OR IGNORE INTO learner_accommodations (id, workbook_id, learner_id, extra_time_minutes, rest_break_minutes, reason, status, requested_by, approved_by, requested_at, approved_at, revoked_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("accommodation-sample", "workbook-assessment", "edu:sample-candidate", 15, 5, "Approved education assessment adjustment", "approved", "edu:system-examiner", "edu:system-examiner", now, now, null, 2),
    env.DB.prepare(`INSERT OR IGNORE INTO marks (id, attempt_id, examiner_id, score, max_score, feedback, revision, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind("mark-sample-v1", "attempt-sample-submitted", "edu:system-examiner", 29, 40, "A structured response with strong observations; make the integrated conclusion more explicit.", 1, "2026-08-20T09:10:00.000Z"),
    env.DB.prepare(`UPDATE users SET roles = ? WHERE id = ?`).bind("administrator,instructor,examiner", "edu:system-examiner"),
    env.DB.prepare(`UPDATE users SET roles = ? WHERE id = ?`).bind("learner", "edu:sample-candidate"),
    env.DB.prepare(`UPDATE attempts SET state = 'marked' WHERE id = ? AND state = 'submitted'`).bind("attempt-sample-submitted"),
  ]);

  if (process.env.NODE_ENV !== "production") {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO users (id, external_subject, email, display_name, roles, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, roles = excluded.roles, last_seen_at = excluded.last_seen_at`).bind("edu:local-demo-user", "local:demo-user", "avery.morgan@example.edu", "Avery Morgan", LOCAL_DEMO_EDUCATION_ROLES, now, now),
      env.DB.prepare(`INSERT INTO enrolments (id, user_id, course_id, status, enrolled_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status = 'active'`).bind("enrolment:edu:local-demo-user", "edu:local-demo-user", "course-advanced-imaging", "active", now),
    ]);
  }

  const seededQuestionScores = [["q-liver", 7], ["q-chest", 7], ["q-colon", 8], ["q-mixed", 7]] as const;
  const seededCriterionScores: Record<string, readonly [number, number, number]> = { "q-liver": [3, 3, 1], "q-chest": [3, 3, 1], "q-colon": [3, 3, 2], "q-mixed": [3, 3, 1] };
  const criterionDefinitions = [["Observation", 4], ["Interpretation", 4], ["Clarity", 2]] as const;
  await env.DB.batch([
    ...seededQuestionScores.map(([questionId, score]) => env.DB.prepare(`INSERT OR IGNORE INTO question_marks (id, attempt_id, question_id, examiner_id, score, max_score, revision, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(`question-mark-sample-${questionId}`, "attempt-sample-submitted", questionId, "edu:system-examiner", score, 10, 1, "2026-08-20T09:10:00.000Z")),
    ...seededQuestionScores.flatMap(([questionId]) => criterionDefinitions.map(([label, maxScore], index) => env.DB.prepare(`INSERT OR IGNORE INTO criterion_marks (id, attempt_id, question_id, criterion_label, examiner_id, score, max_score, revision, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(`criterion-mark-sample-${questionId}-${index}`, "attempt-sample-submitted", questionId, label, "edu:system-examiner", seededCriterionScores[questionId][index], maxScore, 1, "2026-08-20T09:10:00.000Z"))),
  ]);

  const pollOptions = [
    { id: "option-1", label: "Discontinuous peripheral nodular enhancement with progressive fill-in" },
    { id: "option-2", label: "Homogeneous arterial enhancement followed by washout" },
    { id: "option-3", label: "A thick irregular enhancing rim with central non-enhancement" },
    { id: "option-4", label: "No enhancement across the available phases" },
  ];
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO teaching_polls (id, workbook_id, case_id, prompt, selection_mode, options_json, correct_option_ids_json, explanation, position, version, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("poll-liver-enhancement", "workbook-teaching-demo", "case-liver", "Which enhancement pattern best supports the teaching diagnosis in this case?", "single", JSON.stringify(pollOptions), JSON.stringify(["option-1"]), "The characteristic teaching pattern is discontinuous peripheral nodular enhancement followed by progressive centripetal fill-in.", 1, 1, "published", "edu:system-examiner", now, now),
    env.DB.prepare(`INSERT OR IGNORE INTO teaching_poll_runs (id, poll_id, instructor_id, state, results_revealed, version, opened_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind("run-liver-enhancement-demo", "poll-liver-enhancement", "edu:system-examiner", "open", 0, 1, now, null),
    env.DB.prepare(`INSERT OR IGNORE INTO teaching_poll_responses (run_id, learner_id, selections_json, revision, responded_at) VALUES (?, ?, ?, ?, ?)`).bind("run-liver-enhancement-demo", "edu:sample-candidate", JSON.stringify(["option-1"]), 1, now),
  ]);

  const liverGeometry = educationGeometryForCase("case-liver");
  const scene: ViewerScene = {
    schema: "didanix-education-viewer-scene-v1",
    layout: { rows: 1, columns: 3 },
    viewports: liverGeometry.map((series, order) => {
      const saved = series.frames[order === 0 ? 42 : 51];
      return { id: `plane-${series.plane}`, order, studyInstanceUid: series.studyInstanceUid, seriesInstanceUid: series.seriesInstanceUid, sopInstanceUid: saved.sopInstanceUid, frame: saved.frame, sliceIndex: saved.sliceIndex, plane: series.plane, windowCenter: 50, windowWidth: 350, zoom: 1.12, panX: 0, panY: 0 };
    }),
    crosshairPatient: [0, 0, -15], annotationVisibility: "visible",
    annotations: [{ id: "teaching-arrow-lesion", kind: "arrow", label: "Progressive peripheral enhancement", visible: true, answerBearing: true, points: [142, 116, 165, 102] }],
    instructorNotes: "Follow the same patient-space point through all three planes before reviewing the teaching explanation.",
  };
  const presentationId = "10000000-0000-4000-8000-000000000001";
  const presentationEventId = "10000000-0000-4000-8000-000000000002";
  const requestHash = await sha256(JSON.stringify({ presentationId, title: "Tri-planar lesion walkthrough", scenes: [scene] }));
  const eventHash = await sha256(JSON.stringify({ presentationEventId, presentationId, sequence: 1, operation: "CREATED", requestHash, previousEventHash: "GENESIS", snapshot: [scene] }));
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO instructor_presentations (id, scope_type, scope_id, title, owner_id, version, active, visibility_policy, scenes_json, created_at, updated_at, head_event_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(presentationId, "case", "case-liver", "Tri-planar lesion walkthrough", "edu:system-examiner", 1, 1, "teaching-only", JSON.stringify([scene]), now, now, eventHash),
    env.DB.prepare(`INSERT OR IGNORE INTO instructor_presentation_events (event_id, presentation_id, sequence, operation, actor_id, request_hash, snapshot_json, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(presentationEventId, presentationId, 1, "CREATED", "edu:system-examiner", requestHash, JSON.stringify([scene]), "GENESIS", eventHash, now),
  ]);

  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO ingestion_jobs (id, title, declared_type, detected_type, status, deidentified, publication_cleared, reason_codes_json, content_hash, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("ingest-ct-ready", "Liver multiphase CT", "radiology", "radiology", "ready-for-review", 1, 1, JSON.stringify(["SUPPORTED_RADIOLOGY_PROFILE"]), "sha256:ingest-liver", "edu:system-examiner", "2026-08-20T07:30:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO ingestion_jobs (id, title, declared_type, detected_type, status, deidentified, publication_cleared, reason_codes_json, content_hash, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("ingest-wsi-review", "Colectomy H&E slide", "pathology", "requires-review", "requires-review", 0, 1, JSON.stringify(["DEIDENTIFICATION_NOT_CONFIRMED", "SLIDE_LABEL_REVIEW_REQUIRED"]), "sha256:ingest-wsi", "edu:system-examiner", "2026-08-20T07:42:00.000Z"),
    env.DB.prepare(`INSERT OR IGNORE INTO ingestion_jobs (id, title, declared_type, detected_type, status, deidentified, publication_cleared, reason_codes_json, content_hash, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("ingest-mixed-review", "CT and biopsy correlation set", "mixed", "mixed", "requires-review", 1, 1, JSON.stringify(["RADIOLOGY_AND_PATHOLOGY_PRESENT", "HUMAN_MIXED_CASE_REVIEW_REQUIRED"]), "sha256:ingest-mixed", "edu:system-examiner", "2026-08-20T07:55:00.000Z"),
  ]);
}

export async function ensureEducationUser(auth: AuthContext) {
  await ensureDatabase();
  const now = new Date().toISOString();
  const existing = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(auth.userId)
    .first<{ roles: string }>();
  const decision = decideEducationUserProvisioning(
    existing?.roles,
    auth,
    process.env.NODE_ENV,
  );
  await env.DB.prepare(`INSERT INTO users (id, external_subject, email, display_name, roles, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, roles = excluded.roles, last_seen_at = excluded.last_seen_at`).bind(auth.userId, auth.externalSubject, auth.email, auth.displayName, decision.roles, now, now).run();
  await env.DB.prepare(`INSERT INTO account_security_profiles (user_id, status, identity_provider, registered_at, last_authenticated_at, terms_version, privacy_version, terms_accepted_at, privacy_accepted_at, updated_at) VALUES (?, 'active', ?, ?, ?, '', '', NULL, NULL, ?) ON CONFLICT(user_id) DO UPDATE SET identity_provider=excluded.identity_provider, last_authenticated_at=excluded.last_authenticated_at, updated_at=excluded.updated_at`).bind(auth.userId, identityProviderForSubject(auth.externalSubject), now, now, now).run();
  const security = await env.DB.prepare(`SELECT status, identity_provider FROM account_security_profiles WHERE user_id=?`).bind(auth.userId).first<{ status: string; identity_provider: string }>();
  return {
    roles: decision.roles.split(",").filter(Boolean),
    status: security?.status ?? "active",
    identityProvider: security?.identity_provider ?? identityProviderForSubject(auth.externalSubject),
    localDemo: decision.localDemo,
    evaluationAdministrator: decision.evaluationAdministrator,
    bootstrapDefaultOrganization: decision.bootstrapDefaultOrganization,
  };
}

export async function appendAudit(actorId: string, action: string, targetType: string, targetId: string, outcome = "success", reason = "") {
  for (let collision = 0; collision < 5; collision += 1) {
    const previous = await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
    const sequence = (previous?.sequence ?? 0) + 1;
    const occurredAt = new Date().toISOString();
    const integrityHash = await sha256(`${previous?.integrity_hash ?? "GENESIS"}|${sequence}|${actorId}|${action}|${targetType}|${targetId}|${outcome}|${reason}|${occurredAt}`);
    try {
      await env.DB.prepare(`INSERT INTO audit_events (id, sequence, actor_id, action, target_type, target_id, outcome, reason, occurred_at, integrity_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), sequence, actorId, action, targetType, targetId, outcome, reason, occurredAt, integrityHash).run();
      return;
    } catch (error) {
      if (!isAuditSequenceCollision(error) || collision === 4) throw error;
      // A concurrent writer may have claimed this sequence; rebuild from the new head.
    }
  }
}
