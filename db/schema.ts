import { sql } from "drizzle-orm";
import { check, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const learningProgress = sqliteTable("learning_progress", {
  userId: text("user_id").notNull(),
  resourceType: text("resource_type", { enum: ["atlas", "course"] }).notNull(),
  resourceSlug: text("resource_slug").notNull(),
  progress: integer("progress").notNull().default(0),
  lastPosition: integer("last_position").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.resourceType, table.resourceSlug] }),
  check("learning_progress_resource_type_check", sql`${table.resourceType} IN ('atlas', 'course')`),
  check("learning_progress_progress_check", sql`${table.progress} >= 0 AND ${table.progress} <= 100`),
  check("learning_progress_last_position_check", sql`${table.lastPosition} >= 0`),
]);
