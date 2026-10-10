import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/suprascapular-arterial-ct-pins.json' with { type: 'json' };
import { suprascapularArterialCtTeaching as teaching } from '../content/suprascapular-arterial-ct.ts';

assert.equal(process.argv.length, 2);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, '65f1a9e3e67de052a6a2faa96b606b5be251e7b7');
assert.equal(hash(pins), '5928c242354a63f919510603dc4c4d8502c697b41652d9632016275899dbaef2');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
// Preserve this completed transition's non-target epoch. The orbital quiz suite
// checks all current non-target topics against its later 244eee4 baseline.
// Target CT lessons and Review/UI assertions below still use the current source.
const completed = await exactSourceHistoryApi('8b8b1ceb9292c0f27fccd79fa9fe043851d23526', 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const key of ['structures', 'dissectionProfiles']) assert.deepEqual(api[key], before[key]);
assert.equal(pins.entries.length, 2);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 2);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const built = await build({ stdin: { contents: "export {suprascapularArterialCtLesson} from './lib/suprascapular-arterial-ct';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { suprascapularArterialCtLesson: lesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
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
    assert.deepEqual(current, draft, s.id + ':' + tab);
    const { readiness, ...shown } = draft;
    assert.deepEqual(api.bodyContent(s, tab), shown);
    assert.deepEqual(draft.citations, [...teaching.citations]);
    assert.match(draft.note, /revision-bound radiologist review/i);
    changed++;
  } else {
    assert.deepEqual(completed.bodyLesson(s, tab), old, s.id + ':' + tab);
    assert.equal(lesson(s, tab), undefined);
    preserved++;
  }
}
assert.equal(changed, 2);
assert.equal(preserved, 9934);
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
const teachingWords = [teaching.body, ...teaching.bullets].join(' ').trim().split(/\s+/).length;
assert(teachingWords < 150, teachingWords + ' teaching words');
console.log(JSON.stringify({ passed: true, changed, preserved, refused, teachingWords, clinicalApproval: false }));
