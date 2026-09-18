import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { cache } from './bodyparts-archive.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const originalGlbPath =
  'public/models/bodyparts3d/full-body/abdomen-vessels-recovery.glb';
const outputDirectory = 'public/models/bodyparts3d/celiac-display';
const outputGlbPath = `${outputDirectory}/celiac-display.glb`;
const correctionPath = `${outputDirectory}/display-correction.json`;
const catalogSha256 =
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7';
const originalGlbSha256 =
  'e41d66684de08fd9bd7dfca340acb63cbf7714eb09a3ea9594184f497c509abe';
const sourceHashes = new Map([
  [
    'FJ1846',
    '7aae236dac488ac875ae9f62b59d84ce6f0d85cb80098ef12346cac59f5a609f',
  ],
  [
    'FJ2013',
    '5ab733ce7f017e7d9c033936f2008b682eb73dacd742e8ea53cb77a8a28d4492',
  ],
]);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function parseObj(bytes) {
  const vertices = [],
    normals = [],
    faces = [];
  for (const rawLine of bytes.toString().split(/\r?\n/)) {
    const parts = rawLine.trim().split(/\s+/);
    if (parts[0] === 'v') vertices.push(parts.slice(1).map(Number));
    if (parts[0] === 'vn') normals.push(parts.slice(1).map(Number));
    if (parts[0] === 'f') {
      assert.equal(parts.length, 4, 'Only source triangles are accepted');
      faces.push(
        parts.slice(1).map((token) => {
          const [vertex, texture = '', normal = ''] = token.split('/');
          assert.equal(texture, '', 'Unexpected OBJ texture coordinate');
          const v = Number(vertex),
            n = Number(normal);
          assert(Number.isInteger(v) && v > 0 && v <= vertices.length);
          assert(Number.isInteger(n) && n > 0 && n <= normals.length);
          return { vertex: v - 1, normal: n - 1 };
        }),
      );
    }
  }
  assert.equal(vertices.length, 133);
  assert.equal(normals.length, 133);
  assert.equal(faces.length, 238);
  assert(vertices.flat().every(Number.isFinite));
  assert(normals.flat().every(Number.isFinite));
  return { vertices, normals, faces };
}

function assertEquivalentSources(first, second) {
  assert.deepEqual(second.vertices, first.vertices, 'Source vertices differ');
  assert.deepEqual(second.normals, first.normals, 'Source normals differ');
  assert.deepEqual(second.faces, first.faces, 'Source faces or winding differ');
}

function assertSourceRecord(file, record, bytes) {
  assert.equal(record.file, file, 'Wrong source file');
  assert.equal(
    record.sha256,
    sourceHashes.get(file),
    'Wrong source record hash',
  );
  assert.equal(hash(bytes), record.sha256, `Raw hash changed for ${file}`);
}

function exactSourceGeometry(source, matrix) {
  // Reproduce the archived ingest without its tolerance merge: source coordinates
  // are first stored as Float32, and only bit-identical positions are shared.
  const positions = [],
    indices = [],
    byPosition = new Map();
  for (const face of source.faces) {
    for (const corner of face) {
      const value = Array.from(
        new Float32Array(source.vertices[corner.vertex]),
      );
      const key = value.join(',');
      if (!byPosition.has(key)) {
        byPosition.set(key, positions.length / 3);
        positions.push(...value);
      }
      indices.push(byPosition.get(key));
    }
  }
  assert.equal(
    positions.length / 3,
    121,
    'Unexpected exact source vertex count',
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

function attributeValues(attribute) {
  return Array.from(attribute.array);
}

function assertDuplicateHalves(geometry, expected) {
  assert.deepEqual(Object.keys(geometry.attributes).sort(), [
    'normal',
    'position',
  ]);
  assert.equal(geometry.index?.count, 1428);
  assert.equal(geometry.attributes.position.count, 242);
  assert.equal(geometry.attributes.normal.count, 242);
  const halfVertices = 121,
    halfIndices = 714;
  for (const name of ['position', 'normal']) {
    const attribute = geometry.attributes[name],
      width = attribute.itemSize,
      first = Array.from(attribute.array.slice(0, halfVertices * width)),
      second = Array.from(attribute.array.slice(halfVertices * width));
    assert.deepEqual(second, first, `${name} halves are not identical`);
    assert.deepEqual(
      first,
      attributeValues(expected.attributes[name]),
      `${name} is not the exact standard transformed source geometry`,
    );
  }
  const firstIndices = Array.from(geometry.index.array.slice(0, halfIndices)),
    secondIndices = Array.from(geometry.index.array.slice(halfIndices));
  assert.deepEqual(
    secondIndices.map((index) => index - halfVertices),
    firstIndices,
    'Index halves are not identical offset copies',
  );
  assert.deepEqual(
    firstIndices,
    Array.from(expected.index.array),
    'Triangle order or winding differs from the source',
  );
}

function firstHalfGeometry(geometry) {
  const result = new BufferGeometry();
  for (const name of ['position', 'normal']) {
    const source = geometry.attributes[name],
      values = source.array.slice(0, 121 * source.itemSize);
    result.setAttribute(name, new BufferAttribute(values, source.itemSize));
  }
  result.setIndex(new BufferAttribute(geometry.index.array.slice(0, 714), 1));
  result.computeBoundingBox();
  return result;
}

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const { catalog, evidence, policy, records } = await loadCurrentSourceHolds();
const catalogBytes = await readFile(catalogPath);
assert.equal(
  hash(catalogBytes.toString().replace(/\r\n/g, '\n')),
  catalogSha256,
);
const original = catalog.structures.find((entry) => entry.fmaId === 'FMA50737');
assert(original, 'Missing FMA50737');
assert.deepEqual(original.sources, [
  { file: 'FJ1846', sha256: sourceHashes.get('FJ1846') },
  { file: 'FJ2013', sha256: sourceHashes.get('FJ2013') },
]);
assert.equal(original.sourceTree, 'isa');
const definition = records.find(r => r.tree === original.sourceTree && r.id === original.fmaId);
assert(definition);
assert.equal(definition.name, original.sourceName);
assert.deepEqual(definition.files, original.sources.map(s => s.file));
policy.assertNoKnownHolds([definition]);
assert.equal(original.bundle, 'abdomen-vessels-recovery');
const originalBundle = catalog.bundles.find(
  (entry) => entry.id === original.bundle,
);
assert.deepEqual(originalBundle, {
  id: 'abdomen-vessels-recovery',
  url: '/models/bodyparts3d/full-body/abdomen-vessels-recovery.glb',
  bytes: 477592,
  sha256: originalGlbSha256,
  structures: 14,
});

const parsedSources = [],
  sourceBytes = [];
for (const source of original.sources) {
  const bytes = await readFile(`${cache}/isa/${source.file}.obj`);
  assertSourceRecord(source.file, source, bytes);
  sourceBytes.push(bytes);
  parsedSources.push(parseObj(bytes));
}
assertEquivalentSources(parsedSources[0], parsedSources[1]);

// Required negative checks run before any output directory or file is written.
assert.throws(
  () => assertSourceRecord('FJ1846', original.sources[0], sourceBytes[1]),
  undefined,
  'A wrong source identity must fail',
);
const changedVertex = structuredClone(parsedSources[1]);
changedVertex.vertices[0][0] += 1;
assert.throws(() => assertEquivalentSources(parsedSources[0], changedVertex));
const reversed = structuredClone(parsedSources[1]);
reversed.faces[0].reverse();
assert.throws(() => assertEquivalentSources(parsedSources[0], reversed));

const originalBytes = await readFile(originalGlbPath);
assert.equal(originalBytes.length, originalBundle.bytes);
assert.equal(hash(originalBytes), originalGlbSha256);
const loaded = await new GLTFLoader().parseAsync(
  originalBytes.buffer.slice(
    originalBytes.byteOffset,
    originalBytes.byteOffset + originalBytes.byteLength,
  ),
  '',
);
const matches = [];
loaded.scene.traverse((node) => {
  if (node.isMesh && node.name === original.nodeName) matches.push(node);
});
assert.equal(matches.length, 1, 'Expected one FMA50737 mesh');
const sourceGeometry = exactSourceGeometry(
  parsedSources[0],
  new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor),
);
assertDuplicateHalves(matches[0].geometry, sourceGeometry);

const geometry = firstHalfGeometry(matches[0].geometry);
assert.deepEqual(geometry.boundingBox.min.toArray(), original.bounds.min);
assert.deepEqual(geometry.boundingBox.max.toArray(), original.bounds.max);
const mesh = new Mesh(geometry, new MeshStandardMaterial());
mesh.name = original.nodeName;
mesh.userData = structuredClone(matches[0].userData);
const group = new Group();
group.add(mesh);
const outputBytes = Buffer.from(
  await new GLTFExporter().parseAsync(group, { binary: true }),
);
const replacement = { ...original, bundle: 'celiac-display-corrected' };
const bundle = {
  id: replacement.bundle,
  url: `/models/bodyparts3d/celiac-display/celiac-display.glb?v=${hash(outputBytes)}`,
  bytes: outputBytes.length,
  sha256: hash(outputBytes),
  structures: 1,
};
const correction = {
  version: 1,
  original,
  replacement,
  originalBundle,
  bundle,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  modification: {
    adaptation: 'exact-duplicate-render-copy-removal-v1',
    retainedSourceRecords: original.sources,
    retainedTriangles: 238,
    omittedDuplicateRenderTriangles: 238,
    originalRenderTriangles: 476,
    positionsNormalsBoundsAndWindingPreserved: true,
    geometryRepair: false,
    clinicalApproval: false,
    reason:
      'The two source files and both rendered geometry halves are exact equivalents; one render copy is retained without geometry editing.',
  },
  licence: { id: catalog.license, credit: catalog.credit },
};

if (process.argv.includes('--check')) {
  assert.deepEqual(await readFile(outputGlbPath), outputBytes);
  assert.deepEqual(JSON.parse(await readFile(correctionPath)), correction);
} else {
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputGlbPath, outputBytes);
  await writeFile(correctionPath, JSON.stringify(correction, null, 2) + '\n');
}

console.log({
  passed: true,
  retainedTriangles: 238,
  omittedDuplicateRenderTriangles: 238,
  bytes: outputBytes.length,
  sha256: hash(outputBytes),
  clinicalApproval: false,
});
