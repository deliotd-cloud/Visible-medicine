/* oxlint-disable react-hooks/rules-of-hooks -- Controlled renderer props, not GPU acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react'),
  THREE = require('three');
const compiled = await build({
  stdin: {
    contents: `export {BodyScene} from './app/body-scene';
    export {bodyDisplayCatalog} from './lib/body-display-catalog';
    export {selectedOriginGuide} from './lib/origin-guides';
    export * from './lib/nested-anatomy';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
let mockScene = new THREE.Group();
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  require: (id) =>
    id === 'react'
      ? { ...React, useMemo: (fn) => fn(), useEffect: () => {} }
      : id === '@react-three/drei'
        ? { Line: 'origin-line', useGLTF: () => ({ scene: mockScene }) }
        : require(id),
});
const api = scope.exports;
let checks = 0;
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const same = (a, b) => {
  checks++;
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
  );
};
const nodes = (n) =>
  !n || typeof n !== 'object'
    ? []
    : Array.isArray(n)
      ? n.flatMap(nodes)
      : [n, ...nodes(n.props?.children)];
const raw = api.bodyDisplayCatalog(JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json'),
));
const targets = api.nestedStudyTargets(raw);
const cases = [
  ...new Map(targets.map((t) => [`${t.study}/${t.parentId}`, t])).values(),
];
const inspection = {
  plane: 'off',
  position: 50,
  flipped: false,
  opacity: {},
  keepSelectedSolid: true,
};
const noop = () => {};
function inspect(props) {
  const root = api.BodyScene(props);
  const tree = root.props.children(noop);
  const bundles = nodes(tree).filter(
    (n) => n.props?.bundle && n.props?.offsets,
  );
  const camera = nodes(tree).find(
    (n) => n.props?.bounds && n.props?.direction,
  ).props;
  const meshes = bundles.flatMap((n) => nodes(n.type(n.props)));
  return {
    bundles,
    camera,
    meshes,
    lines: meshes.filter((n) => n.type === 'origin-line'),
  };
}
for (const target of cases) {
  const parent = raw.structures.find((s) => s.id === target.parentId);
  const structures = api.nestedPartsFor(parent, target.study);
  mockScene = new THREE.Group();
  for (const s of structures) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry());
    mesh.name = s.nodeName;
    mockScene.add(mesh);
  }
  const catalog = {
    ...raw,
    structures,
    bundles: [...new Set(structures.map((s) => s.bundle))].map((id) => ({
      id,
      url: id,
    })),
  };
  const base = {
    catalog,
    structures,
    systems: Object.fromEntries(
      ['skeleton', 'muscles', 'organs', 'nerves', 'vessels', 'connective'].map(
        (s) => [s, true],
      ),
    ),
    selectedId: structures[0].id,
    isolated: false,
    hiddenIds: [],
    ghostRemoved: false,
    illustrated: true,
    landmarks: [],
    explode: 65,
    layout: 'extract',
    anchorSkeleton: false,
    showOrigins: true,
    originStyle: 'selected-guide',
    labels: true,
    view: 'anterior',
    zoom: 1,
    reset: 0,
    focus: false,
    exam: false,
    inspection,
    plate: false,
    onSelect: noop,
    onLoaded: noop,
    onFailure: noop,
    onRendererHealth: noop,
  };
  for (const selected of structures) {
    for (const layout of target.study === 'eye'
      ? ['extract']
      : ['extract', 'spatial']) {
      for (const focus of [false, true]) {
        const result = inspect({
          ...base,
          selectedId: selected.id,
          layout,
          focus,
        });
        const bundle = result.bundles.find((b) =>
          b.props.items.some((s) => s.id === selected.id),
        );
        const offset = bundle.props.offsets.get(selected.id);
        const guide = bundle.props.originGuide;
        check(guide && offset.lengthSq() > 0, 'Selected source part moves');
        same(result.lines.length, 1);
        same(result.lines[0].props.points[0], selected.anchor);
        same(
          result.lines[0].props.points[1],
          selected.anchor.map((n, i) => n + offset.toArray()[i]),
        );
        same(result.lines[0].props.raycast(), null);
        const ghosts = result.meshes.filter(
          (n) =>
            n.type === 'mesh' &&
            nodes(n).some((c) => c.props?.opacity === 0.12),
        );
        same(ghosts.length, 1);
        check(
          ghosts[0].props.geometry ===
            mockScene.getObjectByName(selected.nodeName).geometry,
        );
        same(ghosts[0].props.raycast(), null);
        for (const point of [selected.bounds.min, selected.bounds.max]) {
          check(
            result.camera.bounds.containsPoint(new THREE.Vector3(...point)),
          );
          check(
            result.camera.bounds.containsPoint(
              new THREE.Vector3(...point).add(offset),
            ),
          );
        }
        same(guide.bounds, selected.bounds);
      }
    }
  }
  for (const overrides of [
    { showOrigins: false },
    { exam: true },
    { explode: 0 },
    { layout: 'tray' },
    { selectedId: null },
    { selectedId: 'foreign-part' },
    { hiddenIds: [base.selectedId] },
    { hiddenIds: [base.selectedId], ghostRemoved: true },
    { contextIds: [base.selectedId] },
    { systems: {} },
    ...['axial', 'coronal', 'sagittal'].map((plane) => ({
      inspection: { ...inspection, plane },
    })),
    { appearance: { [base.selectedId]: { opacity: 0.1 } } },
  ]) {
    const result = inspect({ ...base, ...overrides });
    same(result.lines.length, 0);
    check(result.bundles.every((b) => b.props.originGuide === null));
    same(
      result.camera.bounds,
      inspect({ ...base, ...overrides, showOrigins: false }).camera.bounds,
    );
  }
  same(
    inspect({ ...base, structures: structures.slice(0, 1) }).lines.length,
    0,
  );
  const legacy = inspect({ ...base, originStyle: undefined });
  same(legacy.lines.length, 0);
  check(
    legacy.meshes.some(
      (n) => n.type === 'meshBasicMaterial' && n.props.opacity === 0.025,
    ),
  );
  const args = {
    ...base,
    enabled: true,
    offsets: new Map([[base.selectedId, new THREE.Vector3(1, 2, 3)]]),
  };
  check(api.selectedOriginGuide(args));
  for (const invalid of [
    new THREE.Vector3(),
    new THREE.Vector3(NaN, 0, 0),
    new THREE.Vector3(Infinity, 0, 0),
  ])
    same(
      api.selectedOriginGuide({
        ...args,
        offsets: new Map([[base.selectedId, invalid]]),
      }),
      null,
    );
  for (const explode of [NaN, Infinity, -1])
    same(api.selectedOriginGuide({ ...args, explode }), null);
  for (const mesh of mockScene.children) mesh.geometry.dispose();
}
const report = {
  passed: true,
  checks,
  parentViews: cases.length,
  representations: targets.length,
  limitations:
    'Real scene, camera-bound and mesh/line props with mocked asset loading and hooks; no GPU, browser, mobile or clinical acceptance.',
};
await writeFile(
  'docs/origin-guide-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
