CREATE TABLE `learning_progress` (
	`user_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_slug` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`last_position` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `resource_type`, `resource_slug`)
);
