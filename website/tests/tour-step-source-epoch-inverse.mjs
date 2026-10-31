import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fixtureBytes = readFileSync(new URL('./fixtures-tour-step-source-epoch.json', import.meta.url));
assert.equal(sha(fixtureBytes), '91dae7d2fede475ced4be910851319fb47213f6d38625ee38bfaaa68c57c6c66', 'Exact reviewed epoch edit ledger');
const fixture = JSON.parse(fixtureBytes);
assert.equal(fixture.schema, 'vm-tour-step-source-epoch-inverse/1');
const changedPaths = ['components/HeadAtlasLearningLibrary.tsx', 'scripts/bind-clinical-review.mjs', 'package.json', 'LICENSES/THIRD_PARTY_NOTICES.md'];
assert.deepEqual(Object.keys(fixture.rows), changedPaths);
// This immutable predecessor records the reviewed product epoch, not the test
// successor containing this helper. Actual current bytes are pinned below, so
// test-only successors do not require a circular self-referential receipt hash.
const receiptPath = 'F:/VisibleMedicine/recovery/checkpoints/20261031-release-scope-built/SOURCE.json';
const receiptBytes = readFileSync(receiptPath);
assert.equal(sha(receiptBytes), '54710c2197a88d4ebe9c4309b9efc0e6dcf60f2d963e2c10d3c7bbce69992a6b', 'Exact reviewed product-epoch receipt');
const receipt = JSON.parse(receiptBytes);
const lines = value => value.match(/[^\n]*\n|[^\n]+$/g) ?? [];

/** Invert only the reviewed intervening source edits, with both epoch receipts. */
export function restoreTourStepSourceEpoch(path, currentBytes, previousRow, previousRoot) {
  assert(changedPaths.includes(path), `Unexpected epoch path: ${path}`);
  const row = fixture.rows[path];
  assert.equal(previousRow.path, path);
  assert.equal(previousRow.sha256, row.previousSha256, `${path}: predecessor receipt`);
  const oldBytes = readFileSync(previousRoot + '/' + path);
  assert.equal(sha(oldBytes), row.previousSha256, `${path}: predecessor source`);
  const currentRow = receipt.sourceRows.find(item => item.path === path);
  assert(currentRow, `${path}: current source receipt row`);
  assert.equal(currentRow.sha256, row.currentSha256, `${path}: current receipt identity`);
  assert.equal(sha(currentBytes), row.currentSha256, `${path}: current source identity`);
  const previousLines = lines(oldBytes.toString('utf8'));
  const replay = previousLines.slice();
  for (const edit of [...row.edits].reverse()) {
    assert.deepEqual(replay.slice(edit.beforeLine, edit.beforeLine + edit.before.length), edit.before, `${path}: forward before seam`);
    replay.splice(edit.beforeLine, edit.before.length, ...edit.after);
  }
  assert.equal(sha(replay.join('')), row.currentSha256, `${path}: exact forward composition`);
  assert.equal(replay.join(''), currentBytes.toString('utf8'), `${path}: whole current composition`);
  const inverse = lines(currentBytes.toString('utf8'));
  for (const edit of [...row.edits].reverse()) {
    assert.deepEqual(inverse.slice(edit.afterLine, edit.afterLine + edit.after.length), edit.after, `${path}: inverse after seam`);
    inverse.splice(edit.afterLine, edit.after.length, ...edit.before);
  }
  assert.equal(inverse.join(''), oldBytes.toString('utf8'), `${path}: whole predecessor restoration`);
  assert.equal(sha(inverse.join('')), row.previousSha256, `${path}: exact predecessor identity`);
  return Buffer.from(inverse.join(''));
}
export const tourStepChangedPaths = Object.freeze(changedPaths);
