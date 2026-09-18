import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';
import {
  dissectionProfiles,
  initialDissection,
  dissectionReducer,
  resolveDissection,
} from '../app/dissection-data.ts';
import { allBodySystems } from '../app/body-types.ts';
import { renderedAnatomyStructures } from '../lib/anatomy-load-state.ts';
import { sceneLabelIds } from '../lib/scene-labels.ts';
import { historicalRecipeProfiles } from './recipe-history.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = JSON.parse(raw);
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(
  hash(JSON.stringify(historicalRecipeProfiles(dissectionProfiles))),
  'd127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c',
);
const snapshot = (s) => ({
  stageId: s.stageId,
  focusId: s.focusId,
  removed: s.removed,
  restored: s.restored,
});
const freeze = (v) => {
  Object.freeze(v);
  for (const item of Object.values(v))
    if (item && typeof item === 'object') freeze(item);
  return v;
};
function apply(state, action) {
  const previous = JSON.stringify(state);
  const result = dissectionReducer(freeze(structuredClone(state)), action);
  same(JSON.stringify(state), previous, 'Reducer must not mutate caller state');
  for (const s of [...result.history, ...result.future])
    same(
      Object.keys(s).sort(),
      ['focusId', 'removed', 'restored', 'stageId'],
      'History snapshots never recursively contain history',
    );
  check(result.history.length <= 40 && result.future.length <= 40);
  return result;
}
let scopes = 0,
  transitions = 0;
for (const [region, profile] of Object.entries(dissectionProfiles))
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    let state = structuredClone(initialDissection);
    const states = [snapshot(state)];
    const target = scope[0].id;
    const actions = [
      ...profile.stages.map((s) => ({ type: 'stage', id: s.id })),
      ...profile.focuses.map((f) => ({ type: 'focus', id: f.id })),
      { type: 'free' },
      { type: 'remove', id: target },
      { type: 'restore-many', ids: [target, target] },
      { type: 'load-view', hiddenIds: [target, target] },
      { type: 'reset' },
    ];
    for (const action of actions) {
      const next = apply(state, action);
      if (JSON.stringify(snapshot(next)) !== JSON.stringify(snapshot(state)))
        states.push(snapshot(next));
      state = next;
    }
    const end = structuredClone(state);
    const retained = states.slice(-41);
    for (const expected of retained.slice(0, -1).reverse()) {
      state = apply(state, { type: 'undo' });
      same(snapshot(state), expected, region + '/' + side + ' Undo');
      same(
        resolveDissection(scope, profile, state),
        resolveDissection(scope, profile, expected),
      );
      transitions++;
    }
    same(state.history.length, 0);
    same(dissectionReducer(state, { type: 'undo' }), state);
    for (const expected of retained.slice(1)) {
      state = apply(state, { type: 'redo' });
      same(snapshot(state), expected, region + '/' + side + ' Redo');
      same(
        resolveDissection(scope, profile, state),
        resolveDissection(scope, profile, expected),
      );
      transitions++;
    }
    same(
      state,
      end,
      'Full replay preserves the bounded history and current visibility',
    );
    same(dissectionReducer(state, { type: 'redo' }), state);
    scopes++;
  }
same(scopes, 36);

// Repeated actions must not consume history or erase a valid Redo branch.
let state = apply(initialDissection, { type: 'remove', id: 'sample-a' });
state = apply(state, { type: 'remove', id: 'sample-b' });
state = apply(state, { type: 'undo' });
for (const action of [
  { type: 'remove', id: 'sample-a' },
  { type: 'restore-many', ids: [] },
]) {
  check(
    dissectionReducer(state, action) === state,
    'A no-op returns the same state object',
  );
  same(state.future.length, 1);
}
const branch = apply(state, { type: 'restore', id: 'sample-a' });
same(branch.future, []);
check(dissectionReducer(branch, { type: 'redo' }) === branch);
check(
  dissectionReducer(branch, { type: 'restore', id: 'sample-a' }) === branch,
);
for (const action of [{ type: 'stage', id: 'assembled' }, { type: 'reset' }])
  check(dissectionReducer(initialDissection, action) === initialDissection);
const batch = apply(initialDissection, {
  type: 'restore-many',
  ids: ['one', 'two'],
});
check(
  dissectionReducer(batch, {
    type: 'restore-many',
    ids: ['two', 'one', 'two'],
  }) === batch,
);
state = structuredClone(initialDissection);
for (let i = 0; i < 85; i++)
  state = apply(state, { type: 'stage', id: i % 2 ? 'assembled' : 'bones' });
same(state.history.length, 40);
for (let i = 0; i < 60; i++) state = apply(state, { type: 'undo' });
same(state.future.length, 40);
same(state.history.length, 0);
for (let i = 0; i < 60; i++) state = apply(state, { type: 'redo' });
same(state.history.length, 40);
same(state.future.length, 0);

// Execute the actual explorer handlers, not a separately written approximation.
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const printer = ts.createPrinter({ removeComments: true });
const handlers = {};
const bindings = {};
function visit(n) {
  if (
    ts.isFunctionDeclaration(n) &&
    ['undoDissection', 'redoDissection'].includes(n.name?.text)
  )
    handlers[n.name.text] = printer.printNode(ts.EmitHint.Unspecified, n, ast);
  if (ts.isJsxAttribute(n) && ['onUndo', 'onRedo'].includes(n.name.text))
    bindings[n.name.text] = n.initializer.expression.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
same(bindings, { onUndo: 'undoDissection', onRedo: 'redoDissection' });
const calls = [];
let handlerSystems = structuredClone(allBodySystems),
  systemUpdates = 0;
const env = {
  exam: false,
  dissection: { history: [{}], future: [{}] },
  dispatch: (value) => calls.push(['dispatch', value.type]),
  setSystems: (update) => {
    systemUpdates++;
    handlerSystems =
      typeof update === 'function' ? update(handlerSystems) : update;
  },
  ...Object.fromEntries(
    ['setSelectedId', 'setFocus', 'setIsolated', 'setZoom'].map((name) => [
      name,
      (value) => calls.push([name, value]),
    ]),
  ),
};
runInNewContext(
  Object.values(handlers).join('\n') +
    '\nthis.handlers = { undoDissection, redoDissection };',
  env,
);
let handlerCases = 0;
for (const [name, direction, stack] of [
  ['undoDissection', 'undo', 'history'],
  ['redoDissection', 'redo', 'future'],
]) {
  calls.length = 0;
  env.exam = false;
  env.dissection = { history: [{}], future: [{}] };
  env.handlers[name]();
  same(calls, [
    ['dispatch', direction],
    ['setSelectedId', null],
    ['setFocus', false],
    ['setIsolated', false],
    ['setZoom', 1],
  ]);
  calls.length = 0;
  env.exam = true;
  env.handlers[name]();
  same(calls, [], 'Exam handlers cannot alter dissection');
  env.exam = false;
  env.dissection[stack] = [];
  env.handlers[name]();
  same(calls, [], 'Empty history does not clear selection or change zoom');
  handlerCases += 3;
}

// Run the production handlers against the real reducer while systems remain
// separate React state, then use the renderer's production visibility and label
// helpers. This catches an Undo/Redo handler that starts changing systems and a
// restored structure that leaks a label while its system is still switched off.
const thighProfile = dissectionProfiles.thigh;
const thighScope = catalog.structures.filter((s) => s.regions.includes('thigh'));
const muscle = thighScope.find((s) => s.system === 'muscles');
check(muscle, 'Thigh scope supplies a muscle for the history/system regression');
env.dissection = apply(initialDissection, { type: 'remove', id: muscle.id });
handlerSystems = { ...allBodySystems, muscles: false };
systemUpdates = 0;
env.dispatch = (action) => {
  calls.push(['dispatch', action.type]);
  env.dissection = dissectionReducer(env.dissection, action);
};
calls.length = 0;
env.handlers.undoDissection();
same(calls[0], ['dispatch', 'undo']);
same(systemUpdates, 0, 'Undo does not write independent system choices');
same(handlerSystems.muscles, false, 'Undo preserves the disabled muscle system');
const undoResolved = resolveDissection(thighScope, thighProfile, env.dissection);
check(
  undoResolved.visible.some((item) => item.id === muscle.id),
  'Undo restores the removed muscle in dissection state',
);
const undoRendered = renderedAnatomyStructures(
  undoResolved.visible,
  handlerSystems,
  undoResolved.removed.map((item) => item.id),
  false,
);
check(
  !undoRendered.some((item) => item.id === muscle.id),
  'The restored muscle remains hidden by its independent system choice',
);
same(
  sceneLabelIds(
    muscle.id,
    [muscle.id],
    undoRendered.map((item) => item.id),
    false,
  ),
  [],
  'Production label selection excludes restored anatomy in a disabled system',
);
calls.length = 0;
env.handlers.redoDissection();
same(calls[0], ['dispatch', 'redo']);
same(systemUpdates, 0, 'Redo does not write independent system choices');
same(handlerSystems.muscles, false, 'Redo preserves the disabled muscle system');
check(
  resolveDissection(thighScope, thighProfile, env.dissection).removed.some(
    (item) => item.id === muscle.id,
  ),
  'Redo reapplies the muscle removal without enabling its system',
);
const systemHistoryCases = 2;

// Actual toolbar markup. This is SSR, not browser/touch acceptance.
const toolbarSource = await readFile('app/dissection-controls.tsx', 'utf8');
const toolbarAst = ts.createSourceFile(
  'controls.tsx',
  toolbarSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const toolbarActions = {};
function toolbarBindings(n) {
  if (ts.isJsxOpeningElement(n) && n.tagName.getText(toolbarAst) === 'Button') {
    const attrs = n.attributes.properties.filter(ts.isJsxAttribute);
    const label = attrs.find((a) => a.name.text === 'aria-label')?.initializer;
    const click = attrs.find((a) => a.name.text === 'onClick')?.initializer;
    if (
      label &&
      ts.isStringLiteral(label) &&
      /^(Undo|Redo) last/.test(label.text)
    )
      toolbarActions[label.text] = click.expression.getText(toolbarAst);
  }
  ts.forEachChild(n, toolbarBindings);
}
toolbarBindings(toolbarAst);
same(
  toolbarActions,
  {
    'Undo last dissection change': 'onUndo',
    'Redo last undone dissection change': 'onRedo',
  },
  'Toolbar binds each labelled action to the matching guarded handler',
);
const require = createRequire(import.meta.url),
  React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = await build({
  entryPoints: ['app/dissection-controls.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
  loader: { '.css': 'empty' },
});
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module,
  exports: module.exports,
  require,
  console,
  process: { env: { NODE_ENV: 'test' } },
});
const profile = dissectionProfiles.leg;
const props = {
  profile,
  structures: catalog.structures.filter((s) => s.regions.includes('leg')),
  visibleIds: [],
  visibleCount: 0,
  loaded: [],
  failed: [],
  ghost: false,
  onStage() {},
  onFocus() {},
  onUndo() {},
  onRedo() {},
  onReset() {},
  onGhost() {},
};
let markupCases = 0;
for (const disabled of [false, true])
  for (const state of [
    initialDissection,
    apply(initialDissection, { type: 'remove', id: 'sample' }),
    apply(apply(initialDissection, { type: 'remove', id: 'sample' }), {
      type: 'undo',
    }),
  ]) {
    const html = renderToStaticMarkup(
      React.createElement(module.exports.DissectionControls, {
        ...props,
        state,
        disabled,
      }),
    );
    for (const [label, stack] of [
      ['Undo last dissection change', 'history'],
      ['Redo last undone dissection change', 'future'],
    ]) {
      const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
      const button = buttons.find((b) =>
        b.includes('aria-label="' + label + '"'),
      );
      check(button, 'Accessible toolbar button');
      same(/\bdisabled=""/.test(button), disabled || state[stack].length === 0);
    }
    markupCases++;
  }
// Enabled count is a visibility choice, not proof that meshes have loaded.
// Render real controls in pending, ready and failed states; the wording must
// never describe unavailable anatomy as visible.
for (const load of [
  { loaded: [], failed: [] },
  { loaded: ['test-bundle'], failed: [] },
  { loaded: [], failed: ['test-bundle'] },
]) {
  const html = renderToStaticMarkup(
    React.createElement(module.exports.DissectionControls, {
      ...props, ...load, state: initialDissection, visibleCount: 89,
    }),
  );
  check(/89(?:<!-- -->)? enabled/.test(html), 'Count describes enabled anatomy in every load state');
  check(!/89(?:<!-- -->)? visible/.test(html), 'Count never promises loaded geometry');
  check(html.includes('models may still be loading or unavailable'), 'Count explanation retains the load boundary');
  markupCases++;
}
same(
  JSON.stringify(catalog),
  JSON.stringify(JSON.parse(raw)),
  'No catalogue mutation',
);
const report = {
  passed: true,
  checks,
  scopes,
  replayedTransitions: transitions,
  historyLimit: 40,
  handlerCases,
  systemHistoryCases,
  markupCases,
  handlerHashes: Object.fromEntries(
    Object.entries(handlers).map(([name, text]) => [name, hash(text)]),
  ),
  noOpPreservesRedo: true,
  newActionClearsRedo: true,
  snapshotsExcludeHistory: true,
  examAndEmptyHistoryGuards: true,
  systemChoicesIndependentOfHistory: true,
  systemHiddenLabelsExcludedByProductionHelpers: true,
  sourceGeometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
  limitations:
    'In-memory dissection steps plus actual Undo/Redo handlers and production render/label filtering; not browser interaction, camera, source meshes, saved-bookmark history, clinical correctness or device acceptance.',
};
await writeFile(
  'docs/dissection-history-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
