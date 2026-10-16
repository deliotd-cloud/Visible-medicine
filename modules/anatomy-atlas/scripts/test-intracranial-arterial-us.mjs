// Exact-source regression for eight intracranial arterial ultrasound drafts.
// Review probes use synthetic identities and a storage trap; no decision is saved.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';
const root = process.cwd();
const git = args => execFileSync('git', args, {cwd: root, windowsHide: true,
  maxBuffer: 64e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const original = path => git(['show', `${baseline}:${path}`]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, label) => assert.deepEqual(actual, expected, label);
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);

// Independently enumerated from the archived display catalogue, including its
// separate cranial-arteries MCA entry. The pin is checked against this set.
const specs = [
  ['aca','FMA50029','Right anterior cerebral artery','right',['FJ1654']],
  ['aca','FMA50030','Left anterior cerebral artery','left',['FJ1654M']],
  ['acom','FMA50169','Anterior communicating artery','midline',['FJ1655']],
  ['pca','FMA50584','Right posterior cerebral artery','right',
    ['FJ1661','FJ1675','FJ1677','FJ1678','FJ1680','FJ1687','FJ1691','FJ1720','FJ1727']],
  ['pca','FMA50585','Left posterior cerebral artery','left',
    ['FJ1661M','FJ1675M','FJ1677M','FJ1678M','FJ1680M','FJ1687M','FJ1691M','FJ1720M','FJ1727M']],
  ['pcom','FMA50085','Right posterior communicating artery','right',['FJ1713']],
  ['pcom','FMA50086','Left posterior communicating artery','left',['FJ1713M']],
  ['mca','FMA50082','Right middle cerebral artery','right',['FJ1662','FJ1663','FJ1692']],
];
assert.equal(specs.length, 8);
const expected = new Map(specs.map(([family, fmaId, name, side, files]) =>
  [fmaId, {family, name, side, files}]));
assert.equal(expected.size, 8);
const rawPath = 'public/models/bodyparts3d/full-body/catalog.json';
same(readFileSync(rawPath), original(rawPath), 'Raw source catalogue bytes');
const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
const pin = JSON.parse(readFileSync('content/intracranial-arterial-us-pins.json', 'utf8'));
assert.equal(pin.baseline, baseline);
assert.equal(pin.entries.length, 8);
same(new Set(pin.entries.map(row => row.identity.fmaId)), new Set(expected.keys()));
assert.equal(new Set(pin.entries.map(row => row.identity.id)).size, 8);

const compiled = await build({stdin: {contents: `
export {intracranialArterialUsLesson} from './lib/intracranial-arterial-us';
export * from './content/intracranial-arterial-us';
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
same(catalog, before.bodyDisplayCatalog(JSON.parse(original(rawPath))), 'Display catalogue');
same(current.structures, before.structures, 'Shoulder selections');
same(current.dissectionProfiles, before.dissectionProfiles, 'Dissection recipes');
same(current.regionalTours, before.regionalTours, 'Tours and frames');
same(current.contentTabs, before.contentTabs, 'Topic schema');
assert.equal(catalog.structures.length, 1104);
assert.equal(current.contentTabs.length, 9);
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
for (const key of ['sourceVersion','license','coordinateSystem'])
  same(pin[key], catalog[key], `${key}: source and pin match`);
assert.equal(pin.sourceVersion, '4.0');
assert.equal(pin.license, 'CC-BY-4.0');
same(pin.bundles, catalog.bundles.filter(bundle =>
  pin.entries.some(entry => entry.identity.bundle === bundle.id)), 'Selected bundles only');
assert.equal(pin.bundles.length, 2);
for (const entry of pin.entries) {
  const id = entry.identity, spec = expected.get(id.fmaId);
  assert(spec, `${id.fmaId}: admitted source`);
  assert.equal(entry.family, spec.family);
  assert.equal(id.name, spec.name);
  assert.equal(id.laterality, spec.side);
  assert.equal(id.region, 'head-neck');
  assert.equal(id.system, 'vessels');
  assert.equal(id.category, 'vessel');
  assert.equal(id.nodeName, id.fmaId);
  assert.equal(id.validation.status, 'unvalidated');
  assert.equal(id.validation.anatomicalReview, false);
  same(id.sources.map(source => source.file), spec.files,
    `${id.fmaId}: exact ordered source files`);
  same(catalog.structures.filter(row => row.fmaId === id.fmaId), [id],
    `${id.fmaId}: full canonical identity, hashes, bounds and frame`);
  assert.equal(entry.previous.readiness, 'pending');
}
const mca = pin.entries.find(entry => entry.family === 'mca').identity;
assert.equal(mca.sources.length, 3);
assert.match(mca.coverageNote, /partial|selected|segment/i);
assert.equal(pin.entries.filter(entry => entry.family === 'mca').length, 1,
  'Only source-present right MCA admitted');
assert.equal(pin.entries.filter(entry => entry.family === 'pca').length, 2);
for (const entry of pin.entries.filter(entry => entry.family === 'pca'))
  assert.equal(entry.identity.sources.length, 9, 'Nine parts remain one source identity');

same(new Set(Object.keys(current.intracranialArterialUsFacts)),
  new Set(['aca','acom','pca','pcom','mca']));
const scopedReferences = new Set([
  'https://onlinelibrary.wiley.com/doi/10.1002/jum.16234',
  'https://pubmed.ncbi.nlm.nih.gov/17238867/',
  'https://pubmed.ncbi.nlm.nih.gov/9010531/',
  'https://pubmed.ncbi.nlm.nih.gov/8610318/',
  'https://pubmed.ncbi.nlm.nih.gov/9372576/',
]);
for (const [family, fact] of Object.entries(current.intracranialArterialUsFacts)) {
  same(Object.keys(fact).sort(), ['body','bullets','references'], family);
  assert(fact.body.length > 50, `${family}: substantive body`);
  assert(fact.bullets.length >= 2, `${family}: scoped cautions`);
  assert(fact.references.length >= 1, `${family}: references`);
  for (const url of fact.references) {
    assert.match(url, /^https:\/\/[^\s]+$/);
    assert(scopedReferences.has(url), `${family}: reference from scoped reading set`);
  }
}
same(new Set(Object.values(current.intracranialArterialUsFacts)
  .flatMap(fact => fact.references)), scopedReferences,
  'All and only scoped primary reading links are cited');
assert.match(current.intracranialArterialUsFacts.mca.bullets.join(' '),
  /three.*files.*six.*components.*right/i);
assert.match(current.intracranialArterialUsFacts.pca.bullets.join(' '),
  /nine.*files.*not validated P1\/P2/i);
assert.match(current.intracranialArterialUsFacts.acom.bullets.join(' '),
  /does not demonstrate.*cross.flow or collateral adequacy/i);
assert.match(current.intracranialArterialUsFacts.pcom.bullets.join(' '),
  /(?:constant flow direction|false positives.*false negatives)/i);
assert(current.intracranialArterialUsLimitations.length >= 3);
assert.match(current.intracranialArterialUsNote, /revision.bound radiologist review/i);
assert.match(current.intracranialArterialUsNote, /clinical approval is not supplied/i);
let bundles = 0;
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  same(bytes, original(path), `${path}: immutable model`);
  bundles++;
}
for (const path of ['app/anatomy-data.ts','app/dissection-data.ts',
  'lib/regional-tours.ts','content/nested-teaching.ts',
  'public/models/bodyparts3d/manifest.json'])
  same(readFileSync(path), original(path), `${path}: unchanged source or frame`);
assert.equal(git(['diff','--name-only',baseline,'--','public/models']).toString().trim(),
  '', 'No model or frame paths changed');

const entries = new Map(pin.entries.map(entry => [entry.identity.id, entry]));
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
    'oai-authenticated-user-id': 'SYNTHETIC_INTRACRANIAL_US'},
  body: JSON.stringify(packet),
});
const storage = {prepare() {storageCalls++; throw Error('Invalid decision reached storage');}};

for (const structure of catalog.structures) {
  const selected = entries.get(structure.id);
  for (const tab of current.contentTabs) {
    const prior = before.bodyLesson(structure, tab);
    const lesson = current.bodyLesson(structure, tab);
    readiness.set(lesson.readiness, (readiness.get(lesson.readiness) || 0) + 1);
    if (selected && tab === 'ultrasound') {
      same(prior, selected.previous, `${structure.id}: exact pending predecessor`);
      assert.equal(lesson.readiness, 'draft');
      same(lesson, current.intracranialArterialUsLesson(structure, tab));
      const fact = current.intracranialArterialUsFacts[selected.family];
      assert.equal(lesson.body, fact.body);
      same(lesson.bullets, [...fact.bullets,
        `Retained source: ${structure.fmaId} · ${structure.laterality} · ${structure.sources.length} source file${structure.sources.length === 1 ? '' : 's'}.`,
        `Source limit: ${structure.coverageNote}`,
        ...current.intracranialArterialUsLimitations]);
      same(lesson.citations, [...fact.references]);
      assert.equal(lesson.note, current.intracranialArterialUsNote);
      const {readiness: omitted, ...learner} = lesson;
      same(current.bodyContent(structure, tab), learner,
        `${structure.id}: learner view removes readiness only`);
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /ultrasound|sonograph|Doppler/i);
      assert.match(prose, /flow/i);
      assert.doesNotMatch(prose, /(?:model|mesh|source).{0,55}(?:shows|proves|confirms|measures).{0,35}(?:flow|patency|stenosis|velocity)/i);
      assert.doesNotMatch(prose, /(?:we supply|included|provided|attached).{0,35}(?:patient|acquired).{0,20}(?:ultrasound|Doppler|image|scan)/i);
      assert.doesNotMatch(prose, /(?:registered|registration).{0,30}(?:patient|image|scan)/i);
      assert.doesNotMatch(prose, /(?:%|percent|cm\/s|mmHg).{0,30}(?:stenosis|velocity)|(?:stenosis|velocity).{0,30}(?:%|percent|cm\/s|mmHg)/i);
      assert.doesNotMatch(prose, /(?:requires|apply|use).{0,30}(?:compression|probe pressure)/i);
      assert.match(lesson.note, /revision.bound radiologist review/i);
      assert.match(lesson.note, /clinical approval is not supplied/i);
      assert.match(lesson.note, /Case, Atlas and lecture access remain independent/i);
      if (selected.family === 'mca') {
        assert.match(prose, /partial|selected|segment/i);
        assert.match(prose, /right/i);
      }
      if (selected.family === 'pca')
        assert.match(prose, /nine retained source files.*not validated P1\/P2 assignments/i);
      if (selected.family === 'acom')
        assert.doesNotMatch(prose, /(?:flow|signal).{0,35}(?:proves|confirms|guarantees).{0,25}collateral/i);
      if (selected.family === 'pcom')
        assert.doesNotMatch(prose, /(?:always|universally|invariably).{0,30}(?:direction|anterograde|retrograde)/i);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      same(current.intracranialArterialUsLesson(structure, tab), copy,
        'Fresh lesson arrays');
      changed++;
    } else {
      same(lesson, prior, `${structure.id}:${tab}: unaffected lesson`);
      assert.equal(current.intracranialArterialUsLesson(structure, tab), undefined);
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
  for (const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
    same(packet[key], oldPacket[key], `${structure.id}:${key}: review preservation`);
  same(packet.topics.filter(topic => topic.tab !== 'ultrasound'),
    oldPacket.topics.filter(topic => topic.tab !== 'ultrasound'));
  same(packet.topics.find(topic => topic.tab === 'ultrasound'),
    {tab: 'ultrasound', ...current.intracranialArterialUsLesson(structure, 'ultrasound')});
  assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
  assert.equal(packet.fingerprints.checklist, oldPacket.fingerprints.checklist);
  assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
  assert.notEqual(packet.materialHash, oldPacket.materialHash);
  const parsed = await current.parseBodyReviewResponse(packet, structure.id);
  assert.notEqual(parsed, null, `${structure.id}: current worksheet must match trusted display pin`);
  same(parsed, packet);
  assert.equal(await current.parseBodyReviewResponse(oldPacket, structure.id), null);
  stale++;
  for (const edit of [
    p => {p.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign';},
    p => {p.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example'];},
    p => {p.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved';},
    p => {p.source.structure.sources = [];},
    p => {p.source.structure.validation.anatomicalReview = true;},
    p => {p.topics.splice(p.topics.findIndex(topic => topic.tab === 'ultrasound'), 1);},
  ]) {
    const forged = structuredClone(packet); edit(forged);
    assert.equal(await current.parseBodyReviewResponse(forged, structure.id), null);
    malformed++;
  }
  const priorContext = await before.bodyReviewContext(structure.id);
  const context = await current.bodyReviewContext(structure.id);
  assert.equal(context.sourceHash, priorContext.sourceHash);
  const renderer = JSON.parse(readFileSync('content/body-renderer-revision.json','utf8'));
  assert.equal(context.rendererHash,renderer.sha256,'Current renderer remains an exact independent review input');
  const geometryRevision=value=>sha256(JSON.stringify({catalogScope:value.catalogScope,structureId:value.structureId,
    checklistVersion:value.checklistVersion,source:value.sourceHash,renderer:value.rendererHash,checks:value.checklists.geometry}));
  assert.equal(context.revisions.geometry,geometryRevision(context));
  assert.equal(priorContext.revisions.geometry,geometryRevision(priorContext));
  same(context.checklists.geometry, priorContext.checklists.geometry);
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
same([changed,preserved,changedWorksheets,unaffectedWorksheets], [8,9928,8,1096]);
same(Object.fromEntries(readiness),
  {draft: 9302, pending: 595, 'generated-identification': 39});

for (const {identity} of pin.entries) {
  for (const tab of current.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.equal(current.intracranialArterialUsLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign`
      : typeof value === 'number' ? value + .01
      : value === null ? 'foreign' : !value;
    assert.equal(current.intracranialArterialUsLesson(bad, 'ultrasound'), undefined,
      `${identity.id}:${path.join('.')}: changed canonical field`);
    refused++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.intracranialArterialUsLesson(bad, 'ultrasound'), undefined,
      `${identity.id}:${path.join('.')}: changed source or frame array`);
    refused++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).foreign = true;
    assert.equal(current.intracranialArterialUsLesson(bad, 'ultrasound'), undefined,
      `${identity.id}:${path.join('.') || '<root>'}: foreign identity field`);
    refused++;
  }
  for (const field of ['sourceHash','sourceParts','frame','coordinateSystem']) {
    if (Object.hasOwn(identity, field)) continue;
    const bad = structuredClone(identity); bad[field] = 'foreign';
    assert.equal(current.intracranialArterialUsLesson(bad, 'ultrasound'), undefined);
    refused++;
  }
  const wrong = catalog.structures.find(row => row.id !== identity.id);
  const mismatched = structuredClone(identity); mismatched.sources = wrong.sources;
  assert.equal(current.intracranialArterialUsLesson(mismatched, 'ultrasound'), undefined,
    'Same ID with another source refuses');
  refused++;
}
for (const outside of catalog.structures.filter(row =>
  row.region === 'head-neck' && row.system === 'vessels' && !entries.has(row.id)))
  assert.equal(current.intracranialArterialUsLesson(outside, 'ultrasound'), undefined);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({baseline, changed, preserved, bundles,
  changedWorksheets, unaffectedWorksheets, readiness: Object.fromEntries(readiness),
  refusedIdentities: refused, malformedPacketsRefused: malformed,
  stalePacketsAndDecisionsRefused: stale, storageCalls, clinicalApproval: false}));
