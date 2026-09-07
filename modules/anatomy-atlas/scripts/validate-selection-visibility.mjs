import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
let checks = 0,
  scopeCases = 0,
  clippingCases = 0,
  handlerCases = 0;
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: {
    contents:
      "export * from 'three'; export * from './lib/selection-visibility'; export * from './lib/inspection-state'; export * from './lib/inspection-geometry'; export * from './lib/body-arrangement'; export * from './lib/shoulder-arrangement'; export * from './app/anatomy-data';",
    loader: 'ts',
    resolveDir: root,
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const a = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
const catalog = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
const manifest = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/manifest.json'),
);
const original = JSON.stringify(catalog),
  originalManifest = JSON.stringify(manifest);
const box = (bounds) =>
  new a.Box3(new a.Vector3(...bounds.min), new a.Vector3(...bounds.max));
const shoulder = a.shoulderArrangementItems(a.structures);
const scopes = [shoulder];
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)])
  for (const side of ['both', 'left', 'right'])
    scopes.push(
      catalog.structures.filter(
        (s) =>
          (region === 'whole-body' || s.regions.includes(region)) &&
          (side === 'both' ||
            s.laterality === side ||
            ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
      ),
    );
same(a.selectionBounds([]), null);
same(
  a.selectionBounds([{ bounds: { min: [0, 0, 0], max: [-1, 1, 1] } }]),
  null,
);
same(
  a.selectionBounds([{ bounds: { min: [0, NaN, 0], max: [1, 1, 1] } }]),
  null,
);
same(
  a.selectionBounds(manifest.parts, -3.15),
  a.selectionBounds(shoulder),
  'Shoulder status shares the cropped source frame',
);
for (const scope of scopes) {
  const frame = a.selectionBounds(scope),
    frameBox = box(frame);
  const identity = JSON.stringify(scope);
  for (const plane of ['axial', 'coronal', 'sagittal'])
    for (const position of [0, 25, 50, 75, 100])
      for (const flipped of [false, true]) {
        const inspection = { ...a.initialInspection, plane, position, flipped };
        const cut = a.sectionPlanes(frameBox, inspection)[0];
        for (const item of scope) {
          const report = a.selectionVisibility({
            system: item.system,
            enabled: true,
            bounds: item.bounds,
            frame,
            inspection,
          });
          const distances = [];
          for (const x of [item.bounds.min[0], item.bounds.max[0]])
            for (const y of [item.bounds.min[1], item.bounds.max[1]])
              for (const z of [item.bounds.min[2], item.bounds.max[2]])
                distances.push(cut.distanceToPoint(new a.Vector3(x, y, z)));
          same(
            report.clipped,
            Math.min(...distances) < -1e-7,
            'Status matches real renderer plane on all entry bounds',
          );
          same(
            report.reasons.includes('Selection clipped by cutaway'),
            Math.max(...distances) < -1e-7,
            'Fully clipped is claimed only for fully rejected bounds',
          );
          const recovered = a.recoverSelectionInspection(inspection, report);
          same(recovered.plane, inspection.plane);
          same(recovered.position, position);
          same(recovered.flipped, flipped);
          same(recovered.opacity, inspection.opacity);
          const after = a.selectionVisibility({
            system: item.system,
            enabled: true,
            bounds: item.bounds,
            frame,
            inspection: recovered,
          });
          same(after.reasons.length, 0);
          const ordinary = a.sectionPlanes(
            frameBox,
            recovered,
            new a.Vector3(),
            false,
          );
          same(ordinary.length, 1, 'Other structures still use the cutaway');
          same(ordinary[0].constant, cut.constant);
          same(
            a.sectionPlanes(frameBox, recovered, new a.Vector3(), true).length,
            report.clipped ? 0 : 1,
          );
          clippingCases++;
        }
      }
  same(JSON.stringify(scope), identity);
  scopeCases++;
}
// Presentation translations do not alter status; validate against all three real layout transforms.
for (const scope of [
  shoulder,
  catalog.structures.filter((s) => s.regions.includes('head-neck')),
]) {
  const frame = a.selectionBounds(scope),
    frameBox = box(frame),
    center = frameBox.getCenter(new a.Vector3());
  for (const layout of ['spatial', 'extract', 'tray'])
    for (const amount of [0, 37, 100]) {
      const target = scope[0],
        inspection = {
          ...a.initialInspection,
          plane: 'coronal',
          position: 62,
          keepSelectedUncut: true,
        };
      const offsets =
        scope === shoulder
          ? a.shoulderPresentationOffsets(
              scope,
              'anterior',
              amount,
              layout,
              target.id,
              false,
            )
          : new Map(
              scope.map((s) => [
                s.id,
                a.bodyPresentationOffset(
                  s,
                  center,
                  amount,
                  layout,
                  false,
                  layout === 'extract'
                    ? a.extractionOffsets(scope, target.id, 'anterior')
                    : a.arrangeBodyStructures(scope, center, 'anterior')
                        .offsets,
                ),
              ]),
            );
      for (const item of scope) {
        const selected = item.id === target.id,
          offset = offsets.get(item.id);
        const planes = a.sectionPlanes(frameBox, inspection, offset, selected);
        same(planes.length, selected ? 0 : 1);
        if (!selected) {
          const originalPlane = a.sectionPlanes(frameBox, inspection)[0];
          check(
            Math.abs(
              originalPlane.distanceToPoint(new a.Vector3(...item.center)) -
                planes[0].distanceToPoint(
                  new a.Vector3(...item.center).add(offset),
                ),
            ) < 1e-7,
          );
        }
      }
    }
}
for (const solid of [false, true])
  for (const opacity of [0, 5, 19, 20, 50, 100, NaN])
    for (const enabled of [false, true])
      for (const removed of [false, true]) {
        const inspection = {
          ...a.initialInspection,
          keepSelectedSolid: solid,
          opacity: { muscles: opacity, nerves: 15 },
        };
        const before = JSON.stringify(inspection);
        const report = a.selectionVisibility({
          system: 'muscles',
          enabled,
          removed,
          bounds: null,
          frame: null,
          inspection,
        });
        same(report.systemOff, !enabled);
        same(report.removed, removed);
        same(
          report.reasons.includes('Too transparent to select on the model'),
          a.systemOpacity(inspection, 'muscles', true) < 0.2,
        );
        const next = a.recoverSelectionInspection(inspection, report);
        same(a.systemOpacity(next, 'muscles', true), 1);
        same(
          next.opacity,
          inspection.opacity,
          'No other tissue opacity changes',
        );
        same(JSON.stringify(inspection), before);
      }
// Exact explorer recovery closures: no camera, mode, selection, arrangement,
// imaging publication or blanket reset functions are even available to the harness.
const printer = ts.createPrinter({ removeComments: true });
for (const kind of ['body', 'shoulder']) {
  const source = await fs.readFile(`app/${kind}-explorer.tsx`, 'utf8');
  const ast = ts.createSourceFile(
    'entry.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let fn;
  function visit(n) {
    if (ts.isFunctionDeclaration(n) && n.name?.text === 'revealSelection')
      fn = n;
    ts.forEachChild(n, visit);
  }
  visit(ast);
  check(fn);
  const code = ts.transpileModule(
    printer.printNode(ts.EmitHint.Unspecified, fn, ast),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  for (const selected of [
    null,
    ...(kind === 'body' ? catalog.structures : a.structures),
  ])
    for (const exam of [false, true]) {
      const state = {
        inspection: {
          ...a.initialInspection,
          plane: 'axial',
          position: 33,
          flipped: true,
          opacity: { muscles: 15 },
        },
        systems: { muscles: false, skeleton: false, nerves: false },
        actions: [],
      };
      const ctx = {
        selected,
        selectedVisibility: selected
          ? { removed: true, systemOff: true, clipped: true, opacity: 0.15 }
          : null,
        exam,
        mode: exam ? 'exam' : 'study',
        recoverSelectionInspection: a.recoverSelectionInspection,
        dispatch: (action) => state.actions.push({ ...action }),
        setSystems: (update) => (state.systems = update(state.systems)),
        setVisibleSystems: (update) => (state.systems = update(state.systems)),
        setInspection: (update) =>
          (state.inspection = update(state.inspection)),
      };
      const before = JSON.stringify(state);
      // Shoulder always has a selected entry in its component contract.
      if (kind === 'shoulder' && !selected) continue;
      runInNewContext(code + ';revealSelection();', ctx);
      if (exam || !selected) same(JSON.stringify(state), before);
      else {
        same(state.inspection.plane, 'axial');
        same(state.inspection.position, 33);
        same(state.inspection.flipped, true);
        same(state.inspection.keepSelectedUncut, true);
        same(state.inspection.keepSelectedSolid, true);
        same(state.systems[selected.system], true);
        same(
          state.actions,
          kind === 'body' ? [{ type: 'restore', id: selected.id }] : [],
        );
      }
      handlerCases++;
    }
}
// AST wiring check on both real model loops: selected context reaches clipping;
// original-position ghosts still call without the selected exemption.
for (const file of ['app/body-scene.tsx', 'app/anatomy-scene.tsx']) {
  const source = await fs.readFile(file, 'utf8');
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const calls = [];
  function visit(n) {
    if (ts.isCallExpression(n) && n.expression.getText(ast) === 'sectionPlanes')
      calls.push(n);
    ts.forEachChild(n, visit);
  }
  visit(ast);
  same(
    calls.filter((c) => c.arguments[3]?.getText(ast) === 'selected').length,
    1,
  );
  check(
    calls.some((c) => c.arguments.length < 4),
    'Origin/reference anatomy is not exempt',
  );
}
const require = createRequire(import.meta.url),
  React = require('react'),
  { renderToStaticMarkup } = require('react-dom/server');
const ui = await componentBuild({
  entryPoints: ['app/selection-visibility-notice.tsx'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
});
const uiModule = { exports: {} };
runInNewContext(ui.outputFiles[0].text, {
  module: uiModule,
  exports: uiModule.exports,
  require,
});
for (const report of [
  null,
  { reasons: [], uncut: false },
  { reasons: ['System switched off'], uncut: false },
  { reasons: [], uncut: true },
]) {
  const calls = [],
    props = {
      name: 'Test selection',
      report,
      onRecover: () => calls.push('recover'),
      onReapply: () => calls.push('reapply'),
    };
  const tree = uiModule.exports.SelectionVisibilityNotice(props);
  const html = renderToStaticMarkup(
    React.createElement(uiModule.exports.SelectionVisibilityNotice, props),
  );
  if (!report || (!report.reasons.length && !report.uncut)) {
    same(tree, null);
    same(html, '');
  } else {
    check(html.includes('<output aria-live="polite" aria-atomic="true"'));
    check(html.includes('Test selection'));
    tree.props.children[1].props.onClick();
    same(calls, [report.reasons.length ? 'recover' : 'reapply']);
  }
}
same(JSON.stringify(catalog), original);
same(JSON.stringify(manifest), originalManifest);
const result = {
  passed: true,
  checks,
  scopeCases,
  clippingCases,
  handlerCases,
  sourceGeometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
  limitations:
    'Source-bound status compared with actual Three clipping planes; all regional sides plus cropped shoulder; real presentation offsets, exact recovery closures, model-loop AST wiring and installed notice UI SSR. No screen-occlusion, GPU pixels, browser focus/touch or clinical acceptance.',
};
await fs.writeFile(
  'docs/selection-visibility-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
