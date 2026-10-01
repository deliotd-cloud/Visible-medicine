import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { atlasRegionLinks } from '../lib/atlas-navigation.ts';

const require = createRequire(import.meta.url);
let pathname = '/atlas/3d';
const destinations: string[] = [];

function compile(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  new Function('require', 'module', 'exports', code)(
    (name: string) => name in mocks ? mocks[name] : require(name), loaded, loaded.exports,
  );
  return loaded.exports;
}

const navigation = {
  usePathname: () => pathname,
  useRouter: () => ({ push: (destination: string) => destinations.push(destination) }),
};
const { AtlasRegionNavigation } = compile('components/AtlasRegionNavigation.tsx', {
  'next/navigation': navigation,
  '../lib/atlas-navigation': require('../lib/atlas-navigation.ts'),
}) as { AtlasRegionNavigation: (props: { modality: '3d' | 'ct'; selected: string }) => React.ReactElement<{ children: React.ReactElement<{ children: React.ReactNode }> }> };

test('native region picker keeps all 3D destinations, whole body first, and follows selections', () => {
  const regions = atlasRegionLinks('3d');
  assert.equal(regions[0].id, 'whole-body');
  assert.equal(regions.length, 15);
  for (const current of regions) {
    const tree = AtlasRegionNavigation({ modality: '3d', selected: current.id });
    const label = tree.props.children;
    assert.equal(label.type, 'label');
    const select = React.Children.toArray(label.props.children).find(
      child => React.isValidElement(child) && child.type === 'select',
    ) as React.ReactElement<{ value: string; onChange: (event: { currentTarget: { value: string } }) => void; children: React.ReactNode }>;
    assert.equal(select.props.value, current.id);
    assert.deepEqual(React.Children.toArray(select.props.children).map(option => (option as React.ReactElement<{ value: string }>).props.value), regions.map(region => region.id));
    select.props.onChange({ currentTarget: { value: current.id } });
    assert.equal(destinations.pop(), current.href);
    const html = renderToStaticMarkup(tree);
    assert.match(html, /<nav class="atlas-region-navigation" aria-label="3D anatomical regions">/);
    assert.match(html, /<label class="atlas-region-picker"><span>Region<\/span><select/);
    assert.equal((html.match(/<option/g) ?? []).length, 15);
    assert.ok(!html.includes('atlas-region-links'));
  }
});

test('planned imaging choices remain identified, while navigation stays modality scoped', () => {
  const regions = atlasRegionLinks('ct');
  const tree = AtlasRegionNavigation({ modality: 'ct', selected: 'head-neck' });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /CT anatomical regions/);
  assert.match(html, /Thorax · in preparation/);
  const select = (tree.props.children as React.ReactElement<{ children: React.ReactNode }>).props.children;
  const selectElement = React.Children.toArray(select).find(
    child => React.isValidElement(child) && child.type === 'select',
  ) as React.ReactElement<{ onChange: (event: { currentTarget: { value: string } }) => void }>;
  selectElement.props.onChange({ currentTarget: { value: 'thorax' } });
  assert.equal(destinations.pop(), regions.find(region => region.id === 'thorax')!.href);
  selectElement.props.onChange({ currentTarget: { value: 'not-a-region' } });
  assert.equal(destinations.length, 0, 'unknown values do not navigate');
});

test('every 3D wrapper has one persistent intended-use link; other Atlas pages keep the strip', () => {
  for (const region of atlasRegionLinks('3d')) {
    const route = new URL(region.href, 'https://atlas.invalid').pathname;
    const source = readFileSync(new URL(`../app${route}/page.tsx`, import.meta.url), 'utf8');
    assert.equal((source.match(/className="atlas-intended-use-link" href="\/intended-use"/g) ?? []).length, 1, route);
  }
  const { SiteFrame } = compile('components/SiteFrame.tsx', {
    'next/navigation': navigation,
    'next/link': ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement('a', props, children),
    './SiteHeader': { SiteHeader: () => null },
    './SiteFooter': { SiteFooter: () => null },
  }) as { SiteFrame: React.ComponentType<React.PropsWithChildren<{ signedIn: boolean }>> };
  pathname = '/atlas/3d';
  assert.ok(!renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: false }, 'body')).includes('class="intended-use-strip"'));
  pathname = '/atlas';
  assert.ok(renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: false }, 'body')).includes('class="intended-use-strip"'));
});

test('picker styling has no horizontal tab scroller', () => {
  const css = readFileSync(new URL('../app/atlas-navigation.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.atlas-region-picker select'));
  assert.ok(!css.includes('.atlas-region-links'));
  assert.ok(!css.includes('overflow-x:auto'));
  assert.match(css, /@media\(min-width:1200px\)/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 320px/);
  assert.match(css, /\.anatomy-site-frame \.shoulder-module-frame\{grid-column:1 \/ -1;grid-row:2/);
});
