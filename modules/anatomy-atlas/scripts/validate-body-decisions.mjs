import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({
  stdin: {
    contents:
      "export * from './lib/body-review-decisions'; export * from './lib/body-review-context'; export * from './lib/body-review-material'; export * from './lib/body-review-client'; export * from './lib/body-review-api'; export * from './lib/body-review-store';",
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
let contexts = 0;
for (const row of api.bodyReviewSummaries) {
  const c = await api.bodyReviewContext(row.id);
  assert.equal(c.structureId, row.id);
  assert.equal(c.catalogScope, 'body-display-catalog');
  assert.match(c.sourceHash, /^[a-f0-9]{64}$/);
  for (const track of api.bodyReviewTracks) {
    const blank = api.blankBodyReview(c, track);
    assert.deepEqual(
      api.validateBodyReviewDraft(blank, c.checklists[track]),
      blank,
    );
    assert(api.bodyApprovalProblems(blank, c, track).length);
    assert.equal(c.revisions[track] === null, track === 'imaging');
  }
  contexts++;
}
assert.equal(contexts, 1058);
assert.equal(await api.bodyReviewContext('not-anatomy'), null);
const id = 'vm:anatomy:upper-limb:shoulder:right:bone:scapula';
const c = await api.bodyReviewContext(id);
assert(c);
assert.equal(c.blockers.geometry.length, 0);
const fixture = {
  ...api.blankBodyReview(c, 'geometry'),
  reviewer: 'SOFTWARE TEST — not a clinical review',
  qualification: 'Test fixture',
  scope: 'Synthetic validation of software only',
  checks: Object.fromEntries(
    c.checklists.geometry.map((check) => [check.id, true]),
  ),
  evidence: [
    {
      title: 'Test only',
      url: 'https://example.com/reference',
      note: 'Not reviewed evidence',
    },
  ],
  attested: true,
};
assert.equal(api.bodyApprovalProblems(fixture, c, 'geometry').length, 0);
for (const patch of [
  { reviewer: '' },
  { qualification: '' },
  { scope: 'short' },
  { attested: false },
  { evidence: [] },
  { checks: {} },
  {
    issues: [
      {
        id: 'issue',
        title: 'Open issue',
        severity: 'major',
        resolved: false,
        resolution: '',
      },
    ],
  },
])
  assert(
    api.bodyApprovalProblems({ ...fixture, ...patch }, c, 'geometry').length,
  );
for (const patch of [
  { notes: 'a'.repeat(6001) },
  { checks: { ...fixture.checks, extra: true } },
  {
    issues: [
      {
        id: 'x',
        title: 'x',
        severity: 'invalid',
        resolved: false,
        resolution: '',
      },
    ],
  },
  {
    issues: [
      {
        id: 'x',
        title: 'x',
        severity: 'major',
        resolved: true,
        resolution: '',
      },
    ],
  },
  { status: 'signed' },
  { attested: 'yes' },
])
  assert.throws(() =>
    api.validateBodyReviewDraft(
      { ...fixture, ...patch },
      c.checklists.geometry,
    ),
  );
for (const url of [
  'javascript:alert(1)',
  'data:text/plain,x',
  'http://example.com',
  'https://user:secret@example.com',
  'bad',
])
  assert.throws(() =>
    api.validateBodyReviewDraft(
      { ...fixture, evidence: [{ title: 'x', url, note: '' }] },
      c.checklists.geometry,
    ),
  );

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(
  await readFile(
    new URL('../drizzle/0000_shoulder_review_events.sql', import.meta.url),
    'utf8',
  ),
);
// Existing shoulder record survives the additive, generated migration unchanged.
sqlite
  .prepare('INSERT INTO review_events VALUES(?,?,?,?,?,?)')
  .run(
    'test-a',
    id,
    'geometry',
    1,
    '{"sentinel":"existing shoulder scope"}',
    '2026-09-11T00:00:00.000Z',
  );
sqlite.exec(
  await readFile(
    new URL('../drizzle/0001_body_review_events.sql', import.meta.url),
    'utf8',
  ),
);
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
const get = (user = 'test-a', suffix = '') =>
  new Request(
    `https://atlas.example/api/body-review/decisions?structureId=${encodeURIComponent(id)}&track=geometry${suffix}`,
    { headers: user ? { 'oai-authenticated-user-id': user } : {} },
  );
const body = (draft = fixture, expectedVersion = 0, track = 'geometry') => ({
  catalogScope: c.catalogScope,
  structureId: id,
  track,
  expectedVersion,
  materialHash: c.materialHash,
  revisionHash: c.revisions[track],
  checklistVersion: c.checklistVersion,
  draft,
});
const post = (value, headers = {}, user = 'test-a') =>
  new Request('https://atlas.example/api/body-review/decisions', {
    method: 'POST',
    headers: {
      'oai-authenticated-user-id': user,
      'Content-Type': 'application/json',
      origin: 'https://atlas.example',
      ...headers,
    },
    body: typeof value === 'string' ? value : JSON.stringify(value),
  });
assert.equal((await api.getBodyDecisions(get(''), db)).status, 401);
assert.equal(
  (await api.postBodyDecision(post(body(), {}, ''), db)).status,
  401,
);
assert.equal(
  (
    await api.postBodyDecision(
      post(body(), { origin: 'https://elsewhere.example' }),
      db,
    )
  ).status,
  403,
);
assert.equal(
  (
    await api.postBodyDecision(
      post(body(), { 'sec-fetch-site': 'cross-site' }),
      db,
    )
  ).status,
  403,
);
assert.equal(
  (
    await api.postBodyDecision(
      post(body(), { 'Content-Type': 'text/plain' }),
      db,
    )
  ).status,
  415,
);
assert.equal((await api.postBodyDecision(post('{'), db)).status, 400);
assert.equal(
  (await api.postBodyDecision(post('x'.repeat(32001)), db)).status,
  413,
);
assert.equal((await api.getBodyDecisions(get(), undefined)).status, 503);
for (const suffix of [
  '&before=-1',
  '&before=2147483649',
  '&track=teaching',
  '&structureId=bad',
])
  assert.equal(
    (await api.getBodyDecisions(get('test-a', suffix), db)).status,
    400,
  );
for (const patch of [
  { catalogScope: 'shoulder' },
  { track: 'unknown' },
  { expectedVersion: -1 },
  { expectedVersion: 2147483647 },
])
  assert.equal(
    (await api.postBodyDecision(post({ ...body(), ...patch }), db)).status,
    400,
  );
for (const patch of [
  { revisionHash: '0'.repeat(64) },
  { materialHash: '0'.repeat(64) },
  { checklistVersion: 'old' },
])
  assert.equal(
    (await api.postBodyDecision(post({ ...body(), ...patch }), db)).status,
    409,
  );
assert.equal(
  (
    await api.postBodyDecision(
      post({
        ...body(),
        structureId:
          'vm:anatomy:body:thorax:right:organ:cavity-of-right-atrium',
      }),
      db,
    )
  ).status,
  404,
);
assert.equal(
  (
    await api.postBodyDecision(
      post(body({ ...fixture, status: 'approved', attested: false })),
      db,
    )
  ).status,
  422,
);
const imaging = {
  ...fixture,
  checks: Object.fromEntries(
    c.checklists.imaging.map((check) => [check.id, true]),
  ),
  status: 'approved',
};
assert.equal(
  (await api.postBodyDecision(post(body(imaging, 0, 'imaging')), db)).status,
  422,
);
const approved = await api.postBodyDecision(
  post(body({ ...fixture, status: 'approved' })),
  db,
);
assert.equal(approved.status, 201);
assert.equal(approved.headers.get('cache-control'), 'private, no-store');
const saved = (await approved.json()).review;
assert.equal(api.bodyDecisionLabel(saved, c), 'Approval recorded');
assert.equal(
  api.bodyDecisionLabel(saved, {
    ...c,
    revisions: { ...c.revisions, geometry: '0'.repeat(64) },
  }),
  'Re-review required',
);
assert.equal(
  api.bodyDecisionLabel(saved, { ...c, checklistVersion: 'changed' }),
  'Re-review required',
);
assert.equal((await api.postBodyDecision(post(body()), db)).status, 409);
assert.equal((await api.latestBodyReviews(db, 'test-b', id)).length, 0);
assert.equal(
  sqlite.prepare('SELECT payload FROM review_events').get().payload,
  '{"sentinel":"existing shoulder scope"}',
);
assert.equal(
  (await api.postBodyDecision(post(body(fixture), {}, 'test-b'), db)).status,
  201,
);
const issue = {
  id: 'permanent-issue',
  title: 'Source limitation for review',
  severity: 'major',
  resolved: false,
  resolution: '',
};
assert.equal(
  (
    await api.postBodyDecision(
      post(
        body({ ...fixture, status: 'changes-required', issues: [issue] }, 1),
      ),
      db,
    )
  ).status,
  201,
);
assert.equal(
  (await api.postBodyDecision(post(body(fixture, 2)), db)).status,
  422,
);
const corrected = {
  ...fixture,
  issues: [
    {
      ...issue,
      resolved: true,
      resolution: 'Synthetic correction explanation',
    },
  ],
};
assert.equal(
  (await api.postBodyDecision(post(body(corrected, 2)), db)).status,
  201,
);
const record = (await api.latestBodyReviews(db, 'test-a', id))[0];
const outcomes = await Promise.all([
  api.appendBodyReview(db, 'test-a', { ...record, version: 4 }, 3),
  api.appendBodyReview(db, 'test-a', { ...record, version: 4 }, 3),
]);
assert.deepEqual(outcomes.sort(), [false, true]);
for (let version = 5; version <= 24; version++)
  assert(
    await api.appendBodyReview(
      db,
      'test-a',
      { ...record, version },
      version - 1,
    ),
  );
const response = await api.getBodyDecisions(get(), db),
  payload = await response.json();
const page = api.parseBodyDecisionPage(payload, id, c.materialHash, 'geometry');
assert.equal(page.history.length, 20);
assert.equal(page.nextBefore, 5);
const older = await api.bodyReviewHistory(
  db,
  'test-a',
  id,
  'geometry',
  page.nextBefore,
);
assert.deepEqual(
  older.map((r) => r.version),
  [4, 3, 2, 1],
);
assert.equal(
  new Set([...page.history, ...older].map((r) => r.version)).size,
  24,
);
for (const mutate of [
  (p) => (p.context.structureId = 'wrong'),
  (p) => (p.context.materialHash = '0'.repeat(64)),
  (p) => (p.context.revisions.imaging = '0'.repeat(64)),
  (p) => p.reviews.push(p.reviews[0]),
  (p) => p.history.reverse(),
  (p) => (p.nextBefore = 99),
  (p) => (p.history[0].catalogScope = 'shoulder'),
]) {
  const copy = structuredClone(payload);
  mutate(copy);
  assert.throws(() =>
    api.parseBodyDecisionPage(copy, id, c.materialHash, 'geometry'),
  );
}
for (const patch of [
  { catalogScope: 'shoulder' },
  { version: 2147483648 },
  { checklist: [] },
  { attested: false },
  { revisionHash: null },
  { track: 'imaging' },
])
  assert.throws(() => api.parseSavedBodyReview({ ...saved, ...patch }));
const stalePage = {
  ...page,
  reviews: [{ ...saved, revisionHash: '0'.repeat(64) }],
};
const drafts = api.bodyDraftsFromPage(stalePage);
assert.equal(drafts.geometry.attested, false);
assert(Object.values(drafts.geometry.checks).every((v) => !v));
drafts.geometry.notes = 'Unsaved correction';
drafts.geometry.issues = [];
const rebased = api.reconcileBodyDrafts(drafts, page);
assert.equal(rebased.geometry.notes, 'Unsaved correction');
assert.equal(rebased.geometry.issues[0].id, issue.id);
assert.equal(rebased.geometry.attested, false);
assert(Object.values(rebased.geometry.checks).every((v) => !v));
assert.equal(
  drafts.geometry.issues.length,
  0,
  'Reconciliation does not mutate the original working copy',
);
sqlite.close();

const component = await componentBuild({
  entryPoints: ['app/review/body/body-decision-editor.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const require = createRequire(import.meta.url),
  module = { exports: {} };
vm.runInNewContext(component.outputFiles[0].text, {
  module,
  exports: module.exports,
  require,
  process: { env: { NODE_ENV: 'test' } },
  URL,
  TextEncoder,
  AbortController,
  console,
});
const React = require('react'),
  render = require('react-dom/server').renderToStaticMarkup;
const { BodyDecisionFields, BodyDecisionEditor } = module.exports;
const html = render(
  React.createElement(BodyDecisionFields, {
    draft: corrected,
    checklist: c.checklists.geometry,
    savedIssueIds: [issue.id],
    disabled: false,
    change() {},
  }),
);
for (const phrase of [
  'Reviewer name',
  'Exact scope',
  'Checklist',
  'Evidence',
  'Corrections',
  'personally performed',
  'Source limitation',
])
  assert(html.includes(phrase));
assert(!html.includes('Remove unsaved issue'));
assert.equal((html.match(/type="checkbox"/g) || []).length, 8);
assert(
  render(
    React.createElement(BodyDecisionFields, {
      draft: corrected,
      checklist: c.checklists.geometry,
      disabled: true,
      change() {},
    }),
  ).includes('<fieldset disabled=""'),
);
const loading = render(
  React.createElement(BodyDecisionEditor, {
    id,
    materialHash: c.materialHash,
    onDirty() {},
  }),
);
assert(loading.includes('Loading private records'));
assert(!loading.includes('Approval recorded'));
console.log(
  JSON.stringify({
    rootContexts: contexts,
    tracks: contexts * 3,
    database: 'Actual SQLite, both generated migrations, no production records',
    isolation: 'users/tracks/catalogues',
    historyVersions: 24,
    concurrency: 'one winner',
    approvalFixtures: 'synthetic only',
    componentStates: 3,
    checks: 'passed',
  }),
);
