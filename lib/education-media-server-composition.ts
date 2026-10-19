import { verifyAssessmentVersionRow } from './assessment-manifest-store';
import { createExactEducationCaseAuthorizer } from './education-media-access';
import type { EducationMediaDependencies } from './education-media-delivery';
import { createEducationMediaObjectReader } from './education-media-object-reader';
import { createEducationMediaRecordReader } from './education-media-records';
import { publishedWorkbookEligibilityForRoles } from './workbook-eligibility';

const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,199}$/;
const HASH = /^[a-f0-9]{64}$/;

/** Supplied only by a trusted Education server boundary, never a request claim. */
export type SignedInEducationIdentity = {
  userId: string;
  externalSubject: string;
};

export type EducationMediaServerBindings = {
  /** The dedicated Education database; no archive/PACS/Atlas database. */
  database: Pick<D1Database, 'withSession'>;
  /** The dedicated private Education object bucket; never a public asset bucket. */
  bucket: Pick<R2Bucket, 'get'>;
  /** Resolve the hosting boundary's current signed-in identity on each call. */
  getSignedInEducationIdentity(): Promise<SignedInEducationIdentity | null>;
};

/**
 * Assemble inert server-only dependencies for readEducationMediaObject.
 * The version/digest are captured once from the server's validated request;
 * every loader refuses a different assessment version. This supplies no route,
 * environment selection, writer, permission, clearance authority or readiness.
 */
export function createEducationMediaServerDependencies(
  assessmentVersionId: string,
  assessmentIntegrityHash: string,
  trusted: EducationMediaServerBindings,
): EducationMediaDependencies {
  const database = trusted.database;
  const bucket = trusted.bucket;
  const getSignedInEducationIdentity = trusted.getSignedInEducationIdentity.bind(trusted);
  // A fresh first-primary session belongs to EACH read, including rechecks.
  // Preparing on one long-lived session may route later reads to a replica.
  const primary = () => database.withSession('first-primary');
  const loadVerifiedAssessment: EducationMediaDependencies['loadVerifiedAssessment'] = async versionId => {
    if (typeof assessmentVersionId !== 'string' || typeof assessmentIntegrityHash !== 'string' ||
        !ID.test(assessmentVersionId) || !HASH.test(assessmentIntegrityHash) ||
        versionId !== assessmentVersionId) return null;
    const row = await primary().prepare(
      `SELECT id, workbook_id, version, integrity_hash, manifest_json,
              viewer_core_version, status, dual_display_allowed
         FROM assessment_versions WHERE id = ?`,
    ).bind(versionId).first<Parameters<typeof verifyAssessmentVersionRow>[0]>();
    if (!row) return null;
    const verified = await verifyAssessmentVersionRow(row);
    return verified.id === assessmentVersionId &&
      verified.integrityHash === assessmentIntegrityHash ? verified : null;
  };

  const authorizeCase = createExactEducationCaseAuthorizer(
    assessmentVersionId, assessmentIntegrityHash, {
      async loadAuthenticatedActor() {
        const identity = await getSignedInEducationIdentity();
        if (!identity || typeof identity.userId !== 'string' || !ID.test(identity.userId) ||
            typeof identity.externalSubject !== 'string' ||
            !/^sites:[A-Za-z0-9][A-Za-z0-9:_-]{0,190}$/.test(identity.externalSubject) ||
            identity.userId !== `edu:${identity.externalSubject.slice(6)}`) return null;
        const authenticatedId = identity.userId, externalSubject = identity.externalSubject;
        const row = await primary().prepare(
          `SELECT u.roles, s.status FROM users u
             JOIN account_security_profiles s ON s.user_id = u.id
            WHERE u.id = ? AND u.external_subject = ?`,
        ).bind(authenticatedId, externalSubject)
          .first<{ roles: string; status: string }>();
        if (!row || row.status !== 'active' || typeof row.roles !== 'string') return null;
        const roles = row.roles.split(',');
        if (!roles.every(role => /^[a-z][a-z-]{0,63}$/.test(role))) return null;
        return { id: authenticatedId, roles };
      },
      loadVerifiedAssessment,
      async hasCurrentWorkbookCase(workbookId, caseId) {
        const row = await primary().prepare(
          `SELECT wc.case_id FROM workbook_cases wc
             JOIN cases c ON c.id = wc.case_id
            WHERE wc.workbook_id = ? AND wc.case_id = ?
              AND c.status = 'published' LIMIT 1`,
        ).bind(workbookId, caseId).first<{ case_id: string }>();
        return row?.case_id === caseId;
      },
      async canAccessPublishedWorkbook(actorId, roles, workbookId) {
        // Same shared staff/learner policy source as workbook-access.ts, but
        // against this explicitly injected Education DB and a fresh primary.
        const policy = publishedWorkbookEligibilityForRoles(
          actorId, roles, new Date().toISOString(),
        );
        const row = await primary().prepare(
          `SELECT workbook_id FROM (${policy.sql}) WHERE workbook_id = ? LIMIT 1`,
        ).bind(...policy.bindings, workbookId).first<{ workbook_id: string }>();
        return row?.workbook_id === workbookId;
      },
    },
  );

  const records = createEducationMediaRecordReader({
    // This adapter deliberately creates the session during each prepare, so
    // binding and clearance rechecks do not inherit a prior session bookmark.
    prepare(sql) { return primary().prepare(sql); },
  });
  return Object.freeze({
    loadVerifiedAssessment,
    authorizeCase,
    ...records,
    async loadBinding(versionId, caseId, objectId) {
      if (versionId !== assessmentVersionId) return null;
      const binding = await records.loadBinding(versionId, caseId, objectId);
      return binding?.assessmentIntegrityHash === assessmentIntegrityHash ? binding : null;
    },
    readObject: createEducationMediaObjectReader(bucket),
  });
}
