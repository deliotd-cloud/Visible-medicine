import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: `export { dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection } from './app/dissection-data';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { studyLibrary, filterStudyLibrary } from './lib/study-library';
export { thoracicHilarBindings, thoracicHilarStudies, thoracicHilarReferences } from './content/thoracic-hilar-study';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const {
  dissectionProfiles, stageStructures, initialDissection, dissectionReducer,
  resolveDissection, bodyDisplayCatalog, studyLibrary, filterStudyLibrary,
  thoracicHilarBindings, thoracicHilarStudies, thoracicHilarReferences,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = bodyDisplayCatalog(raw);
const profileHash = createHash('sha256').update(JSON.stringify(dissectionProfiles)).digest('hex');
const sorted = (items) => [...items].sort((a, b) => a.localeCompare(b));
const sideIds = {
  right: ['FMA7395', 'FMA50872', 'FMA49914', 'FMA49911'],
  left: ['FMA7396', 'FMA50873', 'FMA49916', 'FMA49913'],
};
assert.equal(thoracicHilarBindings.length, 8);
assert.equal(new Set(thoracicHilarBindings.map((binding) => binding.fmaId)).size, 8);
assert.deepEqual(thoracicHilarReferences, ['https://anatomy.ttuhscep.edu/schemes/lungs_ans.html']);
assert.deepEqual(thoracicHilarStudies.map((study) => study.id), ['right-pulmonary-hilum', 'left-pulmonary-hilum']);
for (const binding of thoracicHilarBindings) {
  const matches = catalog.structures.filter((structure) => structure.id === binding.id || structure.fmaId === binding.fmaId);
  assert.equal(matches.length, 1, `One catalogue source for ${binding.fmaId}`);
  const source = matches[0];
  assert.deepEqual({
    id: source.id, fmaId: source.fmaId, laterality: source.laterality,
    bundle: source.bundle, nodeName: source.nodeName, sources: source.sources,
  }, binding);
  assert.equal(source.provenance.license, 'CC-BY-4.0');
  assert.equal(source.validation.anatomicalReview, false);
  assert.equal(source.validation.status, 'unvalidated');
}
assert.deepEqual(thoracicHilarBindings.find((binding) => binding.fmaId === 'FMA49916').sources.map((source) => source.file), ['FJ2925', 'FJ2933']);
assert.deepEqual(thoracicHilarBindings.find((binding) => binding.fmaId === 'FMA49913').sources.map((source) => source.file), ['FJ2944', 'FJ2950', 'FJ2955']);

for (const region of ['thorax', 'whole-body']) {
  const profile = dissectionProfiles[region];
  assert.equal(profile.references.filter((reference) => reference === thoracicHilarReferences[0]).length, 1);
  for (const side of ['right', 'left']) {
    const study = thoracicHilarStudies.find((candidate) => candidate.id === `${side}-pulmonary-hilum`);
    const focus = profile.focuses.find((candidate) => candidate.id === study.id);
    assert.equal(profile.focuses.filter((candidate) => candidate.id === study.id).length, 1);
    assert.deepEqual(focus.rule, { fmaIds: sideIds[side] });
    assert.equal(focus.view, 'anterior');
    assert.equal(focus.includeSkeleton, false);
    assert.equal(focus.context, undefined);
    assert.equal(focus.sideFilteredSourceBindings, undefined);
    assert.deepEqual(focus.requiredSourceBindings.map((binding) => binding.fmaId), sideIds[side]);
    for (const phrase of ['bronchus', 'arter', 'venous', '0%', 'joined lumen', 'ostia', 'complete lobar map', 'surgical planes', 'patient registration', 'radiologist review'])
      assert((focus.description + focus.inspect).includes(phrase), `${study.id}: ${phrase}`);
    for (const filter of ['both', side, side === 'right' ? 'left' : 'right']) {
      const scope = catalog.structures.filter((structure) =>
        (region === 'whole-body' || structure.regions.includes(region)) &&
        (filter === 'both' || structure.laterality === filter || ['midline', 'unpaired', 'unspecified'].includes(structure.laterality)));
      const visible = stageStructures(scope, profile, 'assembled', study.id);
      assert.deepEqual(sorted(visible.map((structure) => structure.fmaId)), filter === side || filter === 'both' ? sorted(sideIds[side]) : []);
      const cards = studyLibrary(scope, profile);
      const found = filterStudyLibrary(cards, `${side} pulmonary hilum`, 'all', 'focus');
      assert.equal(found.filter((card) => card.recipes.some((recipe) => recipe.id === study.id)).length, 1);
      const recipe = found.find((card) => card.recipes.some((item) => item.id === study.id)).recipes[0];
      assert(filterStudyLibrary(cards, `${side} lung root`, 'all', 'focus')
        .some(card => card.recipes.some(item => item.id === study.id)));
      if (filter !== 'both' && filter !== side) {
        assert.equal(recipe.available, false, 'Opposite-side focus is unavailable');
        continue;
      }
      assert.equal(recipe.available, true);
      assert.deepEqual(sorted(recipe.targets.map((target) => target.fmaId)), sorted(sideIds[side]));
      for (const binding of focus.requiredSourceBindings) {
        const source = scope.find((structure) => structure.fmaId === binding.fmaId);
        assert(source);
        assert.deepEqual(stageStructures(scope.filter((item) => item !== source), profile, 'assembled', study.id), [], 'Missing source hides focus');
        assert.deepEqual(stageStructures([...scope, structuredClone(source)], profile, 'assembled', study.id), [], 'Duplicate source hides focus');
        for (const changed of [
          { id: source.id + '-wrong' }, { fmaId: source.fmaId + '-wrong' },
          { laterality: side === 'right' ? 'left' : 'right' },
          { bundle: 'wrong-bundle' }, { nodeName: 'wrong-node' },
        ]) {
          const altered = scope.map((item) => item === source ? { ...item, ...changed } : item);
          assert.deepEqual(stageStructures(altered, profile, 'assembled', study.id), [], `${binding.fmaId} identity drift hides focus`);
        }
        for (let index = 0; index < source.sources.length; index++) {
          for (const changed of [{ file: 'wrong-file' }, { sha256: '0'.repeat(64) }]) {
            const sources = source.sources.map((part, position) => position === index ? { ...part, ...changed } : part);
            const altered = scope.map((item) => item === source ? { ...item, sources } : item);
            assert.deepEqual(stageStructures(altered, profile, 'assembled', study.id), [], `${binding.fmaId} component ${index} drift hides focus`);
          }
        }
      }
      let state = dissectionReducer(initialDissection, { type: 'focus', id: study.id });
      const before = resolveDissection(scope, profile, state).visible.map((structure) => structure.id);
      assert.equal(before.length, 4);
      state = dissectionReducer(state, { type: 'remove', id: visible[0].id });
      assert.equal(resolveDissection(scope, profile, state).visible.length, 3);
      state = dissectionReducer(state, { type: 'undo' });
      assert.deepEqual(resolveDissection(scope, profile, state).visible.map((structure) => structure.id), before);
      state = dissectionReducer(state, { type: 'redo' });
      assert.equal(resolveDissection(scope, profile, state).visible.length, 3);
      state = dissectionReducer(state, { type: 'reset' });
      assert.equal(state.focusId, null);
      assert.equal(state.removed.length, 0);
      assert.equal(resolveDissection(scope, profile, state).visible.length, scope.length);
    }
  }
}
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  if (region === 'thorax' || region === 'whole-body') continue;
  assert(!profile.focuses.some((focus) => thoracicHilarStudies.some((study) => study.id === focus.id)));
}
console.log(JSON.stringify({ passed: true, views: 2, regions: 2, bindings: 8, profileHash, clinicalValidation: false }));
