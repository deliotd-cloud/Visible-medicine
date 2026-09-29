/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
let cursor = 0, overrides = {};
const shim = { ...React,
  useState(initial) { const i = cursor++; return [Object.hasOwn(overrides, i) ? overrides[i] : typeof initial === 'function' ? initial() : initial, () => {}]; },
  useEffect() {}, useMemo(fn) { return fn(); },
  useRef(initial) { return { current: initial }; },
};
const built = await build({ stdin: { contents: `
  export * from './components/review-sign-in-link';
  export * from './lib/clinical-review-index';
  export { bodyReviewSummaries, bodyReviewRegions } from './lib/body-review-material';
  export { nestedReviewMaterial } from './lib/nested-review-material';
  export { specimenReviewMaterial } from './lib/specimen-review-material';
  export { ReviewDashboard } from './app/review/review-dashboard';
  export { BodyReviewDashboard } from './app/review/body/review-dashboard';
  export { BodyDecisionEditor } from './app/review/body/body-decision-editor';
  export { NestedDecisionEditor } from './app/review/nested/workspace';
  export { SpecimenDecisionEditor } from './app/review/specimens/workspace';
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'cjs' });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports,
  URLSearchParams, crypto: webcrypto, TextEncoder, structuredClone,
  require(name) {
    if (name === 'react') return shim;
    // Framework wrappers are not exercised; actual review component functions
    // and their sign-in anchors are. This is not a browser/auth-provider test.
    if (name === 'next/link' || name === 'next/image') return () => null;
    return require(name);
  },
});
const api = scope.exports;
const origin = 'https://atlas.example';
function destination(href) {
  const signIn = new URL(href, origin);
  assert.equal(signIn.origin, origin);
  assert.equal(signIn.pathname, '/signin-with-chatgpt');
  assert.deepEqual([...signIn.searchParams.keys()], ['return_to']);
  const result = new URL(signIn.searchParams.get('return_to'), origin);
  assert.equal(result.origin, origin);
  assert.equal(result.hash, '');
  return result;
}
function sameSelection(actual, expectedHref) {
  const expected = new URL(expectedHref, origin);
  assert.equal(actual.pathname, expected.pathname);
  const byKey = (a, b) => a[0].localeCompare(b[0]);
  assert.deepEqual([...actual.searchParams].sort(byKey), [...expected.searchParams].sort(byKey));
}
const targetFor = entry => {
  const p = new URL(entry.href, origin).searchParams;
  return { scope: entry.scope, ...Object.fromEntries(p) };
};
const walk = (node, found = []) => {
  if (React.isValidElement(node)) {
    if (node.type === api.ReviewSignInLink) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, found));
  }
  return found;
};
function render(Component, props, state = {}) { cursor = 0; overrides = state; return Component(props); }
function assertLink(tree, entry) {
  const links = walk(tree); assert.equal(links.length, 1);
  const anchor = api.ReviewSignInLink(links[0].props);
  assert.equal(anchor.type, 'a'); assert.equal(anchor.props.target, '_top');
  assert.equal(anchor.props.onClick, undefined);
  sameSelection(destination(anchor.props.href), entry.href);
}

test('all admitted review selections survive sign-in without changing model scope or source token', () => {
  // Includes the two admitted hippocampi; continue testing every exact return.
  assert.equal(api.clinicalReviewEntries.length, 1577);
  assert.equal(api.clinicalReviewEntries.filter(e => e.scope === 'nested' && /hippocampus/i.test(e.name)).length, 2);
  for (const entry of api.clinicalReviewEntries) {
    sameSelection(destination(api.reviewSignInHref(targetFor(entry))), entry.href);
  }
});

test('return destinations cannot be replaced by URL-shaped or delimiter-bearing parameters', () => {
  for (const value of ['//outside.example', 'https://outside.example', '../review', '\\outside',
    'id&return_to=https://outside.example#fragment', '%2f%2foutside', 'a\r\nb']) {
    for (const scopeName of ['shoulder', 'body', 'nested', 'specimens']) {
      const result = destination(api.reviewSignInHref({ scope: scopeName, structure: value,
        parent: value, study: value, source: value, specimen: value, return_to: '//outside.example' }));
      assert.equal(result.searchParams.get('structure'), value);
      assert(!result.searchParams.has('return_to'));
      assert.equal(result.pathname, scopeName === 'shoulder' ? '/review' : '/review/' + scopeName);
    }
  }
  assert.throws(() => api.reviewSignInHref({ scope: '//outside', structure: 'a' }), /Unknown review scope/);
  sameSelection(destination(api.reviewSignInHref({ scope: 'body', structure: null })), '/review/body');
});

test('shoulder and both body error surfaces use the currently selected structure', () => {
  const shoulder = api.clinicalReviewEntries.filter(e => e.scope === 'shoulder').at(-1);
  assertLink(render(api.ReviewDashboard, { initialId: shoulder.id }, { 6: 'Sign in required' }), shoulder);
  const body = api.clinicalReviewEntries.find(e => e.scope === 'body');
  assertLink(render(api.BodyReviewDashboard, { rows: api.bodyReviewSummaries, regions: api.bodyReviewRegions,
    initialId: body.id, initialRegion: 'all' }, { 7: 'Sign in required' }), body);
  assertLink(render(api.BodyDecisionEditor, { id: body.id, materialHash: 'test', onDirty() {} },
    { 7: 'Sign in required' }), body);
  assert.equal(walk(render(api.BodyDecisionEditor, { id: body.id, materialHash: 'test', onDirty() {} })).length, 0);
});

test('internal and independent editor error surfaces preserve exact source context', async () => {
  for (const scopeName of ['nested', 'specimens']) {
    const entry = api.clinicalReviewEntries.find(e => e.scope === scopeName);
    const [key, id] = JSON.parse(entry.key.slice(scopeName.length + 1));
    const packet = await (scopeName === 'nested' ? api.nestedReviewMaterial : api.specimenReviewMaterial)(key, id);
    assert(packet);
    const Component = scopeName === 'nested' ? api.NestedDecisionEditor : api.SpecimenDecisionEditor;
    const props = { packet, track: 'geometry', onDirty() {} };
    assertLink(render(Component, props, { 7: 'Sign in required' }), entry);
    assert.equal(walk(render(Component, props)).length, 0, 'No sign-in suggestion during initial loading');
    assert.equal(walk(render(Component, props, { 1: { history: [], nextBefore: null }, 7: 'Other error' })).length, 0,
      'Loaded private history does not suggest signing in again');
  }
});

test('review result focus stays inside the rounded clipping boundary', async () => {
  const css = await readFile('app/review/overview/overview.css', 'utf8');
  assert.match(css, /\.clinical-review-results\s*\{[^}]*overflow:hidden/);
  assert.match(css, /\.clinical-review :is\(a,button,input,select,summary\):focus-visible\s*\{[^}]*outline:3px solid var\(--vm-ink\);[^}]*outline-offset:3px/);
  assert.match(css, /\.clinical-review-results a:focus-visible\s*\{\s*outline-offset:-3px;/);
});
