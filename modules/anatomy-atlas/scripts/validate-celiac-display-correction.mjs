import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { BufferAttribute, BufferGeometry, Matrix4 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { cache } from './bodyparts-archive.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const originalPath =
  'public/models/bodyparts3d/full-body/abdomen-vessels-recovery.glb';
const correctionPath =
  'public/models/bodyparts3d/celiac-display/display-correction.json';
const expected = {
  catalog: '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
  original: 'e41d66684de08fd9bd7dfca340acb63cbf7714eb09a3ea9594184f497c509abe',
  FJ1846: '7aae236dac488ac875ae9f62b59d84ce6f0d85cb80098ef12346cac59f5a609f',
  FJ2013: '5ab733ce7f017e7d9c033936f2008b682eb73dacd742e8ea53cb77a8a28d4492',
};
let checks = 0;
const same = (actual, wanted, message) => {
  checks++;
  assert.deepEqual(actual, wanted, message);
};
const check = (value, message) => {
  checks++;
  assert(value, message);
};

function parseObj(bytes) {
  const vertices = [],
    normals = [],
    faces = [];
  for (const line of bytes.toString().split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v') vertices.push(parts.slice(1).map(Number));
    if (parts[0] === 'vn') normals.push(parts.slice(1).map(Number));
    if (parts[0] === 'f') {
      assert.equal(parts.length, 4);
      faces.push(
        parts.slice(1).map((token) => {
          const [v, texture = '', n = ''] = token.split('/');
          assert.equal(texture, '');
          return { vertex: Number(v) - 1, normal: Number(n) - 1 };
        }),
      );
    }
  }
  assert.equal(vertices.length, 133);
  assert.equal(normals.length, 133);
  assert.equal(faces.length, 238);
  for (const face of faces)
    for (const corner of face) {
      assert(corner.vertex >= 0 && corner.vertex < vertices.length);
      assert(corner.normal >= 0 && corner.normal < normals.length);
    }
  return { vertices, normals, faces };
}

function equivalent(first, second) {
  assert.deepEqual(second.vertices, first.vertices);
  assert.deepEqual(second.normals, first.normals);
  assert.deepEqual(second.faces, first.faces);
}

function assertSourceRecord(file, record, bytes) {
  assert.equal(record.file, file);
  assert.equal(record.sha256, expected[file]);
  assert.equal(hash(bytes), record.sha256);
}

function geometryFromExactSource(source, matrix) {
  const positions = [],
    indices = [],
    exact = new Map();
  for (const face of source.faces)
    for (const { vertex } of face) {
      const point = Array.from(new Float32Array(source.vertices[vertex])),
        key = point.join(',');
      if (!exact.has(key)) {
        exact.set(key, positions.length / 3);
        positions.push(...point);
      }
      indices.push(exact.get(key));
    }
  same(
    positions.length / 3,
    121,
    'Only exact duplicate source vertices merged',
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
  geometry.computeVertexNormals();
  geometry.applyMatrix4(matrix);
  geometry.computeBoundingBox();
  return geometry;
}

async function parseGlb(bytes) {
  return new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
}

function onlyMesh(scene, name) {
  const matches = [];
  scene.traverse((node) => {
    if (node.isMesh && node.name === name) matches.push(node);
  });
  same(matches.length, 1, `Expected one ${name} mesh`);
  return matches[0];
}

const { catalog, evidence, policy, records } = await loadCurrentSourceHolds();
const catalogBytes = await readFile(catalogPath);
same(
  hash(catalogBytes.toString().replace(/\r\n/g, '\n')),
  expected.catalog,
  'Full catalog changed',
);
const correction = JSON.parse(await readFile(correctionPath));
const original = catalog.structures.find((entry) => entry.fmaId === 'FMA50737');
const definition = records.find(r => r.tree === original.sourceTree && r.id === original.fmaId);
check(definition);
same(definition.name, original.sourceName);
same(definition.files, original.sources.map(s => s.file));
policy.assertNoKnownHolds([definition]);
same(
  correction.original,
  original,
  'Original record is not the immutable catalog record',
);
same(correction.coordinateSystem, catalog.coordinateSystem);
same(correction.evidence, evidence, 'Source-hold evidence changed');
same(
  correction.originalBundle,
  catalog.bundles.find((b) => b.id === original.bundle),
);
same(correction.replacement, {
  ...original,
  bundle: 'celiac-display-corrected',
});
same(correction.modification.retainedSourceRecords, original.sources);
same(correction.modification.retainedTriangles, 238);
same(correction.modification.omittedDuplicateRenderTriangles, 238);
same(correction.modification.originalRenderTriangles, 476);
same(correction.modification.geometryRepair, false);
same(correction.modification.clinicalApproval, false);
same(correction.licence, { id: catalog.license, credit: catalog.credit });

const sources = [],
  sourceBytes = [];
for (const source of original.sources) {
  const bytes = await readFile(`${cache}/isa/${source.file}.obj`);
  assertSourceRecord(source.file, source, bytes);
  checks += 3;
  same(hash(bytes), expected[source.file], `Raw ${source.file} changed`);
  sourceBytes.push(bytes);
  sources.push(parseObj(bytes));
}
equivalent(sources[0], sources[1]);
checks++;
assert.throws(
  () => assertSourceRecord('FJ1846', original.sources[0], sourceBytes[1]),
  undefined,
  'Wrong-source substitution must fail',
);
const nonidentical = structuredClone(sources[1]);
nonidentical.vertices[0][0] += 1;
checks++;
assert.throws(() => equivalent(sources[0], nonidentical));
const reversed = structuredClone(sources[1]);
reversed.faces[0] = reversed.faces[0].toReversed();
checks++;
assert.throws(() => equivalent(sources[0], reversed));

const originalBytes = await readFile(originalPath);
same(hash(originalBytes), expected.original, 'Original bundle changed');
same(originalBytes.length, correction.originalBundle.bytes);
const originalMesh = onlyMesh(
  (await parseGlb(originalBytes)).scene,
  original.nodeName,
);
same(originalMesh.geometry.index.count, 1428);
same(originalMesh.geometry.attributes.position.count, 242);
same(originalMesh.geometry.attributes.normal.count, 242);
for (const name of ['position', 'normal']) {
  const values = originalMesh.geometry.attributes[name].array,
    half = values.length / 2;
  same(
    Array.from(values.slice(half)),
    Array.from(values.slice(0, half)),
    `${name} halves differ`,
  );
}
same(
  Array.from(originalMesh.geometry.index.array.slice(714)).map((n) => n - 121),
  Array.from(originalMesh.geometry.index.array.slice(0, 714)),
  'Original index halves are not offset copies',
);

const outputPath =
  'public' + new URL(correction.bundle.url, 'https://local.invalid').pathname;
const outputBytes = await readFile(outputPath);
same(hash(outputBytes), correction.bundle.sha256);
same(outputBytes.length, correction.bundle.bytes);
same(correction.bundle.structures, 1);
const outputMesh = onlyMesh(
  (await parseGlb(outputBytes)).scene,
  original.nodeName,
);
same(
  outputMesh.userData,
  originalMesh.userData,
  'Structure identity metadata changed',
);
same(outputMesh.geometry.index.count, 714);
same(outputMesh.geometry.attributes.position.count, 121);
same(outputMesh.geometry.attributes.normal.count, 121);
same(Object.keys(outputMesh.geometry.attributes).sort(), [
  'normal',
  'position',
]);

const sourceGeometry = geometryFromExactSource(
  sources[0],
  new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor),
);
for (const name of ['position', 'normal']) {
  same(
    Array.from(outputMesh.geometry.attributes[name].array),
    Array.from(sourceGeometry.attributes[name].array),
    `Output ${name} differs from exact source reconstruction`,
  );
  same(
    Array.from(outputMesh.geometry.attributes[name].array),
    Array.from(
      originalMesh.geometry.attributes[name].array.slice(
        0,
        outputMesh.geometry.attributes[name].array.length,
      ),
    ),
    `Output ${name} differs from the retained original half`,
  );
}
same(
  Array.from(outputMesh.geometry.index.array),
  Array.from(sourceGeometry.index.array),
  'Output triangle order or winding differs from source',
);
same(
  Array.from(outputMesh.geometry.index.array),
  Array.from(originalMesh.geometry.index.array.slice(0, 714)),
  'Output indices differ from the retained original half',
);
outputMesh.geometry.computeBoundingBox();
same(outputMesh.geometry.boundingBox.min.toArray(), original.bounds.min);
same(outputMesh.geometry.boundingBox.max.toArray(), original.bounds.max);
same(correction.replacement.bounds, original.bounds);
same(correction.replacement.center, original.center);
same(correction.replacement.anchor, original.anchor);
same(correction.replacement.sources, original.sources);
same(correction.replacement.coverageNote, original.coverageNote);
same(correction.replacement.provenance, original.provenance);
same(correction.replacement.validation, original.validation);

console.log({
  passed: true,
  checks,
  sourceFiles: 2,
  retainedTriangles: 238,
  omittedExactDuplicateRenderTriangles: 238,
  positionsNormalsBoundsAndWindingPreserved: true,
  rawCatalogAndBundlesUnchanged: true,
  negativeWrongSourceNonidenticalAndReversedWinding: true,
  clinicalApproval: false,
});
