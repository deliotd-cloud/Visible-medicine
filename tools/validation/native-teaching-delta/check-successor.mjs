import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { verifyTeachingDelta, verifyDisplayPinDelta } from './delta-core.mjs';

// Read-only integration check. Expectations never replace generated output.
assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'));
const stage = 'G:/VisibleMedicine-temp/staging/20261029-combined-native-successor';
const root = 'G:/VisibleMedicine-temp/staging/20261029-native-teaching-delta';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = new Map();
function read(file, expected) {
  const bytes = fs.readFileSync(file), digest = sha(bytes);
  if (expected) assert.equal(digest, expected, file);
  if (inputs.has(file)) assert.equal(digest, inputs.get(file), 'Input changed while checking');
  inputs.set(file, digest);
  return bytes;
}
for (const name of ['check-successor.mjs', 'delta-core.mjs']) read(root + '/' + name);
const prep = JSON.parse(read(stage + '/PREPARATION.json', 'f1ae317be0b5b862225f47eb1907cdc0378f4a6891e4c779ff0b38b13e1f15ee'));
const parent = JSON.parse(read(prep.parent.path, prep.parent.sha256));
const parentRows = new Map(parent.sourceRows.map(row => [row.path, row.sha256]));
const sourceRows = new Map(prep.sourceRows.map(row => [row.path, row.sha256]));
const atlas = prep.atlas;
const proposal = JSON.parse(read('F:/VisibleMedicine/recovery/checkpoints/20261029-quiz-successor/validation/SNAPSHOT_COMPARISON.json', '5f94906d8f0ae44ac8563013cd7c6f89530c50f193d93927b2e89302ace5601d'));
const requireSource = createRequire(atlas + '/package.json');
const dependencyReceipt = JSON.parse(read('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json', 'cbda14f0489c2c66474f1d8b47b7171aab52130ca68749fe78219773cf650f56'));
for (const file of [process.execPath, requireSource.resolve('typescript')]) {
  const resolved = fs.realpathSync.native(file);
  const pin = dependencyReceipt.dependencyFiles.find(row => row.path === resolved);
  assert(pin, 'Executable dependency must be independently pinned');
  read(resolved, pin.sha256);
}
const ts = requireSource('typescript');
const modules = new Map();
function load(relative) {
  assert(sourceRows.has(relative), 'Unbound module: ' + relative);
  if (modules.has(relative)) return modules.get(relative);
  const file = atlas + '/' + relative, bytes = read(file, sourceRows.get(relative));
  if (relative.endsWith('.json')) {
    const value = { default: JSON.parse(bytes) };
    modules.set(relative, value);
    return value;
  }
  assert(relative.endsWith('.ts'), 'Only bound source modules');
  const module = { exports: {} };
  modules.set(relative, module.exports);
  const code = ts.transpileModule(bytes.toString(), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module, exports: module.exports, require: name => {
    assert(name.startsWith('.'), 'No external execution in lesson evaluator');
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(relative), name));
    assert(!base.startsWith('../'));
    const target = [base, base + '.ts', base + '.json'].find(p => sourceRows.has(p));
    assert(target, 'Unresolved lesson dependency: ' + name);
    return load(target);
  } });
  return module.exports;
}
const { sourceCanonical } = load('lib/body-source-additions.ts');
const { contentTabs } = load('lib/content-types.ts');
const { decodeRegionalTeachingSnapshot } = load('lib/regional-teaching-snapshot.ts');
const helpers = {
  elbow: ['elbow-arteries', 'elbowArteryLesson'],
  genicular: ['genicular-arteries', 'genicularArteryLesson'],
  epigastric: ['inferior-epigastric-vessels', 'inferiorEpigastricLesson'],
  cranial: ['cranial-arteries', 'cranialArteryLesson'],
  thyroid: ['inferior-thyroid-arteries', 'inferiorThyroidLesson'],
  subscapular: ['subscapular-arteries', 'subscapularArteryLesson'],
  cubital: ['cubital-veins', 'cubitalVeinLesson'],
};
const quiz = new Map(proposal.reviewQuestions.map(q => [q.sourceIdentity, q]));
assert.equal(quiz.size, 41);
const additional = new Map([
  ['vm:anatomy:body:abdomen:unspecified:vessel:appendicular-artery', ['ultrasound', 'appendicular-artery-ultrasound', 'appendicularArteryUltrasoundLesson']],
  ['vm:anatomy:body:head-neck:right:organ:right-globus-pallidus', ['mri', 'central-neural-imaging', 'centralNeuralImagingLesson']],
  ['vm:anatomy:body:head-neck:left:organ:left-globus-pallidus', ['mri', 'central-neural-imaging', 'centralNeuralImagingLesson']],
]);
const snapshotPaths = [...parentRows.keys()].filter(p => p.startsWith('content/regional-teaching/') && p.endsWith('.json')).sort();
assert.equal(snapshotPaths.length, 11);
assert.deepEqual(fs.readdirSync(atlas + '/content/regional-teaching').sort(), snapshotPaths.map(p => path.posix.basename(p)));
const changed = [], regions = [], seen = new Set(), matched = new Set();
let lessonCount = 0;
for (const relative of snapshotPaths) {
  const before = JSON.parse(read(parent.atlas + '/' + relative, parentRows.get(relative)));
  const actual = JSON.parse(read(atlas + '/' + relative));
  const oldReader = decodeRegionalTeachingSnapshot(before, before.region);
  const expectedRows = [];
  for (const entry of before.entries) {
    assert(!seen.has(entry.identity), 'Duplicate global structure identity'); seen.add(entry.identity);
    const structure = JSON.parse(entry.identity);
    assert.equal(sourceCanonical(structure), entry.identity);
    const q = quiz.get(sha(entry.identity)), extra = additional.get(structure.id);
    assert(!(q && extra), 'Overlapping proposal requires explicit composition review');
    for (const topic of contentTabs) {
      const old = structuredClone(oldReader.bodyLesson(structure, topic));
      let lesson = old;
      if (topic === 'quiz' && q) {
        assert.equal(q.id, structure.id);
        const [module, fn] = helpers[q.group];
        lesson = structuredClone(load('lib/' + module + '.ts')[fn](structure, topic));
        assert.deepEqual(lesson, q.question, 'Current authored quiz differs from the saved reviewed proposal');
        assert.equal(lesson.bullets.filter(value => value === lesson.correctAnswer).length, 1);
        matched.add(q.sourceIdentity);
      } else if (extra && topic === extra[0]) {
        lesson = structuredClone(load('lib/' + extra[1] + '.ts')[extra[2]](structure, topic));
        assert(lesson, 'Exact-source helper must admit the unchanged structure');
      }
      if (lesson !== old) {
        assert.notDeepEqual(lesson, old, 'Expected draft must actually change');
        assert.equal(lesson.readiness, old.readiness, 'No automatic readiness promotion');
        changed.push({ structureId: structure.id, identitySha256: sha(entry.identity), region: before.region, topic });
      }
      expectedRows.push({ region: before.region, identity: entry.identity, topic, lesson });
    }
  }
  let actualMatches = false, failure = null;
  try {
    assert.equal(actual.schemaVersion, before.schemaVersion);
    assert.equal(actual.region, before.region);
    const currentReader = decodeRegionalTeachingSnapshot(actual, before.region);
    const actualRows = actual.entries.flatMap(entry => contentTabs.map(topic => ({
      region: actual.region, identity: entry.identity, topic,
      lesson: structuredClone(currentReader.bodyLesson(JSON.parse(entry.identity), topic)),
    })));
    verifyTeachingDelta(expectedRows, actualRows);
    actualMatches = true;
  } catch (error) { failure = String(error.message).slice(0, 400); }
  lessonCount += expectedRows.length;
  regions.push({ file: relative, expectedLessons: expectedRows.length, actualSha256: inputs.get(atlas + '/' + relative), actualMatches, failure });
}
assert.equal(seen.size, 1104); assert.equal(lessonCount, 9936); assert.equal(matched.size, 41); assert.equal(changed.length, 44);
assert.equal(new Set(changed.map(r => r.structureId)).size, 44);
const pinPath = 'content/body-review-display-pins.json';
const baselinePins = JSON.parse(read(parent.atlas + '/' + pinPath, parentRows.get(pinPath)));
const actualPins = JSON.parse(read(atlas + '/' + pinPath));
const exactChangedPins = [];
for (const [file, digest, ids] of [
  ['F:/VisibleMedicine/staging/20261030-appendicular-generated-contract/content/body-review-display-pins.json', '75b7df6f1e3349bf80dd1403ac1c465e1a5c014c03f8034b18a72ffdb9ac3775', [additional.keys().next().value]],
  ['F:/VisibleMedicine/staging/20261030-pallidal-mri-contract/content/body-review-display-pins.json', '4301c0660c7284851774f98e2a9dc47c2057e56b4fbda78f3836852423688854', [...additional.keys()].slice(1)],
]) {
  const report = JSON.parse(read(file, digest));
  for (const id of ids) { const pin = report.pins.find(p => p.structureId === id); assert(pin); exactChangedPins.push(pin); }
}
let pinDeltaMatches = false, pinFailure = null;
try { verifyDisplayPinDelta({ baseline: baselinePins, actual: actualPins, changedStructureIds: changed.map(r => r.structureId), exactChangedPins }); pinDeltaMatches = true; }
catch (error) { pinFailure = String(error.message).slice(0, 400); }
for (const [file, digest] of inputs) assert.equal(sha(fs.readFileSync(file)), digest, 'Input changed before report: ' + file);
const result = {
  schema: 'vm-native-successor-delta-check/1', at: new Date().toISOString(),
  candidate: atlas, sourcePreparation: { path: stage + '/PREPARATION.json', sha256: inputs.get(stage + '/PREPARATION.json') },
  expectedStructures: 1104, expectedLessons: lessonCount, expectedChangedTopics: changed,
  expectedUnchangedLessons: lessonCount - changed.length, expectedChangedWorksheets: changed.length,
  exactExpectedPinValues: exactChangedPins.length, regions, pinDeltaMatches, pinFailure,
  generatedLessonsMatch: regions.every(r => r.actualMatches),
  sourceInputs: [...inputs].map(([path, sha256]) => ({ path, sha256 })),
  limits: [
    'Expectations come from exact parent snapshots, source-bound authored helpers and saved proposal comparisons. This does not run the full resolver.',
    'Pin check verifies exact values for three prior imaging contracts and exact changed-ID membership for 41 quizzes. Full quiz worksheet preimages still require stock generation/checking.',
    'No candidate files are written, no clinical readiness is promoted, and no complete build or installation is claimed.',
  ], candidateFilesWritten: false, fullBuildPassed: false, installed: false, clinicalApproval: false,
};
const output = root + '/RESULT-' + Date.now() + '.json';
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, sourceInputs: inputs.size, expectedChangedTopics: changed.length, expectedUnchangedLessons: result.expectedUnchangedLessons, generatedLessonsMatch: result.generatedLessonsMatch, pinDeltaMatches }));
if (process.argv[2] === '--check') assert(result.generatedLessonsMatch && pinDeltaMatches, 'Regeneration is absent, stale or outside the expected delta');
