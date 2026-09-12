import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3 } from 'three';
import { sourceObjShape, sourceTriangleSet } from './source-surface-audit.mjs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/subscapular-arteries'; export * from './lib/arterial'; export * from './lib/body-display-catalog'; export * from './lib/anatomy-link-registry'; export * from './lib/anatomy-coordinates'; export * from './lib/study-links'; export * from './app/dissection-data'; export {bodyLesson} from './app/body-content';",
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
const rawBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
assert.equal(
  createHash('sha256').update(rawBytes).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const raw = JSON.parse(rawBytes),
  before = JSON.stringify(raw),
  pins = JSON.parse(
    await readFile('public/models/bodyparts3d/subscapular-arteries/catalog.json'),
  );
const catalog = api.bodyDisplayCatalog(raw);
assert(
  !catalog.structures.some((s) => ['FMA44885', 'FMA44886'].includes(s.fmaId)),
);
assert.equal(raw.structures.length, 1022);
assert.equal(catalog.structures.length, 1087);
assert.equal(JSON.stringify(raw), before);
assert.equal(api.bodyDisplayCatalog(catalog), catalog);
assert.deepEqual(
  catalog.structures.filter((s) => s.bundle === 'subscapular-arteries'),
  pins.structures,
);
for (const s of catalog.structures.filter(s => s.bundle !== 'subscapular-arteries'))
  for (const tab of ['anatomy', 'function', 'quiz', 'ct', 'mri', 'xray', 'ultrasound', 'clinical', 'pathology'])
    assert.equal(api.subscapularArteryLesson(s, tab), undefined, `Preserve existing topic ${s.id}/${tab}`);
const detached = api.addSubscapularArteries(raw);
detached.structures.at(-1).anchor[0] = 999;
assert.deepEqual(
  api.addSubscapularArteries(raw).structures.slice(-2),
  pins.structures,
);
const unrelated = { ...raw, structures: [], bundles: [] };
assert.equal(api.addSubscapularArteries(unrelated), unrelated);
let rejections = 0;
const reject = (mutate) => {
  const bad = structuredClone(catalog);
  mutate(bad);
  assert.throws(() => api.addSubscapularArteries(bad));
  rejections++;
};
for (const p of [...pins.contextRecords, ...pins.structures]) {
  reject((c) => {
    c.structures = c.structures.filter((s) => s.id !== p.id);
  });
  reject((c) => {
    c.structures.push(structuredClone(p));
  });
  for (const mutate of [
    (s) => (s.anchor[0] += 0.01),
    (s) => (s.laterality = 'midline'),
    (s) => (s.sources[0].sha256 = 'changed'),
    (s) => (s.bundle = 'wrong'),
    (s) => (s.nodeName = 'wrong'),
  ])
    reject((c) => mutate(c.structures.find((s) => s.id === p.id)));
  reject((c) =>
    c.structures.push({ ...structuredClone(p), id: p.id + '-collision' }),
  );
}
for (const b of [...pins.contextBundles, ...pins.bundles]) {
  reject((c) => {
    c.bundles = c.bundles.filter((p) => p.id !== b.id);
  });
  reject((c) => c.bundles.push(structuredClone(b)));
  reject((c) => {
    c.bundles.find((p) => p.id === b.id).sha256 = 'changed';
  });
}
for (const field of ['sourceVersion', 'license', 'coordinateSystem'])
  reject((c) => {
    c[field] = 'changed';
  });
const bytes = await readFile(
  'public/models/bodyparts3d/subscapular-arteries/subscapular-arteries.glb',
);
assert.equal(
  createHash('sha256').update(bytes).digest('hex'),
  pins.bundles[0].sha256,
);
const scene = (
  await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  )
).scene;
const meshes = [];
scene.traverse((o) => {
  if (o.isMesh) meshes.push(o);
});
assert.equal(meshes.length, 2);
const sourceShapes = [];
let links = 0,
  triangles = 0;
const entries = api.bodyLinkEntries(catalog),
  transform = api.referenceTransform(catalog.coordinateSystem);
for (const s of pins.structures) {
  const mesh = meshes.find((m) => m.name === s.nodeName);
  assert(mesh);
  assert.equal(mesh.userData.structureId, s.id);
  const info = api.arterialNeighbours(
    catalog,
    'whole-body',
    s.laterality,
    s.id,
  );
  const upstream = info.rows.filter((r) => r.direction === 'upstream');
  assert.equal(upstream.length, 1);
  assert.equal(
    upstream[0].structure.fmaId,
    s.laterality === 'right' ? 'FMA22655' : 'FMA22656',
  );
  assert.equal(upstream[0].kind, 'branch');
  const branches = info.rows.filter(r => r.direction === 'downstream');
  assert.deepEqual(branches.map(r => r.structure.fmaId).sort(), (s.laterality === 'right' ? ['FMA23180','FMA66321'] : ['FMA23181','FMA66322']).sort());
  assert(info.rows.every((r) => r.structure.laterality === s.laterality));
  assert.match(api.bodyLesson(s, 'anatomy').body, /axillary/);

  const positions = mesh.geometry.attributes.position.array;
  const original = await readFile(
    'content/sources/subscapular-arteries/' + s.sources[0].file + '.obj',
  );
  assert.equal(
    createHash('sha256').update(original).digest('hex'),
    s.sources[0].sha256,
  );
  const shape = sourceObjShape(original),
    matrix = new Matrix4().fromArray(
      catalog.coordinateSystem.sourceToSceneColumnMajor,
    );
  sourceShapes.push(shape);
  assert.equal(mesh.geometry.index.count, shape.faces.length * 3);
  for (let f = 0; f < shape.faces.length; f++)
    for (let c = 0; c < 3; c++) {
      const expected = new Vector3(...shape.vertices[shape.faces[f][c]])
        .applyMatrix4(matrix)
        .toArray()
        .map(Math.fround);
      const i = mesh.geometry.index.array[f * 3 + c];
      assert.deepEqual(Array.from(positions.slice(i * 3, i * 3 + 3)), expected);
    }
  triangles += mesh.geometry.index.count / 3;
  assert(
    Array.from({ length: positions.length / 3 }, (_, i) =>
      Array.from(positions.slice(i * 3, i * 3 + 3)),
    ).some((p) => JSON.stringify(p) === JSON.stringify(s.anchor)),
  );
  assert(
    Array.from(
      { length: positions.length / 3 },
      (_, i) => positions[i * 3],
    ).every((x) => (s.laterality === 'right' ? x < 0 : x > 0)),
  );
  for (const region of ['whole-body', ...s.regions])
    for (const side of ['both', 'right', 'left']) {
      const href = api.makeStudyLink(catalog, region, s.id, side);
      if (side !== 'both' && side !== s.laterality) {
        assert.equal(href, null);
        continue;
      }
      assert(href);
      links++;
      const url = new URL(href, 'https://atlas.invalid');
      const parsed = api.parseStudyLink(Object.fromEntries(url.searchParams));
      assert.equal(
        api.resolveStudyLink(catalog, region, parsed).status,
        'ready',
      );
      const scope = api.bodyStudyScope(catalog, region, side),
        profile = api.dissectionProfiles[region];
      const removed = api.dissectionReducer(api.initialDissection, {
        type: 'remove',
        id: s.id,
      });
      assert(
        !api
          .resolveDissection(scope, profile, removed)
          .visible.some((v) => v.id === s.id),
      );
      assert(
        api
          .resolveDissection(
            scope,
            profile,
            api.dissectionReducer(removed, { type: 'undo' }),
          )
          .visible.some((v) => v.id === s.id),
      );
    }
  const entry = entries.find((e) => e.id === s.id);
  assert(entry);
  assert(!('frameOfReferenceUid' in entry.reference));
  const point = transform.toScene(entry.reference.point);
  point.forEach((v, i) => assert(Math.abs(v - s.center[i]) < 1e-8));
  assert.equal(
    api.resolveLinkedStructure(s.id, entries, [s.id]).status,
    'selected',
  );
  for (const tab of ['anatomy', 'function', 'quiz'])
    assert.equal(api.bodyLesson(s, tab).readiness, 'draft');
  for (const tab of [
    'ct',
    'mri',
    'xray',
    'ultrasound',
    'clinical',
    'pathology',
  ])
    assert.equal(api.bodyLesson(s, tab).readiness, 'pending');
  assert.equal(
    api.subscapularArteryLesson({ ...s, anchor: [0, 0, 0] }, 'anatomy'),
    undefined,
  );
}
assert.equal(triangles, 1576);
for (let i = 0; i < sourceShapes.length; i++)
  for (let j = i + 1; j < sourceShapes.length; j++) {
    const a = sourceTriangleSet(sourceShapes[i]),
      b = sourceTriangleSet(sourceShapes[j]);
    assert(![...a].some((t) => b.has(t)));
  }
console.log(
  JSON.stringify({
    sourceSelections: 2,
    displaySelections: catalog.structures.length,
    triangles,
    links,
    rejections,
    archivalCatalogUnchanged: true,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
