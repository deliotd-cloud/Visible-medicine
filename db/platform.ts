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
      `CREATE TABLE IF NOT EXISTS atlas_publication_versions (id TEXT PRIMARY KEY, organization_id TEXT, ingestion_job_id TEXT, slug TEXT NOT NULL, title TEXT NOT NULL, region TEXT NOT NULL, modality TEXT NOT NULL, orientation TEXT NOT NULL, source_statement TEXT NOT NULL, status TEXT NOT NULL, rights_status TEXT NOT NULL, deidentification_status TEXT NOT NULL, specialist_review_status TEXT NOT NULL, version INTEGER NOT NULL, content_hash TEXT NOT NULL, supersedes_id TEXT, created_by TEXT NOT NULL, reviewer_id TEXT, review_notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT, UNIQUE(slug, version), FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(ingestion_job_id) REFERENCES ingestion_jobs(id), FOREIGN KEY(created_by) REFERENCES users(id), FOREIGN KEY(reviewer_id) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_atlas_publication_org_status ON atlas_publication_versions(organization_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_atlas_publication_ingestion ON atlas_publication_versions(ingestion_job_id)`,
      `CREATE TABLE IF NOT EXISTS atlas_annotations (id TEXT PRIMARY KEY, publication_version_id TEXT NOT NULL, structure_name TEXT NOT NULL, synonyms_json TEXT NOT NULL, description TEXT NOT NULL, relationships_json TEXT NOT NULL, citations_json TEXT NOT NULL, slice_start INTEGER NOT NULL, slice_end INTEGER NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, created_by TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(publication_version_id) REFERENCES atlas_publication_versions(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_atlas_annotations_publication_status ON atlas_annotations(publication_version_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_atlas_annotations_structure ON atlas_annotations(structure_name)`,
      `CREATE TABLE IF NOT EXISTS atlas_publication_reviews (id TEXT PRIMARY KEY, publication_version_id TEXT NOT NULL, reviewer_id TEXT NOT NULL, decision TEXT NOT NULL, notes TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(publication_version_id) REFERENCES atlas_publication_versions(id), FOREIGN KEY(reviewer_id) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_atlas_reviews_publication_created ON atlas_publication_reviews(publication_version_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS organization_profiles (organization_id TEXT PRIMARY KEY, display_name TEXT NOT NULL, primary_color TEXT NOT NULL, accent_color TEXT NOT NULL, logo_url TEXT NOT NULL, custom_domain TEXT NOT NULL, support_contact TEXT NOT NULL, onboarding_stage TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE TABLE IF NOT EXISTS organization_identity_connections (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, protocol TEXT NOT NULL, issuer TEXT NOT NULL, client_id TEXT NOT NULL, metadata_url TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(organization_id, protocol), FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
      `CREATE TABLE IF NOT EXISTS learner_profiles (user_id TEXT PRIMARY KEY, training_stage TEXT NOT NULL, discipline TEXT NOT NULL, interests_json TEXT NOT NULL, institution_name TEXT NOT NULL, country_code TEXT NOT NULL, timezone TEXT NOT NULL, onboarding_status TEXT NOT NULL, terms_accepted_at TEXT, marketing_opt_in INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))`,
      `CREATE TABLE IF NOT EXISTS course_ownership (course_id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, owner_id TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(course_id) REFERENCES courses(id), FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(owner_id) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_course_ownership_org ON course_ownership(organization_id)`,
      `CREATE TABLE IF NOT EXISTS course_releases (id TEXT PRIMARY KEY, course_id TEXT NOT NULL, organization_id TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, summary TEXT NOT NULL, level TEXT NOT NULL, duration_label TEXT NOT NULL, outcomes_json TEXT NOT NULL, publisher_name TEXT NOT NULL, publisher_kind TEXT NOT NULL, visibility TEXT NOT NULL, access_model TEXT NOT NULL, price_minor INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'GBP', status TEXT NOT NULL, enrolment_open INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL, created_by TEXT NOT NULL, reviewed_by TEXT, review_notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT, FOREIGN KEY(course_id) REFERENCES courses(id), FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(created_by) REFERENCES users(id), FOREIGN KEY(reviewed_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_course_releases_catalogue ON course_releases(visibility, status, published_at)`,
      `CREATE INDEX IF NOT EXISTS idx_course_releases_course ON course_releases(course_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_course_releases_org_status ON course_releases(organization_id, status)`,
      `CREATE TABLE IF NOT EXISTS course_release_workbooks (release_id TEXT NOT NULL, workbook_id TEXT NOT NULL, position INTEGER NOT NULL, required INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(release_id, workbook_id), FOREIGN KEY(release_id) REFERENCES course_releases(id), FOREIGN KEY(workbook_id) REFERENCES workbooks(id))`,
      `CREATE INDEX IF NOT EXISTS idx_course_release_workbooks_order ON course_release_workbooks(release_id, position)`,
      `CREATE TABLE IF NOT EXISTS course_release_reviews (id TEXT PRIMARY KEY, release_id TEXT NOT NULL, reviewer_id TEXT NOT NULL, decision TEXT NOT NULL, notes TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(release_id) REFERENCES course_releases(id), FOREIGN KEY(reviewer_id) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_course_release_reviews_release ON course_release_reviews(release_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS course_invitations (id TEXT PRIMARY KEY, course_id TEXT NOT NULL, release_id TEXT NOT NULL, organization_id TEXT NOT NULL, code_hash TEXT NOT NULL UNIQUE, label TEXT NOT NULL, max_uses INTEGER NOT NULL, uses INTEGER NOT NULL DEFAULT 0, expires_at TEXT NOT NULL, status TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(course_id) REFERENCES courses(id), FOREIGN KEY(release_id) REFERENCES course_releases(id), FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_course_invitations_release_status ON course_invitations(release_id, status, expires_at)`,
      `CREATE TABLE IF NOT EXISTS learner_notes (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, visibility TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(learner_id) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_learner_notes_owner_updated ON learner_notes(learner_id, updated_at)`,
      `CREATE INDEX IF NOT EXISTS idx_learner_notes_resource ON learner_notes(resource_type, resource_id)`,
      `CREATE TABLE IF NOT EXISTS learner_review_queue (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, title TEXT NOT NULL, prompt TEXT NOT NULL, due_at TEXT NOT NULL, interval_days INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(learner_id) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_learner_review_owner_status_due ON learner_review_queue(learner_id, status, due_at)`,
      `CREATE TABLE IF NOT EXISTS course_completions (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, course_slug TEXT NOT NULL, course_title TEXT NOT NULL, percent_complete INTEGER NOT NULL, evidence_hash TEXT NOT NULL, status TEXT NOT NULL, completed_at TEXT NOT NULL, UNIQUE(learner_id, course_slug), FOREIGN KEY(learner_id) REFERENCES users(id))`,
      `CREATE TABLE IF NOT EXISTS education_certificates (id TEXT PRIMARY KEY, completion_id TEXT NOT NULL UNIQUE, public_code TEXT NOT NULL UNIQUE, title TEXT NOT NULL, issued_at TEXT NOT NULL, revoked_at TEXT, FOREIGN KEY(completion_id) REFERENCES course_completions(id))`,
      `CREATE TABLE IF NOT EXISTS billing_accounts (organization_id TEXT PRIMARY KEY, provider TEXT NOT NULL, provider_customer_ref TEXT NOT NULL, billing_contact TEXT NOT NULL, currency TEXT NOT NULL, tax_country TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE TABLE IF NOT EXISTS subscription_records (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, plan_code TEXT NOT NULL, status TEXT NOT NULL, provider_subscription_ref TEXT NOT NULL, learner_seats INTEGER NOT NULL, educator_seats INTEGER NOT NULL, storage_bytes INTEGER NOT NULL, current_period_end TEXT, cancel_at_period_end INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE INDEX IF NOT EXISTS idx_subscription_org_status ON subscription_records(organization_id, status)`,
      `CREATE TABLE IF NOT EXISTS embed_launches (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, origin TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, audience TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, status TEXT NOT NULL, expires_at TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, used_at TEXT, FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(created_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_embed_launch_org_status_expiry ON embed_launches(organization_id, status, expires_at)`,
      `CREATE TABLE IF NOT EXISTS pilot_applications (id TEXT PRIMARY KEY, organization_name TEXT NOT NULL, contact_name TEXT NOT NULL, contact_email TEXT NOT NULL, jurisdiction TEXT NOT NULL, learner_band TEXT NOT NULL, educator_band TEXT NOT NULL, content_scope TEXT NOT NULL, goals TEXT NOT NULL, support_needs TEXT NOT NULL, status TEXT NOT NULL, submitted_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS idx_pilot_applications_status_created ON pilot_applications(status, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_pilot_applications_email ON pilot_applications(contact_email)`,
      `CREATE TABLE IF NOT EXISTS organization_invitations (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, status TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, accepted_by TEXT, accepted_at TEXT, FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(created_by) REFERENCES users(id), FOREIGN KEY(accepted_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_org_invitation_org_status ON organization_invitations(organization_id, status, expires_at)`,
      `CREATE INDEX IF NOT EXISTS idx_org_invitation_email_status ON organization_invitations(email, status)`,
      `CREATE TABLE IF NOT EXISTS notification_outbox (id TEXT PRIMARY KEY, organization_id TEXT, recipient TEXT NOT NULL, template TEXT NOT NULL, payload_json TEXT NOT NULL, status TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL, sent_at TEXT, FOREIGN KEY(organization_id) REFERENCES organizations(id))`,
      `CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_created ON notification_outbox(status, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_notification_outbox_org ON notification_outbox(organization_id)`,
      `CREATE TABLE IF NOT EXISTS operational_readiness_checks (organization_id TEXT NOT NULL, gate_key TEXT NOT NULL, status TEXT NOT NULL, evidence TEXT NOT NULL, owner TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, updated_at TEXT NOT NULL, PRIMARY KEY(organization_id, gate_key), FOREIGN KEY(organization_id) REFERENCES organizations(id), FOREIGN KEY(reviewed_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_readiness_org_status ON operational_readiness_checks(organization_id, status)`,
      `CREATE TABLE IF NOT EXISTS account_requests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, request_type TEXT NOT NULL, status TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL, resolved_at TEXT, resolved_by TEXT, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(resolved_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_account_requests_user_status ON account_requests(user_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_account_requests_status_created ON account_requests(status, created_at)`,
      `CREATE TABLE IF NOT EXISTS course_release_snapshots (id TEXT PRIMARY KEY, release_id TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, snapshot_json TEXT NOT NULL, reason TEXT NOT NULL, captured_by TEXT NOT NULL, captured_at TEXT NOT NULL, UNIQUE(release_id, version, reason), FOREIGN KEY(release_id) REFERENCES course_releases(id), FOREIGN KEY(captured_by) REFERENCES users(id))`,
      `CREATE INDEX IF NOT EXISTS idx_release_snapshot_release_created ON course_release_snapshots(release_id, captured_at)`,
      `CREATE TABLE IF NOT EXISTS api_rate_limits (bucket_key TEXT PRIMARY KEY, window_start TEXT NOT NULL, count INTEGER NOT NULL, updated_at TEXT NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated ON api_rate_limits(updated_at)`,
      `CREATE TABLE IF NOT EXISTS learner_notification_preferences (user_id TEXT PRIMARY KEY, course_updates INTEGER NOT NULL DEFAULT 1, assignment_reminders INTEGER NOT NULL DEFAULT 1, review_reminders INTEGER NOT NULL DEFAULT 1, product_updates INTEGER NOT NULL DEFAULT 0, delivery_mode TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))`,
    ];
    platformSchemaReady = env.DB.batch(statements.map((statement) => env.DB.prepare(statement)))
      .then(async () => {
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(`INSERT OR IGNORE INTO organizations (id, slug, name, kind, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind("org-elivion-pilot", "elivion-pilot", "Elivion Education pilot", "platform", "active", now),
          env.DB.prepare(`INSERT OR IGNORE INTO organization_entitlements (organization_id, plan, learner_limit, educator_limit, storage_bytes, atlas_access, studio_access, reporting_access, embeds_access, status, valid_until, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("org-elivion-pilot", "Founding institution pilot", 250, 25, 53687091200, 1, 1, 1, 1, "evaluation", null, 1, now),
          env.DB.prepare(`INSERT OR IGNORE INTO education_publications (id, organization_id, resource_type, slug, title, status, rights_status, deidentification_status, specialist_review_status, reviewer, reviewed_at, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("publication-ct-head-v1", null, "atlas", "ct-head", "CT head: axial anatomy", "demonstration", "clearance-required", "synthetic-demonstration", "review-required", null, null, 1, now),
          env.DB.prepare(`INSERT OR IGNORE INTO education_publications (id, organization_id, resource_type, slug, title, status, rights_status, deidentification_status, specialist_review_status, reviewer, reviewed_at, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("publication-teaching-demo-v1", "org-elivion-pilot", "course", "guided-imaging-teaching", "Guided imaging teaching session", "private-evaluation", "synthetic-only", "synthetic-demonstration", "review-required", null, null, 1, now),
          env.DB.prepare(`INSERT OR IGNORE INTO organization_profiles (organization_id, display_name, primary_color, accent_color, logo_url, custom_domain, support_contact, onboarding_stage, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("org-elivion-pilot", "Elivion Education pilot", "#082a31", "#28c6a8", "", "", "education@elivion.example", "evaluation", now),
          env.DB.prepare(`INSERT OR IGNORE INTO course_ownership (course_id, organization_id, owner_id, created_at) VALUES (?, ?, ?, ?)`).bind("course-advanced-imaging", "org-elivion-pilot", "edu:system-examiner", now),
          env.DB.prepare(`INSERT OR IGNORE INTO course_releases (id, course_id, organization_id, slug, title, summary, level, duration_label, outcomes_json, publisher_name, publisher_kind, visibility, access_model, price_minor, currency, status, enrolment_open, version, created_by, reviewed_by, review_notes, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("release-integrated-imaging-v1", "course-advanced-imaging", "org-elivion-pilot", "integrated-imaging-laboratory", "Integrated imaging teaching laboratory", "A case-led radiology and pathology laboratory using saved viewer scenes, live teaching, knowledge checks and structured assessment.", "Intermediate", "2 hours", JSON.stringify(["Navigate linked radiology and pathology teaching cases", "Use a repeatable image-review sequence", "Answer structured image-localisation and interpretation questions", "Review progress with an educator"]), "Elivion Studio demonstration", "institution", "public", "free", 0, "GBP", "published", 1, 1, "edu:system-examiner", "edu:system-examiner", "Migrated demonstration release", now, now, now),
          env.DB.prepare(`INSERT OR IGNORE INTO course_release_workbooks (release_id, workbook_id, position, required) VALUES (?, ?, ?, ?)`).bind("release-integrated-imaging-v1", "workbook-teaching-demo", 1, 1),
          env.DB.prepare(`INSERT OR IGNORE INTO course_release_workbooks (release_id, workbook_id, position, required) VALUES (?, ?, ?, ?)`).bind("release-integrated-imaging-v1", "workbook-assessment", 2, 0),
          env.DB.prepare(`INSERT OR IGNORE INTO billing_accounts (organization_id, provider, provider_customer_ref, billing_contact, currency, tax_country, status, version, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("org-elivion-pilot", "disabled", "", "education@elivion.example", "GBP", "GB", "evaluation", 1, now),
          env.DB.prepare(`INSERT OR IGNORE INTO subscription_records (id, organization_id, plan_code, status, provider_subscription_ref, learner_seats, educator_seats, storage_bytes, current_period_end, cancel_at_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind("subscription-elivion-pilot", "org-elivion-pilot", "founding-institution", "evaluation", "", 250, 25, 53687091200, null, 0, now, now),
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
  await env.DB.prepare(`INSERT INTO organization_memberships (organization_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(organization_id, user_id) DO UPDATE SET role = excluded.role, status = 'active'`).bind("org-elivion-pilot", auth.userId, membershipRole, "active", now).run();

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
