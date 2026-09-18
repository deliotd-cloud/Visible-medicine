import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ts from 'typescript';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url);
const actualLink = await import('vinext/shims/link');
execFileSync(
  process.execPath,
  ['scripts/audit-cerebral-supplements.mjs', '--check'],
  { stdio: 'pipe' },
);
let checks = 0;
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
    message,
  );
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const library = await build({
  stdin: {
    contents:
      "export * from './lib/cerebral'; export * from './lib/ventricles';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const libraryModule = { exports: {} };
runInNewContext(library.outputFiles[0].text, {
  module: libraryModule,
  exports: libraryModule.exports,
  require,
});
const {
  cerebralFor,
  cerebralCatalog: manifest,
  cerebralPresets,
  cerebralGroups,
  initialVentricles,
  reduceVentricles,
  ventricleCatalog,
} = libraryModule.exports;
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
same(manifest.parent, parent);
same(manifest.evidence, evidence);
same(manifest.coordinateSystem, catalog.coordinateSystem);
same(manifest.license, 'CC-BY-4.0');
same(manifest.credit, catalog.credit);
same(manifest.structures.length, 16);
const layers = cerebralFor(parent);
same(layers.length, 14);
const definitions = [
  [
    'FMA72970',
    'left frontal lobe',
    ['FJ1744', 'FJ1787', 'FJ1800', 'FJ1833'],
    'left',
    'frontal',
  ],
  [
    'FMA72969',
    'right frontal lobe',
    ['FJ1745', 'FJ1788', 'FJ1801', 'FJ1834'],
    'right',
    'frontal',
  ],
  [
    'FMA72974',
    'left parietal lobe',
    ['FJ1732', 'FJ1797', 'FJ1835', 'FJ1841'],
    'left',
    'parietal',
  ],
  [
    'FMA72973',
    'right parietal lobe',
    ['FJ1733', 'FJ1798', 'FJ1836', 'FJ1842'],
    'right',
    'parietal',
  ],
  [
    'FMA72972',
    'left temporal lobe',
    ['FJ1746', 'FJ1783', 'FJ1785', 'FJ1789'],
    'left',
    'temporal',
  ],
  [
    'FMA72971',
    'right temporal lobe',
    ['FJ1747', 'FJ1784', 'FJ1786', 'FJ1790'],
    'right',
    'temporal',
  ],
  ['FMA72976', 'left occipital lobe', ['FJ1791'], 'left', 'occipital'],
  ['FMA72975', 'right occipital lobe', ['FJ1792'], 'right', 'occipital'],
  ['FMA72978', 'left insula', ['FJ1748'], 'left', 'insula'],
  ['FMA72977', 'right insula', ['FJ1749'], 'right', 'insula'],
  [
    'FMA72801',
    'anterior part of left superior temporal gyrus',
    ['FJ1837'],
    'left',
    'superior-temporal-anterior',
  ],
  [
    'FMA72800',
    'anterior part of right superior temporal gyrus',
    ['FJ1838'],
    'right',
    'superior-temporal-anterior',
  ],
  [
    'FMA72805',
    'posterior part of left superior temporal gyrus',
    ['FJ1839'],
    'left',
    'superior-temporal-posterior',
  ],
  [
    'FMA72804',
    'posterior part of right superior temporal gyrus',
    ['FJ1840'],
    'right',
    'superior-temporal-posterior',
  ],
];
const supplements = JSON.parse(
  await readFile('content/cerebral-supplement-audit.json'),
);
same(
  manifest.supplementEvidenceSha256,
  hash(await readFile('content/cerebral-supplement-audit.json')),
);
same(supplements.evidence, evidence);
const bundle = manifest.bundles.find((b) => b.id === 'cerebral');
const bytes = await readFile(
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
same(meshes.length, 14);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
// Retain winding and triangle multiplicity, quantized to 0.001 source mm.
function triangleBag(geometry, bag = new Map()) {
  const p = geometry.getAttribute('position'),
    index = geometry.index,
    count = index ? index.count : p.count;
  for (let i = 0; i < count; i += 3) {
    const v = [0, 1, 2].map((j) => {
      const at = index ? index.getX(i + j) : i + j;
      return [p.getX(at), p.getY(at), p.getZ(at)]
        .map((n) => Math.round(n * 1e5))
        .join(',');
    });
    const key = [0, 1, 2]
      .map((j) => [...v.slice(j), ...v.slice(0, j)].join('|'))
      .sort(compare)[0];
    bag.set(key, (bag.get(key) ?? 0) + 1);
  }
  return bag;
}
let triangles = 0;
for (const [fmaId, name, files, side, groupName] of definitions) {
  const extra = groupName.startsWith('superior-temporal');
  const tree = extra ? 'isa' : 'partof';
  const layer = layers.find((s) => s.fmaId === fmaId);
  const definition = records.find((r) => r.tree === tree && r.id === fmaId);
  same(definition.files, files);
  same(definition.name, name);
  policy.assertNoKnownHolds([definition]);
  same(layer.sourceName, name);
  same(layer.laterality, side);
  same(layer.group, groupName);
  same(layer.sourceTree, tree);
  same(
    layer.sourceRelationship,
    extra ? 'supplemental-source' : 'parent-component',
  );
  check(side === 'left' ? layer.bounds.min[0] > 0 : layer.bounds.max[0] < 0);
  same(layer.category, 'organ');
  same(layer.validation, { status: 'unvalidated', anatomicalReview: false });
  same(
    layer.sources,
    files.map((f) =>
      extra
        ? {
            file: f,
            sha256: supplements.candidates.find(
              (s) => s.file === f && s.fmaId === fmaId,
            ).sha256,
          }
        : parent.sources.find((s) => s.file === f),
    ),
  );
  const original = new Map();
  for (const source of layer.sources) {
    const raw = await readFile(
      '../work/bodyparts3d/' + tree + '/' + source.file + '.obj',
    );
    same(hash(raw), source.sha256);
    const topology = sourceTopology(sourceObjShape(raw));
    same(
      topology,
      manifest.sourceReports.find((r) => r.file === source.file).topology,
    );
    const detached = {
      FJ1744: [3274, 16],
      FJ1745: [3270, 22],
      FJ1833: [6256, 196],
      FJ1834: [6286, 164],
    };
    same(topology.components.length, detached[source.file] ? 2 : 1);
    if (detached[source.file])
      same(
        topology.components.map((c) => c.triangles),
        detached[source.file],
      );
    same(topology.duplicateFaces, 0);
    for (const key of [
      'collapsedFaces',
      'degenerateFaces',
      'boundaryEdges',
      'nonManifoldEdges',
      'nonManifoldVertices',
      'inconsistentWindingEdges',
    ])
      same(topology[key], 0);
    new OBJLoader().parse(raw.toString()).traverse((m) => {
      if (m.isMesh)
        triangleBag(m.geometry.clone().applyMatrix4(matrix), original);
    });
    triangles += topology.triangles;
  }
  const mesh = meshes.find((m) => m.name === layer.nodeName);
  same(mesh.userData.structureId, layer.id);
  same(mesh.userData.studyParentId, parent.id);
  same(mesh.userData.sourceRelationship, layer.sourceRelationship);
  const actual = triangleBag(mesh.geometry);
  same(actual.size, original.size);
  for (const [key, count] of original)
    same(
      actual.get(key),
      count,
      'Source triangles, winding and duplicate multiplicity retained',
    );
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  same(geometry.boundingBox.min.toArray(), layer.bounds.min);
  same(geometry.boundingBox.max.toArray(), layer.bounds.max);
  same(geometry.boundingBox.getCenter(new Vector3()).toArray(), layer.center);
  const p = geometry.getAttribute('position'),
    n = geometry.getAttribute('normal');
  let hasAnchor = false;
  for (let i = 0; i < p.count; i++) {
    check(
      [p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)].every(
        Number.isFinite,
      ),
    );
    hasAnchor ||= [p.getX(i), p.getY(i), p.getZ(i)].every(
      (v, j) => v === layer.anchor[j],
    );
  }
  check(hasAnchor);
}
same(triangles, 102158);
same(
  new Set(
    layers.flatMap((s) => s.sources.map((f) => s.sourceTree + '/' + f.file)),
  ).size,
  32,
);
same(manifest.supplementalIds.length, 4);
same(
  layers
    .filter((s) => s.sourceRelationship === 'parent-component')
    .flatMap((s) => s.sources).length,
  28,
);
for (const c of supplements.candidates) {
  same(c.tree, 'isa');
  same(c.inParentSourceList, false);
  same(c.exactSharedParentTriangles, 0);
  check(c.topology.closedOrientedManifold);
  same(c.topology.components.length, 1);
}
for (const ref of supplements.registrationReferences) {
  const a = await readFile('../work/bodyparts3d/isa/' + ref.file + '.obj');
  const b = await readFile('../work/bodyparts3d/partof/' + ref.file + '.obj');
  same(hash(a), ref.isaSha256);
  same(hash(b), ref.partofSha256);
  const bags = [a, b].map((raw) => {
    const bag = new Map();
    new OBJLoader().parse(raw.toString()).traverse((m) => {
      if (m.isMesh) triangleBag(m.geometry, bag);
    });
    return bag;
  });
  same(bags[0].size, bags[1].size);
  for (const [key, count] of bags[0])
    same(
      bags[1].get(key),
      count,
      'Reference coordinate, triangle and winding equivalence',
    );
  same(ref.exactSharedTriangles, bags[0].size);
}
check(!manifest.structures.some((s) => s.id === parent.id));
same(manifest.contextIds.length, 2);
for (const id of manifest.contextIds)
  same(
    manifest.structures.find((s) => s.id === id),
    ventricleCatalog.structures.find((s) => s.id === id),
  );
same(
  manifest.contextIds.map(
    (id) => manifest.structures.find((s) => s.id === id).fmaId,
  ),
  ['FMA78450', 'FMA78449'],
);
const contextBundle = manifest.bundles.find((b) => b.id === 'ventricles');
same(
  contextBundle,
  ventricleCatalog.bundles.find((b) => b.id === 'ventricles'),
);
same(
  hash(
    await readFile(
      'public' + new URL(contextBundle.url, 'https://local.invalid').pathname,
    ),
  ),
  contextBundle.sha256,
);
for (const mutation of [
  { id: 'bad' },
  { fmaId: 'FMA0' },
  { name: 'Other' },
  { sourceTree: 'isa' },
  { system: 'organs' },
  { laterality: 'left' },
  { region: 'thorax' },
  { category: 'space' },
  { regions: ['head-neck', 'thorax'] },
  { bundle: 'other' },
  { nodeName: 'other' },
  { sources: [] },
  { sources: parent.sources.slice(1) },
  { sources: [...parent.sources, parent.sources[0]] },
  {
    sources: [
      { ...parent.sources[0], sha256: '0'.repeat(64) },
      ...parent.sources.slice(1),
    ],
  },
])
  same(cerebralFor({ ...parent, ...mutation }), []);
same(cerebralFor(null), []);
const savedName = manifest.parent.name;
manifest.parent.name = 'stale sidecar';
same(cerebralFor(parent), []);
manifest.parent.name = savedName;
const presets = cerebralPresets(layers);
let state = initialVentricles(layers);
const reduce = (action) => {
  state = reduceVentricles(layers, state, action, presets);
  return state;
};
for (const [value, count] of [
  ['left', 7],
  ['right', 7],
  ['insula', 2],
  ['temporal', 6],
  ['all', 14],
]) {
  reduce({ type: 'preset', value });
  same(layers.length - state.hidden.length, count);
  check(!state.hidden.includes(state.selectedId));
}
for (const value of ['unknown', '__proto__', 'toString', 'lateral']) {
  const before = state;
  reduce({ type: 'preset', value });
  check(state === before);
}
for (const layer of layers) {
  reduce({ type: 'select', id: layer.id });
  const before = structuredClone(state);
  reduce({ type: 'visibility', id: layer.id, visible: false });
  same(state.selectedId, null);
  reduce({ type: 'undo' });
  same({ ...state, future: before.future }, { ...before, history: before.history.slice(-29) });
  check(state.future.length > 0);
  reduce({ type: 'visibility', id: layer.id, visible: false });
  reduce({ type: 'select', id: layer.id });
  check(!state.hidden.includes(layer.id));
}
const beforeContext = state;
reduce({ type: 'select', id: manifest.contextIds[0] });
check(state === beforeContext);
for (let i = 0; i < 65; i++)
  reduce({ type: 'preset', value: i % 2 ? 'left' : 'right' });
same(state.history.length, 30);
for (const layer of layers)
  reduce({ type: 'visibility', id: layer.id, visible: false });
same(state.hidden.length, 14);
same(state.selectedId, null);
reduce({ type: 'preset', value: 'all' });
same(state.hidden, []);

const source = await readFile('app/ventricles.tsx', 'utf8');
const ast = ts.createSourceFile(
  'view.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let changeStudy;
function visit(node) {
  if (
    ts.isJsxAttribute(node) &&
    node.name.text === 'onValueChange' &&
    node.initializer?.getText(ast).includes('setStudy(v)')
  )
    changeStudy = node.initializer.expression.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
check(changeStudy);
let current = 'brainstem';
const env = {
  setStudy: (v) => {
    current = v;
  },
};
for (const value of ['ventricles', 'brainstem', 'cerebral']) {
  runInNewContext(`(${changeStudy})('${value}')`, env);
  same(current, value);
}
runInNewContext(`(${changeStudy})('unknown')`, env);
same(current, 'cerebral');
check(
  source.includes('key={`${parent.id}:${study}`}'),
  'Study switch remounts and clears old selection, visibility, loading and camera state',
);
check(source.includes('!context || explode > 0'));
check(source.includes('disabled={explode > 0}'));
check(source.includes('landmarks={selectableIds}'));

const compiled = await build({
  stdin: {
    contents:
      "export * from './app/ventricles'; export { CerebralLayers } from './app/cerebral-layers';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'brain-gpu-fixture',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents:
            'export const BodyScene=(props)=>{globalThis.__scene=props;return null}; export const retryBodyAssets=()=>{};',
          loader: 'tsx',
        }));
      },
    },
  ],
});
const React = require('react'),
  uiModule = { exports: {} },
  uiEnv = {
    module: uiModule,
    exports: uiModule.exports,
    require: (id) =>
      id === 'next/link' ? { __esModule: true, ...actualLink } : require(id),
    console,
    process: { env: { NODE_ENV: 'test' } },
    structuredClone,
    URL,
    URLSearchParams,
  };
runInNewContext(compiled.outputFiles[0].text, uiEnv);
for (const study of ['cerebral', 'brainstem', 'ventricles']) {
  const html = require('react-dom/server').renderToStaticMarkup(
    React.createElement(uiModule.exports.VentricularView, { parent, study }),
  );
  const switches = html.match(/<[^>]*role="switch"[^>]*>/g) || [];
  same(switches.filter((tag) => tag.includes('aria-label="Show original position"')).length, 1);
  same(
    switches.filter((tag) => !tag.includes('aria-label="Show original position"')).length,
    study === 'cerebral' ? 14 : study === 'brainstem' ? 6 : 4,
  );
  for (const text of study === 'cerebral'
    ? [
        'All supplied regions',
        'Frontal',
        'Parietal',
        'Temporal',
        'Occipital',
        'Insula',
        'Show lateral ventricles',
        'Partial source coverage',
      ]
    : study === 'brainstem'
      ? ['Brainstem and cerebellum', 'Show fourth ventricle', 'Source compound']
      : ['All four spaces', 'Show brain context', 'Space representation'])
    check(html.includes(text));
  for (const text of ['Undo layers', 'Reassemble', 'CC BY 4.0 licence'])
    check(html.includes(text));
  const scene = uiEnv.__scene;
  same(
    scene.structures.length,
    study === 'cerebral' ? 16 : study === 'brainstem' ? 7 : 9,
  );
  same(
    scene.landmarks.length,
    study === 'cerebral' ? 14 : study === 'brainstem' ? 6 : 4,
  );
  if (study === 'cerebral')
    for (const group of cerebralGroups) {
      const pair = layers.filter((s) => s.group === group.id);
      same(pair.length, 2);
      for (const s of pair) {
        same(scene.appearance[s.id].color, group.colour);
        check(html.includes('Select ' + s.name.toLowerCase()));
        check(html.includes('Show ' + s.name.toLowerCase()));
      }
    }
  check(!scene.structures.some((s) => s.id === parent.id));
  for (const id of scene.catalog.contextIds) {
    check(scene.hiddenIds.includes(id));
    check(scene.appearance[id].opacity < 0.2);
    check(!scene.landmarks.includes(id));
  }
  same(scene.explode, 0);
}
const chosen = [],
  visibility = [];
const pairTree = uiModule.exports.CerebralLayers({
  layers,
  selectedId: layers[0].id,
  hidden: [],
  onSelect: (id) => chosen.push(id),
  onVisibility: (id, visible) => visibility.push([id, visible]),
});
function visitControls(element) {
  if (!element || typeof element !== 'object') return;
  if (Array.isArray(element)) {
    element.forEach(visitControls);
    return;
  }
  if (element.props?.['aria-label']?.startsWith('Select '))
    element.props.onClick();
  if (element.props?.['aria-label']?.startsWith('Show ')) {
    element.props.onCheckedChange(false);
    element.props.onCheckedChange(true);
  }
  visitControls(element.props?.children);
}
visitControls(pairTree);
same(
  chosen,
  layers.map((s) => s.id),
);
same(
  visibility,
  layers.flatMap((s) => [
    [s.id, false],
    [s.id, true],
  ]),
);
const report = {
  passed: true,
  checks,
  selectableRepresentations: 14,
  sourceFiles: 32,
  existingContextSpaces: 2,
  triangles,
  bytes: bytes.length,
  sha256: hash(bytes),
  originalBrainFiles: 59,
  parentModified: false,
  sourceRemnantsRetained: true,
  newSuperiorTemporalParts: 4,
  retainedDetachedFrontalComponents: 4,
  clinicalApproval: false,
  browserInteractionTesting: false,
  publishedPatientScans: false,
};
await writeFile(
  'docs/cerebral-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
