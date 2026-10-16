// Exact-source regression for the six cervical projection teaching drafts.
// This suite uses synthetic review requests only; it never opens decision storage.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '408759d57644b05402e98a937e7cf6338b5509cf';
const root = process.cwd();
const git = args => execFileSync('git', args, {cwd: root, windowsHide: true,
  maxBuffer: 64e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const original = path => git(['show', `${baseline}:${path}`]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, label) => assert.deepEqual(actual, expected, label);
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);

const expected = new Map([
  ['FMA46309', ['longusCapitis', 'right', 'FJ1582']],
  ['FMA46310', ['longusCapitis', 'left', 'FJ1561']],
  ['FMA46313', ['rectusAnterior', 'right', 'FJ1588']],
  ['FMA46314', ['rectusAnterior', 'left', 'FJ1566']],
  ['FMA46317', ['rectusLateralis', 'right', 'FJ1591']],
  ['FMA46318', ['rectusLateralis', 'left', 'FJ1569']],
]);
const pin = JSON.parse(readFileSync('content/cervical-projection-xray-pins.json', 'utf8'));
assert.equal(pin.baseline, baseline);
assert.equal(pin.entries.length, 6);
same(new Set(pin.entries.map(entry => entry.identity.fmaId)), new Set(expected.keys()));
assert.equal(new Set(pin.entries.map(entry => entry.identity.id)).size, 6);
const rawPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
same(raw, JSON.parse(original(rawPath)), 'Complete source catalog is baseline-identical');
for (const key of ['sourceVersion', 'license', 'coordinateSystem'])
  same(pin[key], raw[key], `${key}: pin equals exact source`);
same(pin.bundles, raw.bundles.filter(bundle => bundle.id === 'spine-muscles'),
  'Pin contains precisely the source bundle used by all six structures');
for (const entry of pin.entries) {
  const [family, side, file] = expected.get(entry.identity.fmaId);
  assert.equal(entry.family, family);
  assert.equal(entry.identity.laterality, side);
  assert.equal(entry.identity.region, 'spine');
  assert.equal(entry.identity.system, 'muscles');
  assert.equal(entry.identity.category, 'muscle');
  assert.equal(entry.identity.validation.anatomicalReview, false);
  assert.deepEqual(entry.identity.sources.map(part => part.file), [file]);
  same(raw.structures.filter(row => row.id === entry.identity.id), [entry.identity],
    `${entry.identity.fmaId}: complete pinned identity`);
  assert.equal(entry.previous.readiness, 'pending');
}

// Read the real production modules through the workspace resolver. No facsimile
// of the dispatch, review worksheet, or source-matching implementation is used.
const compiled = await build({stdin: {contents: `
export {cervicalProjectionXrayLesson} from './lib/cervical-projection-xray';
export {cervicalProjectionXrayFacts,cervicalProjectionXrayLimitations,cervicalProjectionXrayReferences} from './content/cervical-projection-xray';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';
`, resolveDir: root, loader: 'ts'}, bundle: true, write: false,
  platform: 'node', format: 'esm'});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const before = await exactSourceHistoryApi(baseline, 'review-security');
const catalog = current.bodyDisplayCatalog(raw);
same(catalog, before.bodyDisplayCatalog(JSON.parse(original(rawPath))), 'Displayed source catalog');
same(current.structures, before.structures, 'Shoulder teaching structures');
same(current.dissectionProfiles, before.dissectionProfiles, 'Shoulder recipes');
same(current.regionalTours, before.regionalTours, 'Guided tours and frames');
same(current.contentTabs, before.contentTabs, 'Topic schema');
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
assert.deepEqual(Object.keys(current.cervicalProjectionXrayFacts).sort(),
  ['longusCapitis', 'rectusAnterior', 'rectusLateralis'].sort());
assert(Object.keys(current.cervicalProjectionXrayReferences).length >= 2);
for (const url of Object.values(current.cervicalProjectionXrayReferences))
  assert.match(url, /^https:\/\/[^\s]+$/);

// All model bundles, and every available source frame, stay byte-identical.
let bundles = 0;
for (const bundle of raw.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  same(bytes, original(path), path);
  bundles++;
}
for (const path of ['lib/regional-tours.ts', 'content/nested-teaching.ts',
  'app/anatomy-data.ts', 'app/dissection-data.ts',
  'public/models/bodyparts3d/manifest.json'])
  same(readFileSync(path), original(path), `${path}: unchanged source or frame`);
assert.equal(git(['diff', '--name-only', baseline, '--', 'public/models']).toString().trim(),
  '', 'No model or frame paths changed');

const entries = new Map(pin.entries.map(entry => [entry.identity.id, entry]));
const familyBodies = new Map();
let changed = 0, preserved = 0, changedWorksheets = 0, unaffectedWorksheets = 0;
let refused = 0, malformed = 0, stale = 0, storageCalls = 0;
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value)
    .flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
const request = packet => new Request('https://atlas.test/api/body-decisions', {
  method: 'POST', headers: {origin: 'https://atlas.test',
    'content-type': 'application/json',
    'oai-authenticated-user-id': 'SYNTHETIC_CERVICAL_PROJECTION_XRAY'},
  body: JSON.stringify(packet),
});
const storage = {prepare() {storageCalls++; throw Error('Invalid decision reached storage');}};

for (const structure of catalog.structures) {
  const selected = entries.get(structure.id);
  for (const tab of current.contentTabs) {
    const prior = before.bodyLesson(structure, tab);
    const lesson = current.bodyLesson(structure, tab);
    if (selected && tab === 'xray') {
      same(prior, selected.previous, `${structure.id}: exact pending predecessor`);
      assert.equal(lesson.readiness, 'draft');
      same(lesson, current.cervicalProjectionXrayLesson(structure, tab));
      const {readiness, ...learner} = lesson;
      same(current.bodyContent(structure, tab), learner,
        `${structure.id}: learner text removes readiness only`);
      const body = [lesson.body, ...lesson.bullets].join(' ');
      assert.match(body, /(?:radiograph|plain film|X-ray)/i);
      assert.match(body, /(?:cannot|not|limitation|projection|overlap)/i);
      assert.doesNotMatch(body, /\b(?:\d+(?:\.\d+)?\s*(?:mm|cm|degrees?|%|pixels?)|sensitivity\s*\d+|specificity\s*\d+)\b/i,
        'No unsupported numeric visibility threshold');
      assert.doesNotMatch(body, /(?:individual|each|this)\s+(?:muscle|belly)\s+(?:is|can be)\s+(?:seen|visible|identified|traced)\s+on\s+(?:a\s+)?(?:plain|cervical|lateral)?\s*(?:film|radiograph|X-ray)/i);
      assert.match(body, /not a simulated X-ray projection.*registered patient scan/i);
      assert.match(lesson.note, /review pending|radiologist.*pending|pending.*radiologist/i);
      assert.match(lesson.note, /revision/i);
      assert.match(lesson.note, /independent/i);
      assert.match(lesson.note, /(?:no acquired image|no patient|patient-space registration)/i);
      same(lesson.citations, [...current.cervicalProjectionXrayReferences],
        `${structure.id}: cited source list`);
      for (const limitation of current.cervicalProjectionXrayLimitations)
        assert(lesson.bullets.includes(limitation), `${structure.id}: plain-film and model limit`);
      for (const url of lesson.citations) assert.match(url, /^https:\/\/[^\s]+$/);
      const known = familyBodies.get(selected.family);
      if (known) same(body, known, `${selected.family}: bilateral teaching`);
      else familyBodies.set(selected.family, body);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      same(current.cervicalProjectionXrayLesson(structure, tab), copy,
        'Fresh lesson arrays');
      changed++;
    } else {
      same(lesson, prior, `${structure.id}:${tab}: unaffected lesson`);
      assert.equal(current.cervicalProjectionXrayLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const oldPacket = await before.bodyReviewMaterial(structure.id);
  const packet = await current.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  assert.equal(packet.status, 'worksheet-not-submitted');
  if (!selected) {
    same(packet, oldPacket, `${structure.id}: unaffected review worksheet`);
    unaffectedWorksheets++;
    continue;
  }
  for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
    same(packet[key], oldPacket[key], `${structure.id}:${key}: review preservation`);
  same(packet.topics.filter(topic => topic.tab !== 'xray'),
    oldPacket.topics.filter(topic => topic.tab !== 'xray'),
    `${structure.id}: other review topics`);
  same(packet.topics.find(topic => topic.tab === 'xray'),
    {tab: 'xray', ...current.cervicalProjectionXrayLesson(structure, 'xray')});
  assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
  assert.equal(packet.fingerprints.checklist, oldPacket.fingerprints.checklist);
  assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
  assert.notEqual(packet.materialHash, oldPacket.materialHash);
  same(await current.parseBodyReviewResponse(packet, structure.id), packet,
    `${structure.id}: current exact worksheet accepted`);
  assert.equal(await current.parseBodyReviewResponse(oldPacket, structure.id), null,
    `${structure.id}: prior review packet is stale`);
  stale++;
  for (const edit of [
    p => {p.topics.find(topic => topic.tab === 'xray').body += ' foreign';},
    p => {p.topics.find(topic => topic.tab === 'xray').citations = ['https://foreign.example'];},
    p => {p.topics.find(topic => topic.tab === 'xray').readiness = 'approved';},
    p => {p.source.structure.sources = [];},
    p => {p.topics.splice(p.topics.findIndex(topic => topic.tab === 'xray'), 1);},
  ]) {
    const forged = structuredClone(packet); edit(forged);
    assert.equal(await current.parseBodyReviewResponse(forged, structure.id), null);
    malformed++;
  }
  const priorContext = await before.bodyReviewContext(structure.id);
  const context = await current.bodyReviewContext(structure.id);
  assert.equal(context.sourceHash, priorContext.sourceHash);
  const renderer = JSON.parse(readFileSync('content/body-renderer-revision.json', 'utf8'));
  assert.equal(context.rendererHash, renderer.sha256,
    `${structure.id}: current revision uses the generated renderer stamp`);
  const geometryRevision = value => sha256(JSON.stringify({
    catalogScope: value.catalogScope,
    structureId: value.structureId,
    checklistVersion: value.checklistVersion,
    source: value.sourceHash,
    renderer: value.rendererHash,
    checks: value.checklists.geometry,
  }));
  assert.equal(context.revisions.geometry, geometryRevision(context),
    `${structure.id}: exact current geometry revision formula`);
  assert.equal(priorContext.revisions.geometry, geometryRevision(priorContext),
    `${structure.id}: exact baseline geometry revision formula`);
  assert.deepEqual(context.checklists.geometry, priorContext.checklists.geometry,
    `${structure.id}: geometry checks unchanged`);
  if (context.rendererHash === priorContext.rendererHash)
    assert.equal(context.revisions.geometry, priorContext.revisions.geometry);
  else assert.notEqual(context.revisions.geometry, priorContext.revisions.geometry,
    `${structure.id}: regenerated renderer requires a new review revision`);
  assert.equal(context.revisions.imaging, null);
  assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
  const decision = {catalogScope: priorContext.catalogScope,
    structureId: structure.id, track: 'teaching', expectedVersion: 0,
    materialHash: priorContext.materialHash,
    revisionHash: priorContext.revisions.teaching,
    checklistVersion: priorContext.checklistVersion,
    draft: current.blankBodyReview(priorContext, 'teaching')};
  assert.equal((await current.postBodyDecision(request(decision), storage)).status, 409,
    `${structure.id}: stale decision rejected before storage`);
  stale++;
  changedWorksheets++;
}
same([changed, preserved, changedWorksheets, unaffectedWorksheets],
  [6, 9930, 6, 1098]);
assert.equal(familyBodies.size, 3);
assert.equal(new Set(familyBodies.values()).size, 3,
  'Three cervical muscle families require distinct original teaching');

for (const {identity} of pin.entries) {
  for (const tab of current.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(current.cervicalProjectionXrayLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign`
      : typeof value === 'number' ? value + .01
      : value === null ? 'foreign' : !value;
    assert.equal(current.cervicalProjectionXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}: changed source or frame field`);
    refused++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.cervicalProjectionXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}: changed source parts or frame array`);
    refused++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).foreign = true;
    assert.equal(current.cervicalProjectionXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.') || '<root>'}: foreign identity field`);
    refused++;
  }
  for (const field of ['id', 'name', 'fmaId', 'laterality', 'region', 'bundle',
    'sourceHash', 'sourceParts', 'frame', 'coordinateSystem']) {
    const bad = structuredClone(identity);
    if (Object.hasOwn(bad, field)) continue; // Existing fields are mutated above.
    bad[field] = 'foreign';
    assert.equal(current.cervicalProjectionXrayLesson(bad, 'xray'), undefined,
      `${identity.id}: invented ${field} must not be accepted`);
    refused++;
  }
}
const other = catalog.structures.find(row => !entries.has(row.id) && row.fmaId && row.region === 'spine');
assert(other, 'An unrelated spine structure exists');
assert.equal(current.cervicalProjectionXrayLesson(other, 'xray'), undefined,
  'Same region alone cannot select a lesson');
console.log(JSON.stringify({baseline, changed, preserved, bundles,
  changedWorksheets, unaffectedWorksheets, refusedIdentities: refused,
  malformedPacketsRefused: malformed, stalePacketsAndDecisionsRefused: stale,
  storageCalls, clinicalApproval: false}));
