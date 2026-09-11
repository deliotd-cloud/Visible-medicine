import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { contentContext } from './content-contract-tools.mjs';
import { authoringBeforeWristImaging } from './wrist-imaging-history.mjs';
const upper = process.argv.includes('--upper');
const testRegion = upper ? 'forearm' : 'leg';
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/lower-limb-arterial'; export * from './lib/upper-limb-arterial'; export * from './lib/limb-arterial'; export * from './lib/arterial'; export * from './content/upper-limb-arterial'; export * from './content/lower-limb-arterial'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
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
  ),
  catalog = api.bodyDisplayCatalog(raw),
  pins = JSON.parse(
    await readFile(
      upper
        ? 'content/upper-limb-arterial-pins.json'
        : 'content/lower-limb-arterial-pins.json',
      'utf8',
    ),
  );
const {
  dissectionReducer: reduce,
  resolveDissection: resolve,
  initialDissection: initial,
  dissectionProfiles: profiles,
} = api;
const neighbours = upper
    ? api.upperLimbArterialNeighbours
    : api.lowerLimbArterialNeighbours,
  plan = upper ? api.upperLimbArterialPlan : api.lowerLimbArterialPlan,
  concepts = upper ? api.upperArterialConcepts : api.arterialConcepts,
  relations = upper ? api.upperArterialRelations : api.arterialRelations;
assert.equal(Object.keys(concepts).length, upper ? 27 : 20);
assert.equal(relations.length, upper ? 29 : 20);
const targets = catalog.structures.filter((s) =>
  Object.values(concepts).some((c) => c.fmaIds.includes(s.fmaId)),
);
assert.equal(targets.length, upper ? 54 : 39);
assert.equal(pins.entries.length, upper ? 116 : 94);
{
  const extra=JSON.parse(await readFile(upper ? 'public/models/bodyparts3d/inferior-thyroid-arteries/catalog.json' : 'public/models/bodyparts3d/genicular-arteries/catalog.json'));
  pins.entries.push(...extra.structures);pins.bundles.push(...extra.bundles);
  if (upper) {
    const context = JSON.parse(await readFile('content/inferior-thyroid-context-pins.json'));
    pins.entries.push(...context.entries);
    pins.bundles.push(...context.bundles.filter(b => !pins.bundles.some(p => p.id === b.id)));
  }
}
const allRows = targets.flatMap((s) =>
  neighbours(catalog, 'whole-body', 'both', s.id).rows.map((r) => ({
    from: s,
    to: r.structure,
    kind: r.kind,
    direction: r.direction,
  })),
);
assert.equal(allRows.length, upper ? 116 : 80);
const uniqueEdges = new Set(
  allRows.map((r) => [r.from.id, r.to.id].sort().join('|')),
);
assert.equal(uniqueEdges.size, upper ? 58 : 40);
assert(
  allRows.every(
    (r) =>
      r.from.laterality === r.to.laterality ||
      r.from.laterality === 'midline' ||
      r.to.laterality === 'midline',
  ),
);
for (const r of allRows) {
  const inverse = neighbours(catalog, 'whole-body', 'both', r.to.id).rows.find(
    (x) => x.structure.id === r.from.id,
  );
  assert(inverse);
  assert.equal(inverse.kind, r.kind);
  assert.equal(
    inverse.direction,
    ['communication', 'alternative'].includes(r.direction)
      ? r.direction
      : r.direction === 'upstream'
        ? 'downstream'
        : 'upstream',
  );
}
const byFma = (f) => catalog.structures.find((s) => s.fmaId === f),
  leg = byFma(upper ? 'FMA22733' : 'FMA77380');
if (!upper) {
  assert.equal(
    neighbours(catalog, testRegion, 'right', leg.id).rows.find(
      (r) => r.structure.fmaId === 'FMA43898',
    ).kind,
    'via-unmodelled',
  );
  assert(
    neighbours(catalog, testRegion, 'right', leg.id).note.includes('fibular'),
  );
  assert.equal(
    neighbours(catalog, 'foot', 'right', byFma('FMA69514').id).rows.find(
      (r) => r.structure.fmaId === 'FMA43943',
    ).direction,
    'communication',
  );
  assert(
    !neighbours(catalog, 'foot', 'right', byFma('FMA43929').id).rows.some(
      (r) => r.structure.fmaId === 'FMA43943',
    ),
  );
} else {
  const info = (f, region = 'whole-body') =>
    neighbours(catalog, region, 'right', byFma(f).id);
  const row = (from, to) =>
    info(from).rows.find((r) => r.structure.fmaId === to);
  assert.equal(row('FMA3953', 'FMA22655').kind, 'continuation');
  assert.match(
    row('FMA22655', 'FMA22691').note,
    /inferior border of teres major/,
  );
  for (const f of ['FMA23180', 'FMA66321']) {
    assert.equal(row('FMA22655', f).kind, 'via-unmodelled');
    assert.match(row('FMA22655', f).note, /subscapular/);
  }
  assert.equal(row('FMA22807', 'FMA268667').kind, 'via-unmodelled');
  assert.match(row('FMA22807', 'FMA268667').note, /posterior interosseous/);
  assert.equal(row('FMA22733', 'FMA22839').kind, 'continuation');
  assert.equal(row('FMA22797', 'FMA22839').direction, 'communication');
  assert.equal(row('FMA22797', 'FMA22835').kind, 'continuation');
  assert.match(row('FMA22733', 'FMA22835').note, /not guaranteed/);
  assert.equal(row('FMA22839', 'FMA22864').kind, 'branch');
  assert.equal(
    info('FMA4057').rows.filter((r) => r.direction === 'alternative').length,
    2,
  );
  assert(info('FMA4057').rows.every((r) => r.kind === 'variant'));
  assert.match(row('FMA3992', 'FMA4057').note, /transverse cervical/);
  assert.match(info('FMA22905').note, /Origins vary/);
  assert.match(
    info('FMA22835').note,
    /digital arteries are not assigned parents/,
  );
}
const isSide = (s, side) =>
  side === 'both' || s.laterality === side || s.laterality === 'midline';
const regionHas = (s, region) =>
  region === 'whole-body' || s.regions.includes(region);
const regions = upper
  ? ['whole-body', ...catalog.regions.map((r) => r.id)]
  : ['whole-body', 'abdomen', 'thorax', 'pelvis', 'thigh', 'leg', 'foot'];
let plans = 0,
  links = 0,
  rejections = 0,
  renders = 0,
  handlerCases = 0;
for (const region of regions)
  for (const side of ['both', 'left', 'right'])
    for (const s of targets) {
      const info = neighbours(catalog, region, side, s.id);
      if (!regionHas(s, region) || !isSide(s, side)) {
        assert.equal(info, null);
        assert.equal(plan(catalog, region, side, s.id), null);
        continue;
      }
      assert(info);
      assert.deepEqual(
        api.limbArterialNeighbours(catalog, region, side, s.id),
        info,
      );
      assert.deepEqual(
        api.limbArterialPlan(catalog, region, side, s.id),
        plan(catalog, region, side, s.id),
      );
      assert.equal(neighbours(raw, region, side, s.id), null,
        'The archival catalogue cannot stand in for either source-extended arterial graph');
      for (const row of info.rows) {
        assert.equal(row.availableHere, regionHas(row.structure, region));
        if (!row.availableHere) {
          const href = api.makeStudyLink(
            catalog,
            'whole-body',
            row.structure.id,
            side,
          );
          assert(href);
          const url = new URL(href, 'https://example.invalid');
          assert.equal(url.pathname, '/');
          assert.equal(
            api.resolveStudyLink(
              catalog,
              'whole-body',
              api.parseStudyLink(Object.fromEntries(url.searchParams)),
            ).status,
            'ready',
          );
          links++;
        }
      }
      const recipe = plan(catalog, region, side, s.id);
      assert.equal(recipe.selectedId, s.id);
      plans++;
      const regional = catalog.structures.filter((x) => regionHas(x, region)),
        scope = regional.filter((x) => isSide(x, side));
      const before = reduce(
          reduce(initial, {
            type: 'stage',
            id: profiles[region].stages.at(-1).id,
          }),
          { type: 'remove', id: s.id },
        ),
        next = reduce(before, recipe.action);
      assert.equal(next.history.length, before.history.length + 1);
      assert.equal(next.focusId, null);
      assert.equal(next.stageId, 'free');
      assert(
        resolve(scope, profiles[region], next).visible.some(
          (x) => x.id === s.id,
        ),
      );
      const keys = new Set([info.concept]);
      for (const r of relations) {
        if (r.from === info.concept) keys.add(r.to);
        if (r.to === info.concept) keys.add(r.from);
      }
      const fmas = new Set([...keys].flatMap((k) => concepts[k].fmaIds));
      for (const viewSide of ['both', 'left', 'right']) {
        const viewed = regional.filter((x) => isSide(x, viewSide));
        const expected = viewed.filter(
          (x) =>
            fmas.has(x.fmaId) ||
            (x.system === 'skeleton' &&
              (info.concept === 'inferiorThyroid'
                ? ['FMA52749','FMA12519','FMA12520','FMA12521','FMA12522','FMA12523','FMA12524','FMA12525'].includes(x.fmaId)
                : x.regions.includes(concepts[info.concept].context))),
        );
        assert.deepEqual(
          resolve(viewed, profiles[region], next).visible.map((x) => x.id),
          expected.map((x) => x.id),
        );
      }
      const undone = reduce(next, { type: 'undo' });
      assert.deepEqual(
        resolve(scope, profiles[region], undone),
        resolve(scope, profiles[region], before),
      );
      assert.deepEqual(reduce(undone, { type: 'redo' }), next);
      assert.deepEqual(reduce(next, recipe.action), next);
      assert.equal(neighbours(catalog, region, side, s.id, true), null);
      assert.equal(plan(catalog, region, side, s.id, true), null);
    }
for (const s of catalog.structures.filter(
  (s) => !targets.some((t) => t.id === s.id),
))
  assert.equal(neighbours(catalog, 'whole-body', 'both', s.id), null);
for (const s of pins.entries) {
  const bad = structuredClone(catalog);
  bad.structures.find((x) => x.id === s.id).sources[0].sha256 = '0'.repeat(64);
  assert.equal(neighbours(bad, testRegion, 'right', leg.id), null);
  assert.equal(plan(bad, testRegion, 'right', leg.id), null);
  rejections++;
}
for (const mutate of [
  (c) => {
    c.sourceVersion = 'bad';
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
    c.structures.find((x) => x.id === leg.id).name += ' changed';
  },
  (c) => {
    c.structures.find((x) => x.id === leg.id).laterality = 'left';
  },
  (c) => {
    c.structures.find((x) => x.id === leg.id).fmaId = 'FMA0';
  },
  (c) => {
    c.structures.find((x) => x.id === leg.id).sourceTree = 'partof';
  },
  (c) => {
    c.structures.find((x) => x.id === leg.id).bounds.min[0] += 1;
  },
  (c) => {
    c.structures.find((x) => x.id === leg.id).anchor[0] += 1;
  },
  (c) => {
    c.structures.find((x) => x.id === leg.id).regions.push('hand');
  },
  (c) => {
    c.structures.find((x) => x.id === leg.id).provenance.license = 'unknown';
  },
  (c) => {
    c.structures.push({
      ...c.structures.find((x) => x.id === leg.id),
      regions: ['hand'],
    });
  },
  (c) => {
    c.structures = c.structures.filter((x) => x.id !== leg.id);
  },
  (c) => {
    c.bundles.find((x) => x.id === leg.bundle).sha256 = '0'.repeat(64);
  },
  (c) => {
    c.bundles.push(c.bundles.find((x) => x.id === leg.bundle));
  },
]) {
  const bad = structuredClone(catalog);
  mutate(bad);
  assert.equal(neighbours(bad, testRegion, 'right', leg.id), null);
  assert.equal(plan(bad, testRegion, 'right', leg.id), null);
  rejections++;
}
assert.equal(neighbours(catalog, '__proto__', 'both', leg.id), null);
assert.equal(neighbours(catalog, testRegion, 'invalid', leg.id), null);
assert.equal(neighbours(catalog, testRegion, 'left', leg.id), null);
const sourceRows = Object.fromEntries(
  await Promise.all(
    ['isa', 'partof'].map(async (tree) => [
      tree,
      (await readFile(`../work/bodyparts3d/${tree}_element_parts.txt`, 'utf8'))
        .trim()
        .split(/\r?\n/)
        .map((l) => l.split('\t')),
    ]),
  ),
);
for (const s of targets) {
  assert.equal(
    s.sourceTree,
    !upper && ['FMA20796', 'FMA20797'].includes(s.fmaId) ? 'partof' : 'isa',
  );
  const matched = sourceRows[s.sourceTree].filter((r) => r[0] === s.fmaId);
  const pairedComponentIds = [
    'FMA22685',
    'FMA22687',
    'FMA22905',
    'FMA22907',
    'FMA22777',
    'FMA22778',
  ];
  assert.equal(
    matched.length,
    s.sourceTree === 'partof' || (upper && pairedComponentIds.includes(s.fmaId))
      ? 2
      : 1,
  );
  assert.deepEqual([...new Set(matched.map((r) => r[1]))], [s.sourceName]);
  assert.deepEqual(
    matched.flatMap((r) => r[2].split(',')).sort(),
    s.sources.map((p) => p.file).sort(),
  );
}
// No content topic or recipe was replaced by the new relationship browser.
const ctx = await contentContext();
const arterialMilestone = authoringBeforeWristImaging(ctx);
assert.equal(
  createHash('sha256')
    .update(
      JSON.stringify({
        body: ctx.catalog.structures.map((s) => ({
          id: s.id,
          sections: Object.fromEntries(
            ctx.api.contentTabs.map((t) => [t, arterialMilestone.bodyLesson(s, t)]),
          ),
        })),
        shoulder: ctx.api.structures,
        recipes: arterialMilestone.dissectionProfiles,
      }),
    )
    .digest('hex'),
  '7e5592d21db98475fb72da072a073eaa1f00b0edafdc844fe38320f4f86cffe9',
);
// Actual component and installed controls; use the real framework Link shim.
const require = createRequire(import.meta.url),
  React = require('react'),
  actualLink = await import('vinext/shims/link');
const built = await componentBuild({
    entryPoints: ['app/arterial-connections.tsx'],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
  }),
  mod = { exports: {} };
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
    React.createElement(mod.exports.ArterialConnections, props),
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
      },
      html = render(props);
    renders++;
    assert(html.includes('Arterial connections'));
    assert(html.includes(upper ? 'upper-limb' : 'lower-limb'));
    if (upper && ['FMA4057', 'FMA10552'].includes(s.fmaId)) {
      assert(html.includes('Alternative origins'));
      assert(html.includes('not simultaneous connections'));
    }
    assert(html.includes(s.name));
    assert(html.includes('Specialist review pending'));
    assert(html.includes('Show available connections &amp; bones'));
    assert(!/<details[^>]*\bopen=/.test(html));
    assert.equal(render({ ...props, disabled: true }), '');
    for (const row of neighbours(catalog, region, 'both', s.id).rows) {
      assert(html.includes(row.structure.name));
      if (!row.availableHere) assert(html.includes('open whole body'));
    }
  }
assert.equal(
  render({
    catalog,
    region: 'leg',
    side: 'both',
    selectedId: byFma('FMA44328').id,
    disabled: false,
  }),
  '',
);
// Real parent handler, with the actual planner and no imaging-event function provided.
const parent = await readFile('app/body-explorer.tsx', 'utf8'),
  ast = ts.createSourceFile(
    'body.tsx',
    parent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
let handler, wiring;
function visit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'showArterialConnections')
    handler = n.getText(ast);
  if (
    ts.isJsxSelfClosingElement(n) &&
    n.tagName.getText(ast) === 'ArterialConnections'
  )
    wiring = n.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
assert(handler);
assert(
  wiring.includes('onSelect={select}') &&
    wiring.includes('onShow={showArterialConnections}') &&
    wiring.includes('disabled={exam}'),
);
for (const selected of upper
  ? targets
  : [byFma('FMA3789'), byFma('FMA70249'), leg, byFma('FMA43943')])
  for (const exam of [false, true]) {
    const calls = [],
      env = {
        catalog,
        initialRegion: selected.region,
        side: 'both',
        selectedId: selected.id,
        exam,
        arterialPlan: api.arterialPlan,
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
      ts.transpile(handler + ';showArterialConnections();', {
        target: ts.ScriptTarget.ES2022,
      }),
      env,
    );
    handlerCases++;
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
    const systems = calls.find((c) => c[0] === 'setSystems')[1]({
      skeleton: false,
      vessels: false,
      muscles: false,
    });
    assert(systems.skeleton && systems.vessels && !systems.muscles);
  }
console.log(
  JSON.stringify({
    territory: upper ? 'upper-limb' : 'lower-limb',
    arteries: targets.length,
    concepts: Object.keys(concepts).length,
    mappedRelationships: uniqueEdges.size,
    reciprocalNeighbourRows: allRows.length,
    sourceRows: targets.length,
    plans,
    crossRegionLinks: links,
    rejectedCatalogues: rejections,
    actualComponentRenders: renders,
    parentHandlerCases: handlerCases,
    unchangedBodyTopics: 9198,
    clinicalApproval: false,
  }),
);
