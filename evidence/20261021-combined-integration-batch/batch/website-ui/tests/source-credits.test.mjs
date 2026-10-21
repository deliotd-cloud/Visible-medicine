import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const cache = new Map();
function compile(file) {
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  const code = ts.transpileModule(read(file), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'next/link') return Link;
    if (name.endsWith('.css')) return {};
    if (name === './BrandLockup') return { BrandLockup: () => React.createElement('span', null, 'Visible Medicine') };
    if (name.startsWith('.')) return compile(path.relative(root, path.resolve(root, path.dirname(file), name)) + '.ts');
    return require(name);
  }, mod, mod.exports);
  cache.set(file, mod.exports); return mod.exports;
}
const api = compile('app/credits/page.tsx'), data = compile('lib/source-credits.ts');
const html = renderToStaticMarkup(React.createElement(api.default));
test('credits remain a compact public page with one heading and native grouped disclosures', () => {
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/<details\b/g) || []).length, 5);
  assert.equal((html.match(/<summary\b/g) || []).length, 5);
  assert.equal((html.match(/<details open=""/g) || []).length, 1);
  assert.equal(api.metadata.title, 'Source credits');
  assert.doesNotMatch(html, /<img\b|<iframe\b|<script\b|\bonclick=/i);
});
test('retains source attribution and makes preview, teaching, private-data and entitlement limits explicit', () => {
  for (const text of ['The Database Center for Life Science', 'CC BY 4.0', 'Mikael Häggström', 'Edlow', 'Jahobr', 'Stillwaterising', 'ex-vivo', 'diastasis recti', 'not registered views', 'SIL Open Font License 1.1', 'not covered by the preview-image or software licences', 'access remain independent', 'not an exhaustive rights clearance', 'separate, revision-bound clinical review']) assert(html.includes(text), text);
  assert.equal(data.previewCredits.length, 5);
  assert.equal(data.viewerNoticeLinks.length, 4);
  assert(!html.includes('approved for commercial use'));
});
test('notice destinations exist in the actual frozen delivery without accessing private resources', () => {
  // Native runs use this project's public assets. The isolated sandbox supplies
  // the unchanged frozen delivery root rather than fabricating notice files.
  const base = process.env.VM_CREDITS_SOURCE_ROOT || root;
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1].replaceAll('&amp;', '&'));
  for (const href of hrefs) {
    assert(!/^\/\/(?:[^/])/.test(href));
    assert(!/\b(?:workspace|api|private|atlas-models|headAtlas|manifest\.json)\b/.test(href), href);
    if (!href.startsWith('/')) { assert.equal(new URL(href).protocol, 'https:'); continue; }
    if (['/atlas', '/trust'].includes(href)) continue;
    const resolved = path.resolve(base, 'public', '.' + href);
    assert(resolved.startsWith(path.resolve(base, 'public') + path.sep));
    assert(fs.statSync(resolved).isFile(), href);
  }
});
test('footer adds exactly one credits link while preserving its complete original bytes and all destinations', () => {
  const original = read('tests/fixtures/source-credits/SiteFooter.tsx.raw');
  assert.equal(createHash('sha256').update(original).digest('hex'), 'e24b578934daeb60c1f13ee22f3c31a5e0f555cf6b10dd070a19e67ab2148e8a');
  const current = read('components/SiteFooter.tsx'), added = '<Link href="/credits">Source credits</Link>';
  assert.equal(current.split(added).length, 2);
  assert.equal(current.replace(added, ''), original);
  const footer = renderToStaticMarkup(React.createElement(compile('components/SiteFooter.tsx').SiteFooter));
  assert.equal((footer.match(/href="\/credits"/g) || []).length, 1);
  assert.match(footer, /Visible Medicine governance/);
  assert.match(footer, /Powered by Didanix/);
});
test('new page is static, styles are scoped, and no new remote font, image, auth or persistence is introduced', () => {
  const page = read('app/credits/page.tsx');
  assert.doesNotMatch(page, /use client|useEffect|fetch\(|localStorage|sessionStorage|cookies\(|chatgpt-auth|process\.env/);
  const css = read('app/credits/source-credits.css');
  assert.doesNotMatch(css, /@import|url\(|animation|transition|position:\s*fixed/);
  assert(css.split('\n').filter(Boolean).every(line => line.startsWith('.source-credits-page')));
  assert.match(css, /focus-visible/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /flex-wrap: wrap/);
});
