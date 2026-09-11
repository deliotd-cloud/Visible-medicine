import type { ImagePlane } from './imaging-comparison';

export type Vec3 = readonly [number, number, number];
export type ScalarVolume = {
  /** Borrowed immutable buffer: already decoded/rescaled, padding replaced by NaN. i is fastest, then j, then k. */
  values: Int16Array | Uint16Array | Float32Array;
  dimensions: Vec3;
  originLps: Vec3;
  /** Millimetre displacement of one i, j or k step, in patient LPS. */
  stepsLps: readonly [Vec3, Vec3, Vec3];
  units: 'HU' | 'relative';
};
export type ImageWindow = {
  center: number;
  width: number;
  function: 'LINEAR' | 'LINEAR_EXACT';
  inverted: boolean;
};
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const scale = (a: Vec3, n: number): Vec3 => [a[0] * n, a[1] * n, a[2] * n];
const length = (v: Vec3) => Math.sqrt(dot(v, v));
const vector = (v: Vec3) =>
  Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
export type PreparedVolume = ReturnType<typeof prepareVolume>;

/** Uniform affine grid only. DICOM decoding/stack assembly and rights review are upstream. */
export function prepareVolume(input: ScalarVolume) {
  if (
    !['HU', 'relative'].includes(input.units) ||
    !vector(input.dimensions) ||
    !input.dimensions.every(
      (v) => Number.isInteger(v) && v >= 1 && v <= 4096,
    ) ||
    !vector(input.originLps) ||
    input.originLps.some((n) => Math.abs(n) > 1e7) ||
    !Array.isArray(input.stepsLps) ||
    input.stepsLps.length !== 3 ||
    !input.stepsLps.every(vector) ||
    ![Int16Array, Uint16Array, Float32Array].some(
      (type) => input.values instanceof type,
    ) ||
    !(input.values.buffer instanceof ArrayBuffer) ||
    input.values.byteLength > 256 * 1024 * 1024 ||
    input.values.buffer.byteLength > 256 * 1024 * 1024 ||
    input.values.buffer.resizable ||
    input.values.length !== input.dimensions.reduce((a, b) => a * b, 1)
  )
    throw new Error('Invalid or oversized scalar volume');
  const steps = input.stepsLps.map(
    (v) => Object.freeze([...v]) as Vec3,
  ) as unknown as ScalarVolume['stepsLps'];
  const sizes = steps.map(length);
  const determinant = dot(steps[0], cross(steps[1], steps[2]));
  if (
    sizes.some((v) => v < 0.001 || v > 100) ||
    Math.abs(determinant) / sizes.reduce((a, b) => a * b, 1) < 1e-6
  )
    throw new Error('Singular or unsupported volume geometry');
  const inverse = [
    cross(steps[1], steps[2]),
    cross(steps[2], steps[0]),
    cross(steps[0], steps[1]),
  ].map((v) =>
    Object.freeze(scale(v, 1 / determinant)),
  ) as unknown as readonly [Vec3, Vec3, Vec3];
  const origin = Object.freeze([...input.originLps]) as Vec3;
  const dimensions = Object.freeze([...input.dimensions]) as Vec3;
  const indexToLps = (index: Vec3): Vec3 =>
    [0, 1, 2].map(
      (axis) =>
        origin[axis] +
        index.reduce((sum, value, k) => sum + steps[k][axis] * value, 0),
    ) as unknown as Vec3;
  const lpsToIndex = (point: Vec3): Vec3 => {
    const delta: Vec3 = [
      point[0] - origin[0],
      point[1] - origin[1],
      point[2] - origin[2],
    ];
    return inverse.map((row) => dot(row, delta)) as unknown as Vec3;
  };
  const corners: Vec3[] = [];
  for (const i of [-0.5, dimensions[0] - 0.5])
    for (const j of [-0.5, dimensions[1] - 0.5])
      for (const k of [-0.5, dimensions[2] - 0.5])
        corners.push(Object.freeze(indexToLps([i, j, k])));
  return Object.freeze({
    values: input.values,
    dimensions,
    originLps: origin,
    stepsLps: Object.freeze(steps),
    inverse: Object.freeze(inverse),
    units: input.units,
    indexToLps,
    lpsToIndex,
    corners: Object.freeze(corners),
    nativeSpacing: Math.min(...sizes),
  });
}

const orientations = {
  axial: {
    u: [1, 0, 0],
    v: [0, 1, 0],
    normal: [0, 0, 1],
    labels: ['R', 'L', 'A', 'P'],
  },
  coronal: {
    u: [1, 0, 0],
    v: [0, 0, -1],
    normal: [0, 1, 0],
    labels: ['R', 'L', 'S', 'I'],
  },
  sagittal: {
    u: [0, 1, 0],
    v: [0, 0, -1],
    normal: [1, 0, 0],
    labels: ['A', 'P', 'S', 'I'],
  },
} as const;
for (const orientation of Object.values(orientations)) {
  Object.values(orientation).forEach(Object.freeze);
  Object.freeze(orientation);
}
Object.freeze(orientations);
export type ResliceGrid = ReturnType<typeof createResliceGrid>;
export function createResliceGrid(
  volume: PreparedVolume,
  plane: ImagePlane,
  maxPixels = 512,
) {
  if (
    !Object.hasOwn(orientations, plane) ||
    !Number.isInteger(maxPixels) ||
    maxPixels < 16 ||
    maxPixels > 1024
  )
    throw new Error('Invalid reslice plane or resolution');
  const { u, v, normal, labels } = orientations[plane];
  const bounds = [u, v, normal].map((basis) => {
    const projected = volume.corners.map((p) => dot(p, basis));
    return [Math.min(...projected), Math.max(...projected)];
  });
  const extent = bounds.map(([min, max]) => max - min);
  // Equal horizontal/vertical millimetres per pixel prevent anatomical stretching.
  const spacingAlong = (axis: Vec3) =>
    1 / Math.hypot(...volume.inverse.map((row) => dot(row, axis)));
  const pixelSpacing = Math.max(
    Math.min(spacingAlong(u), spacingAlong(v)),
    extent[0] / maxPixels,
    extent[1] / maxPixels,
  );
  const width = Math.max(1, Math.ceil(extent[0] / pixelSpacing - 1e-10));
  const height = Math.max(1, Math.ceil(extent[1] / pixelSpacing - 1e-10));
  const sliceCount = Math.min(
    10000,
    Math.max(1, Math.ceil(extent[2] / spacingAlong(normal) - 1e-10)),
  );
  const sliceSpacing = extent[2] / sliceCount;
  const startU = (bounds[0][0] + bounds[0][1] - (width - 1) * pixelSpacing) / 2;
  const startV =
    (bounds[1][0] + bounds[1][1] - (height - 1) * pixelSpacing) / 2;
  const startN = bounds[2][0] + sliceSpacing / 2;
  const point = (x: number, y: number, slice: number): Vec3 =>
    [0, 1, 2].map(
      (axis) =>
        u[axis] * (startU + x * pixelSpacing) +
        v[axis] * (startV + y * pixelSpacing) +
        normal[axis] * (startN + slice * sliceSpacing),
    ) as unknown as Vec3;
  const sliceForPoint = (p: Vec3) =>
    Math.min(
      sliceCount - 1,
      Math.max(0, Math.round((dot(p, normal) - startN) / sliceSpacing)),
    );
  return Object.freeze({
    plane,
    width,
    height,
    sliceCount,
    pixelSpacing,
    sliceSpacing,
    u,
    v,
    normal,
    labels,
    point,
    sliceForPoint,
  });
}

/** Values outside voxel support, or interpolating missing (NaN) data, are absent. */
export function sampleTrilinear(
  volume: PreparedVolume,
  i: number,
  j: number,
  k: number,
): number | null {
  const d = volume.dimensions;
  if (
    !Number.isFinite(i) ||
    !Number.isFinite(j) ||
    !Number.isFinite(k) ||
    i < -0.5 ||
    j < -0.5 ||
    k < -0.5 ||
    i >= d[0] - 0.5 ||
    j >= d[1] - 0.5 ||
    k >= d[2] - 0.5
  )
    return null;
  i = Math.min(d[0] - 1, Math.max(0, i));
  j = Math.min(d[1] - 1, Math.max(0, j));
  k = Math.min(d[2] - 1, Math.max(0, k));
  const i0 = Math.floor(i),
    j0 = Math.floor(j),
    k0 = Math.floor(k);
  const i1 = Math.min(d[0] - 1, i0 + 1),
    j1 = Math.min(d[1] - 1, j0 + 1),
    k1 = Math.min(d[2] - 1, k0 + 1);
  const fi = i - i0,
    fj = j - j0,
    fk = k - k0;
  let result = 0;
  for (let z = 0; z < 2; z++)
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < 2; x++) {
        const weight =
          (x ? fi : 1 - fi) * (y ? fj : 1 - fj) * (z ? fk : 1 - fk);
        if (!weight) continue;
        const value =
          volume.values[
            (z ? k1 : k0) * d[0] * d[1] + (y ? j1 : j0) * d[0] + (x ? i1 : i0)
          ];
        if (!Number.isFinite(value)) return null;
        result += weight * value;
      }
  return result;
}
export function validateWindow(window: ImageWindow) {
  if (
    !Number.isFinite(window.center) ||
    !Number.isFinite(window.width) ||
    !['LINEAR', 'LINEAR_EXACT'].includes(window.function) ||
    typeof window.inverted !== 'boolean' ||
    window.width < (window.function === 'LINEAR' ? 1 : Number.MIN_VALUE)
  )
    throw new Error('Invalid image window');
}
/** DICOM PS3.3 C.11.2.1.2 LINEAR / C.11.2.1.3 LINEAR_EXACT, after modality rescale. */
export function windowIntensity(value: number, window: ImageWindow) {
  validateWindow(window);
  if (!Number.isFinite(value)) throw new Error('Non-finite intensity');
  return windowPixel(value, window);
}
function windowPixel(value: number, window: ImageWindow) {
  const centre = window.center - (window.function === 'LINEAR' ? 0.5 : 0);
  const width = window.width - (window.function === 'LINEAR' ? 1 : 0);
  const fraction =
    width === 0
      ? value <= centre
        ? 0
        : 1
      : Math.max(0, Math.min(1, (value - centre) / width + 0.5));
  return Math.round(255 * (window.inverted ? 1 - fraction : fraction));
}
export function renderReslice(
  volume: PreparedVolume,
  grid: ResliceGrid,
  slice: number,
  window: ImageWindow,
) {
  validateWindow(window);
  if (!Number.isInteger(slice) || slice < 0 || slice >= grid.sliceCount)
    throw new Error('Slice outside volume');
  const rgba = new Uint8ClampedArray(grid.width * grid.height * 4);
  const first = volume.lpsToIndex(grid.point(0, 0, slice));
  const dx = volume.inverse.map((row) => dot(row, grid.u) * grid.pixelSpacing);
  const dy = volume.inverse.map((row) => dot(row, grid.v) * grid.pixelSpacing);
  for (let y = 0; y < grid.height; y++)
    for (let x = 0; x < grid.width; x++) {
      const value = sampleTrilinear(
        volume,
        first[0] + dx[0] * x + dy[0] * y,
        first[1] + dx[1] * x + dy[1] * y,
        first[2] + dx[2] * x + dy[2] * y,
      );
      const offset = (y * grid.width + x) * 4;
      if (value !== null)
        rgba[offset] =
          rgba[offset + 1] =
          rgba[offset + 2] =
            windowPixel(value, window);
      rgba[offset + 3] = 255;
    }
  return rgba;
}
