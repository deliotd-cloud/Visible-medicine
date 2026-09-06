import { Box3, Vector3 } from 'three';

/** @typedef {[number, number, number]} Vec3 */
/** @typedef {{min: Vec3, max: Vec3}} Bounds */

/** Stable, reversible centroid expansion; changes placement, never mesh vertices.
 * @param {Vec3} center @param {Vector3} origin @param {number} amount @param {boolean} anchored
 */
export function bodyOffset(center, origin, amount, anchored = false) {
  return new Vector3(...center)
    .sub(origin)
    .multiplyScalar(anchored ? 0 : Math.min(100, Math.max(0, amount)) * 0.016);
}
export const shoulderDirections = {
  scapula: [0.4, 0, -0.3],
  humerus: [-1.6, -0.7, 0],
  clavicle: [0.2, 1.4, 0.4],
  supraspinatus: [0, 1.15, -0.55],
  infraspinatus: [0.1, 0, -1.7],
  subscapularis: [0.3, 0, 1.7],
  'teres-minor': [-0.7, -0.4, -1.5],
  deltoid: [-2, 0.2, 0],
  'biceps-long-head': [-0.9, -0.15, 1.5],
};
/** @param {string} slug @param {number} amount @param {boolean} anchored */
export function shoulderOffset(slug, amount, anchored = false) {
  return new Vector3(...(shoulderDirections[slug] ?? [0, 0, 0])).multiplyScalar(
    anchored ? 0 : Math.min(100, Math.max(0, amount)) * 0.026,
  );
}
/** @param {Bounds} bounds @param {Vector3} offset */
export function translatedBox(bounds, offset = new Vector3()) {
  return new Box3(
    new Vector3(...bounds.min),
    new Vector3(...bounds.max),
  ).translate(offset);
}
/** Fit actual bounds in any orbit orientation; padding reserves label/toolbar space.
 * @param {Box3} bounds @param {Vector3} direction @param {Vector3} up @param {number} aspect @param {number} fov
 */
export function fitBounds(bounds, direction, up, aspect, fov = 38) {
  const center = bounds.getCenter(new Vector3()),
    forward = direction.clone().normalize();
  const right = new Vector3().crossVectors(up, forward).normalize();
  if (right.lengthSq() < 0.001) right.set(1, 0, 0);
  const vertical = new Vector3().crossVectors(forward, right).normalize();
  const tan = Math.tan((fov * Math.PI) / 360);
  let distance = 0.5,
    halfHeight = 0.3;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const p = new Vector3(x, y, z).sub(center),
          depth = p.dot(forward);
        const height =
          Math.max(
            Math.abs(p.dot(vertical)),
            Math.abs(p.dot(right)) / Math.max(0.1, aspect),
          ) / 0.7;
        halfHeight = Math.max(halfHeight, height);
        distance = Math.max(distance, depth + height / tan);
      }
  return { center, distance: distance + 0.2, halfHeight };
}
