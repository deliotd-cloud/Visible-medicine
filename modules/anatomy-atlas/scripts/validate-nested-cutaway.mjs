/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled callbacks, not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
  );
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles';
    export * from './app/cutaway-controls'; export * from './lib/nested-anatomy';
    export * from './lib/inspection-state'; export * from './lib/inspection-geometry';
    export * from './lib/selection-visibility'; export {Box3, Vector3} from 'three';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'gpu-only',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents:
            'export const BodyScene=()=>null; export const retryBodyAssets=()=>{};',
          loader: 'tsx',
        }));
      },
    },
  ],
});
let active = false,
  cursor = 0,
  slots = [];
const shim = {
  ...React,
  useState(value) {
    if (!active) return React.useState(value);
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
    return [
      slots[i],
      (next) => {
        slots[i] = typeof next === 'function' ? next(slots[i]) : next;
      },
    ];
  },
  useReducer(reducer, arg, init) {
    if (!active) return React.useReducer(reducer, arg, init);
    const i = cursor++;
    if (!(i in slots)) slots[i] = init ? init(arg) : arg;
    return [
      slots[i],
      (action) => {
        slots[i] = reducer(slots[i], action);
      },
    ];
  },
  useMemo: (fn, deps) => (active ? fn() : React.useMemo(fn, deps)),
  useCallback: (fn, deps) => (active ? fn : React.useCallback(fn, deps)),
};
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  require: (id) => (id === 'react' ? shim : require(id)),
});
const api = scope.exports;
const catalog = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const targets = api
  .nestedStudyTargets(catalog)
  .filter((t) => t.study !== 'eye');
const cases = [
  ...new Map(targets.map((t) => [`${t.study}/${t.parentId}`, t])).values(),
];
same(cases.length, 9);
const nodes = (n) =>
  !n || typeof n !== 'object'
    ? []
    : Array.isArray(n)
      ? n.flatMap(nodes)
      : [n, ...nodes(n.props?.children)];
const text = (n) =>
  typeof n === 'string'
    ? n
    : !n
      ? ''
      : Array.isArray(n)
        ? n.map(text).join('')
        : text(n.props?.children);
const { renderToStaticMarkup } = require('react-dom/server');
let geometryCases = 0;
for (const target of cases) {
  const parent = catalog.structures.find((s) => s.id === target.parentId);
  const props = { parent, study: target.study };
  const layers = api.nestedPartsFor(parent, target.study);
  let tree;
  slots = [];
  const render = () => {
    active = true;
    cursor = 0;
    try {
      tree = api.VentricularView(props);
    } finally {
      active = false;
    }
    return tree;
  };
  const scene = () =>
    nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
  const button = (label) =>
    nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
  const controls = () =>
    nodes(tree).find((n) => n.type === api.CutawayControls).props;
  const cutNodes = () => nodes(api.CutawayControls(controls()));
  const plane = (value) => {
    cutNodes()
      .find((n) => n.props?.onValueChange && typeof n.props.value === 'string')
      .props.onValueChange(value);
    render();
  };
  render();
  same(scene().inspection, api.initialInspection);
  const frame = api.selectionBounds(layers);
  same(scene().inspectionBounds, frame);
  const html = renderToStaticMarkup(
    React.createElement(api.VentricularView, props),
  );
  check(html.includes('Cutaway · Off'));
  check(!/<details[^>]*\bopen(?:[\s=>])/.test(html), 'Tools start collapsed');
  const contextButton = nodes(tree).find(
    (n) => n.props?.onClick && text(n).startsWith('Show '),
  );
  check(contextButton);
  for (const axis of ['axial', 'coronal', 'sagittal']) {
    plane(axis);
    same(scene().inspection, { ...api.initialInspection, plane: axis });
    const slider = () =>
      cutNodes().find((n) =>
        n.props?.['aria-label']?.endsWith('cutaway position'),
      ).props;
    for (const [input, expected] of [
      [[25], 25],
      [75, 75],
      [[-5], 0],
      [[105], 100],
    ]) {
      slider().onValueChange(input);
      render();
      same(scene().inspection.position, expected);
    }
    for (const invalid of [[], [NaN], [Infinity], ['50']]) {
      const before = scene().inspection;
      slider().onValueChange(invalid);
      render();
      same(scene().inspection, before);
    }
    slider().onValueChange([50]);
    render();
    for (const flipped of [false, true]) {
      same(scene().inspection.flipped, flipped);
      check(
        text(api.CutawayControls(controls())).includes(
          `Keep ${flipped ? api.sectionAxes[axis].low : api.sectionAxes[axis].high}`,
        ),
      );
      const state = scene().inspection;
      button(text(contextButton)).onClick();
      render();
      same(scene().inspectionBounds, frame);
      same(scene().inspection, state);
      button(text(contextButton)).onClick();
      render();
      same(scene().inspectionBounds, frame);
      for (const s of layers) {
        for (const position of [0, 25, 50, 75, 100]) {
          const inspection = { ...state, position };
          const bounds = new api.Box3(
            new api.Vector3(...frame.min),
            new api.Vector3(...frame.max),
          );
          const planes = api.sectionPlanes(bounds, inspection, undefined, true);
          const offset = new api.Vector3(3, -5, 7);
          const moved = api.sectionPlanes(bounds, inspection, offset, true);
          const corners = Array.from(
            { length: 8 },
            (_, i) =>
              new api.Vector3(
                ...[0, 1, 2].map(
                  (a) => s.bounds[i & (1 << a) ? 'max' : 'min'][a],
                ),
              ),
          );
          const retained = corners.map((p) => api.pointRetained(p, planes));
          same(
            corners.map((p) => api.pointRetained(p.clone().add(offset), moved)),
            retained,
          );
          const report = api.selectionVisibility({
            system: s.system,
            enabled: true,
            bounds: s.bounds,
            frame,
            inspection,
          });
          same(
            report.clipped,
            retained.some((v) => !v),
          );
          same(
            report.reasons.includes('Selection clipped by cutaway'),
            retained.every((v) => !v),
          );
          geometryCases++;
        }
      }
      cutNodes()
        .find((n) => n.props?.['aria-label']?.startsWith('Reverse '))
        .props.onClick();
      render();
    }
  }
  for (const invalid of [null, '', 'unknown', '__proto__', 'constructor']) {
    const before = scene().inspection;
    plane(invalid);
    same(scene().inspection, before);
  }
  // Restore changes only inspection; it must not reset a chosen separation/selection.
  scene().onSelect(layers[0].id);
  render();
  nodes(tree)
    .find((n) => n.props?.['aria-label']?.endsWith(' separation'))
    .props.onValueChange([70]);
  render();
  const beforeRestore = { ...scene() };
  button('Restore whole view').onClick();
  render();
  same(scene().inspection, api.initialInspection);
  for (const key of [
    'selectedId',
    'hiddenIds',
    'explode',
    'layout',
    'view',
    'reset',
    'isolated',
    'inspectionBounds',
  ])
    same(scene()[key], beforeRestore[key]);
  plane('axial');
  button('Reassemble').onClick();
  render();
  same(scene().inspection, api.initialInspection);
  same(scene().explode, 0);
  // Every study preset must reset a previous cut, including relationship presets.
  const preset = () =>
    nodes(tree).find(
      (n) =>
        n.props?.onValueChange &&
        nodes(n.props.children).some(
          (c) => c.props?.id === 'ventricular-preset',
        ),
    ).props;
  const values = nodes(preset().children)
    .filter((n) => n.props?.value && !n.props.disabled)
    .map((n) => n.props.value);
  for (const value of values) {
    plane('coronal');
    preset().onValueChange(value);
    render();
    same(scene().inspection, api.initialInspection);
  }
  // Find a demonstrably fully removed selection in the real frame, then check warning/recovery.
  let warning = false;
  for (const s of layers) {
    for (const axis of ['axial', 'coronal', 'sagittal']) {
      scene().onSelect(s.id);
      render();
      plane(axis);
      cutNodes()
        .find((n) => n.props?.['aria-label']?.endsWith('cutaway position'))
        .props.onValueChange([100]);
      render();
      if (text(tree).includes('This component is fully cut away.')) {
        warning = true;
        break;
      }
    }
    if (warning) break;
  }
  check(warning, `Full-cut warning: ${target.study}`);
  button('Restore whole view').onClick();
  render();
  check(!text(tree).includes('This component is fully cut away.'));
  same(scene().inspection.plane, 'off');
}
// Renderer wiring: optional frame is used only for clipping; normal camera frame remains unchanged.
const renderer = await readFile('app/body-scene.tsx', 'utf8');
check(renderer.includes('frame={cutFrame}'));
check(renderer.includes('props.inspectionBounds'));
check(renderer.includes('const center = useMemo(() => frame.getCenter'));
check(renderer.includes('pointRetained('));
const report = {
  checks,
  studies: 7,
  parentViews: cases.length,
  geometryCases,
  result: 'passed',
  limits:
    'Controlled React callbacks, static markup and source-bound clipping math; no GPU, browser, device or clinical acceptance.',
};
await writeFile(
  'docs/nested-cutaway-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
