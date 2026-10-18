import assert from 'node:assert/strict';
import test from 'node:test';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {
  createLectureAnatomyReference,
  lectureAnatomyOptions,
  resolveLectureAnatomyReference,
} from '../lib/lecture-anatomy-reference.ts';
import {
  LECTURE_ANATOMY_MATCH_LIMIT,
  lectureAnatomyTextMatches,
} from '../lib/lecture-anatomy-text-matches.ts';

test('literal current options keep source pins, option order, and detached output', () => {
  assert.equal(headLinksCurrent(), true);
  const options = lectureAnatomyOptions();
  assert(options.length > LECTURE_ANATOMY_MATCH_LIMIT);
  for (const option of options) {
    const reference = createLectureAnatomyReference(option.conceptId);
    assert(reference);
    assert(resolveLectureAnatomyReference(reference));
  }
  const input = options.map(option => option.label).join('; ');
  assert(input.length <= 5000);
  const result = lectureAnatomyTextMatches('', input);
  assert.deepEqual(result, {matches: options.slice(0, LECTURE_ANATOMY_MATCH_LIMIT), total: options.length});
  assert.equal(new Set(result.matches.map(match => match.conceptId)).size, result.matches.length);
  assert(result.matches.every(match => Object.keys(match).join(',') === 'conceptId,label'));
  result.matches[0].label = 'changed by caller';
  result.matches.push({conceptId: 'forged', label: 'Forged'});
  assert.deepEqual(lectureAnatomyTextMatches('', input), {
    matches: options.slice(0, LECTURE_ANATOMY_MATCH_LIMIT), total: options.length,
  });
});

test('canonical full labels match either field separately with Unicode punctuation and NFKC', () => {
  assert.deepEqual(lectureAnatomyTextMatches('PONS—medulla oblongata', 'Ｃｅｒｅｂｅｌｌａｒ ／ vermis'), {
    matches: lectureAnatomyOptions().filter(option => [
      'brainstem-pons', 'brainstem-medulla', 'cerebellum-vermis',
    ].includes(option.conceptId)), total: 3,
  });
  assert.deepEqual(lectureAnatomyTextMatches('Left lateral', 'ventricle'), {matches: [], total: 0});
  assert.deepEqual(lectureAnatomyTextMatches('corresponds', ''), {matches: [], total: 0});
  assert.deepEqual(lectureAnatomyTextMatches('Pons', 'pons'), {
    matches: [{conceptId: 'brainstem-pons', label: 'Pons'}], total: 1,
  });
});

test('laterality and image-only names require their exact labels', () => {
  const text = 'cerebellar hemisphere; left cerebellar hemisphere, right cerebellar hemisphere; cerebellar vermis';
  const result = lectureAnatomyTextMatches('', text);
  assert.deepEqual(result.matches, lectureAnatomyOptions().filter(option => [
    'cerebellum-left-hemisphere', 'cerebellum-right-hemisphere', 'cerebellum-vermis',
  ].includes(option.conceptId)));
  assert.equal(result.total, 3);
  assert.deepEqual(lectureAnatomyTextMatches('cerebellar hemisphere', ''), {matches: [], total: 0});
  assert.deepEqual(lectureAnatomyTextMatches('insula', ''), {matches: [], total: 0});
});

test('rejects untyped and oversized fields and never treats URLs as authority', () => {
  for (const [title, body] of [
    [null, 'Pons'], ['Pons', undefined], [12, 'Pons'], ['Pons', {}],
    ['Pons'.repeat(41), ''], ['', 'Pons'.repeat(1251)],
  ] as Array<[unknown, unknown]>) {
    assert.deepEqual(lectureAnatomyTextMatches(title, body), {matches: [], total: 0});
  }
  assert.deepEqual(lectureAnatomyTextMatches('', ''), {matches: [], total: 0});
  assert.deepEqual(lectureAnatomyTextMatches('https://example.invalid/atlas?concept=unknown', ''), {
    matches: [], total: 0,
  });
  const result = lectureAnatomyTextMatches('Pons', 'https://example.invalid/unsafe');
  assert.deepEqual(result, {matches: [{conceptId: 'brainstem-pons', label: 'Pons'}], total: 1});
  assert.equal(JSON.stringify(result).includes('http'), false);
  const stale = {...createLectureAnatomyReference('brainstem-pons')!, headRevision: 'a'.repeat(64)};
  assert.equal(resolveLectureAnatomyReference(stale), null);
  if (!headLinksCurrent()) assert.deepEqual(lectureAnatomyOptions(), []);
});
