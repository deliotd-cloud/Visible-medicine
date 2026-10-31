import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as atlasNavigation from '../lib/atlas-navigation.ts';

const require = createRequire(import.meta.url);
const Link = ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement('a', props, children);
const mocks: Record<string, unknown> = {
  'next/link': Link,
  '../lib/atlas-navigation': atlasNavigation,
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

test('home and catalogue describe implemented local head viewers without claiming approval or registration', async () => {
  const home = await render('app/page.tsx');
  assert(home.includes(atlasNavigation.atlasAvailabilitySummary));
  const source = readFileSync(new URL('../components/AtlasModalityCards.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  }}).outputText;
  const loaded = {exports: {} as Record<string, (props?: object) => React.ReactElement>};
  new Function('require', 'module', 'exports', code)((name: string) => {
    if (name === './SiteImage') {
      const imageSource = readFileSync(new URL('../components/SiteImage.tsx', import.meta.url), 'utf8');
      const imageCode = ts.transpileModule(imageSource, {compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
      }}).outputText;
      const image = {exports: {}};
      new Function('require', 'module', 'exports', imageCode)((dependency: string) =>
        dependency === '../lib/site-image' ? require('../lib/site-image.ts') : require(dependency), image, image.exports);
      return image.exports;
    }
    return name in mocks ? mocks[name] : require(name);
  }, loaded, loaded.exports);
  const notes = renderToStaticMarkup(loaded.exports.AtlasImageNotes());
  const preview = renderToStaticMarkup(loaded.exports.AtlasModalityPreview());
  const cards = renderToStaticMarkup(loaded.exports.AtlasModalityCards({}));
  const list = renderToStaticMarkup(loaded.exports.AtlasModalityCards({layout:'list'}));
  assert.match(notes, /<details class="atlas-hub-notes"><summary>/, 'details start collapsed');
  for (const modality of atlasNavigation.atlasModalities) {
    assert(list.includes(modality.description), modality.id + ': concise description remains visible');
    assert(!list.includes(modality.overview), modality.id + ': long guidance is outside the navigation cards');
    assert(notes.includes(modality.overview), modality.id + ': complete guidance remains available');
    assert(list.includes(modality.status), modality.id + ': availability remains visible');
    assert(list.includes(modality.caption), modality.id + ': reference-image caption remains visible');
  }
  assert(notes.includes(atlasNavigation.atlasAvailabilitySummary));
  for (const text of ['not spatially registered scans', 'not uploaded', 'pending clinical review', 'reference previews', 'access are separate']) assert(notes.includes(text), text);
  assert.match(preview, /integrated CT\/MRI head viewers · local scan sources/);
  assert.match(notes, /Use configured local scans or compatible teaching folders/);
  assert.match(notes, /Hosted scan delivery, published ultrasound studies, X-ray and other imaging regions remain in preparation/);
  assert.doesNotMatch(notes, /approved scans automatically|Hosted scan delivery is enabled/);
  for (const id of ['ct', 'mri']) {
    const item = atlasNavigation.atlasModalities.find(item => item.id === id)!;
    assert.equal(item.status, 'Integrated viewer · local scans');
    assert.match(item.overview, /configured local preview; approved folder selection elsewhere/);
    assert.match(item.overview, /not spatially registered/);
    assert(cards.includes(`href="${item.href}"`));
  }
  const ultrasound = atlasNavigation.atlasModalities.find(item => item.id === 'ultrasound')!;
  assert.equal(ultrasound.status, 'Local folders · review pending');
  assert.match(ultrasound.overview, /prepared local still-image teaching folder/);
  assert.match(ultrasound.overview, /Published studies remain in preparation/);
  assert(cards.includes('href="/atlas/ultrasound"'));
  assert.match(notes, /ultrasound supports local still-image teaching folders/);
  assert.equal(atlasNavigation.atlasModalities.find(item => item.id === 'x-ray')!.status, 'In preparation');
  for (const html of [home, notes, preview, cards]) assert.doesNotMatch(html, /CT demonstration|CT demo available|MRI, ultrasound and X-ray|clinically approved atlas|approved head atlas/);
  assert.match(notes, /href="\/media\/atlas\/NOTICES.md"/);
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
