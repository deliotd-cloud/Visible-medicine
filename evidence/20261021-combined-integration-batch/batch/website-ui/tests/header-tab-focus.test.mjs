import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

// Use the project's existing dependencies; this suite installs nothing.
const require = createRequire(import.meta.url);
const React = require('react');
const { transformSync } = require('esbuild');
const source = readFileSync(new URL('../components/SiteHeader.tsx', import.meta.url));
const original = readFileSync(new URL('./fixtures/header-before-keyboard-focus/SiteHeader.tsx.raw', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedSourceHash = 'ab71e13765bb490f5f891d933f09b40987c9643f4e4bee1ba7c2471fa94feeec';
const oldGuard = "if (!restoringFocusRef.current && event.target !== event.currentTarget.querySelector('[data-nav-trigger]')) openPrimary(section.id);";
const newGuard = "if (expanded && !restoringFocusRef.current && event.currentTarget.querySelector('.primary-nav-panel')?.contains(event.target as Node)) openPrimary(section.id);";

test('source is still the expected exact input and proposal changes only the focus guard', () => {
  assert.equal(hash(original), expectedSourceHash);
  assert.equal(original.toString().split(oldGuard).length, 2);
  assert.equal(source.toString().split(newGuard).length, 2);
  assert.deepEqual(Buffer.from(source.toString().replace(newGuard, oldGuard)), original);
});

function interactiveHeader() {
  let stateIndex = 0;
  let refIndex = 0;
  const states = [];
  const refs = [];
  let effects = [];
  let cleanup = [];
  const listeners = new Map();
  const focusCount = { primary: 0 };
  const mockReact = {
    ...React,
    useState(initial) {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
    useRef(initial) {
      const index = refIndex++;
      if (!refs[index]) refs[index] = { current: initial };
      return refs[index];
    },
    useEffect(effect) { effects.push(() => { const dispose = effect(); if (dispose) cleanup.push(dispose); }); },
  };
  const module = { exports: {} };
  const code = transformSync(source.toString(), { loader: 'tsx', format: 'cjs', target: 'es2022', jsx: 'automatic' }).code;
  const Link = ({ children, ...props }) => React.createElement('a', props, children);
  const mocks = {
    react: mockReact,
    'next/link': Link,
    'next/navigation': { usePathname: () => '/atlas' },
    './BrandLockup': { BrandLockup: () => null },
    '../lib/atlas-navigation': { atlasModalities: [] },
  };
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), module, module.exports);
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const documentMock = {
    activeElement: null,
    addEventListener: (name, listener) => listeners.set(`document:${name}`, listener),
    removeEventListener: name => listeners.delete(`document:${name}`),
  };
  const windowMock = {
    addEventListener: (name, listener) => listeners.set(`window:${name}`, listener),
    removeEventListener: name => listeners.delete(`window:${name}`),
  };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentMock });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: windowMock });
  const find = (element, predicate) => {
    if (!React.isValidElement(element)) return;
    if (predicate(element)) return element;
    for (const child of React.Children.toArray(element.props.children)) {
      const match = find(child, predicate);
      if (match) return match;
    }
  };
  let tree;
  const render = () => {
    cleanup.forEach(dispose => dispose());
    cleanup = [];
    effects = [];
    stateIndex = 0;
    refIndex = 0;
    tree = module.exports.SiteHeader({ signedIn: false });
    effects.forEach(run => run());
  };
  const group = id => find(tree, node => node.props['data-nav-section'] === id);
  const toggle = id => find(group(id), node => node.props['data-nav-trigger'] === id);
  const topLink = id => find(group(id), node => node.props.href === `/${id}`);
  const panel = id => find(group(id), node => node.props.id === `${id}-navigation`);
  const focus = (id, target, panelContains = false) => group(id).props.onFocus({
    target,
    currentTarget: { querySelector: selector => {
      assert.equal(selector, '.primary-nav-panel');
      return { contains: node => panelContains && node === target };
    } },
  });
  const dispose = () => {
    cleanup.forEach(fn => fn());
    Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  };
  render();
  find(tree, node => node.type === 'nav' && node.props.className === 'nav-links public-primary-nav').props.ref.current = {
    contains: target => target === 'primary',
    querySelector: selector => {
      assert.equal(selector, '[data-nav-trigger="atlas"]');
      return { focus: () => { focusCount.primary++; } };
    },
  };
  return { render, group, toggle, topLink, panel, focus, documentMock, listeners, focusCount, dispose };
}

test('closed link/button focus stays closed; disclosure, hover and dismissals retain behavior', () => {
  const h = interactiveHeader();
  try {
    assert.equal(h.panel('atlas').props.hidden, true);
    h.focus('atlas', h.topLink('atlas'));
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'tabbing to top-level link does not open');
    h.focus('atlas', h.toggle('atlas'));
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'tabbing to disclosure does not open');

    h.toggle('atlas').props.onClick();
    h.render();
    assert.equal(h.panel('atlas').props.hidden, false, 'click or keyboard activation opens');
    assert.equal(h.toggle('atlas').props['aria-expanded'], true);
    const inner = { inside: true };
    h.focus('atlas', inner, true);
    h.render();
    assert.equal(h.panel('atlas').props.hidden, false, 'internal focus retains open panel');
    h.group('atlas').props.onBlur({ currentTarget: { contains: node => node === inner }, relatedTarget: inner });
    h.render();
    assert.equal(h.panel('atlas').props.hidden, false, 'internal blur retains open panel');
    h.documentMock.activeElement = inner;
    h.group('atlas').props.onPointerLeave({ currentTarget: { contains: node => node === inner } });
    h.render();
    assert.equal(h.panel('atlas').props.hidden, false, 'pointer leave retains focused panel');
    h.documentMock.activeElement = null;
    h.toggle('atlas').props.onClick();
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'second activation closes');

    h.topLink('atlas').props.onPointerEnter();
    h.render();
    assert.equal(h.panel('atlas').props.hidden, false, 'pointer hover opens');
    h.group('atlas').props.onPointerLeave({ currentTarget: { contains: () => false } });
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'pointer leave closes without focus inside');

    h.toggle('atlas').props.onClick();
    h.render();
    let prevented = 0;
    h.listeners.get('document:keydown')({ key: 'Escape', preventDefault: () => { prevented++; } });
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true);
    assert.equal(prevented, 1);
    assert.equal(h.focusCount.primary, 1, 'Escape restores disclosure focus');
    h.focus('atlas', h.toggle('atlas'));
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'restored trigger focus does not reopen');

    h.toggle('atlas').props.onClick();
    h.render();
    h.group('atlas').props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: {} });
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'blur outside closes');
    h.toggle('atlas').props.onClick();
    h.render();
    h.listeners.get('document:pointerdown')({ target: 'outside' });
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'outside pointer closes');
    h.toggle('atlas').props.onClick();
    h.render();
    h.listeners.get('window:scroll')({ target: 'outside' });
    h.render();
    assert.equal(h.panel('atlas').props.hidden, true, 'page scroll closes');
  } finally { h.dispose(); }
});
