/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled callbacks, not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Box3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
const copy = (v) => JSON.parse(JSON.stringify(v));
const hash = (v) => createHash('sha256').update(v).digest('hex');
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(copy(a), copy(b), message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles';
    export * from './lib/visual-pathway-context'; export * from './lib/visual-pathway';
    export * from './lib/nested-anatomy'; export {CutawayControls} from './app/cutaway-controls';`,
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
const api = scope.exports;
const rootBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(rootBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = JSON.parse(rootBytes);
const raw = JSON.parse(
  await readFile(
    'public/models/bodyparts3d/visual-pathway/sellar-context.json',
  ),
);
const parent = root.structures.find((s) => s.fmaId === 'FMA50801');
same(raw.parent, parent);
same(raw.coordinateSystem, root.coordinateSystem);
same(raw.license, 'CC-BY-4.0');
same(raw.credit, root.credit);
same(raw.structures.length, 1);
same(raw.bundles.length, 1);
const gland = raw.structures[0],
  bundle = raw.bundles[0];
same(
  gland,
  root.structures.find((s) => s.fmaId === 'FMA13889'),
);
same(
  bundle,
  root.bundles.find((b) => b.id === gland.bundle),
);
same(gland.validation.anatomicalReview, false);
const bytes = await readFile('public' + bundle.url);
same(bytes.length, bundle.bytes);
same(hash(bytes), bundle.sha256);
const gltf = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
const mesh = gltf.scene.getObjectByName(gland.nodeName);
check(mesh?.isMesh);
check(!mesh.material.map);
const bounds = new Box3().setFromObject(mesh);
for (const edge of ['min', 'max'])
  bounds[edge]
    .toArray()
    .forEach((v, i) => check(Math.abs(v - gland.bounds[edge][i]) < 1e-6));
const original = JSON.stringify({
  raw,
  root,
  catalog: api.visualPathwayCatalog,
});
const relations = api.visualRelationshipsFor(parent);
same(relations.length, 1);
const r = relations[0],
  layers = api.visualPathwayFor(parent);
same(r.id, 'sellar-landmarks');
same(r.context, [gland]);
same(r.spaceId, layers.find((s) => s.fmaId === 'FMA62045').id);
same(
  api.visualContextViewCatalog(parent),
  api.visualPathwayViewCatalog(parent),
);
same(
  api.visualContextViewCatalog(parent, true),
  api.visualPathwayViewCatalog(parent, true),
);
same(
  api.visualContextViewCatalog(parent, false, r.id),
  api.visualPathwayViewCatalog(parent),
);
const view = api.visualContextViewCatalog(parent, true, r.id);
same(view.contextIds, [gland.id]);
same(
  view.selectableIds,
  layers.map((s) => s.id),
);
same(view.structures, [...layers, gland]);
same(view.bundles.length, 2);
check(!view.structures.some((s) => s.id === parent.id));
check(!api.nestedStudyTargets(root).some((t) => t.structureId === gland.id));
for (const mutate of [
  (p) => (p.id = 'changed'),
  (p) => (p.name = 'changed'),
  (p) => (p.bounds.min[0] += 1),
  (p) => (p.sources[0].sha256 = '0'.repeat(64)),
]) {
  const stale = copy(parent);
  mutate(stale);
  same(api.visualRelationshipsFor(stale), []);
  same(api.visualContextViewCatalog(stale, true, r.id).structures, []);
}
same(api.visualRelationshipsFor(null), []);
same(api.visualContextViewCatalog(null, true, r.id).bundles, []);
const nodes = (n) =>
  !n || typeof n !== 'object'
    ? []
    : Array.isArray(n)
      ? n.flatMap(nodes)
      : [n, ...nodes(n.props?.children)];
const text = (n) =>
  typeof n === 'string'
    ? n
    : !n
      ? ''
      : Array.isArray(n)
        ? n.map(text).join('')
        : text(n.props?.children);
let tree;
const render = () => {
  active = true;
  cursor = 0;
  try {
    tree = api.VentricularView({ parent, study: 'visual-pathway' });
  } finally {
    active = false;
  }
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
const separation = (value) => {
  nodes(tree)
    .find(
      (n) =>
        n.props?.['aria-label']?.endsWith('separation') &&
        n.props.onValueChange,
    )
    .props.onValueChange([value]);
  render();
};
render();
same(scene().view, 'inferior');
same(scene().catalog.bundles.length, 1);
same(scene().contextIds, []);
const cutBounds = copy(scene().inspectionBounds);
scene().onLoaded('visual-pathway');
scene().onRendererHealth('ready');
render();
selector('ventricular-preset').onValueChange(r.id);
render();
same(scene().view, 'right');
same(scene().selectedId, r.spaceId);
same(scene().isolated, false);
same(
  visible().map((s) => s.id),
  [r.spaceId, gland.id],
);
same(scene().contextIds, [gland.id]);
same(scene().inspectionBounds, cutBounds);
same(scene().appearance[gland.id], {
  color: api.visualPathwayColour(gland),
  opacity: 0.42,
});
check(!scene().landmarks.includes(gland.id));
scene().onSelect(gland.id);
render();
same(scene().selectedId, r.spaceId);
check(
  button('Frame selected').disabled,
  'Wait for optional bundle only when shown',
);
scene().onFailure(bundle.id);
render();
check(button('Frame selected').disabled);
button('Retry').onClick();
render();
check(scene().retries[bundle.id] > 0);
scene().onLoaded(bundle.id);
render();
same(button('Frame selected').disabled, false);
const html = require('react-dom/server').renderToStaticMarkup(tree);
check(html.includes('Chiasm &amp; pituitary'));
check(html.includes('Chiasm and pituitary relationship guide'));
check(html.includes('Pituitary gland'));
check(html.includes(r.reference));
check(html.includes('no tumour'));
button('Show pituitary landmark').onClick();
render();
same(
  visible().map((s) => s.id),
  [r.spaceId],
);
same(scene().catalog.bundles.length, 1);
same(selector('ventricular-preset').value, r.id);
button('Show pituitary landmark').onClick();
render();
const cut = nodes(tree).find((n) => n.type === api.CutawayControls).props;
cut.onChange({ ...cut.value, plane: 'coronal', position: 37 });
render();
for (const layout of ['extract', 'spatial', 'tray']) {
  selector('Optic pathway separation mechanism').onValueChange(layout);
  render();
  separation(60);
  same(scene().catalog.bundles.length, 1);
  same(scene().contextIds, []);
  check(button('Show pituitary landmark').disabled);
  same(scene().inspectionBounds, cutBounds);
  same(scene().inspection.plane, 'coronal');
  separation(0);
  same(scene().contextIds, [gland.id]);
  same(
    visible().map((s) => s.id),
    [r.spaceId, gland.id],
  );
}
for (const action of ['preset', 'select', 'undo', 'visibility', 'reassemble']) {
  selector('ventricular-preset').onValueChange(r.id);
  render();
  if (action === 'preset') selector('ventricular-preset').onValueChange('all');
  else if (action === 'select') scene().onSelect(layers[1].id);
  else if (action === 'undo') button('Undo layers').onClick();
  else if (action === 'reassemble') button('Reassemble').onClick();
  else
    nodes(tree)
      .find((n) => n.props?.['aria-label'] === 'Show optic chiasm')
      .props.onCheckedChange(false);
  render();
  check(!scene().contextIds.includes(gland.id));
  check(!text(tree).includes('normal clearance'));
  same(scene().inspectionBounds, cutBounds);
}
same(
  JSON.stringify({ raw, root, catalog: api.visualPathwayCatalog }),
  original,
);
const report = {
  passed: true,
  checks,
  guidedPresets: 1,
  existingLandmarksReused: 1,
  sourceTriangles: mesh.geometry.index.count / 3,
  newGLBs: 0,
  defaultExtraBundles: 0,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  browserTesting: false,
  patientScansAdded: false,
};
await writeFile(
  'docs/visual-context-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
