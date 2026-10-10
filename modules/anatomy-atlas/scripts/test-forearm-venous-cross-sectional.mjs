import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/forearm-venous-cross-sectional-pins.json' with { type: 'json' };
import { forearmVenousCrossSectionalGroups as groups, forearmVenousCrossSectionalModes as modes,
  forearmVenousCrossSectionalReferences as references } from '../content/forearm-venous-cross-sectional.ts';

assert.equal(process.argv.length, 2);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, 'd5c55031e1e032392469288a205bc88d48013eb0');
assert.equal(hash(pins), '3c0120347dda6b2ac9cdfa1bca017e5b0fab87068f5375a3615c1b941e7b6ff7');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
// Preserve this completed transition's non-target epoch. The major-limb-bone
// suite verifies every current non-target placement against this checkpoint.
const completed = await exactSourceHistoryApi('242a1b5315cd1ed7ed7e9fef3f7d69bb0faf3ffe', 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const name of ['structures', 'dissectionProfiles']) assert.deepEqual(api[name], before[name]);
assert.equal(pins.entries.length, 8);
assert.equal(pins.entries.reduce((n, e) => n + e.topics.length, 0), 12);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 8);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const built = await build({ stdin: { contents: "export {forearmVenousCrossSectionalLesson} from './lib/forearm-venous-cross-sectional';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { forearmVenousCrossSectionalLesson: lesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
let changed = 0, preserved = 0, refused = 0;
for (const s of display.structures) for (const tab of api.contentTabs) {
  const entry = targets.get(s.id), old = before.bodyLesson(s, tab), current = api.bodyLesson(s, tab);
  if (entry?.topics.includes(tab)) {
    assert.deepEqual(s, entry.identity);
    assert.deepEqual(old, entry.previous[tab]);
    assert.equal(old.readiness, 'pending');
    const draft = lesson(s, tab);
    assert.equal(draft.readiness, 'draft');
    assert.deepEqual(current, draft, s.id + ':' + tab);
    const { readiness, ...shown } = draft;
    assert.deepEqual(api.bodyContent(s, tab), shown);
    assert.match(draft.note, /revision-bound radiologist review/i);
    assert.equal(new Set(draft.citations).size, draft.citations.length);
    changed++;
  } else {
    assert.deepEqual(completed.bodyLesson(s, tab), old, s.id + ':' + tab);
    assert.equal(lesson(s, tab), undefined);
    preserved++;
  }
}
assert.equal(changed, 12);
assert.equal(preserved, display.structures.length * api.contentTabs.length - 12);
for (const { identity, topics } of pins.entries) {
  for (const tab of topics) {
    const original = structuredClone(lesson(identity, tab));
    const mutable = lesson(identity, tab);
    mutable.bullets.push('foreign'); mutable.citations.push('foreign');
    assert.deepEqual(lesson(identity, tab), original);
  }
  for (const mutate of [
    s => { s.id += '-foreign'; }, s => { s.fmaId = 'foreign'; },
    s => { s.sources[0].sha256 = '0'.repeat(64); }, s => { s.sources = []; },
    s => { s.bundle = 'foreign'; }, s => { s.nodeName = 'foreign'; },
    s => { s.laterality = 'foreign'; }, s => { s.sourceTree = 'foreign'; },
    s => { s.anchor[0] += 0.01; }, s => { s.bounds.min[0] += 0.01; },
    s => { s.validation.anatomicalReview = true; }, s => { s.unexpected = true; },
  ]) {
    const bad = structuredClone(identity); mutate(bad);
    for (const tab of topics) { assert.equal(lesson(bad, tab), undefined); refused++; }
  }
  const packet = await api.bodyReviewMaterial(identity.id);
  const oldPacket = await before.bodyReviewMaterial(identity.id);
  assert.equal(packet.approval, false);
  assert.deepEqual(packet.source, oldPacket.source);
  assert.deepEqual(packet.reasoning, oldPacket.reasoning);
  assert.deepEqual(packet.guidedTours, oldPacket.guidedTours);
  assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
  for (const tab of topics) assert.deepEqual(packet.topics.find(t => t.tab === tab), { tab, ...lesson(identity, tab) });
  assert.deepEqual(await parseBodyReviewResponse(packet, identity.id), packet);
  assert.equal(await parseBodyReviewResponse(oldPacket, identity.id), null);
  const altered = structuredClone(packet);
  altered.topics.find(t => t.tab === topics[0]).body += ' changed';
  assert.equal(await parseBodyReviewResponse(altered, identity.id), null);
}
const budgets = {};
const unique = new Map();
for (const f of [...Object.values(modes), ...Object.values(groups).flatMap(g => [g.landmark, g.ct, g.mri].filter(Boolean))]) unique.set(JSON.stringify(f), f);
for (const f of unique.values()) for (const key of f.references) {
  assert(references[key]?.startsWith('https://'));
  budgets[key] = (budgets[key] || 0) + (f.text.match(/\S+/g)?.length || 0);
}
for (const [key, words] of Object.entries(budgets)) assert(words < 200, `${key}: ${words} attributed words`);
console.log(JSON.stringify({ passed: true, changed, preserved, refused, sourceWordCounts: budgets, clinicalApproval: false }));
