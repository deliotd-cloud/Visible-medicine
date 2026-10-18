import { createHash } from 'node:crypto';

// This is an offline draft contract, not a release, access-control or de-identification gate.
const HEX = /^[a-f0-9]{64}$/;
const id = (prefix, value) => typeof value === 'string' && new RegExp(`^${prefix}_[a-f0-9]{16,64}$`).test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const textOrNull = value => value === null || (typeof value === 'string' && value.trim().length > 0);

function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (Object.keys(value).length !== value.length) throw new TypeError('Non-JSON array');
    return `[${Array.from(value, canonical).join(',')}]`;
  }
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  throw new TypeError('Draft must contain only finite JSON values');
}

/** All exam content is bound; reviews are separately recorded against that content digest. */
export function revisionDigest(exam) {
  if (!object(exam)) throw new TypeError('Draft must be an object');
  const payload = Object.fromEntries(Object.entries(exam).filter(([key]) => key !== 'reviews'));
  return createHash('sha256').update(canonical(payload), 'utf8').digest('hex');
}

export function validateDraftExam(exam) {
  const errors = [];
  const fail = code => errors.push(code);
  const keys = (value, expected, code) => {
    if (!object(value) || Object.keys(value).length !== expected.length || expected.some(key => !Object.hasOwn(value, key))) {
      fail(code); return false;
    }
    return true;
  };
  let revision = null;
  try { revision = revisionDigest(exam); } catch { fail('NON_JSON_PAYLOAD'); }
  if (!keys(exam, ['schemaVersion', 'examId', 'lifecycle', 'scope', 'cases', 'reviews'], 'EXAM_KEYS')) return { ok: false, errors, revision };
  if (exam.schemaVersion !== 1) fail('SCHEMA_VERSION');
  if (!id('exam', exam.examId)) fail('EXAM_ID');
  if (exam.lifecycle !== 'private-draft') fail('DRAFT_ONLY');
  if (keys(exam.scope, ['purpose', 'audience', 'integration', 'mode', 'durationMinutes'], 'SCOPE_KEYS')) {
    if (!['assessment', 'teaching'].includes(exam.scope.purpose)) fail('SCOPE_PURPOSE');
    if (exam.scope.audience !== 'private-review') fail('PRIVATE_ONLY');
    if (exam.scope.integration !== 'didanix-education-light') fail('EDUCATION_ONLY');
    if (!['timed', 'revision'].includes(exam.scope.mode)) fail('SCOPE_MODE');
    if (!(exam.scope.durationMinutes === null || (Number.isSafeInteger(exam.scope.durationMinutes) && exam.scope.durationMinutes > 0))) fail('SCOPE_DURATION');
    if (exam.scope.mode === 'timed' && exam.scope.durationMinutes === null) fail('TIMED_DURATION_REQUIRED');
  }
  const caseIds = new Set(), assetIds = new Set(), questionIds = new Set();
  const uniqueId = (prefix, value, seen, code) => {
    if (!id(prefix, value) || seen.has(value)) fail(code);
    seen.add(value);
  };
  if (!Array.isArray(exam.cases) || !exam.cases.length) fail('CASES_REQUIRED');
  else for (const item of exam.cases) {
    if (!keys(item, ['caseId', 'sourceEvidenceSha256', 'patientLinkage', 'assets', 'fields', 'questions'], 'CASE_KEYS')) continue;
    uniqueId('case', item.caseId, caseIds, 'CASE_ID');
    if (typeof item.sourceEvidenceSha256 !== 'string' || !HEX.test(item.sourceEvidenceSha256)) fail('SOURCE_EVIDENCE_HASH');
    if (keys(item.patientLinkage, ['status', 'groupId'], 'LINKAGE_KEYS')) {
      const { status, groupId } = item.patientLinkage;
      if (!((status === 'unknown' && groupId === null) || (status === 'confirmed' && id('group', groupId)))) fail('LINKAGE_STATUS');
    }
    if (!Array.isArray(item.assets) || !item.assets.length) fail('ASSETS_REQUIRED');
    else for (const asset of item.assets) {
      if (!keys(asset, ['assetId', 'ref', 'sha256', 'view', 'laterality'], 'ASSET_KEYS')) continue;
      uniqueId('asset', asset.assetId, assetIds, 'ASSET_ID');
      if (typeof asset.ref !== 'string' || !/^assets\/[a-f0-9]{16,64}\.(png|jpg|jpeg|webp)$/.test(asset.ref)) fail('ASSET_REF');
      if (typeof asset.sha256 !== 'string' || !HEX.test(asset.sha256)) fail('ASSET_HASH');
      if (!textOrNull(asset.view) || !textOrNull(asset.laterality)) fail('ASSET_FIELDS_UNRESOLVED_EXPLICIT');
    }
    if (keys(item.fields, ['findings', 'answer', 'rationale', 'region', 'laterality', 'difficulty'], 'FIELDS_KEYS')) {
      if (Object.values(item.fields).some(value => !textOrNull(value))) fail('FIELDS_UNRESOLVED_EXPLICIT');
    }
    if (!Array.isArray(item.questions)) fail('QUESTIONS_ARRAY');
    else for (const question of item.questions) {
      if (!keys(question, ['questionId', 'prompt', 'answer', 'rationale', 'maxMarks', 'criteria'], 'QUESTION_KEYS')) continue;
      uniqueId('question', question.questionId, questionIds, 'QUESTION_ID');
      if (['prompt', 'answer', 'rationale'].some(key => !textOrNull(question[key]))) fail('QUESTION_UNRESOLVED_EXPLICIT');
      if (!Number.isSafeInteger(question.maxMarks) || question.maxMarks <= 0) fail('QUESTION_MARKS');
      if (!Array.isArray(question.criteria) || !question.criteria.length) fail('CRITERIA_REQUIRED');
      else {
        let total = 0;
        for (const criterion of question.criteria) {
          if (!keys(criterion, ['label', 'maxMarks'], 'CRITERION_KEYS')) continue;
          if (typeof criterion.label !== 'string' || !criterion.label.trim()) fail('CRITERION_LABEL');
          if (!Number.isSafeInteger(criterion.maxMarks) || criterion.maxMarks <= 0) fail('CRITERION_MARKS');
          total += criterion.maxMarks;
        }
        if (!Number.isSafeInteger(total) || total !== question.maxMarks) fail('CRITERIA_SUM');
      }
    }
  }
  if (keys(exam.reviews, ['clinical', 'privacy', 'reuse'], 'REVIEW_GATES')) {
    for (const gate of ['clinical', 'privacy', 'reuse']) {
      const review = exam.reviews[gate];
      if (!keys(review, ['status', 'evidence'], 'REVIEW_KEYS')) continue;
      if (review.status === 'pending') {
        if (review.evidence !== null) fail('PENDING_EVIDENCE');
      } else if (review.status === 'recorded') {
        if (keys(review.evidence, ['revision', 'reviewerRef', 'reviewedAt'], 'EVIDENCE_KEYS')) {
          if (!revision || review.evidence.revision !== revision) fail('STALE_REVIEW');
          if (!id('reviewer', review.evidence.reviewerRef)) fail('REVIEWER_REF');
          const time = review.evidence.reviewedAt;
          if (typeof time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(time) || !Number.isFinite(Date.parse(time)) || new Date(time).toISOString() !== time) fail('REVIEW_TIME');
        }
      } else fail('REVIEW_STATUS');
    }
  }
  return { ok: errors.length === 0, errors: [...new Set(errors)], revision };
}

export function assertDraftExam(exam) {
  const result = validateDraftExam(exam);
  if (!result.ok) throw new Error(`Invalid private exam draft: ${result.errors.join(', ')}`);
  return result;
}

/** Unknown linkage cannot certify a split, even when bytes and opaque case IDs differ. */
export function checkTeachingAssessmentSplit(teaching, assessment) {
  const errors = [];
  const t = validateDraftExam(teaching), a = validateDraftExam(assessment);
  if (!t.ok || !a.ok) return { ok: false, errors: ['INVALID_SPLIT_INPUT'] };
  if (teaching.scope.purpose !== 'teaching' || assessment.scope.purpose !== 'assessment') errors.push('SPLIT_PURPOSE');
  const all = [...teaching.cases, ...assessment.cases];
  if (all.some(item => item.patientLinkage.status !== 'confirmed')) errors.push('UNKNOWN_PATIENT_LINKAGE');
  const groups = new Set(teaching.cases.filter(item => item.patientLinkage.status === 'confirmed').map(item => item.patientLinkage.groupId));
  const hashes = new Set(teaching.cases.flatMap(item => item.assets.map(asset => asset.sha256)));
  const cases = new Set(teaching.cases.map(item => item.caseId));
  if (assessment.cases.some(item => groups.has(item.patientLinkage.groupId))) errors.push('PATIENT_GROUP_OVERLAP');
  if (assessment.cases.some(item => item.assets.some(asset => hashes.has(asset.sha256)))) errors.push('IMAGE_HASH_OVERLAP');
  if (assessment.cases.some(item => cases.has(item.caseId))) errors.push('CASE_ID_OVERLAP');
  return { ok: errors.length === 0, errors };
}
