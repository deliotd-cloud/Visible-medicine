import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { longusColliQuizQuestions } from '../content/longus-colli-quiz.ts';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'c4aa4ed6a2d4831e51e8c877fbcfa0d66d265bf6';
const completedCommit = 'd944f63c7517498fc571536271b96b111ce8ab05';
const targetFmaIds = ['FMA46284', 'FMA46286', 'FMA46288'];
const expectedAnswers = {
  FMA46284: 'C1 anterior tubercle',
  FMA46286: 'C2–C4',
  FMA46288: 'C5–C6 anterior transverse tubercles',
};
const hash = value => createHash('sha256').update(value).digest('hex');
const git = path => execFileSync('git', ['show', `${baseline}:${path}`], { windowsHide: true, maxBuffer: 32e6 });
const completedGit = path => execFileSync('git', ['show', `${completedCommit}:${path}`], { windowsHide: true, maxBuffer: 32e6 });
const old = await exactSourceHistoryApi(baseline, 'review-security');
const completed = await exactSourceHistoryApi(completedCommit, 'review-security');
const compiled = await build({
  stdin: { contents: `export {longusColliQuizLesson} from './lib/longus-colli';
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
assert.deepEqual(raw, oldRaw);
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, old.bodyDisplayCatalog(oldRaw));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours']) assert.deepEqual(now[key], old[key], key);
assert.deepEqual(Object.keys(longusColliQuizQuestions).sort(), [...targetFmaIds].sort());
const targets = catalog.structures.filter(s => targetFmaIds.includes(s.fmaId) && s.laterality === 'left');
assert.equal(targets.length, 3);
assert.deepEqual(targets.map(s => s.fmaId).sort(), [...targetFmaIds].sort());
const targetById = new Map(targets.map(s => [s.id, s]));

const oldPins = JSON.parse(git('content/body-review-display-pins.json'));
const completedPins = JSON.parse(completedGit('content/body-review-display-pins.json'));
const currentPins = JSON.parse(readFileSync('content/body-review-display-pins.json'));
assert.equal(completedPins.pins.length, oldPins.pins.length);
assert.equal(currentPins.pins.length, completedPins.pins.length);
const priorPinById = new Map(oldPins.pins.map(p => [p.structureId, p]));
const currentPinById = new Map(currentPins.pins.map(p => [p.structureId, p]));
let changedPins = 0;
for (const pin of completedPins.pins) {
  const prior = priorPinById.get(pin.structureId);
  assert(prior, `Unexpected display pin ${pin.structureId}`);
  if (targetById.has(pin.structureId)) {
    assert.notEqual(pin.sha256, prior.sha256);
    assert.deepEqual(currentPinById.get(pin.structureId), pin, `Current longus display pin ${pin.structureId}`);
    changedPins++;
  } else assert.deepEqual(pin, prior, `Display pin ${pin.structureId}`);
}
assert.equal(changedPins, 3);

const wordsByReference = new Map();
for (const [fmaId, question] of Object.entries(longusColliQuizQuestions)) {
  assert.equal(typeof question.body, 'string');
  assert.equal(typeof question.explanation, 'string');
  assert.equal(question.choices.length, 4, fmaId);
  assert.equal(new Set(question.choices).size, 4, fmaId);
  assert.equal(question.choices.filter(choice => choice === question.correctAnswer).length, 1, fmaId);
  assert.equal(question.correctAnswer, expectedAnswers[fmaId], `${fmaId}: anatomical answer`);
  assert(question.references.length >= 1, fmaId);
  assert(question.references.some(url => url.includes('luc.edu')), `${fmaId}: cite Loyola`);
  for (const url of question.references) {
    const words = [question.body, ...question.choices, question.explanation].join(' ').trim().split(/\s+/).length;
    wordsByReference.set(url, (wordsByReference.get(url) ?? 0) + words);
  }
}
for (const [url, words] of wordsByReference) assert(words <= 200, `${url}: ${words} derived words`);

let changed = 0, preserved = 0, refused = 0, teachingChanges = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const previous = old.bodyLesson(structure, tab);
    const historical = completed.bodyLesson(structure, tab);
    if (targetById.has(structure.id) && tab === 'quiz') {
      const q = longusColliQuizQuestions[structure.fmaId];
      assert.equal(previous.readiness, 'generated-identification');
      const draft = now.longusColliQuizLesson(structure, tab);
      assert.deepEqual(historical, draft, `${structure.id}:${tab} completed lesson`);
      assert.deepEqual(now.bodyLesson(structure, tab), draft, `${structure.id}:${tab} current routing`);
      assert.equal(draft.readiness, 'draft');
      assert.equal(draft.body, q.body);
      assert.deepEqual(draft.bullets, q.choices);
      assert.equal(draft.correctAnswer, q.correctAnswer);
      assert.equal(draft.explanation, q.explanation);
      assert.deepEqual(draft.citations, q.references);
      assert.match(draft.note, /review pending/i);
      const { readiness, ...shown } = draft;
      assert.deepEqual(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(historical, previous, `${structure.id}:${tab} historical transition`);
      assert.equal(now.longusColliQuizLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const priorPacket = await old.bodyReviewMaterial(structure.id);
  const historicalPacket = await completed.bodyReviewMaterial(structure.id);
  const packet = targetById.has(structure.id) ? await now.bodyReviewMaterial(structure.id) : historicalPacket;
  for (const field of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(historicalPacket[field], priorPacket[field], `${structure.id}:${field}`);
  assert.equal(historicalPacket.approval, false);
  if (targetById.has(structure.id)) {
    assert.notEqual(historicalPacket.fingerprints.teaching, priorPacket.fingerprints.teaching);
    assert.deepEqual(packet, historicalPacket, `${structure.id}: current longus review packet`);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), { tab: 'quiz', ...now.bodyLesson(structure, 'quiz') });
    assert.deepEqual(await now.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await now.parseBodyReviewResponse(priorPacket, structure.id), null);
    const forged = structuredClone(packet);
    forged.topics.find(topic => topic.tab === 'quiz').correctAnswer += ' foreign';
    assert.equal(await now.parseBodyReviewResponse(forged, structure.id), null);
    teachingChanges++;
  } else {
    assert.deepEqual(historicalPacket.topics, priorPacket.topics);
    assert.equal(historicalPacket.fingerprints.teaching, priorPacket.fingerprints.teaching);
  }
}
assert.equal(changed, 3);
assert.equal(preserved, 9933);
assert.equal(changed + preserved, 9936);
assert.equal(teachingChanges, 3);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const identity of targets) {
  const clean = now.longusColliQuizLesson(identity, 'quiz');
  const expected = structuredClone(clean);
  clean.bullets.push('foreign'); clean.citations.push('foreign');
  assert.deepEqual(now.longusColliQuizLesson(identity, 'quiz'), expected);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const invalid = structuredClone(identity);
    const parent = at(invalid, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.longusColliQuizLesson(invalid, 'quiz'), undefined, path.join('.'));
    refused++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const invalid = structuredClone(identity);
    at(invalid, path).push('foreign');
    assert.equal(now.longusColliQuizLesson(invalid, 'quiz'), undefined, path.join('.'));
    refused++;
  }
  const invalid = structuredClone(identity);
  invalid.unexpected = true;
  assert.equal(now.longusColliQuizLesson(invalid, 'quiz'), undefined);
  refused++;
}
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  assert.equal(hash(readFileSync(path)), bundle.sha256);
  assert.deepEqual(readFileSync(path), git(path));
}
console.log(JSON.stringify({ changed, preserved, teachingChanges, changedPins, refused, bundlesUnchanged: catalog.bundles.length, clinicalApproval: false }));
