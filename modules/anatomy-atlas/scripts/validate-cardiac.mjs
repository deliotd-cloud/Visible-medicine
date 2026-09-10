/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled hooks execute actual component callbacks; not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
const clone = (v) => JSON.parse(JSON.stringify(v));
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(clone(a), clone(b), message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compiled = await build({
  stdin: {
    contents:
      "export {VentricularView, default as DialogView} from './app/ventricles'; export * from './lib/cardiac';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'gpu-only',
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
let active = false,
  cursor = 0,
  slots = [];
const shim = {
  ...React,
  useState: (value) => {
    if (!active) return React.useState(value);
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
    return [
      slots[i],
      (next) => {
        slots[i] = typeof next === 'function' ? next(slots[i]) : next;
      },
    ];
  },
  useReducer: (reducer, arg, init) => {
    if (!active) return React.useReducer(reducer, arg, init);
    const i = cursor++;
    if (!(i in slots)) slots[i] = init ? init(arg) : arg;
    return [
      slots[i],
      (action) => {
        slots[i] = reducer(slots[i], action);
      },
    ];
  },
  useMemo: (fn, deps) => (active ? fn() : React.useMemo(fn, deps)),
  useCallback: (fn, deps) => (active ? fn : React.useCallback(fn, deps)),
};
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  require: (id) => (id === 'react' ? shim : require(id)),
});
const api = scope.exports,
  manifest = api.cardiacCatalog;
const { catalog, records, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7088');
same(manifest.parent, parent);
same(manifest.evidence, evidence);
same(manifest.coordinateSystem, catalog.coordinateSystem);
same(manifest.license, 'CC-BY-4.0');
same(manifest.credit, catalog.credit);
const definitions = [
  ['FMA11359', 'FJ2424'],
  ['FMA9465', 'FJ2425'],
  ['FMA9291', 'FJ2423'],
  ['FMA9466', 'FJ2422'],
  ['FMA9457', 'FJ2439'],
  ['FMA9531', 'FJ2438'],
];
same(
  manifest.structures.map((s) => [s.fmaId, s.sources[0].file]),
  definitions,
);
same(
  api.cardiacFor(parent).map((s) => s.fmaId),
  definitions.slice(0, 4).map(([id]) => id),
);
same(
  manifest.contextIds,
  manifest.structures.slice(4).map((s) => s.id),
);
for (const field of [
  'id',
  'fmaId',
  'name',
  'sourceTree',
  'system',
  'category',
  'laterality',
  'region',
  'bundle',
  'nodeName',
])
  same(api.cardiacFor({ ...parent, [field]: 'invalid' }), []);
for (const mutate of [
  (p) => p.sources.pop(),
  (p) => p.sources.push(p.sources[0]),
  (p) => (p.sources[0].sha256 = '0'.repeat(64)),
  (p) => p.regions.push('head-neck'),
]) {
  const stale = clone(parent);
  mutate(stale);
  same(api.cardiacFor(stale), []);
}
same(api.cardiacFor(null), []);
const bundle = manifest.bundles[0],
  bytes = await readFile(
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
same(meshes.length, 6);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
function triangleBag(geometry, bag = new Map()) {
  const p = geometry.getAttribute('position'),
    index = geometry.index,
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
  return [...bag].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}
let triangles = 0;
for (const s of manifest.structures) {
  const record = records.find((r) => r.tree === 'partof' && r.id === s.fmaId),
    source = s.sources[0];
  same(record.files, [source.file]);
  same(record.name, s.sourceName);
  same(s.sources, [parent.sources.find((f) => f.file === source.file)]);
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  const raw = await readFile(
    '../work/bodyparts3d/partof/' + source.file + '.obj',
  );
  same(hash(raw), source.sha256);
  const topology = sourceTopology(sourceObjShape(raw));
  same(
    topology,
    manifest.sourceReports.find((r) => r.file === source.file).topology,
  );
  same(topology.components.length, 1);
  for (const key of [
    'duplicateFaces',
    'collapsedFaces',
    'degenerateFaces',
    'boundaryEdges',
    'nonManifoldEdges',
    'nonManifoldVertices',
    'inconsistentWindingEdges',
  ])
    same(topology[key], 0);
  const original = new Map();
  new OBJLoader().parse(raw.toString()).traverse((m) => {
    if (m.isMesh)
      triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
  });
  const mesh = meshes.find((m) => m.name === s.nodeName),
    geometry = mesh.geometry;
  same(mesh.userData, {
    name: s.fmaId,
    structureId: s.id,
    fmaId: s.fmaId,
    parentId: parent.id,
  });
  same(
    triangleBag(geometry),
    [...original].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    'Every triangle retained with winding/multiplicity in original scene coordinates',
  );
  geometry.computeBoundingBox();
  same(geometry.boundingBox.min.toArray(), s.bounds.min);
  same(geometry.boundingBox.max.toArray(), s.bounds.max);
  same(geometry.boundingBox.getCenter(new Vector3()).toArray(), s.center);
  const p = geometry.getAttribute('position'),
    n = geometry.getAttribute('normal');
  check(Array.from(p.array).every(Number.isFinite));
  check(Array.from(n.array).every(Number.isFinite));
  check(
    Array.from({ length: p.count }, (_, i) => [
      p.getX(i),
      p.getY(i),
      p.getZ(i),
    ]).some((v) => v.every((x, j) => x === s.anchor[j])),
  );
  triangles += topology.triangles;
}
same(manifest.sourceConflicts.length, 3);
for (const c of manifest.sourceConflicts) {
  check(c.sharedFiles.length > 0);
  check(
    c.sharedFiles.every(
      (f) =>
        !manifest.structures.some((s) => s.sources.some((p) => p.file === f)),
    ),
  );
}
// Preserve complete pre-cardiac JSON snapshots, including order, without needing
// the native Sites Git history in a downloaded or module-only project copy.
// Digests independently captured from source a8bdf17591b657cd9dc545165cb685c261efd22d.
const pins = JSON.parse(
  await readFile('content/nested-teaching-bindings.v1.json'),
);
const previousParents = pins.parents.filter((p) => p.id !== parent.id);
const previousBindings = pins.bindings.filter((b) => b.study !== 'cardiac');
same(previousParents.length, 3);
same(previousBindings.length, 37);
same(
  hash(JSON.stringify(previousParents)),
  'fb188a501dac7030a5bf48b3f61f00c1536521adbfa065822d554baa9c928e56',
);
same(
  hash(JSON.stringify(previousBindings)),
  'a08317b8f4c4613442ab748db2c9630921a15344911aaf72a46458f78525c353',
);
same(pins.bindings.length - previousBindings.length, 4);
function nodes(n) {
  if (!n || typeof n !== 'object') return [];
  if (Array.isArray(n)) return n.flatMap(nodes);
  return [n, ...nodes(n.props?.children)];
}
function text(n) {
  if (typeof n === 'string') return n;
  if (!n) return '';
  if (Array.isArray(n)) return n.map(text).join('');
  return text(n.props?.children);
}
let tree;
function render() {
  active = true;
  cursor = 0;
  tree = api.VentricularView({ parent, study: 'cardiac' });
  active = false;
  return tree;
}
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const studySelect = () =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some((c) => c.props?.id === 'ventricular-preset'),
  ).props;
const visible = () =>
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
const wanted = { all: 4, right: 2, left: 2, atria: 2, ventricles: 2 };
let markupCases = 0;
for (const [preset, count] of Object.entries(wanted)) {
  slots = [];
  render();
  studySelect().onValueChange(preset);
  render();
  same(visible().length, count);
  same(scene().catalog.parent.id, parent.id);
  same(scene().contextIds, manifest.contextIds);
  check(!scene().structures.some((s) => s.id === parent.id));
  button('Show atrial walls').onClick();
  render();
  same(visible().length, count + 2);
  const selection = scene().selectedId;
  scene().onSelect(manifest.contextIds[0]);
  render();
  same(scene().selectedId, selection);
  const slider = nodes(tree).find(
    (n) => n.props?.['aria-label'] === 'Cardiac separation',
  ).props;
  slider.onValueChange([60]);
  render();
  same(scene().explode, 60);
  same(visible().length, count);
  check(text(tree).includes('not anatomical positions'));
  slider.onValueChange([0]);
  render();
  same(visible().length, count + 2);
  button('Reassemble').onClick();
  render();
  same(studySelect().value, 'all');
  same(scene().explode, 0);
  const markup = require('react-dom/server').renderToStaticMarkup(tree);
  check(markup.includes('Cardiac dissection controls'));
  check(markup.includes('Right atrium space'));
  check(!markup.includes('cerebrospinal fluid'));
  markupCases++;
}
slots = [];
render();
const original = scene().selectedId;
nodes(tree)
  .find((n) => n.props?.['aria-label'] === 'Show cavity of right atrium')
  .props.onCheckedChange(false);
render();
check(scene().hiddenIds.includes(original));
button('Undo layers').onClick();
render();
same(scene().selectedId, original);
check(!scene().hiddenIds.includes(original));
for (const style of ['extract', 'spatial', 'tray']) {
  const select = nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some(
        (c) => c.props?.['aria-label'] === 'Cardiac separation mechanism',
      ),
  ).props;
  select.onValueChange(style);
  render();
  same(scene().layout, style);
  same(scene().explode, 0);
}
for (const initialStudy of [undefined, 'brainstem', 'cardiac']) {
  slots = [];
  cursor = 0;
  active = true;
  const dialog = api.DialogView({ parent, onClose() {}, initialStudy });
  active = false;
  check(text(dialog).includes('Heart · chamber spaces'));
  check(
    !nodes(dialog).some(
      (n) => n.props?.['aria-label'] === 'Brain dissection study',
    ),
  );
  same(
    nodes(dialog).find((n) => n.props?.parent && n.props?.study).props.study,
    'cardiac',
  );
}
const report = {
  passed: true,
  checks,
  selectableCavities: 4,
  contextWalls: 2,
  sourceFiles: 6,
  triangles,
  bytes: bytes.length,
  sourceConflictsExcluded: 3,
  markupCases,
  previousTeachingBindingsPreserved: previousBindings.length,
  browserTesting: false,
  clinicalApproval: false,
  patientScansAdded: false,
};
await writeFile(
  'docs/cardiac-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
