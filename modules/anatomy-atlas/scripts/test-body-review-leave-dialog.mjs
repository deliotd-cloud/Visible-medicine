/* Focused actual-dashboard hook test; run with Node from any directory. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const atlas = existsSync(resolve(here, '../package.json'))
  ? resolve(here, '..') : resolve(here, '../../../atlas');
const require = createRequire(resolve(atlas, 'package.json'));
const React = require('react');
const { transform } = require('esbuild');
const source = resolve(here, '../app/review/body/review-dashboard.tsx');
const { code } = await transform(await readFile(source, 'utf8'), {
  loader: 'tsx', format: 'cjs', jsx: 'automatic', target: 'es2022',
});

let slots, cursor, effects, effectCursor, layoutEffects, layoutCursor, updates;
const animationFrames = [];
const hook = {
  ...React,
  useState(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
  },
  useRef(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = { current: initial };
    return slots[i];
  },
  useMemo(fn) { return fn(); },
  useEffect(fn, deps) { schedule(effects, effectCursor++, fn, deps); },
  useLayoutEffect(fn, deps) { schedule(layoutEffects, layoutCursor++, fn, deps); },
};
function schedule(list, i, fn, deps) {
  const prior = list[i];
  if (!prior || !deps || deps.some((value, j) => !Object.is(value, prior.deps?.[j]))) {
    updates.push(() => {
      prior?.cleanup?.();
      list[i] = { deps, cleanup: fn() };
    });
  }
}
const component = name => function Component() { throw Error(`${name} is not rendered by this hook test`); };
const ui = names => Object.fromEntries(names.map(name => [name, component(name)]));
const requests = [];
const listeners = new Map();
const links = [];
class Focusable {
  isConnected = true;
  focus() { this.focused = true; }
}
const doc = { activeElement: null };
const mocks = {
  'next/link': { default: component('Link') },
  '@/components/review-sign-in-link': { ReviewSignInLink: component('ReviewSignInLink') },
  '../../brand': { Brand: component('Brand') },
  '@/components/ui/button': { Button: component('Button') },
  '@/components/ui/input': { Input: component('Input') },
  '@/components/ui/select': ui(['Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem']),
  '@/components/ui/alert-dialog': ui(['AlertDialog', 'AlertDialogAction', 'AlertDialogCancel',
    'AlertDialogContent', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogTitle']),
  '../../body-types': { bodySystems: { skeleton: { name: 'Skeleton' } } },
  '@/lib/body-review-search': { bodyReviewQueue(rows, region, system, query) {
    return rows.filter(row => (region === 'all' || row.regions.includes(region)) &&
      (system === 'all' || row.system === system) &&
      row.name.toLowerCase().includes(query.toLowerCase()));
  } },
  '@/lib/body-review-response': { async parseBodyReviewResponse(data) { return data; } },
  './body-decision-editor': { BodyDecisionEditor: component('BodyDecisionEditor') },
  '../review-model-preview': { ReviewModelPreview: component('ReviewModelPreview') },
};
const scope = { exports: {} };
runInNewContext(code, {
  module: scope, exports: scope.exports, AbortController, HTMLElement: Focusable,
  requestAnimationFrame: callback => animationFrames.push(callback), document: doc,
  window: {
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
  },
  fetch(url, options) { return new Promise(resolve => requests.push({ url, options, resolve })); },
  require(name) {
    if (name === 'react') return hook;
    if (name === 'react/jsx-runtime') return require(name);
    if (name in mocks) return mocks[name];
    throw Error(`Unexpected dependency ${name}`);
  },
});
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found));
  }
  return found;
};
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const find = (tree, predicate) => walk(tree, predicate)[0];
const button = (tree, label) => find(tree, node => typeof node.props.onClick === 'function' && text(node) === label);
const rows = [0, 1, 2].map(i => ({
  id: `synthetic-${i}`, name: `Structure ${i}`, fmaId: `FMA${i}`,
  laterality: 'left', regions: ['thorax'], system: 'skeleton',
}));
function setup() {
  slots = []; cursor = 0; effects = []; effectCursor = 0;
  layoutEffects = []; layoutCursor = 0; updates = []; requests.length = 0;
  animationFrames.length = 0;
  listeners.clear(); links.length = 0;
  let currentRows = rows;
  const render = () => {
    cursor = effectCursor = layoutCursor = 0;
    const tree = scope.exports.BodyReviewDashboard({
      rows: currentRows, regions: [{ id: 'thorax', name: 'Thorax' }],
      initialId: rows[0].id, initialRegion: 'all',
    });
    const next = updates; updates = []; next.forEach(run => run());
    return tree;
  };
  const selected = () => {
    const selectedButton = find(render(), node => node.props['aria-pressed'] === true);
    return selectedButton && text(selectedButton);
  };
  const dialog = () => find(render(), node => node.type === mocks['@/components/ui/alert-dialog'].AlertDialog);
  const dirty = async () => {
    render();
    requests.at(-1).resolve({ ok: true, json: async () => ({
      structureId: rows[0].id, materialHash: 'fixture-hash', atlasLink: '/atlas',
      source: { structure: { id: rows[0].id, name: rows[0].name, fmaId: rows[0].fmaId,
        laterality: 'left', sources: [] }, credit: '' }, topics: [],
    }) });
    await new Promise(resolve => setImmediate(resolve));
    const editor = find(render(), node => typeof node.props.onDirty === 'function');
    assert(editor, 'worksheet exposes editor dirty callback');
    editor.props.onDirty(true);
    render();
  };
  const next = () => button(render(), 'Next structure').props.onClick();
  const cleanup = () => { effects.forEach(slot => slot.cleanup?.()); };
  render();
  return { render, selected, dialog, dirty, next, cleanup,
    changeRows(value) { currentRows = value; },
  };
}
function cancel(h) {
  const d = h.dialog();
  assert.equal(d.props.open, true);
  d.props.onOpenChange(false); // Escape/close, including Base UI's cancel path.
  assert.equal(h.dialog().props.open, false);
  animationFrames.splice(0).forEach(callback => callback());
}
function confirm(h) {
  const action = button(h.render(), 'Discard edits and continue');
  assert(action);
  action.props.onClick();
  return action;
}

test('modified, non-primary and already-handled link clicks retain native behavior and the dirty worksheet', async () => {
  const h = setup(); await h.dirty();
  const anchor = new Focusable();
  anchor.target = ''; anchor.href = 'https://example.test/review/overview';
  anchor.hasAttribute = () => false;
  anchor.getAttribute = () => '/review/overview';
  anchor.click = () => { links.push(anchor.href); };
  const count = requests.length;
  for (const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]) {
    const event = {button:0, ...options, target:{closest:()=>anchor},
      preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};
    h.render().props.onClickCapture(event);
    assert.equal(event.prevented,undefined,JSON.stringify(options));
    assert.equal(event.stopped,undefined,JSON.stringify(options));
    assert.equal(h.dialog().props.open,false);
    assert.match(h.selected(),/Structure 0/);
    assert.equal(requests.length,count);
    assert.deepEqual(links,[]);
    const exit={prevented:false,preventDefault(){this.prevented=true;}};
    listeners.get('beforeunload')(exit);
    assert.equal(exit.prevented,true,'the existing dirty worksheet must keep its exit guard');
  }
  h.cleanup();
});

test('clean navigation is immediate; current row keeps worksheet and draft', async () => {
  const h = setup();
  h.next();
  assert.match(h.selected(), /Structure 1/);
  assert.equal(h.dialog().props.open, false);
  h.cleanup();
  const second = setup();
  await second.dirty();
  const before = second.selected();
  find(second.render(), node => node.props['aria-pressed'] === true).props.onClick();
  assert.equal(second.selected(), before);
  assert.equal(second.dialog().props.open, false);
  second.cleanup();
});

test('dirty structure navigation defaults to Keep editing, cancel returns focus, discard is single-use', async () => {
  const h = setup(); await h.dirty();
  const focus = new Focusable(); doc.activeElement = focus;
  h.next();
  assert.equal(h.dialog().props.open, true);
  assert.match(text(h.render()), /Discard unsaved review edits/);
  const content = find(h.render(), node => node.type === mocks['@/components/ui/alert-dialog'].AlertDialogContent);
  assert.equal(content.props.initialFocus, button(h.render(), 'Keep editing').props.ref);
  assert.equal(content.props.finalFocus, false);
  assert.match(h.selected(), /Structure 0/);
  assert(listeners.has('beforeunload'));
  cancel(h);
  assert.equal(focus.focused, true);
  assert.match(h.selected(), /Structure 0/);
  h.next();
  const staleAction = confirm(h);
  assert.match(h.selected(), /Structure 1/);
  staleAction.props.onClick();
  assert.match(h.selected(), /Structure 1/);
  assert.equal(h.dialog().props.open, false);
  assert(requests.every(request => !request.options.method));
  h.cleanup();
});

test('dirty filters retain state on cancel and apply only the captured intent on discard', async () => {
  const h = setup(); await h.dirty();
  const input = find(h.render(), node => node.props.id === 'body-review-query');
  const focus = new Focusable();
  input.props.onChange({ target: { value: 'Structure 2' }, currentTarget: focus });
  assert.equal(find(h.render(), node => node.props.id === 'body-review-query').props.value, '');
  cancel(h);
  assert.match(h.selected(), /Structure 0/);
  input.props.onChange({ target: { value: 'Structure 2' }, currentTarget: focus });
  h.next(); // A second pending destination cannot replace the first.
  confirm(h);
  assert.equal(find(h.render(), node => node.props.id === 'body-review-query').props.value, 'Structure 2');
  assert.equal(h.selected(), undefined);
  h.cleanup();
});

test('changed queue invalidates pending intent, and internal link resumes once', async () => {
  const h = setup(); await h.dirty();
  h.next();
  h.changeRows([...rows]); h.render();
  confirm(h);
  assert.match(h.selected(), /Structure 0/);
  h.cleanup();

  const linkHost = setup(); await linkHost.dirty();
  const beforeUnload = { prevented: false, preventDefault() { this.prevented = true; } };
  listeners.get('beforeunload')(beforeUnload);
  assert.equal(beforeUnload.prevented, true);
  const anchor = new Focusable();
  anchor.target = ''; anchor.href = 'https://example.test/review/overview';
  anchor.hasAttribute = () => false;
  anchor.getAttribute = () => '/review/overview';
  anchor.click = () => { links.push(anchor.href); };
  const root = linkHost.render();
  const event = { target: { closest: () => anchor },
    preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
  root.props.onClickCapture(event);
  assert(event.prevented && event.stopped);
  assert.deepEqual(links, []);
  confirm(linkHost);
  assert.deepEqual(links, [anchor.href]);
  const intentionalExit = { prevented: false, preventDefault() { this.prevented = true; } };
  listeners.get('beforeunload')(intentionalExit);
  assert.equal(intentionalExit.prevented, false);
  assert.equal(linkHost.selected(), undefined);
  button(linkHost.render(), 'Structure 0FMA0 · left').props.onClick();
  await linkHost.dirty();
  const laterExit = { prevented: false, preventDefault() { this.prevented = true; } };
  listeners.get('beforeunload')(laterExit);
  assert.equal(laterExit.prevented, true, 'a later dirty draft must regain the native guard');
  linkHost.cleanup();
});

test('stale close and focus callbacks cannot affect a newer dialog', async () => {
  const h = setup(); await h.dirty();
  const firstFocus = new Focusable(); doc.activeElement = firstFocus;
  h.next();
  const oldDialog = h.dialog();
  const oldAction = button(h.render(), 'Discard edits and continue');
  oldDialog.props.onOpenChange(false);
  assert.equal(h.dialog().props.open, false);
  const secondFocus = new Focusable(); doc.activeElement = secondFocus;
  h.next();
  oldDialog.props.onOpenChange(false);
  oldAction.props.onClick();
  assert.equal(h.dialog().props.open, true);
  animationFrames.splice(0).forEach(callback => callback());
  assert.equal(firstFocus.focused, undefined);
  cancel(h);
  oldAction.props.onClick();
  assert.match(h.selected(), /Structure 0/);
  assert.equal(secondFocus.focused, true);
  h.cleanup();
});

test('region and system changes need an explicit discard; external and worksheet links bypass it', async () => {
  const h = setup(); await h.dirty();
  const selects = () => walk(h.render(), node => typeof node.props.onValueChange === 'function');
  selects()[0].props.onValueChange('thorax');
  assert.equal(selects()[0].props.value, 'all');
  cancel(h);
  selects()[1].props.onValueChange('skeleton');
  assert.equal(selects()[1].props.value, 'all');
  confirm(h);
  assert.equal(selects()[1].props.value, 'skeleton');
  assert.equal(h.selected(), undefined);
  h.cleanup();

  const h2 = setup(); await h2.dirty();
  const capture = h2.render().props.onClickCapture;
  for (const [target, href, download] of [
    ['_blank', '/atlas', false], ['', '/api/body-review?download=1', false],
    ['', '/export', true],
  ]) {
    const event = { target: { closest: () => ({ target, href, hasAttribute: () => download,
      getAttribute: () => href }) }, preventDefault() { this.prevented = true; },
      stopPropagation() { this.stopped = true; } };
    capture(event);
    assert.equal(event.prevented, undefined);
    assert.equal(h2.dialog().props.open, false);
  }
  h2.cleanup();
});

test('a changed editor state invalidates a pending discard', async () => {
  const h = setup(); await h.dirty();
  h.next();
  find(h.render(), node => typeof node.props.onDirty === 'function').props.onDirty(false);
  h.render();
  confirm(h);
  assert.match(h.selected(), /Structure 0/);
  assert.equal(h.dialog().props.open, false);
  h.cleanup();
});

test('a stale worksheet context cancels discard and restores safe editing focus', async () => {
  const h = setup(); await h.dirty();
  const focus = new Focusable(); doc.activeElement = focus;
  h.next();
  h.changeRows([...rows]); h.render();
  confirm(h);
  animationFrames.splice(0).forEach(callback => callback());
  assert.match(h.selected(), /Structure 0/);
  assert.equal(h.dialog().props.open, false);
  assert.equal(focus.focused, true, 'an invalidated discard must not strand focus on the closed dialog');
  h.cleanup();
});

test('a retargeted or detached link cancels discard without losing the worksheet or focus', async () => {
  for (const reason of ['retargeted', 'detached']) {
    const h = setup(); await h.dirty();
    const anchor = new Focusable();
    anchor.target = ''; anchor.href = 'https://example.test/review/overview';
    anchor.hasAttribute = () => false;
    anchor.getAttribute = () => '/review/overview';
    anchor.click = () => { links.push(anchor.href); };
    const focus = new Focusable(); doc.activeElement = focus;
    const input = find(h.render(), node => node.props.id === 'body-review-query');
    if (input.props.ref) input.props.ref.current = focus;
    h.render().props.onClickCapture({ target: { closest: () => anchor },
      preventDefault() {}, stopPropagation() {} });
    // A disconnected initiating link cannot regain focus. The stable queue
    // search remains mounted and is the safe fallback.
    if (reason === 'detached') anchor.isConnected = false;
    else anchor.href = 'https://example.test/changed';
    confirm(h);
    animationFrames.splice(0).forEach(callback => callback());
    assert.match(h.selected(), /Structure 0/);
    assert.equal(h.dialog().props.open, false);
    assert.deepEqual(links, []);
    if (reason === 'retargeted') assert.equal(anchor.focused, true);
    else assert.equal(focus.focused, true, 'detached initiator falls back to the mounted queue search');
    const exit = { prevented: false, preventDefault() { this.prevented = true; } };
    listeners.get('beforeunload')(exit);
    assert.equal(exit.prevented, true, 'failed link intent must retain native unsaved protection');
    h.cleanup();
  }
});
