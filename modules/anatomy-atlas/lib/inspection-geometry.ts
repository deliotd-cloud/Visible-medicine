import {
  Box3,
  Plane,
  Vector3,
  Mesh,
  type Raycaster,
  type Intersection,
  type Material,
} from 'three';
import {
  sectionAxes,
  sectionLevel,
  type InspectionState,
} from './inspection-state';

/** World-space plane, translated with a structure so explode preserves the assembled cut. */
export function sectionPlanes(
  bounds: Box3,
  state: InspectionState,
  offset = new Vector3(),
  selected = false,
): Plane[] {
  if (
    state.plane === 'off' ||
    bounds.isEmpty() ||
    (selected && state.keepSelectedUncut)
  )
    return [];
  const axis = sectionAxes[state.plane].axis;
  const level = sectionLevel(
    bounds.min.getComponent(axis),
    bounds.max.getComponent(axis),
    state.position,
  );
  const normal = new Vector3().setComponent(axis, state.flipped ? -1 : 1);
  return [
    new Plane(normal, -normal.getComponent(axis) * level - normal.dot(offset)),
  ];
}
export function pointRetained(point: Vector3 | number[], planes: Plane[]) {
  const p = point instanceof Vector3 ? point : new Vector3().fromArray(point);
  return planes.every((plane) => plane.distanceToPoint(p) >= -1e-7);
}
/** Update renderer-owned materials without rebuilding geometry or recompiling for slider movement. */
export function applyMaterialInspection(
  material: Material,
  planes: Plane[],
  opacity: number,
) {
  const transparent = opacity < 1;
  if (
    material.transparent !== transparent ||
    (material.clippingPlanes?.length ?? 0) !== planes.length
  )
    material.needsUpdate = true;
  material.opacity = opacity;
  material.transparent = transparent;
  material.depthWrite = !transparent;
  material.clippingPlanes = planes;
}
/** Three.js raycasting is geometric; explicitly reject hits on shader-clipped surfaces. */
export function clippedMeshRaycast(
  this: Mesh,
  raycaster: Raycaster,
  hits: Intersection[],
) {
  const material = this.material as Material;
  if (!material || Array.isArray(material) || material.opacity < 0.2) return;
  const candidates: Intersection[] = [];
  Mesh.prototype.raycast.call(this, raycaster, candidates);
  for (const hit of candidates)
    if (pointRetained(hit.point, material.clippingPlanes ?? [])) hits.push(hit);
}
