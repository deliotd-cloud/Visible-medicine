import { env } from "cloudflare:workers";

export type LearningProgress = {
  resourceType: string;
  resourceSlug: string;
  progress: number;
  lastPosition: number;
  updatedAt: string;
};

let schemaReady: Promise<void> | null = null;

export function ensureProgressSchema() {
  if (!schemaReady) {
    schemaReady = env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        user_id TEXT NOT NULL,
        resource_type TEXT NOT NULL CHECK(resource_type IN ('atlas', 'course')),
        resource_slug TEXT NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
        last_position INTEGER NOT NULL DEFAULT 1 CHECK(last_position >= 0),
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, resource_type, resource_slug)
      )
    `).run().then(() => undefined);
  }
  return schemaReady;
}

export async function listProgress(userId: string): Promise<LearningProgress[]> {
  await ensureProgressSchema();
  const result = await env.DB.prepare(`
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
  await ensureProgressSchema();
  const updatedAt = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO learning_progress (user_id, resource_type, resource_slug, progress, last_position, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, resource_type, resource_slug) DO UPDATE SET
      progress = excluded.progress,
      last_position = excluded.last_position,
      updated_at = excluded.updated_at
  `).bind(userId, input.resourceType, input.resourceSlug, input.progress, input.lastPosition, updatedAt).run();
  return { ...input, updatedAt };
}
