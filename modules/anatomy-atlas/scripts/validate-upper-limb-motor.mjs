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
      "export * from './lib/upper-limb-motor.ts'; export * from './app/dissection-data.ts'; export * from './content/upper-limb-motor.ts'; export { bodyDisplayCatalog } from './lib/body-display-catalog.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const {
  upperLimbMotorGroups: groups,
  upperLimbMotorPlan: plan,
  upperLimbMotorRegions: regions,
  upperLimbMotorBindings: bindings,
  upperLimbMotorNerves: nerves,
  dissectionReducer: reduce,
  resolveDissection: resolve,
  initialDissection: initial,
  dissectionProfiles: profiles,
  bodyDisplayCatalog,
} = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = JSON.parse(raw),
  shownCatalog = bodyDisplayCatalog(catalog);
const clone = structuredClone;
let checks = 0,
  plans = 0,
  rejected = 0,
  renders = 0;
const same = (a, b, note) => {
  checks++;
  assert.deepEqual(a, b, note);
};
const check = (v, note) => {
  checks++;
  assert(v, note);
};
same(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(bindings.length, 112);
same(Object.keys(nerves).length, 17);
same(new Set(bindings.map((b) => b.fmaId)).size, 102);
const snapshot = JSON.stringify(shownCatalog);
const all = regions.flatMap((r) => groups(shownCatalog, r));
same(
  all.reduce((n, g) => n + g.targets.length, 0),
  112,
);
same(
  new Set(all.flatMap((g) => g.targets.map((t) => t.structure.id))).size,
  102,
);
const fmas = (region, key) =>
  groups(shownCatalog, region, 'right')
    .find((g) => g.key === key)
    .targets.map((t) => t.structure.fmaId)
    .sort();
same(fmas('forearm', 'anteriorInterosseous'), [
  'FMA38454',
  'FMA38479',
  'FMA38482',
]);
same(fmas('hand', 'medianThenar'), ['FMA37386', 'FMA37390']);
same(fmas('hand', 'medianDigital'), ['FMA42398']);
same(fmas('forearm', 'radialDeep'), ['FMA38498', 'FMA38513']);
check(!fmas('forearm', 'posteriorInterosseous').includes('FMA38495'));
for (const fma of ['FMA13414', 'FMA32540', 'FMA37668', 'FMA38479', 'FMA42398'])
  same(
    bindings.filter((b) => b.fmaId === fma).length,
    2,
    'Mixed supply stays explicit',
  );
for (const fma of ['FMA13414', 'FMA32540', 'FMA38479', 'FMA42398'])
  check(bindings.filter((b) => b.fmaId === fma).every((b) => b.part));
check(
  bindings
    .find((b) => b.fmaId === 'FMA37668' && b.nerve === 'radialProximal')
    .part.includes('Variable'),
);

const sideFilter = (s, side) =>
  side === 'both' ||
  s.laterality === side ||
  ['midline', 'unpaired', 'unspecified'].includes(s.laterality);
for (const region of regions)
  for (const side of ['both', 'right', 'left']) {
    const regional = shownCatalog.structures.filter((s) =>
      s.regions.includes(region),
    );
    const scope = regional.filter((s) => sideFilter(s, side));
    same(
      groups(catalog, region, side),
      groups(shownCatalog, region, side),
      'Existing display corrections do not change these source regions',
    );
    for (const group of groups(shownCatalog, region, side)) {
      const recipe = plan(shownCatalog, region, side, group.key);
      plans++;
      const prior = reduce(
        reduce(initial, {
          type: 'stage',
          id: profiles[region].stages.at(-1).id,
        }),
        { type: 'remove', id: scope[0].id },
      );
      const next = reduce(prior, recipe.action);
      same(next.history.length, prior.history.length + 1);
      same(next.focusId, null);
      same(next.stageId, 'free');
      same(recipe.selectedId, group.targets[0].structure.id);
      const targetIds = new Set(group.targets.map((t) => t.structure.id));
      same(
        resolve(scope, profiles[region], next).visible.map((s) => s.id),
        scope
          .filter((s) => s.system === 'skeleton' || targetIds.has(s.id))
          .map((s) => s.id),
      );
      for (const switched of ['left', 'right']) {
        const expected = new Set(
          groups(shownCatalog, region, switched)
            .find((g) => g.key === group.key)
            .targets.map((t) => t.structure.id),
        );
        const switchedScope = regional.filter((s) => sideFilter(s, switched));
        same(
          resolve(switchedScope, profiles[region], next).visible.map(
            (s) => s.id,
          ),
          switchedScope
            .filter((s) => s.system === 'skeleton' || expected.has(s.id))
            .map((s) => s.id),
        );
      }
      const undone = reduce(next, { type: 'undo' });
      same(
        resolve(scope, profiles[region], undone),
        resolve(scope, profiles[region], prior),
      );
      same(reduce(undone, { type: 'redo' }), next);
      same(
        reduce(next, recipe.action),
        next,
        'Repeat does not consume history',
      );
      same(
        plan(shownCatalog, region, side, group.key, true),
        null,
        'Exam rejects mutation',
      );
    }
  }
for (const region of ['whole-body', 'head-neck', 'leg', 'foreign', '__proto__'])
  same(groups(catalog, region), []);
same(groups(catalog, 'hand', 'invalid'), []);
same(
  plan(catalog, 'hand', 'both', 'median'),
  null,
  'No inferred parent/descendant expansion',
);
same(plan(catalog, 'hand', 'both', '__proto__'), null);
const handIds = new Set(
  catalog.structures
    .filter(
      (s) =>
        s.regions.includes('hand') &&
        ['muscles', 'skeleton'].includes(s.system),
    )
    .map((s) => s.id),
);
for (const id of handIds) {
  const bad = clone(catalog);
  bad.structures.find((s) => s.id === id).sources[0].sha256 = '0'.repeat(64);
  same(groups(bad, 'hand'), []);
  rejected++;
}
for (const mutate of [
  (c) => {
    c.sourceVersion = '3.0';
  },
  (c) => {
    c.license = 'unknown';
  },
  (c) => {
    c.coordinateSystem.unitsPerMillimetre *= 2;
  },
  (c) => {
    c.coordinateSystem.sourceToSceneColumnMajor[0] *= -1;
  },
  (c) => {
    c.structures.find((s) => s.fmaId === 'FMA42398').name = 'Another group';
  },
  (c) => {
    c.structures.find((s) => s.fmaId === 'FMA42398').laterality = 'left';
  },
  (c) => {
    c.structures.find((s) => s.fmaId === 'FMA42398').anchor[0] += 1;
  },
  (c) => {
    c.structures.find((s) => s.fmaId === 'FMA42398').regions = [];
  },
  (c) => {
    c.structures.push({
      ...c.structures.find((s) => s.fmaId === 'FMA42398'),
      id: 'foreign',
    });
  },
  (c) => {
    c.structures.push({
      ...c.structures.find((s) => s.fmaId === 'FMA42398'),
      regions: [],
    });
  },
  (c) => {
    const id = c.structures.find((s) => s.fmaId === 'FMA42398').bundle;
    c.bundles.find((b) => b.id === id).sha256 = 'changed';
  },
]) {
  const bad = clone(catalog);
  mutate(bad);
  same(groups(bad, 'hand'), []);
  same(plan(bad, 'hand', 'right', 'medianDigital'), null);
  rejected++;
}
const rows = (
  await readFile('../work/bodyparts3d/isa_element_parts.txt', 'utf8')
)
  .trim()
  .split(/\r?\n/)
  .map((l) => l.split('\t'));
for (const id of new Set(bindings.map((b) => b.fmaId))) {
  const s = catalog.structures.find((s) => s.fmaId === id);
  same(
    rows.filter((r) => r[0] === id).map((r) => [r[1], r[2]]),
    s.sources.map((p) => [s.sourceName, p.file]),
  );
}
same(JSON.stringify(shownCatalog), snapshot);

const component = await componentBuild({
  entryPoints: ['app/upper-limb-motor.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
const require = createRequire(import.meta.url),
  React = require('react'),
  mod = { exports: {} };
runInNewContext(component.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  require,
  URL,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
const render = (C, props) =>
  require('react-dom/server').renderToStaticMarkup(
    React.createElement(C, props),
  );
for (const region of regions)
  for (const side of ['both', 'right', 'left']) {
    const props = {
      catalog: shownCatalog,
      region,
      side,
      selectedId: null,
      disabled: false,
      onSelect() {},
      onExplore() {},
    };
    const html = render(mod.exports.UpperLimbMotorExplorer, props);
    renders++;
    check(html.includes('Muscles by nerve'));
    check(html.includes('nerves are not modelled'));
    check(!/<details[^>]*\bopen=/.test(html));
    same(
      render(mod.exports.UpperLimbMotorExplorer, { ...props, disabled: true }),
      '',
    );
    for (const group of groups(shownCatalog, region, side)) {
      const html = render(mod.exports.UpperLimbMotorDetails, {
        ...props,
        group,
      });
      renders++;
      check(html.includes('Show muscles &amp; bones'));
      check(html.includes('Draft relationships'));
      for (const target of group.targets)
        check(html.includes(target.structure.name));
      if (group.targets.some((t) => t.supply.part))
        check(html.includes('Whole source shown'));
    }
  }
// Execute the actual parent event handler with real planner/reducer boundaries.
const parent = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
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
check(handler);
const js = ts.transpile(handler + ';exploreMotorGroup("medianDigital");', {
  target: ts.ScriptTarget.ES2022,
});
for (const exam of [false, true]) {
  const calls = [],
    record = (name) => (value) => calls.push([name, value]);
  const env = {
    catalog: shownCatalog,
    initialRegion: 'hand',
    side: 'right',
    exam,
    upperLimbMotorPlan: plan,
    initialInspection: { enabled: false },
    cameraRestore: { current: 'old' },
    dispatch: record('dispatch'),
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
    env[name] = record(name);
  runInNewContext(js, env);
  if (exam) {
    same(calls, []);
    continue;
  }
  same(calls.filter((c) => c[0] === 'dispatch').length, 1);
  same(calls.find((c) => c[0] === 'setExplode')[1], 0);
  same(
    calls.find((c) => c[0] === 'setSelectedId')[1],
    plan(shownCatalog, 'hand', 'right', 'medianDigital').selectedId,
  );
  same(env.cameraRestore.current, null);
}
console.log(
  JSON.stringify({
    checks,
    groups: 17,
    muscleSelections: 102,
    relationships: 112,
    sourceAndSidePlans: plans,
    rejectedBindings: rejected,
    officialSourceRecords: 102,
    actualReactRenders: renders,
    unchangedGeometry: true,
    clinicalApproval: false,
    browserQA: false,
  }),
);
