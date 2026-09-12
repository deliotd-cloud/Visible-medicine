import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const built = await build({
  stdin: {
    contents:
      "export * from './lib/thigh-attachments'; export * from './lib/arm-attachments'; export * from './content/thigh-attachments'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
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
    Buffer.from(built.outputFiles[0].text).toString('base64')
);
const catalog = api.bodyDisplayCatalog(
  JSON.parse(
    await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
  ),
);
const snapshot = JSON.stringify(catalog);
const pins = JSON.parse(
  await readFile('content/thigh-attachment-pins.json', 'utf8'),
);
const muscles = pins.entries.filter((s) => s.system === 'muscles');
assert.equal(muscles.length, 20);
assert.equal(pins.entries.length, 30);
// Independently specified bony relationships; not inferred from the content being tested.
const expected = {
  'rectus-femoris': ['hip', 'patella', 'tibia'],
  'vastus-lateralis': ['femur', 'patella', 'tibia'],
  'vastus-medialis': ['femur', 'patella', 'tibia'],
  'vastus-intermedius': ['femur', 'patella', 'tibia'],
  'biceps-long': ['hip', 'fibula'],
  'biceps-short': ['femur', 'fibula'],
  semimembranosus: ['hip', 'tibia'],
  semitendinosus: ['hip', 'tibia'],
  sartorius: ['hip', 'tibia'],
  gracilis: ['hip', 'tibia'],
};
const byFma = (fma) => catalog.structures.find((s) => s.fmaId === fma);
const inScope = (s, r) => r === 'whole-body' || s.regions.includes(r);
let plans = 0,
  links = 0,
  rejections = 0;
for (const a of api.thighAttachments)
  for (const [index, fma] of a.fmas.entries()) {
    const selected = byFma(fma);
    for (const region of ['thigh', 'whole-body'])
      for (const side of ['both', selected.laterality]) {
        const args = [catalog, region, side, selected.id];
        const info = api.thighAttachmentInfo(...args),
          plan = api.thighAttachmentPlan(...args);
        assert(info && plan);
        assert.deepEqual(
          info.rows.map((r) => r.structure.fmaId),
          expected[a.key].map((b) => api.thighAttachmentBones[b][index]),
        );
        assert(
          info.rows.every(
            (r) => r.structure.laterality === selected.laterality,
          ),
        );
        assert.equal(info.completeHere, region === 'whole-body');
        assert.equal(plan.selectedId, selected.id);
        assert.equal(plan.completeHere, info.completeHere);
        const expectedFmas = new Set([
          ...a.fmas,
          ...expected[a.key].flatMap((b) => api.thighAttachmentBones[b]),
        ]);
        const pool = catalog.structures.filter((s) => inScope(s, region));
        const visible = pool.filter(
          (s) => !plan.action.hiddenIds.includes(s.id),
        );
        assert.deepEqual(
          visible.map((s) => s.fmaId).sort(),
          pool
            .filter((s) => expectedFmas.has(s.fmaId))
            .map((s) => s.fmaId)
            .sort(),
        );
        const before = api.dissectionReducer(api.initialDissection, {
          type: 'remove',
          id: selected.id,
        });
        const after = api.dissectionReducer(before, plan.action);
        const resolved = api.resolveDissection(
          pool,
          api.dissectionProfiles[region],
          after,
        );
        assert.deepEqual(
          resolved.visible.map((s) => s.id).sort(),
          visible.map((s) => s.id).sort(),
        );
        const undone = api.dissectionReducer(after, { type: 'undo' });
        assert.deepEqual(undone.removed, before.removed);
        assert.deepEqual(
          api.dissectionReducer(undone, { type: 'redo' }),
          after,
        );
        assert.deepEqual(api.dissectionReducer(after, plan.action), after);
        for (const nextSide of ['left', 'right'])
          assert(
            visible.some(
              (s) => s.system === 'muscles' && s.laterality === nextSide,
            ),
          );
        assert.equal(api.thighAttachmentInfo(...args, true), null);
        assert.equal(api.thighAttachmentPlan(...args, true), null);
        if (region === 'thigh') {
          const url = new URL(
            api.makeStudyLink(catalog, 'whole-body', selected.id, side),
            'https://example.invalid',
          );
          const parsed = api.parseStudyLink(
            Object.fromEntries(url.searchParams),
          );
          assert.equal(parsed.status, 'requested');
          assert.equal(parsed.request.structureId, selected.id);
          assert.equal(parsed.request.side, side);
          assert.equal(
            api.resolveStudyLink(catalog, 'whole-body', parsed).status,
            'ready',
          );
          links++;
        }
        if (expected[a.key].length === 3) {
          assert.equal(info.rows[2].role, 'continuation');
          assert.match(info.rows[2].site, /not direct muscle insertion/);
        }
        plans++;
      }
  }
const selected = muscles[0];
for (const change of [
  (c) => (c.sourceVersion = 'foreign'),
  (c) => (c.license = 'unknown'),
  (c) => (c.coordinateSystem.unitsPerMillimetre = 42),
  (c) =>
    c.structures.push({ ...c.structures.find((s) => s.id === selected.id) }),
  (c) => c.bundles.push({ ...c.bundles.find((b) => b.id === selected.bundle) }),
  (c) =>
    (c.bundles.find((b) => b.id === selected.bundle).sha256 = '0'.repeat(64)),
]) {
  const bad = structuredClone(catalog);
  change(bad);
  assert.equal(
    api.thighAttachmentPlan(bad, 'whole-body', 'both', selected.id),
    null,
  );
  rejections++;
}
for (const pin of pins.entries)
  for (const change of [
    (s) => (s.name += ' stale'),
    (s) => (s.id += '-stale'),
    (s) => (s.anchor[0] += 1),
    (s) => (s.laterality = 'unknown'),
    (s) => (s.sources[0].sha256 = '0'.repeat(64)),
  ]) {
    const bad = structuredClone(catalog);
    change(bad.structures.find((s) => s.id === pin.id));
    assert.equal(
      api.thighAttachmentInfo(bad, 'whole-body', 'both', selected.id),
      null,
    );
    rejections++;
  }
for (const region of ['leg', 'pelvis', 'shoulder-arm', 'unknown'])
  assert.equal(
    api.thighAttachmentInfo(catalog, region, 'both', selected.id),
    null,
  );
assert.equal(
  api.thighAttachmentInfo(catalog, 'whole-body', 'invalid', selected.id),
  null,
);
assert.equal(
  api.thighAttachmentInfo(catalog, 'whole-body', 'left', byFma('FMA38928').id),
  null,
);
for (const s of catalog.structures.filter(
  (s) => !muscles.some((m) => m.id === s.id),
))
  assert.equal(
    api.thighAttachmentInfo(catalog, 'whole-body', 'both', s.id),
    null,
  );
const require = createRequire(import.meta.url),
  React = require('react'),
  actualLink = await import('vinext/shims/link');
const ui = await componentBuild({
  entryPoints: ['app/arm-attachments.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
const mod = { exports: {} };
runInNewContext(ui.outputFiles[0].text, {
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
    React.createElement(mod.exports.ArmAttachments, props),
  );
let renders = 0;
for (const s of muscles)
  for (const region of ['thigh', 'whole-body']) {
    const props = {
      catalog,
      region,
      side: 'both',
      selectedId: s.id,
      disabled: false,
      onSelect() {},
      onShow() {},
    };
    const html = render(props),
      info = api.thighAttachmentInfo(catalog, region, 'both', s.id);
    renders++;
    assert(
      html.includes(s.name) && html.includes('Muscle attachment relationships'),
    );
    assert(!/<details[^>]*\bopen=/.test(html));
    assert(
      html.includes('Specialist review pending') &&
        html.includes(api.thighAttachmentReference.url),
    );
    for (const row of info.rows)
      assert(html.includes(row.structure.name) && html.includes(row.label));
    if (!info.completeHere)
      assert(
        html.includes('Open this muscle in whole body') &&
          html.includes('then choose Show'),
      );
    assert.equal(render({ ...props, disabled: true }), '');
  }
// Execute the production parent handler, not a hand-written surrogate.
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let handler, wiring;
function visit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'showMuscleAttachments')
    handler = n.getText(ast);
  if (
    ts.isJsxSelfClosingElement(n) &&
    n.tagName.getText(ast) === 'ArmAttachments'
  )
    wiring = n.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
assert(
  wiring.includes('onShow={showMuscleAttachments}') &&
    wiring.includes('onSelect={select}') &&
    wiring.includes('disabled={exam}'),
);
let handlers = 0;
for (const s of muscles)
  for (const exam of [false, true]) {
    const calls = [];
    const env = {
      catalog,
      initialRegion: 'thigh',
      side: 'both',
      selectedId: s.id,
      exam,
      armAttachmentPlan: api.armAttachmentPlan,
      thighAttachmentPlan: api.thighAttachmentPlan,
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
      ts.transpile(handler + ';showMuscleAttachments();', {
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
    assert.equal(calls.find((c) => c[0] === 'setSelectionNotice')[1].id, s.id);
    assert.equal(calls.find((c) => c[0] === 'setExplode')[1], 0);
    assert.equal(calls.find((c) => c[0] === 'setLayout')[1], 'spatial');
    assert.equal(env.cameraRestore.current, null);
    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          calls.find((c) => c[0] === 'setSystems')[1]({
            skeleton: false,
            muscles: false,
            vessels: false,
          }),
        ),
      ),
      { skeleton: true, muscles: true, vessels: false },
    );
  }
assert.equal(JSON.stringify(catalog), snapshot);
const uniqueText = new Set(
  api.thighAttachments.flatMap((a) => [
    ...a.endpoints.map((e) => e.site),
    ...(a.note ? [a.note] : []),
  ]),
);
const referenceWords = [...uniqueText].join(' ').split(/\s+/).length;
assert(referenceWords <= 200);
const result = {
  muscles: 20,
  bones: 10,
  relationships: 10,
  plans,
  crossRegionLinks: links,
  rejectedCatalogs: rejections,
  componentSsr: renders,
  actualParentHandlers: handlers,
  referenceWords,
  sourceGeometryChanged: false,
  clinicalReview: 'pending',
  browserAcceptance: 'not-tested',
};
await writeFile(
  'docs/thigh-attachments-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
