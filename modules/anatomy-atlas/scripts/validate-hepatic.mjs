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
      "export {VentricularView, default as DialogView} from './app/ventricles'; export * from './lib/hepatic';",
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
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
    bag.set(key, (bag.get(key) ?? 0) + 1);
  }
  return [...bag].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

const api = scope.exports,
  manifest = api.hepaticCatalog;
const { catalog, records, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7197');
const auditBytes = await readFile('docs/hepatic-source-audit.json'),
  audit = JSON.parse(auditBytes);
same(manifest.parent, parent);
same(manifest.evidence, evidence);
same(manifest.auditSha256, hash(auditBytes));
same(manifest.coordinateSystem, catalog.coordinateSystem);
same(manifest.license, 'CC-BY-4.0');
same(manifest.credit, catalog.credit);
same(manifest.selectableIds.length, 7);
same(manifest.contextIds.length, 1);
same(manifest.bundles.length, 2);
const layers = api.hepaticFor(parent),
  tissue = manifest.structures.find((s) => s.kind === 'context');
same(
  layers.map((s) => s.fmaId),
  [
    'FMA14778',
    'FMA14779',
    'FMA15414',
    'FMA15415',
    'FMA71857',
    'FMA71858',
    'FMA15800',
  ],
);
const allFiles = manifest.structures.flatMap((s) =>
  s.sources.map((f) => f.file),
);
same(allFiles.length, 57);
same(new Set(allFiles).size, 57);
const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same(
  [...allFiles].sort(compareText),
  parent.sources.map((s) => s.file).sort(compareText),
);
same(tissue.sources.map((s) => s.file).sort(compareText), audit.tissueFiles);
for (const p of [
  null,
  { ...parent, id: 'unknown' },
  { ...parent, laterality: 'left' },
  { ...parent, sourceTree: 'isa' },
  { ...parent, bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
  { ...parent, sources: parent.sources.slice(1) },
]) {
  same(api.hepaticFor(p), []);
  same(api.hepaticViewCatalog(p, true).structures, []);
  same(api.hepaticViewCatalog(p, true).bundles, []);
}
same(api.hepaticViewCatalog(parent).structures, layers);
same(api.hepaticViewCatalog(parent).bundles.length, 1);
same(api.hepaticViewCatalog(parent, true).structures, manifest.structures);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
let triangles = 0,
  duplicates = 0;
for (const b of manifest.bundles) {
  const bytes = await readFile(
    'public' + new URL(b.url, 'https://local.invalid').pathname,
  );
  same(bytes.length, b.bytes);
  same(hash(bytes), b.sha256);
  check(b.url.endsWith('?v=' + b.sha256));
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    '',
  );
  const meshes = [];
  gltf.scene.traverse((m) => {
    if (m.isMesh) meshes.push(m);
  });
  same(meshes.length, b.structures);
  for (const s of manifest.structures.filter((s) => s.bundle === b.id)) {
    if (s.kind !== 'context') {
      const r = records.find((r) => r.tree === 'partof' && r.id === s.fmaId);
      same(
        s.sources.map((f) => f.file),
        r.files,
      );
      same(s.sourceName, r.name);
    }
    const original = new Map();
    for (const f of s.sources) {
      same(
        f,
        parent.sources.find((p) => p.file === f.file),
      );
      const raw = await readFile(
        '../work/bodyparts3d/partof/' + f.file + '.obj',
      );
      same(hash(raw), f.sha256);
      const topology = sourceTopology(sourceObjShape(raw));
      same(topology, audit.files.find((a) => a.file === f.file).topology);
      triangles += topology.triangles;
      duplicates += topology.duplicateFaces;
      new OBJLoader().parse(raw.toString()).traverse((m) => {
        if (m.isMesh)
          triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
      });
    }
    const m = meshes.find((m) => m.name === s.nodeName);
    check(m);
    same(m.userData.structureId, s.id);
    same(m.userData.parentId, parent.id);
    same(
      triangleBag(m.geometry),
      [...original].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      'Full source triangles/winding/multiplicity',
    );
    m.geometry.computeBoundingBox();
    same(m.geometry.boundingBox.min.toArray(), s.bounds.min);
    same(m.geometry.boundingBox.max.toArray(), s.bounds.max);
    const p = m.geometry.getAttribute('position'),
      n = m.geometry.getAttribute('normal');
    check([...p.array, ...n.array].every(Number.isFinite));
    check(
      Array.from({ length: p.count }, (_, i) =>
        new Vector3()
          .fromBufferAttribute(p, i)
          .distanceTo(new Vector3(...s.anchor)),
      ).some((d) => d < 1e-6),
    );
    same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  }
}
same(triangles, 186340);
check(audit.segmentPairDiagnostic.every((p) => p.distances.medianMm < 0.5));
check(
  !layers.some((s) => ['FMA15744', 'FMA15745', 'FMA15746'].includes(s.fmaId)),
  'Unresolved segment map excluded',
);
const pins = JSON.parse(
  await readFile('content/nested-teaching-bindings.v1.json'),
);
const oldBindings = pins.bindings.filter((b) =>
  [
    'eye',
    'ventricles',
    'brainstem',
    'cerebral',
    'cardiac',
    'pulmonary',
  ].includes(b.study),
);
const oldParents = pins.parents.filter((p) =>
  oldBindings.some((b) => b.parentId === p.id),
);
same(oldBindings.length, 46);
same(oldParents.length, 6);
same(
  hash(JSON.stringify(oldBindings)),
  '9d7a65f292c5dd1b485375639c0e71f72d5b66562579f583e4ec970b6570809f',
);
same(
  hash(JSON.stringify(oldParents)),
  'a18fd1eb44f6a3de8c2daf8b26d1b1d5b0aed7555007418f5a21006e56ce4609',
);
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

let tree,
  initialSelectedId,
  markupCases = 0;
function render() {
  active = true;
  cursor = 0;
  tree = api.VentricularView({ parent, study: 'hepatic', initialSelectedId });
  active = false;
  return tree;
}
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const preset = () =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some((c) => c.props?.id === 'ventricular-preset'),
  ).props;
const select = (label) =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some((c) => c.props?.['aria-label'] === label),
  ).props;
const visible = () =>
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
for (initialSelectedId of [undefined, ...layers.map((s) => s.id), tissue.id]) {
  slots = [];
  render();
  same(scene().structures, layers);
  same(scene().catalog.bundles.length, 1);
  same(scene().contextIds, []);
  same(scene().isolated, !!layers.find((s) => s.id === initialSelectedId));
  const first = scene().selectedId;
  scene().onSelect(tissue.id);
  render();
  same(scene().selectedId, first);
  for (const [name, ids] of Object.entries(api.hepaticPresets(layers))) {
    preset().onValueChange(name);
    render();
    same(
      visible().map((s) => s.id),
      ids,
    );
  }
  preset().onValueChange('all');
  render();
  button('Show liver tissue context').onClick();
  render();
  same(scene().contextIds, [tissue.id]);
  same(scene().catalog.bundles.length, 2);
  same(scene().appearance[tissue.id].opacity, 0.12);
  for (const s of layers) {
    same(scene().appearance[s.id].color, api.hepaticColour(s));
    check(scene().appearance[s.id].color);
  }
  scene().onSelect(tissue.id);
  render();
  same(scene().selectedId, layers[0].id);
  for (const style of ['extract', 'spatial', 'tray']) {
    select('Liver separation mechanism').onValueChange(style);
    render();
    same(scene().layout, style);
    nodes(tree)
      .find((n) => n.props?.['aria-label'] === 'Liver separation')
      .props.onValueChange([70]);
    render();
    same(scene().explode, 70);
    same(scene().structures, layers);
    same(scene().catalog.bundles.length, 1);
    button('Reassemble').onClick();
    render();
    same(scene().explode, 0);
    same(scene().structures.length, 8);
  }
  button('Show liver tissue context').onClick();
  render();
  for (const s of layers)
    nodes(tree)
      .find((n) => n.props?.['aria-label'] === 'Show ' + s.name.toLowerCase())
      .props.onCheckedChange(false);
  render();
  same(visible().length, 0);
  button('Show all').onClick();
  render();
  same(visible().length, 7);
  nodes(tree)
    .find(
      (n) => n.props?.['aria-label'] === 'Show ' + layers[0].name.toLowerCase(),
    )
    .props.onCheckedChange(false);
  render();
  button('Undo layers').onClick();
  render();
  same(visible().length, 7);
  scene().onSelect(layers[0].id);
  render();
  button('Fade others').onClick();
  render();
  same(scene().isolated, true);
  const markup = require('react-dom/server').renderToStaticMarkup(tree);
  check(markup.includes('Liver dissection controls'));
  check(markup.includes('validated liver segment map'));
  check(
    !markup.includes('Show brain context') &&
      !markup.includes('Show atrial walls'),
  );
  markupCases++;
}
slots = [];
initialSelectedId = undefined;
render();
for (const b of manifest.bundles) scene().onLoaded(b.id);
render();
button('Show liver tissue context').onClick();
render();
scene().onFailure(tissue.bundle);
render();
check(text(tree).includes('could not load'));
button('Retry').onClick();
render();
scene().onLoaded(tissue.bundle);
render();
check(!text(tree).includes('could not load'));
scene().onFailure(tissue.bundle);
render();
button('Show liver tissue context').onClick();
render();
check(!text(tree).includes('could not load'));
for (const initialStudy of [
  undefined,
  'brainstem',
  'hepatic',
  'pulmonary',
  'cardiac',
]) {
  slots = [];
  cursor = 0;
  active = true;
  const dialog = api.DialogView({ parent, onClose() {}, initialStudy });
  active = false;
  same(
    nodes(dialog).find((n) => n.props?.parent && n.props?.study).props.study,
    'hepatic',
  );
  check(
    !nodes(dialog).some(
      (n) => n.props?.['aria-label'] === 'Brain dissection study',
    ),
  );
}
const report = {
  passed: true,
  checks,
  groups: 7,
  sourceFiles: 57,
  triangles,
  sourceDuplicateFacesRetained: duplicates,
  markupCases,
  previousTeachingBindingsPreserved: 46,
  segmentLabelsWithheld: true,
  newUniqueSourceFiles: 0,
  browserTesting: false,
  clinicalApproval: false,
};
await writeFile(
  'docs/hepatic-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
