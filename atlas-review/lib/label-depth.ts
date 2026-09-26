import {
  BatchedMesh, Mesh, Raycaster, Vector2, Vector3,
  type Camera, type Object3D, type Intersection, type Plane,
} from 'three';

/** Tag only rendered anatomical surfaces, never contours or origin guides. */
export const labelDepthSurface = { atlasLabelSurface: true };
export type LabelDepth = 'covered' | 'uncovered' | 'unknown';
export const coveredLabelDescription =
  'The label anchor is behind other opaque tissue in this view. Rotate, isolate or fade other structures to inspect it.';

/** A single selected anchor, not a claim about visibility of the whole structure.
 * The caller updates world matrices once. Real triangle hits are required;
 * bounds alone never establish coverage. The selected structure's subtree is
 * excluded, avoiding self-surface noise. Batches use the native geometry raycast
 * because non-pickable context instances still cover anatomy visually.
 */
export function createLabelDepthProbe() {
  const raycaster = new Raycaster(), projected = new Vector3();
  const nearPoint = new Vector3(), screen = new Vector2();
  const hits: Intersection[] = [];
  return (scene: Object3D, camera: Camera, anchor: Vector3, ownRoot: Object3D): LabelDepth => {
    if (!anchor.toArray().every(Number.isFinite)) return 'unknown';
    projected.copy(anchor).project(camera);
    if (!projected.toArray().every(Number.isFinite) || Math.abs(projected.z) >= 1 ||
        Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1) return 'unknown';
    raycaster.setFromCamera(screen.set(projected.x, projected.y), camera);
    nearPoint.set(projected.x, projected.y, -1).unproject(camera);
    raycaster.near = Math.max(0, nearPoint.sub(raycaster.ray.origin).dot(raycaster.ray.direction));
    const distance = projected.copy(anchor).sub(raycaster.ray.origin).dot(raycaster.ray.direction);
    raycaster.far = distance - Math.max(1e-7, distance * 1e-6);
    if (raycaster.far <= raycaster.near) return 'unknown';
    let covered = false, failed = false;
    scene.traverseVisible((object) => {
      if (covered || !(object instanceof Mesh) || !object.userData.atlasLabelSurface ||
          !object.layers.test(camera.layers)) return;
      for (let parent: Object3D | null = object; parent; parent = parent.parent)
        if (parent === ownRoot) return;
      const material = object.material;
      if (Array.isArray(material)) { failed = true; return; }
      if (!material.visible || material.opacity !== 1 || material.transparent ||
          !material.depthWrite || !material.colorWrite || ('wireframe' in material && material.wireframe)) return;
      hits.length = 0;
      try {
        if (object instanceof BatchedMesh) BatchedMesh.prototype.raycast.call(object, raycaster, hits);
        else object.raycast(raycaster, hits); // Includes shader-section rejection.
        covered = hits.some(hit => hit.distance >= raycaster.near && hit.distance < raycaster.far &&
          (material.clippingPlanes ?? []).every((plane: Plane) => plane.distanceToPoint(hit.point) >= -1e-7));
      } catch { failed = true; }
    });
    return covered ? 'covered' : failed ? 'unknown' : 'uncovered';
  };
}
