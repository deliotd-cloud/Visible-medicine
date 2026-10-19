import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const React = require('react');
const ts = require('typescript');
function compile(path, mocks) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
function walk(node, predicate) {
  if (Array.isArray(node)) {for (const child of node) {const found = walk(child, predicate); if (found) return found;} return null;}
  if (!node?.props) return null;
  return predicate(node) ? node : walk(node.props.children, predicate);
}
function deferred() {let resolve; const promise = new Promise(done => {resolve = done;}); return {promise, resolve};}
const goodReceipt = (id = 'workbook:one', version = 2, disposition = 'archived') => ({
  ok: true, action: 'retire-published-workbook', workbookId: id, workbookVersion: version,
  disposition, auditId: 'a1234567-1234-1234-1234-123456789abc', auditHash: 'a'.repeat(64),
  retiredAt: '2026-10-16T10:00:00.000Z',
});
function fixture() {
  const slots = []; const effects = []; let cursor = 0, tree, refreshes = 0;
  const calls = [], receipts = [];
  let props = {id: 'workbook:one', title: 'First workbook', version: 2, onRetired: receipt => receipts.push(receipt)};
  let reply = {ok: true, json: async () => goodReceipt()};
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {calls.push({url, options, body: JSON.parse(options.body)}); return reply;};
  const hooks = {
    ...React,
    useState(initial) {const at = cursor++; if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial;
      return [slots[at], value => {slots[at] = typeof value === 'function' ? value(slots[at]) : value;}];},
    useRef(initial) {const at = cursor++; return slots[at] ??= {current: initial};},
    useEffect(create) {if (!effects.length) effects.push(create());},
  };
  const contract = compile('lib/workbook-retirement-contract.ts', {});
  const component = compile('components/WorkbookRetirement.tsx', {
    react: hooks, 'next/navigation': {useRouter: () => ({refresh() {refreshes++;}})},
    '../lib/workbook-retirement-contract.ts': contract, './workbook-retirement.css': {},
  });
  function render(next = props) {props = next; cursor = 0; tree = component.WorkbookRetirement(props); return tree;}
  function field(type) {return walk(tree, node => node.type === type);}
  function update(type, value) {field(type).props.onChange({currentTarget: type === 'input' ? {checked: value} : {value}}); render();}
  async function submit(node = tree) {await walk(node, item => item.type === 'form').props.onSubmit({preventDefault() {}}); render();}
  function setReply(value) {reply = value;}
  function dispose() {for (const cleanup of effects) cleanup(); globalThis.fetch = oldFetch;}
  render();
  return {render, field, update, submit, setReply, dispose, calls, receipts,
    get tree() {return tree;}, get props() {return props;}, get refreshes() {return refreshes;}};
}

test('compact controls validate reason, confirmation, and props before POST', async () => {
  const h = fixture();
  try {
    assert.equal(h.tree.type, 'details');
    assert.equal(h.field('summary').props.children, 'Archive or withdraw');
    await h.submit(); assert.equal(h.calls.length, 0);
    h.update('textarea', '   '); h.update('input', true); await h.submit(); assert.equal(h.calls.length, 0);
    h.update('input', false);
    h.update('textarea', 'Reason'); await h.submit(); assert.equal(h.calls.length, 0);
    h.update('input', true); h.update('textarea', 'x'.repeat(1001)); await h.submit(); assert.equal(h.calls.length, 0);
    h.update('textarea', 'Valid reason');
    h.render({...h.props, id: 'bad/id'}); await h.submit(); assert.equal(h.calls.length, 0);
    h.render({...h.props, version: 0}); await h.submit(); assert.equal(h.calls.length, 0);
    h.render({...h.props, disabled: true}); await h.submit(); assert.equal(h.calls.length, 0);
    assert.equal(h.field('fieldset').props.disabled, true);
  } finally {h.dispose();}
});

test('exact request and acknowledgement cause one callback and refresh', async () => {
  const h = fixture();
  try {
    h.update('textarea', '  Superseded teaching  '); h.update('input', true);
    await h.submit();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].url, '/api/studio/workbooks/workbook%3Aone/retirement');
    assert.equal(h.calls[0].options.method, 'POST');
    assert.deepEqual(h.calls[0].body, {action: 'retire-published-workbook', id: 'workbook:one', expectedVersion: 2,
      expectedStatus: 'published', disposition: 'archived', reason: 'Superseded teaching', confirmed: true});
    assert.deepEqual(h.receipts, [goodReceipt()]); assert.equal(h.refreshes, 1);
    assert.equal(h.field('fieldset').props.disabled, true);
  } finally {h.dispose();}
});

test('withdrawal explanation and explicit re-confirmation after disposition change', async () => {
  const h = fixture();
  try {
    h.update('textarea', 'Withdrawal reason'); h.update('input', true);
    h.update('select', 'withdrawn');
    assert.equal(h.field('input').props.checked, false);
    assert.match(walk(h.tree, node => node.props.className === 'workbook-retirement-impact').props.children,
      /voids unsubmitted open attempts/);
    await h.submit(); assert.equal(h.calls.length, 0);
    h.update('input', true);
    h.setReply({ok: true, json: async () => goodReceipt('workbook:one', 2, 'withdrawn')});
    await h.submit(); assert.equal(h.calls[0].body.disposition, 'withdrawn');
    assert.equal(h.receipts[0].disposition, 'withdrawn');
  } finally {h.dispose();}
});

test('duplicate submit and pending edits are blocked; failed and malformed replies preserve input without retry', async () => {
  const h = fixture();
  try {
    h.update('textarea', 'Keep this reason'); h.update('input', true);
    const wait = deferred(); h.setReply(wait.promise);
    const oldTree = h.tree;
    const first = h.submit(oldTree);
    await h.submit(oldTree);
    h.render();
    assert.equal(h.field('fieldset').props.disabled, true);
    h.update('textarea', 'Should not replace');
    assert.equal(h.field('textarea').props.value, 'Keep this reason');
    wait.resolve({ok: false, status: 409, json: async () => ({error: 'conflict'})});
    await first;
    assert.equal(h.calls.length, 1); assert.equal(h.refreshes, 0);
    assert.equal(h.field('textarea').props.value, 'Keep this reason');
    assert.ok(walk(h.tree, node => node.props.role === 'alert'));
    h.setReply({ok: true, json: async () => ({...goodReceipt(), workbookVersion: 3})});
    await h.submit();
    assert.equal(h.calls.length, 2); assert.equal(h.receipts.length, 0); assert.equal(h.refreshes, 0);
    assert.equal(h.field('textarea').props.value, 'Keep this reason');
    assert.ok(walk(h.tree, node => node.props.role === 'alert'));
    h.setReply({ok: true, json: async () => ({...goodReceipt(), extra: true})});
    await h.submit();
    assert.equal(h.calls.length, 3); assert.equal(h.receipts.length, 0); assert.equal(h.refreshes, 0);
    assert.equal(h.field('textarea').props.value, 'Keep this reason');
  } finally {h.dispose();}
});

test('context A to B to A and unmount discard late acknowledgements without automatic POST', async () => {
  const h = fixture();
  try {
    h.update('textarea', 'Old reason'); h.update('input', true);
    const wait = deferred(); h.setReply(wait.promise);
    const first = h.submit();
    h.render({...h.props, id: 'workbook:two', title: 'Second workbook'});
    h.render({...h.props, id: 'workbook:one', title: 'First workbook'});
    wait.resolve({ok: true, json: async () => goodReceipt()}); await first;
    assert.equal(h.receipts.length, 0); assert.equal(h.refreshes, 0); assert.equal(h.calls.length, 1);
    assert.equal(h.field('textarea').props.value, '');
    h.update('textarea', 'Fresh reason'); h.update('input', true);
    const secondWait = deferred(); h.setReply(secondWait.promise);
    const second = h.submit();
    h.dispose();
    secondWait.resolve({ok: true, json: async () => goodReceipt()}); await second;
    assert.equal(h.receipts.length, 0); assert.equal(h.refreshes, 0);
  } finally {h.dispose();}
});
