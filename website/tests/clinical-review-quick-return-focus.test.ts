/* Controlled actual-component test. Proposal uses VM_REVIEW_SOURCE_ROOT for dependencies. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const ownRoot = fileURLToPath(new URL('../', import.meta.url));
const ownDependencies = existsSync(join(ownRoot, 'package.json')) && existsSync(join(ownRoot, 'lib/clinical-review-inbox-contract.ts'));
const sourceRoot = ownDependencies ? ownRoot : process.env.VM_REVIEW_SOURCE_ROOT;
assert(sourceRoot, 'Proposal tests need VM_REVIEW_SOURCE_ROOT');
const sourceRequire = createRequire(join(resolve(sourceRoot), 'package.json'));
const ts = sourceRequire('typescript'), React = sourceRequire('react');
const componentPath = join(process.env.VM_REVIEW_COMPONENT_ROOT || ownRoot, 'components/ClinicalReviewInbox.tsx');
const transpile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const contractModule = { exports: {} };
runInNewContext(transpile(join(sourceRoot, 'lib/clinical-review-inbox-contract.ts')),
  { module: contractModule, exports: contractModule.exports, structuredClone, require: sourceRequire });
const contract = contractModule.exports;
const searchModule = { exports: {} };
runInNewContext(transpile(join(sourceRoot, 'lib/clinical-review-search.ts')),
  { module: searchModule, exports: searchModule.exports });
const search = searchModule.exports;
const walk = (node, predicate, out = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) out.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, out));
  }
  return out;
};
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const tick = () => new Promise(done => setImmediate(done));
const hash = character => character.repeat(64);
const context = hash('a'), revision = hash('b');
const rows = approved => Array.from({ length: 25 }, (_, index) => ({
  key: `row-${index}`, title: `Synthetic ${String(index).padStart(2, '0')}`, area: 'structures', scopeLabel: 'Body',
  href: `/workspace/atlas-review?selection=row-${index}`, trackLabel: 'Anatomy', revision: hash('c'),
  status: index === 0 ? approved ? 'approval-recorded' : 'not-started' : 'unavailable', capability: 'decision',
}));
const response = ({ approved = false, token = context, catalog = revision } = {}) => ({
  ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': token }),
  json: async () => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution',
    catalogRevision: catalog, page: 1, pageCount: 1, selectionTotal: 25, nextPage: null, items: rows(approved), approval: false }),
});

function harness() {
  const slots = [], listeners = new Map(), pending = [], summaryFocus = [], quickFocus = [];
  let cursor = 0, cleanup, tree, visibilityState = 'visible', href = 'https://example.test/workspace/clinical-review-inbox';
  const add = (name, callback) => { const group = listeners.get(name) ?? new Set(); group.add(callback); listeners.set(name, group); };
  const remove = (name, callback) => listeners.get(name)?.delete(callback);
  const emit = name => { for (const callback of listeners.get(name) ?? []) callback(); };
  const body = { isConnected: true }, outside = { isConnected: true }, filter = { isConnected: false };
  const row = { isConnected: false }, next = { isConnected: false };
  const quick = { isConnected: false };
  const quickHeading = { isConnected: true, focus(options) { quickFocus.push(options); document.activeElement = this; } };
  const document = { get visibilityState() { return visibilityState; }, addEventListener: add, removeEventListener: remove, activeElement: body, body };
  const summary = { isConnected: false, focus(options) { summaryFocus.push(options); document.activeElement = this; } };
  const list = { contains(node) { return node === row && row.isConnected; }, scrollTop: 0 };
  const pager = { contains(node) { return node === next && next.isConnected; } };
  const window = { location: { get href() { return href; }, reload() {} }, history: { state: null, replaceState(_state, _title, path) { href = new URL(path, href).href; } }, addEventListener: add, removeEventListener: remove };
  const shim = { ...React,
    useId() { const index = cursor++; return slots[index] ??= 'pager-test'; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useEffect(callback) { const index = cursor++; if (!(index in slots)) { const dispose = callback(); if (typeof dispose === 'function') cleanup = dispose; slots[index] = true; } },
  };
  const module = { exports: {} };
  runInNewContext(transpile(componentPath), { module, exports: module.exports, window, document, URL, Headers, Response, AbortController, structuredClone,
    require(name) {
      if (name === 'react') return shim;
      if (name === 'react/jsx-runtime') return sourceRequire(name);
      if (name === '../lib/clinical-review-inbox-contract') return contract;
      if (name === '../lib/clinical-review-search') return search;
      if (name === '../lib/clinical-review-fetch') return { clinicalReviewFetch: (url, options) => new Promise(resolveFetch => pending.push({ url, options, resolve: resolveFetch })) };
      if (name === './ClinicalReviewQuickStart') return { ClinicalReviewQuickStart: () => null }; if (name.endsWith('.css')) return {};
      throw Error(`Unexpected dependency: ${name}`);
    },
  });
  const render = () => {
    cursor = 0; tree = module.exports.ClinicalReviewInbox();
    const listElement = walk(tree, element => element.props.id === 'clinical-review-inbox-results')[0];
    const pagerElement = walk(tree, element => element.type === 'nav' && element.props['aria-label'] === 'Inbox rows')[0];
    const summaryElement = walk(tree, element => element.props.id === 'clinical-review-inbox-results-summary')[0];
    const quickElement = walk(tree, element => element.type?.name === 'ClinicalReviewQuickStart')[0];
    quick.isConnected = !!quickElement?.props.items.some(item => item.status === 'not-started');
    if (!quick.isConnected && document.activeElement === quick) document.activeElement = body;
    if (quickElement?.props.linkRef) quickElement.props.linkRef.current = quick.isConnected ? quick : null;
    quickElement?.props.headingRef?.(quickHeading);
    row.isConnected = !!walk(tree, element => element.type === 'li' && element.key === 'row-0')[0]; next.isConnected = !!pagerElement;
    filter.isConnected = !!walk(tree, element => element.type === 'input' && element.props.type === 'search')[0];
    summary.isConnected = !!summaryElement;
    if ((!row.isConnected && document.activeElement === row) || (!next.isConnected && document.activeElement === next) || (!filter.isConnected && document.activeElement === filter)) document.activeElement = body;
    if (listElement?.props.ref) listElement.props.ref.current = list;
    if (pagerElement?.props.ref) pagerElement.props.ref.current = pager;
    summaryElement?.props.ref?.(summary);
    return tree;
  };
  const leave = () => { visibilityState = 'hidden'; emit('visibilitychange'); emit('blur'); };
  const returnToInbox = () => { visibilityState = 'visible'; emit('visibilitychange'); emit('focus'); };
  const begin = async () => { render(); assert.equal(pending.length, 1); pending[0].resolve(response()); await tick(); render(); assert(quick.isConnected); };
  const recheck = () => { leave(); returnToInbox(); render(); assert.equal(pending.length, 2); };
  const finish = async options => { pending[1].resolve(response(options)); await tick(); render(); };
  const fail = async () => { pending[1].resolve({ ok: false, status: 500 }); await tick(); render(); };
  const changeFilter = () => { const input = walk(tree, element => element.type === 'input' && element.props.type === 'search')[0]; input.props.onChange({ target: { value: 'Synthetic 01' } }); render(); };
  return { begin, recheck, finish, fail, render, changeFilter, leave, returnToInbox, pending, summaryFocus, quickFocus, quick, quickHeading, document, body, outside, filter, row, next,
    setHref(value) { href = value; },
    cleanup() { cleanup?.(); },
  };
}

test('removed focused Quick review link hands focus to its persistent heading once', async () => {
  const h = harness(); await h.begin();
  h.document.activeElement = h.quick; h.recheck();
  await h.finish({ approved: true });
  assert.equal(h.quick.isConnected, false);
  assert.equal(h.document.activeElement, h.quickHeading);
  assert.equal(h.quickFocus.length, 1);
  assert.equal(h.quickFocus[0].preventScroll, true);
  h.render(); assert.equal(h.quickFocus.length, 1); h.cleanup();
});

test('surviving link or moved focus receives no handoff', async () => {
  const same = harness(); await same.begin(); same.document.activeElement = same.quick; same.recheck();
  await same.finish(); assert.equal(same.document.activeElement, same.quick); assert.equal(same.quickFocus.length, 0); same.cleanup();
  const moved = harness(); await moved.begin(); moved.document.activeElement = moved.quick; moved.recheck();
  moved.document.activeElement = moved.outside; await moved.finish({ approved: true });
  assert.equal(moved.document.activeElement, moved.outside); assert.equal(moved.quickFocus.length, 0); moved.cleanup();
});

test('filter epoch, changed context and unmount cancel Quick review handoff', async () => {
  const filter = harness(); await filter.begin(); filter.document.activeElement = filter.quick; filter.recheck();
  filter.changeFilter(); await filter.finish({ approved: true }); assert.equal(filter.quickFocus.length, 0); filter.cleanup();
  const context = harness(); await context.begin(); context.document.activeElement = context.quick; context.recheck();
  await context.finish({ approved: true, token: hash('d') }); assert.equal(context.quickFocus.length, 0); context.cleanup();
  const gone = harness(); await gone.begin(); gone.document.activeElement = gone.quick; gone.recheck();
  gone.cleanup(); await gone.finish({ approved: true }); assert.equal(gone.quickFocus.length, 0);
});

test('failed return scan does not focus the Quick review heading', async () => {
  const h = harness(); await h.begin(); h.document.activeElement = h.quick; h.recheck();
  await h.fail(); assert.equal(h.quickFocus.length, 0); h.cleanup();
});

test('Quick review exposes its link and persistent focus target to inbox', () => {
  const helperModule = { exports: {} };
  runInNewContext(transpile(join(sourceRoot, 'lib/clinical-review-quick-start.ts')),
    { module: helperModule, exports: helperModule.exports, require: sourceRequire });
  const childModule = { exports: {} };
  runInNewContext(transpile(join(ownRoot, 'components/ClinicalReviewQuickStart.tsx')),
    { module: childModule, exports: childModule.exports,
      require(name) {
        if (name === 'react') return { useState: initial => [initial, () => {}] };
        if (name === 'react/jsx-runtime') return sourceRequire(name);
        if (name === '../lib/clinical-review-inbox-contract') return contract;
        if (name === '../lib/clinical-review-quick-start') return helperModule.exports;
        if (name.endsWith('.css')) return {};
        throw Error(`Unexpected dependency: ${name}`);
      },
    });
  const linkRef = { current: null }, headingRef = () => {};
  const tree = childModule.exports.ClinicalReviewQuickStart({ items: rows(false), loading: false, scanComplete: true, linkRef, headingRef });
  const heading = walk(tree, element => element.type === 'h2')[0];
  const link = walk(tree, element => element.type === 'a')[0];
  assert.equal(heading.props.ref, headingRef);
  assert.equal(heading.props.tabIndex, -1);
  assert.equal(link.props.ref, linkRef);
});

