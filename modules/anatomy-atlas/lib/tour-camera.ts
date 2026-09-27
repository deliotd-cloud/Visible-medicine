import { Quaternion, Vector3 } from 'three';

export type TourCameraPose = { position: Vector3; target: Vector3; up: Vector3 };

/** Orbit around the anatomy, never interpolate straight through it. */
export function interpolateTourCamera(from: TourCameraPose, to: TourCameraPose, progress: number): TourCameraPose {
  const t = Math.max(0, Math.min(1, progress));
  if (t === 0) return { position: from.position.clone(), target: from.target.clone(), up: from.up.clone() };
  if (t === 1) return { position: to.position.clone(), target: to.target.clone(), up: to.up.clone() };
  // Quintic easing has zero velocity AND acceleration at both ends, avoiding
  // the perceptible acceleration snap of a cubic ease when the camera rests.
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  const a = from.position.clone().sub(from.target);
  const b = to.position.clone().sub(to.target);
  const radius = a.length() * (1 - eased) + b.length() * eased;
  const rotation = new Quaternion().setFromUnitVectors(a.normalize(), b.normalize());
  const direction = a.applyQuaternion(new Quaternion().slerp(rotation, eased));
  const target = from.target.clone().lerp(to.target, eased);
  // Tour presets share world-up; also handle an imported rolled starting view.
  const upRotation = new Quaternion().setFromUnitVectors(from.up.clone().normalize(), to.up.clone().normalize());
  const up = from.up.clone().normalize().applyQuaternion(new Quaternion().slerp(upRotation, eased));
  return { position: target.clone().addScaledVector(direction, radius), target, up };
}
