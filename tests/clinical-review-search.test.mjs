import assert from 'node:assert/strict';
import test from 'node:test';
import { createReviewSearchMatcher, reviewSearchTerms } from '../lib/clinical-review-search.ts';

const row = (title, scopeLabel = '', trackLabel = '') => ({ title, scopeLabel, trackLabel });

test('query normalization keeps the existing Unicode and FMA display-label rules', () => {
  assert.deepEqual(reviewSearchTerms('  CRÈME—Βήτα  '), ['creme', 'βητα']);
  assert.deepEqual(reviewSearchTerms("O'Brian O’Neil OʼConnor FMA123 FMA  456"),
    ['obrian', 'oneil', 'oconnor', 'fma', '123', 'fma', '456']);
  assert.deepEqual(reviewSearchTerms(''), []);
  assert.deepEqual(reviewSearchTerms('!?—'), []);
});

test('every query term must occur in the combined display label', () => {
  const matches = createReviewSearchMatcher();
  const item = row('Left O’Brien', 'Visible Anatomy', 'FMA123');
  assert.equal(matches(item, reviewSearchTerms('left visible FMA 123')), true);
  assert.equal(matches(item, reviewSearchTerms('left right')), false);
  assert.equal(matches(item, reviewSearchTerms('!?—')), true);
  assert.equal(matches(item, []), true);
});

test('object identity prevents same-key and replacement-row cache reuse', () => {
  const matches = createReviewSearchMatcher();
  const first = { key: 'shared', ...row('Original', 'Scope', 'Track') };
  const other = { key: 'shared', ...row('Changed', 'Scope', 'Track') };
  const replacement = { ...first };
  assert.equal(matches(first, ['original']), true);
  assert.equal(matches(other, ['original']), false);
  assert.equal(matches(other, ['changed']), true);
  assert.equal(matches(replacement, ['original']), true);
  assert.equal(matches({ ...replacement, title: 'New account' }, ['original']), false);
});

test('all three label mutations invalidate an existing object cache', () => {
  const matches = createReviewSearchMatcher();
  const item = row('Title A', 'Scope A', 'Track A');
  assert.equal(matches(item, ['title a', 'scope a', 'track a']), true);
  item.title = 'Title B';
  assert.equal(matches(item, ['title a']), false);
  assert.equal(matches(item, ['title b']), true);
  item.scopeLabel = 'Scope B';
  assert.equal(matches(item, ['scope a']), false);
  assert.equal(matches(item, ['scope b']), true);
  item.trackLabel = 'Track B';
  assert.equal(matches(item, ['track a']), false);
  assert.equal(matches(item, ['track b']), true);
});

test('normalization happens once per unchanged row in each matcher instance', () => {
  const original = String.prototype.normalize;
  let calls = 0;
  String.prototype.normalize = function (...args) {
    calls++;
    return original.apply(this, args);
  };
  try {
    const item = row('Title', 'Scope', 'Track');
    const matches = createReviewSearchMatcher();
    assert.equal(matches(item, ['title']), true);
    assert.equal(matches(item, ['scope']), true);
    assert.equal(matches(item, []), true);
    assert.equal(calls, 1);
    item.trackLabel = 'Changed';
    assert.equal(matches(item, ['changed']), true);
    assert.equal(calls, 2);
    const secondInstance = createReviewSearchMatcher();
    assert.equal(secondInstance(item, ['changed']), true);
    assert.equal(calls, 3);
  } finally {
    String.prototype.normalize = original;
  }
});
