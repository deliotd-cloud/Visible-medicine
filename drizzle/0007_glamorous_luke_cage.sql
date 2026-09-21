CREATE TABLE `lecture_drafts` (
	`workbook_id` text PRIMARY KEY NOT NULL,
	`slides_json` text NOT NULL,
	`review_hash` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lecture_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`workbook_version` integer NOT NULL,
	`content_hash` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`decision` text NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lecture_reviews_revision` ON `lecture_reviews` (`workbook_id`,`workbook_version`,`created_at`);--> statement-breakpoint
CREATE TABLE `lecture_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`workbook_id` text NOT NULL,
	`version` integer NOT NULL,
	`integrity_hash` text NOT NULL,
	`manifest_json` text NOT NULL,
	`published_at` text NOT NULL,
	FOREIGN KEY (`workbook_id`) REFERENCES `workbooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lecture_workbook_version` ON `lecture_versions` (`workbook_id`,`version`);