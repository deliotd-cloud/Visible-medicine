// Focused source-bound dental MRI gate. Run from the Atlas project root.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const root = resolve(process.cwd());
const rootFile = (path) => resolve(root, path);
const readJson = async (path) => JSON.parse(await readFile(rootFile(path), 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const pins = await readJson('content/dental-mri-pins.json');
const catalogBytes = await readFile(rootFile('public/models/bodyparts3d/full-body/catalog.json'));
const rawCatalog = JSON.parse(catalogBytes);
const { build } = await import(pathToFileURL(rootFile('scripts/workspace-test-build.mjs')).href);

// The workspace builder resolves only within this project. Bundle the actual
// dental module and display projection; do not enter the full lesson resolver.
const built = await build({
  stdin: {
    contents: [
      "export { dentalMriLesson } from './lib/dental-mri';",
      "export { dentalMriGroups, dentalMriTopics, dentalMriNote } from './content/dental-mri';",
      "export { sourceCanonical } from './lib/body-source-additions';",
      "export { bodyDisplayCatalog } from './lib/body-display-catalog';",
    ].join('\n'),
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  metafile: true,
});
const inputs = Object.keys(built.metafile.inputs).map((path) => path.replaceAll('\\', '/'));
for (const forbidden of ['app/body-content.ts', 'lib/body-lesson.ts', 'lib/body-review-material.ts',
  'lib/body-review-response.ts', 'lib/body-history.ts']) {
  assert(!inputs.some((path) => path.endsWith(forbidden)), `Unexpected full resolver input: ${forbidden}`);
}
for (const required of ['lib/dental-mri.ts', 'content/dental-mri.ts',
  'content/dental-mri-pins.json', 'lib/body-display-catalog.ts']) {
  assert(inputs.some((path) => path.endsWith(required)), `Missing real source: ${required}`);
}
const api = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const { dentalMriLesson, dentalMriGroups, dentalMriTopics, dentalMriNote,
  sourceCanonical, bodyDisplayCatalog } = api;

const groups = ['incisors', 'canines', 'premolars', 'molars'];
const counts = [8, 4, 8, 8];
const pinnedIds = new Set(pins.entries.map(({ identity }) => identity.id));

test('28 exact pins join the raw and display catalog without geometry or review drift', () => {
  assert.equal(pins.schemaVersion, 1);
  assert.equal(pins.entries.length, 28);
  assert.equal(pinnedIds.size, 28);
  assert.equal(sha256(catalogBytes), pins.catalogFileSha256);
  assert.equal(rawCatalog.sourceVersion, pins.sourceVersion);
  assert.equal(rawCatalog.license, pins.license);
  assert.equal(sourceCanonical(rawCatalog.coordinateSystem), sourceCanonical(pins.coordinateSystem));
  const bundle = rawCatalog.bundles.filter((item) => item.id === pins.bundles[0].id);
  assert.equal(bundle.length, 1);
  assert.equal(sourceCanonical(bundle[0]), sourceCanonical(pins.bundles[0]));

  const display = bodyDisplayCatalog(rawCatalog);
  for (const { identity, previousReadiness } of pins.entries) {
    assert.equal(previousReadiness, 'pending');
    const raw = rawCatalog.structures.filter((item) => item.id === identity.id);
    const shown = display.structures.filter((item) => item.id === identity.id);
    assert.equal(raw.length, 1, identity.id);
    assert.equal(shown.length, 1, identity.id);
    assert.equal(sourceCanonical(raw[0]), sourceCanonical(identity));
    assert.equal(sourceCanonical(shown[0]), sourceCanonical(identity));
    assert.equal(shown[0].sources[0].sha256, identity.sources[0].sha256);
    assert.equal(shown[0].sources[0].file, identity.sources[0].file);
    assert.equal(shown[0].validation.status, 'unvalidated');
    assert.equal(shown[0].validation.anatomicalReview, false);
    assert.equal(shown[0].provenance.license, pins.license);
    assert.equal(shown[0].bundle, bundle[0].id);
  }
});

test('four shared method groups serve 28 named records, with copy-safe returned arrays', () => {
  assert.deepEqual(Object.keys(dentalMriGroups), groups);
  assert.deepEqual(Object.keys(dentalMriTopics), groups);
  assert.deepEqual(groups.map((group) => dentalMriGroups[group].length), counts);
  assert.deepEqual(new Set(Object.values(dentalMriGroups).flat()),
    new Set(pins.entries.map(({ identity }) => identity.fmaId)));
  const bodies = new Set();
  for (const { group, identity } of pins.entries) {
    assert(dentalMriGroups[group].includes(identity.fmaId));
    const result = dentalMriLesson(identity, 'mri');
    assert.equal(result.readiness, 'draft');
    assert(result.title.startsWith(`${identity.name} · `));
    assert.equal(result.body, dentalMriTopics[group].body);
    assert.deepEqual(result.bullets, dentalMriTopics[group].bullets);
    assert.deepEqual(result.citations, dentalMriTopics[group].citations);
    assert.equal(result.note, dentalMriNote);
    bodies.add(result.body);
    const before = structuredClone(result);
    result.bullets.push('foreign');
    result.citations.push('foreign');
    assert.deepEqual(dentalMriLesson(identity, 'mri'), before);
  }
  assert.equal(bodies.size, 4);
});

test('wrong tabs and changes to every source-bound record field refuse a lesson', () => {
  const edits = [
    (s) => { s.id += '-foreign'; }, (s) => { s.fmaId = 'FMA0'; },
    (s) => { s.name += ' foreign'; }, (s) => { s.sourceName += ' foreign'; },
    (s) => { s.laterality = s.laterality === 'left' ? 'right' : 'left'; },
    (s) => { s.region = 'thorax'; }, (s) => { s.regions.push('thorax'); },
    (s) => { s.system = 'skeleton'; }, (s) => { s.category = 'bone'; },
    (s) => { s.bundle += '-foreign'; }, (s) => { s.nodeName += '-foreign'; },
    (s) => { s.sourceTree = 'foreign'; }, (s) => { s.sources = []; },
    (s) => { s.sources[0].file = 'foreign'; },
    (s) => { s.sources[0].sha256 = '0'.repeat(64); },
    (s) => { s.bounds.min[0] -= 1; }, (s) => { s.bounds.max[0] += 1; },
    (s) => { s.center[0] += 1; }, (s) => { s.anchor[0] += 1; },
    (s) => { s.coverageNote = 'reviewed'; },
    (s) => { s.provenance = { method: 'foreign' }; },
    (s) => { s.validation = { status: 'reviewed', anatomicalReview: true }; },
    (s) => { s.extra = true; },
  ];
  for (const { identity } of pins.entries) {
    for (const tab of ['anatomy', 'function', 'ct', 'xray', 'ultrasound',
      'clinical', 'pathology', 'quiz']) {
      assert.equal(dentalMriLesson(identity, tab), undefined);
    }
    for (const edit of edits) {
      const altered = structuredClone(identity);
      edit(altered);
      assert.equal(dentalMriLesson(altered, 'mri'), undefined);
    }
    const reordered = Object.fromEntries(Object.entries(identity).reverse());
    assert.deepEqual(dentalMriLesson(reordered, 'mri'), dentalMriLesson(identity, 'mri'));
  }
  const lookalikes = rawCatalog.structures.filter((item) => !pinnedIds.has(item.id));
  assert(lookalikes.length > 900);
  for (const item of lookalikes) assert.equal(dentalMriLesson(item, 'mri'), undefined);
  const sameFma = structuredClone(pins.entries[0].identity);
  sameFma.id = 'unrelated';
  assert.equal(dentalMriLesson(sameFma, 'mri'), undefined);
});

test('method citations and limits remain explicit, with pending clinical review', () => {
  const expected = [
    'https://pubmed.ncbi.nlm.nih.gov/22707436/',
    'https://pubmed.ncbi.nlm.nih.gov/23420857/',
    'https://pubmed.ncbi.nlm.nih.gov/40301177/',
  ];
  for (const group of groups) {
    const topic = dentalMriTopics[group];
    assert.deepEqual(topic.citations, expected);
    assert.match(topic.body, /Conventional 3 T turbo spin-echo MRI/);
    assert.match(topic.body, /absent signal alone does not prove/);
  }
  assert.match(dentalMriTopics.incisors.bullets.join(' '), /extracted teeth/);
  assert.match(dentalMriTopics.canines.bullets.join(' '), /restoration artifacts/);
  assert.match(dentalMriTopics.premolars.bullets.join(' '), /21 healthy volunteers, not these premolars/);
  assert.match(dentalMriTopics.molars.bullets.join(' '), /under its protocol/);
  assert.match(dentalMriTopics.molars.bullets.join(' '), /does not show every molar or side/);
  assert.match(dentalMriNote, /revision-bound radiologist review is pending/);
  assert.match(dentalMriNote, /No scan or registration was imported or matched/);
  assert.match(dentalMriNote, /whole exterior tooth surfaces only/);
  assert.match(dentalMriNote, /not separately segmented/);
  assert.match(dentalMriNote, /No clinical numbering, third molars or diagnostic findings/);
  assert.match(dentalMriNote, /Atlas, imaging-case and paid-lecture access remain independent/);
});
