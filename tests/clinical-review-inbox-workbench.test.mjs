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

let slots = [], cursor = 0, cleanup, calls = [], view, priorSummaryRef, focusEvents = [];
const listNode = { scrollTop: 0 };
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
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
const response = body => ({ ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': context }), json: async () => body });
const finish = () => { cleanup?.(); cleanup = null; priorSummaryRef?.(null); priorSummaryRef = null; };
const begin = async (pageCount = 1) => {
  finish(); slots = []; calls = []; focusEvents = []; listNode.scrollTop = 0;
  render(); render(); assert.equal(calls.length, 1);
  calls[0].resolve(response(batch(1, pageCount, items(50)))); await tick(); render();
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

test('only committed explicit pagination resets the scrollable list', async () => {
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
  render(); assert.equal(listNode.scrollTop, 170);
  finish();
});

test('scroll containment applies only above desktop width and height thresholds', () => {
  const css = readFileSync(new URL('../components/clinical-review-inbox.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(min-width:901px\) and \(min-height:681px\)/);
  const desktop = css.split('@media(min-width:901px) and (min-height:681px)')[1];
  assert.match(desktop, /clinical-review-inbox-workbench \{ display:grid/);
  assert.match(desktop, /clinical-review-inbox-list \{ max-height:min\(48vh,30rem\); overflow-x:hidden; overflow-y:auto/);
  assert.match(css, /@media\(min-width:1100px\) and \(min-height:681px\)/);
  assert.match(css, /clinical-review-inbox-filters label:first-child \{ grid-column:1 \/ -1/);
  assert(!css.split('@media(min-width:901px) and (min-height:681px)')[0].includes('overflow-y:auto'));
});
