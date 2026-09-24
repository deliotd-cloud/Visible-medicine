import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { preInfrahyoidLayerProfiles } from './infrahyoid-layer-study-history.mjs';

const compiled = await build({
  stdin: {
    contents: `export { dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection } from './app/dissection-data';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { infrahyoidMuscleBindings, infrahyoidContextBindings, infrahyoidLayerStudies } from './content/infrahyoid-layer-study';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const {
  dissectionProfiles, stageStructures, initialDissection, dissectionReducer,
  resolveDissection, bodyDisplayCatalog, infrahyoidMuscleBindings,
  infrahyoidContextBindings, infrahyoidLayerStudies,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const catalog = bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const allBindings = [...infrahyoidMuscleBindings, ...infrahyoidContextBindings];
assert.equal(allBindings.length, 10);
assert.equal(new Set(allBindings.map((binding) => binding.fmaId)).size, 10);
assert.deepEqual(infrahyoidLayerStudies.map((study) => study.id),
  ['infrahyoid-superficial-pair', 'infrahyoid-deep-pair']);
for (const binding of allBindings) {
  const matches = catalog.structures.filter((structure) => structure.fmaId === binding.fmaId);
  assert.equal(matches.length, 1, `Unique source ${binding.fmaId}`);
  const source = matches[0];
  assert.deepEqual({
    id: source.id, fmaId: source.fmaId, laterality: source.laterality,
    bundle: source.bundle, nodeName: source.nodeName, sources: source.sources,
  }, binding);
  assert.equal(source.provenance.license, 'CC-BY-4.0');
  assert.equal(source.validation.anatomicalReview, false);
}

for (const region of ['head-neck', 'whole-body']) {
  const profile = dissectionProfiles[region];
  const expectedIds = infrahyoidLayerStudies.map((study) => study.id);
  assert.deepEqual(profile.focuses.filter((focus) => expectedIds.includes(focus.id)).map((focus) => focus.id), expectedIds);
  for (const study of infrahyoidLayerStudies) {
    const focus = profile.focuses.find((candidate) => candidate.id === study.id);
    assert(focus);
    assert.equal(focus.includeSkeleton, false);
    assert.equal(focus.sideFilteredSourceBindings, true);
    assert.deepEqual(focus.rule.fmaIds, study.targetFmaIds);
    assert.deepEqual(focus.context, [{ fmaIds: study.contextFmaIds }]);
    assert.equal(focus.requiredSourceBindings.length, 6);
    for (const term of ['fascia plane', 'swallowing', 'patient-image registration', 'radiologist review'])
      assert(focus.inspect.includes(term));
    for (const side of ['both', 'left', 'right']) {
      const scope = catalog.structures.filter((structure) =>
        (region === 'whole-body' || structure.regions.includes(region)) &&
        (side === 'both' || structure.laterality === side || ['midline', 'unpaired', 'unspecified'].includes(structure.laterality)));
      const visible = stageStructures(scope, profile, 'assembled', study.id);
      const wanted = [...study.targetFmaIds, ...study.contextFmaIds].filter((fmaId) => {
        const binding = allBindings.find((candidate) => candidate.fmaId === fmaId);
        return side === 'both' || !['left', 'right'].includes(binding.laterality) || binding.laterality === side;
      });
      const byId = (a, b) => a.localeCompare(b);
      assert.deepEqual(visible.map((structure) => structure.fmaId).sort(byId), wanted.sort(byId));
      for (const binding of focus.requiredSourceBindings) {
        if (side !== 'both' && ['left', 'right'].includes(binding.laterality) && binding.laterality !== side) continue;
        const source = scope.find((structure) => structure.fmaId === binding.fmaId);
        assert(source);
        for (const changed of [
          { sources: [{ ...source.sources[0], sha256: '0'.repeat(64) }] },
          { bundle: 'wrong-source-bundle' },
        ]) {
          const altered = scope.map((structure) => structure === source ? { ...structure, ...changed } : structure);
          assert.deepEqual(stageStructures(altered, profile, 'assembled', study.id), [], 'Source drift hides the focus');
        }
        assert.deepEqual(stageStructures(scope.filter((structure) => structure !== source), profile, 'assembled', study.id), []);
        assert.deepEqual(stageStructures([...scope, structuredClone(source)], profile, 'assembled', study.id), []);
      }
      let state = dissectionReducer(initialDissection, { type: 'focus', id: study.id });
      const before = resolveDissection(scope, profile, state).visible.map((structure) => structure.id);
      state = dissectionReducer(state, { type: 'remove', id: visible[0].id });
      assert(!resolveDissection(scope, profile, state).visible.some((structure) => structure.id === visible[0].id));
      state = dissectionReducer(state, { type: 'undo' });
      assert.deepEqual(resolveDissection(scope, profile, state).visible.map((structure) => structure.id), before);
    }
  }
}
const previous = preInfrahyoidLayerProfiles(dissectionProfiles);
for (const region of ['head-neck', 'whole-body']) {
  assert(!previous[region].focuses.some((focus) => focus.id.startsWith('infrahyoid-')));
}
assert.equal(hash(previous), '32d547014691a309b584843574b9df034ef3b3234a35a20bf52b70ba2ed33fb2');
const altered = structuredClone(dissectionProfiles);
altered['head-neck'].focuses.find((focus) => focus.id === 'infrahyoid-deep-pair').title += ' changed';
assert.throws(() => preInfrahyoidLayerProfiles(altered), /Unrecorded infrahyoid recipe edit/);
console.log(JSON.stringify({ passed: true, exactSources: 10, regions: 2, layers: 2, sideScopes: 12, clinicalValidation: false }));
