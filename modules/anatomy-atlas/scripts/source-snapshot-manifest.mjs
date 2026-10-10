// Audit-only, pure validation. This module never reads, copies, builds or uploads files.
import {ReviewedPathPolicyError, reviewedPolicySourceCommit, reviewedPathRecord,
  reviewedDirectoryAllowed, verifyReviewedPathIdentity} from './source-snapshot-reviewed-paths.mjs';
const HEX256 = /^[0-9a-f]{64}$/;
const HEX_COMMIT = /^[0-9a-f]{40}$/;
const BINARY = /\.(?:glb|gltf|bin|png|jpe?g|webp|ktx2)$/i;
const ARCHIVE = /\.(?:zip|7z|rar|tar|tgz|gz|bz2|xz|zst)$/i;
const CLINICAL = /\.(?:dcm|dicom|nii|nrrd|mha|mhd|mrb|vmatlas|vmcompare|vmmr|mrk\.json)$/i;
const SOURCE = /\.(?:js|mjs|cjs|ts|tsx|jsx|css|scss|json|md|txt|html|toml|yaml|yml)$/i;
const ROLES = ['code', 'model', 'notice'];
// Inspected packaging guard: excludes the verified generated ZIP without
// requiring an authoring original. No other recovery path is exempt.
const RECOVERY_GUARD_CODE = 'scripts/exclude-source-recovery.mjs';
const DEVICE = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const SECRET = /^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|\.npmrc|id_(?:rsa|dsa|ecdsa|ed25519)(?:\..*)?|.*(?:private[-_.]?key|secret|credential|api[-_.]?key|service[-_.]?account).*|.*\.(?:pem|key|p12|pfx|jks|kdbx))$/i;

export class SnapshotValidationError extends Error {
  constructor(code, detail) {
    super(`${code}: ${detail}`);
    this.name = 'SnapshotValidationError';
    this.code = code;
  }
}

const fail = (code, detail) => { throw new SnapshotValidationError(code, detail); };
const object = (value, name) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('SCHEMA', name);
  return value;
};
const array = (value, name) => Array.isArray(value) ? value : fail('SCHEMA', name);
const nonempty = (value, name) => typeof value === 'string' && value.trim() === value && value.length > 0
  ? value : fail('SCHEMA', name);

export function validateSnapshotPath(value) {
  if (typeof value !== 'string' || !value.length) fail('SCHEMA', 'path');
  const path = value;
  if (path.startsWith('/') || /^[a-z]:/i.test(path) || path.includes('\\') || path.includes(':') || /[\x00-\x1f\x7f]/.test(path))
    fail('UNSAFE_PATH', path);
  const segments = path.split('/');
  // Disallow spaces outright so Windows case/space normalization cannot alias
  // two recorded paths; legitimate space-bearing source names need explicit review.
  if (segments.some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part) ||
      DEVICE.test(part) || !/^[a-z0-9._+-]+$/i.test(part)))
    fail('UNSAFE_PATH', path);
  if (segments.some(part => SECRET.test(part))) fail('FORBIDDEN_PATH', path);
  if (segments.some(part => /^(?:\.git|\.local|private|patient|patients|scans|ct-head)$/i.test(part)) ||
      (path !== RECOVERY_GUARD_CODE && /(?:^|[\/._-])(?:candidate|recovery|phi)(?:[\/._-]|$)/i.test(path)))
    fail('FORBIDDEN_PATH', path);
  if (ARCHIVE.test(path) || CLINICAL.test(path)) fail('FORBIDDEN_FORMAT', path);
  return path;
}

function reviewedOperation(operation) {
  try { return operation(); }
  catch (error) {
    if (error instanceof ReviewedPathPolicyError) fail(error.code, 'reviewed source-name policy refused');
    throw error;
  }
}

export function validateReviewedPolicySource(policy, sourceCommit) {
  if (policy === undefined) return;
  if (!HEX_COMMIT.test(sourceCommit) ||
      reviewedOperation(() => reviewedPolicySourceCommit(policy)) !== sourceCommit)
    fail('REVIEWED_POLICY_SOURCE', 'reviewed names belong to a different immutable source');
}

// An opt-in name check is not an admission. The opaque policy is limited to three
// exact application files; all ordinary path/format checks remain the default.
export function validateSnapshotPathWithReview(value, policy, kind = 'file') {
  if (!['file', 'directory', 'entry'].includes(kind)) fail('SCHEMA', 'reviewed path kind');
  if (policy === undefined) return validateSnapshotPath(value);
  reviewedOperation(() => reviewedPolicySourceCommit(policy));
  const file = kind !== 'directory' && reviewedOperation(() => reviewedPathRecord(policy, value));
  const directory = kind !== 'file' && reviewedOperation(() => reviewedDirectoryAllowed(policy, value));
  try { return validateSnapshotPath(value); }
  catch (error) {
    if (error instanceof SnapshotValidationError &&
        ['UNSAFE_PATH', 'FORBIDDEN_PATH'].includes(error.code) && (file || directory)) return value;
    throw error;
  }
}

export function validateReviewedSnapshotIdentity(policy, row) {
  if (policy === undefined) return;
  const reviewed = reviewedOperation(() => reviewedPathRecord(policy, row.path));
  if (!reviewed) return;
  if (Object.hasOwn(row, 'role') && row.role !== 'code') fail('ROLE_FORMAT', 'reviewed name is code only');
  reviewedOperation(() => verifyReviewedPathIdentity(policy,
    {path: row.path, sha256: row.sha256, gitBlob: row.gitBlob, bytes: row.bytes}));
}

function rows(value, name, fields, policy) {
  const exact = new Map(), folded = new Set();
  for (const row of array(value, name)) {
    object(row, name + ' row');
    const path = validateSnapshotPathWithReview(row.path, policy);
    if (exact.has(path)) fail('DUPLICATE_PATH', `${name}: ${path}`);
    if (folded.has(path.toLowerCase())) fail('CASE_COLLISION', `${name}: ${path}`);
    folded.add(path.toLowerCase());
    if (!HEX256.test(row.sha256)) fail('INVALID_HASH', `${name}: ${path}`);
    if (!Number.isSafeInteger(row.bytes) || row.bytes < 0) fail('INVALID_BYTES', `${name}: ${path}`);
    for (const field of fields) if (!(field in row)) fail('SCHEMA', `${name}: ${path} missing ${field}`);
    validateReviewedSnapshotIdentity(policy, row);
    exact.set(path, row);
  }
  return exact;
}

function sameIdentity(a, b, name, path) {
  if (a.sha256 !== b.sha256 || a.bytes !== b.bytes) fail('IDENTITY_MISMATCH', `${name}: ${path}`);
}

// All evidence is supplied by the caller. This confirms consistency, not the truth
// of provenance assertions or the completeness of the caller's required-path policy.
export function validateSourceSnapshot({ stage, proposed, observed, admissions, required, reviewedPathPolicy } = {}) {
  object(stage, 'stage');
  if (stage.sourceType !== 'canonical-atlas-working-tree' || !HEX_COMMIT.test(stage.sourceCommit) ||
      stage.filesystemEvidence !== 'lstat+sha256' || stage.gitHistoryIncluded !== false ||
      stage.isAdaptedExport !== false) fail('ORIGINAL_STAGE', 'canonical original-source evidence required');
  validateReviewedPolicySource(reviewedPathPolicy, stage.sourceCommit);
  const proposal = rows(proposed, 'proposed', ['role'], reviewedPathPolicy);
  const actual = rows(observed, 'observed', ['entryType', 'isSymbolicLink'], reviewedPathPolicy);
  object(admissions, 'admissions');
  object(required, 'required');
  if (!proposal.size) fail('SCHEMA', 'empty proposal');
  if (proposal.size !== actual.size) fail('INVENTORY_SET', 'proposed and observed path sets differ');
  for (const [path, p] of proposal) {
    if (!ROLES.includes(p.role)) fail('SCHEMA', `${path}: unknown role`);
    if (path === RECOVERY_GUARD_CODE && p.role !== 'code') fail('ROLE_FORMAT', `${path}: code-only exception`);
    const textual = SOURCE.test(path) || (p.role === 'notice' && /^(?:LICENSE|NOTICE|COPYING)$/i.test(path));
    if (p.role === 'model' ? !BINARY.test(path) : !textual || BINARY.test(path))
      fail('ROLE_FORMAT', `${path}: ${p.role}`);
    const a = actual.get(path);
    if (!a) fail('MISSING_FILE', path);
    if (a.entryType !== 'file' || a.isSymbolicLink !== false) fail('NONREGULAR_FILE', path);
    sameIdentity(p, a, 'observed', path);
  }
  for (const path of actual.keys()) if (!proposal.has(path)) fail('UNLISTED_FILE', path);

  const declared = new Map(), modelNotices = [];
  for (const role of ROLES) {
    const admissionRows = rows(admissions[role], `admissions.${role}`, ['admitted', 'proof'], reviewedPathPolicy);
    for (const [path, a] of admissionRows) {
      const p = proposal.get(path);
      if (!p || p.role !== role) fail('UNLISTED_ADMISSION', `${role}: ${path}`);
      sameIdentity(p, a, 'admission', path);
      if (a.admitted !== true) fail('NOT_ADMITTED', path);
      const proof = object(a.proof, `${path}: admission proof`);
      nonempty(proof.id, `${path}: admission proof id`);
      nonempty(proof.revision, `${path}: admission proof revision`);
      if (!HEX256.test(proof.sha256)) fail('PROVENANCE_HASH', `${path}: admission proof`);
      if (role === 'model') {
        const rights = object(a.rights, `${path}: independent model rights`);
        nonempty(rights.sourceId, `${path}: sourceId`);
        nonempty(rights.licenseId, `${path}: licenseId`);
        nonempty(rights.evidenceId, `${path}: evidenceId`);
        nonempty(rights.evidenceRevision, `${path}: evidenceRevision`);
        if (!HEX256.test(rights.evidenceSha256)) fail('PROVENANCE_HASH', `${path}: rights evidence`);
        modelNotices.push([path, validateSnapshotPathWithReview(rights.noticePath, reviewedPathPolicy)]);
        if (rights.commercialUse !== true || rights.redistribution !== true || rights.derivatives !== true ||
            rights.independentlyReviewed !== true) fail('MODEL_RIGHTS', path);
      }
      declared.set(path, role);
    }
  }
  for (const [path, p] of proposal) if (declared.get(path) !== p.role) fail('MISSING_ADMISSION', path);
  for (const [model, notice] of modelNotices)
    if (declared.get(notice) !== 'notice') fail('MISSING_MODEL_NOTICE', `${model}: ${notice}`);

  for (const role of ROLES) {
    const paths = array(required[role], `required.${role}`);
    if (!paths.length) fail('MISSING_MANDATORY_CLASS', role);
    const seen = new Set();
    for (const value of paths) {
      const path = validateSnapshotPathWithReview(value, reviewedPathPolicy);
      if (seen.has(path)) fail('DUPLICATE_PATH', `required.${role}: ${path}`);
      seen.add(path);
      if (declared.get(path) !== role) fail('MISSING_MANDATORY_PATH', `${role}: ${path}`);
    }
  }
  return Object.freeze({ consistencyOnly: true, sourceCommit: stage.sourceCommit, fileCount: proposal.size,
    codeDeclarations: admissions.code.length, modelDeclarations: admissions.model.length,
    noticeDeclarations: admissions.notice.length });
}
