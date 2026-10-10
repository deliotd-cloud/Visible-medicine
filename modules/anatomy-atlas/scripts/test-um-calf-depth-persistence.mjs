import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { build } from './workspace-test-build.mjs';

const built = await build({
  stdin: { contents: [
    "export * from './lib/specimen-review';",
    "export * from './lib/specimen-review-material';",
    "export * from './lib/specimen-review-client';",
    "export * from './lib/specimen-review-api';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(await readFile(new URL('../drizzle/0002_specimen_review_events.sql', import.meta.url), 'utf8'));
const db = { prepare(sql) { return { bind(...values) { return {
  async all() { return { results: sqlite.prepare(sql).all(...values) }; },
  async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }; },
}; } }; } };

const targets = new Set([
  'tibialis-anterior', 'tibialis-posterior', 'flexor-digitorum-longus',
  'flexor-hallucis-longus', 'peroneus-longus', 'soleus',
  'gastrocnemius-medial', 'gastrocnemius-lateral', 'popliteus',
]);
let affected = 0, unaffected = 0, chosen = null, legacy = null;
for (const row of api.specimenReviewRows) for (const surface of row.surfaces) {
  const packet = await api.specimenReviewMaterial(row.key, surface.id);
  const expected = row.key.startsWith('um-5t6tz7-v1-2:') && targets.has(packet.source.structure.slug);
  assert.equal(packet.context.teachingTabs.includes('calf-depth'), expected, `${row.key}/${surface.id}`);
  if (expected) { affected++; if (!chosen) chosen = packet; }
  else { unaffected++; if (!legacy && packet.context.revisions.teaching && !packet.context.blockers.teaching.length) legacy = packet; }
}
assert.equal(affected, 24);
assert.equal(unaffected, 332);
assert.ok(chosen && legacy);
assert.equal(chosen.context.teachingTabs.length, 11);

const origin = 'https://atlas.test';
const user = 'SYNTHETIC_CALF_PERSISTENCE';
function payload(packet, expectedVersion, draft) {
  const c = packet.context;
  return { catalogScope: c.catalogScope, specimenKey: c.specimenKey, sourceFrame: c.sourceFrame,
    structureId: c.structureId, track: 'teaching', expectedVersion,
    materialHash: c.materialHash, revisionHash: c.revisions.teaching,
    checklistVersion: c.checklistVersion, draft };
}
function post(body, auth = user) {
  return new Request(origin + '/api/specimen-review', { method: 'POST', headers: {
    origin, 'content-type': 'application/json', ...(auth ? { 'oai-authenticated-user-id': auth } : {}),
  }, body: JSON.stringify(body) });
}
function get(packet) {
  const c = packet.context;
  const query = new URLSearchParams({ specimenKey: c.specimenKey, structureId: c.structureId, track: 'teaching' });
  return new Request(`${origin}/api/specimen-review?${query}`, { headers: { 'oai-authenticated-user-id': user } });
}
async function history(packet) {
  const response = await api.getSpecimenReviews(get(packet), db);
  assert.equal(response.status, 200);
  return api.parseSpecimenHistory(await response.json(), packet.context, 'teaching');
}
const draft = api.blankSpecimenReview(chosen.context, 'teaching');
assert.equal(draft.checks['calf-depth'], false);
assert.equal((await api.postSpecimenReview(post(payload(chosen, 0, draft), ''), db)).status, 401);
const first = await api.postSpecimenReview(post(payload(chosen, 0, draft)), db);
assert.equal(first.status, 201, 'new calf-depth draft persists');
const savedDraft = api.parseSavedSpecimenReview((await first.json()).review);
assert.equal(savedDraft.version, 1);
assert.equal(savedDraft.status, 'draft');
assert.equal(savedDraft.material.teachingTabs.length, 11);
assert.deepEqual((await history(chosen)).history.map(r => r.version), [1]);
assert.equal((await api.postSpecimenReview(post(payload(chosen, 0, draft)), db)).status, 409, 'optimistic version conflict');

const approved = { ...api.blankSpecimenReview(chosen.context, 'teaching'),
  status: 'approved', reviewer: 'SOFTWARE TEST ONLY', qualification: 'Not clinical sign-off',
  scope: 'Synthetic persistence validation for this exact source binding',
  checks: Object.fromEntries(chosen.context.checklists.teaching.map(c => [c.id, true])),
  evidence: [{ title: 'Synthetic fixture', url: 'https://example.test/fixture', note: 'Not clinical evidence' }],
  attested: true };
assert.equal((await api.postSpecimenReview(post(payload(chosen, 1, { ...approved, attested: false })), db)).status, 422);
const second = await api.postSpecimenReview(post(payload(chosen, 1, approved)), db);
assert.equal(second.status, 201, 'fully attested synthetic approval persists');
const savedApproved = api.parseSavedSpecimenReview((await second.json()).review);
assert.equal(savedApproved.version, 2);
assert.equal(savedApproved.status, 'approved');
assert.equal(savedApproved.checks['calf-depth'], true);
assert.deepEqual((await history(chosen)).history.map(r => r.version), [2, 1]);
assert.equal(api.specimenDraftFromSaved(savedApproved, chosen.context, 'teaching').status, 'draft');

const oldDraft = api.blankSpecimenReview(legacy.context, 'teaching');
const oldResponse = await api.postSpecimenReview(post(payload(legacy, 0, oldDraft)), db);
assert.equal(oldResponse.status, 201, 'old ten-or-fewer-tab event remains accepted');
assert.equal(api.parseSavedSpecimenReview((await oldResponse.json()).review).material.teachingTabs.includes('calf-depth'), false);
assert.deepEqual((await history(legacy)).history.map(r => r.version), [1]);

for (const bad of [
  { teachingTabs: [...savedDraft.material.teachingTabs, 'unknown-depth'] },
  { teachingTabs: [...savedDraft.material.teachingTabs, 'calf-depth'] },
  { teachingTabs: ['anatomy', 'unknown-depth'] },
]) assert.throws(() => api.parseSavedSpecimenReview({ ...savedDraft, material: { ...savedDraft.material, ...bad } }), /Invalid teaching scope/u);
assert.throws(() => api.parseSavedSpecimenReview({ ...savedApproved, attested: false }), /Invalid stored approval/u);
assert.throws(() => api.parseSavedSpecimenReview({ ...savedDraft, eventSchema: 'unknown' }), /Invalid specimen review/u);
console.log(`UM calf-depth persistence: ${affected} affected, ${unaffected} unaffected; draft/approved save and history, conflicts and scope rejection verified. Synthetic approval only.`);
