import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape, mergeSourceShapes } from './source-surface-audit.mjs';
import { build } from './workspace-test-build.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/cranial-arteries'; export * from './lib/body-display-catalog'; export * from './lib/arterial'; export * from './lib/study-links'; export * from './lib/anatomy-link-registry'; export * from './lib/anatomy-coordinates'; export * from './app/dissection-data'; export {bodyLesson} from './app/body-content';",
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
  hash(rawBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const raw = JSON.parse(rawBytes),
  before = JSON.stringify(raw),
  catalog = api.bodyDisplayCatalog(raw);
const data = JSON.parse(
  await readFile('public/models/bodyparts3d/cranial-arteries/catalog.json'),
);
const audit = JSON.parse(
  await readFile('docs/cranial-artery-source-audit.json'),
);
assert.equal(catalog.structures.length, 1087);
assert.equal(new Set(catalog.structures.map((s) => s.id)).size, 1087);
assert.equal(new Set(catalog.structures.map((s) => s.fmaId)).size, 1087);
assert.equal(JSON.stringify(raw), before);
assert.equal(api.bodyDisplayCatalog(catalog), catalog);
assert.deepEqual(
  catalog.structures.filter((s) => s.bundle === 'cranial-arteries'),
  data.structures,
);
assert.equal(audit.screened.length, 1082);
// Every previous display record remains byte-for-byte equivalent, not merely equal in count.
assert.deepEqual(
  catalog.structures
    .filter((s) => s.bundle !== 'cranial-arteries')
    .map((s) => ({ id: s.id, recordSha256: hash(JSON.stringify(s)) })),
  audit.screened.map(({ id, recordSha256 }) => ({ id, recordSha256 })),
);
assert.deepEqual(audit.conflicts, []);
assert.deepEqual(audit.overlaps, []);
assert(
  audit.pairChecks.every(
    (p) => !p.sharedTriangles && !p.translatedDiagnostic?.similar,
  ),
);
assert(
  !catalog.structures.some((s) => ['FMA50544', 'FMA50083'].includes(s.fmaId)),
  'Do not admit deferred AICA or invent left MCA',
);
const unrelated = { ...raw, structures: [], bundles: [] };
assert.equal(api.addCranialArteries(unrelated), unrelated);
const detached = api.addCranialArteries(raw);
detached.structures.at(-1).anchor[0] = 999;
assert.deepEqual(
  api.addCranialArteries(raw).structures.slice(-5),
  data.structures,
);
let rejected = 0;
for (const record of [...data.contextRecords, ...data.structures])
  for (const change of ['missing', 'duplicate', 'geometry', 'source', 'side']) {
    const bad = structuredClone(catalog),
      s = bad.structures.find((s) => s.id === record.id);
    if (change === 'missing')
      bad.structures = bad.structures.filter((s) => s.id !== record.id);
    if (change === 'duplicate') bad.structures.push(structuredClone(s));
    if (change === 'geometry') s.center[0] += 0.01;
    if (change === 'source') s.sources[0].sha256 = 'changed';
    if (change === 'side') s.laterality = 'wrong';
    assert.throws(() => api.addCranialArteries(bad));
    rejected++;
  }
for (const field of ['sourceVersion', 'license', 'coordinateSystem']) {
  const bad = structuredClone(catalog);
  bad[field] = 'changed';
  assert.throws(() => api.addCranialArteries(bad));
  rejected++;
}
for (const b of [...data.contextBundles, ...data.bundles]) {
  const bad = structuredClone(catalog);
  bad.bundles.find((x) => x.id === b.id).sha256 = 'changed';
  assert.throws(() => api.addCranialArteries(bad));
  rejected++;
}
const bytes = await readFile(
  'public/models/bodyparts3d/cranial-arteries/cranial-arteries.glb',
);
assert.equal(hash(bytes), data.bundles[0].sha256);
const loaded = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
const meshes = [];
loaded.scene.traverse((m) => {
  if (m.isMesh) meshes.push(m);
});
assert.equal(meshes.length, 5);
const matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  ),
  entries = api.bodyLinkEntries(catalog),
  transform = api.referenceTransform(catalog.coordinateSystem);
let triangles = 0,
  links = 0,
  sourceFiles = 0;
for (const s of data.structures) {
  const mesh = meshes.find((m) => m.name === s.nodeName);
  assert(mesh);
  assert.equal(mesh.userData.structureId, s.id);
  const parts = [];
  for (const f of s.sources) {
    const original = await readFile(
      `content/sources/cranial-arteries/${s.sourceTree}/${f.file}.obj`,
    );
    assert.equal(hash(original), f.sha256);
    parts.push(sourceObjShape(original));
    sourceFiles++;
  }
  const shape = mergeSourceShapes(parts),
    positions = mesh.geometry.attributes.position.array,
    indices = mesh.geometry.index.array;
  assert.equal(indices.length, shape.faces.length * 3);
  for (let f = 0; f < shape.faces.length; f++)
    for (let c = 0; c < 3; c++) {
      const expected = new Vector3(...shape.vertices[shape.faces[f][c]])
          .applyMatrix4(matrix)
          .toArray()
          .map(Math.fround),
        i = indices[f * 3 + c];
      assert.deepEqual(Array.from(positions.slice(i * 3, i * 3 + 3)), expected);
    }
  triangles += indices.length / 3;
  assert(
    Array.from({ length: positions.length / 3 }, (_, i) =>
      Array.from(positions.slice(i * 3, i * 3 + 3)),
    ).some((p) => JSON.stringify(p) === JSON.stringify(s.anchor)),
  );
  const info = api.arterialNeighbours(catalog, 'head-neck', s.laterality, s.id),
    upstream = info.rows.filter((r) => r.direction === 'upstream');
  assert.equal(upstream.length, 1);
  assert.equal(upstream[0].kind, 'branch');
  assert.equal(
    upstream[0].structure.fmaId,
    s.fmaId === 'FMA50082'
      ? 'FMA3949'
      : ['FMA50519', 'FMA50520'].includes(s.fmaId)
        ? s.laterality === 'right'
          ? 'FMA3958'
          : 'FMA4066'
        : 'FMA50542',
  );
  const entry = entries.find((e) => e.id === s.id);
  assert(entry);
  assert(!('frameOfReferenceUid' in entry.reference));
  transform
    .toScene(entry.reference.point)
    .forEach((v, i) => assert(Math.abs(v - s.center[i]) < 1e-8));
  assert.equal(
    api.resolveLinkedStructure(s.id, entries, [s.id]).status,
    'selected',
  );
  for (const region of ['whole-body', 'head-neck'])
    for (const side of ['both', 'left', 'right']) {
      const href = api.makeStudyLink(catalog, region, s.id, side);
      if (side !== 'both' && side !== s.laterality) {
        assert.equal(href, null);
        continue;
      }
      assert(href);
      const url = new URL(href, 'https://example.invalid');
      assert.equal(
        api.resolveStudyLink(
          catalog,
          region,
          api.parseStudyLink(Object.fromEntries(url.searchParams)),
        ).status,
        'ready',
      );
      links++;
      const scope = api.bodyStudyScope(catalog, region, side),
        profile = api.dissectionProfiles[region],
        removed = api.dissectionReducer(api.initialDissection, {
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
    api.cranialArteryLesson({ ...s, anchor: [0, 0, 0] }, 'anatomy'),
    undefined,
  );
}
for (const s of catalog.structures.filter(
  (s) => s.bundle !== 'cranial-arteries',
))
  for (const tab of [
    'anatomy',
    'function',
    'quiz',
    'ct',
    'mri',
    'xray',
    'ultrasound',
    'clinical',
    'pathology',
  ])
    assert.equal(api.cranialArteryLesson(s, tab), undefined);
assert.equal(sourceFiles, 31);
assert.equal(triangles, 11234);
assert.equal(links, 20);
console.log(
  JSON.stringify({
    selections: 5,
    displaySelections: 1087,
    preservedPreviousRecords: 1082,
    sourceFiles,
    triangles,
    exactVertexCoordinates: triangles * 3,
    rejectedSourceMutations: rejected,
    roundTripStudyLinks: links,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
