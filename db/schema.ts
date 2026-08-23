import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), externalSubject: text("external_subject").notNull(), email: text("email").notNull(), displayName: text("display_name").notNull(), roles: text("roles").notNull(), createdAt: text("created_at").notNull(), lastSeenAt: text("last_seen_at").notNull(),
}, (table) => [uniqueIndex("idx_users_external_subject").on(table.externalSubject)]);

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(), code: text("code").notNull(), title: text("title").notNull(), description: text("description").notNull(), status: text("status").notNull(),
}, (table) => [uniqueIndex("idx_courses_code").on(table.code)]);

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(), courseId: text("course_id").notNull().references(() => courses.id), title: text("title").notNull(), position: integer("position").notNull(),
}, (table) => [index("idx_modules_course_position").on(table.courseId, table.position)]);

export const workbooks = sqliteTable("workbooks", {
  id: text("id").primaryKey(), moduleId: text("module_id").notNull().references(() => modules.id), title: text("title").notNull(), mode: text("mode").notNull(), version: integer("version").notNull(), status: text("status").notNull(), durationMinutes: integer("duration_minutes").notNull(), dualDisplayAllowed: integer("dual_display_allowed", { mode: "boolean" }).notNull().default(false),
}, (table) => [index("idx_workbooks_module").on(table.moduleId)]);

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(), title: text("title").notNull(), classification: text("classification").notNull(), status: text("status").notNull(), version: integer("version").notNull(), description: text("description").notNull(), visualKind: text("visual_kind").notNull(), toolsJson: text("tools_json").notNull(), publicationHash: text("publication_hash").notNull(), deidentified: integer("deidentified", { mode: "boolean" }).notNull(), publicationCleared: integer("publication_cleared", { mode: "boolean" }).notNull(),
}, (table) => [index("idx_cases_classification_status").on(table.classification, table.status)]);

export const workbookCases = sqliteTable("workbook_cases", {
  workbookId: text("workbook_id").notNull().references(() => workbooks.id), caseId: text("case_id").notNull().references(() => cases.id), position: integer("position").notNull(),
}, (table) => [primaryKey({ columns: [table.workbookId, table.caseId] }), index("idx_workbook_cases_order").on(table.workbookId, table.position)]);

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(), caseId: text("case_id").notNull().references(() => cases.id), prompt: text("prompt").notNull(), maxMarks: integer("max_marks").notNull(), version: integer("version").notNull(), responseType: text("response_type").notNull(), optionsJson: text("options_json").notNull().default("[]"), position: integer("position").notNull().default(1),
}, (table) => [index("idx_questions_case").on(table.caseId)]);

export const workbookDraftQuestionEdits = sqliteTable("workbook_draft_question_edits", {
  workbookId: text("workbook_id").notNull().references(() => workbooks.id), questionId: text("question_id").notNull().references(() => questions.id), prompt: text("prompt").notNull(), revision: integer("revision").notNull(), updatedBy: text("updated_by").notNull().references(() => users.id), updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.workbookId, table.questionId] }), index("idx_workbook_draft_question_edits_workbook").on(table.workbookId)]);

export const questionBankItems = sqliteTable("question_bank_items", {
  id: text("id").primaryKey(), title: text("title").notNull(), prompt: text("prompt").notNull(), responseType: text("response_type").notNull(), maxMarks: integer("max_marks").notNull(), modality: text("modality").notNull(), difficulty: text("difficulty").notNull(), tagsJson: text("tags_json").notNull(), optionsJson: text("options_json").notNull(), correctOptionIndexesJson: text("correct_option_indexes_json").notNull(), rationale: text("rationale").notNull(), status: text("status").notNull(), version: integer("version").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_question_bank_status_modality_difficulty").on(table.status, table.modality, table.difficulty), index("idx_question_bank_creator").on(table.createdBy)]);

export const educationIntegrations = sqliteTable("education_integrations", {
  id: text("id").primaryKey(), kind: text("kind").notNull(), issuer: text("issuer").notNull(), clientId: text("client_id").notNull(), deploymentId: text("deployment_id").notNull(), authorizationEndpoint: text("authorization_endpoint").notNull(), tokenEndpoint: text("token_endpoint").notNull(), jwksEndpoint: text("jwks_endpoint").notNull(), status: text("status").notNull(), version: integer("version").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("idx_education_integrations_kind").on(table.kind)]);

export const teachingNotes = sqliteTable("teaching_notes", {
  id: text("id").primaryKey(), caseId: text("case_id").notNull().references(() => cases.id), title: text("title").notNull(), body: text("body").notNull(), keyPointsJson: text("key_points_json").notNull(), revealText: text("reveal_text").notNull(), position: integer("position").notNull(),
}, (table) => [index("idx_teaching_notes_case_position").on(table.caseId, table.position)]);

export const teachingPolls = sqliteTable("teaching_polls", {
  id: text("id").primaryKey(), workbookId: text("workbook_id").notNull().references(() => workbooks.id), caseId: text("case_id").notNull().references(() => cases.id), prompt: text("prompt").notNull(), selectionMode: text("selection_mode").notNull(), optionsJson: text("options_json").notNull(), correctOptionIdsJson: text("correct_option_ids_json").notNull(), explanation: text("explanation").notNull(), position: integer("position").notNull(), version: integer("version").notNull(), status: text("status").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_teaching_polls_case_status_position").on(table.caseId, table.status, table.position), index("idx_teaching_polls_workbook").on(table.workbookId)]);

export const teachingPollRuns = sqliteTable("teaching_poll_runs", {
  id: text("id").primaryKey(), pollId: text("poll_id").notNull().references(() => teachingPolls.id), instructorId: text("instructor_id").notNull().references(() => users.id), state: text("state").notNull(), resultsRevealed: integer("results_revealed", { mode: "boolean" }).notNull().default(false), version: integer("version").notNull(), openedAt: text("opened_at").notNull(), closedAt: text("closed_at"),
}, (table) => [index("idx_teaching_poll_runs_poll_opened").on(table.pollId, table.openedAt), index("idx_teaching_poll_runs_instructor").on(table.instructorId)]);

export const teachingPollResponses = sqliteTable("teaching_poll_responses", {
  runId: text("run_id").notNull().references(() => teachingPollRuns.id), learnerId: text("learner_id").notNull().references(() => users.id), selectionsJson: text("selections_json").notNull(), revision: integer("revision").notNull(), respondedAt: text("responded_at").notNull(),
}, (table) => [primaryKey({ columns: [table.runId, table.learnerId] }), index("idx_teaching_poll_responses_run").on(table.runId)]);

export const teachingSessions = sqliteTable("teaching_sessions", {
  id: text("id").primaryKey(), workbookId: text("workbook_id").notNull().references(() => workbooks.id), instructorId: text("instructor_id").notNull().references(() => users.id), state: text("state").notNull(), activeCaseId: text("active_case_id").notNull().references(() => cases.id), viewerStateJson: text("viewer_state_json").notNull(), activeSceneIndex: integer("active_scene_index"), version: integer("version").notNull(), startedAt: text("started_at").notNull(), updatedAt: text("updated_at").notNull(), endedAt: text("ended_at"),
}, (table) => [index("idx_teaching_sessions_workbook_state_updated").on(table.workbookId, table.state, table.updatedAt), index("idx_teaching_sessions_instructor").on(table.instructorId)]);

export const teachingSessionParticipants = sqliteTable("teaching_session_participants", {
  sessionId: text("session_id").notNull().references(() => teachingSessions.id), learnerId: text("learner_id").notNull().references(() => users.id), followState: text("follow_state").notNull(), currentCaseId: text("current_case_id").notNull().references(() => cases.id), joinedAt: text("joined_at").notNull(), lastSeenAt: text("last_seen_at").notNull(),
}, (table) => [primaryKey({ columns: [table.sessionId, table.learnerId] }), index("idx_teaching_session_participants_session_state_seen").on(table.sessionId, table.followState, table.lastSeenAt)]);

export const teachingContentBlocks = sqliteTable("teaching_content_blocks", {
  id: text("id").primaryKey(), workbookId: text("workbook_id").notNull().references(() => workbooks.id), caseId: text("case_id").notNull().references(() => cases.id), type: text("type").notNull(), title: text("title").notNull(), body: text("body").notNull(), url: text("url").notNull(), position: integer("position").notNull(), version: integer("version").notNull(), status: text("status").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_teaching_content_case_status_position").on(table.caseId, table.status, table.position), index("idx_teaching_content_workbook").on(table.workbookId)]);

export const rubrics = sqliteTable("rubrics", {
  id: text("id").primaryKey(), questionId: text("question_id").notNull().references(() => questions.id), version: integer("version").notNull(), criteriaJson: text("criteria_json").notNull(), status: text("status").notNull(),
}, (table) => [uniqueIndex("idx_rubrics_question_version").on(table.questionId, table.version)]);

export const assessmentVersions = sqliteTable("assessment_versions", {
  id: text("id").primaryKey(), workbookId: text("workbook_id").notNull().references(() => workbooks.id), version: integer("version").notNull(), integrityHash: text("integrity_hash").notNull(), manifestJson: text("manifest_json"), viewerCoreVersion: text("viewer_core_version").notNull(), publishedAt: text("published_at").notNull(), status: text("status").notNull(), dualDisplayAllowed: integer("dual_display_allowed", { mode: "boolean" }).notNull().default(false),
}, (table) => [uniqueIndex("idx_assessment_workbook_version").on(table.workbookId, table.version)]);

export const enrolments = sqliteTable("enrolments", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), courseId: text("course_id").notNull().references(() => courses.id), status: text("status").notNull(), enrolledAt: text("enrolled_at").notNull(),
}, (table) => [uniqueIndex("idx_enrolments_user_course").on(table.userId, table.courseId)]);

export const workbookAssignments = sqliteTable("workbook_assignments", {
  id: text("id").primaryKey(), workbookId: text("workbook_id").notNull().references(() => workbooks.id), learnerId: text("learner_id").notNull().references(() => users.id), status: text("status").notNull(), assignedBy: text("assigned_by").notNull().references(() => users.id), assignedAt: text("assigned_at").notNull(), dueAt: text("due_at"), revokedAt: text("revoked_at"), version: integer("version").notNull(),
}, (table) => [uniqueIndex("idx_workbook_assignments_workbook_learner").on(table.workbookId, table.learnerId), index("idx_workbook_assignments_learner_status").on(table.learnerId, table.status), index("idx_workbook_assignments_workbook_status").on(table.workbookId, table.status)]);

export const workbookAssignmentRules = sqliteTable("workbook_assignment_rules", {
  assignmentId: text("assignment_id").primaryKey().references(() => workbookAssignments.id), availableFrom: text("available_from"), expiresAt: text("expires_at"), prerequisiteWorkbookId: text("prerequisite_workbook_id").references(() => workbooks.id), prerequisiteMinPercent: integer("prerequisite_min_percent").notNull().default(100), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_workbook_assignment_rules_prerequisite").on(table.prerequisiteWorkbookId)]);

export const cohorts = sqliteTable("cohorts", {
  id: text("id").primaryKey(), courseId: text("course_id").notNull().references(() => courses.id), title: text("title").notNull(), code: text("code").notNull(), status: text("status").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), version: integer("version").notNull(),
}, (table) => [uniqueIndex("idx_cohorts_course_code").on(table.courseId, table.code), index("idx_cohorts_course_status").on(table.courseId, table.status)]);

export const cohortMembers = sqliteTable("cohort_members", {
  cohortId: text("cohort_id").notNull().references(() => cohorts.id), learnerId: text("learner_id").notNull().references(() => users.id), status: text("status").notNull(), addedBy: text("added_by").notNull().references(() => users.id), addedAt: text("added_at").notNull(), version: integer("version").notNull(),
}, (table) => [primaryKey({ columns: [table.cohortId, table.learnerId] }), index("idx_cohort_members_learner_status").on(table.learnerId, table.status)]);

export const cohortWorkbookAssignments = sqliteTable("cohort_workbook_assignments", {
  id: text("id").primaryKey(), cohortId: text("cohort_id").notNull().references(() => cohorts.id), workbookId: text("workbook_id").notNull().references(() => workbooks.id), status: text("status").notNull(), assignedBy: text("assigned_by").notNull().references(() => users.id), assignedAt: text("assigned_at").notNull(), availableFrom: text("available_from"), dueAt: text("due_at"), expiresAt: text("expires_at"), prerequisiteWorkbookId: text("prerequisite_workbook_id").references(() => workbooks.id), prerequisiteMinPercent: integer("prerequisite_min_percent").notNull().default(100), revokedAt: text("revoked_at"), version: integer("version").notNull(),
}, (table) => [uniqueIndex("idx_cohort_workbook_assignment_unique").on(table.cohortId, table.workbookId), index("idx_cohort_workbook_assignments_cohort_status").on(table.cohortId, table.status), index("idx_cohort_workbook_assignments_workbook_status").on(table.workbookId, table.status)]);

export const workbookCaseProgress = sqliteTable("workbook_case_progress", {
  workbookId: text("workbook_id").notNull().references(() => workbooks.id), learnerId: text("learner_id").notNull().references(() => users.id), caseId: text("case_id").notNull().references(() => cases.id), firstOpenedAt: text("first_opened_at").notNull(), lastOpenedAt: text("last_opened_at").notNull(),
}, (table) => [primaryKey({ columns: [table.workbookId, table.learnerId, table.caseId] }), index("idx_workbook_case_progress_learner_recent").on(table.learnerId, table.lastOpenedAt)]);

export const workbookProgress = sqliteTable("workbook_progress", {
  workbookId: text("workbook_id").notNull().references(() => workbooks.id), learnerId: text("learner_id").notNull().references(() => users.id), status: text("status").notNull(), casesVisited: integer("cases_visited").notNull(), casesTotal: integer("cases_total").notNull(), percentComplete: integer("percent_complete").notNull(), firstOpenedAt: text("first_opened_at").notNull(), lastActivityAt: text("last_activity_at").notNull(), completedAt: text("completed_at"), version: integer("version").notNull(),
}, (table) => [primaryKey({ columns: [table.workbookId, table.learnerId] }), index("idx_workbook_progress_workbook_status").on(table.workbookId, table.status), index("idx_workbook_progress_learner_status").on(table.learnerId, table.status)]);

export const learnerAccommodations = sqliteTable("learner_accommodations", {
  id: text("id").primaryKey(), workbookId: text("workbook_id").notNull().references(() => workbooks.id), learnerId: text("learner_id").notNull().references(() => users.id), extraTimeMinutes: integer("extra_time_minutes").notNull(), restBreakMinutes: integer("rest_break_minutes").notNull(), reason: text("reason").notNull(), status: text("status").notNull(), requestedBy: text("requested_by").notNull().references(() => users.id), approvedBy: text("approved_by").references(() => users.id), requestedAt: text("requested_at").notNull(), approvedAt: text("approved_at"), revokedAt: text("revoked_at"), version: integer("version").notNull(),
}, (table) => [uniqueIndex("idx_learner_accommodations_workbook_learner").on(table.workbookId, table.learnerId), index("idx_learner_accommodations_learner_status").on(table.learnerId, table.status)]);

export const workbookAuthorship = sqliteTable("workbook_authorship", {
  workbookId: text("workbook_id").primaryKey().references(() => workbooks.id), authorId: text("author_id").notNull().references(() => users.id), createdAt: text("created_at").notNull(),
}, (table) => [index("idx_workbook_authorship_author").on(table.authorId)]);

export const workbookReviews = sqliteTable("workbook_reviews", {
  id: text("id").primaryKey(), workbookId: text("workbook_id").notNull().references(() => workbooks.id), reviewerId: text("reviewer_id").notNull().references(() => users.id), decision: text("decision").notNull(), comment: text("comment").notNull(), revision: integer("revision").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_workbook_reviews_revision").on(table.workbookId, table.revision), index("idx_workbook_reviews_reviewer").on(table.reviewerId)]);

export const workbookRecoveries = sqliteTable("workbook_recoveries", {
  draftWorkbookId: text("draft_workbook_id").primaryKey().references(() => workbooks.id), sourceWorkbookId: text("source_workbook_id").notNull().references(() => workbooks.id), sourceAssessmentVersionId: text("source_assessment_version_id").notNull().references(() => assessmentVersions.id), sourceIntegrityHash: text("source_integrity_hash").notNull(), copiedCaseIdsJson: text("copied_case_ids_json").notNull(), excludedEvidenceJson: text("excluded_evidence_json").notNull(), historyReconstructed: integer("history_reconstructed", { mode: "boolean" }).notNull().default(false), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(),
}, (table) => [index("idx_workbook_recoveries_source").on(table.sourceWorkbookId)]);

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), assessmentVersionId: text("assessment_version_id").notNull().references(() => assessmentVersions.id), state: text("state").notNull(), startedAt: text("started_at").notNull(), deadlineAt: text("deadline_at").notNull(), preflightPassedAt: text("preflight_passed_at"), submittedAt: text("submitted_at"), receiptHash: text("receipt_hash"), accommodationMinutes: integer("accommodation_minutes").notNull().default(0),
}, (table) => [index("idx_attempts_user_state").on(table.userId, table.state)]);

export const answers = sqliteTable("answers", {
  attemptId: text("attempt_id").notNull().references(() => attempts.id), questionId: text("question_id").notNull().references(() => questions.id), response: text("response").notNull(), revision: integer("revision").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.attemptId, table.questionId] })]);

export const annotations = sqliteTable("annotations", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), caseId: text("case_id").notNull().references(() => cases.id), kind: text("kind").notNull(), label: text("label").notNull(), geometryJson: text("geometry_json").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [index("idx_annotations_attempt_case").on(table.attemptId, table.caseId)]);

export const keyImages = sqliteTable("key_images", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), caseId: text("case_id").notNull().references(() => cases.id), frameIndex: integer("frame_index").notNull(), viewportJson: text("viewport_json").notNull(), viewerCoreVersion: text("viewer_core_version").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [index("idx_key_images_attempt_case").on(table.attemptId, table.caseId)]);

export const attemptCaseFlags = sqliteTable("attempt_case_flags", {
  attemptId: text("attempt_id").notNull().references(() => attempts.id),
  caseId: text("case_id").notNull().references(() => cases.id),
  flagged: integer("flagged", { mode: "boolean" }).notNull(),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.attemptId, table.caseId] }),
  index("idx_attempt_case_flags_attempt").on(table.attemptId, table.flagged),
]);

export const instructorPresentations = sqliteTable("instructor_presentations", {
  id: text("id").primaryKey(), scopeType: text("scope_type").notNull(), scopeId: text("scope_id").notNull(), title: text("title").notNull(), ownerId: text("owner_id").notNull().references(() => users.id), version: integer("version").notNull(), active: integer("active", { mode: "boolean" }).notNull(), visibilityPolicy: text("visibility_policy").notNull(), scenesJson: text("scenes_json").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(), headEventHash: text("head_event_hash").notNull(),
}, (table) => [index("idx_instructor_presentations_scope").on(table.scopeType, table.scopeId, table.active), index("idx_instructor_presentations_owner").on(table.ownerId)]);

export const instructorPresentationEvents = sqliteTable("instructor_presentation_events", {
  eventId: text("event_id").primaryKey(), presentationId: text("presentation_id").notNull().references(() => instructorPresentations.id), sequence: integer("sequence").notNull(), operation: text("operation").notNull(), actorId: text("actor_id").notNull().references(() => users.id), requestHash: text("request_hash").notNull(), snapshotJson: text("snapshot_json").notNull(), previousEventHash: text("previous_event_hash").notNull(), eventHash: text("event_hash").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_instructor_presentation_event_sequence").on(table.presentationId, table.sequence), index("idx_instructor_presentation_events_actor").on(table.actorId)]);

export const learnerBookmarks = sqliteTable("learner_bookmarks", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => users.id), caseId: text("case_id").notNull().references(() => cases.id), title: text("title").notNull(), version: integer("version").notNull(), active: integer("active", { mode: "boolean" }).notNull(), sceneJson: text("scene_json").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(), headEventHash: text("head_event_hash").notNull(),
}, (table) => [index("idx_learner_bookmarks_owner_case").on(table.learnerId, table.caseId, table.active)]);

export const learnerBookmarkEvents = sqliteTable("learner_bookmark_events", {
  eventId: text("event_id").primaryKey(), bookmarkId: text("bookmark_id").notNull().references(() => learnerBookmarks.id), sequence: integer("sequence").notNull(), operation: text("operation").notNull(), actorId: text("actor_id").notNull().references(() => users.id), requestHash: text("request_hash").notNull(), snapshotJson: text("snapshot_json").notNull(), previousEventHash: text("previous_event_hash").notNull(), eventHash: text("event_hash").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_learner_bookmark_event_sequence").on(table.bookmarkId, table.sequence), index("idx_learner_bookmark_events_actor").on(table.actorId)]);

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), evidenceHash: text("evidence_hash").notNull(), submittedAt: text("submitted_at").notNull(), status: text("status").notNull(),
}, (table) => [uniqueIndex("idx_submissions_attempt").on(table.attemptId)]);

export const marks = sqliteTable("marks", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), examinerId: text("examiner_id").notNull().references(() => users.id), score: integer("score").notNull(), maxScore: integer("max_score").notNull(), feedback: text("feedback").notNull(), revision: integer("revision").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_marks_attempt_revision").on(table.attemptId, table.revision)]);

export const questionMarks = sqliteTable("question_marks", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), questionId: text("question_id").notNull().references(() => questions.id), examinerId: text("examiner_id").notNull().references(() => users.id), score: integer("score").notNull(), maxScore: integer("max_score").notNull(), revision: integer("revision").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_question_marks_revision").on(table.attemptId, table.questionId, table.revision), index("idx_question_marks_question_revision").on(table.questionId, table.revision)]);

export const criterionMarks = sqliteTable("criterion_marks", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), questionId: text("question_id").notNull().references(() => questions.id), criterionLabel: text("criterion_label").notNull(), examinerId: text("examiner_id").notNull().references(() => users.id), score: integer("score").notNull(), maxScore: integer("max_score").notNull(), revision: integer("revision").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_criterion_marks_revision").on(table.attemptId, table.questionId, table.criterionLabel, table.revision), index("idx_criterion_marks_label_revision").on(table.criterionLabel, table.revision)]);

export const moderationDecisions = sqliteTable("moderation_decisions", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), moderatorId: text("moderator_id").notNull().references(() => users.id), originalExaminerId: text("original_examiner_id").notNull().references(() => users.id), markRevision: integer("mark_revision").notNull(), originalScore: integer("original_score").notNull(), finalScore: integer("final_score").notNull(), reason: text("reason").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_moderation_attempt").on(table.attemptId)]);

export const resultReleases = sqliteTable("result_releases", {
  id: text("id").primaryKey(), title: text("title").notNull(), approvedBy: text("approved_by").notNull().references(() => users.id), status: text("status").notNull(), releasedAt: text("released_at").notNull(), populationHash: text("population_hash").notNull(),
});

export const results = sqliteTable("results", {
  id: text("id").primaryKey(), attemptId: text("attempt_id").notNull().references(() => attempts.id), releaseId: text("release_id").notNull().references(() => resultReleases.id), score: integer("score").notNull(), maxScore: integer("max_score").notNull(), outcome: text("outcome").notNull(), releasedAt: text("released_at").notNull(),
}, (table) => [uniqueIndex("idx_results_attempt").on(table.attemptId)]);

export const ingestionJobs = sqliteTable("ingestion_jobs", {
  id: text("id").primaryKey(), title: text("title").notNull(), declaredType: text("declared_type").notNull(), detectedType: text("detected_type").notNull(), status: text("status").notNull(), deidentified: integer("deidentified", { mode: "boolean" }).notNull(), publicationCleared: integer("publication_cleared", { mode: "boolean" }).notNull(), reasonCodesJson: text("reason_codes_json").notNull(), contentHash: text("content_hash").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), reviewedBy: text("reviewed_by"), reviewedAt: text("reviewed_at"),
}, (table) => [index("idx_ingestion_status_created").on(table.status, table.createdAt)]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(), sequence: integer("sequence").notNull(), actorId: text("actor_id").notNull(), action: text("action").notNull(), targetType: text("target_type").notNull(), targetId: text("target_id").notNull(), outcome: text("outcome").notNull(), reason: text("reason").notNull(), occurredAt: text("occurred_at").notNull(), integrityHash: text("integrity_hash").notNull(),
}, (table) => [uniqueIndex("idx_audit_sequence").on(table.sequence), index("idx_audit_target").on(table.targetType, table.targetId)]);

export const learningProgress = sqliteTable("learning_progress", {
  userId: text("user_id").notNull(),
  resourceType: text("resource_type", { enum: ["atlas", "course"] }).notNull(),
  resourceSlug: text("resource_slug").notNull(),
  progress: integer("progress").notNull().default(0),
  lastPosition: integer("last_position").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.resourceType, table.resourceSlug] }),
  check("learning_progress_resource_type_check", sql`${table.resourceType} IN ('atlas', 'course')`),
  check("learning_progress_progress_check", sql`${table.progress} >= 0 AND ${table.progress} <= 100`),
  check("learning_progress_last_position_check", sql`${table.lastPosition} >= 0`),
]);

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_organizations_slug").on(table.slug)]);

export const organizationMemberships = sqliteTable("organization_memberships", {
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  joinedAt: text("joined_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.userId] }),
  index("idx_organization_memberships_user_status").on(table.userId, table.status),
]);

export const organizationEntitlements = sqliteTable("organization_entitlements", {
  organizationId: text("organization_id").primaryKey().references(() => organizations.id),
  plan: text("plan").notNull(),
  learnerLimit: integer("learner_limit").notNull(),
  educatorLimit: integer("educator_limit").notNull(),
  storageBytes: integer("storage_bytes").notNull(),
  atlasAccess: integer("atlas_access", { mode: "boolean" }).notNull().default(true),
  studioAccess: integer("studio_access", { mode: "boolean" }).notNull().default(false),
  reportingAccess: integer("reporting_access", { mode: "boolean" }).notNull().default(false),
  embedsAccess: integer("embeds_access", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull(),
  validUntil: text("valid_until"),
  version: integer("version").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const approvedEmbedOrigins = sqliteTable("approved_embed_origins", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  origin: text("origin").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_approved_embed_origins_org_origin").on(table.organizationId, table.origin),
  index("idx_approved_embed_origins_status").on(table.status),
]);

export const educationPublications = sqliteTable("education_publications", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  resourceType: text("resource_type").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull(),
  rightsStatus: text("rights_status").notNull(),
  deidentificationStatus: text("deidentification_status").notNull(),
  specialistReviewStatus: text("specialist_review_status").notNull(),
  reviewer: text("reviewer"),
  reviewedAt: text("reviewed_at"),
  version: integer("version").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("idx_education_publications_type_slug_version").on(table.resourceType, table.slug, table.version),
  index("idx_education_publications_status_type").on(table.status, table.resourceType),
]);

export const atlasPublicationVersions = sqliteTable("atlas_publication_versions", {
  id: text("id").primaryKey(), organizationId: text("organization_id").references(() => organizations.id), ingestionJobId: text("ingestion_job_id").references(() => ingestionJobs.id), slug: text("slug").notNull(), title: text("title").notNull(), region: text("region").notNull(), modality: text("modality").notNull(), orientation: text("orientation").notNull(), sourceStatement: text("source_statement").notNull(), status: text("status").notNull(), rightsStatus: text("rights_status").notNull(), deidentificationStatus: text("deidentification_status").notNull(), specialistReviewStatus: text("specialist_review_status").notNull(), version: integer("version").notNull(), contentHash: text("content_hash").notNull(), supersedesId: text("supersedes_id"), createdBy: text("created_by").notNull().references(() => users.id), reviewerId: text("reviewer_id").references(() => users.id), reviewNotes: text("review_notes").notNull().default(""), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(), publishedAt: text("published_at"),
}, (table) => [uniqueIndex("idx_atlas_publication_slug_version").on(table.slug, table.version), index("idx_atlas_publication_org_status").on(table.organizationId, table.status), index("idx_atlas_publication_ingestion").on(table.ingestionJobId)]);

export const atlasAnnotations = sqliteTable("atlas_annotations", {
  id: text("id").primaryKey(), publicationVersionId: text("publication_version_id").notNull().references(() => atlasPublicationVersions.id), structureName: text("structure_name").notNull(), synonymsJson: text("synonyms_json").notNull(), description: text("description").notNull(), relationshipsJson: text("relationships_json").notNull(), citationsJson: text("citations_json").notNull(), sliceStart: integer("slice_start").notNull(), sliceEnd: integer("slice_end").notNull(), status: text("status").notNull(), version: integer("version").notNull(), createdBy: text("created_by").notNull().references(() => users.id), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_atlas_annotations_publication_status").on(table.publicationVersionId, table.status), index("idx_atlas_annotations_structure").on(table.structureName)]);

export const atlasPublicationReviews = sqliteTable("atlas_publication_reviews", {
  id: text("id").primaryKey(), publicationVersionId: text("publication_version_id").notNull().references(() => atlasPublicationVersions.id), reviewerId: text("reviewer_id").notNull().references(() => users.id), decision: text("decision").notNull(), notes: text("notes").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [index("idx_atlas_reviews_publication_created").on(table.publicationVersionId, table.createdAt)]);

export const organizationProfiles = sqliteTable("organization_profiles", {
  organizationId: text("organization_id").primaryKey().references(() => organizations.id), displayName: text("display_name").notNull(), primaryColor: text("primary_color").notNull(), accentColor: text("accent_color").notNull(), logoUrl: text("logo_url").notNull(), customDomain: text("custom_domain").notNull(), supportContact: text("support_contact").notNull(), onboardingStage: text("onboarding_stage").notNull(), updatedAt: text("updated_at").notNull(),
});

export const organizationIdentityConnections = sqliteTable("organization_identity_connections", {
  id: text("id").primaryKey(), organizationId: text("organization_id").notNull().references(() => organizations.id), protocol: text("protocol").notNull(), issuer: text("issuer").notNull(), clientId: text("client_id").notNull(), metadataUrl: text("metadata_url").notNull(), status: text("status").notNull(), version: integer("version").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("idx_identity_connection_org_protocol").on(table.organizationId, table.protocol)]);

export const learnerNotes = sqliteTable("learner_notes", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => users.id), resourceType: text("resource_type").notNull(), resourceId: text("resource_id").notNull(), title: text("title").notNull(), body: text("body").notNull(), visibility: text("visibility").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_learner_notes_owner_updated").on(table.learnerId, table.updatedAt), index("idx_learner_notes_resource").on(table.resourceType, table.resourceId)]);

export const learnerReviewQueue = sqliteTable("learner_review_queue", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => users.id), resourceType: text("resource_type").notNull(), resourceId: text("resource_id").notNull(), title: text("title").notNull(), prompt: text("prompt").notNull(), dueAt: text("due_at").notNull(), intervalDays: integer("interval_days").notNull(), status: text("status").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_learner_review_owner_status_due").on(table.learnerId, table.status, table.dueAt)]);

export const courseCompletions = sqliteTable("course_completions", {
  id: text("id").primaryKey(), learnerId: text("learner_id").notNull().references(() => users.id), courseSlug: text("course_slug").notNull(), courseTitle: text("course_title").notNull(), percentComplete: integer("percent_complete").notNull(), evidenceHash: text("evidence_hash").notNull(), status: text("status").notNull(), completedAt: text("completed_at").notNull(),
}, (table) => [uniqueIndex("idx_course_completion_learner_course").on(table.learnerId, table.courseSlug)]);

export const educationCertificates = sqliteTable("education_certificates", {
  id: text("id").primaryKey(), completionId: text("completion_id").notNull().references(() => courseCompletions.id), publicCode: text("public_code").notNull(), title: text("title").notNull(), issuedAt: text("issued_at").notNull(), revokedAt: text("revoked_at"),
}, (table) => [uniqueIndex("idx_education_certificate_completion").on(table.completionId), uniqueIndex("idx_education_certificate_code").on(table.publicCode)]);

export const billingAccounts = sqliteTable("billing_accounts", {
  organizationId: text("organization_id").primaryKey().references(() => organizations.id), provider: text("provider").notNull(), providerCustomerRef: text("provider_customer_ref").notNull(), billingContact: text("billing_contact").notNull(), currency: text("currency").notNull(), taxCountry: text("tax_country").notNull(), status: text("status").notNull(), version: integer("version").notNull(), updatedAt: text("updated_at").notNull(),
});

export const subscriptionRecords = sqliteTable("subscription_records", {
  id: text("id").primaryKey(), organizationId: text("organization_id").notNull().references(() => organizations.id), planCode: text("plan_code").notNull(), status: text("status").notNull(), providerSubscriptionRef: text("provider_subscription_ref").notNull(), learnerSeats: integer("learner_seats").notNull(), educatorSeats: integer("educator_seats").notNull(), storageBytes: integer("storage_bytes").notNull(), currentPeriodEnd: text("current_period_end"), cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_subscription_org_status").on(table.organizationId, table.status)]);

export const embedLaunches = sqliteTable("embed_launches", {
  id: text("id").primaryKey(), organizationId: text("organization_id").notNull().references(() => organizations.id), origin: text("origin").notNull(), resourceType: text("resource_type").notNull(), resourceId: text("resource_id").notNull(), audience: text("audience").notNull(), tokenHash: text("token_hash").notNull(), status: text("status").notNull(), expiresAt: text("expires_at").notNull(), createdBy: text("created_by").notNull().references(() => users.id), createdAt: text("created_at").notNull(), usedAt: text("used_at"),
}, (table) => [uniqueIndex("idx_embed_launch_token_hash").on(table.tokenHash), index("idx_embed_launch_org_status_expiry").on(table.organizationId, table.status, table.expiresAt)]);
