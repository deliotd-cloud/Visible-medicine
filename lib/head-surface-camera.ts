import type { OrbitControls } from 'three-stdlib';

export type HeadSurfaceCameraAction =
  | 'rotate-left' | 'rotate-right' | 'tilt-up' | 'tilt-down'
  | 'zoom-in' | 'zoom-out';

export type HeadSurfaceCameraControls = Pick<OrbitControls,
  'enabled' | 'enableRotate' | 'enableZoom' | 'object' | 'target' |
  'minDistance' | 'maxDistance' | 'minPolarAngle' | 'maxPolarAngle' |
  'minAzimuthAngle' | 'maxAzimuthAngle' | 'getDistance' |
  'getPolarAngle' | 'getAzimuthalAngle' | 'setPolarAngle' |
  'setAzimuthalAngle' | 'dollyIn' | 'dollyOut'>;

const STEP = Math.PI / 12;
const POLE_MARGIN = 1e-4;
const ZOOM_FACTOR = 0.85;

function finiteVector(point: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

/** A single bounded camera action. The caller owns the live controls and renderer lifecycle. */
export function moveHeadSurfaceCamera(
  controls: HeadSurfaceCameraControls | null | undefined,
  action: HeadSurfaceCameraAction,
): boolean {
  if (!controls || !controls.enabled ||
      !['rotate-left', 'rotate-right', 'tilt-up', 'tilt-down', 'zoom-in', 'zoom-out'].includes(action) ||
      !controls.object || !controls.target ||
      !finiteVector(controls.object.position) || !finiteVector(controls.target) ||
      !Number.isFinite(controls.object.zoom) || controls.object.zoom <= 0) return false;

  const distance = controls.getDistance();
  const polar = controls.getPolarAngle();
  const azimuth = controls.getAzimuthalAngle();
  if (!Number.isFinite(distance) || distance <= 0 ||
      !Number.isFinite(polar) || !Number.isFinite(azimuth) ||
      !Number.isFinite(controls.minDistance) || controls.minDistance < 0 ||
      Number.isNaN(controls.maxDistance) || controls.maxDistance < controls.minDistance ||
      !Number.isFinite(controls.minPolarAngle) || !Number.isFinite(controls.maxPolarAngle) ||
      controls.minPolarAngle < 0 || controls.maxPolarAngle > Math.PI ||
      controls.maxPolarAngle < controls.minPolarAngle ||
      Number.isNaN(controls.minAzimuthAngle) || Number.isNaN(controls.maxAzimuthAngle) ||
      controls.minAzimuthAngle === Infinity || controls.maxAzimuthAngle === -Infinity ||
      controls.maxAzimuthAngle < controls.minAzimuthAngle) return false;

  if (action === 'rotate-left' || action === 'rotate-right') {
    if (!controls.enableRotate) return false;
    const delta = action === 'rotate-left' ? -STEP : STEP;
    const next = Math.max(controls.minAzimuthAngle,
      Math.min(controls.maxAzimuthAngle, azimuth + delta));
    if (Math.abs(next - azimuth) < 1e-12) return false;
    controls.setAzimuthalAngle(next);
    return true;
  }

  if (action === 'tilt-up' || action === 'tilt-down') {
    if (!controls.enableRotate) return false;
    const lower = Math.max(controls.minPolarAngle, POLE_MARGIN);
    const upper = Math.min(controls.maxPolarAngle, Math.PI - POLE_MARGIN);
    if (lower > upper) return false;
    const delta = action === 'tilt-up' ? -STEP : STEP;
    const next = Math.max(lower, Math.min(upper, polar + delta));
    if (Math.abs(next - polar) < 1e-12) return false;
    controls.setPolarAngle(next);
    return true;
  }

  if (!controls.enableZoom) return false;
  const desired = action === 'zoom-in' ? distance * ZOOM_FACTOR : distance / ZOOM_FACTOR;
  if (!Number.isFinite(desired)) return false;
  const next = Math.max(controls.minDistance, Math.min(controls.maxDistance, desired));
  if (Math.abs(next - distance) < 1e-12) return false;
  if (action === 'zoom-in') controls.dollyIn(ZOOM_FACTOR);
  else controls.dollyOut(ZOOM_FACTOR);
  return true;
}
