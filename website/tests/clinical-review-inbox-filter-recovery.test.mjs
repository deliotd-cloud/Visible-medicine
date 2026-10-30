/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component commit harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url), React = require('react');
let slots = [], cursor = 0, cleanup, calls = [], view, priorSummaryRef, priorSearchRef, focus = [];
let nextId = 0;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  useId() { const i = cursor++; if (!(i in slots)) slots[i] = `inbox-harness-${++nextId}`; return slots[i]; },
  useEffect(fn, deps) { const i = cursor++, prior = slots[i];
    if (!prior || !deps || deps.some((value, index) => !Object.is(value, prior.deps?.[index]))) {
      prior?.dispose?.(); const dispose = fn(); slots[i] = { deps, dispose }; cleanup = () => { for (const slot of slots) slot?.dispose?.(); };
    } },
};
const built = await build({ stdin: { contents: "export { ClinicalReviewInbox } from './components/ClinicalReviewInbox';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' } });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, AbortController, Headers, Response, URL, structuredClone,
  window: { location: { reload() { throw new Error('reset must not navigate'); } } },
  fetch(url, options) { return new Promise(resolve => calls.push({ url, options, resolve })); },
  require: name => name === 'react' ? shim : require(name),
});
const { ClinicalReviewInbox } = scope.exports;
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const attach = (ref, node) => { if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; };
const render = (commit = true) => {
  cursor = 0; const tree = ClinicalReviewInbox();
  if (commit) {
    view = tree;
    const search = walk(tree, n => n.type === 'input' && n.props.type === 'search')[0];
    const summary = walk(tree, n => n.props.className === 'clinical-review-inbox-result')[0];
    attach(priorSearchRef, null); attach(priorSummaryRef, null);
    priorSearchRef = search?.props.ref; priorSummaryRef = summary?.props.ref;
    attach(priorSearchRef, { focus() { focus.push('search'); } });
    attach(priorSummaryRef, { focus() { focus.push('summary'); } });
  }
  return tree;
};
const button = label => walk(view, n => n.type === 'button' && words(n) === label)[0];
const control = label => { const parent = walk(view, n => n.type === 'label' && words(n).startsWith(label))[0]; assert(parent, label);
  return walk(parent, n => n.type === 'input' || n.type === 'select')[0]; };
const change = (label, value) => { control(label).props.onChange({ target: { value } }); render(); };
const summary = () => walk(view, n => n.props.className === 'clinical-review-inbox-result')[0];
const tick = () => new Promise(resolve => setImmediate(resolve));
const sha = char => char.repeat(64), context = sha('a'), revision = sha('b');
const item = (i, status = 're-review', overrides = {}) => ({ key: `row-${i}`, title: `Synthetic ${i}`, area: 'structures', scopeLabel: 'Body', href: `/workspace/atlas-review?selection=row-${i}`, trackLabel: 'Anatomy', revision: sha('c'), status, capability: 'decision', ...overrides });
const batch = (page, pageCount, rows) => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: revision,
  page, pageCount, selectionTotal: 60, nextPage: page < pageCount ? page + 1 : null, items: rows, approval: false });
const response = (body, token = context) => ({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': token }), json: async () => body });
const finish = () => { cleanup?.(); cleanup = null; attach(priorSearchRef, null); attach(priorSummaryRef, null); priorSearchRef = priorSummaryRef = null; };
const begin = async (rows = Array.from({ length: 50 }, (_, i) => item(i)), pageCount = 1) => {
  finish(); slots = []; calls = []; focus = []; render(); render(); assert.equal(calls.length, 1);
  calls[0].resolve(response(batch(1, pageCount, rows))); await tick(); render(); assert.deepEqual(focus, []);
};
const assertDefault = () => {
  assert.equal(control('Search reviews').props.value, ''); assert.equal(control('Area').props.value, 'all');
  assert.equal(control('Status').props.value, 'needing-review'); assert.equal(button('Reset filters'), undefined);
  assert.equal(words(summary()), 'Showing 1–24 of 50 matching loaded rows.');
};

test('reset restores exact defaults and page one from each filter, with committed search focus and no fetch', async () => {
  for (const filter of ['Search reviews', 'Area', 'Status', 'Change']) {
    await begin(); button('Next').props.onClick(); render(); assert.equal(focus.at(-1), 'summary');
    if (filter === 'Change') { change('Status', 're-review'); change('Change', 'viewer-only'); }
    else change(filter, { 'Search reviews': 'Synthetic 49', Area: 'head-learning', Status: 'all' }[filter]);
    assert(button('Reset filters')); const count = calls.length, before = focus.length;
    button('Reset filters').props.onClick(); assert.equal(focus.length, before);
    render(false); assert.equal(focus.length, before, 'abandoned render cannot focus');
    render(); assertDefault(); assert.equal(focus.at(-1), 'search'); assert.equal(focus.length, before + 1);
    render(); assert.equal(focus.length, before + 1); assert.equal(calls.length, count); finish();
  }
});

test('default view has no reset and typing or background append does not move focus', async () => {
  await begin(Array.from({ length: 26 }, (_, i) => item(i)), 2);
  assert.equal(button('Reset filters'), undefined);
  change('Search reviews', 'Synthetic'); assert.deepEqual(focus, []);
  calls[1].resolve(response(batch(2, 2, [item(50)]))); await tick(); render();
  assert.deepEqual(focus, []); assert.equal(calls.length, 2); finish();
});

test('empty states distinguish filters, complete default scan, and incomplete scans', async () => {
  await begin([item(1, 'approval-recorded')]);
  assert(words(view).includes('No known review items need attention in this completed scan'));
  assert(!words(view).includes('approved')); assert.equal(button('Reset filters'), undefined); finish();
  await begin([item(1)]); change('Search reviews', 'absent');
  assert(words(view).includes('No loaded rows match these filters'));
  assert(button('Reset filters')); finish();
  await begin([], 2); assert(words(view).includes('No status rows are loaded yet. This scan is incomplete.'));
  button('Pause').props.onClick(); render(); assert(words(view).includes('incomplete'));
  button('Resume from page 2').props.onClick(); calls[2].resolve({ ok: false, status: 503, headers: new Headers() }); await tick(); render();
  assert(words(view).includes('incomplete')); assert(!words(view).includes('No known review items need attention in this completed scan')); finish();
  await begin([]); assert(words(view).includes('No known review items need attention in this completed scan')); finish();
});

test('stale reset cannot cross filter epoch, refresh, invalid context or unmount', async () => {
  await begin(); change('Search reviews', 'Synthetic'); const oldReset = button('Reset filters');
  change('Area', 'head-learning'); oldReset.props.onClick(); render(); assert.equal(control('Area').props.value, 'head-learning'); finish();
  await begin(); change('Search reviews', 'Synthetic'); const refreshReset = button('Reset filters');
  button('Refresh reviews').props.onClick(); refreshReset.props.onClick(); render();
  calls[1].resolve(response(batch(1, 1, [item(1)]))); await tick(); render();
  assert.equal(control('Search reviews').props.value, 'Synthetic'); assert.deepEqual(focus, []); finish();
  await begin(Array.from({ length: 50 }, (_, i) => item(i)), 2); change('Search reviews', 'Synthetic'); const invalidReset = button('Reset filters');
  calls[1].resolve({ ok: false, status: 401, headers: new Headers() }); await tick(); invalidReset.props.onClick(); render();
  assert(!summary()); assert.deepEqual(focus, []); finish();
  await begin(); change('Search reviews', 'Synthetic'); const unmountedReset = button('Reset filters');
  cleanup(); cleanup = null; unmountedReset.props.onClick(); render();
  assert.equal(control('Search reviews').props.value, 'Synthetic'); assert.deepEqual(focus, []); finish();
});

test('pending reset focus is retired by refresh before a reset commit', async () => {
  await begin(); change('Search reviews', 'Synthetic'); button('Reset filters').props.onClick();
  button('Refresh reviews').props.onClick(); render(); assert.deepEqual(focus, []);
  assert.equal(calls.length, 2); finish();
});
