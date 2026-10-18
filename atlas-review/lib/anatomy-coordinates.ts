/** Reference anatomy only. These coordinates do not identify a patient frame. */
export const REFERENCE_FRAME = 'bodyparts3d:4.0:lps-mm' as const;
export type Point3 = [number, number, number];
export type SourceCoordinates = {
  sourceToSceneColumnMajor: number[];
  unitsPerMillimetre: number;
};
export function finitePoint(value: unknown): value is Point3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (v) =>
        typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1_000_000,
    )
  );
}
export function referenceTransform(coordinates: SourceCoordinates) {
  const m = coordinates.sourceToSceneColumnMajor;
  if (
    !Array.isArray(m) ||
    m.length !== 16 ||
    !m.every(Number.isFinite) ||
    m[3] !== 0 ||
    m[7] !== 0 ||
    m[11] !== 0 ||
    m[15] !== 1 ||
    !Number.isFinite(coordinates.unitsPerMillimetre) ||
    coordinates.unitsPerMillimetre <= 0
  )
    throw new Error('Invalid reference-coordinate transform');
  const [a, b, c, d, e, f, g, h, i] = [
    m[0],
    m[4],
    m[8],
    m[1],
    m[5],
    m[9],
    m[2],
    m[6],
    m[10],
  ];
  const determinant =
    a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (!Number.isFinite(determinant) || determinant <= 1e-12)
    throw new Error('Singular or reflected reference-coordinate transform');
  // Current source transforms must be a rigid rotation plus uniform positive scale.
  const scale = coordinates.unitsPerMillimetre;
  const columns = [
    [a, d, g],
    [b, e, h],
    [c, f, i],
  ];
  for (let x = 0; x < 3; x++)
    for (let y = 0; y < 3; y++) {
      const dot = columns[x].reduce((sum, n, k) => sum + n * columns[y][k], 0);
      if (Math.abs(dot / (scale * scale) - (x === y ? 1 : 0)) > 1e-8)
        throw new Error('Source scale/rotation metadata disagree');
    }
  const inverse = [
    e * i - f * h,
    c * h - b * i,
    b * f - c * e,
    f * g - d * i,
    a * i - c * g,
    c * d - a * f,
    d * h - e * g,
    b * g - a * h,
    a * e - b * d,
  ].map((v) => v / determinant);
  const check = (point: Point3) => {
    if (!finitePoint(point)) throw new Error('Invalid reference point');
  };
  return {
    toScene(point: Point3): Point3 {
      check(point);
      return [
        a * point[0] + b * point[1] + c * point[2] + m[12],
        d * point[0] + e * point[1] + f * point[2] + m[13],
        g * point[0] + h * point[1] + i * point[2] + m[14],
      ];
    },
    toReference(assembledScenePoint: Point3): Point3 {
      check(assembledScenePoint);
      const p = assembledScenePoint.map((v, k) => v - m[12 + k]);
      return [0, 1, 2].map(
        (row) =>
          inverse[row * 3] * p[0] +
          inverse[row * 3 + 1] * p[1] +
          inverse[row * 3 + 2] * p[2],
      ) as Point3;
    },
  };
}
