CREATE TABLE `nested_review_events` (
	`user_id` text NOT NULL,
	`nested_key` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `nested_key`, `structure_id`, `track`, `version`),
	CONSTRAINT "nested_review_version_range" CHECK("nested_review_events"."version" > 0 and "nested_review_events"."version" <= 2147483647),
	CONSTRAINT "nested_review_track_valid" CHECK("nested_review_events"."track" in ('geometry','teaching')),
	CONSTRAINT "nested_review_payload_json" CHECK(json_valid("nested_review_events"."payload"))
);
