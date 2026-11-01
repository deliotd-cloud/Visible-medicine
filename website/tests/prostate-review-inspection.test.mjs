import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

const root = resolve(process.env.VM_WEBSITE_ROOT || fileURLToPath(new URL('../', import.meta.url)));
const requireWebsite = createRequire(pathToFileURL(join(root, 'package.json')));
const {build, transform} = requireWebsite('esbuild');
const context = {URL, URLSearchParams, TextEncoder, Uint8Array, crypto: webcrypto, structuredClone};
async function bundled(path) {
  const result = await build({entryPoints: [join(root, path)], bundle: true, write: false,
    platform: 'node', format: 'cjs', target: 'es2022'});
  const module = {exports: {}};
  runInNewContext(result.outputFiles[0].text, {...context, module, exports: module.exports,
    require: requireWebsite});
  return module.exports;
}
async function bundledWithSourceEdit(path, sourceFile, original, replacement) {
  const result = await build({entryPoints: [join(root, path)], bundle: true, write: false,
    platform: 'node', format: 'cjs', target: 'es2022', plugins: [{name: 'single-authored-edit', setup(api) {
      api.onLoad({filter: /(?:prostate-zones|prostate-mri-teaching)\.ts$/}, async args => {
        const source = await readFile(args.path, 'utf8');
        if (!args.path.replaceAll('\\', '/').endsWith(sourceFile))
          return {contents: source, loader: 'ts'};
        assert.equal(source.split(original).length, 2, 'edit must target one exact authored passage');
        return {contents: source.replace(original, replacement), loader: 'ts'};
      });
    }}]});
  const module = {exports: {}};
  runInNewContext(result.outputFiles[0].text, {...context, module, exports: module.exports,
    require: requireWebsite});
  return module.exports;
}
async function component(path, imports) {
  const source = await readFile(join(root, path), 'utf8');
  const {code} = await transform(source, {loader: 'tsx', format: 'cjs', target: 'es2022',
    jsx: 'transform', jsxFactory: 'h', jsxFragment: 'Fragment'});
  const module = {exports: {}};
  const h = (type, props, ...children) => ({type, props: {...props, children}});
  runInNewContext(code, {module, exports: module.exports, h, Fragment: 'Fragment',
    requestAnimationFrame: () => {}, require(name) {
      if (Object.hasOwn(imports, name)) return imports[name];
      throw Error(`Unexpected component dependency: ${name}`);
    }});
  return module.exports;
}
function walk(node, match, hits = []) {
  if (Array.isArray(node)) {node.forEach(child => walk(child, match, hits)); return hits;}
  if (!node || typeof node !== 'object' || !node.props) return hits;
  if (match(node)) hits.push(node);
  walk(node.props.children, match, hits);
  return hits;
}
function text(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return node?.props ? text(node.props.children) : '';
}
const materialLib = await bundled('lib/prostate-review-material.ts');
const linkLib = await bundled('lib/prostate-review-link.ts');
const zoneLib = await bundled('atlas-review/lib/prostate-zones.ts');
const teachingLib = await bundled('atlas-review/lib/prostate-mri-teaching.ts');
const inboxContract = await bundled('lib/clinical-review-inbox-contract.ts');
const material = await materialLib.prostateReviewMaterial();

test('packet carries the four actual learner regions, questions, answer IDs and source notes', async () => {
  assert.equal(material.schema, 'vm.prostate-review-inspection/1');
  assert.equal(material.modelRevision, zoneLib.PROSTATE_ZONE_REVISION);
  assert.equal(material.zones.length, 4);
  assert.deepEqual([...material.zones.map(z => z.key)].sort(), ['central', 'peripheral', 'stroma', 'transition']);
  for (const zone of material.zones) {
    const source = zoneLib.prostateZones.find(z => z.key === zone.key);
    assert.ok(source);
    for (const field of ['id', 'name', 'shortLabel', 'anatomy', 'mri'])
      assert.equal(zone[field], source[field], `learner ${field} for ${zone.key}`);
    const lesson = teachingLib.prostateMriLessons[zone.key];
    for (const field of ['landmark', 'signal', 'caution', 'question', 'explanation', 'answerId'])
      assert.equal(zone.lesson[field], lesson[field], `learner ${field} for ${zone.key}`);
    assert.deepEqual(JSON.parse(JSON.stringify(zone.lesson.choices)),
      JSON.parse(JSON.stringify(lesson.choices)));
    assert.equal(zone.lesson.choices.filter(c => c.id === zone.lesson.answerId).length, 1);
  }
  assert.equal(material.patientSpaceRegistration, null);
  assert.equal(material.representation, 'original-schematic');
  assert.equal(material.decisionCapability, 'inspection-only');
  assert.equal(material.clinicalApproval, false);
  const changed = await materialLib.prostateReviewMaterial();
  changed.zones[0].lesson.question = 'changed locally';
  assert.equal((await materialLib.prostateReviewMaterial()).revision, material.revision);
  assert.equal(material.zones[0].lesson.question, teachingLib.prostateMriLessons[material.zones[0].key].question);
});

test('review revision changes when authored region or MRI teaching changes', async () => {
  const edits = [
    ['atlas-review/lib/prostate-zones.ts',
      'The outer glandular region occupies much of the posterior and lateral prostate and extends toward the apex.',
      'The outer glandular region occupies much of the posterior and lateral prostate and extends towards the apex.'],
    ['atlas-review/lib/prostate-mri-teaching.ts',
      'Where would you begin looking for the peripheral zone?',
      'Where should you begin looking for the peripheral zone?'],
  ];
  for (const [sourceFile, original, replacement] of edits) {
    const edited = await bundledWithSourceEdit('lib/prostate-review-material.ts', sourceFile, original, replacement);
    const packet = await edited.prostateReviewMaterial();
    assert.notEqual(packet.revision, material.revision, `${sourceFile} must change review revision`);
    assert.equal(packet.modelRevision, material.modelRevision,
      'the independently compiled model identity is unchanged by this in-memory copy edit');
  }
});

test('model link selects one exact compiled revision and rejects extra, duplicate or mismatched fields', () => {
  const href = linkLib.prostateReviewModelHref(material.modelRevision);
  assert.equal(material.modelHref, href);
  assert.equal(linkLib.parseProstateReviewLink(new URL(href, 'https://private.invalid').search), material.modelRevision);
  assert.equal(linkLib.prostateReviewModelHref('0'.repeat(64)), null);
  const q = new URL(href, 'https://private.invalid').search;
  for (const bad of [q + '&series=private', q + '&kind=prostate', q.replace('region=pelvis', 'region=head'),
    q.replace('kind=prostate', 'kind=body'), q.replace(material.modelRevision, '0'.repeat(64)),
    '?kind=prostate&region=pelvis']) assert.equal(linkLib.parseProstateReviewLink(bad), null, bad);
});

test('inbox remains a revision-bound inspection entry and never claims approval', async () => {
  const [entry] = await materialLib.prostateReviewInboxCatalog();
  assert.equal(entry.key, 'schematic:prostate-zones:inspection');
  assert.equal(entry.capability, 'inspection-only');
  assert.equal(entry.revision, material.revision);
  assert.equal(entry.href, '/workspace/atlas-review/prostate?revision=' + material.revision);
  assert.equal((await materialLib.prostateReviewInboxStatuses([entry]))[0].status, 'inspection-required');
  const batch = {schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution',
    catalogRevision: 'a'.repeat(64), page: 1, pageCount: 1, selectionTotal: 1,
    nextPage: null, items: [{...entry, status: 'inspection-required'}], approval: false};
  assert.equal(inboxContract.parseInboxBatch(batch, 1, batch.catalogRevision).items[0].key, entry.key);
  assert.throws(() => inboxContract.parseInboxBatch({...batch, items: [
    {...batch.items[0], status: 'approval-recorded'}]}, 1, batch.catalogRevision), /Invalid review inbox entry/);
  for (const changed of [{...entry, revision: '0'.repeat(64)}, {...entry, capability: 'decision'},
    {...entry, href: '/workspace/atlas-review/prostate'}]) {
    assert.equal((await materialLib.prostateReviewInboxStatuses([changed]))[0].status, 'unavailable');
  }
  for (const [params, expected] of [[{}, 'current'], [{revision: material.revision}, 'current'],
    [{revision: '0'.repeat(64)}, 'stale'], [{revision: [material.revision, material.revision]}, 'invalid'],
    [{revision: material.revision, extra: 'x'}, 'invalid']])
    assert.equal(materialLib.prostateReviewPageSelection(params, material.revision), expected);
});

test('actual extra inbox aggregator discovers prostate inspection and reports its state', async () => {
  const source = await readFile(join(root, 'lib/clinical-review-extra-inbox.ts'), 'utf8');
  const {code} = await transform(source, {loader: 'ts', format: 'cjs', target: 'es2022'});
  const module = {exports: {}};
  const empty = {nativeGuideInboxCatalog: async () => [], nativeGuideInboxStatuses: async () => [],
    facialReviewInboxCatalog: async () => [], facialReviewInboxStatuses: async () => []};
  const constants = {PAIRED_DECISION_CONCEPTS: [], IMAGE_ONLY_DECISION_CONCEPTS: [],
    CT_ALL_BONE_DECISION_CONCEPTS: [], CT_BONE_TEACHING_DECISION_CONCEPTS: []};
  const unrelated = new Proxy({}, {get: (_target, key) => {
    if (key === '__esModule') return true;
    if (Object.hasOwn(constants, key)) return constants[key];
    if (key === 'default') return {files: []};
    return async () => null;
  }});
  runInNewContext(code, {...context, Request, module, exports: module.exports, require(name) {
    if (name === './prostate-review-material') return materialLib;
    if (name === './regional-guide-review-inbox.ts' || name === './head-ct-facial-review-inbox.ts') return empty;
    if (name.startsWith('./') || name.startsWith('../')) return unrelated;
    throw Error(`Unexpected aggregator dependency: ${name}`);
  }});
  const catalog = await module.exports.extraInboxCatalog();
  const prostate = catalog.filter(item => item.key === 'schematic:prostate-zones:inspection');
  assert.equal(prostate.length, 1, 'the registered inspection must be discoverable');
  assert.equal(prostate[0].revision, material.revision);
  assert.equal(prostate[0].capability, 'inspection-only');
  const statuses = await module.exports.extraInboxStatuses(
    new Request('https://private.invalid/workspace/clinical-review-inbox'), undefined, prostate);
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].status, 'inspection-required');
  assert.equal(statuses[0].capability, 'inspection-only');
});

test('page authorizes before reading material or query and displays closed inspection disclosures', async () => {
  let authorized = false, reads = 0, queryReads = 0;
  const page = (await component('app/workspace/atlas-review/prostate/page.tsx', {
    '@/lib/clinical-review-server': {authorizeClinicalReview: async () => {if (!authorized) throw Error('denied');}},
    '@/lib/prostate-review-material': {
      prostateReviewMaterial: async () => {reads++; return material;},
      prostateReviewPageSelection: materialLib.prostateReviewPageSelection,
    },
    './prostate-review.css': {},
  })).default;
  const params = {then(resolve) {queryReads++; return Promise.resolve(resolve({revision: material.revision}));}};
  const denied = await page({searchParams: params});
  assert.match(text(denied), /authorized Clinical Review administrator/);
  assert.equal(reads, 0); assert.equal(queryReads, 0);
  authorized = true;
  const tree = await page({searchParams: params});
  assert.equal(reads, 1); assert.equal(queryReads, 1);
  const frames = walk(tree, n => n.type === 'iframe');
  assert.equal(frames.length, 1);
  assert.equal(frames[0].props.src, material.modelHref);
  assert.equal(walk(tree, n => n.type === 'details').length, 6);
  assert.equal(walk(tree, n => n.type === 'details' && !!n.props.open).length, 0);
  assert.equal(walk(tree, n => ['form', 'input', 'textarea', 'select'].includes(n.type)).length, 0);
  for (const zone of material.zones) for (const value of [zone.anatomy, zone.mri, zone.lesson.question,
    zone.lesson.explanation, ...zone.lesson.choices.map(c => c.label)])
    assert.ok(text(tree).includes(value), `${zone.key}: ${value}`);
  assert.match(text(tree), /no approval or review decision is recorded/i);
  assert.match(text(tree), /No prostate MRI is paired/);
  const stale = await page({searchParams: Promise.resolve({revision: '0'.repeat(64)})});
  assert.equal(walk(stale, n => n.type === 'iframe').length, 0);
  assert.match(text(stale), /earlier version/);
  const invalid = await page({searchParams: Promise.resolve({revision: material.revision, patient: 'x'})});
  assert.equal(walk(invalid, n => n.type === 'iframe').length, 0);
  assert.match(text(invalid), /invalid/);
});

test('viewer reuses the learner model with the exact parent and no catalog imaging session', async () => {
  const parent = {id: zoneLib.PROSTATE_PARENT_ID, fmaId: zoneLib.PROSTATE_PARENT_SOURCE.fmaId,
    sourceTree: 'partof', sources: [{file: zoneLib.PROSTATE_PARENT_SOURCE.file,
      sha256: zoneLib.PROSTATE_PARENT_SOURCE.sha256}]};
  const ProstateZones = function ProstateZones() {};
  const makeViewer = async displayed => (await component('scripts/clinical-review-viewer/prostate-viewer.tsx', {
    react: {useState: initial => [initial, () => {}], useRef: value => ({current: value})},
    '../../atlas-review/app/prostate-zones': {__esModule: true, default: ProstateZones},
    '../../atlas-review/public/models/bodyparts3d/full-body/catalog.json': {__esModule: true, default: {}},
    '../../atlas-review/lib/body-display-catalog': {bodyDisplayCatalog: () => ({structures: displayed})},
    '../../atlas-review/lib/prostate-zones': {prostateZonesAvailable: zoneLib.prostateZonesAvailable},
    '../../lib/prostate-review-link': {parseProstateReviewLink: linkLib.parseProstateReviewLink},
    './prostate-viewer.css': {},
  })).default;
  const Viewer = await makeViewer([parent]);
  const search = new URL(material.modelHref, 'https://private.invalid').search;
  const good = Viewer({search});
  assert.equal(good.type, 'main');
  assert.equal(good.props['data-presentation'], 'panel');
  const [model] = walk(good, n => n.type === ProstateZones);
  assert.ok(model, 'actual learner model component is mounted');
  assert.equal(model.props.parent, parent);
  assert.equal(model.props.catalog, undefined, 'no learner imaging catalog is passed');
  assert.equal(Viewer({search: search + '&study=private'}).props.role, 'alert');
  for (const displayed of [[], [{...parent, id: 'wrong'}],
    [{...parent, sourceTree: 'wrong'}],
    [{...parent, sources: [{...parent.sources[0], sha256: 'wrong'}]}],
    [parent, parent]]) {
    const WrongViewer = await makeViewer(displayed);
    assert.equal(WrongViewer({search}).props.role, 'alert');
  }
});
