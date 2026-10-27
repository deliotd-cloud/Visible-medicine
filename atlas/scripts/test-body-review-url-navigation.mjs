import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const proposalRoot = fileURLToPath(new URL('../', import.meta.url));
const root = process.env.VM_ATLAS_ROOT || proposalRoot;
const require = createRequire(resolve(root, 'package.json'));
const React = require('react');
const { transformSync } = require('esbuild');
const source = readFileSync(resolve(proposalRoot, 'app/review/body/review-dashboard.tsx'), 'utf8');
const { code } = transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'automatic', target: 'es2022' });
const headingModule = { exports: {} };
const { code: headingCode } = transformSync(readFileSync(resolve(root, 'lib/teaching-heading.ts'), 'utf8'),
  { loader: 'ts', format: 'cjs', target: 'es2022' });
runInNewContext(headingCode, { module: headingModule, exports: headingModule.exports });
const component = name => function Component() { throw Error(`Unexpected render: ${name}`); };
const ui = names => Object.fromEntries(names.map(name => [name, component(name)]));
const mocks = {
  'next/link': { default: component('Link') },
  '@/components/review-sign-in-link': { ReviewSignInLink: component('ReviewSignInLink') },
  '../../brand': { Brand: component('Brand') },
  '@/components/ui/button': { Button: component('Button') },
  '@/components/ui/input': { Input: component('Input') },
  '@/components/ui/select': ui(['Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem']),
  '@/components/ui/alert-dialog': ui(['AlertDialog', 'AlertDialogAction', 'AlertDialogCancel',
    'AlertDialogContent', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogTitle']),
  '../../body-types': { bodySystems: { skeleton: { name: 'Skeleton' } } },
  '@/lib/body-review-search': { bodyReviewQueue(rows, region, system, query) {
    return rows.filter(row => (region === 'all' || row.regions.includes(region)) &&
      (system === 'all' || row.system === system) && row.name.toLowerCase().includes(query.toLowerCase()));
  } },
  '@/lib/body-review-response': { async parseBodyReviewResponse(data) { return data; } },
  '@/lib/teaching-heading': headingModule.exports,
  './body-decision-editor': { BodyDecisionEditor: component('BodyDecisionEditor') },
  '../review-model-preview': { ReviewModelPreview: component('ReviewModelPreview') },
};
const rows = [0, 1, 2].map(i => ({
  id: `synthetic-${i}`, name: `Structure ${i}`, fmaId: `FMA${i}`,
  laterality: 'left', region: i === 2 ? 'forearm' : 'thorax',
  regions: [i === 2 ? 'forearm' : 'thorax'], system: 'skeleton',
}));
let slots, cursor, effects, effectCursor, layouts, layoutCursor, pending, requests;
const hook = {
  ...React,
  useState(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
  },
  useRef(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = { current: initial };
    return slots[i];
  },
  useMemo(fn) { return fn(); },
  useEffect(fn, deps) { schedule(effects, effectCursor++, fn, deps); },
  useLayoutEffect(fn, deps) { schedule(layouts, layoutCursor++, fn, deps); },
};
function schedule(list, index, fn, deps) {
  const prior = list[index];
  if (!prior || !deps || deps.some((value, i) => !Object.is(value, prior.deps?.[i]))) {
    pending.push(() => { prior?.cleanup?.(); list[index] = { deps, cleanup: fn() }; });
  }
}
const url = { current: new URL('https://local.test/review/body?structure=synthetic-0&mode=review#notes'), replacements: [] };
const location = {};
for (const key of ['href', 'pathname', 'search', 'hash']) {
  Object.defineProperty(location, key, { get: () => url.current[key] });
}
const state = { prior: 'router-state' };
const window = {
  location,
  history: {
    state,
    length: 7,
    replaceState(nextState, title, path) {
      assert.equal(nextState, state, 'preserve router history state');
      assert.equal(title, '');
      url.current = new URL(path, url.current);
      url.replacements.push(path);
    },
    pushState() { throw Error('Worksheet navigation must not push history'); },
  },
  addEventListener() {}, removeEventListener() {},
};
const scope = { exports: {} };
runInNewContext(code, {
  module: scope, exports: scope.exports, AbortController, HTMLElement: class HTMLElement {},
  requestAnimationFrame(fn) { fn(); }, document: { activeElement: null }, window, URL,
  fetch(requestUrl, options) { return new Promise(resolve => requests.push({ requestUrl, options, resolve })); },
  require(name) {
    if (name === 'react') return hook;
    if (name === 'react/jsx-runtime') return require(name);
    if (name in mocks) return mocks[name];
    throw Error(`Unexpected dependency ${name}`);
  },
});
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found));
  }
  return found;
};
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const button = (tree, label) => walk(tree, node => typeof node.props.onClick === 'function' && text(node) === label)[0];
function setup() {
  slots = []; cursor = 0; effects = []; effectCursor = 0; layouts = []; layoutCursor = 0;
  pending = []; requests = [];
  url.current = new URL('https://local.test/review/body?structure=synthetic-0&mode=review#notes');
  url.replacements = [];
  let currentRows = rows;
  const render = () => {
    cursor = effectCursor = layoutCursor = 0;
    const tree = scope.exports.BodyReviewDashboard({ rows: currentRows, initialId: rows[0].id, initialRegion: 'all',
      regions: [{ id: 'thorax', name: 'Thorax' }, { id: 'forearm', name: 'Forearm' }] });
    const updates = pending; pending = []; updates.forEach(fn => fn());
    return tree;
  };
  const move = direction => button(render(), `${direction} structure`).props.onClick({
    currentTarget: { isConnected: true, disabled: false, focus() {} },
  });
  const selected = () => text(walk(render(), node => node.props['aria-pressed'] === true)[0]);
  const dirty = async () => {
    requests.at(-1).resolve({ ok: true, json: async () => ({
      structureId: rows[0].id, materialHash: 'test-hash', atlasLink: '/atlas',
      source: { structure: { id: rows[0].id, name: rows[0].name, fmaId: rows[0].fmaId,
        laterality: 'left', sources: [] }, credit: '' }, topics: [],
    }) });
    await new Promise(resolve => setImmediate(resolve));
    walk(render(), node => typeof node.props.onDirty === 'function')[0].props.onDirty(true);
    render();
  };
  render();
  return { render, move, selected, dirty,
    changeRows(value) { currentRows = value; },
    cleanup() { effects.forEach(x => x.cleanup?.()); layouts.forEach(x => x.cleanup?.()); } };
}

test('accepted Next/Previous replace only structure, preserve other URL parts and history length', () => {
  const h = setup();
  h.move('Next');
  assert.equal(url.current.searchParams.get('structure'), 'synthetic-1');
  assert.equal(url.current.searchParams.get('mode'), 'review');
  assert.equal(url.current.hash, '#notes');
  assert.equal(window.history.length, 7);
  assert.match(h.selected(), /Structure 1/);
  h.move('Previous');
  assert.equal(url.current.searchParams.get('structure'), 'synthetic-0');
  assert.equal(url.replacements.length, 2);
  assert.equal(window.history.length, 7);
  h.cleanup();
});

test('dirty Keep editing retains URL; accepted discard replaces it once', async () => {
  const h = setup(); await h.dirty();
  h.move('Next');
  assert.equal(url.replacements.length, 0);
  assert.match(h.selected(), /Structure 0/);
  const dialog = walk(h.render(), node => typeof node.props.onOpenChange === 'function')[0];
  dialog.props.onOpenChange(false);
  assert.equal(url.replacements.length, 0);
  h.move('Next');
  const stale = button(h.render(), 'Discard edits and continue');
  stale.props.onClick();
  assert.equal(url.current.searchParams.get('structure'), 'synthetic-1');
  assert.equal(url.replacements.length, 1);
  stale.props.onClick();
  assert.equal(url.replacements.length, 1);
  h.cleanup();
});

test('changed queue invalidates a dirty pending navigation without changing URL', async () => {
  const h = setup(); await h.dirty();
  h.move('Next');
  h.changeRows([...rows]);
  h.render();
  button(h.render(), 'Discard edits and continue').props.onClick();
  assert.equal(url.current.searchParams.get('structure'), 'synthetic-0');
  assert.equal(url.replacements.length, 0);
  assert.match(h.selected(), /Structure 0/);
  h.cleanup();
});

test('accepted filter clears stale structure only; region trigger displays catalog label', () => {
  const h = setup();
  const select = walk(h.render(), node => typeof node.props.onValueChange === 'function')[0];
  select.props.onValueChange('forearm');
  assert.equal(url.current.searchParams.has('structure'), false);
  assert.equal(url.current.searchParams.get('mode'), 'review');
  assert.equal(url.current.hash, '#notes');
  assert.equal(window.history.length, 7);
  assert.equal(h.selected(), '');
  const trigger = walk(h.render(), node => node.props['aria-labelledby'] === 'body-review-region-label')[0];
  assert.equal(text(trigger), 'Forearm');
  h.cleanup();
});

test('page and summary use primary source region', () => {
  const page = readFileSync(resolve(root, 'app/review/body/page.tsx'), 'utf8');
  const material = readFileSync(resolve(root, 'lib/body-review-material.ts'), 'utf8');
  const catalog = JSON.parse(readFileSync(resolve(root, 'public/models/bodyparts3d/cubital-veins/catalog.json'), 'utf8'));
  const vein = catalog.structures.find(row => row.name === 'Right median antebrachial vein');
  assert.equal(vein.region, 'forearm');
  assert.equal(vein.regions[0], 'shoulder-arm');
  assert.match(material, /region: s\.region,/);
  assert.match(page, /initialRegion=\{selected\?\.region/);
});
