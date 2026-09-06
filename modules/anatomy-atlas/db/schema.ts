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
