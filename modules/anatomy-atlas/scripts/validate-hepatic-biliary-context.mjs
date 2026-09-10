import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Matrix4 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-component-test-build.mjs';

let checks = 0;
const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b, note) => {
  checks++;
  assert.deepEqual(clone(a), clone(b), note);
};
const check = (v, note) => {
  checks++;
  assert(v, note);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const require = createRequire(import.meta.url),
  React = require('react');
let active = false,
  cursor = 0,
  slots = [];
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles'; export * from './lib/hepatic'; export * from './lib/hepatic-biliary-context';`,
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
const mod = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  require: (id) =>
    id !== 'react'
      ? require(id)
      : {
          ...React,
          useState: (value) => {
            if (!active) return React.useState(value);
            const i = cursor++;
            if (!(i in slots))
              slots[i] = typeof value === 'function' ? value() : value;
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
          useCallback: (fn, deps) =>
            active ? fn : React.useCallback(fn, deps),
        },
});
const api = mod.exports,
  source = api.hepaticBiliarySource,
  parent = source.parent;
const catalog = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
const pins = JSON.parse(
  await readFile('public/models/bodyparts3d/hepatic/biliary-context.json'),
);
same(pins.license, 'CC-BY-4.0');
same(pins.credit, catalog.credit);
same(pins.coordinateSystem, catalog.coordinateSystem);
same(
  parent,
  catalog.structures.find((s) => s.id === parent.id),
);
same(
  source.structures.map((s) => s.fmaId),
  ['FMA7202', 'FMA14539', 'FMA14668'],
);
same(
  pins.sourceReports.map((r) => r.topology.triangles),
  [2396, 278, 1364],
);
for (const report of pins.sourceReports) {
  for (const field of [
    'duplicateFaces',
    'collapsedFaces',
    'degenerateFaces',
    'boundaryEdges',
    'nonManifoldEdges',
    'nonManifoldVertices',
    'inconsistentWindingEdges',
  ])
    same(report.topology[field], 0);
  same(report.topology.components.length, 1);
}
function triangleBag(geometry, bag = new Map()) {
  const p = geometry.getAttribute('position'),
    index = geometry.index;
  for (let i = 0; i < (index ? index.count : p.count); i += 3) {
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
const meshes = new Map(),
  matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  );
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
  gltf.scene.traverse((m) => {
    if (m.isMesh) meshes.set(`${b.id}:${m.name}`, m);
  });
}
for (const s of source.structures) {
  same(
    s,
    catalog.structures.find((x) => x.id === s.id),
  );
  const raw = await readFile(
    `../work/bodyparts3d/${s.sourceTree}/${s.sources[0].file}.obj`,
  );
  same(hash(raw), s.sources[0].sha256);
  const original = new Map();
  new OBJLoader().parse(raw.toString()).traverse((m) => {
    if (m.isMesh)
      triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
  });
  const mesh = meshes.get(`${s.bundle}:${s.nodeName}`);
  check(mesh);
  same(
    triangleBag(mesh.geometry),
    [...original].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    'Preserve transformed source triangles and winding',
  );
}
const [relation] = api.hepaticBiliaryRelationshipsFor(parent);
check(relation);
same(relation.visibleIds.length, 2);
same(relation.context.length, 4);
same(api.hepaticBiliaryRelationshipsFor(null), []);
for (const mutate of [
  (p) => p.sources.pop(),
  (p) => (p.sources[0].sha256 = '0'.repeat(64)),
  (p) => p.bounds.min[0]++,
  (p) => p.anchor[0]++,
  (p) => (p.name += 'changed'),
  (p) => (p.laterality = 'left'),
]) {
  const altered = clone(parent);
  mutate(altered);
  same(api.hepaticBiliaryRelationshipsFor(altered), []);
  same(
    api.hepaticBiliaryViewCatalog(altered, true, relation.id).structures,
    [],
  );
}
same(api.hepaticBiliaryViewCatalog(parent), api.hepaticViewCatalog(parent));
same(
  api.hepaticBiliaryViewCatalog(parent, true, 'foreign'),
  api.hepaticViewCatalog(parent, true),
);
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
  tree = api.VentricularView({ parent, study: 'hepatic' });
  active = false;
};
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const picker = () =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some(
        (c) => c.props?.id === 'ventricular-preset',
      ),
  ).props;
render();
same(scene().contextIds, []);
picker().onValueChange(relation.id);
render();
same(
  scene().contextIds,
  relation.context.map((s) => s.id),
);
same(scene().selectedId, relation.spaceId);
same(
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id)).length,
  6,
);
check(text(tree).includes('source-labelled common hepatic duct'));
check(text(tree).includes('No separate common bile duct'));
check(text(tree).includes('NIDDK'));
check(
  button('Frame selected').disabled,
  'Context bundles participate in the loading gate',
);
for (const b of scene().catalog.bundles) scene().onLoaded(b.id);
scene().onRendererHealth('ready');
render();
same(button('Frame selected').disabled, false);
scene().onFailure(source.bundles[0].id);
render();
same(button('Frame selected').disabled, true);
scene().onLoaded(source.bundles[0].id);
render();
same(button('Frame selected').disabled, false);
for (const c of relation.context) {
  check(!scene().landmarks.includes(c.id));
  same(scene().appearance[c.id].color, api.hepaticBiliaryColour(c));
  scene().onSelect(c.id);
  render();
  same(scene().selectedId, relation.spaceId);
}
scene().onSelect(relation.visibleIds[1]);
render();
same(scene().selectedId, relation.visibleIds[1]);
same(scene().contextIds.length, 4);
const slider = () =>
  nodes(tree).find((n) => n.props?.id === 'ventricular-explode').props;
slider().onValueChange([100]);
render();
same(scene().contextIds, []);
same(scene().catalog.bundles.length, 1);
slider().onValueChange([0]);
render();
same(scene().contextIds.length, 4);
button('Show biliary landmarks').onClick();
render();
same(scene().contextIds, []);
button('Show biliary landmarks').onClick();
render();
same(scene().contextIds.length, 4);
picker().onValueChange('portal');
render();
same(scene().contextIds, api.hepaticCatalog.contextIds);
check(!text(tree).includes('No separate common bile duct'));
const markup = require('react-dom/server').renderToStaticMarkup(
  React.createElement(api.VentricularView, { parent, study: 'hepatic' }),
);
check(markup.includes('Liver branch guide'));
console.log(
  JSON.stringify({
    checks,
    extraLandmarks: 3,
    reusedTriangles: 4038,
    relationshipPresets: 1,
    geometryChanged: false,
    browserQA: false,
    clinicalApproval: false,
  }),
);
