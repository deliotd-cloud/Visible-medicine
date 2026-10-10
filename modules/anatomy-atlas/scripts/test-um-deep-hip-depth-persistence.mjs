import assert from 'node:assert/strict';
import {umDeepHipDepthMilestonePlugin,umDeepHipDepthMilestone} from './um-deep-hip-depth-history.mjs';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { build } from './workspace-test-build.mjs';

const built = await build({
  stdin: { contents: [
    "export * from './lib/specimen-review';",
    "export * from './lib/specimen-review-material';",
    "export * from './lib/specimen-review-client';",
    "export * from './lib/specimen-review-api';",
    "export { limbDefinitions } from './lib/um-limb-studies';",
    "export { umDeepHipDepth } from './content/um-deep-hip-depth';",
    "export { umThighDepth } from './content/um-thigh-depth';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm', plugins:[umDeepHipDepthMilestonePlugin()],
});
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(await readFile(new URL('../drizzle/0002_specimen_review_events.sql', import.meta.url), 'utf8'));
const db = { prepare(sql) { return { bind(...values) { return {
  async all() { return { results: sqlite.prepare(sql).all(...values) }; },
  async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }; },
}; } }; } };

const targets = new Set(Object.keys(api.umDeepHipDepth));
const previousThigh = new Set(Object.keys(api.umThighDepth));
assert.equal(targets.size, 6);
assert.equal(previousThigh.size,10);
for (const scope of ['hip-thigh', 'whole']) {
  const matches = api.limbDefinitions[scope].surfaces.filter(surface => targets.has(surface.slug));
  assert.equal(matches.length, targets.size, `${scope}: six source-bound deep-hip surfaces`);
  assert.deepEqual(new Set(matches.map(surface => surface.slug)), targets);
}
let affected = 0, unaffected = 0, calf = 0, priorThigh = 0, chosen = null, legacy = null;
for (const row of api.specimenReviewRows) for (const surface of row.surfaces) {
  const packet = await api.specimenReviewMaterial(row.key, surface.id);
  const expected = ['hip-thigh', 'whole'].some(scope => row.key === api.limbDefinitions[scope].key)
    && targets.has(packet.source.structure.slug);
  const earlierThigh=['hip-thigh', 'whole'].some(scope=>row.key===api.limbDefinitions[scope].key)&&previousThigh.has(packet.source.structure.slug);
  assert.equal(packet.context.teachingTabs.includes('thigh-depth'), expected||earlierThigh, `${row.key}/${surface.id}`);
  if(earlierThigh)priorThigh++;
  if (packet.context.teachingTabs.includes('calf-depth')) calf++;
  if (expected) { affected++; if (!chosen) chosen = packet; }
  else { unaffected++; if (!legacy && packet.context.revisions.teaching && !packet.context.blockers.teaching.length) legacy = packet; }
}
assert.equal(affected, 12);
assert.equal(unaffected, 344);
assert.equal(priorThigh,20);
assert.equal(calf, 24);
assert.ok(chosen && legacy);
assert.equal(chosen.context.teachingTabs.length, 11);

const origin = 'https://atlas.test';
const user = 'SYNTHETIC_DEEP_HIP_PERSISTENCE';
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
assert.equal(draft.checks['thigh-depth'], false);
assert.equal((await api.postSpecimenReview(post(payload(chosen, 0, draft), ''), db)).status, 401);
const first = await api.postSpecimenReview(post(payload(chosen, 0, draft)), db);
assert.equal(first.status, 201, 'new thigh-depth draft persists');
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
assert.equal(savedApproved.checks['thigh-depth'], true);
assert.deepEqual((await history(chosen)).history.map(r => r.version), [2, 1]);
assert.equal(api.specimenDraftFromSaved(savedApproved, chosen.context, 'teaching').status, 'draft');

const oldDraft = api.blankSpecimenReview(legacy.context, 'teaching');
assert.ok(legacy.context.teachingTabs.length <= 10);
const oldResponse = await api.postSpecimenReview(post(payload(legacy, 0, oldDraft)), db);
assert.equal(oldResponse.status, 201, 'old ten-or-fewer-tab event remains accepted');
assert.equal(api.parseSavedSpecimenReview((await oldResponse.json()).review).material.teachingTabs.includes('thigh-depth'), false);
assert.deepEqual((await history(legacy)).history.map(r => r.version), [1]);

const mixedScopes = [...savedDraft.material.teachingTabs.slice(1), 'calf-depth'];
assert.equal(mixedScopes.length, 11);
assert.ok(mixedScopes.includes('calf-depth') && mixedScopes.includes('thigh-depth'));
for (const bad of [
  { teachingTabs: [...savedDraft.material.teachingTabs, 'unknown-depth'] },
  { teachingTabs: [...savedDraft.material.teachingTabs, 'thigh-depth'] },
  { teachingTabs: mixedScopes },
  { teachingTabs: ['anatomy', 'unknown-depth'] },
]) assert.throws(() => api.parseSavedSpecimenReview({ ...savedDraft, material: { ...savedDraft.material, ...bad } }), /Invalid teaching scope/u);
assert.throws(() => api.parseSavedSpecimenReview({ ...savedApproved, attested: false }), /Invalid stored approval/u);
assert.throws(() => api.parseSavedSpecimenReview({ ...savedDraft, eventSchema: 'unknown' }), /Invalid specimen review/u);
console.log(`Current UM deep-hip depth: ${affected} affected, ${unaffected} unaffected, ${calf} existing calf and ${priorThigh} earlier thigh; draft/approved save and history, conflicts and scope rejection verified. Synthetic approval only.`);
