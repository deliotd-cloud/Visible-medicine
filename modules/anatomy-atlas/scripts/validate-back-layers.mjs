import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const out = 'public/models/bodyparts3d-v3/back-layers',
  retained = 'content/sources/bodyparts3d-v3-back-layers';
const raw = JSON.parse(await readFile(`${out}/catalog.json`)),
  audit = JSON.parse(await readFile(`${retained}/source-audit.json`));
let checks = 0,
  corners = 0,
  maxErrorMm = 0;
const same = (a, b) => {
  assert.deepEqual(a, b);
  checks++;
};
const ok = (value) => {
  assert(value);
  checks++;
};
same(raw.structures.length, 48);
same(raw.structures.filter((s) => s.tissue === 'muscle').length, 14);
same(raw.source.license, 'CC BY-SA 2.1 JP');
same(raw.source.registration, 'none');
same(
  raw.source.archive,
  'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip',
);
same(hash(await readFile(`${retained}/parts_list_e.txt`)), audit.namesSha256);
for (const [file, e] of Object.entries(audit.evidence))
  same(hash(await readFile(`${retained}/${file}`)), e.sha256);
const names = new Map(
  (await readFile(`${retained}/parts_list_e.txt`, 'utf8'))
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split('\t')),
);
const bytes = await readFile(`${out}/back-layers.glb`),
  bundle = raw.bundles[0];
same(bytes.length, bundle.bytes);
same(hash(bytes), bundle.sha256);
ok(bytes.length < 25 * 1024 * 1024);
const scene = (
  await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    '',
  )
).scene;
const meshes = [];
scene.traverse((o) => {
  if (o.isMesh) meshes.push(o);
});
same(meshes.length, 48);
for (const surface of raw.structures) {
  const mesh = meshes.find((m) => m.name === surface.nodeName);
  ok(mesh);
  same(mesh.userData.fmaId, surface.fmaId);
  same(mesh.userData.license, raw.source.license);
  same(mesh.userData.registration, 'none');
  same(surface.sourceName, names.get(surface.fmaId));
  const original = await readFile(`${retained}/${surface.fmaId}.obj`);
  same(hash(original), surface.sources[0].sha256);
  same(surface.sources[0].file, surface.fmaId);
  ok(original.toString().includes('CC Attribution-Share Alike 2.1 Japan'));
  const sourceAudit = audit.structures.find((s) => s.id === surface.id);
  same(sourceAudit.sourceBytes, original.length);
  same(
    surface.sourceQuality.components,
    sourceAudit.topology.components.length,
  );
  same(
    surface.sourceQuality.nonManifoldEdges,
    sourceAudit.topology.nonManifoldEdges,
  );
  const vertices = [],
    normals = [],
    faces = [];
  for (const line of original.toString().split(/\r?\n/)) {
    const [kind, ...values] = line.trim().split(/\s+/);
    if (kind === 'v') vertices.push(values.map(Number));
    if (kind === 'vn') normals.push(values.map(Number));
    if (kind === 'f')
      faces.push(
        values.map((v) => {
          const [i, , n] = v.split('/').map(Number);
          return [i - 1, n - 1];
        }),
      );
  }
  same(faces.length, surface.triangles);
  same(surface.omittedSourceFaces, []);
  const p = mesh.geometry.getAttribute('position'),
    n = mesh.geometry.getAttribute('normal'),
    index = mesh.geometry.index;
  same(index.count, faces.length * 3);
  mesh.geometry.computeBoundingBox();
  same(mesh.geometry.boundingBox.min.toArray(), surface.bounds.min);
  same(mesh.geometry.boundingBox.max.toArray(), surface.bounds.max);
  let cursor = 0,
    anchor = false;
  for (const face of faces)
    for (const [v, normal] of face) {
      const i = index.getX(cursor++),
        displayed = [p.getX(i), p.getY(i), p.getZ(i)],
        restored = [
          displayed[0] * 100,
          -displayed[2] * 100 - 100,
          displayed[1] * 100 + 1050,
        ];
      const error = Math.max(
        ...restored.map((x, k) => Math.abs(x - vertices[v][k])),
      );
      maxErrorMm = Math.max(maxErrorMm, error);
      assert(error < 0.0001);
      const sourceNormal = normals[normal],
        len = Math.hypot(...sourceNormal),
        expected = [
          sourceNormal[0] / len,
          sourceNormal[2] / len,
          -sourceNormal[1] / len,
        ];
      assert(
        Math.max(
          ...[n.getX(i), n.getY(i), n.getZ(i)].map((x, k) =>
            Math.abs(x - expected[k]),
          ),
        ) < 0.00001,
      );
      if (displayed.every((x, k) => x === surface.anchor[k])) anchor = true;
      corners++;
    }
  ok(anchor);
}
same(
  hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/back-layers.ts'; export * from './lib/back-layers-teaching.ts'; export * from './lib/independent-specimen.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const helpers = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const {
  backLayersDefinition: def,
  backLayersTeachingFor,
  initialSpecimen,
  reduceSpecimen,
  specimenAction,
  activeSpecimenStudy,
  filterSpecimen,
} = helpers;
const backLayersNote = (s) => backLayersTeachingFor(def, s);
same(
  def.catalog.structures.filter((s) => s.sourceTree === 'bodyparts3d-v3-atomic')
    .length,
  48,
);
for (const study of def.studies) {
  const initial = initialSpecimen(def),
    state = reduceSpecimen(def, initial, specimenAction(def, study.id));
  same(
    def.surfaces
      .filter((s) => !state.hidden.includes(s.id))
      .map((s) => s.id)
      .sort(),
    [...study.ids].sort(),
  );
  same(activeSpecimenStudy(def, state.hidden).id, study.id);
  same(state.selectedId, study.selectedId);
  const removed = reduceSpecimen(def, state, {
    type: 'visibility',
    id: study.selectedId,
    visible: false,
  });
  same(removed.selectedId, null);
  const undo = reduceSpecimen(def, removed, { type: 'undo' });
  same(undo.hidden, state.hidden);
  same(undo.selectedId, state.selectedId);
  same(reduceSpecimen(def, undo, { type: 'redo' }).hidden, removed.hidden);
  same(
    reduceSpecimen(def, state, { type: 'select', id: 'body-FMA13336' }),
    state,
  );
}
for (const side of ['right', 'left'])
  same(
    def.studies
      .find((s) => s.id === side)
      .ids.filter(
        (id) => def.surfaces.find((s) => s.id === id).tissue === 'muscle',
      ).length,
    7,
  );
same(filterSpecimen(def, 'latissimus').length, 2);
same(specimenAction(def, '__proto__'), null);
for (const s of def.surfaces.filter((s) => s.tissue === 'muscle')) {
  ok(backLayersNote(s));
  for (const field of [
    'id',
    'fmaId',
    'sourceName',
    'laterality',
    'bundle',
    'nodeName',
    'tissue',
  ])
    same(backLayersNote({ ...s, [field]: 'foreign' }), null);
  same(
    backLayersNote({
      ...s,
      sources: [{ ...s.sources[0], sha256: '0'.repeat(64) }],
    }),
    null,
  );
}
let empty = initialSpecimen(def);
for (const tissue of ['muscle', 'skeleton'])
  empty = reduceSpecimen(def, empty, { type: 'group', tissue, visible: false });
same(empty.hidden.length, 48);
same(empty.selectedId, null);
same(reduceSpecimen(def, empty, specimenAction(def, 'all')).hidden, []);
// Real React/UI markup with only the WebGL boundary replaced; not browser/GPU acceptance.
const component = await componentBuild({
  stdin: {
    contents:
      "export { KneeSpecimenView } from './app/um-knee-study.tsx'; export { backLayersSupplement, BackLayersTeaching } from './app/back-layers-study.tsx';",
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
      setup(api) {
        api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
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
const html = require('react-dom/server').renderToStaticMarkup(
  React.createElement(mod.exports.KneeSpecimenView, {
    specimen: def,
    supplement: mod.exports.backLayersSupplement,
  }),
);
for (const text of [
  'Search back layers specimen structures',
  'CC BY-SA 2.1 Japan',
  'Download official original source archive',
  'tissue separation',
  'right latissimus dorsi',
  'Practise identification',
])
  ok(html.toLowerCase().includes(text.toLowerCase()));
ok(html.includes(raw.source.archive));
for (const text of [
  'Muscles by nerve',
  'Ontology mapping: pending',
  'independent right-limb specimen',
])
  same(html.includes(text), false);
same(context.sceneProps.structures.length, 48);
same(context.sceneProps.catalog.sourceVersion, def.key);
same(context.sceneProps.explode, 0);
same(context.sceneProps.plate, false);
same(context.sceneProps.cameraBounds, null);
same(context.sceneProps.hiddenIds.length, 0);
same(context.sceneProps.view, 'posterior');
const { backLayersSourceMatches, backLayersPractice } = helpers;
const mutations = [
  (d) => (d.key = 'foreign'),
  (d) => (d.source.version = '4.0'),
  (d) => (d.source.license = 'CC0'),
  (d) => (d.catalog.coordinateSystem.sourceToSceneColumnMajor[0] = 1),
  (d) => (d.catalog.coordinateSystem.unitsPerMillimetre = 1),
  (d) => (d.catalog.bundles[0].sha256 = '0'.repeat(64)),
  (d) => (d.catalog.bundles[0].url = '/foreign.glb'),
  (d) => (d.surfaces[0].bounds.min[0] -= 1),
  (d) => (d.surfaces[0].sources[0].sha256 = '0'.repeat(64)),
  (d) => d.studies[0].ids.reverse(),
  (d) => (d.studies[0].selectedId = 'foreign'),
  (d) => d.surfaces.reverse(),
];
for (const mutate of mutations) {
  const changed = structuredClone(def);
  mutate(changed);
  same(backLayersSourceMatches(changed), false);
  same(backLayersTeachingFor(changed, def.surfaces[0]), null);
  same(
    backLayersPractice.eligibleIds(
      changed,
      changed.surfaces.map((s) => s.id),
    ),
    [],
  );
}
same(
  def.surfaces.filter(
    (s) => s.tissue === 'skeleton' && backLayersTeachingFor(def, s),
  ).length,
  0,
);
const expectedPools = [14, 8, 2, 4, 2, 7, 7, 14];
for (const [i, study] of def.studies.entries()) {
  const ids = backLayersPractice.eligibleIds(def, study.ids);
  same(ids.length, expectedPools[i]);
  const round = backLayersPractice.createRound(def, study.ids, () => 0.5);
  same(round.questions.length, Math.min(10, ids.length));
  for (const q of round.questions) {
    ok(ids.includes(q.targetId));
    ok(q.options.includes(q.targetId));
    ok(q.options.every((id) => ids.includes(id)));
    same(new Set(q.options).size, q.options.length);
  }
  same(
    backLayersPractice.createRound(def, study.ids, () => 0.5, ['foreign']),
    null,
  );
  same(
    backLayersPractice.createRound(def, study.ids, () => 0.5, [ids[0], ids[0]]),
    null,
  );
}
same(backLayersPractice.eligibleIds(def, ['foreign']), []);
same(
  backLayersPractice.eligibleIds(def, [def.surfaces[0].id, def.surfaces[0].id]),
  [],
);
let notesRenders = 0;
for (const surface of def.surfaces.filter((s) => s.tissue === 'muscle')) {
  const lesson = backLayersTeachingFor(def, surface);
  lesson.references.push('changed');
  if (lesson.attachments) lesson.attachments.motor = 'changed';
  ok(!backLayersTeachingFor(def, surface).references.includes('changed'));
  ok(backLayersTeachingFor(def, surface).attachments?.motor !== 'changed');
  for (const initialTopic of ['anatomy', 'function', 'mri']) {
    const notes = require('react-dom/server').renderToStaticMarkup(
      React.createElement(mod.exports.BackLayersTeaching, {
        definition: def,
        surface,
        initialTopic,
      }),
    );
    ok(notes.includes('Teaching draft'));
    if (initialTopic === 'mri') {
      ok(notes.includes('Modality teaching only'));
      ok(!notes.includes('MRI teaching is pending'));
      ok(notes.includes('No patient images'));
    }
    notesRenders++;
  }
}
same(
  context.sceneProps.structures.every(
    (s) => s.region === 'independent-back-layers',
  ),
  true,
);
const root = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
for (const fma of ['FMA13358', 'FMA13359', 'FMA22878', 'FMA22879'])
  same(
    root.structures.some((s) => s.fmaId === fma),
    false,
  );
const body = await readFile('app/body-explorer.tsx', 'utf8');
ok(
  body.includes(
    "backLayersOpen && ['spine', 'whole-body'].includes(initialRegion) && !exam",
  ),
);
ok(body.includes('if (!exam) setBackLayersOpen(true)'));
ok(body.includes('backLayersLauncher.current?.focus()'));
const standalone = await readFile('app/specimens/back-layers/page.tsx', 'utf8');
ok(standalone.includes('../../back-layers-study'));
same(standalone.includes('body-explorer'), false);
console.log(
  JSON.stringify({
    checks,
    definitionMutations: mutations.length,
    notesRenders,
    practicePools: expectedPools,
    sourceFaceCornersChecked: corners,
    maxErrorMm,
    surfaces: 48,
    muscles: 14,
    studies: def.studies.length,
    glbBytes: bytes.length,
    sourceCoordinatesAndFaceOrder: 'preserved',
    clinicalOrBrowserAcceptance: false,
  }),
);
