CREATE TABLE `annotations` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`case_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`geometry_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_annotations_attempt_case` ON `annotations` (`attempt_id`,`case_id`);--> statement-breakpoint
CREATE TABLE `answers` (
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`response` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`attempt_id`, `question_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `approved_embed_origins` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`origin` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_approved_embed_origins_org_origin` ON `approved_embed_origins` (`organization_id`,`origin`);--> statement-breakpoint
CREATE INDEX `idx_approved_embed_origins_status` ON `approved_embed_origins` (`status`);--> statement-breakpoint
CREATE TABLE `assessment_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`version` integer NOT NULL,
	`integrity_hash` text NOT NULL,
	`manifest_json` text,
	`viewer_core_version` text NOT NULL,
	`published_at` text NOT NULL,
	`status` text NOT NULL,
	`dual_display_allowed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_assessment_workbook_version` ON `assessment_versions` (`workbook_id`,`version`);--> statement-breakpoint
CREATE TABLE `attempt_case_flags` (
	`attempt_id` text NOT NULL,
	`case_id` text NOT NULL,
	`flagged` integer NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`attempt_id`, `case_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attempt_case_flags_attempt` ON `attempt_case_flags` (`attempt_id`,`flagged`);--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assessment_version_id` text NOT NULL,
	`state` text NOT NULL,
	`started_at` text NOT NULL,
	`deadline_at` text NOT NULL,
	`preflight_passed_at` text,
	`submitted_at` text,
	`receipt_hash` text,
	`accommodation_minutes` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assessment_version_id`) REFERENCES `assessment_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_user_state` ON `attempts` (`user_id`,`state`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`sequence` integer NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`outcome` text NOT NULL,
	`reason` text NOT NULL,
	`occurred_at` text NOT NULL,
	`integrity_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_audit_sequence` ON `audit_events` (`sequence`);--> statement-breakpoint
CREATE INDEX `idx_audit_target` ON `audit_events` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`classification` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`description` text NOT NULL,
	`visual_kind` text NOT NULL,
	`tools_json` text NOT NULL,
	`publication_hash` text NOT NULL,
	`deidentified` integer NOT NULL,
	`publication_cleared` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_cases_classification_status` ON `cases` (`classification`,`status`);--> statement-breakpoint
CREATE TABLE `cohort_members` (
	`cohort_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`status` text NOT NULL,
	`added_by` text NOT NULL,
	`added_at` text NOT NULL,
	`version` integer NOT NULL,
	PRIMARY KEY(`cohort_id`, `learner_id`),
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_cohort_members_learner_status` ON `cohort_members` (`learner_id`,`status`);--> statement-breakpoint
CREATE TABLE `cohort_workbook_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`workbook_id` text NOT NULL,
	`status` text NOT NULL,
	`assigned_by` text NOT NULL,
	`assigned_at` text NOT NULL,
	`available_from` text,
	`due_at` text,
	`expires_at` text,
	`prerequisite_workbook_id` text,
	`prerequisite_min_percent` integer DEFAULT 100 NOT NULL,
	`revoked_at` text,
	`version` integer NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prerequisite_workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cohort_workbook_assignment_unique` ON `cohort_workbook_assignments` (`cohort_id`,`workbook_id`);--> statement-breakpoint
CREATE INDEX `idx_cohort_workbook_assignments_cohort_status` ON `cohort_workbook_assignments` (`cohort_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_cohort_workbook_assignments_workbook_status` ON `cohort_workbook_assignments` (`workbook_id`,`status`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`code` text NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`version` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cohorts_course_code` ON `cohorts` (`course_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_cohorts_course_status` ON `cohorts` (`course_id`,`status`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_courses_code` ON `courses` (`code`);--> statement-breakpoint
CREATE TABLE `criterion_marks` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`criterion_label` text NOT NULL,
	`examiner_id` text NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`examiner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_criterion_marks_revision` ON `criterion_marks` (`attempt_id`,`question_id`,`criterion_label`,`revision`);--> statement-breakpoint
CREATE INDEX `idx_criterion_marks_label_revision` ON `criterion_marks` (`criterion_label`,`revision`);--> statement-breakpoint
CREATE TABLE `education_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`issuer` text NOT NULL,
	`client_id` text NOT NULL,
	`deployment_id` text NOT NULL,
	`authorization_endpoint` text NOT NULL,
	`token_endpoint` text NOT NULL,
	`jwks_endpoint` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_education_integrations_kind` ON `education_integrations` (`kind`);--> statement-breakpoint
CREATE TABLE `education_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`resource_type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`rights_status` text NOT NULL,
	`deidentification_status` text NOT NULL,
	`specialist_review_status` text NOT NULL,
	`reviewer` text,
	`reviewed_at` text,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_education_publications_type_slug_version` ON `education_publications` (`resource_type`,`slug`,`version`);--> statement-breakpoint
CREATE INDEX `idx_education_publications_status_type` ON `education_publications` (`status`,`resource_type`);--> statement-breakpoint
CREATE TABLE `enrolments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`status` text NOT NULL,
	`enrolled_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_enrolments_user_course` ON `enrolments` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `ingestion_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`declared_type` text NOT NULL,
	`detected_type` text NOT NULL,
	`status` text NOT NULL,
	`deidentified` integer NOT NULL,
	`publication_cleared` integer NOT NULL,
	`reason_codes_json` text NOT NULL,
	`content_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ingestion_status_created` ON `ingestion_jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `instructor_presentation_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`presentation_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`operation` text NOT NULL,
	`actor_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`previous_event_hash` text NOT NULL,
	`event_hash` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`presentation_id`) REFERENCES `instructor_presentations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_instructor_presentation_event_sequence` ON `instructor_presentation_events` (`presentation_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `idx_instructor_presentation_events_actor` ON `instructor_presentation_events` (`actor_id`);--> statement-breakpoint
CREATE TABLE `instructor_presentations` (
	`id` text PRIMARY KEY NOT NULL,
	`scope_type` text NOT NULL,
	`scope_id` text NOT NULL,
	`title` text NOT NULL,
	`owner_id` text NOT NULL,
	`version` integer NOT NULL,
	`active` integer NOT NULL,
	`visibility_policy` text NOT NULL,
	`scenes_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`head_event_hash` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_instructor_presentations_scope` ON `instructor_presentations` (`scope_type`,`scope_id`,`active`);--> statement-breakpoint
CREATE INDEX `idx_instructor_presentations_owner` ON `instructor_presentations` (`owner_id`);--> statement-breakpoint
CREATE TABLE `key_images` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`case_id` text NOT NULL,
	`frame_index` integer NOT NULL,
	`viewport_json` text NOT NULL,
	`viewer_core_version` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_key_images_attempt_case` ON `key_images` (`attempt_id`,`case_id`);--> statement-breakpoint
CREATE TABLE `learner_accommodations` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`extra_time_minutes` integer NOT NULL,
	`rest_break_minutes` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`requested_by` text NOT NULL,
	`approved_by` text,
	`requested_at` text NOT NULL,
	`approved_at` text,
	`revoked_at` text,
	`version` integer NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learner_accommodations_workbook_learner` ON `learner_accommodations` (`workbook_id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `idx_learner_accommodations_learner_status` ON `learner_accommodations` (`learner_id`,`status`);--> statement-breakpoint
CREATE TABLE `learner_bookmark_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`bookmark_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`operation` text NOT NULL,
	`actor_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`previous_event_hash` text NOT NULL,
	`event_hash` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `learner_bookmarks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learner_bookmark_event_sequence` ON `learner_bookmark_events` (`bookmark_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `idx_learner_bookmark_events_actor` ON `learner_bookmark_events` (`actor_id`);--> statement-breakpoint
CREATE TABLE `learner_bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`case_id` text NOT NULL,
	`title` text NOT NULL,
	`version` integer NOT NULL,
	`active` integer NOT NULL,
	`scene_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`head_event_hash` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_learner_bookmarks_owner_case` ON `learner_bookmarks` (`learner_id`,`case_id`,`active`);--> statement-breakpoint
CREATE TABLE `marks` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`examiner_id` text NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`feedback` text NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`examiner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_marks_attempt_revision` ON `marks` (`attempt_id`,`revision`);--> statement-breakpoint
CREATE TABLE `moderation_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`moderator_id` text NOT NULL,
	`original_examiner_id` text NOT NULL,
	`mark_revision` integer NOT NULL,
	`original_score` integer NOT NULL,
	`final_score` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`original_examiner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_moderation_attempt` ON `moderation_decisions` (`attempt_id`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_modules_course_position` ON `modules` (`course_id`,`position`);--> statement-breakpoint
CREATE TABLE `organization_entitlements` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`plan` text NOT NULL,
	`learner_limit` integer NOT NULL,
	`educator_limit` integer NOT NULL,
	`storage_bytes` integer NOT NULL,
	`atlas_access` integer DEFAULT true NOT NULL,
	`studio_access` integer DEFAULT false NOT NULL,
	`reporting_access` integer DEFAULT false NOT NULL,
	`embeds_access` integer DEFAULT false NOT NULL,
	`status` text NOT NULL,
	`valid_until` text,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organization_memberships` (
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`organization_id`, `user_id`),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_organization_memberships_user_status` ON `organization_memberships` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_organizations_slug` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `question_bank_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`prompt` text NOT NULL,
	`response_type` text NOT NULL,
	`max_marks` integer NOT NULL,
	`modality` text NOT NULL,
	`difficulty` text NOT NULL,
	`tags_json` text NOT NULL,
	`options_json` text NOT NULL,
	`correct_option_indexes_json` text NOT NULL,
	`rationale` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_question_bank_status_modality_difficulty` ON `question_bank_items` (`status`,`modality`,`difficulty`);--> statement-breakpoint
CREATE INDEX `idx_question_bank_creator` ON `question_bank_items` (`created_by`);--> statement-breakpoint
CREATE TABLE `question_marks` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`examiner_id` text NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`examiner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_question_marks_revision` ON `question_marks` (`attempt_id`,`question_id`,`revision`);--> statement-breakpoint
CREATE INDEX `idx_question_marks_question_revision` ON `question_marks` (`question_id`,`revision`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`prompt` text NOT NULL,
	`max_marks` integer NOT NULL,
	`version` integer NOT NULL,
	`response_type` text NOT NULL,
	`options_json` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_questions_case` ON `questions` (`case_id`);--> statement-breakpoint
CREATE TABLE `result_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`approved_by` text NOT NULL,
	`status` text NOT NULL,
	`released_at` text NOT NULL,
	`population_hash` text NOT NULL,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`release_id` text NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`outcome` text NOT NULL,
	`released_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`release_id`) REFERENCES `result_releases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_results_attempt` ON `results` (`attempt_id`);--> statement-breakpoint
CREATE TABLE `rubrics` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`version` integer NOT NULL,
	`criteria_json` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rubrics_question_version` ON `rubrics` (`question_id`,`version`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`evidence_hash` text NOT NULL,
	`submitted_at` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_submissions_attempt` ON `submissions` (`attempt_id`);--> statement-breakpoint
CREATE TABLE `teaching_content_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`case_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text NOT NULL,
	`position` integer NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teaching_content_case_status_position` ON `teaching_content_blocks` (`case_id`,`status`,`position`);--> statement-breakpoint
CREATE INDEX `idx_teaching_content_workbook` ON `teaching_content_blocks` (`workbook_id`);--> statement-breakpoint
CREATE TABLE `teaching_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`key_points_json` text NOT NULL,
	`reveal_text` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teaching_notes_case_position` ON `teaching_notes` (`case_id`,`position`);--> statement-breakpoint
CREATE TABLE `teaching_poll_responses` (
	`run_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`selections_json` text NOT NULL,
	`revision` integer NOT NULL,
	`responded_at` text NOT NULL,
	PRIMARY KEY(`run_id`, `learner_id`),
	FOREIGN KEY (`run_id`) REFERENCES `teaching_poll_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teaching_poll_responses_run` ON `teaching_poll_responses` (`run_id`);--> statement-breakpoint
CREATE TABLE `teaching_poll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`instructor_id` text NOT NULL,
	`state` text NOT NULL,
	`results_revealed` integer DEFAULT false NOT NULL,
	`version` integer NOT NULL,
	`opened_at` text NOT NULL,
	`closed_at` text,
	FOREIGN KEY (`poll_id`) REFERENCES `teaching_polls`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teaching_poll_runs_poll_opened` ON `teaching_poll_runs` (`poll_id`,`opened_at`);--> statement-breakpoint
CREATE INDEX `idx_teaching_poll_runs_instructor` ON `teaching_poll_runs` (`instructor_id`);--> statement-breakpoint
CREATE TABLE `teaching_polls` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`case_id` text NOT NULL,
	`prompt` text NOT NULL,
	`selection_mode` text NOT NULL,
	`options_json` text NOT NULL,
	`correct_option_ids_json` text NOT NULL,
	`explanation` text NOT NULL,
	`position` integer NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teaching_polls_case_status_position` ON `teaching_polls` (`case_id`,`status`,`position`);--> statement-breakpoint
CREATE INDEX `idx_teaching_polls_workbook` ON `teaching_polls` (`workbook_id`);--> statement-breakpoint
CREATE TABLE `teaching_session_participants` (
	`session_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`follow_state` text NOT NULL,
	`current_case_id` text NOT NULL,
	`joined_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	PRIMARY KEY(`session_id`, `learner_id`),
	FOREIGN KEY (`session_id`) REFERENCES `teaching_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teaching_session_participants_session_state_seen` ON `teaching_session_participants` (`session_id`,`follow_state`,`last_seen_at`);--> statement-breakpoint
CREATE TABLE `teaching_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`instructor_id` text NOT NULL,
	`state` text NOT NULL,
	`active_case_id` text NOT NULL,
	`viewer_state_json` text NOT NULL,
	`active_scene_index` integer,
	`version` integer NOT NULL,
	`started_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`active_case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teaching_sessions_workbook_state_updated` ON `teaching_sessions` (`workbook_id`,`state`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_teaching_sessions_instructor` ON `teaching_sessions` (`instructor_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`external_subject` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`roles` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_external_subject` ON `users` (`external_subject`);--> statement-breakpoint
CREATE TABLE `workbook_assignment_rules` (
	`assignment_id` text PRIMARY KEY NOT NULL,
	`available_from` text,
	`expires_at` text,
	`prerequisite_workbook_id` text,
	`prerequisite_min_percent` integer DEFAULT 100 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `workbook_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prerequisite_workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbook_assignment_rules_prerequisite` ON `workbook_assignment_rules` (`prerequisite_workbook_id`);--> statement-breakpoint
CREATE TABLE `workbook_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`status` text NOT NULL,
	`assigned_by` text NOT NULL,
	`assigned_at` text NOT NULL,
	`due_at` text,
	`revoked_at` text,
	`version` integer NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_workbook_assignments_workbook_learner` ON `workbook_assignments` (`workbook_id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `idx_workbook_assignments_learner_status` ON `workbook_assignments` (`learner_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_workbook_assignments_workbook_status` ON `workbook_assignments` (`workbook_id`,`status`);--> statement-breakpoint
CREATE TABLE `workbook_authorship` (
	`workbook_id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbook_authorship_author` ON `workbook_authorship` (`author_id`);--> statement-breakpoint
CREATE TABLE `workbook_case_progress` (
	`workbook_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`case_id` text NOT NULL,
	`first_opened_at` text NOT NULL,
	`last_opened_at` text NOT NULL,
	PRIMARY KEY(`workbook_id`, `learner_id`, `case_id`),
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbook_case_progress_learner_recent` ON `workbook_case_progress` (`learner_id`,`last_opened_at`);--> statement-breakpoint
CREATE TABLE `workbook_cases` (
	`workbook_id` text NOT NULL,
	`case_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`workbook_id`, `case_id`),
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbook_cases_order` ON `workbook_cases` (`workbook_id`,`position`);--> statement-breakpoint
CREATE TABLE `workbook_draft_question_edits` (
	`workbook_id` text NOT NULL,
	`question_id` text NOT NULL,
	`prompt` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`workbook_id`, `question_id`),
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbook_draft_question_edits_workbook` ON `workbook_draft_question_edits` (`workbook_id`);--> statement-breakpoint
CREATE TABLE `workbook_progress` (
	`workbook_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`status` text NOT NULL,
	`cases_visited` integer NOT NULL,
	`cases_total` integer NOT NULL,
	`percent_complete` integer NOT NULL,
	`first_opened_at` text NOT NULL,
	`last_activity_at` text NOT NULL,
	`completed_at` text,
	`version` integer NOT NULL,
	PRIMARY KEY(`workbook_id`, `learner_id`),
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbook_progress_workbook_status` ON `workbook_progress` (`workbook_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_workbook_progress_learner_status` ON `workbook_progress` (`learner_id`,`status`);--> statement-breakpoint
CREATE TABLE `workbook_recoveries` (
	`draft_workbook_id` text PRIMARY KEY NOT NULL,
	`source_workbook_id` text NOT NULL,
	`source_assessment_version_id` text NOT NULL,
	`source_integrity_hash` text NOT NULL,
	`copied_case_ids_json` text NOT NULL,
	`excluded_evidence_json` text NOT NULL,
	`history_reconstructed` integer DEFAULT false NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`draft_workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_assessment_version_id`) REFERENCES `assessment_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbook_recoveries_source` ON `workbook_recoveries` (`source_workbook_id`);--> statement-breakpoint
CREATE TABLE `workbook_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`decision` text NOT NULL,
	`comment` text NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_workbook_reviews_revision` ON `workbook_reviews` (`workbook_id`,`revision`);--> statement-breakpoint
CREATE INDEX `idx_workbook_reviews_reviewer` ON `workbook_reviews` (`reviewer_id`);--> statement-breakpoint
CREATE TABLE `workbooks` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`title` text NOT NULL,
	`mode` text NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`dual_display_allowed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workbooks_module` ON `workbooks` (`module_id`);