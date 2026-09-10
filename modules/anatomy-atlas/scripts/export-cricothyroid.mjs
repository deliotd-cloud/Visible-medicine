import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cricothyroidCandidates } from './cricothyroid-candidates.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const staging = 'content/prototypes/cricothyroid';
const prototype = JSON.parse(await readFile(`${staging}/catalog.json`));
const original = await readFile(`${staging}/cricothyroid-prototype.glb`);
assert.equal(
  hash(original),
  '11eeaf929ec5528dc51bb6d4a21aac787246c0ed1aa836c3aedac2f1c9b21e1f',
);
assert.equal(prototype.artifact.sha256, hash(original));
assert.deepEqual(prototype.evidence, evidence);
assert.equal(
  prototype.auditSha256,
  '40f002378ede46ffc325a67078c7f71bd3433c32c659cd5c39e003c45850469f',
);
assert.equal(
  hash(await readFile('docs/cricothyroid-source-audit.json')),
  prototype.auditSha256,
);
assert.equal(prototype.structures.length, 4);
for (const candidate of cricothyroidCandidates) {
  const s = prototype.structures.find((p) => p.fmaId === candidate.id);
  assert(s);
  const definition = records.find(
    (r) => r.tree === s.sourceTree && r.id === s.fmaId,
  );
  assert.equal(definition.name, s.sourceName);
  assert.deepEqual(definition.files, [candidate.file]);
  policy.assertNoKnownHolds([definition]);
  assert.equal(
    hash(await readFile(`${staging}/source/${candidate.file}.obj`)),
    candidate.sha256,
  );
  assert.deepEqual(s.sources, [
    { file: candidate.file, sha256: candidate.sha256 },
  ]);
  assert.deepEqual(
    s.derivative.removedSourceFaces,
    candidate.oppositeFaceIslands.flat().sort((a, b) => a - b),
  );
}
const loader = new GLTFLoader();
const input = await loader.parseAsync(
  original.buffer.slice(
    original.byteOffset,
    original.byteOffset + original.byteLength,
  ),
  '',
);
const expected = new Map();
input.scene.updateMatrixWorld(true);
input.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  assert(!expected.has(mesh.name));
  const s = prototype.structures.find((p) => p.fmaId === mesh.name);
  assert(s);
  expected.set(mesh.name, {
    matrix: mesh.matrixWorld.toArray(),
    position: Array.from(mesh.geometry.attributes.position.array),
    normal: Array.from(mesh.geometry.attributes.normal.array),
    indices: Array.from(mesh.geometry.index.array),
  });
  mesh.userData = {
    structureId: s.id,
    fmaId: s.fmaId,
    sourceTree: s.sourceTree,
    sourceSha256: s.sources[0].sha256,
    anatomicalReview: false,
    derivative: s.derivative,
  };
});
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const bytes = Buffer.from(
  await new GLTFExporter().parseAsync(input.scene, { binary: true }),
);
const roundtrip = await loader.parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
const seen = new Set();
roundtrip.scene.updateMatrixWorld(true);
roundtrip.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  assert(!seen.has(mesh.name));
  seen.add(mesh.name);
  const before = expected.get(mesh.name);
  assert(before);
  assert.deepEqual(mesh.matrixWorld.toArray(), before.matrix);
  for (const attribute of ['position', 'normal'])
    assert.deepEqual(
      Array.from(mesh.geometry.attributes[attribute].array),
      before[attribute],
    );
  assert.deepEqual(Array.from(mesh.geometry.index.array), before.indices);
  assert.equal(mesh.userData.anatomicalReview, false);
  assert.equal(mesh.userData.prototypeOnly, undefined);
});
assert.equal(seen.size, 4);
const parent = catalog.structures.find((s) => s.fmaId === 'FMA55099');
assert(parent && parent.sourceName === 'thyroid cartilage');
const contextRecords = ['FMA55099', 'FMA9615'].map((fmaId) => {
  const matches = catalog.structures.filter((s) => s.fmaId === fmaId);
  assert.equal(matches.length, 1);
  const s = matches[0],
    definition = records.find(
      (r) => r.tree === s.sourceTree && r.id === s.fmaId,
    );
  policy.assertNoKnownHolds([definition]);
  assert.deepEqual(
    definition.files,
    s.sources.map((f) => f.file),
  );
  return s;
});
const contextBundles = catalog.bundles.filter((b) =>
  contextRecords.some((s) => s.bundle === b.id),
);
for (const bundle of contextBundles)
  assert.equal(
    hash(
      await readFile(`public/models/bodyparts3d/full-body/${bundle.id}.glb`),
    ),
    bundle.sha256,
  );
const id = 'cricothyroid';
const structures = prototype.structures.map((s) => ({
  ...s,
  bundle: id,
  regions: ['head-neck'],
  studyParentId: parent.id,
  sourceRelationship:
    'regional-muscle-part-with-cartilage-navigation-landmark',
  provenance: {
    method: 'licensed-source-mesh',
    license: catalog.license,
    sourceVersion: '4.0',
    recovered: false,
  },
}));
const result = {
  version: 1,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  auditSha256: prototype.auditSha256,
  prototypeSha256: hash(original),
  parent,
  parentRelationship: 'navigation-landmark-not-tissue-parent',
  structures,
  selectableIds: structures.map((s) => s.id),
  contextIds: [],
  contextRecords,
  contextBundles,
  bundles: [
    {
      id,
      url: `/models/bodyparts3d/cricothyroid/${id}.glb?v=${hash(bytes)}`,
      sha256: hash(bytes),
      bytes: bytes.length,
      structures: 4,
    },
  ],
  regions: [
    {
      id: 'head-neck',
      name: 'Cricothyroid muscle parts',
      description:
        'Four supplied straight/oblique parts with optional cartilage landmarks; not complete laryngeal anatomy.',
    },
  ],
  coverage: {
    nerves: 'Not included',
    organs: 'No thyroid gland, airway or vocal-fold mucosa included',
  },
  excluded: [],
  clinicalApproval: false,
  modification:
    'Runtime geometry matches the retained prototype exactly. The display derivative omits twelve specifically audited detached opposite-face triangles from the raw originals; all other coordinates, faces and winding remain unchanged.',
};
const path = 'public/models/bodyparts3d/cricothyroid';
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(hash(await readFile(`${path}/${id}.glb`)), hash(bytes));
  assert.equal(await readFile(`${path}/catalog.json`, 'utf8'), text);
} else {
  await mkdir(path);
  await writeFile(`${path}/${id}.glb`, bytes, { flag: 'wx' });
  await writeFile(`${path}/catalog.json`, text, { flag: 'wx' });
}
console.log(
  JSON.stringify({
    ...result.bundles[0],
    context: contextRecords.map((s) => s.fmaId),
    prototypeGeometryUnchanged: true,
    clinicalApproval: false,
  }),
);
