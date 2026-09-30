import { createHash } from 'node:crypto';

/** Quantization step in the input shape's coordinate units (normally source mm). */
export const SOURCE_SHAPE_TOLERANCE = 1e-6;

function validate(shape) {
  if (!shape || !Array.isArray(shape.vertices) || !Array.isArray(shape.faces) ||
      shape.vertices.length === 0 || shape.faces.length === 0) {
    throw new TypeError('Expected nonempty source vertices and triangle faces');
  }
  for (const vertex of shape.vertices) {
    if (!Array.isArray(vertex) || vertex.length !== 3 ||
        [0, 1, 2].some((axis) => !Object.hasOwn(vertex, axis) ||
          !Number.isFinite(vertex[axis]))) {
      throw new TypeError('Non-finite or invalid source vertex');
    }
  }
  for (const face of shape.faces) {
    if (!Array.isArray(face) || face.length !== 3 ||
        [0, 1, 2].some((corner) => !Object.hasOwn(face, corner) ||
          !Number.isInteger(face[corner]) || face[corner] < 0 ||
          face[corner] >= shape.vertices.length)) {
      throw new TypeError('Invalid source triangle index');
    }
    const [a, b, c] = face.map((i) => shape.vertices[i]);
    const u = b.map((n, k) => n - a[k]);
    const v = c.map((n, k) => n - a[k]);
    const cross = [u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (![...u, ...v, ...cross].every(Number.isFinite) || cross.every((n) => n === 0)) {
      throw new TypeError('Non-finite or degenerate source triangle');
    }
  }
}

function optionsFor(options) {
  const { tolerance = SOURCE_SHAPE_TOLERANCE, allowReflections = false } = options;
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new RangeError('Source shape tolerance must be finite and positive');
  }
  if (typeof allowReflections !== 'boolean') {
    throw new TypeError('allowReflections must be boolean');
  }
  return { tolerance, allowReflections };
}

function signatureForReflection(shape, tolerance, reflectionBits) {
  const referenced = new Set(shape.faces.flat());
  const signs = [0, 1, 2].map((axis) => reflectionBits & (1 << axis) ? -1 : 1);
  const origin = [Infinity, Infinity, Infinity];
  for (const index of referenced) {
    const vertex = shape.vertices[index];
    for (let axis = 0; axis < 3; axis++) {
      origin[axis] = Math.min(origin[axis], signs[axis] * vertex[axis]);
    }
  }
  const quantized = new Map();
  for (const index of referenced) {
    const vertex = shape.vertices[index];
    const coordinates = [0, 1, 2].map((axis) => {
      const value = (signs[axis] * vertex[axis] - origin[axis]) / tolerance;
      const rounded = Math.round(value);
      if (!Number.isSafeInteger(rounded)) {
        throw new RangeError('Source coordinate exceeds safe quantization range');
      }
      return rounded;
    });
    quantized.set(index, coordinates);
  }
  const triangles = shape.faces.map((face) => {
    const [a, b, c] = face.map((index) => quantized.get(index));
    const u = [0, 1, 2].map((axis) => BigInt(b[axis]) - BigInt(a[axis]));
    const v = [0, 1, 2].map((axis) => BigInt(c[axis]) - BigInt(a[axis]));
    const cross = [u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cross.every((n) => n === 0n)) {
      throw new TypeError('Degenerate source triangle after quantization');
    }
    return [a, b, c].map((point) => point.join(',')).sort().join(';');
  }).sort();
  const hash = createHash('sha256');
  hash.update(`source-triangle-multiset-v1|${tolerance}|${triangles.length}\n`);
  for (const triangle of triangles) hash.update(`${triangle}\n`);
  return hash.digest('hex');
}

/**
 * Signature of the referenced triangle-coordinate multiset. Vertex/face order,
 * winding, and translation do not affect it. With allowReflections, independent
 * source X/Y/Z reflections are also considered. No scaling or rotation is used.
 * Quantization is nearest 1e-6 input units by default; bin-boundary differences
 * may cause a mismatch even when coordinates differ by less than that step;
 * differences that stay within bins can match. Triangles collapsed by
 * quantization are rejected rather than compared.
 */
export function sourceShapeSignature(shape, options = {}) {
  const { tolerance, allowReflections } = optionsFor(options);
  validate(shape);
  const variants = allowReflections ? 8 : 1;
  let signature;
  for (let bits = 0; bits < variants; bits++) {
    const current = signatureForReflection(shape, tolerance, bits);
    if (signature === undefined || current < signature) signature = current;
  }
  return { triangleCount: shape.faces.length, tolerance, allowReflections, signature };
}

/** Screening result for two verified raw sourceObjShape objects. */
export function compareSourceShapeEquivalence(a, b, options = {}) {
  const settings = optionsFor(options);
  validate(a);
  validate(b);
  if (a.faces.length !== b.faces.length) {
    return { equivalent: false, triangleCountA: a.faces.length,
      triangleCountB: b.faces.length, tolerance: settings.tolerance,
      allowReflections: settings.allowReflections, reason: 'triangle-count-mismatch' };
  }
  const first = sourceShapeSignature(a, settings);
  const second = sourceShapeSignature(b, settings);
  return { equivalent: first.signature === second.signature,
    triangleCountA: first.triangleCount, triangleCountB: second.triangleCount,
    tolerance: settings.tolerance, allowReflections: settings.allowReflections,
    signatureA: first.signature, signatureB: second.signature,
    reason: first.signature === second.signature ? 'matching-triangle-multiset' : 'geometry-mismatch' };
}
