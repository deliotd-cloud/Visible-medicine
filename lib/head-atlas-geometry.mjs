/** Browser-safe geometry for a single native voxel grid in world RAS millimetres.
 * This module makes no claim that two acquisitions share a subject or registration.
 */
export class NativeVolumeGeometryError extends Error {
  constructor(message) { super(message); this.name = 'NativeVolumeGeometryError'; }
}

const fail = (message) => { throw new NativeVolumeGeometryError(message); };
const finite = (values, length, name) => {
  if (!Array.isArray(values) || values.length !== length || values.some(value => typeof value !== 'number' || !Number.isFinite(value))) fail(`${name} must contain ${length} finite numbers`);
  return values;
};

function shapeKJI(shape) {
  if (!Array.isArray(shape) || shape.length !== 3 || shape.some(value => !Number.isSafeInteger(value) || value < 1 || value > 65536)) fail('shape_kji must contain three positive bounded integer dimensions');
  if (shape[0] * shape[1] * shape[2] > 0x7fffffff) fail('volume dimensions exceed the supported voxel count');
  return [...shape];
}

function determinant3(a) {
  return a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
    - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
    + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
}

function inverse3(a, determinant) {
  return [
    [(a[1][1] * a[2][2] - a[1][2] * a[2][1]) / determinant, (a[0][2] * a[2][1] - a[0][1] * a[2][2]) / determinant, (a[0][1] * a[1][2] - a[0][2] * a[1][1]) / determinant],
    [(a[1][2] * a[2][0] - a[1][0] * a[2][2]) / determinant, (a[0][0] * a[2][2] - a[0][2] * a[2][0]) / determinant, (a[0][2] * a[1][0] - a[0][0] * a[1][2]) / determinant],
    [(a[1][0] * a[2][1] - a[1][1] * a[2][0]) / determinant, (a[0][1] * a[2][0] - a[0][0] * a[2][1]) / determinant, (a[0][0] * a[1][1] - a[0][1] * a[1][0]) / determinant],
  ];
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const axisName = ['R/L', 'A/P', 'S/I'];
const positiveName = ['R', 'A', 'S'];
const negativeName = ['L', 'P', 'I'];

/** Native (nearest voxel) screen maps. Unambiguous obliquity is disclosed;
 * these views do not resample into a true world-orthogonal plane. */
export function createNativeVolumeGeometry({ ijk_to_ras: affine, shape_kji: inputShape }) {
  const shape = shapeKJI(inputShape);
  if (!Array.isArray(affine) || affine.length !== 4) fail('ijk_to_ras must be a 4 x 4 matrix');
  const m = affine.map((row, index) => [...finite(row, 4, `ijk_to_ras row ${index}`)]);
  if (m[3][0] !== 0 || m[3][1] !== 0 || m[3][2] !== 0 || m[3][3] !== 1) fail('ijk_to_ras must have affine last row [0,0,0,1]');
  const basis = m.slice(0, 3).map(row => row.slice(0, 3));
  const columns = [0, 1, 2].map(axis => [basis[0][axis], basis[1][axis], basis[2][axis]]);
  const lengths = columns.map(column => Math.hypot(...column));
  if (lengths.some(length => !Number.isFinite(length) || length <= 1e-9)) fail('ijk_to_ras has a zero or invalid voxel axis');
  const units = columns.map((column, index) => column.map(value => value / lengths[index]));
  const determinant = determinant3(basis);
  if (!Number.isFinite(determinant) || Math.abs(determinant) / lengths.reduce((a, b) => a * b, 1) < 1e-6) fail('ijk_to_ras is singular or ill-conditioned');
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
    if (Math.abs(dot(units[a], units[b])) > 0.03) fail('ijk_to_ras is sheared; native plane labels would be misleading');
  }
  const dominant = units.map(column => {
    const weights = column.map(Math.abs);
    const axis = weights.indexOf(Math.max(...weights));
    // Native slices are not resampled. Require a unique anatomical-axis assignment
    // within 35 degrees (not near a 45-degree tie); actual compound directions
    // qualify the labels. This admits the approved 28-degree native CT grid.
    if (weights[axis] < Math.cos(35*Math.PI/180)) fail('ijk_to_ras is too oblique for unambiguous native plane labels');
    return axis;
  });
  if (new Set(dominant).size !== 3) fail('ijk_to_ras voxel axes have ambiguous world directions');
  const voxelForWorld = [0, 1, 2].map(world => dominant.indexOf(world));
  const oblique = units.some((column, voxel) => column.some((value, world) => world !== dominant[voxel] && Math.abs(value) > 1e-4));
  const inverse = inverse3(basis, determinant);
  const translation = [m[0][3], m[1][3], m[2][3]];
  const dimensionsIJK = [shape[2], shape[1], shape[0]];
  function directionLabel(vector) {
    return vector.map((value, axis) => ({value,axis})).filter(({value})=>Math.abs(value)>0.05)
      .sort((a,b)=>Math.abs(b.value)-Math.abs(a.value))
      .map(({value,axis})=>value>0?positiveName[axis]:negativeName[axis]).join('');
  }

  function ijkToRas(ijk) {
    const point = finite(ijk, 3, 'IJK point');
    return basis.map((row, axis) => dot(row, point) + translation[axis]);
  }
  function rasToIjk(ras) {
    const point = finite(ras, 3, 'RAS point');
    const delta = point.map((value, axis) => value - translation[axis]);
    return inverse.map(row => dot(row, delta));
  }
  function view(name, horizontalWorld, verticalWorld, sliceWorld, labels) {
    const horizontalVoxel = voxelForWorld[horizontalWorld];
    const verticalVoxel = voxelForWorld[verticalWorld];
    const sliceVoxel = voxelForWorld[sliceWorld];
    const width = dimensionsIJK[horizontalVoxel];
    const height = dimensionsIJK[verticalVoxel];
    const sliceCount = dimensionsIJK[sliceVoxel];
    const horizontalSign = Math.sign(units[horizontalVoxel][horizontalWorld]);
    const verticalSign = Math.sign(units[verticalVoxel][verticalWorld]);
    const sliceSign = Math.sign(units[sliceVoxel][sliceWorld]);
    return Object.freeze({
      name, width, height, sliceCount, oblique, fixedAxisIJK: sliceVoxel,
      pixelSpacing: Object.freeze([lengths[horizontalVoxel], lengths[verticalVoxel]]),
      sliceSpacing: lengths[sliceVoxel],
      directionLabels: Object.freeze({ ...labels,
        left:directionLabel(units[horizontalVoxel].map(v=>v*horizontalSign)),
        right:directionLabel(units[horizontalVoxel].map(v=>-v*horizontalSign)),
        top:directionLabel(units[verticalVoxel].map(v=>v*verticalSign)),
        bottom:directionLabel(units[verticalVoxel].map(v=>-v*verticalSign)),
        sliceStart:directionLabel(units[sliceVoxel].map(v=>-v)),
        sliceEnd:directionLabel(units[sliceVoxel]),
      }),
      /** Integer pixel and native slice indices. No interpolation or rounding. */
      pixelToIJK(x, y, slice) {
        if (![x, y, slice].every(Number.isSafeInteger) || x < 0 || x >= width || y < 0 || y >= height || slice < 0 || slice >= sliceCount) fail(`${name} pixel or slice is outside the native grid`);
        const ijk = [0, 0, 0];
        // All three requested screens run from positive RAS at left/top to negative at right/bottom.
        ijk[horizontalVoxel] = horizontalSign > 0 ? width - 1 - x : x;
        ijk[verticalVoxel] = verticalSign > 0 ? height - 1 - y : y;
        ijk[sliceVoxel] = slice;
        return ijk;
      },
      /** Exact inverse for native voxel crosshairs. */
      pixelFromIJK(ijk) {
        flattenKJI(ijk, shape);
        return {
          x: horizontalSign > 0 ? width - 1 - ijk[horizontalVoxel] : ijk[horizontalVoxel],
          y: verticalSign > 0 ? height - 1 - ijk[verticalVoxel] : ijk[verticalVoxel],
          slice: ijk[sliceVoxel],
        };
      },
    });
  }
  const views = Object.freeze({
    axial: view('axial', 0, 1, 2, { left: 'R', right: 'L', top: 'A', bottom: 'P' }),
    coronal: view('coronal', 0, 2, 1, { left: 'R', right: 'L', top: 'S', bottom: 'I' }),
    sagittal: view('sagittal', 1, 2, 0, { left: 'A', right: 'P', top: 'S', bottom: 'I' }),
  });
  return Object.freeze({ shapeKJI: Object.freeze(shape), oblique, coordinateSystem: 'world RAS', voxelWorldAxes: Object.freeze(dominant.map(axis => axisName[axis])), views, ijkToRas, rasToIjk });
}

/** The stored array is C-order K,J,I; I changes fastest. */
export function flattenKJI(ijk, inputShape) {
  const [kCount, jCount, iCount] = shapeKJI(inputShape);
  if (!Array.isArray(ijk) || ijk.length !== 3 || ijk.some(value => !Number.isSafeInteger(value))) fail('IJK index must contain three integers');
  const [i, j, k] = ijk;
  if (i < 0 || i >= iCount || j < 0 || j >= jCount || k < 0 || k >= kCount) fail('IJK index is outside the native grid');
  return (k * jCount + j) * iCount + i;
}

/** Returns null when a native voxel is outside the exact cropped mask. */
export function maskCropIndexForIJK(ijk, { offset_kji: offset, shape_kji: cropShape }) {
  const [kCount, jCount, iCount] = shapeKJI(cropShape);
  if (!Array.isArray(ijk) || ijk.length !== 3 || ijk.some(value => !Number.isSafeInteger(value))) fail('IJK index must contain three integers');
  if (!Array.isArray(offset) || offset.length !== 3 || offset.some(value => !Number.isSafeInteger(value) || value < 0)) fail('offset_kji must contain three nonnegative integers');
  const [i, j, k] = ijk;
  const ci = i - offset[2], cj = j - offset[1], ck = k - offset[0];
  if (ci < 0 || ci >= iCount || cj < 0 || cj >= jCount || ck < 0 || ck >= kCount) return null;
  return (ck * jCount + cj) * iCount + ci;
}
