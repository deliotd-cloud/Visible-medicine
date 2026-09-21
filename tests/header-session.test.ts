import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
let pathname = '/';
function compile(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} as Record<string, any> };
  new Function('require', 'module', 'exports', code)(
    (name: string) => name in mocks ? mocks[name] : require(name), module, module.exports,
  );
  return module.exports;
}
const Link = ({ children, ...props }: any) => React.createElement('a', props, children);
const navigation = { usePathname: () => pathname };
const { SiteHeader } = compile('components/SiteHeader.tsx', {
  'next/link': Link, 'next/navigation': navigation,
  './BrandLockup': { BrandLockup: () => React.createElement('span', null, 'Visible Medicine') },
  '../lib/atlas-navigation': { atlasModalities: [] },
});
const { SiteFrame } = compile('components/SiteFrame.tsx', {
  'next/link': Link, 'next/navigation': navigation,
  './SiteHeader': { SiteHeader }, './SiteFooter': { SiteFooter: () => null },
});

function occurrences(value: string, fragment: string) {
  return value.split(fragment).length - 1;
}

test('public routes retain the full site header and request-scoped account link', () => {
  for (const route of ['/', '/atlas/head-neck-3d', '/courses', '/account-entry']) {
    pathname = route;
    for (const signedIn of [true, false]) {
      const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn }, 'content'));
      assert.match(html, /<header class="topbar platform-header public-platform-header">/);
      assert.match(html, /<nav class="nav-links public-primary-nav" aria-label="Primary navigation">/);
      assert.ok(html.includes('class="workspace-switcher"'), 'public workspace switcher remains available');
      assert.ok(html.includes(`class="account-entry-link" href="${signedIn ? '/account' : '/account-entry'}"`));
      assert.ok(html.includes(signedIn ? '>Profile and account<span' : '>Sign in or create account<span'));
    }
  }
});

test('workspace routes render one compact header without duplicate site navigation', () => {
  for (const route of ['/my-learning', '/studio/workspace', '/studio/courses/course-1', '/workspace', '/account', '/account/settings']) {
    pathname = route;
    for (const signedIn of [true, false]) {
      const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn }, 'content'));
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
  const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: true }, 'content'));
  assert.match(html, /<summary>Account <span aria-hidden="true">⌄<\/span><\/summary>/);
  assert.ok(!html.includes('aria-current="page" href="/my-learning"'));
  assert.ok(html.includes('aria-current="page" href="/account"'));
});

test('actual root layout supplies only request-scoped boolean with no identity leakage', async () => {
  let user: unknown = null;
  let calls = 0;
  const { default: Layout, dynamic } = compile('app/layout.tsx', {
    'next/font/google': { Geist_Mono: () => ({ variable: 'font-fixture' }) },
    '../components/SiteFrame': { SiteFrame },
    '../components/SplashScreen': { SplashScreen: () => null },
    '../lib/splash-intro': { SPLASH_BOOTSTRAP_SCRIPT: '' },
    './chatgpt-auth': { getChatGPTUser: async () => { calls++; return user; } },
    './globals.css': {}, './atlas-navigation.css': {},
  });
  assert.equal(dynamic, 'force-dynamic');
  pathname = '/atlas/head-neck-3d';
  for (const value of [null, { userId: 'fixture-private-id', email: 'fixture-private@example.invalid', displayName: 'Private fixture' }, null]) {
    user = value;
    const tree = await Layout({ children: 'content' });
    const frame = tree.props.children[1].props.children[1];
    assert.deepEqual(Object.keys(frame.props).sort(), ['children', 'signedIn']);
    assert.equal(frame.props.signedIn, value !== null);
    const html = renderToStaticMarkup(tree);
    assert(!html.includes('fixture-private'));
    assert(!html.includes('Private fixture'));
    assert(html.includes(value ? '>Profile</a>' : '>Sign in</a>'));
  }
  assert.equal(calls, 3, 'No process-global session cache');
});
