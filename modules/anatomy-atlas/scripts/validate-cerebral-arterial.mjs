import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/arterial'; export * from './lib/cerebral-arterial'; export * from './content/cerebral-arterial'; export * from './app/dissection-data'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
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
  await readFile('content/cerebral-arterial-pins.json', 'utf8'),
);
const concepts = api.cerebralArterialConcepts,
  relations = api.cerebralArterialRelations;
const ids = new Set(Object.values(concepts).flatMap((c) => c.fmaIds));
const targets = catalog.structures.filter((s) => ids.has(s.fmaId));
const byFma = (id) => catalog.structures.find((s) => s.fmaId === id);
const {
  arterialNeighbours: neighbours,
  arterialPlan: plan,
  dissectionReducer: reduce,
  resolveDissection: resolve,
  initialDissection: initial,
  dissectionProfiles: profiles,
} = api;
const regionHas = (s, r) => r === 'whole-body' || s.regions.includes(r);
const sideHas = (s, side) =>
  side === 'both' ||
  s.laterality === side ||
  ['midline', 'unpaired', 'unspecified'].includes(s.laterality);
assert.equal(targets.length, 14);
assert.equal(pins.entries.length, 25);
assert.equal(Object.keys(concepts).length, 8);
assert.equal(relations.length, 7);
for (const name of ['abdominal', 'upper-limb', 'lower-limb']) {
  const other = JSON.parse(
    await readFile(`content/${name}-arterial-pins.json`, 'utf8'),
  );
  assert(
    !other.entries.some((s) => ids.has(s.fmaId)),
    'Cerebral routing assumes disjoint arterial IDs',
  );
}
const rows = targets.flatMap((s) =>
  neighbours(catalog, 'whole-body', 'both', s.id).rows.map((r) => ({
    from: s,
    ...r,
  })),
);
assert.equal(rows.length, 28);
assert.equal(
  new Set(rows.map((r) => [r.from.id, r.structure.id].sort().join('|'))).size,
  14,
);
for (const row of rows) {
  const inverse = neighbours(
    catalog,
    'whole-body',
    'both',
    row.structure.id,
  ).rows.find((r) => r.structure.id === row.from.id);
  assert(inverse);
  assert.equal(inverse.kind, row.kind);
  assert.equal(
    inverse.direction,
    row.direction === 'communication'
      ? 'communication'
      : row.direction === 'upstream'
        ? 'downstream'
        : 'upstream',
  );
  if (
    row.from.laterality !== 'midline' &&
    row.structure.laterality !== 'midline'
  )
    assert.equal(
      row.from.laterality,
      row.structure.laterality,
      'No invented cross-side branch',
    );
}
const named = (fma) => neighbours(catalog, 'head-neck', 'both', byFma(fma).id);
assert.deepEqual(
  named('FMA50542')
    .rows.filter((r) => r.kind === 'confluence')
    .map((r) => r.structure.fmaId)
    .sort(),
  ['FMA3958', 'FMA4066'],
);
assert(
  named('FMA50542')
    .rows.filter((r) => r.kind === 'confluence')
    .every((r) => r.direction === 'upstream'),
);
assert.equal(named('FMA50169').rows.length, 2);
assert(named('FMA50169').rows.every((r) => r.direction === 'communication'));
assert.equal(
  named('FMA50085').rows.find((r) => r.structure.fmaId === 'FMA50584')
    .direction,
  'communication',
);
assert(!named('FMA50085').rows.some((r) => r.structure.fmaId === 'FMA50585'));

let plans = 0;
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)])
  for (const side of ['both', 'left', 'right'])
    for (const selected of targets) {
      const info = neighbours(catalog, region, side, selected.id);
      if (!regionHas(selected, region) || !sideHas(selected, side)) {
        assert.equal(info, null);
        assert.equal(plan(catalog, region, side, selected.id), null);
        continue;
      }
      assert(info);
      assert.deepEqual(info, neighbours(raw, region, side, selected.id));
      assert.deepEqual(
        info,
        api.cerebralArterialNeighbours(catalog, region, side, selected.id),
      );
      assert.equal(
        new Set(info.rows.map((r) => r.structure.id)).size,
        info.rows.length,
      );
      assert(info.rows.every((r) => sideHas(r.structure, side)));
      assert(
        info.rows.every(
          (r) => r.availableHere === regionHas(r.structure, region),
        ),
      );
      const recipe = plan(catalog, region, side, selected.id);
      assert.equal(recipe.selectedId, selected.id);
      assert.equal(recipe.action.type, 'load-view');
      const related = new Set([info.concept]);
      for (const r of relations) {
        if (r.from === info.concept) related.add(r.to);
        if (r.to === info.concept) related.add(r.from);
      }
      const keep = new Set([...related].flatMap((k) => concepts[k].fmaIds));
      for (const fma of concepts[info.concept].contextFmaIds) keep.add(fma);
      const before = reduce(initial, { type: 'remove', id: selected.id });
      const after = reduce(before, recipe.action);
      assert.equal(after.history.length, before.history.length + 1);
      for (const changedSide of ['both', 'left', 'right']) {
        const scope = catalog.structures.filter(
          (s) => regionHas(s, region) && sideHas(s, changedSide),
        );
        assert.deepEqual(
          resolve(scope, profiles[region], after).visible.map((s) => s.id),
          scope.filter((s) => keep.has(s.fmaId)).map((s) => s.id),
        );
        assert.deepEqual(
          resolve(scope, profiles[region], reduce(after, { type: 'undo' })),
          resolve(scope, profiles[region], before),
        );
      }
      assert.deepEqual(
        reduce(reduce(after, { type: 'undo' }), { type: 'redo' }),
        after,
      );
      assert.deepEqual(reduce(after, recipe.action), after);
      assert.equal(neighbours(catalog, region, side, selected.id, true), null);
      assert.equal(plan(catalog, region, side, selected.id, true), null);
      plans++;
    }
let rejected = 0;
function reject(bad) {
  for (const s of targets) {
    assert.equal(neighbours(bad, 'whole-body', 'both', s.id), null);
    assert.equal(plan(bad, 'whole-body', 'both', s.id), null);
  }
  rejected++;
}
for (const entry of pins.entries) {
  const missing = structuredClone(catalog);
  missing.structures = missing.structures.filter((s) => s.id !== entry.id);
  reject(missing);
  const changed = structuredClone(catalog);
  changed.structures.find((s) => s.id === entry.id).name += ' stale';
  reject(changed);
}
for (const key of ['sourceVersion', 'license', 'coordinateSystem']) {
  const bad = structuredClone(catalog);
  bad[key] = 'changed';
  reject(bad);
}
for (const bundle of pins.bundles) {
  const missing = structuredClone(catalog);
  missing.bundles = missing.bundles.filter((b) => b.id !== bundle.id);
  reject(missing);
  const duplicate = structuredClone(catalog);
  duplicate.bundles.push(structuredClone(bundle));
  reject(duplicate);
}
const duplicate = structuredClone(catalog);
duplicate.structures.push(structuredClone(targets[0]));
reject(duplicate);
for (const args of [
  ['__proto__', 'both', targets[0].id],
  ['whole-body', 'invalid', targets[0].id],
  ['whole-body', 'both', '__proto__'],
]) {
  assert.equal(neighbours(catalog, ...args), null);
  assert.equal(plan(catalog, ...args), null);
}
// PCA selections are official partof groups; the other twelve use ISA. Preserve both.
const official = {};
for (const tree of ['isa', 'partof'])
  official[tree] = (
    await readFile(`../work/bodyparts3d/${tree}_element_parts.txt`, 'utf8')
  )
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split('\t'));
for (const selected of targets) {
  assert.equal(
    selected.sourceTree,
    ['FMA50584', 'FMA50585'].includes(selected.fmaId) ? 'partof' : 'isa',
  );
  const match = official[selected.sourceTree].filter(
    (r) => r[0] === selected.fmaId,
  );
  assert(match.length);
  assert.deepEqual([...new Set(match.map((r) => r[1]))], [selected.sourceName]);
  assert.deepEqual(
    match.flatMap((r) => r[2].split(',')).sort(),
    selected.sources.map((s) => s.file).sort(),
  );
}
assert.equal(
  targets.reduce((n, s) => n + s.sources.length, 0),
  31,
);
for (const fma of ['FMA50584', 'FMA50585'])
  assert.equal(byFma(fma).sources.length, 9);
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
  for (const region of ['whole-body', 'head-neck']) {
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
    assert(html.includes('Arterial connections'));
    assert(html.includes('cervical and cerebral'));
    assert(!/<details[^>]*\bopen=/.test(html));
    assert(html.includes('Specialist review pending'));
    assert(html.includes('Show available connections &amp; bones'));
    for (const row of neighbours(catalog, region, 'both', selected.id).rows)
      assert(html.includes(row.structure.name));
    if (selected.fmaId === 'FMA50542')
      assert(html.includes('Confluence · paired inflows unite'));
    assert.equal(render({ ...props, disabled: true }), '');
    renders++;
  }
console.log(
  JSON.stringify({
    vessels: targets.length,
    contextBones: 11,
    relations: 14,
    reciprocalRows: rows.length,
    reversiblePlans: plans,
    rejectedSourceMutations: rejected,
    componentRenders: renders,
    browserOrClinicalValidation: false,
  }),
);
