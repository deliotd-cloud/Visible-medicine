// Exact-source regression for 36 original hand-vessel X-ray teaching drafts.
// Review probes use synthetic identities and a storage trap; no decision is saved.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '8d32653eaac8b86521618c824214dd6af8e35e29';
const root = process.cwd();
const git = args => execFileSync('git', args, {cwd: root, windowsHide: true,
  maxBuffer: 64e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const original = path => git(['show', `${baseline}:${path}`]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, label) => assert.deepEqual(actual, expected, label);
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);

// Independently fixed from the archived BodyParts3D catalogue and hand source
// admission: these identities, names and ordered components select the test set.
// The generated pin is evidence to compare, never the source of the expected set.
const specs = [
  ['metacarpalArtery','FMA22864','Right palmar metacarpal artery','right',['FJ2289']],
  ['metacarpalArtery','FMA22865','Left palmar metacarpal artery','left',['FJ2237']],
  ['radialis','FMA22777','Right arteria radialis indicis','right',['FJ2342','FJ2363']],
  ['radialis','FMA22778','Left arteria radialis indicis','left',['FJ2314','FJ2332']],
  ['commonFirst','FMA22856','Right first common palmar digital artery','right',['FJ2343']],
  ['commonFirst','FMA85118','Left first common palmar digital artery','left',['FJ2315']],
  ['commonSecond','FMA85119','Right second common palmar digital artery','right',['FJ2344']],
  ['commonSecond','FMA85120','Left second common palmar digital artery','left',['FJ2316']],
  ['commonThird','FMA85121','Right third common palmar digital artery','right',['FJ2345']],
  ['commonThird','FMA85122','Left third common palmar digital artery','left',['FJ2317']],
  ['commonFourth','FMA85123','Right fourth common palmar digital artery','right',['FJ2370']],
  ['commonFourth','FMA85124','Left fourth common palmar digital artery','left',['FJ2337']],
  ['properMiddleLateral','FMA22858','Lateral proper palmar digital artery of right middle finger','right',['FJ2365']],
  ['properMiddleLateral','FMA22860','Lateral proper palmar digital artery of left middle finger','left',['FJ2334']],
  ['properIndexMedial','FMA23050','Medial proper palmar digital artery of right index finger','right',['FJ2364']],
  ['properIndexMedial','FMA23051','Medial proper palmar digital artery of left index finger','left',['FJ2333']],
  ['properRingMedial','FMA23052','Medial proper palmar digital artery of right ring finger','right',['FJ2369']],
  ['properLittleLateral','FMA23054','Lateral proper palmar digital artery of right little finger','right',['FJ2368']],
  ['properLittleLateral','FMA23055','Lateral proper palmar digital artery of left little finger','left',['FJ2336']],
  ['properMiddleMedial','FMA85112','Medial proper palmar digital artery of right middle finger','right',['FJ2367']],
  ['properRingLateral','FMA85115','Lateral proper palmar digital artery of right ring finger','right',['FJ2366']],
  ['properRingLateral','FMA85116','Lateral proper palmar digital artery of left ring finger','left',['FJ2335']],
  ['deepVenousArch','FMA22912','Right deep palmar venous arch','right',['FJ2281']],
  ['deepVenousArch','FMA22913','Left deep palmar venous arch','left',['FJ2229']],
  ['superficialVenousArch','FMA22915','Right superficial palmar venous arch','right',['FJ2301']],
  ['superficialVenousArch','FMA22916','Left superficial palmar venous arch','left',['FJ2249']],
  ['dorsalNetwork','FMA62506','Dorsal venous network of right hand','right',['FJ2280']],
  ['dorsalNetwork','FMA62507','Dorsal venous network of left hand','left',['FJ2228']],
  ['metacarpalVein','FMA22920','Right palmar metacarpal vein','right',['FJ2290','FJ2350','FJ2353']],
  ['metacarpalVein','FMA22921','Left palmar metacarpal vein','left',['FJ2238','FJ2320','FJ2323']],
  ['indexVein','FMA85096','Proper palmar digital vein of right index finger','right',['FJ2354','FJ2355']],
  ['indexVein','FMA85097','Proper palmar digital vein of left index finger','left',['FJ2324','FJ2325']],
  ['middleVein','FMA85098','Proper palmar digital vein of right middle finger','right',['FJ2356','FJ2357']],
  ['middleVein','FMA85099','Proper palmar digital vein of left middle finger','left',['FJ2326','FJ2340']],
  ['ringVein','FMA85100','Proper palmar digital vein of right ring finger','right',['FJ2358','FJ2359']],
  ['ringVein','FMA85101','Proper palmar digital vein of left ring finger','left',['FJ2327','FJ2328']],
];
assert.equal(specs.length, 36);
assert.equal(new Set(specs.map(([family]) => family)).size, 19);
assert.equal(specs.filter(([, , name]) => /artery|arteria/i.test(name)).length, 22);
assert.equal(specs.filter(([, , name]) => /vein|venous/i.test(name)).length, 14);
const expected = new Map(specs.map(([family, fmaId, name, side, files]) =>
  [fmaId, {family, name, side, files}]));
assert.equal(expected.size, 36);
const rawPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
same(readFileSync(rawPath), original(rawPath), 'Raw catalog source bytes');
const pin = JSON.parse(readFileSync('content/hand-vessel-xray-pins.json', 'utf8'));
assert.equal(pin.baseline, baseline);
assert.equal(pin.entries.length, 36);
same(new Set(pin.entries.map(row => row.identity.fmaId)), new Set(expected.keys()));
assert.equal(new Set(pin.entries.map(row => row.identity.id)).size, 36);
for (const key of ['sourceVersion', 'license', 'coordinateSystem'])
  same(pin[key], raw[key], `${key}: source and pin match`);
assert.equal(pin.sourceVersion, '4.0');
assert.equal(pin.license, 'CC-BY-4.0');
assert.equal(pin.coordinateSystem.unitsPerMillimetre, 0.01);
same(pin.coordinateSystem.sourceCenter, [0, -50, 800]);
const selectedBundles = raw.bundles.filter(bundle =>
  pin.entries.some(entry => entry.identity.bundle === bundle.id));
same(pin.bundles, selectedBundles, 'Only selected source bundles pinned');
for (const entry of pin.entries) {
  const id = entry.identity;
  const spec = expected.get(id.fmaId);
  assert(spec, `${id.fmaId}: admitted exact source`);
  assert.equal(entry.family, spec.family);
  assert.equal(id.name, spec.name);
  assert.equal(id.laterality, spec.side);
  assert.equal(id.region, 'hand');
  assert.equal(id.system, 'vessels');
  assert.equal(id.category, 'vessel');
  assert.equal(id.nodeName, id.fmaId);
  assert.equal(id.validation.status, 'unvalidated');
  assert.equal(id.validation.anatomicalReview, false);
  same(id.sources.map(source => source.file), spec.files,
    `${id.fmaId}: ordered source components`);
  same(raw.structures.filter(row => row.fmaId === id.fmaId), [id],
    `${id.fmaId}: complete canonical identity, hashes, bounds and frame`);
  assert.equal(entry.previous.readiness, 'pending');
}
for (const held of ['FMA85102', 'FMA85103'])
  assert(!pin.entries.some(row => row.identity.fmaId === held), `${held}: held vein excluded`);
for (const missing of ['FMA23053', 'FMA85113', 'FMA85114'])
  assert(!pin.entries.some(row => row.identity.fmaId === missing), `${missing}: no mirrored artery invented`);

const compiled = await build({stdin: {contents: `
export {handVesselXrayLesson} from './lib/hand-vessel-xray';
export * from './content/hand-vessel-xray';
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
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
// The exact hand authoring epoch is now historical. Keep its entire 36-cell
// transition/evidence proof, not allowances for unrelated later teaching edits.
// The new intracranial-US test separately verifies all 9,936 current placements.
const handEpoch='f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';
assert.equal(sha256(readFileSync('content/fixtures/hand-vessel-xray-before-intracranial-us.txt')),
  'a58d3b6d793ec995fa78d3e02747098cae93691f35163de1089de5fd65333b24');
same(readFileSync('content/fixtures/hand-vessel-xray-before-intracranial-us.txt'),
  git(['show',`${handEpoch}:scripts/test-hand-vessel-xray.mjs`]),'Complete original hand proof retained');
for(const path of ['content/hand-vessel-xray.ts','content/hand-vessel-xray-pins.json','lib/hand-vessel-xray.ts'])
  same(readFileSync(path),git(['show',`${handEpoch}:${path}`]),'Hand provider still exact: '+path);
const current={...live,...await exactSourceHistoryApi(handEpoch,'review-security')};
const before = await exactSourceHistoryApi(baseline, 'review-security');
const catalog = current.bodyDisplayCatalog(raw);
same(catalog, before.bodyDisplayCatalog(JSON.parse(original(rawPath))), 'Display catalog');
same(current.structures, before.structures, 'Shoulder selections');
same(current.dissectionProfiles, before.dissectionProfiles, 'Dissection recipes');
same(current.regionalTours, before.regionalTours, 'Tours and frames');
same(current.contentTabs, before.contentTabs, 'Topic schema');
assert.equal(catalog.structures.length, 1104);
assert.equal(current.contentTabs.length, 9);
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
same(new Set(Object.keys(current.handVesselXrayFacts)),
  new Set(specs.map(([family]) => family)), 'Exactly 19 authored fact families');
for (const [family, fact] of Object.entries(current.handVesselXrayFacts)) {
  same(Object.keys(fact).sort(), ['body', 'bullets', 'references'], family);
  assert(fact.body.length > 50, `${family}: substantive original body`);
  assert(fact.bullets.length >= 2, `${family}: multiple distinct cautions`);
  assert(fact.references.length >= 1, `${family}: scoped references`);
  for (const url of fact.references) assert.match(url, /^https:\/\/[^\s]+$/);
}
assert(current.handVesselXrayLimitations.length >= 3);
assert.match(current.handVesselXrayNote, /revision.bound radiologist/i);
let bundles = 0;
for (const bundle of raw.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  same(bytes, original(path), `${path}: immutable geometry`);
  bundles++;
}
assert.equal(bundles, 86);
for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts',
  'lib/regional-tours.ts', 'content/nested-teaching.ts',
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
    'oai-authenticated-user-id': 'SYNTHETIC_HAND_VESSEL_XRAY'},
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
      same(lesson, current.handVesselXrayLesson(structure, tab));
      const fact = current.handVesselXrayFacts[selected.family];
      assert.equal(lesson.title, `${structure.name} · X-ray vascular context · draft`);
      assert.equal(lesson.body, fact.body);
      same(lesson.bullets, [...fact.bullets,
        `Retained source: ${structure.fmaId} · ${structure.laterality} · ${structure.sources.length} recorded component${structure.sources.length === 1 ? '' : 's'}.`,
        `Source limit: ${structure.coverageNote}`,
        ...current.handVesselXrayLimitations]);
      same(lesson.citations, [...fact.references]);
      assert.equal(lesson.note, current.handVesselXrayNote);
      const {readiness: omitted, ...learner} = lesson;
      same(current.bodyContent(structure, tab), learner,
        `${structure.id}: learner view removes readiness only`);
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /(?:X-ray|radiograph|plain film)/i);
      assert.match(prose, /(?:not|no|cannot|does not|limitation)/i);
      assert.doesNotMatch(prose, /(?:normal|ordinary|unenhanced).{0,35}(?:plain film|radiograph|X-ray).{0,35}(?:shows|depicts|visuali[sz]es).{0,35}(?:arter|vein|vessel)/i,
        'No false normal-vessel plain-film visibility');
      assert.doesNotMatch(prose, /(?:first|second|third|fourth).{0,35}(?:always|universal|invariably)|(?:always|universal|invariably).{0,35}(?:first|second|third|fourth)/i,
        'Source numbering is not universal');
      assert.doesNotMatch(prose, /(?:proves|confirms|demonstrates).{0,35}(?:flow|patency|registration|lumen|connection|branch)/i,
        'No inferred flow, patency, registration or branch');
      assert.doesNotMatch(prose, /(?:separate|distinct|new).{0,30}(?:branch|vessel).{0,30}(?:component|FJ\d+)/i,
        'No duplicate branch from a grouped source identity');
      assert(lesson.citations.length >= 1 && lesson.citations.every(url => /^https:\/\/[^\s]+$/.test(url)));
      assert.match(lesson.note, /revision.bound radiologist/i);
      assert.match(lesson.note, /clinical approval/i);
      assert.match(lesson.note, /registration/i);
      assert.match(lesson.note, /independent/i);
      const teaching = [fact.body, ...fact.bullets].join(' ');
      const known = familyBodies.get(selected.family);
      if (known) same(teaching, known, `${selected.family}: shared family facts`);
      else familyBodies.set(selected.family, teaching);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      same(current.handVesselXrayLesson(structure, tab), copy, 'Fresh lesson arrays');
      changed++;
    } else {
      same(lesson, prior, `${structure.id}:${tab}: unaffected lesson`);
      assert.equal(current.handVesselXrayLesson(structure, tab), undefined);
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
    {tab: 'xray', ...current.handVesselXrayLesson(structure, 'xray')});
  assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
  assert.equal(packet.fingerprints.checklist, oldPacket.fingerprints.checklist);
  assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
  assert.notEqual(packet.materialHash, oldPacket.materialHash);
  same(await current.parseBodyReviewResponse(packet, structure.id), packet);
  assert.equal(await current.parseBodyReviewResponse(oldPacket, structure.id), null,
    `${structure.id}: prior packet is stale`);
  stale++;
  for (const edit of [
    p => {p.topics.find(topic => topic.tab === 'xray').body += ' foreign';},
    p => {p.topics.find(topic => topic.tab === 'xray').citations = ['https://foreign.example'];},
    p => {p.topics.find(topic => topic.tab === 'xray').readiness = 'approved';},
    p => {p.source.structure.sources = [];},
    p => {p.source.structure.validation.anatomicalReview = true;},
    p => {p.topics.splice(p.topics.findIndex(topic => topic.tab === 'xray'), 1);},
  ]) {
    const forged = structuredClone(packet); edit(forged);
    assert.equal(await current.parseBodyReviewResponse(forged, structure.id), null);
    malformed++;
  }
  const priorContext = await before.bodyReviewContext(structure.id);
  const context = await current.bodyReviewContext(structure.id);
  assert.equal(context.sourceHash, priorContext.sourceHash);
  const renderer = JSON.parse(git(['show',`${handEpoch}:content/body-renderer-revision.json`]));
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
      'New renderer needs a fresh geometry review revision');
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
  [36, 9900, 36, 1068]);
same(Object.fromEntries(readiness),
  {draft: 9294, pending: 603, 'generated-identification': 39});
assert.equal(familyBodies.size, 19);
assert.equal(new Set(familyBodies.values()).size, 19, 'Distinct family facts');

for (const {identity} of pin.entries) {
  for (const tab of current.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(current.handVesselXrayLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign`
      : typeof value === 'number' ? value + .01
      : value === null ? 'foreign' : !value;
    assert.equal(current.handVesselXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}: changed source or frame field`);
    refused++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.handVesselXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}: changed source components or frame array`);
    refused++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).foreign = true;
    assert.equal(current.handVesselXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.') || '<root>'}: foreign identity field`);
    refused++;
  }
  for (const field of ['id', 'name', 'fmaId', 'laterality', 'region', 'bundle',
    'sourceHash', 'sourceParts', 'frame', 'coordinateSystem']) {
    const bad = structuredClone(identity);
    if (Object.hasOwn(bad, field)) continue;
    bad[field] = 'foreign';
    assert.equal(current.handVesselXrayLesson(bad, 'xray'), undefined,
      `${identity.id}: invented ${field}`);
    refused++;
  }
}
for (const fma of ['FMA85102', 'FMA85103', 'FMA23053', 'FMA85113', 'FMA85114']) {
  const outside = catalog.structures.find(row => row.fmaId === fma);
  if (outside) assert.equal(current.handVesselXrayLesson(outside, 'xray'), undefined);
}
for (const outside of catalog.structures.filter(row =>
  row.region === 'hand' && row.system === 'vessels' && !entries.has(row.id)))
  assert.equal(current.handVesselXrayLesson(outside, 'xray'), undefined);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({baseline, historicalAuthoringEpoch:handEpoch, changed, preserved, bundles,
  changedWorksheets, unaffectedWorksheets, readiness: Object.fromEntries(readiness),
  refusedIdentities: refused, malformedPacketsRefused: malformed,
  stalePacketsAndDecisionsRefused: stale, storageCalls, clinicalApproval: false}));
