import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import {
  readGlb,
  compressGlb,
  validateGlbDelivery,
} from './glb-lossless-codec.mjs';
import {
  hraSource,
  hraPelvicHolds,
  hraCandidateNodeIndices,
  hraDigest,
  hraAccessor,
  hraSubset,
  hraWriteGlb,
} from './hra-pelvis-source.mjs';
import { prepareShape } from './vessel-shape-math.mjs';
import { sourceTopology } from './source-topology.mjs';

const sourceBytes = await readFile(
  'content/sources/hra-pelvis/pelvic-source.glb',
);
const source = readGlb(sourceBytes),
  bytes = await readFile('public/models/hra-pelvis/pelvis.glb'),
  display = readGlb(bytes);
const audit = JSON.parse(await readFile('docs/hra-pelvic-source-audit.json'));
const raw = JSON.parse(await readFile('public/models/hra-pelvis/catalog.json'));
assert.equal(hraDigest(sourceBytes), raw.sourceSubsetSha256);
assert.equal(hraDigest(bytes), raw.bundles[0].sha256);
assert.equal(raw.structures.length, 41);
assert.equal(source.json.nodes.length, 47);
assert.equal(raw.clinicalApproval, false);
assert.equal(
  hraDigest(await readFile('content/sources/hra-pelvis/metadata.json')),
  hraSource.metadataSha256,
);
assert.equal(
  hraDigest(await readFile('content/sources/hra-pelvis/crosswalk.csv')),
  hraSource.crosswalkSha256,
);
// Recompute topology from every retained original, including the six withheld sources.
for (const node of source.json.nodes) {
  const p = source.json.meshes[node.mesh].primitives[0],
    row = audit.rows.find((r) => r.nodeName === node.name);
  const vertices = hraAccessor(source.json, source.bin, p.attributes.POSITION),
    indices = hraAccessor(source.json, source.bin, p.indices).flat();
  assert.equal(hraDigest(JSON.stringify(vertices)), row.positionAccessorSha256);
  assert.deepEqual(
    sourceTopology(
      prepareShape(
        vertices.map((p) => p.map((x) => x * 1000)),
        Array.from({ length: indices.length / 3 }, (_, i) =>
          indices.slice(i * 3, i * 3 + 3),
        ),
      ),
    ),
    row.topology,
  );
  assert.equal(
    display.json.nodes.some((n) => n.name === node.name),
    !Object.hasOwn(hraPelvicHolds, node.name),
  );
}
let triangles = 0;
for (const node of display.json.nodes) {
  const original = source.json.nodes.find((n) => n.name === node.name),
    p = display.json.meshes[node.mesh].primitives[0],
    q = source.json.meshes[original.mesh].primitives[0];
  const surface = raw.structures.find((s) => s.nodeName === node.name);
  assert.deepEqual(
    Object.keys(p.attributes).sort(),
    Object.keys(q.attributes).sort(),
  );
  for (const key of Object.keys(q.attributes)) {
    const expected = hraAccessor(source.json, source.bin, q.attributes[key]);
    assert.deepEqual(
      hraAccessor(display.json, display.bin, p.attributes[key]),
      key === 'POSITION'
        ? expected.map((p) => p.map((x) => Math.fround(x * 10)))
        : expected,
    );
  }
  const positions = hraAccessor(
      display.json,
      display.bin,
      p.attributes.POSITION,
    ),
    indices = hraAccessor(display.json, display.bin, p.indices);
  assert.deepEqual(indices, hraAccessor(source.json, source.bin, q.indices));
  triangles += indices.length / 3;
  assert.equal(indices.length / 3, surface.triangles);
  assert(
    positions.some((p) => JSON.stringify(p) === JSON.stringify(surface.anchor)),
  );
  for (let k = 0; k < 3; k++)
    assert.deepEqual(
      [
        Math.min(...positions.map((p) => p[k])),
        Math.max(...positions.map((p) => p[k])),
      ],
      [surface.bounds.min[k], surface.bounds.max[k]],
    );
  assert.equal(
    surface.sourceQuality.zeroNormalVertices,
    hraAccessor(display.json, display.bin, p.attributes.NORMAL).filter((p) =>
      p.every((x) => x === 0),
    ).length,
  );
}
assert.equal(triangles, 205463);
// Optional proof against the full original; never downloads or executes external code.
const originalPath = process.argv
  .find((a) => a.startsWith('--original='))
  ?.slice(11);
if (originalPath) {
  const full = await readFile(originalPath);
  assert.equal(hraDigest(full), hraSource.sha256);
  assert.equal(full.length, hraSource.bytes);
  const g = readGlb(full),
    parents = new Map();
  g.json.nodes.forEach((n, i) =>
    (n.children ?? []).forEach((c) => {
      assert(!parents.has(c));
      parents.set(c, i);
    }),
  );
  for (const index of hraCandidateNodeIndices) {
    let current = index;
    const seen = new Set();
    while (current !== undefined) {
      assert(!seen.has(current));
      seen.add(current);
      const n = g.json.nodes[current];
      assert(!n.matrix && !n.translation && !n.rotation && !n.scale);
      current = parents.get(current);
    }
  }
  const subset = hraSubset(g.json, g.bin, hraCandidateNodeIndices);
  assert.deepEqual(hraWriteGlb(subset.json, subset.bin), sourceBytes);
}
// Exercise the actual atlas launcher and close callbacks, including the exam guard.
const explorer = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', explorer, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let launcher, close;
function visit(node) {
  if (ts.isJsxAttribute(node) && node.name.text === 'onClick' && node.initializer?.getText(ast).includes('setHraPelvisOpen')) launcher = node.initializer.expression;
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'closeHraPelvis') close = node.initializer.arguments[0];
  ts.forEachChild(node, visit);
}
visit(ast); assert(launcher && close);
for (const exam of [true, false]) {
  const changes = [];
  runInNewContext('(' + launcher.getText(ast) + ')()', { exam, setHraPelvisOpen: value => changes.push(value) });
  assert.deepEqual(changes, exam ? [] : [true]);
}
const events = [];
runInNewContext('(' + close.getText(ast) + ')()', { setHraPelvisOpen: value => events.push(value), requestAnimationFrame: fn => fn(), hraPelvisLauncher: { current: { focus: () => events.push('focus') } } });
assert.deepEqual(events, [false, 'focus']);
const proof = await validateGlbDelivery(bytes, await compressGlb(bytes));
assert.equal(proof.meshes, 41);
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/hra-pelvis.ts'; export * from './lib/hra-pelvis-teaching.ts'; export * from './lib/independent-specimen.ts'; export * from './lib/specimen-identification.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const {
  hraPelvisDefinition: def,
  hraPelvicPractice: adapter,
  hraPelvicTeaching,
  initialSpecimen,
  reduceSpecimen,
  specimenAction,
  reduceIdentification,
} = api;
const all = def.surfaces.map((s) => s.id),
  before = JSON.stringify(def);
assert.equal(def.studies.length, 8);
assert.equal(adapter.eligibleIds(def, all).length, 31);
assert.equal(def.surfaces.filter((s) => !hraPelvicTeaching(def, s)).length, 10);
for (const study of def.studies) {
  const state = reduceSpecimen(
      def,
      initialSpecimen(def),
      specimenAction(def, study.id),
    ),
    snapshot = JSON.stringify(state);
  const visible = def.surfaces
    .filter((s) => !state.hidden.includes(s.id))
    .map((s) => s.id);
  assert.deepEqual([...visible].sort(), [...study.ids].sort());
  let round = adapter.createRound(def, visible, () => 0.37);
  assert(round);
  assert.equal(
    round.questions.length,
    Math.min(10, adapter.eligibleIds(def, visible).length),
  );
  while (round.questions[round.index]) {
    const q = round.questions[round.index];
    assert(visible.includes(q.targetId));
    assert(
      q.options.every((id) => adapter.eligibleIds(def, visible).includes(id)),
    );
    assert.deepEqual(
      reduceIdentification(round, { type: 'answer', id: 'foreign' }),
      round,
    );
    round = reduceIdentification(
      reduceIdentification(round, { type: 'reveal' }),
      { type: 'next' },
    );
  }
  assert(round.results.every((r) => r.revealed && !r.firstTry));
  assert.equal(JSON.stringify(state), snapshot);
}
for (const field of [
  'sourceName',
  'name',
  'id',
  'nodeName',
  'laterality',
  'tissue',
])
  assert.equal(
    hraPelvicTeaching(def, { ...def.surfaces[0], [field]: 'foreign' }),
    null,
  );
const mutations = [
  (d) => (d.key = 'foreign'),
  (d) => (d.source.license = 'MIT'),
  (d) => (d.source.version = 'other'),
  (d) => (d.catalog.coordinateSystem.sourceToSceneColumnMajor[0] *= -1),
  (d) => (d.catalog.bundles[0].sha256 = '0'.repeat(64)),
  (d) => (d.catalog.bundles[0].url = '/different.glb'),
  (d) => (d.surfaces[0].sources[0].sha256 = '0'.repeat(64)),
  (d) => (d.surfaces[0].bounds.min[0] += 0.1),
  (d) => d.studies[0].ids.pop(),
  (d) => d.surfaces.push(d.surfaces[0]),
];
for (const change of mutations) {
  const bad = JSON.parse(before);
  change(bad);
  assert.equal(hraPelvicTeaching(bad, bad.surfaces[0]), null);
  assert.deepEqual(adapter.eligibleIds(bad, all), []);
  assert.equal(adapter.createRound(bad, all), null);
}
assert.equal(adapter.createRound(def, [...all, all[0]]), null);
assert.equal(
  adapter.createRound(def, all, () => 0.5, ['foreign']),
  null,
);
assert.equal(JSON.stringify(def), before);
// Actual shared React workbench, with only the WebGL boundary stubbed. No device claim.
const component = await componentBuild({
  stdin: {
    contents:
      "export { KneeSpecimenView } from './app/um-knee-study.tsx'; export { SpecimenIdentification } from './app/um-limb-learning.tsx'; export { hraPelvisSupplement } from './app/hra-pelvis-study.tsx'; export { createHraPelvisSupplement } from './app/hra-pelvis-supplement.tsx'; export { modelDeliveryUrl } from './lib/model-delivery.ts';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  plugins: [
    {
      name: 'scene-boundary',
      setup(tool) {
        tool.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          loader: 'js',
          contents:
            'export function BodyScene(props){globalThis.sceneProps=props;return null;} export function retryBodyAssets(){}',
        }));
      },
    },
  ],
});
const require = createRequire(import.meta.url),
  React = require('react'),
  mod = { exports: {} },
  context = {
    module: mod,
    exports: mod.exports,
    require,
    URL,
    URLSearchParams,
    console,
    process: { env: { NODE_ENV: 'test' } },
  };
runInNewContext(component.outputFiles[0].text, context);
const render = (name, props) =>
  require('react-dom/server').renderToStaticMarkup(
    React.createElement(mod.exports[name], props),
  );
const html = render('KneeSpecimenView', {
  specimen: def,
  supplement: mod.exports.hraPelvisSupplement,
});
for (const text of [
  'Organ regions',
  'Support surfaces',
  'Arteries',
  'Veins',
  'Bone context',
  'Practise identification',
  'CC BY 4.0',
  '/models/hra-pelvis/NOTICE.md',
])
  assert(html.includes(text), text);
assert.equal(context.sceneProps.catalog.sourceVersion, def.key);
assert.equal(context.sceneProps.assetBase, undefined);
const assetBase = '/atlas-runtime/female-pelvis';
const websiteSupplement = mod.exports.createHraPelvisSupplement({ assetBase });
assert.equal(websiteSupplement.studyLink, undefined);
assert.equal(typeof mod.exports.hraPelvisSupplement.studyLink, 'function');
const websiteHtml = render('KneeSpecimenView', { specimen:def, supplement:websiteSupplement, assetBase });
assert(websiteHtml.includes(assetBase + '/models/hra-pelvis/pelvis.glb'));
assert(websiteHtml.includes(assetBase + '/models/hra-pelvis/NOTICE.md'));
assert.equal(context.sceneProps.assetBase, assetBase);
assert.equal(context.sceneProps.catalog, def.catalog);
assert.equal(JSON.stringify(def), before);
const deliveryUrl = mod.exports.modelDeliveryUrl;
assert.equal(deliveryUrl('/models/hra-pelvis/pelvis.glb'), '/models/hra-pelvis/pelvis.glb');
assert.equal(deliveryUrl('/models/hra-pelvis/pelvis.glb', assetBase), assetBase + '/models/hra-pelvis/pelvis.glb');
for (const badBase of ['https://example.com','//example.com','/atlas-runtime/../private','/atlas-runtime/female-pelvis/','/atlas-runtime/%66emale-pelvis']) {
  assert.throws(() => deliveryUrl('/models/hra-pelvis/pelvis.glb',badBase));
}
for (const badUrl of ['https://example.com/a.glb','//example.com/a.glb','/models/../secret.glb','/models/%2e%2e/a.glb','/models/a.glb?token=x','/models/a.glb#fragment','/models/\\a.glb']) {
  assert.throws(() => deliveryUrl(badUrl,assetBase));
}
const practice = render('SpecimenIdentification', {
  assetBase,
  definition: def,
  initial: adapter.createRound(def, all, () => 0.5),
  visibleIds: all,
  initialView: 'anterior',
  onClose() {},
  adapter,
});
assert(practice.includes('Answering is paused until the model is ready.'));
assert.equal(context.sceneProps.labels, false);
assert.equal(context.sceneProps.showOrigins, false);
assert.equal(context.sceneProps.explode, 0);
assert.equal(context.sceneProps.catalog.sourceVersion, def.key);
assert.equal(context.sceneProps.assetBase, assetBase);
const bodySceneSource = await readFile('app/body-scene.tsx','utf8');
assert(bodySceneSource.includes('useGLTF(modelDeliveryUrl(bundle.url, props.assetBase), false, true)'));
assert(bodySceneSource.includes('useGLTF.clear(modelDeliveryUrl(url, assetBase))'));
console.log(
  JSON.stringify({
    sourceSurfaces: 47,
    delivered: 41,
    withheld: 6,
    triangles,
    studies: 8,
    draftTeaching: 31,
    pendingTeaching: 10,
    originalVerified: !!originalPath,
    decodedMeshes: proof.meshes,
    clinicalOrDeviceApproval: false,
  }),
);
