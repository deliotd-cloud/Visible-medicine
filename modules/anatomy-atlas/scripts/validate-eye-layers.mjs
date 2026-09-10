import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Box3, Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-component-test-build.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';
import { eyeLayerDefinitions } from './eye-layer-definitions.mjs';
import { cleanEyeGeometry, eyeCleanupRecipes } from './eye-source-cleanup.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

let checks = 0;
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
    m,
  );
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const raw = await readFile('public/models/bodyparts3d/eye-layers/catalog.json');
const manifest = JSON.parse(raw),
  { catalog, records, policy, evidence } = await loadSourceHolds();
same(
  manifest.evidence,
  evidence,
  'Source table, root catalogue, inventory and hold bindings',
);
same(manifest.license, 'CC-BY-4.0');
same(manifest.coordinateSystem, catalog.coordinateSystem);
same(manifest.structures.length, 15);
same(manifest.excluded, []);
same(
  manifest.sourceCleanup.reduce((sum, s) => sum + s.count, 0),
  36,
);
const bundle = manifest.bundles[0],
  bytes = await readFile(
    'public' + new URL(bundle.url, 'https://local.invalid').pathname,
  );
same(bytes.length, bundle.bytes);
same(hash(bytes), bundle.sha256);
const gltf = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
const meshes = new Map();
gltf.scene.traverse((n) => {
  if (n.isMesh) meshes.set(n.name, n);
});
same(meshes.size, 15);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const triangleKey = (pts) =>
  pts
    .map((p) => p.map((v) => Math.fround(v).toFixed(5)).join(','))
    .sort(compare)
    .join('|');
function triangles(geometry, transform = null, suppressOpposite = false) {
  const p = geometry.getAttribute('position'),
    index = geometry.index,
    result = [];
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const pts = [];
    // Independent expected geometry: retain every right-sided source face.
    // The generator removes pinned face ranges instead of this side predicate.
    if (
      suppressOpposite &&
      [0, 1, 2].every((j) => p.getX(index ? index.getX(i + j) : i + j) > 0)
    )
      continue;
    for (let j = 0; j < 3; j++) {
      const v = new Vector3().fromBufferAttribute(
        p,
        index ? index.getX(i + j) : i + j,
      );
      if (transform) v.applyMatrix4(transform);
      pts.push(v.toArray());
    }
    result.push(triangleKey(pts));
  }
  return result.sort(compare);
}
let triangleCount = 0;
for (const [parentFma, side, fma, name, files, kind] of eyeLayerDefinitions) {
  const parent = catalog.structures.find((s) => s.fmaId === parentFma);
  const row = [...manifest.structures, ...manifest.excluded].find(
    (s) => s.fmaId === fma,
  );
  const definition = records.find((r) => r.tree === 'partof' && r.id === fma);
  same(definition.name, name);
  same(definition.files, files);
  policy.assertNoKnownHolds([definition]);
  same(row.parentId, parent.id);
  same(row.kind, kind);
  same(
    row.sources.map((s) => s.file),
    files,
  );
  const sourceTriangles = [];
  for (const source of row.sources) {
    same(
      source,
      parent.sources.find((s) => s.file === source.file),
    );
    const obj = await readFile(`${cache}/partof/${source.file}.obj`);
    same(hash(obj), source.sha256);
    new OBJLoader().parse(obj.toString()).traverse((n) => {
      if (n.isMesh)
        sourceTriangles.push(
          ...triangles(
            n.geometry,
            matrix,
            eyeCleanupRecipes.some((r) => r.file === source.file),
          ),
        );
    });
  }
  if (manifest.excluded.includes(row)) {
    check(row.oppositeVertices > 0);
    check(!meshes.has(fma));
    continue;
  }
  const mesh = meshes.get(fma);
  check(mesh, 'Each selectable component needs one mesh');
  same(mesh.userData.structureId, row.id);
  same(mesh.userData.parentId, parent.id);
  same(row.validation, { status: 'unvalidated', anatomicalReview: false });
  const p = mesh.geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++)
    check(
      side === 'right' ? p.getX(i) < 0 : p.getX(i) > 0,
      'No opposite-side vertices in admitted layers',
    );
  // Quantize only for comparison, never rewrite the mesh. Float32 export error
  // is checked to 0.001 mm; topology/triangle multiplicity must be preserved.
  const rendered = triangles(mesh.geometry);
  same(
    hash(JSON.stringify(rendered)),
    hash(JSON.stringify(sourceTriangles.sort(compare))),
    'Source triangle positions and multiplicity: ' + fma,
  );
  triangleCount += rendered.length;
  mesh.geometry.computeBoundingBox();
  same(mesh.geometry.boundingBox.min.toArray(), row.bounds.min);
  same(mesh.geometry.boundingBox.max.toArray(), row.bounds.max);
}
for (const parent of manifest.parents) {
  const files = [...manifest.structures, ...manifest.excluded]
    .filter((s) => s.parentId === parent.id)
    .flatMap((s) => s.sources.map((f) => f.file));
  same(new Set(files).size, files.length);
  same(files.sort(compare), parent.sources.map((s) => s.file).sort(compare));
}

const require = createRequire(import.meta.url);
async function moduleFor(entry) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
  });
  const testModule = { exports: {} };
  runInNewContext(result.outputFiles[0].text, {
    module: testModule,
    exports: testModule.exports,
    require,
    console,
  });
  return testModule.exports;
}
const api = await moduleFor('lib/eye-layers.ts'),
  stateApi = await moduleFor('lib/eye-layer-state.ts');
const displayApi = await moduleFor('lib/body-display-catalog.ts');
const correction = JSON.parse(
  await readFile(
    'public/models/bodyparts3d/eye-layers/display-correction.json',
  ),
);
const untouched = JSON.stringify(catalog),
  display = displayApi.bodyDisplayCatalog(catalog);
same(
  JSON.stringify(catalog),
  untouched,
  'Display correction never rewrites archived source',
);
same(display.structures.length, catalog.structures.length);
same(
  display.structures.map((s) => s.id),
  catalog.structures.map((s) => s.id),
);
same(
  display.structures.filter(
    (s, i) =>
      s.fmaId !== 'FMA7198' &&
      JSON.stringify(s) !== JSON.stringify(catalog.structures[i]),
  ).length,
  1,
);
same(
  displayApi.bodyDisplayCatalog(display),
  display,
  'Idempotent display adapter',
);
same(
  correction.original,
  catalog.structures.find((s) => s.id === correction.original.id),
);
same(
  display.structures.find((s) => s.id === correction.original.id),
  correction.replacement,
);
same(display.bundles.at(-1), correction.bundle);
same(
  api.eyeLayersFor(correction.replacement).length,
  7,
  'Nested dissection accepts the corrected parent with original source bindings',
);
const parentBytes = await readFile(
  'public' + new URL(correction.bundle.url, 'https://local.invalid').pathname,
);
same(hash(parentBytes), correction.bundle.sha256);
same(parentBytes.length, correction.bundle.bytes);
const parentGltf = await new GLTFLoader().parseAsync(
  parentBytes.buffer.slice(
    parentBytes.byteOffset,
    parentBytes.byteOffset + parentBytes.byteLength,
  ),
  '',
);
const parentMeshes = [];
parentGltf.scene.traverse((n) => {
  if (n.isMesh) parentMeshes.push(n);
});
same(parentMeshes.length, 1);
same(parentMeshes[0].name, correction.replacement.nodeName);
const parentTriangles = triangles(parentMeshes[0].geometry);
const childTriangles = manifest.structures
  .filter((s) => s.parentId === correction.original.id)
  .flatMap((s) => triangles(meshes.get(s.nodeName).geometry))
  .sort(compare);
same(
  hash(JSON.stringify(parentTriangles)),
  hash(JSON.stringify(childTriangles)),
  'Main model uses exactly the seven cleaned child surfaces, once each',
);
parentMeshes[0].geometry.computeBoundingBox();
same(
  parentMeshes[0].geometry.boundingBox.min.toArray(),
  correction.replacement.bounds.min,
);
same(
  parentMeshes[0].geometry.boundingBox.max.toArray(),
  correction.replacement.bounds.max,
);
check(
  correction.original.bounds.max[0] > 0 &&
    correction.replacement.bounds.max[0] < 0,
);
const geometryPositions = parentMeshes[0].geometry.getAttribute('position');
let anchorPresent = false;
for (let i = 0; i < geometryPositions.count; i++) {
  check(geometryPositions.getX(i) < 0);
  if (
    [
      geometryPositions.getX(i),
      geometryPositions.getY(i),
      geometryPositions.getZ(i),
    ].every((v, k) => v === correction.replacement.anchor[k])
  )
    anchorPresent = true;
}
check(
  anchorPresent,
  'Corrected label anchor is an actual retained source vertex',
);
const linkApi = await moduleFor('lib/anatomy-link-registry.ts');
const contentApi = await moduleFor('app/body-content.ts');
for (const tab of [
  'anatomy',
  'function',
  'ct',
  'mri',
  'ultrasound',
  'pathology',
  'clinical',
  'quiz',
]) {
  const before = contentApi.bodyLesson(correction.original, tab),
    after = contentApi.bodyLesson(correction.replacement, tab);
  same(
    after.readiness,
    before.readiness,
    'Source cleanup does not elevate clinical readiness',
  );
  same(after.body, before.body, 'Existing factual lesson body remains bound');
}
const oldEntry = linkApi
    .bodyLinkEntries(catalog)
    .find((s) => s.id === correction.original.id),
  newEntry = linkApi
    .bodyLinkEntries(display)
    .find((s) => s.id === correction.original.id);
same(newEntry.sources, oldEntry.sources);
same(newEntry.id, oldEntry.id);
check(
  newEntry.reference.point[0] < -17,
  'Outgoing runtime reference uses corrected bounds, not midline-biased archived bounds',
);
check(Math.abs(newEntry.reference.point[0] - oldEntry.reference.point[0]) > 20);
const loadApi = await moduleFor('lib/anatomy-load-state.ts');
const selectedParent = [correction.replacement],
  systems = {
    skeleton: true,
    muscles: true,
    organs: true,
    nerves: true,
    vessels: true,
    connective: true,
  };
same(loadApi.requestedAnatomyBundles(selectedParent, systems, [], false), [
  correction.bundle.id,
]);
same(
  loadApi.requestedAnatomyBundles(
    selectedParent,
    systems,
    [correction.original.id],
    false,
  ),
  [],
);
same(
  loadApi.requestedAnatomyBundles(
    selectedParent,
    systems,
    [correction.original.id],
    true,
  ),
  [correction.bundle.id],
);
const practiceApi = await moduleFor('lib/anatomy-practice.ts');
same(
  practiceApi.practicePool(selectedParent, [correction.original.bundle]),
  [],
  'Old aggregate loading cannot falsely enable corrected-eye practice',
);
same(
  practiceApi
    .practicePool(selectedParent, [correction.bundle.id])
    .map((s) => s.id),
  [correction.original.id],
);
for (const mutation of [
  (c) =>
    (c.structures.find(
      (s) => s.id === correction.original.id,
    ).sources[0].sha256 = '0'.repeat(64)),
  (c) =>
    (c.structures.find((s) => s.id === correction.original.id).bounds.max[0] +=
      1),
  (c) =>
    (c.structures.find((s) => s.id === correction.original.id).anchor[0] += 1),
  (c) =>
    c.structures.push(
      c.structures.find((s) => s.id === correction.original.id),
    ),
  (c) => (c.coordinateSystem.sourceToSceneColumnMajor[0] = 1),
  (c) => c.bundles.push(correction.bundle),
]) {
  const changed = structuredClone(catalog);
  mutation(changed);
  checks++;
  assert.throws(() => displayApi.bodyDisplayCatalog(changed));
}
for (const mutation of [
  (c) => c.bundles.pop(),
  (c) => (c.bundles.at(-1).sha256 = '0'.repeat(64)),
  (c) =>
    (c.structures.find((s) => s.id === correction.original.id).bundle =
      'other'),
]) {
  const changed = structuredClone(display);
  mutation(changed);
  checks++;
  assert.throws(() => displayApi.bodyDisplayCatalog(changed));
}
let suppressedAreaMm2 = 0,
  suppressedComponents = 0;
for (const recipe of eyeCleanupRecipes) {
  const bytes = await readFile(`${cache}/partof/${recipe.file}.obj`);
  same(hash(bytes), recipe.sha256);
  const topology = sourceTopology(sourceObjShape(bytes));
  const fragments = topology.components.filter((c) => c.bounds.min[0] > 0);
  same(
    fragments.reduce((n, c) => n + c.triangles, 0),
    recipe.count,
  );
  const record = correction.cleanup.find((c) => c.file === recipe.file);
  same(record.fragments, fragments);
  suppressedComponents += fragments.length;
  suppressedAreaMm2 += fragments.reduce((n, c) => n + c.areaMm2, 0);
  check(
    fragments.every(
      (c) =>
        c.bounds.max.every((v, k) => v - c.bounds.min[k] < 0.1) &&
        c.areaMm2 < 0.01,
    ),
  );
  const shape = new OBJLoader()
    .parse(bytes.toString())
    .children.find((n) => n.isMesh).geometry;
  checks++;
  assert.throws(() =>
    cleanEyeGeometry(shape, { ...recipe, sha256: '0'.repeat(64) }),
  );
  const changed = shape.clone();
  changed.getAttribute('position').setX(recipe.start * 3, -1);
  checks++;
  assert.throws(() => cleanEyeGeometry(changed, recipe));
}
for (const side of ['left', 'right']) {
  const parent = catalog.structures.find(
    (s) => s.fmaId === (side === 'left' ? 'FMA12515' : 'FMA12514'),
  );
  const layers = api.eyeLayersFor(parent);
  same(layers.length, side === 'left' ? 8 : 7);
  for (const mutation of [
    (p) => (p.id += '-foreign'),
    (p) => (p.fmaId = 'FMA0'),
    (p) => (p.laterality = 'unknown'),
    (p) => (p.sourceTree = 'isa'),
    (p) => p.sources.pop(),
    (p) => (p.sources[0].sha256 = '0'.repeat(64)),
    (p) => (p.sources[0] = p.sources[1]),
  ]) {
    const candidate = structuredClone(parent);
    mutation(candidate);
    same(api.eyeLayersFor(candidate), [], 'Stale/foreign bindings fail closed');
  }
  let state = stateApi.initialEyeLayers(layers);
  const update = (action) => {
    const before = JSON.stringify(state);
    const old = state;
    state = stateApi.reduceEyeLayers(layers, state, action);
    same(JSON.stringify(old), before);
    check(state.history.length <= 30);
    check(!state.hidden.includes(state.selectedId));
    check(state.hidden.every((id) => layers.some((s) => s.id === id)));
  };
  for (const preset of ['all', 'anterior', 'lens', 'wall']) {
    update({ type: 'preset', value: preset });
    same(state.hidden, api.eyePresetHidden(layers, preset));
    same(state.preset, preset);
  }
  for (const layer of layers) {
    update({ type: 'select', id: layer.id });
    check(!state.hidden.includes(layer.id));
    const before = structuredClone(state);
    update({ type: 'visibility', id: layer.id, visible: false });
    same(state.selectedId, null);
    update({ type: 'undo' });
    same(
      { ...state, future: before.future },
      before,
      'Undo restores selection, preset and visibility',
    );
    check(state.future.length > 0, 'Undone layers remain redoable');
  }
  for (let i = 0; i < 70; i++)
    update({ type: 'preset', value: i % 2 ? 'lens' : 'all' });
  same(state.history.length, 30);
  check(state.history.every((s) => !('history' in s)));
  const before = structuredClone(state);
  update({ type: 'select', id: 'foreign' });
  same(state, before);
  update({ type: 'preset', value: 'unknown' });
  same(state, before);
  for (const layer of layers)
    update({ type: 'visibility', id: layer.id, visible: false });
  same(state.hidden.length, layers.length);
  same(state.selectedId, null);
  update({ type: 'preset', value: 'all' });
  same(state.hidden, []);
}

// Execute the real launcher/close callbacks without mounting a browser or GPU.
const source = await readFile('app/body-explorer.tsx', 'utf8');
check(source.includes('const value = bodyDisplayCatalog(data as BodyCatalog)'));
check(
  source.indexOf('bodyDisplayCatalog(data as BodyCatalog)') <
    source.indexOf('bodyLinkEntries(value)'),
  'Source display correction precedes reference validation',
);
const ast = ts.createSourceFile(
  'body.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let open, close;
function visit(n) {
  if (
    ts.isJsxAttribute(n) &&
    n.name.text === 'onClick' &&
    n.initializer?.getText(ast).includes('setEyeParent(selected)')
  )
    open = n.initializer.expression.getText(ast);
  if (ts.isVariableDeclaration(n) && n.name.getText(ast) === 'closeEyeLayers')
    close = n.initializer.arguments[0].getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
check(open && close);
const camera = {
  direction: [0, 0, 1],
  up: [0, 1, 0],
  pan: [1, 2, 0],
  distance: 2,
};
let chosen = 'unset',
  focused = 0;
const env = {
  cameraRestore: { current: null },
  cameraCapture: { current: camera },
  setNestedSelection: () => {},
  nestedReturnFocus: { current: null },
  selected: catalog.structures[0],
  setEyeParent: (v) => {
    chosen = v;
  },
  copyRecoveryCamera: (c) => structuredClone(c),
  requestAnimationFrame: (f) => f(),
  eyeLauncher: { current: { focus: () => focused++ } },
};
runInNewContext(`(${open})();`, env);
same(chosen.id, env.selected.id);
same(env.cameraRestore.current, camera);
check(env.cameraRestore.current !== camera);
runInNewContext(`(${close})();`, env);
same(chosen, null);
same(focused, 1);
check(
  /!eyeParent\s*&&\s*!ventricleParent\s*&&\s*\(\s*<Scene/.test(source),
  'Parent scene unmounted while child dissection is open',
);
check(source.includes('eyeParent.id === selectedId'));
check(source.includes('!exam && eyeLayersFor(selected).length > 0'));
const scene = await readFile('app/body-scene.tsx', 'utf8');
check(scene.includes('opacity ?? 1'));
check(scene.includes('colorFor(structure)'));
const ui = await readFile('app/eye-layers.tsx', 'utf8');
for (const token of [
  'Back to atlas',
  'eye-layer-preset',
  'currentPreset',
  'onCheckedChange',
  'retryBodyAssets',
  'Fade others',
  'Reassemble',
  'CC BY 4.0 licence',
  'not anatomical positions',
])
  check(ui.includes(token));
// Render actual nested controls; only the GPU scene is replaced. This does not
// claim browser interaction, focus-trap behaviour or visual acceptance.
const compiled = await build({
  entryPoints: ['app/eye-layers.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'eye-gpu-fixture',
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
const component = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: component,
  exports: component.exports,
  require,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
const React = require('react'),
  { renderToStaticMarkup } = require('react-dom/server');
const inspectionApi = await moduleFor('lib/inspection-state.ts');
const geometryApi = await moduleFor('lib/inspection-geometry.ts');
const visibilityApi = await moduleFor('lib/selection-visibility.ts');
const { initialInspection, sectionAxes } = inspectionApi;
// Execute the actual stateless cutaway control callbacks. GPU/DOM behaviour is
// not simulated; the shared renderer math is checked against both eye frames.
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}
let cutState = initialInspection;
const cutNodes = () =>
  elements(
    component.exports.EyeCutawayControls({
      value: cutState,
      onChange: (value) => {
        cutState = value;
      },
    }),
  );
const planeControl = () =>
  cutNodes().find(
    (n) => n.props?.onValueChange && n.props?.value === cutState.plane,
  );
for (const plane of ['axial', 'coronal', 'sagittal']) {
  planeControl().props.onValueChange(plane);
  same(cutState, { ...initialInspection, plane });
  const axis = sectionAxes[plane];
  const slider = () =>
    cutNodes().find((n) => n.props?.['aria-label'] === 'Eye cutaway position');
  for (const [input, expected] of [
    [[25], 25],
    [75, 75],
    [[-5], 0],
    [[105], 100],
  ]) {
    slider().props.onValueChange(input);
    same(cutState.position, expected);
  }
  for (const invalid of [[], [NaN], [Infinity], ['50']]) {
    const before = cutState;
    slider().props.onValueChange(invalid);
    same(cutState, before);
  }
  slider().props.onValueChange([50]);
  for (const flipped of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(component.exports.EyeCutawayControls, {
        value: cutState,
        onChange: () => {},
      }),
    );
    check(html.includes(`Keep ${flipped ? axis.low : axis.high}`));
    check(html.includes('not a scan or reconstructed tissue'));
    check(html.includes('Eye cutaway position'));
    check(
      !/<details[^>]*\bopen(?:[\s=>])/.test(html),
      'Cutaway starts collapsed',
    );
    cutNodes()
      .find((n) => n.props?.['aria-label'] === 'Reverse eye cutaway side')
      .props.onClick();
    same(cutState.flipped, !flipped);
  }
}
for (const invalid of [null, '', 'unknown', '__proto__', 'constructor']) {
  const before = cutState;
  planeControl().props.onValueChange(invalid);
  same(cutState, before);
}
planeControl().props.onValueChange('off');
same(cutState, initialInspection);
check(
  !cutNodes().some((n) => n.props?.['aria-label'] === 'Eye cutaway position'),
);
check(
  ui.includes('inspection={inspection}'),
  'Controlled cut passed to renderer',
);
check(ui.includes('Restore whole view'));
check(ui.includes('Undo layers'));
// Presets reset the cut along with separation. Restore whole view only resets
// the cut, preserving visibility/selection/separation and camera state.
const eyeAst = ts.createSourceFile(
  'eye.tsx',
  ui,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let presetFunction, restoreCallback;
function findCutBindings(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'preset')
    presetFunction = n.getText(eyeAst);
  if (
    ts.isJsxAttribute(n) &&
    n.name.text === 'onClick' &&
    n.initializer?.expression?.getText(eyeAst) ===
      '() => setInspection(initialInspection)'
  )
    restoreCallback = n.initializer.expression.getText(eyeAst);
  ts.forEachChild(n, findCutBindings);
}
findCutBindings(eyeAst);
check(presetFunction && restoreCallback);
const actions = [];
const cutEnv = {
  initialInspection,
  dispatch: (v) => actions.push(['dispatch', v]),
  setExplode: (v) => actions.push(['explode', v]),
  setIsolated: (v) => actions.push(['isolated', v]),
  setFocus: (v) => actions.push(['focus', v]),
  setInspection: (v) => actions.push(['inspection', v]),
};
runInNewContext(ts.transpile(`${presetFunction}; preset('wall');`), cutEnv);
same(actions, [
  ['dispatch', { type: 'preset', value: 'wall' }],
  ['explode', 0],
  ['isolated', false],
  ['focus', false],
  ['inspection', initialInspection],
]);
actions.length = 0;
runInNewContext(`(${restoreCallback})();`, cutEnv);
same(actions, [['inspection', initialInspection]]);
let cutawayGeometryCases = 0;
for (const side of ['left', 'right']) {
  const layers = manifest.structures.filter((s) => s.laterality === side);
  const bounds = visibilityApi.selectionBounds(layers);
  const frame = new Box3(
    new Vector3(...bounds.min),
    new Vector3(...bounds.max),
  );
  for (const plane of ['axial', 'coronal', 'sagittal'])
    for (const position of [0, 50, 100])
      for (const flipped of [false, true]) {
        const state = { ...initialInspection, plane, position, flipped };
        const base = geometryApi.sectionPlanes(
          frame,
          state,
          new Vector3(),
          true,
        );
        same(base.length, 1, 'Selected eye surfaces are still clipped');
        for (const layer of layers) {
          const report = visibilityApi.selectionVisibility({
            system: layer.system,
            enabled: true,
            bounds: layer.bounds,
            frame: bounds,
            inspection: state,
          });
          const corners = [];
          for (const x of [layer.bounds.min[0], layer.bounds.max[0]])
            for (const y of [layer.bounds.min[1], layer.bounds.max[1]])
              for (const z of [layer.bounds.min[2], layer.bounds.max[2]])
                corners.push(new Vector3(x, y, z));
          const allClipped = corners.every(
            (p) => !geometryApi.pointRetained(p.toArray(), base),
          );
          same(
            report.reasons.includes('Selection clipped by cutaway'),
            allClipped,
          );
          same(
            report.clipped,
            corners.some((p) => !geometryApi.pointRetained(p.toArray(), base)),
          );
          // Existing cut transform must remain identical before/after arbitrary
          // component displacement (covers lift and tray without a camera).
          const offset = new Vector3(0.31, -0.17, 0.23);
          const moved = geometryApi.sectionPlanes(frame, state, offset, true);
          for (const p of corners)
            check(
              Math.abs(
                base[0].distanceToPoint(p) -
                  moved[0].distanceToPoint(p.clone().add(offset)),
              ) < 1e-10,
            );
          cutawayGeometryCases++;
        }
      }
}
for (const side of ['left', 'right']) {
  const parent = catalog.structures.find(
    (s) => s.fmaId === (side === 'left' ? 'FMA12515' : 'FMA12514'),
  );
  const html = renderToStaticMarkup(
    React.createElement(component.exports.EyeLayerView, { parent }),
  );
  const switches = html.match(/<[^>]*role="switch"[^>]*>/g) || [];
  same(
    switches.filter((tag) =>
      tag.includes('aria-label="Show original position"'),
    ).length,
    1,
  );
  same(
    switches.filter(
      (tag) => !tag.includes('aria-label="Show original position"'),
    ).length,
    side === 'left' ? 8 : 7,
  );
  check(html.includes('Clinical') || html.includes('clinical'));
  check(html.includes('Anterior structures'));
  check(html.includes('Reassemble'));
  check(html.includes('Cutaway · Off'));
  check(
    !html.includes('Restore whole view'),
    'Whole view has no active-cut banner',
  );
  same(html.includes('36 tiny disconnected triangles'), side === 'right');
}
const result = {
  passed: true,
  checks,
  selectableComponents: 15,
  left: 8,
  right: 7,
  suppressedSourceTriangles: 36,
  sourceFilesConsidered: 17,
  renderedSourceFiles: 17,
  triangles: triangleCount,
  glbBytes: bytes.length,
  glbSha256: hash(bytes),
  rootCatalogueChanged: false,
  runtimeRightEyeCorrected: true,
  correctedParentBytes: parentBytes.length,
  correctedParentSha256: hash(parentBytes),
  correctedParentTriangles: parentTriangles.length,
  suppressedComponents,
  suppressedAreaMm2,
  unrelatedToEyeOrPancreasDisplayedRecordsChanged: 0,
  controlMarkupCases: 2,
  cutawayControlMarkupCases: 6,
  cutawayGeometryCases,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await writeFile(
  'docs/eye-layers-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
