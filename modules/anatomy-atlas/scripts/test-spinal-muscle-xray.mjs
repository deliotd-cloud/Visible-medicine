// Exact-source regression for 56 text-only spinal muscle X-ray drafts.
// Requests use synthetic review identities and a storage trap; no decision is saved.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '4e9f53851cdc55b89ca8bfc1b6d07e19445fc2ad';
const root = process.cwd();
const git = args => execFileSync('git', args, {cwd: root, windowsHide: true,
  maxBuffer: 64e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const original = path => git(['show', `${baseline}:${path}`]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, label) => assert.deepEqual(actual, expected, label);
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);

// Independent enumeration: the generated pin's count cannot select the test set.
const familyFmas = {
  trapeziusAscending: ['FMA33581', 'FMA33583'],
  trapeziusDescending: ['FMA33586', 'FMA33587'],
  trapeziusTransverse: ['FMA33584', 'FMA33585'],
  iliocostalisCervicis: ['FMA22744', 'FMA22745'],
  iliocostalisLumborum: ['FMA22740', 'FMA22741'],
  iliocostalisThoracis: ['FMA22742', 'FMA22743'],
  longissimusCapitis: ['FMA22754', 'FMA22756'],
  longissimusCervicis: ['FMA22757', 'FMA22758'],
  longissimusThoracis: ['FMA22751', 'FMA22753'],
  semispinalisCapitis: ['FMA22876', 'FMA22877'],
  semispinalisCervicis: ['FMA22874', 'FMA22875'],
  semispinalisThoracis: ['FMA22872', 'FMA22873'],
  spleniusCapitis: ['FMA22728', 'FMA22729'],
  spleniusCervicis: ['FMA22726', 'FMA22727'],
  serratusPosteriorInferior: ['FMA13405', 'FMA13406'],
  serratusPosteriorSuperior: ['FMA13403', 'FMA13404'],
  obliquusInferior: ['FMA32536', 'FMA32537'],
  obliquusSuperior: ['FMA32534', 'FMA32535'],
  rectusPosteriorMajor: ['FMA32530', 'FMA32531'],
  rectusPosteriorMinor: ['FMA32532', 'FMA32533'],
  interspinalisThoracis: ['FMA22890', 'FMA22891'],
  cervicalRotator: ['FMA81752', 'FMA81753'],
  lumbarRotator: ['FMA23089', 'FMA23090'],
  levatoresCostarumBreves: ['FMA74077', 'FMA74078'],
  interspinalesCervicis: ['FMA71309'],
  interspinalesLumborum: ['FMA71307'],
  thoracicRotator: ['FMA23083'],
  lumbarIntertransversariusLateral: ['FMA22850'],
  lumbarIntertransversariusMedial: ['FMA22851'],
  cervicalIntertransversariiAnterior: ['FMA71442'],
  cervicalIntertransversariiPosterior: ['FMA71443'],
  spinalis: ['FMA77179'],
};
const expected = new Map(Object.entries(familyFmas).flatMap(([family, fmas]) =>
  fmas.map((fma, index) => [fma, {family,
    side: fmas.length === 1 ? 'midline' : index === 0 ? 'right' : 'left'}])));
assert.equal(Object.keys(familyFmas).length, 32);
assert.equal(expected.size, 56);
const pin = JSON.parse(readFileSync('content/spinal-muscle-xray-pins.json', 'utf8'));
assert.equal(pin.baseline, baseline);
assert.equal(pin.entries.length, 56);
same(new Set(pin.entries.map(entry => entry.identity.fmaId)), new Set(expected.keys()));
assert.equal(new Set(pin.entries.map(entry => entry.identity.id)).size, 56);
const rawPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
same(raw, JSON.parse(original(rawPath)), 'Complete raw source catalog');
for (const key of ['sourceVersion', 'license', 'coordinateSystem'])
  same(pin[key], raw[key], `${key}: source pin`);
const usedBundles = raw.bundles.filter(bundle =>
  pin.entries.some(entry => entry.identity.bundle === bundle.id));
same(pin.bundles, usedBundles, 'Only selected source bundles are pinned');
for (const entry of pin.entries) {
  const spec = expected.get(entry.identity.fmaId);
  assert.equal(entry.family, spec.family);
  assert.equal(entry.identity.laterality, spec.side);
  assert.equal(entry.identity.region, 'spine');
  assert.equal(entry.identity.system, 'muscles');
  assert.equal(entry.identity.category, 'muscle');
  assert.equal(entry.identity.validation.anatomicalReview, false);
  same(raw.structures.filter(row => row.id === entry.identity.id), [entry.identity],
    `${entry.identity.fmaId}: complete source identity and ordered components`);
  assert.equal(entry.previous.readiness, 'pending');
}
for (const family of ['spinalis', 'thoracicRotator', 'interspinalesCervicis',
  'interspinalesLumborum', 'lumbarIntertransversariusLateral',
  'lumbarIntertransversariusMedial', 'cervicalIntertransversariiAnterior',
  'cervicalIntertransversariiPosterior']) {
  const entry = pin.entries.find(row => row.family === family);
  assert(entry.identity.sources.length >= 2, `${family}: aggregate components retained`);
}

const compiled = await build({stdin: {contents: `
export {spinalMuscleXrayLesson} from './lib/spinal-muscle-xray';
export {spinalMuscleXrayFacts,spinalMuscleXrayLimitations} from './content/spinal-muscle-xray';
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
same(catalog, before.bodyDisplayCatalog(JSON.parse(original(rawPath))), 'Displayed catalog');
same(current.structures, before.structures, 'Shoulder structures');
same(current.dissectionProfiles, before.dissectionProfiles, 'Dissection recipes');
same(current.regionalTours, before.regionalTours, 'Guided tours and frames');
same(current.contentTabs, before.contentTabs, 'Topic schema');
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
same(new Set(Object.keys(current.spinalMuscleXrayFacts)), new Set(Object.keys(familyFmas)));
for (const [family, fact] of Object.entries(current.spinalMuscleXrayFacts)) {
  same(Object.keys(fact).sort(), ['body', 'distinction', 'projection', 'references'], family);
  for (const key of ['body', 'distinction', 'projection']) assert(fact[key].length > 30);
  assert(fact.references.length >= 2);
  for (const url of fact.references) assert.match(url, /^https:\/\/[^\s]+$/);
}

let bundles = 0;
for (const bundle of raw.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  same(bytes, original(path), path);
  bundles++;
}
assert.equal(bundles, 86);
for (const path of ['lib/regional-tours.ts', 'content/nested-teaching.ts',
  'app/anatomy-data.ts', 'app/dissection-data.ts',
  'public/models/bodyparts3d/manifest.json'])
  same(readFileSync(path), original(path), `${path}: unchanged source or frame`);
assert.equal(git(['diff', '--name-only', baseline, '--', 'public/models']).toString().trim(),
  '', 'No model or frame paths changed');

const entries = new Map(pin.entries.map(entry => [entry.identity.id, entry]));
const familyBodies = new Map();
const readiness = new Map();
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
    'oai-authenticated-user-id': 'SYNTHETIC_SPINAL_MUSCLE_XRAY'},
  body: JSON.stringify(packet),
});
const storage = {prepare() {storageCalls++; throw Error('Invalid decision reached storage');}};

for (const structure of catalog.structures) {
  const selected = entries.get(structure.id);
  for (const tab of current.contentTabs) {
    const prior = before.bodyLesson(structure, tab);
    const lesson = current.bodyLesson(structure, tab);
    readiness.set(lesson.readiness, (readiness.get(lesson.readiness) || 0) + 1);
    if (selected && tab === 'xray') {
      same(prior, selected.previous, `${structure.id}: exact pending predecessor`);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.title, `${structure.name} · X-ray orientation · draft`);
      same(lesson, current.spinalMuscleXrayLesson(structure, tab));
      const {readiness: omitted, ...learner} = lesson;
      same(current.bodyContent(structure, tab), learner,
        `${structure.id}: learner view removes readiness only`);
      const fact = current.spinalMuscleXrayFacts[selected.family];
      assert.equal(lesson.body, fact.body);
      same(lesson.bullets, [fact.distinction, fact.projection,
        ...current.spinalMuscleXrayLimitations]);
      same(lesson.citations, [...fact.references]);
      const body = [lesson.body, ...lesson.bullets].join(' ');
      assert.match(body, /(?:radiograph|plain film|X-ray)/i);
      assert.match(body, /(?:cannot|not|limitation|projection|overlap)/i);
      assert.doesNotMatch(body, /\b(?:\d+(?:\.\d+)?\s*(?:mm|cm|degrees?|%|pixels?)|sensitivity\s*\d+|specificity\s*\d+)\b/i,
        'No unsupported numeric visibility threshold');
      assert.match(body, /(?:neither a simulated X-ray projection|not a simulated X-ray projection)/i);
      assert.match(lesson.note, /original educational draft/i);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.match(lesson.note, /no acquired image/i);
      assert.match(lesson.note, /clinical approval/i);
      assert.match(lesson.note, /diagnosis/i);
      assert.match(lesson.note, /validated muscle attachment/i);
      assert.match(lesson.note, /patient-space registration/i);
      assert.match(lesson.note, /independent/i);
      const teaching = [fact.body, fact.distinction, fact.projection].join(' ');
      const known = familyBodies.get(selected.family);
      if (known) same(teaching, known, `${selected.family}: bilateral teaching`);
      else familyBodies.set(selected.family, teaching);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      same(current.spinalMuscleXrayLesson(structure, tab), copy, 'Fresh lesson arrays');
      changed++;
    } else {
      same(lesson, prior, `${structure.id}:${tab}: unaffected lesson`);
      assert.equal(current.spinalMuscleXrayLesson(structure, tab), undefined);
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
    {tab: 'xray', ...current.spinalMuscleXrayLesson(structure, 'xray')});
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
  assert.equal(context.rendererHash, renderer.sha256);
  const geometryRevision = value => sha256(JSON.stringify({
    catalogScope: value.catalogScope, structureId: value.structureId,
    checklistVersion: value.checklistVersion, source: value.sourceHash,
    renderer: value.rendererHash, checks: value.checklists.geometry,
  }));
  assert.equal(context.revisions.geometry, geometryRevision(context));
  assert.equal(priorContext.revisions.geometry, geometryRevision(priorContext));
  same(context.checklists.geometry, priorContext.checklists.geometry,
    `${structure.id}: geometry checks unchanged`);
  if (context.rendererHash !== priorContext.rendererHash)
    assert.notEqual(context.revisions.geometry, priorContext.revisions.geometry,
      'New renderer requires a fresh geometry review revision');
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
  [56, 9880, 56, 1048]);
same(Object.fromEntries(readiness),
  {draft: 9258, pending: 639, 'generated-identification': 39});
assert.equal(familyBodies.size, 32);
assert.equal(new Set(familyBodies.values()).size, 32, 'Distinct original family teaching');

for (const {identity} of pin.entries) {
  for (const tab of current.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(current.spinalMuscleXrayLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign`
      : typeof value === 'number' ? value + .01
      : value === null ? 'foreign' : !value;
    assert.equal(current.spinalMuscleXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}: changed source or frame field`);
    refused++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.spinalMuscleXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}: changed source components or frame array`);
    refused++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).foreign = true;
    assert.equal(current.spinalMuscleXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.') || '<root>'}: foreign identity field`);
    refused++;
  }
  for (const field of ['id', 'name', 'fmaId', 'laterality', 'region', 'bundle',
    'sourceHash', 'sourceParts', 'frame', 'coordinateSystem']) {
    const bad = structuredClone(identity);
    if (Object.hasOwn(bad, field)) continue;
    bad[field] = 'foreign';
    assert.equal(current.spinalMuscleXrayLesson(bad, 'xray'), undefined,
      `${identity.id}: invented ${field}`);
    refused++;
  }
}
const other = catalog.structures.find(row => !entries.has(row.id) &&
  row.fmaId && row.region === 'spine' && row.system === 'muscles');
assert(other, 'An unrelated spinal muscle exists');
assert.equal(current.spinalMuscleXrayLesson(other, 'xray'), undefined);
console.log(JSON.stringify({baseline, changed, preserved, bundles,
  changedWorksheets, unaffectedWorksheets, readiness: Object.fromEntries(readiness),
  refusedIdentities: refused, malformedPacketsRefused: malformed,
  stalePacketsAndDecisionsRefused: stale, storageCalls, clinicalApproval: false}));
