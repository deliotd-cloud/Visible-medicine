import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/portal-veins'; export * from './lib/portal-drainage'; export * from './lib/venous-drainage'; export * from './lib/systemic-venous'; export * from './lib/body-display-catalog'; export * from './lib/anatomy-link-registry'; export * from './lib/anatomy-coordinates'; export * from './lib/study-links'; export * from './app/dissection-data'; export {bodyLesson} from './app/body-content';",
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
    await readFile('public/models/bodyparts3d/portal-veins/catalog.json'),
  );
const catalog = api.bodyDisplayCatalog(raw);
assert(
  !catalog.structures.some((s) => ['FMA44885', 'FMA44886'].includes(s.fmaId)),
);
assert.equal(raw.structures.length, 1022);
assert.equal(catalog.structures.length, 1058);
assert.equal(JSON.stringify(raw), before);
assert.equal(api.bodyDisplayCatalog(catalog), catalog);
assert.deepEqual(
  catalog.structures.filter((s) => s.bundle === 'portal-veins'),
  pins.structures,
);
const detached = api.addPortalVeins(raw);
detached.structures.at(-1).anchor[0] = 999;
assert.deepEqual(api.addPortalVeins(raw).structures.slice(-5), pins.structures);
const unrelated = { ...raw, structures: [], bundles: [] };
assert.equal(api.addPortalVeins(unrelated), unrelated);
let rejections = 0;
const reject = (mutate) => {
  const bad = structuredClone(catalog);
  mutate(bad);
  assert.throws(() => api.addPortalVeins(bad));
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
  'public/models/bodyparts3d/portal-veins/portal-veins.glb',
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
assert.equal(meshes.length, 5);
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
    api.portalVeinLesson({ ...s, anchor: [0, 0, 0] }, 'anatomy'),
    undefined,
  );
}
assert.equal(triangles, 3892);
console.log(
  JSON.stringify({
    sourceSelections: 5,
    displaySelections: 1058,
    triangles,
    links,
    rejections,
    archivalCatalogUnchanged: true,
    clinicalApproval: false,
    browserTesting: false,
  }),
);

const expectedPairs = [
  ['FMA14331', 'FMA50735'],
  ['FMA14332', 'FMA50735'],
  ['FMA15391', 'FMA14331'],
  ['FMA15405', 'FMA14332'],
  ['FMA15406', 'FMA14332'],
  ['FMA15407', 'FMA14332'],
  ['FMA15390', 'FMA14331'],
  ['FMA15397', 'FMA14332'],
  ['FMA15399', 'FMA50735'],
  ['FMA15400', 'FMA50735'],
];
const fmas = new Set(expectedPairs.flat()),
  targets = catalog.structures.filter((s) => fmas.has(s.fmaId));
assert.equal(targets.length, 11);
const neighbours = api.portalVenousNeighbours,
  plan = api.venousDrainagePlan;
const sort = (rows) => rows.map((r) => JSON.stringify(r)).sort();
const actualPairs = targets.flatMap((s) =>
  neighbours(catalog, 'whole-body', 'both', s.id)
    .rows.filter((r) => r.direction === 'outlet')
    .map((r) => [s.fmaId, r.structure.fmaId]),
);
assert.deepEqual(sort(actualPairs), sort(expectedPairs));
for (const s of catalog.structures) {
  const old = api.systemicVenousNeighbours(catalog, 'whole-body', 'both', s.id);
  if (old)
    assert.deepEqual(
      api.venousDrainageNeighbours(catalog, 'whole-body', 'both', s.id),
      old,
    );
}
let plans = 0;
for (const s of targets)
  for (const region of ['abdomen', 'whole-body'])
    for (const side of ['both', 'right', 'left']) {
      const info = neighbours(catalog, region, side, s.id);
      if (
        side !== 'both' &&
        ['right', 'left'].includes(s.laterality) &&
        side !== s.laterality
      ) {
        assert.equal(info, null);
        continue;
      }
      assert(info);
      assert.deepEqual(
        api.venousDrainageNeighbours(catalog, region, side, s.id),
        info,
      );
      const p = plan(catalog, region, side, s.id);
      assert(p);
      plans++;
      const before = api.dissectionReducer(api.initialDissection, {
        type: 'remove',
        id: s.id,
      });
      const after = api.dissectionReducer(before, p.action);
      const keepFmas = new Set([
        s.fmaId,
        ...expectedPairs.filter((e) => e.includes(s.fmaId)).flat(),
      ]);
      for (const newSide of ['both', 'right', 'left']) {
        const scope = api.bodyStudyScope(catalog, region, newSide);
        const visible = api.resolveDissection(
          scope,
          api.dissectionProfiles[region],
          after,
        ).visible;
        assert.deepEqual(
          visible.map((v) => v.id),
          scope
            .filter(
              (v) =>
                keepFmas.has(v.fmaId) ||
                (v.system === 'skeleton' && v.regions.includes('abdomen')),
            )
            .map((v) => v.id),
        );
      }
      assert.deepEqual(
        api.dissectionReducer(api.dissectionReducer(after, { type: 'undo' }), {
          type: 'redo',
        }),
        after,
      );
      assert.equal(neighbours(catalog, region, side, s.id, true), null);
      assert.equal(plan(catalog, region, side, s.id, true), null);
      for (const r of info.rows) {
        assert.equal(r.availableHere, true);
        assert(
          !['FMA10951', 'FMA14338', 'FMA14339'].includes(r.structure.fmaId),
        );
        const href = api.makeStudyLink(catalog, region, r.structure.id, side);
        assert(href);
        const q = new URL(href, 'https://atlas.invalid').searchParams;
        assert.equal(
          api.resolveStudyLink(
            catalog,
            region,
            api.parseStudyLink(Object.fromEntries(q)),
          ).status,
          'ready',
        );
        links++;
      }
    }
for (const field of ['sourceVersion', 'license', 'coordinateSystem']) {
  const bad = structuredClone(catalog);
  bad[field] = 'changed';
  assert.equal(neighbours(bad, 'whole-body', 'both', targets[0].id), null);
  assert.equal(plan(bad, 'whole-body', 'both', targets[0].id), null);
}
for (const record of [...pins.structures, ...pins.contextRecords]) {
  for (const change of [
    (c) => {
      c.structures = c.structures.filter((s) => s.id !== record.id);
    },
    (c) => {
      c.structures.push({
        ...structuredClone(record),
        id: record.id + '-alias',
      });
    },
    (c) => {
      c.structures.find((s) => s.id === record.id).anchor[0] += 0.001;
    },
  ]) {
    const bad = structuredClone(catalog);
    change(bad);
    assert.equal(neighbours(bad, 'whole-body', 'both', targets[0].id), null);
    assert.equal(plan(bad, 'whole-body', 'both', targets[0].id), null);
    rejections++;
  }
}
for (const args of [
  ['foot', 'both', targets[0].id],
  ['abdomen', 'bad', targets[0].id],
  ['abdomen', 'both', 'unknown'],
]) {
  assert.equal(neighbours(catalog, ...args), null);
  assert.equal(plan(catalog, ...args), null);
}
assert.equal(neighbours(raw, 'whole-body', 'both', targets[0].id), null);
const require = createRequire(import.meta.url),
  React = require('react'),
  Link = (await import('vinext/shims/link')).default;
const component = await componentBuild({
    entryPoints: ['app/venous-drainage.tsx'],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
  }),
  mod = { exports: {} };
runInNewContext(component.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  require: (id) =>
    id === 'next/link' ? { __esModule: true, default: Link } : require(id),
  URL,
  URLSearchParams,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
const render = (props) =>
  require('react-dom/server').renderToStaticMarkup(
    React.createElement(mod.exports.VenousDrainage, props),
  );
let renders = 0;
for (const selected of targets) {
  const props = {
    catalog,
    region: selected.region,
    side: 'both',
    selectedId: selected.id,
    disabled: false,
    onSelect() {},
    onShow() {},
  };
  const html = render(props);
  renders++;
  assert(html.includes('Portal venous drainage'));
  assert(!/<details[^>]*\bopen=/.test(html));
  assert(!html.includes('Arterial'));
  assert(html.includes('Show available veins &amp; bones'));
  assert(html.includes('Specialist review pending'));
  for (const row of neighbours(catalog, selected.region, 'both', selected.id)
    .rows)
    assert(html.includes(row.structure.name));
  assert.equal(render({ ...props, disabled: true }), '');
}
const parent = await readFile('app/body-explorer.tsx', 'utf8'),
  ast = ts.createSourceFile(
    'body.tsx',
    parent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
let handler, wiring;
const visit = (node) => {
  if (
    ts.isFunctionDeclaration(node) &&
    node.name?.text === 'showVenousDrainage'
  )
    handler = node.getText(ast);
  if (
    ts.isJsxSelfClosingElement(node) &&
    node.tagName.getText(ast) === 'VenousDrainage'
  )
    wiring = node.getText(ast);
  ts.forEachChild(node, visit);
};
visit(ast);
assert(handler && wiring);
for (const attr of [
  'onSelect={select}',
  'onShow={showVenousDrainage}',
  'disabled={exam}',
])
  assert(wiring.includes(attr));
let handlers = 0;
for (const selected of targets)
  for (const exam of [false, true]) {
    const calls = [],
      env = {
        catalog,
        initialRegion: selected.region,
        side: 'both',
        selectedId: selected.id,
        exam,
        venousDrainagePlan: plan,
        initialInspection: { plane: 'off' },
        cameraRestore: { current: 'old' },
        dispatch: (value) => calls.push(['dispatch', value]),
      };
    for (const name of [
      'setSystems',
      'setInspection',
      'setExplode',
      'setLayout',
      'setPlate',
      'setGhostRemoved',
      'setFocus',
      'setIsolated',
      'setZoom',
      'setSelectionNotice',
      'setReset',
    ])
      env[name] = (value) => calls.push([name, value]);
    runInNewContext(
      ts.transpile(handler + ';showVenousDrainage();', {
        target: ts.ScriptTarget.ES2022,
      }),
      env,
    );
    handlers++;
    if (exam) {
      assert.deepEqual(calls, []);
      continue;
    }
    assert.equal(calls.filter((c) => c[0] === 'dispatch').length, 1);
    assert.equal(
      JSON.stringify(calls.find((c) => c[0] === 'dispatch')[1]),
      JSON.stringify(
        plan(catalog, selected.region, 'both', selected.id).action,
      ),
    );
    assert.equal(calls.find((c) => c[0] === 'setLayout')[1], 'spatial');
    assert.equal(calls.find((c) => c[0] === 'setExplode')[1], 0);
    assert.equal(env.cameraRestore.current, null);
    assert.equal(
      calls.find((c) => c[0] === 'setSelectionNotice')[1].id,
      selected.id,
    );
    const enabled = calls.find((c) => c[0] === 'setSystems')[1]({
      skeleton: false,
      vessels: false,
      muscles: false,
    });
    assert(enabled.skeleton && enabled.vessels && !enabled.muscles);
  }
console.log(
  JSON.stringify({
    veins: 11,
    groups: 11,
    relationships: 10,
    reciprocalRows: 20,
    plans,
    links,
    rejections,
    sourceRows: 11,
    actualComponentRenders: renders,
    actualParentHandlers: handlers,
    clinicalValidation: false,
    browserTesting: false,
  }),
);
