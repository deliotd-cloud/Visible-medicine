import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { build } from './workspace-test-build.mjs';

const baseline = 'b3d936de6992b612c77abaddd7b761b5fb43b446';
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
}).toString('utf8');
async function load(previous) {
  const contents = "export * from './lib/nested-review-material'; export * from './lib/nested-review'; export * from './lib/nested-review-api'; export * from './lib/nested-review-client'; export * from './lib/nested-guided-learning'; export { cardiacCavityGuideReferences } from './lib/cardiac-cavity-guide'; export { bodyDisplayCatalog } from './lib/body-display-catalog'; export { default as raw } from './public/models/bodyparts3d/full-body/catalog.json';";
  const files = [
    'lib/nested-review-material.ts', 'lib/nested-guided-learning.ts',
    'content/nested-guided-learning-bindings.v1.json', 'content/body-renderer-revision.json',
  ];
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: previous ? [{ name: 'exact-before-cardiac-cavity', setup(api) {
      api.onLoad({ filter: /.*/ }, args => {
        const path = args.path.replaceAll('\\', '/');
        const match = files.find(file => path.endsWith(`/${file}`));
        if (match) return { contents: old(match), loader: match.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path) };
      });
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const now = await load(false), before = await load(true);
const catalog = now.bodyDisplayCatalog(now.raw);
assert.deepEqual(now.nestedReviewRows, before.nestedReviewRows, 'review scope and source rows unchanged');
const oldOptions = before.nestedGuidedStudyOptions(catalog);
const options = now.nestedGuidedStudyOptions(catalog);
assert.equal(oldOptions.length, 3, 'baseline has the two eye and one ventricular guides');
assert.equal(options.length, 4, 'current discovery adds one heart guide');
assert.deepEqual(options.filter(option => option.kind !== 'cardiac'), oldOptions, 'previous guides remain exact');
assert.deepEqual(now.nestedGuidedStudyOptions(catalog, 'head-neck'), oldOptions);
assert.deepEqual(now.nestedGuidedStudyOptions(catalog, 'thorax').map(option => option.kind), ['cardiac']);
for (const region of ['pelvis', 'abdomen', 'missing'])
  assert.deepEqual(now.nestedGuidedStudyOptions(catalog, region), [], `${region}: no guide`);
const heart = options.find(option => option.kind === 'cardiac');
assert.equal(heart.region, 'thorax');
assert.equal(heart.guide.study, 'cardiac');
assert.equal(heart.guide.steps.length, 6);
for (const mutate of [
  c => { c.structures.find(s => s.id === heart.parent.id).name = 'Foreign heart'; },
  c => { c.structures.splice(c.structures.findIndex(s => s.id === heart.parent.id), 1); },
  c => { c.structures.push(structuredClone(heart.parent)); },
  c => { c.bundles.find(b => b.id === heart.parent.bundle).sha256 = 'foreign'; },
  c => { c.bundles.splice(c.bundles.findIndex(b => b.id === heart.parent.bundle), 1); },
  c => { c.bundles.push(structuredClone(c.bundles.find(b => b.id === heart.parent.bundle))); },
]) {
  const changed = structuredClone(catalog);
  mutate(changed);
  assert.deepEqual(now.nestedGuidedStudyOptions(changed), oldOptions,
    'stale, missing or duplicate heart/root bundle refuses only the cardiac guide');
}

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(await readFile('drizzle/0003_nested_review_events.sql', 'utf8'));
const db = { prepare(sql) { return { bind(...values) { return {
  async all() { return { results: sqlite.prepare(sql).all(...values) }; },
  async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }; },
}; } }; } };
const forbiddenStorage = new Proxy({}, { get() { throw Error('Stale review request reached storage'); } });
const request = payload => new Request('https://review.test/api/nested-review', {
  method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json',
    'oai-authenticated-user-id': 'SYNTHETIC_CARDIAC_CAVITY_TEST' }, body: JSON.stringify(payload),
});
let contexts = 0, changed = 0, unchanged = 0, refusals = 0, saves = 0;
try {
  for (const group of now.nestedReviewRows) for (const row of group.surfaces) {
    const current = await now.nestedReviewMaterial(group.key, row.id);
    const previous = await before.nestedReviewMaterial(group.key, row.id);
    const c = current.context, p = previous.context;
    contexts++;
    assert.deepEqual(current.source, previous.source, 'source packet unchanged');
    assert.equal(c.sourceHash, p.sourceHash);
    assert.equal(c.sourceFrame, p.sourceFrame);
    assert.equal(c.revisions.imaging, null);
    if (group.study !== 'cardiac') {
      unchanged++;
      assert.deepEqual(current.teaching, previous.teaching, 'unrelated teaching exact');
      assert.equal(c.teachingHash, p.teachingHash);
      assert.equal(c.revisions.teaching, p.revisions.teaching);
      assert.deepEqual(c.teachingTabs, p.teachingTabs);
      assert.deepEqual(c.checklists, p.checklists);
      continue;
    }
    changed++;
    const guide = current.teaching.guidedLearning;
    assert.deepEqual(guide, heart.guide, 'all four cardiac contexts share the exact admitted guide');
    assert(guide.steps.some(step => step.ids.includes(row.id)));
    assert.equal(previous.teaching.guidedLearning, undefined);
    for (const field of ['topics', 'concept', 'lesson'])
      assert.deepEqual(current.teaching[field], previous.teaching[field], `${field}: original teaching exact`);
    for (const [url, title] of Object.entries(previous.teaching.referenceTitles))
      assert.equal(current.teaching.referenceTitles[url], title, 'existing reference title retained');
    const guideUrls = new Set(guide.steps.flatMap(step => step.references));
    for (const url of guideUrls) {
      const originalTitle = previous.teaching.referenceTitles[url];
      const guideTitle = now.cardiacCavityGuideReferences.find(r => r.url === url)?.title;
      assert.equal(current.teaching.referenceTitles[url], originalTitle ?? guideTitle,
        'every guide URL has its own title, without relabeling an existing citation');
    }
    assert.deepEqual(Object.keys(current.teaching.referenceTitles).sort(),
      [...new Set([...Object.keys(previous.teaching.referenceTitles), ...guideUrls])].sort());
    assert.notEqual(c.teachingHash, p.teachingHash);
    assert.notEqual(c.revisions.teaching, p.revisions.teaching);
    assert.deepEqual(c.teachingTabs, [...p.teachingTabs, 'guided-learning']);
    assert.deepEqual(c.checklists.geometry, p.checklists.geometry);
    assert.deepEqual(c.checklists.teaching.slice(0, -1), p.checklists.teaching);
    assert.equal(c.checklists.teaching.at(-1).id, 'guided-learning');
    const draft = now.blankNestedReview(c, 'teaching');
    assert.equal(draft.status, 'draft');
    assert.equal(draft.checks['guided-learning'], false);
    assert.equal(draft.attested, false);
    const almost = { ...draft, reviewer: 'SOFTWARE TEST ONLY', qualification: 'Synthetic',
      scope: 'No clinical sign-off', status: 'approved', attested: true,
      evidence: [{ title: 'Synthetic only', url: 'https://example.test/evidence', note: 'Not clinical evidence' }],
      checks: Object.fromEntries(c.checklists.teaching.map(item => [item.id, item.id !== 'guided-learning'])),
    };
    assert(now.nestedApprovalProblems(almost, c, 'teaching').includes('Complete every checklist item.'));
    const payload = { catalogScope: c.catalogScope, nestedKey: c.nestedKey, structureId: row.id,
      sourceFrame: c.sourceFrame, materialHash: c.materialHash,
      revisionHash: c.revisions.teaching, checklistVersion: c.checklistVersion,
      track: 'teaching', expectedVersion: 0, draft };
    for (const delta of [{ revisionHash: p.revisions.teaching }, { materialHash: p.materialHash }]) {
      const response = await now.postNestedReview(request({ ...payload, ...delta }), forbiddenStorage);
      assert.equal(response.status, 409, 'stale material refused before storage');
      refusals++;
    }
    const response = await now.postNestedReview(request(payload), db);
    assert.equal(response.status, 201);
    const saved = now.parseSavedNestedReview((await response.json()).review);
    assert.equal(saved.status, 'draft');
    assert.equal(saved.attested, false);
    assert.equal(saved.checks['guided-learning'], false);
    const get = new Request('https://review.test/api/nested-review?' + new URLSearchParams({
      nestedKey: c.nestedKey, structureId: row.id, track: 'teaching',
    }), { headers: { 'oai-authenticated-user-id': 'SYNTHETIC_CARDIAC_CAVITY_TEST' } });
    const historyResponse = await now.getNestedReviews(get, db);
    assert.equal(historyResponse.status, 200);
    const history = now.parseNestedHistory(await historyResponse.json(), c, 'teaching');
    assert.deepEqual(history.history, [saved]);
    saves++;
  }
} finally {
  sqlite.close();
}
assert.deepEqual({ contexts, changed, unchanged, refusals, saves },
  { contexts: 108, changed: 4, unchanged: 104, refusals: 8, saves: 4 });
console.log(JSON.stringify({ baseline, sourceContextsUnchanged: contexts, cardiacTeachingContexts: changed,
  otherTeachingExact: unchanged, staleRequestsBeforeStorage: refusals, syntheticDraftReadbacks: saves,
  clinicalApproval: false }));
