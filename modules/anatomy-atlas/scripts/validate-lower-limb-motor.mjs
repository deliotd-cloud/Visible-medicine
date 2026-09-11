import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/lower-limb-motor'; export * from './lib/limb-motor'; export * from './lib/upper-limb-motor'; export * from './content/lower-limb-motor'; export * from './app/dissection-data'; export { bodyDisplayCatalog } from './lib/body-display-catalog';",
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
const {
  lowerLimbMotorGroups: groups,
  lowerLimbMotorPlan: plan,
  lowerLimbMotorRegions: regions,
  lowerLimbMotorBindings: bindings,
  lowerLimbMotorNerves: nerves,
  lowerLimbMotorExcluded: excluded,
  dissectionReducer: reduce,
  resolveDissection: resolve,
  initialDissection: initial,
  dissectionProfiles: profiles,
} = api;
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  displayed = api.bodyDisplayCatalog(catalog),
  snapshot = JSON.stringify(displayed);
assert.equal(bindings.length, 120);
assert.equal(Object.keys(nerves).length, 15);
const identities = new Set(bindings.map((b) => b.fmaId));
assert.equal(identities.size, 118);
const all = regions.flatMap((r) => groups(displayed, r));
assert.equal(
  new Set(all.flatMap((g) => g.targets.map((t) => t.structure.fmaId))).size,
  118,
);
assert(
  all.every((g) =>
    g.references.every((url) => new URL(url).protocol === 'https:'),
  ),
);
assert(
  all.every((g) =>
    g.targets.every((t) => !excluded.includes(t.structure.fmaId)),
  ),
);
const fmas = (region, key) =>
  groups(displayed, region, 'right')
    .find((g) => g.key === key)
    .targets.map((t) => t.structure.fmaId)
    .sort();
assert.deepEqual(fmas('thigh', 'sciaticFibular'), ['FMA45891']);
assert(fmas('thigh', 'sciaticTibial').includes('FMA45888'));
assert(!fmas('thigh', 'sciaticTibial').includes('FMA45891'));
assert.deepEqual(fmas('thigh', 'lumbarRami'), ['FMA22342']);
assert(fmas('thigh', 'femoral').includes('FMA22322'));
assert(!fmas('thigh', 'femoral').includes('FMA22342'));
assert.deepEqual(fmas('leg', 'superficialFibular'), ['FMA22552', 'FMA22554']);
assert(fmas('leg', 'deepFibular').includes('FMA22550'));
assert.deepEqual(fmas('foot', 'deepFibular'), ['FMA51144']);
assert(fmas('foot', 'medialPlantar').includes('FMA37717'));
assert(!fmas('foot', 'lateralPlantar').includes('FMA37717'));
for (const fma of ['FMA37719', 'FMA37485', 'FMA37483'])
  assert(fmas('foot', 'lateralPlantar').includes(fma));
for (const fma of ['FMA22459', 'FMA22460']) {
  const b = bindings.filter((b) => b.fmaId === fma);
  assert.equal(b.length, 2);
  assert(b.every((b) => b.part && b.caveat));
}
for (const fma of [
  'FMA22450',
  'FMA45973',
  'FMA22334',
  'FMA22336',
  'FMA43886',
  'FMA86034',
])
  assert(bindings.find((b) => b.fmaId === fma).caveat);
const sideFilter = (s, side) =>
  side === 'both' ||
  s.laterality === side ||
  ['midline', 'unpaired', 'unspecified'].includes(s.laterality);
let plans = 0,
  rejected = 0,
  renders = 0;
for (const region of regions)
  for (const side of ['both', 'right', 'left']) {
    const regional = displayed.structures.filter((s) =>
        s.regions.includes(region),
      ),
      scope = regional.filter((s) => sideFilter(s, side));
    assert.deepEqual(
      groups(catalog, region, side),
      groups(displayed, region, side),
    );
    assert.deepEqual(
      api.limbMotorGroups(displayed, region, side),
      groups(displayed, region, side),
    );
    for (const group of groups(displayed, region, side)) {
      const recipe = plan(displayed, region, side, group.key);
      plans++;
      assert.deepEqual(
        api.limbMotorPlan(displayed, region, side, group.key),
        recipe,
      );
      const prior = reduce(
          reduce(initial, {
            type: 'stage',
            id: profiles[region].stages.at(-1).id,
          }),
          { type: 'remove', id: scope[0].id },
        ),
        next = reduce(prior, recipe.action);
      assert.equal(next.history.length, prior.history.length + 1);
      assert.equal(next.stageId, 'free');
      assert.equal(next.focusId, null);
      assert.equal(recipe.selectedId, group.targets[0].structure.id);
      for (const viewed of [side, 'left', 'right']) {
        const ids = new Set(
            groups(displayed, region, viewed)
              .find((g) => g.key === group.key)
              .targets.map((t) => t.structure.id),
          ),
          current = regional.filter((s) => sideFilter(s, viewed));
        assert.deepEqual(
          resolve(current, profiles[region], next).visible.map((s) => s.id),
          current
            .filter((s) => s.system === 'skeleton' || ids.has(s.id))
            .map((s) => s.id),
        );
      }
      const undone = reduce(next, { type: 'undo' });
      assert.deepEqual(
        resolve(scope, profiles[region], undone),
        resolve(scope, profiles[region], prior),
      );
      assert.deepEqual(reduce(undone, { type: 'redo' }), next);
      assert.deepEqual(reduce(next, recipe.action), next);
      assert.equal(plan(displayed, region, side, group.key, true), null);
      assert.equal(
        api.limbMotorPlan(displayed, region, side, group.key, true),
        null,
      );
    }
  }
for (const region of [
  'whole-body',
  'spine',
  'head-neck',
  'shoulder-arm',
  '__proto__',
])
  assert.deepEqual(groups(displayed, region), []);
for (const key of ['sciatic', 'commonFibular', '__proto__', 'median'])
  assert.equal(plan(displayed, 'leg', 'both', key), null);
assert.deepEqual(groups(displayed, 'leg', 'invalid'), []);
assert.deepEqual(
  api.limbMotorGroups(displayed, 'hand'),
  api.upperLimbMotorGroups(displayed, 'hand'),
);
const pinned = displayed.structures.filter(
  (s) =>
    s.regions.some((r) => regions.includes(r)) &&
    ['muscles', 'skeleton'].includes(s.system),
);
assert.equal(pinned.length, 186);
for (const entry of pinned) {
  const bad = structuredClone(displayed);
  bad.structures.find((s) => s.id === entry.id).sources[0].sha256 = '0'.repeat(
    64,
  );
  for (const region of entry.regions.filter((r) => regions.includes(r))) {
    assert.deepEqual(groups(bad, region), []);
    rejected++;
  }
}
for (const mutate of [
  (c) => (c.sourceVersion = 'bad'),
  (c) => (c.license = 'unknown'),
  (c) => (c.coordinateSystem.unitsPerMillimetre *= 2),
  (c) => (c.coordinateSystem.sourceToSceneColumnMajor[0] *= -1),
  (c) =>
    (c.structures.find((s) => s.fmaId === 'FMA37717').name =
      'Different identity'),
  (c) => (c.structures.find((s) => s.fmaId === 'FMA37717').laterality = 'left'),
  (c) => (c.structures.find((s) => s.fmaId === 'FMA37717').anchor[0] += 1),
  (c) => (c.structures.find((s) => s.fmaId === 'FMA37717').regions = []),
  (c) =>
    c.structures.push({
      ...c.structures.find((s) => s.fmaId === 'FMA37717'),
      id: 'foreign',
    }),
  (c) =>
    c.structures.push({
      ...c.structures.find((s) => s.fmaId === 'FMA37717'),
      regions: [],
    }),
  (c) =>
    (c.bundles.find(
      (b) => b.id === c.structures.find((s) => s.fmaId === 'FMA37717').bundle,
    ).sha256 = 'bad'),
  (c) =>
    c.bundles.push(
      c.bundles.find(
        (b) => b.id === c.structures.find((s) => s.fmaId === 'FMA37717').bundle,
      ),
    ),
]) {
  const bad = structuredClone(displayed);
  mutate(bad);
  assert.deepEqual(groups(bad, 'foot'), []);
  assert.equal(api.limbMotorPlan(bad, 'foot', 'right', 'medialPlantar'), null);
  rejected++;
}
const official = (
  await readFile('../work/bodyparts3d/isa_element_parts.txt', 'utf8')
)
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split('\t'));
for (const fma of identities) {
  const s = catalog.structures.find((s) => s.fmaId === fma);
  assert.deepEqual(
    official.filter((row) => row[0] === fma).map((row) => [row[1], row[2]]),
    s.sources.map((p) => [s.sourceName, p.file]),
  );
}
assert.equal(JSON.stringify(displayed), snapshot);
const built = await componentBuild({
  entryPoints: ['app/upper-limb-motor.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
const require = createRequire(import.meta.url),
  React = require('react'),
  mod = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  require,
  URL,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
const render = (component, props) =>
  require('react-dom/server').renderToStaticMarkup(
    React.createElement(component, props),
  );
for (const region of regions)
  for (const side of ['both', 'right', 'left']) {
    const props = {
        catalog: displayed,
        region,
        side,
        selectedId: null,
        disabled: false,
        onSelect() {},
        onExplore() {},
      },
      html = render(mod.exports.UpperLimbMotorExplorer, props);
    renders++;
    assert(html.includes('Muscles by nerve'));
    assert(html.includes('Motor nerve group'));
    assert(!/<details[^>]*\bopen=/.test(html));
    assert.equal(
      render(mod.exports.UpperLimbMotorExplorer, { ...props, disabled: true }),
      '',
    );
    if (region === 'pelvis') assert(html.includes('Pelvic-floor'));
    for (const group of groups(displayed, region, side)) {
      const html = render(mod.exports.UpperLimbMotorDetails, {
        ...props,
        group,
      });
      renders++;
      assert(html.includes('Show muscles &amp; bones'));
      assert(html.includes('Draft relationships'));
      for (const t of group.targets) {
        assert(html.includes(t.structure.name));
        if (t.supply.caveat) assert(html.includes(t.supply.caveat));
      }
      if (group.targets.some((t) => t.supply.part))
        assert(html.includes('Whole source shown'));
    }
  }
// Real parent handler with actual source planner; no nerve/imaging event stub is supplied.
const parent = await readFile('app/body-explorer.tsx', 'utf8'),
  ast = ts.createSourceFile(
    'body.tsx',
    parent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
let handler;
function visit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'exploreMotorGroup')
    handler = n.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
assert(handler);
for (const region of regions)
  for (const exam of [false, true]) {
    const key = groups(displayed, region, 'right')[0].key,
      calls = [],
      env = {
        catalog: displayed,
        initialRegion: region,
        side: 'right',
        exam,
        limbMotorPlan: api.limbMotorPlan,
        initialInspection: { enabled: false },
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
      'setSelectedId',
      'setSelectionNotice',
      'setReset',
    ])
      env[name] = (value) => calls.push([name, value]);
    runInNewContext(
      ts.transpile(handler + `;exploreMotorGroup(${JSON.stringify(key)});`, {
        target: ts.ScriptTarget.ES2022,
      }),
      env,
    );
    if (exam) {
      assert.deepEqual(calls, []);
      continue;
    }
    assert.equal(calls.filter((c) => c[0] === 'dispatch').length, 1);
    assert.equal(calls.find((c) => c[0] === 'setExplode')[1], 0);
    assert.equal(
      calls.find((c) => c[0] === 'setSelectedId')[1],
      plan(displayed, region, 'right', key).selectedId,
    );
    assert.equal(env.cameraRestore.current, null);
  }
console.log(
  JSON.stringify({
    groups: 15,
    muscleSelections: identities.size,
    relationships: bindings.length,
    pinnedSourceAndBoneRecords: pinned.length,
    regionAndSidePlans: plans,
    rejectedBindings: rejected,
    actualReactRenders: renders,
    parentHandlerCases: 8,
    sourceGeometryAndLessons: 'unchanged',
    nerveGeometry: false,
    clinicalApproval: false,
    browserQA: false,
  }),
);
