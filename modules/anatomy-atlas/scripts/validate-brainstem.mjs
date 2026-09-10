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
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const library = await build({
  stdin: {
    contents:
      "export * from './lib/brainstem'; export * from './lib/ventricles';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
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
const {
  brainstemFor,
  brainstemCatalog: manifest,
  brainstemPresets,
  initialVentricles,
  reduceVentricles,
  ventricleCatalog,
} = libraryModule.exports;
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
same(manifest.parent, parent);
same(manifest.evidence, evidence);
same(manifest.coordinateSystem, catalog.coordinateSystem);
same(manifest.license, 'CC-BY-4.0');
same(manifest.credit, catalog.credit);
same(manifest.structures.length, 5);
const layers = brainstemFor(parent);
same(layers.length, 4);
const definitions = [
  [
    'FMA61993',
    'midbrain',
    ['FJ1738', 'FJ1762', 'FJ1770', 'FJ1779', 'FJ1810', 'FJ1817', 'FJ1826'],
  ],
  ['FMA67943', 'pons', ['FJ1775', 'FJ1822']],
  ['FMA62004', 'medulla oblongata', ['FJ1769', 'FJ1831']],
  ['FMA67944', 'cerebellum', ['FJ1781', 'FJ1830']],
];
const bundle = manifest.bundles.find((b) => b.id === 'brainstem');
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
// Retain winding and triangle multiplicity, quantized to 0.001 source mm.
function triangleBag(geometry, bag = new Map()) {
  const p = geometry.getAttribute('position'),
    index = geometry.index,
    count = index ? index.count : p.count;
  for (let i = 0; i < count; i += 3) {
    const v = [0, 1, 2].map((j) => {
      const at = index ? index.getX(i + j) : i + j;
      return [p.getX(at), p.getY(at), p.getZ(at)]
        .map((n) => Math.round(n * 1e5))
        .join(',');
    });
    const key = [0, 1, 2]
      .map((j) => [...v.slice(j), ...v.slice(0, j)].join('|'))
      .sort(compare)[0];
    bag.set(key, (bag.get(key) ?? 0) + 1);
  }
  return bag;
}
let triangles = 0;
for (const [fmaId, name, files] of definitions) {
  const layer = layers.find((s) => s.fmaId === fmaId);
  const definition = records.find((r) => r.tree === 'partof' && r.id === fmaId);
  same(definition.files, files);
  same(definition.name, name);
  policy.assertNoKnownHolds([definition]);
  same(layer.sourceName, name);
  same(layer.laterality, 'midline');
  same(layer.category, 'organ');
  same(layer.validation, { status: 'unvalidated', anatomicalReview: false });
  same(
    layer.sources,
    files.map((f) => parent.sources.find((s) => s.file === f)),
  );
  const original = new Map();
  for (const source of layer.sources) {
    const raw = await readFile(
      '../work/bodyparts3d/partof/' + source.file + '.obj',
    );
    same(hash(raw), source.sha256);
    const topology = sourceTopology(sourceObjShape(raw));
    same(
      topology,
      manifest.sourceReports.find((r) => r.file === source.file).topology,
    );
    same(
      topology.components.length,
      source.file === 'FJ1775' ? 2 : source.file === 'FJ1822' ? 3 : 1,
    );
    same(topology.duplicateFaces, source.file === 'FJ1822' ? 2 : 0);
    for (const key of [
      'collapsedFaces',
      'degenerateFaces',
      'boundaryEdges',
      'nonManifoldEdges',
      'nonManifoldVertices',
      'inconsistentWindingEdges',
    ])
      same(topology[key], 0);
    new OBJLoader().parse(raw.toString()).traverse((m) => {
      if (m.isMesh)
        triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
    });
    triangles += topology.triangles;
  }
  const mesh = meshes.find((m) => m.name === layer.nodeName);
  same(mesh.userData.structureId, layer.id);
  same(mesh.userData.parentId, parent.id);
  const actual = triangleBag(mesh.geometry);
  same(actual.size, original.size);
  for (const [key, count] of original)
    same(
      actual.get(key),
      count,
      'Source triangles, winding and duplicate multiplicity retained',
    );
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  same(geometry.boundingBox.min.toArray(), layer.bounds.min);
  same(geometry.boundingBox.max.toArray(), layer.bounds.max);
  same(geometry.boundingBox.getCenter(new Vector3()).toArray(), layer.center);
  const p = geometry.getAttribute('position'),
    n = geometry.getAttribute('normal');
  let hasAnchor = false;
  for (let i = 0; i < p.count; i++) {
    check(
      [p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)].every(
        Number.isFinite,
      ),
    );
    hasAnchor ||= [p.getX(i), p.getY(i), p.getZ(i)].every(
      (v, j) => v === layer.anchor[j],
    );
  }
  check(hasAnchor);
}
same(triangles, 94588);
same(new Set(layers.flatMap((s) => s.sources.map((f) => f.file))).size, 13);
same(
  new Set(manifest.structures.flatMap((s) => s.sources.map((f) => f.file)))
    .size,
  14,
);
same(
  layers
    .slice(0, 3)
    .flatMap((s) => s.sources.map((f) => f.file))
    .sort(compare),
  records
    .find((r) => r.tree === 'partof' && r.id === 'FMA79876')
    .files.slice()
    .sort(compare),
);
check(!manifest.structures.some((s) => s.id === parent.id));
same(manifest.contextIds.length, 1);
for (const id of manifest.contextIds)
  same(
    manifest.structures.find((s) => s.id === id),
    ventricleCatalog.structures.find((s) => s.id === id),
  );
same(
  manifest.structures.find((s) => s.id === manifest.contextIds[0]).fmaId,
  'FMA78469',
);
const contextBundle = manifest.bundles.find((b) => b.id === 'ventricles');
same(
  contextBundle,
  ventricleCatalog.bundles.find((b) => b.id === 'ventricles'),
);
same(
  hash(
    await readFile(
      'public' + new URL(contextBundle.url, 'https://local.invalid').pathname,
    ),
  ),
  contextBundle.sha256,
);
for (const mutation of [
  { id: 'bad' },
  { fmaId: 'FMA0' },
  { name: 'Other' },
  { sourceTree: 'isa' },
  { system: 'organs' },
  { laterality: 'left' },
  { region: 'thorax' },
  { category: 'space' },
  { regions: ['head-neck', 'thorax'] },
  { bundle: 'other' },
  { nodeName: 'other' },
  { sources: [] },
  { sources: parent.sources.slice(1) },
  { sources: [...parent.sources, parent.sources[0]] },
  {
    sources: [
      { ...parent.sources[0], sha256: '0'.repeat(64) },
      ...parent.sources.slice(1),
    ],
  },
])
  same(brainstemFor({ ...parent, ...mutation }), []);
same(brainstemFor(null), []);
const savedName = manifest.parent.name;
manifest.parent.name = 'stale sidecar';
same(brainstemFor(parent), []);
manifest.parent.name = savedName;
const presets = brainstemPresets(layers);
let state = initialVentricles(layers);
const reduce = (action) => {
  state = reduceVentricles(layers, state, action, presets);
  return state;
};
for (const [value, count] of [
  ['brainstem', 3],
  ['cerebellum', 1],
  ['all', 4],
]) {
  reduce({ type: 'preset', value });
  same(layers.length - state.hidden.length, count);
  check(!state.hidden.includes(state.selectedId));
}
for (const value of ['unknown', '__proto__', 'toString', 'lateral']) {
  const before = state;
  reduce({ type: 'preset', value });
  check(state === before);
}
for (const layer of layers) {
  reduce({ type: 'select', id: layer.id });
  const before = structuredClone(state);
  reduce({ type: 'visibility', id: layer.id, visible: false });
  same(state.selectedId, null);
  reduce({ type: 'undo' });
  same({ ...state, future: before.future }, before);
  check(state.future.length > 0);
  reduce({ type: 'visibility', id: layer.id, visible: false });
  reduce({ type: 'select', id: layer.id });
  check(!state.hidden.includes(layer.id));
}
const beforeContext = state;
reduce({ type: 'select', id: manifest.contextIds[0] });
check(state === beforeContext);
for (let i = 0; i < 65; i++)
  reduce({ type: 'preset', value: i % 2 ? 'brainstem' : 'cerebellum' });
same(state.history.length, 30);
for (const layer of layers)
  reduce({ type: 'visibility', id: layer.id, visible: false });
same(state.hidden.length, 4);
same(state.selectedId, null);
reduce({ type: 'preset', value: 'all' });
same(state.hidden, []);

const source = await readFile('app/ventricles.tsx', 'utf8');
const ast = ts.createSourceFile(
  'view.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let changeStudy;
function visit(node) {
  if (
    ts.isJsxAttribute(node) &&
    node.name.text === 'onValueChange' &&
    node.initializer?.getText(ast).includes('setStudy(v)')
  )
    changeStudy = node.initializer.expression.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
check(changeStudy);
let current = 'brainstem';
const env = {
  setStudy: (v) => {
    current = v;
  },
};
for (const value of ['ventricles', 'brainstem']) {
  runInNewContext(`(${changeStudy})('${value}')`, env);
  same(current, value);
}
runInNewContext(`(${changeStudy})('unknown')`, env);
same(current, 'brainstem');
check(
  source.includes('key={`${parent.id}:${study}`}'),
  'Study switch remounts and clears old selection, visibility, loading and camera state',
);
check(source.includes('!context || explode > 0'));
check(source.includes('disabled={explode > 0}'));
check(source.includes('landmarks={selectableIds}'));

const compiled = await build({
  entryPoints: ['app/ventricles.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'brain-gpu-fixture',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents:
            'export const BodyScene=(props)=>{globalThis.__scene=props;return null}; export const retryBodyAssets=()=>{};',
          loader: 'tsx',
        }));
      },
    },
  ],
});
const React = require('react'),
  uiModule = { exports: {} },
  uiEnv = {
    module: uiModule,
    exports: uiModule.exports,
    require,
    console,
    process: { env: { NODE_ENV: 'test' } },
  };
runInNewContext(compiled.outputFiles[0].text, uiEnv);
for (const study of ['brainstem', 'ventricles']) {
  const html = require('react-dom/server').renderToStaticMarkup(
    React.createElement(uiModule.exports.VentricularView, { parent, study }),
  );
  const switches = html.match(/<[^>]*role="switch"[^>]*>/g) || [];
  same(switches.filter((tag) => tag.includes('aria-label="Show original position"')).length, 1);
  same(switches.filter((tag) => !tag.includes('aria-label="Show original position"')).length, 4);
  for (const text of study === 'brainstem'
    ? [
        'Brainstem and cerebellum',
        'Midbrain',
        'Pons',
        'Medulla oblongata',
        'Cerebellum',
        'Show fourth ventricle',
        'Source compound',
        'duplicate faces',
      ]
    : ['All four spaces', 'Show brain context', 'Space representation'])
    check(html.includes(text));
  for (const text of ['Undo layers', 'Reassemble', 'CC BY 4.0 licence'])
    check(html.includes(text));
  const scene = uiEnv.__scene;
  same(scene.structures.length, study === 'brainstem' ? 5 : 9);
  same(scene.landmarks.length, 4);
  check(!scene.structures.some((s) => s.id === parent.id));
  for (const id of study === 'brainstem'
    ? manifest.contextIds
    : ventricleCatalog.contextIds) {
    check(scene.hiddenIds.includes(id));
    check(scene.appearance[id].opacity < 0.2);
    check(!scene.landmarks.includes(id));
  }
  same(scene.explode, 0);
}
const report = {
  passed: true,
  checks,
  selectableCompounds: 4,
  sourceFiles: 13,
  existingContextSpaces: 1,
  triangles,
  bytes: bytes.length,
  sha256: hash(bytes),
  originalBrainFiles: 59,
  parentModified: false,
  sourceRemnantsRetained: true,
  knownPonsDuplicateFaces: 2,
  clinicalApproval: false,
  browserInteractionTesting: false,
  publishedPatientScans: false,
};
await writeFile(
  'docs/brainstem-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
