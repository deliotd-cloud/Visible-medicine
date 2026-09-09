import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-component-test-build.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';
import { eyeLayerDefinitions } from './eye-layer-definitions.mjs';

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
same(manifest.structures.length, 11);
same(
  manifest.excluded.map((s) => s.fmaId),
  ['FMA58239', 'FMA58839', 'FMA58299', 'FMA58271'],
);
const bundle = manifest.bundles[0],
  bytes = await readFile('public' + bundle.url);
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
same(meshes.size, 11);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const triangleKey = (pts) =>
  pts
    .map((p) => p.map((v) => Math.fround(v).toFixed(5)).join(','))
    .sort(compare)
    .join('|');
function triangles(geometry, transform = null) {
  const p = geometry.getAttribute('position'),
    index = geometry.index,
    result = [];
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const pts = [];
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
      if (n.isMesh) sourceTriangles.push(...triangles(n.geometry, matrix));
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
for (const side of ['left', 'right']) {
  const parent = catalog.structures.find(
    (s) => s.fmaId === (side === 'left' ? 'FMA12515' : 'FMA12514'),
  );
  const layers = api.eyeLayersFor(parent);
  same(layers.length, side === 'left' ? 8 : 3);
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
  for (const preset of [
    'all',
    'anterior',
    'lens',
    ...(side === 'left' ? ['wall'] : []),
  ]) {
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
    same(state, before, 'Undo restores selection, preset and visibility');
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
  /!eyeParent\s*&&\s*\(\s*<Scene/.test(source),
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
for (const side of ['left', 'right']) {
  const parent = catalog.structures.find(
    (s) => s.fmaId === (side === 'left' ? 'FMA12515' : 'FMA12514'),
  );
  const html = renderToStaticMarkup(
    React.createElement(component.exports.EyeLayerView, { parent }),
  );
  same((html.match(/role="switch"/g) || []).length, side === 'left' ? 8 : 3);
  check(html.includes('Clinical') || html.includes('clinical'));
  check(html.includes('Anterior structures'));
  check(html.includes('Reassemble'));
  same(html.includes('4 right-eye components unavailable'), side === 'right');
}
const result = {
  passed: true,
  checks,
  selectableComponents: 11,
  left: 8,
  right: 3,
  quarantined: 4,
  sourceFilesConsidered: 17,
  renderedSourceFiles: 12,
  triangles: triangleCount,
  glbBytes: bytes.length,
  glbSha256: hash(bytes),
  rootCatalogueChanged: false,
  controlMarkupCases: 2,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await writeFile(
  'docs/eye-layers-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
