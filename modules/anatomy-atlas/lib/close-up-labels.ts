import type { BufferGeometry } from 'three';
import type { SelectionBounds } from './selection-visibility';

/** Keep a close-up leader on an actual source vertex, never a clamped point
 * in empty space. This is a display anchor, not a named anatomical landmark. */
export function closeUpLabelAnchor(
  geometry: BufferGeometry,
  original: [number, number, number],
  bounds?: SelectionBounds | null,
): [number, number, number] | null {
  if (!bounds) return original;
  const inside = (p: number[]) => p.every((v, i) => Number.isFinite(v) && v >= bounds.min[i] && v <= bounds.max[i]);
  if (inside(original)) return original;
  const positions = geometry.getAttribute('position');
  if (!positions) return null;
  const center = bounds.min.map((v, i) => (v + bounds.max[i]) / 2);
  let distance = Infinity, best: [number, number, number] | null = null;
  for (let i = 0; i < positions.count; i++) {
    const point: [number, number, number] = [positions.getX(i), positions.getY(i), positions.getZ(i)];
    if (!inside(point)) continue;
    const next = point.reduce((sum, v, axis) => sum + (v - center[axis]) ** 2, 0);
    if (next < distance) { distance = next; best = point; }
  }
  return best;
}
