CREATE TABLE `specimen_review_events` (
	`user_id` text NOT NULL,
	`specimen_key` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `specimen_key`, `structure_id`, `track`, `version`),
	CONSTRAINT "specimen_review_version_range" CHECK("specimen_review_events"."version" > 0 and "specimen_review_events"."version" <= 2147483647),
	CONSTRAINT "specimen_review_track_valid" CHECK("specimen_review_events"."track" in ('geometry','teaching','imaging')),
	CONSTRAINT "specimen_review_payload_json" CHECK(json_valid("specimen_review_events"."payload"))
);
