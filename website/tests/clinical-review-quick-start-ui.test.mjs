import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const sourceRoot = process.env.VM_WEBSITE_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(pathResolve(sourceRoot, 'package.json')), React = require('react'), ts = require('typescript');
function load(relative, resolveImport = require) {
  const module = { exports: {} };
  const path = relative === '../components/ClinicalReviewQuickStart.tsx' && process.env.VM_QUICK_START_COMPONENT
    ? process.env.VM_QUICK_START_COMPONENT : pathResolve(sourceRoot, 'tests', relative);
  const source = readFileSync(path, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { module, exports: module.exports, require: resolveImport, structuredClone });
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
const announced = h => {
  const regions=h.find(n=>n.props.role==='status');
  assert.equal(regions.length,1,'One persistent Quick review status region');
  assert.equal(regions[0].props['aria-live'],'polite');
  assert.equal(regions[0].props['aria-atomic'],'true');
  assert.equal(regions[0].props.className,'sr-only');
  return words(regions[0]);
};

test('equal-count selections announce the changed exact worksheet, scope and status',()=>{
  const shoulder=row('shoulder',{title:'Supraspinatus',status:'changes-required'});
  const knee=row('knee',{title:'Patellar tendon',scopeLabel:'Knee · Left',status:'in-progress'});
  const h=harness({items:[shoulder,knee],loading:false,scanComplete:true});
  h.group(`g:${shoulder.scopeLabel}`);
  const first=announced(h);
  assert.match(first,/1 total matching worksheet/);assert.match(first,/Supraspinatus/);
  assert.match(first,/Shoulder · Right/);assert.match(first,/Changes required/i);
  assert.equal(h.find(n=>n.type==='a')[0].props.href,shoulder.href);
  h.group(`g:${knee.scopeLabel}`);
  const second=announced(h);
  assert.match(second,/1 total matching worksheet/);assert.match(second,/Patellar tendon/);
  assert.match(second,/Knee · Left/);assert.match(second,/In progress/i);
  assert.notEqual(second,first,'Same count must still announce the new suggestion');
  assert.equal(h.find(n=>n.type==='a')[0].props.href,knee.href);
  assert.equal(h.find(n=>n.props.className==='clinical-review-quick-start-count')[0].props['aria-live'],undefined,
    'Visible count is not a second live region');
});

test('one status region announces loading, incomplete, complete empty and available results',()=>{
  const h=harness({items:[],loading:true,scanComplete:false});
  assert.match(announced(h),/0 loaded matching worksheets.*Scanning for matching worksheets/);
  h.render({loading:false,scanComplete:false});
  assert.match(announced(h),/0 loaded matching worksheets.*No matching worksheet loaded yet.*scan is incomplete/);
  h.render({loading:false,scanComplete:true});
  assert.match(announced(h),/0 total matching worksheets.*No matching worksheets need review in this group/);
  const item=row('new',{title:'Optic chiasm',scopeLabel:'Whole body · head-neck · nerves · FMA123 · midline'});
  h.render({items:[item]});
  assert.match(announced(h),/1 total matching worksheet.*Optic chiasm.*FMA123.*Anatomy/);
  assert.equal(h.find(n=>n.type==='a')[0].props.href,item.href);
});

test('equal-count background status changes are announced without changing the worksheet link',()=>{
  const item=row('same',{title:'Anterior commissure'});
  const h=harness({items:[item],loading:false,scanComplete:true});
  const before=announced(h);
  h.render({items:[{...item,status:'re-review',changeReason:'viewer-only'}]});
  const after=announced(h);
  assert.notEqual(after,before);
  assert.match(after,/Anterior commissure/);assert.match(after,/Re-review/i);
  assert.equal(h.find(n=>n.type==='a')[0].props.href,item.href);
});

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

test('group names are alphabetic without changing issue priority or exact worksheet selection', () => {
  const zygomatic = row('zygomatic', { title: 'Zygomatic bone', scopeLabel: 'Whole body · head-neck · bones · FMA101 · right', status: 'changes-required' });
  const ethmoid = row('ethmoid', { title: 'Ethmoid bone', scopeLabel: 'Whole body · head-neck · bones · FMA999 · midline' });
  const h = harness({ items: [zygomatic, ethmoid], loading: false, scanComplete: true });
  h.region('body:head-neck');
  const options = walk(h.find(n => n.type === 'select')[1], n => n.type === 'option');
  assert.deepEqual(options.map(option => option.props.value), ['', `g:${ethmoid.scopeLabel}`, `g:${zygomatic.scopeLabel}`]);
  assert.match(words(options[1]), /^Ethmoid bone/);
  assert.match(words(options[2]), /^Zygomatic bone/);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, zygomatic.href);
  h.group(`g:${ethmoid.scopeLabel}`);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, ethmoid.href);
  h.render({ items: [ethmoid, zygomatic] });
  assert.equal(h.find(n => n.type === 'select')[1].props.value, `g:${ethmoid.scopeLabel}`);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, ethmoid.href);
});

test('filtered refresh retains stale exact group, honest empty guidance and source-order tie', () => {
  const first = row('first', { title: 'Ethmoid bone', scopeLabel: 'Whole body · head-neck · bones · FMA52747 · midline', status: 'changes-required' });
  const second = row('second', { title: 'Ethmoid bone', scopeLabel: first.scopeLabel, status: 'changes-required' });
  const h = harness({ items: [first, second], loading: false, scanComplete: true, filtersActive: true });
  h.group(`g:${first.scopeLabel}`);
  assert.equal(h.find(n => n.type === 'a')[0].props.href, first.href);
  h.render({ items: [], loading: true, scanComplete: false });
  assert.equal(h.find(n => n.type === 'select')[1].props.value, `g:${first.scopeLabel}`);
  assert.equal(h.find(n => n.type === 'a').length, 0);
  assert.match(h.text(), /Scanning for matching worksheets/);
  h.render({ loading: false, scanComplete: true });
  assert.match(h.text(), /No anatomy or teaching worksheets match these filters and this Quick review selection/);
  assert.match(h.text(), /Uses the inbox filters above/);
  assert.equal(h.find(n => n.type === 'button').length, 0);
  h.render({ items: [second, first] });
  assert.equal(h.find(n => n.type === 'a')[0].props.href, second.href);
});



