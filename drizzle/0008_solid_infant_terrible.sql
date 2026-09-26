CREATE TABLE `atlas_personal_body_review_events` (
	`user_id` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `structure_id`, `track`, `version`),
	CONSTRAINT "body_review_version_range" CHECK("atlas_personal_body_review_events"."version" > 0 and "atlas_personal_body_review_events"."version" <= 2147483647),
	CONSTRAINT "body_review_track_valid" CHECK("atlas_personal_body_review_events"."track" in ('geometry','teaching','imaging')),
	CONSTRAINT "body_review_payload_json" CHECK(json_valid("atlas_personal_body_review_events"."payload"))
);
--> statement-breakpoint
CREATE TABLE `atlas_personal_nested_review_events` (
	`user_id` text NOT NULL,
	`nested_key` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `nested_key`, `structure_id`, `track`, `version`),
	CONSTRAINT "nested_review_version_range" CHECK("atlas_personal_nested_review_events"."version" > 0 and "atlas_personal_nested_review_events"."version" <= 2147483647),
	CONSTRAINT "nested_review_track_valid" CHECK("atlas_personal_nested_review_events"."track" in ('geometry','teaching')),
	CONSTRAINT "nested_review_payload_json" CHECK(json_valid("atlas_personal_nested_review_events"."payload"))
);
--> statement-breakpoint
CREATE TABLE `atlas_personal_review_events` (
	`user_id` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `structure_id`, `track`, `version`),
	CONSTRAINT "review_version_positive" CHECK("atlas_personal_review_events"."version" > 0),
	CONSTRAINT "review_track_valid" CHECK("atlas_personal_review_events"."track" in ('geometry','teaching','imaging')),
	CONSTRAINT "review_payload_json" CHECK(json_valid("atlas_personal_review_events"."payload"))
);
--> statement-breakpoint
CREATE TABLE `atlas_personal_specimen_review_events` (
	`user_id` text NOT NULL,
	`specimen_key` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `specimen_key`, `structure_id`, `track`, `version`),
	CONSTRAINT "specimen_review_version_range" CHECK("atlas_personal_specimen_review_events"."version" > 0 and "atlas_personal_specimen_review_events"."version" <= 2147483647),
	CONSTRAINT "specimen_review_track_valid" CHECK("atlas_personal_specimen_review_events"."track" in ('geometry','teaching','imaging')),
	CONSTRAINT "specimen_review_payload_json" CHECK(json_valid("atlas_personal_specimen_review_events"."payload"))
);
