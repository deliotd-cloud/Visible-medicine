CREATE TABLE `account_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request_type` text NOT NULL,
	`status` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL,
	`resolved_at` text,
	`resolved_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_account_requests_user_status` ON `account_requests` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_account_requests_status_created` ON `account_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `api_rate_limits` (
	`bucket_key` text PRIMARY KEY NOT NULL,
	`window_start` text NOT NULL,
	`count` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_api_rate_limits_updated` ON `api_rate_limits` (`updated_at`);--> statement-breakpoint
CREATE TABLE `course_release_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`reason` text NOT NULL,
	`captured_by` text NOT NULL,
	`captured_at` text NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `course_releases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`captured_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_release_snapshot_version_reason` ON `course_release_snapshots` (`release_id`,`version`,`reason`);--> statement-breakpoint
CREATE INDEX `idx_release_snapshot_release_created` ON `course_release_snapshots` (`release_id`,`captured_at`);--> statement-breakpoint
CREATE TABLE `learner_notification_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`course_updates` integer DEFAULT true NOT NULL,
	`assignment_reminders` integer DEFAULT true NOT NULL,
	`review_reminders` integer DEFAULT true NOT NULL,
	`product_updates` integer DEFAULT false NOT NULL,
	`delivery_mode` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`recipient` text NOT NULL,
	`template` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notification_outbox_status_created` ON `notification_outbox` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notification_outbox_org` ON `notification_outbox` (`organization_id`);--> statement-breakpoint
CREATE TABLE `operational_readiness_checks` (
	`organization_id` text NOT NULL,
	`gate_key` text NOT NULL,
	`status` text NOT NULL,
	`evidence` text NOT NULL,
	`owner` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`organization_id`, `gate_key`),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_readiness_org_status` ON `operational_readiness_checks` (`organization_id`,`status`);--> statement-breakpoint
CREATE TABLE `organization_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token_hash` text NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`accepted_by` text,
	`accepted_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accepted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_org_invitation_token` ON `organization_invitations` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_org_invitation_org_status` ON `organization_invitations` (`organization_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_org_invitation_email_status` ON `organization_invitations` (`email`,`status`);--> statement-breakpoint
CREATE TABLE `pilot_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`jurisdiction` text NOT NULL,
	`learner_band` text NOT NULL,
	`educator_band` text NOT NULL,
	`content_scope` text NOT NULL,
	`goals` text NOT NULL,
	`support_needs` text NOT NULL,
	`status` text NOT NULL,
	`submitted_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pilot_applications_status_created` ON `pilot_applications` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_pilot_applications_email` ON `pilot_applications` (`contact_email`);