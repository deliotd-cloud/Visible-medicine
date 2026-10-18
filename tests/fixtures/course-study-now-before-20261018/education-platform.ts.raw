import { env } from "cloudflare:workers";
import { INVITATION_SELF_ENROLMENT_ENABLED, INVITATION_SELF_ENROLMENT_HOLD_MESSAGE } from "@/lib/course-enrolment-policy";
import { appendAudit, ensureDatabase, ensureEducationUser } from "@/db/bootstrap";
import { ensurePlatformSchema, getPlatformSnapshot } from "@/db/platform";
import type { AuthContext } from "@/lib/auth";
import { sha256 } from "@/lib/domain";
import { studioTemplate } from "@/lib/studio-templates";
import {
  accountMayWrite,
  accountWriteBlockReason,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  learnerOnboardingStatus,
} from "@/lib/account-policy";
import { courseEnrolmentEmail, getEmailProviderConfig, sendTransactionalEmail } from "@/lib/transactional-email";
import { publishedWorkbookEligibilityForRoles } from "@/lib/workbook-eligibility";

type Row = Record<string, unknown>;

export class EducationPlatformError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type CatalogueCourse = {
  id: string;
  courseId: string;
  code: string;
  slug: string;
  title: string;
  summary: string;
  level: string;
  duration: string;
  outcomes: string[];
  publisher: string;
  publisherKind: string;
  visibility: string;
  accessModel: string;
  priceMinor: number;
  currency: string;
  enrolmentOpen: boolean;
  status: string;
  version: number;
  publishedAt: string | null;
  workbookCount: number;
  firstWorkbookId: string | null;
  resumeWorkbookId: string | null;
  liveWorkbookId: string | null;
  liveStartedAt: string | null;
  enrolled: boolean;
};

export type LearnerProfile = {
  trainingStage: string;
  discipline: string;
  interests: string[];
  institutionName: string;
  countryCode: string;
  timezone: string;
  onboardingStatus: string;
  marketingOptIn: boolean;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  termsVersion: string;
  privacyVersion: string;
  accountStatus: string;
  identityProvider: string;
  updatedAt: string | null;
};

export type StudioCourse = {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  moduleId: string;
  workbookCount: number;
  releaseCount: number;
  enrolledLearners: number;
};

export type StudioWorkbook = {
  id: string;
  courseId: string;
  moduleId: string;
  courseTitle: string;
  moduleTitle: string;
  title: string;
  mode: string;
  status: string;
  version: number;
  durationMinutes: number;
  caseCount: number;
};

export type StudioRelease = CatalogueCourse & {
  organizationId: string;
  createdBy: string;
  reviewedBy: string | null;
  reviewNotes: string;
  updatedAt: string;
  workbookIds: string[];
  // Private Studio bindings only; public catalogue mapping never adds these.
  materialRevision?: string | null;
  approvalCurrent?: boolean;
};

export type StudioSnapshot = {
  organization: { id: string; name: string; role: string };
  educationRoles: string[];
  courses: StudioCourse[];
  workbooks: StudioWorkbook[];
  releases: StudioRelease[];
  releaseHistory: Array<{ id: string; releaseId: string; version: number; status: string; reason: string; capturedBy: string; capturedAt: string }>;
  cohorts: Array<{ id: string; courseId: string; courseTitle: string; title: string; code: string; status: string; memberCount: number; workbookCount: number }>;
  metrics: { learners: number; activeCourses: number; publishedReleases: number; completionPercent: number };
};

function boundedText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: unknown) {
  return boundedText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function stringList(value: unknown, maxItems = 12, maxLength = 180) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => boundedText(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

function parseList(value: unknown) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mapCatalogueRow(row: Row, workbookIds: string[] = []): StudioRelease {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    organizationId: String(row.organization_id),
    code: String(row.code),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    level: String(row.level),
    duration: String(row.duration_label),
    outcomes: parseList(row.outcomes_json),
    publisher: String(row.publisher_name),
    publisherKind: String(row.publisher_kind),
    visibility: String(row.visibility),
    accessModel: String(row.access_model),
    priceMinor: Number(row.price_minor),
    currency: String(row.currency),
    enrolmentOpen: Boolean(row.enrolment_open),
    status: String(row.status),
    version: Number(row.version),
    publishedAt: row.published_at ? String(row.published_at) : null,
    workbookCount: Number(row.workbook_count ?? workbookIds.length),
    firstWorkbookId: row.first_workbook_id ? String(row.first_workbook_id) : workbookIds[0] ?? null,
    resumeWorkbookId: row.resume_workbook_id ? String(row.resume_workbook_id) : null,
    liveWorkbookId: Boolean(row.enrolled) && row.live_workbook_id ? String(row.live_workbook_id) : null,
    liveStartedAt: Boolean(row.enrolled) && row.live_started_at ? String(row.live_started_at) : null,
    enrolled: Boolean(row.enrolled),
    createdBy: String(row.created_by),
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewNotes: String(row.review_notes ?? ""),
    updatedAt: String(row.updated_at),
    workbookIds,
  };
}

async function ready() {
  await ensureDatabase();
  await ensurePlatformSchema();
}

async function requireStaff(auth: AuthContext) {
  const { roles, status } = await ensureEducationUser(auth);
  if (!roles.some((role) => ["instructor", "examiner", "administrator"].includes(role)))
    throw new EducationPlatformError("An educator or administrator role is required.", 403);
  const platform = await getPlatformSnapshot(auth);
  if (!platform.entitlement.studioAccess)
    throw new EducationPlatformError("Studio is not enabled for this organization.", 403);
  return { roles, platform, accountStatus: status };
}

async function ownedCourse(courseId: string, organizationId: string) {
  const row = await env.DB.prepare(
    `SELECT c.id, c.code, c.title, c.description, c.status
       FROM courses c JOIN course_ownership o ON o.course_id=c.id
      WHERE c.id=? AND o.organization_id=?`,
  ).bind(courseId, organizationId).first<Row>();
  if (!row) throw new EducationPlatformError("This course is not available in your Studio workspace.", 404);
  return row;
}

async function captureCourseRelease(releaseId: string, actorId: string, reason: string) {
  const release = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=?`).bind(releaseId).first<Row>();
  if (!release) return;
  await env.DB.prepare(`INSERT OR IGNORE INTO course_release_snapshots (id, release_id, version, status, snapshot_json, reason, captured_by, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), releaseId, Number(release.version), String(release.status), JSON.stringify(release), reason, actorId, new Date().toISOString()).run();
}

const RELEASE_MATERIAL_COLUMNS = ["id", "course_id", "organization_id", "version", "slug", "title", "summary", "level", "duration_label", "outcomes_json", "publisher_name", "publisher_kind", "visibility", "access_model", "price_minor", "currency", "enrolment_open", "created_by"] as const;
const RELEASE_STATE_COLUMNS = [...RELEASE_MATERIAL_COLUMNS, "status", "reviewed_by", "review_notes", "created_at", "updated_at", "published_at"] as const;
type ReleaseWorkbookBinding = { id: string; version: number; status: string; position: number; required: number; courseId: string };
const releaseWorkbookSelect = `SELECT crw.release_id, crw.workbook_id AS id, w.version, w.status, crw.position, crw.required, m.course_id AS courseId
  FROM course_release_workbooks crw LEFT JOIN workbooks w ON w.id=crw.workbook_id LEFT JOIN modules m ON m.id=w.module_id`;

async function releaseMaterial(release: Row, rows: Row[]) {
  const workbooks: ReleaseWorkbookBinding[] = rows.map(row => ({ id: String(row.id ?? ""), version: Number(row.version), status: String(row.status ?? ""), position: Number(row.position), required: Number(row.required), courseId: String(row.courseId ?? "") }));
  if (RELEASE_MATERIAL_COLUMNS.some(column => release[column] === undefined) || !Number.isSafeInteger(Number(release.version)) || Number(release.version) < 1 ||
      new Set(workbooks.map(row => row.id)).size !== workbooks.length || workbooks.some((row, index) => !row.id || !row.status || !Number.isSafeInteger(row.version) || row.version < 1 || row.position !== index + 1 || ![0, 1].includes(row.required) || row.courseId !== release.course_id)) return null;
  const material = { schemaVersion: 1, release: Object.fromEntries(RELEASE_MATERIAL_COLUMNS.map(column => [column, release[column]])), workbooks };
  return { revision: await sha256(JSON.stringify(material)), workbooks };
}

const releaseApprovalSelect = `SELECT s.*, r.id AS review_id, r.reviewer_id AS review_reviewer, r.decision AS review_decision, r.notes AS decision_notes
  FROM course_release_snapshots s LEFT JOIN course_release_reviews r ON r.id=CASE WHEN json_valid(s.snapshot_json) THEN json_extract(s.snapshot_json,'$.reviewId') ELSE NULL END`;
function currentReleaseApproval(release: Row, material: { revision: string; workbooks: ReleaseWorkbookBinding[] } | null, rows: Row[]) {
  if (!material || release.status !== "approved" || !release.reviewed_by || release.reviewed_by === release.created_by) return null;
  return rows.find(row => {
    if (row.release_id !== release.id || Number(row.version) !== Number(release.version) || row.captured_by !== release.reviewed_by || row.review_reviewer !== release.reviewed_by || row.review_decision !== "approved" || row.decision_notes !== release.review_notes) return false;
    try {
      const saved = JSON.parse(String(row.snapshot_json));
      return saved.schemaVersion === 1 && saved.materialRevision === material.revision && saved.reviewId === row.review_id &&
        row.reason === `approval:${material.revision}:${saved.reviewId}` && JSON.stringify(saved.workbooks) === JSON.stringify(material.workbooks) &&
        RELEASE_STATE_COLUMNS.every(column => saved.release?.[column] === release[column]);
    } catch { return false; }
  }) ?? null;
}

export async function listCatalogueCourses(auth?: AuthContext | null): Promise<CatalogueCourse[]> {
  await ready();
  const userId = auth?.userId ?? "";
  const rows = await env.DB.prepare(
    `SELECT cr.*, c.code,
            COUNT(CASE WHEN w.status='published' THEN crw.workbook_id END) AS workbook_count,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbooks w2 ON w2.id=crw2.workbook_id WHERE crw2.release_id=cr.id AND w2.status='published' ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN workbooks live_w ON live_w.id=live_crw.workbook_id AND live_w.status='published' JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN workbooks live_w ON live_w.id=live_crw.workbook_id AND live_w.status='published' JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
            MAX(CASE WHEN e.status='active' THEN 1 ELSE 0 END) AS enrolled
       FROM course_releases cr
       JOIN courses c ON c.id=cr.course_id
       LEFT JOIN course_release_workbooks crw ON crw.release_id=cr.id
       LEFT JOIN workbooks w ON w.id=crw.workbook_id
       LEFT JOIN enrolments e ON e.course_id=cr.course_id AND e.user_id=?
      WHERE cr.visibility='public' AND cr.status='published'
      GROUP BY cr.id
      ORDER BY cr.published_at DESC, cr.title`,
  ).bind(userId).all<Row>();
  return rows.results.map((row) => mapCatalogueRow(row));
}

export async function getCatalogueCourse(slugValue: unknown, auth?: AuthContext | null) {
  await ready();
  const slug = slugify(slugValue);
  const row = await env.DB.prepare(
    `SELECT cr.*, c.code,
            COUNT(CASE WHEN w.status='published' THEN crw.workbook_id END) AS workbook_count,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbooks w2 ON w2.id=crw2.workbook_id WHERE crw2.release_id=cr.id AND w2.status='published' ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN workbooks live_w ON live_w.id=live_crw.workbook_id AND live_w.status='published' JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN workbooks live_w ON live_w.id=live_crw.workbook_id AND live_w.status='published' JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
            MAX(CASE WHEN e.status='active' THEN 1 ELSE 0 END) AS enrolled
       FROM course_releases cr
       JOIN courses c ON c.id=cr.course_id
       LEFT JOIN course_release_workbooks crw ON crw.release_id=cr.id
       LEFT JOIN workbooks w ON w.id=crw.workbook_id
       LEFT JOIN enrolments e ON e.course_id=cr.course_id AND e.user_id=?
      WHERE cr.slug=? AND cr.status='published' AND cr.visibility IN ('public','unlisted')
      GROUP BY cr.id`,
  ).bind(auth?.userId ?? "", slug).first<Row>();
  return row ? mapCatalogueRow(row) : null;
}

export async function getCatalogueCourseWorkbooks(releaseIdValue: unknown) {
  await ready();
  const releaseId = boundedText(releaseIdValue, 120);
  const rows = await env.DB.prepare(`SELECT w.id, w.title, w.mode, w.duration_minutes, w.status, crw.position, crw.required FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id JOIN course_releases cr ON cr.id=crw.release_id WHERE crw.release_id=? AND cr.status='published' AND w.status='published' ORDER BY crw.position`).bind(releaseId).all<Row>();
  return rows.results.map((row) => ({ id: String(row.id), title: String(row.title), mode: String(row.mode), durationMinutes: Number(row.duration_minutes), required: Boolean(row.required), position: Number(row.position) }));
}

export async function getInvitationCourse(codeValue: unknown, auth?: AuthContext | null) {
  await ready();
  const code = boundedText(codeValue, 80).toUpperCase();
  if (!/^ELV-[A-F0-9]{12}$/.test(code)) return null;
  const row = await env.DB.prepare(
    `SELECT cr.*, c.code,
            COUNT(CASE WHEN w.status='published' THEN crw.workbook_id END) AS workbook_count,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbooks w2 ON w2.id=crw2.workbook_id WHERE crw2.release_id=cr.id AND w2.status='published' ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
            MAX(CASE WHEN e.status='active' THEN 1 ELSE 0 END) AS enrolled
       FROM course_invitations ci JOIN course_releases cr ON cr.id=ci.release_id JOIN courses c ON c.id=cr.course_id
       LEFT JOIN course_release_workbooks crw ON crw.release_id=cr.id
       LEFT JOIN workbooks w ON w.id=crw.workbook_id
       LEFT JOIN enrolments e ON e.course_id=cr.course_id AND e.user_id=?
      WHERE ci.code_hash=? AND ci.status='active' AND ci.uses < ci.max_uses AND ci.expires_at > ? AND cr.status='published'
      GROUP BY cr.id`,
  ).bind(auth?.userId ?? "", await sha256(code), new Date().toISOString()).first<Row>();
  return row ? mapCatalogueRow(row) : null;
}

export async function getLearnerProfile(auth: AuthContext): Promise<LearnerProfile> {
  const account = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  if (!account.bootstrapDefaultOrganization) {
    await env.DB.prepare(`DELETE FROM organization_memberships WHERE organization_id='org-elivion-pilot' AND user_id=? AND role='learner' AND NOT EXISTS (SELECT 1 FROM organization_invitations oi WHERE oi.organization_id=organization_memberships.organization_id AND oi.accepted_by=organization_memberships.user_id AND oi.status='accepted')`).bind(auth.userId).run();
  }
  const row = await env.DB.prepare(`SELECT lp.*, asp.status AS account_status, asp.identity_provider, asp.terms_version, asp.privacy_version, asp.terms_accepted_at AS current_terms_accepted_at, asp.privacy_accepted_at FROM account_security_profiles asp LEFT JOIN learner_profiles lp ON lp.user_id=asp.user_id WHERE asp.user_id=?`).bind(auth.userId).first<Row>();
  const profileStatus = row?.onboarding_status ? String(row.onboarding_status) : "not-started";
  const termsAcceptedAt = row?.current_terms_accepted_at ? String(row.current_terms_accepted_at) : row?.terms_accepted_at ? String(row.terms_accepted_at) : null;
  const privacyAcceptedAt = row?.privacy_accepted_at ? String(row.privacy_accepted_at) : null;
  const termsVersion = row?.terms_version ? String(row.terms_version) : "";
  const privacyVersion = row?.privacy_version ? String(row.privacy_version) : "";
  return {
    trainingStage: row ? String(row.training_stage) : "",
    discipline: row ? String(row.discipline) : "",
    interests: row ? parseList(row.interests_json) : [],
    institutionName: row ? String(row.institution_name) : "",
    countryCode: row ? String(row.country_code) : "GB",
    timezone: row ? String(row.timezone) : "Europe/London",
    onboardingStatus: learnerOnboardingStatus({ profileStatus, termsVersion, privacyVersion, termsAcceptedAt, privacyAcceptedAt }),
    marketingOptIn: Boolean(row?.marketing_opt_in),
    termsAcceptedAt,
    privacyAcceptedAt,
    termsVersion,
    privacyVersion,
    accountStatus: row?.account_status ? String(row.account_status) : "active",
    identityProvider: row?.identity_provider ? String(row.identity_provider) : "external-identity",
    updatedAt: row?.updated_at ? String(row.updated_at) : null,
  };
}

export async function saveLearnerProfile(auth: AuthContext, input: Record<string, unknown>) {
  const account = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  if (!accountMayWrite(account.status))
    throw new EducationPlatformError(accountWriteBlockReason(account.status) ?? "This account cannot be changed.", 403);
  const trainingStage = boundedText(input.trainingStage, 80);
  const discipline = boundedText(input.discipline, 80);
  const interests = stringList(input.interests, 12, 80);
  const institutionName = boundedText(input.institutionName, 140);
  const countryCode = boundedText(input.countryCode, 2).toUpperCase() || "GB";
  const timezone = boundedText(input.timezone, 80) || "Europe/London";
  const acceptedTerms = input.acceptTerms === true;
  const acceptedPrivacy = input.acceptPrivacy === true;
  if (!trainingStage || !discipline || interests.length === 0)
    throw new EducationPlatformError("Choose your learning stage, discipline and at least one learning interest.", 422);
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new EducationPlatformError("Choose a valid country code.", 422);
  const current = await env.DB.prepare(`SELECT terms_version, privacy_version, terms_accepted_at, privacy_accepted_at FROM account_security_profiles WHERE user_id=?`).bind(auth.userId).first<{ terms_version: string; privacy_version: string; terms_accepted_at: string | null; privacy_accepted_at: string | null }>();
  const termsCurrent = current?.terms_version === CURRENT_TERMS_VERSION && Boolean(current.terms_accepted_at);
  const privacyCurrent = current?.privacy_version === CURRENT_PRIVACY_VERSION && Boolean(current.privacy_accepted_at);
  if (!termsCurrent && !acceptedTerms)
    throw new EducationPlatformError("Accept the current education-only terms to finish your learner profile.", 422);
  if (!privacyCurrent && !acceptedPrivacy)
    throw new EducationPlatformError("Acknowledge the current privacy notice to finish your learner profile.", 422);
  const now = new Date().toISOString();
  const termsAcceptedAt = termsCurrent ? current?.terms_accepted_at ?? now : now;
  const privacyAcceptedAt = privacyCurrent ? current?.privacy_accepted_at ?? now : now;
  await env.DB.prepare(
    `INSERT INTO learner_profiles (user_id, training_stage, discipline, interests_json, institution_name, country_code, timezone, onboarding_status, terms_accepted_at, marketing_opt_in, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'complete', ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET training_stage=excluded.training_stage, discipline=excluded.discipline, interests_json=excluded.interests_json, institution_name=excluded.institution_name, country_code=excluded.country_code, timezone=excluded.timezone, onboarding_status='complete', terms_accepted_at=excluded.terms_accepted_at, marketing_opt_in=excluded.marketing_opt_in, updated_at=excluded.updated_at`,
  ).bind(auth.userId, trainingStage, discipline, JSON.stringify(interests), institutionName, countryCode, timezone, termsAcceptedAt, input.marketingOptIn === true ? 1 : 0, now).run();
  await env.DB.batch([
    env.DB.prepare(`UPDATE account_security_profiles SET terms_version=?, privacy_version=?, terms_accepted_at=?, privacy_accepted_at=?, updated_at=? WHERE user_id=?`).bind(CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION, termsAcceptedAt, privacyAcceptedAt, now, auth.userId),
    env.DB.prepare(`INSERT OR IGNORE INTO account_consents (id, user_id, document_key, document_version, decision, source, recorded_at) VALUES (?, ?, 'education-terms', ?, 'accepted', 'learner-onboarding', ?)`).bind(crypto.randomUUID(), auth.userId, CURRENT_TERMS_VERSION, termsAcceptedAt),
    env.DB.prepare(`INSERT OR IGNORE INTO account_consents (id, user_id, document_key, document_version, decision, source, recorded_at) VALUES (?, ?, 'privacy-notice', ?, 'acknowledged', 'learner-onboarding', ?)`).bind(crypto.randomUUID(), auth.userId, CURRENT_PRIVACY_VERSION, privacyAcceptedAt),
  ]);
  await appendAudit(auth.userId, "learner.profile-completed", "learner-profile", auth.userId, "success", `education-only=true;terms=${CURRENT_TERMS_VERSION};privacy=${CURRENT_PRIVACY_VERSION}`);
  return getLearnerProfile(auth);
}

export async function enrolInCourse(auth: AuthContext, releaseIdValue: unknown, invitationCodeValue?: unknown) {
  // Refuse known-ineligible requests using reads only, before account/schema bootstrap.
  // This is not target-schema admission or a grant; all later checks still run.
  const releaseId = boundedText(releaseIdValue, 120);
  let preflightProfile: Row | null;
  let preflightRelease: Row | null;
  try {
    preflightProfile = await env.DB.prepare(`SELECT lp.*, asp.status AS account_status, asp.terms_version, asp.privacy_version, asp.terms_accepted_at AS current_terms_accepted_at, asp.privacy_accepted_at FROM (SELECT ? AS user_id) subject LEFT JOIN account_security_profiles asp ON asp.user_id=subject.user_id LEFT JOIN learner_profiles lp ON lp.user_id=subject.user_id`).bind(auth.userId).first<Row>();
  } catch {
    throw new EducationPlatformError("Course enrolment is unavailable while the platform is prepared for review. Please try again later.", 503);
  }
  const preflightAccountStatus = preflightProfile?.account_status == null ? "active" : String(preflightProfile.account_status);
  if (!accountMayWrite(preflightAccountStatus))
    throw new EducationPlatformError(accountWriteBlockReason(preflightAccountStatus) ?? "This account cannot enrol in courses.", 403);
  const preflightOnboarding = learnerOnboardingStatus({
    profileStatus: preflightProfile?.onboarding_status ? String(preflightProfile.onboarding_status) : "not-started",
    termsVersion: preflightProfile?.terms_version ? String(preflightProfile.terms_version) : "",
    privacyVersion: preflightProfile?.privacy_version ? String(preflightProfile.privacy_version) : "",
    termsAcceptedAt: preflightProfile?.current_terms_accepted_at ? String(preflightProfile.current_terms_accepted_at) : preflightProfile?.terms_accepted_at ? String(preflightProfile.terms_accepted_at) : null,
    privacyAcceptedAt: preflightProfile?.privacy_accepted_at ? String(preflightProfile.privacy_accepted_at) : null,
  });
  if (preflightOnboarding !== "complete")
    throw new EducationPlatformError(preflightOnboarding === "consent-required" ? "Review the current education terms and privacy notice before enrolling." : "Complete your learner profile before enrolling.", 409);
  try {
    preflightRelease = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=? AND status='published'`).bind(releaseId).first<Row>();
  } catch {
    throw new EducationPlatformError("Course enrolment is unavailable while the platform is prepared for review. Please try again later.", 503);
  }
  if (!preflightRelease) throw new EducationPlatformError("This course release is not available.", 404);
  if (!Boolean(preflightRelease.enrolment_open)) throw new EducationPlatformError("Enrolment is currently closed for this course.", 409);
  if (String(preflightRelease.access_model) === "invitation" && !INVITATION_SELF_ENROLMENT_ENABLED)
    throw new EducationPlatformError(INVITATION_SELF_ENROLMENT_HOLD_MESSAGE, 409);
  const account = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  if (!accountMayWrite(account.status))
    throw new EducationPlatformError(accountWriteBlockReason(account.status) ?? "This account cannot enrol in courses.", 403);
  const profile = await getLearnerProfile(auth);
  if (profile.onboardingStatus !== "complete")
    throw new EducationPlatformError(profile.onboardingStatus === "consent-required" ? "Review the current education terms and privacy notice before enrolling." : "Complete your learner profile before enrolling.", 409);
  const release = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=? AND status='published'`).bind(releaseId).first<Row>();
  if (!release) throw new EducationPlatformError("This course release is not available.", 404);
  if (!Boolean(release.enrolment_open)) throw new EducationPlatformError("Enrolment is currently closed for this course.", 409);
  const accessModel = String(release.access_model);
  if (accessModel === "invitation" && !INVITATION_SELF_ENROLMENT_ENABLED)
    throw new EducationPlatformError(INVITATION_SELF_ENROLMENT_HOLD_MESSAGE, 409);
  if (String(release.visibility) === "private" && !new Set(["invitation", "institution"]).has(accessModel))
    throw new EducationPlatformError("Private releases require an invitation or active institution membership.", 403);
  let invitationId: string | null = null;
  if (accessModel === "paid")
    throw new EducationPlatformError("Paid checkout is not active during the private platform evaluation.", 409);
  if (accessModel === "invitation") {
    const code = boundedText(invitationCodeValue, 80).toUpperCase();
    if (!code) throw new EducationPlatformError("Enter the course invitation code.", 422);
    const hash = await sha256(code);
    const invite = await env.DB.prepare(`SELECT * FROM course_invitations WHERE release_id=? AND code_hash=? AND status='active' AND uses < max_uses AND expires_at > ?`).bind(releaseId, hash, new Date().toISOString()).first<Row>();
    if (!invite) throw new EducationPlatformError("This invitation is invalid, expired or fully used.", 403);
    invitationId = String(invite.id);
  }
  if (accessModel === "institution") {
    const membership = await env.DB.prepare(`SELECT 1 AS allowed FROM organization_memberships WHERE organization_id=? AND user_id=? AND status='active'`).bind(String(release.organization_id), auth.userId).first();
    if (!membership) throw new EducationPlatformError("An active institution membership is required for this course.", 403);
  }
  if (!new Set(["free", "invitation", "institution"]).has(accessModel))
    throw new EducationPlatformError("This course does not support self-enrolment.", 409);
  const existing = await env.DB.prepare(`SELECT id, status FROM enrolments WHERE user_id=? AND course_id=? ORDER BY enrolled_at LIMIT 1`).bind(auth.userId, String(release.course_id)).first<{ id: string; status: string }>();
  if (existing && existing.status !== "active")
    throw new EducationPlatformError("Your existing course enrolment requires instructor review before re-enrolment.", 409);
  // Free/institution admission is one conditional batch. Invitations stay held.
  if (accessModel === 'invitation') throw new EducationPlatformError(INVITATION_SELF_ENROLMENT_HOLD_MESSAGE, 409);
  if (account.localDemo) throw new EducationPlatformError('A trusted account is required for enrolment.', 403);
  const workbookRows = await env.DB.prepare(`SELECT crw.workbook_id FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id WHERE crw.release_id=? AND w.status='published' ORDER BY crw.position`).bind(releaseId).all<{workbook_id:string}>();
  const now = new Date().toISOString();
  const courseId = String(release.course_id);
  const organizationId = String(release.organization_id);
  const workbookIds = workbookRows.results.map((row) => row.workbook_id);
  const workbookIdsJson = JSON.stringify(workbookIds);
  const outboxId = `course-enrolment:${await sha256(JSON.stringify([releaseId,auth.userId,auth.email,String(release.slug)]))}`;
  const outboxPayload = JSON.stringify({releaseId,courseSlug:String(release.slug)});
  const auditReason = `access=${accessModel};workbooks=${workbookIds.length}`;
  const triggerGate = `NOT EXISTS (SELECT 1 FROM sqlite_schema WHERE type='trigger' AND tbl_name IN
    ('enrolments','workbook_assignments','workbook_assignment_rules','audit_events','notification_outbox'))`;
  const admissionGate = `EXISTS (SELECT 1 FROM course_releases cr WHERE cr.id=? AND cr.course_id=? AND cr.organization_id=?
      AND cr.status='published' AND cr.enrolment_open=1 AND cr.access_model=?
      AND ((cr.access_model='free' AND cr.visibility='public') OR
        (cr.access_model='institution' AND EXISTS (SELECT 1 FROM organization_memberships om
          WHERE om.organization_id=cr.organization_id AND om.user_id=? AND om.status='active'))))
    AND EXISTS (SELECT 1 FROM account_security_profiles asp JOIN learner_profiles lp ON lp.user_id=asp.user_id
      WHERE asp.user_id=? AND asp.status='active' AND asp.identity_provider=?
        AND asp.identity_provider NOT IN ('local-evaluation','seed-fixture')
        AND lp.onboarding_status IS NOT NULL AND lp.onboarding_status<>'' AND lp.onboarding_status<>'not-started'
        AND asp.terms_version=? AND asp.privacy_version=?
        AND asp.terms_accepted_at IS NOT NULL AND asp.terms_accepted_at<>''
        AND asp.privacy_accepted_at IS NOT NULL AND asp.privacy_accepted_at<>'')
    AND EXISTS (SELECT 1 FROM enrolments e WHERE e.user_id=? AND e.course_id=? AND e.status='active')
    AND NOT EXISTS (SELECT 1 FROM enrolments e WHERE e.user_id=? AND e.course_id=? AND e.status<>'active')
    AND (SELECT COUNT(*) FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id
      WHERE crw.release_id=? AND w.status='published')=?
    AND NOT EXISTS (SELECT 1 FROM json_each(?) expected WHERE NOT EXISTS
      (SELECT 1 FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id
        WHERE crw.release_id=? AND crw.workbook_id=expected.value AND w.status='published'))
    AND (SELECT COUNT(*) FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id
      JOIN workbook_assignments wa ON wa.workbook_id=crw.workbook_id AND wa.learner_id=?
      WHERE crw.release_id=? AND w.status='published')=?`;
  const admissionValues=[releaseId,courseId,organizationId,accessModel,auth.userId,
    auth.userId,account.identityProvider,CURRENT_TERMS_VERSION,CURRENT_PRIVACY_VERSION,
    auth.userId,courseId,auth.userId,courseId,releaseId,workbookIds.length,
    workbookIdsJson,releaseId,auth.userId,releaseId,workbookIds.length];
  let committedAuditId:string|null=null;
  for (let collision=0;collision<5 && !committedAuditId;collision+=1) {
    const previous=await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{sequence:number;integrity_hash:string}>();
    const sequence=(previous?.sequence??0)+1;
    const occurredAt=new Date().toISOString();
    const auditId=crypto.randomUUID();
    const assignmentRowsJson=JSON.stringify(workbookIds.map((workbookId)=>({id:crypto.randomUUID(),workbookId})));
    const integrityHash=await sha256(`${previous?.integrity_hash??'GENESIS'}|${sequence}|${auth.userId}|course.self-enrolled|course-release|${releaseId}|success|${auditReason}|${occurredAt}`);
    // Five statements regardless of workbook count: enrolment, assignments,
    // own-ID rules, chain audit and held outbox. JSON is server-generated.
    const statements=[
      env.DB.prepare(`INSERT INTO enrolments (id,user_id,course_id,status,enrolled_at)
        SELECT ?,?,?,'active',? WHERE ${triggerGate} AND NOT EXISTS
          (SELECT 1 FROM enrolments WHERE user_id=? AND course_id=? AND status<>'active')
        ON CONFLICT(user_id,course_id) DO NOTHING`).bind(crypto.randomUUID(),auth.userId,courseId,now,auth.userId,courseId),
      env.DB.prepare(`INSERT INTO workbook_assignments
        (id,workbook_id,learner_id,status,assigned_by,assigned_at,due_at,revoked_at,version)
        SELECT json_extract(j.value,'$.id'),json_extract(j.value,'$.workbookId'),?,'active',?,?,NULL,NULL,1
          FROM json_each(?) j JOIN course_release_workbooks crw
            ON crw.release_id=? AND crw.workbook_id=json_extract(j.value,'$.workbookId')
          JOIN workbooks w ON w.id=crw.workbook_id AND w.status='published'
          WHERE ${triggerGate}
        ON CONFLICT(workbook_id,learner_id) DO NOTHING`).bind(auth.userId,auth.userId,now,assignmentRowsJson,releaseId),
      env.DB.prepare(`INSERT INTO workbook_assignment_rules
        (assignment_id,available_from,expires_at,prerequisite_workbook_id,prerequisite_min_percent,updated_at)
        SELECT wa.id,?,NULL,NULL,100,? FROM json_each(?) j
          JOIN workbook_assignments wa ON wa.id=json_extract(j.value,'$.id')
            AND wa.workbook_id=json_extract(j.value,'$.workbookId') AND wa.learner_id=?
          WHERE ${triggerGate}
        ON CONFLICT(assignment_id) DO NOTHING`).bind(now,now,assignmentRowsJson,auth.userId),
    ];
    const outboxGuard=`NOT EXISTS (SELECT 1 FROM notification_outbox no WHERE no.id=? AND NOT
      (no.organization_id IS ? AND no.recipient IS ? AND no.template IS 'course-enrolment'
        AND no.payload_json IS ? AND no.status IN ('held','sent')))`;
    const headGuard=`(SELECT COUNT(*) FROM audit_events WHERE sequence=? AND integrity_hash=?)=?`;
    statements.push(env.DB.prepare(`INSERT INTO audit_events
      (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
      VALUES (?, ?, ?, 'course.self-enrolled','course-release',?,'success',
        CASE WHEN ${triggerGate} AND ${admissionGate}
          AND NOT EXISTS (SELECT 1 FROM json_each(?) j
            JOIN workbook_assignments wa ON wa.id=json_extract(j.value,'$.id')
              AND wa.workbook_id=json_extract(j.value,'$.workbookId') AND wa.learner_id=?
            WHERE NOT EXISTS (SELECT 1 FROM workbook_assignment_rules war WHERE war.assignment_id=wa.id))
          AND ${outboxGuard} AND ${headGuard}
          THEN ? ELSE NULL END, ?, ?)`)
      .bind(auditId,sequence,auth.userId,releaseId,...admissionValues,assignmentRowsJson,auth.userId,
        outboxId,organizationId,auth.email,outboxPayload,
        previous?.sequence??0,previous?.integrity_hash??'GENESIS',previous?1:0,
        auditReason,occurredAt,integrityHash));
    statements.push(env.DB.prepare(`INSERT INTO notification_outbox
      (id,organization_id,recipient,template,payload_json,status,reason,created_at,sent_at)
      SELECT ?,?,?,'course-enrolment',?,'held','EMAIL_DELIVERY_PENDING',?,NULL
      WHERE ${triggerGate} AND NOT EXISTS (SELECT 1 FROM notification_outbox WHERE id=?)`)
      .bind(outboxId,organizationId,auth.email,outboxPayload,now,outboxId));
    try { await env.DB.batch(statements); }
    catch(error) {
      const ownAudit=await env.DB.prepare(`SELECT id,sequence,integrity_hash,reason FROM audit_events WHERE id=?`).bind(auditId).first<{id:string;sequence:number;integrity_hash:string;reason:string}>();
      if(ownAudit){
        if(ownAudit.sequence!==sequence||ownAudit.integrity_hash!==integrityHash||ownAudit.reason!==auditReason)
          throw new EducationPlatformError('Enrolment audit could not be verified.',409);
        committedAuditId=auditId;break;
      }
      const current=await env.DB.prepare(`SELECT sequence,integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{sequence:number;integrity_hash:string}>();
      if(collision===4||((current?.sequence??0)===(previous?.sequence??0)&&
          (current?.integrity_hash??'GENESIS')===(previous?.integrity_hash??'GENESIS')))throw error;
      continue;
    }
    const ownAudit=await env.DB.prepare(`SELECT id,sequence,integrity_hash,reason FROM audit_events WHERE id=?`).bind(auditId).first<{id:string;sequence:number;integrity_hash:string;reason:string}>();
    if(!ownAudit||ownAudit.sequence!==sequence||ownAudit.integrity_hash!==integrityHash||ownAudit.reason!==auditReason)
      throw new EducationPlatformError('Enrolment audit could not be verified.',409);
    committedAuditId=auditId;
  }
  if(!committedAuditId)throw new EducationPlatformError('Enrolment could not be completed.',409);
  const outbox=await env.DB.prepare(`SELECT organization_id,recipient,template,payload_json,status FROM notification_outbox WHERE id=?`).bind(outboxId).first<{organization_id:string;recipient:string;template:string;payload_json:string;status:string}>();
  if(!outbox||outbox.organization_id!==organizationId||outbox.recipient!==auth.email||outbox.template!=='course-enrolment'||
      outbox.payload_json!==outboxPayload||!['held','sent'].includes(outbox.status))
    throw new EducationPlatformError('Enrolment notification could not be verified.',409);
  if(outbox.status==='held'){
    const emailConfig=getEmailProviderConfig();
    const coursePath=`/courses/${String(release.slug)}`;
    const courseUrl=emailConfig.publicSiteUrl?`${emailConfig.publicSiteUrl}${coursePath}`:coursePath;
    const message=courseEnrolmentEmail({courseTitle:String(release.title),courseUrl});
    const delivery=await sendTransactionalEmail({to:auth.email,...message});
    await env.DB.prepare(`UPDATE notification_outbox SET status=?,reason=?,sent_at=? WHERE id=? AND status='held' AND ${triggerGate}`)
      .bind(delivery.status==='sent'?'sent':'held',delivery.reason,delivery.sentAt,outboxId).run();
  }
  return {slug:String(release.slug),workbookId:workbookIds[0]??null};
}

export async function getLearnerEnrolments(auth: AuthContext) {
  const account = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  const now = new Date().toISOString();
  const eligibility = publishedWorkbookEligibilityForRoles(auth.userId, account.roles, now);
  const rows = await env.DB.prepare(
    `WITH eligible_workbooks AS (${eligibility.sql})
     SELECT cr.id, cr.slug, cr.title, cr.summary, cr.level, cr.duration_label, cr.publisher_name,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN eligible_workbooks ew2 ON ew2.workbook_id=crw2.workbook_id WHERE crw2.release_id=cr.id ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT wp2.workbook_id FROM course_release_workbooks crw3 JOIN eligible_workbooks ew3 ON ew3.workbook_id=crw3.workbook_id JOIN workbook_progress wp2 ON wp2.workbook_id=crw3.workbook_id AND wp2.learner_id=e.user_id WHERE crw3.release_id=cr.id ORDER BY wp2.last_activity_at DESC LIMIT 1) AS resume_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN eligible_workbooks live_ew ON live_ew.workbook_id=live_crw.workbook_id JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN eligible_workbooks live_ew ON live_ew.workbook_id=live_crw.workbook_id JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
            COUNT(DISTINCT CASE WHEN wa.status='active' THEN crw.workbook_id END) AS workbook_count,
            COALESCE(ROUND(AVG(CASE WHEN wa.status='active' THEN COALESCE(wp.percent_complete,0) END)),0) AS progress
       FROM enrolments e
       JOIN course_releases cr ON cr.course_id=e.course_id AND cr.status='published'
       LEFT JOIN course_release_workbooks crw ON crw.release_id=cr.id
       LEFT JOIN workbook_assignments wa ON wa.workbook_id=crw.workbook_id AND wa.learner_id=e.user_id
       LEFT JOIN workbook_progress wp ON wp.workbook_id=crw.workbook_id AND wp.learner_id=e.user_id
      WHERE e.user_id=? AND e.status='active'
      GROUP BY cr.id ORDER BY cr.title`,
  ).bind(...eligibility.bindings, auth.userId).all<Row>();
  return rows.results.map((row) => ({
    id: String(row.id), slug: String(row.slug), title: String(row.title), summary: String(row.summary),
    level: String(row.level), duration: String(row.duration_label), publisher: String(row.publisher_name),
    firstWorkbookId: row.first_workbook_id ? String(row.first_workbook_id) : null,
    resumeWorkbookId: row.resume_workbook_id ? String(row.resume_workbook_id) : null,
    liveWorkbookId: row.live_workbook_id ? String(row.live_workbook_id) : null,
    liveStartedAt: row.live_started_at ? String(row.live_started_at) : null,
    workbookCount: Number(row.workbook_count), progress: Number(row.progress),
  }));
}

export async function getStudioSnapshot(auth: AuthContext): Promise<StudioSnapshot> {
  await ready();
  const { roles, platform } = await requireStaff(auth);
  const organizationId = platform.organization.id;
  const [courseRows, workbookRows, releaseRows, releaseWorkbookRows, releaseHistoryRows, cohortRows, analytics, approvalRows] = await Promise.all([
    env.DB.prepare(
      `SELECT c.*, MIN(m.id) AS module_id, COUNT(DISTINCT w.id) AS workbook_count,
              COUNT(DISTINCT cr.id) AS release_count, COUNT(DISTINCT CASE WHEN e.status='active' THEN e.user_id END) AS enrolled_learners
         FROM course_ownership o JOIN courses c ON c.id=o.course_id
         LEFT JOIN modules m ON m.course_id=c.id LEFT JOIN workbooks w ON w.module_id=m.id
         LEFT JOIN course_releases cr ON cr.course_id=c.id LEFT JOIN enrolments e ON e.course_id=c.id
        WHERE o.organization_id=? GROUP BY c.id ORDER BY c.title`,
    ).bind(organizationId).all<Row>(),
    env.DB.prepare(
      `SELECT w.*, m.course_id, m.title AS module_title, c.title AS course_title,
              COUNT(DISTINCT wc.case_id) AS case_count
         FROM course_ownership o JOIN courses c ON c.id=o.course_id JOIN modules m ON m.course_id=c.id
         JOIN workbooks w ON w.module_id=m.id LEFT JOIN workbook_cases wc ON wc.workbook_id=w.id
        WHERE o.organization_id=? GROUP BY w.id ORDER BY c.title, m.position, w.title`,
    ).bind(organizationId).all<Row>(),
    env.DB.prepare(
      `SELECT cr.*, c.code, COUNT(crw.workbook_id) AS workbook_count,
              (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbooks w2 ON w2.id=crw2.workbook_id WHERE crw2.release_id=cr.id AND w2.status='published' ORDER BY crw2.position LIMIT 1) AS first_workbook_id, 0 AS enrolled
         FROM course_releases cr JOIN courses c ON c.id=cr.course_id
         LEFT JOIN course_release_workbooks crw ON crw.release_id=cr.id LEFT JOIN workbooks w ON w.id=crw.workbook_id
        WHERE cr.organization_id=? GROUP BY cr.id ORDER BY cr.updated_at DESC`,
    ).bind(organizationId).all<Row>(),
    env.DB.prepare(`${releaseWorkbookSelect} WHERE crw.release_id IN (SELECT id FROM course_releases WHERE organization_id=?) ORDER BY crw.release_id, crw.position, crw.workbook_id`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT id, release_id, version, status, reason, captured_by, captured_at FROM course_release_snapshots WHERE release_id IN (SELECT id FROM course_releases WHERE organization_id=?) ORDER BY captured_at DESC LIMIT 250`).bind(organizationId).all<Row>(),
    env.DB.prepare(
      `SELECT ch.id, ch.course_id, ch.title, ch.code, ch.status, c.title AS course_title,
              COUNT(DISTINCT CASE WHEN cm.status='active' THEN cm.learner_id END) AS member_count,
              COUNT(DISTINCT CASE WHEN cwa.status='active' THEN cwa.workbook_id END) AS workbook_count
         FROM course_ownership o JOIN courses c ON c.id=o.course_id JOIN cohorts ch ON ch.course_id=c.id
         LEFT JOIN cohort_members cm ON cm.cohort_id=ch.id LEFT JOIN cohort_workbook_assignments cwa ON cwa.cohort_id=ch.id
        WHERE o.organization_id=? GROUP BY ch.id ORDER BY ch.created_at DESC`,
    ).bind(organizationId).all<Row>(),
    env.DB.prepare(
      `SELECT COUNT(DISTINCT e.user_id) AS learners,
              COUNT(DISTINCT CASE WHEN c.status='active' THEN c.id END) AS active_courses,
              COUNT(DISTINCT CASE WHEN cr.status='published' THEN cr.id END) AS published_releases,
              COALESCE(ROUND(AVG(wp.percent_complete)),0) AS completion_percent
         FROM course_ownership o JOIN courses c ON c.id=o.course_id
         LEFT JOIN enrolments e ON e.course_id=c.id AND e.status='active'
         LEFT JOIN course_releases cr ON cr.course_id=c.id
         LEFT JOIN workbook_progress wp ON wp.learner_id=e.user_id
        WHERE o.organization_id=?`,
    ).bind(organizationId).first<Row>(),
    env.DB.prepare(`${releaseApprovalSelect} WHERE s.release_id IN (SELECT id FROM course_releases WHERE organization_id=? AND status='approved') AND s.reason LIKE 'approval:%'`).bind(organizationId).all<Row>(),
  ]);
  const workbookIds = new Map<string, string[]>();
  for (const row of releaseWorkbookRows.results) workbookIds.set(String(row.release_id), [...(workbookIds.get(String(row.release_id)) ?? []), String(row.id)]);
  const releases = await Promise.all(releaseRows.results.map(async row => {
    const material = await releaseMaterial(row, releaseWorkbookRows.results.filter(item => item.release_id === row.id));
    return { ...mapCatalogueRow(row, workbookIds.get(String(row.id)) ?? []), materialRevision: material?.revision ?? null, approvalCurrent: Boolean(currentReleaseApproval(row, material, approvalRows.results)) };
  }));
  return {
    organization: { id: organizationId, name: platform.organization.name, role: platform.organization.role },
    educationRoles: roles,
    courses: courseRows.results.map((row) => ({ id: String(row.id), code: String(row.code), title: String(row.title), description: String(row.description), status: String(row.status), moduleId: String(row.module_id ?? ""), workbookCount: Number(row.workbook_count), releaseCount: Number(row.release_count), enrolledLearners: Number(row.enrolled_learners) })),
    workbooks: workbookRows.results.map((row) => ({ id: String(row.id), courseId: String(row.course_id), moduleId: String(row.module_id), courseTitle: String(row.course_title), moduleTitle: String(row.module_title), title: String(row.title), mode: String(row.mode), status: String(row.status), version: Number(row.version), durationMinutes: Number(row.duration_minutes), caseCount: Number(row.case_count) })),
    releases,
    releaseHistory: releaseHistoryRows.results.map((row) => ({ id: String(row.id), releaseId: String(row.release_id), version: Number(row.version), status: String(row.status), reason: String(row.reason), capturedBy: String(row.captured_by), capturedAt: String(row.captured_at) })),
    cohorts: cohortRows.results.map((row) => ({ id: String(row.id), courseId: String(row.course_id), courseTitle: String(row.course_title), title: String(row.title), code: String(row.code), status: String(row.status), memberCount: Number(row.member_count), workbookCount: Number(row.workbook_count) })),
    metrics: { learners: Number(analytics?.learners ?? 0), activeCourses: Number(analytics?.active_courses ?? 0), publishedReleases: Number(analytics?.published_releases ?? 0), completionPercent: Number(analytics?.completion_percent ?? 0) },
  };
}

export async function createStudioCourse(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const title = boundedText(input.title, 160);
  const description = boundedText(input.description, 1200);
  const requestedCode = boundedText(input.code, 30).toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (title.length < 4 || description.length < 20) throw new EducationPlatformError("Add a course title and a clear educational description.", 422);
  const code = requestedCode || `ELV-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const duplicate = await env.DB.prepare(`SELECT 1 AS found FROM courses WHERE code=?`).bind(code).first();
  if (duplicate) throw new EducationPlatformError("That course code is already in use.", 409);
  const id = `course:${crypto.randomUUID()}`;
  const moduleId = `module:${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO courses (id, code, title, description, status) VALUES (?, ?, ?, ?, 'active')`).bind(id, code, title, description),
    env.DB.prepare(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, 'Core module', 1)`).bind(moduleId, id),
    env.DB.prepare(`INSERT INTO course_ownership (course_id, organization_id, owner_id, created_at) VALUES (?, ?, ?, ?)`).bind(id, platform.organization.id, auth.userId, now),
  ]);
  await appendAudit(auth.userId, "studio.course-created", "course", id, "success", `organization=${platform.organization.id}`);
  return id;
}

export async function updateStudioCourse(auth: AuthContext, input: Record<string, unknown>) {
  const { platform, accountStatus } = await requireStaff(auth);
  if (!accountMayWrite(accountStatus))
    throw new EducationPlatformError(accountWriteBlockReason(accountStatus) ?? "This account cannot change courses.", 403);
  const courseId = input.courseId;
  const title = input.title;
  const description = input.description;
  const expectedTitle = input.expectedTitle;
  const expectedDescription = input.expectedDescription;
  if (typeof courseId !== "string" || !courseId || courseId.length > 120 ||
      typeof expectedTitle !== "string" || typeof expectedDescription !== "string" ||
      typeof title !== "string" || typeof description !== "string")
    throw new EducationPlatformError("Send the course and its original title and description as text.", 422);
  const nextTitle = title.trim();
  const nextDescription = description.trim();
  if (nextTitle.length < 4 || nextTitle.length > 160 || nextDescription.length < 20 || nextDescription.length > 1200)
    throw new EducationPlatformError("Use a title of 4–160 characters and a description of 20–1200 characters.", 422);
  const organizationId = platform.organization.id;
  const stale = () => new EducationPlatformError("This course changed since you opened it. Refresh before saving.", 409);
  const course = await ownedCourse(courseId, organizationId);
  if (course.title !== expectedTitle || course.description !== expectedDescription) throw stale();
  if (nextTitle === expectedTitle && nextDescription === expectedDescription) return courseId;

  const action = "studio.course-updated";
  const reason = `organization=${organizationId}`;
  for (let collision = 0; collision < 5; collision += 1) {
    const previous = await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
    const sequence = (previous?.sequence ?? 0) + 1;
    const occurredAt = new Date().toISOString();
    const auditId = crypto.randomUUID();
    const integrityHash = await sha256(`${previous?.integrity_hash ?? "GENESIS"}|${sequence}|${auth.userId}|${action}|course|${courseId}|success|${reason}|${occurredAt}`);
    try {
      // D1 batch is a transaction. The audit's NOT NULL reason deliberately fails
      // the batch if the compare-and-set or integrity-chain head loses a race.
      await env.DB.batch([
        env.DB.prepare(`UPDATE courses SET title=?, description=?
          WHERE id=? AND title=? AND description=? AND EXISTS
            (SELECT 1 FROM course_ownership WHERE course_id=? AND organization_id=?)
            AND EXISTS (SELECT 1 FROM account_security_profiles WHERE user_id=? AND status='active')`)
          .bind(nextTitle, nextDescription, courseId, expectedTitle, expectedDescription, courseId, organizationId, auth.userId),
        env.DB.prepare(`INSERT INTO audit_events
          (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
          VALUES (?, ?, ?, ?, 'course', ?, 'success',
            CASE WHEN changes()=1 AND
              (SELECT COUNT(*) FROM audit_events WHERE sequence=? AND integrity_hash=?)=?
              THEN ? ELSE NULL END, ?, ?)`)
          .bind(auditId, sequence, auth.userId, action, courseId,
            previous?.sequence ?? 0, previous?.integrity_hash ?? "GENESIS", previous ? 1 : 0,
            reason, occurredAt, integrityHash),
      ]);
      return courseId;
    } catch (error) {
      const current = await ownedCourse(courseId, organizationId);
      if (current.title !== expectedTitle || current.description !== expectedDescription) throw stale();
      const account = await env.DB.prepare(`SELECT status FROM account_security_profiles WHERE user_id=?`).bind(auth.userId).first<{ status: string }>();
      if (!account || !accountMayWrite(account.status))
        throw new EducationPlatformError(accountWriteBlockReason(account?.status ?? "") ?? "This account cannot change courses.", 403);
      const head = await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
      if (collision === 4 || (head?.sequence ?? 0) === (previous?.sequence ?? 0) &&
          (head?.integrity_hash ?? "GENESIS") === (previous?.integrity_hash ?? "GENESIS")) throw error;
    }
  }
  throw new EducationPlatformError("Course changes could not be saved. Please try again.", 503);
}

export async function createStudioCourseFromTemplate(auth: AuthContext, input: Record<string, unknown>) {
  const template = studioTemplate(input.templateId);
  if (!template) throw new EducationPlatformError("Choose an approved Studio template.", 422);
  const courseId = await createStudioCourse(auth, input);
  for (const workbook of template.workbooks) await createStudioWorkbook(auth, { courseId, ...workbook });
  await appendAudit(auth.userId, "studio.course-template-applied", "course", courseId, "success", `template=${template.id}`);
  return courseId;
}

export async function duplicateStudioCourse(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const sourceCourseId = boundedText(input.courseId, 120);
  const source = await ownedCourse(sourceCourseId, platform.organization.id);
  const sourceWorkbooks = await env.DB.prepare(`SELECT w.title, w.mode, w.duration_minutes FROM workbooks w JOIN modules m ON m.id=w.module_id WHERE m.course_id=? ORDER BY w.title`).bind(sourceCourseId).all<Row>();
  const courseId = await createStudioCourse(auth, { title: `${String(source.title)} copy`, description: String(source.description), code: boundedText(input.code, 30) });
  for (const workbook of sourceWorkbooks.results) await createStudioWorkbook(auth, { courseId, title: `${String(workbook.title)} copy`, mode: String(workbook.mode), durationMinutes: Number(workbook.duration_minutes) });
  await appendAudit(auth.userId, "studio.course-duplicated", "course", courseId, "success", `source=${sourceCourseId};medical-content-copied=false`);
  return courseId;
}

export async function duplicateStudioWorkbook(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const workbookId = boundedText(input.workbookId, 140);
  const source = await env.DB.prepare(`SELECT w.title, w.mode, w.duration_minutes, m.course_id FROM workbooks w JOIN modules m ON m.id=w.module_id JOIN course_ownership o ON o.course_id=m.course_id WHERE w.id=? AND o.organization_id=?`).bind(workbookId, platform.organization.id).first<Row>();
  if (!source) throw new EducationPlatformError("This workbook is not available in your Studio workspace.", 404);
  const id = await createStudioWorkbook(auth, { courseId: String(source.course_id), title: `${String(source.title)} copy`, mode: String(source.mode), durationMinutes: Number(source.duration_minutes) });
  await appendAudit(auth.userId, "studio.workbook-duplicated", "workbook", id, "success", `source=${workbookId};cases-and-media-copied=false`);
  return id;
}

export async function createStudioWorkbook(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const courseId = boundedText(input.courseId, 120);
  await ownedCourse(courseId, platform.organization.id);
  const title = boundedText(input.title, 160);
  const mode = boundedText(input.mode, 20);
  const duration = Math.max(0, Math.min(480, Number(input.durationMinutes ?? 0)));
  if (title.length < 4 || !new Set(["teaching", "assessment", "lecture"]).has(mode)) throw new EducationPlatformError("Add a content title and choose lecture, imaging teaching or assessment mode.", 422);
  const courseModule = await env.DB.prepare(`SELECT id FROM modules WHERE course_id=? ORDER BY position LIMIT 1`).bind(courseId).first<{ id: string }>();
  if (!courseModule) throw new EducationPlatformError("This course has no authoring module.", 409);
  const id = `workbook:${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO workbooks (id, module_id, title, mode, version, status, duration_minutes, dual_display_allowed) VALUES (?, ?, ?, ?, 1, 'draft', ?, 0)`).bind(id, courseModule.id, title, mode, mode === "assessment" ? Math.round(duration || 60) : 0),
    env.DB.prepare(`INSERT INTO workbook_authorship (workbook_id, author_id, created_at) VALUES (?, ?, ?)`).bind(id, auth.userId, now),
  ]);
  await appendAudit(auth.userId, "studio.workbook-created", "workbook", id, "success", `course=${courseId};mode=${mode}`);
  return id;
}

export async function createStudioCohort(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const courseId = boundedText(input.courseId, 120);
  await ownedCourse(courseId, platform.organization.id);
  const title = boundedText(input.title, 140);
  const code = boundedText(input.code, 30).toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (title.length < 3 || code.length < 3) throw new EducationPlatformError("Add a cohort title and a short unique code.", 422);
  const duplicate = await env.DB.prepare(`SELECT 1 AS found FROM cohorts WHERE course_id=? AND code=?`).bind(courseId, code).first();
  if (duplicate) throw new EducationPlatformError("That cohort code is already used on this course.", 409);
  const id = `cohort:${crypto.randomUUID()}`; const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO cohorts (id, course_id, title, code, status, created_by, created_at, version) VALUES (?, ?, ?, ?, 'active', ?, ?, 1)`).bind(id, courseId, title, code, auth.userId, now).run();
  await appendAudit(auth.userId, "studio.cohort-created", "cohort", id, "success", `course=${courseId}`);
  return id;
}

export async function assignStudioCohortWorkbook(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const cohortId = boundedText(input.cohortId, 120); const workbookId = boundedText(input.workbookId, 140);
  const target = await env.DB.prepare(
    `SELECT ch.course_id FROM cohorts ch JOIN course_ownership o ON o.course_id=ch.course_id
      JOIN workbooks w JOIN modules m ON m.id=w.module_id AND m.course_id=ch.course_id
     WHERE ch.id=? AND w.id=? AND w.status='published' AND o.organization_id=?`,
  ).bind(cohortId, workbookId, platform.organization.id).first<Row>();
  if (!target) throw new EducationPlatformError("Choose a published workbook from the cohort course.", 422);
  const current = await env.DB.prepare(`SELECT id, version FROM cohort_workbook_assignments WHERE cohort_id=? AND workbook_id=?`).bind(cohortId, workbookId).first<{ id: string; version: number }>();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO cohort_workbook_assignments (id, cohort_id, workbook_id, status, assigned_by, assigned_at, available_from, due_at, expires_at, prerequisite_workbook_id, prerequisite_min_percent, revoked_at, version) VALUES (?, ?, ?, 'active', ?, ?, ?, NULL, NULL, NULL, 100, NULL, ?) ON CONFLICT(cohort_id, workbook_id) DO UPDATE SET status='active', assigned_by=excluded.assigned_by, assigned_at=excluded.assigned_at, available_from=excluded.available_from, revoked_at=NULL, version=excluded.version`).bind(current?.id ?? crypto.randomUUID(), cohortId, workbookId, auth.userId, now, now, (current?.version ?? 0) + 1).run();
  await appendAudit(auth.userId, "studio.cohort-workbook-assigned", "cohort", cohortId, "success", `workbook=${workbookId}`);
}

export async function saveCourseReleaseDraft(auth: AuthContext, input: Record<string, unknown>) {
  const { platform, accountStatus } = await requireStaff(auth);
  if (!accountMayWrite(accountStatus))
    throw new EducationPlatformError(accountWriteBlockReason(accountStatus) ?? "This account cannot save releases.", 403);
  const courseId = boundedText(input.courseId, 120);
  const course = await ownedCourse(courseId, platform.organization.id);
  const title = boundedText(input.title, 160) || String(course.title);
  const summary = boundedText(input.summary, 1200);
  const releaseSlug = slugify(input.slug || title);
  const level = boundedText(input.level, 60) || "All levels";
  const duration = boundedText(input.duration, 60) || "Self-paced";
  if (!Array.isArray(input.outcomes) || input.outcomes.some((item: unknown) => typeof item !== "string"))
    throw new EducationPlatformError("Send learning outcomes as text entries.", 422);
  const outcomeLines = (input.outcomes as string[]).map((item) => item.trim()).filter(Boolean);
  const outcomes = [...new Set(outcomeLines)];
  if (outcomeLines.some((item) => item.length > 180) || outcomes.length > 8)
    throw new EducationPlatformError("Use no more than eight distinct learning outcomes, up to 180 characters each.", 422);
  const visibility = boundedText(input.visibility, 20);
  const accessModel = boundedText(input.accessModel, 20);
  const publisherKind = boundedText(input.publisherKind, 20);
  const workbookIds = stringList(input.workbookIds, 40, 140);
  const priceMinor = Math.max(0, Math.min(10_000_000, Math.round(Number(input.priceMinor ?? 0))));
  const currency = boundedText(input.currency, 3).toUpperCase() || "GBP";
  if (!releaseSlug || summary.length < 30 || outcomes.length < 2) throw new EducationPlatformError("Add a unique slug, course summary and at least two learning outcomes.", 422);
  if (!new Set(["private", "unlisted", "public"]).has(visibility)) throw new EducationPlatformError("Choose a valid release visibility.", 422);
  if (!new Set(["free", "invitation", "institution", "paid"]).has(accessModel)) throw new EducationPlatformError("Choose a valid access model.", 422);
  if (visibility === "private" && !new Set(["invitation", "institution"]).has(accessModel)) throw new EducationPlatformError("Private releases must use invitation or institution access.", 422);
  if (!new Set(["official", "institution"]).has(publisherKind)) throw new EducationPlatformError("Choose an official or institution publisher label.", 422);
  if (publisherKind === "official" && platform.organization.kind !== "platform") throw new EducationPlatformError("Only the Visible Medicine platform organisation can create an official release.", 403);
  if (accessModel === "paid" && priceMinor < 100) throw new EducationPlatformError("Add a valid course price for paid access.", 422);
  if (!/^[A-Z]{3}$/.test(currency)) throw new EducationPlatformError("Use a three-letter currency code.", 422);
  const workbookQuery = workbookIds.length
    ? `SELECT COUNT(*) AS count FROM workbooks w JOIN modules m ON m.id=w.module_id WHERE m.course_id=? AND w.id IN (${workbookIds.map(() => "?").join(",")})`
    : null;
  async function verifyWorkbooks() {
    if (!workbookQuery) return;
    const valid = await env.DB.prepare(workbookQuery).bind(courseId, ...workbookIds).first<{ count: number }>();
    if (Number(valid?.count ?? 0) !== workbookIds.length)
      throw new EducationPlatformError("Every release workbook must belong to this course.", 422);
  }
  await verifyWorkbooks();
  const existingId = boundedText(input.releaseId, 120);
  const expectedVersion = Number(input.expectedVersion);
  const stale = () => new EducationPlatformError("This release draft changed or entered review. Refresh before saving.", 409);
  let existing: Row | null = null;
  if (existingId) {
    existing = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=?`).bind(existingId).first<Row>();
    if (!existing || existing.organization_id !== platform.organization.id) throw new EducationPlatformError("Course release draft not found.", 404);
    if (existing.course_id !== courseId) throw new EducationPlatformError("Choose a release draft from this course.", 409);
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1 || expectedVersion !== Number(existing.version) ||
        !new Set(["draft", "changes-requested"]).has(String(existing.status))) throw stale();
  }
  const releaseId = existingId || `release:${crypto.randomUUID()}`;
  const action = "course-release.draft-saved";
  const reason = `visibility=${visibility};access=${accessModel};workbooks=${workbookIds.length}`;
  const guard = `EXISTS (SELECT 1 FROM course_ownership WHERE course_id=? AND organization_id=?)
    AND EXISTS (SELECT 1 FROM account_security_profiles WHERE user_id=? AND status='active')
    ${workbookQuery ? `AND (${workbookQuery})=?` : ""}`;
  const guardValues = [courseId, platform.organization.id, auth.userId, ...(workbookQuery ? [courseId, ...workbookIds, workbookIds.length] : [])];
  for (let collision = 0; collision < 5; collision += 1) {
    const previous = await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
    const sequence = (previous?.sequence ?? 0) + 1;
    const now = new Date().toISOString();
    const integrityHash = await sha256(`${previous?.integrity_hash ?? "GENESIS"}|${sequence}|${auth.userId}|${action}|course-release|${releaseId}|success|${reason}|${now}`);
    const values = [releaseSlug, title, summary, level, duration, JSON.stringify(outcomes), boundedText(input.publisherName, 160) || platform.organization.name, publisherKind, visibility, accessModel, priceMinor, currency];
    const mutation = existing
      ? env.DB.prepare(`UPDATE course_releases SET slug=?, title=?, summary=?, level=?, duration_label=?, outcomes_json=?, publisher_name=?, publisher_kind=?, visibility=?, access_model=?, price_minor=?, currency=?, enrolment_open=?, version=version+1, updated_at=?
          WHERE id=? AND version=? AND organization_id=? AND course_id=? AND status=?
            AND status IN ('draft','changes-requested') AND ${guard}`)
        .bind(...values, input.enrolmentOpen === true ? 1 : 0, now, releaseId, expectedVersion, platform.organization.id, courseId, String(existing.status), ...guardValues)
      : env.DB.prepare(`INSERT INTO course_releases (id, course_id, organization_id, slug, title, summary, level, duration_label, outcomes_json, publisher_name, publisher_kind, visibility, access_model, price_minor, currency, status, enrolment_open, version, created_by, reviewed_by, review_notes, created_at, updated_at, published_at)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, 1, ?, NULL, '', ?, ?, NULL WHERE ${guard}`)
        .bind(releaseId, courseId, platform.organization.id, ...values, input.enrolmentOpen === true ? 1 : 0, auth.userId, now, now, ...guardValues);
    try {
      // D1 batch is transactional. This existing NOT NULL audit field deliberately
      // aborts on a lost CAS/chain-head race, before any item/history mutation.
      const statements = [mutation, env.DB.prepare(`INSERT INTO audit_events
        (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
        VALUES (?, ?, ?, ?, 'course-release', ?, 'success',
          CASE WHEN changes()=1 AND
            (SELECT COUNT(*) FROM audit_events WHERE sequence=? AND integrity_hash=?)=?
            THEN ? ELSE NULL END, ?, ?)`)
        .bind(crypto.randomUUID(), sequence, auth.userId, action, releaseId,
          previous?.sequence ?? 0, previous?.integrity_hash ?? "GENESIS", previous ? 1 : 0, reason, now, integrityHash)];
      if (existing) statements.push(env.DB.prepare(`INSERT OR IGNORE INTO course_release_snapshots (id, release_id, version, status, snapshot_json, reason, captured_by, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), releaseId, Number(existing.version), String(existing.status), JSON.stringify(existing), "before-draft-save", auth.userId, now));
      statements.push(env.DB.prepare(`DELETE FROM course_release_workbooks WHERE release_id=?`).bind(releaseId));
      statements.push(...workbookIds.map((workbookId, position) => env.DB.prepare(`INSERT INTO course_release_workbooks (release_id, workbook_id, position, required) VALUES (?, ?, ?, 1)`).bind(releaseId, workbookId, position + 1)));
      await env.DB.batch(statements);
      return releaseId;
    } catch (error) {
      await ownedCourse(courseId, platform.organization.id);
      const account = await env.DB.prepare(`SELECT status FROM account_security_profiles WHERE user_id=?`).bind(auth.userId).first<{ status: string }>();
      if (!account || !accountMayWrite(account.status))
        throw new EducationPlatformError(accountWriteBlockReason(account?.status ?? "") ?? "This account cannot save releases.", 403);
      if (existing) {
        const current = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=?`).bind(releaseId).first<Row>();
        if (!current || current.organization_id !== platform.organization.id || current.course_id !== courseId ||
            Number(current.version) !== expectedVersion || current.status !== existing.status) throw stale();
      }
      await verifyWorkbooks();
      const head = await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
      if (collision === 4 || (head?.sequence ?? 0) === (previous?.sequence ?? 0) &&
          (head?.integrity_hash ?? "GENESIS") === (previous?.integrity_hash ?? "GENESIS")) throw error;
    }
  }
  throw new EducationPlatformError("Release changes could not be saved. Please try again.", 503);
}

type ReleaseTransition = "submit" | "review" | "publish";

async function transitionCourseRelease(auth: AuthContext, input: Record<string, unknown>, transition: ReleaseTransition) {
  const { roles, platform, accountStatus } = await requireStaff(auth);
  if (!accountMayWrite(accountStatus)) throw new EducationPlatformError(accountWriteBlockReason(accountStatus) ?? "This account cannot change releases.", 403);
  if (transition === "publish" && !roles.includes("administrator")) throw new EducationPlatformError("An education administrator must publish the approved release.", 403);
  const stale = () => new EducationPlatformError("This release or its workbook revisions changed. Refresh and review the current content before continuing.", 409);
  if (!input || typeof input.releaseId !== "string" || !input.releaseId || input.releaseId.length > 120 ||
      typeof input.expectedVersion !== "number" || !Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1 ||
      typeof input.expectedStatus !== "string" || typeof input.expectedMaterialRevision !== "string" || !/^[a-f0-9]{64}$/.test(input.expectedMaterialRevision)) throw stale();
  const releaseId = input.releaseId;
  const decision = input.decision;
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (transition === "review" && (!new Set(["approved", "changes-requested"]).has(String(decision)) || typeof decision !== "string" || notes.length < 10 || notes.length > 2000))
    throw new EducationPlatformError("Choose a review decision and provide 10–2000 characters of review notes.", 422);

  async function loadCurrent() {
    const release = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=? AND organization_id=?`).bind(releaseId, platform.organization.id).first<Row>();
    if (!release || Number(release.version) !== input.expectedVersion || release.status !== input.expectedStatus) throw stale();
    await ownedCourse(String(release.course_id), platform.organization.id);
    const rows = await env.DB.prepare(`${releaseWorkbookSelect} WHERE crw.release_id=? ORDER BY crw.position, crw.workbook_id`).bind(releaseId).all<Row>();
    const material = await releaseMaterial(release, rows.results);
    if (!material || material.revision !== input.expectedMaterialRevision) throw stale();
    const approvalRows = transition === "submit" ? [] : (await env.DB.prepare(`${releaseApprovalSelect} WHERE s.release_id=? AND s.version=? AND s.reason LIKE 'approval:%'`).bind(releaseId, Number(release.version)).all<Row>()).results;
    const approval = currentReleaseApproval(release, material, approvalRows);
    if (transition === "submit" && !new Set(["draft", "changes-requested"]).has(String(release.status)) ||
        transition === "review" && release.status !== "in-review" && !(release.status === "approved" && !approval) ||
        transition === "publish" && !approval) throw stale();
    if (transition === "review" && release.created_by === auth.userId) throw new EducationPlatformError("Course release review must be completed by a different education user.", 403);
    if ((transition !== "review" || decision === "approved") && (!material.workbooks.length || material.workbooks.some(row => row.status !== "published")))
      throw new EducationPlatformError("Every release needs published workbooks from this course before submission, approval or publication.", 409);
    return { release, material };
  }

  // An approval is an explicit immutable snapshot plus the independent decision
  // that produced it. Legacy status='approved' is not silently upgraded.
  const approvalProof = `EXISTS (SELECT 1 FROM course_release_snapshots s JOIN course_release_reviews r
    ON r.id=CASE WHEN json_valid(s.snapshot_json) THEN json_extract(s.snapshot_json,'$.reviewId') ELSE NULL END
    WHERE s.release_id=course_releases.id AND s.version=course_releases.version
      AND s.reason=('approval:' || ? || ':' || r.id) AND s.captured_by=course_releases.reviewed_by
      AND s.captured_by<>course_releases.created_by AND r.reviewer_id=s.captured_by AND r.decision='approved' AND r.notes=course_releases.review_notes
      AND json_extract(s.snapshot_json,'$.schemaVersion')=1 AND json_extract(s.snapshot_json,'$.materialRevision')=?
      AND json_extract(s.snapshot_json,'$.workbooks')=json(?)
      AND ${RELEASE_STATE_COLUMNS.map(column => `json_extract(s.snapshot_json,'$.release.${column}') IS course_releases.${column}`).join(" AND ")})`;
  const operationId = crypto.randomUUID();
  for (let collision = 0; collision < 5; collision += 1) {
    const { release, material } = await loadCurrent();
    const previous = await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
    const sequence = (previous?.sequence ?? 0) + 1, now = new Date().toISOString();
    const nextStatus = transition === "submit" ? "in-review" : transition === "publish" ? "published" : String(decision);
    const action = transition === "submit" ? "course-release.review-requested" : transition === "publish" ? "course-release.published" : `course-release.review-${decision}`;
    const reason = `version=${release.version};material=${material.revision};workbooks=${material.workbooks.length}`;
    const integrityHash = await sha256(`${previous?.integrity_hash ?? "GENESIS"}|${sequence}|${auth.userId}|${action}|course-release|${releaseId}|success|${reason}|${now}`);
    const workbookJson = JSON.stringify(material.workbooks);
    const approvalGuard = transition === "publish" ? `AND ${approvalProof}` : transition === "review" && release.status === "approved" ? `AND NOT ${approvalProof}` : "";
    // ensureEducationUser persists roles as comma-separated tokens, not JSON.
    // Delimited, case-sensitive matches cannot grant a partial role name.
    const allowedRoles = transition === "publish" ? ["administrator"] : ["instructor", "examiner", "administrator"];
    const roleGuard = allowedRoles.map(() => "instr(',' || u.roles || ',', ?) > 0").join(" OR ");
    const mutation = env.DB.prepare(`UPDATE course_releases SET status=?, updated_at=?, reviewed_by=?, review_notes=?, published_at=?
      WHERE ${RELEASE_STATE_COLUMNS.map(column => `${column} IS ?`).join(" AND ")}
        AND EXISTS (SELECT 1 FROM course_ownership WHERE course_id=course_releases.course_id AND organization_id=?)
        AND EXISTS (SELECT 1 FROM account_security_profiles WHERE user_id=? AND status='active')
        AND EXISTS (SELECT 1 FROM users u WHERE u.id=? AND (${roleGuard}))
        ${transition === "review" ? "AND created_by<>?" : ""}
        AND (SELECT COUNT(*) FROM course_release_workbooks WHERE release_id=course_releases.id)=?
        AND NOT EXISTS (SELECT 1 FROM json_each(?) expected
          LEFT JOIN course_release_workbooks crw ON crw.release_id=course_releases.id AND crw.workbook_id=json_extract(expected.value,'$.id')
          LEFT JOIN workbooks w ON w.id=crw.workbook_id LEFT JOIN modules m ON m.id=w.module_id
          WHERE crw.workbook_id IS NULL OR w.version IS NOT json_extract(expected.value,'$.version') OR w.status IS NOT json_extract(expected.value,'$.status')
            OR crw.position IS NOT json_extract(expected.value,'$.position') OR crw.required IS NOT json_extract(expected.value,'$.required') OR m.course_id IS NOT json_extract(expected.value,'$.courseId'))
        ${approvalGuard}`)
      .bind(nextStatus, now, transition === "submit" ? null : transition === "review" ? auth.userId : release.reviewed_by,
        transition === "submit" ? "" : transition === "review" ? notes : release.review_notes, transition === "publish" ? now : release.published_at,
        ...RELEASE_STATE_COLUMNS.map(column => release[column]), platform.organization.id, auth.userId, auth.userId, ...allowedRoles.map(role => `,${role},`),
        ...(transition === "review" ? [auth.userId] : []), material.workbooks.length, workbookJson,
        ...(approvalGuard ? [material.revision, material.revision, workbookJson] : []));
    const statements = [mutation, env.DB.prepare(`INSERT INTO audit_events
      (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
      VALUES (?, ?, ?, ?, 'course-release', ?, 'success', CASE WHEN changes()=1 AND
        (SELECT COUNT(*) FROM audit_events WHERE sequence=? AND integrity_hash=?)=? THEN ? ELSE NULL END, ?, ?)`)
      .bind(crypto.randomUUID(), sequence, auth.userId, action, releaseId, previous?.sequence ?? 0, previous?.integrity_hash ?? "GENESIS", previous ? 1 : 0, reason, now, integrityHash),
      env.DB.prepare(`INSERT INTO course_release_snapshots (id, release_id, version, status, snapshot_json, reason, captured_by, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(crypto.randomUUID(), releaseId, Number(release.version), String(release.status), JSON.stringify(release), `before-${transition}:${operationId}`, auth.userId, now)];
    if (transition === "review") {
      statements.push(env.DB.prepare(`INSERT INTO course_release_reviews (id, release_id, reviewer_id, decision, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(operationId, releaseId, auth.userId, String(decision), notes, now));
      if (decision === "approved") {
        const reviewed = { ...release, status: "approved", reviewed_by: auth.userId, review_notes: notes, updated_at: now };
        statements.push(env.DB.prepare(`INSERT INTO course_release_snapshots (id, release_id, version, status, snapshot_json, reason, captured_by, captured_at) VALUES (?, ?, ?, 'approved', ?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), releaseId, Number(release.version), JSON.stringify({ schemaVersion: 1, materialRevision: material.revision, reviewId: operationId, release: reviewed, workbooks: material.workbooks }), `approval:${material.revision}:${operationId}`, auth.userId, now));
      }
    }
    if (transition === "publish") statements.push(env.DB.prepare(`INSERT INTO education_publications (id, organization_id, resource_type, slug, title, status, rights_status, deidentification_status, specialist_review_status, reviewer, reviewed_at, version, updated_at)
      VALUES (?, ?, 'course', ?, ?, 'published', 'cleared-at-workbook-level', 'verified-at-workbook-level', 'approved', ?, ?, ?, ?)`)
      .bind(`course:${release.slug}:v${release.version}`, String(release.organization_id), String(release.slug), String(release.title), auth.email, now, Number(release.version), now));
    try {
      // D1 executes the complete batch transactionally. A failed CAS or changed
      // audit head violates the existing NOT NULL field and rolls everything back.
      await env.DB.batch(statements);
      return;
    } catch (error) {
      const latest = await loadCurrent();
      if (RELEASE_STATE_COLUMNS.some(column => latest.release[column] !== release[column])) throw stale();
      const account = await env.DB.prepare(`SELECT status FROM account_security_profiles WHERE user_id=?`).bind(auth.userId).first<{ status: string }>();
      if (!account || !accountMayWrite(account.status)) throw new EducationPlatformError("This account cannot change releases.", 403);
      const user = await env.DB.prepare(`SELECT roles FROM users WHERE id=?`).bind(auth.userId).first<{ roles: string }>();
      if (!(user?.roles ?? "").split(",").some(role => transition === "publish" ? role === "administrator" : ["instructor", "examiner", "administrator"].includes(role)))
        throw new EducationPlatformError("Your education role changed. Refresh before continuing.", 403);
      const head = await env.DB.prepare(`SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
      if (collision === 4 || (head?.sequence ?? 0) === (previous?.sequence ?? 0) && (head?.integrity_hash ?? "GENESIS") === (previous?.integrity_hash ?? "GENESIS")) throw error;
    }
  }
  throw new EducationPlatformError("The release workflow is busy. Please refresh and try again.", 503);
}

export async function submitCourseRelease(auth: AuthContext, input: Record<string, unknown>) {
  return transitionCourseRelease(auth, input, "submit");
}
export async function reviewCourseRelease(auth: AuthContext, input: Record<string, unknown>) {
  return transitionCourseRelease(auth, input, "review");
}
export async function publishCourseRelease(auth: AuthContext, input: Record<string, unknown>) {
  return transitionCourseRelease(auth, input, "publish");
}

export async function createCourseInvitation(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const releaseId = boundedText(input.releaseId, 120);
  const release = await env.DB.prepare(`SELECT course_id, organization_id, status, access_model FROM course_releases WHERE id=?`).bind(releaseId).first<Row>();
  if (!release || release.organization_id !== platform.organization.id || release.status !== "published") throw new EducationPlatformError("Choose a published course release from this organization.", 404);
  if (release.access_model !== "invitation") throw new EducationPlatformError("Invitation codes are available only for invitation-access releases.", 409);
  const label = boundedText(input.label, 100) || "Course invitation";
  const maxUses = Math.max(1, Math.min(1000, Math.round(Number(input.maxUses ?? 1))));
  const days = Math.max(1, Math.min(365, Math.round(Number(input.validDays ?? 30))));
  const code = `ELV-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  const now = new Date();
  await env.DB.prepare(`INSERT INTO course_invitations (id, course_id, release_id, organization_id, code_hash, label, max_uses, uses, expires_at, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'active', ?, ?)`).bind(crypto.randomUUID(), String(release.course_id), releaseId, platform.organization.id, await sha256(code), label, maxUses, new Date(now.getTime() + days * 86400000).toISOString(), auth.userId, now.toISOString()).run();
  await appendAudit(auth.userId, "course-invitation.created", "course-release", releaseId, "success", `max-uses=${maxUses};valid-days=${days}`);
  return code;
}

export type StudioInvitation = { id: string; label: string; status: string; uses: number; maxUses: number; createdAt: string; expiresAt: string };
export type StudioInvitationCursor = { createdAt: string; id: string };
export type StudioInvitationPage = { releaseId: string; checkedAt: string; invitations: StudioInvitation[]; nextCursor: StudioInvitationCursor | null };

function invitationIdentity(value: unknown): string {
  if (typeof value !== "string" || !value.length || value.length > 160 || value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value))
    throw new EducationPlatformError("Choose an exact course release or invitation.", 422);
  return value;
}
function invitationTimestamp(value: unknown): string {
  if (typeof value !== "string" || !value.length || value.length > 64 || value.trim() !== value || !Number.isFinite(Date.parse(value)) || /[\u0000-\u001f\u007f]/.test(value))
    throw new EducationPlatformError("Refresh the invitation ledger before continuing.", 422);
  return value;
}
async function ownedInvitationRelease(auth: AuthContext, releaseValue: unknown) {
  const { platform, accountStatus } = await requireStaff(auth);
  const releaseId = invitationIdentity(releaseValue);
  const db = env.DB.withSession("first-primary");
  const release = await db.prepare(`SELECT cr.id, cr.course_id, cr.organization_id FROM course_releases cr
    JOIN course_ownership co ON co.course_id=cr.course_id AND co.organization_id=cr.organization_id
    WHERE cr.id=? AND cr.organization_id=?`).bind(releaseId, platform.organization.id).first<Row>();
  if (!release) throw new EducationPlatformError("This course release is not available in your Studio workspace.", 404);
  return { db, releaseId, organizationId: platform.organization.id, accountStatus };
}

// Metadata only. Never select code_hash, a token, a learner identity or a join URL.
export async function getStudioInvitations(auth: AuthContext, releaseValue: unknown, cursorValue?: unknown): Promise<StudioInvitationPage> {
  const { db, releaseId, organizationId } = await ownedInvitationRelease(auth, releaseValue);
  let cursor: StudioInvitationCursor | null = null;
  if (cursorValue !== undefined && cursorValue !== null) {
    if (typeof cursorValue !== "object" || Array.isArray(cursorValue) || Object.keys(cursorValue).length !== 2 || !Object.hasOwn(cursorValue, "createdAt") || !Object.hasOwn(cursorValue, "id"))
      throw new EducationPlatformError("Choose a valid invitation ledger page.", 422);
    const value = cursorValue as Record<string, unknown>;
    cursor = { createdAt: invitationTimestamp(value.createdAt), id: invitationIdentity(value.id) };
  }
  const query = `SELECT id,label,status,uses,max_uses,created_at,expires_at FROM course_invitations
    WHERE release_id=? AND organization_id=?
    AND EXISTS (SELECT 1 FROM course_releases cr JOIN course_ownership co ON co.course_id=cr.course_id AND co.organization_id=cr.organization_id
      WHERE cr.id=course_invitations.release_id AND cr.organization_id=course_invitations.organization_id)
    AND organization_id=(SELECT o.id FROM organizations o JOIN organization_memberships m ON m.organization_id=o.id
      WHERE m.user_id=? AND m.status='active' ORDER BY o.created_at LIMIT 1)
    AND EXISTS (SELECT 1 FROM users u JOIN account_security_profiles a ON a.user_id=u.id WHERE u.id=? AND a.status='active'
      AND (instr(','||u.roles||',',',instructor,')>0 OR instr(','||u.roles||',',',examiner,')>0 OR instr(','||u.roles||',',',administrator,')>0))
    AND EXISTS (SELECT 1 FROM organization_entitlements e WHERE e.organization_id=course_invitations.organization_id
      AND e.studio_access=1 AND e.status='active' AND (e.valid_until IS NULL OR e.valid_until>?))
    ${cursor ? "AND (created_at<? OR (created_at=? AND id<?))" : ""}
    ORDER BY created_at DESC,id DESC LIMIT 51`;
  const values: (string | number)[] = [releaseId, organizationId, auth.userId, auth.userId, new Date().toISOString()];
  if (cursor) values.push(cursor.createdAt, cursor.createdAt, cursor.id);
  const result = await db.prepare(query).bind(...values).all<Row>();
  const selected = result.results.slice(0, 50);
  const invitations = selected.map(row => ({ id: String(row.id), label: String(row.label), status: String(row.status), uses: Number(row.uses), maxUses: Number(row.max_uses), createdAt: String(row.created_at), expiresAt: String(row.expires_at) }));
  const last = invitations.at(-1);
  return { releaseId, checkedAt: new Date().toISOString(), invitations, nextCursor: result.results.length > 50 && last ? { createdAt: last.createdAt, id: last.id } : null };
}

// Revocation changes future code uses only: never delete enrolments/attempts.
// D1 batch rollback and first-primary sessions follow the current binding API:
// https://developers.cloudflare.com/d1/worker-api/d1-database/
export async function revokeStudioInvitation(auth: AuthContext, input: Record<string, unknown>) {
  const { db, releaseId, organizationId, accountStatus } = await ownedInvitationRelease(auth, input.releaseId);
  if (!accountMayWrite(accountStatus)) throw new EducationPlatformError(accountWriteBlockReason(accountStatus) ?? "This account cannot change invitations.", 403);
  const invitationId = invitationIdentity(input.invitationId), createdAt = invitationTimestamp(input.expectedCreatedAt);
  const load = () => db.prepare(`SELECT status,created_at FROM course_invitations WHERE id=? AND release_id=? AND organization_id=?`).bind(invitationId, releaseId, organizationId).first<Row>();
  const initial = await load();
  if (!initial) throw new EducationPlatformError("This invitation is not available in your Studio workspace.", 404);
  if (initial.status !== "active" || initial.created_at !== createdAt) throw new EducationPlatformError("This invitation changed. Refresh its ledger before continuing.", 409);
  for (let collision = 0; collision < 5; collision++) {
    const previous = await db.prepare(`SELECT sequence,integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
    const sequence = (previous?.sequence ?? 0) + 1, now = new Date().toISOString();
    const reason = JSON.stringify({ releaseId, futureUsesOnly: true });
    const action = "course-invitation.revoked", targetType = "course-invitation";
    const integrityHash = await sha256(`${previous?.integrity_hash ?? "GENESIS"}|${sequence}|${auth.userId}|${action}|${targetType}|${invitationId}|success|${reason}|${now}`);
    const mutation = db.prepare(`UPDATE course_invitations SET status='revoked'
      WHERE id=? AND release_id=? AND organization_id=? AND created_at=? AND status='active'
        AND EXISTS (SELECT 1 FROM course_releases cr JOIN course_ownership co ON co.course_id=cr.course_id AND co.organization_id=cr.organization_id
          WHERE cr.id=course_invitations.release_id AND cr.organization_id=course_invitations.organization_id)
        AND organization_id=(SELECT o.id FROM organizations o JOIN organization_memberships m ON m.organization_id=o.id
          WHERE m.user_id=? AND m.status='active' ORDER BY o.created_at LIMIT 1)
        AND EXISTS (SELECT 1 FROM users u JOIN account_security_profiles a ON a.user_id=u.id
          WHERE u.id=? AND a.status='active' AND (instr(','||u.roles||',',',instructor,')>0 OR instr(','||u.roles||',',',examiner,')>0 OR instr(','||u.roles||',',',administrator,')>0))
        AND EXISTS (SELECT 1 FROM organization_entitlements e WHERE e.organization_id=course_invitations.organization_id
          AND e.studio_access=1 AND e.status='active' AND (e.valid_until IS NULL OR e.valid_until>?))
        AND NOT EXISTS (SELECT 1 FROM sqlite_schema WHERE type='trigger' AND tbl_name IN ('course_invitations','audit_events'))`)
      .bind(invitationId, releaseId, organizationId, createdAt, auth.userId, auth.userId, now);
    const audit = db.prepare(`INSERT INTO audit_events (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
      VALUES (?,?,?,?,?,?,'success',CASE WHEN changes()=1 AND
        (SELECT COUNT(*) FROM audit_events WHERE sequence=? AND integrity_hash=?)=? THEN ? ELSE NULL END,?,?)`)
      .bind(crypto.randomUUID(), sequence, auth.userId, action, targetType, invitationId, previous?.sequence ?? 0, previous?.integrity_hash ?? "GENESIS", previous ? 1 : 0, reason, now, integrityHash);
    try {
      const results = await db.batch([mutation, audit]);
      if (results[0]?.meta.changes !== 1 || results[1]?.meta.changes !== 1) throw new Error("Unconfirmed invitation transaction");
      return invitationId;
    } catch (error) {
      const current = await load();
      if (!current || current.status !== "active" || current.created_at !== createdAt)
        throw new EducationPlatformError("This invitation changed. Refresh its ledger before continuing.", 409);
      const head = await db.prepare(`SELECT sequence,integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1`).first<{ sequence: number; integrity_hash: string }>();
      if (collision === 4 || (head?.sequence ?? 0) === (previous?.sequence ?? 0) && (head?.integrity_hash ?? "GENESIS") === (previous?.integrity_hash ?? "GENESIS")) throw error;
    }
  }
  throw new EducationPlatformError("The invitation ledger is busy. Refresh before continuing.", 503);
}
