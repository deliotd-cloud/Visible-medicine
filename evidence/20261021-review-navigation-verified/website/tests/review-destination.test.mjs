import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { optionalReviewAvailability, reviewDestination, reviewDestinationActive } from '../lib/review-destination.ts';

const source = path => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');

test('authorized reviewer receives only a direct review destination', async () => {
  const available = await optionalReviewAvailability(true, async () => ({ storageKey: 'never passed to client' }));
  assert.equal(available, true);
  assert.deepEqual(reviewDestination(true, available), {
    href: '/workspace/clinical-review-inbox',
    label: 'Clinical Review',
    description: 'Outstanding anatomy and teaching reviews',
  });
});

test('anonymous visitor never invokes optional review authorization', async () => {
  let calls = 0;
  const available = await optionalReviewAvailability(false, async () => { calls++; });
  assert.equal(calls, 0);
  assert.equal(available, false);
  assert.equal(reviewDestination(false, true).href, '/workspace');
});

test('unauthorized account and unavailable storage retain the workspace fallback', async () => {
  for (const message of ['403 unauthorized', '503 storage unavailable']) {
    const available = await optionalReviewAvailability(true, async () => { throw new Error(message); });
    assert.equal(available, false);
    assert.equal(reviewDestination(true, available).href, '/workspace');
  }
});

test('availability is rechecked after revocation and malformed hints stay closed', async () => {
  let allowed = true, calls = 0;
  const authorize = async () => { calls++; if (!allowed) throw new Error('revoked'); };
  assert.equal(await optionalReviewAvailability(true, authorize), true);
  allowed = false;
  assert.equal(await optionalReviewAvailability(true, authorize), false);
  assert.equal(calls, 2);
  for (const value of [undefined, null, 'true', 1, {}, []]) {
    assert.equal(reviewDestination(true, value).href, '/workspace');
    assert.equal(await optionalReviewAvailability(value, authorize), false);
  }
  assert.equal(calls, 2);
});

test('current-page marker distinguishes review, administration and Studio', () => {
  const review = '/workspace/clinical-review-inbox';
  assert.equal(reviewDestinationActive(review, review), true);
  assert.equal(reviewDestinationActive('/workspace/atlas-review/model', review), true);
  assert.equal(reviewDestinationActive('/workspace/review-candidates', review), true);
  assert.equal(reviewDestinationActive(review, '/workspace'), false);
  assert.equal(reviewDestinationActive('/workspace', '/workspace'), true);
  assert.equal(reviewDestinationActive('/studio/workspace', review), false);
});

test('component wiring keeps Review direct, Administration secondary and server guard separate', () => {
  const layout = source('app/layout.tsx');
  const header = source('components/SiteHeader.tsx');
  const frame = source('components/SiteFrame.tsx');
  assert.match(layout, /optionalReviewAvailability\(signedIn, authorizeClinicalReview\)/);
  assert.match(layout, /<SiteFrame signedIn=\{signedIn\} reviewAvailable=\{reviewAvailable\}/);
  assert.match(header, /href=\{destination\.href\}/);
  assert.match(header, /reviewDestinationActive\(pathname, destination\.href\)/);
  assert.match(header, /reviewAvailable && <Link[^>]*href="\/workspace"/);
  assert.match(frame, /href=\{destination\.href\}>\{destination\.label\}/);
  assert.match(frame, /reviewAvailable && <Link[^>]*href="\/workspace">Administration/);
});
