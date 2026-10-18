import type { VerifiedAssessmentVersion } from "./assessment-manifest-store";

/** Server integration seam only: not a route, storage adapter or readiness grant. */
export const EDUCATION_MEDIA_OBJECT_LIMIT = 16 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,199}$/;
const UID = /^\d+(?:\.\d+)+$/;

export type EducationMediaRequest = {
  /** Must come from server authentication, never a request body/header claim. */
  actorId: string;
  assessmentVersionId: string;
  assessmentIntegrityHash: string;
  caseId: string;
  objectId: string;
};

export type EducationMediaBinding = {
  assessmentVersionId: string;
  assessmentIntegrityHash: string;
  caseId: string;
  caseVersion: number;
  casePublicationHash: string;
  sourceId: string;
  sourceRevision: string;
  clearanceRevision: string;
  objectId: string;
  representation: "dicom-instance";
  studyInstanceUid: string;
  seriesInstanceUid: string;
  frameOfReferenceUid: string;
  sopInstanceUid: string;
  /** Private Education storage key, resolved by the trusted server store. */
  objectKey: string;
  sha256: string;
  byteLength: number;
  contentType: string;
};

export type EducationMediaClearance = {
  sourceId: string;
  sourceRevision: string;
  clearanceRevision: string;
  state: "cleared" | "quarantine" | "revoked";
  privacyCleared: boolean;
  commercialUseCleared: boolean;
  objectSha256s: readonly string[];
};

export type EducationMediaDependencies = {
  /** Must parse/verify the immutable published manifest, not mutable case rows. */
  loadVerifiedAssessment(versionId: string): Promise<VerifiedAssessmentVersion | null>;
  /** Recheck BOTH exact workbook and case access; Atlas/lecture access is insufficient. */
  authorizeCase(actorId: string, workbookId: string, caseId: string): Promise<boolean>;
  loadBinding(versionId: string, caseId: string, objectId: string): Promise<EducationMediaBinding | null>;
  /** Trusted revision-bound rights/privacy records, never client acknowledgements. */
  loadClearance(sourceId: string, sourceRevision: string): Promise<EducationMediaClearance | null>;
  /** Enforce this cap while reading; do not buffer an unbounded stream first. */
  readObject(key: string, maximumBytes: number): Promise<Uint8Array | null>;
};

export class EducationMediaDeliveryError extends Error {
  readonly code: "invalid-request" | "access-denied" | "revision-mismatch" | "source-unavailable" | "object-unavailable" | "object-integrity" | "delivery-unavailable";
  constructor(code: EducationMediaDeliveryError["code"]) {
    super("Protected Education images are unavailable for this request.");
    this.name = "EducationMediaDeliveryError";
    this.code = code;
  }
}

function refuse(code: EducationMediaDeliveryError["code"]): never {
  throw new EducationMediaDeliveryError(code);
}

function snapshotBinding(binding: EducationMediaBinding | null): EducationMediaBinding {
  if (!binding || ![binding.assessmentVersionId, binding.caseId, binding.sourceId, binding.sourceRevision, binding.clearanceRevision, binding.objectId].every(value => typeof value === "string" && ID.test(value)) ||
      ![binding.assessmentIntegrityHash, binding.casePublicationHash, binding.sha256].every(value => typeof value === "string" && HASH.test(value)) ||
      !Number.isSafeInteger(binding.caseVersion) || binding.caseVersion < 1 ||
      !Number.isSafeInteger(binding.byteLength) || binding.byteLength < 1 || binding.byteLength > EDUCATION_MEDIA_OBJECT_LIMIT ||
      binding.representation !== "dicom-instance" || binding.contentType !== "application/dicom" ||
      ![binding.studyInstanceUid, binding.seriesInstanceUid, binding.frameOfReferenceUid, binding.sopInstanceUid].every(value => typeof value === "string" && value.length <= 64 && UID.test(value)) ||
      typeof binding.objectKey !== "string" ||
      !/^education-media\/[A-Za-z0-9][A-Za-z0-9/_-]{0,399}$/.test(binding.objectKey) || binding.objectKey.includes("//")) refuse("source-unavailable");
  // Copy primitive fields: an adapter cannot mutate a previously checked binding.
  return {
    assessmentVersionId: binding.assessmentVersionId, assessmentIntegrityHash: binding.assessmentIntegrityHash,
    caseId: binding.caseId, caseVersion: binding.caseVersion, casePublicationHash: binding.casePublicationHash,
    sourceId: binding.sourceId, sourceRevision: binding.sourceRevision, clearanceRevision: binding.clearanceRevision,
    objectId: binding.objectId, objectKey: binding.objectKey, sha256: binding.sha256,
    byteLength: binding.byteLength, contentType: binding.contentType,
    representation: binding.representation, studyInstanceUid: binding.studyInstanceUid,
    seriesInstanceUid: binding.seriesInstanceUid, frameOfReferenceUid: binding.frameOfReferenceUid,
    sopInstanceUid: binding.sopInstanceUid,
  };
}

function assertClearance(binding: EducationMediaBinding, clearance: EducationMediaClearance | null) {
  if (!clearance || clearance.sourceId !== binding.sourceId || clearance.sourceRevision !== binding.sourceRevision ||
      clearance.clearanceRevision !== binding.clearanceRevision || clearance.state !== "cleared" ||
      clearance.privacyCleared !== true || clearance.commercialUseCleared !== true ||
      !Array.isArray(clearance.objectSha256s) || !clearance.objectSha256s.includes(binding.sha256)) refuse("source-unavailable");
}

/**
 * Verifies one bounded, frozen DICOM instance object before exposing any bytes.
 * WSI tiles, multi-frame addressing and derived bitmap/volume delivery need
 * separate reviewed contracts; no fallback is provided. Trusted dependencies
 * are deliberately required: no live endpoint/store/decoder is configured here.
 * Neither this success nor a clearance record confers clinical sign-off or
 * establishes spatial registration / full-study decoder readiness.
 */
export async function readEducationMediaObject(request: EducationMediaRequest, dependencies: EducationMediaDependencies) {
  if (!request || typeof request.actorId !== "string" || !request.actorId.trim() || request.actorId.length > 200 || /[\x00-\x1f\x7f]/.test(request.actorId) ||
      ![request.assessmentVersionId, request.caseId, request.objectId].every(value => typeof value === "string" && ID.test(value)) ||
      typeof request.assessmentIntegrityHash !== "string" || !HASH.test(request.assessmentIntegrityHash)) refuse("invalid-request");
  // Capture caller primitives before any await; caller mutation cannot retarget a read.
  const input = { ...request };
  try {
    const record = await dependencies.loadVerifiedAssessment(input.assessmentVersionId);
    const manifest = record?.manifest;
    const cases = manifest?.cases.filter(item => item.id === input.caseId);
    if (!record || !manifest || !cases || cases.length !== 1) refuse("access-denied");
    const workbookId = manifest.workbook.id;
    const verifiedVersionId = record.id;
    const frozenCase = {
      version: cases[0].version, publicationHash: cases[0].publicationHash,
      series: cases[0].media.series.map(series => ({ ...series, sopInstanceUids: [...series.sopInstanceUids] })),
    };
    const integrityHash = record.integrityHash;
    if (await dependencies.authorizeCase(input.actorId, workbookId, input.caseId) !== true) refuse("access-denied");
    if (verifiedVersionId !== input.assessmentVersionId || integrityHash !== input.assessmentIntegrityHash || manifest.intendedPurpose !== "education-only" || manifest.product !== "Visible Medicine") refuse("revision-mismatch");
    const binding = snapshotBinding(await dependencies.loadBinding(input.assessmentVersionId, input.caseId, input.objectId));
    if (binding.assessmentVersionId !== input.assessmentVersionId || binding.assessmentIntegrityHash !== integrityHash ||
        binding.caseId !== input.caseId || binding.caseVersion !== frozenCase.version || binding.casePublicationHash !== frozenCase.publicationHash ||
        binding.objectId !== input.objectId) refuse("revision-mismatch");
    const frozenSeries = frozenCase.series.filter(series => series.plane !== "slide" &&
      series.studyInstanceUid === binding.studyInstanceUid && series.seriesInstanceUid === binding.seriesInstanceUid &&
      series.frameOfReferenceUid === binding.frameOfReferenceUid && series.sopInstanceUids.includes(binding.sopInstanceUid));
    if (frozenSeries.length !== 1) refuse("revision-mismatch");
    assertClearance(binding, await dependencies.loadClearance(binding.sourceId, binding.sourceRevision));
    const object = await dependencies.readObject(binding.objectKey, binding.byteLength);
    if (!(object instanceof Uint8Array)) refuse("object-unavailable");
    if (object.byteLength !== binding.byteLength) refuse("object-integrity");
    // Own the returned bytes before hashing; the provider may retain its buffer.
    const bytes = new Uint8Array(object);
    const digest = await crypto.subtle.digest("SHA-256", bytes.buffer);
    const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    if (hash !== binding.sha256) refuse("object-integrity");
    // A mid-read revocation or binding replacement must not release buffered bytes.
    const latestBinding = snapshotBinding(await dependencies.loadBinding(input.assessmentVersionId, input.caseId, input.objectId));
    if (JSON.stringify(latestBinding) !== JSON.stringify(binding)) refuse("revision-mismatch");
    assertClearance(binding, await dependencies.loadClearance(binding.sourceId, binding.sourceRevision));
    if (await dependencies.authorizeCase(input.actorId, workbookId, input.caseId) !== true) refuse("access-denied");
    return {
      bytes, contentType: binding.contentType, sha256: hash, sourceRevision: binding.sourceRevision,
      assessmentVersionId: input.assessmentVersionId, assessmentIntegrityHash: integrityHash,
      caseId: input.caseId, objectId: input.objectId,
      headers: { "Cache-Control": "private, no-store", "Pragma": "no-cache", "X-Content-Type-Options": "nosniff" },
    };
  } catch (error) {
    if (error instanceof EducationMediaDeliveryError) throw error;
    // Do not leak storage keys, URLs, source metadata or provider exception text.
    refuse("delivery-unavailable");
  }
}
