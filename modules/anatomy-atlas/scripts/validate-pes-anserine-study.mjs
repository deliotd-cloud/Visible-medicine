import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: `export { dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection } from './app/dissection-data';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { studyLibrary, filterStudyLibrary, studyRecipePreview, studyLibraryAction } from './lib/study-library';
export { pesAnserineBindings, pesAnserineStudies, pesAnserineReferences } from './content/pes-anserine-study';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const {
  dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection,
  bodyDisplayCatalog, studyLibrary, filterStudyLibrary, studyRecipePreview, studyLibraryAction,
  pesAnserineBindings, pesAnserineStudies, pesAnserineReferences,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const catalog = bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const profile = dissectionProfiles['whole-body'];
const sorted = (items) => [...items].sort();
const expected = {
  right: ['FMA22354', 'FMA43883', 'FMA22358', 'FMA24477'],
  left: ['FMA22355', 'FMA43884', 'FMA22359', 'FMA24478'],
};
assert.deepEqual(pesAnserineReferences, ['https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html']);
assert.equal(profile.references.filter((item) => item === pesAnserineReferences[0]).length, 1);
assert.equal(pesAnserineBindings.length, 8);
assert.equal(new Set(pesAnserineBindings.map((item) => item.fmaId)).size, 8);
assert.deepEqual(pesAnserineStudies.map((study) => study.id), [
  'right-pes-anserinus-muscle-convergence', 'left-pes-anserinus-muscle-convergence',
]);
for (const binding of pesAnserineBindings) {
  const matches = catalog.structures.filter((item) => item.id === binding.id || item.fmaId === binding.fmaId);
  assert.equal(matches.length, 1, `${binding.fmaId}: exact catalog identity`);
  const source = matches[0];
  assert.deepEqual({
    id: source.id, fmaId: source.fmaId, laterality: source.laterality,
    bundle: source.bundle, nodeName: source.nodeName, sources: source.sources,
  }, binding);
  assert.deepEqual(source.regions, [source.system === 'skeleton' ? 'leg' : 'thigh']);
  assert.equal(source.provenance.license, 'CC-BY-4.0');
  assert.equal(source.validation.status, 'unvalidated');
  assert.equal(source.validation.anatomicalReview, false);
}

for (const study of pesAnserineStudies) {
  const side = study.id.startsWith('right-') ? 'right' : 'left';
  const opposite = side === 'right' ? 'left' : 'right';
  const focus = profile.focuses.find((item) => item.id === study.id);
  assert.equal(profile.focuses.filter((item) => item.id === study.id).length, 1);
  assert.deepEqual(focus.rule, { fmaIds: [...study.targetFmaIds] });
  assert.deepEqual(focus.context, [{ fmaIds: [...study.contextFmaIds] }]);
  assert.equal(focus.includeSkeleton, false);
  assert.equal(focus.view, 'anterior');
  assert.equal(focus.sideFilteredSourceBindings, undefined);
  assert.deepEqual(focus.requiredSourceBindings.map((item) => item.fmaId), expected[side]);
  for (const phrase of ['medial tibia', 'Select', 'Remove', 'Undo', 'Extract', '0%', 'tendon', 'bursa', 'medial collateral ligament', 'insertions', 'insertion order', 'continuity', 'graft planning', 'scan registration', 'radiologist review'])
    assert((focus.description + focus.inspect).includes(phrase), `${study.id}: ${phrase}`);

  for (const filter of ['both', side, opposite]) {
    const scope = catalog.structures.filter((item) => filter === 'both' || item.laterality === filter || ['midline', 'unpaired', 'unspecified'].includes(item.laterality));
    const visible = stageStructures(scope, profile, 'assembled', study.id);
    const found = filterStudyLibrary(studyLibrary(scope, profile), `${side} pes anserinus muscle convergence`, 'all', 'focus')
      .flatMap((card) => card.recipes).filter((recipe) => recipe.id === study.id);
    assert.equal(found.length, 1, 'Search finds the study in every side filter');
    const recipe = found[0];
    assert.equal(recipe.available, filter !== opposite);
    assert.deepEqual(sorted(visible.map((item) => item.fmaId)), filter === opposite ? [] : sorted(expected[side]));
    assert.deepEqual(sorted(recipe.targets.map((item) => item.fmaId)), filter === opposite ? [] : sorted(study.targetFmaIds));
    assert.deepEqual(studyLibraryAction(scope, profile, recipe.key, false), filter === opposite ? null : { kind: 'focus', id: study.id });
    if (filter === opposite) continue;
    assert.equal(visible.length, 4);
    const preview = studyRecipePreview(recipe, scope, scope.map((item) => item.id), ['thigh-muscles', 'leg-skeleton'], []);
    assert.deepEqual(sorted(preview.keep.map((item) => item.fmaId)), sorted(expected[side]));
    assert.equal(preview.restore.length, 0);
    assert.deepEqual(sorted(preview.loaded.map((item) => item.fmaId)), sorted(expected[side]));
    assert(filterStudyLibrary(studyLibrary(scope, profile), 'gracilis tibia', 'all', 'focus')
      .some((card) => card.recipes.some((item) => item.id === study.id)));

    for (const binding of focus.requiredSourceBindings) {
      const source = scope.find((item) => item.fmaId === binding.fmaId);
      assert(source);
      assert.deepEqual(stageStructures(scope.filter((item) => item !== source), profile, 'assembled', study.id), [], `${binding.fmaId} missing`);
      assert.deepEqual(stageStructures([...scope, structuredClone(source)], profile, 'assembled', study.id), [], `${binding.fmaId} duplicate`);
      for (const change of [
        { id: source.id + '-altered' }, { fmaId: source.fmaId + '-altered' },
        { laterality: opposite }, { bundle: 'altered-bundle' }, { nodeName: 'altered-node' },
        { sources: [] }, { sources: [{ ...source.sources[0], file: 'altered-file' }] },
        { sources: [{ ...source.sources[0], sha256: '0'.repeat(64) }] },
      ]) {
        const altered = scope.map((item) => item === source ? { ...item, ...change } : item);
        assert.deepEqual(stageStructures(altered, profile, 'assembled', study.id), [], `${binding.fmaId} source drift`);
        assert.equal(studyLibraryAction(altered, profile, recipe.key, false), null);
      }
    }

    let state = dissectionReducer(initialDissection, { type: 'focus', id: study.id });
    const before = resolveDissection(scope, profile, state).visible.map((item) => item.id);
    assert.equal(before.length, 4);
    state = dissectionReducer(state, { type: 'remove', id: visible[0].id });
    assert.equal(resolveDissection(scope, profile, state).visible.length, 3);
    state = dissectionReducer(state, { type: 'undo' });
    assert.deepEqual(resolveDissection(scope, profile, state).visible.map((item) => item.id), before);
    state = dissectionReducer(state, { type: 'redo' });
    assert.equal(resolveDissection(scope, profile, state).visible.length, 3);
  }
}
for (const [region, other] of Object.entries(dissectionProfiles)) {
  if (region !== 'whole-body') {
    assert(!other.focuses.some((focus) => pesAnserineStudies.some((study) => study.id === focus.id)), `${region} has no cross-region focus`);
  }
}
const profileHash = createHash('sha256').update(JSON.stringify(dissectionProfiles)).digest('hex');
console.log(JSON.stringify({ passed: true, views: 2, region: 'whole-body', bindings: 8, profileHash, clinicalValidation: false }));
