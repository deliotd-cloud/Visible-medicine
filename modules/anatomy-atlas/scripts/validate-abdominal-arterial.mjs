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
      "export * from './lib/abdominal-arterial'; export * from './lib/arterial'; export * from './lib/lower-limb-arterial'; export * from './content/abdominal-arterial'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
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
const catalog = api.bodyDisplayCatalog(raw);
const pins = JSON.parse(
  await readFile('content/abdominal-arterial-pins.json', 'utf8'),
);
const lowerPins = JSON.parse(
  await readFile('content/lower-limb-arterial-pins.json', 'utf8'),
);
const concepts = api.abdominalArterialConcepts,
  relations = api.abdominalArterialRelations;
const targets = catalog.structures.filter((s) =>
  Object.values(concepts).some((c) => c.fmaIds.includes(s.fmaId)),
);
const byFma = (id) => catalog.structures.find((s) => s.fmaId === id);
const aorta = byFma('FMA3789'),
  celiac = byFma('FMA50737');
const {
  arterialNeighbours: neighbours,
  arterialPlan: plan,
  dissectionReducer: reduce,
  resolveDissection: resolve,
  initialDissection: initial,
  dissectionProfiles: profiles,
} = api;
const regionHas = (s, region) =>
  region === 'whole-body' || s.regions.includes(region);
const isSide = (s, side) =>
  side === 'both' ||
  s.laterality === side ||
  ['midline', 'unpaired', 'unspecified'].includes(s.laterality);
assert.equal(targets.length, 28);
assert.equal(Object.keys(concepts).length, 27);
assert.equal(relations.length, 31);
assert.equal(pins.entries.length, 33);
const rows = targets.flatMap((s) =>
  api
    .abdominalArterialNeighbours(catalog, 'whole-body', 'both', s.id)
    .rows.map((r) => ({ from: s.id, ...r })),
);
assert.equal(rows.length, 64);
assert.equal(
  new Set(rows.map((r) => [r.from, r.structure.id].sort().join('|'))).size,
  32,
);
for (const row of rows) {
  const inverse = neighbours(
    catalog,
    'whole-body',
    'both',
    row.structure.id,
  ).rows.find((r) => r.structure.id === row.from);
  assert(inverse);
  assert.equal(inverse.kind, row.kind);
  assert.equal(
    inverse.direction,
    ['communication', 'alternative'].includes(row.direction)
      ? row.direction
      : row.direction === 'upstream'
        ? 'downstream'
        : 'upstream',
  );
}
assert.equal(neighbours(catalog, 'abdomen', 'both', aorta.id).rows.length, 7);
for (const side of ['left', 'right']) {
  const info = neighbours(catalog, 'abdomen', side, aorta.id);
  assert.equal(info.rows.length, 5);
  assert(info.rows.every((r) => isSide(r.structure, side)));
  assert(info.rows.some((r) => r.structure.id === celiac.id)); // Unspecified is not silently excluded.
}
const named = (fma) => neighbours(catalog, 'abdomen', 'both', byFma(fma).id);
assert(named('FMA50737').rows.some((r) => r.structure.fmaId === 'FMA14768')); // Not falsely paired.
assert.equal(
  named('FMA14772').rows.find((r) => r.structure.fmaId === 'FMA14771').kind,
  'continuation',
);
assert.equal(
  named('FMA14790').rows.find((r) => r.structure.fmaId === 'FMA14787').kind,
  'via-unmodelled',
);
assert.equal(
  named('FMA14818').rows.find((r) => r.structure.fmaId === 'FMA14815')
    .direction,
  'alternative',
);
assert.equal(named('FMA14824').rows.length, 4);
assert(named('FMA14824').rows.every((r) => r.direction === 'communication'));
assert(!named('FMA14790').rows.some((r) => r.structure.fmaId === 'FMA14805'));
let plans = 0,
  links = 0;
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)])
  for (const side of ['both', 'left', 'right'])
    for (const selected of targets) {
      const info = neighbours(catalog, region, side, selected.id);
      if (!regionHas(selected, region) || !isSide(selected, side)) {
        assert.equal(info, null);
        assert.equal(plan(catalog, region, side, selected.id), null);
        continue;
      }
      assert(info);
      if(selected.id === aorta.id) assert.equal(neighbours(raw, region, side, selected.id), null,
        'Shared aortic map requires the complete extended lower-limb source set');
      else assert.deepEqual(info, neighbours(raw, region, side, selected.id));
      const recipe = plan(catalog, region, side, selected.id);
      assert(recipe);
      plans++;
      assert.equal(recipe.selectedId, selected.id);
      assert.equal(recipe.action.type, 'load-view');
      const related = new Set([info.concept]);
      for (const relation of relations) {
        if (relation.from === info.concept) related.add(relation.to);
        if (relation.to === info.concept) related.add(relation.from);
      }
      const expectedFmas = new Set(
        [...related].flatMap((key) => concepts[key].fmaIds),
      );
      const keptBones = new Set(
        pins.entries.filter((s) => s.system === 'skeleton').map((s) => s.id),
      );
      if (selected.id === aorta.id) {
        expectedFmas.add('FMA14765');
        expectedFmas.add('FMA14766');
        for (const bone of lowerPins.entries.filter(
          (s) => s.system === 'skeleton' && s.regions.includes('pelvis'),
        ))
          keptBones.add(bone.id);
      }
      const before = reduce(initial, { type: 'remove', id: selected.id });
      const after = reduce(before, recipe.action);
      assert.equal(after.history.length, before.history.length + 1);
      assert.equal(after.stageId, 'free');
      assert.equal(after.focusId, null);
      const regional = catalog.structures.filter((s) => regionHas(s, region));
      for (const newSide of ['both', 'left', 'right']) {
        const scope = regional.filter((s) => isSide(s, newSide));
        const expected = scope.filter(
          (s) => expectedFmas.has(s.fmaId) || keptBones.has(s.id),
        );
        assert.deepEqual(
          resolve(scope, profiles[region], after).visible.map((s) => s.id),
          expected.map((s) => s.id),
        );
      }
      const scope = regional.filter((s) => isSide(s, side));
      assert(
        resolve(scope, profiles[region], after).visible.some(
          (s) => s.id === selected.id,
        ),
      );
      assert.deepEqual(
        resolve(scope, profiles[region], reduce(after, { type: 'undo' })),
        resolve(scope, profiles[region], before),
      );
      assert.deepEqual(
        reduce(reduce(after, { type: 'undo' }), { type: 'redo' }),
        after,
      );
      assert.deepEqual(reduce(after, recipe.action), after);
      assert.equal(neighbours(catalog, region, side, selected.id, true), null);
      assert.equal(plan(catalog, region, side, selected.id, true), null);
      for (const row of info.rows) {
        assert.equal(row.availableHere, regionHas(row.structure, region));
        assert(isSide(row.structure, side));
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
function reject(bad) {
  for (const selected of [aorta, celiac]) {
    assert.equal(neighbours(bad, 'abdomen', 'both', selected.id), null);
    assert.equal(plan(bad, 'abdomen', 'both', selected.id), null);
  }
  rejections++;
}
for (const entry of pins.entries) {
  const bad = structuredClone(catalog);
  bad.structures = bad.structures.filter((s) => s.id !== entry.id);
  reject(bad);
  const changed = structuredClone(catalog);
  changed.structures.find((s) => s.id === entry.id).name += ' changed';
  reject(changed);
}
for (const bundle of pins.bundles) {
  const bad = structuredClone(catalog);
  bad.bundles = bad.bundles.filter((b) => b.id !== bundle.id);
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
const duplicate = structuredClone(catalog);
duplicate.structures.push(structuredClone(celiac));
reject(duplicate);
const lowerCorrupt = structuredClone(catalog);
lowerCorrupt.structures.find((s) => s.fmaId === 'FMA70249').name += 'changed';
assert.equal(neighbours(lowerCorrupt, 'abdomen', 'both', aorta.id), null);
assert.equal(plan(lowerCorrupt, 'abdomen', 'both', aorta.id), null);
assert(neighbours(lowerCorrupt, 'abdomen', 'both', celiac.id)); // Independent non-shared admission remains useful.
for(const fma of ['FMA22562','FMA22563','FMA43890','FMA43891']) {
  const incomplete=structuredClone(catalog);
  incomplete.structures=incomplete.structures.filter(s=>s.fmaId!==fma);
  assert.equal(neighbours(incomplete,'abdomen','both',aorta.id),null);
  assert.equal(plan(incomplete,'abdomen','both',aorta.id),null);
  assert(neighbours(incomplete,'abdomen','both',celiac.id));
}
for (const [region, side, id] of [
  ['__proto__', 'both', aorta.id],
  ['abdomen', 'invalid', aorta.id],
  ['abdomen', 'both', '__proto__'],
]) {
  assert.equal(neighbours(catalog, region, side, id), null);
  assert.equal(plan(catalog, region, side, id), null);
}
// Match every component against the official isa source, not just the new pins.
const official = (
  await readFile('../work/bodyparts3d/isa_element_parts.txt', 'utf8')
)
  .trim()
  .split(/\r?\n/)
  .map((row) => row.split('\t'));
for (const selected of targets) {
  assert.equal(selected.sourceTree, 'isa');
  const match = official.filter((row) => row[0] === selected.fmaId);
  assert(match.length);
  assert.deepEqual(
    [...new Set(match.map((row) => row[1]))],
    [selected.sourceName],
  );
  assert.deepEqual(
    match.flatMap((row) => row[2].split(',')).sort(),
    selected.sources.map((s) => s.file).sort(),
  );
}
// Actual UI component and real framework Link, without browser/GPU claims.
const require = createRequire(import.meta.url),
  React = require('react');
const Link = (await import('vinext/shims/link')).default;
const component = await componentBuild({
  entryPoints: ['app/arterial-connections.tsx'],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
});
const mod = { exports: {} };
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
    React.createElement(mod.exports.ArterialConnections, props),
  );
let renders = 0;
for (const selected of targets)
  for (const region of ['whole-body', selected.region]) {
    const props = {
      catalog,
      region,
      side: 'both',
      selectedId: selected.id,
      disabled: false,
      onSelect() {},
      onShow() {},
    };
    const html = render(props);
    renders++;
    assert(html.includes('Arterial connections'));
    assert(html.includes('abdominal'));
    assert(!/<details[^>]*\bopen=/.test(html));
    assert(html.includes('Specialist review pending'));
    assert(html.includes('Show available connections &amp; bones'));
    for (const row of neighbours(catalog, region, 'both', selected.id).rows)
      assert(html.includes(row.structure.name));
    assert.equal(render({ ...props, disabled: true }), '');
    if (selected.fmaId === 'FMA14818')
      assert(html.includes('Alternative origins'));
  }
// Execute the real parent action; no imaging-event function is provided.
const parent = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  parent,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let handler, wiring;
function visit(node) {
  if (
    ts.isFunctionDeclaration(node) &&
    node.name?.text === 'showArterialConnections'
  )
    handler = node.getText(ast);
  if (
    ts.isJsxSelfClosingElement(node) &&
    node.tagName.getText(ast) === 'ArterialConnections'
  )
    wiring = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert(handler);
assert(
  wiring.includes('onSelect={select}') &&
    wiring.includes('onShow={showArterialConnections}') &&
    wiring.includes('disabled={exam}'),
);
let handlers = 0;
for (const selected of targets)
  for (const exam of [false, true]) {
    const calls = [];
    const env = {
      catalog,
      initialRegion: selected.region,
      side: 'both',
      selectedId: selected.id,
      exam,
      arterialPlan: plan,
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
      'setSelectionNotice',
      'setReset',
    ])
      env[name] = (value) => calls.push([name, value]);
    runInNewContext(
      ts.transpile(handler + ';showArterialConnections();', {
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
    assert.equal(
      calls.find((c) => c[0] === 'setSelectionNotice')[1].id,
      selected.id,
    );
    assert.equal(calls.find((c) => c[0] === 'setExplode')[1], 0);
    assert.equal(calls.find((c) => c[0] === 'setLayout')[1], 'spatial');
    assert.equal(env.cameraRestore.current, null);
    const systems = calls.find((c) => c[0] === 'setSystems')[1]({
      skeleton: false,
      vessels: false,
      muscles: false,
    });
    assert(systems.skeleton && systems.vessels && !systems.muscles);
  }
console.log(
  JSON.stringify({
    arteries: targets.length,
    concepts: 27,
    relationships: 32,
    plans,
    links,
    rejectedCatalogues: rejections,
    actualComponentRenders: renders,
    actualParentHandlers: handlers,
  }),
);
