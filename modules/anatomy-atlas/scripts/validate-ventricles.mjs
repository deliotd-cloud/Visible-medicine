import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ts from 'typescript';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url);
const library = await build({
  entryPoints: ['lib/ventricles.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const libraryModule = { exports: {} };
runInNewContext(library.outputFiles[0].text, {
  module: libraryModule,
  exports: libraryModule.exports,
  require,
});
const { ventricleCatalog, ventriclesFor, initialVentricles, reduceVentricles } =
  libraryModule.exports;

let checks = 0;
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
    message,
  );
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const manifest = JSON.parse(
  await readFile('public/models/bodyparts3d/ventricles/catalog.json'),
);
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
same(manifest.parent, parent);
same(manifest.evidence, evidence);
same(manifest.coordinateSystem, catalog.coordinateSystem);
same(manifest.license, 'CC-BY-4.0');
same(manifest.structures.length, 9);
same(ventriclesFor(parent).length, 4);
const expected = [
  ['FMA78450', 'left lateral ventricle', 'left', 'FJ1767'],
  ['FMA78449', 'right lateral ventricle', 'right', 'FJ1814'],
  ['FMA78454', 'third ventricle', 'midline', 'FJ1730'],
  ['FMA78469', 'fourth ventricle', 'midline', 'FJ1731'],
];
const bundle = manifest.bundles.find((b) => b.id === 'ventricles');
const bytes = await readFile(
  'public' + new URL(bundle.url, 'https://local.invalid').pathname,
);
same(hash(bytes), bundle.sha256);
same(bytes.length, bundle.bytes);
check(bundle.url.endsWith('?v=' + bundle.sha256));
const gltf = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
  '',
);
const meshes = [];
gltf.scene.traverse((m) => {
  if (m.isMesh) meshes.push(m);
});
same(meshes.length, 4);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
// Cyclic ordering preserves winding; quantization is 0.001 source millimetres.
function triangleBag(geometry) {
  const p = geometry.getAttribute('position'),
    index = geometry.index;
  const bag = new Map(),
    count = index ? index.count : p.count;
  for (let i = 0; i < count; i += 3) {
    const vertices = [0, 1, 2].map((j) => {
      const at = index ? index.getX(i + j) : i + j;
      return [p.getX(at), p.getY(at), p.getZ(at)]
        .map((n) => Math.round(n * 1e5))
        .join(',');
    });
    const key = [0, 1, 2]
      .map((j) => [...vertices.slice(j), ...vertices.slice(0, j)].join('|'))
      .sort()[0];
    bag.set(key, (bag.get(key) ?? 0) + 1);
  }
  return bag;
}
let triangles = 0;
for (const [fmaId, name, side, file] of expected) {
  const layer = manifest.structures.find((s) => s.fmaId === fmaId);
  same(layer.sourceName, name);
  same(layer.laterality, side);
  same(layer.category, 'space');
  same(layer.validation, { status: 'unvalidated', anatomicalReview: false });
  const definition = records.find((r) => r.tree === 'partof' && r.id === fmaId);
  same(definition.files, [file]);
  same(definition.name, name);
  policy.assertNoKnownHolds([definition]);
  same(
    layer.sources,
    parent.sources.filter((s) => s.file === file),
  );
  const raw = await readFile('../work/bodyparts3d/partof/' + file + '.obj');
  same(hash(raw), layer.sources[0].sha256);
  const topology = sourceTopology(sourceObjShape(raw));
  same(topology, manifest.sourceReports.find((r) => r.file === file).topology);
  same(topology.components.length, 1);
  const rawMeshes = [];
  new OBJLoader().parse(raw.toString()).traverse((m) => {
    if (m.isMesh) rawMeshes.push(m);
  });
  same(rawMeshes.length, 1);
  const original = triangleBag(
    rawMeshes[0].geometry.clone().applyMatrix4(matrix),
  );
  const mesh = meshes.find((m) => m.name === layer.nodeName);
  same(mesh.userData.structureId, layer.id);
  const actual = triangleBag(mesh.geometry);
  same(actual.size, original.size);
  for (const [key, count] of original)
    same(
      actual.get(key),
      count,
      'Original source triangle and winding retained',
    );
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  same(geometry.boundingBox.min.toArray(), layer.bounds.min);
  same(geometry.boundingBox.max.toArray(), layer.bounds.max);
  same(geometry.boundingBox.getCenter(new Vector3()).toArray(), layer.center);
  const p = geometry.getAttribute('position');
  let anchor = false;
  for (let i = 0; i < p.count; i++) {
    check([p.getX(i), p.getY(i), p.getZ(i)].every(Number.isFinite));
    anchor ||= [p.getX(i), p.getY(i), p.getZ(i)].every(
      (v, j) => v === layer.anchor[j],
    );
  }
  check(anchor, 'Label anchor belongs to retained surface');
  triangles += topology.triangles;
}
same(triangles, 46794);
for (const id of manifest.contextIds)
  same(
    manifest.structures.find((s) => s.id === id),
    catalog.structures.find((s) => s.id === id),
  );
check(
  !manifest.structures.some((s) => s.id === parent.id),
  'No parent/child overlapping render',
);
same(
  new Set(manifest.structures.flatMap((s) => s.sources.map((f) => f.file)))
    .size,
  9,
);
for (const b of manifest.bundles.filter((b) => b.id !== 'ventricles')) {
  same(
    b,
    catalog.bundles.find((v) => v.id === b.id),
  );
  same(
    hash(
      await readFile(
        'public' + new URL(b.url, 'https://local.invalid').pathname,
      ),
    ),
    b.sha256,
  );
}
for (const mutation of [
  { id: parent.id + '-other' },
  { fmaId: 'FMA0' },
  { name: 'Unbound brain' },
  { sourceTree: 'isa' },
  { system: 'organs' },
  { category: 'space' },
  { laterality: 'left' },
  { region: 'thorax' },
  { regions: ['head-neck', 'thorax'] },
  { nodeName: 'other' },
  { bundle: 'other' },
  { sources: [] },
  { sources: parent.sources.slice(1) },
  { sources: [...parent.sources, parent.sources[0]] },
  { sources: [parent.sources[1], ...parent.sources.slice(1)] },
  {
    sources: [
      { ...parent.sources[0], sha256: '0'.repeat(64) },
      ...parent.sources.slice(1),
    ],
  },
])
  same(ventriclesFor({ ...parent, ...mutation }), []);
same(ventriclesFor(null), []);
const layers = ventriclesFor(parent);
let state = initialVentricles(layers);
for (const value of ['lateral', 'midline', 'all']) {
  state = reduceVentricles(layers, state, { type: 'preset', value });
  same(layers.length - state.hidden.length, value === 'all' ? 4 : 2);
}
for (const layer of layers) {
  state = reduceVentricles(layers, state, { type: 'select', id: layer.id });
  const before = structuredClone(state);
  state = reduceVentricles(layers, state, {
    type: 'visibility',
    id: layer.id,
    visible: false,
  });
  same(state.selectedId, null);
  state = reduceVentricles(layers, state, { type: 'undo' });
  same(state, before);
}
for (let i = 0; i < 65; i++)
  state = reduceVentricles(layers, state, {
    type: 'preset',
    value: i % 2 ? 'lateral' : 'midline',
  });
same(state.history.length, 30);
const before = structuredClone(state);
same(
  reduceVentricles(layers, state, {
    type: 'select',
    id: manifest.contextIds[0],
  }),
  state,
);
same(state, before, 'No mutable history update');
for (const layer of layers)
  state = reduceVentricles(layers, state, {
    type: 'visibility',
    id: layer.id,
    visible: false,
  });
same(state.hidden.length, 4);
state = reduceVentricles(layers, state, { type: 'preset', value: 'all' });
same(state.hidden, []);

const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let open, close;
function visit(n) {
  if (
    ts.isJsxAttribute(n) &&
    n.name.text === 'onClick' &&
    n.initializer?.getText(ast).includes('setVentricleParent(selected)')
  )
    open = n.initializer.expression.getText(ast);
  if (ts.isVariableDeclaration(n) && n.name.getText(ast) === 'closeVentricles')
    close = n.initializer.arguments[0].getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
check(open && close);
let chosen,
  focused = 0;
const env = {
  selected: parent,
  cameraCapture: { current: { pan: [1, 2, 3], distance: 4 } },
  cameraRestore: { current: null },
  copyRecoveryCamera: structuredClone,
  setVentricleParent: (p) => {
    chosen = p;
  },
  requestAnimationFrame: (f) => f(),
  ventricleLauncher: { current: { focus: () => focused++ } },
};
runInNewContext(`(${open})();`, env);
same(chosen, parent);
same(env.cameraRestore.current, env.cameraCapture.current);
check(env.cameraRestore.current !== env.cameraCapture.current);
runInNewContext(`(${close})();`, env);
same(chosen, null);
same(focused, 1);
check(source.includes('!eyeParent && !ventricleParent &&'));
check(
  source.includes(
    'ventricleParent && !exam && ventricleParent.id === selectedId',
  ),
);
check(source.includes('!exam && ventriclesFor(selected).length > 0'));
const ui = await readFile('app/ventricles.tsx', 'utf8');
check(ui.includes('!context || explode > 0'));
check(ui.includes('disabled={explode > 0}'));
check(ui.includes('landmarks={ventricleCatalog.ventricularIds}'));
const compiled = await build({
  entryPoints: ['app/ventricles.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'ventricular-gpu-fixture',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents:
            'export const BodyScene=()=>null; export const retryBodyAssets=()=>{};',
          loader: 'tsx',
        }));
      },
    },
  ],
});
const React = require('react');
const testModule = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: testModule,
  exports: testModule.exports,
  require,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
const html = require('react-dom/server').renderToStaticMarkup(
  React.createElement(testModule.exports.VentricularView, { parent }),
);
same((html.match(/role="switch"/g) || []).length, 4);
for (const text of [
  'All four spaces',
  'Show brain context',
  'Undo layers',
  'Reassemble',
  'Space representation',
  'CC BY 4.0 licence',
])
  check(html.includes(text));
same(ventricleCatalog.ventricularIds, manifest.ventricularIds);
const report = {
  passed: true,
  checks,
  selectableSpaces: 4,
  existingContextStructures: 5,
  triangles,
  bytes: bytes.length,
  sha256: hash(bytes),
  originalBrainFiles: 59,
  detachedFiles: 4,
  parentModified: false,
  coordinatesReconstructed: false,
  clinicalApproval: false,
  browserInteractionTesting: false,
  publishedPatientScans: false,
};
await writeFile(
  'docs/ventricles-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
