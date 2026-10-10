import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import pins from '../content/respiratory-core-depth-pins.json' with { type: 'json' };

assert.equal(pins.baseline, 'ae13b8de049671e2cac8dd789a6bfb385f147769');
const before = await exactSourceHistoryApi(pins.baseline, 'review-security');
const coronaryBefore = await exactSourceHistoryApi('3acb1235e6ba58c5f6828e143a58edb90d76d82e', 'review-security');
const compiled = await build({ stdin: { contents: `export {bodyLesson} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {coronaryArterialStudyFor} from './lib/coronary-arterial-study';
export {sourceCanonical} from './lib/body-source-additions';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-decisions';
export * from './lib/body-review-api';`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const display = now.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const coronaryStudy = now.coronaryArterialStudyFor(display);
assert(coronaryStudy, 'actual display catalog admits the exact coronary source study');
const coronaryIds = new Set([...coronaryStudy.targets, ...coronaryStudy.context].map(s => s.id));
assert.equal(coronaryIds.size, 5);
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.equal(targets.size, 5);
let changed = 0, preserved = 0, coronaryExcluded = 0, forged = 0, stale = 0, storageCalls = 0;
for (const structure of display.structures) {
  const coronaryParticipant = coronaryIds.has(structure.id);
  const old = await (coronaryParticipant ? coronaryBefore : before).bodyReviewMaterial(structure.id);
  const current = await now.bodyReviewMaterial(structure.id);
  assert.deepEqual(current.source, old.source);
  assert.equal(now.sourceCanonical(current.source), now.sourceCanonical(old.source));
  assert.equal(current.fingerprints.source, old.fingerprints.source);
  if (coronaryParticipant) {
    assert.equal(current.fingerprints.teaching, old.fingerprints.teaching, structure.id);
    // The new current-five checklist/context compatibility is independently
    // covered by test-coronary-arterial-review-material.mjs. Compare all other
    // packet fields against the immutable pre-checklist revision.
    const withoutNewChecklist = structuredClone(current);
    withoutNewChecklist.checklist = old.checklist;
    withoutNewChecklist.fingerprints.checklist = old.fingerprints.checklist;
    withoutNewChecklist.materialHash = old.materialHash;
    assert.deepEqual(withoutNewChecklist, old, structure.id);
    coronaryExcluded++;
    continue;
  }
  assert.deepEqual(current.reasoning, old.reasoning);
  assert.deepEqual(current.guidedTours, old.guidedTours);
  assert.deepEqual(current.checklist, old.checklist);
  assert.equal(current.approval, false);
  const entry = targets.get(structure.id);
  if (!entry) { assert.deepEqual(current, old, structure.id); preserved++; continue; }
  assert.deepEqual(structure, entry.identity);
  assert.deepEqual(current.source.structure, entry.identity);
  assert.notEqual(current.fingerprints.teaching, old.fingerprints.teaching);
  assert.deepEqual(current.topics.map(t => t.tab), old.topics.map(t => t.tab));
  const edited = new Set(Object.keys(entry.previous));
  for (const oldTopic of old.topics) {
    const topic = current.topics.find(t => t.tab === oldTopic.tab);
    assert(topic);
    if (!edited.has(oldTopic.tab)) assert.deepEqual(topic, oldTopic, structure.id + '|' + oldTopic.tab);
    else {
      assert.deepEqual(oldTopic, { tab: oldTopic.tab, ...entry.previous[oldTopic.tab] });
      assert.deepEqual(topic, { tab: oldTopic.tab, ...now.bodyLesson(structure, oldTopic.tab) });
      assert.notDeepEqual(topic, oldTopic);
    }
  }
  assert(await now.parseBodyReviewResponse(current, structure.id));
  for (const tab of edited) for (const mutate of [
    packet => { packet.topics.find(t => t.tab === tab).body += ' foreign'; },
    packet => { packet.topics.find(t => t.tab === tab).bullets.push('foreign'); },
    packet => { packet.topics.find(t => t.tab === tab).citations = ['https://foreign.example']; },
    packet => { packet.topics = packet.topics.filter(t => t.tab !== tab); },
  ]) { const packet = structuredClone(current); mutate(packet); assert.equal(await now.parseBodyReviewResponse(packet, structure.id), null); forged++; }
  for (const mutate of [
    packet => { packet.source.structure.sources = []; },
    packet => { packet.source.structure.sources[0].sha256 = '0'.repeat(64); },
    packet => { packet.source.structure.sources[0].unexpected = true; },
    packet => { packet.source.structure.regions[0] = 'foreign'; },
    packet => { packet.source.structure.name += '-foreign'; },
    packet => { packet.source.structure.fmaId += '-foreign'; },
    packet => { packet.source.structure.laterality = 'foreign'; },
    packet => { packet.source.structure.unexpected = true; },
    packet => { packet.source.bundle.sha256 = '0'.repeat(64); },
    packet => { packet.source.coordinateSystem.sourceCenter[0] += 1; },
  ]) { const packet = structuredClone(current); mutate(packet); assert.equal(await now.parseBodyReviewResponse(packet, structure.id), null); forged++; }
  if (entry.identity.sources.length > 1) {
    const packet = structuredClone(current); packet.source.structure.sources.reverse();
    assert.equal(await now.parseBodyReviewResponse(packet, structure.id), null); forged++;
  }
  const prior = await before.bodyReviewContext(structure.id);
  const context = await now.bodyReviewContext(structure.id);
  assert.notEqual(context.revisions.teaching, prior.revisions.teaching);
  assert.equal(context.revisions.imaging, prior.revisions.imaging);
  for (const tab of edited) assert(context.teachingTabs.includes(tab));
  const packet = { catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching', expectedVersion: 0,
    materialHash: context.materialHash, revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
    draft: now.blankBodyReview(context, 'teaching') };
  for (const oldHashes of [
    { materialHash: prior.materialHash, revisionHash: prior.revisions.teaching },
    { materialHash: prior.materialHash },
    { revisionHash: prior.revisions.teaching },
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', { method: 'POST',
      headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_RESPIRATORY_CORE_DEPTH' },
      body: JSON.stringify({ ...packet, ...oldHashes }),
    }), { prepare() { storageCalls++; throw Error('Stale packet reached storage'); } });
    assert.equal(response.status, 409);
    stale++;
  }
  changed++;
}
assert.equal(changed, 5);
assert.equal(coronaryExcluded, 5);
assert.equal(preserved, 1094);
assert.equal(display.structures.length, 1104);
assert.equal(forged, 84);
assert.equal(stale, 15);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({ changedTeachingMaterials: changed, preservedTeachingMaterials: preserved,
  coronaryComparisonExcluded: coronaryExcluded,
  forgedRefusals: forged, staleRefusals: stale, storageCalls, clinicalApproval: false }));
