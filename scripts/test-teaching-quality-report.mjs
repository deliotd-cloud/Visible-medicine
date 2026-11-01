import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTeachingQualityReport } from './teaching-quality-report.mjs';

const draft = (changes = {}) => ({ readiness: 'draft', title: 'Landmark', body: 'Describe the landmark.',
  bullets: ['First', 'Second'], citations: ['https://example.org/reference'], ...changes });
const row = (identity, topic = 'anatomy', lesson = draft(), region = 'head') => ({ identity, region, topic, lesson });
const report = lessons => buildTeachingQualityReport({ lessons, sourceRevision: 'source-r1' });

test('clean draft and every non-draft readiness stay distinct', () => {
  const result = report([
    row('a'), row('b', 'anatomy', { readiness: 'pending' }),
    row('c', 'quiz', { readiness: 'identity-only' }),
    row('d', 'quiz', { readiness: 'generated-identification' }),
  ]);
  assert.deepEqual(result.totals, { draft: 1, 'identity-only': 1, pending: 1, 'generated-identification': 1 });
  assert.equal(result.issueCount, 0);
  assert.equal(result.byTopic.quiz.draft, 0);
  assert.match(result.limitation, /not fetched/);
});

test('draft citation and placeholder checks identify fields without copying text', () => {
  const result = report([row('a', 'anatomy', draft({
    title: 'TODO title', body: 'TBD body', bullets: ['FIXME option', 'Second'],
    citations: ['ftp://example.org/a', 'https://', 'https://example.org/okay'],
  })), row('b', 'anatomy', draft({ citations: [] })), row('c', 'anatomy', draft({ citations: undefined }))]);
  assert.deepEqual(result.issues.map(({ identity, field, code }) => [identity, field, code]), [
    ['a', 'body', 'placeholder'], ['a', 'bullets[0]', 'placeholder'],
    ['a', 'citations[0]', 'malformed-citation'], ['a', 'citations[1]', 'malformed-citation'],
    ['a', 'title', 'placeholder'], ['b', 'citations', 'missing-citations'],
    ['c', 'citations', 'missing-citations'],
  ]);
  assert(!JSON.stringify(result).includes('ftp://example.org/a'));
});

test('quiz answer must match exactly one bullet and duplicate options are conservatively normalized', () => {
  const result = report([
    row('missing', 'quiz', draft({ bullets: ['Answer: First', 'Think about the source.'], correctAnswer: undefined })),
    row('wrong', 'quiz', draft({ correctAnswer: 'Third' })),
    row('duplicate', 'quiz', draft({ bullets: ['First', '  first  ', 'Second'], correctAnswer: 'First' })),
    row('valid', 'quiz', draft({ correctAnswer: 'First' })),
  ]);
  assert.deepEqual(result.issues.map(({ identity, field, code }) => [identity, field, code]), [
    ['duplicate', 'lesson.bullets', 'duplicate-quiz-options'],
    ['missing', 'lesson.correctAnswer', 'quiz-without-scoring-key'],
    ['wrong', 'lesson.correctAnswer', 'quiz-answer-not-unique-option'],
  ]);
});

test('nested formative checks are checked but do not alter the main repetition key', () => {
  const additionalChecks = [{ body: 'TODO verify', bullets: ['A', ' a '], correctAnswer: 'missing', citations: [] }];
  const result = report([row('a', 'anatomy', draft({ additionalChecks }))]);
  assert.deepEqual(result.issues.map(({ field, code }) => [field, code]), [
    ['additionalChecks[0].body', 'placeholder'],
    ['additionalChecks[0].bullets', 'duplicate-quiz-options'],
    ['additionalChecks[0].citations', 'missing-citations'],
    ['additionalChecks[0].correctAnswer', 'quiz-answer-not-unique-option'],
  ]);
});

test('repetition flags three distinct identities within one topic, not shared notes or titles', () => {
  const common = { body: '  Same  BODY ', bullets: ['A  B', 'C'] };
  const result = report([
    row('a', 'anatomy', draft({ ...common, title: 'One', note: 'Repeated note' })),
    row('b', 'anatomy', draft({ body: 'same body', bullets: ['a b', 'c'], title: 'Two', note: 'Repeated note' })),
    row('c', 'anatomy', draft({ body: 'Same body', bullets: ['A B', 'C'], title: 'Three', note: 'Different note' })),
    row('d', 'function', draft({ ...common, note: 'Repeated note' })),
    row('e', 'function', draft({ body: 'Unique body', bullets: ['A B', 'C'], note: 'Repeated note' })),
  ]);
  assert.deepEqual(result.repetitions, [{ topic: 'anatomy', identities: ['a', 'b', 'c'], reviewOnly: true }]);
  assert.equal(result.issueCount, 0);
});

test('invalid structure, readiness and duplicate placement fail explicitly', () => {
  assert.throws(() => buildTeachingQualityReport({ lessons: [], sourceRevision: ' ' }), /sourceRevision/);
  assert.throws(() => buildTeachingQualityReport({ lessons: null, sourceRevision: 'x' }), /lessons must be an array/);
  assert.throws(() => report([null]), /must be an object/);
  assert.throws(() => report([row('', 'anatomy')]), /identity/);
  assert.throws(() => report([row('a', '', draft())]), /topic/);
  assert.throws(() => report([row('a', 'anatomy', { readiness: 'approved' })]), /known readiness/);
  assert.throws(() => report([row('a'), row('a')]), /duplicate identity\/topic/);
  assert.throws(() => report([row('a', 'anatomy', draft({ bullets: 'wrong' }))]), /bullets must be a string array/);
  assert.throws(() => report([row('a', 'anatomy', draft({ citations: 'https://example.org' }))]), /citations must be an array/);
});

test('report order is deterministic and input is never mutated', () => {
  const lessons = [row('z', 'function', draft({ note: 'Same note' }), 'torso'), row('a', 'anatomy', draft()), row('b', 'anatomy', draft())];
  const before = structuredClone(lessons);
  const one = report(lessons);
  const two = report([...lessons].reverse());
  assert.deepEqual(one, two);
  assert.deepEqual(lessons, before);
  assert.deepEqual(Object.keys(one.byTopic), ['anatomy', 'function']);
});
