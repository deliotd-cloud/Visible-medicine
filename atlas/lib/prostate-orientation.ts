/** Schematic prostate teaching axes, never patient or DICOM coordinates. */
export type OrientationQuaternion = { x: number; y: number; z: number; w: number };
export type ProstateOrientationMarker = {
  label: 'R' | 'L' | 'S' | 'I' | 'A' | 'P';
  name: string;
  x: number;
  y: number;
  depth: number;
};

const axes = [
  { label: 'R', name: 'Right', vector: [-1, 0, 0] },
  { label: 'L', name: 'Left', vector: [1, 0, 0] },
  { label: 'S', name: 'Superior', vector: [0, 1, 0] },
  { label: 'I', name: 'Inferior', vector: [0, -1, 0] },
  { label: 'A', name: 'Anterior', vector: [0, 0, 1] },
  { label: 'P', name: 'Posterior', vector: [0, 0, -1] },
] as const;

/** Project fixed anatomical directions through the inverse camera rotation. */
export function projectProstateOrientation(q: OrientationQuaternion): readonly ProstateOrientationMarker[] | null {
  if (q == null || ![q.x, q.y, q.z, q.w].every(Number.isFinite)) return null;
  // Scaling before the norm avoids overflow for large finite quaternions.
  const scale = Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.z), Math.abs(q.w));
  if (scale === 0) return null;
  const sx = q.x / scale, sy = q.y / scale, sz = q.z / scale, sw = q.w / scale;
  const norm = Math.hypot(sx, sy, sz, sw);
  if (!Number.isFinite(norm) || norm === 0) return null;
  const x = -sx / norm, y = -sy / norm, z = -sz / norm, w = sw / norm;

  const candidates = axes.flatMap((axis, priority) => {
    const [vx, vy, vz] = axis.vector;
    // Quaternion-vector multiplication, with conjugated camera quaternion.
    const tx = 2 * (y * vz - z * vy);
    const ty = 2 * (z * vx - x * vz);
    const tz = 2 * (x * vy - y * vx);
    const cx = vx + w * tx + y * tz - z * ty;
    const cy = vy + w * ty + z * tx - x * tz;
    const cz = vz + w * tz + x * ty - y * tx;
    if (Math.hypot(cx, cy) < 0.3) return [];
    return [{ label: axis.label, name: axis.name, x: 42 + 26 * cx,
      y: 42 - 26 * cy, depth: cz, priority }];
  });

  // Keep the nearer centre when projected labels would collide. Fixed axis
  // priority makes exact-depth ties stable without changing anatomical names.
  candidates.sort((a, b) => b.depth - a.depth || a.priority - b.priority);
  const kept: typeof candidates = [];
  for (const candidate of candidates) {
    if (kept.every(marker => Math.hypot(marker.x - candidate.x, marker.y - candidate.y) >= 12)) {
      kept.push(candidate);
    }
  }
  kept.sort((a, b) => a.depth - b.depth || a.priority - b.priority);
  return kept.map(({ priority: _priority, ...marker }) => marker);
}
