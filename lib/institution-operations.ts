import { env } from "cloudflare:workers";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { ensurePlatformSchema, getPlatformSnapshot } from "@/db/platform";
import type { AuthContext } from "@/lib/auth";
import { sha256 } from "@/lib/domain";
import {
  normaliseEmail,
  normaliseInvitationRole,
  parseRosterInput,
  PILOT_READINESS_GATES,
  READINESS_STATUSES,
} from "@/lib/pilot-readiness";

type Row = Record<string, string | number | null>;

export class InstitutionOperationsError extends Error {
  constructor(message: string, public status = 422) {
    super(message);
  }
}

function text(value: unknown, max = 1000) {
  return typeof value === "string" ? value.normalize("NFKC").replace(/\0/g, "").trim().slice(0, max) : "";
}

function integer(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

async function requireAdministrator(auth: AuthContext) {
  const { roles } = await ensureEducationUser(auth);
  await ensurePlatformSchema();
  if (!roles.includes("administrator")) throw new InstitutionOperationsError("An organisation administrator is required.", 403);
  return getPlatformSnapshot(auth);
}

export async function enforceRateLimit(actor: string, scope: string, limit = 30, windowSeconds = 60) {
  await ensurePlatformSchema();
  const bucketKey = `${scope}:${actor}`.slice(0, 220);
  const now = Date.now();
  const row = await env.DB.prepare(`SELECT window_start, count FROM api_rate_limits WHERE bucket_key = ?`).bind(bucketKey).first<{ window_start: string; count: number }>();
  const windowStart = row ? new Date(row.window_start).getTime() : 0;
  if (!row || !Number.isFinite(windowStart) || now - windowStart >= windowSeconds * 1000) {
    const iso = new Date(now).toISOString();
    await env.DB.prepare(`INSERT INTO api_rate_limits (bucket_key, window_start, count, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(bucket_key) DO UPDATE SET window_start=excluded.window_start, count=1, updated_at=excluded.updated_at`).bind(bucketKey, iso, iso).run();
    return;
  }
  if (Number(row.count) >= limit) throw new InstitutionOperationsError("Too many requests. Please wait and try again.", 429);
  await env.DB.prepare(`UPDATE api_rate_limits SET count=count+1, updated_at=? WHERE bucket_key=?`).bind(new Date(now).toISOString(), bucketKey).run();
}

export async function submitPilotApplication(auth: AuthContext | null, input: Record<string, unknown>) {
  await ensurePlatformSchema();
  const organizationName = text(input.organizationName, 160);
  const contactName = text(input.contactName, 120);
  let contactEmail = "";
  try { contactEmail = normaliseEmail(input.contactEmail); }
  catch (error) { throw new InstitutionOperationsError(error instanceof Error ? error.message : "Enter a valid email address."); }
  const jurisdiction = text(input.jurisdiction, 80);
  const learnerBand = text(input.learnerBand, 60);
  const educatorBand = text(input.educatorBand, 60);
  const contentScope = text(input.contentScope, 1200);
  const goals = text(input.goals, 1600);
  const supportNeeds = text(input.supportNeeds, 1200);
  if (organizationName.length < 2 || contactName.length < 2 || jurisdiction.length < 2 || contentScope.length < 20 || goals.length < 20)
    throw new InstitutionOperationsError("Complete the organisation, jurisdiction, content scope and pilot goals.");
  if (!learnerBand || !educatorBand) throw new InstitutionOperationsError("Choose learner and educator bands.");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO pilot_applications (id, organization_name, contact_name, contact_email, jurisdiction, learner_band, educator_band, content_scope, goals, support_needs, status, submitted_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?)`).bind(id, organizationName, contactName, contactEmail, jurisdiction, learnerBand, educatorBand, contentScope, goals, supportNeeds, auth?.userId ?? null, now, now).run();
  if (auth) await appendAudit(auth.userId, "institution.pilot-submitted", "pilot-application", id, "success", `organization=${organizationName}`);
  return { id, status: "submitted" };
}

export async function getPeopleSnapshot(auth: AuthContext) {
  const platform = await requireAdministrator(auth);
  const organizationId = platform.organization.id;
  const [memberRows, invitationRows, outbox] = await Promise.all([
    env.DB.prepare(`SELECT m.user_id, m.role, m.status, m.joined_at, u.display_name, u.email, u.last_seen_at FROM organization_memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=? ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'administrator' THEN 1 WHEN 'educator' THEN 2 ELSE 3 END, u.display_name`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT id, email, role, status, created_at, expires_at, accepted_at FROM organization_invitations WHERE organization_id=? ORDER BY created_at DESC LIMIT 250`).bind(organizationId).all<Row>(),
    env.DB.prepare(`SELECT status, COUNT(*) AS count FROM notification_outbox WHERE organization_id=? GROUP BY status`).bind(organizationId).all<Row>(),
  ]);
  return {
    organization: platform.organization,
    entitlement: platform.entitlement,
    members: memberRows.results.map((row) => ({ userId: String(row.user_id), displayName: String(row.display_name), email: String(row.email), role: String(row.role), status: String(row.status), joinedAt: String(row.joined_at), lastSeenAt: String(row.last_seen_at) })),
    invitations: invitationRows.results.map((row) => ({ id: String(row.id), email: String(row.email), role: String(row.role), status: String(row.status), createdAt: String(row.created_at), expiresAt: String(row.expires_at), acceptedAt: row.accepted_at ? String(row.accepted_at) : null })),
    outbox: Object.fromEntries(outbox.results.map((row) => [String(row.status), Number(row.count)])),
  };
}

export async function createOrganizationInvitations(auth: AuthContext, input: Record<string, unknown>) {
  const platform = await requireAdministrator(auth);
  let roster: Array<{ email: string; role: string }>;
  try {
    roster = input.roster ? parseRosterInput(input.roster) : [{ email: normaliseEmail(input.email), role: normaliseInvitationRole(input.role) }];
  } catch (error) {
    throw new InstitutionOperationsError(error instanceof Error ? error.message : "The roster is invalid.");
  }
  const validDays = integer(input.validDays, 1, 90, 14);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + validDays * 86_400_000).toISOString();
  const created: Array<{ email: string; role: string; invitationPath: string }> = [];
  for (const item of roster) {
    const token = `ELV-ORG-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const tokenHash = await sha256(token);
    const id = crypto.randomUUID();
    const createdAt = now.toISOString();
    await env.DB.batch([
      env.DB.prepare(`UPDATE organization_invitations SET status='superseded' WHERE organization_id=? AND email=? AND status='pending'`).bind(platform.organization.id, item.email),
      env.DB.prepare(`INSERT INTO organization_invitations (id, organization_id, email, role, token_hash, status, created_by, created_at, expires_at, accepted_by, accepted_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, NULL, NULL)`).bind(id, platform.organization.id, item.email, item.role, tokenHash, auth.userId, createdAt, expiresAt),
      env.DB.prepare(`INSERT INTO notification_outbox (id, organization_id, recipient, template, payload_json, status, reason, created_at, sent_at) VALUES (?, ?, ?, 'organization-invitation', ?, 'held', 'EMAIL_PROVIDER_DISABLED', ?, NULL)`).bind(crypto.randomUUID(), platform.organization.id, item.email, JSON.stringify({ invitationId: id, role: item.role, expiresAt }), createdAt),
    ]);
    created.push({ email: item.email, role: item.role, invitationPath: `/join/institution/${token}` });
  }
  await appendAudit(auth.userId, "organization.invitations-created", "organization", platform.organization.id, "success", `count=${created.length};email_delivery=held`);
  return { created, emailDelivery: "held", reason: "EMAIL_PROVIDER_DISABLED", expiresAt };
}

export async function getOrganizationInvitation(auth: AuthContext, tokenValue: unknown) {
  await ensureEducationUser(auth);
  await ensurePlatformSchema();
  const token = text(tokenValue, 80).toUpperCase();
  if (!/^ELV-ORG-[A-F0-9]{16}$/.test(token)) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`SELECT i.*, o.name AS organization_name FROM organization_invitations i JOIN organizations o ON o.id=i.organization_id WHERE i.token_hash=?`).bind(tokenHash).first<Row>();
  if (!row) return null;
  return { id: String(row.id), organizationId: String(row.organization_id), organizationName: String(row.organization_name), email: String(row.email), role: String(row.role), status: String(row.status), expiresAt: String(row.expires_at), emailMatches: String(row.email).toLowerCase() === auth.email.toLowerCase() };
}

export async function acceptOrganizationInvitation(auth: AuthContext, tokenValue: unknown) {
  const invitation = await getOrganizationInvitation(auth, tokenValue);
  if (!invitation) throw new InstitutionOperationsError("This institution invitation is invalid.", 404);
  if (!invitation.emailMatches) throw new InstitutionOperationsError("Sign in with the email address that received this invitation.", 403);
  if (invitation.status !== "pending" || new Date(invitation.expiresAt).getTime() <= Date.now()) throw new InstitutionOperationsError("This institution invitation is no longer active.", 409);
  const now = new Date().toISOString();
  const membershipRole = invitation.role === "administrator" ? "administrator" : invitation.role === "learner" ? "learner" : "educator";
  const roleMap: Record<string, string> = { learner: "learner", educator: "instructor", reviewer: "examiner", administrator: "administrator" };
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id=?`).bind(auth.userId).first<{ roles: string }>();
  const roles = new Set((user?.roles ?? "learner").split(",").filter(Boolean)); roles.add(roleMap[invitation.role]); roles.add("learner");
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO organization_memberships (organization_id, user_id, role, status, joined_at) VALUES (?, ?, ?, 'active', ?) ON CONFLICT(organization_id, user_id) DO UPDATE SET role=excluded.role, status='active'`).bind(invitation.organizationId, auth.userId, membershipRole, now),
    env.DB.prepare(`UPDATE users SET roles=?, last_seen_at=? WHERE id=?`).bind([...roles].join(","), now, auth.userId),
    env.DB.prepare(`UPDATE organization_invitations SET status='accepted', accepted_by=?, accepted_at=? WHERE id=? AND status='pending'`).bind(auth.userId, now, invitation.id),
  ]);
  await appendAudit(auth.userId, "organization.invitation-accepted", "organization", invitation.organizationId, "success", `role=${invitation.role}`);
  return { organizationName: invitation.organizationName, role: invitation.role };
}

export async function getReadinessSnapshot(auth: AuthContext) {
  const platform = await requireAdministrator(auth);
  const [rows, applications] = await Promise.all([
    env.DB.prepare(`SELECT * FROM operational_readiness_checks WHERE organization_id=?`).bind(platform.organization.id).all<Row>(),
    env.DB.prepare(`SELECT id, organization_name, contact_name, contact_email, jurisdiction, learner_band, educator_band, content_scope, goals, support_needs, status, created_at FROM pilot_applications ORDER BY created_at DESC LIMIT 50`).all<Row>(),
  ]);
  const byKey = new Map(rows.results.map((row) => [String(row.gate_key), row]));
  const gates = PILOT_READINESS_GATES.map((gate) => {
    const row = byKey.get(gate.key);
    return { ...gate, status: row ? String(row.status) : "not-started", recordedEvidence: row ? String(row.evidence) : "", recordedOwner: row ? String(row.owner) : gate.owner, reviewedAt: row?.reviewed_at ? String(row.reviewed_at) : null };
  });
  return {
    organization: platform.organization,
    gates,
    readyCount: gates.filter((gate) => gate.status === "ready").length,
    activationAllowed: false,
    activationReason: "NON_LIVE_PILOT_CONFIGURATION",
    integrations: {
      identity: process.env.PRODUCTION_IDENTITY_PROVIDER && process.env.PRODUCTION_IDENTITY_PROVIDER !== "disabled" ? "configured-not-active" : "disabled",
      email: process.env.EMAIL_PROVIDER && process.env.EMAIL_PROVIDER !== "disabled" ? "configured-not-active" : "disabled",
      billing: process.env.BILLING_PROVIDER && process.env.BILLING_PROVIDER !== "disabled" ? "configured-not-active" : "disabled",
      embeds: process.env.EMBED_SIGNING_SECRET ? "evaluation-signing-configured" : "disabled",
      mediaScreening: process.env.MALWARE_SCANNER && process.env.MALWARE_SCANNER !== "disabled" ? "configured-not-active" : "disabled",
      observability: process.env.OBSERVABILITY_ENDPOINT ? "configured-not-active" : "disabled",
      liveVideo: process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET ? "configured-private-evaluation" : "disabled",
      clinicalConnectivity: "prohibited",
    },
    applications: applications.results.map((row) => ({ id: String(row.id), organizationName: String(row.organization_name), contactName: String(row.contact_name), contactEmail: String(row.contact_email), jurisdiction: String(row.jurisdiction), learnerBand: String(row.learner_band), educatorBand: String(row.educator_band), contentScope: String(row.content_scope), goals: String(row.goals), supportNeeds: String(row.support_needs), status: String(row.status), createdAt: String(row.created_at) })),
  };
}

export async function saveReadinessCheck(auth: AuthContext, input: Record<string, unknown>) {
  const platform = await requireAdministrator(auth);
  const gateKey = text(input.gateKey, 40);
  const gate = PILOT_READINESS_GATES.find((item) => item.key === gateKey);
  if (!gate) throw new InstitutionOperationsError("Unknown readiness gate.");
  const status = text(input.status, 30);
  if (!(READINESS_STATUSES as readonly string[]).includes(status)) throw new InstitutionOperationsError("Choose an approved readiness status.");
  const evidence = text(input.evidence, 2000);
  const owner = text(input.owner, 120) || gate.owner;
  if (status === "ready" && evidence.length < 20) throw new InstitutionOperationsError("Ready gates require concise evidence.");
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO operational_readiness_checks (organization_id, gate_key, status, evidence, owner, reviewed_by, reviewed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(organization_id, gate_key) DO UPDATE SET status=excluded.status, evidence=excluded.evidence, owner=excluded.owner, reviewed_by=excluded.reviewed_by, reviewed_at=excluded.reviewed_at, updated_at=excluded.updated_at`).bind(platform.organization.id, gateKey, status, evidence, owner, auth.userId, now, now).run();
  await appendAudit(auth.userId, "readiness.updated", "readiness-gate", `${platform.organization.id}:${gateKey}`, "success", `status=${status}`);
}

export async function exportLearnerData(auth: AuthContext) {
  await ensureEducationUser(auth); await ensurePlatformSchema();
  const [profile, progress, notes, reviews, completions, certificates, enrolments, requests] = await Promise.all([
    env.DB.prepare(`SELECT training_stage, discipline, interests_json, institution_name, country_code, timezone, onboarding_status, terms_accepted_at, marketing_opt_in, updated_at FROM learner_profiles WHERE user_id=?`).bind(auth.userId).first<Row>(),
    env.DB.prepare(`SELECT resource_type, resource_slug, progress, last_position, updated_at FROM learning_progress WHERE user_id=? ORDER BY updated_at DESC`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT resource_type, resource_id, title, body, visibility, created_at, updated_at FROM learner_notes WHERE learner_id=? ORDER BY updated_at DESC`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT resource_type, resource_id, title, prompt, due_at, interval_days, status, created_at, updated_at FROM learner_review_queue WHERE learner_id=? ORDER BY due_at`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT id, course_slug, course_title, percent_complete, evidence_hash, status, completed_at FROM course_completions WHERE learner_id=? ORDER BY completed_at DESC`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT c.public_code, c.title, c.issued_at, c.revoked_at FROM education_certificates c JOIN course_completions cc ON cc.id=c.completion_id WHERE cc.learner_id=? ORDER BY c.issued_at DESC`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT c.code, c.title, e.status, e.enrolled_at FROM enrolments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? ORDER BY e.enrolled_at DESC`).bind(auth.userId).all<Row>(),
    env.DB.prepare(`SELECT id, request_type, status, detail, created_at, resolved_at FROM account_requests WHERE user_id=? ORDER BY created_at DESC`).bind(auth.userId).all<Row>(),
  ]);
  return { exportedAt: new Date().toISOString(), intendedUse: "education-and-research-only", account: { id: auth.userId, email: auth.email, displayName: auth.displayName }, profile: profile ?? null, progress: progress.results, notes: notes.results, reviewQueue: reviews.results, completions: completions.results, certificates: certificates.results, enrolments: enrolments.results, requests: requests.results };
}

export async function createAccountRequest(auth: AuthContext, input: Record<string, unknown>) {
  await ensureEducationUser(auth); await ensurePlatformSchema();
  const requestType = text(input.requestType, 30);
  if (!["deletion", "correction", "restriction"].includes(requestType)) throw new InstitutionOperationsError("Choose an approved account request.");
  const detail = text(input.detail, 1200);
  if (requestType !== "deletion" && detail.length < 10) throw new InstitutionOperationsError("Describe the requested change.");
  const existing = await env.DB.prepare(`SELECT id FROM account_requests WHERE user_id=? AND request_type=? AND status IN ('submitted','in-review')`).bind(auth.userId, requestType).first();
  if (existing) throw new InstitutionOperationsError("An open request of this type already exists.", 409);
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO account_requests (id, user_id, request_type, status, detail, created_at, resolved_at, resolved_by) VALUES (?, ?, ?, 'submitted', ?, ?, NULL, NULL)`).bind(id, auth.userId, requestType, detail, now).run();
  await appendAudit(auth.userId, "account.request-submitted", "account-request", id, "success", `type=${requestType}`);
  return { id, status: "submitted" };
}

export async function getNotificationPreferences(auth: AuthContext) {
  await ensureEducationUser(auth); await ensurePlatformSchema();
  const row = await env.DB.prepare(`SELECT * FROM learner_notification_preferences WHERE user_id=?`).bind(auth.userId).first<Row>();
  return row ? { courseUpdates: Boolean(row.course_updates), assignmentReminders: Boolean(row.assignment_reminders), reviewReminders: Boolean(row.review_reminders), productUpdates: Boolean(row.product_updates), deliveryMode: String(row.delivery_mode), updatedAt: String(row.updated_at) } : { courseUpdates: true, assignmentReminders: true, reviewReminders: true, productUpdates: false, deliveryMode: "in-app-only", updatedAt: null };
}

export async function saveNotificationPreferences(auth: AuthContext, input: Record<string, unknown>) {
  await ensureEducationUser(auth); await ensurePlatformSchema(); const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO learner_notification_preferences (user_id, course_updates, assignment_reminders, review_reminders, product_updates, delivery_mode, updated_at) VALUES (?, ?, ?, ?, ?, 'in-app-only', ?) ON CONFLICT(user_id) DO UPDATE SET course_updates=excluded.course_updates, assignment_reminders=excluded.assignment_reminders, review_reminders=excluded.review_reminders, product_updates=excluded.product_updates, delivery_mode='in-app-only', updated_at=excluded.updated_at`).bind(auth.userId, input.courseUpdates === true ? 1 : 0, input.assignmentReminders === true ? 1 : 0, input.reviewReminders === true ? 1 : 0, input.productUpdates === true ? 1 : 0, now).run();
  await appendAudit(auth.userId, "learner.notification-preferences-updated", "user", auth.userId, "success", "delivery=in-app-only");
  return getNotificationPreferences(auth);
}

function csvCell(value: unknown) {
  let textValue = String(value ?? "");
  if (/^[=+\-@]/.test(textValue)) textValue = `'${textValue}`;
  return `"${textValue.replace(/"/g, '""')}"`;
}

export async function institutionProgressCsv(auth: AuthContext) {
  const platform = await requireAdministrator(auth);
  const rows = await env.DB.prepare(`SELECT u.display_name, u.email, c.code AS course_code, c.title AS course_title, w.title AS workbook_title, COALESCE(wp.percent_complete,0) AS percent_complete, COALESCE(wp.status,'not-started') AS progress_status, wp.last_activity_at FROM organization_memberships om JOIN users u ON u.id=om.user_id LEFT JOIN enrolments e ON e.user_id=u.id AND e.status='active' LEFT JOIN courses c ON c.id=e.course_id AND EXISTS (SELECT 1 FROM course_ownership co WHERE co.course_id=c.id AND co.organization_id=om.organization_id) LEFT JOIN modules m ON m.course_id=c.id LEFT JOIN workbooks w ON w.module_id=m.id LEFT JOIN workbook_progress wp ON wp.workbook_id=w.id AND wp.learner_id=u.id WHERE om.organization_id=? AND om.status='active' ORDER BY u.display_name, c.title, w.title`).bind(platform.organization.id).all<Row>();
  const header = ["Learner", "Email", "Course code", "Course", "Workbook", "Completion percent", "Status", "Last activity"];
  const lines = [header, ...rows.results.map((row) => [row.display_name, row.email, row.course_code, row.course_title, row.workbook_title, row.percent_complete, row.progress_status, row.last_activity_at])];
  return lines.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
