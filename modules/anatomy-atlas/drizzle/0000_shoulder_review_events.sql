CREATE TABLE `review_events` (
	`user_id` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `structure_id`, `track`, `version`),
	CONSTRAINT "review_version_positive" CHECK("review_events"."version" > 0),
	CONSTRAINT "review_track_valid" CHECK("review_events"."track" in ('geometry','teaching','imaging')),
	CONSTRAINT "review_payload_json" CHECK(json_valid("review_events"."payload"))
);
