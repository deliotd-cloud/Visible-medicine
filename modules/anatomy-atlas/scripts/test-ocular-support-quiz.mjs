import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { ocularSupportQuizQuestions } from '../content/ocular-support-quiz.ts';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '245ccffe3a3161a83ee0fd7be643184519b2887a';
const reference = 'https://anatomy.ttuhscep.edu/schemes/eye_ans.html';
const groups = new Map([
  ['FMA49144', 'check'], ['FMA49145', 'check'],
  ['FMA49147', 'check'], ['FMA49148', 'check'],
  ['FMA59091', 'tarsal'], ['FMA59092', 'tarsal'],
  ['FMA59089', 'tarsal'], ['FMA59090', 'tarsal'],
]);
const answers = {
  check: 'Muscle sheaths to the sides of the orbit',
  tarsal: 'Supporting and shaping the eyelids',
};
const pins = JSON.parse(readFileSync('content/orbital-support-mri-pins.json', 'utf8'));
const selected = pins.entries.filter(entry => groups.has(entry.identity.fmaId));
assert.equal(selected.length, 8);
assert.deepEqual(new Set(selected.map(entry => entry.identity.fmaId)), new Set(groups.keys()));
assert.equal(new Set(selected.map(entry => entry.identity.id)).size, 8);
const byId = new Map(selected.map(entry => [entry.identity.id, entry]));
const fromBaseline = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

assert.deepEqual(Object.keys(ocularSupportQuizQuestions).sort(), ['check', 'tarsal']);
for (const [group, question] of Object.entries(ocularSupportQuizQuestions)) {
  assert(question.body.trim().length > 0, group);
  assert(question.explanation.trim().length > 0, group);
  assert.equal(question.choices.length, 4, group);
  assert.equal(new Set(question.choices).size, 4, group);
  assert.equal(question.choices.filter(choice => choice === question.correctAnswer).length, 1, group);
  assert.equal(question.correctAnswer, answers[group], group);
  assert.deepEqual([...question.references], [reference], group);
}

const previous = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {
    contents: `export {ocularSupportQuizLesson} from './lib/ocular-support-quiz';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.deepEqual(raw, JSON.parse(fromBaseline(catalogPath)));
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, previous.bodyDisplayCatalog(JSON.parse(fromBaseline(catalogPath))));
assert.deepEqual(catalog.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(now.structures, previous.structures);
assert.deepEqual(now.dissectionProfiles, previous.dissectionProfiles);
assert.deepEqual(now.regionalTours, previous.regionalTours);
assert.deepEqual(now.contentTabs, previous.contentTabs);
assert.equal(now.contentTabs.length * catalog.structures.length, 9936);
for (const entry of selected) {
  assert.equal(entry.identity.nodeName, entry.identity.fmaId);
  assert.equal(entry.identity.validation.anatomicalReview, false);
  assert.equal(entry.identity.validation.status, 'unvalidated');
  assert.deepEqual(catalog.structures.find(row => row.id === entry.identity.id), entry.identity);
}

let changed = 0, preserved = 0, changedWorksheets = 0;
let malformed = 0, stale = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const oldLesson = previous.bodyLesson(structure, tab);
    const lesson = now.bodyLesson(structure, tab);
    const entry = byId.get(structure.id);
    if (entry && tab === 'quiz') {
      const group = groups.get(entry.identity.fmaId);
      const question = ocularSupportQuizQuestions[group];
      assert.equal(oldLesson.readiness, 'generated-identification', structure.id);
      assert.deepEqual(lesson, now.ocularSupportQuizLesson(structure, tab));
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.body, question.body);
      assert.deepEqual(lesson.bullets, [...question.choices]);
      assert.equal(lesson.correctAnswer, question.correctAnswer);
      assert.equal(lesson.explanation, question.explanation);
      assert.deepEqual(lesson.citations, [...question.references]);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      const { readiness, ...shown } = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(lesson, oldLesson, `${structure.id}:${tab}`);
      assert.equal(now.ocularSupportQuizLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const oldPacket = await previous.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (byId.has(structure.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], oldPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), {
      tab: 'quiz', ...now.bodyLesson(structure, 'quiz'),
    });
    assert.deepEqual(await now.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await now.parseBodyReviewResponse(oldPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'quiz').correctAnswer += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').explanation += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').citations = ['https://foreign.example']; },
      value => { value.topics.find(topic => topic.tab === 'quiz').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'quiz'), 1); },
    ]) {
      const forged = structuredClone(packet);
      edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const oldContext = await previous.bodyReviewContext(structure.id);
    const context = await now.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope,
      structureId: structure.id,
      track: 'teaching',
      expectedVersion: 0,
      materialHash: context.materialHash,
      revisionHash: context.revisions.teaching,
      checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching'),
    };
    for (const staleHashes of [
      { materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching },
      { materialHash: oldContext.materialHash },
      { revisionHash: oldContext.revisions.teaching },
    ]) {
      const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
        method: 'POST',
        headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_OCULAR_QUIZ' },
        body: JSON.stringify({ ...decision, ...staleHashes }),
      }), { prepare() { storageCalls++; throw Error('Stale decision reached storage'); } });
      assert.equal(response.status, 409);
      stale++;
    }
    changedWorksheets++;
  } else {
    assert.deepEqual(packet, oldPacket, `${structure.id}: review packet`);
  }
}
assert.equal(changed, 8);
assert.equal(preserved, 9928);
assert.equal(changedWorksheets, 8);
assert.equal(malformed, 40);
assert.equal(stale, 24);
assert.equal(storageCalls, 0);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const { identity } of selected) {
  const lesson = now.ocularSupportQuizLesson(identity, 'quiz');
  const clean = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.ocularSupportQuizLesson(identity, 'quiz'), clean, 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const invalid = structuredClone(identity);
    const parent = at(invalid, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.ocularSupportQuizLesson(invalid, 'quiz'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const invalid = structuredClone(identity);
    at(invalid, path).push('foreign');
    assert.equal(now.ocularSupportQuizLesson(invalid, 'quiz'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const invalid = structuredClone(identity);
    at(invalid, path).unexpected = true;
    assert.equal(now.ocularSupportQuizLesson(invalid, 'quiz'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, fromBaseline(path), `${path} remains unchanged`);
}
console.log(JSON.stringify({ baseline, changed, preserved, changedWorksheets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  storageCalls, sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false }));
