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
      "export {VentricularView, default as DialogView} from './app/ventricles'; export * from './lib/pulmonary';",
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
  manifest = api.pulmonaryCatalog;
const { catalog, records, evidence } = await loadSourceHolds();
const auditBytes = await readFile('docs/pulmonary-source-audit.json'),
  audit = JSON.parse(auditBytes);
same(manifest.evidence, evidence);
same(audit.evidence, evidence);
same(manifest.auditSha256, hash(auditBytes));
same(manifest.coordinateSystem, catalog.coordinateSystem);
same(manifest.license, 'CC-BY-4.0');
same(manifest.credit, catalog.credit);
same(manifest.structures.length, 5);
same(manifest.contextIds, []);
same(manifest.bundles.length, 2);
same(api.pulmonaryFor(null), []);
const parents = ['FMA7309', 'FMA7310'].map((id) =>
  catalog.structures.find((s) => s.fmaId === id),
);
same(manifest.parents, parents);
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
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
    bag.set(key, (bag.get(key) ?? 0) + 1);
  }
  return [...bag].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}
let triangles = 0,
  sourceFiles = 0,
  duplicateFaces = 0;
for (const parent of parents) {
  const layers = api.pulmonaryFor(parent);
  same(layers.length, parent.laterality === 'right' ? 3 : 2);
  const view = api.pulmonaryViewCatalog(parent);
  same(view.structures, layers);
  same(view.bundles.length, 1);
  check(view.structures.every((s) => s.laterality === parent.laterality));
  same(
    view.selectableIds,
    layers.map((s) => s.id),
  );
  const allFiles = layers.flatMap((s) => s.sources.map((f) => f.file));
  same(allFiles.length, new Set(allFiles).size);
  same(
    [...allFiles].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    parent.sources
      .map((f) => f.file)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
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
  ]) {
    same(api.pulmonaryFor({ ...parent, [field]: 'invalid' }), []);
    same(
      api.pulmonaryViewCatalog({ ...parent, [field]: 'invalid' }).bundles,
      [],
    );
  }
  for (const mutate of [
    (p) => p.sources.pop(),
    (p) => p.sources.push(p.sources[0]),
    (p) => (p.sources[0].sha256 = '0'.repeat(64)),
    (p) => p.regions.push('head-neck'),
  ]) {
    const stale = clone(parent);
    mutate(stale);
    same(api.pulmonaryFor(stale), []);
  }
  const bundle = view.bundles[0],
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
  same(meshes.length, layers.length);
  for (const s of layers) {
    const lobe = audit.lobes.find((l) => l.definition.id === s.fmaId),
      record = records.find((r) => r.id === s.fmaId && r.tree === 'partof');
    same(
      s.sources.map((f) => f.file),
      record.files,
    );
    same(s.sourceName, record.name);
    same(s.roleCounts, lobe.roleCounts);
    same(s.roleCounts.unclassified, 0);
    check(s.name.endsWith('lobe branches'));
    check(s.coverageNote.includes('no lobe parenchyma'));
    same(s.validation, { status: 'unvalidated', anatomicalReview: false });
    const original = new Map();
    for (const source of s.sources) {
      same(
        source,
        parent.sources.find((f) => f.file === source.file),
      );
      const raw = await readFile(
        '../work/bodyparts3d/partof/' + source.file + '.obj',
      );
      same(hash(raw), source.sha256);
      const topology = sourceTopology(sourceObjShape(raw));
      same(topology, lobe.files.find((f) => f.file === source.file).topology);
      for (const key of [
        'collapsedFaces',
        'degenerateFaces',
        'boundaryEdges',
        'nonManifoldEdges',
        'nonManifoldVertices',
        'inconsistentWindingEdges',
      ])
        same(topology[key], 0);
      same(topology.duplicateFaces, source.file === 'FJ2928' ? 1 : 0);
      duplicateFaces += topology.duplicateFaces;
      triangles += topology.triangles;
      sourceFiles++;
      new OBJLoader().parse(raw.toString()).traverse((m) => {
        if (m.isMesh)
          triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
      });
    }
    const mesh = meshes.find((m) => m.name === s.nodeName);
    check(mesh);
    same(mesh.userData, {
      name: s.fmaId,
      structureId: s.id,
      fmaId: s.fmaId,
      parentId: parent.id,
    });
    same(
      triangleBag(mesh.geometry),
      [...original].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      'All transformed source triangles, cyclic winding and multiplicity retained',
    );
    mesh.geometry.computeBoundingBox();
    same(mesh.geometry.boundingBox.min.toArray(), s.bounds.min);
    same(mesh.geometry.boundingBox.max.toArray(), s.bounds.max);
    same(
      mesh.geometry.boundingBox.getCenter(new Vector3()).toArray(),
      s.center,
    );
    const position = mesh.geometry.getAttribute('position'),
      normal = mesh.geometry.getAttribute('normal');
    check([...position.array, ...normal.array].every(Number.isFinite));
    check(
      Array.from({ length: position.count }, (_, i) =>
        new Vector3()
          .fromBufferAttribute(position, i)
          .distanceTo(new Vector3(...s.anchor)),
      ).some((d) => d < 1e-6),
      'Anchor belongs to a source surface',
    );
  }
}
same(sourceFiles, 280);
same(triangles, 114750);
same(duplicateFaces, 1);
// Portable baseline proof: capture was dd07175, not a dependency on private Git history.
const pins = JSON.parse(
  await readFile('content/nested-teaching-bindings.v1.json'),
);
const previousBindings = pins.bindings.filter((b) => b.study !== 'pulmonary');
const previousParents = pins.parents.filter((p) =>
  previousBindings.some((b) => b.parentId === p.id),
);
same(previousBindings.length, 41);
same(previousParents.length, 4);
same(
  hash(JSON.stringify(previousBindings)),
  '820d4497f71ec4559914ee2105a7c0784abbbcd5b13d13a6aca10b9364edfbac',
);
same(
  hash(JSON.stringify(previousParents)),
  'e0ff21901d4c0b18e19426501669fc3437238c2fd246b1e778f967a7af40788b',
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
  parent = parents[0],
  initialSelectedId;
function render() {
  active = true;
  cursor = 0;
  tree = api.VentricularView({ parent, study: 'pulmonary', initialSelectedId });
  active = false;
  return tree;
}
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const select = (label) =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some((c) => c.props?.['aria-label'] === label),
  ).props;
const preset = () =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some((c) => c.props?.id === 'ventricular-preset'),
  ).props;
const visible = () =>
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
let markupCases = 0;
for (parent of parents) {
  const layers = api.pulmonaryFor(parent),
    opposite = manifest.structures.find(
      (s) => s.laterality !== parent.laterality,
    );
  for (initialSelectedId of [
    undefined,
    ...layers.map((s) => s.id),
    opposite.id,
  ]) {
    slots = [];
    render();
    same(scene().structures, layers);
    same(scene().contextIds, []);
    same(scene().catalog.bundles.length, 1);
    check(
      !scene().structures.some(
        (s) => s.id === parent.id || s.laterality !== parent.laterality,
      ),
    );
    same(scene().isolated, !!layers.find((s) => s.id === initialSelectedId));
    const original = scene().selectedId;
    scene().onSelect(opposite.id);
    render();
    same(scene().selectedId, original);
    for (const [name, ids] of Object.entries(api.pulmonaryPresets(layers))) {
      preset().onValueChange(name);
      render();
      same(
        visible().map((s) => s.id),
        ids,
      );
      same(scene().explode, 0);
      same(scene().isolated, false);
    }
    preset().onValueChange('all');
    render();
    for (const style of ['extract', 'spatial', 'tray']) {
      select('Lung separation mechanism').onValueChange(style);
      render();
      same(scene().layout, style);
      nodes(tree)
        .find((n) => n.props?.['aria-label'] === 'Lung separation')
        .props.onValueChange([70]);
      render();
      same(scene().explode, 70);
      same(scene().structures, layers);
      check(text(tree).includes('not anatomical positions'));
      button('Reassemble').onClick();
      render();
      same(scene().explode, 0);
      same(visible().length, layers.length);
    }
    const first = layers[0];
    scene().onSelect(first.id);
    render();
    nodes(tree)
      .find(
        (n) => n.props?.['aria-label'] === 'Show ' + first.name.toLowerCase(),
      )
      .props.onCheckedChange(false);
    render();
    check(scene().hiddenIds.includes(first.id));
    button('Undo layers').onClick();
    render();
    check(!scene().hiddenIds.includes(first.id));
    for (const s of layers)
      nodes(tree)
        .find((n) => n.props?.['aria-label'] === 'Show ' + s.name.toLowerCase())
        .props.onCheckedChange(false);
    render();
    same(visible().length, 0);
    button('Show all').onClick();
    render();
    same(visible().length, layers.length);
    scene().onSelect(first.id);
    render();
    button('Fade others').onClick();
    render();
    same(scene().isolated, true);
    const markup = require('react-dom/server').renderToStaticMarkup(tree);
    check(markup.includes('Lung dissection controls'));
    check(markup.includes('Lobe tissue and fissure surfaces are not supplied'));
    check(
      !markup.includes('Show brain context') &&
        !markup.includes('Show atrial walls') &&
        !markup.includes('cerebrospinal fluid'),
    );
    markupCases++;
  }
  for (const initialStudy of [undefined, 'brainstem', 'cardiac', 'pulmonary']) {
    slots = [];
    cursor = 0;
    active = true;
    const dialog = api.DialogView({ parent, onClose() {}, initialStudy });
    active = false;
    check(text(dialog).includes(parent.name + ' · branch dissection'));
    check(
      !nodes(dialog).some(
        (n) => n.props?.['aria-label'] === 'Brain dissection study',
      ),
    );
    same(
      nodes(dialog).find((n) => n.props?.parent && n.props?.study).props.study,
      'pulmonary',
    );
  }
}
const report = {
  passed: true,
  checks,
  groups: 5,
  lungs: 2,
  sourceFiles,
  triangles,
  duplicateFacesRetained: duplicateFaces,
  markupCases,
  previousTeachingBindingsPreserved: 41,
  sourceSurfacesAdded: 0,
  browserTesting: false,
  clinicalApproval: false,
  patientScansAdded: false,
};
await writeFile(
  'docs/pulmonary-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
