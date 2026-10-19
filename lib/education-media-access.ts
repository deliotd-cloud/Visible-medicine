import type { VerifiedAssessmentVersion } from "./assessment-manifest-store";
import { hasWorkbookStaffAccess } from "./workbook-access-policy.ts";

const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,199}$/;
const HASH = /^[a-f0-9]{64}$/;

export type EducationMediaActor = {
  id: string;
  roles: readonly string[];
};

/** All dependencies must read trusted server state, never request claims. */
export type ExactEducationCaseAccessDependencies = {
  loadAuthenticatedActor(): Promise<EducationMediaActor | null>;
  loadVerifiedAssessment(versionId: string): Promise<VerifiedAssessmentVersion | null>;
  /** Exact current membership AND a currently published case; not a historical row alone. */
  hasCurrentWorkbookCase(workbookId: string, caseId: string): Promise<boolean>;
  canAccessPublishedWorkbook(actorId: string, roles: readonly string[], workbookId: string): Promise<boolean>;
};

/**
 * Binds the delivery adapter to one assessment version and integrity digest.
 * The caller must take these two values from the server's validated request;
 * they never supply identity, roles, membership, or eligibility.
 * Every invocation rereads authentication, manifest, membership and eligibility.
 */
export function createExactEducationCaseAuthorizer(
  assessmentVersionId: string,
  assessmentIntegrityHash: string,
  dependencies: ExactEducationCaseAccessDependencies,
) {
  return async (actorId: string, workbookId: string, caseId: string): Promise<boolean> => {
    if (![assessmentVersionId, actorId, workbookId, caseId].every(value => typeof value === "string" && ID.test(value)) ||
        typeof assessmentIntegrityHash !== "string" || !HASH.test(assessmentIntegrityHash)) return false;
    try {
      const actor = await dependencies.loadAuthenticatedActor();
      if (!actor || actor.id !== actorId || !ID.test(actor.id) ||
          !Array.isArray(actor.roles) || !actor.roles.every(role => typeof role === "string" && /^[a-z][a-z-]{0,63}$/.test(role))) return false;
      // Own the authenticated primitives before another await. A shared provider
      // object cannot swap actor/roles between the identity and eligibility checks.
      const authenticatedId = actor.id;
      const roles = [...actor.roles];
      if (!roles.includes("learner") && !hasWorkbookStaffAccess(roles)) return false;
      const record = await dependencies.loadVerifiedAssessment(assessmentVersionId);
      if (!record || record.id !== assessmentVersionId || record.integrityHash !== assessmentIntegrityHash ||
          record.manifest?.workbook?.id !== workbookId ||
          record.manifest?.product !== "Visible Medicine" ||
          record.manifest?.intendedPurpose !== "education-only" ||
          !Array.isArray(record.manifest?.cases) ||
          record.manifest.cases.filter(item => item?.id === caseId).length !== 1) return false;
      if (await dependencies.hasCurrentWorkbookCase(workbookId, caseId) !== true) return false;
      return await dependencies.canAccessPublishedWorkbook(authenticatedId, roles, workbookId) === true;
    } catch {
      // Missing tables, malformed records, verifier failures and DB errors deny.
      return false;
    }
  };
}

/**
 * Production seam for Education media delivery's authorizeCase dependency.
 * No provisioning, role mutation, Atlas/lecture entitlement or case-wide grant.
 */
export function createEducationMediaCaseAuthorizer(
  assessmentVersionId: string,
  assessmentIntegrityHash: string,
) {
  return createExactEducationCaseAuthorizer(assessmentVersionId, assessmentIntegrityHash, {
    async loadAuthenticatedActor() {
      const [{ getAuthContext }, { env }] = await Promise.all([
        import("./auth"), import("cloudflare:workers"),
      ]);
      const auth = await getAuthContext();
      if (!auth || !ID.test(auth.userId) || !auth.externalSubject) return null;
      const session = env.DB.withSession("first-primary");
      const row = await session.prepare(
        `SELECT u.roles, s.status FROM users u
          JOIN account_security_profiles s ON s.user_id = u.id
         WHERE u.id = ? AND u.external_subject = ?`,
      ).bind(auth.userId, auth.externalSubject).first<{ roles: string; status: string }>();
      if (!row || row.status !== "active" || typeof row.roles !== "string") return null;
      const roles = row.roles.split(",");
      if (!roles.every(role => /^[a-z][a-z-]{0,63}$/.test(role))) return null;
      return { id: auth.userId, roles };
    },
    async loadVerifiedAssessment(versionId) {
      const { getVerifiedAssessmentManifest } = await import("./assessment-manifest-store");
      return getVerifiedAssessmentManifest(versionId);
    },
    async hasCurrentWorkbookCase(workbookId, caseId) {
      const { env } = await import("cloudflare:workers");
      const row = await env.DB.withSession("first-primary").prepare(
        `SELECT wc.case_id FROM workbook_cases wc JOIN cases c ON c.id = wc.case_id
          WHERE wc.workbook_id = ? AND wc.case_id = ? AND c.status = 'published' LIMIT 1`,
      ).bind(workbookId, caseId).first<{ case_id: string }>();
      return row?.case_id === caseId;
    },
    async canAccessPublishedWorkbook(actorId, roles, workbookId) {
      const { canAccessPublishedWorkbook } = await import("./workbook-access");
      return canAccessPublishedWorkbook(actorId, roles, workbookId);
    },
  });
}
