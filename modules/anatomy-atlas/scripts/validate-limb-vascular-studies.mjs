import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { preLimbVascularRecipeProfiles } from './limb-vascular-recipe-history.mjs';
const code = await build({
  stdin: {
    contents:
      "export * from './content/limb-vascular-studies'; export * from './lib/limb-vascular-studies'; export * from './lib/body-display-catalog'; export * from './app/dissection-data'; export * from './lib/study-links'; export * from './lib/study-library'; export * from './lib/body-arrangement'; export * from './lib/explode-layout.mjs'; export {Vector3} from 'three';",
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
const raw = JSON.parse(
    await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  ),
  catalog = a.bodyDisplayCatalog(raw),
  pins = JSON.parse(await readFile('content/limb-vascular-study-pins.json'));
const before = JSON.stringify(catalog),
  oldProfiles = preLimbVascularRecipeProfiles(a.dissectionProfiles);
assert.equal(
  hash(oldProfiles),
  '81415083e7c3c46814191e79137160b90892a33f91191ca732dd7dff397c1dcc',
);
const corrupt = structuredClone(a.dissectionProfiles);
corrupt.hand.title = 'changed';
assert.notEqual(
  hash(preLimbVascularRecipeProfiles(corrupt)),
  hash(oldProfiles),
);
const ids = (s) => s.map((s) => s.id).sort(),
  sizes = {
    'calf-anterior-vessels': 16,
    'calf-posterior-vessels': 14,
    'thigh-deep-femoral-vessels': 16,
  };
let scopes = 0,
  links = 0,
  extractions = 0,
  rejections = 0,
  handlers = 0,
  renders = 0;
const extent = (box, axis) => {
  const c = box.getCenter(new a.Vector3()).dot(axis),
    size = box.getSize(new a.Vector3());
  const h =
    (Math.abs(axis.x) * size.x +
      Math.abs(axis.y) * size.y +
      Math.abs(axis.z) * size.z) /
    2;
  return [c - h, c + h];
};
for (const study of a.limbVascularStudySets) {
  const region = study.regions[0],
    profile = a.dissectionProfiles[region];
  assert(a.limbVascularStudyReady(catalog, region, study.id));
  assert.equal(a.limbVascularStudyReady(catalog, 'head-neck', study.id), false);
  assert(!profile.stages.some((s) => s.id === study.id));
  for (const side of ['both', 'right', 'left']) {
    scopes++;
    const scope = a.bodyStudyScope(catalog, region, side),
      state = a.dissectionReducer(a.initialDissection, {
        type: 'focus',
        id: study.id,
      });
    const visible = a.resolveDissection(scope, profile, state).visible;
    assert.equal(visible.length, sizes[study.id] / (side === 'both' ? 1 : 2));
    assert(visible.every((s) => side === 'both' || s.laterality === side));
    const expected = new Set([
      ...study.targetFmaIds,
      ...study.context.flatMap((r) => r.fmaIds),
    ]);
    assert.deepEqual(
      ids(visible),
      ids(scope.filter((s) => expected.has(s.fmaId))),
    );
    assert(
      !visible.some(
        (s) =>
          s.system === 'nerves' ||
          /fibular vein|sartorius|gastrocnemius|soleus/.test(s.sourceName),
      ),
    );
    const cards = a.studyLibrary(scope, profile),
      card = cards.find((c) => c.key === 'focus:' + study.id);
    assert.equal(card.recipes.length, 1);
    assert.equal(card.recipes[0].available, true);
    assert.deepEqual(a.studyLibraryAction(scope, profile, card.key, false), {
      kind: 'focus',
      id: study.id,
    });
    assert.equal(a.studyLibraryAction(scope, profile, card.key, true), null);
    const muscles = visible.filter((s) => s.system === 'muscles');
    assert(muscles.length);
    const removed = a.dissectionReducer(state, {
      type: 'remove',
      id: muscles[0].id,
    });
    assert(
      !a
        .resolveDissection(scope, profile, removed)
        .visible.some((s) => s.id === muscles[0].id),
    );
    assert.deepEqual(
      ids(
        a.resolveDissection(
          scope,
          profile,
          a.dissectionReducer(removed, { type: 'undo' }),
        ).visible,
      ),
      ids(visible),
    );
    assert.deepEqual(
      ids(
        a.resolveDissection(
          scope,
          profile,
          a.dissectionReducer(state, { type: 'undo' }),
        ).visible,
      ),
      ids(scope),
    );
    for (const s of visible) {
      const url = a.makeStudyLink(catalog, region, s.id, side, study.id);
      assert(url);
      links++;
      const parsed = a.parseStudyLink(
        Object.fromEntries(new URL(url, 'https://atlas.invalid').searchParams),
      );
      assert.equal(a.resolveStudyLink(catalog, region, parsed).status, 'ready');
      if (side !== 'both')
        assert.equal(
          a.makeStudyLink(
            catalog,
            region,
            s.id,
            side === 'right' ? 'left' : 'right',
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
          origin = a
            .arrangementBounds(visible, new Map())
            .getCenter(new a.Vector3()),
          axis = a.arrangementAxes(view).right;
        assert.equal(offsets.size, 1);
        assert(offsets.has(s.id));
        const moved = extent(
            a.translatedBox(s.bounds, offsets.get(s.id)),
            axis,
          ),
          rest = extent(
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
}
for (const pin of pins.entries) {
  const study = a.limbVascularStudySets.find(
    (s) =>
      s.targetFmaIds.includes(pin.fmaId) ||
      s.context.some((r) => r.fmaIds.includes(pin.fmaId)),
  );
  for (const mutate of [
    (s) => (s.sources[0].sha256 = 'changed'),
    (s) => (s.laterality = 'unspecified'),
    (s) => (s.regions = []),
  ]) {
    const bad = structuredClone(catalog);
    mutate(bad.structures.find((s) => s.id === pin.id));
    assert.equal(
      a.limbVascularStudyReady(bad, study.regions[0], study.id),
      false,
    );
    rejections++;
  }
}
for (const study of a.limbVascularStudySets) {
  const selected = catalog.structures.find(
      (s) => s.fmaId === study.targetFmaIds[0],
    ),
    region = study.regions[0];
  const href = a.makeStudyLink(catalog, region, selected.id, 'both', study.id),
    link = a.parseStudyLink(
      Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams),
    );
  const contextFma = study.context[0].fmaIds[0];
  for (const mutate of [
    (c) => (c.structures = c.structures.filter((s) => s.fmaId !== contextFma)),
    (c) =>
      c.structures.push(
        structuredClone(c.structures.find((s) => s.fmaId === contextFma)),
      ),
    (c) => (c.license = 'changed'),
    (c) => (c.sourceVersion = 'changed'),
    (c) => (c.coordinateSystem.sourceCenter = [1, 2, 3]),
    (c) => (c.bundles.find((b) => b.id === selected.bundle).sha256 = 'changed'),
  ]) {
    const bad = structuredClone(catalog);
    mutate(bad);
    assert.equal(a.limbVascularStudyReady(bad, region, study.id), false);
    assert.equal(a.resolveStudyLink(bad, region, link).status, 'rejected');
    rejections++;
  }
}
const source = await readFile('app/body-explorer.tsx', 'utf8'),
  ast = ts.createSourceFile(
    'body.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  ),
  functions = new Map();
function visit(n) {
  if (
    ts.isFunctionDeclaration(n) &&
    ['changeFocus', 'changeStage', 'openRelatedStudy'].includes(n.name?.text)
  )
    functions.set(
      n.name.text,
      ts.transpile(n.getText(ast), { target: ts.ScriptTarget.ES2022 }),
    );
  ts.forEachChild(n, visit);
}
visit(ast);
for (const study of a.limbVascularStudySets)
  for (const mode of ['valid', 'exam', 'source-changed']) {
    const calls = [],
      cameraRestore = { current: { pending: true } },
      env = {
        catalog,
        initialRegion: study.regions[0],
        profile: a.dissectionProfiles[study.regions[0]],
        exam: mode === 'exam',
        layout: 'tray',
        initialInspection: { plane: 'off' },
        allBodySystems: { skeleton: true, muscles: true, vessels: true },
        cameraRestore,
        limbVascularStudyReady:
          mode === 'source-changed' ? () => false : a.limbVascularStudyReady,
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
      env[name] = (v) => calls.push([name, typeof v === 'function' ? v(9) : v]);
    const result = runInNewContext(
      functions.get('changeFocus') + `;changeFocus('${study.id}');`,
      env,
    );
    handlers++;
    assert.equal(result, mode === 'valid');
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
    if (mode !== 'source-changed') {
      calls.length = 0;
      cameraRestore.current = { pending: true };
      runInNewContext(
        functions.get('changeStage') + `;changeStage('assembled');`,
        env,
      );
      handlers++;
      assert.equal(cameraRestore.current === null, mode === 'valid');
    }
  }
// A rejected related-study transition must not publish a false success notice.
const selected = catalog.structures.find((s) => s.fmaId === 'FMA44336'),
  calls = [];
runInNewContext(
  functions.get('openRelatedStudy') +
    `;openRelatedStudy('calf-anterior-vessels');`,
  {
    exam: false,
    selectedId: selected.id,
    selected,
    relatedViews: [
      { focusId: 'calf-anterior-vessels', visibleIds: [selected.id] },
    ],
    changeFocus: () => false,
    setSelectedId: (v) => calls.push(v),
    setSelectionNotice: (v) => calls.push(v),
    publishSelection: (v) => calls.push(v),
  },
);
assert.deepEqual(calls, []);
handlers++;
const require = createRequire(import.meta.url),
  React = require('react'),
  component = await componentBuild({
    entryPoints: ['app/study-library.tsx'],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
  }),
  mod = { exports: {} };
runInNewContext(component.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  require,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
for (const region of ['leg', 'thigh'])
  for (const side of ['both', 'right', 'left'])
    for (const disabled of [false, true]) {
      const scope = a.bodyStudyScope(catalog, region, side),
        html = require('react-dom/server').renderToStaticMarkup(
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
        for (const study of a.limbVascularStudySets.filter((s) =>
          s.regions.includes(region),
        ))
          assert(html.includes(study.title.replace('&', '&amp;')));
    }
assert.equal(JSON.stringify(catalog), before);
console.log(
  JSON.stringify({
    studies: 3,
    sourceSelections: 42,
    sideScopes: scopes,
    links,
    extractions,
    rejections,
    actualParentHandlers: handlers,
    actualComponentRenders: renders,
    priorRecipesUnchanged: true,
    geometryChanged: false,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
