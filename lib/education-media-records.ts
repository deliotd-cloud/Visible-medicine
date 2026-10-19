import type {EducationMediaBinding, EducationMediaClearance, EducationMediaDependencies} from './education-media-delivery';

/** Server-side D1-shaped read seam. No writer, object store, authorization or route is supplied. */
export type EducationMediaReadDatabase = {
  prepare(sql: string): {bind(...values: string[]): {first(): Promise<unknown>}};
};

const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,199}$/;
const HASH = /^[a-f0-9]{64}$/;
const UID = /^\d+(?:\.\d+)+$/;
const KEY = /^education-media\/[A-Za-z0-9][A-Za-z0-9/_-]{0,399}$/;
const MAX_OBJECT_BYTES = 16 * 1024 * 1024;
const MAX_HASH_LIST_BYTES = 65536;
const MAX_HASHES = 256;
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const matches = (value: unknown, pattern: RegExp) => typeof value === 'string' && pattern.test(value);

const BINDING_SQL = `SELECT b.assessment_version_id, b.assessment_integrity_hash, b.case_id,
  b.case_version, b.case_publication_hash, b.source_id, b.source_revision,
  b.clearance_revision, b.object_id, b.representation, b.study_instance_uid,
  b.series_instance_uid, b.frame_of_reference_uid, b.sop_instance_uid,
  b.object_key, b.sha256, b.byte_length, b.content_type
FROM education_media_bindings b
JOIN education_media_clearance_current c
  ON c.source_id = b.source_id AND c.source_revision = b.source_revision
  AND c.clearance_revision = b.clearance_revision
WHERE b.assessment_version_id = ?1 AND b.case_id = ?2 AND b.object_id = ?3
  AND NOT EXISTS (SELECT 1 FROM education_media_revocations v
    WHERE v.source_id = b.source_id AND v.source_revision = b.source_revision)
LIMIT 1`;

const CLEARANCE_SQL = `SELECT r.source_id, r.source_revision, r.clearance_revision,
  CASE WHEN v.source_id IS NOT NULL THEN 'revoked' ELSE r.state END AS state,
  r.privacy_cleared, r.commercial_use_cleared, r.object_sha256s_json
FROM education_media_clearance_current c
JOIN education_media_clearance_records r
  ON r.source_id = c.source_id AND r.source_revision = c.source_revision
  AND r.clearance_revision = c.clearance_revision
LEFT JOIN education_media_revocations v
  ON v.source_id = c.source_id AND v.source_revision = c.source_revision
WHERE c.source_id = ?1 AND c.source_revision = ?2
LIMIT 1`;

function bindingSnapshot(value: unknown, versionId: string, caseId: string, objectId: string): EducationMediaBinding | null {
  const row = record(value);
  if (!row || row.assessment_version_id !== versionId || row.case_id !== caseId || row.object_id !== objectId ||
      !matches(row.assessment_version_id, ID) || !matches(row.case_id, ID) || !matches(row.object_id, ID) ||
      !matches(row.source_id, ID) || !matches(row.source_revision, ID) || !matches(row.clearance_revision, ID) ||
      !matches(row.assessment_integrity_hash, HASH) || !matches(row.case_publication_hash, HASH) || !matches(row.sha256, HASH) ||
      !Number.isSafeInteger(row.case_version) || (row.case_version as number) < 1 ||
      !Number.isSafeInteger(row.byte_length) || (row.byte_length as number) < 1 || (row.byte_length as number) > MAX_OBJECT_BYTES ||
      row.representation !== 'dicom-instance' || row.content_type !== 'application/dicom' ||
      ![row.study_instance_uid, row.series_instance_uid, row.frame_of_reference_uid, row.sop_instance_uid]
        .every(value => matches(value, UID) && (value as string).length <= 64) ||
      !matches(row.object_key, KEY) || (row.object_key as string).includes('//')) return null;
  return {
    assessmentVersionId: row.assessment_version_id as string,
    assessmentIntegrityHash: row.assessment_integrity_hash as string,
    caseId: row.case_id as string, caseVersion: row.case_version as number,
    casePublicationHash: row.case_publication_hash as string,
    sourceId: row.source_id as string, sourceRevision: row.source_revision as string,
    clearanceRevision: row.clearance_revision as string, objectId: row.object_id as string,
    representation: 'dicom-instance', studyInstanceUid: row.study_instance_uid as string,
    seriesInstanceUid: row.series_instance_uid as string, frameOfReferenceUid: row.frame_of_reference_uid as string,
    sopInstanceUid: row.sop_instance_uid as string, objectKey: row.object_key as string,
    sha256: row.sha256 as string, byteLength: row.byte_length as number, contentType: 'application/dicom',
  };
}

function clearanceSnapshot(value: unknown, sourceId: string, sourceRevision: string): EducationMediaClearance | null {
  const row = record(value);
  if (!row || row.source_id !== sourceId || row.source_revision !== sourceRevision ||
      !matches(row.source_id, ID) || !matches(row.source_revision, ID) || !matches(row.clearance_revision, ID) ||
      !['cleared', 'quarantine', 'revoked'].includes(row.state as string) ||
      ![0, 1].includes(row.privacy_cleared as number) || ![0, 1].includes(row.commercial_use_cleared as number) ||
      typeof row.object_sha256s_json !== 'string' ||
      new TextEncoder().encode(row.object_sha256s_json).byteLength > MAX_HASH_LIST_BYTES) return null;
  let hashes: unknown;
  try {hashes = JSON.parse(row.object_sha256s_json);} catch {return null;}
  if (!Array.isArray(hashes) || hashes.length < 1 || hashes.length > MAX_HASHES ||
      hashes.some(value => !matches(value, HASH)) || new Set(hashes).size !== hashes.length) return null;
  return {
    sourceId: row.source_id as string, sourceRevision: row.source_revision as string,
    clearanceRevision: row.clearance_revision as string,
    state: row.state as EducationMediaClearance['state'],
    privacyCleared: row.privacy_cleared === 1,
    commercialUseCleared: row.commercial_use_cleared === 1,
    objectSha256s: [...hashes],
  };
}

/** The trusted server injects the dedicated Education database; this reader grants nothing by itself. */
export function createEducationMediaRecordReader(db: EducationMediaReadDatabase):
  Pick<EducationMediaDependencies, 'loadBinding' | 'loadClearance'> {
  return {
    async loadBinding(versionId, caseId, objectId) {
      if (![versionId, caseId, objectId].every(value => matches(value, ID))) return null;
      const row = await db.prepare(BINDING_SQL).bind(versionId, caseId, objectId).first();
      return bindingSnapshot(row, versionId, caseId, objectId);
    },
    async loadClearance(sourceId, sourceRevision) {
      if (![sourceId, sourceRevision].every(value => matches(value, ID))) return null;
      const row = await db.prepare(CLEARANCE_SQL).bind(sourceId, sourceRevision).first();
      return clearanceSnapshot(row, sourceId, sourceRevision);
    },
  };
}
