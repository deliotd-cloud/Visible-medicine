import { Box3, Matrix4, Triangle, Vector3 } from 'three';
export const shapeCriteria = {
  samples: 128,
  nearMm: 0.1,
  fraction: 0.95,
  maxMm: 0.3,
  extentAbsoluteFloorMm: 0.5,
  extentRelativeTolerance: 0.08,
  extentAbsoluteCapMm: 3,
};
export function prepareShape(vertices, faces) {
  if (
    !vertices.length ||
    !faces.length ||
    !vertices.every((v) => v.length === 3 && v.every(Number.isFinite))
  )
    throw Error('Non-finite or empty surface');
  const bounds = new Box3();
  for (const vertex of vertices) bounds.expandByPoint(new Vector3(...vertex));
  const triangles = faces.map((face) => {
    if (
      face.length !== 3 ||
      face.some((i) => !Number.isInteger(i) || i < 0 || i >= vertices.length)
    )
      throw Error('Invalid triangle');
    const triangle = new Triangle(
      ...face.map((i) => new Vector3(...vertices[i])),
    );
    return { triangle, degenerate: triangle.getArea() <= 1e-10 };
  });
  return {
    vertices,
    faces,
    triangles,
    min: bounds.min.toArray(),
    max: bounds.max.toArray(),
    centre: bounds.getCenter(new Vector3()).toArray(),
    extent: bounds.getSize(new Vector3()).toArray(),
  };
}
export function meshSourceShape(mesh, sourceToScene) {
  const matrix = new Matrix4()
    .fromArray(sourceToScene)
    .invert()
    .multiply(mesh.matrixWorld);
  const p = mesh.geometry.attributes.position,
    index = mesh.geometry.index;
  const vertices = Array.from({ length: p.count }, (_, i) =>
    new Vector3().fromBufferAttribute(p, i).applyMatrix4(matrix).toArray(),
  );
  const count = index?.count ?? p.count;
  if (count % 3) throw Error('Non-triangular mesh');
  const faces = Array.from({ length: count / 3 }, (_, i) =>
    [0, 1, 2].map((k) => (index ? index.getX(i * 3 + k) : i * 3 + k)),
  );
  return prepareShape(vertices, faces);
}
export function shapeCandidate(a, b) {
  return a.extent.every(
    (value, k) =>
      Math.abs(value - b.extent[k]) <=
      Math.max(
        shapeCriteria.extentAbsoluteFloorMm,
        Math.min(
          shapeCriteria.extentAbsoluteCapMm,
          Math.max(value, b.extent[k]) * shapeCriteria.extentRelativeTolerance,
        ),
      ),
  );
}
function segmentSquared(p, a, b) {
  const line = new Vector3().subVectors(b, a);
  const length = line.lengthSq();
  const t = length
    ? Math.max(
        0,
        Math.min(1, new Vector3().subVectors(p, a).dot(line) / length),
      )
    : 0;
  return p.distanceToSquared(line.multiplyScalar(t).add(a));
}
function distances(a, b, translation) {
  const values = [],
    point = new Vector3(),
    closest = new Vector3();
  for (
    let i = 0;
    i < a.vertices.length;
    i += Math.max(1, Math.ceil(a.vertices.length / shapeCriteria.samples))
  ) {
    point.fromArray(a.vertices[i]).add(new Vector3(...translation));
    let minimum = Infinity;
    for (const { triangle, degenerate } of b.triangles) {
      let d = degenerate
        ? NaN
        : point.distanceToSquared(triangle.closestPointToPoint(point, closest));
      if (!Number.isFinite(d))
        d = Math.min(
          segmentSquared(point, triangle.a, triangle.b),
          segmentSquared(point, triangle.b, triangle.c),
          segmentSquared(point, triangle.c, triangle.a),
        );
      minimum = Math.min(minimum, d);
    }
    if (!Number.isFinite(minimum)) throw Error('Non-finite shape distance');
    values.push(Math.sqrt(minimum));
  }
  values.sort((a, b) => a - b);
  return {
    samples: values.length,
    withinTenthMm: values.filter((v) => v <= shapeCriteria.nearMm).length,
    medianMm: values[Math.floor(values.length / 2)],
    maxMm: values.at(-1),
  };
}
export function compareTranslatedShape(a, b) {
  const translation = b.centre.map((value, k) => value - a.centre[k]);
  const ab = distances(a, b, translation),
    ba = distances(
      b,
      a,
      translation.map((v) => -v),
    );
  const similar = [ab, ba].every(
    (d) =>
      d.withinTenthMm / d.samples >= shapeCriteria.fraction &&
      d.maxMm <= shapeCriteria.maxMm,
  );
  return {
    diagnosticTranslationMm: translation,
    aToAlignedB: ab,
    alignedBToA: ba,
    similar,
  };
}
