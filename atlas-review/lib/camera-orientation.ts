import { referenceTransform, type SourceCoordinates } from './anatomy-coordinates.ts';

export type OrientationCode = 'A' | 'P' | 'L' | 'R' | 'S' | 'I';
export type OrientationBasis = number[][];
export const orientationWords: Record<OrientationCode, string> = {
  A: 'front', P: 'back', L: 'model-left', R: 'model-right', S: 'above', I: 'below',
};

/** Validated reference LPS axes expressed in scene coordinates. Translation is
 * deliberately excluded: pan, zoom and separated anatomy cannot change axes. */
export function orientationBasis(coordinates: SourceCoordinates): OrientationBasis | null {
  try {
    referenceTransform(coordinates);
    const m = coordinates.sourceToSceneColumnMajor;
    return [0, 4, 8].map((start) =>
      m.slice(start, start + 3).map((value) => value / coordinates.unitsPerMillimetre));
  } catch {
    return null;
  }
}

/** cameraFrom is the NEGATIVE of Camera.getWorldDirection(), not its position.
 * Broad sectors, not measured radiological angles. Hysteresis avoids flicker
 * near a sector boundary while a user slowly rotates the camera. */
export function cameraOrientation(
  cameraFrom: { x: number; y: number; z: number },
  basis: OrientationBasis | null,
  previous: readonly OrientationCode[] = [],
): OrientationCode[] {
  const values = [cameraFrom.x, cameraFrom.y, cameraFrom.z];
  const length = Math.hypot(...values);
  if (!basis || !values.every(Number.isFinite) || length < 1e-9) return [];
  const [left, posterior, superior] = basis.map((axis) =>
    axis.reduce((sum, value, i) => sum + value * values[i] / length, 0));
  const components: [number, OrientationCode, OrientationCode][] = [
    [-posterior, 'A', 'P'], [left, 'L', 'R'], [superior, 'S', 'I'],
  ];
  return components.flatMap(([value, positive, negative]) => {
    const code = value >= 0 ? positive : negative;
    return Math.abs(value) >= (previous.includes(code) ? 0.2 : 0.3) ? [code] : [];
  });
}

export function orientationText(codes: readonly OrientationCode[]) {
  return codes.length ? codes.map((code) => orientationWords[code]).join(' · ') : 'unavailable';
}
