import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/foot-joints'; export * from './content/foot-joints'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
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
const raw = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const catalog = api.bodyDisplayCatalog(raw),
  snapshot = JSON.stringify(catalog);
const pins = JSON.parse(await readFile('content/foot-joint-pins.json', 'utf8'));
const {
  footJointNeighbours: neighbours,
  footJointPlan: plan,
  dissectionReducer: reduce,
  resolveDissection: resolve,
  initialDissection: initial,
  dissectionProfiles: profiles,
} = api;
const targets = pins.entries.map((p) =>
  catalog.structures.find((s) => s.id === p.id),
);
assert.equal(targets.length, 56);
assert.equal(Object.keys(api.footBoneFmas).length, 28);
assert.equal(api.footJoints.length, 39);
assert.equal(api.footJoints.filter((j) => j.kind === 'variable').length, 2);
assert.equal(api.footJoints.filter((j) => j.kind === 'syndesmosis').length, 1);
assert.equal(
  new Set(api.footJoints.map((j) => [j.a, j.b].sort().join(':'))).size,
  39,
);
const bone = (key, index = 0) =>
  targets.find((s) => s.fmaId === api.footBoneFmas[key][index]);
const near = (key) => neighbours(catalog, 'whole-body', 'right', bone(key).id);
const keys = (key) =>
  near(key)
    .rows.map((r) =>
      Object.keys(api.footBoneFmas).find((k) =>
        api.footBoneFmas[k].includes(r.structure.fmaId),
      ),
    )
    .sort();
assert.deepEqual(keys('talus'), ['calcaneus', 'fibula', 'navicular', 'tibia']);
assert.deepEqual(keys('m2'), ['c1', 'c2', 'c3', 'm1', 'm3', 'p2']);
assert.deepEqual(keys('m4'), ['c3', 'cuboid', 'm3', 'm5', 'p4']);
assert.deepEqual(keys('p1'), ['d1', 'm1']);
assert.deepEqual(keys('i5'), ['d5', 'p5']);
assert(!keys('calcaneus').includes('fibula'));
assert(!keys('calcaneus').includes('navicular')); // A ligament is not a normal bony articulation.
assert.equal(
  near('tibia').rows.find((r) => r.structure.id === bone('fibula').id).kind,
  'syndesmosis',
);
assert(
  near('navicular').rows.some(
    (r) => r.kind === 'variable' && r.structure.id === bone('cuboid').id,
  ),
);
let plans = 0,
  rows = 0,
  links = 0,
  rejections = 0,
  renders = 0,
  handlers = 0;
const regional = (s, region) =>
  region === 'whole-body' || s.regions.includes(region);
const sided = (s, side) =>
  side === 'both' ||
  s.laterality === side ||
  ['midline', 'unpaired', 'unspecified'].includes(s.laterality);
for (const s of targets) {
  for (const r of neighbours(catalog, 'whole-body', 'both', s.id).rows) {
    rows++;
    assert.equal(r.structure.laterality, s.laterality);
    const reciprocal = neighbours(
      catalog,
      'whole-body',
      'both',
      r.structure.id,
    ).rows.find((x) => x.structure.id === s.id);
    assert(reciprocal);
    assert.equal(reciprocal.label, r.label);
    assert.equal(reciprocal.kind, r.kind);
    assert(api.footJointReferences[r.reference]);
  }
  for (const region of ['whole-body', ...s.regions])
    for (const side of ['both', 'left', 'right']) {
      if (!sided(s, side)) {
        assert.equal(neighbours(catalog, region, side, s.id), null);
        continue;
      }
      const info = neighbours(catalog, region, side, s.id),
        recipe = plan(catalog, region, side, s.id);
      assert(info && recipe);
      plans++;
      assert.equal(recipe.selectedId, s.id);
      const before = reduce(
        reduce(initial, {
          type: 'stage',
          id: profiles[region].stages.at(-1).id,
        }),
        { type: 'remove', id: s.id },
      );
      const next = reduce(before, recipe.action);
      assert.equal(next.history.length, before.history.length + 1);
      assert.equal(next.stageId, 'free');
      assert.equal(next.focusId, null);
      const keepFmas = new Set(
        [
          s.fmaId,
          ...info.rows
            .filter((r) => r.kind !== 'variable')
            .map((r) => r.structure.fmaId),
        ].flatMap((fma) =>
          Object.values(api.footBoneFmas).find((pair) => pair.includes(fma)),
        ),
      );
      for (const viewSide of ['both', 'left', 'right']) {
        const scope = catalog.structures.filter(
          (x) => regional(x, region) && sided(x, viewSide),
        );
        assert.deepEqual(
          resolve(scope, profiles[region], next).visible.map((x) => x.id),
          scope.filter((x) => keepFmas.has(x.fmaId)).map((x) => x.id),
        );
      }
      const scope = catalog.structures.filter(
        (x) => regional(x, region) && sided(x, side),
      );
      assert.deepEqual(
        resolve(scope, profiles[region], reduce(next, { type: 'undo' })),
        resolve(scope, profiles[region], before),
      );
      assert.deepEqual(
        reduce(reduce(next, { type: 'undo' }), { type: 'redo' }),
        next,
      );
      assert.deepEqual(reduce(next, recipe.action), next);
      for (const r of info.rows)
        if (!r.availableHere) {
          const url = new URL(
            api.makeStudyLink(catalog, 'whole-body', r.structure.id, side),
            'https://visible-medicine.invalid',
          );
          assert.equal(url.pathname, '/');
          const result = api.resolveStudyLink(
            catalog,
            'whole-body',
            api.parseStudyLink(Object.fromEntries(url.searchParams)),
          );
          assert.equal(result.status, 'ready');
          links++;
        }
      assert.equal(neighbours(catalog, region, side, s.id, true), null);
      assert.equal(plan(catalog, region, side, s.id, true), null);
    }
}
assert.equal(rows, 156);
for (const s of catalog.structures.filter(
  (s) => !targets.some((t) => t.id === s.id),
))
  assert.equal(neighbours(catalog, 'whole-body', 'both', s.id), null);
for (const s of targets) {
  const bad = structuredClone(catalog);
  bad.structures.find((x) => x.id === s.id).sources[0].sha256 = '0'.repeat(64);
  assert.equal(plan(bad, 'whole-body', 'both', bone('talus').id), null);
  rejections++;
}
for (const mutate of [
  (c) => {
    c.sourceVersion = 'changed';
  },
  (c) => {
    c.license = 'unknown';
  },
  (c) => {
    c.coordinateSystem.sourceToSceneColumnMajor[0] *= -1;
  },
  (c) => {
    c.coordinateSystem.unitsPerMillimetre *= 2;
  },
  ...['name', 'fmaId', 'laterality', 'sourceTree', 'bundle'].map(
    (key) => (c) => {
      c.structures.find((s) => s.id === bone('talus').id)[key] = 'changed';
    },
  ),
  (c) => {
    c.structures.find((s) => s.id === bone('talus').id).bounds.min[0] += 1;
  },
  (c) => {
    c.structures.find((s) => s.id === bone('talus').id).anchor[0] += 1;
  },
  (c) => {
    c.structures.find((s) => s.id === bone('talus').id).regions.push('leg');
  },
  (c) => {
    c.structures.push(c.structures.find((s) => s.id === bone('talus').id));
  },
  (c) => {
    c.structures = c.structures.filter((s) => s.id !== bone('talus').id);
  },
  (c) => {
    c.bundles.find((b) => b.id === bone('talus').bundle).sha256 = 'bad';
  },
  (c) => {
    c.bundles.push(c.bundles.find((b) => b.id === bone('talus').bundle));
  },
]) {
  const bad = structuredClone(catalog);
  mutate(bad);
  assert.equal(neighbours(bad, 'foot', 'right', bone('talus').id), null);
  rejections++;
}
assert.equal(neighbours(catalog, 'invalid', 'both', bone('talus').id), null);
assert.equal(neighbours(catalog, 'foot', 'invalid', bone('talus').id), null);
assert.equal(neighbours(catalog, 'hand', 'both', bone('talus').id), null);
assert.equal(neighbours(catalog, 'foot', 'right', bone('tibia').id), null);
const require = createRequire(import.meta.url),
  React = require('react'),
  actualLink = await import('vinext/shims/link');
const built = await componentBuild({
  entryPoints: ['app/bone-joints.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
const mod = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  require: (n) =>
    n === 'next/link' ? { __esModule: true, ...actualLink } : require(n),
  URL,
  URLSearchParams,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
const render = (props) =>
  require('react-dom/server').renderToStaticMarkup(
    React.createElement(mod.exports.BoneJoints, props),
  );
for (const s of targets)
  for (const region of ['whole-body', s.region]) {
    const props = {
      catalog,
      region,
      side: 'both',
      selectedId: s.id,
      disabled: false,
      onSelect() {},
      onShow() {},
    };
    const html = render(props);
    renders++;
    assert(html.includes('Ankle &amp; foot joint partners'));
    assert(html.includes(s.name));
    assert(html.includes('Specialist review pending'));
    assert(!/<details[^>]*\bopen=/.test(html));
    for (const r of neighbours(catalog, region, 'both', s.id).rows) {
      assert(html.includes(r.structure.name));
      if (r.kind === 'variable')
        assert(html.includes('Not included by Show partners'));
      if (!r.availableHere) assert(html.includes('open whole body'));
    }
    assert.equal(render({ ...props, disabled: true }), '');
  }
const parent = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  parent,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let handler, wiring;
function visit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'showJointPartners')
    handler = n.getText(ast);
  if (ts.isJsxSelfClosingElement(n) && n.tagName.getText(ast) === 'BoneJoints')
    wiring = n.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
assert(handler);
assert(
  wiring.includes('onSelect={select}') &&
    wiring.includes('onShow={showJointPartners}') &&
    wiring.includes('disabled={exam}'),
);
for (const selected of targets)
  for (const exam of [true, false]) {
    const calls = [],
      env = {
        catalog,
        initialRegion: selected.region,
        side: 'both',
        selectedId: selected.id,
        exam,
        footJointPlan: api.footJointPlan,
        initialInspection: { enabled: false },
        cameraRestore: { current: 'old' },
        dispatch: (v) => calls.push(['dispatch', v]),
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
      env[name] = (v) => calls.push([name, v]);
    runInNewContext(
      ts.transpile(handler + ';showJointPartners();', {
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
      calls.find((c) => c[0] === 'setSelectionNotice')[1].id,
      selected.id,
    );
    assert.equal(calls.find((c) => c[0] === 'setExplode')[1], 0);
    assert.equal(calls.find((c) => c[0] === 'setLayout')[1], 'spatial');
    assert.equal(env.cameraRestore.current, null);
    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          calls.find((c) => c[0] === 'setSystems')[1]({
            skeleton: false,
            vessels: false,
            muscles: true,
          }),
        ),
      ),
      { skeleton: true, vessels: false, muscles: true },
    );
  }
assert.equal(JSON.stringify(catalog), snapshot);
console.log(
  JSON.stringify({
    bones: targets.length,
    concepts: 28,
    typicalPairsPerSide: 37,
    variablePairsPerSide: 2,
    reciprocalRows: rows,
    plans,
    crossRegionLinks: links,
    rejectedCatalogs: rejections,
    componentRenders: renders,
    parentHandlerCases: handlers,
    sourceMutation: false,
    clinicalApproval: false,
  }),
);
