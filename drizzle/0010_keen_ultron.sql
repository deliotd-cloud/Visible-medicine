CREATE TABLE `atlas_candidate_review_events` (
	`user_key` text NOT NULL,
	`candidate_id` text NOT NULL,
	`structure_id` text NOT NULL,
	`track` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`saved_at` text NOT NULL,
	PRIMARY KEY(`user_key`, `candidate_id`, `structure_id`, `track`, `version`),
	CONSTRAINT "candidate_review_user_key" CHECK(length("atlas_candidate_review_events"."user_key") BETWEEN 1 AND 4096),
	CONSTRAINT "candidate_review_id" CHECK(length("atlas_candidate_review_events"."candidate_id") = 64),
	CONSTRAINT "candidate_review_structure" CHECK(length("atlas_candidate_review_events"."structure_id") BETWEEN 1 AND 256),
	CONSTRAINT "candidate_review_track" CHECK("atlas_candidate_review_events"."track" IN ('geometry','teaching','imaging')),
	CONSTRAINT "candidate_review_version" CHECK("atlas_candidate_review_events"."version" BETWEEN 1 AND 2147483647),
	CONSTRAINT "candidate_review_payload" CHECK(length("atlas_candidate_review_events"."payload") <= 131072)
);
