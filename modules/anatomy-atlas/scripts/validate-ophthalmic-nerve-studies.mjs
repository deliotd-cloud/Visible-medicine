import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { preOphthalmicNerveProfiles } from './ophthalmic-nerve-study-history.mjs';

const compiled = await build({
  stdin: { contents: `export { dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection } from './app/dissection-data';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { ophthalmicNerveStudies, ophthalmicNerveTargetBindings, ophthalmicNerveContextBindings } from './content/ophthalmic-nerve-studies';`,
    resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { dissectionProfiles, stageStructures, initialDissection, dissectionReducer,
  resolveDissection, bodyDisplayCatalog, ophthalmicNerveStudies,
  ophthalmicNerveTargetBindings, ophthalmicNerveContextBindings } =
  await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const previous = preOphthalmicNerveProfiles(dissectionProfiles);
for (const region of ['head-neck', 'whole-body'])
  assert(!previous[region].focuses.some(focus => focus.id.startsWith('v1-')));
const alteredHistory = structuredClone(dissectionProfiles);
alteredHistory['head-neck'].focuses.find(focus => focus.id === 'v1-nasociliary-subset').title += ' changed';
assert.throws(() => preOphthalmicNerveProfiles(alteredHistory), /Unrecorded V1 recipe edit/);
const allBindings = [...ophthalmicNerveTargetBindings, ...ophthalmicNerveContextBindings];
assert.equal(ophthalmicNerveTargetBindings.length, 20);
assert.equal(ophthalmicNerveContextBindings.length, 4);
assert.equal(new Set(allBindings.map(binding => binding.fmaId)).size, allBindings.length);
assert.deepEqual(ophthalmicNerveTargetBindings.slice(2, 4).map(binding => binding.fmaId),
  ['FMA52656', 'FMA52657']);
assert.deepEqual(ophthalmicNerveStudies[0].targetFmaIds,
  ophthalmicNerveTargetBindings.slice(0, 8).map(binding => binding.fmaId));
for (const binding of allBindings) {
  const matches = catalog.structures.filter(structure => structure.id === binding.id || structure.fmaId === binding.fmaId);
  assert.equal(matches.length, 1, `Unique admitted source ${binding.fmaId}`);
  const source = matches[0];
  assert.deepEqual({ id: source.id, fmaId: source.fmaId, laterality: source.laterality,
    bundle: source.bundle, nodeName: source.nodeName, sources: source.sources }, binding);
  assert.equal(source.provenance.license, 'CC-BY-4.0');
  assert.equal(source.validation.anatomicalReview, false);
}
const byId = (a, b) => a.localeCompare(b);
for (const region of ['head-neck', 'whole-body']) {
  const profile = dissectionProfiles[region];
  assert.deepEqual(profile.focuses.filter(focus => focus.id.startsWith('v1-')).map(focus => focus.id), ophthalmicNerveStudies.map(study => study.id));
  for (const study of ophthalmicNerveStudies) {
    const focus = profile.focuses.find(candidate => candidate.id === study.id);
    assert.equal(focus.includeSkeleton, false);
    assert.equal(focus.sideFilteredSourceBindings, true);
    assert.deepEqual(focus.rule.fmaIds, study.targetFmaIds);
    assert.deepEqual(focus.context, [{ fmaIds: study.contextFmaIds }]);
    assert.deepEqual(focus.requiredSourceBindings.map(binding => binding.fmaId).sort(byId),
      [...study.targetFmaIds, ...study.contextFmaIds].sort(byId));
    for (const term of ['Remove', 'Undo', 'branch continuity', 'patient registration', 'radiologist review'])
      assert(focus.inspect.includes(term));
    for (const side of ['both', 'left', 'right']) {
      const scope = catalog.structures.filter(structure =>
        (region === 'whole-body' || structure.regions.includes(region)) &&
        (side === 'both' || structure.laterality === side || ['midline', 'unpaired', 'unspecified'].includes(structure.laterality)));
      const visible = stageStructures(scope, profile, 'assembled', study.id);
      const wanted = [...study.targetFmaIds, ...study.contextFmaIds].filter(fmaId =>
        side === 'both' || allBindings.find(binding => binding.fmaId === fmaId).laterality === side);
      assert.deepEqual(visible.map(structure => structure.fmaId).sort(byId), wanted.sort(byId));
      for (const binding of focus.requiredSourceBindings) {
        if (side !== 'both' && binding.laterality !== side) continue;
        const source = scope.find(structure => structure.fmaId === binding.fmaId);
        assert(source);
        assert.deepEqual(stageStructures(scope.filter(structure => structure !== source), profile, 'assembled', study.id), []);
        assert.deepEqual(stageStructures([...scope, structuredClone(source)], profile, 'assembled', study.id), []);
        for (const changed of [
          { sources: [{ ...source.sources[0], sha256: '0'.repeat(64) }] },
          { bundle: 'unrecorded-bundle' }, { nodeName: 'unrecorded-node' },
        ]) {
          const altered = scope.map(structure => structure === source ? { ...structure, ...changed } : structure);
          assert.deepEqual(stageStructures(altered, profile, 'assembled', study.id), []);
        }
      }
      let state = dissectionReducer(initialDissection, { type: 'focus', id: study.id });
      const before = resolveDissection(scope, profile, state).visible.map(structure => structure.id);
      state = dissectionReducer(state, { type: 'remove', id: visible[0].id });
      assert(!resolveDissection(scope, profile, state).visible.some(structure => structure.id === visible[0].id));
      state = dissectionReducer(state, { type: 'undo' });
      assert.deepEqual(resolveDissection(scope, profile, state).visible.map(structure => structure.id), before);
    }
  }
}
console.log(JSON.stringify({ passed: true, exactSources: allBindings.length, focuses: 2,
  regions: 2, sideScopes: 12, clinicalApproval: false }));
