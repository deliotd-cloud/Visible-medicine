/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled hooks execute actual component callbacks; not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Matrix4 } from 'three';
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
      "export {VentricularView, default as DialogView} from './app/ventricles'; export * from './lib/pulmonary'; export * from './lib/pulmonary-context';",
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
  source = api.pulmonaryAirwaySource;
const { catalog, records, evidence } = await loadSourceHolds();
const rawContext = JSON.parse(
  await readFile('public/models/bodyparts3d/pulmonary/airway-context.json'),
);
same(rawContext.evidence, evidence);
same(rawContext.coordinateSystem, catalog.coordinateSystem);
same(rawContext.license, 'CC-BY-4.0');
same(rawContext.credit, catalog.credit);
const fmas = ['FMA7394', 'FMA7395', 'FMA7396'];
same(
  source.structures.map((s) => s.fmaId),
  fmas,
);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const parsed = new Map();
for (const b of source.bundles) {
  same(
    b,
    catalog.bundles.find((x) => x.id === b.id),
  );
  const bytes = await readFile(
    'public' + new URL(b.url, 'https://local.invalid').pathname,
  );
  same(hash(bytes), b.sha256);
  same(bytes.length, b.bytes);
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    '',
  );
  const meshes = new Map();
  gltf.scene.traverse((m) => {
    if (m.isMesh) meshes.set(m.name, m);
  });
  parsed.set(b.id, meshes);
}
let triangles = 0;
for (const s of source.structures) {
  same(
    s,
    catalog.structures.find((x) => x.id === s.id),
  );
  const record = records.find(
    (r) => r.id === s.fmaId && r.tree === s.sourceTree,
  );
  same(
    record.files,
    s.sources.map((f) => f.file),
  );
  same(record.name, s.sourceName);
  const file = s.sources[0],
    bytes = await readFile(
      '../work/bodyparts3d/' + s.sourceTree + '/' + file.file + '.obj',
    );
  same(hash(bytes), file.sha256);
  const topology = sourceTopology(sourceObjShape(bytes));
  same(
    topology,
    rawContext.sourceReports.find((r) => r.fmaId === s.fmaId).topology,
  );
  same(
    topology.duplicateFaces,
    { FMA7394: 0, FMA7395: 2, FMA7396: 3 }[s.fmaId],
  );
  same(
    topology.components.length,
    { FMA7394: 1, FMA7395: 6, FMA7396: 4 }[s.fmaId],
  );
  triangles += topology.triangles;
  const original = new Map();
  new OBJLoader().parse(bytes.toString()).traverse((m) => {
    if (m.isMesh)
      triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
  });
  const mesh = parsed.get(s.bundle).get(s.nodeName);
  check(mesh);
  same(
    triangleBag(mesh.geometry),
    [...original].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    'Existing context GLB retains every transformed source triangle and winding',
  );
  mesh.geometry.computeBoundingBox();
  same(mesh.geometry.boundingBox.min.toArray(), s.bounds.min);
  same(mesh.geometry.boundingBox.max.toArray(), s.bounds.max);
  check(
    !api.pulmonaryCatalog.structures.some((p) =>
      p.sources.some((f) => f.file === file.file),
    ),
  );
}
same(triangles, 13600);
same(api.pulmonaryAirwayFor(null), []);
// Portable original46 snapshot, excluding explicitly extended future families.
const oldPins = JSON.parse(
  await readFile('content/nested-teaching-bindings.v1.json'),
);
const oldBindings = oldPins.bindings.filter((b) =>
  [
    'eye',
    'ventricles',
    'brainstem',
    'cerebral',
    'cardiac',
    'pulmonary',
  ].includes(b.study),
);
const oldParents = oldPins.parents.filter((p) =>
  oldBindings.some((b) => b.parentId === p.id),
);
same(oldBindings.length, 46);
same(
  hash(JSON.stringify(oldBindings)),
  '9d7a65f292c5dd1b485375639c0e71f72d5b66562579f583e4ec970b6570809f',
);
same(
  hash(JSON.stringify(oldParents)),
  'a18fd1eb44f6a3de8c2daf8b26d1b1d5b0aed7555007418f5a21006e56ce4609',
);
same(
  hash(await readFile('public/models/bodyparts3d/pulmonary/catalog.json')),
  'b62ccd78dfc2ced8674b94eba67596add4de482f54c3f242814982b4e3dab9ea',
  'Original selectable branch catalogue unchanged',
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
  parent,
  markupCases = 0;
function render() {
  active = true;
  cursor = 0;
  tree = api.VentricularView({ parent, study: 'pulmonary' });
  active = false;
}
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const slider = () =>
  nodes(tree).find((n) => n.props?.['aria-label'] === 'Lung separation').props;
const visible = () =>
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
for (parent of source.parents) {
  const layers = api.pulmonaryFor(parent),
    contexts = api.pulmonaryAirwayFor(parent);
  same(
    contexts.map((s) => s.fmaId),
    ['FMA7394', parent.laterality === 'right' ? 'FMA7395' : 'FMA7396'],
  );
  same(api.pulmonaryContextViewCatalog(parent).structures, layers);
  same(api.pulmonaryContextViewCatalog(parent).bundles.length, 1);
  same(api.pulmonaryContextViewCatalog(parent, true).structures, [
    ...layers,
    ...contexts,
  ]);
  for (const mutate of [
    (p) => p.sources.pop(),
    (p) => (p.sources[0].sha256 = '0'.repeat(64)),
    (p) => (p.laterality = 'unknown'),
    (p) => (p.center[0] += 1),
    (p) => (p.bounds.min[0] += 1),
    (p) => (p.anchor[0] += 1),
    (p) => (p.region = 'head-neck'),
  ]) {
    const stale = clone(parent);
    mutate(stale);
    same(api.pulmonaryAirwayFor(stale), []);
  }
  slots = [];
  render();
  same(scene().structures, layers);
  same(scene().catalog.bundles.length, 1);
  same(button('Show airway landmarks')['aria-pressed'], false);
  check(text(tree).includes('Partial branch group'));
  check(!text(tree).includes('Space representation'));
  const selected = scene().selectedId,
    mainBundle = scene().catalog.bundles[0].id;
  scene().onLoaded(mainBundle);
  scene().onRendererHealth('ready');
  render();
  same(button('Frame selected').disabled, false);
  button('Show airway landmarks').onClick();
  render();
  same(scene().structures, [...layers, ...contexts]);
  same(
    scene().contextIds,
    contexts.map((s) => s.id),
  );
  same(scene().catalog.bundles.length, 3);
  same(button('Frame selected').disabled, true);
  for (const c of contexts) {
    same(scene().appearance[c.id], {
      color: api.pulmonaryAirwayColour(c),
      opacity: 0.34,
    });
    check(!scene().landmarks.includes(c.id));
    scene().onSelect(c.id);
    render();
    same(scene().selectedId, selected);
    check(
      !scene().structures.some(
        (s) =>
          s.laterality === (parent.laterality === 'left' ? 'right' : 'left'),
      ),
    );
  }
  check(
    nodes(tree).some(
      (n) => n.props?.['aria-label'] === 'Lung airway landmarks',
    ),
  );
  const contextBundles = scene().catalog.bundles.filter(
    (b) => b.id !== mainBundle,
  );
  for (const b of contextBundles) scene().onLoaded(b.id);
  render();
  same(button('Frame selected').disabled, false);
  scene().onFailure(contextBundles[0].id);
  render();
  same(button('Frame selected').disabled, true);
  button('Show airway landmarks').onClick();
  render();
  same(button('Frame selected').disabled, false);
  same(scene().structures, layers);
  button('Show airway landmarks').onClick();
  render();
  same(button('Frame selected').disabled, true);
  button('Retry').onClick();
  render();
  same(scene().retries[contextBundles[0].id], 1);
  scene().onLoaded(contextBundles[0].id);
  render();
  same(button('Frame selected').disabled, false);
  for (const style of ['extract', 'spatial', 'tray']) {
    nodes(tree)
      .find(
        (n) =>
          n.props?.onValueChange &&
          nodes(n.props.children).some(
            (c) => c.props?.['aria-label'] === 'Lung separation mechanism',
          ),
      )
      .props.onValueChange(style);
    render();
    slider().onValueChange([60]);
    render();
    same(scene().structures, layers);
    same(scene().contextIds, []);
    same(scene().catalog.bundles.length, 1);
    same(button('Show airway landmarks').disabled, true);
    check(
      !nodes(tree).some(
        (n) => n.props?.['aria-label'] === 'Lung airway landmarks',
      ),
    );
    button('Reassemble').onClick();
    render();
    same(scene().explode, 0);
    same(scene().structures, [...layers, ...contexts]);
    same(button('Show airway landmarks').disabled, false);
  }
  button('Fade others').onClick();
  render();
  same(scene().isolated, true);
  check(text(tree).includes('Turn off Fade others to compare the landmarks'));
  for (const s of layers)
    nodes(tree)
      .find((n) => n.props?.['aria-label'] === 'Show ' + s.name.toLowerCase())
      .props.onCheckedChange(false);
  render();
  same(visible(), contexts);
  button('Show all').onClick();
  render();
  same(visible(), [...layers, ...contexts]);
  same(scene().isolated, false);
  const html = require('react-dom/server').renderToStaticMarkup(tree);
  check(html.includes('Lung airway landmarks'));
  check(html.includes('Airway landmark colour key'));
  check(html.includes('Orientation surfaces only'));
  check(
    !html.includes('Ventricular relationship guide') &&
      !html.includes('cerebrospinal fluid'),
  );
  markupCases++;
}
const report = {
  passed: true,
  checks,
  contextStructures: 3,
  contextPerLung: 2,
  sourceTriangles: triangles,
  duplicateFacesRetained: 5,
  markupCases,
  existingBundlesReused: 2,
  newGLBs: 0,
  defaultExtraBundles: 0,
  teachingBindingsPreserved: 46,
  clinicalApproval: false,
  browserTesting: false,
  patientScansAdded: false,
};
await writeFile(
  'docs/pulmonary-context-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
