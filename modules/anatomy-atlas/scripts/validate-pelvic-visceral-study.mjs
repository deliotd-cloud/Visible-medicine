import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  dissectionProfiles,
  dissectionReducer,
  initialDissection,
  resolveDissection,
  stageStructures,
} from '../app/dissection-data.ts';

const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const expected = [
  ['FMA15900', 'FJ3149', 'b49f40d01bf28550094a7d17901e33e7066039f3a0fb8cf44d79fff2472f9926'],
  ['FMA9600', 'FJ3139', 'f20448e74cf6b6096248361bc4f618c1d7f4c1acac77f785abc43e40835b13cb'],
  ['FMA14544', 'FJ2571', 'aaedd56539179e2091b3217d11fd42c298ed01a971463725f6c32372289c6819'],
  ['FMA19667', 'FJ3148', '987ce1b01511f6ea323ba5a7a7438ba3df72d0cdc853985e08ca2965feb63c93'],
];
const focusId = 'pelvis-visceral-subset';
let checks = 0;
for (const region of ['pelvis', 'whole-body']) {
  const profile = dissectionProfiles[region];
  const focus = profile.focuses.filter((item) => item.id === focusId);
  assert.equal(focus.length, 1);
  assert.equal(focus[0].includeSkeleton, false);
  assert.deepEqual(focus[0].rule.fmaIds, expected.map(([fmaId]) => fmaId));
  assert.equal(focus[0].requiredSourceBindings.length, 4);
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter((item) =>
      (region === 'whole-body' || item.regions.includes(region)) &&
      (side === 'both' || item.laterality === side ||
        ['unpaired', 'midline', 'unspecified'].includes(item.laterality)));
    const visible = stageStructures(scope, profile, 'free', focusId);
    assert.deepEqual(visible.map((item) => item.fmaId), expected.map(([fmaId]) => fmaId));
    for (const [fmaId, file, sha256] of expected) {
      const item = visible.find((entry) => entry.fmaId === fmaId);
      assert.equal(item.laterality, 'unpaired');
      assert.deepEqual(item.sources, [{ file, sha256 }]);
      assert.deepEqual(focus[0].requiredSourceBindings.find((entry) => entry.fmaId === fmaId).sources, item.sources);
    }
    const focused = dissectionReducer(initialDissection, { type: 'focus', id: focusId });
    assert.deepEqual(resolveDissection(scope, profile, focused).visible, visible);
    const removed = dissectionReducer(focused, { type: 'remove', id: visible[0].id });
    assert.equal(resolveDissection(scope, profile, removed).visible.length, 3);
    assert.deepEqual(resolveDissection(scope, profile, dissectionReducer(removed, { type: 'undo' })).visible, visible);
    const changed = structuredClone(scope);
    changed.find((item) => item.fmaId === 'FMA14544').sources[0].sha256 = 'changed';
    assert.deepEqual(stageStructures(changed, profile, 'free', focusId), []);
    checks += 21;
  }
}
console.log(JSON.stringify({ passed: true, checks, focusId, regions: ['pelvis', 'whole-body'], sourceGeometryChanged: false, clinicalValidation: false }, null, 2));
