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
      "export * from './lib/systemic-venous'; export * from './content/systemic-venous'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
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
  pins = JSON.parse(
    await readFile('content/systemic-venous-pins.json', 'utf8'),
  );
const {
  systemicVenousNeighbours: neighbours,
  systemicVenousPlan: plan,
  systemicVenousGroups: groups,
  dissectionReducer: reduce,
  resolveDissection: resolve,
  initialDissection: initial,
  dissectionProfiles: profiles,
} = api;
const targets = catalog.structures.filter((s) =>
  Object.values(groups).some((g) => g.fmaIds.includes(s.fmaId)),
);
assert.equal(targets.length, 47);
assert.equal(Object.keys(groups).length, 26);
assert.equal(pins.entries.length, 239);
const extra = JSON.parse(
  await readFile(
    'public/models/bodyparts3d/brachial-veins/catalog.json',
    'utf8',
  ),
);
pins.entries.push(...extra.structures);
pins.bundles.push(...extra.bundles);
const deepLeg = JSON.parse(
  await readFile('public/models/bodyparts3d/deep-leg-veins/catalog.json'),
);
pins.entries.push(...deepLeg.structures);
pins.bundles.push(...deepLeg.bundles);
const hepatic = JSON.parse(
  await readFile('public/models/bodyparts3d/hepatic-veins/catalog.json'),
);
pins.entries.push(...hepatic.structures);
pins.bundles.push(...hepatic.bundles);
const byFma = (fma) => targets.find((s) => s.fmaId === fma);
const infoFor = (fma) =>
  neighbours(catalog, 'whole-body', 'both', byFma(fma).id);
// Independent, source-ID edge oracle. The reciprocal check alone would miss a reversed map.
const pairs = [
  ['FMA14340', 'FMA10951'],
  ['FMA15791', 'FMA14338'],
  ['FMA15794', 'FMA14339'],
  ['FMA44336', 'FMA44328'],
  ['FMA44337', 'FMA44329'],
  ['FMA44338', 'FMA44328'],
  ['FMA44339', 'FMA44329'],
  ['FMA51042', 'FMA21188'],
  ['FMA51043', 'FMA21189'],
  ['FMA4944', 'FMA4838'],
  ['FMA4838', 'FMA4720'],
  ...[
    ['FMA4754', 'FMA4762', 'FMA4751', 'FMA4761'],
    ['FMA4755', 'FMA4763', 'FMA4751', 'FMA4761'],
    ['FMA13330', 'FMA13331', 'FMA4755', 'FMA4763'],
    ['FMA13325', 'FMA13326', 'FMA13330', 'FMA13331'],
    ['FMA22909', 'FMA22910', 'FMA13330', 'FMA13331'],
    ['FMA22935', 'FMA22936', 'FMA13330', 'FMA13331'],
    ['FMA62506', 'FMA62507', 'FMA13325', 'FMA13326'],
    ['FMA62506', 'FMA62507', 'FMA22909', 'FMA22910'],
    ['FMA18885', 'FMA18886', 'FMA21387', 'FMA21388'],
    ['FMA18887', 'FMA18888', 'FMA21387', 'FMA21388'],
    ['FMA21188', 'FMA21189', 'FMA18885', 'FMA18886'],
    ['FMA21379', 'FMA21380', 'FMA21188', 'FMA21189'],
    ['FMA44328', 'FMA44329', 'FMA21188', 'FMA21189'],
    ['FMA44334', 'FMA44335', 'FMA44328', 'FMA44329'],
    ['FMA44881', 'FMA44882', 'FMA21379', 'FMA21380'],
    ['FMA44881', 'FMA44882', 'FMA44334', 'FMA44335'],
  ].flatMap(([r, l, ro, lo]) => [
    [r, ro],
    [l, lo],
  ]),
  ['FMA4751', 'FMA4720'],
  ['FMA4761', 'FMA4720'],
  ['FMA21387', 'FMA10951'],
  ['FMA21388', 'FMA10951'],
  ['FMA14338', 'FMA10951'],
  ['FMA14339', 'FMA10951'],
];
assert.equal(pairs.length, 49);
const sort = (a) =>
  a.map((v) => JSON.stringify(v)).sort((a, b) => a.localeCompare(b));
const rows = targets.flatMap((s) =>
  infoFor(s.fmaId).rows.map((r) => ({ from: s.fmaId, ...r })),
);
assert.equal(rows.length, 98);
assert.deepEqual(
  sort(
    rows
      .filter((r) => r.direction === 'outlet')
      .map((r) => [r.from, r.structure.fmaId]),
  ),
  sort(pairs),
);
for (const row of rows) {
  const inverse = infoFor(row.structure.fmaId).rows.find(
    (r) => r.structure.fmaId === row.from,
  );
  assert(inverse);
  assert.equal(inverse.kind, row.kind);
  assert.notEqual(inverse.direction, row.direction);
  const a = byFma(row.from).laterality,
    b = row.structure.laterality;
  assert(!(a === 'right' && b === 'left') && !(a === 'left' && b === 'right'));
}
for (const fma of ['FMA44334', 'FMA44335'])
  assert.equal(
    infoFor(fma).rows.find((r) => r.direction === 'outlet').kind,
    'variable',
  );
for (const fma of ['FMA21188', 'FMA21189', 'FMA21379', 'FMA21380'])
  assert.equal(
    infoFor(fma).rows.find((r) => r.direction === 'outlet').kind,
    'via-unmodelled',
  );
for (const fma of ['FMA4720', 'FMA10951'])
  assert(!infoFor(fma).rows.some((r) => r.direction === 'outlet'));
for (const fma of ['FMA50735', 'FMA49914', 'FMA4707']) {
  const source = catalog.structures.find((s) => s.fmaId === fma);
  assert.equal(neighbours(catalog, 'whole-body', 'both', source.id), null);
}
const inRegion = (s, r) => r === 'whole-body' || s.regions.includes(r);
const inSide = (s, side) =>
  side === 'both' ||
  s.laterality === side ||
  ['unspecified', 'unpaired', 'midline'].includes(s.laterality);
let plans = 0,
  links = 0;
for (const selected of targets)
  for (const region of ['whole-body', ...selected.regions])
    for (const side of ['both', 'left', 'right']) {
      const info = neighbours(catalog, region, side, selected.id),
        recipe = plan(catalog, region, side, selected.id);
      if (!inSide(selected, side)) {
        assert.equal(info, null);
        assert.equal(recipe, null);
        continue;
      }
      assert(info && recipe);
      plans++;
      assert.deepEqual(
        info,
        neighbours(api.bodyDisplayCatalog(catalog), region, side, selected.id),
      );
      assert.equal(neighbours(raw, region, side, selected.id), null);
      // An independently derived neighbourhood is retained on both sides for later side changes.
      const selectedGroup = Object.values(groups).find((g) =>
        g.fmaIds.includes(selected.fmaId),
      );
      const groupFmas = new Set(selectedGroup.fmaIds);
      const adjacent = new Set([...groupFmas]);
      for (const [from, to] of pairs) {
        if (groupFmas.has(from)) adjacent.add(to);
        if (groupFmas.has(to)) adjacent.add(from);
      }
      const keepBones = new Set(
        pins.entries
          .filter(
            (s) =>
              s.system === 'skeleton' &&
              s.regions.includes(selectedGroup.context),
          )
          .map((s) => s.id),
      );
      const before = reduce(initial, { type: 'remove', id: selected.id }),
        after = reduce(before, recipe.action);
      assert.equal(after.history.length, before.history.length + 1);
      for (const newSide of ['both', 'left', 'right']) {
        const scope = catalog.structures.filter(
          (s) => inRegion(s, region) && inSide(s, newSide),
        );
        assert.deepEqual(
          resolve(scope, profiles[region], after).visible.map((s) => s.id),
          scope
            .filter((s) => adjacent.has(s.fmaId) || keepBones.has(s.id))
            .map((s) => s.id),
        );
      }
      assert.deepEqual(
        reduce(reduce(after, { type: 'undo' }), { type: 'redo' }),
        after,
      );
      assert.deepEqual(reduce(after, recipe.action), after);
      assert.equal(neighbours(catalog, region, side, selected.id, true), null);
      assert.equal(plan(catalog, region, side, selected.id, true), null);
      for (const row of info.rows) {
        assert(inSide(row.structure, side));
        assert.equal(row.availableHere, inRegion(row.structure, region));
        if (!row.availableHere) {
          const href = api.makeStudyLink(
            catalog,
            'whole-body',
            row.structure.id,
            side,
          );
          assert(href);
          const url = new URL(href, 'https://example.invalid');
          const result = api.resolveStudyLink(
            catalog,
            'whole-body',
            api.parseStudyLink(Object.fromEntries(url.searchParams)),
          );
          assert.equal(result.status, 'ready');
          links++;
        }
      }
    }
let rejections = 0;
const reject = (bad) => {
  assert.equal(neighbours(bad, 'whole-body', 'both', targets[0].id), null);
  assert.equal(plan(bad, 'whole-body', 'both', targets[0].id), null);
  rejections++;
};
for (const source of pins.entries) {
  const bad = structuredClone(catalog);
  bad.structures.find((s) => s.id === source.id).anchor[0] += 0.01;
  reject(bad);
}
for (const source of targets) {
  const bad = structuredClone(catalog);
  bad.structures = bad.structures.filter((s) => s.id !== source.id);
  reject(bad);
  const duplicate = structuredClone(catalog);
  duplicate.structures.push(structuredClone(source));
  reject(duplicate);
}
for (const bundle of pins.bundles) {
  const bad = structuredClone(catalog);
  bad.bundles.find((b) => b.id === bundle.id).sha256 = 'changed';
  reject(bad);
  const duplicate = structuredClone(catalog);
  duplicate.bundles.push(structuredClone(bundle));
  reject(duplicate);
}
for (const key of ['sourceVersion', 'license', 'coordinateSystem']) {
  const bad = structuredClone(catalog);
  bad[key] = 'changed';
  reject(bad);
}
for (const args of [
  ['__proto__', 'both', targets[0].id],
  ['thorax', 'invalid', targets[0].id],
  ['whole-body', 'both', '__proto__'],
  ['foot', 'both', byFma('FMA4720').id],
]) {
  assert.equal(neighbours(catalog, ...args), null);
  assert.equal(plan(catalog, ...args), null);
}
for (const tree of [...new Set(targets.map((s) => s.sourceTree))]) {
  const official = (
    await readFile(`../work/bodyparts3d/${tree}_element_parts.txt`, 'utf8')
  )
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split('\t'));
  for (const selected of targets.filter((s) => s.sourceTree === tree)) {
    const matches = official.filter((r) => r[0] === selected.fmaId);
    assert(matches.length);
    assert.deepEqual(
      [...new Set(matches.map((r) => r[1]))],
      [selected.sourceName],
    );
    assert.deepEqual(
      sort(matches.flatMap((r) => r[2].split(','))),
      sort(selected.sources.map((s) => s.file)),
    );
  }
}
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
  assert(html.includes('Venous drainage'));
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
    veins: 47,
    groups: 26,
    relationships: 49,
    reciprocalRows: 98,
    plans,
    links,
    rejections,
    sourceRows: 47,
    actualComponentRenders: renders,
    actualParentHandlers: handlers,
    clinicalValidation: false,
    browserTesting: false,
  }),
);
