import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {test} from 'node:test';
import vm from 'node:vm';
import {adrenalUltrasoundIds, adrenalUltrasoundReferenceKeys, nestedBeforeAdrenalUltrasound} from './adrenal-ultrasound-history.mjs';

const baselineRoot = process.env.VM_ADRENAL_BASELINE_ROOT ||
  'G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance-ready/atlas';
const candidateRoot = process.env.VM_ADRENAL_CANDIDATE_ROOT ||
  'G:/VisibleMedicine-temp/proposals/20261031-adrenal-ultrasound-commercial/atlas';
const require = createRequire(join(baselineRoot, 'package.json'));
const ts = require('typescript');
const clone = value => structuredClone(value);
const sha256 = source => createHash('sha256').update(source).digest('hex');
const pins = {
  baseline: '7512d9ce196363f9349e6740fd4a0fad9122f3677e468dfa9a411423ff5c8163',
  candidate: '3d9bb0cc120ee240b0d08128429bead7743ee04abc6225dc01f6749083d00e4e',
};
function loadRenal(root, pin) {
  const source = readFileSync(join(root, 'content/renal-teaching.ts'), 'utf8');
  assert.equal(sha256(source), pin, `Source pin changed: ${root}`);
  const js = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  }).outputText;
  const exports = {};
  vm.runInNewContext(js, {exports}, {filename: join(root, 'content/renal-teaching.ts')});
  return clone({concepts: exports.renalConcepts, references: exports.renalTeachingReferences});
}
const before = loadRenal(baselineRoot, pins.baseline);
const after = loadRenal(candidateRoot, pins.candidate);
const makeApi = renal => ({
  nestedConcepts: clone(renal.concepts),
  nestedTeachingReferences: clone(renal.references),
  unrelatedState: {retained: true},
});

test('source projection pins exactly the intended two concepts and two new references', () => {
  assert.deepEqual(adrenalUltrasoundIds, [
    'renal-inferior-suprarenal-artery', 'renal-suprarenal-veins',
  ]);
  assert.deepEqual(adrenalUltrasoundReferenceKeys, [
    'renalFetalAdrenalDoppler', 'renalAdrenalVeinLaparoscopicUltrasound',
  ]);
  assert.deepEqual(before.concepts.map(c => c.id), after.concepts.map(c => c.id));
  assert.deepEqual(Object.keys(before.references),
    Object.keys(after.references).filter(key => !adrenalUltrasoundReferenceKeys.includes(key)));
  assert.deepEqual(after.references.renalReuseLicense, before.references.renalReuseLicense);
});

test('fully old state is identity', () => {
  const api = makeApi(before);
  assert.equal(nestedBeforeAdrenalUltrasound(api), api);
});

test('fully new state reconstructs the complete pinned renal predecessor without mutation', () => {
  const api = makeApi(after), snapshot = clone(api);
  const predecessor = nestedBeforeAdrenalUltrasound(api);
  assert.notEqual(predecessor, api);
  assert.deepEqual(predecessor.nestedConcepts, before.concepts);
  assert.deepEqual(predecessor.nestedTeachingReferences, before.references);
  assert.deepEqual(predecessor.unrelatedState, api.unrelatedState);
  assert.notEqual(predecessor.nestedConcepts, api.nestedConcepts);
  assert.deepEqual(api, snapshot);
});

test('unrelated future additions remain in the cloned predecessor', () => {
  const api = makeApi(after);
  api.nestedConcepts.push({id: 'later-independent-concept', study: 'other', fmaIds: [], imaging: {ultrasound: {body: 'later'}}});
  api.nestedConcepts[0].futureField = {kept: true};
  api.nestedTeachingReferences.laterIndependentReference = {title: 'later', url: 'https://example.invalid'};
  const predecessor = nestedBeforeAdrenalUltrasound(api);
  assert.deepEqual(predecessor.nestedConcepts.at(-1), api.nestedConcepts.at(-1));
  assert.deepEqual(predecessor.nestedConcepts[0].futureField, {kept: true});
  assert.deepEqual(predecessor.nestedTeachingReferences.laterIndependentReference,
    api.nestedTeachingReferences.laterIndependentReference);
});

const mutations = [
  ['missing artery section', api => {delete api.nestedConcepts[1].imaging.ultrasound;}],
  ['missing vein section', api => {delete api.nestedConcepts[3].imaging.ultrasound;}],
  ['missing fetal reference', api => {delete api.nestedTeachingReferences.renalFetalAdrenalDoppler;}],
  ['missing venous reference', api => {delete api.nestedTeachingReferences.renalAdrenalVeinLaparoscopicUltrasound;}],
  ['body', api => {api.nestedConcepts[1].imaging.ultrasound.body += ' altered';}],
  ['readiness', api => {api.nestedConcepts[3].imaging.ultrasound.readiness = 'approved';}],
  ['section references', api => {api.nestedConcepts[1].imaging.ultrasound.references.pop();}],
  ['extra section key', api => {api.nestedConcepts[3].imaging.ultrasound.extra = true;}],
  ['reference title', api => {api.nestedTeachingReferences.renalFetalAdrenalDoppler.title += ' changed';}],
  ['reference URL', api => {api.nestedTeachingReferences.renalAdrenalVeinLaparoscopicUltrasound.url = 'https://example.invalid';}],
  ['reference scope', api => {api.nestedTeachingReferences.renalFetalAdrenalDoppler.scopedToConcept = false;}],
  ['FMA', api => {api.nestedConcepts[1].fmaIds = ['FMA0'];}],
  ['study', api => {api.nestedConcepts[3].study = 'other';}],
  ['section keys', api => {delete api.nestedConcepts[1].sections.clinical;}],
  ['predecessor imaging', api => {delete api.nestedConcepts[3].imaging.ct;}],
  ['duplicate ID', api => {api.nestedConcepts.push(clone(api.nestedConcepts[1]));}],
  ['reused licence', api => {api.nestedTeachingReferences.renalReuseLicense.title += ' changed';}],
];
for (const [name, mutate] of mutations) {
  test(`rejects ${name}`, () => {
    const api = makeApi(after);
    mutate(api);
    assert.throws(() => nestedBeforeAdrenalUltrasound(api));
  });
}
test('rejects an incomplete old state with one new reference', () => {
  const api = makeApi(before);
  api.nestedTeachingReferences.renalFetalAdrenalDoppler = clone(after.references.renalFetalAdrenalDoppler);
  assert.throws(() => nestedBeforeAdrenalUltrasound(api));
});
