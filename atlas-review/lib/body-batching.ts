import {
  BatchedMesh, BufferGeometry, Color, DoubleSide, Matrix4,
  MeshStandardMaterial, Vector3, type Intersection, type Raycaster,
} from 'three';
import { labelDepthSurface } from './label-depth.ts';

// Original-resolution opaque surfaces only. Detailed/transparent/cut surfaces
// continue through AnatomyTissue; no overview LOD or mesh simplification.
export const bodyBatchLimits = { minSurfaces: 8, minSceneSurfaces: 150, maxBytes: 16 * 1024 * 1024 } as const;
export type BodyBatchSource = { id: string; geometry: BufferGeometry };
export type BodyBatchDisplay = {
  id: string; color: string; position: Vector3; selected: boolean;
  faded: boolean; opacity: number; interactive: boolean;
};

/** Restrict the first batching path to the atlas's simple, complete indexed surfaces. */
export function bodyBatchGeometryBytes(geometry: BufferGeometry): number | null {
  const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
  const index = geometry.getIndex();
  if (!position || !normal || !index || geometry.groups.length ||
      Object.keys(geometry.morphAttributes).length ||
      Object.keys(geometry.attributes).sort().join(',') !== 'normal,position' ||
      position.itemSize !== 3 || normal.itemSize !== 3 || position.count !== normal.count ||
      position.normalized || normal.normalized || index.normalized ||
      !(position.array instanceof Float32Array) || !(normal.array instanceof Float32Array) ||
      'isInterleavedBufferAttribute' in position || 'isInterleavedBufferAttribute' in normal ||
      !(index.array instanceof Uint16Array || index.array instanceof Uint32Array) ||
      index.count === 0 || index.count % 3 !== 0 ||
      geometry.drawRange.start !== 0 ||
      (geometry.drawRange.count !== Infinity && geometry.drawRange.count !== index.count)) return null;
  // BatchedMesh may promote all indices to Uint32; budget for the upper bound.
  return position.count * 24 + index.count * 4;
}

export function bodyBatchSources(sources: BodyBatchSource[]): BodyBatchSource[] {
  if (new Set(sources.map(s => s.id)).size !== sources.length) return [];
  const accepted = sources.filter(s => bodyBatchGeometryBytes(s.geometry) !== null);
  const bytes = accepted.reduce((n, s) => n + bodyBatchGeometryBytes(s.geometry)!, 0);
  return accepted.length >= bodyBatchLimits.minSurfaces && bytes <= bodyBatchLimits.maxBytes ? accepted : [];
}

export function bodyBatchActive(s: BodyBatchDisplay, cut: boolean): boolean {
  return !cut && !s.selected && !s.faded && s.opacity === 1 &&
    s.position.toArray().every(Number.isFinite);
}

/** Owns copies only. Never mutates/disposes cached GLTF source geometry. */
export function createBodyBatch(sources: BodyBatchSource[]) {
  const accepted = bodyBatchSources(sources);
  if (!accepted.length) return null;
  const material = new MeshStandardMaterial({
    color: '#ffffff', roughness: 0.92, metalness: 0, side: DoubleSide,
    transparent: false, opacity: 1, depthWrite: true, emissive: '#000000', emissiveIntensity: 0.13,
  });
  const mesh = new BatchedMesh(accepted.length,
    accepted.reduce((n, s) => n + s.geometry.getAttribute('position').count, 0),
    accepted.reduce((n, s) => n + s.geometry.getIndex()!.count, 0), material);
  const instances = new Map<string, number>(), identities = new Map<number, string>();
  const interactive = new Set<number>();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    mesh.dispose(); material.dispose(); interactive.clear();
  };
  try {
    for (const source of accepted) {
      const instance = mesh.addInstance(mesh.addGeometry(source.geometry));
      instances.set(source.id, instance); identities.set(instance, source.id);
      mesh.setVisibleAt(instance, false);
    }
  } catch (error) { dispose(); throw error; }
  mesh.name = 'Visible Medicine original-resolution opaque batch';
  mesh.userData = { ...labelDepthSurface };
  // The aggregate bounds would become stale during explosion. Per-instance
  // culling stays enabled and uses the current matrices on every rendered frame.
  mesh.frustumCulled = false;
  mesh.perObjectFrustumCulled = true;
  mesh.raycast = (raycaster: Raycaster, hits: Intersection[]) => {
    if (disposed || !mesh.visible) return;
    const candidates: Intersection[] = [];
    BatchedMesh.prototype.raycast.call(mesh, raycaster, candidates);
    for (const hit of candidates) if (hit.batchId !== undefined && interactive.has(hit.batchId)) {
      // R3F deduplicates/interprets pointer targets using instanceId, not batchId.
      hit.instanceId = hit.batchId;
      hits.push(hit);
    }
  };
  const matrix = new Matrix4(), color = new Color();
  return {
    mesh, instances, sourceCount: accepted.length,
    ownedGeometryBytes: bodyBatchGeometryBytes(mesh.geometry)!,
    identity(batchId: number | undefined) {
      return !disposed && batchId !== undefined && interactive.has(batchId) ? identities.get(batchId) ?? null : null;
    },
    update(display: BodyBatchDisplay[], cut: boolean) {
      const batched = new Set<string>();
      if (disposed) return batched;
      interactive.clear();
      for (const instance of instances.values()) mesh.setVisibleAt(instance, false);
      for (const item of display) {
        const instance = instances.get(item.id);
        if (instance === undefined || !bodyBatchActive(item, cut)) continue;
        mesh.setMatrixAt(instance, matrix.makeTranslation(item.position));
        mesh.setColorAt(instance, color.set(item.color));
        mesh.setVisibleAt(instance, true);
        if (item.interactive) interactive.add(instance);
        batched.add(item.id);
      }
      mesh.visible = batched.size > 0;
      return batched;
    },
    dispose,
  };
}
export type BodyBatch = NonNullable<ReturnType<typeof createBodyBatch>>;
