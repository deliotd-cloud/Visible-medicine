import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'fc894122f24b80ad30846b9ffdefc342567bedc2';
const pinPath = 'content/central-canal-imaging-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const id = 'vm:anatomy:body:spine:midline:space:central-canal-of-spinal-cord';
const git = (args, options = {}) => execFileSync('git', args, {
  encoding: 'utf8', windowsHide: true, maxBuffer: 64e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}, ...options,
});
const gitBytes = path => git(['show', `${baseline}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const normalized = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
const unchangedJson = path => {
  const bytes = readFileSync(path);
  assert.equal(normalized(bytes), normalized(gitBytes(path)), `${path}: baseline bytes unchanged apart from EOL`);
  return JSON.parse(bytes.toString('utf8'));
};

assert.equal(git(['rev-parse', `${baseline}^{commit}`]).trim(), baseline);
const pins = unchangedJson(pinPath);
const raw = unchangedJson(catalogPath);
assert.equal(pins.entries.length, 1);
assert.equal(pins.bundles.length, 1);
assert.equal(pins.bundles[0].id, 'spine-nerves');
const row = pins.entries[0], identity = row.identity;
assert.equal(identity.id, id);
assert.equal(identity.fmaId, 'FMA78497');
assert.equal(identity.nodeName, 'FMA78497');
assert.equal(identity.system, 'nerves');
assert.equal(identity.category, 'space');
assert.equal(identity.region, 'spine');
assert.equal(identity.laterality, 'midline');
assert.equal(identity.bundle, 'spine-nerves');
assert.equal(identity.sourceTree, 'isa');
assert.deepEqual(identity.sources.map(source => source.file), ['FJ1737']);
assert(identity.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)));
assert.equal(identity.validation.status, 'unvalidated');
assert.equal(identity.validation.anatomicalReview, false);
assert(identity.bounds && identity.center && identity.anchor);
assert.deepEqual(row.topics, ['ct', 'mri', 'ultrasound']);

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents: [
    "export {centralCanalXrayLesson} from './lib/central-canal-xray';",
    "export {centralCanalXrayTopics} from './content/central-canal-xray';",
    "export {bodyLesson,bodyContent} from './app/body-content';",
    "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
    "export {contentTabs} from './lib/content-types';",
    "export {structures} from './app/anatomy-data';",
    "export {dissectionProfiles} from './app/dissection-data';",
    "export {regionalTours} from './lib/regional-tours';",
    "export * from './lib/body-review-material';",
    "export * from './lib/body-review-context';",
    "export * from './lib/body-review-response';",
    "export * from './lib/body-review-api';",
    "export * from './lib/body-review-decisions';",
  ].join(''), resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm', metafile: true,
});
for(const path of ['lib/central-canal-xray.ts','content/central-canal-xray.ts','app/body-content.ts','lib/body-review-api.ts'])
  assert(Object.keys(compiled.metafile.inputs).some(input=>input.replaceAll('\\','/').endsWith(path)),`Actual source missing from bundle: ${path}`);
const now = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.deepEqual(catalog.structures.find(structure => structure.id === id), identity);
assert.deepEqual(now.structures, old.structures);
assert.deepEqual(now.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(now.regionalTours, old.regionalTours);
assert.deepEqual(now.contentTabs, old.contentTabs);
assert.equal(catalog.structures.length, 1104);
assert.equal(now.contentTabs.length, 9);
assert.equal(catalog.structures.length * now.contentTabs.length, 9936);
assert.deepEqual(Object.keys(now.centralCanalXrayTopics), ['xray']);
const topic = now.centralCanalXrayTopics.xray;
assert(topic && typeof topic.title === 'string' && topic.title.trim());
assert(topic.body && topic.body.trim());
assert(topic.bullets.length >= 2);
assert(topic.citations.length >= 2);

for (const tab of ['ct', 'mri', 'ultrasound'])
  assert.equal(old.bodyLesson(identity, tab).readiness, 'draft', `${tab}: earlier central-canal topic exists`);
assert.equal(old.bodyLesson(identity, 'xray').readiness, 'pending');
const selected = now.centralCanalXrayLesson(structuredClone(identity), 'xray');
assert(selected, 'An exactly cloned historical source identity resolves');
assert.deepEqual(now.bodyLesson(identity, 'xray'), selected);
assert.equal(selected.readiness, 'draft');
assert.match(selected.title, /x.ray.*draft/i);
assert.equal(selected.body, topic.body);
assert.deepEqual(selected.bullets, [...topic.bullets]);
assert.deepEqual(selected.citations, [...topic.citations]);
assert(selected.citations.every(url => /^https:\/\//.test(url)));
assert.equal(new Set(selected.citations).size, selected.citations.length);
assert(selected.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
assert(selected.note && selected.note.trim());
const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
assert.match(prose, /central canal/i);
assert.match(prose, /(?:intramedullary|within the spinal cord)/i);
assert.match(prose, /vertebral canal/i);
assert.match(prose, /(?:subarachnoid|around the cord).{0,140}(?:myelograph|contrast)|(?:myelograph|contrast).{0,140}(?:subarachnoid|around the cord)/i);
assert.match(prose, /(?:not|no|cannot|does not).{0,120}(?:routine|plain).{0,70}(?:film|radiograph|x.ray)|(?:routine|plain).{0,70}(?:film|radiograph|x.ray).{0,120}(?:not|no|cannot|does not)/i);
assert.match(prose, /(?:no|not|without).{0,120}(?:MRI registration|registration)/i);
assert.match(prose, /(?:no|not|without).{0,100}(?:patency|flow)/i);
assert.match(prose, /(?:exact.revision|revision.bound) radiologist/i);
assert.match(prose, /(?:no|not|without).{0,120}clinical approval/i);
for (const word of ['Atlas', 'case', 'lecture', 'independent']) assert.match(prose, new RegExp(word, 'i'));
assert.doesNotMatch(prose, /approved for clinical use|diagnostic threshold|confirmed patency|measured flow/i);
for (const url of ['https://www.radiologyinfo.org/en/info/myelography',
  'https://www.radiologyinfo.org/en/info/spinemr']) assert(selected.citations.includes(url));
const {readiness, ...content} = selected;
assert.deepEqual(now.bodyContent(identity, 'xray'), content);
const cleanLesson = structuredClone(selected);
selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
assert.deepEqual(now.centralCanalXrayLesson(identity, 'xray'), cleanLesson, 'Fresh lesson arrays');
for (const tab of now.contentTabs) if (tab !== 'xray')
  assert.equal(now.centralCanalXrayLesson(identity, tab), undefined);
for (const structure of catalog.structures) if (structure.id !== id)
  assert.equal(now.centralCanalXrayLesson(structure, 'xray'), undefined, structure.id);
assert.equal(now.centralCanalXrayLesson({id}, 'xray'), undefined, 'An ID alone cannot authorize content');

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(now.centralCanalXrayLesson(bad, 'xray'), undefined, label);
  refusedIdentities++;
};
for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
  const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
  const key = path.at(-1), original = parent[key];
  parent[key] = typeof original === 'string' ? original + '-foreign'
    : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
  refuse(bad, path.join('.'));
}
for (const path of pathsWhere(identity, Array.isArray)) {
  const bad = structuredClone(identity); at(bad, path).push('foreign');
  refuse(bad, path.join('.') + ': appended array item');
  if (at(identity, path).length > 1) {
    const reordered = structuredClone(identity); at(reordered, path).reverse();
    if (JSON.stringify(at(reordered, path)) !== JSON.stringify(at(identity, path)))
      refuse(reordered, path.join('.') + ': reordered array');
  }
}
for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
  const bad = structuredClone(identity); at(bad, path).unexpected = true;
  refuse(bad, (path.join('.') || '<root>') + ': extra field');
  for (const key of Object.keys(at(identity, path))) {
    const omitted = structuredClone(identity); delete at(omitted, path)[key];
    refuse(omitted, [...path, key].join('.') + ': omitted');
  }
}
assert(refusedIdentities > 50);

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = now.bodyLesson(structure, tab);
    if (structure.id === id && tab === 'xray') {
      assert.deepEqual(lesson, cleanLesson); changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`); preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (structure.id === id) {
    assert.deepEqual(packet.topics.filter(topic => topic.tab !== 'xray'),
      previousPacket.topics.filter(topic => topic.tab !== 'xray'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], key);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'xray'),
      {tab: 'xray', ...cleanLesson});
    assert.deepEqual(await now.parseBodyReviewResponse(packet, id), packet);
    assert.equal(await now.parseBodyReviewResponse(previousPacket, id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'xray').bullets[0] += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(topic => topic.tab === 'xray').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'xray'), 1); },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, id), null); malformed++;
    }
    const priorContext = await old.bodyReviewContext(id), context = await now.bodyReviewContext(id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {catalogScope: context.catalogScope, structureId: id,
      track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching')};
    const save = async input => now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_CENTRAL_CANAL_XRAY'}, body: JSON.stringify(input),
    }), {prepare() { storageCalls++; throw Error('Invalid decision reached storage'); }});
    for (const hashes of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash}, {revisionHash: priorContext.revisions.teaching},
    ]) { assert.equal((await save({...decision, ...hashes})).status, 409); stale++; }
    const forged = structuredClone(decision); forged.draft.checks.foreign = true;
    assert.equal((await save(forged)).status, 422); forgedSaves++;
    const approval = structuredClone(decision); approval.draft.status = 'approved';
    assert.equal((await save(approval)).status, 422); forgedApprovals++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [1, 9935, 1, 1103]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [6, 3, 1, 1, 0]);

for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts'])
  assert.deepEqual(readFileSync(path), gitBytes(path), `${path}: historical anatomy/dissection/tours unchanged`);
const nestedPaths = git(['ls-tree', '-r', '--name-only', baseline, '--', 'app', 'lib', 'content'])
  .split(/\r?\n/).filter(path => /(?:nested|specimen)/i.test(path));
assert(nestedPaths.length > 0);
for (const path of nestedPaths)
  assert.deepEqual(readFileSync(path), gitBytes(path), `${path}: nested/specimen unchanged`);
for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0], bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(path), `${path}: source geometry unchanged`);
}
assert.deepEqual(pins.bundles[0], catalog.bundles.find(bundle => bundle.id === 'spine-nerves'));
console.log(JSON.stringify({baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves,
  forgedApprovalsRefusedBeforeStorage: forgedApprovals, storageCalls,
  sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false,
  limitations: 'Educational draft and source/review regression only; no images, registration, radiologist sign-off or clinical validation.'}));
