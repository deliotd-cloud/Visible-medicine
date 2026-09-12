import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const built = await build({
  stdin: {
    contents:
      "export * from './lib/arm-attachments'; export * from './content/arm-attachments'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
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
  await readFile('content/arm-attachment-pins.json', 'utf8'),
);
const muscles = pins.entries.filter((s) => s.system === 'muscles');
assert.equal(muscles.length, 24);
assert.equal(api.armAttachments.length, 12);
const byFma = (fma) => catalog.structures.find((s) => s.fmaId === fma);
// Independent expected proximal/distal bone pairs, not inferred from the implementation.
const expected = {
  supraspinatus: ['scapula', 'humerus'],
  infraspinatus: ['scapula', 'humerus'],
  'teres-minor': ['scapula', 'humerus'],
  subscapularis: ['scapula', 'humerus'],
  'teres-major': ['scapula', 'humerus'],
  'biceps-short': ['scapula', 'radius'],
  'biceps-long': ['scapula', 'radius'],
  coracobrachialis: ['scapula', 'humerus'],
  brachialis: ['humerus', 'ulna'],
  'triceps-long': ['scapula', 'ulna'],
  'triceps-lateral': ['humerus', 'ulna'],
  'triceps-medial': ['humerus', 'ulna'],
};
let plans = 0,
  links = 0,
  rejections = 0;
for (const a of api.armAttachments)
  for (const [index, fma] of a.fmas.entries()) {
    const selected = byFma(fma);
    for (const region of ['whole-body', 'shoulder-arm'])
      for (const side of ['both', selected.laterality]) {
        const args = [catalog, region, side, selected.id];
        const info = api.armAttachmentInfo(...args);
        assert.deepEqual(
          info.rows.map((r) => r.structure.fmaId),
          expected[a.key].map((b) => api.attachmentBones[b][index]),
        );
        assert.deepEqual(
          info.rows.map((r) => r.role),
          ['proximal', 'distal'],
        );
        assert(
          info.rows.every(
            (r) => r.structure.laterality === selected.laterality,
          ),
        );
        const plan = api.armAttachmentPlan(...args);
        const kept = new Set([
          selected.id,
          ...info.rows
            .filter((r) => r.availableHere)
            .map((r) => r.structure.id),
        ]);
        const before = api.dissectionReducer(api.initialDissection, {
          type: 'load-view',
          hiddenIds: [selected.id],
        });
        const after = api.dissectionReducer(before, plan.action);
        const resolved = api.resolveDissection(
          catalog.structures.filter(
            (s) => region === 'whole-body' || s.regions.includes(region),
          ),
          api.dissectionProfiles[region],
          after,
        );
        // Assert exact source mask separately from side filtering.
        const inScope = catalog.structures.filter(
          (s) => region === 'whole-body' || s.regions.includes(region),
        );
        const keptFmas = new Set([
          ...a.fmas,
          ...expected[a.key].flatMap((b) => api.attachmentBones[b]),
        ]);
        assert.deepEqual(
          inScope
            .filter((s) => !plan.action.hiddenIds.includes(s.id))
            .map((s) => s.fmaId)
            .sort(),
          inScope
            .filter((s) => keptFmas.has(s.fmaId))
            .map((s) => s.fmaId)
            .sort(),
        );
        for (const id of kept) assert(!plan.action.hiddenIds.includes(id));
        assert.equal(plan.selectedId, selected.id);
        assert.equal(
          plan.completeHere,
          region === 'whole-body' ||
            !['radius', 'ulna'].includes(expected[a.key][1]),
        );
        const undone = api.dissectionReducer(after, { type: 'undo' });
        assert.deepEqual(undone.hiddenIds, before.hiddenIds);
        assert.deepEqual(
          api.dissectionReducer(undone, { type: 'redo' }),
          after,
        );
        assert.deepEqual(api.dissectionReducer(after, plan.action), after);
        assert(resolved);
        assert.equal(api.armAttachmentInfo(...args, true), null);
        assert.equal(api.armAttachmentPlan(...args, true), null);
        plans++;
        if (!info.completeHere) {
          const url = new URL(
            api.makeStudyLink(catalog, 'whole-body', selected.id, side),
            'https://visible-medicine.invalid',
          );
          const parsed = api.parseStudyLink(
            Object.fromEntries(url.searchParams),
          );
          assert.equal(
            api.resolveStudyLink(catalog, 'whole-body', parsed).status,
            'ready',
          );
          links++;
        }
      }
    assert.equal(
      api.armAttachmentInfo(
        catalog,
        'whole-body',
        index === 0 ? 'left' : 'right',
        selected.id,
      ),
      null,
    );
  }
const selected = muscles[0];
for (const p of pins.entries) {
  const bad = structuredClone(catalog);
  bad.structures.find((s) => s.id === p.id).sources[0].sha256 = '0'.repeat(64);
  assert.equal(
    api.armAttachmentInfo(bad, 'whole-body', 'both', selected.id),
    null,
  );
  rejections++;
}
for (const change of [
  (c) => (c.sourceVersion = 'bad'),
  (c) => (c.license = 'bad'),
  (c) => (c.coordinateSystem.unitsPerMillimetre *= 2),
  (c) => c.structures.push(c.structures.find((s) => s.id === selected.id)),
  (c) => (c.structures = c.structures.filter((s) => s.id !== selected.id)),
  (c) => (c.structures.find((s) => s.id === selected.id).laterality = 'left'),
  (c) => (c.structures.find((s) => s.id === selected.id).anchor[0] += 1),
  (c) => (c.bundles.find((b) => b.id === selected.bundle).sha256 = 'bad'),
  (c) => c.bundles.push(c.bundles.find((b) => b.id === selected.bundle)),
]) {
  const bad = structuredClone(catalog);
  change(bad);
  assert.equal(
    api.armAttachmentPlan(bad, 'whole-body', 'both', selected.id),
    null,
  );
  rejections++;
}
for (const region of ['forearm', 'head-neck', 'bad'])
  assert.equal(
    api.armAttachmentInfo(catalog, region, 'both', selected.id),
    null,
  );
assert.equal(
  api.armAttachmentInfo(catalog, 'whole-body', 'bad', selected.id),
  null,
);
for (const s of catalog.structures.filter(
  (s) => !muscles.some((m) => m.id === s.id),
))
  assert.equal(
    api.armAttachmentInfo(catalog, 'whole-body', 'both', s.id),
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
  for (const region of ['whole-body', 'shoulder-arm']) {
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
    assert(
      html.includes('Muscle attachment relationships') && html.includes(s.name),
    );
    assert(
      html.includes('Proximal / origin') && html.includes('Distal / insertion'),
    );
    assert(
      html.includes('Specialist review pending') &&
        !/<details[^>]*\bopen=/.test(html),
    );
    const info = api.armAttachmentInfo(catalog, region, 'both', s.id);
    for (const r of info.rows) assert(html.includes(r.structure.name));
    if (!info.completeHere)
      assert(
        html.includes('Open this muscle in whole body') &&
          html.includes('outside this region'),
      );
    assert.equal(render({ ...props, disabled: true }), '');
  }
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
  handler &&
    wiring.includes('onSelect={select}') &&
    wiring.includes('onShow={showMuscleAttachments}') &&
    wiring.includes('disabled={exam}'),
);
let handlers = 0;
for (const s of muscles)
  for (const exam of [false, true]) {
    const calls = [];
    const env = {
      catalog,
      initialRegion: 'shoulder-arm',
      side: 'both',
      selectedId: s.id,
      exam,
      armAttachmentPlan: api.armAttachmentPlan,
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
console.log(
  JSON.stringify({
    muscles: 24,
    bones: 8,
    plans,
    crossRegionLinks: links,
    rejectedCatalogs: rejections,
    componentRenders: renders,
    parentHandlerCases: handlers,
    sourceMutation: false,
    clinicalApproval: false,
    browserAcceptance: false,
  }),
);
