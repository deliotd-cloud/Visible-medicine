import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { build } from './workspace-test-build.mjs';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const baseline = 'e2b3ff0e5c9d310455c7caf7ba5726a5af5b2f3f';
const tabs = [
  'anatomy',
  'function',
  'quiz',
  'ct',
  'mri',
  'xray',
  'ultrasound',
  'clinical',
  'pathology',
];
const code =
  "export * from './lib/elbow-arteries'; export * from './lib/arterial'; export * from './lib/body-display-catalog'; export * from './lib/study-links'; export * from './app/dissection-data'; export {bodyLesson} from './app/body-content';";
const options = {
  stdin: { contents: code, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
};
async function apiFor(options) {
  const compiled = await build(options);
  return import(
    'data:text/javascript;base64,' +
      Buffer.from(compiled.outputFiles[0].text).toString('base64')
  );
}
const api = await apiFor(options);
const raw = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
const before = JSON.stringify(raw),
  pins = JSON.parse(
    await readFile('public/models/bodyparts3d/elbow-arteries/catalog.json'),
  );
const catalog = api.bodyDisplayCatalog(raw);
assert.equal(JSON.stringify(raw), before);
assert.equal(api.bodyDisplayCatalog(catalog), catalog);
assert.deepEqual(
  catalog.structures.filter((s) => s.bundle === 'elbow-arteries'),
  pins.structures,
);
assert.equal(pins.structures.length, 14);
// Validate the actual current export, independently of the legacy review-history
// reconstruction. Schema success is not source admission or clinical approval.
const context = await contentContext();
const bodyRecords = context.api.bodyContentRecords(catalog);
const registry = new Map(
  [...context.shoulder, ...bodyRecords].map((r) => [
    `${r.representationScope}|${r.id}`,
    r,
  ]),
);
assert.equal(registry.size, context.shoulder.length + bodyRecords.length);
const validateContent = await contentValidator(registry);
for (const record of bodyRecords) assert(validateContent(record), record.id);
assert.equal(bodyRecords.length, 1101);
console.log(JSON.stringify({ currentBodySchemaRecords: bodyRecords.length }));
if (process.argv.includes('--baseline')) {
  const old = await apiFor({
    ...options,
    stdin: {
      ...options.stdin,
      contents:
        "export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content';",
    },
    plugins: [
      {
        name: 'pinned-pre-elbow',
        setup(b) {
          b.onLoad(
            {
              filter:
                /(?:body-display-catalog|body-content|upper-limb-arterial)\.ts$/,
            },
            (args) => {
              const path = args.path
                .replaceAll('\\', '/')
                .split('/outputs/')
                .at(-1);
              return {
                contents: execFileSync('git', ['show', `${baseline}:${path}`], {
                  encoding: 'utf8',
                }),
                loader: 'ts',
                resolveDir: dirname(args.path),
              };
            },
          );
        },
      },
    ],
  });
  const original = old.bodyDisplayCatalog(raw);
  const rows = original.structures.map((s) => [
    s,
    tabs.map((t) => old.bodyLesson(s, t)),
  ]);
  assert.deepEqual(
    catalog.structures
      .filter((s) => s.bundle !== 'elbow-arteries')
      .map((s) => [s, tabs.map((t) => api.bodyLesson(s, t))]),
    rows,
  );
  console.log(
    JSON.stringify({
      baselineSelections: rows.length,
      baselineTeachingSha256: hash(JSON.stringify(rows)),
    }),
  );
  const { authoringBeforeWristImaging } =
    await import('./wrist-imaging-history.mjs');
  const legacy = (bodyLesson) => {
    const historical = authoringBeforeWristImaging({
      ...context,
      api: { ...context.api, bodyLesson },
    });
    return hash(
      JSON.stringify({
        body: context.catalog.structures.map((s) => ({
          id: s.id,
          sections: Object.fromEntries(
            context.api.contentTabs.map((t) => [
              t,
              historical.bodyLesson(s, t),
            ]),
          ),
        })),
        shoulder: context.api.structures,
        recipes: historical.dissectionProfiles,
      }),
    );
  };
  const oldLegacy = legacy(old.bodyLesson),
    newLegacy = legacy(api.bodyLesson);
  assert.equal(
    oldLegacy,
    newLegacy,
    'Elbow changes altered the legacy teaching reconstruction',
  );
  console.log(
    JSON.stringify({
      baselineLegacyTeachingSha256: oldLegacy,
      currentLegacyTeachingSha256: newLegacy,
    }),
  );
}
const currentOld = catalog.structures
  .filter((s) => s.bundle !== 'elbow-arteries')
  .map((s) => [s, tabs.map((t) => api.bodyLesson(s, t))]);
// The pinned pre-admission hash is recorded after --baseline compares the actual old authoring branches.
const baselineHash =
  'f564fd8b92d75dc497c3e7fe90744f7a232764c5620d85435d0aa2d9581d01ea';
assert.equal(hash(JSON.stringify(currentOld)), baselineHash);
const bytes = await readFile(
  'public/models/bodyparts3d/elbow-arteries/elbow-arteries.glb',
);
assert.equal(hash(bytes), pins.bundles[0].sha256);
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
assert.equal(meshes.length, 14);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
let triangles = 0,
  links = 0,
  communicationDirections = 0,
  rejections = 0;
for (const s of pins.structures) {
  const mesh = meshes.find((m) => m.name === s.nodeName);
  assert(mesh);
  assert.equal(mesh.userData.structureId, s.id);
  assert.equal(mesh.userData.anatomicalReview, false);
  const original = await readFile(
    `content/sources/elbow-arteries/${s.sources[0].file}.obj`,
  );
  assert.equal(hash(original), s.sources[0].sha256);
  const shape = sourceObjShape(original),
    positions = mesh.geometry.attributes.position.array,
    indices = mesh.geometry.index.array;
  assert.equal(indices.length, shape.faces.length * 3);
  shape.faces.forEach((f, i) =>
    f.forEach((v, corner) => {
      const expected = new Vector3(...shape.vertices[v])
          .applyMatrix4(matrix)
          .toArray()
          .map(Math.fround),
        offset = indices[i * 3 + corner] * 3;
      assert.deepEqual(
        Array.from(positions.slice(offset, offset + 3)),
        expected,
      );
    }),
  );
  triangles += shape.faces.length;
  assert(
    Array.from({ length: positions.length / 3 }, (_, i) =>
      Array.from(positions.slice(i * 3, i * 3 + 3)),
    ).some((p) => JSON.stringify(p) === JSON.stringify(s.anchor)),
  );
  const info = api.arterialNeighbours(
    catalog,
    'whole-body',
    s.laterality,
    s.id,
  );
  assert(info, `Missing arterial navigation ${s.fmaId}`);
  assert.equal(info.rows.filter((r) => r.direction === 'upstream').length, 1);
  assert(info.rows.every((r) => r.structure.laterality === s.laterality));
  assert.equal(
    api.arterialNeighbours(catalog, 'whole-body', s.laterality, s.id, true),
    null,
  );
  assert.equal(info.references.length, new Set(info.references).size);
  for (const r of info.rows) {
    const back = api.arterialNeighbours(
      catalog,
      'whole-body',
      s.laterality,
      r.structure.id,
    );
    assert(back.rows.some((p) => p.structure.id === s.id && p.kind === r.kind));
    if (r.kind === 'anastomosis') communicationDirections++;
  }
  for (const region of ['whole-body', ...s.regions]) {
    const href = api.makeStudyLink(catalog, region, s.id, s.laterality);
    assert(href);
    links++;
    const scope = api.bodyStudyScope(catalog, region, s.laterality),
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
    const restored = api.dissectionReducer(removed, { type: 'undo' });
    assert(
      api
        .resolveDissection(scope, profile, restored)
        .visible.some((v) => v.id === s.id),
    );
    assert(
      !api
        .resolveDissection(
          scope,
          profile,
          api.dissectionReducer(restored, { type: 'redo' }),
        )
        .visible.some((v) => v.id === s.id),
    );
  }
  for (const tab of tabs)
    assert.equal(
      api.bodyLesson(s, tab).readiness,
      ['anatomy', 'function', 'quiz'].includes(tab) ? 'draft' : 'pending',
    );
  assert.equal(
    api.elbowArteryLesson({ ...s, anchor: [0, 0, 0] }, 'anatomy'),
    undefined,
  );
}
for (const p of [...pins.contextRecords, ...pins.structures]) {
  const bad = structuredClone(catalog);
  bad.structures.find((s) => s.id === p.id).sources[0].sha256 = 'changed';
  assert.throws(() => api.addElbowArteries(bad));
  rejections++;
}
for (const field of ['sourceVersion', 'license', 'coordinateSystem']) {
  const bad = structuredClone(catalog);
  bad[field] = 'changed';
  assert.throws(() => api.addElbowArteries(bad));
  rejections++;
}
assert.equal(triangles, 18606);
assert.equal(communicationDirections, 14);
assert(
  !catalog.structures.some((s) => ['FMA18919', 'FMA18907'].includes(s.fmaId)),
  'Pelvic source holds remain',
);
console.log(
  JSON.stringify({
    sourceSelections: 14,
    displaySelections: catalog.structures.length,
    triangles,
    links,
    communicationDirections,
    rejections,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
