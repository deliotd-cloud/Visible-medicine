import { Matrix4, Quaternion, Vector3 } from 'three';

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
  // Interpolate one rigid camera frame. Independently rotating radial and up
  // vectors makes them parallel during superior ↔ inferior sweeps, producing
  // a lookAt singularity and visible roll/flip. A unit quaternion preserves an
  // orthogonal frame, including rolled starting views and antipodal presets.
  const orientation = (pose: TourCameraPose) => new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(pose.position, pose.target, pose.up),
  );
  const rotation = orientation(from).slerp(orientation(to), eased);
  const direction = new Vector3(0, 0, 1).applyQuaternion(rotation);
  const target = from.target.clone().lerp(to.target, eased);
  const up = new Vector3(0, 1, 0).applyQuaternion(rotation);
  return { position: target.clone().addScaledVector(direction, radius), target, up };
}
