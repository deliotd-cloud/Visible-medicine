import { Box3, Vector3 } from 'three';
import { bodyOffset } from './explode-layout.mjs';

/** Derive a stable display-only gain from the complete source frame. */
export function bodySpreadScale(frame: Box3): Vector3 {
  if (frame.isEmpty()) return new Vector3(1, 1, 1);
  const size = frame.getSize(new Vector3());
  if (![size.x, size.y, size.z].every((value) => Number.isFinite(value) && value > 0))
    return new Vector3(1, 1, 1);
  const longest = Math.max(size.x, size.y, size.z);
  return new Vector3(
    Math.min(3, Math.max(1, longest / size.x)),
    Math.min(3, Math.max(1, longest / size.y)),
    Math.min(3, Math.max(1, longest / size.z)),
  );
}

/** Scale only the reversible spatial translation; never transform source geometry. */
export function bodySpreadOffset(
  center: [number, number, number],
  origin: Vector3,
  amount: number,
  anchored: boolean,
  scale: Vector3,
): Vector3 {
  const finiteAmount = Number.isFinite(amount) ? Math.max(0, Math.min(100, amount)) : 0;
  if (anchored || finiteAmount === 0) return new Vector3();
  const offset = bodyOffset(center, origin, finiteAmount);
  const safeScale = [scale.x, scale.y, scale.z].every((value) => Number.isFinite(value) && value >= 1 && value <= 3)
    ? scale : new Vector3(1, 1, 1);
  return offset.multiply(safeScale);
}
