import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { acralBoneStudySets, acralBoneReferences } from '../lib/acral-bone-studies.ts';
import { dissectionProfiles, stageStructures, dissectionReducer, initialDissection, resolveDissection } from '../app/dissection-data.ts';
import { relatedStudyViews } from '../lib/study-navigation.ts';
import { studyLibrary, filterStudyLibrary } from '../lib/study-library.ts';
import { preAcralBoneRecipeProfiles, renalProfilesHash, acralBoneProfilesHash } from './recipe-history.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7', 'Source catalogue, IDs, transforms and geometry bindings unchanged');
const catalog = JSON.parse(raw);
const before = JSON.stringify(dissectionProfiles);
assert.equal(hash(before), acralBoneProfilesHash);
assert.equal(hash(JSON.stringify(preAcralBoneRecipeProfiles(dissectionProfiles))), renalProfilesHash);
const expected = [
  ['carpal-proximal-row', 'hand', ['scaphoid', 'lunate', 'triquetral', 'pisiform']],
  ['carpal-distal-row', 'hand', ['trapezium', 'trapezoid', 'capitate', 'hamate']],
  ['tarsal-hindfoot', 'foot', ['talus', 'calcaneus']],
  ['tarsal-midfoot', 'foot', ['navicular bone of', 'cuboid bone', 'medial cuneiform bone', 'intermediate cuneiform bone', 'lateral cuneiform bone']],
];
assert.deepEqual(acralBoneStudySets.map((s) => s.id), expected.map(([id]) => id));
let scopes = 0;
for (const [id, region, names] of expected) {
  const study = acralBoneStudySets.find((s) => s.id === id);
  const profile = dissectionProfiles[region];
  assert.equal(profile.stages.filter((s) => s.id === id).length, 1);
  assert.equal(profile.focuses.filter((s) => s.id === id).length, 1);
  assert.equal(new Set(study.targetFmaIds).size, names.length * 2);
  for (const ref of acralBoneReferences[region]) assert(profile.references.includes(ref));
  for (const side of ['both', 'right', 'left']) {
    scopes++;
    const scope = catalog.structures.filter((s) => s.regions.includes(region) && (side === 'both' || s.laterality === side));
    const visible = stageStructures(scope, profile, id);
    assert.equal(visible.length, names.length * (side === 'both' ? 2 : 1));
    assert(visible.every((s) => s.system === 'skeleton' && study.targetFmaIds.includes(s.fmaId)));
    for (const name of names) assert.equal(visible.filter((s) => s.sourceName.toLowerCase().includes(name)).length, side === 'both' ? 2 : 1, name);
    assert.deepEqual(stageStructures(scope, profile, 'free', id), visible, 'Study and stage expose the same exact surfaces');
    const cards = studyLibrary(scope, profile);
    const matching = cards.filter((card) => card.recipes.some((recipe) => recipe.id === id));
    assert.equal(matching.length, 1, 'One compact card, not duplicate window/focus cards');
    assert.equal(matching[0].recipes.length, 2);
    assert(matching[0].recipes.every((recipe) => recipe.available));
    assert(filterStudyLibrary(cards, study.title).some((card) => card.key === matching[0].key), 'Existing search finds the new card');
    for (const item of visible) {
      const related = relatedStudyViews(scope, profile, item.id).find((s) => s.focusId === id);
      assert.equal(related?.role, 'target');
      assert.equal(related.context.length, 0, 'No incidental whole-skeleton background');
      assert.deepEqual(related.visibleIds, visible.map((s) => s.id));
    }
    const unrelated = scope.find((s) => !study.targetFmaIds.includes(s.fmaId));
    assert(!relatedStudyViews(scope, profile, unrelated.id).some((s) => s.focusId === id));
    const focus = dissectionReducer(initialDissection, { type: 'focus', id });
    const removed = dissectionReducer(focus, { type: 'remove', id: visible[0].id });
    assert.equal(resolveDissection(scope, profile, removed).visible.length, visible.length - 1);
    const undo = dissectionReducer(removed, { type: 'undo' });
    assert.deepEqual(resolveDissection(scope, profile, undo).visible, visible);
    assert.deepEqual(resolveDissection(scope, profile, dissectionReducer(undo, { type: 'redo' })).visible, visible.slice(1));
    assert.deepEqual(resolveDissection(scope, profile, dissectionReducer(focus, { type: 'undo' })).visible, scope);
    const reset = dissectionReducer(removed, { type: 'reset' });
    assert.deepEqual(resolveDissection(scope, profile, reset).visible, scope);
  }
}
// Preservation helpers must reject an unrelated edit, not merely remove additions.
const altered = structuredClone(dissectionProfiles);
altered.thorax.title += ' changed';
assert.throws(() => preAcralBoneRecipeProfiles(altered));
assert.equal(JSON.stringify(dissectionProfiles), before, 'Checks do not mutate runtime profiles');
console.log(JSON.stringify({ passed: true, studyViews: 4, sideScopes: scopes, reusedBoneRepresentations: 30, newMeshes: 0, clinicalValidation: false, browserTesting: false }));
