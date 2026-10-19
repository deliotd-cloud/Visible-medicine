import * as THREE from 'three';
import type { BodyStructure } from '../app/body-types';

type ExpectedStructure = Pick<BodyStructure, 'bundle' | 'nodeName'>;
type SceneIndex = {
  geometries: Map<string, THREE.BufferGeometry>;
  duplicates: Set<string>;
  validated: WeakMap<readonly ExpectedStructure[], Set<string>>;
};
// Loaded GLTF scenes are immutable asset identities. Retry clears GLTF's cache
// and supplies a new scene; no geometry is cloned, transformed or disposed here.
const indices = new WeakMap<THREE.Object3D, SceneIndex>();

export function bodyBundleGeometries(
  scene: THREE.Object3D,
  structures: readonly ExpectedStructure[],
  bundleId: string,
): ReadonlyMap<string, THREE.BufferGeometry> {
  let index = indices.get(scene);
  if (!index) {
    index = { geometries: new Map(), duplicates: new Set(), validated: new WeakMap() };
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      if (index!.geometries.has(object.name)) index!.duplicates.add(object.name);
      index!.geometries.set(object.name, object.geometry);
    });
    indices.set(scene, index);
  }
  let validated = index.validated.get(structures);
  if (validated?.has(bundleId)) return index.geometries;
  const expected = new Set(structures.filter(s => s.bundle === bundleId).map(s => s.nodeName));
  if (!expected.size) throw new Error(`Body bundle ${bundleId}: catalog has no expected Mesh nodes`);
  for (const name of expected) {
    const fail = (reason: string): never => {
      throw new Error(`Body bundle ${bundleId}: expected Mesh "${name}" ${reason}`);
    };
    const geometry = index.geometries.get(name);
    if (!geometry) fail('is missing');
    if (index.duplicates.has(name)) fail('has duplicate Mesh nodes');
    const position = geometry!.getAttribute('position');
    // Constant-time attribute/draw metadata checks, not a per-vertex source audit.
    if (!position || position.itemSize !== 3 || !Number.isInteger(position.count) || position.count < 3)
      fail('has no usable triangle position attribute');
    const drawCount = geometry!.index?.count ?? position.count;
    const { start, count } = geometry!.drawRange;
    if (!Number.isInteger(drawCount) || drawCount < 3 || !Number.isInteger(start) || start < 0 ||
        !(count === Infinity || (Number.isFinite(count) && count >= 3)) || start + 3 > drawCount)
      fail('has no drawable triangle range');
  }
  if (!validated) { validated = new Set(); index.validated.set(structures, validated); }
  validated.add(bundleId);
  return index.geometries;
}
