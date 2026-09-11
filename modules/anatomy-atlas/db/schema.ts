import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  check,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Append-only snapshots: the composite key also supports latest/history queries.
export const reviewEvents = sqliteTable(
  'review_events',
  {
    userId: text('user_id').notNull(),
    structureId: text('structure_id').notNull(),
    track: text('track').notNull(),
    version: integer('version').notNull(),
    payload: text('payload').notNull(),
    savedAt: text('saved_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.structureId, t.track, t.version] }),
    check('review_version_positive', sql`${t.version} > 0`),
    check(
      'review_track_valid',
      sql`${t.track} in ('geometry','teaching','imaging')`,
    ),
    check('review_payload_json', sql`json_valid(${t.payload})`),
  ],
);

// Separate catalogue scope: some root-body IDs also occur in the shoulder pilot.
// Never merge or migrate their records; the source frames and review scopes differ.
export const bodyReviewEvents = sqliteTable(
  'body_review_events',
  {
    userId: text('user_id').notNull(),
    structureId: text('structure_id').notNull(),
    track: text('track').notNull(),
    version: integer('version').notNull(),
    payload: text('payload').notNull(),
    savedAt: text('saved_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.structureId, t.track, t.version] }),
    check(
      'body_review_version_range',
      sql`${t.version} > 0 and ${t.version} <= 2147483647`,
    ),
    check(
      'body_review_track_valid',
      sql`${t.track} in ('geometry','teaching','imaging')`,
    ),
    check('body_review_payload_json', sql`json_valid(${t.payload})`),
  ],
);
