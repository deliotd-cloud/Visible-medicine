/* oxlint-disable react-hooks/rules-of-hooks -- controlled component commit harness */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const React = require('react');
const ts = require('typescript');
const contractSource = new URL('../lib/clinical-review-inbox-contract.ts', import.meta.url);
const stagingContractSource = 'F:/VisibleMedicine/website/lib/clinical-review-inbox-contract.ts';
const compile = file => ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText;
const contract = { exports: {} };
runInNewContext(compile(existsSync(contractSource) ? contractSource : stagingContractSource), { module: contract, exports: contract.exports, structuredClone });

let slots = [], cursor = 0, cleanup, calls = [], view, priorSummaryRef, focusEvents = [], filterFocusEvents = [];
let nextId = 0;
const listNode = { scrollTop: 0 };
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
const component = { exports: {} };
const source = new URL('../components/ClinicalReviewInbox.tsx', import.meta.url);
runInNewContext(compile(source), { module: component, exports: component.exports, AbortController, Headers, Response, URL, structuredClone,
  window: { location: { reload() {} } },
  require: name => name === 'react' ? shim : name === 'react/jsx-runtime' ? require(name) :
    name === '../lib/clinical-review-inbox-contract' ? contract.exports :
    name === '../lib/clinical-review-fetch' ? { clinicalReviewFetch: (url, options) => new Promise(resolve => calls.push({ url, options, resolve })) } :
    name.endsWith('.css') ? {} : require(name),
});
const { ClinicalReviewInbox } = component.exports;
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const render = (commit = true) => {
  cursor = 0; const tree = ClinicalReviewInbox();
  if (commit) {
    view = tree;
    const list = walk(tree, n => n.type === 'ol')[0];
    if (list?.props.ref) list.props.ref.current = listNode;
    const search = walk(tree, n => n.type === 'input' && n.props.type === 'search')[0];
    if (search?.props.ref) search.props.ref.current = { focus() { filterFocusEvents.push('search'); } };
    const summary = walk(tree, n => n.props.className === 'clinical-review-inbox-result')[0];
    priorSummaryRef?.(null); priorSummaryRef = summary?.props.ref;
    priorSummaryRef?.({ focus() { focusEvents.push(words(summary)); } });
  }
  return tree;
};
const button = label => { const found = walk(view, n => n.type === 'button' && words(n) === label)[0]; assert(found, label); return found; };
const control = label => { const parent = walk(view, n => n.type === 'label' && words(n).startsWith(label))[0]; assert(parent, label); return walk(parent, n => n.type === 'input' || n.type === 'select')[0]; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const sha = char => char.repeat(64), context = sha('a'), revision = sha('b');
const item = i => ({ key: `row-${i}`, title: `Synthetic ${i}`, area: 'structures', scopeLabel: 'Body', href: `/workspace/atlas-review?selection=row-${i}`, trackLabel: 'Anatomy', revision: sha('c'), status: 'not-started', capability: 'decision' });
const items = (count, offset = 0) => Array.from({ length: count }, (_, i) => item(i + offset));
const batch = (page, pageCount, rows) => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: revision, page, pageCount, selectionTotal: 60, nextPage: page < pageCount ? page + 1 : null, items: rows, approval: false });
const response = (body, responseContext = context) => ({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': responseContext }), json: async () => body });
const finish = () => { cleanup?.(); cleanup = null; priorSummaryRef?.(null); priorSummaryRef = null; };
const begin = async (pageCount = 1, rows = items(50)) => {
  finish(); slots = []; calls = []; focusEvents = []; filterFocusEvents = []; listNode.scrollTop = 0;
  render(); render(); assert.equal(calls.length, 1);
  calls[0].resolve(response(batch(1, pageCount, rows))); await tick(); render();
  assert.equal(focusEvents.length, 0);
};

test('desktop workbench keeps controls and accessible results as separate panes', async () => {
  await begin();
  const workbench = walk(view, n => n.props.className === 'clinical-review-inbox-workbench')[0];
  assert(workbench);
  const panes = React.Children.toArray(workbench.props.children);
  assert.deepEqual(panes.map(n => n.props.className), ['clinical-review-inbox-tools', 'clinical-review-inbox-results-pane']);
  assert(walk(panes[0], n => n.props.className?.startsWith?.('clinical-review-inbox-filters')).length);
  const browse = walk(panes[0], n => n.props.className === 'clinical-review-inbox-browse')[0];
  assert.equal(walk(browse, n => n.props.className === 'clinical-review-inbox-disclosure').length, 1);
  const list = walk(panes[1], n => n.type === 'ol')[0];
  const summary = walk(panes[1], n => n.props.className === 'clinical-review-inbox-result')[0];
  const bar = walk(panes[1], n => n.props.className === 'clinical-review-inbox-result-bar')[0];
  assert(list && summary && bar);
  assert.equal(list.props.tabIndex, 0);
  assert.equal(list.props['aria-labelledby'], summary.props.id);
  assert.equal(React.Children.count(list.props.children), 24);
  assert.equal(button('Next').props['aria-controls'], list.props.id);
  finish();
});

test('revision disclosures name their own row across keyboard pagination', async () => {
  await begin();
  const summaries = () => walk(view, n => n.type === 'ol' && n.props.className === 'clinical-review-inbox-list')
    .flatMap(list => walk(list, n => n.type === 'summary' && words(n) === 'Exact worksheet revision'));
  // Preserve the existing alphabetic queue order: Synthetic 10 precedes Synthetic 2.
  const orderedTitles = Array.from({ length: 50 }, (_, i) => `Synthetic ${i}`).sort((a, b) => a.localeCompare(b));
  assert.deepEqual(summaries().map(n => n.props['aria-label']),
    orderedTitles.slice(0, 24).map(title => `Exact worksheet revision for ${title}, Body, Anatomy`));
  const requestCount = calls.length;
  button('Next').props.onClick(); render();
  assert.deepEqual(summaries().map(n => n.props['aria-label']),
    orderedTitles.slice(24, 48).map(title => `Exact worksheet revision for ${title}, Body, Anatomy`));
  assert.equal(calls.length, requestCount, 'row naming does not request or change review data');
  finish();
});

test('only committed explicit pagination or filter actions reset the scrollable list', async () => {
  await begin(2);
  listNode.scrollTop = 180;
  calls[1].resolve(response(batch(2, 2, items(10, 50)))); await tick(); render();
  assert.equal(listNode.scrollTop, 180); assert.equal(focusEvents.length, 0);
  const next = button('Next'); next.props.onClick();
  render(false); assert.equal(listNode.scrollTop, 180);
  render(); assert.equal(listNode.scrollTop, 0);
  assert.deepEqual(focusEvents, ['Showing 25–48 of 60 matching loaded rows.']);
  listNode.scrollTop = 170;
  next.props.onClick(); render(); assert.equal(listNode.scrollTop, 170);
  control('Search reviews').props.onChange({ target: { value: 'Synthetic 49' } });
  render(false); assert.equal(listNode.scrollTop, 170, 'an uncommitted filter render leaves the list in place');
  render(); assert.equal(listNode.scrollTop, 0, 'the committed search result begins at the top');
  assert.deepEqual(focusEvents, ['Showing 25–48 of 60 matching loaded rows.'], 'filtering does not move focus to results');
  finish();
});

test('search, area, status, change and Reset scroll only their committed result views', async () => {
  const rows = items(50);
  rows[0] = { ...rows[0], status: 're-review', changeReason: 'source-or-teaching' };
  rows[1] = { ...rows[1], status: 're-review', changeReason: 'viewer-only' };
  rows[2] = { ...rows[2], area: 'head-learning' };
  await begin(1, rows);
  const change = (label, value) => {
    listNode.scrollTop = 130;
    control(label).props.onChange({ target: { value } });
    render(false);
    assert.equal(listNode.scrollTop, 130, `${label} has not committed`);
    render();
    assert.equal(listNode.scrollTop, 0, `${label} committed its first result row`);
  };
  change('Search reviews', 'Synthetic');
  change('Area', 'structures');
  change('Status', 're-review');
  change('Change', 'viewer-only');
  listNode.scrollTop = 140;
  button('Reset filters').props.onClick();
  render(false); assert.equal(listNode.scrollTop, 140);
  render(); assert.equal(listNode.scrollTop, 0);
  assert.deepEqual(filterFocusEvents, ['search'], 'Reset still returns focus to Search');
  assert.equal(focusEvents.length, 0, 'filter actions leave results focus alone');
  finish();
});

test('stale filters and background loading cannot reset a committed list', async () => {
  await begin(2);
  const oldSearch = control('Search reviews');
  listNode.scrollTop = 155;
  calls[1].resolve(response(batch(2, 2, items(10, 50)))); await tick(); render();
  assert.equal(listNode.scrollTop, 155, 'page completion is background data loading');
  control('Status').props.onChange({ target: { value: 'all' } }); render();
  listNode.scrollTop = 165;
  oldSearch.props.onChange({ target: { value: 'Synthetic 49' } }); render();
  assert.equal(listNode.scrollTop, 165, 'a control retained from an older filter epoch is inert');
  assert.equal(control('Search reviews').props.value, '');
  finish();
});

test('a new scan context retires an uncommitted filter scroll intent', async () => {
  await begin();
  listNode.scrollTop = 190;
  control('Search reviews').props.onChange({ target: { value: 'Synthetic 49' } });
  render(false); assert.equal(listNode.scrollTop, 190);
  button('Refresh reviews').props.onClick();
  render(); assert.equal(listNode.scrollTop, 190);
  calls[1].resolve(response(batch(1, 1, items(50)), sha('d'))); await tick(); render();
  assert.equal(listNode.scrollTop, 190, 'a later account/source context cannot consume the old filter intent');
  assert.equal(focusEvents.length, 0);
  finish();
});

test('original tall-desktop scroll containment and width thresholds remain intact', () => {
  const css = readFileSync(new URL('../components/clinical-review-inbox.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(min-width:901px\) and \(min-height:681px\)/);
  const desktop = css.split('@media(min-width:901px) and (min-height:681px)')[1];
  assert.match(desktop, /clinical-review-inbox-workbench \{ display:grid/);
  assert.match(desktop, /clinical-review-inbox-list \{ max-height:min\(48vh,30rem\); overflow-x:hidden; overflow-y:auto/);
  assert.match(css, /@media\(min-width:1100px\) and \(min-height:681px\)/);
  assert.match(css, /clinical-review-inbox-filters label:first-child \{ grid-column:1 \/ -1/);
  assert(!css.split('@media(min-width:901px) and (min-height:681px)')[0].includes('overflow-y:auto'));
});
