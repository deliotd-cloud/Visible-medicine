/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component commit harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url), React = require('react');
let slots = [], cursor = 0, cleanup, calls = [], view, previousRef, focusEvents = [];
let nextId = 0;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  useId() { const i = cursor++; if (!(i in slots)) slots[i] = `inbox-harness-${++nextId}`; return slots[i]; },
  useEffect(fn, deps) { const i = cursor++, prior = slots[i];
    if (!prior || !deps || deps.some((value, index) => !Object.is(value, prior.deps?.[index]))) {
      prior?.dispose?.(); const dispose = fn(); slots[i] = { deps, dispose }; cleanup = dispose;
    } },
};
const built = await build({ stdin: { contents: "export { ClinicalReviewInbox } from './components/ClinicalReviewInbox';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' } });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, AbortController, Headers, Response, URL, structuredClone,
  window: { location: { reload() {} } }, fetch(url, options) { return new Promise(resolve => calls.push({ url, options, resolve })); },
  require: name => name === 'react' ? shim : require(name),
});
const { ClinicalReviewInbox } = scope.exports;
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const render = (commit = true) => {
  cursor = 0; const tree = ClinicalReviewInbox();
  if (commit) {
    view = tree;
    const summary = walk(tree, n => n.props.className === 'clinical-review-inbox-result')[0];
    previousRef?.(null); previousRef = summary?.props.ref;
    previousRef?.({ focus() { focusEvents.push(words(summary)); } });
  }
  return tree;
};
const button = label => { const found = walk(view, n => n.type === 'button' && words(n) === label)[0]; assert(found, label); return found; };
const control = label => { const parent = walk(view, n => n.type === 'label' && words(n).startsWith(label))[0]; assert(parent, label); return walk(parent, n => n.type === 'input' || n.type === 'select')[0]; };
const summary = () => walk(view, n => n.props.className === 'clinical-review-inbox-result')[0];
const tick = () => new Promise(resolve => setImmediate(resolve));
const sha = char => char.repeat(64), context = sha('a'), revision = sha('b');
const item = i => ({ key: `row-${String(i).padStart(2, '0')}`, title: `Synthetic ${String(i).padStart(2, '0')}`, area: 'structures', scopeLabel: 'Body', href: `/workspace/atlas-review?selection=row-${i}`, trackLabel: 'Anatomy', revision: sha('c'), status: 'not-started', capability: 'decision' });
const items = (count, offset = 0) => Array.from({ length: count }, (_, i) => item(i + offset));
const batch = (page, pageCount, rows) => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: revision, page, pageCount, selectionTotal: 60, nextPage: page < pageCount ? page + 1 : null, items: rows, approval: false });
const response = (body, token = context) => ({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': token }), json: async () => body });
const finish = () => { cleanup?.(); cleanup = null; previousRef?.(null); previousRef = null; };
const begin = async (pageCount = 1) => {
  finish(); slots = []; calls = []; focusEvents = []; render(); render(); assert.equal(calls.length, 1);
  calls[0].resolve(response(batch(1, pageCount, items(50)))); await tick(); render();
  assert.equal(focusEvents.length, 0);
};

test('pagination focuses and announces the new committed results, not an abandoned render', async () => {
  await begin();
  const first = summary();
  assert.equal(first.props.role, 'status'); assert.equal(first.props['aria-live'], 'polite'); assert.equal(first.props['aria-atomic'], 'true'); assert.equal(first.props.tabIndex, -1);
  const list = walk(view, n => n.type === 'ol')[0]; assert.equal(list.props['aria-labelledby'], first.props.id);
  const next = button('Next'); assert.equal(next.props['aria-controls'], list.props.id); assert.equal(next.props['aria-label'], 'Next page of review results');
  assert.equal(button('Previous').props.disabled, true);
  next.props.onClick(); assert.equal(focusEvents.length, 0);
  const abandoned = render(false); assert.equal(focusEvents.length, 0);
  const abandonedNext = walk(abandoned, n => n.type === 'button' && words(n) === 'Next')[0];
  abandonedNext.props.onClick(); // An uncommitted page must not skip the actual next page.
  render(); assert.deepEqual(focusEvents, ['Showing 25–48 of 50 matching loaded rows.']);
  assert(words(walk(view, n => n.type === 'ol')[0]).startsWith('Synthetic 24'));
  next.props.onClick(); render(); assert.equal(focusEvents.length, 1); // Retained old DOM callback.
  button('Previous').props.onClick(); render();
  assert.equal(focusEvents[1], 'Showing 1–24 of 50 matching loaded rows.');
  render(); assert.equal(focusEvents.length, 2); finish();
});

test('last page is bounded and repeated clicks before commit do not skip pages', async () => {
  await begin(); const next = button('Next'); next.props.onClick(); next.props.onClick(); render();
  assert.equal(words(summary()), 'Showing 25–48 of 50 matching loaded rows.');
  button('Next').props.onClick(); render(); assert.equal(words(summary()), 'Showing 49–50 of 50 matching loaded rows.');
  assert.equal(button('Next').props.disabled, true); button('Next').props.onClick(); render(); assert.equal(focusEvents.length, 2); finish();
});

test('background appends and completion do not steal focus or discard an explicit page request', async () => {
  await begin(2); button('Next').props.onClick();
  calls[1].resolve(response(batch(2, 2, items(10, 50)))); await tick();
  render(); assert.deepEqual(focusEvents, ['Showing 25–48 of 60 matching loaded rows.']);
  render(); assert.equal(focusEvents.length, 1); finish();
  await begin(2); calls[1].resolve(response(batch(2, 2, items(10, 50)))); await tick(); render();
  assert.equal(focusEvents.length, 0); assert(words(view).includes('scan complete')); finish();
});

test('filter changes reset pagination without moving focus and invalidate pending or retained controls', async () => {
  for (const [label, value] of [['Search reviews', 'Synthetic 49'], ['Area', 'structures'], ['Status', 'all']]) {
    await begin(); button('Next').props.onClick(); render(); const oldNext = button('Next');
    oldNext.props.onClick(); control(label).props.onChange({ target: { value } }); oldNext.props.onClick();
    render(); assert.equal(focusEvents.length, 1); assert(!words(summary()).includes('Showing 49–50'));
    assert(words(summary()).startsWith(label === 'Search reviews' ? 'Showing 1–1' : 'Showing 1–24')); finish();
  }
});

test('refresh invalidates old controls before commit and ignores late scan responses', async () => {
  await begin(2); const oldNext = button('Next'); oldNext.props.onClick(); button('Refresh reviews').props.onClick(); oldNext.props.onClick();
  assert(calls[1].options.signal.aborted); render(); assert(!summary());
  calls[1].resolve(response(batch(2, 2, [item(59)]))); await tick();
  calls[2].resolve(response(batch(1, 1, items(50)))); await tick(); render();
  assert.equal(words(summary()), 'Showing 1–24 of 50 matching loaded rows.'); assert.equal(focusEvents.length, 0); finish();
});

test('account or source invalidation cannot reuse old pagination or focus loaded rows', async () => {
  for (const invalid of [{ ok: false, status: 401, headers: new Headers() }, response(batch(2, 2, [item(59)]), sha('d'))]) {
    await begin(2); const oldNext = button('Next'); oldNext.props.onClick(); calls[1].resolve(invalid); await tick();
    oldNext.props.onClick(); render(); assert(words(view).includes('Scan invalidated')); assert(!summary()); assert.equal(focusEvents.length, 0); finish();
  }
});

test('unmount retires retained controls before ref detachment', async () => {
  await begin(); const next = button('Next'); cleanup(); cleanup = null;
  next.props.onClick(); render(); assert.equal(words(summary()), 'Showing 1–24 of 50 matching loaded rows.'); assert.equal(focusEvents.length, 0); finish();
});
