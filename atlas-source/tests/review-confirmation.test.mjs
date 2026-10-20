import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewConfirmation, reviewIsConfirmed } from '../app/review/review-confirmation.ts';

const criteria = [{ id: 'geometry-a' }, { id: 'geometry-b' }];

test('confirmation sets only the active track criteria and attestation together', () => {
  const previous = { 'geometry-a': false, 'geometry-b': false, 'teaching-a': true };
  const confirmed = reviewConfirmation(previous, criteria, true);
  assert.deepEqual(confirmed, {
    checks: { 'geometry-a': true, 'geometry-b': true, 'teaching-a': true },
    attested: true,
  });
  assert.equal(previous['geometry-a'], false);
  assert.equal(reviewIsConfirmed(confirmed.checks, confirmed.attested, criteria), true);
  const cleared = reviewConfirmation(confirmed.checks, criteria, false);
  assert.deepEqual(cleared, {
    checks: { 'geometry-a': false, 'geometry-b': false, 'teaching-a': true },
    attested: false,
  });
});

test('a partial or unattested review never displays as confirmed', () => {
  assert.equal(reviewIsConfirmed({ 'geometry-a': true }, true, criteria), false);
  assert.equal(reviewIsConfirmed({ 'geometry-a': true, 'geometry-b': true }, false, criteria), false);
});
