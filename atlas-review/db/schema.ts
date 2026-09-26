import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  check,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Nested parent/study key is a canonical JSON tuple; child IDs alone are not
// unique review scopes. No records are migrated from any other review table.
export const nestedReviewEvents = sqliteTable(
  "atlas_personal_nested_review_events",
  {
    userId: text("user_id").notNull(),
    nestedKey: text("nested_key").notNull(),
    structureId: text("structure_id").notNull(),
    track: text("track").notNull(),
    version: integer("version").notNull(),
    payload: text("payload").notNull(),
    savedAt: text("saved_at").notNull(),
  },
  (t) => [
    primaryKey({columns:[t.userId,t.nestedKey,t.structureId,t.track,t.version]}),
    check("nested_review_version_range", sql`${t.version} > 0 and ${t.version} <= 2147483647`),
    check("nested_review_track_valid", sql`${t.track} in ('geometry','teaching')`),
    check("nested_review_payload_json", sql`json_valid(${t.payload})`),
  ],
);

// Independent specimens are not root-body/shoulder approvals, even when a
// source frame or a structure name is shared. Append-only, account-private.
export const specimenReviewEvents = sqliteTable(
  "atlas_personal_specimen_review_events",
  {
    userId: text("user_id").notNull(),
    specimenKey: text("specimen_key").notNull(),
    structureId: text("structure_id").notNull(),
    track: text("track").notNull(),
    version: integer("version").notNull(),
    payload: text("payload").notNull(),
    savedAt: text("saved_at").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.userId, t.specimenKey, t.structureId, t.track, t.version],
    }),
    check(
      "specimen_review_version_range",
      sql`${t.version} > 0 and ${t.version} <= 2147483647`,
    ),
    check(
      "specimen_review_track_valid",
      sql`${t.track} in ('geometry','teaching','imaging')`,
    ),
    check("specimen_review_payload_json", sql`json_valid(${t.payload})`),
  ],
);

// Append-only snapshots: the composite key also supports latest/history queries.
export const reviewEvents = sqliteTable(
  "atlas_personal_review_events",
  {
    userId: text("user_id").notNull(),
    structureId: text("structure_id").notNull(),
    track: text("track").notNull(),
    version: integer("version").notNull(),
    payload: text("payload").notNull(),
    savedAt: text("saved_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.structureId, t.track, t.version] }),
    check("review_version_positive", sql`${t.version} > 0`),
    check(
      "review_track_valid",
      sql`${t.track} in ('geometry','teaching','imaging')`,
    ),
    check("review_payload_json", sql`json_valid(${t.payload})`),
  ],
);

// Separate catalogue scope: some root-body IDs also occur in the shoulder pilot.
// Never merge or migrate their records; the source frames and review scopes differ.
export const bodyReviewEvents = sqliteTable(
  "atlas_personal_body_review_events",
  {
    userId: text("user_id").notNull(),
    structureId: text("structure_id").notNull(),
    track: text("track").notNull(),
    version: integer("version").notNull(),
    payload: text("payload").notNull(),
    savedAt: text("saved_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.structureId, t.track, t.version] }),
    check(
      "body_review_version_range",
      sql`${t.version} > 0 and ${t.version} <= 2147483647`,
    ),
    check(
      "body_review_track_valid",
      sql`${t.track} in ('geometry','teaching','imaging')`,
    ),
    check("body_review_payload_json", sql`json_valid(${t.payload})`),
  ],
);
