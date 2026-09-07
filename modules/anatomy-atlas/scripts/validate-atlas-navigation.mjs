/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled hook harness exercises actual event closures without a browser. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import {
  atlasSearchIndex,
  filterAtlasSearch,
  cameraDirections,
  directionLabel,
} from '../lib/atlas-navigation.ts';
import {
  bodyStudyScope,
  parseStudyLink,
  resolveStudyLink,
} from '../lib/study-links.ts';
import { dissectionProfiles } from '../app/dissection-data.ts';
import { studyLibrary } from '../lib/study-library.ts';
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (a, message) => {
  checks++;
  assert(a, message);
};
const catalog = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
const original = JSON.stringify(catalog);
let searchScopes = 0,
  sourceLinks = 0;
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)])
  for (const side of ['both', 'right', 'left']) {
    const scope = bodyStudyScope(catalog, region, side),
      local = new Set(scope.map((s) => s.id));
    const index = atlasSearchIndex(catalog, region, side);
    same(new Set(index.map((e) => e.key)).size, index.length);
    same(
      index.filter((e) => e.kind === 'structure').length,
      catalog.structures.length,
    );
    same(index.filter((e) => e.kind === 'region').length, 13);
    const expectedViews = studyLibrary(
      scope,
      dissectionProfiles[region],
    ).flatMap((card) =>
      card.recipes.filter((r) => r.available).map((r) => `view:${r.key}`),
    );
    same(
      index.filter((e) => e.kind === 'view').map((e) => e.key),
      expectedViews,
    );
    for (const entry of index) {
      if (entry.kind === 'structure') {
        const id = entry.key.slice('structure:'.length);
        const item = catalog.structures.find((s) => s.id === id);
        same(entry.label, item.name);
        if (local.has(id)) same(entry.action, { type: 'select', id });
        else {
          same(entry.action.type, 'link');
          const url = new URL(entry.action.href, 'https://atlas.test');
          same(url.origin, 'https://atlas.test');
          const targetRegion =
            url.pathname === '/'
              ? 'whole-body'
              : url.pathname.slice('/regions/'.length);
          const parsed = parseStudyLink(Object.fromEntries(url.searchParams));
          const result = resolveStudyLink(catalog, targetRegion, parsed);
          same(result.status, 'ready');
          same(result.selected.id, id);
          sourceLinks++;
        }
      }
    }
    const sample = scope[0];
    check(
      filterAtlasSearch(index, sample.fmaId).some(
        (e) => e.key === `structure:${sample.id}`,
      ),
    );
    check(
      filterAtlasSearch(index, sample.name).some(
        (e) => e.key === `structure:${sample.id}`,
      ),
    );
    for (const kind of ['region', 'structure', 'view'])
      check(filterAtlasSearch(index, '', kind).every((e) => e.kind === kind));
    same(filterAtlasSearch(index, '<nonexistent> ".script'), []);
    same(
      filterAtlasSearch(index, 'a'.repeat(256) + 'extraneous'),
      filterAtlasSearch(index, 'a'.repeat(256)),
    );
    searchScopes++;
  }
same(
  JSON.stringify(catalog),
  original,
  'Index/filter never mutate source data',
);
same(directionLabel('inferior', 'foot'), 'Plantar');
same(directionLabel('inferior', 'hand'), 'Inferior');

const require = createRequire(import.meta.url),
  React = require('react');
let active = false,
  states = [],
  cursor = 0,
  context,
  effects = [];
const shim = {
  ...React,
  useState: (initial) => {
    if (!active) return React.useState(initial);
    const i = cursor++;
    if (!(i in states))
      states[i] = typeof initial === 'function' ? initial() : initial;
    return [
      states[i],
      (next) => {
        states[i] = typeof next === 'function' ? next(states[i]) : next;
      },
    ];
  },
  useCallback: (fn, deps) => (active ? fn : React.useCallback(fn, deps)),
  useMemo: (fn, deps) => (active ? fn() : React.useMemo(fn, deps)),
  useContext: (value) => (active ? context : React.useContext(value)),
  useId: () => (active ? 'navigation-test' : React.useId()),
  useEffect: (fn, deps) =>
    active ? effects.push(fn) : React.useEffect(fn, deps),
};
const output = await build({
  entryPoints: ['app/atlas-workspace.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'next/link'],
  loader: { '.css': 'empty' },
});
const vmModule = { exports: {} };
runInNewContext(output.outputFiles[0].text, {
  module: vmModule,
  exports: vmModule.exports,
  console,
  URLSearchParams,
  process: { env: { NODE_ENV: 'test' } },
  require: (id) =>
    id === 'react' ? shim : id === 'next/link' ? () => null : require(id),
});
const api = vmModule.exports;
function render(fn, props) {
  active = true;
  cursor = 0;
  effects = [];
  const result = fn(props);
  active = false;
  return result;
}
const walk = (node, predicate, result = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node);
    React.Children.forEach(node.props.children, (child) =>
      walk(child, predicate, result),
    );
  }
  return result;
};
const child = React.createElement('div', { 'data-unchanged-scene': true });
states = [];
let tree = render(api.AtlasWorkspace, { exam: false, children: child });
same(tree.props.value.mode, 'explore');
tree.props.value.chooseMode('dissect');
tree = render(api.AtlasWorkspace, { exam: false, children: child });
same(tree.props.value.mode, 'dissect');
same(tree.props.value.panels.tools, true);
same(tree.props.value.panels.info, false);
same(walk(tree, (n) => n === child).length, 1);
tree.props.value.toggleFocus();
tree = render(api.AtlasWorkspace, { exam: false, children: child });
same(tree.props.value.focusView, true);
same(tree.props.value.mode, 'dissect');
tree.props.value.chooseMode('practice');
tree = render(api.AtlasWorkspace, { exam: true, children: child });
same(tree.props.value.mode, 'practice');
same(tree.props.value.panels.info, true);
same(tree.props.value.panels.tools, false);
tree.props.value.chooseMode('explore');
tree = render(api.AtlasWorkspace, { exam: true, children: child });
same(tree.props.value.mode, 'practice');
tree = render(api.AtlasWorkspace, { exam: false, children: child });
same(
  tree.props.value.mode,
  'practice',
  'Exiting answers does not discard chosen workspace',
);
context = tree.props.value;
same(
  render(api.WorkspaceOnly, { modes: ['explore'], children: child }).props
    .hidden,
  true,
);
same(
  render(api.WorkspaceOnly, { modes: ['practice'], children: child }).props
    .hidden,
  false,
);
same(
  walk(tree, (n) => n === child).length,
  1,
  'Focus and mode leave child identity unchanged',
);
let infoRequests = 0;
context = { ...context, showInfo: () => infoRequests++ };
render(api.PracticeAttention, { exam: true, answered: true });
effects.forEach((fn) => fn());
same(infoRequests, 1);
render(api.PracticeAttention, { exam: true, answered: false });
effects.forEach((fn) => fn());
same(infoRequests, 1);
const directionCalls = [];
tree = render(api.CameraViewMenu, {
  value: 'anterior',
  region: 'foot',
  onChange: (value) => directionCalls.push(value),
});
for (const value of [...cameraDirections, null, 'bogus'])
  tree.props.onValueChange(value);
same(directionCalls, [...cameraDirections]);
same(
  Array.from(api.noteGroups.flatMap((g) => g.sections.map(([id]) => id))).sort(
    (a, b) => a.localeCompare(b, 'en'),
  ),
  ['anatomy', 'clinical', 'ct', 'function', 'mri', 'pathology', 'ultrasound'],
);
same(api.noteGroups.map((g) => g.title).join('/'), 'Anatomy/Clinical/Imaging');

const calls = [],
  region = 'head-neck',
  side = 'both';
context = {
  mode: 'explore',
  exam: false,
  chooseMode: (mode) => calls.push(['mode', mode]),
  showInfo: () => calls.push(['info']),
};
const props = {
  catalog,
  region,
  side,
  onSelect: (id) => calls.push(['select', id]),
  onWindow: (id) => calls.push(['window', id]),
  onFocus: (id) => calls.push(['focus', id]),
};
const index = atlasSearchIndex(catalog, region, side);
let activationCases = 0;
for (const type of ['select', 'window', 'focus']) {
  const entry = index.find((e) => e.action.type === type);
  states = [
    true,
    entry.label,
    type === 'select' ? 'structure' : 'view',
    100,
    null,
  ];
  calls.length = 0;
  tree = render(api.AtlasSearch, props);
  const button = walk(
    tree,
    (n) => n.type === 'button' && n.key === entry.key,
  )[0];
  check(button, `Found ${type} search action`);
  button.props.onClick();
  if (type === 'select') same(calls, [['select', entry.action.id], ['info']]);
  else {
    same(calls, [], 'Preview does not alter dissection');
    tree = render(api.AtlasSearch, props);
    const confirm = walk(
      tree,
      (n) => n.props.children === 'Open study view',
    )[0];
    check(confirm);
    confirm.props.onClick();
    same(calls, [
      ['mode', 'dissect'],
      [type, entry.action.id],
    ]);
  }
  same(states[0], false, 'Search closes after confirmed action');
  activationCases++;
}
const entry = index.find((e) => e.action.type === 'select');
states = [true, entry.label, 'structure', 100, null];
calls.length = 0;
tree = render(api.AtlasSearch, props);
const stale = walk(tree, (n) => n.type === 'button' && n.key === entry.key)[0];
context.exam = true;
stale.props.onClick();
same(calls, [], 'Exam disables search mutations');
const result = {
  passed: true,
  checks,
  searchScopes,
  sourceLinks,
  activationCases,
  modeAndFocusState: true,
  sourceGeometryChanged: false,
  browserInteractionTesting: false,
  clinicalValidation: false,
  limitations:
    'Source-linked index, exact existing recipe membership and actual component event closures with injected hooks. Browser layout, dialog focus/keyboard, touch, zoom and GPU acceptance remain pending.',
};
await fs.writeFile(
  'docs/atlas-navigation-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
