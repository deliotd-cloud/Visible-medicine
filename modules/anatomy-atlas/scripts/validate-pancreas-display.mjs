import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { cache } from './bodyparts-archive.mjs';
import { build } from './workspace-test-build.mjs';

let checks = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const read = (p) => readFile(p);
const json = async (p) => JSON.parse(await read(p));
const catalogBytes = await read(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(catalogBytes.toString().replace(/\r\n/g, '\n')),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(catalogBytes);
const correction = await json(
  'public/models/bodyparts3d/pancreas/display-correction.json',
);
const { original, replacement, bundle } = correction;
same(
  original,
  catalog.structures.find((s) => s.fmaId === 'FMA7198'),
);
same(
  correction.auditSha256,
  hash(await read('docs/pancreatic-source-audit.json')),
);
same(
  replacement.sources.map((s) => s.file),
  ['FJ1895', 'FJ1896', 'FJ2630'],
);
same(
  correction.modification.omitted.map((s) => s.file),
  ['FJ2629'],
);
same(replacement.validation, original.validation);
same(replacement.provenance, original.provenance);
same(correction.licence.id, 'CC-BY-4.0');
same(correction.coordinateSystem, catalog.coordinateSystem);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const sourceTriangles = new Map();
for (const source of original.sources) {
  const bytes = await read(`${cache}/partof/${source.file}.obj`);
  same(hash(bytes), source.sha256);
  const shape = sourceObjShape(bytes);
  // Independently reproduce only OBJLoader's Float32 storage and the common transform.
  const positions = shape.vertices.map((v) =>
    Array.from(
      new Float32Array(
        new Vector3(...new Float32Array(v)).applyMatrix4(matrix).toArray(),
      ),
    ),
  );
  sourceTriangles.set(
    source.file,
    shape.faces.map((face) =>
      face.map((i) => positions[i].join(',')).join(';'),
    ),
  );
}
const parse = async (bytes) =>
  new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
const triangles = (g) => {
  const p = g.attributes.position,
    ix = g.index;
  return Array.from({ length: (ix?.count ?? p.count) / 3 }, (_, f) =>
    [0, 1, 2]
      .map((n) => {
        const i = ix ? ix.getX(3 * f + n) : 3 * f + n;
        return [p.getX(i), p.getY(i), p.getZ(i)].join(',');
      })
      .join(';'),
  ).sort();
};
const bytes = await read(
  'public' + new URL(bundle.url, 'https://local.invalid').pathname,
);
same(hash(bytes), bundle.sha256);
same(bytes.length, bundle.bytes);
const scene = await parse(bytes),
  meshes = [];
scene.scene.traverse((m) => {
  if (m.isMesh) meshes.push(m);
});
same(meshes.length, 1);
const mesh = meshes[0];
same(mesh.name, original.nodeName);
same(mesh.userData.structureId, original.id);
same(mesh.userData.anatomicalReview, false);
const retained = replacement.sources
  .flatMap((s) => sourceTriangles.get(s.file))
  .sort();
same(retained.length, 12690);
same(
  triangles(mesh.geometry),
  retained,
  'Every retained triangle coordinate and winding is unchanged',
);
same(
  original.sources.reduce((n, s) => n + sourceTriangles.get(s.file).length, 0) -
    retained.length,
  4272,
);
mesh.geometry.computeBoundingBox();
same(mesh.geometry.boundingBox.min.toArray(), replacement.bounds.min);
same(mesh.geometry.boundingBox.max.toArray(), replacement.bounds.max);
same(
  mesh.geometry.boundingBox.getCenter(new Vector3()).toArray(),
  replacement.center,
);
const p = mesh.geometry.attributes.position;
check(
  Array.from({ length: p.count }, (_, i) => [
    p.getX(i),
    p.getY(i),
    p.getZ(i),
  ]).some((v) => v.every((n, k) => n === replacement.anchor[k])),
);
const compiled = await build({
  stdin: {
    contents: `export * from './lib/body-display-catalog'; export * from './lib/anatomy-load-state'; export * from './lib/anatomy-practice'; export * from './lib/anatomy-link-registry'; export * from './lib/learning-resources'; export * from './lib/learning-anatomy'; export * from './lib/nested-learning-anatomy'; export {structures} from './app/anatomy-data'; export * from './app/body-content';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const untouched = JSON.stringify(catalog),
  display = api.bodyDisplayCatalog(catalog);
same(JSON.stringify(catalog), untouched, 'Archive untouched');
same(api.bodyDisplayCatalog(display), display, 'Idempotent');
same(display.structures.length, 1022);
same(
  display.structures.map((s) => s.id),
  catalog.structures.map((s) => s.id),
);
same(
  display.structures
    .filter(
      (s, i) => JSON.stringify(s) !== JSON.stringify(catalog.structures[i]),
    )
    .map((s) => s.fmaId)
    .sort(),
  ['FMA12514', 'FMA7198'],
);
same(
  display.structures.find((s) => s.id === original.id),
  replacement,
);
same(
  display.bundles.filter((b) => b.id === bundle.id),
  [bundle],
);
same(
  display.bundles.find((b) => b.id === original.bundle),
  correction.originalBundle,
);
const without = {
  ...catalog,
  structures: catalog.structures.filter(
    (s) => !['FMA12514', 'FMA7198'].includes(s.fmaId),
  ),
};
same(api.bodyDisplayCatalog(without), without);
for (const mutate of [
  (c) => c.structures.find((s) => s.id === original.id).sources.pop(),
  (c) => c.structures.find((s) => s.id === original.id).bounds.min[0]++,
  (c) => c.structures.push(c.structures.find((s) => s.id === original.id)),
  (c) =>
    (c.bundles.find((b) => b.id === original.bundle).sha256 = '0'.repeat(64)),
  (c) => (c.coordinateSystem.sourceToSceneColumnMajor[0] = 1),
  (c) => (c.sourceVersion = 'unknown'),
  (c) => c.bundles.push(bundle),
]) {
  const c = structuredClone(catalog);
  mutate(c);
  checks++;
  assert.throws(() => api.bodyDisplayCatalog(c));
}
for (const mutate of [
  (c) => (c.bundles = c.bundles.filter((b) => b.id !== bundle.id)),
  (c) => (c.bundles.find((b) => b.id === bundle.id).sha256 = '0'.repeat(64)),
  (c) => c.structures.find((s) => s.id === original.id).anchor[0]++,
]) {
  const c = structuredClone(display);
  mutate(c);
  checks++;
  assert.throws(() => api.bodyDisplayCatalog(c));
}
const systems = {
  skeleton: true,
  muscles: true,
  organs: true,
  nerves: true,
  vessels: true,
  connective: true,
};
same(api.requestedAnatomyBundles([replacement], systems, [], false), [
  bundle.id,
]);
same(
  api.requestedAnatomyBundles([replacement], systems, [replacement.id], false),
  [],
);
same(api.practicePool([replacement], [original.bundle]), []);
same(
  api.practicePool([replacement], [bundle.id]).map((s) => s.id),
  [replacement.id],
);
const oldEntry = api.bodyLinkEntries(catalog).find((s) => s.id === original.id),
  newEntry = api.bodyLinkEntries(display).find((s) => s.id === original.id);
same(newEntry.id, oldEntry.id);
same(newEntry.sources, replacement.sources);
const manifest = await json('public/models/bodyparts3d/manifest.json');
const archivedRepresentations = api.learningAnatomyRepresentations(catalog,manifest,api.structures);
const currentRepresentations = api.allLearningAnatomyRepresentations(catalog,manifest,api.structures);
same(currentRepresentations,api.allLearningAnatomyRepresentations(display,manifest,api.structures),'One current binding for raw and display callers');
same(currentRepresentations.length,1096);
same(currentRepresentations.find(r=>r.structureId===original.id).sources,replacement.sources);
same(currentRepresentations.filter(r=>r.scope!=='nested' && r.structureId!==original.id),archivedRepresentations.filter(r=>r.structureId!==original.id),'All other legacy bindings preserved');
check(
  api.learningAnatomyBindingKey({
    scope: 'body',
    structureId: original.id,
    sources: oldEntry.sources,
  }) !==
    api.learningAnatomyBindingKey({
      scope: 'body',
      structureId: original.id,
      sources: newEntry.sources,
    }),
  'Old four-source imaging/lecture binding must not silently match the new display',
);
for (const tab of [
  'anatomy',
  'function',
  'ct',
  'mri',
  'ultrasound',
  'clinical',
  'pathology',
  'quiz',
]) {
  same(
    api.bodyLesson(replacement, tab).readiness,
    api.bodyLesson(original, tab).readiness,
  );
  same(
    api.bodyLesson(replacement, tab).body,
    api.bodyLesson(original, tab).body,
  );
}
for (const change of [
  { ...replacement, anchor: [0, 0, 0] },
  { ...replacement, sources: replacement.sources.slice(0, 2) },
  { ...replacement, bundle: 'unknown' },
]) {
  same(api.isPancreasDisplayRecord(change), false);
  same(api.bodyLesson(change, 'clinical').readiness, 'pending');
}
const teachingPins = await json('content/nested-teaching-bindings.v1.json');
same(
  hash(JSON.stringify({
    ...teachingPins,
    parents: teachingPins.parents.filter(p => p.id !== original.id),
    bindings: teachingPins.bindings.filter(b => b.study !== 'pancreatic'),
  }, null, 2) + '\n'),
  '4ae3bf423a67da6eee5541579dea469297b22f04d8f2c7889ed40456a3084fb3',
  'All pre-dissection teaching bindings and parent records remain byte-equivalent',
);
const report = {
  passed: true,
  checks,
  retainedTriangles: 12690,
  omittedOverlappingTriangles: 4272,
  sourceFilesRetainedInArchive: 4,
  displaySourceFiles: 3,
  unchangedAnatomicalIds: 1022,
  newClinicalApprovals: 0,
  browserTesting: false,
  geometryPositionsUnchanged: true,
  oldResourceBindingsInvalidated: true,
};
await writeFile(
  'docs/pancreas-display-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
