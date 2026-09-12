/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled callbacks, not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Matrix4 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-component-test-build.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
const clone = (v) => JSON.parse(JSON.stringify(v)),
  hash = (b) => createHash('sha256').update(b).digest('hex');
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(clone(a), clone(b));
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles';
  export * from './lib/cardiac'; export * from './lib/cardiac-context';
  export * from './lib/cardiac-circulation';
  export * from './lib/nested-anatomy'; export * from './app/cutaway-controls';`,
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
  cursor = 0;
const slots = [];
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
  { catalog, records, evidence } = await loadSourceHolds();
const source = JSON.parse(
  await readFile('public/models/bodyparts3d/cardiac/great-vessel-context.json'),
);
same(source.evidence, evidence);
same(source.coordinateSystem, catalog.coordinateSystem);
same(source.license, 'CC-BY-4.0');
same(source.credit, catalog.credit);
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7088');
same(source.parent, parent);
same(api.cardiacCatalog.parent, parent);
const fmas = [
  'FMA4720',
  'FMA50872',
  'FMA50873',
  'FMA49914',
  'FMA49916',
  'FMA49911',
  'FMA49913',
  'FMA3736',
];
same(
  source.structures.map((s) => s.fmaId),
  fmas,
);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
function triangleBag(geometry, bag = new Map()) {
  const p = geometry.getAttribute('position'),
    index = geometry.index;
  for (let i = 0; i < (index ? index.count : p.count); i += 3) {
    const vertices = [0, 1, 2].map((j) => {
      const at = index ? index.getX(i + j) : i + j;
      return [p.getX(at), p.getY(at), p.getZ(at)]
        .map((v) => Math.round(v * 1e5))
        .join(',');
    });
    const key = [0, 1, 2]
      .map((j) => [...vertices.slice(j), ...vertices.slice(0, j)].join('|'))
      .sort()[0];
    bag.set(key, (bag.get(key) ?? 0) + 1);
  }
  return [...bag].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}
const meshes = new Map();
same(source.bundles.length, 1);
for (const b of source.bundles) {
  same(
    b,
    catalog.bundles.find((x) => x.id === b.id),
  );
  const bytes = await readFile(
    'public' + new URL(b.url, 'https://local.invalid').pathname,
  );
  same(bytes.length, b.bytes);
  same(hash(bytes), b.sha256);
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    '',
  );
  gltf.scene.traverse((m) => {
    if (m.isMesh) meshes.set(m.name, m);
  });
}
let triangles = 0;
for (const s of source.structures) {
  same(
    s,
    catalog.structures.find((x) => x.id === s.id),
  );
  const record = records.find(
    (r) => r.tree === s.sourceTree && r.id === s.fmaId,
  );
  same(
    record.files,
    s.sources.map((f) => f.file),
  );
  same(record.name, s.sourceName);
  const original = new Map();
  for (const f of s.sources) {
    const bytes = await readFile(
      `../work/bodyparts3d/${s.sourceTree}/${f.file}.obj`,
    );
    same(hash(bytes), f.sha256);
    const topology = sourceTopology(sourceObjShape(bytes));
    same(
      topology,
      source.sourceReports.find((r) => r.file === f.file).topology,
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
    triangles += topology.triangles;
    new OBJLoader().parse(bytes.toString()).traverse((m) => {
      if (m.isMesh)
        triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
    });
  }
  const mesh = meshes.get(s.nodeName);
  check(mesh);
  same(
    triangleBag(mesh.geometry),
    [...original].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  mesh.geometry.computeBoundingBox();
  same(mesh.geometry.boundingBox.min.toArray(), s.bounds.min);
  same(mesh.geometry.boundingBox.max.toArray(), s.bounds.max);
  check(
    !api.cardiacCatalog.structures.some((c) =>
      c.sources.some((f) => s.sources.some((g) => f.file === g.file)),
    ),
  );
}
same(triangles, 9720);
const relations = api.cardiacRelationshipsFor(parent);
same(
  relations.map((r) => r.context.map((s) => s.fmaId)),
  [
    ['FMA4720'],
    ['FMA50872', 'FMA50873'],
    ['FMA49914', 'FMA49916', 'FMA49911', 'FMA49913'],
    ['FMA3736'],
  ],
);
same(
  relations.map(
    (r) => api.cardiacFor(parent).find((s) => s.id === r.spaceId).fmaId,
  ),
  ['FMA11359', 'FMA9291', 'FMA9465', 'FMA9466'],
);
same(api.cardiacRelationshipsFor(null), []);
for (const mutate of [
  (p) => p.sources.pop(),
  (p) => (p.sources[0].sha256 = '0'.repeat(64)),
  (p) => p.sources.reverse(),
  (p) => (p.laterality = 'left'),
  (p) => (p.name = 'changed'),
  (p) => (p.bounds.min[0] += 1),
  (p) => (p.center[0] += 1),
  (p) => (p.anchor[0] += 1),
  (p) => (p.region = 'head-neck'),
]) {
  const stale = clone(parent);
  mutate(stale);
  same(api.cardiacRelationshipsFor(stale), []);
}
same(
  api.cardiacContextViewCatalog(parent).structures,
  api.cardiacCatalog.structures,
);
same(
  api.cardiacContextViewCatalog(parent, 'unknown').bundles,
  api.cardiacCatalog.bundles,
);
const nested = api.nestedStudyTargets(catalog);
same(
  nested.filter((t) => t.study === 'cardiac').map((t) => t.structureId),
  api.cardiacCatalog.selectableIds,
);
check(
  source.structures.every((s) => !nested.some((t) => t.structureId === s.id)),
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
let tree;
const props = { parent, study: 'cardiac' };
const render = () => {
  active = true;
  cursor = 0;
  try {
    tree = api.VentricularView(props);
  } finally {
    active = false;
  }
  return tree;
};
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const selector = (label) =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some(
        (c) => c.props?.id === label || c.props?.['aria-label'] === label,
      ),
  ).props;
const visible = () =>
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
render();
same(scene().catalog.bundles.length, 1);
same(button('Show atrial walls')['aria-pressed'], false);
const cutFrame = clone(scene().inspectionBounds),
  chamberBundle = scene().catalog.bundles[0].id,
  vesselBundle = source.bundles[0].id;
scene().onLoaded(chamberBundle);
scene().onRendererHealth('ready');
render();
same(button('Frame selected').disabled, false);
for (const r of relations) {
  selector('ventricular-preset').onValueChange(r.id);
  render();
  same(scene().selectedId, r.spaceId);
  same(scene().view, r.view);
  same(scene().isolated, false);
  same(
    visible().map((s) => s.id),
    [r.spaceId, ...r.context.map((s) => s.id)],
  );
  same(scene().inspectionBounds, cutFrame);
  same(scene().catalog.bundles.length, 2);
  for (const c of r.context) {
    same(scene().appearance[c.id], {
      color: api.cardiacVesselColour(c),
      opacity: 0.42,
    });
    scene().onSelect(c.id);
    render();
    same(scene().selectedId, r.spaceId);
    check(!scene().landmarks.includes(c.id));
  }
  check(
    nodes(tree).some(
      (n) => n.props?.['aria-label'] === 'Cardiac vessel relationship guide',
    ),
  );
  check(text(tree).includes('not a connected flow model'));
  const html = require('react-dom/server').renderToStaticMarkup(tree);
  check(html.includes(r.title.replaceAll('&', '&amp;')));
  check(html.includes('University of Minnesota'));
  same((html.match(/<ul aria-label="Context colour key"/g) ?? []).length, 1);
  button('Show vessel landmarks').onClick();
  render();
  same(
    visible().map((s) => s.id),
    [r.spaceId],
  );
  same(scene().catalog.bundles.length, 1);
  same(selector('ventricular-preset').value, r.id);
  same(button('Frame selected').disabled, false);
  button('Show vessel landmarks').onClick();
  render();
  same(scene().inspectionBounds, cutFrame);
  scene().onFailure(vesselBundle);
  render();
  same(button('Frame selected').disabled, true);
  button('Retry').onClick();
  render();
  check(scene().retries[vesselBundle] > 0);
  scene().onLoaded(vesselBundle);
  render();
  same(button('Frame selected').disabled, false);
  const cut = nodes(tree).find((n) => n.type === api.CutawayControls).props;
  cut.onChange({ ...cut.value, plane: 'axial', position: 30 });
  render();
  same(scene().inspection.plane, 'axial');
  same(scene().inspectionBounds, cutFrame);
  for (const layout of ['extract', 'spatial', 'tray']) {
    selector('Cardiac separation mechanism').onValueChange(layout);
    render();
    nodes(tree)
      .find((n) => n.props?.['aria-label'] === 'Cardiac separation')
      .props.onValueChange([60]);
    render();
    same(scene().catalog.bundles.length, 1);
    same(
      visible().map((s) => s.id),
      [r.spaceId],
    );
    same(button('Show vessel landmarks').disabled, true);
    same(scene().inspectionBounds, cutFrame);
    nodes(tree)
      .find((n) => n.props?.['aria-label'] === 'Cardiac separation')
      .props.onValueChange([0]);
    render();
    same(scene().catalog.bundles.length, 2);
    same(
      visible().map((s) => s.id),
      [r.spaceId, ...r.context.map((s) => s.id)],
    );
  }
  button('Reassemble').onClick();
  render();
  same(scene().inspection.plane, 'off');
  same(scene().catalog.bundles.length, 1);
  same(button('Show atrial walls')['aria-pressed'], true);
}
// Selecting another chamber, Undo or a manual layer change leaves the guided context safely.
for (const action of ['select', 'undo', 'visibility']) {
  const r = relations[0];
  selector('ventricular-preset').onValueChange(r.id);
  render();
  if (action === 'select') scene().onSelect(relations[1].spaceId);
  else if (action === 'undo') button('Undo layers').onClick();
  else
    nodes(tree)
      .find((n) => n.props?.onCheckedChange)
      .props.onCheckedChange(false);
  render();
  check(
    !nodes(tree).some(
      (n) => n.props?.['aria-label'] === 'Cardiac vessel relationship guide',
    ),
  );
  same(scene().catalog.bundles.length, 1);
}
// The guided sequence reuses exact source views; no timed flow or extra meshes.
const steps = api.cardiacCirculationFor(parent);
same(
  steps.map((s) => s.preset),
  [
    'right-atrial-inflow',
    'right',
    'pulmonary-outflow',
    'left-atrial-inflow',
    'left',
    'aortic-outflow',
  ],
);
same(
  steps.map((s) => s.selectedIds.length),
  [1, 2, 1, 1, 2, 1],
);
same(api.cardiacCirculationFor(null), []);
for (const mutate of [
  (p) => {
    p.sources[0].sha256 = '0'.repeat(64);
  },
  (p) => {
    p.bounds.min[0] += 1;
  },
  (p) => {
    p.laterality = 'right';
  },
]) {
  const stale = clone(parent);
  mutate(stale);
  same(api.cardiacCirculationFor(stale), []);
}
slots.length = 0;
render();
check(!text(tree).includes('Step 1 of 6'));
same(scene().catalog.bundles.length, 1);
button('Follow circulation').onClick();
render();
for (let index = 0; index < steps.length; index++) {
  const step = steps[index];
  same(selector('ventricular-preset').value, step.preset);
  same(scene().selectedId, step.selectedIds[0]);
  same(scene().view, step.view);
  same(scene().explode, 0);
  same(scene().inspection.plane, 'off');
  same(scene().isolated, false);
  same(scene().catalog.bundles.length, step.context ? 2 : 1);
  same(
    visible()
      .filter((s) => api.cardiacCatalog.selectableIds.includes(s.id))
      .map((s) => s.id)
      .sort(),
    [...step.selectedIds].sort(),
  );
  check(text(tree).includes(`Step ${index + 1} of 6`));
  check(text(tree).includes(step.body));
  same(button('Previous step').disabled, index === 0);
  const html = require('react-dom/server').renderToStaticMarkup(tree);
  check(html.includes('not beat timing or a flow simulation'));
  check(html.includes(step.reference));
  same((html.match(/aria-label="Circulation walkthrough"/g) ?? []).length, 1);
  // The two chambers stay independently selectable inside an AV comparison.
  if (step.selectedIds.length === 2) {
    scene().onSelect(step.selectedIds[1]);
    render();
    check(text(tree).includes(step.title));
    same(scene().selectedId, step.selectedIds[1]);
  }
  if (index > 0) {
    button('Previous step').onClick();
    render();
    same(selector('ventricular-preset').value, steps[index - 1].preset);
    button('Next step').onClick();
    render();
    same(scene().selectedId, step.selectedIds[0]);
  }
  button('Fade others').onClick();
  selector('Cardiac separation mechanism').onValueChange('spatial');
  render();
  nodes(tree)
    .find((n) => n.props?.['aria-label'] === 'Cardiac separation')
    .props.onValueChange([50]);
  const cut = nodes(tree).find((n) => n.type === api.CutawayControls).props;
  cut.onChange({ ...cut.value, plane: 'axial', position: 30 });
  render();
  check(text(tree).includes('Separated teaching layout'));
  same(scene().catalog.bundles.length, 1);
  button(
    index === steps.length - 1 ? 'Finish walkthrough' : 'Next step',
  ).onClick();
  render();
}
check(
  !nodes(tree).some(
    (n) => n.props?.['aria-label'] === 'Circulation walkthrough',
  ),
);
same(selector('ventricular-preset').value, 'all');
same(scene().inspection.plane, 'off');
same(scene().explode, 0);
for (const action of [
  'exit',
  'preset',
  'select',
  'visibility',
  'undo',
  'reassemble',
]) {
  button('Follow circulation').onClick();
  render();
  if (action === 'exit') button('Exit walkthrough').onClick();
  else if (action === 'preset')
    selector('ventricular-preset').onValueChange('atria');
  else if (action === 'select') scene().onSelect(steps[3].selectedIds[0]);
  else if (action === 'visibility')
    nodes(tree)
      .find((n) => n.props?.onCheckedChange)
      .props.onCheckedChange(false);
  else
    button(action === 'undo' ? 'Undo layers' : 'Reassemble').onClick();
  render();
  check(
    !nodes(tree).some(
      (n) => n.props?.['aria-label'] === 'Circulation walkthrough',
    ),
  );
}
button('Follow circulation').onClick(); render();
button('Next step').onClick(); render();
button('Undo layers').onClick(); render();
same(button('Redo layers').disabled, false);
button('Redo layers').onClick(); render();
check(!nodes(tree).some(n => n.props?.['aria-label'] === 'Circulation walkthrough'));
same(selector('ventricular-preset').value, 'right');
const report = {
  passed: true,
  checks,
  guidedPresets: 4,
  circulationSteps: steps.length,
  atrioventricularComparisons: 2,
  circulationExitPaths: 6,
  layerRedoDoesNotRestartWalkthrough: true,
  contextStructures: 8,
  sourceFiles: 11,
  sourceTriangles: triangles,
  existingBundlesReused: 1,
  newGLBs: 0,
  defaultExtraBundles: 0,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  browserTesting: false,
  patientScansAdded: false,
};
await writeFile(
  'docs/cardiac-context-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
