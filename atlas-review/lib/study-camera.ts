import { Box3, Vector3, PerspectiveCamera, OrthographicCamera } from 'three';
import { fitBounds } from './explode-layout.mjs';
import { validStudyCamera, type StudyCamera } from './study-views';

export function relativeStudyScale(
  camera: PerspectiveCamera | OrthographicCamera,
  target: Vector3,
  fitDistance: number,
  fitHalfHeight: number,
) {
  return camera instanceof OrthographicCamera
    ? (camera.top - camera.bottom) / (2 * camera.zoom * fitHalfHeight)
    : camera.position.distanceTo(target) / fitDistance;
}

export function planarStudyCamera(
  pose: StudyCamera,
  direction: number[],
  up: number[],
): StudyCamera {
  return {
    ...pose,
    direction: new Vector3(...direction).normalize().toArray(),
    up: new Vector3(...up).normalize().toArray(),
  };
}

export function captureStudyCamera(
  camera: PerspectiveCamera | OrthographicCamera,
  target: Vector3,
  bounds: Box3,
  aspect: number,
): StudyCamera | null {
  const direction = camera.position.clone().sub(target).normalize();
  const up = camera.up.clone().normalize();
  const fit = fitBounds(
    bounds,
    direction,
    up,
    aspect,
    camera instanceof PerspectiveCamera ? camera.fov : 39,
  );
  const pose: StudyCamera = {
    direction: direction.toArray(),
    up: up.toArray(),
    pan: target.clone().sub(fit.center).toArray(),
    scale: relativeStudyScale(camera, target, fit.distance, fit.halfHeight),
  };
  return validStudyCamera(pose) ? pose : null;
}

/** Preserve relative framing while adapting a saved view to the current viewport aspect. */
export function restoreStudyCamera(
  camera: PerspectiveCamera | OrthographicCamera,
  bounds: Box3,
  aspect: number,
  pose: StudyCamera,
) {
  if (!validStudyCamera(pose)) throw new Error('Invalid study camera');
  const direction = new Vector3(...pose.direction).normalize();
  camera.up.fromArray(pose.up).normalize();
  const fit = fitBounds(
    bounds,
    direction,
    camera.up,
    aspect,
    camera instanceof PerspectiveCamera ? camera.fov : 39,
  );
  const target = fit.center.clone().add(new Vector3(...pose.pan));
  const distance =
    camera instanceof OrthographicCamera
      ? fit.distance
      : fit.distance * pose.scale;
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  if (camera instanceof OrthographicCamera) {
    const height = fit.halfHeight * pose.scale;
    camera.zoom = 1;
    camera.left = -height * aspect;
    camera.right = height * aspect;
    camera.top = height;
    camera.bottom = -height;
  }
  camera.near = 0.01;
  camera.far = Math.max(
    150,
    distance + bounds.getSize(new Vector3()).length() * 4,
  );
  camera.updateProjectionMatrix();
  return { target, fitDistance: fit.distance, fitHalfHeight: fit.halfHeight };
}
