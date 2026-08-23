CREATE TABLE `atlas_annotations` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_version_id` text NOT NULL,
	`structure_name` text NOT NULL,
	`synonyms_json` text NOT NULL,
	`description` text NOT NULL,
	`relationships_json` text NOT NULL,
	`citations_json` text NOT NULL,
	`slice_start` integer NOT NULL,
	`slice_end` integer NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`publication_version_id`) REFERENCES `atlas_publication_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_annotations_publication_status` ON `atlas_annotations` (`publication_version_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_atlas_annotations_structure` ON `atlas_annotations` (`structure_name`);--> statement-breakpoint
CREATE TABLE `atlas_publication_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_version_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`decision` text NOT NULL,
	`notes` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`publication_version_id`) REFERENCES `atlas_publication_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_atlas_reviews_publication_created` ON `atlas_publication_reviews` (`publication_version_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `atlas_publication_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`ingestion_job_id` text,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`region` text NOT NULL,
	`modality` text NOT NULL,
	`orientation` text NOT NULL,
	`source_statement` text NOT NULL,
	`status` text NOT NULL,
	`rights_status` text NOT NULL,
	`deidentification_status` text NOT NULL,
	`specialist_review_status` text NOT NULL,
	`version` integer NOT NULL,
	`content_hash` text NOT NULL,
	`supersedes_id` text,
	`created_by` text NOT NULL,
	`reviewer_id` text,
	`review_notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ingestion_job_id`) REFERENCES `ingestion_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_atlas_publication_slug_version` ON `atlas_publication_versions` (`slug`,`version`);--> statement-breakpoint
CREATE INDEX `idx_atlas_publication_org_status` ON `atlas_publication_versions` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_atlas_publication_ingestion` ON `atlas_publication_versions` (`ingestion_job_id`);--> statement-breakpoint
CREATE TABLE `billing_accounts` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_customer_ref` text NOT NULL,
	`billing_contact` text NOT NULL,
	`currency` text NOT NULL,
	`tax_country` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `course_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`course_slug` text NOT NULL,
	`course_title` text NOT NULL,
	`percent_complete` integer NOT NULL,
	`evidence_hash` text NOT NULL,
	`status` text NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_course_completion_learner_course` ON `course_completions` (`learner_id`,`course_slug`);--> statement-breakpoint
CREATE TABLE `education_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`completion_id` text NOT NULL,
	`public_code` text NOT NULL,
	`title` text NOT NULL,
	`issued_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`completion_id`) REFERENCES `course_completions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_education_certificate_completion` ON `education_certificates` (`completion_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_education_certificate_code` ON `education_certificates` (`public_code`);--> statement-breakpoint
CREATE TABLE `embed_launches` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`origin` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`audience` text NOT NULL,
	`token_hash` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`used_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_embed_launch_token_hash` ON `embed_launches` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_embed_launch_org_status_expiry` ON `embed_launches` (`organization_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `learner_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`visibility` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_learner_notes_owner_updated` ON `learner_notes` (`learner_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_learner_notes_resource` ON `learner_notes` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE TABLE `learner_review_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`title` text NOT NULL,
	`prompt` text NOT NULL,
	`due_at` text NOT NULL,
	`interval_days` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_learner_review_owner_status_due` ON `learner_review_queue` (`learner_id`,`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `organization_identity_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`protocol` text NOT NULL,
	`issuer` text NOT NULL,
	`client_id` text NOT NULL,
	`metadata_url` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_identity_connection_org_protocol` ON `organization_identity_connections` (`organization_id`,`protocol`);--> statement-breakpoint
CREATE TABLE `organization_profiles` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`primary_color` text NOT NULL,
	`accent_color` text NOT NULL,
	`logo_url` text NOT NULL,
	`custom_domain` text NOT NULL,
	`support_contact` text NOT NULL,
	`onboarding_stage` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscription_records` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`plan_code` text NOT NULL,
	`status` text NOT NULL,
	`provider_subscription_ref` text NOT NULL,
	`learner_seats` integer NOT NULL,
	`educator_seats` integer NOT NULL,
	`storage_bytes` integer NOT NULL,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_subscription_org_status` ON `subscription_records` (`organization_id`,`status`);
--> statement-breakpoint
PRAGMA optimize;
