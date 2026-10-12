import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'c6fd5a1789ce8c6f06c48693aa9d5479a00d610a';
const expected = new Map([
  ['anterior-cardiac-vein', 'FMA76767'],
  ['great-cardiac-vein', 'FMA4707'],
  ['middle-cardiac-vein', 'FMA4713'],
  ['hemiazygos-vein', 'FMA4944'],
  ['right-internal-thoracic-vein', 'FMA4758'],
]);
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`],
  {windowsHide: true, maxBuffer: 32e6});
const pinPaths = [
  'content/cardiac-venous-tour-pins.json',
  'content/central-vessel-imaging-pins.json',
  'content/internal-thoracic-imaging-pins.json',
];
for (const path of pinPaths)
  assert.deepEqual(readFileSync(path), gitBytes(path), 'Reuse unchanged source pins: ' + path);
const pins = pinPaths.map(path => JSON.parse(readFileSync(path, 'utf8')));
const entries = [
  ...pins[0].entries.filter(e => ['FMA76767', 'FMA4707', 'FMA4713'].includes(e.fmaId))
    .map(identity => ({identity, group: identity.id.split(':').at(-1)})),
  ...pins[1].entries.filter(e => e.identity.fmaId === 'FMA4944')
    .map(e => ({...e, group: 'hemiazygos-vein'})),
  ...pins[2].entries.filter(e => e.group === 'right-internal-thoracic-vein'),
];
assert.equal(entries.length, 5);
assert.deepEqual(new Map(entries.map(e => [e.group, e.identity.fmaId])), expected);
const identities = new Map(entries.map(e => [e.identity.id, e.identity]));
assert.equal(identities.size, 5);
for (const {identity, group} of entries) {
  assert.equal(identity.region, 'thorax');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.laterality, group === 'hemiazygos-vein' ? 'midline'
    : group === 'right-internal-thoracic-vein' ? 'right' : 'unspecified');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}
for (const bundle of new Set(entries.map(e => e.identity.bundle))) {
  const descriptor = pins.flatMap(p => p.bundles ?? []).find(b => b.id === bundle);
  assert(descriptor, `Existing source bundle descriptor: ${bundle}`);
  const path = 'public' + descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(path), gitBytes(path), `${bundle} source geometry must be unchanged`);
}

const compiled = await build({
  stdin: {contents:
    "export {thoracicVenousXrayLesson} from './lib/thoracic-venous-xray';" +
    "export {thoracicVenousXrayTopics} from './content/thoracic-venous-xray';" +
    "export {bodyLesson,bodyContent} from './app/body-content';" +
    "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
    "export {contentTabs} from './lib/content-types';" +
    "export {regionalTours} from './lib/regional-tours';" +
    "export * from './lib/body-review-material';" +
    "export * from './lib/body-review-context';" +
    "export * from './lib/body-review-response';" +
    "export * from './lib/body-review-api';" +
    "export * from './lib/body-review-decisions';",
    resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
assert.deepEqual(Object.keys(current.thoracicVenousXrayTopics).sort(),
  [...expected.keys()].sort());
for (const topic of Object.values(current.thoracicVenousXrayTopics)) {
  assert(topic.title && topic.body && topic.bullets.length >= 2);
  assert(topic.bullets.every(b => typeof b === 'string' && b.trim()));
  assert(topic.citations.length > 0);
  assert(topic.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(topic.citations).size, topic.citations.length);
}

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const catalog = current.bodyDisplayCatalog(JSON.parse(readFileSync(catalogPath, 'utf8')));
assert.deepEqual(readFileSync(catalogPath), gitBytes(catalogPath), 'Source catalog must be unchanged');
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.deepEqual(current.regionalTours, old.regionalTours, 'Tours must be unchanged');
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id)).sort((a, b) => a.id.localeCompare(b.id)),
  entries.map(e => e.identity).sort((a, b) => a.id.localeCompare(b.id)));
const musculophrenic = catalog.structures.filter(s => /musculophrenic-vein$/.test(s.id));
assert.equal(musculophrenic.length, 2);
for (const structure of musculophrenic) {
  assert.equal(old.bodyLesson(structure, 'xray').readiness, 'pending');
  assert.equal(current.bodyLesson(structure, 'xray').readiness, 'pending');
  assert.equal(current.thoracicVenousXrayLesson(structure, 'xray'), undefined);
}

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  assert.equal(current.thoracicVenousXrayLesson(identity, 'xray').readiness, 'draft');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(current.thoracicVenousXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.thoracicVenousXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(current.thoracicVenousXrayLesson(bad, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let stale = 0, forgedDecisions = 0, malformed = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of current.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = current.bodyLesson(structure, tab);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, current.thoracicVenousXrayLesson(structure, tab));
      const group = entries.find(e => e.identity.id === structure.id).group;
      const topic = current.thoracicVenousXrayTopics[group];
      assert.equal(lesson.body, topic.body);
      for (const bullet of topic.bullets) assert(lesson.bullets.includes(bullet));
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /contrast|venograph|venous phase/i);
      assert.match(prose, /plain.{0,30}(chest )?radiograph|ordinary.{0,30}(chest )?radiograph/i);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.match(lesson.note, /No[^.]*acquired (?:angiogram|image)/i);
      assert.match(lesson.note, /No[^.]*clinical approval/i);
      assert.match(lesson.note, /No[^.]*patient-space registration/i);
      assert.match(lesson.note, /(?:Atlas|case).*(?:Education case|Atlas).*(?:lecture|access).*independent/i);
      assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
      if (['anterior-cardiac-vein', 'great-cardiac-vein', 'middle-cardiac-vein'].includes(group)) {
        assert.match(prose, /coronary[- ]sinus/i);
        assert.match(prose, /(?:not|no|cannot|does not).{0,120}(?:access|route|cannulat|continuity)/i);
      }
      if (['great-cardiac-vein', 'middle-cardiac-vein'].includes(group)) {
        assert.match(prose, /venous.{0,25}phase|phase.{0,25}venous/i);
        assert.match(prose, /arterial|artery/i);
      }
      if (group === 'anterior-cardiac-vein') {
        assert.match(prose, /group|two original surfaces/i);
        assert.match(prose, /(?:not|no).{0,80}normal.{0,30}(?:vein )?count/i);
        assert.match(prose, /right atrium/i);
        assert.match(prose, /(?:cannot|not).{0,60}(?:assumed|assume).{0,60}opacify/i);
      }
      if (group === 'hemiazygos-vein') {
        assert.match(prose, /hemiazygos.{0,20}system|azygos.{0,20}system/i);
        assert.match(prose, /patholog|disease|obstruct/i);
        assert.match(prose, /(?:not|no|does not|cannot).{0,120}(?:normal.{0,40}visibility|visibility.{0,40}normal)/i);
        assert.match(prose, /(?:not|no).{0,100}accessory hemiazygos/i);
      }
      if (group === 'right-internal-thoracic-vein') {
        assert.match(prose, /catheter/i);
        assert.match(prose, /project|projection/i);
        assert.match(prose, /lumen/i);
        assert.match(prose, /(?:not|no|cannot|does not).{0,140}(?:safe|correct|acceptable).{0,40}(?:placement|position|placed)/i);
      }
      const {readiness, ...content} = lesson;
      assert.deepEqual(current.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(current.thoracicVenousXrayLesson(structure, tab), copy);
      for (const other of current.contentTabs) if (other !== 'xray')
        assert.equal(current.thoracicVenousXrayLesson(structure, other), undefined);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
      if (!identities.has(structure.id))
        assert.equal(current.thoracicVenousXrayLesson(structure, tab), undefined);
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await current.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'xray'),
      previousPacket.topics.filter(row => row.tab !== 'xray'), `${structure.id}: other Review tabs`);
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      {tab: 'xray', ...current.bodyLesson(structure, 'xray')});
    assert.deepEqual(await current.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await current.parseBodyReviewResponse(previousPacket, structure.id), null);
    const forged = structuredClone(packet);
    forged.topics.find(row => row.tab === 'xray').body += ' foreign';
    assert.equal(await current.parseBodyReviewResponse(forged, structure.id), null);
    malformed++;
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await current.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: current.blankBodyReview(context, 'teaching'),
    };
    const response = await current.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_VENOUS_XRAY'}, body: JSON.stringify(decision),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    const forgedDecision = structuredClone(decision);
    forgedDecision.materialHash = context.materialHash;
    forgedDecision.revisionHash = context.revisions.teaching;
    forgedDecision.draft.status = 'approved';
    const forgedResponse = await current.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_VENOUS_XRAY'}, body: JSON.stringify(forgedDecision),
    }), {prepare() { storageCalls++; throw Error('Forged approval reached storage'); }});
    assert.equal(forgedResponse.status, 422);
    forgedDecisions++; stale++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [5, 9931, 5, 1099]);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedApprovalRefusalsBeforeStorage: forgedDecisions, storageCalls, clinicalApproval: false}));
