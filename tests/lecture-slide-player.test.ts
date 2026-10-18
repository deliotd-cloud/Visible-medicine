/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';
import type { PublishedLectureNavigation } from '../lib/lecture-slide-navigation.ts';

const require = createRequire(import.meta.url);
const revision = 'a'.repeat(64);
const staleRevision = 'b'.repeat(64);
const slides = [
  { id: 'first', title: 'First slide', body: 'First body', referenceUrl: '' },
  { id: 'second', title: 'Second slide', body: 'Second body', referenceUrl: '' },
  { id: 'third', title: 'Third slide', body: 'Third body', referenceUrl: '' },
];
const navigation: PublishedLectureNavigation = {
  workbookId: 'lecture:1', courseSlug: 'head', revision,
  request: { kind: 'requested', slideId: 'second', revision },
};
const route = '/learn/head/lecture%3A1';
const requestedUrl = `${route}?lectureSlide=second&lectureRevision=${revision}`;

type ElementNode = React.ReactElement<Record<string, any>>;
function childrenOf(node: unknown): unknown[] {
  return React.isValidElement(node) ? React.Children.toArray((node as ElementNode).props.children) : [];
}
function descendants(node: unknown): ElementNode[] {
  return React.isValidElement(node) ? [node as ElementNode, ...childrenOf(node).flatMap(descendants)] : [];
}
function textOf(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return childrenOf(node).map(textOf).join('');
}
function findButton(tree: ElementNode, label: string): ElementNode {
  const button = descendants(tree).find(node => node.type === 'button' && textOf(node) === label);
  assert.ok(button, `missing ${label} button`);
  return button;
}
function heading(tree: ElementNode): string {
  return textOf(descendants(tree).find(node => node.type === 'h3'));
}

function browser(initialUrl = requestedUrl) {
  let url = new URL(initialUrl, 'https://visible.test');
  let locationReads = 0;
  const events = new Map<string, Set<(event: any) => void>>();
  const calls: { state: unknown; url: string }[] = [];
  const state = { carried: 'preserve' };
  const window = {
    get location() { locationReads++; return url; },
    history: {
      state,
      replaceState(nextState: unknown, _unused: string, nextUrl: string) {
        calls.push({ state: nextState, url: String(nextUrl) });
        url = new URL(String(nextUrl), url);
      },
    },
    addEventListener(name: string, handler: (event: any) => void) {
      const handlers = events.get(name) ?? new Set(); handlers.add(handler); events.set(name, handlers);
    },
    removeEventListener(name: string, handler: (event: any) => void) { events.get(name)?.delete(handler); },
  };
  return {
    window, calls,
    navigate(nextUrl: string) { url = new URL(nextUrl, url); },
    dispatch(name: string, event: any = {}) { for (const handler of [...(events.get(name) ?? [])]) handler(event); },
    handlers(name: string) { return [...(events.get(name) ?? [])]; },
    failHistory() { window.history.replaceState = () => { throw Error('blocked history'); }; },
    currentUrl() { return url.pathname + url.search; },
    locationReads() { return locationReads; },
  };
}

function hookHarness() {
  const values: unknown[] = [];
  const memos = new Map<number, { value: unknown; deps?: readonly unknown[] }>();
  const effects = new Map<number, { deps?: readonly unknown[]; cleanup?: () => void }>();
  let index = 0;
  let queued: { slot: number; effect: () => void | (() => void); deps?: readonly unknown[] }[] = [];
  const hooks = {
    ...React,
    useState(initial: unknown) {
      const slot = index++;
      if (!(slot in values)) values[slot] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
      return [values[slot], (next: unknown) => {
        values[slot] = typeof next === 'function' ? (next as (current: unknown) => unknown)(values[slot]) : next;
      }];
    },
    useRef(initial: unknown) {
      const slot = index++;
      if (!(slot in values)) values[slot] = { current: initial };
      return values[slot];
    },
    useMemo(factory: () => unknown, deps?: readonly unknown[]) {
      const slot = index++, previous = memos.get(slot);
      if (previous && deps && previous.deps && deps.length === previous.deps.length &&
          deps.every((value, position) => Object.is(value, previous.deps![position]))) return previous.value;
      const value = factory(); memos.set(slot, { value, deps }); return value;
    },
    useCallback(callback: (...args: any[]) => unknown, deps?: readonly unknown[]) {
      return hooks.useMemo(() => callback, deps ?? []);
    },
    useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
      const slot = index++;
      const previous = effects.get(slot);
      if (!previous || !deps || !previous.deps || deps.length !== previous.deps.length || deps.some((value, position) => !Object.is(value, previous.deps![position]))) {
        queued.push({ slot, effect, deps });
      }
    },
    useLayoutEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
      hooks.useEffect(effect, deps);
    },
  } as unknown as typeof React;
  return {
    react: hooks,
    render(Component: (props: any) => ElementNode, props: any) {
      index = 0; queued = [];
      const tree = Component(props);
      for (const item of queued) {
        effects.get(item.slot)?.cleanup?.();
        const cleanup = item.effect();
        effects.set(item.slot, { deps: item.deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined });
      }
      return tree;
    },
    unmount() { for (const effect of effects.values()) effect.cleanup?.(); effects.clear(); },
  };
}

function player(react: typeof React) {
  const source = readFileSync(new URL('../components/LecturePlayer.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} as Record<string, any> };
  new Function('require', 'module', 'exports', code)((name: string) => {
    if (name === 'react') return react;
    if (name.endsWith('.css')) return {};
    return require(name);
  }, module, module.exports);
  return module.exports.LecturePlayer as (props: any) => ElementNode;
}

function withWindow<T>(fake: ReturnType<typeof browser>, action: () => T): T {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldElement = Object.getOwnPropertyDescriptor(globalThis, 'Element');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fake.window });
  Object.defineProperty(globalThis, 'Element', { configurable: true, value: TestElement });
  try { return action(); }
  finally {
    if (old) Object.defineProperty(globalThis, 'window', old); else Reflect.deleteProperty(globalThis, 'window');
    if (oldElement) Object.defineProperty(globalThis, 'Element', oldElement); else Reflect.deleteProperty(globalThis, 'Element');
  }
}

class TestElement {
  readonly tagName: string;
  readonly isContentEditable: boolean;
  constructor(tagName: string, isContentEditable = false) {
    this.tagName = tagName; this.isContentEditable = isContentEditable;
  }
  closest(selector: string) {
    assert.match(selector, /contenteditable/);
    return /^(INPUT|SELECT|TEXTAREA|BUTTON|A|SUMMARY)$/.test(this.tagName) || this.isContentEditable ? this : null;
  }
}

test('preview including a published version never reads or writes slide URL state', () => {
  const fake = browser(requestedUrl);
  withWindow(fake, () => {
    for (const version of [undefined, 3]) {
      const hooks = hookHarness(), Player = player(hooks.react);
      let tree = hooks.render(Player, { title: 'Lecture', slides, version });
      assert.equal(heading(tree), 'First slide');
      findButton(tree, 'Next').props.onClick();
      tree = hooks.render(Player, { title: 'Lecture', slides, version });
      assert.equal(heading(tree), 'Second slide');
      assert.equal(descendants(tree).filter(node => node.type === 'a' && textOf(node) === 'Slide link').length, 0);
      hooks.unmount();
    }
    assert.deepEqual(fake.calls, []);
    assert.equal(fake.locationReads(), 0);
    assert.equal(fake.handlers('popstate').length, 0);
  });
});

test('switching a published player into preview clears its slide selection without reading the URL', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Lecture', slides, version: 3, navigation });
    assert.equal(heading(tree), 'Second slide');
    const reads = fake.locationReads();
    tree = hooks.render(Player, { title: 'Preview', slides, version: 3 });
    tree = hooks.render(Player, { title: 'Preview', slides, version: 3 });
    assert.equal(heading(tree), 'First slide');
    assert.equal(fake.locationReads(), reads);
    assert.deepEqual(fake.calls, []);
    assert.equal(fake.handlers('popstate').length, 0);
    hooks.unmount();
  });
});

test('published request restores second slide; explicit moves replace the exact link and preserve history state', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Lecture', slides, version: 3, navigation });
    tree = hooks.render(Player, { title: 'Lecture', slides, version: 3, navigation });
    assert.equal(heading(tree), 'Second slide');
    const link = descendants(tree).find(node => node.type === 'a' && textOf(node) === 'Slide link');
    assert.equal(link?.props.href, requestedUrl);
    assert.equal(fake.calls.length, 0, 'initial request must not rewrite history');
    findButton(tree, 'Next').props.onClick();
    tree = hooks.render(Player, { title: 'Lecture', slides, version: 3, navigation });
    assert.equal(heading(tree), 'Third slide');
    assert.deepEqual(fake.calls, [{ state: fake.window.history.state, url: `${route}?lectureSlide=third&lectureRevision=${revision}` }]);
    assert.equal(descendants(tree).find(node => node.type === 'a' && textOf(node) === 'Slide link')?.props.href, fake.currentUrl());
    hooks.unmount();
  });
});

test('popstate restores exact slide and refuses stale or malformed links', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    fake.navigate(`${route}?lectureSlide=third&lectureRevision=${revision}`);
    fake.dispatch('popstate');
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    assert.equal(heading(tree), 'Third slide');
    for (const badUrl of [
      `${route}?lectureSlide=third&lectureRevision=${staleRevision}`,
      `${route}?lectureSlide=gone&lectureRevision=${revision}`,
      `${route}?lectureSlide=third&lectureSlide=first&lectureRevision=${revision}`,
      `${route}?lectureSlide=third`,
    ]) {
      fake.navigate(badUrl); fake.dispatch('popstate');
      tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
      assert.ok(descendants(tree).some(node => node.props.role === 'status'));
      assert.equal(descendants(tree).some(node => node.type === 'h3' && textOf(node) === 'First slide'), false);
    }
    assert.deepEqual(fake.calls, []);
    hooks.unmount();
  });
});

test('invalid explicit request only starts after deliberate recovery; invalid publication blocks it', () => {
  const fake = browser(`${route}?lectureSlide=broken&lectureRevision=bad`), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    const invalid = { ...navigation, request: { kind: 'invalid' } as const };
    let tree = hooks.render(Player, { title: 'Lecture', slides, navigation: invalid });
    assert.ok(descendants(tree).some(node => node.props.role === 'status'));
    assert.equal(fake.calls.length, 0);
    findButton(tree, 'Start current lecture').props.onClick();
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation: invalid });
    assert.equal(heading(tree), 'First slide');
    assert.deepEqual(fake.calls, [{ state: fake.window.history.state, url: `${route}?lectureSlide=first&lectureRevision=${revision}` }]);
    hooks.unmount();
    const duplicate = [{ ...slides[0] }, { ...slides[0] }];
    const otherHooks = hookHarness(), OtherPlayer = player(otherHooks.react);
    tree = otherHooks.render(OtherPlayer, { title: 'Lecture', slides: duplicate, navigation: invalid });
    assert.equal(findButton(tree, 'Start current lecture').props.disabled, true);
    otherHooks.unmount();
  });
});

test('stale callbacks after changed source or unmount cannot rewrite another route', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    const staleMove = findButton(tree, 'Next').props.onClick;
    const stalePop = fake.handlers('popstate')[0];
    const nextSource = { ...navigation, workbookId: 'other' };
    fake.navigate('/learn/head/other');
    hooks.render(Player, { title: 'Other lecture', slides, navigation: nextSource });
    staleMove(); stalePop?.({});
    assert.deepEqual(fake.calls, []);
    assert.equal(heading(hooks.render(Player, { title: 'Other lecture', slides, navigation: nextSource })), 'Second slide');
    hooks.unmount();
    const unmountedMove = findButton(hooks.render(Player, { title: 'Lecture', slides, navigation: nextSource }), 'Next').props.onClick;
    hooks.unmount(); unmountedMove();
    assert.deepEqual(fake.calls, []);
  });
});

test('history failure leaves the displayed slide unchanged; keyboard ignores editable and modified arrows', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    fake.failHistory();
    assert.doesNotThrow(() => findButton(tree, 'Next').props.onClick());
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    assert.equal(heading(tree), 'Second slide');
    const section = descendants(tree).find(node => node.type === 'section' && node.props.onKeyDown)!;
    for (const event of [
      { key: 'ArrowRight', target: new TestElement('INPUT') },
      { key: 'ArrowRight', target: new TestElement('DIV', true) },
      { key: 'ArrowRight', target: new TestElement('DIV'), ctrlKey: true },
      { key: 'ArrowRight', target: new TestElement('DIV'), altKey: true },
      { key: 'ArrowRight', target: new TestElement('DIV'), metaKey: true },
      { key: 'ArrowRight', target: new TestElement('DIV'), shiftKey: true },
    ]) {
      let prevented = false;
      section.props.onKeyDown({ ...event, preventDefault() { prevented = true; } });
      assert.equal(prevented, false);
    }
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    assert.equal(heading(tree), 'Second slide');
    hooks.unmount();
  });
});

test('captured recovery is inert after recovery, another move, and popstate', () => {
  const fake = browser(`${route}?lectureSlide=invalid&lectureRevision=invalid`);
  const hooks = hookHarness(), Player = player(hooks.react);
  const invalid = { ...navigation, request: { kind: 'invalid' } as const };
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Lecture', slides, navigation: invalid });
    const staleRecovery = findButton(tree, 'Start current lecture').props.onClick;
    staleRecovery();
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation: invalid });
    assert.equal(heading(tree), 'First slide');
    findButton(tree, 'Next').props.onClick();
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation: invalid });
    assert.equal(heading(tree), 'Second slide');
    assert.equal(fake.calls.length, 2);
    staleRecovery();
    assert.equal(fake.calls.length, 2);
    fake.navigate(`${route}?lectureSlide=third&lectureRevision=${revision}`);
    fake.dispatch('popstate');
    staleRecovery();
    assert.equal(fake.calls.length, 2);
    tree = hooks.render(Player, { title: 'Lecture', slides, navigation: invalid });
    assert.equal(heading(tree), 'Third slide');
    hooks.unmount();
  });
});

test('captured Previous and Next are inert immediately after popstate before rerender', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    const tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    const previous = findButton(tree, 'Previous').props.onClick;
    const next = findButton(tree, 'Next').props.onClick;
    fake.navigate(`${route}?lectureSlide=third&lectureRevision=${revision}`);
    fake.dispatch('popstate');
    previous(); next();
    assert.deepEqual(fake.calls, []);
    assert.equal(fake.currentUrl(), `${route}?lectureSlide=third&lectureRevision=${revision}`);
    assert.equal(heading(hooks.render(Player, { title: 'Lecture', slides, navigation })), 'Third slide');
    hooks.unmount();
  });
});

test('route changes without popstate block both movement and invalid-link recovery', () => {
  const movementBrowser = browser(), movementHooks = hookHarness(), MovePlayer = player(movementHooks.react);
  withWindow(movementBrowser, () => {
    const tree = movementHooks.render(MovePlayer, { title: 'Lecture', slides, navigation });
    movementBrowser.navigate('/learn/head/another-lecture');
    findButton(tree, 'Next').props.onClick();
    assert.deepEqual(movementBrowser.calls, []);
    assert.equal(heading(movementHooks.render(MovePlayer, { title: 'Lecture', slides, navigation })), 'Second slide');
    movementHooks.unmount();
  });
  const recoveryBrowser = browser(`${route}?lectureSlide=invalid&lectureRevision=invalid`);
  const recoveryHooks = hookHarness(), RecoveryPlayer = player(recoveryHooks.react);
  withWindow(recoveryBrowser, () => {
    const invalid = { ...navigation, request: { kind: 'invalid' } as const };
    const tree = recoveryHooks.render(RecoveryPlayer, { title: 'Lecture', slides, navigation: invalid });
    recoveryBrowser.navigate('/learn/head/another-lecture');
    findButton(tree, 'Start current lecture').props.onClick();
    assert.deepEqual(recoveryBrowser.calls, []);
    assert.ok(descendants(recoveryHooks.render(RecoveryPlayer, { title: 'Lecture', slides, navigation: invalid }))
      .some(node => node.props.role === 'status'));
    recoveryHooks.unmount();
  });
});

test('draft slide array edits preserve selection, clamp after shrink, and never read the URL', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Draft', slides });
    findButton(tree, 'Next').props.onClick();
    tree = hooks.render(Player, { title: 'Draft', slides: slides.map(slide => ({ ...slide })) });
    findButton(tree, 'Next').props.onClick();
    for (let repeat = 0; repeat < 3; repeat++) {
      tree = hooks.render(Player, { title: 'Draft', slides: slides.map(slide => ({ ...slide, body: `${slide.body} edit ${repeat}` })) });
      assert.equal(heading(tree), 'Third slide');
    }
    const shorter = slides.slice(0, 2).map(slide => ({ ...slide }));
    tree = hooks.render(Player, { title: 'Draft', slides: shorter });
    assert.equal(heading(tree), 'Second slide');
    tree = hooks.render(Player, { title: 'Draft', slides: shorter.map(slide => ({ ...slide })) });
    assert.equal(heading(tree), 'Second slide');
    assert.equal(fake.locationReads(), 0);
    assert.deepEqual(fake.calls, []);
    hooks.unmount();
  });
});

test('equivalent publication props retain an explicit slide move', () => {
  const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
  withWindow(fake, () => {
    let tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
    findButton(tree, 'Next').props.onClick();
    tree = hooks.render(Player, { title: 'Lecture', slides: slides.map(slide => ({ ...slide })), navigation: { ...navigation, request: { ...navigation.request } } });
    assert.equal(heading(tree), 'Third slide');
    assert.equal(fake.currentUrl(), `${route}?lectureSlide=third&lectureRevision=${revision}`);
    assert.equal(fake.calls.length, 1);
    hooks.unmount();
  });
});

test('publication refresh preserves selection while source or revision change invalidates old callbacks', () => {
  for (const changedNavigation of [
    { ...navigation, revision: staleRevision },
    { ...navigation, workbookId: 'another-lecture' },
  ]) {
    const fake = browser(), hooks = hookHarness(), Player = player(hooks.react);
    withWindow(fake, () => {
      let tree = hooks.render(Player, { title: 'Lecture', slides, navigation });
      findButton(tree, 'Next').props.onClick();
      tree = hooks.render(Player, {
        title: 'Lecture', slides: slides.map(slide => ({ ...slide })),
        navigation: { ...navigation, request: { ...navigation.request } },
      });
      assert.equal(heading(tree), 'Third slide');
      assert.equal(fake.currentUrl(), `${route}?lectureSlide=third&lectureRevision=${revision}`);
      const oldPrevious = findButton(tree, 'Previous').props.onClick;
      hooks.render(Player, { title: 'Changed lecture', slides: slides.map(slide => ({ ...slide })), navigation: changedNavigation });
      oldPrevious();
      assert.equal(fake.calls.length, 1);
      assert.equal(fake.currentUrl(), `${route}?lectureSlide=third&lectureRevision=${revision}`);
      hooks.unmount();
    });
  }
});
