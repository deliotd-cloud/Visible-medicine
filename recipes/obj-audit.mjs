/**
 * Strict, source-frame triangle OBJ parser and topology audit.
 * Coordinates and face order are retained; no anatomy or registration is inferred.
 */

const FLOAT = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const INTEGER = /^[+-]?\d+$/;
const ignored = new Set(['o', 'g', 's', 'usemtl', 'mtllib', 'vn', 'vt', 'vp', 'l', 'p']);

export function parseObj(bytes) {
  if (typeof bytes !== 'string' && !(bytes instanceof Uint8Array)) {
    throw new TypeError('OBJ input must be UTF-8 bytes or a string');
  }
  const source = typeof bytes === 'string'
    ? bytes
    : new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const positions = [];
  const faces = [];
  let start = 0;
  let lineNumber = 0;
  while (start <= source.length) {
    const end = source.indexOf('\n', start);
    const line = source.slice(start, end < 0 ? source.length : end);
    lineNumber++;
    const content = line.split('#', 1)[0].trim();
    if (content) {
      const fields = content.split(/\s+/);
      const directive = fields[0];
      if (directive === 'v') {
        if (fields.length !== 4 || fields.slice(1).some(x => !FLOAT.test(x) || !Number.isFinite(Number(x)))) {
          throw new Error(`OBJ line ${lineNumber}: vertex must have exactly three finite coordinates`);
        }
        positions.push(fields.slice(1).map(Number));
      } else if (directive === 'f') {
        if (fields.length !== 4) {
          throw new Error(`OBJ line ${lineNumber}: only triangle faces are supported (got ${fields.length - 1} vertices)`);
        }
        const face = fields.slice(1).map(token => {
          const parts = token.split('/');
          if (parts.length > 3 || parts[0] === '' || (parts.length === 3 && parts[2] === '')) {
            throw new Error(`OBJ line ${lineNumber}: malformed face vertex "${token}"`);
          }
          const raw = parts[0];
          if (!INTEGER.test(raw)) throw new Error(`OBJ line ${lineNumber}: noninteger face index "${raw}"`);
          const index = Number(raw);
          if (!Number.isSafeInteger(index) || index === 0) {
            throw new Error(`OBJ line ${lineNumber}: invalid face index "${raw}"`);
          }
          const resolved = index > 0 ? index - 1 : positions.length + index;
          if (resolved < 0 || resolved >= positions.length) {
            throw new Error(`OBJ line ${lineNumber}: face index "${raw}" is out of range at face occurrence`);
          }
          return resolved;
        });
        faces.push(face);
      } else if (!ignored.has(directive)) {
        throw new Error(`OBJ line ${lineNumber}: unsupported directive "${directive}"`);
      }
    }
    if (end < 0) break;
    start = end + 1;
  }
  return { positions, faces };
}

function emptyBounds() {
  return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
}

function include(bounds, point) {
  for (let axis = 0; axis < 3; axis++) {
    bounds.min[axis] = Math.min(bounds.min[axis], point[axis]);
    bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
  }
}

function finishBounds(bounds) {
  return bounds.min[0] === Infinity ? null : bounds;
}

export function auditObj(parsed) {
  const { positions, faces } = parsed;
  const bounds = emptyBounds();
  for (const point of positions) include(bounds, point);
  const parents = faces.map((_, index) => index);
  const find = index => {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  };
  const union = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parents[b] = a;
  };
  const seenFaces = new Set();
  const edges = new Map();
  let duplicateFaces = 0;
  let degenerateFaces = 0;
  for (let fi = 0; fi < faces.length; fi++) {
    const face = faces[fi];
    const canonical = [...face].sort((a, b) => a - b).join(',');
    if (seenFaces.has(canonical)) duplicateFaces++;
    else seenFaces.add(canonical);
    const [a, b, c] = face.map(i => positions[i]);
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    if (new Set(face).size < 3 || cross.every(x => x === 0)) degenerateFaces++;
    const faceEdges = new Set();
    for (let ei = 0; ei < 3; ei++) {
      const u = face[ei], v = face[(ei + 1) % 3];
      if (u === v) continue;
      const key = u < v ? `${u},${v}` : `${v},${u}`;
      if (faceEdges.has(key)) continue;
      faceEdges.add(key);
      const prior = edges.get(key);
      if (prior) {
        prior.count++;
        union(fi, prior.firstFace);
      } else {
        edges.set(key, { count: 1, firstFace: fi });
      }
    }
  }
  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  for (const edge of edges.values()) {
    if (edge.count === 1) boundaryEdges++;
    else if (edge.count > 2) nonManifoldEdges++;
  }
  const componentsByRoot = new Map();
  for (let fi = 0; fi < faces.length; fi++) {
    const root = find(fi);
    let component = componentsByRoot.get(root);
    if (!component) {
      component = { faceCount: 0, bounds: emptyBounds() };
      componentsByRoot.set(root, component);
    }
    component.faceCount++;
    for (const vertex of faces[fi]) include(component.bounds, positions[vertex]);
  }
  return {
    vertexCount: positions.length,
    faceCount: faces.length,
    bounds: finishBounds(bounds),
    duplicateFaces,
    degenerateFaces,
    boundaryEdges,
    nonManifoldEdges,
    connectedFaceComponents: [...componentsByRoot.values()],
    positions,
    faces,
  };
}
