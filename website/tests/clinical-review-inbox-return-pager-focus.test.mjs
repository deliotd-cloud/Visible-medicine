import { priorPagerInboxSource as priorInboxSource } from './inbox-deferred-return-source-role.mjs';
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
const componentPath = join(ownRoot, 'components/ClinicalReviewInbox.tsx');
const transpile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const contractModule = { exports: {} };
runInNewContext(transpile(join(sourceRoot, 'lib/clinical-review-inbox-contract.ts')),
  { module: contractModule, exports: contractModule.exports, structuredClone, require: sourceRequire });
const contract = contractModule.exports;
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
  status: approved && index === 0 ? 'approval-recorded' : 'not-started', capability: 'decision',
}));
const response = ({ approved = false, token = context, catalog = revision } = {}) => ({
  ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': token }),
  json: async () => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution',
    catalogRevision: catalog, page: 1, pageCount: 1, selectionTotal: 25, nextPage: null, items: rows(approved), approval: false }),
});

// The only product-source delta allowed in this proposal is the three pager-focus seams.
test('historical pager proposal reconstructs its original component after removing three pager-focus seams', () => {
  const after = priorInboxSource(readFileSync(componentPath, 'utf8'));
  const inverse = after
    .replace('  const resultsPager = useRef<HTMLElement | null>(null);\n', '')
    .replace('origin && (resultsList.current?.contains(origin) || resultsPager.current?.contains(origin))', 'origin && resultsList.current?.contains(origin)')
    .replace('<nav ref={resultsPager} className="clinical-review-inbox-pages"', '<nav className="clinical-review-inbox-pages"');
  assert.equal(createHash('sha256').update(inverse).digest('hex'), 'daa77c9e5686865053aa8ce0c156860f807a75ec75905f71f7a13a7aa7b77bb0');
});

function harness() {
  const slots = [], listeners = new Map(), pending = [], summaryFocus = [];
  let cursor = 0, cleanup, tree, visibilityState = 'visible', href = 'https://example.test/workspace/clinical-review-inbox';
  const add = (name, callback) => { const group = listeners.get(name) ?? new Set(); group.add(callback); listeners.set(name, group); };
  const remove = (name, callback) => listeners.get(name)?.delete(callback);
  const emit = name => { for (const callback of listeners.get(name) ?? []) callback(); };
  const body = { isConnected: true }, outside = { isConnected: true }, filter = { isConnected: false };
  const row = { isConnected: false }, next = { isConnected: false };
  const document = { get visibilityState() { return visibilityState; }, addEventListener: add, removeEventListener: remove, activeElement: body, body };
  const summary = { isConnected: false, focus(options) { summaryFocus.push(options); document.activeElement = this; } };
  const list = { contains(node) { return node === row && row.isConnected; }, scrollTop: 0 };
  const pager = { contains(node) { return node === next && next.isConnected; } };
  const window = { location: { get href() { return href; }, reload() {} }, history: { state: null, replaceState(_state, _title, path) { href = new URL(path, href).href; } }, addEventListener: add, removeEventListener: remove };
  const shim = { ...React,
    useId() { const index = cursor++; return slots[index] ??= 'pager-test'; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useEffect(callback) { const index = cursor++; if (!(index in slots)) { cleanup = callback(); slots[index] = true; } },
  };
  const module = { exports: {} };
  runInNewContext(transpile(componentPath), { module, exports: module.exports, window, document, URL, Headers, Response, AbortController, structuredClone,
    require(name) {
      if (name === 'react') return shim;
      if (name === 'react/jsx-runtime') return sourceRequire(name);
      if (name === '../lib/clinical-review-inbox-contract') return contract;
      if (name === '../lib/clinical-review-fetch') return { clinicalReviewFetch: (url, options) => new Promise(resolveFetch => pending.push({ url, options, resolve: resolveFetch })) };
      if (name.endsWith('.css')) return {};
      throw Error(`Unexpected dependency: ${name}`);
    },
  });
  const render = () => {
    cursor = 0; tree = module.exports.ClinicalReviewInbox();
    const listElement = walk(tree, element => element.props.id === 'clinical-review-inbox-results')[0];
    const pagerElement = walk(tree, element => element.type === 'nav' && element.props['aria-label'] === 'Inbox rows')[0];
    const summaryElement = walk(tree, element => element.props.id === 'clinical-review-inbox-results-summary')[0];
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
  const begin = async () => { render(); assert.equal(pending.length, 1); pending[0].resolve(response()); await tick(); render(); assert(next.isConnected); };
  const recheck = () => { leave(); returnToInbox(); render(); assert.equal(pending.length, 2); };
  const finish = async options => { pending[1].resolve(response(options)); await tick(); render(); };
  const changeFilter = () => { const input = walk(tree, element => element.type === 'input' && element.props.type === 'search')[0]; input.props.onChange({ target: { value: 'Synthetic 01' } }); render(); };
  return { begin, recheck, finish, render, changeFilter, leave, returnToInbox, pending, summaryFocus, document, body, outside, filter, row, next,
    setHref(value) { href = value; },
    cleanup() { cleanup?.(); },
  };
}

test('25 matching rows become 24: removed focused Next hands focus to summary once', async () => {
  const h = harness(); await h.begin(); h.document.activeElement = h.next; h.recheck();
  assert.equal(h.summaryFocus.length, 0); await h.finish({ approved: true });
  assert.equal(h.next.isConnected, false); assert.equal(h.document.activeElement === h.body, false);
  assert.equal(h.summaryFocus.length, 1); assert.equal(h.summaryFocus[0].preventScroll, true);
  h.render(); assert.equal(h.summaryFocus.length, 1); h.cleanup();
});

test('surviving Next and retained filter keep focus through an automatic recheck', async () => {
  for (const origin of ['next', 'filter']) {
    const h = harness(); await h.begin(); h.document.activeElement = h[origin]; h.recheck();
    await h.finish(); assert.equal(h.document.activeElement, h[origin]); assert.equal(h.summaryFocus.length, 0); h.cleanup();
  }
});

test('intervening focus and changed filter epoch retire the pending handoff', async () => {
  const moved = harness(); await moved.begin(); moved.document.activeElement = moved.next; moved.recheck();
  moved.document.activeElement = moved.outside; await moved.finish({ approved: true });
  assert.equal(moved.document.activeElement, moved.outside); assert.equal(moved.summaryFocus.length, 0); moved.cleanup();
  const filtered = harness(); await filtered.begin(); filtered.document.activeElement = filtered.next; filtered.recheck();
  filtered.changeFilter(); await filtered.finish({ approved: true });
  assert.equal(filtered.summaryFocus.length, 0); filtered.cleanup();
});

test('changed context, route, and unmount cannot reuse a pager handoff', async () => {
  const changed = harness(); await changed.begin(); changed.document.activeElement = changed.next; changed.recheck();
  await changed.finish({ approved: true, token: hash('d') });
  assert.equal(changed.summaryFocus.length, 0); changed.cleanup();
  const route = harness(); await route.begin(); route.document.activeElement = route.next; route.recheck();
  route.setHref('https://example.test/atlas/3d'); route.cleanup();
  await route.finish({ approved: true }); assert.equal(route.summaryFocus.length, 0);
  const gone = harness(); await gone.begin(); gone.document.activeElement = gone.next; gone.recheck();
  gone.cleanup(); assert(gone.pending[1].options.signal.aborted); await gone.finish({ approved: true });
  assert.equal(gone.summaryFocus.length, 0);
});

test('a removed focused worksheet row retains its existing summary handoff', async () => {
  const h = harness(); await h.begin(); h.document.activeElement = h.row; h.recheck();
  await h.finish({ approved: true });
  assert.equal(h.row.isConnected, false); assert.equal(h.summaryFocus.length, 1);
  h.render(); assert.equal(h.summaryFocus.length, 1);
  h.cleanup();
});
