import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/limb-connective-ct-pins.json' with { type: 'json' };
import { limbConnectiveCtTeaching as teaching } from '../content/limb-connective-ct.ts';

assert(process.argv.slice(2).every(arg => arg === '--source-only'));
const sourceOnly = process.argv.includes('--source-only');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, 'c440ae47d7e9a2451156caa5a9906550a35bcb50');
assert.equal(hash(pins), '31d171c3ac7152610d82fc1bba26a5f1d4954e4e8b10b75817a58457ffa1e7a8');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
for (const key of ['structures', 'dissectionProfiles']) assert.deepEqual(api[key], before[key]);
assert.equal(pins.entries.length, 6);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 6);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const built = await build({ stdin: { contents: "export {limbConnectiveCtLesson} from './lib/limb-connective-ct';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { limbConnectiveCtLesson: lesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
let changed = 0, preserved = 0, refused = 0;
for (const s of display.structures) for (const tab of api.contentTabs) {
  const old = before.bodyLesson(s, tab), current = api.bodyLesson(s, tab);
  const entry = targets.get(s.id);
  if (entry && tab === 'ct') {
    assert.deepEqual(s, entry.identity);
    assert.deepEqual(old, entry.previous);
    assert.equal(old.readiness, 'pending');
    const draft = lesson(s, tab);
    assert.equal(draft.readiness, 'draft');
    if (sourceOnly) assert.deepEqual(current, old, s.id + ':' + tab);
    else {
      assert.deepEqual(current, draft, s.id + ':' + tab);
      const { readiness, ...shown } = draft;
      assert.deepEqual(api.bodyContent(s, tab), shown);
    }
    assert.match(draft.note, /revision-bound radiologist review/i);
    changed++;
  } else {
    assert.deepEqual(current, old, s.id + ':' + tab);
    assert.equal(lesson(s, tab), undefined);
    preserved++;
  }
}
assert.equal(changed, 6);
assert.equal(preserved, 9930);
for (const { identity } of pins.entries) {
  const original = structuredClone(lesson(identity, 'ct'));
  const mutable = lesson(identity, 'ct');
  mutable.bullets.push('foreign'); mutable.citations.push('foreign');
  assert.deepEqual(lesson(identity, 'ct'), original);
  for (const mutate of [
    s => { s.id += '-foreign'; }, s => { s.fmaId = 'foreign'; },
    s => { s.laterality = 'foreign'; }, s => { s.sourceTree = 'foreign'; },
    s => { s.sources[0].sha256 = '0'.repeat(64); }, s => { s.sources = []; },
    s => { s.bundle = 'foreign'; }, s => { s.nodeName = 'foreign'; },
    s => { s.anchor[0] += 0.01; }, s => { s.bounds.min[0] += 0.01; },
    s => { s.validation.anatomicalReview = true; }, s => { s.unexpected = true; },
  ]) {
    const bad = structuredClone(identity); mutate(bad);
    assert.equal(lesson(bad, 'ct'), undefined);
    refused++;
  }
  if (!sourceOnly) {
    const packet = await api.bodyReviewMaterial(identity.id);
    const oldPacket = await before.bodyReviewMaterial(identity.id);
    assert.equal(packet.approval, false);
    assert.deepEqual(packet.source, oldPacket.source);
    assert.deepEqual(packet.reasoning, oldPacket.reasoning);
    assert.deepEqual(packet.guidedTours, oldPacket.guidedTours);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.deepEqual(packet.topics.find(t => t.tab === 'ct'), { tab: 'ct', ...original });
    assert.deepEqual(await parseBodyReviewResponse(packet, identity.id), packet);
    assert.equal(await parseBodyReviewResponse(oldPacket, identity.id), null);
    const tampered = structuredClone(packet);
    tampered.topics.find(t => t.tab === 'ct').body += ' foreign';
    assert.equal(await parseBodyReviewResponse(tampered, identity.id), null);
  }
}
for (const topic of Object.values(teaching)) {
  const words = [topic.body, ...topic.bullets].join(' ').trim().split(/\s+/).length;
  assert(words < 150, words + ' teaching words');
}
console.log(JSON.stringify({ passed: true, sourceOnly, changed, preserved, refused, clinicalApproval: false }));
