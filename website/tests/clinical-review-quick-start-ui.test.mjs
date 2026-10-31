import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const require = createRequire(import.meta.url), React = require('react'), ts = require('typescript');
function load(relative, resolve = require) {
  const module = { exports: {} };
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module, exports: module.exports, require: resolve, structuredClone });
  return module.exports;
}
const contract = load('../lib/clinical-review-inbox-contract.ts');
const helper = load('../lib/clinical-review-quick-start.ts');
const revision = 'b'.repeat(64);
const row = (key, overrides = {}) => ({ key, title: `Structure ${key}`, area: 'structures', scopeLabel: 'Shoulder · Right', href: `/workspace/atlas-review/body?selection=${key}&revision=${revision}`, trackLabel: 'Anatomy', revision, status: 'not-started', capability: 'decision', ...overrides });
const walk = (node, predicate, out = []) => {
  if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); }
  return out;
};
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
function harness(initial) {
  let slots = [], cursor = 0, props = initial, view;
  const shim = { ...React, useState: value => { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = next; }]; } };
  const component = load('../components/ClinicalReviewQuickStart.tsx', name => name === 'react' ? shim : name === '../lib/clinical-review-inbox-contract' ? contract : name === '../lib/clinical-review-quick-start' ? helper : name.endsWith('.css') ? {} : require(name));
  const render = changes => { props = { ...props, ...changes }; cursor = 0; view = component.ClinicalReviewQuickStart(props); return view; };
  render();
  return { render, find: predicate => walk(view, predicate), text: () => words(view), group(value) { walk(view, n => n.type === 'select')[1].props.onChange({ target: { value } }); render(); }, region(value) { walk(view, n => n.type === 'select')[0].props.onChange({ target: { value } }); render(); }, track(value) { walk(view, n => n.type === 'input' && n.props.value === value)[0].props.onChange(); render(); } };
}

test('quick review opens the exact worksheet and offers no approval or attestation control', () => {
  const issue = row('issue', { status: 'changes-required' });
  const h = harness({ items: [row('new'), issue], loading: false, scanComplete: true });
  const links = h.find(n => n.type === 'a');
  assert.equal(links.length, 1); assert.equal(links[0].props.href, issue.href);
  assert.equal(links[0].props.target, '_blank'); assert.match(links[0].props.rel, /noopener/);
  assert.match(links[0].props['aria-label'], /opens in a new tab/);
  assert.equal(h.find(n => n.type === 'button' || n.type === 'input' && n.props.type === 'checkbox').length, 0);
  assert.match(h.text(), /confirm once, then use Approve & next/);
  assert.match(h.text(), /2 total matching worksheets/);
});

test('choosing a region remains scoped during refresh and after its last item is reviewed', () => {
  const shoulder = row('shoulder'), knee = row('knee', { scopeLabel: 'Knee · Left', status: 'changes-required' });
  const h = harness({ items: [shoulder, knee], loading: false, scanComplete: true });
  h.group('g:Shoulder · Right'); assert.equal(h.find(n => n.type === 'a')[0].props.href, shoulder.href);
  h.render({ items: [knee], loading: true, scanComplete: false });
  assert.equal(h.find(n => n.type === 'select')[1].props.value, 'g:Shoulder · Right');
  assert.equal(h.find(n => n.type === 'a').length, 0); assert.match(h.text(), /Scanning for matching/);
  h.render({ loading: false, scanComplete: true });
  assert.equal(h.find(n => n.type === 'a').length, 0); assert.match(h.text(), /No matching worksheets need review in this group/);
  h.group(''); assert.equal(h.find(n => n.type === 'a')[0].props.href, knee.href);
});

test('empty source group is distinct from all groups and track changes reset only the chosen group', () => {
  const unspecified = row('none', { scopeLabel: '' });
  const teaching = row('teach', { trackLabel: 'Teaching', scopeLabel: 'Head', status: 'in-progress' });
  const h = harness({ items: [unspecified, row('other', { status: 'changes-required' }), teaching], loading: false, scanComplete: true });
  h.group('g:'); assert.equal(h.find(n => n.type === 'a')[0].props.href, unspecified.href);
  assert.match(h.text(), /Unspecified group/);
  h.track('Teaching'); assert.equal(h.find(n => n.type === 'select')[1].props.value, '');
  assert.equal(h.find(n => n.type === 'a')[0].props.href, teaching.href);
  assert.match(h.text(), /Continue review/);
});

test('held and unavailable rows never become quick decisions; incomplete scan stays explicit', () => {
  const h = harness({ items: [row('held', { capability: 'inspection-only' }), row('missing', { revision: null }), row('approved', { status: 'approval-recorded' })], loading: false, scanComplete: false });
  assert.equal(h.find(n => n.type === 'a').length, 0);
  assert.match(h.text(), /0 loaded matching worksheets/); assert.match(h.text(), /scan is incomplete/);
  h.render({ items: [row('changed', { status: 're-review', changeReason: 'viewer-only' })] });
  assert.match(h.text(), /Viewer update; check the worksheet/);
  assert.match(h.text(), /loaded worksheets only/);
});


test('region switch clears detailed group, isolates suggestions, and retains absent region during refresh', () => {
  const head = row('head', { scopeLabel: 'Whole body · head-neck · nerves · FMA61961 · midline', status: 'in-progress' });
  const thorax = row('thorax', { scopeLabel: 'Whole body · thorax · muscles · FMA123 · right', status: 'changes-required' });
  const h = harness({ items: [head, thorax], loading: false, scanComplete: true });
  h.region('body:head-neck'); h.group(`g:${head.scopeLabel}`);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, head.href);
  h.render({ items: [thorax], loading: true, scanComplete: false });
  assert.equal(h.find(n => n.type === 'select')[0].props.value, 'body:head-neck');
  assert.match(h.text(), /Head & neck/);
  assert.equal(h.find(n => n.type === 'a').length, 0);
  h.region('body:thorax');
  assert.equal(h.find(n => n.type === 'select')[1].props.value, '');
  assert.equal(h.find(n => n.type === 'a')[0].props.href, thorax.href);
  h.render({ items: [], loading: false, scanComplete: true });
  assert.equal(h.find(n => n.type === 'select')[0].props.value, 'body:thorax');
  assert.match(h.text(), /Thorax/);
  assert.equal(h.find(n => n.type === 'a').length, 0);
});

test('group dropdown shows structure names with readable context but submits exact scope values', () => {
  const head = row('head', { title: 'Anterior commissure', scopeLabel: 'Whole body · head-neck · nerves · FMA61961 · midline' });
  const thorax = row('thorax', { title: 'Thoracic nerve (source group)', scopeLabel: 'Whole body · thorax · nerves · FMA123 · right' });
  const h = harness({ items: [head, thorax], loading: false, scanComplete: false });
  h.region('body:head-neck');
  const options = walk(h.find(n => n.type === 'select')[1], n => n.type === 'option');
  assert.equal(options.length, 2);
  assert.equal(options[1].props.value, `g:${head.scopeLabel}`);
  assert.equal(options[1].props.title, head.scopeLabel);
  assert.match(words(options[1]), /Anterior commissure · Whole body · Head & neck/);
  assert.doesNotMatch(words(options[1]), /FMA61961/);
  h.group(`g:${head.scopeLabel}`);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, head.href);
  assert.match(h.text(), /scan is incomplete/);
  h.region('body:thorax');
  const next = walk(h.find(n => n.type === 'select')[1], n => n.type === 'option');
  assert.match(words(next[1]), /Thoracic nerve \(source group\)/);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, thorax.href);
});

test('colliding names remain distinguishable and a stale group preserves its exact source scope', () => {
  const first = row('first', { title: 'Artery', scopeLabel: 'Whole body · abdomen · vessels · FMA101 · right' });
  const second = row('second', { title: 'Artery', scopeLabel: 'Whole body · abdomen · vessels · FMA102 · right' });
  const h = harness({ items: [first, second], loading: false, scanComplete: true });
  const options = walk(h.find(n => n.type === 'select')[1], n => n.type === 'option');
  assert.equal(options.length, 3);
  assert.match(words(options[1]), /FMA101/);
  assert.match(words(options[2]), /FMA102/);
  h.group(`g:${first.scopeLabel}`);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, first.href);
  h.render({ items: [second], loading: true, scanComplete: false });
  const stale = walk(h.find(n => n.type === 'select')[1], n => n.type === 'option');
  assert.equal(stale[1].props.value, `g:${first.scopeLabel}`);
  assert.match(words(stale[1]), /Group no longer loaded/);
  assert.match(words(stale[1]), /FMA101/);
  assert.equal(h.find(n => n.type === 'a').length, 0);
});



