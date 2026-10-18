import test from 'node:test';
import assert from 'node:assert/strict';
import { revisionDigest, validateDraftExam, assertDraftExam, checkTeachingAssessmentSplit } from './contract.mjs';

const h = digit => digit.repeat(64);
const opaque = (kind, digit) => `${kind}_${digit.repeat(24)}`;
function fixture(purpose = 'assessment', digit = 'a') {
  return {
    schemaVersion: 1, examId: opaque('exam', digit), lifecycle: 'private-draft',
    scope: { purpose, audience: 'private-review', integration: 'didanix-education-light', mode: 'revision', durationMinutes: null },
    cases: [{
      caseId: opaque('case', digit), sourceEvidenceSha256: h(digit),
      patientLinkage: { status: 'confirmed', groupId: opaque('group', digit) },
      assets: [{ assetId: opaque('asset', digit), ref: `assets/${digit.repeat(24)}.png`, sha256: h(digit), view: null, laterality: null }],
      fields: { findings: null, answer: null, rationale: null, region: null, laterality: null, difficulty: null },
      questions: [{ questionId: opaque('question', digit), prompt: null, answer: null, rationale: null, maxMarks: 2, criteria: [{ label: 'Pending human authoring', maxMarks: 2 }] }],
    }],
    reviews: Object.fromEntries(['clinical', 'privacy', 'reuse'].map(gate => [gate, { status: 'pending', evidence: null }])),
  };
}
function record(exam, gate = 'clinical') {
  exam.reviews[gate] = { status: 'recorded', evidence: { revision: revisionDigest(exam), reviewerRef: opaque('reviewer', 'e'), reviewedAt: '2026-09-28T10:00:00.000Z' } };
  return exam;
}
function rejects(mutator, code) {
  const draft = fixture(); mutator(draft);
  const result = validateDraftExam(draft);
  assert.equal(result.ok, false);
  if (code) assert.ok(result.errors.includes(code), `${code}: ${result.errors}`);
}

test('valid private unresolved draft remains unchanged and requires no invented answers', () => {
  const draft = fixture(), before = JSON.stringify(draft);
  assert.equal(assertDraftExam(draft).ok, true);
  assert.equal(JSON.stringify(draft), before);
  assert.equal(draft.cases[0].questions[0].answer, null);
});

test('revision canonically binds exact content without depending on object key order', () => {
  const draft = fixture();
  const reorder = value => Array.isArray(value) ? value.map(reorder) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reorder(item)])) : value;
  assert.equal(revisionDigest(draft), revisionDigest(reorder(draft)));
  assert.equal(revisionDigest(draft).length, 64);
  assert.equal(revisionDigest(draft), revisionDigest(record(structuredClone(draft))));
});

test('each independent review event must bind its own current revision', () => {
  const draft = record(fixture(), 'clinical');
  assert.equal(validateDraftExam(draft).ok, true);
  assert.equal(draft.reviews.privacy.status, 'pending');
  assert.equal(draft.reviews.reuse.status, 'pending');
  record(draft, 'privacy'); record(draft, 'reuse');
  draft.reviews.privacy.evidence.revision = h('f');
  assert.deepEqual(validateDraftExam(draft).errors, ['STALE_REVIEW']);
});

test('array order is exam content and stale review cannot survive reordered cases or questions', () => {
  const draft = fixture();
  draft.cases.push(fixture('assessment', 'b').cases[0]);
  draft.cases[0].questions.push(fixture('assessment', 'c').cases[0].questions[0]);
  record(draft);
  const casesReordered = structuredClone(draft);
  casesReordered.cases.reverse();
  assert.ok(validateDraftExam(casesReordered).errors.includes('STALE_REVIEW'));
  const questionsReordered = structuredClone(draft);
  questionsReordered.cases[0].questions.reverse();
  assert.ok(validateDraftExam(questionsReordered).errors.includes('STALE_REVIEW'));
});

test('all case/question/asset/scope and private-source mutations invalidate review', () => {
  const mutations = [
    x => x.examId = opaque('exam', 'b'),
    x => x.scope.purpose = 'teaching',
    x => x.scope.mode = 'timed',
    x => x.scope.durationMinutes = 20,
    x => x.cases[0].caseId = opaque('case', 'b'),
    x => x.cases[0].sourceEvidenceSha256 = h('b'),
    x => x.cases[0].patientLinkage.groupId = opaque('group', 'b'),
    ...['findings', 'answer', 'rationale', 'region', 'laterality', 'difficulty'].map(key => x => x.cases[0].fields[key] = 'Human draft entry'),
    x => x.cases[0].assets[0].assetId = opaque('asset', 'b'),
    x => x.cases[0].assets[0].ref = `assets/${'b'.repeat(24)}.png`,
    x => x.cases[0].assets[0].sha256 = h('b'),
    x => x.cases[0].assets[0].view = 'Human draft entry',
    x => x.cases[0].assets[0].laterality = 'Human draft entry',
    x => x.cases[0].questions[0].questionId = opaque('question', 'b'),
    ...['prompt', 'answer', 'rationale'].map(key => x => x.cases[0].questions[0][key] = 'Human draft entry'),
    x => { x.cases[0].questions[0].maxMarks = 3; x.cases[0].questions[0].criteria[0].maxMarks = 3; },
    x => x.cases[0].questions[0].criteria[0].label = 'Changed human rubric',
    x => x.cases[0].questions = [],
    x => x.cases.push(fixture('assessment', 'b').cases[0]),
  ];
  for (const mutation of mutations) {
    const draft = record(record(record(fixture(), 'clinical'), 'privacy'), 'reuse');
    const original = revisionDigest(draft); mutation(draft);
    assert.notEqual(revisionDigest(draft), original);
    assert.ok(validateDraftExam(draft).errors.includes('STALE_REVIEW'));
  }
});

test('schema prevents clinical/production promotion and rejects unknown identity fields', () => {
  for (const status of ['approved', 'published', 'active', 'production']) {
    rejects(x => x.lifecycle = status, 'DRAFT_ONLY');
    rejects(x => x.reviews.clinical.status = status, 'REVIEW_STATUS');
  }
  rejects(x => x.approved = true, 'EXAM_KEYS');
  rejects(x => x.cases[0].patientName = 'SYNTHETIC PRIVATE SENTINEL', 'CASE_KEYS');
  rejects(x => x.scope.audience = 'public', 'PRIVATE_ONLY');
  rejects(x => x.scope.integration = 'clinical-pacs', 'EDUCATION_ONLY');
  rejects(x => x.schemaVersion = 2, 'SCHEMA_VERSION');
});

test('opaque asset references reject traversal, remote URLs and source identities', () => {
  for (const ref of ['../patient.png', 'assets/../../patient.png', 'C:\\private\\patient.png', 'https://example.org/patient.png', 'assets/patient-jane.png', `assets/${'a'.repeat(24)}.png?token=secret`, `assets/${'a'.repeat(24)}.svg`]) {
    rejects(x => x.cases[0].assets[0].ref = ref, 'ASSET_REF');
  }
  rejects(x => x.cases[0].caseId = 'case_patient-jane', 'CASE_ID');
  rejects(x => x.cases[0].patientLinkage.groupId = 'group_patient-jane', 'LINKAGE_STATUS');
  rejects(x => x.cases[0].assets[0].sha256 = 'not-a-hash', 'ASSET_HASH');
  rejects(x => x.cases[0].sourceEvidenceSha256 = null, 'SOURCE_EVIDENCE_HASH');
});

test('required unknown values use explicit null; malformed JSON, duplicate IDs and empty assets fail', () => {
  rejects(x => delete x.cases[0].fields.answer, 'FIELDS_KEYS');
  rejects(x => x.cases[0].fields.answer = '', 'FIELDS_UNRESOLVED_EXPLICIT');
  rejects(x => x.cases[0].questions[0].answer = undefined, 'NON_JSON_PAYLOAD');
  rejects(x => x.cases[0].fields.answer = NaN, 'NON_JSON_PAYLOAD');
  rejects(x => x.cases[0].assets = [], 'ASSETS_REQUIRED');
  rejects(x => x.cases = [], 'CASES_REQUIRED');
  rejects(x => x.cases.push(structuredClone(x.cases[0])), 'CASE_ID');
  rejects(x => x.cases[0].assets.push(structuredClone(x.cases[0].assets[0])), 'ASSET_ID');
  rejects(x => x.cases[0].questions.push(structuredClone(x.cases[0].questions[0])), 'QUESTION_ID');
});

test('marks must be positive integers and rubric sum must match', () => {
  for (const marks of [0, -1, 0.5, Infinity, '2']) rejects(x => x.cases[0].questions[0].maxMarks = marks, 'QUESTION_MARKS');
  rejects(x => x.cases[0].questions[0].criteria[0].maxMarks = 1, 'CRITERIA_SUM');
  rejects(x => x.cases[0].questions[0].criteria = [], 'CRITERIA_REQUIRED');
  rejects(x => x.cases[0].questions[0].criteria[0].maxMarks = -1, 'CRITERION_MARKS');
});

test('timed scope requires valid duration and human review evidence is strict', () => {
  rejects(x => x.scope.mode = 'timed', 'TIMED_DURATION_REQUIRED');
  rejects(x => x.scope.durationMinutes = 0, 'SCOPE_DURATION');
  rejects(x => x.reviews.clinical.evidence = {}, 'PENDING_EVIDENCE');
  rejects(x => x.reviews.clinical.status = 'recorded', 'EVIDENCE_KEYS');
  const draft = record(fixture());
  draft.reviews.clinical.evidence.reviewedAt = '2026-02-30T10:00:00.000Z';
  assert.ok(validateDraftExam(draft).errors.includes('REVIEW_TIME'));
});

test('split accepts confirmed distinct patient groups and image bytes', () => {
  assert.deepEqual(checkTeachingAssessmentSplit(fixture('teaching', 'a'), fixture('assessment', 'b')), { ok: true, errors: [] });
});

test('split fails closed for unknown linkage, even with different images and case IDs', () => {
  for (const side of ['teaching', 'assessment']) {
    const teaching = fixture('teaching', 'a'), assessment = fixture('assessment', 'b');
    (side === 'teaching' ? teaching : assessment).cases[0].patientLinkage = { status: 'unknown', groupId: null };
    assert.deepEqual(checkTeachingAssessmentSplit(teaching, assessment), { ok: false, errors: ['UNKNOWN_PATIENT_LINKAGE'] });
  }
  rejects(x => x.cases[0].patientLinkage = { status: 'unknown', groupId: opaque('group', 'b') }, 'LINKAGE_STATUS');
});

test('split rejects patient reuse across different images and byte reuse across distinct patients', () => {
  const teaching = fixture('teaching', 'a'), assessment = fixture('assessment', 'b');
  assessment.cases[0].patientLinkage.groupId = teaching.cases[0].patientLinkage.groupId;
  assert.ok(checkTeachingAssessmentSplit(teaching, assessment).errors.includes('PATIENT_GROUP_OVERLAP'));
  assessment.cases[0].patientLinkage.groupId = opaque('group', 'b');
  assessment.cases[0].assets[0].sha256 = teaching.cases[0].assets[0].sha256;
  assert.ok(checkTeachingAssessmentSplit(teaching, assessment).errors.includes('IMAGE_HASH_OVERLAP'));
});

test('split rejects same case identity and wrong purpose; invalid input cannot certify split', () => {
  const teaching = fixture('teaching', 'a'), assessment = fixture('assessment', 'b');
  assessment.cases[0].caseId = teaching.cases[0].caseId;
  assert.ok(checkTeachingAssessmentSplit(teaching, assessment).errors.includes('CASE_ID_OVERLAP'));
  assert.ok(checkTeachingAssessmentSplit(fixture(), fixture('assessment', 'b')).errors.includes('SPLIT_PURPOSE'));
  assert.deepEqual(checkTeachingAssessmentSplit(teaching, {}), { ok: false, errors: ['INVALID_SPLIT_INPUT'] });
});

test('validation and thrown errors never echo rejected private fields or filenames', () => {
  const draft = fixture();
  draft.cases[0].patientName = 'SYNTHETIC PRIVATE SENTINEL';
  draft.cases[0].assets[0].ref = 'C:\\SYNTHETIC PRIVATE SENTINEL.png';
  assert.ok(!JSON.stringify(validateDraftExam(draft)).includes('SYNTHETIC PRIVATE SENTINEL'));
  assert.throws(() => assertDraftExam(draft), error => !error.message.includes('SYNTHETIC PRIVATE SENTINEL'));
});
