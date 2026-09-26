/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- controlled actual-component harness */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const baseline = process.argv.includes('--baseline');
const oldSource = baseline ? execFileSync('git', ['show', '365f3a15b13c2e22c5fd5a9c72e3ee4c253eabf5:app/atlas-workspace.tsx'], { encoding: 'utf8' }) : null;
let baselineOverrides = 0;
const require = createRequire(import.meta.url), React = require('react');
let active = false, states = [], stateCursor = 0, refs = [], refCursor = 0, effects = [];
const shim = { ...React,
  useState(initial) {
    if (!active) return React.useState(initial);
    const i = stateCursor++;
    if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  },
  useMemo: (fn, deps) => active ? fn() : React.useMemo(fn, deps),
  useCallback: (fn, deps) => active ? fn : React.useCallback(fn, deps),
  useContext: value => active ? context : React.useContext(value),
  useId: () => active ? 'pagination-focus' : React.useId(),
  useRef(value) {
    if (!active) return React.useRef(value);
    const i = refCursor++; return refs[i] ?? (refs[i] = { current: value });
  },
  useEffect: (fn, deps) => active ? effects.push(fn) : React.useEffect(fn, deps),
};
const built = await build({ stdin: {
  contents: "export {AtlasSearch} from './app/atlas-workspace'; export {atlasSearchIndex,filterAtlasSearch} from './lib/atlas-navigation'; export {groupAtlasSearchResults} from './lib/atlas-search-presentation';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, platform: 'node', format: 'cjs', write: false,
external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'next/link'], loader: { '.css': 'empty' },
plugins: baseline ? [{ name: 'exact-baseline-component', setup(api) {
  api.onLoad({ filter: /atlas-workspace\.tsx$/, namespace: 'component-test' }, args => {
    baselineOverrides++; return { contents: oldSource, loader: 'tsx', resolveDir: dirname(args.path) };
  });
} }] : [],
});
if (baseline) assert.equal(baselineOverrides, 1, 'exact Git component override executed once');
const scope = { exports: {} }, document = { activeElement: null };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, console, document,
  URLSearchParams, window: { innerWidth: 1280, innerHeight: 720 }, process: { env: { NODE_ENV: 'test' } },
  require: id => id === 'react' ? shim : id === 'next/link' ? () => null : require(id),
});
const { AtlasSearch, atlasSearchIndex, filterAtlasSearch, groupAtlasSearchResults } = scope.exports;
const catalog = JSON.parse(await fs.readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found));
  }
  return found;
};
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const find = (predicate, label) => { const node = walk(tree, predicate)[0]; assert(node, label); return node; };
class FocusNode {
  constructor(name, key) { this.name = name; this.isConnected = true; this.dataset = key ? { atlasSearchKey: key } : {}; this.focusCalls = 0; this.nodes = []; this.open = true; }
  focus() { this.focusCalls++; document.activeElement = this; }
  querySelectorAll(selector) { assert.equal(selector, '[data-atlas-search-key]'); return this.nodes; }
}
const calls = [], context = { mode: 'explore', exam: false, focusView: false, panelLayout: null,
  chooseMode: mode => calls.push(['mode', mode]), setPanelOpen: (...args) => calls.push(['panel', ...args]), showInfo: () => calls.push(['info']) };
const props = { catalog, region: 'head-neck', side: 'both', onSelect: id => calls.push(['select', id]),
  onWindow: id => calls.push(['window', id]), onFocus: id => calls.push(['focus', id]), onDissect: value => calls.push(['dissect', value]) };
let tree, currentEntries, root, relatedDetails, nodes;
function render() {
  active = true; stateCursor = 0; refCursor = 0; effects = [];
  tree = AtlasSearch(props); active = false; return tree;
}
function groups() { return groupAtlasSearchResults(filterAtlasSearch(currentEntries, states[1], states[2]), states[1], states[2]); }
function reset(fixture, direct = 12, related = 12) {
  states = [true, fixture.query, fixture.kind, direct, null, null, related]; refs = []; calls.length = 0;
  props.region = fixture.region; currentEntries = atlasSearchIndex(catalog, props.region, 'both');
  context.exam = false; document.activeElement = null; nodes = new Map();
  root = new FocusNode('dialog'); relatedDetails = new FocusNode('related details'); render(); commit();
}
function resultElements(container) { return walk(container, node => currentEntries.some(e => e.key === node.key)); }
function commit({ omitKey, disconnectedKey, detailsOpen = true } = {}) {
  find(node => node.props.className === 'atlas-search-dialog', 'search dialog').props.ref.current = root;
  const containers = walk(tree, node => node.props.className === 'atlas-search-results');
  for (const [index, container] of containers.entries()) {
    const list = new FocusNode(index ? 'related list' : 'direct list');
    list.nodes = resultElements(container).filter(node => node.key !== omitKey).map(node => {
      if (!baseline) assert.equal(node.props['data-atlas-search-key'], node.key, 'actual link/button keyed result');
      if (!nodes.has(node.key)) nodes.set(node.key, new FocusNode(node.type === 'button' ? 'result button' : 'result link', node.key));
      const target = nodes.get(node.key); target.isConnected = node.key !== disconnectedKey; return target;
    });
    if (container.props.ref) container.props.ref.current = list;
  }
  const details = walk(tree, node => node.type === 'details')[0];
  relatedDetails.open = detailsOpen;
  if (details?.props.ref) details.props.ref.current = relatedDetails;
  const confirmation = walk(tree, node => text(node) === 'Open study view')[0];
  if (confirmation?.props.ref) confirmation.props.ref.current = new FocusNode('preview confirmation');
  const pending = effects; effects = []; pending.forEach(effect => effect());
}
const fixtureCandidates = [];
for (const region of ['head-neck', 'thorax', 'foot', 'whole-body']) {
  const entries = atlasSearchIndex(catalog, region, 'both');
  for (const query of ['', 'a', 'artery', 'nerve', 'brain', 'eye', 'muscle', 'vein', 'bone'])
    for (const kind of ['all', 'structure', 'view']) {
      const group = groupAtlasSearchResults(filterAtlasSearch(entries, query, kind), query, kind);
      fixtureCandidates.push({ region, query, kind, ...group });
    }
}
const directFixture = fixtureCandidates.find(f => f.primary.length > 36 && f.primary[12].action.type === 'select');
const linkFixture = fixtureCandidates.find(f => f.primary.length > 12 && f.primary.slice(12).some(e => e.action.type === 'link'));
const relatedFixture = fixtureCandidates.find(f => f.related.length > 12);
const previewFixture = fixtureCandidates.find(f => f.kind === 'view' && f.primary.length > 12
  && f.primary.slice(0, 12).some(e => ['window', 'focus'].includes(e.action.type)));
assert(directFixture && linkFixture && relatedFixture && previewFixture, 'real catalogue supplies direct button/link, related and preview pagination fixtures');
function more(group) { return find(node => text(node) === (group === 'primary' ? 'Show more results' : 'Show more related study views'), `${group} show more`); }
function displayedKeys(group) {
  const keys = new Set(groups()[group].map(e => e.key));
  return walk(tree, node => keys.has(node.key)).map(node => node.key);
}
let scenarios = 0;
function page(fixture, group, { final = false } = {}) {
  const count = fixture[group].length, limit = final ? 12 + 24 * Math.floor((count - 13) / 24) : 12;
  reset(fixture, group === 'primary' ? limit : 12, group === 'related' ? limit : 12);
  const before = groups(), other = group === 'primary' ? 'related' : 'primary', otherKeys = displayedKeys(other);
  const target = before[group][limit], button = new FocusNode('Show more'); document.activeElement = button;
  more(group).props.onClick(); render(); commit();
  assert.equal(document.activeElement, nodes.get(target.key), `${group} focuses first newly exposed actual result`);
  assert.deepEqual(calls, [], 'pagination does not select, navigate or mutate workspace');
  assert.equal(states[1], fixture.query); assert.equal(states[2], fixture.kind);
  if (group === 'primary') assert.equal(states[6], 12, 'direct paging preserves related limit');
  else assert.equal(states[3], 12, 'related paging preserves direct limit');
  assert.deepEqual(displayedKeys(other), otherKeys, 'selected group paging preserves actual other-group rendered keys');
  if (final) assert.equal(walk(tree, node => text(node) === (group === 'primary' ? 'Show more results' : 'Show more related study views')).length, 0, 'final pagination button disappears');
  scenarios++;
}
// Baseline loads the actual old component. Its first targeted assertion fails
// because the still-focused Show more button never hands focus to a new result.
page(directFixture, 'primary');
if (baseline) throw new Error('Baseline unexpectedly preserved pagination focus');
page(directFixture, 'primary', { final: true });
const linkIndex = linkFixture.primary.findIndex((e, i) => i >= 12 && e.action.type === 'link');
reset(linkFixture, linkIndex); const linkTarget = groups().primary[linkIndex];
document.activeElement = new FocusNode('Show more'); more('primary').props.onClick(); render(); commit();
assert.equal(document.activeElement, nodes.get(linkTarget.key)); assert.equal(document.activeElement.name, 'result link'); assert.deepEqual(calls, []); scenarios++;
page(relatedFixture, 'related'); page(relatedFixture, 'related', { final: true });

for (const change of ['query', 'kind', 'close', 'exam', 'preview']) {
  reset(change === 'preview' ? previewFixture : directFixture);
  more('primary').props.onClick();
  const editing = new FocusNode(change); document.activeElement = editing;
  if (change === 'query') find(node => node.type === 'input' && node.props.type === 'search', 'query').props.onChange({ target: { value: 'ventricle' } });
  else if (change === 'kind') find(node => node.type === 'select', 'kind').props.onChange({ target: { value: 'view' } });
  else if (change === 'close') tree.props.onOpenChange(false);
  else if (change === 'exam') context.exam = true;
  else {
    const entry = groups().primary.slice(0, 12).find(e => ['window', 'focus'].includes(e.action.type)); assert(entry);
    find(node => node.key === entry.key, 'real preview result').props.onClick({ currentTarget: editing });
  }
  render(); commit();
  assert.notEqual(document.activeElement?.name, 'result button', `${change} cancels pending page focus`);
  assert.notEqual(document.activeElement?.name, 'result link', `${change} cancels pending page focus`);
  if (change !== 'preview') assert.equal(document.activeElement, editing);
  if (change === 'query' || change === 'kind') {
    assert.equal(states[3], 12, 'query/filter resets direct page limit');
    assert.equal(states[6], 12, 'query/filter resets related page limit');
  }
  assert.deepEqual(calls, []); scenarios++;
}
reset(directFixture); const absentTarget = groups().primary[12], retainedFocus = new FocusNode('editing control');
document.activeElement = retainedFocus; root.isConnected = false;
more('primary').props.onClick(); render(); commit({ omitKey: absentTarget.key });
assert.equal(document.activeElement, retainedFocus, 'missing result and disconnected dialog cause no focus attempt'); scenarios++;
for (const mode of ['removed', 'disconnected']) {
  reset(directFixture); const target = groups().primary[12];
  more('primary').props.onClick(); render();
  commit(mode === 'removed' ? { omitKey: target.key } : { disconnectedKey: target.key });
  assert.equal(document.activeElement, root, `${mode} new result falls back to still-open dialog`); scenarios++;
}
reset(relatedFixture); const beforeClose = new FocusNode('details summary'); document.activeElement = beforeClose;
more('related').props.onClick(); render(); commit({ detailsOpen: false });
assert.equal(document.activeElement, beforeClose, 'closed related disclosure does not steal focus'); scenarios++;
console.log(JSON.stringify({ passed: true, scenarios, actualComponent: true, actualCatalogue: true,
  browserAcceptance: false, limitations: 'Controlled hooks and explicit focus-node/details boundary; not browser-native DOM or visual acceptance.' }));
