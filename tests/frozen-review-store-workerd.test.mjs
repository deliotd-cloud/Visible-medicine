import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
const root = fileURLToPath(new URL('../', import.meta.url));
const source = fileURLToPath(new URL('../lib/frozen-review-store.ts', import.meta.url));
const migration = readFileSync(new URL('../drizzle/0010_keen_ultron.sql', import.meta.url), 'utf8');
const bundled = await build({ entryPoints: [source], bundle: true, write: false,
  format: 'esm', platform: 'browser', logLevel: 'silent' });
const { latestFrozenReviews, frozenReviewHistory, appendFrozenReview } =
  await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

function fixture(version, { candidateId = 'a'.repeat(64), structureId = 'vm:test:synthetic',
  track = 'geometry', savedAt = '2026-10-18T12:00:00.000Z' } = {}) {
  return { schema: 'vm-frozen-body-review-event-1', candidateId, contextHash: 'c'.repeat(64),
    review: { status: 'draft', reviewer: '', qualification: '', scope: '', notes: '',
      checks: { identity: false }, evidence: [], issues: [], attested: false,
      eventSchema: 'vm-body-review-event-1', catalogScope: 'body-display-catalog', structureId,
      track, version, savedAt, reviewedAt: null, revisionHash: null,
      checklistVersion: 'synthetic-1', checklist: [{ id: 'identity', label: 'Synthetic check' }],
      material: { sourceHash: 'd'.repeat(64), teachingHash: 'e'.repeat(64),
        rendererHash: 'f'.repeat(64), materialHash: '1'.repeat(64), teachingTabs: [] } } };
}

async function ephemeralD1(label) {
  const mf = new Miniflare({ ...convertV4MiniflareOptions({ name: label, modules: true,
    script: 'export default { fetch() { return new Response("synthetic"); } };',
    compatibilityDate: '2026-08-23', host: '127.0.0.1', port: 0,
    d1Databases: { DB: label }, d1Persist: false }), telemetry: { enabled: false } });
  return { mf, db: await mf.getD1Database('DB') };
}

test('real migration and ephemeral D1 enforce append, paging, scoped identities and fail closed reads',
  { timeout: 30000 }, async () => {
    const { mf, db } = await ephemeralD1('frozen-review-store-synthetic');
    try {
      await db.prepare(migration.trim()).run();
      const account = 'institution-a:opaque-account-a';
      const secondAccount = 'institution-a:opaque-account-b';
      const otherInstitution = 'institution-b:opaque-account-a';
      const base = fixture(1);
      assert.equal(await appendFrozenReview(db, account, base, 0), true);
      assert.equal(await appendFrozenReview(db, account, base, 0), false);
      assert.deepEqual((await latestFrozenReviews(db, account, base.candidateId, base.review.structureId))
        .map(item => item.review.version), [1]);
      assert.equal(await appendFrozenReview(db, account, fixture(3), 2), false);
      const race = await Promise.all([appendFrozenReview(db, account, fixture(2), 1),
        appendFrozenReview(db, account, fixture(2), 1)]);
      assert.deepEqual(race.sort(), [false, true]);
      for (let version = 3; version <= 25; version++)
        assert.equal(await appendFrozenReview(db, account, fixture(version), version - 1), true);
      const page = await frozenReviewHistory(db, account, base.candidateId, base.review.structureId, 'geometry');
      assert.equal(page.length, 20);
      assert.deepEqual([page[0].review.version, page.at(-1).review.version], [25, 6]);
      const next = await frozenReviewHistory(db, account, base.candidateId, base.review.structureId,
        'geometry', page.at(-1).review.version);
      assert.deepEqual(next.map(item => item.review.version), [5, 4, 3, 2, 1]);

      const variants = [
        [secondAccount, fixture(1)],
        [otherInstitution, fixture(1)],
        [account, fixture(1, { candidateId: 'b'.repeat(64) })],
        [account, fixture(1, { structureId: 'vm:test:other' })],
        [account, fixture(1, { track: 'teaching' })],
      ];
      for (const [user, event] of variants) assert.equal(await appendFrozenReview(db, user, event, 0), true);
      assert.deepEqual((await latestFrozenReviews(db, account, base.candidateId, base.review.structureId))
        .map(item => item.review.track).sort(), ['geometry', 'teaching']);
      assert.equal((await frozenReviewHistory(db, secondAccount, base.candidateId,
        base.review.structureId, 'geometry')).length, 1);
      assert.equal((await frozenReviewHistory(db, otherInstitution, base.candidateId,
        base.review.structureId, 'geometry')).length, 1);
      assert.equal((await frozenReviewHistory(db, account, 'b'.repeat(64),
        base.review.structureId, 'geometry')).length, 1);
      assert.equal((await frozenReviewHistory(db, account, base.candidateId,
        'vm:test:other', 'geometry')).length, 1);
      assert.equal((await frozenReviewHistory(db, account, base.candidateId,
        base.review.structureId, 'teaching')).length, 1);
      await assert.rejects(appendFrozenReview(db, '', fixture(1), 0), /Invalid user key/);
      await assert.rejects(appendFrozenReview(db, account, fixture(2), 0), /Invalid append version/);
      await assert.rejects(frozenReviewHistory(db, account, base.candidateId,
        base.review.structureId, 'invalid'), /Invalid review track/);

      await db.prepare(`UPDATE atlas_candidate_review_events SET saved_at='2026-10-18T13:00:00.000Z'
        WHERE user_key=?1 AND candidate_id=?2 AND structure_id=?3 AND track='teaching'`)
        .bind(account, base.candidateId, base.review.structureId).run();
      await assert.rejects(latestFrozenReviews(db, account, base.candidateId, base.review.structureId),
        /payload does not match/);
      await assert.rejects(frozenReviewHistory(db, account, base.candidateId,
        base.review.structureId, 'teaching'), /payload does not match/);
    } finally { await mf.dispose(); }
  });

test('missing migration propagates D1 failure without creating a table', { timeout: 30000 }, async () => {
  const { mf, db } = await ephemeralD1('frozen-review-store-missing-schema');
  try {
    await assert.rejects(latestFrozenReviews(db, 'synthetic-user', 'a'.repeat(64),
      'vm:test:synthetic'), /no such table/i);
    await assert.rejects(appendFrozenReview(db, 'synthetic-user', fixture(1), 0), /no such table/i);
    const table = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table'
      AND name='atlas_candidate_review_events'`).first();
    assert.equal(table, null);
  } finally { await mf.dispose(); }
});
