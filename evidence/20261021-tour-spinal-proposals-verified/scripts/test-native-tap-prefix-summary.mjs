import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeTapPrefix } from './native-tap-prefix-summary.mjs';

test('root results exclude nested markers and assertion payloads; incomplete failure is explicit', () => {
  const result = summarizeTapPrefix(`TAP version 13
    ok 1 - nested child
ok 1 - first root
  ---
  duration_ms: 4.5
  type: 'test'
  ...
not ok 2 - second root
  ---
  duration_ms: 21
  location: 'F:\\\\VisibleMedicine\\\\staging\\\\website\\\\tests\\\\example.test.ts:19:1'
  expected: PRIVATE_ASSERTION_VALUE
  actual: PRIVATE_ASSERTION_VALUE
  ...
not ok 3 - still writing
  ---
  duration_ms: 2
`);
  assert.equal(result.rootResultMarkers, 3);
  assert.equal(result.completedRootDiagnostics, 2);
  assert.equal(result.incompleteRootDiagnostics, 1);
  assert.equal(result.failureMarkers, 2);
  assert.equal(result.failures[0].file, 'tests/example.test.ts');
  assert.equal(result.failures[0].line, 19);
  assert.equal(result.failures[1].complete, false);
  assert.equal(result.longestCompletedCases[0].number, 2);
  assert(!JSON.stringify(result).includes('PRIVATE_ASSERTION_VALUE'));
});

test('passing-looking footer never becomes a terminal receipt or exposes foreign location', () => {
  const result = summarizeTapPrefix(`ok 1 - synthetic pass
  ---
  duration_ms: 1
  location: 'C:/private/arbitrary-file:9:1'
  ...
1..1
# tests 1
# pass 1
# fail 0
`);
  assert.equal(result.fullSuitePassingClaim, false);
  assert.equal(result.terminalCounts, null);
  assert.equal(result.longestCompletedCases[0].file, null);
  assert.equal(result.longestCompletedCases[0].line, null);
  assert.deepEqual(result.failures, []);
});

test('traversal locations are not retained and skipped markers are not called passes', () => {
  const result = summarizeTapPrefix(`ok 1 - unavailable platform # SKIP
  ---
  duration_ms: 0.5
  location: 'F:/some/website/tests/../../private:3:1'
  ...
`);
  assert.equal(result.longestCompletedCases[0].outcome, 'ok-marker');
  assert.equal(result.longestCompletedCases[0].file, null);
  assert.equal(result.longestCompletedCases[0].line, null);
  assert.equal(result.fullSuitePassingClaim, false);
});
