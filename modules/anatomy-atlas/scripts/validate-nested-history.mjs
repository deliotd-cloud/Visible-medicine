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
      export {bodyDisplayCatalog} from './lib/body-display-catalog';
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
  useRef(value) {
    if (!active) return React.useRef(value);
    const i = cursor++;
    if (!(i in slots)) slots[i] = { current: value };
    return slots[i];
  },
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
  useLayoutEffect: (fn, deps) =>
    active ? undefined : React.useLayoutEffect(fn, deps),
};
const scope = { exports: {} };
const Link = ({ children, ...props }) =>
  React.createElement('a', props, children);
runInNewContext(compiled.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  structuredClone,
  URLSearchParams,
  require: (id) =>
    id === 'react' ? shim : id === 'next/link' ? Link : require(id),
});
const api = scope.exports;
const catalog = api.bodyDisplayCatalog(
  JSON.parse(
    await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  ),
);
// Separate artery workbench callbacks are covered by validate-femoral-components
// and validate-cranial-artery-components; the guarded coronary-venous view extends this corpus.
const targets = api.nestedStudyTargets(catalog).filter(t => !['femoral-components', 'cranial-artery-components'].includes(t.study));
const cases = [
  ...new Map(targets.map((t) => [`${t.study}/${t.parentId}`, t])).values(),
];
same(cases.length, 15);
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
const snapshot = ({ history: _history, future: _future, ...state }) =>
  copy(state);
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
  if (target.study === 'coronary-venous') {
    same(scene().view, 'posterior');
    same(scene().structures.length, 2);
    same(scene().contextIds, []);
    check(!scene().structures.some((s) => s.id === parent.id));
    check(text(tree).includes('two original files as one group'));
  }
  if (target.study === 'cricothyroid') {
    same(scene().view, 'anterior');
    same(scene().contextIds.length, 2);
    same(scene().structures.length, 6);
    same(button('Show cartilage landmarks')['aria-pressed'], true);
    for (const id of scene().contextIds) {
      same(scene().appearance[id].opacity, 0.3);
      const before = scene().selectedId;
      scene().onSelect(id); render();
      same(scene().selectedId, before, 'Cartilage is not selectable muscle tissue');
    }
    check(text(tree).includes('12 specifically audited faces'));
    check(text(tree).includes('Muscle-part source'));
    check(!text(tree).includes('Space representation'));
    check(!text(tree).includes('Faint context: thalami'));
    check(!text(tree).includes('no triangles intentionally removed'));
    button('Show cartilage landmarks').onClick(); render();
    same(scene().contextIds, []); same(scene().structures.length, 4);
    button('Show cartilage landmarks').onClick(); render();
    scene().onFailure('cricothyroid'); render();
    button('Retry').onClick(); render();
    same(scene().retries.cricothyroid, 1);
    for (const b of scene().catalog.bundles) scene().onLoaded(b.id);
    scene().onRendererHealth('ready'); render();
    check(!button('Frame selected').disabled);
  }
  if (target.study === 'pancreatic') {
    same(scene().view, 'anterior');
    same(scene().contextIds.length, 1);
    same(scene().structures.length, 3);
    same(scene().appearance[scene().contextIds[0]].opacity, 0.12);
    check(text(tree).includes('Duct source'));
    check(text(tree).includes('not two complete independent duct trees'));
    same(button('Show pancreatic envelope')['aria-pressed'], true);
    const selectedBefore = scene().selectedId;
    scene().onSelect(scene().contextIds[0]);
    render();
    same(scene().selectedId, selectedBefore, 'Reference cannot be selected');
    button('Show pancreatic envelope').onClick();
    render();
    same(scene().contextIds, []);
    same(scene().structures.length, 2);
    button('Show pancreatic envelope').onClick();
    render();
    scene().onFailure('pancreatic-components');
    render();
    button('Retry').onClick();
    render();
    same(scene().retries['pancreatic-components'], 1);
    scene().onLoaded('pancreatic-components');
    scene().onRendererHealth('ready');
    render();
    check(!button('Frame selected').disabled);
  }
  if (target.study === 'visual-pathway') {
    same(scene().view, 'inferior');
    same(scene().contextIds, []);
    same(button('Show brain landmarks')['aria-pressed'], false);
    check(text(tree).includes('Neural source surface'));
    button('Show brain landmarks').onClick();
    render();
    same(scene().contextIds.length, 4);
    check(!scene().structures.some((s) => s.id === parent.id));
    const selected = scene().selectedId;
    for (const id of scene().contextIds) {
      scene().onSelect(id);
      render();
      same(scene().selectedId, selected);
    }
    scene().onFailure('visual-pathway');
    render();
    check(text(tree).includes('Some structures could not load.'));
    button('Retry').onClick();
    render();
    same(scene().retries['visual-pathway'], 1);
    for (const bundle of scene().catalog.bundles) scene().onLoaded(bundle.id);
    render();
    check(!text(tree).includes('Loading optic pathway view'));
  }
  if (target.study === 'renal') {
    same(scene().contextIds.length, 6);
    same(button('Show kidney & vessel context')['aria-pressed'], true);
    const oldSelection = scene().selectedId;
    for (const id of scene().contextIds) {
      scene().onSelect(id);
      render();
      same(
        scene().selectedId,
        oldSelection,
        'Context cannot become a selectable child',
      );
      const s = scene().structures.find((s) => s.id === id);
      check(
        s.laterality === parent.laterality ||
          ['unpaired', 'midline', 'unspecified'].includes(s.laterality),
      );
      same(scene().appearance[id].opacity, s.system === 'organs' ? 0.12 : 0.35);
    }
    scene().onFailure('renal-vascular');
    render();
    check(text(tree).includes('Some structures could not load.'));
    button('Retry').onClick();
    render();
    same(scene().retries['renal-vascular'], 1);
    for (const bundle of scene().catalog.bundles) scene().onLoaded(bundle.id);
    render();
    check(!text(tree).includes('Loading renal vascular view'));
    check(!text(tree).includes('Some structures could not load.'));
  }
  const originToggle = () =>
    nodes(tree).find(
      (n) => n.props?.['aria-label'] === 'Show original position',
    ).props;
  same(scene().showOrigins, false);
  same(scene().originStyle, 'selected-guide');
  check(
    nodes(tree).some(
      (n) =>
        n.type === 'details' &&
        !n.props.open &&
        nodes(n).some(
          (child) => child.props?.['aria-label'] === 'Show original position',
        ),
    ),
  );
  originToggle().onCheckedChange(true);
  render();
  same(scene().showOrigins, true);
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
  if (target.study === 'cricothyroid') {
    same(scene().contextIds, []);
    same(scene().structures.map((s) => s.id), layers.map((s) => s.id));
    check(button('Show cartilage landmarks').disabled);
  }
  if (target.study === 'pancreatic') {
    same(scene().contextIds, []);
    same(
      scene().structures.map((s) => s.id),
      layers.map((s) => s.id),
    );
    check(button('Show pancreatic envelope').disabled);
  }
  if (target.study === 'renal') {
    same(scene().contextIds, []);
    same(
      scene().structures.map((s) => s.id),
      layers.map((s) => s.id),
    );
    check(button('Show kidney & vessel context').disabled);
  }
  if (target.study === 'visual-pathway') {
    same(scene().contextIds, []);
    check(button('Show brain landmarks').disabled);
    same(
      scene().structures.map((s) => s.id),
      layers.map((s) => s.id),
    );
  }
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
  same(scene().showOrigins, true);
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
  if (target.study === 'pancreatic') same(scene().contextIds.length, 1);
  if (target.study === 'cricothyroid') same(scene().contextIds.length, 2);
  if (target.study === 'renal') same(scene().contextIds.length, 6);
  if (target.study === 'visual-pathway') same(scene().contextIds.length, 4);
  same(scene().showOrigins, true);
  const html = renderToStaticMarkup(React.createElement(View, props));
  check(
    /<button[^>]*disabled[^>]*>Redo layers<\/button>/.test(html),
    'Native disabled redo button in initial render',
  );
  // A new keyed parent has no history to replay from the previous study.
  slots = [];
  render();
  check(button('Undo layers').disabled && button('Redo layers').disabled);
  same(scene().showOrigins, false);
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
  studyFamilies: new Set(cases.map((t) => t.study)).size,
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
