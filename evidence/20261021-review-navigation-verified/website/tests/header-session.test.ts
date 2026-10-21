import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { isPublicFocusPath, shouldFocusPublicRoute } from '../lib/public-route-focus.ts';
import { optionalReviewAvailability, reviewDestination, reviewDestinationActive } from '../lib/review-destination.ts';

const require = createRequire(import.meta.url);
let pathname = '/';
function compile(path: string, mocks: Record<string, unknown>) {
  const sourcePath = new URL('../' + path, import.meta.url);
  const source = readFileSync(sourcePath, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const loadedModule = { exports: {} as Record<string, unknown> };
  new Function('require', 'module', 'exports', code)(
    (name: string) => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports,
  );
  return loadedModule.exports;
}
const Link = ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement('a', props, children);
const navigation = { usePathname: () => pathname };
const { SiteHeader } = compile('components/SiteHeader.tsx', {
  'next/link': Link, 'next/navigation': navigation,
  './BrandLockup': { BrandLockup: () => React.createElement('span', null, 'Visible Medicine') },
  '../lib/atlas-navigation': { atlasModalities: [] },
  '../lib/review-destination': { reviewDestination, reviewDestinationActive },
}) as { SiteHeader: React.ComponentType<{ signedIn: boolean; reviewAvailable: boolean }> };
const { SiteFrame } = compile('components/SiteFrame.tsx', {
  'next/link': Link, 'next/navigation': navigation,
  './SiteHeader': { SiteHeader }, './SiteFooter': { SiteFooter: () => null },
  '../lib/public-route-focus': { isPublicFocusPath, shouldFocusPublicRoute },
  '../lib/review-destination': { reviewDestination, reviewDestinationActive },
  './workspace-navigation.css': {},
}) as { SiteFrame: React.ComponentType<React.PropsWithChildren<{ signedIn: boolean; reviewAvailable: boolean }>> };
type TreeNode = React.ReactElement<{ children: TreeNode[]; signedIn?: boolean; reviewAvailable?: boolean }>;

function occurrences(value: string, fragment: string) {
  return value.split(fragment).length - 1;
}

test('public routes retain the full site header and request-scoped account link', () => {
  for (const route of ['/', '/atlas/head-neck-3d', '/courses', '/account-entry']) {
    pathname = route;
    for (const signedIn of [true, false]) {
      const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn, reviewAvailable: false }, 'content'));
      assert.match(html, /<header class="topbar platform-header public-platform-header">/);
      assert.match(html, /<nav class="nav-links public-primary-nav" aria-label="Primary navigation">/);
      assert.equal(html.includes('class="workspace-switcher"'), signedIn, 'workspace switcher needs a session');
      assert.ok(html.includes(`class="account-entry-link" href="${signedIn ? '/account' : '/account-entry'}"`));
      assert.ok(html.includes(signedIn ? '>Profile and account<span' : '>Sign in or create account<span'));
      if (!signedIn) {
        assert.equal(occurrences(html, 'href="/account-entry"'), 2, 'one sign-in entry in each responsive navigation');
        assert.ok(!html.includes('>My learning<span'), 'signed-out mobile menu has no workspace shortcuts');
      }
    }
  }
});

test('header menus respond to Escape, outside pointer, links, scroll and each other', () => {
  const listeners = new Map<string, (event: any) => void>();
  const mockDocument = {
    addEventListener: (name: string, listener: (event: any) => void) => listeners.set(`document:${name}`, listener),
    removeEventListener: (name: string) => listeners.delete(`document:${name}`),
  };
  const mockWindow = {
    addEventListener: (name: string, listener: (event: any) => void) => listeners.set(`window:${name}`, listener),
    removeEventListener: (name: string) => listeners.delete(`window:${name}`),
  };
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'document', { configurable: true, value: mockDocument });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: mockWindow });
  const state: unknown[] = [];
  const refs: Array<{ current: unknown }> = [];
  let stateIndex = 0;
  let refIndex = 0;
  let effects: Array<() => void> = [];
  let cleanup: Array<() => void> = [];
  const mockReact = {
    ...React,
    useState(initial: unknown) {
      const index = stateIndex++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (next: unknown) => { state[index] = typeof next === 'function' ? (next as (value: unknown) => unknown)(state[index]) : next; }];
    },
    useRef(initial: unknown) {
      const index = refIndex++;
      if (!refs[index]) refs[index] = { current: initial };
      return refs[index];
    },
    useEffect(effect: () => (() => void) | void) { effects.push(() => { const dispose = effect(); if (dispose) cleanup.push(dispose); }); },
  };
  const { SiteHeader: InteractiveHeader } = compile('components/SiteHeader.tsx', {
    react: mockReact,
    'next/link': Link, 'next/navigation': navigation,
    './BrandLockup': { BrandLockup: () => React.createElement('span', null, 'Visible Medicine') },
    '../lib/atlas-navigation': { atlasModalities: [] },
    '../lib/review-destination': { reviewDestination, reviewDestinationActive },
  }) as { SiteHeader: (props: { signedIn: boolean; reviewAvailable: boolean }) => React.ReactElement };
  type AnyElement = React.ReactElement<Record<string, any>>;
  const find = (element: React.ReactNode, predicate: (element: AnyElement) => boolean): AnyElement | undefined => {
    if (!React.isValidElement(element)) return;
    const node = element as AnyElement;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
      const match = find(child, predicate);
      if (match) return match;
    }
  };
  let tree!: React.ReactElement;
  const render = () => {
    cleanup.forEach(dispose => dispose());
    cleanup = [];
    effects = [];
    stateIndex = 0;
    refIndex = 0;
    tree = InteractiveHeader({ signedIn: true, reviewAvailable: false });
    effects.forEach(run => run());
    return tree;
  };
  const details = () => find(tree, node => node.type === 'details' && node.props.className === 'workspace-switcher')!;
  const panel = (id: string) => find(tree, node => node.type === 'div' && node.props.id === `${id}-navigation`)!;
  const toggle = (id: string) => find(tree, node => node.type === 'button' && node.props['data-nav-trigger'] === id)!;
  const summary = () => find(details(), node => node.type === 'summary')!;
  const workspaceLink = () => find(details(), node => node.props.href === '/my-learning')!;
  const focus = { workspace: 0, primary: 0 };
  try {
    render();
    const navNode = { contains: (target: unknown) => target === 'primary', querySelector: () => ({ focus: () => { focus.primary++; } }) };
    const workspaceNode = { contains: (target: unknown) => target === 'workspace' };
    find(tree, node => node.type === 'nav' && node.props.className === 'nav-links public-primary-nav')!.props.ref.current = navNode;
    details().props.ref.current = workspaceNode;
    summary().props.ref.current = { focus: () => { focus.workspace++; } };
    summary().props.onClick({ preventDefault() {} });
    render();
    assert.equal(details().props.open, true);
    assert.equal(summary().props['aria-expanded'], true);
    listeners.get('document:keydown')!({ key: 'Escape', preventDefault() {} });
    render();
    assert.equal(details().props.open, false);
    assert.equal(focus.workspace, 1, 'Escape restores the workspace toggle');

    summary().props.onClick({ preventDefault() {} });
    render();
    listeners.get('document:pointerdown')!({ target: 'outside' });
    render();
    assert.equal(details().props.open, false, 'outside pointer closes workspace');

    summary().props.onClick({ preventDefault() {} });
    render();
    workspaceLink().props.onClick();
    render();
    assert.equal(details().props.open, false, 'workspace link closes workspace');

    summary().props.onClick({ preventDefault() {} });
    render();
    listeners.get('window:scroll')!({});
    render();
    assert.equal(details().props.open, false, 'scroll closes workspace');

    const triggerNode = {};
    const courseGroup = find(tree, node => node.props['data-nav-section'] === 'courses')!;
    courseGroup.props.onFocus({ target: triggerNode, currentTarget: { querySelector: () => triggerNode } });
    render();
    assert.equal(panel('courses').props.hidden, true, 'focusing a toggle does not pre-open then reverse its click');
    assert.equal(courseGroup.props.onPointerEnter, undefined, 'hovering the toggle group does not pre-open then reverse a pointer click');
    toggle('courses').props.onClick();
    render();
    assert.equal(panel('courses').props.hidden, false, 'single toggle click opens a closed panel');
    listeners.get('window:scroll')!({ target: 'primary' });
    render();
    assert.equal(panel('courses').props.hidden, false, 'internal menu scrolling retains the menu');
    listeners.get('window:scroll')!({ target: 'outside' });
    render();
    assert.equal(panel('courses').props.hidden, true, 'page scrolling still dismisses the menu');

    summary().props.onClick({ preventDefault() {} });
    render();
    toggle('courses').props.onClick();
    render();
    assert.equal(details().props.open, false, 'opening primary closes workspace');
    assert.equal(panel('courses').props.hidden, false);
    toggle('atlas').props.onClick();
    render();
    assert.equal(panel('courses').props.hidden, true, 'only one primary panel is open');
    assert.equal(panel('atlas').props.hidden, false);
    listeners.get('document:keydown')!({ key: 'Escape', preventDefault() {} });
    render();
    assert.equal(panel('atlas').props.hidden, true);
    assert.equal(focus.primary, 1, 'Escape restores the primary toggle');

    toggle('courses').props.onClick();
    render();
    listeners.get('document:pointerdown')!({ target: 'outside' });
    render();
    assert.equal(panel('courses').props.hidden, true, 'outside pointer closes primary');
    toggle('courses').props.onClick();
    render();
    find(panel('courses'), node => node.props.href === '/join')!.props.onClick();
    render();
    assert.equal(panel('courses').props.hidden, true, 'primary link closes panel');

    toggle('institutions').props.onClick();
    render();
    summary().props.onClick({ preventDefault() {} });
    render();
    assert.equal(panel('institutions').props.hidden, true, 'opening workspace closes primary');
    assert.equal(details().props.open, true);
  } finally {
    cleanup.forEach(dispose => dispose());
    Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
});

test('workspace routes render one compact header without duplicate site navigation', () => {
  for (const route of ['/my-learning', '/studio/workspace', '/studio/courses/course-1', '/workspace', '/account', '/account/settings']) {
    pathname = route;
    for (const signedIn of [true, false]) {
      const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn, reviewAvailable: false }, 'content'));
      assert.equal(occurrences(html, '<header'), 1, route);
      assert.equal(occurrences(html, 'class="workspace-context-header"'), 1, route);
      assert.ok(!html.includes('public-platform-header'), route);
      assert.ok(!html.includes('aria-label="Primary navigation"'), route);
      assert.ok(!html.includes('class="workspace-switcher"'), route);
      const account = html.match(/<a class="account-entry-link"[^>]*>[^<]*<\/a>/)?.[0];
      assert.ok(account);
      assert.ok(account.includes(`href="${signedIn ? '/account' : '/account-entry'}"`));
      assert.ok(account.endsWith(`>${signedIn ? 'Profile' : 'Sign in'}</a>`));
      const active = signedIn ? route === '/account' || route.startsWith('/account/') : route === '/account-entry';
      assert.equal(account.includes('aria-current="page"'), active, `${signedIn}: ${route}`);
    }
  }
});

test('account workspace is not presented as the Learn workspace', () => {
  pathname = '/account/settings';
  const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: true, reviewAvailable: false }, 'content'));
  assert.match(html, /<nav class="workspace-primary-nav" aria-label="Choose workspace">/);
  assert.ok(!html.includes('aria-current="page" href="/my-learning"'));
  assert.ok(html.includes('aria-current="page" href="/account"'));
});

test('actual root layout supplies only request-scoped booleans with no identity leakage', async () => {
  let user: unknown = null;
  let calls = 0;
  let reviewCalls = 0;
  let reviewAllowed = false;
  const { default: Layout, dynamic } = compile('app/layout.tsx', {
    'next/font/google': { Geist_Mono: () => ({ variable: 'font-fixture' }) },
    'next/font/local': () => ({ variable: 'font-fixture' }),
    '../components/SiteFrame': { SiteFrame },
    '../components/SplashScreen': { SplashScreen: () => null },
    '../components/LocalAtlasDiagnostics': { LocalAtlasDiagnostics: () => null },
    '../lib/splash-intro': { SPLASH_BOOTSTRAP_SCRIPT: '' },
    './chatgpt-auth': { getChatGPTUser: async () => { calls++; return user; } },
    '../lib/clinical-review-server': { authorizeClinicalReview: async () => { reviewCalls++; if (!reviewAllowed) throw Error('unavailable'); } },
    '../lib/review-destination': { optionalReviewAvailability },
    './globals.css': {}, './atlas-navigation.css': {},
  }) as { default: (props: { children: React.ReactNode }) => Promise<React.ReactElement<{ children: React.ReactNode }>>; dynamic: string };
  assert.equal(dynamic, 'force-dynamic');
  pathname = '/atlas/head-neck-3d';
  for (const [value, allowed] of [
    [null, false],
    [{ userId: 'fixture-private-id', email: 'fixture-private@example.invalid', displayName: 'Private fixture' }, true],
    [{ userId: 'fixture-private-id', email: 'fixture-private@example.invalid', displayName: 'Private fixture' }, false],
    [null, true],
  ] as const) {
    user = value;
    reviewAllowed = allowed;
    const tree = await Layout({ children: 'content' });
    const frame = (tree as TreeNode).props.children[1].props.children[1];
    assert.deepEqual(Object.keys(frame.props).sort(), ['children', 'reviewAvailable', 'signedIn']);
    assert.equal(frame.props.signedIn, value !== null);
    assert.equal(frame.props.reviewAvailable, value !== null && allowed);
    const html = renderToStaticMarkup(tree);
    assert(!html.includes('fixture-private'));
    assert(!html.includes('Private fixture'));
    assert(html.includes(value ? '>Profile</a>' : '>Sign in</a>'));
    assert.equal(/href="\/workspace\/clinical-review-inbox"[^>]*><b>Clinical Review<\/b>/.test(html), value !== null && allowed);
  }
  assert.equal(calls, 4, 'No process-global session cache');
  assert.equal(reviewCalls, 2, 'Only signed-in requests call the independently mocked server guard');
});

test('Clinical Review navigation opens the inbox and retains exact worksheet and comparison context', () => {
  for (const route of ['/workspace', '/workspace/clinical-review-inbox', '/workspace/atlas-review',
    '/workspace/atlas-review/body', '/workspace/atlas-review/head-learning', '/workspace/atlas-review/model',
    '/workspace/atlas-review/source-comparisons', '/workspace/atlas-review/source-comparisons/optic',
    '/workspace/people', '/workspace/atlas-review-old', '/workspace/clinical-review-inbox-old']) {
    pathname = route;
    for (const signedIn of [true, false]) {
      const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn, reviewAvailable: false }, 'content'));
      const navElement = html.match(/<nav class="institution-app-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
      const nav = navElement?.match(/>([\s\S]*)<\/nav>/)?.[1];
      if (route === '/workspace') {
        // The compact role-aware landing page owns its destinations; only
        // nested administration/review routes have the context sub-navigation.
        assert.equal(navElement, undefined);
        assert.match(html, /aria-current="page" href="\/workspace">Workspace<\/a>/);
        assert.doesNotMatch(html, /href="\/workspace\/clinical-review-inbox"/);
        continue;
      }
      assert(nav, route);
      const links = [...nav.matchAll(/<a([^>]*)>([^<]*)<\/a>/g)];
      const worksheet = route === '/workspace/atlas-review' || route.startsWith('/workspace/atlas-review/');
      const comparing = route === '/workspace/atlas-review/source-comparisons' || route.startsWith('/workspace/atlas-review/source-comparisons/');
      const reviewRoute = route === '/workspace/clinical-review-inbox' || worksheet;
      assert.match(navElement, new RegExp(`aria-label="${reviewRoute ? 'Clinical Review' : 'Administration'} navigation"`), route);
      const topReview = html.match(/<a([^>]*)href="\/workspace\/clinical-review-inbox">Clinical Review<\/a>/)?.[1];
      assert.equal(Boolean(topReview), false, route);
      const topWorkspace = html.match(/<a([^>]*)href="\/workspace">Workspace<\/a>/)?.[1];
      assert.equal(Boolean(topWorkspace), true, route);
      if (!reviewRoute) assert(topWorkspace!.includes('aria-current="page"'), route);
      else assert(!topWorkspace!.includes('aria-current="page"'), route);
      const review = links.filter(([, , text]) => text === 'Review inbox');
      assert.equal(review.length, reviewRoute ? 1 : 0, route);
      if (reviewRoute) {
        assert.match(review[0][1], /href="\/workspace\/clinical-review-inbox"/, route);
        assert.equal(review[0][1].includes('aria-current="page"'), route === '/workspace/clinical-review-inbox', route);
        const selections = links.find(([, , text]) => text === 'All review selections');
        assert(selections, route);
        assert.equal(selections[1].includes('aria-current="page"'), worksheet && !comparing, route);
      }
      const comparison = links.filter(([, , text]) => text === 'Source comparisons');
      assert.equal(comparison.length, reviewRoute ? 1 : 0, route);
      if (reviewRoute) {
        assert.match(comparison[0][1], /href="\/workspace\/atlas-review\/source-comparisons"/);
        assert.equal(comparison[0][1].includes('aria-current="page"'), comparing, route);
      }
      assert.equal(links.filter(([, attrs]) => attrs.includes('aria-current="page"')).length,
        route === '/workspace' || ['/workspace/atlas-review-old', '/workspace/clinical-review-inbox-old'].includes(route) ? 0 : 1, route);
    }
  }
});

test('authorized Review and secondary Administration are request-scoped across public and workspace routes', () => {
  for (const route of ['/', '/atlas/head-neck-3d', '/courses', '/workspace', '/workspace/clinical-review-inbox', '/workspace/atlas-review/source-comparisons/optic']) {
    pathname = route;
    const authorized = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: true, reviewAvailable: true }, 'content'));
    const unavailable = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: true, reviewAvailable: false }, 'content'));
    const anonymous = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: false, reviewAvailable: true }, 'content'));
    assert.match(authorized, /href="\/workspace\/clinical-review-inbox"[^>]*>(?:<b>)?Clinical Review/);
    assert.match(authorized, /href="\/workspace"[^>]*>(?:<b>)?Administration/);
    assert.doesNotMatch(unavailable, /href="\/workspace\/clinical-review-inbox"[^>]*>(?:<b>)?Clinical Review/);
    assert.doesNotMatch(anonymous, /href="\/workspace\/clinical-review-inbox"[^>]*>(?:<b>)?Clinical Review/);
    assert.match(unavailable, /href="\/workspace"[^>]*>(?:<b>)?Workspace/);
    if (route.startsWith('/workspace')) assert.match(anonymous, /href="\/workspace"[^>]*>(?:<b>)?Workspace/);
    if (route.startsWith('/workspace/')) {
      // A directly requested path still renders its contextual navigation in
      // this presentation fixture; the real destination guard owns access.
      assert.match(authorized, /institution-app-nav/);
      assert.match(unavailable, /institution-app-nav/);
      assert.match(anonymous, /institution-app-nav/);
    }
  }
});

test('embedded context bar defaults Review availability to false', () => {
  const { WorkspaceContextBar } = compile('components/SiteFrame.tsx', {
    'next/link': Link, 'next/navigation': navigation,
    './SiteHeader': { SiteHeader }, './SiteFooter': { SiteFooter: () => null },
    '../lib/public-route-focus': { isPublicFocusPath, shouldFocusPublicRoute },
    '../lib/review-destination': { reviewDestination, reviewDestinationActive },
    './workspace-navigation.css': {},
  }) as { WorkspaceContextBar: React.ComponentType<{ pathname: string; signedIn: boolean; reviewAvailable?: boolean }> };
  const html = renderToStaticMarkup(React.createElement(WorkspaceContextBar, { pathname: '/workspace', signedIn: true }));
  assert.match(html, /href="\/workspace"[^>]*>Workspace/);
  assert.doesNotMatch(html, /href="\/workspace\/clinical-review-inbox"[^>]*>Clinical Review/);
});

test('availability and destination functions fail closed on non-true inputs', async () => {
  let calls = 0;
  const authorize = async () => { calls++; return { fixtureOnly: true }; };
  assert.equal(await optionalReviewAvailability(false, authorize), false);
  assert.equal(calls, 0);
  assert.equal(await optionalReviewAvailability(true, authorize), true);
  assert.equal(calls, 1);
  assert.equal(await optionalReviewAvailability(true, async () => { throw Error('revoked'); }), false);
  for (const [signedIn, available] of [[false, false], [false, true], [true, false], [true, true]] as const) {
    const destination = reviewDestination(signedIn, available);
    assert.equal(destination.href, signedIn && available ? '/workspace/clinical-review-inbox' : '/workspace');
  }
  assert.equal(reviewDestination(true, undefined as unknown as boolean).href, '/workspace');
  assert.equal(reviewDestination(undefined as unknown as boolean, true).href, '/workspace');
});
