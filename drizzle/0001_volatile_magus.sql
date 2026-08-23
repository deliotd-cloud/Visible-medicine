PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_learning_progress` (
	`user_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_slug` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`last_position` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `resource_type`, `resource_slug`),
	CONSTRAINT "learning_progress_resource_type_check" CHECK("__new_learning_progress"."resource_type" IN ('atlas', 'course')),
	CONSTRAINT "learning_progress_progress_check" CHECK("__new_learning_progress"."progress" >= 0 AND "__new_learning_progress"."progress" <= 100),
	CONSTRAINT "learning_progress_last_position_check" CHECK("__new_learning_progress"."last_position" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_learning_progress`("user_id", "resource_type", "resource_slug", "progress", "last_position", "updated_at") SELECT "user_id", "resource_type", "resource_slug", "progress", "last_position", "updated_at" FROM `learning_progress`;--> statement-breakpoint
DROP TABLE `learning_progress`;--> statement-breakpoint
ALTER TABLE `__new_learning_progress` RENAME TO `learning_progress`;--> statement-breakpoint
PRAGMA foreign_keys=ON;