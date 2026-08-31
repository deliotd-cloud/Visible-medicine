CREATE TABLE `account_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`document_key` text NOT NULL,
	`document_version` text NOT NULL,
	`decision` text NOT NULL,
	`source` text NOT NULL,
	`recorded_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_account_consents_user_document_version` ON `account_consents` (`user_id`,`document_key`,`document_version`);--> statement-breakpoint
CREATE INDEX `idx_account_consents_user_recorded` ON `account_consents` (`user_id`,`recorded_at`);--> statement-breakpoint
CREATE TABLE `account_security_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`identity_provider` text NOT NULL,
	`registered_at` text NOT NULL,
	`last_authenticated_at` text NOT NULL,
	`terms_version` text NOT NULL,
	`privacy_version` text NOT NULL,
	`terms_accepted_at` text,
	`privacy_accepted_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_account_security_status` ON `account_security_profiles` (`status`);