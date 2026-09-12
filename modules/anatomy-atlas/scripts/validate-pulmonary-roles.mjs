/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled callback checks, not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Matrix4 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-component-test-build.mjs';
import { cache } from './bodyparts-archive.mjs';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const clone = (v) => JSON.parse(JSON.stringify(v));
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(clone(a), clone(b));
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const require = createRequire(import.meta.url),
  React = require('react');
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles'; export * from './lib/pulmonary'; export * from './lib/pulmonary-context'; export * from './lib/pulmonary-roles'; export { CutawayControls } from './app/cutaway-controls';`,
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
  useState(value) {
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
  useReducer(reducer, arg, init) {
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
  source = api.pulmonaryRoleSource;
const audit = JSON.parse(await readFile('docs/pulmonary-source-audit.json'));
const original = api.pulmonaryCatalog;
same(source.originalStructures, original.structures);
same(source.originalBundles, original.bundles);
same(source.parents, original.parents);
const matrix = new Matrix4().fromArray(
  original.coordinateSystem.sourceToSceneColumnMajor,
);
function bag(geometry, withNormals = false, result = new Map()) {
  const p = geometry.getAttribute('position'),
    n = geometry.getAttribute('normal'),
    index = geometry.index;
  const count = index ? index.count : p.count;
  check(count % 3 === 0);
  for (let i = 0; i < count; i += 3) {
    const vertices = [0, 1, 2].map((j) => {
      const at = index ? index.getX(i + j) : i + j;
      const xyz = [p.getX(at), p.getY(at), p.getZ(at)];
      return JSON.stringify(
        withNormals
          ? [...xyz, n.getX(at), n.getY(at), n.getZ(at)]
          : xyz.map((v) => Math.round(v * 1e5)),
      );
    });
    const key = [0, 1, 2]
      .map((shift) => [0, 1, 2].map((i) => vertices[(i + shift) % 3]).join('|'))
      .sort()[0];
    result.set(key, (result.get(key) ?? 0) + 1);
  }
  return result;
}
const entries = (map) =>
  [...map].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
async function load(bundle) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  same(hash(bytes), bundle.sha256);
  same(bytes.length, bundle.bytes);
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  const meshes = new Map();
  gltf.scene.traverse((mesh) => {
    if (mesh.isMesh) {
      check(!meshes.has(mesh.name));
      meshes.set(mesh.name, mesh.geometry);
    }
  });
  same(meshes.size, bundle.structures);
  return meshes;
}
let triangles = 0,
  rawFiles = 0;
for (const bundle of source.bundles) {
  const meshes = await load(bundle);
  const originalBundle = original.bundles.find(
    (b) => bundle.id === b.id + '-branch-types',
  );
  const originalMeshes = await load(originalBundle);
  for (const group of original.structures.filter(
    (s) => s.bundle === originalBundle.id,
  )) {
    const subsets = source.subsets.filter((s) => s.groupId === group.id),
      united = new Map();
    same(subsets.length, 3);
    same(
      subsets
        .flatMap((s) => s.sources)
        .map((s) => s.file)
        .sort(),
      group.sources.map((s) => s.file).sort(),
    );
    for (const subset of subsets) {
      const geometry = meshes.get(subset.nodeName);
      check(geometry);
      same(geometry.index.count, subset.triangles * 3);
      triangles += subset.triangles;
      geometry.computeBoundingBox();
      same(geometry.boundingBox.min.toArray(), subset.bounds.min);
      same(geometry.boundingBox.max.toArray(), subset.bounds.max);
      const p = geometry.getAttribute('position');
      check(
        Array.from({ length: p.count }, (_, i) => [
          p.getX(i),
          p.getY(i),
          p.getZ(i),
        ]).some((v) => JSON.stringify(v) === JSON.stringify(subset.anchor)),
        'Anchor must lie on retained subset',
      );
      const expected = new Map();
      for (const file of subset.sources) {
        const evidence = audit.lobes
          .find((l) => l.definition.id === group.fmaId)
          .files.find((f) => f.file === file.file);
        same(evidence.role, subset.role);
        const bytes = await readFile(`${cache}/partof/${file.file}.obj`);
        same(hash(bytes), file.sha256);
        rawFiles++;
        new OBJLoader().parse(bytes.toString()).traverse((mesh) => {
          if (mesh.isMesh)
            bag(mesh.geometry.clone().applyMatrix4(matrix), false, expected);
        });
      }
      same(entries(bag(geometry)), entries(expected));
      bag(geometry, true, united);
    }
    // Exact original float positions/normals and face multiplicity, not a tolerance claim.
    same(
      entries(united),
      entries(bag(originalMeshes.get(group.nodeName), true)),
    );
  }
}
same(rawFiles, 280);
same(triangles, 114750);
for (const parent of source.parents) {
  same(api.pulmonaryRolesAvailable(parent), true);
  same(api.pulmonaryRoleViewCatalog(parent), api.pulmonaryViewCatalog(parent));
  for (const mutate of [
    (p) => p.sources.pop(),
    (p) => p.bounds.min[0]++,
    (p) => p.anchor[0]++,
    (p) => (p.laterality = 'unknown'),
  ]) {
    const stale = clone(parent);
    mutate(stale);
    same(api.pulmonaryRolesAvailable(stale), false);
    same(api.pulmonaryRoleViewCatalog(stale, 'airway').structures, []);
  }
}
const first = source.subsets[0];
for (const mutation of [
  { nodeName: 'incorrect' },
  { anchor: [NaN, 0, 0] },
  { sources: [] },
  { role: 'unknown' },
]) {
  const saved = clone(first);
  Object.assign(first, mutation);
  same(
    api.pulmonaryRolesAvailable(
      source.parents.find(
        (p) =>
          p.id ===
          original.structures.find((s) => s.id === first.groupId).parentId,
      ),
    ),
    false,
  );
  Object.assign(first, saved);
}
same(api.pulmonaryRoleViewCatalog(source.parents[0], 'unknown').structures, []);
same(
  api.pulmonaryContextViewCatalog(source.parents[0], true, 'unknown')
    .structures,
  [],
);
const nodes = (n) =>
  !n || typeof n !== 'object'
    ? []
    : Array.isArray(n)
      ? n.flatMap(nodes)
      : [n, ...nodes(n.props?.children)];
const text = (n) =>
  typeof n === 'string' || typeof n === 'number'
    ? String(n)
    : !n
      ? ''
      : Array.isArray(n)
        ? n.map(text).join('')
        : text(n.props?.children);
let tree, parent;
function render() {
  active = true;
  cursor = 0;
  try {
    tree = api.VentricularView({ parent, study: 'pulmonary' });
  } finally {
    active = false;
  }
}
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const select = (id) =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some(
        (c) => c.props?.id === id || c.props?.['aria-label'] === id,
      ),
  ).props;
const visible = () =>
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
for (parent of source.parents) {
  slots = [];
  render();
  const baseGroups = api.pulmonaryFor(parent),
    frame = clone(scene().inspectionBounds);
  same(scene().structures, baseGroups);
  same(scene().catalog.bundles.length, 1);
  same(select('pulmonary-branch-type').value, 'all');
  scene().onRendererHealth('ready');
  scene().onLoaded(scene().catalog.bundles[0].id);
  render();
  for (const role of ['airway', 'artery', 'vein']) {
    select('pulmonary-branch-type').onValueChange(role);
    render();
    same(select('pulmonary-branch-type').value, role);
    same(scene().catalog.bundles.length, 1);
    check(scene().catalog.bundles[0].id.endsWith('-branch-types'));
    same(
      scene().structures.map((s) => s.id),
      baseGroups.map((s) => s.id),
    );
    check(
      scene().structures.every(
        (s) =>
          s.displaySubset.role === role && s.laterality === parent.laterality,
      ),
    );
    same(scene().inspectionBounds, frame);
    for (const group of scene().structures) {
      same(scene().appearance[group.id].color, api.pulmonaryRoleColour(role));
      scene().onSelect(group.id);
      render();
      same(scene().selectedId, group.id);
    }
    scene().onFailure(scene().catalog.bundles[0].id);
    render();
    same(button('Frame selected').disabled, true);
    button('Retry').onClick();
    render();
    check(scene().retries[scene().catalog.bundles[0].id] > 0);
    scene().onLoaded(scene().catalog.bundles[0].id);
    render();
    same(button('Frame selected').disabled, false);
    button('Show airway landmarks').onClick();
    render();
    same(scene().catalog.bundles.length, 3);
    const context = api.pulmonaryAirwayFor(parent),
      selected = scene().selectedId;
    for (const c of context) {
      scene().onSelect(c.id);
      render();
      same(scene().selectedId, selected);
    }
    select('ventricular-preset').onValueChange('upper');
    render();
    same(
      visible().filter((s) => baseGroups.some((g) => g.id === s.id)).length,
      1,
    );
    for (const layout of ['extract', 'spatial', 'tray']) {
      select('Lung separation mechanism').onValueChange(layout);
      render();
      nodes(tree)
        .find((n) => n.props?.['aria-label'] === 'Lung separation')
        .props.onValueChange([70]);
      render();
      same(scene().catalog.bundles.length, 1);
      same(scene().inspectionBounds, frame);
    }
    const cut = nodes(tree).find((n) => n.type === api.CutawayControls).props;
    cut.onChange({ ...cut.value, plane: 'axial', position: 30 });
    button('Fade others').onClick();
    render();
    select('pulmonary-branch-type').onValueChange(role);
    render();
    same(scene().explode, 0);
    same(scene().inspection.plane, 'off');
    same(scene().isolated, false);
    same(select('ventricular-preset').value, 'upper');
    select('pulmonary-branch-type').onValueChange('unknown');
    render();
    same(select('pulmonary-branch-type').value, role);
    const html = require('react-dom/server').renderToStaticMarkup(tree);
    check(html.includes(api.pulmonaryRoleNotes[role]));
    check(html.includes('not oxygenation or scan signal'));
    button('Show airway landmarks').onClick();
    button('Reassemble').onClick();
    render();
    same(select('pulmonary-branch-type').value, role);
    same(visible().length, baseGroups.length);
  }
  select('pulmonary-branch-type').onValueChange('all');
  render();
  same(scene().structures, baseGroups);
  same(scene().catalog.bundles.length, 1);
}
const report = {
  passed: true,
  checks,
  displaySubsets: 15,
  sourceFiles: rawFiles,
  triangles,
  originalFacesAndNormalsUnchanged: true,
  newAnatomicalIdentities: 0,
  defaultExtraBundles: 0,
  optionalBundles: 2,
  clinicalApproval: false,
  browserTesting: false,
  patientImaging: false,
};
await writeFile(
  'docs/pulmonary-role-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report));
