import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { verifyTeachingDelta, verifyDisplayPinDelta } from '../20261029-native-teaching-delta/delta-core.mjs';

// Read-only generated-output comparison. Never uses the candidate's generated rows as expectations.
assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'));
const root = 'G:/VisibleMedicine-temp/staging/20261029-complete-selfchecks-recipes';
const stage = 'G:/VisibleMedicine-temp/staging/20261029-complete-selfchecks-native';
const parentPath = 'F:/VisibleMedicine/recovery/checkpoints/20261029-native-generation-verified/SOURCE_AFTER_GENERATION.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = new Map();
function read(file, expected) {
  const bytes = fs.readFileSync(file), digest = sha(bytes);
  if (expected) assert.equal(digest, expected, file);
  if (inputs.has(file)) assert.equal(digest, inputs.get(file), 'Input changed during check: ' + file);
  inputs.set(file, digest);
  return bytes;
}
read(root + '/check-delta.mjs');
read('G:/VisibleMedicine-temp/staging/20261029-native-teaching-delta/delta-core.mjs',
  '91cee06110daab7f9cc21d8e18e9e8a7bc0b50c1b360ecc4bc2f7cf66cec0423');
const prep = JSON.parse(read(stage + '/PREPARATION.json', 'a40692560132b21e2de821f44de3b939631d03f39d60d8b28ddbaa58f5c83e2b'));
assert.equal(prep.schema, 'vm-complete-selfchecks-native/1');
assert.equal(prep.atlas, stage + '/atlas');
assert.equal(prep.parent.path, 'G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-native/PREPARATION.json');
assert.equal(prep.comparisonParent.path, parentPath);
assert.equal(prep.comparisonParent.sha256, 'acebaab2382fec27f5af122496be6b13372e7dca6d58c5e96a5f581765297a75');
assert.equal(prep.changes.length, 14);
assert.equal(prep.sourceRows.length, 6498);
const immediateParent = JSON.parse(read(prep.parent.path, prep.parent.sha256));
assert.equal(immediateParent.atlas, 'G:/VisibleMedicine-temp/staging/20261029-integrated-quiz-native/atlas');
assert.equal(immediateParent.sourceRows.length, 6490);
assert.equal(immediateParent.parent.path, parentPath);
assert.equal(immediateParent.parent.sha256, prep.comparisonParent.sha256);
assert.equal(immediateParent.changes.length, 9);
const parent = JSON.parse(read(parentPath, prep.comparisonParent.sha256));
assert.equal(parent.atlas, 'G:/VisibleMedicine-temp/staging/20261029-combined-native-successor/atlas');
assert.equal(parent.parentHead, prep.parentHead);
const parentRows = new Map(parent.sourceRows.map(row => [row.path, row.sha256]));
const sourceRows = new Map(prep.sourceRows.map(row => [row.path, row.sha256]));
assert.equal(parentRows.size, parent.sourceRows.length);
assert.equal(sourceRows.size, prep.sourceRows.length);
const immediateRows = new Map(immediateParent.sourceRows.map(row => [row.path, row.sha256]));
assert.equal(immediateRows.size, immediateParent.sourceRows.length);
assert.equal(prep.changes.length, [...sourceRows].filter(([file,digest]) => immediateRows.get(file) !== digest).length);
assert.deepEqual(prep.changes.map(row=>row.path).sort(),
  [...sourceRows].filter(([file,digest]) => immediateRows.get(file) !== digest).map(([file])=>file).sort(),
  'Preparation changes must be the entire immediate-parent source delta');
const atlas = prep.atlas;
for (const change of prep.changes) {
  assert.equal(sourceRows.get(change.path), change.sha256);
  read(atlas + '/' + change.path, change.sha256);
}
const requireSource = createRequire(atlas + '/package.json');
const dependencyReceipt = JSON.parse(read('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json',
  'cbda14f0489c2c66474f1d8b47b7171aab52130ca68749fe78219773cf650f56'));
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
  const bytes = read(atlas + '/' + relative, sourceRows.get(relative));
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
const quizHelpers = [
  ['lib/limbic-landmarks.ts', 'limbicLandmarkLesson'],
  ['lib/pelvic-veins.ts', 'pelvicVeinLesson'],
  ['lib/corpus-spongiosum.ts', 'corpusSpongiosumLesson'],
  ['lib/circumflex-femoral.ts', 'circumflexFemoralLesson'],
  ['lib/anterior-cardiac-vein.ts', 'anteriorCardiacVeinLesson'],
  ['lib/foot-sesamoid-teaching.ts', 'footSesamoidLesson'],
].map(([file, name]) => {
  const fn = load(file)[name];
  assert.equal(typeof fn, 'function', 'Missing bound quiz helper: ' + file);
  return { file, fn };
});
for (const relative of ['lib/body-source-additions.ts', 'lib/content-types.ts', 'lib/regional-teaching-snapshot.ts',
  'public/models/bodyparts3d/limbic-landmarks/catalog.json', 'content/limbic-landmark-study.ts',
  'public/models/bodyparts3d/pelvic-veins/catalog.json',
  'public/models/bodyparts3d/corpus-spongiosum/catalog.json',
  'public/models/bodyparts3d/circumflex-femoral/catalog.json',
  'public/models/bodyparts3d/anterior-cardiac-vein/catalog.json',
  'content/foot-sesamoid-teaching-pins.json'])
  assert.equal(sourceRows.get(relative), parentRows.get(relative), 'Baseline decoder/catalog changed: ' + relative);
const snapshotPaths = [...parentRows.keys()].filter(p => p.startsWith('content/regional-teaching/') && p.endsWith('.json')).sort();
assert.equal(snapshotPaths.length, 11);
assert.deepEqual(fs.readdirSync(atlas + '/content/regional-teaching').sort(), snapshotPaths.map(p => path.posix.basename(p)));
const regions = [], changes = [], seen = new Set();
let lessonCount = 0, selectionCount = 0;
for (const relative of snapshotPaths) {
  const before = JSON.parse(read(parent.atlas + '/' + relative, parentRows.get(relative)));
  const actual = JSON.parse(read(atlas + '/' + relative));
  const oldReader = decodeRegionalTeachingSnapshot(before, before.region);
  const expectedRows = [];
  for (const entry of before.entries) {
    assert(!seen.has(entry.identity), 'Duplicate global source identity');
    seen.add(entry.identity); selectionCount++;
    const structure = JSON.parse(entry.identity);
    assert.equal(sourceCanonical(structure), entry.identity);
    for (const topic of contentTabs) {
      const old = structuredClone(oldReader.bodyLesson(structure, topic));
      let lesson = old;
      if (topic === 'quiz') {
        const authored = quizHelpers.map(({file,fn})=>({file,lesson:fn(structure,topic)}))
          .filter(row=>row.lesson!==undefined);
        assert(authored.length<=1, 'Overlapping quiz helpers for ' + structure.id);
        if (authored.length) {
          lesson = structuredClone(authored[0].lesson);
          assert.notDeepEqual(lesson, old, 'Expected bound quiz must actually change');
          assert.equal(lesson.readiness, old.readiness, 'No readiness promotion');
          assert.equal(lesson.bullets.length, 4, 'Four answer choices required');
          assert.equal(new Set(lesson.bullets).size, 4, 'Answer choices must be distinct');
          assert(lesson.bullets.every(value=>typeof value==='string'&&value.trim()), 'Empty answer choice');
          assert.equal(lesson.bullets.filter(value => value === lesson.correctAnswer).length, 1);
          assert(typeof lesson.explanation==='string'&&lesson.explanation.trim(), 'Explanation required');
          assert(Array.isArray(lesson.citations)&&lesson.citations.length>0, 'Citations required');
          changes.push({ region: before.region, structureId: structure.id, identitySha256: sha(entry.identity),
            topic, helper: authored[0].file });
        }
      }
      expectedRows.push({ region: before.region, identity: entry.identity, topic, lesson });
    }
  }
  lessonCount += expectedRows.length;
  let actualMatches = false, failure = null;
  try {
    assert.equal(actual.schemaVersion, before.schemaVersion);
    assert.equal(actual.region, before.region);
    assert.deepEqual(Object.keys(actual), Object.keys(before), 'Snapshot top-level field/order changed');
    assert.equal(actual.entries.length, before.entries.length);
    assert.deepEqual(actual.entries.map(entry=>Object.keys(entry)),before.entries.map(entry=>Object.keys(entry)),
      'Snapshot entry field/order changed');
    assert.deepEqual(actual.entries.map(entry=>entry.identity),before.entries.map(entry=>entry.identity),
      'Snapshot identities or order changed');
    const reader = decodeRegionalTeachingSnapshot(actual, before.region);
    const actualRows = actual.entries.flatMap(entry => contentTabs.map(topic => ({
      region: actual.region, identity: entry.identity, topic,
      lesson: structuredClone(reader.bodyLesson(JSON.parse(entry.identity), topic)),
    })));
    verifyTeachingDelta(expectedRows, actualRows);
    assert.deepEqual(actual.undefinedPaths, before.undefinedPaths, 'Optional undefined paths changed');
    actualMatches = true;
  } catch (error) { failure = String(error.message).slice(0, 400); }
  regions.push({ file: relative, expectedLessons: expectedRows.length, actualSha256: inputs.get(atlas + '/' + relative), actualMatches, failure });
}
assert.equal(selectionCount, 1104);
assert.equal(lessonCount, 9936);
assert.equal(changes.length, 20);
assert.equal(new Set(changes.map(row => row.structureId)).size, 20);
const helperCounts = Object.fromEntries(quizHelpers.map(({file})=>[file,changes.filter(row=>row.helper===file).length]));
assert.deepEqual(helperCounts, {
  'lib/limbic-landmarks.ts':4, 'lib/pelvic-veins.ts':10, 'lib/corpus-spongiosum.ts':1,
  'lib/circumflex-femoral.ts':2, 'lib/anterior-cardiac-vein.ts':1, 'lib/foot-sesamoid-teaching.ts':2,
});
assert.equal(changes.filter(row => row.region === 'head-neck' && row.topic === 'quiz').length, 4);
const pinPath = 'content/body-review-display-pins.json';
const baselinePins = JSON.parse(read(parent.atlas + '/' + pinPath, parentRows.get(pinPath)));
const actualPins = JSON.parse(read(atlas + '/' + pinPath));
let pinDeltaMatches = false, pinFailure = null;
try {
  verifyDisplayPinDelta({ baseline: baselinePins, actual: actualPins, changedStructureIds: changes.map(row => row.structureId) });
  pinDeltaMatches = true;
} catch (error) { pinFailure = String(error.message).slice(0, 400); }
for (const [file, digest] of inputs) assert.equal(sha(fs.readFileSync(file)), digest, 'Input changed before report: ' + file);
const result = {
  schema: 'vm-complete-selfchecks-delta-check/1', at: new Date().toISOString(), candidate: atlas,
  sourcePreparation: { path: stage + '/PREPARATION.json', sha256: inputs.get(stage + '/PREPARATION.json') },
  parent: { path: parentPath, sha256: inputs.get(parentPath) },
  selections: selectionCount, lessons: lessonCount, expectedChangedTopics: changes,
  expectedUnchangedLessons: lessonCount - changes.length, expectedChangedWorksheets: changes.length,
  regions, generatedLessonsMatch: regions.every(row => row.actualMatches), pinDeltaMatches, pinFailure,
  sourceInputs: [...inputs].map(([path, sha256]) => ({ path, sha256 })),
  limits: [
    'Expectations derive from exact post-generation parent snapshots and six source-bound quiz helpers; this does not run the full resolver.',
    'Display pin comparison checks metadata, identity/order, and exactly twenty changed hashes. Exact new quiz pin values require the separate stock preimage check.',
    'No full build, installation, radiologist sign-off, or patient-space registration is established.',
  ], candidateFilesWritten: false, fullBuildPassed: false, installed: false, clinicalApproval: false,
};
const output = root + '/RESULT-' + Date.now() + '.json';
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, sourceInputs: inputs.size, expectedChangedTopics: changes.length,
  expectedUnchangedLessons: result.expectedUnchangedLessons, generatedLessonsMatch: result.generatedLessonsMatch, pinDeltaMatches }));
if (process.argv[2] === '--check') assert(result.generatedLessonsMatch && pinDeltaMatches,
  'Regeneration is absent, stale, or outside the expected twenty-quiz delta');
