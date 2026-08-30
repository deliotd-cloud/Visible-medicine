import { env } from "cloudflare:workers";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { ensurePlatformSchema, getPlatformSnapshot } from "@/db/platform";
import type { AuthContext } from "@/lib/auth";
import { atlasModules, findCourse } from "@/lib/catalog";
import { sha256 } from "@/lib/domain";

type Row = Record<string, string | number | null>;

export class PlatformGovernanceError extends Error {
  constructor(message: string, public status = 422) {
    super(message);
  }
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.normalize("NFKC").trim().slice(0, max) : "";
}

function lines(value: unknown, maxItems = 12, itemLength = 240) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n|,/) : [];
  return [...new Set(source.map((item) => text(item, itemLength)).filter(Boolean))].slice(0, maxItems);
}

function slug(value: unknown) {
  const result = text(value, 90).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(result)) throw new PlatformGovernanceError("Use a short lowercase publication slug.");
  return result;
}

function httpsUrl(value: unknown, label: string, optional = false) {
  const input = text(value, 400);
  if (!input && optional) return "";
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "https:") throw new Error();
    return parsed.toString();
  } catch {
    throw new PlatformGovernanceError(`${label} must be a valid HTTPS URL.`);
  }
}

function hex(value: unknown, fallback: string) {
  const input = text(value, 7);
  return /^#[0-9a-f]{6}$/i.test(input) ? input.toLowerCase() : fallback;
}

async function requireAdministrator(auth: AuthContext) {
  const { roles } = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  if (!roles.includes("administrator")) throw new PlatformGovernanceError("An organisation administrator is required.", 403);
  return roles;
}

async function organisationFor(auth: AuthContext) {
  const snapshot = await getPlatformSnapshot(auth);
  return snapshot;
}

function mapPublication(row: Row) {
  return {
    id: String(row.id), slug: String(row.slug), title: String(row.title), region: String(row.region), modality: String(row.modality), orientation: String(row.orientation), sourceStatement: String(row.source_statement), status: String(row.status), rightsStatus: String(row.rights_status), deidentificationStatus: String(row.deidentification_status), specialistReviewStatus: String(row.specialist_review_status), version: Number(row.version), contentHash: String(row.content_hash), ingestionJobId: row.ingestion_job_id ? String(row.ingestion_job_id) : null, createdBy: String(row.created_by), reviewerId: row.reviewer_id ? String(row.reviewer_id) : null, reviewNotes: String(row.review_notes ?? ""), updatedAt: String(row.updated_at), publishedAt: row.published_at ? String(row.published_at) : null,
  };
}

export async function getControlCentreSnapshot(auth: AuthContext) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  const organizationId = platform.organization.id;
  const [profile, identities, ingestions, publications, annotations, reviews, billing, subscriptions, launches] = await Promise.all([
    env.DB.prepare(`SELECT * FROM organization_profiles WHERE organization_id = ?`).bind(organizationId).first<Row>(),
    env.DB.prepare(`SELECT * FROM organization_identity_connections WHERE organization_id = ? ORDER BY protocol`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT id, title, detected_type, status, deidentified, publication_cleared, content_hash, created_at FROM ingestion_jobs WHERE status IN ('ready-for-review','published') ORDER BY created_at DESC LIMIT 30`).all<Row>(),
    env.DB.prepare(`SELECT * FROM atlas_publication_versions WHERE organization_id IS NULL OR organization_id = ? ORDER BY updated_at DESC`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT * FROM atlas_annotations WHERE publication_version_id IN (SELECT id FROM atlas_publication_versions WHERE organization_id IS NULL OR organization_id = ?) ORDER BY updated_at DESC`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT r.*, u.display_name AS reviewer_name FROM atlas_publication_reviews r LEFT JOIN users u ON u.id = r.reviewer_id WHERE r.publication_version_id IN (SELECT id FROM atlas_publication_versions WHERE organization_id IS NULL OR organization_id = ?) ORDER BY r.created_at DESC`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT * FROM billing_accounts WHERE organization_id = ?`).bind(organizationId).first<Row>(),
    env.DB.prepare(`SELECT * FROM subscription_records WHERE organization_id = ? ORDER BY updated_at DESC`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT id, origin, resource_type, resource_id, audience, status, expires_at, created_at, used_at FROM embed_launches WHERE organization_id = ? ORDER BY created_at DESC LIMIT 20`).bind(organizationId).all<Row>(),
  ]);
  return {
    platform,
    profile: profile ? { displayName: String(profile.display_name), primaryColor: String(profile.primary_color), accentColor: String(profile.accent_color), logoUrl: String(profile.logo_url), customDomain: String(profile.custom_domain), supportContact: String(profile.support_contact), onboardingStage: String(profile.onboarding_stage), updatedAt: String(profile.updated_at) } : null,
    identities: identities.results.map((row) => ({ id: String(row.id), protocol: String(row.protocol), issuer: String(row.issuer), clientId: String(row.client_id), metadataUrl: String(row.metadata_url), status: String(row.status), version: Number(row.version), updatedAt: String(row.updated_at) })),
    ingestions: ingestions.results.map((row) => ({ id: String(row.id), title: String(row.title), detectedType: String(row.detected_type), status: String(row.status), deidentified: Boolean(row.deidentified), publicationCleared: Boolean(row.publication_cleared), contentHash: String(row.content_hash), createdAt: String(row.created_at) })),
    publications: publications.results.map(mapPublication),
    annotations: annotations.results.map((row) => ({ id: String(row.id), publicationVersionId: String(row.publication_version_id), structureName: String(row.structure_name), synonyms: JSON.parse(String(row.synonyms_json)) as string[], description: String(row.description), relationships: JSON.parse(String(row.relationships_json)) as string[], citations: JSON.parse(String(row.citations_json)) as string[], sliceStart: Number(row.slice_start), sliceEnd: Number(row.slice_end), status: String(row.status), version: Number(row.version), updatedAt: String(row.updated_at) })),
    reviews: reviews.results.map((row) => ({ id: String(row.id), publicationVersionId: String(row.publication_version_id), reviewerName: String(row.reviewer_name ?? "Education reviewer"), decision: String(row.decision), notes: String(row.notes), createdAt: String(row.created_at) })),
    billing: billing ? { provider: String(billing.provider), billingContact: String(billing.billing_contact), currency: String(billing.currency), taxCountry: String(billing.tax_country), status: String(billing.status), version: Number(billing.version), updatedAt: String(billing.updated_at) } : null,
    subscriptions: subscriptions.results.map((row) => ({ id: String(row.id), planCode: String(row.plan_code), status: String(row.status), learnerSeats: Number(row.learner_seats), educatorSeats: Number(row.educator_seats), storageBytes: Number(row.storage_bytes), currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null, updatedAt: String(row.updated_at) })),
    launches: launches.results.map((row) => ({ id: String(row.id), origin: String(row.origin), resourceType: String(row.resource_type), resourceId: String(row.resource_id), audience: String(row.audience), status: String(row.status), expiresAt: String(row.expires_at), createdAt: String(row.created_at), usedAt: row.used_at ? String(row.used_at) : null })),
    readiness: {
      identityActivation: false,
      billingActivation: process.env.BILLING_PROVIDER === "configured",
      signedEmbeds: Boolean(process.env.EMBED_SIGNING_SECRET),
      clinicalConnectivity: false,
    },
  };
}

export async function saveOrganizationProfile(auth: AuthContext, input: Record<string, unknown>) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  const displayName = text(input.displayName, 120);
  const supportContact = text(input.supportContact, 160).toLowerCase();
  if (!displayName) throw new PlatformGovernanceError("An organisation display name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportContact)) throw new PlatformGovernanceError("Enter a valid support email address.");
  const logoUrl = input.logoUrl ? httpsUrl(input.logoUrl, "Logo URL", true) : "";
  const customDomain = text(input.customDomain, 240).toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (customDomain && !/^[a-z0-9.-]+$/.test(customDomain)) throw new PlatformGovernanceError("Enter a hostname without a path.");
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE organizations SET name = ? WHERE id = ?`).bind(displayName, platform.organization.id),
    env.DB.prepare(`INSERT INTO organization_profiles (organization_id, display_name, primary_color, accent_color, logo_url, custom_domain, support_contact, onboarding_stage, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(organization_id) DO UPDATE SET display_name=excluded.display_name, primary_color=excluded.primary_color, accent_color=excluded.accent_color, logo_url=excluded.logo_url, custom_domain=excluded.custom_domain, support_contact=excluded.support_contact, onboarding_stage=excluded.onboarding_stage, updated_at=excluded.updated_at`).bind(platform.organization.id, displayName, hex(input.primaryColor, "#082a31"), hex(input.accentColor, "#28c6a8"), logoUrl, customDomain, supportContact, "configured", now),
  ]);
  await appendAudit(auth.userId, "organization.profile-updated", "organization", platform.organization.id, "success", `branding=true;custom-domain=${Boolean(customDomain)}`);
}

export async function saveIdentityDraft(auth: AuthContext, input: Record<string, unknown>) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  const protocol = text(input.protocol, 12).toLowerCase();
  if (!new Set(["oidc", "saml"]).has(protocol)) throw new PlatformGovernanceError("Choose OIDC or SAML.");
  const issuer = httpsUrl(input.issuer, "Issuer");
  const metadataUrl = httpsUrl(input.metadataUrl, "Metadata URL");
  const clientId = text(input.clientId, 220);
  if (!clientId) throw new PlatformGovernanceError("A client or entity identifier is required.");
  const current = await env.DB.prepare(`SELECT id, version FROM organization_identity_connections WHERE organization_id = ? AND protocol = ?`).bind(platform.organization.id, protocol).first<{ id: string; version: number }>();
  const expectedVersion = Number(input.expectedVersion ?? 0);
  if ((current?.version ?? 0) !== expectedVersion) throw new PlatformGovernanceError("The identity draft changed. Refresh and try again.", 409);
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO organization_identity_connections (id, organization_id, protocol, issuer, client_id, metadata_url, status, version, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?) ON CONFLICT(organization_id, protocol) DO UPDATE SET issuer=excluded.issuer, client_id=excluded.client_id, metadata_url=excluded.metadata_url, status='draft', version=excluded.version, updated_at=excluded.updated_at`).bind(current?.id ?? crypto.randomUUID(), platform.organization.id, protocol, issuer, clientId, metadataUrl, expectedVersion + 1, auth.userId, now, now).run();
  await appendAudit(auth.userId, "identity.draft-saved", "organization", platform.organization.id, "success", `protocol=${protocol};activation=false;secrets=false`);
}

export async function createAtlasDraft(auth: AuthContext, input: Record<string, unknown>) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  if (!platform.entitlement.studioAccess) throw new PlatformGovernanceError("Atlas publishing is not included in this entitlement.", 403);
  const ingestionId = text(input.ingestionJobId, 120);
  const ingestion = await env.DB.prepare(`SELECT id, status, deidentified, publication_cleared, content_hash FROM ingestion_jobs WHERE id = ?`).bind(ingestionId).first<Row>();
  if (!ingestion || !["ready-for-review", "published"].includes(String(ingestion.status)) || Number(ingestion.deidentified) !== 1 || Number(ingestion.publication_cleared) !== 1) throw new PlatformGovernanceError("Choose a de-identified, rights-cleared ingestion that is ready for review.", 409);
  const publicationSlug = slug(input.slug);
  const title = text(input.title, 160);
  const region = text(input.region, 80);
  const modality = text(input.modality, 40).toUpperCase();
  const orientation = text(input.orientation, 60);
  const sourceStatement = text(input.sourceStatement, 700);
  if (!title || !region || !modality || !orientation || sourceStatement.length < 20) throw new PlatformGovernanceError("Complete the title, anatomy region, modality, orientation and provenance statement.");
  const latest = await env.DB.prepare(`SELECT id, version FROM atlas_publication_versions WHERE slug = ? ORDER BY version DESC LIMIT 1`).bind(publicationSlug).first<{ id: string; version: number }>();
  const version = (latest?.version ?? 0) + 1;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO atlas_publication_versions (id, organization_id, ingestion_job_id, slug, title, region, modality, orientation, source_statement, status, rights_status, deidentification_status, specialist_review_status, version, content_hash, supersedes_id, created_by, reviewer_id, review_notes, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'cleared', 'verified', 'pending', ?, ?, ?, ?, NULL, '', ?, ?, NULL)`).bind(id, platform.organization.id, ingestionId, publicationSlug, title, region, modality, orientation, sourceStatement, version, String(ingestion.content_hash), latest?.id ?? null, auth.userId, now, now).run();
  await appendAudit(auth.userId, "atlas.version-drafted", "atlas-publication", id, "success", `slug=${publicationSlug};version=${version};ingestion=${ingestionId}`);
}

export async function addAtlasAnnotation(auth: AuthContext, input: Record<string, unknown>) {
  await requireAdministrator(auth);
  const publicationId = text(input.publicationId, 120);
  const publication = await env.DB.prepare(`SELECT id, status, organization_id FROM atlas_publication_versions WHERE id = ?`).bind(publicationId).first<Row>();
  const platform = await organisationFor(auth);
  if (!publication || publication.organization_id !== platform.organization.id) throw new PlatformGovernanceError("Atlas draft not found.", 404);
  if (!["draft", "changes-requested"].includes(String(publication.status))) throw new PlatformGovernanceError("Annotations can only be changed in an editable draft.", 409);
  const structureName = text(input.structureName, 120);
  const description = text(input.description, 1200);
  const sliceStart = Math.max(1, Math.min(10000, Number(input.sliceStart)));
  const sliceEnd = Math.max(sliceStart, Math.min(10000, Number(input.sliceEnd)));
  const citations = lines(input.citations, 12, 500);
  if (!structureName || description.length < 20 || !Number.isInteger(sliceStart) || !Number.isInteger(sliceEnd) || !citations.length) throw new PlatformGovernanceError("Add a structure name, reviewed description, valid slice range and at least one citation.");
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO atlas_annotations (id, publication_version_id, structure_name, synonyms_json, description, relationships_json, citations_json, slice_start, slice_end, status, version, created_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, ?, ?)`).bind(id, publicationId, structureName, JSON.stringify(lines(input.synonyms, 20, 100)), description, JSON.stringify(lines(input.relationships, 20, 240)), JSON.stringify(citations), sliceStart, sliceEnd, auth.userId, now).run();
  await env.DB.prepare(`UPDATE atlas_publication_versions SET updated_at = ? WHERE id = ?`).bind(now, publicationId).run();
  await appendAudit(auth.userId, "atlas.annotation-added", "atlas-publication", publicationId, "success", `annotation=${id};structure=${structureName}`);
}

export async function submitAtlasForReview(auth: AuthContext, publicationIdValue: unknown) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  const publicationId = text(publicationIdValue, 120);
  const publication = await env.DB.prepare(`SELECT status, organization_id FROM atlas_publication_versions WHERE id = ?`).bind(publicationId).first<Row>();
  if (!publication || publication.organization_id !== platform.organization.id) throw new PlatformGovernanceError("Atlas draft not found.", 404);
  if (!["draft", "changes-requested"].includes(String(publication.status))) throw new PlatformGovernanceError("Only an editable draft can be submitted.", 409);
  const count = await env.DB.prepare(`SELECT COUNT(*) AS count FROM atlas_annotations WHERE publication_version_id = ?`).bind(publicationId).first<{ count: number }>();
  if (!count?.count) throw new PlatformGovernanceError("Add at least one cited structure annotation before review.", 409);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE atlas_publication_versions SET status='in-review', specialist_review_status='pending', updated_at=? WHERE id=?`).bind(now, publicationId),
    env.DB.prepare(`UPDATE atlas_annotations SET status='review-pending', updated_at=? WHERE publication_version_id=?`).bind(now, publicationId),
  ]);
  await appendAudit(auth.userId, "atlas.review-requested", "atlas-publication", publicationId, "success", `annotations=${count.count}`);
}

export async function reviewAtlasPublication(auth: AuthContext, input: Record<string, unknown>) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  const publicationId = text(input.publicationId, 120);
  const decision = text(input.decision, 30);
  const notes = text(input.notes, 1200);
  if (!new Set(["approved", "changes-requested"]).has(decision) || notes.length < 12) throw new PlatformGovernanceError("Record an approval or changes request with reviewer notes.");
  const publication = await env.DB.prepare(`SELECT status, organization_id, created_by FROM atlas_publication_versions WHERE id=?`).bind(publicationId).first<Row>();
  if (!publication || publication.organization_id !== platform.organization.id) throw new PlatformGovernanceError("Atlas review record not found.", 404);
  if (publication.status !== "in-review") throw new PlatformGovernanceError("This publication is not awaiting review.", 409);
  if (publication.created_by === auth.userId) throw new PlatformGovernanceError("Independent specialist review must be completed by a different education user.", 409);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO atlas_publication_reviews (id, publication_version_id, reviewer_id, decision, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), publicationId, auth.userId, decision, notes, now),
    env.DB.prepare(`UPDATE atlas_publication_versions SET status=?, specialist_review_status=?, reviewer_id=?, review_notes=?, updated_at=? WHERE id=?`).bind(decision, decision === "approved" ? "approved" : "changes-requested", auth.userId, notes, now, publicationId),
    env.DB.prepare(`UPDATE atlas_annotations SET status=?, updated_at=? WHERE publication_version_id=?`).bind(decision === "approved" ? "approved" : "draft", now, publicationId),
  ]);
  await appendAudit(auth.userId, `atlas.review-${decision}`, "atlas-publication", publicationId, "success", "independent-review=true");
}

export async function publishAtlasPublication(auth: AuthContext, publicationIdValue: unknown) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  const publicationId = text(publicationIdValue, 120);
  const publication = await env.DB.prepare(`SELECT * FROM atlas_publication_versions WHERE id=?`).bind(publicationId).first<Row>();
  if (!publication || publication.organization_id !== platform.organization.id) throw new PlatformGovernanceError("Approved atlas version not found.", 404);
  if (publication.status !== "approved" || publication.specialist_review_status !== "approved" || publication.rights_status !== "cleared" || publication.deidentification_status !== "verified") throw new PlatformGovernanceError("Rights, de-identification and independent specialist review must all pass before publication.", 409);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE atlas_publication_versions SET status='published', published_at=?, updated_at=? WHERE id=? AND status='approved'`).bind(now, now, publicationId),
    env.DB.prepare(`UPDATE atlas_annotations SET status='published', updated_at=? WHERE publication_version_id=?`).bind(now, publicationId),
    env.DB.prepare(`INSERT INTO education_publications (id, organization_id, resource_type, slug, title, status, rights_status, deidentification_status, specialist_review_status, reviewer, reviewed_at, version, updated_at) VALUES (?, ?, 'atlas', ?, ?, 'published', 'cleared', 'verified', 'approved', ?, ?, ?, ?) ON CONFLICT(resource_type, slug, version) DO UPDATE SET status='published', rights_status='cleared', deidentification_status='verified', specialist_review_status='approved', reviewer=excluded.reviewer, reviewed_at=excluded.reviewed_at, updated_at=excluded.updated_at`).bind(`atlas:${publication.slug}:v${publication.version}`, platform.organization.id, publication.slug, publication.title, auth.email, now, publication.version, now),
  ]);
  await appendAudit(auth.userId, "atlas.version-published", "atlas-publication", publicationId, "success", `slug=${publication.slug};version=${publication.version};education-only=true`);
}

export async function saveBillingIntent(auth: AuthContext, input: Record<string, unknown>) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  const contact = text(input.billingContact, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) throw new PlatformGovernanceError("Enter a valid billing contact.");
  const planCode = text(input.planCode, 40);
  if (!new Set(["institution", "enterprise", "founding-institution"]).has(planCode)) throw new PlatformGovernanceError("Choose an institutional plan.");
  const learnerSeats = Math.max(1, Math.min(100000, Number(input.learnerSeats)));
  const educatorSeats = Math.max(1, Math.min(10000, Number(input.educatorSeats)));
  const storageGb = Math.max(1, Math.min(100000, Number(input.storageGb)));
  if (![learnerSeats, educatorSeats, storageGb].every(Number.isInteger)) throw new PlatformGovernanceError("Seat and storage bands must be whole numbers.");
  const current = await env.DB.prepare(`SELECT version FROM billing_accounts WHERE organization_id=?`).bind(platform.organization.id).first<{ version: number }>();
  const expectedVersion = Number(input.expectedVersion ?? 0);
  if ((current?.version ?? 0) !== expectedVersion) throw new PlatformGovernanceError("The billing brief changed. Refresh and try again.", 409);
  const now = new Date().toISOString();
  const storageBytes = storageGb * 1073741824;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO billing_accounts (organization_id, provider, provider_customer_ref, billing_contact, currency, tax_country, status, version, updated_at) VALUES (?, 'disabled', '', ?, 'GBP', ?, 'evaluation', ?, ?) ON CONFLICT(organization_id) DO UPDATE SET billing_contact=excluded.billing_contact, tax_country=excluded.tax_country, status='evaluation', version=excluded.version, updated_at=excluded.updated_at`).bind(platform.organization.id, contact, text(input.taxCountry, 2).toUpperCase() || "GB", expectedVersion + 1, now),
    env.DB.prepare(`INSERT INTO subscription_records (id, organization_id, plan_code, status, provider_subscription_ref, learner_seats, educator_seats, storage_bytes, current_period_end, cancel_at_period_end, created_at, updated_at) VALUES (?, ?, ?, 'evaluation', '', ?, ?, ?, NULL, 0, ?, ?) ON CONFLICT(id) DO UPDATE SET plan_code=excluded.plan_code, status='evaluation', learner_seats=excluded.learner_seats, educator_seats=excluded.educator_seats, storage_bytes=excluded.storage_bytes, updated_at=excluded.updated_at`).bind(`subscription-${platform.organization.id}`, platform.organization.id, planCode, learnerSeats, educatorSeats, storageBytes, now, now),
  ]);
  await appendAudit(auth.userId, "billing.intent-updated", "organization", platform.organization.id, "success", `plan=${planCode};provider=disabled;charge=false`);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function jsonToBase64Url(value: object) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

function base64UrlToBytes(segment: string) {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((segment.length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function verifyHmac(value: string, signature: string, secret: string) {
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), new TextEncoder().encode(value));
  } catch {
    return false;
  }
}

async function embeddedResourceExists(resourceType: string, resourceId: string) {
  if (resourceType === "course") {
    if (findCourse(resourceId)) return true;
    return Boolean(await env.DB.prepare(`SELECT id FROM courses WHERE id=? AND status='published'`).bind(resourceId).first());
  }
  if (resourceType === "atlas") {
    if (atlasModules.some((item) => item.slug === resourceId)) return true;
    return Boolean(await env.DB.prepare(`SELECT id FROM atlas_publication_versions WHERE (id=? OR slug=?) AND status='published'`).bind(resourceId, resourceId).first());
  }
  return Boolean(await env.DB.prepare(`SELECT id FROM workbooks WHERE id=? AND status='published'`).bind(resourceId).first());
}

export async function issueEmbedLaunch(auth: AuthContext, input: Record<string, unknown>) {
  await requireAdministrator(auth);
  const platform = await organisationFor(auth);
  if (!platform.entitlement.embedsAccess || platform.entitlement.status === "suspended") throw new PlatformGovernanceError("Embedded delivery is not enabled for this institution.", 403);
  const secret = process.env.EMBED_SIGNING_SECRET;
  if (!secret) throw new PlatformGovernanceError("Signed launches are not configured on this environment.", 503);
  const originInput = text(input.origin, 240).toLowerCase();
  let origin: string;
  try { const parsed = new URL(originInput); if (parsed.protocol !== "https:" || parsed.origin !== originInput) throw new Error(); origin = parsed.origin; }
  catch { throw new PlatformGovernanceError("Choose an exact approved HTTPS origin."); }
  const approved = await env.DB.prepare(`SELECT status FROM approved_embed_origins WHERE organization_id=? AND origin=?`).bind(platform.organization.id, origin).first<{ status: string }>();
  if (!approved || !["active", "evaluation"].includes(approved.status)) throw new PlatformGovernanceError("This origin is not approved for the institution.", 409);
  const resourceType = text(input.resourceType, 20);
  if (!new Set(["course", "atlas", "workbook"]).has(resourceType)) throw new PlatformGovernanceError("Choose an education resource type.");
  const resourceId = text(input.resourceId, 120);
  const audience = text(input.audience, 80) || "institution-learners";
  if (!resourceId) throw new PlatformGovernanceError("A published education resource is required.");
  if (!(await embeddedResourceExists(resourceType, resourceId))) throw new PlatformGovernanceError("Choose a published education resource.", 409);
  const id = crypto.randomUUID();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + 300;
  const header = jsonToBase64Url({ alg: "HS256", typ: "JWT", kid: "visible-medicine-embed-v1" });
  const payload = jsonToBase64Url({ jti: id, iss: "visible-medicine", aud: "embedded-learning", org: platform.organization.id, origin, resourceType, resourceId, audience, intendedUse: "education-research-only", evaluation: approved.status !== "active", iat: issuedAt, exp: expiresAtSeconds });
  const unsigned = `${header}.${payload}`;
  const token = `${unsigned}.${await hmac(unsigned, secret)}`;
  const tokenHash = await sha256(token);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(expiresAtSeconds * 1000).toISOString();
  await env.DB.prepare(`INSERT INTO embed_launches (id, organization_id, origin, resource_type, resource_id, audience, token_hash, status, expires_at, created_by, created_at, used_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, NULL)`).bind(id, platform.organization.id, origin, resourceType, resourceId, audience, tokenHash, expiresAt, auth.userId, createdAt).run();
  await appendAudit(auth.userId, "embed.launch-issued", "embed-launch", id, "success", `origin=${origin};resource=${resourceType}:${resourceId};ttl=300`);
  return { token, launchPath: `/embed/launch?token=${encodeURIComponent(token)}`, expiresAt, evaluation: approved.status !== "active" };
}

function base64UrlToJson(segment: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as Record<string, unknown>;
}

export async function validateEmbedLaunch(tokenValue: unknown, parentOriginValue: unknown) {
  await ensurePlatformSchema();
  const token = text(tokenValue, 4096);
  const parentOrigin = text(parentOriginValue, 240).toLowerCase();
  const secret = process.env.EMBED_SIGNING_SECRET;
  if (!secret) throw new PlatformGovernanceError("Signed launches are unavailable.", 503);
  const segments = token.split(".");
  if (segments.length !== 3) throw new PlatformGovernanceError("Invalid launch token.", 401);
  if (!(await verifyHmac(`${segments[0]}.${segments[1]}`, segments[2], secret))) throw new PlatformGovernanceError("Invalid launch signature.", 401);
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try { header = base64UrlToJson(segments[0]); payload = base64UrlToJson(segments[1]); }
  catch { throw new PlatformGovernanceError("Invalid launch token.", 401); }
  if (header.alg !== "HS256" || header.typ !== "JWT" || header.kid !== "visible-medicine-embed-v1") throw new PlatformGovernanceError("Invalid launch token.", 401);
  if (payload.iss !== "visible-medicine" || payload.aud !== "embedded-learning" || payload.intendedUse !== "education-research-only" || typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000) || payload.origin !== parentOrigin) throw new PlatformGovernanceError("The launch has expired or does not match this host origin.", 401);
  const tokenHash = await sha256(token);
  const launch = await env.DB.prepare(`SELECT e.*, oe.embeds_access, oe.status AS entitlement_status FROM embed_launches e JOIN organization_entitlements oe ON oe.organization_id=e.organization_id WHERE e.id=? AND e.token_hash=?`).bind(String(payload.jti), tokenHash).first<Row>();
  if (!launch || launch.status !== "active" || Number(launch.embeds_access) !== 1 || !["active", "evaluation"].includes(String(launch.entitlement_status)) || new Date(String(launch.expires_at)).getTime() <= Date.now()) throw new PlatformGovernanceError("This embedded launch is no longer active.", 401);
  await env.DB.prepare(`UPDATE embed_launches SET used_at=COALESCE(used_at, ?) WHERE id=?`).bind(new Date().toISOString(), String(payload.jti)).run();
  return { resourceType: String(payload.resourceType), resourceId: String(payload.resourceId), audience: String(payload.audience), origin: parentOrigin, evaluation: Boolean(payload.evaluation), intendedUse: "education-research-only" };
}

export async function searchEducation(queryValue: unknown) {
  await ensurePlatformSchema();
  const query = text(queryValue, 80);
  if (query.length < 2) return [];
  const normalizedQuery = query.replace(/[%_]/g, "").toLowerCase().trim();
  if (normalizedQuery.length < 2) return [];
  const term = `%${normalizedQuery}%`;
  const [caseRows, workbookRows, annotationRows, courseReleaseRows] = await Promise.all([
    env.DB.prepare(`SELECT id, title, description, classification FROM cases WHERE status='published' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(classification) LIKE ?) LIMIT 12`).bind(term, term, term).all<Row>(),
    env.DB.prepare(`SELECT w.id, w.title, w.mode, c.title AS course_title FROM workbooks w JOIN modules m ON m.id=w.module_id JOIN courses c ON c.id=m.course_id WHERE w.status='published' AND (LOWER(w.title) LIKE ? OR LOWER(c.title) LIKE ?) LIMIT 12`).bind(term, term).all<Row>(),
    env.DB.prepare(`SELECT a.structure_name, a.description, a.publication_version_id, p.slug, p.title, p.modality FROM atlas_annotations a JOIN atlas_publication_versions p ON p.id=a.publication_version_id WHERE p.status='published' AND a.status='published' AND (LOWER(a.structure_name) LIKE ? OR LOWER(a.synonyms_json) LIKE ? OR LOWER(a.description) LIKE ?) LIMIT 16`).bind(term, term, term).all<Row>(),
    env.DB.prepare(`SELECT slug, title, summary, level, duration_label, publisher_name FROM course_releases WHERE status='published' AND visibility='public' AND (LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(level) LIKE ? OR LOWER(publisher_name) LIKE ?) LIMIT 12`).bind(term, term, term, term).all<Row>(),
  ]);
  const staticResults = [
    ...atlasModules.filter((item) => [item.title, item.region, item.modality, item.description, ...item.systems].join(" ").toLowerCase().includes(query.toLowerCase())).map((item) => ({ kind: "Atlas", title: item.title, summary: item.description, href: `/atlas/${item.slug}`, meta: `${item.modality} · ${item.region}` })),
  ];
  return [...staticResults,
    ...courseReleaseRows.results.map((row) => ({ kind: "Course", title: String(row.title), summary: String(row.summary), href: `/courses/${row.slug}`, meta: `${row.level} · ${row.duration_label}` })),
    ...annotationRows.results.map((row) => ({ kind: "Structure", title: String(row.structure_name), summary: String(row.description), href: `/atlas/${row.slug}`, meta: `${row.modality} · ${row.title}` })),
    ...caseRows.results.map((row) => ({ kind: "Case", title: String(row.title), summary: String(row.description), href: `/learn?case=${encodeURIComponent(String(row.id))}`, meta: String(row.classification) })),
    ...workbookRows.results.map((row) => ({ kind: "Workbook", title: String(row.title), summary: `${row.course_title} teaching workbook`, href: `/learn?workbook=${encodeURIComponent(String(row.id))}`, meta: String(row.mode) })),
  ].slice(0, 30);
}

function containsPatientIdentifier(value: string) {
  return /\b(mrn|nhs\s*(number|no)|patient\s*(name|id)|patientname|patientid|accession\s*(number|no)|date\s*of\s*birth|dob)\b|\b\d{3}\s?\d{3}\s?\d{4}\b/i.test(value);
}

export async function getLearnerPortfolio(auth: AuthContext) {
  await ensureEducationUser(auth);
  await ensurePlatformSchema();
  const [notes, reviews, completions] = await Promise.all([
    env.DB.prepare(`SELECT * FROM learner_notes WHERE learner_id=? ORDER BY updated_at DESC LIMIT 50`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT * FROM learner_review_queue WHERE learner_id=? ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, due_at LIMIT 50`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT c.*, e.public_code, e.title AS certificate_title, e.issued_at, e.revoked_at FROM course_completions c LEFT JOIN education_certificates e ON e.completion_id=c.id WHERE c.learner_id=? ORDER BY c.completed_at DESC`).bind(auth.userId).all<Row>(),
  ]);
  return {
    notes: notes.results.map((row) => ({ id: String(row.id), resourceType: String(row.resource_type), resourceId: String(row.resource_id), title: String(row.title), body: String(row.body), updatedAt: String(row.updated_at) })),
    reviews: reviews.results.map((row) => ({ id: String(row.id), resourceType: String(row.resource_type), resourceId: String(row.resource_id), title: String(row.title), prompt: String(row.prompt), dueAt: String(row.due_at), intervalDays: Number(row.interval_days), status: String(row.status), updatedAt: String(row.updated_at) })),
    completions: completions.results.map((row) => ({ id: String(row.id), courseSlug: String(row.course_slug), courseTitle: String(row.course_title), percentComplete: Number(row.percent_complete), completedAt: String(row.completed_at), status: String(row.status), certificateCode: row.public_code ? String(row.public_code) : null, certificateTitle: row.certificate_title ? String(row.certificate_title) : null, issuedAt: row.issued_at ? String(row.issued_at) : null, revokedAt: row.revoked_at ? String(row.revoked_at) : null })),
  };
}

export async function saveLearnerNote(auth: AuthContext, input: Record<string, unknown>) {
  await ensureEducationUser(auth); await ensurePlatformSchema();
  const resourceType = text(input.resourceType, 20);
  if (!new Set(["atlas", "course", "case", "workbook"]).has(resourceType)) throw new PlatformGovernanceError("Choose an education resource.");
  const resourceId = text(input.resourceId, 120);
  const title = text(input.title, 120);
  const body = text(input.body, 4000);
  if (!resourceId || !title || body.length < 3) throw new PlatformGovernanceError("A note title and body are required.");
  if (containsPatientIdentifier(`${title} ${body}`)) throw new PlatformGovernanceError("Do not place patient identifiers in educational notes.");
  const now = new Date().toISOString(); const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO learner_notes (id, learner_id, resource_type, resource_id, title, body, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'private', ?, ?)`).bind(id, auth.userId, resourceType, resourceId, title, body, now, now).run();
  await appendAudit(auth.userId, "learner.note-created", "learner-note", id, "success", `resource=${resourceType}:${resourceId};private=true`);
}

export async function scheduleLearnerReview(auth: AuthContext, input: Record<string, unknown>) {
  await ensureEducationUser(auth); await ensurePlatformSchema();
  const resourceType = text(input.resourceType, 20);
  if (!new Set(["atlas", "course", "case", "workbook"]).has(resourceType)) throw new PlatformGovernanceError("Choose an education resource.");
  const resourceId = text(input.resourceId, 120); const title = text(input.title, 140); const prompt = text(input.prompt, 500);
  const intervalDays = Math.max(1, Math.min(365, Number(input.intervalDays ?? 7)));
  if (!resourceId || !title || !prompt || !Number.isInteger(intervalDays)) throw new PlatformGovernanceError("Complete the review title, prompt and interval.");
  if (containsPatientIdentifier(`${title} ${prompt}`)) throw new PlatformGovernanceError("Do not place patient identifiers in a review prompt.");
  const now = new Date(); const dueAt = new Date(now.getTime() + intervalDays * 86400000).toISOString(); const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO learner_review_queue (id, learner_id, resource_type, resource_id, title, prompt, due_at, interval_days, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`).bind(id, auth.userId, resourceType, resourceId, title, prompt, dueAt, intervalDays, now.toISOString(), now.toISOString()).run();
}

export async function completeLearnerReview(auth: AuthContext, reviewIdValue: unknown) {
  await ensureEducationUser(auth); await ensurePlatformSchema();
  const reviewId = text(reviewIdValue, 120);
  const review = await env.DB.prepare(`SELECT interval_days FROM learner_review_queue WHERE id=? AND learner_id=? AND status='active'`).bind(reviewId, auth.userId).first<{ interval_days: number }>();
  if (!review) throw new PlatformGovernanceError("Review item not found.", 404);
  const nextInterval = Math.min(365, Math.max(1, review.interval_days * 2)); const now = new Date();
  await env.DB.prepare(`UPDATE learner_review_queue SET due_at=?, interval_days=?, status='active', updated_at=? WHERE id=? AND learner_id=?`).bind(new Date(now.getTime() + nextInterval * 86400000).toISOString(), nextInterval, now.toISOString(), reviewId, auth.userId).run();
}

export async function syncCourseCompletion(auth: AuthContext, courseSlugValue: unknown, percentValue: unknown) {
  await ensureEducationUser(auth); await ensurePlatformSchema();
  const courseSlug = slug(courseSlugValue); const percent = Number(percentValue);
  if (percent !== 100) return null;
  const release = await env.DB.prepare(`SELECT title FROM course_releases WHERE slug=? AND status='published'`).bind(courseSlug).first<{ title: string }>();
  const course = release ? { title: release.title } : findCourse(courseSlug);
  if (!course) throw new PlatformGovernanceError("Course not found.", 404);
  const now = new Date().toISOString();
  const completionId = crypto.randomUUID();
  const evidenceHash = await sha256(`${auth.userId}|${courseSlug}|100|${now}|education-only`);
  await env.DB.prepare(`INSERT INTO course_completions (id, learner_id, course_slug, course_title, percent_complete, evidence_hash, status, completed_at) VALUES (?, ?, ?, ?, 100, ?, 'completed', ?) ON CONFLICT(learner_id, course_slug) DO NOTHING`).bind(completionId, auth.userId, courseSlug, course.title, evidenceHash, now).run();
  const completion = await env.DB.prepare(`SELECT id FROM course_completions WHERE learner_id=? AND course_slug=?`).bind(auth.userId, courseSlug).first<{ id: string }>();
  if (!completion) return null;
  const certificateCode = `ELV-EDU-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  await env.DB.prepare(`INSERT OR IGNORE INTO education_certificates (id, completion_id, public_code, title, issued_at, revoked_at) VALUES (?, ?, ?, ?, ?, NULL)`).bind(crypto.randomUUID(), completion.id, certificateCode, `${course.title} — record of completion`, now).run();
  await appendAudit(auth.userId, "course.completion-recorded", "course", courseSlug, "success", `evidence=${evidenceHash};certificate=issued;qualification=false`);
  return completion.id;
}

export async function verifyCertificate(codeValue: unknown) {
  await ensurePlatformSchema();
  const code = text(codeValue, 40).toUpperCase();
  if (!/^ELV-EDU-[A-F0-9]{12}$/.test(code)) return null;
  const row = await env.DB.prepare(`SELECT e.public_code, e.title, e.issued_at, e.revoked_at, c.course_title, c.completed_at, c.status, u.display_name FROM education_certificates e JOIN course_completions c ON c.id=e.completion_id JOIN users u ON u.id=c.learner_id WHERE e.public_code=?`).bind(code).first<Row>();
  if (!row) return null;
  return { code: String(row.public_code), title: String(row.title), courseTitle: String(row.course_title), learnerName: String(row.display_name), completedAt: String(row.completed_at), issuedAt: String(row.issued_at), valid: !row.revoked_at && row.status === "completed", revokedAt: row.revoked_at ? String(row.revoked_at) : null, statement: "This is an education-only record of platform completion. It is not a clinical qualification, licence, credential or statement of diagnostic competence." };
}
