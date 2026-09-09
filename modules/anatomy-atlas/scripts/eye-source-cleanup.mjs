import assert from 'node:assert/strict';
import { BufferGeometry, Float32BufferAttribute } from 'three';

// Exact v4 PART-OF files only. Zero-based source face ranges were established
// by connected-component inspection, not a generic small-part deletion rule.
export const eyeCleanupRecipes = [
  {
    file: 'FJ1340',
    sha256: '20cc1b1156cd9fdebd96d8a7710ff3d6d6fc9fef79b7173ef41491e2b6e650a3',
    faces: 4606,
    start: 4588,
    count: 18,
  },
  {
    file: 'FJ1371',
    sha256: '8dc5ab248fc952170f9057aaf4bbd2339d9ee4c30b40b32ce793e54b22706738',
    faces: 7376,
    start: 7372,
    count: 4,
  },
  {
    file: 'FJ1337',
    sha256: 'db3077437828f311b6afa07dc9dc7a27ab0e005ddce62570420c61af31643f22',
    faces: 28872,
    start: 28862,
    count: 10,
  },
  {
    file: 'FJ1368',
    sha256: '6fce2e1842730573a8d1360a88a9512b2ee5fe0ebe55e669cd265601da663b49',
    faces: 39524,
    start: 39520,
    count: 4,
  },
];

/** Suppress only the pinned, disconnected opposite-side triangles. Never
 * reflect, move, grow, join or smooth positions; retained indices keep order. */
export function cleanEyeGeometry(geometry, source) {
  const recipe = eyeCleanupRecipes.find((r) => r.file === source.file);
  if (!recipe) return geometry;
  assert.equal(source.sha256, recipe.sha256, 'Unreviewed eye source revision');
  const p = geometry.getAttribute('position'),
    index = geometry.index;
  const count = index?.count ?? p.count;
  assert.equal(count, recipe.faces * 3, 'Unexpected source face count');
  const kept = [],
    removed = [];
  for (let face = 0; face < count / 3; face++) {
    const ids = [0, 1, 2].map((i) =>
      index ? index.getX(face * 3 + i) : face * 3 + i,
    );
    const opposite = ids.every((i) => p.getX(i) > 0);
    const omit = face >= recipe.start && face < recipe.start + recipe.count;
    assert.equal(
      opposite,
      omit,
      'Pinned fragment differs from source laterality',
    );
    assert(
      ids.every((i) => p.getX(i) > 0) || ids.every((i) => p.getX(i) < 0),
      'Cross-midline triangle needs review',
    );
    if (omit) {
      removed.push(face);
      continue;
    }
    for (const i of ids) kept.push(p.getX(i), p.getY(i), p.getZ(i));
  }
  assert.equal(removed.length, recipe.count);
  return new BufferGeometry().setAttribute(
    'position',
    new Float32BufferAttribute(kept, 3),
  );
}
