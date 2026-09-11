import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/longus-colli'; export * from './content/longus-colli-studies'; export * from './lib/limb-vascular-studies'; export * from './lib/study-library'; export * from './lib/body-display-catalog'; export * from './lib/anatomy-link-registry'; export * from './lib/anatomy-coordinates'; export * from './lib/study-links'; export * from './app/dissection-data'; export {bodyLesson} from './app/body-content';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const rawBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
assert.equal(
  createHash('sha256').update(rawBytes).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const raw = JSON.parse(rawBytes),
  before = JSON.stringify(raw),
  pins = JSON.parse(
    await readFile('public/models/bodyparts3d/longus-colli/catalog.json'),
  );
const catalog = api.bodyDisplayCatalog(raw);
assert(
  !catalog.structures.some((s) => ['FMA44885', 'FMA44886'].includes(s.fmaId)),
);
assert.equal(raw.structures.length, 1022);
assert.equal(catalog.structures.length, 1042);
assert.equal(JSON.stringify(raw), before);
assert.equal(api.bodyDisplayCatalog(catalog), catalog);
assert.deepEqual(
  catalog.structures.filter((s) => s.bundle === 'longus-colli'),
  pins.structures,
);
const detached = api.addLongusColli(raw);
detached.structures.at(-1).anchor[0] = 999;
assert.deepEqual(api.addLongusColli(raw).structures.slice(-3), pins.structures);
const unrelated = { ...raw, structures: [], bundles: [] };
assert.equal(api.addLongusColli(unrelated), unrelated);
let rejections = 0;
const reject = (mutate) => {
  const bad = structuredClone(catalog);
  mutate(bad);
  assert.throws(() => api.addLongusColli(bad));
  assert.equal(
    api.longusColliStudyReady(bad, 'head-neck', 'longus-colli-left'),
    false,
  );
  rejections++;
};
for (const p of [...pins.contextRecords, ...pins.structures]) {
  reject((c) => {
    c.structures = c.structures.filter((s) => s.id !== p.id);
  });
  reject((c) => {
    c.structures.push(structuredClone(p));
  });
  for (const mutate of [
    (s) => (s.anchor[0] += 0.01),
    (s) => (s.laterality = 'changed'),
    (s) => (s.sources[0].sha256 = 'changed'),
    (s) => (s.bundle = 'wrong'),
    (s) => (s.nodeName = 'wrong'),
  ])
    reject((c) => mutate(c.structures.find((s) => s.id === p.id)));
  reject((c) =>
    c.structures.push({ ...structuredClone(p), id: p.id + '-collision' }),
  );
}
for (const b of [...pins.contextBundles, ...pins.bundles]) {
  reject((c) => {
    c.bundles = c.bundles.filter((p) => p.id !== b.id);
  });
  reject((c) => c.bundles.push(structuredClone(b)));
  reject((c) => {
    c.bundles.find((p) => p.id === b.id).sha256 = 'changed';
  });
}
for (const field of ['sourceVersion', 'license', 'coordinateSystem'])
  reject((c) => {
    c[field] = 'changed';
  });
const bytes = await readFile(
  'public/models/bodyparts3d/longus-colli/longus-colli.glb',
);
assert.equal(
  createHash('sha256').update(bytes).digest('hex'),
  pins.bundles[0].sha256,
);
const scene = (
  await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  )
).scene;
const meshes = [];
scene.traverse((o) => {
  if (o.isMesh) meshes.push(o);
});
assert.equal(meshes.length, 3);
let links = 0,
  triangles = 0;
const entries = api.bodyLinkEntries(catalog),
  transform = api.referenceTransform(catalog.coordinateSystem);
for (const s of pins.structures) {
  const mesh = meshes.find((m) => m.name === s.nodeName);
  assert(mesh);
  assert.equal(mesh.userData.structureId, s.id);
  const positions = mesh.geometry.attributes.position.array;
  triangles += mesh.geometry.index.count / 3;
  assert(
    Array.from({ length: positions.length / 3 }, (_, i) =>
      Array.from(positions.slice(i * 3, i * 3 + 3)),
    ).some((p) => JSON.stringify(p) === JSON.stringify(s.anchor)),
  );
  for (const region of ['whole-body', ...s.regions])
    for (const side of ['both', 'right', 'left']) {
      const href = api.makeStudyLink(catalog, region, s.id, side);
      if (
        side !== 'both' &&
        ['left', 'right'].includes(s.laterality) &&
        side !== s.laterality
      ) {
        assert.equal(href, null);
        continue;
      }
      assert(href);
      links++;
      const url = new URL(href, 'https://atlas.invalid');
      const parsed = api.parseStudyLink(Object.fromEntries(url.searchParams));
      assert.equal(
        api.resolveStudyLink(catalog, region, parsed).status,
        'ready',
      );
      const scope = api.bodyStudyScope(catalog, region, side),
        profile = api.dissectionProfiles[region];
      const removed = api.dissectionReducer(api.initialDissection, {
        type: 'remove',
        id: s.id,
      });
      assert(
        !api
          .resolveDissection(scope, profile, removed)
          .visible.some((v) => v.id === s.id),
      );
      assert(
        api
          .resolveDissection(
            scope,
            profile,
            api.dissectionReducer(removed, { type: 'undo' }),
          )
          .visible.some((v) => v.id === s.id),
      );
    }
  const entry = entries.find((e) => e.id === s.id);
  assert(entry);
  assert(!('frameOfReferenceUid' in entry.reference));
  const point = transform.toScene(entry.reference.point);
  point.forEach((v, i) => assert(Math.abs(v - s.center[i]) < 1e-8));
  assert.equal(
    api.resolveLinkedStructure(s.id, entries, [s.id]).status,
    'selected',
  );
  for (const tab of ['anatomy', 'function'])
    assert.equal(api.bodyLesson(s, tab).readiness, 'draft');
  for (const tab of ['ct', 'mri', 'xray', 'ultrasound'])
    assert.equal(api.bodyLesson(s, tab).readiness, 'pending');
  assert.equal(
    api.longusColliLesson({ ...s, anchor: [0, 0, 0] }, 'anatomy'),
    undefined,
  );
}
assert.equal(triangles, 7162);

assert.equal(links, 18);
assert.deepEqual(
  pins.structures.map((s) => s.fmaId),
  ['FMA46284', 'FMA46286', 'FMA46288'],
);
assert(
  pins.structures.every(
    (s) => s.laterality === 'left' && s.system === 'muscles',
  ),
);
assert(
  !catalog.structures.some((s) =>
    ['FMA46279', 'FMA46280', 'FMA46281', 'FMA46282'].includes(s.fmaId),
  ),
);
assert.equal(
  api.longusColliStudyReady(null, 'head-neck', 'longus-colli-left'),
  false,
);
assert.equal(
  api.longusColliStudyReady(catalog, 'thigh', 'longus-colli-left'),
  false,
);
assert.equal(
  api.longusColliStudyReady(catalog, 'head-neck', 'longus-colli-left', 'right'),
  false,
);
const study = api.longusColliStudySets[0],
  expectedSizes = { 'head-neck': 11, spine: 14, 'whole-body': 15 };
let studyLinks = 0,
  scopes = 0,
  handlers = 0;
for (const region of study.regions) {
  const profile = api.dissectionProfiles[region];
  assert(!profile.stages.some((s) => s.id === study.id));
  assert.equal(profile.focuses.filter((s) => s.id === study.id).length, 1);
  for (const side of ['both', 'left']) {
    scopes++;
    const scope = api.bodyStudyScope(catalog, region, side);
    const state = api.dissectionReducer(api.initialDissection, {
      type: 'focus',
      id: study.id,
    });
    const visible = api.resolveDissection(scope, profile, state).visible;
    const expected = new Set([
      ...study.targetFmaIds,
      ...study.context.flatMap((r) => r.fmaIds),
    ]);
    assert.equal(visible.length, expectedSizes[region]);
    assert.deepEqual(
      visible.map((s) => s.id).sort(),
      scope
        .filter((s) => expected.has(s.fmaId))
        .map((s) => s.id)
        .sort(),
    );
    const card = api
      .studyLibrary(scope, profile)
      .find((c) => c.key === 'focus:' + study.id);
    assert(card && card.recipes[0].available);
    assert.deepEqual(api.studyLibraryAction(scope, profile, card.key, false), {
      kind: 'focus',
      id: study.id,
    });
    assert.equal(api.studyLibraryAction(scope, profile, card.key, true), null);
    for (const s of visible) {
      const href = api.makeStudyLink(catalog, region, s.id, side, study.id);
      assert(href);
      const parsed = api.parseStudyLink(
        Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams),
      );
      assert.equal(
        api.resolveStudyLink(catalog, region, parsed).status,
        'ready',
      );
      studyLinks++;
      const bad = structuredClone(catalog);
      bad.structures.find(
        (r) => r.id === pins.structures[0].id,
      ).sources[0].sha256 = 'changed';
      assert.equal(
        api.resolveStudyLink(bad, region, parsed).status,
        'rejected',
      );
      const removed = api.dissectionReducer(state, {
        type: 'remove',
        id: s.id,
      });
      assert(
        !api
          .resolveDissection(scope, profile, removed)
          .visible.some((r) => r.id === s.id),
      );
      assert.deepEqual(
        api.resolveDissection(
          scope,
          profile,
          api.dissectionReducer(removed, { type: 'undo' }),
        ).visible,
        visible,
      );
    }
  }
  const right = api.bodyStudyScope(catalog, region, 'right');
  assert.equal(
    api.studyLibraryAction(right, profile, 'focus:' + study.id, false),
    null,
  );
  assert.equal(
    api.makeStudyLink(
      catalog,
      region,
      pins.structures[0].id,
      'right',
      study.id,
    ),
    null,
  );
}
const componentSource = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  componentSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let handler;
function visit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'changeFocus')
    handler = ts.transpile(n.getText(ast), { target: ts.ScriptTarget.ES2022 });
  ts.forEachChild(n, visit);
}
visit(ast);
assert(handler);
for (const region of study.regions)
  for (const mode of ['valid', 'exam', 'right', 'source-changed']) {
    const calls = [],
      cameraRestore = { current: { pending: true } },
      actualCatalog = structuredClone(catalog);
    if (mode === 'source-changed')
      actualCatalog.structures.find(
        (s) => s.id === pins.structures[0].id,
      ).anchor[0] += 1;
    const env = {
      catalog: actualCatalog,
      side: mode === 'right' ? 'right' : 'left',
      initialRegion: region,
      profile: api.dissectionProfiles[region],
      exam: mode === 'exam',
      layout: 'tray',
      initialInspection: { plane: 'off' },
      allBodySystems: {},
      cameraRestore,
      limbVascularStudyReady: api.limbVascularStudyReady,
      longusColliStudyReady: api.longusColliStudyReady,
      dispatch: (v) => calls.push(['dispatch', v]),
    };
    for (const n of [
      'setInspection',
      'setPlate',
      'setLayout',
      'setSystems',
      'setSelectedId',
      'setFocus',
      'setIsolated',
      'setExplode',
      'setZoom',
      'setView',
      'setReset',
    ])
      env[n] = (v) => calls.push([n, typeof v === 'function' ? v(9) : v]);
    const accepted = runInNewContext(
      handler + ";changeFocus('longus-colli-left');",
      env,
    );
    handlers++;
    assert.equal(accepted, mode === 'valid');
    if (mode === 'valid') {
      assert.equal(cameraRestore.current, null);
      assert.equal(calls.find((c) => c[0] === 'dispatch')[1].id, study.id);
      assert.equal(calls.find((c) => c[0] === 'setExplode')[1], 0);
      assert.equal(calls.find((c) => c[0] === 'setView')[1], 'anterior');
    } else {
      assert.deepEqual(calls, []);
      assert.deepEqual(cameraRestore.current, { pending: true });
    }
  }

console.log(
  JSON.stringify({
    scopes,
    studyLinks,
    actualParentHandlers: handlers,
    sourceSelections: 3,
    displaySelections: 1042,
    triangles,
    links,
    rejections,
    archivalCatalogUnchanged: true,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
