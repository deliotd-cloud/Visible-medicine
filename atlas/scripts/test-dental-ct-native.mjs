// Focused real-source dental CT binding gate. Run from the Atlas project root
// after the separately authored content/dental-ct.ts has been installed.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const root = resolve(process.cwd());
const file = p => resolve(root, p);
const json = async p => JSON.parse(await readFile(file(p), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pins = await json('content/dental-ct-pins.json');
const rawBytes = await readFile(file('public/models/bodyparts3d/full-body/catalog.json'));
const rawCatalog = JSON.parse(rawBytes);
const { build } = await import(pathToFileURL(file('scripts/workspace-test-build.mjs')).href);

// Bundle the real mapper, separately authored content and display projection.
const built = await build({
  stdin: {
    contents: [
      "export { dentalCtLesson } from './lib/dental-ct';",
      "export { dentalCtGroups, dentalCtTopics, dentalCtNote } from './content/dental-ct';",
      "export { dentalMriLesson } from './lib/dental-mri';",
      "export { sourceCanonical } from './lib/body-source-additions';",
      "export { bodyDisplayCatalog } from './lib/body-display-catalog';",
    ].join('\n'), resolveDir: root, loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm', metafile: true,
});
const inputs = Object.keys(built.metafile.inputs).map(p => p.replaceAll('\\', '/'));
for (const required of ['lib/dental-ct.ts', 'content/dental-ct.ts',
  'content/dental-ct-pins.json', 'lib/dental-mri.ts', 'lib/body-display-catalog.ts']) {
  assert(inputs.some(p => p.endsWith(required)), `Missing real input: ${required}`);
}
for (const forbidden of ['app/body-content.ts', 'lib/body-lesson.ts', 'lib/body-history.ts']) {
  assert(!inputs.some(p => p.endsWith(forbidden)), `Unexpected full resolver input: ${forbidden}`);
}
const api = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const { dentalCtLesson, dentalCtGroups, dentalCtTopics, dentalCtNote,
  dentalMriLesson, sourceCanonical, bodyDisplayCatalog } = api;
const groups = ['incisors', 'canines', 'premolars', 'molars'];
const counts = [8, 4, 8, 8];
const pinnedIds = new Set(pins.entries.map(e => e.identity.id));

test('28 CT pins match the current raw and display catalogue, bundle and source geometry', () => {
  assert.equal(pins.schemaVersion, 1);
  assert.equal(pins.baseline, '7ae4c216f1524773366b08dee89489738af4e6d9');
  assert.equal(pins.sourceTree, 'b7416c043118113d17aa0b5cdb379e79e0357525');
  assert.equal(pins.entries.length, 28);
  assert.equal(pinnedIds.size, 28);
  assert.equal(sha(rawBytes), pins.catalogFileSha256);
  assert.equal(rawCatalog.sourceVersion, pins.sourceVersion);
  assert.equal(rawCatalog.license, pins.license);
  assert.equal(sourceCanonical(rawCatalog.coordinateSystem), sourceCanonical(pins.coordinateSystem));
  assert.equal(pins.bundles.length, 1);
  const bundle = rawCatalog.bundles.filter(b => b.id === pins.bundles[0].id);
  assert.equal(bundle.length, 1);
  assert.equal(sourceCanonical(bundle[0]), sourceCanonical(pins.bundles[0]));
  assert.equal(bundle[0].structures, 28);
  const display = bodyDisplayCatalog(rawCatalog);
  for (const { identity, topic, previousReadiness } of pins.entries) {
    assert.equal(topic, 'ct');
    assert.equal(previousReadiness, 'pending');
    const raw = rawCatalog.structures.filter(s => s.id === identity.id);
    const shown = display.structures.filter(s => s.id === identity.id);
    assert.equal(raw.length, 1, identity.id);
    assert.equal(shown.length, 1, identity.id);
    assert.equal(sourceCanonical(raw[0]), sourceCanonical(identity));
    assert.equal(sourceCanonical(shown[0]), sourceCanonical(identity));
    assert.equal(identity.bundle, bundle[0].id);
    assert.equal(shown[0].sources[0].file, identity.sources[0].file);
    assert.equal(shown[0].sources[0].sha256, identity.sources[0].sha256);
    assert.equal(shown[0].validation.status, 'unvalidated');
    assert.equal(shown[0].validation.anatomicalReview, false);
    assert.equal(shown[0].provenance.license, pins.license);
  }
});

test('four source groups yield only 28 copy-safe CT drafts and leave MRI callable', () => {
  assert.deepEqual(Object.keys(dentalCtGroups), groups);
  assert.deepEqual(Object.keys(dentalCtTopics), groups);
  assert.deepEqual(groups.map(g => dentalCtGroups[g].length), counts);
  assert.equal(new Set(Object.values(dentalCtGroups).flat()).size, 28);
  assert.deepEqual(new Set(Object.values(dentalCtGroups).flat()),
    new Set(pins.entries.map(e => e.identity.fmaId)));
  for (const { group, identity } of pins.entries) {
    assert(dentalCtGroups[group].includes(identity.fmaId));
    const lesson = dentalCtLesson(identity, 'ct');
    assert.equal(lesson.readiness, 'draft');
    assert(lesson.title.startsWith(`${identity.name} · `));
    assert.equal(lesson.body, dentalCtTopics[group].body);
    assert.deepEqual(lesson.bullets, dentalCtTopics[group].bullets);
    assert.deepEqual(lesson.citations, dentalCtTopics[group].citations);
    assert.equal(lesson.note, dentalCtNote);
    assert.deepEqual(Object.keys(lesson).sort(), ['body', 'bullets', 'citations', 'note', 'readiness', 'title']);
    const before = structuredClone(lesson);
    lesson.bullets.push('foreign');
    lesson.citations.push('foreign');
    assert.deepEqual(dentalCtLesson(identity, 'ct'), before);
    assert.equal(dentalCtLesson(identity, 'mri'), undefined);
    assert.equal(dentalMriLesson(identity, 'ct'), undefined);
    assert.equal(dentalMriLesson(identity, 'mri').readiness, 'draft');
  }
});

test('wrong tabs, unrelated teeth and changed source or approval fields refuse CT', () => {
  const edits = [
    s => { s.id += '-foreign'; }, s => { s.fmaId = 'FMA0'; },
    s => { s.name += ' foreign'; }, s => { s.sourceName += ' foreign'; },
    s => { s.laterality = s.laterality === 'left' ? 'right' : 'left'; },
    s => { s.region = 'thorax'; }, s => { s.regions.push('thorax'); },
    s => { s.system = 'skeleton'; }, s => { s.category = 'bone'; },
    s => { s.bundle += '-foreign'; }, s => { s.nodeName += '-foreign'; },
    s => { s.sourceTree = 'foreign'; }, s => { s.sources = []; },
    s => { s.sources[0].file = 'foreign'; },
    s => { s.sources[0].sha256 = '0'.repeat(64); },
    s => { s.bounds.min[0] -= 1; }, s => { s.bounds.max[0] += 1; },
    s => { s.center[0] += 1; }, s => { s.anchor[0] += 1; },
    s => { s.coverageNote = 'reviewed'; },
    s => { s.provenance = { method: 'foreign' }; },
    s => { s.validation = { status: 'reviewed', anatomicalReview: true }; },
    s => { s.extra = true; },
  ];
  for (const { identity } of pins.entries) {
    for (const tab of ['anatomy', 'function', 'mri', 'xray', 'ultrasound',
      'clinical', 'pathology', 'quiz']) assert.equal(dentalCtLesson(identity, tab), undefined);
    for (const edit of edits) {
      const changed = structuredClone(identity);
      edit(changed);
      assert.equal(dentalCtLesson(changed, 'ct'), undefined);
    }
    const reordered = Object.fromEntries(Object.entries(identity).reverse());
    assert.deepEqual(dentalCtLesson(reordered, 'ct'), dentalCtLesson(identity, 'ct'));
  }
  const lookalikes = rawCatalog.structures.filter(s => !pinnedIds.has(s.id));
  assert(lookalikes.length > 900);
  for (const s of lookalikes) assert.equal(dentalCtLesson(s, 'ct'), undefined);
  const sameFma = structuredClone(pins.entries[0].identity);
  sameFma.id = 'unrelated';
  assert.equal(dentalCtLesson(sameFma, 'ct'), undefined);
});

test('authored CT content carries citations and explicit pending-review and geometry limits', () => {
  assert.equal(typeof dentalCtNote, 'string');
  assert.match(dentalCtNote, /radiologist|clinical review/i);
  assert.match(dentalCtNote, /pending|not approved/i);
  assert.match(dentalCtNote, /scan|registration/i);
  assert.match(dentalCtNote, /enamel|dentine|pulp|canal/i);
  for (const group of groups) {
    const topic = dentalCtTopics[group];
    assert.equal(typeof topic.body, 'string');
    assert(topic.body.length > 0);
    assert(topic.bullets.length > 0);
    assert(topic.citations.length > 0);
    assert(topic.bullets.every(x => typeof x === 'string' && x.length > 0));
    assert(topic.citations.every(x => /^https:\/\//.test(x)));
  }
});
