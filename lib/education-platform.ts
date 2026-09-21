import { env } from "cloudflare:workers";
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
  const { roles } = await ensureEducationUser(auth);
  if (!roles.some((role) => ["instructor", "examiner", "administrator"].includes(role)))
    throw new EducationPlatformError("An educator or administrator role is required.", 403);
  const platform = await getPlatformSnapshot(auth);
  if (!platform.entitlement.studioAccess)
    throw new EducationPlatformError("Studio is not enabled for this organization.", 403);
  return { roles, platform };
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

export async function listCatalogueCourses(auth?: AuthContext | null): Promise<CatalogueCourse[]> {
  await ready();
  const userId = auth?.userId ?? "";
  const rows = await env.DB.prepare(
    `SELECT cr.*, c.code,
            COUNT(crw.workbook_id) AS workbook_count,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbooks w2 ON w2.id=crw2.workbook_id WHERE crw2.release_id=cr.id AND w2.status='published' ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
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
            COUNT(crw.workbook_id) AS workbook_count,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbooks w2 ON w2.id=crw2.workbook_id WHERE crw2.release_id=cr.id AND w2.status='published' ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
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
  const rows = await env.DB.prepare(`SELECT w.id, w.title, w.mode, w.duration_minutes, w.status, crw.position, crw.required FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id JOIN course_releases cr ON cr.id=crw.release_id WHERE crw.release_id=? AND cr.status='published' ORDER BY crw.position`).bind(releaseId).all<Row>();
  return rows.results.map((row) => ({ id: String(row.id), title: String(row.title), mode: String(row.mode), durationMinutes: Number(row.duration_minutes), required: Boolean(row.required), position: Number(row.position) }));
}

export async function getInvitationCourse(codeValue: unknown, auth?: AuthContext | null) {
  await ready();
  const code = boundedText(codeValue, 80).toUpperCase();
  if (!/^ELV-[A-F0-9]{12}$/.test(code)) return null;
  const row = await env.DB.prepare(
    `SELECT cr.*, c.code,
            COUNT(crw.workbook_id) AS workbook_count,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbooks w2 ON w2.id=crw2.workbook_id WHERE crw2.release_id=cr.id AND w2.status='published' ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
            MAX(CASE WHEN e.status='active' THEN 1 ELSE 0 END) AS enrolled
       FROM course_invitations ci JOIN course_releases cr ON cr.id=ci.release_id JOIN courses c ON c.id=cr.course_id
       LEFT JOIN course_release_workbooks crw ON crw.release_id=cr.id
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
  const account = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  if (!accountMayWrite(account.status))
    throw new EducationPlatformError(accountWriteBlockReason(account.status) ?? "This account cannot enrol in courses.", 403);
  const profile = await getLearnerProfile(auth);
  if (profile.onboardingStatus !== "complete")
    throw new EducationPlatformError(profile.onboardingStatus === "consent-required" ? "Review the current education terms and privacy notice before enrolling." : "Complete your learner profile before enrolling.", 409);
  const releaseId = boundedText(releaseIdValue, 120);
  const release = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=? AND status='published'`).bind(releaseId).first<Row>();
  if (!release) throw new EducationPlatformError("This course release is not available.", 404);
  if (!Boolean(release.enrolment_open)) throw new EducationPlatformError("Enrolment is currently closed for this course.", 409);
  const accessModel = String(release.access_model);
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
  const existing = await env.DB.prepare(`SELECT id FROM enrolments WHERE user_id=? AND course_id=? ORDER BY enrolled_at LIMIT 1`).bind(auth.userId, String(release.course_id)).first<{ id: string }>();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO enrolments (id, user_id, course_id, status, enrolled_at) VALUES (?, ?, ?, 'active', ?) ON CONFLICT(id) DO UPDATE SET status='active', enrolled_at=excluded.enrolled_at`).bind(existing?.id ?? crypto.randomUUID(), auth.userId, String(release.course_id), now).run();
  const workbookRows = await env.DB.prepare(`SELECT crw.workbook_id FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id WHERE crw.release_id=? AND w.status='published' ORDER BY crw.position`).bind(releaseId).all<{ workbook_id: string }>();
  for (const row of workbookRows.results) {
    const current = await env.DB.prepare(`SELECT id, version FROM workbook_assignments WHERE workbook_id=? AND learner_id=?`).bind(row.workbook_id, auth.userId).first<{ id: string; version: number }>();
    const assignmentId = current?.id ?? crypto.randomUUID();
    const version = (current?.version ?? 0) + 1;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO workbook_assignments (id, workbook_id, learner_id, status, assigned_by, assigned_at, due_at, revoked_at, version) VALUES (?, ?, ?, 'active', ?, ?, NULL, NULL, ?) ON CONFLICT(workbook_id, learner_id) DO UPDATE SET status='active', assigned_by=excluded.assigned_by, assigned_at=excluded.assigned_at, revoked_at=NULL, version=excluded.version`).bind(assignmentId, row.workbook_id, auth.userId, auth.userId, now, version),
      env.DB.prepare(`INSERT INTO workbook_assignment_rules (assignment_id, available_from, expires_at, prerequisite_workbook_id, prerequisite_min_percent, updated_at) VALUES (?, ?, NULL, NULL, 100, ?) ON CONFLICT(assignment_id) DO UPDATE SET available_from=excluded.available_from, expires_at=NULL, prerequisite_workbook_id=NULL, prerequisite_min_percent=100, updated_at=excluded.updated_at`).bind(assignmentId, now, now),
    ]);
  }
  if (invitationId) await env.DB.prepare(`UPDATE course_invitations SET uses=uses+1 WHERE id=? AND uses < max_uses`).bind(invitationId).run();
  await appendAudit(auth.userId, "course.self-enrolled", "course-release", releaseId, "success", `access=${accessModel};workbooks=${workbookRows.results.length}`);
  const outboxId = crypto.randomUUID();
  const emailConfig = getEmailProviderConfig();
  const coursePath = `/courses/${String(release.slug)}`;
  const courseUrl = emailConfig.publicSiteUrl ? `${emailConfig.publicSiteUrl}${coursePath}` : coursePath;
  const message = courseEnrolmentEmail({ courseTitle: String(release.title), courseUrl });
  await env.DB.prepare(`INSERT INTO notification_outbox (id, organization_id, recipient, template, payload_json, status, reason, created_at, sent_at) VALUES (?, ?, ?, 'course-enrolment', ?, 'held', 'EMAIL_DELIVERY_PENDING', ?, NULL)`).bind(outboxId, String(release.organization_id), auth.email, JSON.stringify({ releaseId, courseSlug: String(release.slug) }), now).run();
  const delivery = await sendTransactionalEmail({ to: auth.email, ...message });
  await env.DB.prepare(`UPDATE notification_outbox SET status=?, reason=?, sent_at=? WHERE id=?`).bind(delivery.status, delivery.reason, delivery.sentAt, outboxId).run();
  return { slug: String(release.slug), workbookId: workbookRows.results[0]?.workbook_id ?? null };
}

export async function getLearnerEnrolments(auth: AuthContext) {
  await ensureEducationUser(auth);
  await ensurePlatformSchema();
  const rows = await env.DB.prepare(
    `SELECT cr.id, cr.slug, cr.title, cr.summary, cr.level, cr.duration_label, cr.publisher_name,
            (SELECT crw2.workbook_id FROM course_release_workbooks crw2 JOIN workbook_assignments wa2 ON wa2.workbook_id=crw2.workbook_id AND wa2.learner_id=e.user_id AND wa2.status='active' WHERE crw2.release_id=cr.id ORDER BY crw2.position LIMIT 1) AS first_workbook_id,
            (SELECT wp2.workbook_id FROM course_release_workbooks crw3 JOIN workbook_progress wp2 ON wp2.workbook_id=crw3.workbook_id AND wp2.learner_id=e.user_id WHERE crw3.release_id=cr.id ORDER BY wp2.last_activity_at DESC LIMIT 1) AS resume_workbook_id,
            (SELECT ts.workbook_id FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_workbook_id,
            (SELECT ts.started_at FROM course_release_workbooks live_crw JOIN teaching_sessions ts ON ts.workbook_id=live_crw.workbook_id AND ts.state='live' WHERE live_crw.release_id=cr.id ORDER BY ts.started_at DESC LIMIT 1) AS live_started_at,
            COUNT(DISTINCT CASE WHEN wa.status='active' THEN crw.workbook_id END) AS workbook_count,
            COALESCE(ROUND(AVG(CASE WHEN wa.status='active' THEN COALESCE(wp.percent_complete,0) END)),0) AS progress
       FROM enrolments e
       JOIN course_releases cr ON cr.course_id=e.course_id AND cr.status='published'
       LEFT JOIN course_release_workbooks crw ON crw.release_id=cr.id
       LEFT JOIN workbook_assignments wa ON wa.workbook_id=crw.workbook_id AND wa.learner_id=e.user_id
       LEFT JOIN workbook_progress wp ON wp.workbook_id=crw.workbook_id AND wp.learner_id=e.user_id
      WHERE e.user_id=? AND e.status='active'
      GROUP BY cr.id ORDER BY cr.title`,
  ).bind(auth.userId).all<Row>();
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
  const [courseRows, workbookRows, releaseRows, releaseWorkbookRows, releaseHistoryRows, cohortRows, analytics] = await Promise.all([
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
    env.DB.prepare(`SELECT release_id, workbook_id FROM course_release_workbooks WHERE release_id IN (SELECT id FROM course_releases WHERE organization_id=?) ORDER BY release_id, position`).bind(organizationId).all<{ release_id: string; workbook_id: string }>(),
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
  ]);
  const workbookIds = new Map<string, string[]>();
  for (const row of releaseWorkbookRows.results) workbookIds.set(row.release_id, [...(workbookIds.get(row.release_id) ?? []), row.workbook_id]);
  return {
    organization: { id: organizationId, name: platform.organization.name, role: platform.organization.role },
    educationRoles: roles,
    courses: courseRows.results.map((row) => ({ id: String(row.id), code: String(row.code), title: String(row.title), description: String(row.description), status: String(row.status), moduleId: String(row.module_id ?? ""), workbookCount: Number(row.workbook_count), releaseCount: Number(row.release_count), enrolledLearners: Number(row.enrolled_learners) })),
    workbooks: workbookRows.results.map((row) => ({ id: String(row.id), courseId: String(row.course_id), moduleId: String(row.module_id), courseTitle: String(row.course_title), moduleTitle: String(row.module_title), title: String(row.title), mode: String(row.mode), status: String(row.status), version: Number(row.version), durationMinutes: Number(row.duration_minutes), caseCount: Number(row.case_count) })),
    releases: releaseRows.results.map((row) => mapCatalogueRow(row, workbookIds.get(String(row.id)) ?? [])),
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
  const { platform } = await requireStaff(auth);
  const courseId = boundedText(input.courseId, 120);
  const course = await ownedCourse(courseId, platform.organization.id);
  const title = boundedText(input.title, 160) || String(course.title);
  const summary = boundedText(input.summary, 1200);
  const releaseSlug = slugify(input.slug || title);
  const level = boundedText(input.level, 60) || "All levels";
  const duration = boundedText(input.duration, 60) || "Self-paced";
  const outcomes = stringList(input.outcomes, 8, 180);
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
  if (workbookIds.length) {
    const placeholders = workbookIds.map(() => "?").join(",");
    const valid = await env.DB.prepare(`SELECT COUNT(*) AS count FROM workbooks w JOIN modules m ON m.id=w.module_id WHERE m.course_id=? AND w.id IN (${placeholders})`).bind(courseId, ...workbookIds).first<{ count: number }>();
    if (Number(valid?.count ?? 0) !== workbookIds.length) throw new EducationPlatformError("Every release workbook must belong to this course.", 422);
  }
  const existingId = boundedText(input.releaseId, 120);
  const now = new Date().toISOString();
  let releaseId = existingId;
  if (existingId) {
    const existing = await env.DB.prepare(`SELECT version, status, organization_id FROM course_releases WHERE id=?`).bind(existingId).first<Row>();
    if (!existing || existing.organization_id !== platform.organization.id) throw new EducationPlatformError("Course release draft not found.", 404);
    if (!new Set(["draft", "changes-requested"]).has(String(existing.status))) throw new EducationPlatformError("Only a draft or changes-requested release can be edited.", 409);
    const expectedVersion = Number(input.expectedVersion);
    if (expectedVersion !== Number(existing.version)) throw new EducationPlatformError("A newer release draft exists. Refresh before saving.", 409);
    await captureCourseRelease(existingId, auth.userId, "before-draft-save");
    await env.DB.prepare(`UPDATE course_releases SET slug=?, title=?, summary=?, level=?, duration_label=?, outcomes_json=?, publisher_name=?, publisher_kind=?, visibility=?, access_model=?, price_minor=?, currency=?, enrolment_open=?, version=version+1, updated_at=? WHERE id=? AND version=?`).bind(releaseSlug, title, summary, level, duration, JSON.stringify(outcomes), boundedText(input.publisherName, 160) || platform.organization.name, publisherKind, visibility, accessModel, priceMinor, currency, input.enrolmentOpen === true ? 1 : 0, now, existingId, expectedVersion).run();
  } else {
    releaseId = `release:${crypto.randomUUID()}`;
    await env.DB.prepare(`INSERT INTO course_releases (id, course_id, organization_id, slug, title, summary, level, duration_label, outcomes_json, publisher_name, publisher_kind, visibility, access_model, price_minor, currency, status, enrolment_open, version, created_by, reviewed_by, review_notes, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, 1, ?, NULL, '', ?, ?, NULL)`).bind(releaseId, courseId, platform.organization.id, releaseSlug, title, summary, level, duration, JSON.stringify(outcomes), boundedText(input.publisherName, 160) || platform.organization.name, publisherKind, visibility, accessModel, priceMinor, currency, input.enrolmentOpen === true ? 1 : 0, auth.userId, now, now).run();
  }
  await env.DB.prepare(`DELETE FROM course_release_workbooks WHERE release_id=?`).bind(releaseId).run();
  if (workbookIds.length) await env.DB.batch(workbookIds.map((workbookId, position) => env.DB.prepare(`INSERT INTO course_release_workbooks (release_id, workbook_id, position, required) VALUES (?, ?, ?, 1)`).bind(releaseId, workbookId, position + 1)));
  await appendAudit(auth.userId, "course-release.draft-saved", "course-release", releaseId, "success", `visibility=${visibility};access=${accessModel};workbooks=${workbookIds.length}`);
  return releaseId;
}

export async function submitCourseRelease(auth: AuthContext, releaseIdValue: unknown) {
  const { platform } = await requireStaff(auth);
  const releaseId = boundedText(releaseIdValue, 120);
  const release = await env.DB.prepare(`SELECT status FROM course_releases WHERE id=? AND organization_id=?`).bind(releaseId, platform.organization.id).first<{ status: string }>();
  if (!release || !new Set(["draft", "changes-requested"]).has(release.status)) throw new EducationPlatformError("This release cannot be submitted for review.", 409);
  const workbooks = await env.DB.prepare(`SELECT w.status FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id WHERE crw.release_id=?`).bind(releaseId).all<{ status: string }>();
  if (!workbooks.results.length || workbooks.results.some((row) => row.status !== "published")) throw new EducationPlatformError("Every release needs at least one published workbook before course review.", 409);
  await captureCourseRelease(releaseId, auth.userId, "before-review-submission");
  await env.DB.prepare(`UPDATE course_releases SET status='in-review', updated_at=? WHERE id=?`).bind(new Date().toISOString(), releaseId).run();
  await appendAudit(auth.userId, "course-release.review-requested", "course-release", releaseId, "success", `workbooks=${workbooks.results.length}`);
}

export async function reviewCourseRelease(auth: AuthContext, input: Record<string, unknown>) {
  const { platform } = await requireStaff(auth);
  const releaseId = boundedText(input.releaseId, 120);
  const decision = boundedText(input.decision, 30);
  const notes = boundedText(input.notes, 2000);
  if (!new Set(["approved", "changes-requested"]).has(decision) || notes.length < 10) throw new EducationPlatformError("Choose a review decision and provide review notes.", 422);
  const release = await env.DB.prepare(`SELECT status, created_by FROM course_releases WHERE id=? AND organization_id=?`).bind(releaseId, platform.organization.id).first<Row>();
  if (!release || release.status !== "in-review") throw new EducationPlatformError("This release is not awaiting review.", 409);
  if (release.created_by === auth.userId) throw new EducationPlatformError("Course release review must be completed by a different education user.", 403);
  const now = new Date().toISOString();
  await captureCourseRelease(releaseId, auth.userId, "before-review-decision");
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO course_release_reviews (id, release_id, reviewer_id, decision, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), releaseId, auth.userId, decision, notes, now),
    env.DB.prepare(`UPDATE course_releases SET status=?, reviewed_by=?, review_notes=?, updated_at=? WHERE id=? AND status='in-review'`).bind(decision, auth.userId, notes, now, releaseId),
  ]);
  await appendAudit(auth.userId, `course-release.review-${decision}`, "course-release", releaseId, "success", "reviewer-separated=true");
}

export async function publishCourseRelease(auth: AuthContext, releaseIdValue: unknown) {
  const { roles, platform } = await requireStaff(auth);
  if (!roles.includes("administrator")) throw new EducationPlatformError("An education administrator must publish the approved release.", 403);
  const releaseId = boundedText(releaseIdValue, 120);
  const release = await env.DB.prepare(`SELECT * FROM course_releases WHERE id=? AND organization_id=? AND status='approved'`).bind(releaseId, platform.organization.id).first<Row>();
  if (!release) throw new EducationPlatformError("An approved course release is required.", 409);
  const workbooks = await env.DB.prepare(`SELECT w.status FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id WHERE crw.release_id=?`).bind(releaseId).all<{ status: string }>();
  if (!workbooks.results.length || workbooks.results.some((row) => row.status !== "published")) throw new EducationPlatformError("All release workbooks must remain published.", 409);
  const now = new Date().toISOString();
  await captureCourseRelease(releaseId, auth.userId, "before-publication");
  await env.DB.batch([
    env.DB.prepare(`UPDATE course_releases SET status='published', published_at=?, updated_at=? WHERE id=? AND status='approved'`).bind(now, now, releaseId),
    env.DB.prepare(`INSERT INTO education_publications (id, organization_id, resource_type, slug, title, status, rights_status, deidentification_status, specialist_review_status, reviewer, reviewed_at, version, updated_at) VALUES (?, ?, 'course', ?, ?, 'published', 'cleared-at-workbook-level', 'verified-at-workbook-level', 'approved', ?, ?, ?, ?) ON CONFLICT(resource_type, slug, version) DO UPDATE SET status='published', reviewer=excluded.reviewer, reviewed_at=excluded.reviewed_at, updated_at=excluded.updated_at`).bind(`course:${release.slug}:v${release.version}`, String(release.organization_id), String(release.slug), String(release.title), auth.email, now, Number(release.version), now),
  ]);
  await appendAudit(auth.userId, "course-release.published", "course-release", releaseId, "success", `visibility=${release.visibility};access=${release.access_model}`);
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
