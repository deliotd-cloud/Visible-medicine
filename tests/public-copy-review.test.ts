import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const Link = ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement('a', props, children);
const mocks: Record<string, unknown> = {
  'next/link': Link,
  '../lib/education-platform': { listCatalogueCourses: async () => [] },
  '../components/AtlasModalityCards': {
    AtlasModalityCards: () => null, AtlasImageNotes: () => null, AtlasModalityPreview: () => null,
  },
  '@/components/BrandLockup': { BrandLockup: () => React.createElement('span', null, 'Visible Medicine') },
};
async function render(path: string) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const loaded = { exports: {} as { default?: () => React.ReactElement | Promise<React.ReactElement> } };
  new Function('require', 'module', 'exports', code)(
    (name: string) => name in mocks ? mocks[name] : require(name), loaded, loaded.exports,
  );
  assert(loaded.exports.default);
  return renderToStaticMarkup(await loaded.exports.default());
}

test('Individual Atlas plan does not bundle courses; all four rights remain separate', async () => {
  const html = await render('app/pricing/page.tsx');
  const plans = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].map(m => m[1]);
  assert.equal(plans.length, 4);
  const individual = plans.find(p => p.includes('<h2>Individual</h2>'));
  assert(individual);
  assert.match(individual, /Courses purchased or granted separately/);
  assert.doesNotMatch(individual, /Visible Medicine official courses/);
  assert.match(plans.find(p => p.includes('<h2>Institution</h2>')) ?? '', /Studio authoring for your organisation/);
  assert.match(html, /Atlas, imaging-case, lecture\/course and Studio access are separate/);
  assert.match(html, /does not include paid lectures or courses/);
  assert.match(html, /do not automatically include the Atlas, imaging cases or separately paid courses/);
  assert.match(html, /Any bundle must explicitly identify the access it grants/);
});

test('public home and institution copy does not claim completed clinical review', async () => {
  for (const path of ['app/page.tsx', 'app/institutions/page.tsx', 'app/pricing/page.tsx']) {
    const html = await render(path);
    assert.doesNotMatch(html, /reviewed\s+(?:Visible Medicine\s+Atlas|radiological|anatomy)|public reviewed anatomy/i, path);
    if (path !== 'app/pricing/page.tsx') assert.match(html, /review (?:is )?in progress/i, path);
  }
  const institutions = await render('app/institutions/page.tsx');
  assert.match(institutions, /access are granted separately/);
  assert.match(institutions, /does not automatically include paid courses or Atlas access/);
});

test('route loading is neutral and retains the live announcement and brand', async () => {
  const html = await render('app/loading.tsx');
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Visible Medicine/);
  assert.match(html, /<p>Loading…<\/p>/);
  assert.doesNotMatch(html, /education workspace/i);
});
