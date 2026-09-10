/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled callbacks, not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
const copy = (v) => JSON.parse(JSON.stringify(v));
const hash = (v) => createHash('sha256').update(v).digest('hex');
let checks = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(copy(a), copy(b), m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles';
export * from './lib/renal'; export * from './lib/renal-relationships';
export {initialVentricles, reduceVentricles} from './lib/ventricles';
export {CutawayControls} from './app/cutaway-controls';`,
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
const api = scope.exports,
  catalog = api.renalCatalog;
const rootBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(rootBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = JSON.parse(rootBytes),
  original = JSON.stringify(catalog);
same(
  hash(await readFile('content/nested-teaching-bindings.v1.json')),
  '4ae3bf423a67da6eee5541579dea469297b22f04d8f2c7889ed40456a3084fb3',
);
for (const b of [...catalog.bundles, ...catalog.contextBundles])
  same(hash(await readFile('public' + b.url.split('?')[0])), b.sha256);
same(catalog.structures.length, 7);
same(catalog.parents.length, 2);
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
const words = {};
for (const parent of catalog.parents) {
  const layers = api.renalFor(parent),
    relations = api.renalRelationshipsFor(parent),
    left = parent.laterality === 'left';
  same(relations.length, 2);
  same(
    relations.map((r) => r.id),
    ['renal-venous-outflow', 'adrenal-venous-outflow'],
  );
  same(
    api.renalRelationshipViewCatalog(parent, true),
    api.renalViewCatalog(parent, true),
  );
  for (const mutate of [
    (p) => (p.name = 'changed'),
    (p) => (p.laterality = left ? 'right' : 'left'),
    (p) => (p.bounds.min[0] += 1),
    (p) => (p.sources[0].sha256 = '0'.repeat(64)),
  ]) {
    const stale = copy(parent);
    mutate(stale);
    same(api.renalRelationshipsFor(stale), []);
    same(
      api.renalRelationshipViewCatalog(stale, true, relations[0].id).structures,
      [],
    );
  }
  const presets = {
    ...api.renalPresets(layers),
    ...Object.fromEntries(relations.map((r) => [r.id, r.visibleIds])),
  };
  for (const r of relations) {
    words[r.reference] =
      (words[r.reference] ?? 0) + r.guide.split(/\s+/).length;
    check(r.visibleIds.includes(r.spaceId));
    check(r.title.startsWith(left ? 'Left' : 'Right'));
    check(r.visibleIds.every((id) => layers.some((s) => s.id === id)));
    same(
      r.visibleIds.length,
      r.id === 'adrenal-venous-outflow' && left ? 2 : 1,
    );
    same(
      api.renalRelationshipViewCatalog(parent, false, r.id),
      api.renalViewCatalog(parent),
    );
    const view = api.renalRelationshipViewCatalog(parent, true, r.id);
    same(
      view.selectableIds,
      layers.map((s) => s.id),
    );
    same(
      view.contextIds,
      r.context.map((s) => s.id),
    );
    same(new Set(view.bundles.map((b) => b.id)).size, view.bundles.length);
    for (const s of r.context) {
      same(
        s,
        root.structures.find((x) => x.id === s.id),
      );
      check(
        s.laterality === parent.laterality ||
          ['midline', 'unspecified', 'unpaired'].includes(s.laterality),
      );
      check(!view.selectableIds.includes(s.id));
      check(view.bundles.some((b) => b.id === s.bundle));
    }
    const initial = api.initialVentricles(layers);
    const changed = api.reduceVentricles(
      layers,
      initial,
      { type: 'preset', value: r.id, selectedId: r.spaceId },
      presets,
    );
    same(changed.selectedId, r.spaceId);
    same(changed.history.length, 1, 'One atomic history entry');
    const undone = api.reduceVentricles(
      layers,
      changed,
      { type: 'undo' },
      presets,
    );
    same(undone.selectedId, initial.selectedId);
    same(undone.hidden, initial.hidden);
    const redone = api.reduceVentricles(
      layers,
      undone,
      { type: 'redo' },
      presets,
    );
    same(redone.selectedId, changed.selectedId);
    same(redone.hidden, changed.hidden);
    for (const selectedId of [
      'foreign',
      layers.find((s) => !r.visibleIds.includes(s.id)).id,
    ])
      same(
        api.reduceVentricles(
          layers,
          initial,
          { type: 'preset', value: r.id, selectedId },
          presets,
        ),
        initial,
      );
  }
  const savedContexts = catalog.contextRecords;
  catalog.contextRecords = savedContexts.filter((s) => s.fmaId !== 'FMA10951');
  same(
    api.renalRelationshipsFor(parent),
    [],
    'Missing required landmark withholds guide',
  );
  catalog.contextRecords = savedContexts;
  slots = [];
  let tree;
  const render = () => {
    active = true;
    cursor = 0;
    try {
      tree = api.VentricularView({ parent, study: 'renal' });
    } finally {
      active = false;
    }
  };
  const scene = () =>
    nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
  const button = (label) =>
    nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
  const select = () =>
    nodes(tree).find(
      (n) =>
        n.props?.onValueChange &&
        nodes(n.props.children).some(
          (c) => c.props?.id === 'ventricular-preset',
        ),
    ).props;
  const visible = () =>
    scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
  const visibleLayers = () =>
    visible()
      .filter((s) => layers.some((l) => l.id === s.id))
      .map((s) => s.id);
  const separation = (value) => {
    nodes(tree)
      .find(
        (n) =>
          n.props?.['aria-label']?.endsWith('separation') &&
          n.props.onValueChange,
      )
      .props.onValueChange([value]);
    render();
  };
  render();
  same(scene().contextIds.length, 6);
  same(scene().view, 'anterior');
  const cutBounds = copy(scene().inspectionBounds);
  for (const b of scene().catalog.bundles) scene().onLoaded(b.id);
  scene().onRendererHealth('ready');
  render();
  for (const r of relations) {
    const before = { selected: scene().selectedId, visible: visibleLayers() };
    select().onValueChange(r.id);
    render();
    same(scene().selectedId, r.spaceId);
    same(scene().view, r.view);
    same(scene().isolated, false);
    same([...visibleLayers()].sort(), [...r.visibleIds].sort());
    same(
      scene().contextIds,
      r.context.map((s) => s.id),
    );
    same(scene().inspectionBounds, cutBounds);
    const html = require('react-dom/server').renderToStaticMarkup(tree);
    check(html.includes('Renal venous relationship guide'));
    check(html.includes(r.reference));
    check(html.includes('not verified mesh continuity'));
    check(!html.includes('Ventricular relationship guide'));
    for (const c of r.context) {
      scene().onSelect(c.id);
      render();
      same(scene().selectedId, r.spaceId);
      check(!scene().landmarks.includes(c.id));
    }
    button('Undo layers').onClick();
    render();
    same(scene().selectedId, before.selected);
    same(visibleLayers(), before.visible);
    select().onValueChange(r.id);
    render();
    for (const id of r.visibleIds) {
      scene().onSelect(id);
      render();
      same(scene().selectedId, id);
      same(select().value, r.id);
    }
    button('Show drainage landmarks').onClick();
    render();
    same(scene().contextIds, []);
    same(select().value, r.id);
    same(scene().catalog.bundles.length, 1);
    button('Show drainage landmarks').onClick();
    render();
    const b = scene().catalog.bundles.find(
      (b) => b.id !== catalog.bundles[0].id,
    );
    scene().onFailure(b.id);
    render();
    check(button('Frame selected').disabled);
    button('Retry').onClick();
    render();
    check(scene().retries[b.id] > 0);
    scene().onLoaded(b.id);
    render();
    same(button('Frame selected').disabled, false);
    const cut = nodes(tree).find((n) => n.type === api.CutawayControls).props;
    cut.onChange({ ...cut.value, plane: 'coronal', position: 34 });
    render();
    for (const layout of ['extract', 'spatial', 'tray']) {
      nodes(tree)
        .find(
          (n) =>
            n.props?.onValueChange &&
            nodes(n.props.children).some((c) =>
              c.props?.['aria-label']?.endsWith('separation mechanism'),
            ),
        )
        .props.onValueChange(layout);
      render();
      separation(60);
      same(scene().contextIds, []);
      same(scene().catalog.bundles.length, 1);
      check(button('Show drainage landmarks').disabled);
      same(scene().inspectionBounds, cutBounds);
      same(scene().inspection.plane, 'coronal');
      separation(0);
      same(
        scene().contextIds,
        r.context.map((s) => s.id),
      );
    }
    button('Reassemble').onClick();
    render();
    same(scene().contextIds.length, 6);
    same(scene().inspection.plane, 'off');
  }
  for (const action of [
    'outside-selection',
    'visibility',
    'ordinary-preset',
    'undo',
  ]) {
    const r = relations[1];
    select().onValueChange(r.id);
    render();
    if (action === 'outside-selection')
      scene().onSelect(layers.find((s) => !r.visibleIds.includes(s.id)).id);
    else if (action === 'ordinary-preset') select().onValueChange('all');
    else if (action === 'undo') button('Undo layers').onClick();
    else
      nodes(tree)
        .find(
          (n) =>
            n.props?.['aria-label'] ===
            `Show ${layers.find((s) => s.id === r.spaceId).name.toLowerCase()}`,
        )
        .props.onCheckedChange(false);
    render();
    check(!text(tree).includes(r.guide));
    same(scene().contextIds.length, 6);
    same(scene().inspectionBounds, cutBounds);
  }
}
same(api.renalRelationshipsFor(null), []);
same(
  api.renalRelationshipViewCatalog(null, true, 'adrenal-venous-outflow')
    .structures,
  [],
);
same(JSON.stringify(catalog), original);
for (const count of Object.values(words))
  check(count <= 200, 'Conservative guide source budget');
const report = {
  passed: true,
  checks,
  parentViews: 2,
  guidedPresets: 4,
  uniquePresetKinds: 2,
  sourceGroups: 7,
  newGLBs: 0,
  newContextRecords: 0,
  sourceGeometryChanged: false,
  atomicPresetSelection: true,
  clinicalApproval: false,
  browserTesting: false,
  externalAccessChanged: false,
};
await writeFile(
  'docs/renal-relationships-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
