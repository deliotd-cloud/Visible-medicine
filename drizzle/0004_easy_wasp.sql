CREATE TABLE `course_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`release_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`label` text NOT NULL,
	`max_uses` integer NOT NULL,
	`uses` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`release_id`) REFERENCES `course_releases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_course_invitations_code_hash` ON `course_invitations` (`code_hash`);--> statement-breakpoint
CREATE INDEX `idx_course_invitations_release_status` ON `course_invitations` (`release_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `course_ownership` (
	`course_id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_course_ownership_org` ON `course_ownership` (`organization_id`);--> statement-breakpoint
CREATE TABLE `course_release_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`decision` text NOT NULL,
	`notes` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `course_releases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_course_release_reviews_release` ON `course_release_reviews` (`release_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `course_release_workbooks` (
	`release_id` text NOT NULL,
	`workbook_id` text NOT NULL,
	`position` integer NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	PRIMARY KEY(`release_id`, `workbook_id`),
	FOREIGN KEY (`release_id`) REFERENCES `course_releases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_course_release_workbooks_order` ON `course_release_workbooks` (`release_id`,`position`);--> statement-breakpoint
CREATE TABLE `course_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`level` text NOT NULL,
	`duration_label` text NOT NULL,
	`outcomes_json` text NOT NULL,
	`publisher_name` text NOT NULL,
	`publisher_kind` text NOT NULL,
	`visibility` text NOT NULL,
	`access_model` text NOT NULL,
	`price_minor` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'GBP' NOT NULL,
	`status` text NOT NULL,
	`enrolment_open` integer DEFAULT false NOT NULL,
	`version` integer NOT NULL,
	`created_by` text NOT NULL,
	`reviewed_by` text,
	`review_notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_course_releases_slug` ON `course_releases` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_course_releases_catalogue` ON `course_releases` (`visibility`,`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_course_releases_course` ON `course_releases` (`course_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_course_releases_org_status` ON `course_releases` (`organization_id`,`status`);--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`training_stage` text NOT NULL,
	`discipline` text NOT NULL,
	`interests_json` text NOT NULL,
	`institution_name` text NOT NULL,
	`country_code` text NOT NULL,
	`timezone` text NOT NULL,
	`onboarding_status` text NOT NULL,
	`terms_accepted_at` text,
	`marketing_opt_in` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
