import { env } from "cloudflare:workers";
import type { AuthContext } from "../lib/auth";
import { ensureEducationUser } from "./bootstrap";

export type PlatformPublication = {
  id: string;
  resourceType: string;
  title: string;
  status: string;
  rightsStatus: string;
  deidentificationStatus: string;
  specialistReviewStatus: string;
  version: number;
};

export type PlatformSnapshot = {
  organization: { id: string; slug: string; name: string; kind: string; role: string };
  entitlement: {
    plan: string;
    learnerLimit: number;
    educatorLimit: number;
    storageBytes: number;
    atlasAccess: boolean;
    studioAccess: boolean;
    reportingAccess: boolean;
    embedsAccess: boolean;
    status: string;
  };
  usage: { learners: number; courses: number; workbooks: number; governedMedia: number };
  publications: PlatformPublication[];
  embedOrigins: Array<{ origin: string; status: string }>;
  educationRoles: string[];
};

let platformSchemaReady: Promise<void> | null = null;

export function ensurePlatformSchema() {
  if (!platformSchemaReady) {
    const statements = [
      `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS organization_memberships (organization_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL, status TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY(organization_id, user_id), FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_status ON organization_memberships(user_id, status)`,
      `CREATE TABLE IF NOT EXISTS organization_entitlements (organization_id TEXT PRIMARY KEY, plan TEXT NOT NULL, learner_limit INTEGER NOT NULL, educator_limit INTEGER NOT NULL, storage_bytes INTEGER NOT NULL, atlas_access INTEGER NOT NULL DEFAULT 1, studio_access INTEGER NOT NULL DEFAULT 0, reporting_access INTEGER NOT NULL DEFAULT 0, embeds_access INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL, valid_until TEXT, version INTEGER NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE TABLE IF NOT EXISTS approved_embed_origins (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, origin TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(organization_id, origin), FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE INDEX IF NOT EXISTS idx_approved_embed_origins_status ON approved_embed_origins(status)`,
      `CREATE TABLE IF NOT EXISTS education_publications (id TEXT PRIMARY KEY, organization_id TEXT, resource_type TEXT NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, rights_status TEXT NOT NULL, deidentification_status TEXT NOT NULL, specialist_review_status TEXT NOT NULL, reviewer TEXT, reviewed_at TEXT, version INTEGER NOT NULL, updated_at TEXT NOT NULL, UNIQUE(resource_type, slug, version), FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE INDEX IF NOT EXISTS idx_education_publications_status_type ON education_publications(status, resource_type)`,
    ];
    platformSchemaReady = env.DB.batch(statements.map((statement) => env.DB.prepare(statement)))
      .then(async () => {
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(`INSERT OR IGNORE INTO organizations (id, slug, name, kind, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind("org-elivion-pilot", "elivion-pilot", "Elivion Education pilot", "platform", "active", now),
          env.DB.prepare(`INSERT OR IGNORE INTO organization_entitlements (organization_id, plan, learner_limit, educator_limit, storage_bytes, atlas_access, studio_access, reporting_access, embeds_access, status, valid_until, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("org-elivion-pilot", "Founding institution pilot", 250, 25, 53687091200, 1, 1, 1, 1, "evaluation", null, 1, now),
          env.DB.prepare(`INSERT OR IGNORE INTO education_publications (id, organization_id, resource_type, slug, title, status, rights_status, deidentification_status, specialist_review_status, reviewer, reviewed_at, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("publication-ct-head-v1", null, "atlas", "ct-head", "CT head: axial anatomy", "demonstration", "clearance-required", "synthetic-demonstration", "review-required", null, null, 1, now),
          env.DB.prepare(`INSERT OR IGNORE INTO education_publications (id, organization_id, resource_type, slug, title, status, rights_status, deidentification_status, specialist_review_status, reviewer, reviewed_at, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("publication-teaching-demo-v1", "org-elivion-pilot", "course", "guided-imaging-teaching", "Guided imaging teaching session", "private-evaluation", "synthetic-only", "synthetic-demonstration", "review-required", null, null, 1, now),
        ]);
        await env.DB.prepare(`PRAGMA optimize`).run();
      });
  }
  return platformSchemaReady;
}

export async function getPlatformSnapshot(auth: AuthContext): Promise<PlatformSnapshot> {
  const { roles } = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  const now = new Date().toISOString();
  const membershipRole = roles.includes("administrator") ? "owner" : roles.includes("instructor") ? "educator" : "learner";
  await env.DB.prepare(`INSERT OR IGNORE INTO organization_memberships (organization_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?)`).bind("org-elivion-pilot", auth.userId, membershipRole, "active", now).run();

  const organization = await env.DB.prepare(`SELECT o.id, o.slug, o.name, o.kind, m.role FROM organizations o JOIN organization_memberships m ON m.organization_id = o.id WHERE m.user_id = ? AND m.status = 'active' ORDER BY o.created_at LIMIT 1`).bind(auth.userId).first<Record<string, unknown>>();
  if (!organization) throw new Error("No active Elivion Education organization is available for this account.");
  const organizationId = String(organization.id);
  const entitlement = await env.DB.prepare(`SELECT * FROM organization_entitlements WHERE organization_id = ?`).bind(organizationId).first<Record<string, unknown>>();
  if (!entitlement) throw new Error("The organization has no active education entitlement.");

  const [learners, courseCount, workbookCount, governedMedia, publicationRows, originRows] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count FROM organization_memberships WHERE organization_id = ? AND role = 'learner' AND status = 'active'`).bind(organizationId).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM courses WHERE status = 'active'`).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM workbooks WHERE status IN ('draft', 'in-review', 'approved', 'published')`).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM ingestion_jobs WHERE status IN ('ready-for-review', 'approved')`).first<{ count: number }>(),
    env.DB.prepare(`SELECT id, resource_type, title, status, rights_status, deidentification_status, specialist_review_status, version FROM education_publications WHERE organization_id IS NULL OR organization_id = ? ORDER BY updated_at DESC`).bind(organizationId).all(),
    env.DB.prepare(`SELECT origin, status FROM approved_embed_origins WHERE organization_id = ? ORDER BY created_at DESC`).bind(organizationId).all(),
  ]);

  return {
    organization: { id: organizationId, slug: String(organization.slug), name: String(organization.name), kind: String(organization.kind), role: String(organization.role) },
    entitlement: {
      plan: String(entitlement.plan), learnerLimit: Number(entitlement.learner_limit), educatorLimit: Number(entitlement.educator_limit), storageBytes: Number(entitlement.storage_bytes),
      atlasAccess: Boolean(entitlement.atlas_access), studioAccess: Boolean(entitlement.studio_access), reportingAccess: Boolean(entitlement.reporting_access), embedsAccess: Boolean(entitlement.embeds_access), status: String(entitlement.status),
    },
    usage: { learners: Number(learners?.count ?? 0), courses: Number(courseCount?.count ?? 0), workbooks: Number(workbookCount?.count ?? 0), governedMedia: Number(governedMedia?.count ?? 0) },
    publications: publicationRows.results.map((row) => ({ id: String(row.id), resourceType: String(row.resource_type), title: String(row.title), status: String(row.status), rightsStatus: String(row.rights_status), deidentificationStatus: String(row.deidentification_status), specialistReviewStatus: String(row.specialist_review_status), version: Number(row.version) })),
    embedOrigins: originRows.results.map((row) => ({ origin: String(row.origin), status: String(row.status) })),
    educationRoles: roles,
  };
}
