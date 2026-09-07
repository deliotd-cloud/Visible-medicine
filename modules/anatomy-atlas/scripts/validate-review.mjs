import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({
  stdin: {
    contents:
      "export * from './lib/review-workspace'; export * from './lib/review-store'; export * from './lib/review-http';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const api = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);
const { structures } = await import('../app/anatomy-data.ts');
let checks = 0;
const ok = (value, message) => {
  assert.ok(value, message);
  checks++;
};
for (const s of structures)
  for (const track of api.tracks) {
    const draft = api.blankReview(s.id, track);
    ok(
      api.validateDraft(draft, s.id, track).status === 'draft',
      'Empty draft accepted',
    );
    ok(
      api.approvalProblems(draft, s.id, track).length > 0,
      'Incomplete approval blocked',
    );
    assert.throws(() =>
      api.validateDraft({ ...draft, status: 'approved' }, s.id, track),
    );
    checks++;
    ok(
      api.checklist(s.id, track).length >= 5,
      'Structure-specific checklist present',
    );
    ok(
      track === 'imaging'
        ? api.currentRevision(s.id, track) === null
        : /^[a-f0-9]{64}$/.test(api.currentRevision(s.id, track)),
      'Material fingerprint',
    );
  }
const id = structures[0].id,
  track = 'geometry';
const draft = {
  ...api.blankReview(id, track),
  reviewer: 'SOFTWARE TEST — not a clinical review',
  qualification: 'Test fixture',
  scope: 'Synthetic test of review validation only',
  checks: Object.fromEntries(api.checklist(id, track).map((c) => [c.id, true])),
  evidence: [
    {
      title: 'Test source URL',
      url: 'https://example.com/reference',
      note: 'Validation fixture only',
    },
  ],
  attested: true,
};
ok(
  api.approvalProblems(draft, id, track).length === 0,
  'Complete fixture meets software gates',
);
ok(
  api.validateDraft({ ...draft, status: 'approved' }, id, track).status ===
    'approved',
  'Complete fixture accepted',
);
for (const patch of [
  { reviewer: '' },
  { qualification: '' },
  { scope: 'short' },
  { attested: false },
  { evidence: [] },
  { checks: { ...draft.checks, identity: false } },
  {
    issues: [
      {
        id: 'test-issue',
        title: 'Unresolved issue',
        severity: 'major',
        resolved: false,
        resolution: '',
      },
    ],
  },
]) {
  assert.throws(() =>
    api.validateDraft({ ...draft, status: 'approved', ...patch }, id, track),
  );
  checks++;
}
for (const url of [
  'javascript:alert(1)',
  'data:text/plain,hi',
  'http://example.com',
  'https://user:secret@example.com',
  'not a url',
]) {
  assert.throws(() =>
    api.validateDraft(
      { ...draft, evidence: [{ title: 'Invalid', url, note: '' }] },
      id,
      track,
    ),
  );
  checks++;
}
assert.throws(() =>
  api.validateDraft({ ...draft, notes: 'a'.repeat(6001) }, id, track),
);
checks++;
assert.throws(() =>
  api.validateDraft(
    { ...draft, checks: { ...draft.checks, extra: true } },
    id,
    track,
  ),
);
checks++;
assert.throws(() =>
  api.validateDraft(
    {
      ...draft,
      issues: [
        {
          id: 'x',
          title: 'Issue',
          severity: 'minor',
          resolved: true,
          resolution: '',
        },
      ],
    },
    id,
    track,
  ),
);
checks++;

const snapshot = {
  ...draft,
  status: 'approved',
  structureId: id,
  track,
  version: 1,
  savedAt: new Date().toISOString(),
  reviewedAt: new Date().toISOString(),
  revisionHash: api.currentRevision(id, track),
  checklistVersion: api.checklistVersion,
};
ok(!api.staleReview(snapshot), 'Current review not stale');
ok(
  api.staleReview({ ...snapshot, revisionHash: '0'.repeat(64) }),
  'Changed geometry invalidates approval',
);
ok(
  api.staleReview({ ...snapshot, checklistVersion: 'old' }),
  'Changed checklist invalidates approval',
);
ok(
  api.decisionLabel({ ...snapshot, revisionHash: '0'.repeat(64) }) ===
    'Re-review required',
  'Stale approval not shown as current',
);

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(
  await readFile(
    new URL('../drizzle/0000_shoulder_review_events.sql', import.meta.url),
    'utf8',
  ),
);
// D1 adapter around real SQLite; runtime SQL is imported unchanged from review-store.ts.
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async all() {
            return { results: sqlite.prepare(sql).all(...values) };
          },
          async run() {
            return {
              meta: {
                changes: Number(sqlite.prepare(sql).run(...values).changes),
              },
            };
          },
        };
      },
    };
  },
};
ok(await api.appendReview(db, 'test-user-a', snapshot, 0), 'First save');
ok(
  !(await api.appendReview(
    db,
    'test-user-a',
    { ...snapshot, notes: 'overwrite' },
    0,
  )),
  'Stale writer refused',
);
ok(
  await api.appendReview(
    db,
    'test-user-a',
    {
      ...snapshot,
      version: 2,
      status: 'draft',
      notes: 'New draft',
      reviewedAt: null,
    },
    1,
  ),
  'Next save appends',
);
ok(
  await api.appendReview(
    db,
    'test-user-b',
    { ...snapshot, notes: 'Other user' },
    0,
  ),
  'Separate user partition',
);
const latest = await api.latestReviews(db, 'test-user-a');
ok(
  latest.length === 1 &&
    latest[0].version === 2 &&
    latest[0].notes === 'New draft',
  'Latest query excludes other accounts and old snapshots',
);
const history = await api.reviewHistory(db, 'test-user-a', id, track);
ok(
  history.length === 2 && history[1].notes === snapshot.notes,
  'Original snapshot immutable',
);
ok(
  (await api.reviewHistory(db, 'test-user-a', id, track, 2)).length === 1,
  'History cursor',
);
ok(
  (await api.latestReviews(db, 'unknown-user')).length === 0,
  'No cross-user reads',
);
ok(
  (await api.reviewHistory(db, 'test-user-a', id, 'teaching')).length === 0,
  'No cross-track reads',
);
const race = await Promise.all([
  api.appendReview(db, 'test-user-a', { ...snapshot, version: 3 }, 2),
  api.appendReview(db, 'test-user-a', { ...snapshot, version: 3 }, 2),
]);
ok(race.filter(Boolean).length === 1, 'Only one competing save wins');
ok(
  sqlite
    .prepare(
      'EXPLAIN QUERY PLAN SELECT payload FROM review_events WHERE user_id=? AND structure_id=? AND track=? ORDER BY version DESC LIMIT 20',
    )
    .all('u', id, track)
    .some((r) => String(r.detail).includes('INDEX')),
  'History uses composite index',
);
// Exercise the actual API handlers against the same isolated SQLite adapter.
// The only substituted module is the deployment's environment binding.
globalThis.__reviewTestEnv = { DB: db };
const routeBundle = await build({
  entryPoints: [
    fileURLToPath(new URL('../app/api/reviews/route.ts', import.meta.url)),
  ],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  plugins: [
    {
      name: 'isolated-review-database',
      setup(builder) {
        builder.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
          path: 'env',
          namespace: 'review-test',
        }));
        builder.onLoad({ filter: /.*/, namespace: 'review-test' }, () => ({
          contents: 'export const env = globalThis.__reviewTestEnv;',
          loader: 'js',
        }));
      },
    },
  ],
});
const route = await import(
  `data:text/javascript;base64,${Buffer.from(routeBundle.outputFiles[0].text).toString('base64')}`
);
const routeRequest = (body, user = 'isolated-api-test') =>
  new Request('https://atlas.example/api/reviews', {
    method: body ? 'POST' : 'GET',
    headers: {
      'oai-authenticated-user-id': user,
      Origin: 'https://atlas.example',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const payload = {
  structureId: id,
  track,
  expectedVersion: 0,
  revisionHash: api.currentRevision(id, track),
  checklistVersion: api.checklistVersion,
  draft: api.blankReview(id, track),
};
ok(
  (await route.GET(new Request('https://atlas.example/api/reviews'))).status ===
    401,
  'Actual API rejects anonymous reads',
);
const firstSave = await route.POST(routeRequest(payload));
ok(firstSave.status === 201, 'Actual API persists a valid draft');
const persisted = (await firstSave.json()).review;
ok(
  persisted.version === 1 && persisted.reviewedAt === null,
  'Server stamps draft version without clinical approval',
);
const roundTrip = await (await route.GET(routeRequest())).json();
ok(
  roundTrip.reviews.length === 1 && roundTrip.reviews[0].version === 1,
  'API write/read round trip',
);
ok(
  (await (await route.GET(routeRequest(undefined, 'another-api-user'))).json())
    .reviews.length === 0,
  'Actual API isolates accounts',
);
ok(
  (await route.POST(routeRequest(payload))).status === 409,
  'Actual API rejects conflicting save',
);
ok(
  (
    await route.POST(
      routeRequest({ ...payload, expectedVersion: 1, revisionHash: 'stale' }),
    )
  ).status === 409,
  'Actual API rejects stale material',
);
ok(
  (
    await route.POST(
      routeRequest({
        ...payload,
        expectedVersion: 1,
        draft: { ...payload.draft, status: 'approved' },
      }),
    )
  ).status === 422,
  'Actual API blocks incomplete approval',
);
const issueDraft = {
  ...payload.draft,
  issues: [
    {
      id: 'fixture-issue',
      title: 'Synthetic test issue',
      severity: 'major',
      resolved: false,
      resolution: '',
    },
  ],
};
ok(
  (
    await route.POST(
      routeRequest({ ...payload, expectedVersion: 1, draft: issueDraft }),
    )
  ).status === 201,
  'Actual API records issue',
);
ok(
  (await route.POST(routeRequest({ ...payload, expectedVersion: 2 })))
    .status === 422,
  'Actual API preserves saved issues',
);
ok(
  (
    await route.POST(
      routeRequest({
        ...payload,
        expectedVersion: 2,
        draft: {
          ...issueDraft,
          issues: [
            {
              ...issueDraft.issues[0],
              resolved: true,
              resolution: 'Fixture resolution only',
            },
          ],
        },
      }),
    )
  ).status === 201,
  'Actual API accepts explained resolution',
);
const routeHistory = await (
  await route.GET(
    new Request(
      `https://atlas.example/api/reviews?history=1&structureId=${encodeURIComponent(id)}&track=${track}`,
      { headers: { 'oai-authenticated-user-id': 'isolated-api-test' } },
    ),
  )
).json();
ok(
  routeHistory.history.length === 3 &&
    routeHistory.history[1].issues[0].resolved === false,
  'Actual API history preserves unresolved earlier snapshot',
);
ok(
  (
    await route.POST(
      routeRequest({
        ...payload,
        track: 'imaging',
        revisionHash: null,
        draft: {
          ...draft,
          checks: Object.fromEntries(
            api.checklist(id, 'imaging').map((c) => [c.id, true]),
          ),
          status: 'approved',
        },
      }),
    )
  ).status === 422,
  'Actual API refuses absent-imaging approval',
);
sqlite.close();
delete globalThis.__reviewTestEnv;

assert.throws(() => api.authenticatedReviewer(new Headers()), /Sign in/);
checks++;
ok(
  api.authenticatedReviewer(
    new Headers({ 'oai-authenticated-user-id': 'account-a' }),
  ) === 'account-a',
  'Server identity used',
);
const request = (body, headers = {}) =>
  new Request('https://atlas.example/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://atlas.example',
      ...headers,
    },
    body,
  });
ok(
  (await api.reviewBody(request('{"test":true}'))).test,
  'Valid same-origin JSON accepted',
);
for (const r of [
  request('{}', { Origin: 'https://evil.example' }),
  request('{}', { 'Content-Type': 'text/plain' }),
  request('{oops'),
  request('x'.repeat(32001)),
  request('{}', { 'Sec-Fetch-Site': 'cross-site' }),
]) {
  await assert.rejects(() => api.reviewBody(r));
  checks++;
}
ok(
  api.reviewJson({}).headers.get('Cache-Control') === 'private, no-store',
  'Private responses not cached',
);
console.log(
  `PASS: ${checks} review checks — validation, approval gates, immutable history, user isolation, optimistic concurrency, revision expiry, CSRF and body limits.`,
);

if (process.argv.includes('--http')) {
  const base = 'http://localhost:3000';
  const anon = await fetch(`${base}/api/reviews`);
  ok(anon.status === 401, 'Anonymous API rejected');
  const auth = { Cookie: '__sites_local_auth=1' };
  const loaded = await fetch(`${base}/api/reviews`, { headers: auth });
  ok(loaded.status === 200, 'Authenticated local D1 read works');
  const invalid = await fetch(`${base}/api/reviews`, {
    method: 'POST',
    headers: { ...auth, Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structureId: id,
      track,
      expectedVersion: 0,
      revisionHash: api.currentRevision(id, track),
      checklistVersion: api.checklistVersion,
      draft: { ...draft, reviewer: '', status: 'approved' },
    }),
  });
  ok(
    invalid.status === 422,
    'HTTP rejects incomplete approval without writing',
  );
  const csrf = await fetch(`${base}/api/reviews`, {
    method: 'POST',
    headers: {
      ...auth,
      Origin: 'https://other.example',
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  ok(csrf.status === 403, 'HTTP rejects cross-origin save');
  console.log(
    'PASS: local HTTP identity, storage read, approval rejection and CSRF smoke checks. No HTTP test reviews created.',
  );
}
