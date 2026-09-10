import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const prototype = JSON.parse(
  await readFile('content/prototypes/visual-pathway/catalog.json'),
);
const original = await readFile(
  'content/prototypes/visual-pathway/visual-pathway-prototype.glb',
);
assert.equal(
  hash(original),
  'c85eb132948e1b9ad8d6b618c95f04f6772a36268a9583f892d91b1f3df1598b',
);
assert.equal(prototype.artifact.sha256, hash(original));
assert.deepEqual(prototype.evidence, evidence);
assert.equal(
  prototype.auditSha256,
  hash(await readFile('docs/visual-pathway-source-audit.json')),
);
assert.equal(prototype.structures.length, 3);
for (const s of prototype.structures) {
  const definition = records.find(
    (r) => r.tree === s.sourceTree && r.id === s.fmaId,
  );
  assert.equal(definition.name, s.sourceName);
  assert.deepEqual(
    definition.files,
    s.sources.map((f) => f.file),
  );
  policy.assertNoKnownHolds([definition]);
  for (const f of s.sources)
    assert.equal(
      hash(await readFile(`${cache}/${s.sourceTree}/${f.file}.obj`)),
      f.sha256,
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
input.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  expected.set(mesh.name, {
    positions: Array.from(mesh.geometry.attributes.position.array),
    indices: Array.from(mesh.geometry.index.array),
  });
  mesh.userData = {
    structureId: mesh.userData.structureId,
    fmaId: mesh.name,
    sourceTree: mesh.userData.sourceTree,
    anatomicalReview: false,
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
roundtrip.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  assert(!seen.has(mesh.name));
  seen.add(mesh.name);
  assert.deepEqual(
    Array.from(mesh.geometry.attributes.position.array),
    expected.get(mesh.name).positions,
  );
  assert.deepEqual(
    Array.from(mesh.geometry.index.array),
    expected.get(mesh.name).indices,
  );
  assert.equal(mesh.userData.anatomicalReview, false);
});
assert.equal(seen.size, 3);
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
assert(parent);
const contextFma = ['FMA73303', 'FMA73304', 'FMA258714', 'FMA258716'];
const contextRecords = contextFma.map((id) =>
  catalog.structures.find((s) => s.fmaId === id),
);
assert(contextRecords.every(Boolean));
const id = 'visual-pathway';
const structures = prototype.structures.map((s) => ({
  ...s,
  bundle: id,
  studyParentId: parent.id,
  sourceRelationship: 'additional-source-part',
  coverageNote:
    'Source-labelled optic chiasm or tract, additional to the supplied brain aggregate. Chiasm halves retain one compound identity; fibre crossing, geniculate terminations and clinical anatomy remain unvalidated.',
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
  structures,
  selectableIds: structures.map((s) => s.id),
  contextIds: [],
  contextRecords,
  contextBundles: catalog.bundles.filter((b) =>
    contextRecords.some((s) => s.bundle === b.id),
  ),
  bundles: [
    {
      id,
      url: `/models/bodyparts3d/visual-pathway/${id}.glb?v=${hash(bytes)}`,
      sha256: hash(bytes),
      bytes: bytes.length,
      structures: 3,
    },
  ],
  regions: [
    {
      id: 'head-neck',
      name: 'Optic chiasm and tracts',
      description:
        'Three supplied neural surfaces, not a complete visual pathway or tractography.',
    },
  ],
  exclusions: prototype.exclusions,
  clinicalApproval: false,
};
const path = 'public/models/bodyparts3d/visual-pathway';
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
    parents: 1,
    geometryUnchangedFromPrototype: true,
    clinicalApproval: false,
  }),
);
