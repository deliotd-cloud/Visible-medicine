import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { preArmVascularProfiles } from './arm-vascular-study-history.mjs';
const code = await build({
  stdin: {
    contents:
      "export * from './content/arm-vascular-studies'; export * from './lib/arm-vascular-studies'; export * from './lib/limb-vascular-studies'; export * from './lib/longus-colli'; export * from './lib/body-display-catalog'; export * from './app/dissection-data'; export * from './lib/study-links'; export * from './lib/study-library'; export * from './lib/body-arrangement'; export * from './lib/explode-layout.mjs'; export {Vector3} from 'three';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const a = await import(
  'data:text/javascript;base64,' +
    Buffer.from(code.outputFiles[0].text).toString('base64')
);
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const catalog = a.bodyDisplayCatalog(
  JSON.parse(
    await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  ),
);
const pins = JSON.parse(await readFile('content/arm-vascular-study-pins.json'));
const original = JSON.stringify(catalog),
  ids = (rows) => rows.map((s) => s.id).sort();
assert.equal(
  hash(preArmVascularProfiles(a.dissectionProfiles)),
  'e6cf75cd2ec70caffe461344b7d401c930102b77bcf0021e67a1dd28aadf6b7e',
);
const changed = structuredClone(a.dissectionProfiles);
changed.hand.title += 'changed';
assert.notEqual(
  hash(preArmVascularProfiles(changed)),
  hash(preArmVascularProfiles(a.dissectionProfiles)),
);
assert.equal(pins.entries.length, 22);
for (const b of pins.bundles)
  assert.equal(
    createHash('sha256')
      .update(await readFile('public' + b.url.split('?')[0]))
      .digest('hex'),
    b.sha256,
  );
let scopes = 0,
  links = 0,
  extractions = 0,
  rejected = 0,
  handlers = 0,
  renders = 0;
const extent = (box, axis) => {
  const c = box.getCenter(new a.Vector3()).dot(axis),
    s = box.getSize(new a.Vector3());
  const h =
    (Math.abs(axis.x) * s.x + Math.abs(axis.y) * s.y + Math.abs(axis.z) * s.z) /
    2;
  return [c - h, c + h];
};
for (const study of a.armVascularStudies) {
  assert.equal(
    a.armVascularStudyReady(null, study.regions[0], study.id),
    false,
  );
  assert.equal(a.armVascularStudyReady(catalog, 'hand', study.id), false);
  const exact = new Set([
    ...study.targetFmaIds,
    ...study.context.flatMap((r) => r.fmaIds),
  ]);
  for (const region of study.regions)
    for (const side of ['both', 'left', 'right']) {
      scopes++;
      assert(a.limbVascularStudyReady(catalog, region, study.id));
      const scope = a.bodyStudyScope(catalog, region, side),
        profile = a.dissectionProfiles[region];
      const state = a.dissectionReducer(a.initialDissection, {
        type: 'focus',
        id: study.id,
      });
      const visible = a.resolveDissection(scope, profile, state).visible;
      assert.deepEqual(
        ids(visible),
        ids(scope.filter((s) => exact.has(s.fmaId))),
      );
      assert.equal(
        visible.length,
        (study.id === 'arm-anterior-vessels' ? 14 : 12) /
          (side === 'both' ? 1 : 2),
      );
      assert(visible.every((s) => side === 'both' || s.laterality === side));
      assert(!visible.some((s) => s.system === 'nerves'));
      const cards = a
        .studyLibrary(scope, profile)
        .filter((c) => c.key === 'focus:' + study.id);
      assert.equal(cards.length, 1);
      assert.equal(cards[0].recipes.length, 1);
      assert.deepEqual(
        a.studyLibraryAction(scope, profile, cards[0].key, false),
        { kind: 'focus', id: study.id },
      );
      assert.equal(
        a.studyLibraryAction(scope, profile, cards[0].key, true),
        null,
      );
      const missingTargets = scope.filter(
        (s) => !study.targetFmaIds.includes(s.fmaId),
      );
      assert.equal(
        a.studyLibraryAction(missingTargets, profile, cards[0].key, false),
        null,
      );
      for (const muscle of visible.filter((s) => s.system === 'muscles')) {
        const removed = a.dissectionReducer(state, {
          type: 'remove',
          id: muscle.id,
        });
        assert(
          !a
            .resolveDissection(scope, profile, removed)
            .visible.some((s) => s.id === muscle.id),
        );
        const undone = a.dissectionReducer(removed, { type: 'undo' });
        assert.deepEqual(
          ids(a.resolveDissection(scope, profile, undone).visible),
          ids(visible),
        );
        assert.deepEqual(
          ids(
            a.resolveDissection(
              scope,
              profile,
              a.dissectionReducer(undone, { type: 'redo' }),
            ).visible,
          ),
          ids(visible.filter((s) => s.id !== muscle.id)),
        );
      }
      for (const s of visible) {
        const href = a.makeStudyLink(catalog, region, s.id, side, study.id);
        assert(href);
        links++;
        const parsed = a.parseStudyLink(
          Object.fromEntries(
            new URL(href, 'https://atlas.invalid').searchParams,
          ),
        );
        assert.equal(
          a.resolveStudyLink(catalog, region, parsed).status,
          'ready',
        );
        if (side !== 'both')
          assert.equal(
            a.makeStudyLink(
              catalog,
              region,
              s.id,
              side === 'left' ? 'right' : 'left',
              study.id,
            ),
            null,
          );
        for (const view of [
          'anterior',
          'posterior',
          'left',
          'right',
          'superior',
          'inferior',
        ]) {
          const offsets = a.extractionOffsets(visible, s.id, view),
            axis = a.arrangementAxes(view).right;
          const origin = a
            .arrangementBounds(visible, new Map())
            .getCenter(new a.Vector3());
          assert.equal(offsets.size, 1);
          assert(offsets.has(s.id));
          const moved = extent(
            a.translatedBox(s.bounds, offsets.get(s.id)),
            axis,
          );
          const rest = extent(
            a.arrangementBounds(
              visible.filter((t) => t.id !== s.id),
              new Map(),
            ),
            axis,
          );
          assert(moved[1] < rest[0] || moved[0] > rest[1]);
          extractions++;
          for (const item of visible) {
            assert.equal(
              a
                .bodyPresentationOffset(
                  item,
                  origin,
                  0,
                  'extract',
                  false,
                  offsets,
                )
                .lengthSq(),
              0,
            );
            if (item.id !== s.id)
              assert.equal(
                a
                  .bodyPresentationOffset(
                    item,
                    origin,
                    100,
                    'extract',
                    false,
                    offsets,
                  )
                  .lengthSq(),
                0,
              );
          }
        }
      }
    }
  const selected = catalog.structures.find(
    (s) => s.fmaId === study.targetFmaIds[0],
  );
  const href = a.makeStudyLink(
    catalog,
    study.regions[0],
    selected.id,
    'both',
    study.id,
  );
  const parsed = a.parseStudyLink(
    Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams),
  );
  const contextId = study.context[0].fmaIds[0];
  const mutations = [
    (c) => {
      c.sourceVersion += '-changed';
    },
    (c) => {
      c.license = 'changed';
    },
    (c) => {
      c.coordinateSystem.sourceCenter = [1, 2, 3];
    },
    (c) => {
      c.structures = c.structures.filter((s) => s.fmaId !== contextId);
    },
    (c) => {
      c.structures.push(
        structuredClone(c.structures.find((s) => s.fmaId === contextId)),
      );
    },
    (c) => {
      c.bundles.find((b) => b.id === selected.bundle).sha256 = 'changed';
    },
    (c) => {
      c.bundles = c.bundles.filter((b) => b.id !== selected.bundle);
    },
    (c) => {
      c.bundles.push(
        structuredClone(c.bundles.find((b) => b.id === selected.bundle)),
      );
    },
  ];
  for (const fma of exact)
    for (const field of ['sources', 'laterality', 'regions'])
      mutations.push((c) => {
        const s = c.structures.find((s) => s.fmaId === fma);
        if (field === 'sources') s.sources[0].sha256 = 'changed';
        else s[field] = field === 'regions' ? [] : 'unspecified';
      });
  for (const mutate of mutations) {
    const bad = structuredClone(catalog);
    mutate(bad);
    rejected++;
    assert.equal(
      a.armVascularStudyReady(bad, study.regions[0], study.id),
      false,
    );
    assert.equal(
      a.limbVascularStudyReady(bad, study.regions[0], study.id),
      false,
    );
    assert.equal(
      a.resolveStudyLink(bad, study.regions[0], parsed).status,
      'rejected',
    );
  }
}
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let callback;
function visit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'changeFocus')
    callback = ts.transpile(n.getText(ast), { target: ts.ScriptTarget.ES2022 });
  ts.forEachChild(n, visit);
}
visit(ast);
assert(callback);
for (const study of a.armVascularStudies)
  for (const region of study.regions)
    for (const mode of ['valid', 'exam', 'source-changed']) {
      const bad = structuredClone(catalog);
      bad.structures.find((s) => s.fmaId === study.targetFmaIds[0]).laterality =
        'unspecified';
      const calls = [],
        cameraRestore = { current: { pending: true } };
      const env = {
        catalog: mode === 'source-changed' ? bad : catalog,
        side: 'both',
        initialRegion: region,
        profile: a.dissectionProfiles[region],
        exam: mode === 'exam',
        layout: 'tray',
        initialInspection: { plane: 'off' },
        allBodySystems: {},
        cameraRestore,
        limbVascularStudyReady: a.limbVascularStudyReady,
        longusColliStudyReady: a.longusColliStudyReady,
        dispatch: (v) => calls.push(['dispatch', v]),
      };
      for (const name of [
        'setInspection',
        'setPlate',
        'setLayout',
        'setSystems',
        'setSelectedId',
        'setFocus',
        'setIsolated',
        'setExplode',
        'setZoom',
        'setView',
        'setReset',
      ])
        env[name] = (v) =>
          calls.push([name, typeof v === 'function' ? v(9) : v]);
      assert.equal(
        runInNewContext(callback + `;changeFocus('${study.id}');`, env),
        mode === 'valid',
      );
      handlers++;
      if (mode === 'valid') {
        assert.equal(cameraRestore.current, null);
        assert.deepEqual(
          JSON.parse(JSON.stringify(calls.find((c) => c[0] === 'dispatch')[1])),
          { type: 'focus', id: study.id },
        );
        assert.equal(calls.find((c) => c[0] === 'setView')[1], study.view);
        assert.equal(calls.find((c) => c[0] === 'setExplode')[1], 0);
      } else {
        assert.deepEqual(calls, []);
        assert.deepEqual(cameraRestore.current, { pending: true });
      }
    }
const require = createRequire(import.meta.url),
  React = require('react');
const component = await componentBuild({
  entryPoints: ['app/study-library.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
const mod = { exports: {} };
runInNewContext(component.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  require,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
for (const region of ['shoulder-arm', 'whole-body'])
  for (const side of ['both', 'left', 'right'])
    for (const disabled of [false, true]) {
      const scope = a.bodyStudyScope(catalog, region, side);
      const html = require('react-dom/server').renderToStaticMarkup(
        React.createElement(mod.exports.StudyLibrary, {
          profile: a.dissectionProfiles[region],
          state: a.initialDissection,
          structures: scope,
          visibleIds: ids(scope),
          loaded: scope.map((s) => s.bundle),
          failed: [],
          disabled,
          onStage() {},
          onFocus() {},
        }),
      );
      renders++;
      if (disabled) assert(html.includes('End practice'));
      else
        for (const study of a.armVascularStudies)
          assert(html.includes(study.title.replace('&', '&amp;')));
    }
assert.equal(JSON.stringify(catalog), original);
console.log(
  JSON.stringify({
    studies: 2,
    sourceSelections: 22,
    scopes,
    links,
    extractions,
    sourceRejections: rejected,
    actualParentHandlers: handlers,
    actualReactRenders: renders,
    priorRecipesUnchanged: true,
    geometryChanged: false,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
