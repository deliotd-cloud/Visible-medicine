/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled hooks forward the component's dependencies and exercise real callbacks, not browser acceptance. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
let checks = 0;
const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(clone(a), clone(b), m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const compiled = await build({
  stdin: {
    contents: `export {VentricularView} from './app/ventricles';
  export {ventricularRelationshipsFor} from './lib/ventricular-relationships';
  export {ventricleCatalog,ventriclesFor} from './lib/ventricles';`,
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
  useState: (value) => {
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
  useReducer: (reducer, arg, init) => {
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
  catalog = api.ventricleCatalog,
  parent = catalog.parent;
const body = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const baseline = JSON.stringify(catalog);
const relationships = api.ventricularRelationshipsFor(parent);
same(
  relationships.map((r) => r.id),
  ['left-landmarks', 'right-landmarks', 'third-landmarks'],
);
const expected = [
  ['FMA78450', ['FMA72827', 'FMA258716', 'FMA86464']],
  ['FMA78449', ['FMA72826', 'FMA258714', 'FMA86464']],
  ['FMA78454', ['FMA258714', 'FMA258716']],
];
for (const [i, r] of relationships.entries()) {
  same(
    catalog.structures.find((s) => s.id === r.spaceId).fmaId,
    expected[i][0],
  );
  same(
    r.context.map((s) => s.fmaId),
    expected[i][1],
  );
  check(r.guide && r.reference.startsWith('https://nba.uth.tmc.edu/'));
  for (const context of r.context) {
    same(
      context,
      body.structures.find((s) => s.id === context.id),
      'Unmodified existing root context',
    );
    check(
      !parent.sources.some((source) =>
        context.sources.some((s) => s.file === source.file),
      ),
      'Do not misrepresent these separate source surfaces as brain-aggregate children',
    );
  }
}
for (const mutation of [
  { id: 'unknown' },
  { name: 'changed' },
  { sources: [] },
  { laterality: 'left' },
])
  same(api.ventricularRelationshipsFor({ ...parent, ...mutation }), []);
const savedContextIds = [...catalog.contextIds];
catalog.contextIds = catalog.contextIds.filter(
  (id) => !id.endsWith('corpus-callosum'),
);
same(
  api.ventricularRelationshipsFor(parent).map((r) => r.id),
  ['third-landmarks'],
  'Incomplete context fails closed',
);
catalog.contextIds = savedContextIds;
function nodes(n) {
  if (!n || typeof n !== 'object') return [];
  if (Array.isArray(n)) return n.flatMap(nodes);
  return [n, ...nodes(n.props?.children)];
}
function text(n) {
  if (typeof n === 'string') return n;
  if (!n) return '';
  if (Array.isArray(n)) return n.map(text).join('');
  return text(n.props?.children);
}
let tree;
const render = (study = 'ventricles') => {
  active = true;
  cursor = 0;
  tree = api.VentricularView({ parent, study });
  active = false;
  return tree;
};
const scene = () =>
  nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
const studySelect = () =>
  nodes(tree).find(
    (n) =>
      n.props?.onValueChange &&
      nodes(n.props.children).some((c) => c.props?.id === 'ventricular-preset'),
  ).props;
const button = (label) =>
  nodes(tree).find((n) => n.props?.onClick && text(n) === label).props;
const selectStudy = (id) => {
  studySelect().onValueChange(id);
  render();
};
const visible = () =>
  scene().structures.filter((s) => !scene().hiddenIds.includes(s.id));
let markupCases = 0;
for (const r of relationships) {
  slots = [];
  render();
  same(studySelect().value, 'all');
  same(scene().contextIds, catalog.contextIds);
  same(scene().appearance[r.spaceId].opacity, 1);
  selectStudy(r.id);
  same(studySelect().value, r.id);
  same(scene().selectedId, r.spaceId);
  same(scene().view, r.view);
  same(scene().explode, 0);
  same(scene().isolated, false);
  same(
    visible()
      .map((s) => s.id)
      .sort(),
    [r.spaceId, ...r.context.map((s) => s.id)].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
  );
  same(scene().appearance[r.spaceId].opacity, 0.7);
  for (const c of r.context) same(scene().appearance[c.id].opacity, 0.42);
  same(
    scene().landmarks,
    catalog.ventricularIds,
    'Context is not a fake selectable wall label',
  );
  const html = require('react-dom/server').renderToStaticMarkup(tree);
  markupCases++;
  check(html.includes('Context colour key'));
  check(html.includes('Anatomy reference'));
  check(html.includes('Space shown translucently'));
  // Original-position guides already add one non-layer switch. Assert exact
  // purposes instead of mistaking every switch in the panel for a layer.
  const expectedSwitches = [
    ...catalog.ventricularIds.map(
      (id) =>
        `Show ${catalog.structures.find((s) => s.id === id).name.toLowerCase()}`,
    ),
    'Show original position',
  ];
  same(
    nodes(tree)
      .filter((n) => n.props?.onCheckedChange)
      .map((n) => n.props['aria-label'])
      .sort(),
    expectedSwitches.sort(),
    'Exactly the four source-layer switches and existing original-position guide',
  );
  same((html.match(/role="switch"/g) || []).length, expectedSwitches.length);
  for (const c of r.context) check(html.includes(c.name));
  const selected = scene().selectedId;
  scene().onSelect(r.context[0].id);
  render();
  same(scene().selectedId, selected);
  same(studySelect().value, r.id);
  scene().onSelect(r.spaceId);
  render();
  same(
    studySelect().value,
    r.id,
    'Selecting the current space retains its guide',
  );
  const slider = () =>
    nodes(tree).find((n) => n.props?.id === 'ventricular-explode').props;
  slider().onValueChange([75]);
  render();
  check(catalog.contextIds.every((id) => scene().hiddenIds.includes(id)));
  same(
    scene().appearance[r.spaceId].opacity,
    1,
    'Separated spaces restore opaque shape comparison',
  );
  check(
    !nodes(tree).some((n) => n.props?.className === 'ventricular-relationship'),
  );
  slider().onValueChange([0]);
  render();
  same(scene().appearance[r.spaceId].opacity, 0.7);
  button('Fade others').onClick();
  render();
  check(text(tree).includes('Turn off Fade others'));
  button('Undo layers').onClick();
  render();
  same(studySelect().value, 'all');
  same(scene().isolated, false);
  selectStudy(r.id);
  button('Show brain context').onClick();
  render();
  check(catalog.contextIds.every((id) => scene().hiddenIds.includes(id)));
  same(studySelect().value, 'custom');
  selectStudy(r.id);
  button('Reassemble').onClick();
  render();
  same(studySelect().value, 'all');
  same(scene().explode, 0);
  selectStudy(r.id);
  const other = catalog.ventricularIds.find((id) => id !== r.spaceId);
  scene().onSelect(other);
  render();
  check(studySelect().value !== r.id);
  check(
    !nodes(tree).some((n) => n.props?.className === 'ventricular-relationship'),
  );
  selectStudy(r.id);
  const toggle = nodes(tree).find(
    (n) =>
      n.props?.onCheckedChange &&
      n.props['aria-label'] ===
        `Show ${catalog.structures.find((s) => s.id === r.spaceId).name.toLowerCase()}`,
  ).props;
  toggle.onCheckedChange(false);
  render();
  same(scene().selectedId, null);
  same(studySelect().value, 'custom');
}
for (const study of ['brainstem', 'cerebral']) {
  slots = [];
  render(study);
  const choices = nodes(tree).filter(
    (n) => n.props?.value && relationships.some((r) => r.id === n.props.value),
  );
  same(choices, [], 'No ventricular relationship preset in a different study');
  check(scene().contextIds.length > 0);
}

// Exercise real BodyScene pointer-handler closures. Context must not stop the
// event stream or replace an underlying object's cursor. No GPU claim is made.
const source = await readFile('app/body-scene.tsx', 'utf8');
const ast = ts.createSourceFile(
  'scene.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let selectHandler, overHandler, outHandler, interactiveExpression;
function visit(node) {
  if (
    ts.isVariableDeclaration(node) &&
    node.name.getText(ast) === 'select' &&
    ts.isArrowFunction(node.initializer)
  )
    selectHandler = node.initializer.getText(ast);
  if (
    ts.isVariableDeclaration(node) &&
    node.name.getText(ast) === 'interactive'
  )
    interactiveExpression = node.initializer.getText(ast);
  if (ts.isJsxAttribute(node) && node.name.text === 'onPointerOver')
    overHandler = node.initializer.expression.getText(ast);
  if (ts.isJsxAttribute(node) && node.name.text === 'onPointerOut')
    outHandler = node.initializer.expression.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
check(selectHandler && overHandler && outHandler && interactiveExpression);
for (const isContext of [false, true])
  for (const removed of [false, true]) {
    let stops = 0,
      selections = [];
    const structure = { id: 'surface' },
      props = {
        contextIds: isContext ? ['surface'] : [],
        onSelect: (id) => selections.push(id),
      };
    const env = {
      removed,
      props,
      structure,
      document: { body: { style: { cursor: 'underlying' } } },
      module: { exports: null },
    };
    env.interactive = runInNewContext(interactiveExpression, env);
    same(env.interactive, !removed && !isContext);
    for (const [handler, action] of [
      [selectHandler, 'select'],
      [overHandler, 'over'],
      [outHandler, 'out'],
    ]) {
      env.document.body.style.cursor = 'underlying';
      stops = 0;
      selections = [];
      const js = ts.transpile(`module.exports=(${handler});`, {
        target: ts.ScriptTarget.ES2022,
      });
      runInNewContext(js, env);
      env.module.exports({ stopPropagation: () => stops++ });
      if (action === 'out' && !isContext) {
        same(
          env.document.body.style.cursor,
          '',
          'Preserve ordinary pointer-exit cleanup, including hidden tissue',
        );
      } else if (!env.interactive) {
        same(stops, 0);
        same(selections, []);
        same(env.document.body.style.cursor, 'underlying');
      } else if (action === 'select') {
        same(stops, 1);
        same(selections, ['surface']);
      } else
        same(
          env.document.body.style.cursor,
          action === 'over' ? 'pointer' : '',
        );
    }
  }
same(JSON.stringify(catalog), baseline, 'No source metadata mutation');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
for (const bundle of catalog.bundles) {
  const path =
    'public' + new URL(bundle.url, 'https://example.invalid').pathname;
  same(
    hash(await readFile(path)),
    bundle.sha256,
    'Actual archived context and space assets match',
  );
}
const report = {
  passed: true,
  checks,
  guidedPresets: relationships.length,
  selectableSpaces: catalog.ventricularIds.length,
  existingContextStructures: catalog.contextIds.length,
  markupCases,
  sourceGeometryChanged: false,
  contextPointerPassThroughHandlers: true,
  clinicalApproval: false,
  browserInteractionTesting: false,
  patientScansAdded: false,
};
await writeFile(
  'docs/ventricular-relationships-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
