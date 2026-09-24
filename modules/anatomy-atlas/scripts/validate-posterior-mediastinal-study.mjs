import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: `export { dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection } from './app/dissection-data';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { studyLibrary, filterStudyLibrary, studyLibraryAction } from './lib/study-library';
export { posteriorMediastinalBindings, posteriorMediastinalStudy } from './content/posterior-mediastinal-study';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const {
  dissectionProfiles, stageStructures, initialDissection, dissectionReducer,
  resolveDissection, bodyDisplayCatalog, studyLibrary, filterStudyLibrary,
  studyLibraryAction, posteriorMediastinalBindings, posteriorMediastinalStudy,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sorted = (values) => [...values].sort();
const id = 'posterior-mediastinal-conduits';
const targetIds = ['FMA7131', 'FMA87217', 'FMA4838', 'FMA4944'];
const reference = 'https://anatomy.ttuhscep.edu/schemes/lungs_ans.html';
assert.equal(posteriorMediastinalStudy.id, id);
assert.deepEqual(posteriorMediastinalStudy.fmaIds, targetIds);
assert.equal(posteriorMediastinalBindings.length, 4);
assert.equal(new Set(posteriorMediastinalBindings.map((binding) => binding.fmaId)).size, 4);
assert.deepEqual(posteriorMediastinalBindings.map((binding) => binding.fmaId), targetIds);
assert.deepEqual(posteriorMediastinalBindings.map((binding) => binding.laterality), ['unpaired', 'unspecified', 'unspecified', 'midline']);
for (const [binding, file] of posteriorMediastinalBindings.map((binding, index) => [binding, ['FJ2563', 'FJ1931', 'FJ3416', 'FJ3434'][index]])) {
  const matches = catalog.structures.filter((structure) => structure.id === binding.id || structure.fmaId === binding.fmaId);
  assert.equal(matches.length, 1, `One display source for ${binding.fmaId}`);
  const source = matches[0];
  assert.deepEqual({
    id: source.id, fmaId: source.fmaId, laterality: source.laterality,
    bundle: source.bundle, nodeName: source.nodeName, sources: source.sources,
  }, binding);
  assert.deepEqual(source.regions, ['thorax']);
  assert.deepEqual(source.sources.map((part) => part.file), [file]);
  assert.equal(source.provenance.license, 'CC-BY-4.0');
  assert.equal(source.provenance.sourceVersion, '4.0');
  assert.equal(source.validation.status, 'unvalidated');
  assert.equal(source.validation.anatomicalReview, false);
}

for (const region of ['thorax', 'whole-body']) {
  const profile = dissectionProfiles[region];
  assert.equal(profile.references.filter((item) => item === reference).length, 1);
  assert.equal(profile.focuses.filter((focus) => focus.id === id).length, 1);
  const focus = profile.focuses.find((item) => item.id === id);
  assert.deepEqual(focus.rule, { fmaIds: targetIds });
  assert.deepEqual(focus.requiredSourceBindings, posteriorMediastinalBindings);
  assert.equal(focus.view, 'posterior');
  assert.equal(focus.includeSkeleton, false);
  assert.equal(focus.context, undefined);
  assert.equal(focus.sideFilteredSourceBindings, undefined);
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter((structure) =>
      (region === 'whole-body' || structure.regions.includes(region)) &&
      (side === 'both' || structure.laterality === side || ['midline', 'unpaired', 'unspecified'].includes(structure.laterality)));
    const visible = stageStructures(scope, profile, 'assembled', id);
    assert.deepEqual(sorted(visible.map((structure) => structure.fmaId)), sorted(targetIds));
    assert(visible.every((structure) => structure.system !== 'skeleton'));
    const cards = studyLibrary(scope, profile);
    const found = filterStudyLibrary(cards, 'posterior mediastinum oesophagus', 'all', 'focus')
      .flatMap((card) => card.recipes).filter((recipe) => recipe.id === id);
    assert.equal(found.length, 1);
    const recipe = found[0];
    assert.equal(recipe.available, true);
    assert.equal(recipe.view, 'posterior');
    assert.deepEqual(sorted(recipe.targets.map((target) => target.fmaId)), sorted(targetIds));
    assert.deepEqual(studyLibraryAction(scope, profile, `focus:${id}`, false), { kind: 'focus', id });
    for (const term of ['FMA7131', 'azygos', 'descending thoracic aorta']) {
      assert(filterStudyLibrary(cards, term, 'all', 'focus')
        .some((card) => card.recipes.some((item) => item.id === id)), `${term} searchable`);
    }
    for (const binding of focus.requiredSourceBindings) {
      const source = scope.find((structure) => structure.fmaId === binding.fmaId);
      assert(source);
      const without = scope.filter((item) => item !== source);
      assert.deepEqual(stageStructures(without, profile, 'assembled', id), [], 'Missing target fails closed');
      assert.equal(studyLibraryAction(without, profile, `focus:${id}`, false), null);
      assert.deepEqual(stageStructures([...scope, structuredClone(source)], profile, 'assembled', id), [], 'Duplicate target fails closed');
      for (const change of [
        { id: source.id + '-changed' }, { fmaId: source.fmaId + '-changed' },
        { laterality: 'left' }, { bundle: 'changed-bundle' }, { nodeName: 'changed-node' },
      ]) {
        const changed = scope.map((item) => item === source ? { ...item, ...change } : item);
        assert.deepEqual(stageStructures(changed, profile, 'assembled', id), [], `${binding.fmaId} identity drift fails closed`);
      }
      for (const change of [{ file: 'changed-file' }, { sha256: '0'.repeat(64) }]) {
        const changed = scope.map((item) => item === source
          ? { ...item, sources: [{ ...source.sources[0], ...change }] } : item);
        assert.deepEqual(stageStructures(changed, profile, 'assembled', id), [], `${binding.fmaId} source drift fails closed`);
      }
    }
    let state = dissectionReducer(initialDissection, { type: 'focus', id });
    const initial = resolveDissection(scope, profile, state).visible.map((structure) => structure.id);
    assert.equal(initial.length, 4);
    state = dissectionReducer(state, { type: 'remove', id: initial[0] });
    assert.equal(resolveDissection(scope, profile, state).visible.length, 3);
    state = dissectionReducer(state, { type: 'undo' });
    assert.deepEqual(resolveDissection(scope, profile, state).visible.map((structure) => structure.id), initial);
    state = dissectionReducer(state, { type: 'redo' });
    assert.equal(resolveDissection(scope, profile, state).visible.length, 3);
    state = dissectionReducer(state, { type: 'reset' });
    assert.equal(state.focusId, null);
    assert.deepEqual(state.removed, []);
    assert.equal(resolveDissection(scope, profile, state).visible.length, scope.length);
  }
}
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  if (region !== 'thorax' && region !== 'whole-body')
    assert(!profile.focuses.some((focus) => focus.id === id));
}
for (const phrase of [
  'ascends on the right', 'hemiazygos crosses', 'midline inferiorly', 'exterior surface',
  '0%', 'Both left and right side filters', 'unilateral segmentation',
  'joined lumen', 'complete mediastinum', 'Nerves', 'thoracic duct',
  'lymph nodes', 'boundary planes', 'patient registration', 'radiologist review',
]) assert((posteriorMediastinalStudy.description + posteriorMediastinalStudy.inspect).includes(phrase), phrase);
const oldProfiles = structuredClone(dissectionProfiles);
for (const region of ['thorax', 'whole-body']) {
  const index = oldProfiles[region].focuses.findIndex((focus) => focus.id === id);
  assert(index >= 0);
  oldProfiles[region].focuses.splice(index, 1);
}
const baselineHash = hash(oldProfiles);
assert.equal(baselineHash, '4bc5b531e04448fb36afa7394cf318f3761012cbd921366d0bfb8a0a99244ce9');
console.log(JSON.stringify({ passed: true, regions: 2, sideFilters: 3, bindings: 4, baselineHash, profileHash: hash(dissectionProfiles), clinicalValidation: false }));
