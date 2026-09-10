import assert from 'node:assert/strict';
import { prepareShape } from './vessel-shape-math.mjs';
import { sourceTopology } from './source-topology.mjs';

/** Display derivative only: remove explicitly reviewed detached, reversed face
 * pairs. This is not a generic repair or permission to change held sources.
 * Callers MUST separately pin the original bytes, definition and hold policy.
 */
export function removeReviewedOppositeFaceIslands(shape, pairs) {
  const removed = new Set(pairs.flat());
  assert.equal(removed.size, pairs.length * 2, 'Repeated removal indices');
  const key = (i) => shape.vertices[i].join(',');
  const incidents = new Map();
  shape.faces.forEach((face, faceId) => {
    for (const vertex of new Set(face.map(key))) {
      if (!incidents.has(vertex)) incidents.set(vertex, new Set());
      incidents.get(vertex).add(faceId);
    }
  });
  const islands = pairs.map((pair) => {
    assert.equal(pair.length, 2);
    assert(
      pair.every(
        (i) => Number.isInteger(i) && i >= 0 && i < shape.faces.length,
      ),
    );
    const [a, b] = pair.map((i) => shape.faces[i].map(key));
    assert.equal(new Set(a).size, 3, 'Collapsed island');
    assert(
      [0, 1, 2].some((offset) =>
        a.every((v, i) => v === b[(offset - i + 3) % 3]),
      ),
      'Not exactly opposite triangles',
    );
    for (const vertex of a)
      assert.deepEqual(
        [...incidents.get(vertex)].sort((x, y) => x - y),
        [...pair].sort((x, y) => x - y),
        'Island touches retained geometry or another island',
      );
    const topology = sourceTopology(
      prepareShape(
        shape.faces[pair[0]].map((i) => shape.vertices[i]),
        [
          [0, 1, 2],
          [2, 1, 0],
        ],
      ),
    );
    assert.equal(topology.components.length, 1);
    assert.equal(topology.components[0].algebraicVolumeMm3, 0);
    assert.equal(topology.degenerateFaces, 0);
    return {
      sourceFaceIndices: pair,
      originalFaces: pair.map((i) =>
        shape.faces[i].map((v) => shape.vertices[v]),
      ),
      bounds: topology.components[0].bounds,
      areaMm2: topology.components[0].areaMm2,
      algebraicVolumeMm3: 0,
    };
  });
  const retainedSourceFaceIndices = shape.faces
    .map((_, i) => i)
    .filter((i) => !removed.has(i));
  // Compact only unused OBJ vertex indices. Coordinates, face order and winding
  // remain exact; even coincident OBJ vertices are not welded here.
  const used = new Set(
    retainedSourceFaceIndices.flatMap((i) => shape.faces[i]),
  );
  const retainedSourceVertexIndices = shape.vertices
    .map((_, i) => i)
    .filter((i) => used.has(i));
  const remap = new Map(retainedSourceVertexIndices.map((id, i) => [id, i]));
  const derivative = prepareShape(
    retainedSourceVertexIndices.map((i) => shape.vertices[i]),
    retainedSourceFaceIndices.map((i) =>
      shape.faces[i].map((v) => remap.get(v)),
    ),
  );
  const topology = sourceTopology(derivative);
  assert.equal(
    topology.closedOrientedManifold,
    true,
    'Retained surface still has combinatorial defects',
  );
  assert.equal(
    topology.components.length,
    1,
    'Expected one retained component',
  );
  return {
    shape: derivative,
    topology,
    islands,
    retainedSourceFaceIndices,
    retainedSourceVertexIndices,
  };
}
