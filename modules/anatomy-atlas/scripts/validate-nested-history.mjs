/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled callbacks, not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
const copy = (v) => JSON.parse(JSON.stringify(v));
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(copy(a), copy(b));
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles';
      export {EyeLayerView} from './app/eye-layers';
      export {initialEyeLayers, reduceEyeLayers} from './lib/eye-layer-state';
      export {initialVentricles, reduceVentricles} from './lib/ventricles';
      export {CutawayControls} from './app/cutaway-controls';
      export * from './lib/nested-anatomy';`,
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
  await readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
const targets = api.nestedStudyTargets(catalog);
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
const snapshot = ({ history: _history, future: _future, ...state }) => copy(state);
const { renderToStaticMarkup } = require('react-dom/server');
for (const target of cases) {
  const parent = catalog.structures.find((s) => s.id === target.parentId);
  const layers = api.nestedPartsFor(parent, target.study);
  const eye = target.study === 'eye';
  const reduce = (state, action) =>
    eye
      ? api.reduceEyeLayers(layers, state, action)
      : api.reduceVentricles(layers, state, action);
  const initial = () =>
    eye ? api.initialEyeLayers(layers) : api.initialVentricles(layers);
  let state = initial();
  const update = (action) => {
    const before = state,
      saved = copy(state);
    state = reduce(state, action);
    same(before, saved);
    check(
      state.history.length + state.future.length <= 30,
      'Bounded layer history',
    );
    check(!state.hidden.includes(state.selectedId));
    for (const s of [state, ...state.history, ...state.future]) {
      check(s.hidden.every((id) => layers.some((l) => l.id === id)));
      check(s.selectedId === null || layers.some((l) => l.id === s.selectedId));
    }
    for (const s of [...state.history, ...state.future])
      check(!('history' in s) && !('future' in s));
  };
  same(reduce(state, { type: 'undo' }), state);
  same(reduce(state, { type: 'redo' }), state);
  update({ type: 'preset', value: 'all' });
  for (const l of layers) {
    update({ type: 'select', id: l.id });
    const before = snapshot(state);
    update({ type: 'visibility', id: l.id, visible: false });
    const after = snapshot(state);
    update({ type: 'undo' });
    same(snapshot(state), before);
    const undone = state;
    same(reduce(state, { type: 'select', id: 'foreign' }), undone);
    same(reduce(state, { type: 'preset', value: 'foreign' }), undone);
    same(reduce(state, { type: 'select', id: l.id }), undone);
    update({ type: 'redo' });
    same(snapshot(state), after);
    update({ type: 'undo' });
    same(snapshot(state), before);
    update({ type: 'select', id: layers.find((s) => s.id !== l.id).id });
    same(state.future, []);
    same(reduce(state, { type: 'redo' }), state);
  }
  for (let i = 0; i < 70; i++)
    update({ type: 'visibility', id: layers[0].id, visible: i % 2 === 0 });
  same(state.history.length, 30);
  const last = snapshot(state);
  for (let i = 0; i < 30; i++) update({ type: 'undo' });
  same(state.future.length, 30);
  same(reduce(state, { type: 'undo' }), state);
  for (let i = 0; i < 30; i++) update({ type: 'redo' });
  same(snapshot(state), last);
  same(state.future, []);

  // Execute the real view callbacks for every parent/side, replacing only GPU work.
  slots = [];
  const props = {
    parent,
    study: target.study,
    initialSelectedId: layers[0].id,
  };
  const View = eye ? api.EyeLayerView : api.VentricularView;
  let tree;
  const render = () => {
    active = true;
    cursor = 0;
    try {
      tree = View(props);
    } finally {
      active = false;
    }
  };
  const scene = () =>
    nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
  const button = (label) =>
    nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
  const visibility = (s, visible) => {
    const grouped = nodes(tree).find((n) => n.props?.onVisibility);
    if (grouped) grouped.props.onVisibility(s.id, visible);
    else
      nodes(tree)
        .find((n) => n.props?.['aria-label'] === `Show ${s.name.toLowerCase()}`)
        .props.onCheckedChange(visible);
    render();
  };
  render();
  check(button('Undo layers').disabled);
  check(button('Redo layers').disabled);
  const controls = nodes(tree).find(
    (n) => n.type === api.CutawayControls,
  ).props;
  controls.onChange({ ...controls.value, plane: 'coronal', position: 37 });
  nodes(tree)
    .find(
      (n) =>
        n.props?.onValueChange &&
        n.props?.['aria-label']?.endsWith('separation'),
    )
    .props.onValueChange([35]);
  render();
  const cut = copy(scene().inspection),
    beforeHidden = copy(scene().hiddenIds);
  visibility(layers[0], false);
  const afterHidden = copy(scene().hiddenIds);
  same(scene().selectedId, null);
  button('Undo layers').onClick();
  render();
  same(scene().selectedId, layers[0].id);
  same(scene().hiddenIds, beforeHidden);
  check(!button('Redo layers').disabled);
  same(scene().isolated, false);
  button('Redo layers').onClick();
  render();
  same(scene().selectedId, null);
  same(scene().hiddenIds, afterHidden);
  same(scene().inspection, cut);
  same(scene().explode, 35);
  check(button('Redo layers').disabled);
  button('Undo layers').onClick();
  render();
  scene().onSelect(layers[1].id);
  render();
  check(button('Redo layers').disabled, 'New layer choice clears redo branch');
  for (const l of layers) visibility(l, false);
  same(scene().selectedId, null);
  button('Undo layers').onClick();
  render();
  button('Redo layers').onClick();
  render();
  check(layers.every((l) => scene().hiddenIds.includes(l.id)));
  button('Reassemble').onClick();
  render();
  check(layers.every((l) => !scene().hiddenIds.includes(l.id)));
  check(button('Redo layers').disabled);
  same(scene().explode, 0);
  const html = renderToStaticMarkup(React.createElement(View, props));
  check(
    /<button[^>]*disabled[^>]*>Redo layers<\/button>/.test(html),
    'Native disabled redo button in initial render',
  );
  // A new keyed parent has no history to replay from the previous study.
  slots = [];
  render();
  check(button('Undo layers').disabled && button('Redo layers').disabled);
  const studySelect = () =>
    nodes(tree).find(
      (n) =>
        n.props?.onValueChange &&
        nodes(n.props.children).some(
          (child) =>
            child.props?.id ===
            (eye ? 'eye-layer-preset' : 'ventricular-preset'),
        ),
    ).props;
  const layerView = () => ({
    selectedId: scene().selectedId,
    hidden: layers
      .filter((l) => scene().hiddenIds.includes(l.id))
      .map((l) => l.id),
  });
  const presetValues = nodes(studySelect().children)
    .filter((n) => typeof n.props?.value === 'string' && !n.props.disabled)
    .map((n) => n.props.value);
  check(presetValues.length > 1);
  for (const value of presetValues) {
    slots = [];
    render();
    const before = copy(layerView());
    studySelect().onValueChange(value);
    render();
    const after = copy(layerView());
    if (button('Undo layers').disabled) {
      same(after, before);
      continue;
    }
    button('Undo layers').onClick();
    render();
    same(layerView(), before);
    button('Redo layers').onClick();
    render();
    same(layerView(), after);
  }
}
const report = {
  passed: true,
  checks,
  studyFamilies: 7,
  parentViews: cases.length,
  representations: targets.length,
  historyLimit: 30,
  externalDataOrEntitlementsChanged: false,
  limitations:
    'Controlled real reducers/callbacks and server-rendered markup; no GPU, browser, device or clinical acceptance.',
};
await writeFile(
  'docs/nested-history-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
