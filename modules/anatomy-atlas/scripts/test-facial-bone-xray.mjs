import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const baseline = 'c3485ce80f2db471e0a12c678a9632f8ad7d3607';
const root = process.cwd();
const fromBaseline = path => execFileSync('git', ['show', `${baseline}:${path}`], { windowsHide: true, maxBuffer: 32e6 });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fmaIds = new Set(['FMA53650', 'FMA53649', 'FMA52893', 'FMA52892']);
const pins = JSON.parse(readFileSync('content/cranial-bone-imaging-pins.json', 'utf8'));
const selected = pins.entries.filter(entry => fmaIds.has(entry.identity.fmaId));
assert.equal(selected.length, 4);
assert.equal(new Set(selected.map(entry => entry.identity.id)).size, 4);
assert.deepEqual(new Set(selected.map(entry => entry.identity.fmaId)), fmaIds);
const byId = new Map(selected.map(entry => [entry.identity.id, entry]));

const built = await build({
  stdin: {
    contents: "export * from './lib/facial-bone-xray';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const before = await exactSourceHistoryApi(baseline, 'review-security');
assert.equal(typeof now.facialBoneXrayLesson, 'function');

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const catalog = now.bodyDisplayCatalog(JSON.parse(readFileSync(catalogPath, 'utf8')));
assert.equal(catalog.structures.length, 1104);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(fromBaseline(catalogPath))));
assert.deepEqual(now.structures, before.structures);
assert.deepEqual(now.dissectionProfiles, before.dissectionProfiles);
assert.deepEqual(now.regionalTours, before.regionalTours);
assert.deepEqual(now.contentTabs, before.contentTabs);
assert.equal(now.contentTabs.length * catalog.structures.length, 9936);

let changed = 0, preserved = 0, refusedIdentities = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const prior = before.bodyLesson(structure, tab);
    const current = now.bodyLesson(structure, tab);
    if (byId.has(structure.id) && tab === 'xray') {
      assert.equal(prior.readiness, 'pending', structure.id);
      assert.equal(current.readiness, 'draft', structure.id);
      assert.deepEqual(current, now.facialBoneXrayLesson(structure, tab));
      const { readiness, ...shown } = current;
      assert.deepEqual(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(current, prior, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  if (!byId.has(structure.id)) assert.equal(now.facialBoneXrayLesson(structure, 'xray'), undefined);
}
assert.equal(changed, 4);
assert.equal(preserved, 9932);

function leafPaths(value, path = []) {
  if (value === null || typeof value !== 'object') return [path];
  return Object.entries(value).flatMap(([key, child]) => leafPaths(child, [...path, key]));
}
function at(value, path) {
  return path.reduce((node, key) => node[key], value);
}
function changeLeaf(value) {
  if (typeof value === 'string') return `${value}-foreign`;
  if (typeof value === 'number') return value + 0.01;
  if (typeof value === 'boolean') return !value;
  return 'foreign';
}

let malformed = 0, stale = 0, storageCalls = 0;
for (const { identity } of selected) {
  const structure = catalog.structures.find(row => row.id === identity.id);
  assert.deepEqual(structure, identity);
  for (const path of leafPaths(identity)) {
    const foreign = structuredClone(identity);
    const parent = at(foreign, path.slice(0, -1));
    const key = path.at(-1);
    parent[key] = changeLeaf(parent[key]);
    assert.equal(now.facialBoneXrayLesson(foreign, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of leafPaths(identity)) {
    const foreign = structuredClone(identity);
    delete at(foreign, path.slice(0, -1))[path.at(-1)];
    assert.equal(now.facialBoneXrayLesson(foreign, 'xray'), undefined, `missing ${path.join('.')}`);
    refusedIdentities++;
  }
  for (const edit of [
    source => { source.unexpected = true; },
    source => { source.sources.push(structuredClone(source.sources[0])); },
    source => { source.regions.push('foreign'); },
    source => { source.bounds.unexpected = true; },
  ]) {
    const foreign = structuredClone(identity);
    edit(foreign);
    assert.equal(now.facialBoneXrayLesson(foreign, 'xray'), undefined);
    refusedIdentities++;
  }
  for (const tab of now.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(now.facialBoneXrayLesson(identity, tab), undefined);

  const lesson = now.facialBoneXrayLesson(identity, 'xray');
  const original = structuredClone(lesson);
  assert.match(original.note, /revision-bound radiologist/i);
  assert.match(original.note, /pending/i);
  assert.match(original.note, /(?:not|no|without|unregistered)[^.!?]*(?:registered|registration|patient|scan)|(?:semantic|non-registration)/i);
  assert(original.citations.length > 0);
  for (const citation of original.citations) {
    const url = new URL(citation);
    assert.equal(url.protocol, 'https:');
    assert(url.hostname && !url.hostname.endsWith('.example'));
  }
  lesson.bullets?.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.facialBoneXrayLesson(identity, 'xray'), original, 'Lesson arrays must be fresh');

  const material = await now.bodyReviewMaterial(identity.id);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  assert.equal(material.approval, false);
  assert.deepEqual(material.topics.find(topic => topic.tab === 'xray'), { tab: 'xray', ...original });
  for (const edit of [
    packet => { packet.topics.find(topic => topic.tab === 'xray').body += ' foreign'; },
    packet => { packet.topics.find(topic => topic.tab === 'xray').readiness = 'approved'; },
    packet => { packet.topics.find(topic => topic.tab === 'xray').citations = ['https://foreign.example']; },
    packet => { packet.source.structure.sources = []; },
    packet => { packet.topics.splice(packet.topics.findIndex(topic => topic.tab === 'xray'), 1); },
  ]) {
    const foreign = structuredClone(material);
    edit(foreign);
    assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
    malformed++;
  }

  const previousContext = await before.bodyReviewContext(identity.id);
  const currentContext = await now.bodyReviewContext(identity.id);
  assert.equal(currentContext.sourceHash, previousContext.sourceHash);
  assert.notEqual(currentContext.revisions.teaching, previousContext.revisions.teaching);
  assert.equal(currentContext.revisions.imaging, null);
  const packet = {
    catalogScope: currentContext.catalogScope,
    structureId: identity.id,
    track: 'teaching',
    expectedVersion: 0,
    materialHash: currentContext.materialHash,
    revisionHash: currentContext.revisions.teaching,
    checklistVersion: currentContext.checklistVersion,
    draft: now.blankBodyReview(currentContext, 'teaching'),
  };
  for (const staleHashes of [
    { materialHash: previousContext.materialHash, revisionHash: previousContext.revisions.teaching },
    { materialHash: previousContext.materialHash },
    { revisionHash: previousContext.revisions.teaching },
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST',
      headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_FACIAL_BONE_XRAY' },
      body: JSON.stringify({ ...packet, ...staleHashes }),
    }), { prepare() { storageCalls++; throw Error('Stale decision reached storage'); } });
    assert.equal(response.status, 409);
    stale++;
  }
}

let changedWorksheets = 0;
for (const structure of catalog.structures) {
  const oldMaterial = await before.bodyReviewMaterial(structure.id);
  const material = await now.bodyReviewMaterial(structure.id);
  assert.deepEqual(material.source, oldMaterial.source);
  assert.deepEqual(material.reasoning, oldMaterial.reasoning);
  assert.deepEqual(material.guidedTours, oldMaterial.guidedTours);
  assert.equal(material.approval, false);
  assert.equal(material.fingerprints.source, oldMaterial.fingerprints.source);
  if (byId.has(structure.id)) {
    assert.notEqual(material.fingerprints.teaching, oldMaterial.fingerprints.teaching);
    changedWorksheets++;
  } else {
    assert.deepEqual(material.topics, oldMaterial.topics);
    assert.equal(material.fingerprints.teaching, oldMaterial.fingerprints.teaching);
  }
}
assert.equal(changedWorksheets, 4);
assert.equal(malformed, 20);
assert.equal(stale, 12);
assert.equal(storageCalls, 0);

for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, fromBaseline(path), path);
}
for (const path of ['lib/cranial-bone-xray.ts', 'content/cranial-bone-xray.ts'])
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), fromBaseline(path).toString('utf8').replaceAll('\r\n', '\n'), path);

console.log(JSON.stringify({ baseline, changed, preserved, refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, changedTeachingWorksheets: changedWorksheets, sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false, websiteIntegrated: false }));
