/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component source harness */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

// Source-only harness: transpile in memory; no bundler, renderer, browser or private data.
const website = 'F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const require = createRequire(`${website}/package.json`);
const React = require('react');
const ts = require('typescript');
const transpile = path => ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText;
const contract = { exports: {} };
runInNewContext(transpile(`${website}/lib/clinical-review-inbox-contract.ts`),
  { module: contract, exports: contract.exports, structuredClone });

let slots = [], cursor = 0, calls = [], cleanup, nextInstance = 0, priorSummaryRef;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  useId() { const i = cursor++; if (!(i in slots)) slots[i] = `inbox-instance-${++nextInstance}`; return slots[i]; },
  useEffect(fn, deps) { const i = cursor++, prior = slots[i];
    if (!prior || !deps || deps.some((value, index) => !Object.is(value, prior.deps?.[index]))) {
      prior?.dispose?.(); const dispose = fn(); slots[i] = { deps, dispose }; cleanup = dispose;
    } },
};
const component = { exports: {} };
runInNewContext(transpile(new URL('../components/ClinicalReviewInbox.tsx', import.meta.url)), {
  module: component, exports: component.exports, AbortController, Headers, Response, URL, structuredClone,
  window: { location: { reload() {} } },
  require: name => name === 'react' ? shim : name === 'react/jsx-runtime' ? require(name) :
    name === '../lib/clinical-review-inbox-contract' ? contract.exports :
    name === '../lib/clinical-review-fetch' ? { clinicalReviewFetch: (url, options) => new Promise(resolve => calls.push({ url, options, resolve })) } :
    name.endsWith('.css') ? {} : require(name),
});
const { ClinicalReviewInbox } = component.exports;
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node);
  React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const render = () => { cursor = 0; const tree = ClinicalReviewInbox();
  const summary = walk(tree, n => n.props.className === 'clinical-review-inbox-result')[0];
  priorSummaryRef?.(null); priorSummaryRef = summary?.props.ref; priorSummaryRef?.({ focus() {} });
  return tree;
};
const tick = () => new Promise(resolve => setImmediate(resolve));
const sha = char => char.repeat(64);
const item = (key, status, options = {}) => ({ key, title: `Synthetic ${key}`, area: 'structures', scopeLabel: 'Body',
  href: `/workspace/atlas-review?selection=${key}`, trackLabel: 'Anatomy', revision: sha('c'), status,
  capability: 'decision', ...options });
const batch = items => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution',
  catalogRevision: sha('b'), page: 1, pageCount: 1, selectionTotal: items.length, nextPage: null, items, approval: false });
const response = body => ({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': sha('a') }), json: async () => body });
const reset = () => { cleanup?.(); priorSummaryRef?.(null); slots = []; cursor = 0; calls = []; cleanup = undefined; priorSummaryRef = undefined; };
const start = async items => { reset(); const empty = render(); assert.equal(walk(empty, n => n.type === 'ol').length, 0);
  assert.equal(calls.length, 1); calls[0].resolve(response(batch(items))); await tick(); let tree = render();
  const status = walk(tree, n => n.type === 'select' && n.props['aria-label'] === 'Status')[0];
  assert(status); status.props.onChange({ target: { value: 'all' } }); tree = render(); return tree; };
const rows = tree => walk(tree, n => n.type === 'ol' && n.props.className === 'clinical-review-inbox-list')
  .flatMap(list => walk(list, n => n.type === 'li'));
const expected = li => [walk(li, n => n.props.className?.startsWith?.('clinical-review-inbox-status'))[0],
  walk(li, n => n.props.className === 'clinical-review-inbox-capability')[0],
  walk(li, n => n.props.className === 'clinical-review-inbox-change-reason')[0]].filter(Boolean);
function assertLinkContext(li, override) {
  const link = walk(li, n => n.type === 'a')[0];
  assert(link); assert.equal(link.props.target, '_blank'); assert.equal(link.props.rel, 'noopener noreferrer');
  const ids = (override ?? link.props['aria-describedby'])?.split(/\s+/).filter(Boolean);
  assert(ids?.length, 'worksheet link has a nonempty description');
  const nodes = walk(li, n => n.props.id && ids.includes(n.props.id));
  assert.equal(nodes.length, ids.length, 'every description ID resolves within its own row');
  assert.deepEqual(ids.map(id => words(nodes.find(node => node.props.id === id))), expected(li).map(words),
    'status, capability and optional reason are associated in visible order');
  return ids;
}

test('each worksheet link describes exactly its own status, capability and optional change reason', async () => {
  const tree = await start([
    item('not-started', 'not-started'), item('in-progress', 'in-progress'),
    item('changes-required', 'changes-required'),
    item('re-review', 're-review', { changeReason: 'source-or-teaching' }),
    item('approval-recorded', 'approval-recorded'),
    item('inspection-required', 'inspection-required', { capability: 'inspection-only' }),
    item('unavailable', 'unavailable', { revision: null, capability: 'inspection-only' }),
  ]);
  assert.equal(rows(tree).length, 7);
  const ids = rows(tree).flatMap(li => assertLinkContext(li));
  assert.equal(new Set(ids).size, ids.length, 'no IDs collide across queue rows');
  const beforeRefresh = new Map(rows(tree).map(li => [words(walk(li, n => n.type === 'a')[0]), assertLinkContext(li).join(' ')]));
  const filter = walk(tree, n => n.type === 'input' && n.props.type === 'search')[0];
  filter.props.onChange({ target: { value: 'Synthetic changes-required' } });
  const filtered = render(); assert.equal(rows(filtered).length, 1);
  const only = rows(filtered)[0]; assert.equal(assertLinkContext(only).join(' '), beforeRefresh.get(words(walk(only, n => n.type === 'a')[0])),
    'the item retains its context IDs when filtering changes its displayed position');
  reset();
});

test('separate inbox instances cannot share IDs; cross-row and dangling references are refused', async () => {
  const first = await start([item('first', 're-review', { changeReason: 'viewer-only' }), item('second', 'changes-required'),
    item('a b', 'not-started', { href: '/workspace/atlas-review?selection=odd' }),
    item('a-b', 'not-started', { href: '/workspace/atlas-review?selection=odd' })]);
  const pair = rows(first), firstIds = assertLinkContext(pair[0]), secondIds = assertLinkContext(pair[1]);
  assert.throws(() => assertLinkContext(pair[0], secondIds.join(' ')), /every description ID resolves within its own row/);
  assert.throws(() => assertLinkContext(pair[0], `${firstIds.join(' ')} missing-status`), /every description ID resolves within its own row/);
  const firstInstanceIds = pair.flatMap(li => assertLinkContext(li));
  const second = await start([item('first', 're-review', { changeReason: 'viewer-only' })]);
  const secondInstanceIds = rows(second).flatMap(li => assertLinkContext(li));
  assert.equal(firstInstanceIds.some(id => secondInstanceIds.includes(id)), false);
  reset();
});

test('empty and invalidated scans expose no stale link descriptions', async () => {
  reset(); const initial = render(); assert.equal(rows(initial).length, 0);
  calls[0].resolve({ ok: false, status: 403, headers: new Headers() }); await tick();
  const invalid = render(); assert.equal(rows(invalid).length, 0);
  assert.equal(walk(invalid, n => n.type === 'a' && n.props['aria-describedby']).length, 0);
  assert(words(invalid).includes('Scan invalidated; no statuses are shown.'));
  reset();
});
