import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/laryngeal-support-imaging-pins.json' with { type: 'json' };
import { laryngealSupportImagingGroups as groups, laryngealSupportImagingModes as modes,
  laryngealSupportImagingReferences as references } from '../content/laryngeal-support-imaging.ts';

assert.equal(process.argv.length, 2);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, '4890de3dc9f0ab70aaad78f0bf281570bfde6afc');
assert.equal(hash(pins), '7877566f759d8ea7a526c61c2ad17015b04eeaea20191ba6febb8eb969e3ebc1');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
// Preserve this completed batch's non-target epoch. The lower-limb vessel suite
// compares all current non-target topics with ed74d3e7; target checks stay live.
const completed = await exactSourceHistoryApi('ed74d3e7c96501f21434f76e136c12a11493c020', 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const name of ['structures', 'dissectionProfiles']) assert.deepEqual(api[name], before[name]);
assert.equal(pins.entries.length, 10);
assert.equal(pins.entries.reduce((n, e) => n + e.topics.length, 0), 20);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 10);
const groupCounts = { medianThyrohyoid: 1, lateralThyrohyoid: 2, hyoEpiglottic: 1, thyroEpiglottic: 1, medianCricothyroid: 1, vocal: 2, thyrohyoidMembrane: 2 };
assert.deepEqual(Object.keys(groups).sort(), Object.keys(groupCounts).sort());
for (const [group, count] of Object.entries(groupCounts)) assert.equal(pins.entries.filter(e => e.group === group).length, count);
assert.match(groups.vocal.mri.text, /did not distinguish vocal ligaments or conus elasticus/);
assert.match(groups.medianCricothyroid.mri.text, /not evidence.*safe airway access route/);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const built = await build({ stdin: { contents: "export {laryngealSupportImagingLesson} from './lib/laryngeal-support-imaging';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { laryngealSupportImagingLesson: lesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
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
    assert.match(draft.bullets.at(-1), /do not imply coverage in the approved head scans/);
    assert.equal(new Set(draft.citations).size, draft.citations.length);
    changed++;
  } else {
    assert.deepEqual(completed.bodyLesson(s, tab), old, s.id + ':' + tab);
    assert.equal(lesson(s, tab), undefined);
    preserved++;
  }
}
assert.equal(changed, 20);
assert.equal(preserved, display.structures.length * api.contentTabs.length - 20);
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
