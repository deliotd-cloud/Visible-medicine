import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import pins from '../content/orbital-support-quiz-pins.json' with { type: 'json' };
import { orbitalSupportQuizQuestions } from '../content/orbital-support-quiz.ts';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'd944f63c7517498fc571536271b96b111ce8ab05';
const completedEpoch = '297707431e0f85a76a9d4b40d13a53669f65c705';
const expectedGroups = new Map([
  ['FMA49067', 'trochlea'], ['FMA49068', 'trochlea'],
  ['FMA49072', 'ring'], ['FMA49073', 'ring'],
]);
const expectedAnswers = {
  trochlea: 'Superior oblique',
  ring: 'The four rectus muscles',
};
const reference = 'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});
const completedGit = path => execFileSync('git', ['show', `${completedEpoch}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});

assert.equal(pins.parentCommit, baseline);
assert.deepEqual(Object.keys(orbitalSupportQuizQuestions).sort(), ['ring', 'trochlea']);
assert.equal(pins.entries.length, 4);
assert.deepEqual(
  pins.entries.map(entry => entry.identity.fmaId).sort(),
  [...expectedGroups.keys()].sort(),
);
assert.equal(new Set(pins.entries.map(entry => entry.identity.id)).size, 4);
for (const entry of pins.entries) {
  assert.equal(entry.group, expectedGroups.get(entry.identity.fmaId));
  assert.equal(entry.identity.nodeName, entry.identity.fmaId);
  assert.equal(entry.identity.validation.anatomicalReview, false);
  assert.equal(entry.identity.validation.status, 'unvalidated');
}

let questionWords = 0;
for (const [group, question] of Object.entries(orbitalSupportQuizQuestions)) {
  assert.equal(typeof question.body, 'string');
  assert.equal(typeof question.explanation, 'string');
  assert.equal(question.choices.length, 4, group);
  assert.equal(new Set(question.choices).size, 4, group);
  assert.equal(question.choices.filter(choice => choice === question.correctAnswer).length, 1, group);
  assert.equal(question.correctAnswer, expectedAnswers[group], group);
  assert.deepEqual([...question.references], [reference], group);
  questionWords += [question.body, ...question.choices, question.explanation]
    .join(' ').trim().split(/\s+/).length;
}
assert(questionWords < 200, `Question source text totals ${questionWords} words`);

const old = await exactSourceHistoryApi(baseline, 'review-security');
// Replay the completed orbital-quiz epoch. Later teaching may add topics, but
// it cannot rewrite what this transition actually changed or preserved.
const completed = await exactSourceHistoryApi(completedEpoch, 'review-security');
const compiled = await build({
  stdin: { contents: `export {orbitalSupportQuizLesson} from './lib/orbital-support-quiz';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-response';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const oldRaw = JSON.parse(git('public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(raw, oldRaw, 'Source catalog remains unchanged');
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, old.bodyDisplayCatalog(oldRaw), 'Display geometry remains unchanged');
assert.deepEqual(catalog.coordinateSystem, pins.coordinateSystem);
for (const key of ['structures', 'dissectionProfiles', 'regionalTours'])
  assert.deepEqual(now[key], old[key], `${key} remains unchanged`);
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, git(path), `${path} remains unchanged`);
}
assert.equal(pins.bundles.length, 1);
for (const bundle of pins.bundles)
  assert.deepEqual(catalog.bundles.find(item => item.id === bundle.id), bundle);

const targetById = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
for (const entry of pins.entries) {
  const actual = catalog.structures.find(s => s.id === entry.identity.id);
  assert.deepEqual(actual, entry.identity, `${entry.identity.fmaId} exact identity`);
}
const oldPins = JSON.parse(git('content/body-review-display-pins.json'));
const currentPins = JSON.parse(completedGit('content/body-review-display-pins.json'));
assert.equal(currentPins.pins.length, oldPins.pins.length);
const previousPins = new Map(oldPins.pins.map(pin => [pin.structureId, pin]));
let changedPins = 0;
for (const pin of currentPins.pins) {
  const prior = previousPins.get(pin.structureId);
  assert(prior, `Unexpected display pin ${pin.structureId}`);
  if (targetById.has(pin.structureId)) {
    assert.notEqual(pin.sha256, prior.sha256, `${pin.structureId}: display changed`);
    changedPins++;
  } else assert.deepEqual(pin, prior, `Unrelated display pin ${pin.structureId}`);
}
assert.equal(changedPins, 4);

let changed = 0, preserved = 0, teachingChanges = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const previous = old.bodyLesson(structure, tab);
    const current = completed.bodyLesson(structure, tab);
    const entry = targetById.get(structure.id);
    if (entry && tab === 'quiz') {
      const question = orbitalSupportQuizQuestions[entry.group];
      assert.deepEqual(previous, entry.previous, `${structure.id}: saved previous lesson`);
      assert.equal(previous.readiness, 'generated-identification');
      const draft = now.orbitalSupportQuizLesson(structure, tab);
      assert.deepEqual(current, draft, `${structure.id}: quiz routing`);
      assert.equal(draft.readiness, 'draft');
      assert.equal(draft.body, question.body);
      assert.deepEqual(draft.bullets, [...question.choices]);
      assert.equal(draft.correctAnswer, question.correctAnswer);
      assert.equal(draft.explanation, question.explanation);
      assert.deepEqual(draft.citations, [...question.references]);
      assert.match(draft.note, /review pending/i);
      const { readiness, ...shown } = draft;
      assert.deepEqual(completed.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(current, previous, `${structure.id}:${tab}`);
      assert.equal(now.orbitalSupportQuizLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const priorPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await completed.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (targetById.has(structure.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], priorPacket[key], `${structure.id}:${key}`);
    for (const key of ['source', 'checklist'])
      assert.equal(packet.fingerprints[key], priorPacket.fingerprints[key], `${structure.id}:${key} hash`);
    assert.notEqual(packet.fingerprints.teaching, priorPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, priorPacket.materialHash);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), {
      tab: 'quiz', ...completed.bodyLesson(structure, 'quiz'),
    });
    assert.deepEqual(await completed.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await completed.parseBodyReviewResponse(priorPacket, structure.id), null);
    const forged = structuredClone(packet);
    forged.topics.find(topic => topic.tab === 'quiz').correctAnswer += ' foreign';
    assert.equal(await completed.parseBodyReviewResponse(forged, structure.id), null);
    teachingChanges++;
  } else assert.deepEqual(packet, priorPacket, `${structure.id}: review packet`);
}
assert.equal(changed, 4);
assert.equal(preserved, 9932);
assert.equal(changed + preserved, 9936);
assert.equal(teachingChanges, 4);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refused = 0;
for (const { identity } of pins.entries) {
  const clean = now.orbitalSupportQuizLesson(identity, 'quiz');
  const expected = structuredClone(clean);
  clean.bullets.push('foreign');
  clean.citations.push('foreign');
  assert.deepEqual(now.orbitalSupportQuizLesson(identity, 'quiz'), expected, 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const invalid = structuredClone(identity);
    const parent = at(invalid, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.orbitalSupportQuizLesson(invalid, 'quiz'), undefined, path.join('.'));
    refused++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const invalid = structuredClone(identity);
    at(invalid, path).push('foreign');
    assert.equal(now.orbitalSupportQuizLesson(invalid, 'quiz'), undefined, path.join('.'));
    refused++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const invalid = structuredClone(identity);
    at(invalid, path).unexpected = true;
    assert.equal(now.orbitalSupportQuizLesson(invalid, 'quiz'), undefined, path.join('.') || '<root>');
    refused++;
  }
}
console.log(JSON.stringify({ changed, preserved, teachingChanges, changedPins, refused,
  bundlesUnchanged: catalog.bundles.length, questionWords, clinicalApproval: false }));
