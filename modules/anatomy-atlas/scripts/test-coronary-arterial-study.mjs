import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const baseline = '12570b5245dc6a253cbdd73ec4e044c58b81a927';
const targetFmas = ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895'];
const allFmas = [...targetFmas, 'FMA7088'];
const baselineRaw = JSON.parse(execFileSync('git', [
  'show', `${baseline}:public/models/bodyparts3d/full-body/catalog.json`,
], { encoding: 'utf8', maxBuffer: 16_000_000 }));
const compiled = await build({
  stdin: {
    contents: "export { bodyDisplayCatalog } from './lib/body-display-catalog'; export * from './lib/coronary-arterial-study';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope, exports: scope.exports, require, structuredClone,
});
const api = scope.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const same = (actual, expected, label) => assert.deepEqual(plain(actual), plain(expected), label);
const snapshot = fma => {
  const matches = baselineRaw.structures.filter(item => item.fmaId === fma);
  assert.equal(matches.length, 1, `baseline has one ${fma}`);
  return matches[0];
};
const expectedTargets = targetFmas.map(snapshot), expectedHeart = snapshot('FMA7088');
const expected = [...expectedTargets, expectedHeart];
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const original = JSON.stringify(catalog);
const study = api.coronaryArterialStudyFor(catalog);
assert(study, 'complete canonical catalog admits the coronary arterial study');
assert.equal(api.coronaryArterialStudyId, 'coronary-arterial-surfaces');
same(Object.keys(api.coronaryArterialStudyCopy).sort(), ['description', 'inspect', 'references', 'title']);
same(study.copy, api.coronaryArterialStudyCopy);
same(study.targets, expectedTargets, 'complete target record equality, including metadata and source order');
same(study.context, [expectedHeart], 'complete heart context equality');
same(study.targets.map(item => item.fmaId), targetFmas);
same(study.context.map(item => item.fmaId), ['FMA7088']);
assert.equal(new Set(expected.map(item => item.id)).size, 5);
const files = expected.flatMap(item => item.sources.map(source => source.file));
assert.equal(new Set(files).size, files.length, 'target and heart source files are disjoint');
const bundleIds = [...new Set(expected.map(item => item.bundle))];
const expectedBundles = bundleIds.map(id => {
  const matches = baselineRaw.bundles.filter(bundle => bundle.id === id);
  assert.equal(matches.length, 1, `one baseline bundle ${id}`);
  return matches[0];
});
same(study.bundles, expectedBundles, 'complete baseline bundle equality');
same(api.coronaryArterialStudyFor(catalog, expected), study, 'five-record scope admits the study');
for (const missing of expected) {
  assert.equal(api.coronaryArterialStudyFor(catalog, expected.filter(item => item.id !== missing.id)), null,
    `scope requires ${missing.fmaId}`);
}
for (const side of ['left', 'right']) {
  assert.equal(api.coronaryArterialStudyFor(catalog, expected.filter(item =>
    item.laterality === side || item.laterality === 'unpaired')), null, `${side} side is incomplete`);
}
same(catalog.coordinateSystem, baselineRaw.coordinateSystem, 'source frame');
same(catalog.license, baselineRaw.license, 'source licence');
same(catalog.credit, baselineRaw.credit, 'source credit');
for (const bundle of expectedBundles) {
  const bytes = await readFile('public' + new URL(bundle.url, 'https://atlas.invalid').pathname);
  assert.equal(bytes.length, bundle.bytes, `${bundle.id} bytes`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256, `${bundle.id} hash`);
}
const returned = api.coronaryArterialStudyFor(catalog);
assert.notStrictEqual(returned.targets[0], catalog.structures.find(item => item.id === returned.targets[0].id));
assert.notStrictEqual(returned.context[0], catalog.structures.find(item => item.id === returned.context[0].id));
assert.notStrictEqual(returned.bundles[0], catalog.bundles.find(item => item.id === returned.bundles[0].id));
if (!Object.isFrozen(returned.targets[0].sources[0])) returned.targets[0].sources[0].sha256 = '0'.repeat(64);
if (!Object.isFrozen(returned.context[0].bounds.min)) returned.context[0].bounds.min[0] += 1;
if (!Object.isFrozen(returned.bundles[0])) returned.bundles[0].sha256 = '0'.repeat(64);
if (!Object.isFrozen(returned.copy)) returned.copy.title = 'caller mutation';
same(api.coronaryArterialStudyFor(catalog), study, 'result is detached from subsequent calls');
assert.equal(JSON.stringify(catalog), original, 'result mutation leaves input catalog intact');

let rejected = 0;
function rejects(label, mutate) {
  const altered = structuredClone(catalog);
  mutate(altered);
  assert.equal(api.coronaryArterialStudyFor(altered), null, label);
  rejected++;
}
for (const canonical of expected) {
  const byFma = c => c.structures.find(item => item.fmaId === canonical.fmaId);
  rejects(`${canonical.fmaId} missing`, c => { c.structures = c.structures.filter(item => item.id !== canonical.id); });
  rejects(`${canonical.fmaId} duplicate id`, c => { c.structures.push(structuredClone(byFma(c))); });
  rejects(`${canonical.fmaId} duplicate FMA`, c => {
    const duplicate = structuredClone(byFma(c)); duplicate.id += ':duplicate'; c.structures.push(duplicate);
  });
  rejects(`${canonical.fmaId} id drift`, c => { byFma(c).id += ':changed'; });
  rejects(`${canonical.fmaId} source checksum drift`, c => { byFma(c).sources[0].sha256 = '0'.repeat(64); });
  rejects(`${canonical.fmaId} source file drift`, c => { byFma(c).sources[0].file = 'FJ0000'; });
  rejects(`${canonical.fmaId} source order drift`, c => {
    const s = byFma(c); if (s.sources.length > 1) s.sources.reverse(); else s.sources.push(structuredClone(s.sources[0]));
  });
  rejects(`${canonical.fmaId} bounds drift`, c => { byFma(c).bounds.min[0] += 0.01; });
  rejects(`${canonical.fmaId} validation drift`, c => { byFma(c).validation.anatomicalReview = !byFma(c).validation.anatomicalReview; });
  rejects(`${canonical.fmaId} metadata drift`, c => { byFma(c).name += ' changed'; });
}
for (const bundle of expectedBundles) {
  rejects(`${bundle.id} hash drift`, c => { c.bundles.find(b => b.id === bundle.id).sha256 = '0'.repeat(64); });
  rejects(`${bundle.id} bytes drift`, c => { c.bundles.find(b => b.id === bundle.id).bytes++; });
  rejects(`${bundle.id} duplicate`, c => { c.bundles.push(structuredClone(bundle)); });
  rejects(`${bundle.id} missing`, c => { c.bundles = c.bundles.filter(b => b.id !== bundle.id); });
}
rejects('coordinate frame drift', c => { c.coordinateSystem.unitsPerMillimetre = 2; });
rejects('licence drift', c => { c.license = 'changed'; });
rejects('credit drift', c => { c.credit = 'changed'; });
rejects('cross-record file overlap', c => { c.structures.find(s => s.fmaId === 'FMA3802').sources[0].file = expectedHeart.sources[0].file; });
same(api.coronaryArterialScenePlan(catalog, {
  region: 'thorax', focusId: api.coronaryArterialStudyId,
  exam: false, explode: 0, visibleIds: expected.map(item => item.id), scope: expected,
}).active, true, 'zero-separation thorax plan active');
const allIds = expected.map(item => item.id);
for (const region of ['thorax', 'whole-body']) {
  const base = { region, focusId: api.coronaryArterialStudyId, exam: false, visibleIds: allIds, scope: expected };
  const assembled = api.coronaryArterialScenePlan(catalog, { ...base, explode: 0 });
  assert.equal(assembled.active, true);
  same(assembled.contextIds, [expectedHeart.id]);
  assert.equal(assembled.appearance[expectedHeart.id].opacity, 0.2);
  assert(assembled.omitIds.every(id => !targetFmas.some(fma => snapshot(fma).id === id)));
  const separated = api.coronaryArterialScenePlan(catalog, { ...base, explode: 35 });
  assert.equal(separated.active, true);
  same(separated.contextIds, []);
  assert(separated.omitIds.includes(expectedHeart.id));
  assert(!Object.hasOwn(separated.appearance, expectedHeart.id));
  const reassembled = api.coronaryArterialScenePlan(catalog, { ...base, explode: 0 });
  same(reassembled, assembled, `${region} returns context exactly`);
  for (const visibleIds of [allIds.filter(id => id !== expectedHeart.id)]) {
    const hidden = api.coronaryArterialScenePlan(catalog, { ...base, explode: 0, visibleIds });
    assert(!hidden.contextIds.includes(expectedHeart.id), 'hidden heart cannot become context');
  }
  for (const explode of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.equal(api.coronaryArterialScenePlan(catalog, { ...base, explode }).active, false, `reject ${explode}`);
  }
  for (const focusId of [null, expectedTargets[0].id, 'other-focus'])
    assert.equal(api.coronaryArterialScenePlan(catalog, { ...base, explode: 0, focusId }).active, false);
  assert.equal(api.coronaryArterialScenePlan(catalog, { ...base, explode: 0, exam: true }).active, false);
}
for (const region of ['abdomen', 'pelvis', 'head-neck'])
  assert.equal(api.coronaryArterialScenePlan(catalog, {
    region, focusId: api.coronaryArterialStudyId, exam: false, explode: 0, visibleIds: allIds, scope: expected,
  }).active, false);
assert.equal(JSON.stringify(catalog), original, 'scene planning leaves catalog intact');
console.log(JSON.stringify({ passed: true, baseline, targets: targetFmas.length, context: 1,
  bundles: expectedBundles.length, rejectionCases: rejected, scenePlan: true, clinicalApproval: false }));
