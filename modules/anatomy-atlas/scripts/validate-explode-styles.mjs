import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import * as React from 'react';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: `export * from 'three';
 export * from './lib/body-arrangement'; export * from './lib/shoulder-arrangement';
 export * from './lib/explode-layout.mjs'; export * from './lib/study-views';
 export * from './lib/inspection-geometry'; export * from './lib/inspection-state';
 export * from './lib/anatomy-load-state'; export * from './lib/scene-labels';
 export * from './lib/origin-guides';
 export * from './lib/close-up-labels'; export * from './lib/body-display-catalog';
 export * from './app/anatomy-data'; export * from './app/body-types';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const a = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const require = createRequire(import.meta.url);
const rawCatalog = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const catalog = a.bodyDisplayCatalog(rawCatalog);
const manifest = JSON.parse(
  await readFile('public/models/bodyparts3d/manifest.json', 'utf8'),
);
const original = JSON.stringify({ catalog, manifest, shoulder: a.structures });
let checks = 0,
  extractionCases = 0,
  sceneCases = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const same = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  checks++;
};
const near = (x, y, message) => check(Math.abs(x - y) < 1e-7, message);
const vector = (x, y) =>
  x
    .toArray()
    .forEach((value, index) =>
      near(value, y.toArray()[index], 'Translation matches'),
    );
const views = [
  'anterior',
  'posterior',
  'left',
  'right',
  'superior',
  'inferior',
];
function extent(box, axis) {
  const center = box.getCenter(new a.Vector3()).dot(axis),
    size = box.getSize(new a.Vector3());
  const half =
    (Math.abs(axis.x) * size.x +
      Math.abs(axis.y) * size.y +
      Math.abs(axis.z) * size.z) /
    2;
  return [center - half, center + half];
}
function extractCheck(items, selected, view) {
  const targets = a.extractionOffsets(items, selected.id, view);
  same(
    targets.size,
    items.length > 1 ? 1 : 0,
    'Only the selected entry has a destination',
  );
  const origin = a
    .arrangementBounds(items, new Map())
    .getCenter(new a.Vector3());
  if (items.length > 1) {
    const axis = a.arrangementAxes(view).right;
    const moved = extent(
      a.translatedBox(selected.bounds, targets.get(selected.id)),
      axis,
    );
    const rest = extent(
      a.arrangementBounds(
        items.filter((item) => item.id !== selected.id),
        new Map(),
      ),
      axis,
    );
    check(
      moved[1] < rest[0] || moved[0] > rest[1],
      '100% extraction clears the preset projection',
    );
  }
  for (const amount of [0, 25, 50, 100, -12, 160, NaN, Infinity]) {
    const value = Number.isFinite(amount)
      ? Math.max(0, Math.min(100, amount)) / 100
      : 0;
    const offset = a.bodyPresentationOffset(
      selected,
      origin,
      amount,
      'extract',
      true,
      targets,
    );
    vector(
      offset,
      (targets.get(selected.id)?.clone() ?? new a.Vector3()).multiplyScalar(
        value,
      ),
    );
    const other = items.find((item) => item.id !== selected.id);
    if (other)
      vector(
        a.bodyPresentationOffset(
          other,
          origin,
          amount,
          'extract',
          false,
          targets,
        ),
        new a.Vector3(),
      );
    // Clipping remains in source coordinates while the display moves.
    const frame = a.arrangementBounds(items, new Map());
    const inspection = {
      ...a.initialInspection,
      plane: 'coronal',
      position: 57,
    };
    const originalPlanes = a.sectionPlanes(frame, inspection);
    const movedPlanes = a.sectionPlanes(frame, inspection, offset);
    const sourcePoint = a
      .translatedBox(selected.bounds)
      .getCenter(new a.Vector3());
    originalPlanes.forEach((plane, index) =>
      near(
        plane.distanceToPoint(sourcePoint),
        movedPlanes[index].distanceToPoint(sourcePoint.clone().add(offset)),
        'Cutaways follow extraction',
      ),
    );
  }
  extractionCases++;
}

// Every body entry is exercised in each standard view in its first registered region.
for (const item of catalog.structures) {
  const region = item.regions[0];
  const scope = catalog.structures.filter((candidate) =>
    candidate.regions.includes(region),
  );
  for (const view of views) extractCheck(scope, item, view);
}
const shoulder = a.shoulderArrangementItems(a.structures);
same(shoulder.length, 9, 'Nine source-registered shoulder entries');
for (const item of shoulder) {
  check(item.bounds.min[1] >= -3.15, 'Existing shoulder crop retained');
  for (const view of ['anterior', 'posterior', 'right']) {
    extractCheck(shoulder, item, view);
    for (const layout of ['spatial', 'extract', 'tray']) {
      for (const amount of [0, 20, 40, 70, 100]) {
        const offsets = a.shoulderPresentationOffsets(
          shoulder,
          view,
          amount,
          layout,
          item.id,
          true,
        );
        for (const entry of shoulder) {
          const offset = offsets.get(entry.id);
          if (!amount) vector(offset, new a.Vector3());
          if (layout === 'spatial')
            vector(
              offset,
              a.shoulderOffset(
                entry.id.split(':').at(-1),
                amount,
                entry.system === 'skeleton',
              ),
            );
          if (layout === 'extract' && entry.id !== item.id)
            vector(offset, new a.Vector3());
          if (layout === 'extract' && entry.id === item.id)
            vector(
              offset,
              a
                .extractionOffsets(shoulder, item.id, view)
                .get(item.id)
                .multiplyScalar(amount / 100),
            );
        }
        const bounds = a.arrangementBounds(shoulder, offsets);
        check(!bounds.isEmpty(), 'Moved shoulder has camera bounds');
        for (const entry of shoulder)
          check(
            bounds.containsBox(
              a.translatedBox(entry.bounds, offsets.get(entry.id)),
            ),
            'Camera bounds contain moved source',
          );
      }
    }
    const targets = a.arrangeBodyStructures(
      shoulder,
      a.arrangementBounds(shoulder, new Map()).getCenter(new a.Vector3()),
      view,
    );
    const offsets = a.shoulderPresentationOffsets(
      shoulder,
      view,
      100,
      'tray',
      item.id,
      true,
    );
    for (const entry of shoulder)
      vector(offsets.get(entry.id), targets.offsets.get(entry.id));
    for (let i = 0; i < shoulder.length; i++)
      for (let j = i + 1; j < shoulder.length; j++) {
        const axes = a.arrangementAxes(view);
        const boxes = [shoulder[i], shoulder[j]].map((entry) =>
          a.translatedBox(entry.bounds, offsets.get(entry.id)),
        );
        check(
          [axes.right, axes.up].some((axis) => {
            const [x, y] = boxes.map((box) => extent(box, axis));
            return Math.max(x[0] - y[1], y[0] - x[1]) >= targets.gap - 1e-7;
          }),
          'Shoulder tray entry rectangles do not overlap at 100%',
        );
      }
  }
}
for (const items of [[], shoulder, catalog.structures])
  for (const id of [null, 'absent-id'])
    same(
      a.extractionOffsets(items, id, 'anterior').size,
      0,
      'Missing/hidden selection never moves other anatomy',
    );
same(
  a.extractionOffsets([shoulder[0]], shoulder[0].id, 'anterior').size,
  0,
  'No artificial extraction without context',
);

const base = {
  kind: 'body',
  region: 'whole-body',
  revision: 'test-revision',
  selectedId: null,
  view: 'anterior',
  side: 'both',
  layer: 'cuff',
  systems: Object.fromEntries(
    Object.keys(a.bodySystems).map((key) => [key, true]),
  ),
  hiddenIds: [],
  explode: 65,
  zoom: 1,
  isolated: false,
  focus: false,
  labels: true,
  ghostRemoved: false,
  illustrated: true,
  anchorSkeleton: true,
  showOrigins: true,
  plate: false,
  inspection: a.initialInspection,
  camera: null,
};
for (const kind of ['body', 'shoulder'])
  for (const layout of ['spatial', 'extract', 'tray']) {
    const state = {
      ...base,
      kind,
      layout,
      plate: layout === 'tray',
      ...(kind === 'shoulder'
        ? {
            region: 'shoulder-pilot',
            side: 'right',
            systems: { skeleton: true, muscles: true, 'soft-tissue': true },
          }
        : {}),
    };
    same(
      a.parseStudyView(state),
      state,
      'Chosen mechanism round-trips through validated bookmarks',
    );
    if (layout === 'tray')
      same(
        a.parseStudyView({ ...state, plate: false }),
        null,
        'A tray bookmark must use orthographic projection',
      );
  }
same(
  a.parseStudyView(base),
  base,
  'Legacy bookmark without mechanism stays valid',
);
for (const layout of ['hinge', 'peel', {}, null, 1])
  same(
    a.parseStudyView({ ...base, layout }),
    null,
    'Unvalidated modes and malformed values rejected',
  );

// Execute the exact React selector and scene entry points. Hooks and GPU are
// injected; actual Three transforms, source manifests and JSX output are used.
function component(source, replacements) {
  const result = { exports: {} };
  runInNewContext(
    transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'automatic' })
      .code,
    {
      module: result,
      exports: result.exports,
      Map,
      require: (name) => {
        if (name === 'react/jsx-runtime') return require(name);
        if (name === 'react') return { ...React, useMemo: (fn) => fn() };
        if (name === 'three') return a;
        if (Object.hasOwn(replacements, name)) return replacements[name];
        throw Error('Unexpected component import: ' + name);
      },
    },
  );
  return result.exports;
}
const selectSource = await readFile('app/explode-style-select.tsx', 'utf8');
const select = component(selectSource, {
  '@/components/ui/select': Object.fromEntries(
    [
      'Select',
      'SelectContent',
      'SelectItem',
      'SelectTrigger',
      'SelectValue',
    ].map((name) => [name, name]),
  ),
  './explode-style-select.css': {},
}).ExplodeStyleSelect;
for (const disabled of [false, true]) {
  const changes = [],
    tree = select({
      value: 'extract',
      disabled,
      onChange: (value) => changes.push(value),
    });
  same(
    tree.props.value,
    'extract',
    'Current style reflected in controlled selector',
  );
  same(
    tree.props.disabled,
    disabled,
    'Exam guard passed into select primitive',
  );
  for (const value of ['spatial', 'extract', 'tray', null, 'hinge'])
    tree.props.onValueChange(value);
  same(
    changes,
    disabled ? [] : ['spatial', 'extract', 'tray'],
    'Native value handler admits only supported modes and respects exam',
  );
  same(
    tree.props.children[0].props['aria-label'],
    'Explode style',
    'Accessible selector name',
  );
}
// Execute the actual explorer handlers, including repeat-choice and exam guards.
for (const kind of ['body', 'shoulder']) {
  const source = await readFile(`app/${kind}-explorer.tsx`, 'utf8');
  const file = ts.createSourceFile(
    'explorer.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let handler;
  function find(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'changeLayout')
      handler = node.getText(file);
    ts.forEachChild(node, find);
  }
  find(file);
  check(handler, 'Explorer has a mechanism handler');
  const code = transformSync(handler, { loader: 'ts', format: 'cjs' }).code;
  for (const layout of ['spatial', 'extract', 'tray'])
    for (const next of ['spatial', 'extract', 'tray'])
      for (const exam of [false, true]) {
        const state = {};
        const setters = Object.fromEntries(
          [
            'Layout',
            'Plate',
            'Explode',
            'Focus',
            'Isolated',
            'Zoom',
            'Reset',
            'ResetNonce',
          ].map((name) => [
            `set${name}`,
            (value) => {
              state[name] = typeof value === 'function' ? value(4) : value;
            },
          ]),
        );
        runInNewContext(code + `;changeLayout(${JSON.stringify(next)});`, {
          ...setters,
          layout,
          exam,
          mode: exam ? 'exam' : 'study',
        });
        if (exam || next === layout)
          same(state, {}, 'Disabled or repeated choice never resets a study');
        else {
          same(state.Layout, next, 'Actual presentation state changes');
          same(
            state.Explode,
            next === 'spatial' ? 0 : 100,
            'New styles open at a useful endpoint',
          );
          same(
            state.Plate,
            next === 'tray',
            'Tray and projection cannot disagree',
          );
          same(state.Isolated, false, 'Switching style restores context');
          same(state.Zoom, 1, 'Switching style refits the scope');
          same(
            state[kind === 'body' ? 'Reset' : 'ResetNonce'],
            5,
            'Camera resets for the chosen style',
          );
        }
      }
}
const replacements = {
  '@react-three/fiber': {},
  '@react-three/drei': { Html: 'Html', Line: 'Line' },
  './anatomy-canvas': { AnatomyCanvas: 'Canvas' },
  './fitted-camera': { FittedCamera: 'FittedCamera' },
  '@/lib/explode-layout.mjs': a,
  '@/lib/body-arrangement': a,
  '@/lib/shoulder-arrangement': a,
  '@/public/models/bodyparts3d/manifest.json': manifest,
  './body-types': a,
  '@/lib/inspection-geometry': a,
  '@/lib/inspection-state': a,
  '@/lib/origin-guides': a,
  '@/lib/close-up-labels': a,
  './scene-orientation': { SceneOrientation: 'SceneOrientation' },
  './scene-orientation.css': {},
  '@/components/ui/button': { Button: 'Button' },
  './scene-recovery': {
    SceneRecovery: 'SceneRecovery',
    RendererMonitor: 'RendererMonitor',
  },
  './scene-label-layer': {
    SceneLabel: 'SceneLabel',
    SceneLabelLayer: 'SceneLabelLayer',
  },
  './anatomy-tissue': { AnatomyTissue: 'AnatomyTissue' },
  './body-batch': { useBodyBatch: () => null },
  '@/lib/body-batching': { bodyBatchActive: () => false },
  '@/lib/neuroanatomy': {},
  '@/lib/scene-labels': a,
  '@/lib/anatomy-vessels': {},
  '@/lib/anatomy-load-state': a,
};
const bodyScene = component(
  await readFile('app/body-scene.tsx', 'utf8'),
  replacements,
).BodyScene;
const shoulderScene = component(
  await readFile('app/anatomy-scene.tsx', 'utf8'),
  replacements,
).AnatomyScene;
function flatten(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(flatten);
  return [
    tree,
    ...flatten(
      tree.type === 'SceneRecovery'
        ? tree.props.children(() => {})
        : tree.props?.children,
    ),
  ];
}
for (const kind of ['body', 'shoulder'])
  for (const layout of ['spatial', 'extract', 'tray'])
    for (const exam of [false, true]) {
      const scope =
        kind === 'body'
          ? catalog.structures.filter((item) =>
              item.regions.includes('head-neck'),
            )
          : a.structures;
      const props = {
        ...base,
        catalog,
        structures: scope,
        selectedId: scope[0].id,
        visibleSystems: { skeleton: true, muscles: true, 'soft-tissue': true },
        view: 'anterior',
        explode: 100,
        layout,
        exam,
        plate: false,
        hiddenIds: [],
        ghostRemoved: false,
        landmarks: [],
        inspection: a.initialInspection,
      };
      const elements = flatten(
        (kind === 'body' ? bodyScene : shoulderScene)(props),
      );
      const canvas = elements.find((element) => element.type === 'Canvas');
      same(
        canvas.props.orthographic,
        !exam && layout === 'tray',
        'Tray projection is consistent in both scene entry points',
      );
      const camera = elements.find(
        (element) => element.type === 'FittedCamera',
      );
      same(
        camera.props.planar,
        !exam && layout === 'tray',
        'Tray permits pan/zoom without rotation',
      );
      const model = elements.find(
        (element) => element.props?.offsets instanceof Map,
      );
      check(model, 'Actual model receives the computed display offsets');
      for (const [id, offset] of model.props.offsets) {
        if (exam || (layout === 'extract' && id !== scope[0].id))
          near(
            offset.length(),
            0,
            'Exam and nonselected structures stay assembled',
          );
      }
      const entries =
        kind === 'body'
          ? scope
          : a.shoulderArrangementItems(
              scope.filter(
                (item) =>
                  props.visibleSystems[item.system] &&
                  ((!exam && item.id === props.selectedId) ||
                    !['deltoid', 'biceps-long-head'].includes(
                      item.id.split(':').at(-1),
                    )),
              ),
            );
      same(
        model.props.offsets.size,
        entries.length,
        'Offsets include only the currently rendered source entries',
      );
      for (const entry of entries)
        check(
          camera.props.bounds.containsBox(
            a.translatedBox(entry.bounds, model.props.offsets.get(entry.id)),
          ),
          `Scene camera fits mesh/label/cutaway offsets: ${kind}/${layout}/${entry.id}`,
        );
      sceneCases++;
    }
same(
  JSON.stringify({ catalog, manifest, shoulder: a.structures }),
  original,
  'Source metadata and registration are untouched',
);
const result = {
  passed: true,
  checks,
  extractionCases,
  sceneCases,
  bodyEntries: catalog.structures.length,
  shoulderEntries: shoulder.length,
  limitations:
    'CPU/component verification with injected hooks and GPU. Not browser pixel, touch or clinical validation. Clearance uses source-entry bounds in standard aligned projections, not intermediate steps, arbitrary orbit angles or parts within compound groups.',
};
await writeFile(
  'docs/explode-styles-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
