import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { collicularBrachiaSources } from './collicular-brachia-sources.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const read = async (p) => JSON.parse(await readFile(p));
const addition = await read(
    'public/models/bodyparts3d/collicular-brachia/catalog.json',
  ),
  original = await read('public/models/bodyparts3d/brainstem/catalog.json');
const bundle = addition.bundles[0],
  bytes = await readFile(
    'public' + new URL(bundle.url, 'https://example.invalid').pathname,
  );
assert.equal(hash(bytes), bundle.sha256);
assert.equal(addition.structures.length, 2);
assert.equal(addition.clinicalApproval, false);
assert.deepEqual(addition.parent, original.parent);
assert.equal(
  hash(await readFile('docs/collicular-brachia-source-audit.json')),
  addition.auditSha256,
);
const loaded = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
const meshes = [];
loaded.scene.traverse((m) => {
  if (m.isMesh) meshes.push(m);
});
assert.equal(meshes.length, 2);
const matrix = new Matrix4().fromArray(
  addition.coordinateSystem.sourceToSceneColumnMajor,
);
let triangles = 0;
for (const structure of addition.structures) {
  const candidate = collicularBrachiaSources.find(
    (c) => c.id === structure.fmaId,
  );
  assert.equal(candidate.status, 'candidate');
  assert.equal(structure.laterality, candidate.side);
  const source = await readFile(
    `content/sources/collicular-brachia/${candidate.file}.obj`,
  );
  assert.equal(hash(source), candidate.sha256);
  const shape = sourceObjShape(source),
    mesh = meshes.find((m) => m.name === structure.nodeName),
    p = mesh.geometry.attributes.position,
    index = mesh.geometry.index;
  assert.equal(index.count, shape.faces.length * 3);
  // Independent per-face comparison against transformed original vertices:
  // every corner, face order and winding must survive, not just bounding boxes.
  for (let f = 0; f < shape.faces.length; f++)
    for (let c = 0; c < 3; c++) {
      const expected = new Vector3(...shape.vertices[shape.faces[f][c]])
          .applyMatrix4(matrix)
          .toArray()
          .map(Math.fround),
        at = index.getX(f * 3 + c);
      assert.deepEqual([p.getX(at), p.getY(at), p.getZ(at)], expected);
    }
  triangles += shape.faces.length;
  assert.equal(mesh.userData.structureId, structure.id);
  assert.equal(mesh.userData.anatomicalReview, false);
  assert(
    structure.laterality === 'left'
      ? structure.bounds.min[0] > 0
      : structure.bounds.max[0] < 0,
  );
}
assert.equal(triangles, 568);
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/brainstem'; export * from './lib/ventricles'; export * from './lib/nested-anatomy'; export * from './lib/nested-teaching'; export { bodyDisplayCatalog } from './lib/body-display-catalog';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const a = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const root = a.bodyDisplayCatalog(
    await read('public/models/bodyparts3d/full-body/catalog.json'),
  ),
  parent = root.structures.find((s) => s.id === addition.parent.id),
  layers = a.brainstemFor(parent),
  presets = a.brainstemPresets(layers);
assert.equal(layers.length, 6);
for (const s of original.structures)
  assert.deepEqual(
    a.brainstemCatalog.structures.find((x) => x.id === s.id),
    s,
  );
for (const b of original.bundles)
  assert.deepEqual(
    a.brainstemCatalog.bundles.find((x) => x.id === b.id),
    b,
  );
assert.deepEqual(presets.brachia.sort(), addition.selectableIds.toSorted());
assert.equal(presets['midbrain-brachia'].length, 3);
assert.equal(presets.brainstem.length, 5);
const targets = a.nestedStudyTargets(root);
for (const structure of addition.structures) {
  const target = targets.find((t) => t.structureId === structure.id);
  assert(target);
  assert.equal(target.study, 'brainstem');
  assert.equal(target.sourceHash, bundle.sha256);
  assert(
    a.resolveNestedTarget(
      root,
      parent.id,
      {
        study: 'brainstem',
        structureId: structure.id,
        sourceHash: bundle.sha256,
      },
      structure.laterality,
    ),
  );
  assert.equal(
    a.resolveNestedTarget(
      root,
      parent.id,
      {
        study: 'brainstem',
        structureId: structure.id,
        sourceHash: bundle.sha256,
      },
      structure.laterality === 'left' ? 'right' : 'left',
    ),
    null,
  );
  assert.equal(
    a.resolveNestedTarget(
      root,
      parent.id,
      {
        study: 'brainstem',
        structureId: structure.id,
        sourceHash: '0'.repeat(64),
      },
      'both',
    ),
    null,
  );
  const lesson = a.nestedTeachingFor(parent, 'brainstem', structure);
  assert.equal(lesson.id, 'inferior-collicular-brachia');
  assert.equal(lesson.sections.anatomy.readiness, 'draft');
  for (const topic of [
    'clinical',
    'pathology',
    'ct',
    'mri',
    'xray',
    'ultrasound',
  ])
    assert.equal(a.nestedTopicLesson(lesson, topic).readiness, 'pending');
  assert.equal(
    a.nestedTeachingFor(parent, 'brainstem', { ...structure, sources: [] }),
    null,
  );
  let state = a.initialVentricles(layers);
  state = a.reduceVentricles(
    layers,
    state,
    { type: 'preset', value: 'brachia' },
    presets,
  );
  assert.equal(state.hidden.length, 4);
  state = a.reduceVentricles(
    layers,
    state,
    { type: 'select', id: structure.id },
    presets,
  );
  state = a.reduceVentricles(
    layers,
    state,
    { type: 'visibility', id: structure.id, visible: false },
    presets,
  );
  assert(state.hidden.includes(structure.id));
  assert.equal(state.selectedId, null);
  state = a.reduceVentricles(layers, state, { type: 'undo' }, presets);
  assert.equal(state.selectedId, structure.id);
  assert(!state.hidden.includes(structure.id));
}
for (const candidate of collicularBrachiaSources.filter(
  (s) => s.status === 'held',
))
  assert(!targets.some((t) => t.structure.fmaId === candidate.id));
for (const mutation of [
  { fmaId: 'FMA0' },
  { sources: [] },
  { laterality: 'left' },
  { bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
])
  assert.deepEqual(a.brainstemFor({ ...parent, ...mutation }), []);
const coverage = await read('docs/reference-coverage-audit.json');
for (const s of collicularBrachiaSources)
  assert.equal(
    coverage.rootDifferences.find((r) => r.file === s.file).status,
    s.status === 'held' ? 'known-source-hold' : 'nested-source-covered',
  );
console.log(
  JSON.stringify({
    passed: true,
    newSelections: 2,
    exactOrderedTriangles: triangles,
    totalBrainstemSelections: 6,
    nestedSelections: targets.length,
    newPresets: 2,
    heldLateralityConflicts: 2,
    sourceBoundTeaching: true,
    hideUndoAndSideFiltering: true,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
