import { BufferGeometry, Mesh, Raycaster, type Intersection } from 'three';
import { MeshBVH, acceleratedRaycast, CENTER } from 'three-mesh-bvh';

// Acceleration metadata only: no vertex copies, index reordering or global patches.
export const tissuePickingLimits = { minTriangles: 512, maxTriangles: 250_000, maxBytes: 24 * 1024 * 1024 } as const;
type Schedule = (work: () => void) => () => void;
const scheduleIdle: Schedule = work => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const handle = window.requestIdleCallback(work, { timeout: 1000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(work, 0);
  return () => clearTimeout(handle);
};

function signature(geometry: BufferGeometry) {
  const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), i = geometry.index;
  if (!p || !n || !i || geometry.groups.length || Object.keys(geometry.morphAttributes).length ||
    Object.keys(geometry.attributes).sort().join(',') !== 'normal,position' ||
    'isInterleavedBufferAttribute' in p || 'isInterleavedBufferAttribute' in n ||
    !(p.array instanceof Float32Array) || !(n.array instanceof Float32Array) ||
    !(i.array instanceof Uint16Array || i.array instanceof Uint32Array) ||
    p.itemSize !== 3 || n.itemSize !== 3 || n.count !== p.count || p.normalized || n.normalized || i.normalized ||
    i.count % 3 || geometry.drawRange.start !== 0 ||
    (geometry.drawRange.count !== Infinity && geometry.drawRange.count !== i.count) ||
    i.count / 3 < tissuePickingLimits.minTriangles || i.count / 3 > tissuePickingLimits.maxTriangles) return null;
  return { p, n, i, pv: p.version, nv: n.version, iv: i.version };
}

/** Reference-counted cache; each mounted geometry owns one bounded, idle-built tree. */
export function createTissuePickingCache(schedule: Schedule = scheduleIdle, maxBytes = tissuePickingLimits.maxBytes) {
  type Entry = { refs: number; signature: NonNullable<ReturnType<typeof signature>>; proxy: Mesh | null; bytes: number; cancel: (() => void) | null; disposed: () => void };
  const entries = new Map<BufferGeometry, Entry>();
  let ownedBytes = 0;
  const drop = (geometry: BufferGeometry, entry: Entry) => {
    if (entries.get(geometry) !== entry) return;
    entries.delete(geometry); entry.cancel?.();
    geometry.removeEventListener('dispose', entry.disposed);
    ownedBytes -= entry.bytes;
    // Only this metadata facade is owned; shared BufferAttributes are untouched.
    if (entry.proxy) { entry.proxy.geometry.boundsTree = undefined; entry.proxy.geometry.dispose(); }
    entry.proxy = null;
  };
  const valid = (geometry: BufferGeometry, entry: Entry) => {
    const now = signature(geometry), old = entry.signature;
    return now && now.p === old.p && now.n === old.n && now.i === old.i &&
      now.pv === old.pv && now.nv === old.nv && now.iv === old.iv;
  };
  return {
    retain(geometry: BufferGeometry) {
      let entry = entries.get(geometry);
      if (!entry) {
        const sig = signature(geometry);
        if (!sig) return () => {};
        entry = { refs: 0, signature: sig, proxy: null, bytes: 0, cancel: null, disposed: () => {} };
        const owned = entry;
        owned.disposed = () => drop(geometry, owned);
        entries.set(geometry, owned); geometry.addEventListener('dispose', owned.disposed);
        owned.cancel = schedule(() => {
          owned.cancel = null;
          if (entries.get(geometry) !== owned || !valid(geometry, owned)) return;
          // Retained buffers are capped below. One in-progress tree can transiently
          // add at most 68 bytes/triangle of tree buffers (two 32-byte nodes plus a
          // 4-byte indirect index). Construction scratch/JS overhead is additional;
          // maxTriangles bounds build size. No concurrent builds or vertex copies.
          if (ownedBytes >= maxBytes && ![...entries.values()].some(e => e.proxy && e.signature.i.count < sig.i.count)) return;
          const facade = new BufferGeometry();
          facade.setAttribute('position', sig.p); facade.setAttribute('normal', sig.n); facade.setIndex(sig.i);
          try {
            // 0.8.3 implements indirect but omits it from MeshBVHOptions declarations.
            const options = { strategy: CENTER, maxLeafTris: 10, indirect: true, setBoundingBox: true };
            const tree = new MeshBVH(facade, options);
            const serialized = MeshBVH.serialize(tree, { cloneBuffers: false }) as ReturnType<typeof MeshBVH.serialize> & { indirectBuffer?: Uint16Array | Uint32Array };
            const bytes = serialized.roots.reduce((sum, root) => sum + root.byteLength, 0) + (serialized.indirectBuffer?.byteLength ?? 0);
            // Do not let earlier tiny structures consume the budget before dense
            // torso muscles load. Evicted entries keep exact native picking.
            if (bytes <= maxBytes && bytes + ownedBytes > maxBytes) {
              const smaller = [...entries.values()].filter(e => e.proxy && e.signature.i.count < sig.i.count)
                .sort((a, b) => a.signature.i.count - b.signature.i.count);
              for (const other of smaller) {
                other.proxy!.geometry.boundsTree = undefined; other.proxy!.geometry.dispose();
                other.proxy = null; ownedBytes -= other.bytes; other.bytes = 0;
                if (bytes + ownedBytes <= maxBytes) break;
              }
            }
            if (bytes + ownedBytes > maxBytes) { facade.dispose(); return; }
            facade.boundsTree = tree;
            owned.proxy = new Mesh(facade); owned.bytes = bytes; ownedBytes += bytes;
          } catch { facade.dispose(); } // Native picking remains available on failure.
        });
      }
      entry.refs++;
      const owned = entry; let released = false;
      return () => { if (!released) { released = true; if (--owned.refs === 0) drop(geometry, owned); } };
    },
    raycast(mesh: Mesh, raycaster: Raycaster, hits: Intersection[]) {
      const entry = entries.get(mesh.geometry);
      if (!entry?.proxy || !valid(mesh.geometry, entry) || 'isSkinnedMesh' in mesh ||
        'isInstancedMesh' in mesh || mesh.morphTargetInfluences || mesh.matrixWorld.determinant() === 0) {
        Mesh.prototype.raycast.call(mesh, raycaster, hits); return;
      }
      const proxy = entry.proxy;
      proxy.material = mesh.material; proxy.matrixWorld.copy(mesh.matrixWorld);
      // Never accept firstHitOnly: a shader-clipped front hit may conceal a valid rear hit.
      const allHitsRaycaster = Object.create(raycaster) as Raycaster & { firstHitOnly: boolean };
      allHitsRaycaster.firstHitOnly = false;
      const start = hits.length;
      acceleratedRaycast.call(proxy, allHitsRaycaster, hits);
      for (let i = start; i < hits.length; i++) hits[i].object = mesh;
    },
    stats() { return { entries: entries.size, prepared: [...entries.values()].filter(e => e.proxy).length, ownedBytes }; },
  };
}

export const tissuePicking = createTissuePickingCache();
