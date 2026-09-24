import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { preMediastinalOrganProfiles } from './mediastinal-organ-study-history.mjs';
import { preInfrahyoidLayerProfiles } from './infrahyoid-layer-study-history.mjs';
import { historicalRecipeProfiles } from './recipe-history.mjs';

const compiled = await build({
  stdin: {
    contents: `export {
  dissectionProfiles, stageStructures, initialDissection,
  dissectionReducer, resolveDissection,
} from './app/dissection-data';
export { bodyDisplayCatalog } from './lib/body-display-catalog';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const {
  dissectionProfiles, stageStructures, initialDissection,
  dissectionReducer, resolveDissection, bodyDisplayCatalog,
} =
  await import(
    'data:text/javascript;base64,' +
      Buffer.from(compiled.outputFiles[0].text).toString('base64')
  );
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const catalog = bodyDisplayCatalog(
  JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),
);
const id = 'mediastinal-conduits-thymus';
const expectedFmaIds = ['FMA7394', 'FMA7131', 'FMA9607'];
const thorax = dissectionProfiles.thorax;
const selected = thorax.focuses.filter((focus) => focus.id === id);
assert.equal(selected.length, 1);
assert.equal(
  Object.values(dissectionProfiles).flatMap((profile) => profile.focuses)
    .filter((focus) => focus.id === id).length,
  1,
  'Only the Thorax profile offers this focus',
);
const focus = selected[0];
assert.deepEqual(focus.rule, { fmaIds: expectedFmaIds });
assert.equal(focus.includeSkeleton, false);
assert.equal(focus.requiredSourceBindings.length, 3);
assert.deepEqual(
  focus.requiredSourceBindings.map((binding) => binding.fmaId),
  expectedFmaIds,
);
for (const side of ['both', 'left', 'right']) {
  const scope = catalog.structures.filter(
    (structure) =>
      structure.regions.includes('thorax') &&
      (side === 'both' ||
        structure.laterality === side ||
        ['midline', 'unpaired', 'unspecified'].includes(structure.laterality)),
  );
  const visible = stageStructures(scope, thorax, 'assembled', id);
  assert.deepEqual(
    visible.map((structure) => structure.fmaId).sort(),
    [...expectedFmaIds].sort(),
  );
  for (const binding of focus.requiredSourceBindings) {
    const source = scope.find((structure) => structure.fmaId === binding.fmaId);
    assert(source);
    assert.deepEqual(
      {
        id: source.id,
        fmaId: source.fmaId,
        laterality: source.laterality,
        bundle: source.bundle,
        nodeName: source.nodeName,
        sources: source.sources,
      },
      binding,
    );
    assert.deepEqual(
      stageStructures(
        scope.map((structure) =>
          structure === source
            ? { ...structure, sources: [{ ...structure.sources[0], sha256: '0'.repeat(64) }] }
            : structure,
        ),
        thorax,
        'assembled',
        id,
      ),
      [],
      'Source hash drift hides the whole focus',
    );
    assert.deepEqual(
      stageStructures(scope.filter((structure) => structure !== source), thorax, 'assembled', id),
      [],
      'Missing source hides the whole focus',
    );
    assert.deepEqual(
      stageStructures([...scope, structuredClone(source)], thorax, 'assembled', id),
      [],
      'Duplicate source hides the whole focus',
    );
    for (const change of [
      { laterality: 'left' },
      { bundle: 'wrong-source-bundle' },
    ]) {
      assert.deepEqual(
        stageStructures(
          scope.map((structure) => structure === source ? { ...structure, ...change } : structure),
          thorax,
          'assembled',
          id,
        ),
        [],
        'Changed side or bundle hides the whole focus',
      );
    }
  }
  let state = dissectionReducer(initialDissection, { type: 'focus', id });
  const before = resolveDissection(scope, thorax, state).visible.map((structure) => structure.id);
  state = dissectionReducer(state, { type: 'remove', id: visible[0].id });
  assert(!resolveDissection(scope, thorax, state).visible.some((structure) => structure.id === visible[0].id));
  state = dissectionReducer(state, { type: 'undo' });
  assert.deepEqual(
    resolveDissection(scope, thorax, state).visible.map((structure) => structure.id),
    before,
    'Undo restores the focused source view',
  );
}
const previous = preMediastinalOrganProfiles(dissectionProfiles);
assert.equal(previous.thorax.focuses.some((candidate) => candidate.id === id), false);
assert.equal(hash(previous), '1a6c020cad6f3bb3e50f4e1d014a191273d9b66d3eaf6503211f0f2df3ba4c8f');
assert.equal(
  hash(historicalRecipeProfiles(dissectionProfiles)),
  'd127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c',
);
const altered = preInfrahyoidLayerProfiles(dissectionProfiles);
altered.thorax.focuses.find((candidate) => candidate.id === id).title += ' changed';
assert.throws(() => preMediastinalOrganProfiles(altered), /Unrecorded mediastinal recipe edit/);
for (const term of [
  'exterior reference surfaces', 'lumen', 'motility', 'swallowing',
  'airway continuity', 'thymic microanatomy', 'involution',
  'mediastinal distances', 'patient registration', 'radiologist review',
]) assert(focus.inspect.includes(term));
console.log(JSON.stringify({ passed: true, thoraxOnlyFocus: id, exactSources: 3, sideScopes: 3, historyPreserved: true }));
