// Isolated, read-only component preview. Not the Website application or auth host.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const require = createRequire(import.meta.url), root = import.meta.dirname;
const source = 'F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const cache = new Map();
function compile(file) {
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} }, text = fs.readFileSync(root + '/' + file, 'utf8');
  const code = ts.transpileModule(text, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'next/link') return Link;
    if (name.endsWith('.css')) return {};
    if (name === './BrandLockup') return { BrandLockup: () => React.createElement('span', null, 'Visible Medicine') };
    if (name.startsWith('.')) return compile(path.relative(root, path.resolve(root, path.dirname(file), name)) + '.ts');
    return require(name);
  }, mod, mod.exports);
  cache.set(file, mod.exports); return mod.exports;
}
const page = renderToStaticMarkup(React.createElement(compile('app/credits/page.tsx').default));
const footer = renderToStaticMarkup(React.createElement(compile('components/SiteFooter.tsx').SiteFooter));
const documents = new Map();
for (const match of page.matchAll(/href="([^"]+)"/g)) {
  const href = match[1];
  if (!href.startsWith('/') || ['/atlas', '/trust'].includes(href)) continue;
  assert(!href.includes('..') && !href.includes('?') && !href.includes('#'));
  documents.set(href, fs.readFileSync(source + '/public' + href));
}
const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Source credits · component preview</title><link rel="stylesheet" href="/globals.css"><link rel="stylesheet" href="/source-credits.css"></head><body>' + page + footer + '</body></html>';
// Drop build-only imports. No generated Tailwind/review stylesheet or app shell is
// substituted: this check is explicitly the static component plus existing CSS.
const globalCss = fs.readFileSync(source + '/app/globals.css', 'utf8').replace(/^@import[^\n]*\n/gm, '');
const routes = new Map([
  ['/credits', ['text/html; charset=utf-8', Buffer.from(html)]],
  ['/globals.css', ['text/css; charset=utf-8', Buffer.from(globalCss)]],
  ['/source-credits.css', ['text/css; charset=utf-8', fs.readFileSync(root + '/app/credits/source-credits.css')]],
  ...[...documents].map(([url, bytes]) => [url, ['text/plain; charset=utf-8', bytes]]),
]);
const server = http.createServer((req, res) => {
  const route = routes.get(req.url);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none'");
  if (!['GET', 'HEAD'].includes(req.method) || !route) { res.writeHead(404); res.end('Not available in component preview'); return; }
  res.setHeader('Content-Type', route[0]); res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : route[1]);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
console.log(JSON.stringify({ url: `http://127.0.0.1:${server.address().port}/credits`, pid: process.pid,
  scope: 'Static credits/footer component preview only; Link and brand mocked. No Website router/auth/app shell, private data, generated styles, runtime or clinical acceptance.' }));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
