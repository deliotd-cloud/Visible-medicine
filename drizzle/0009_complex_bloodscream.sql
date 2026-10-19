CREATE TABLE `fracture_review_answers` (
	`workbook_id` text NOT NULL,
	`question_id` text NOT NULL,
	`response` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`workbook_id`, `question_id`),
	FOREIGN KEY (`workbook_id`) REFERENCES `fracture_review_workbooks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fracture_review_workbooks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`content_revision` text NOT NULL,
	`package_sha256` text NOT NULL,
	`manifest_key` text NOT NULL,
	`manifest_sha256` text NOT NULL,
	`case_count` integer NOT NULL,
	`clearance_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_fracture_owner_package` ON `fracture_review_workbooks` (`owner_id`,`organization_id`,`package_sha256`);