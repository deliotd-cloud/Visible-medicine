import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const built = await build({ stdin: {
  contents: "export {default as Page} from './app/review/overview/page'; export * from './lib/clinical-review-index';",
  resolveDir: process.cwd(), loader: 'tsx',
}, bundle: true, write: false, platform: 'node', format: 'cjs' });
const scope = { exports: {} };
// Only framework brand wrappers are substituted; the page, metadata and index
// are real. This verifies server output, not browser CSS or authentication.
runInNewContext(built.outputFiles[0].text, {
  module: scope, exports: scope.exports, URLSearchParams,
  require(name) {
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (name === 'next/image') return ({ unoptimized: _unoptimized, ...props }) => React.createElement('img', props);
    return require(name);
  },
});
const { Page, clinicalReviewEntries, findClinicalReviewEntries } = scope.exports;
const render = async params => renderToStaticMarkup(await Page({ searchParams: Promise.resolve(params) }));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

test('overview presents four review scopes without inferring approval status', async () => {
  const html = await render({});
  assert(html.includes('<h1>Clinical review</h1>'));
  assert(html.includes('not pending approvals'));
  assert(html.includes('Your saved status is loaded privately'));
  assert(html.includes('Status not loaded'));
  assert(html.includes('approvals do not transfer'));
  assert(html.includes('Source renderer fingerprint'));
  for (const scopeName of ['shoulder', 'body', 'nested', 'specimens']) assert(html.includes('scope=' + scopeName));
  assert(!html.includes('Approve all'));
  assert(html.includes('href="#review-results"'));
  assert(html.includes('aria-label="Review results pages"'));
  assert(html.includes('name="q"'));
  assert(html.includes('name="scope"'));
  assert(!html.includes('name="page"'), 'Changing filters starts at first page');
});

test('each scope renders real exact-source review links', async () => {
  for (const selected of ['shoulder', 'body', 'nested', 'specimens']) {
    const expected = findClinicalReviewEntries({ scope: selected });
    const html = await render({ scope: selected });
    for (const entry of expected.entries) assert(html.includes('href="' + escape(entry.href) + '"'), entry.key);
    assert(html.includes('value="' + selected + '" selected=""'));
    assert(html.includes('aria-current="page"'));
  }
  assert(clinicalReviewEntries.length > 1000);
});

test('search, no results and pagination retain safe canonical state', async () => {
  const html = await render({ scope: 'body', q: ' left ', page: '2' });
  assert(html.includes('value="left"'));
  assert(html.includes('q=left&amp;scope=body&amp;page=3#review-results'));
  assert(html.includes('q=left&amp;scope=body#review-results'));
  const hostile = await render({ q: '"><script>alert(1)</script>', scope: ['body'], page: ['2'] });
  assert(!hostile.includes('<script>alert(1)</script>'));
  assert(hostile.includes('No matches.'));
  assert(!hostile.includes('Review results pages'));
});

test('starter review uses the existing compact filter and exact source links', async () => {
  const html = await render({ scope: 'pilot' });
  assert(html.includes('value="pilot" selected=""'));
  assert(html.includes('11 matching selections'));
  assert(html.includes('not a release allowlist'));
  assert(!html.includes('aria-label="Review results pages"'));
  for (const entry of findClinicalReviewEntries({scope:'pilot'}).entries)
    assert(html.includes('href="' + escape(entry.href) + '"'));
});

test('all four existing review headers return to the hub without replacing decision editors', async () => {
  for (const path of ['app/review/review-dashboard.tsx', 'app/review/body/review-dashboard.tsx',
    'app/review/nested/page.tsx', 'app/review/specimens/page.tsx']) {
    const source = await readFile(path, 'utf8');
    assert(source.includes('href="/review/overview"'), path);
  }
  for (const path of ['app/review/nested/workspace.tsx', 'app/review/specimens/workspace.tsx']) {
    const source = await readFile(path, 'utf8');
    assert(source.includes('document.addEventListener("click", click, true)'));
  }
});
