// Current selected-source contract. The earlier CT/MRI/ultrasound transition suite remains separate.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const root = process.cwd();
const baseline = 'f5052a1906bf9b87e5235bda57d367b1103729db';
const tree = '36381d525f7c6886743bcec00fcee96931d65c58';
const { build } = await import(pathToFileURL(resolve(root, 'scripts/workspace-test-build.mjs')));
const { exactSourceHistoryApi } = await import(pathToFileURL(resolve(root, 'scripts/exact-source-history-api.mjs')));
const git = args => execFileSync('git', args, { cwd: root, windowsHide: true,
  maxBuffer: 64e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } });
const original = path => git(['show', `${baseline}:${path}`]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, label) => assert.deepEqual(actual, expected, label);
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);
assert.equal(git(['rev-parse', `${baseline}^{tree}`]).toString().trim(), tree);

// Independently named original BodyParts3D identities and component hashes.
const specs = [
  {
    id: 'vm:anatomy:body:foot:right:vessel:dorsal-venous-arch-of-right-foot',
    fmaId: 'FMA44881', name: 'Dorsal venous arch of right foot', side: 'right',
    files: [
      ['FJ2061', '2b349be398677b9dab660a07b4e038b35cb458883e350340ff53a2754aebcc41'],
      ['FJ2062', '4c16febe531c5d2afacf9bb47a899602239f2424ebd6e6d97860691bc9a2669b'],
    ],
  },
  {
    id: 'vm:anatomy:body:foot:left:vessel:dorsal-venous-arch-of-left-foot',
    fmaId: 'FMA44882', name: 'Dorsal venous arch of left foot', side: 'left',
    files: [
      ['FJ2059', '9421947a4511ed928078ee25870fefc51632c373fd3c8918bd9d53c3fc8dd5fb'],
      ['FJ2060', 'f882652c192b3c2e05405273755193989d5b1866dcba53b9c0653e7a1ee2b2f9'],
    ],
  },
];
const bundleId = 'foot-vessels-foot-vascular';
const rawPath = 'public/models/bodyparts3d/full-body/catalog.json';
const historical = await exactSourceHistoryApi(baseline, 'display');
const originalCatalog = historical.bodyDisplayCatalog(JSON.parse(original(rawPath)));
const oldById = new Map(originalCatalog.structures.map(row => [row.id, row]));
const pin = JSON.parse(readFileSync('content/foot-venous-arch-xray-pins.json', 'utf8'));
assert.equal(sha(JSON.stringify(pin)), '56d9bec622a97998cc01238ec81e4719b23ff65cc4b180971e189528965781c5');
assert.equal(pin.parentCommit, baseline);
assert.equal(pin.sourceVersion, '4.0');
assert.equal(pin.license, 'CC-BY-4.0');
assert.match(pin.previousAllLessonsAndRecipesHash, /^[a-f0-9]{64}$/);
assert.equal(pin.entries.length, 2);
same(pin.entries.map(entry => entry.identity.id), specs.map(spec => spec.id));

const compiled = await build({ stdin: { contents: `
export { footVenousArchXrayLesson } from './lib/foot-venous-arch-xray';
export { footVenousArchXrayTopic, footVenousArchXrayNote } from './content/foot-venous-arch-xray';
export { bodyLesson } from './app/body-content';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { contentTabs } from './lib/content-types';
`, resolveDir: root, loader: 'ts' }, bundle: true, write: false,
  platform: 'node', format: 'esm' });
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = current.bodyDisplayCatalog(JSON.parse(readFileSync(rawPath, 'utf8')));
const byId = new Map(catalog.structures.map(row => [row.id, row]));
assert.equal(byId.size, catalog.structures.length);
same(pin.coordinateSystem, originalCatalog.coordinateSystem);
same(pin.coordinateSystem, catalog.coordinateSystem);
same(pin.bundles, originalCatalog.bundles.filter(bundle => bundle.id === bundleId));
same(pin.bundles, catalog.bundles.filter(bundle => bundle.id === bundleId));
assert.equal(pin.bundles.length, 1);
for (const bundle of pin.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha(bytes), bundle.sha256);
  same(bytes, original(path), 'Locked licensed bundle bytes');
}

const topic = current.footVenousArchXrayTopic;
same(new Set(topic.citations), new Set([
  'https://pubs.rsna.org/doi/abs/10.1148/radiographics.21.5.g01se281239',
  'https://pubmed.ncbi.nlm.nih.gov/3199035/',
]));
assert.equal(topic.citations.length, 2);
assert.match(topic.body, /plain/i);
assert.match(topic.body, /contrast/i);
assert.match(topic.body, /selected patients with critical limb ischaemia/i);
assert.match(topic.body, /not a study of normal plain-film visibility/i);
assert.match(topic.body, /does not validate either two-component atlas arch/i);
assert.match(current.footVenousArchXrayNote, /review pending/i);
let mutations = 0;
function leafPaths(value, prefix = []) {
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, child]) => leafPaths(child, [...prefix, key]));
  return [prefix];
}
function altered(value) {
  if (typeof value === 'string') return `${value}-altered`;
  if (typeof value === 'number') return value + 0.001;
  if (typeof value === 'boolean') return !value;
  if (value === null) return 'altered';
  throw Error(`Unexpected source identity leaf: ${typeof value}`);
}

for (const [index, entry] of pin.entries.entries()) {
  const spec = specs[index], identity = entry.identity;
  same([identity.id, identity.fmaId, identity.name, identity.laterality, identity.bundle],
    [spec.id, spec.fmaId, spec.name, spec.side, bundleId]);
  same(identity.sources.map(source => [source.file, source.sha256]), spec.files);
  same(entry.topics, ['xray']);
  same(identity, oldById.get(spec.id), `${spec.fmaId}: original exact source record`);
  same(identity, byId.get(spec.id), `${spec.fmaId}: current exact source record`);
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  const oldXray = historical.bodyLesson(identity, 'xray');
  assert.equal(oldXray.readiness, 'pending');
  same(entry.previous.xray, oldXray, `${spec.fmaId}: pinned prior X-ray lesson`);
  for (const tab of ['ct', 'mri', 'ultrasound'])
    same(current.bodyLesson(identity, tab), historical.bodyLesson(identity, tab),
      `${spec.fmaId}: unchanged ${tab} lesson`);
  const lesson = current.bodyLesson(identity, 'xray');
  same(lesson, current.footVenousArchXrayLesson(identity, 'xray'));
  assert.equal(lesson.readiness, 'draft');
  assert.equal(lesson.title, `${identity.name} · X-ray venous orientation · draft`);
  assert.equal(lesson.body, topic.body);
  same(lesson.bullets, topic.bullets);
  same(lesson.citations, topic.citations);
  assert.equal(lesson.note, current.footVenousArchXrayNote);
  const saved = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.invalid');
  same(current.footVenousArchXrayLesson(identity, 'xray'), saved, 'Fresh lesson arrays');
  for (const tab of current.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(current.footVenousArchXrayLesson(identity, tab), undefined);
  for (const path of leafPaths(identity)) {
    const changed = structuredClone(identity);
    let node = changed;
    for (const part of path.slice(0, -1)) node = node[part];
    const last = path.at(-1);
    node[last] = altered(node[last]);
    assert.equal(current.footVenousArchXrayLesson(changed, 'xray'), undefined,
      `${spec.fmaId}: mutated ${path.join('.')}`);
    mutations++;
  }
  for (const change of [
    value => { value.sources.push(structuredClone(value.sources[0])); },
    value => { value.sources.pop(); },
    value => { value.sources.reverse(); },
    value => { value.foreignSource = true; },
  ]) {
    const changed = structuredClone(identity); change(changed);
    assert.equal(current.footVenousArchXrayLesson(changed, 'xray'), undefined);
    mutations++;
  }
}

let otherStructures = 0;
for (const structure of catalog.structures) {
  if (specs.some(spec => spec.id === structure.id)) continue;
  assert.equal(current.footVenousArchXrayLesson(structure, 'xray'), undefined);
  otherStructures++;
}
console.log(JSON.stringify({ baseline, targets: specs.map(spec => spec.fmaId),
  bundle: bundleId, mutations, otherStructures, unchangedTopics: ['ct', 'mri', 'ultrasound'],
  historicalSixTopicTransition: 'preserved separately', clinicalApproval: false }));
