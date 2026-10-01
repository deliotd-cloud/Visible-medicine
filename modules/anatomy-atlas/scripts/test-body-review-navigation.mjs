/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component hooks */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';
import { build as materialBuild } from './workspace-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
let states, cursor, effectCursor, effectSlots, pending, requests, confirms, confirmResult;
let verificationPromises = [];
const shim = {
  ...React,
  useState(initial) {
    const i = cursor++;
    if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  },
  useMemo(fn) { return fn(); },
  useEffect(fn, deps) {
    const i = effectCursor++, previous = effectSlots[i];
    if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
      pending.push(() => {
        previous?.cleanup?.();
        effectSlots[i] = { deps, cleanup: fn() };
      });
    }
  },
};
const compiled = await build({ stdin: {
  contents: "export { BodyReviewDashboard } from './app/review/body/review-dashboard';",
  resolveDir: process.cwd(), loader: 'tsx',
}, bundle: true, write: false, platform: 'node', format: 'cjs' });
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope, exports: scope.exports, AbortController, URL, URLSearchParams, Error, structuredClone, TextEncoder,
  crypto: { subtle: { digest(...args) {
    const promise = crypto.subtle.digest(...args);
    verificationPromises.push(promise);
    return promise;
  } } },
  window: {
    confirm(message) { confirms.push(message); return confirmResult; },
    addEventListener() {}, removeEventListener() {},
  },
  fetch(url, options) { return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })); },
  require(name) {
    if (name === 'react') return shim;
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (name === 'next/image') return ({ unoptimized: _unoptimized, ...props }) => React.createElement('img', props);
    return require(name);
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
const button = (tree, label) => walk(tree, n => typeof n.props.onClick === 'function' && text(n) === label)[0];
const syntheticRows = Array.from({ length: 25 }, (_, i) => ({
  id: `synthetic-${i}`, name: `Structure ${String(i).padStart(2, '0')}`,
  fmaId: `FMA${i + 1}`, system: i % 2 ? 'muscles' : 'skeleton',
  laterality: 'left', regions: [i % 2 ? 'forearm' : 'thorax'],
}));
// Pure queue-only tests retain synthetic rows. Tests that load a worksheet use
// actual current-build evidence: invented source IDs must not pass the parser.
const materialBundle = await materialBuild({
  stdin: { contents: "export * from './lib/body-review-material.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const materialApi = await import('data:text/javascript;base64,' + Buffer.from(materialBundle.outputFiles[0].text).toString('base64'));
const realRows = materialApi.bodyReviewSummaries.slice(0, 25)
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
const worksheets = new Map(await Promise.all(realRows.map(async row => [row.id, await materialApi.bodyReviewMaterial(row.id)])));
const worksheet = id => {
  assert(worksheets.has(id), 'Loaded fixture must be an actual current-build structure');
  return JSON.parse(JSON.stringify(worksheets.get(id)));
};
const settle = async () => {
  await new Promise(resolve => setImmediate(resolve));
  await Promise.all(verificationPromises.splice(0));
  await new Promise(resolve => setImmediate(resolve));
};
function setup({ rows = syntheticRows, initialId = rows[0]?.id ?? null, initialRegion = 'all' } = {}) {
  states = []; effectSlots = []; pending = []; requests = []; confirms = []; confirmResult = true; verificationPromises = [];
  const render = () => {
    cursor = 0; effectCursor = 0;
    const tree = scope.exports.BodyReviewDashboard({ rows, initialId, initialRegion,
      regions: [{ id: 'forearm', name: 'Forearm' }, { id: 'thorax', name: 'Thorax' }] });
    const updates = pending; pending = []; updates.forEach(fn => fn());
    return tree;
  };
  render();
  const navigation = () => walk(render(), n => n.props['aria-label'] === 'Structures in the filtered review queue')[0];
  const move = direction => button(navigation(), `${direction} structure`).props.onClick();
  const selected = () => walk(render(), n => n.props['aria-pressed'] === true)[0];
  const dirty = async () => {
    requests.at(-1).resolve({ ok: true, json: async () => worksheet(states[4]) });
    await settle();
    const editor = walk(render(), n => typeof n.props.onDirty === 'function')[0];
    assert(editor, 'Valid worksheet exposes the actual decision editor callback');
    editor.props.onDirty(true);
  };
  return { render, navigation, move, selected, dirty,
    cleanup() { effectSlots.forEach(slot => slot.cleanup?.()); } };
}

test('navigation bounds are disabled and position announces queue order without approval claims', () => {
  const h = setup();
  assert.equal(button(h.navigation(), 'Previous structure').props.disabled, true);
  assert.equal(button(h.navigation(), 'Next structure').props.disabled, false);
  assert(text(h.navigation()).includes('Structure 1 of 25 in the filtered queue'));
  const status = walk(h.navigation(), n => n.props.role === 'status')[0];
  assert.equal(status.props['aria-atomic'], 'true');
  h.move('Previous'); assert.equal(states[4], 'synthetic-0');
  for (let i = 0; i < 24; i++) h.move('Next');
  assert.equal(states[4], 'synthetic-24');
  assert.equal(button(h.navigation(), 'Next structure').props.disabled, true);
  h.move('Next'); assert.equal(states[4], 'synthetic-24');
  assert(!/approved|reviewed|saved/i.test(text(h.navigation())));
  h.cleanup();
});

test('sequential selection crosses both directions of the 20-row page boundary', () => {
  const h = setup({ initialId: 'synthetic-19' });
  h.move('Next');
  assert.equal(states[3], 1); assert.equal(states[4], 'synthetic-20');
  assert(text(h.selected()).startsWith('Structure 20'));
  h.move('Previous');
  assert.equal(states[3], 0); assert.equal(states[4], 'synthetic-19');
  assert(text(h.selected()).startsWith('Structure 19'));
  h.cleanup();
});

test('a deep-linked selection opens its queue page while manual paging retains selection', () => {
  const h = setup({ initialId: 'synthetic-24' });
  assert.equal(states[3], 1);
  assert(text(h.selected()).startsWith('Structure 24'));
  assert(text(h.navigation()).includes('Structure 25 of 25 in the filtered queue'));
  const requestCount = requests.length;
  button(h.render(), 'Previous').props.onClick();
  assert.equal(states[3], 0); assert.equal(states[4], 'synthetic-24');
  assert.equal(h.selected(), undefined);
  assert.equal(requests.length, requestCount);
  button(h.render(), 'Next').props.onClick();
  assert.equal(states[3], 1); assert.equal(states[4], 'synthetic-24');
  assert(text(h.selected()).startsWith('Structure 24'));
  h.cleanup();
});

test('region, system and search remain in force when moving within the filtered subset', () => {
  const h = setup({ initialId: 'synthetic-1', initialRegion: 'forearm' });
  const selects = walk(h.render(), n => typeof n.props.onValueChange === 'function');
  selects[1].props.onValueChange('muscles');
  walk(h.render(), n => n.props.id === 'body-review-query')[0].props.onChange({ target: { value: 'Structure 0' } });
  button(h.render(), 'Structure 01FMA2 · left').props.onClick();
  h.move('Next');
  assert.equal(states[4], 'synthetic-3');
  assert.deepEqual(states.slice(0, 3), ['forearm', 'muscles', 'Structure 0']);
  // FMA20 also matches the bounded term "0", so the real search includes row 19.
  assert(text(h.navigation()).includes('Structure 2 of 6 in the filtered queue'));
  h.cleanup();
});

test('empty, unselected and outside-filter selections cannot navigate', () => {
  for (const options of [{ rows: [] }, { initialId: null }, { initialId: 'missing' },
    { initialId: 'synthetic-0', initialRegion: 'forearm' }]) {
    const h = setup(options);
    assert.equal(button(h.navigation(), 'Previous structure').props.disabled, true);
    assert.equal(button(h.navigation(), 'Next structure').props.disabled, true);
    const before = JSON.stringify(states);
    h.move('Next'); h.move('Previous');
    assert.equal(JSON.stringify(states), before);
    h.cleanup();
  }
});

test('dirty cancellation retains selection, material and draft; confirmation only navigates', async () => {
  const h = setup({ rows: realRows }); await h.dirty();
  confirmResult = false;
  const before = JSON.stringify(states), requestCount = requests.length;
  h.move('Next');
  assert.equal(JSON.stringify(states), before);
  assert.equal(requests.length, requestCount); assert.equal(confirms.length, 1);
  confirmResult = true; h.move('Next');
  assert.equal(states[4], realRows[1].id); assert.equal(states[5], false);
  assert.equal(states[6], null); assert.equal(states[7], '');
  h.render();
  assert.equal(requests.length, requestCount + 1);
  assert(requests.every(request => request.url.startsWith('/api/body-review?structure=') && !request.options.method));
  h.cleanup();
});

test('clicking the selected queue row is a no-op even with dirty edits', async () => {
  const h = setup({ rows: realRows }); await h.dirty();
  const before = JSON.stringify(states), requestCount = requests.length;
  h.selected().props.onClick(); h.render();
  assert.equal(JSON.stringify(states), before); assert.equal(confirms.length, 0);
  assert.equal(requests.length, requestCount);
  h.cleanup();
});

test('actual navigation clears stale errors and superseded requests cannot replace the new worksheet', async () => {
  const h = setup({ rows: realRows }), initial = requests[0];
  h.move('Next'); h.render();
  assert.equal(initial.options.signal.aborted, true);
  initial.reject(new Error('Obsolete worksheet failure')); await settle();
  assert(!text(h.render()).includes('Obsolete worksheet failure'));
  requests.at(-1).reject(new Error('Current worksheet failure')); await settle();
  assert(text(h.render()).includes('Current worksheet failure'));
  h.move('Next');
  assert.equal(states[7], ''); assert.equal(states[6], null);
  h.render();
  requests.at(-1).resolve({ ok: true, json: async () => worksheet(realRows[2].id) }); await settle();
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function')[0].props.id, realRows[2].id);
  h.cleanup();
});

test('altered evidence cannot expose the decision editor; retry accepts the trusted worksheet', async () => {
  const h = setup({ rows: realRows });
  const altered = worksheet(realRows[0].id);
  altered.topics[0].body += ' Altered teaching under an unchanged revision.';
  requests.at(-1).resolve({ ok: true, json: async () => altered }); await settle();
  assert(text(h.render()).includes('Unexpected worksheet. Please retry.'));
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function').length, 0);
  button(h.render(), 'Retry').props.onClick(); h.render();
  requests.at(-1).resolve({ ok: true, json: async () => worksheet(realRows[0].id) }); await settle();
  assert(!text(h.render()).includes('Unexpected worksheet. Please retry.'));
  assert.equal(walk(h.render(), n => typeof n.props.onDirty === 'function').length, 1);
  h.cleanup();
});

test('navigation styles provide wrapping, visible focus and 44px targets without a fixed overlay', async () => {
  const css = await readFile('app/review/body/body-review.css', 'utf8');
  const rules = css.slice(css.indexOf('.body-review-structure-navigation {'), css.indexOf('.body-review-paper details {'));
  assert(rules.includes('flex-wrap: wrap'));
  assert(rules.includes('min-height: 44px')); assert(rules.includes('min-width: 44px'));
  assert(rules.includes('white-space: normal')); assert(rules.includes(':focus-visible'));
  assert(!rules.includes('position: fixed'));
});
