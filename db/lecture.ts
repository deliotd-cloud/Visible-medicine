// Additive schema only: case-based content and assessment versions remain intact.
export const LECTURE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS lecture_drafts (workbook_id TEXT PRIMARY KEY NOT NULL REFERENCES workbooks(id), slides_json TEXT NOT NULL, review_hash TEXT, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS lecture_reviews (id TEXT PRIMARY KEY NOT NULL, workbook_id TEXT NOT NULL REFERENCES workbooks(id), workbook_version INTEGER NOT NULL, content_hash TEXT NOT NULL, reviewer_id TEXT NOT NULL REFERENCES users(id), decision TEXT NOT NULL, comment TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_lecture_reviews_revision ON lecture_reviews(workbook_id, workbook_version, created_at)`,
  `CREATE TABLE IF NOT EXISTS lecture_versions (id TEXT PRIMARY KEY NOT NULL, workbook_id TEXT NOT NULL REFERENCES workbooks(id), version INTEGER NOT NULL, integrity_hash TEXT NOT NULL, manifest_json TEXT NOT NULL, published_at TEXT NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_lecture_workbook_version ON lecture_versions(workbook_id,version)`,
];
