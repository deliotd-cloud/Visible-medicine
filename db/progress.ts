import { env } from "cloudflare:workers";

export type LearningProgress = {
  resourceType: string;
  resourceSlug: string;
  progress: number;
  lastPosition: number;
  updatedAt: string;
};

// Cache only a completed schema fact for this binding, never request-owned I/O.
// Cold concurrent requests may each run the idempotent CREATE in their own
// context. A failure cannot poison later requests or erase another success.
const schemaReady = new WeakSet<D1Database>();

export async function ensureProgressSchema(database: D1Database = env.DB): Promise<void> {
  if (!schemaReady.has(database)) {
    await database.prepare(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        user_id TEXT NOT NULL,
        resource_type TEXT NOT NULL CHECK(resource_type IN ('atlas', 'course')),
        resource_slug TEXT NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
        last_position INTEGER NOT NULL DEFAULT 1 CHECK(last_position >= 0),
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, resource_type, resource_slug)
      )
    `).run();
    schemaReady.add(database);
  }
}

export async function listProgress(userId: string): Promise<LearningProgress[]> {
  const database = env.DB;
  await ensureProgressSchema(database);
  const result = await database.prepare(`
    SELECT resource_type, resource_slug, progress, last_position, updated_at
    FROM learning_progress
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).bind(userId).all();

  return result.results.map((row) => ({
    resourceType: String(row.resource_type),
    resourceSlug: String(row.resource_slug),
    progress: Number(row.progress),
    lastPosition: Number(row.last_position),
    updatedAt: String(row.updated_at),
  }));
}

export async function saveProgress(userId: string, input: Omit<LearningProgress, "updatedAt">) {
  const database = env.DB;
  await ensureProgressSchema(database);
  const updatedAt = new Date().toISOString();
  const saved = await database.prepare(`
    INSERT INTO learning_progress (user_id, resource_type, resource_slug, progress, last_position, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, resource_type, resource_slug) DO UPDATE SET
      progress = CASE WHEN excluded.resource_type = 'course'
        THEN MAX(learning_progress.progress, excluded.progress) ELSE excluded.progress END,
      last_position = CASE WHEN excluded.resource_type = 'course'
        THEN MAX(learning_progress.last_position, excluded.last_position) ELSE excluded.last_position END,
      updated_at = excluded.updated_at
    RETURNING resource_type AS resourceType, resource_slug AS resourceSlug,
      progress, last_position AS lastPosition, updated_at AS updatedAt
  `).bind(userId, input.resourceType, input.resourceSlug, input.progress, input.lastPosition, updatedAt).first<LearningProgress>();
  // One statement merges competing course saves and acknowledges its actual
  // stored result. Atlas bookmarks intentionally retain last-visited position.
  if (!saved) throw new Error("The saved progress record could not be confirmed.");
  return saved;
}
