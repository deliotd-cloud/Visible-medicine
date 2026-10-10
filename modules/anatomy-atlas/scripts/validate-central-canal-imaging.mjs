import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { snapshot, hash } from './pin-pica-clinical.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/central-canal-imaging-pins.json' with { type: 'json' };

const parentCommit = '54afec873f51042f93df97dce6f8a35ab28b8ebe';
const pinsHash = '527a38e1e14134146a8798daed845e59c14817535bb3542e0281b33bb323a491';
const targetId = 'vm:anatomy:body:spine:midline:space:central-canal-of-spinal-cord';
const topics = ['ct', 'mri', 'ultrasound'];
assert.deepEqual(process.argv.slice(2).filter(arg => arg !== '--record'), [], 'Unknown validator option');
assert.equal(process.argv.filter(arg => arg === '--record').length <= 1, true);
assert.equal(pins.parentCommit, parentCommit);
assert.equal(hash(pins), pinsHash);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(await readFile(catalogPath), execFileSync('git',
  ['show', `${parentCommit}:${catalogPath}`],
  { maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } }),
  'Catalogue bytes changed from pinned parent');
assert.equal(pins.entries.length, 1);
const entry = pins.entries[0];
assert.equal(entry.identity.id, targetId);
assert.equal(entry.identity.fmaId, 'FMA78497');
assert.equal(entry.identity.category, 'space');
assert.equal(entry.identity.bundle, 'spine-nerves');
assert.deepEqual(entry.topics, topics);
assert.deepEqual(Object.keys(entry.previous), topics);

const context = await contentContext();
const api = context.api;
const display = api.bodyDisplayCatalog(context.catalog);
const parent = await exactSourceHistoryApi(parentCommit, 'display-review');
const originalDisplay = parent.bodyDisplayCatalog(context.catalog);
assert.deepEqual(display, originalDisplay, 'Display anatomy, geometry or bundles changed');
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(display.sourceVersion, pins.sourceVersion);
assert.equal(display.license, pins.license);
assert.deepEqual(api.structures, parent.structures, 'Shoulder source changed');
assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles, 'Dissection recipes changed');
assert.deepEqual(api.contentTabs, parent.contentTabs);
assert.equal(hash(snapshot(parent, originalDisplay)), pins.previousAllLessonsAndRecipesHash);
assert.equal(display.structures.filter(s => s.id === targetId).length, 1);
assert.deepEqual(display.structures.find(s => s.id === targetId), entry.identity);
for (const bundle of pins.bundles) {
  assert.equal(bundle.id, 'spine-nerves');
  assert.deepEqual(display.bundles.filter(b => b.id === bundle.id), [bundle]);
  const bytes = await readFile('public' + new URL(bundle.url, 'https://local.invalid').pathname);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
assert.equal(pins.bundles.length, 1);

// Compile the real helper independently of the broad contentContext export list.
const compiled = await build({ stdin: {
  contents: "export {centralCanalImagingLesson} from './lib/central-canal-imaging.ts'; export {centralCanalImagingTopics} from './content/central-canal-imaging.ts'; export {regionalTours} from './lib/regional-tours.ts';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, write: false, platform: 'node', format: 'esm' });
const helper = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(helper.regionalTours, parent.regionalTours, 'Regional tours changed');
const authored = helper.centralCanalImagingTopics;
assert(authored && typeof authored === 'object');
assert.deepEqual(Object.keys(authored).sort(), [...topics].sort());
for (const tab of topics) assert(authored[tab] && typeof authored[tab] === 'object');

const currentRecords = api.bodyContentRecords(display);
const previousRecords = parent.bodyContentRecords(originalDisplay);
assert.equal(currentRecords.length, display.structures.length);
assert.equal(previousRecords.length, currentRecords.length);
const previousById = new Map(previousRecords.map(record => [record.id, record]));
const currentById = new Map(currentRecords.map(record => [record.id, record]));
assert.equal(previousById.size, previousRecords.length);
assert.equal(currentById.size, currentRecords.length);
const registry = new Map([...context.shoulder, ...currentRecords]
  .map(record => [record.representationScope + '|' + record.id, record]));
assert.equal(registry.size, context.shoulder.length + currentRecords.length);
const validate = await contentValidator(registry);
let changed = 0;
let unchanged = 0;
const transitions = [];
for (const structure of display.structures) {
  const currentRecord = currentById.get(structure.id);
  const previousRecord = previousById.get(structure.id);
  assert(currentRecord && previousRecord, structure.id);
  assert(validate(currentRecord));
  const expectedRecord = structuredClone(previousRecord);
  for (const tab of api.contentTabs) {
    const before = parent.bodyLesson(structure, tab);
    const now = api.bodyLesson(structure, tab);
    const taught = helper.centralCanalImagingLesson(structure, tab);
    if (structure.id !== targetId || !topics.includes(tab)) {
      assert.deepEqual(now, before, structure.id + '|' + tab);
      assert.equal(taught, undefined, structure.id + '|' + tab);
      unchanged++;
      continue;
    }
    assert.deepEqual(before, entry.previous[tab]);
    assert.equal(before.readiness, 'pending');
    assert.equal(now.readiness, 'draft');
    assert.deepEqual(now, taught, tab + ' helper/learner mismatch');
    assert.deepEqual(currentRecord.content[tab], now);
    const { readiness, ...learner } = now;
    assert.equal(readiness, 'draft');
    assert.deepEqual(api.bodyContent(structure, tab), learner);
    assert(Array.isArray(now.bullets) && now.bullets.length > 0);
    assert(Array.isArray(now.citations) && now.citations.length > 0);
    assert.match(now.note, /review pending/i);
    assert.match(now.note, /No images or publisher text imported/i);
    assert.match(now.note, /paid-lecture access remain independent/i);
    expectedRecord.content[tab] = now;
    transitions.push({ id: structure.id, tab, previousHash: hash(before), currentHash: hash(now) });
    changed++;
  }
  assert.deepEqual(currentRecord, expectedRecord, structure.id + ' export changed outside teaching');
  assert.equal(currentRecord.validation.clinicalApproval, 'not-included');
  assert.equal(currentRecord.validation.materialRevisions.imaging, null);
}
assert.equal(changed, 3);
assert.equal(changed + unchanged, 9936);
assert.equal(unchanged, 9933);

const previousPacket = await parent.bodyReviewMaterial(targetId);
const packet = await api.bodyReviewMaterial(targetId);
assert(previousPacket && packet);
assert.equal(packet.approval, false);
assert.equal(packet.status, 'worksheet-not-submitted');
assert.deepEqual(packet.source, previousPacket.source);
assert.deepEqual(packet.guidedTours, previousPacket.guidedTours);
assert.deepEqual(packet.reasoning, previousPacket.reasoning);
assert.deepEqual(packet.checklist, previousPacket.checklist);
assert.deepEqual(packet.atlasLink, previousPacket.atlasLink);
assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
assert.equal(packet.fingerprints.checklist, previousPacket.fingerprints.checklist);
assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
assert.notEqual(packet.materialHash, previousPacket.materialHash);
const expectedPacket = structuredClone(previousPacket);
expectedPacket.topics = packet.topics;
expectedPacket.fingerprints.teaching = packet.fingerprints.teaching;
expectedPacket.materialHash = packet.materialHash;
assert.deepEqual(packet, expectedPacket, 'Review worksheet changed outside target teaching revision');
for (const tab of api.contentTabs) {
  const item = packet.topics.find(topic => topic.tab === tab);
  assert(item);
  const { tab: ignored, ...material } = item;
  assert.deepEqual(material, api.bodyLesson(entry.identity, tab));
}

const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
let rejected = 0;
for (const path of leaves(entry.identity)) {
  const bad = structuredClone(entry.identity);
  let branch = bad;
  for (const key of path.slice(0, -1)) branch = branch[key];
  const key = path.at(-1), old = branch[key];
  branch[key] = typeof old === 'number' ? old + 0.01
    : typeof old === 'boolean' ? !old : String(old) + '-foreign';
  for (const tab of topics) {
    assert.equal(helper.centralCanalImagingLesson(bad, tab), undefined, path.join('.'));
    rejected++;
  }
}
for (const tab of api.contentTabs.filter(tab => !topics.includes(tab)))
  assert.equal(helper.centralCanalImagingLesson(entry.identity, tab), undefined);
for (const structure of display.structures.filter(s => s.id !== targetId))
  for (const tab of topics)
    assert.equal(helper.centralCanalImagingLesson(structure, tab), undefined);
for (const tab of topics) {
  const first = helper.centralCanalImagingLesson(entry.identity, tab);
  const baseline = structuredClone(first);
  first.bullets.push('foreign');
  first.citations.length = 0;
  assert.deepEqual(helper.centralCanalImagingLesson(entry.identity, tab), baseline);
}

const transition = {
  parentCommit, pinsHash,
  previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash: hash(snapshot(api, display)),
  entries: transitions,
};
const path = 'content/central-canal-imaging-transition.json';
if (process.argv.includes('--record'))
  await writeFile(path, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), transition);
console.log(JSON.stringify({ changed, unchanged, rejected, sourceBundleSha256: pins.bundles[0].sha256,
  transitionHash: hash(transition), clinicalApproval: false, imagesImported: false }));
