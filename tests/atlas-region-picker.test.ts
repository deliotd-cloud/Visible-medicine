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
}) as { AtlasRegionNavigation: (props: { modality: '3d' | 'ct'; selected: string }) => React.ReactElement<{ children: React.ReactNode }> };

type SubmitEvent = { preventDefault: () => void; currentTarget: { elements: { namedItem: (name: string) => { value: string } | null } } };
type RegionForm = React.ReactElement<{ children: React.ReactNode; onSubmit: (event: SubmitEvent) => void }>;
type RegionSelect = React.ReactElement<{ name: string; defaultValue: string; onChange?: unknown; children: React.ReactNode }>;
function picker(tree: ReturnType<typeof AtlasRegionNavigation>) {
  const form = tree.props.children as RegionForm;
  assert.equal(form.type, 'form');
  const children = React.Children.toArray(form.props.children);
  const label = children.find(child => React.isValidElement(child) && child.type === 'label') as React.ReactElement<{ children: React.ReactNode }>;
  const button = children.find(child => React.isValidElement(child) && child.type === 'button') as React.ReactElement<{ type: string; children: React.ReactNode }>;
  assert(label && button);
  const select = React.Children.toArray(label.props.children).find(
    child => React.isValidElement(child) && child.type === 'select',
  ) as RegionSelect;
  assert(select);
  return { form, label, select, button };
}
function submit(form: RegionForm, value: string | null) {
  let prevented = false;
  form.props.onSubmit({
    preventDefault: () => { prevented = true; },
    currentTarget: { elements: { namedItem: name => {
      assert.equal(name, 'atlas-region');
      return value === null ? null : { value };
    } } },
  });
  assert.equal(prevented, true);
}

test('native region picker keeps every ordered 3D destination and navigates only after submit', () => {
  destinations.length = 0;
  const regions = atlasRegionLinks('3d');
  assert.equal(regions[0].id, 'whole-body');
  assert.equal(regions.length, 15);
  for (const current of regions) {
    const tree = AtlasRegionNavigation({ modality: '3d', selected: current.id });
    const { form, select, button } = picker(tree);
    assert.equal(form.key, `3d:${current.id}`);
    assert.equal(select.props.name, 'atlas-region');
    assert.equal(select.props.defaultValue, current.id);
    assert.equal(select.props.onChange, undefined, 'selection alone does not navigate');
    assert.deepEqual(React.Children.toArray(select.props.children).map(option => (option as React.ReactElement<{ value: string }>).props.value), regions.map(region => region.id));
    assert.equal(button.props.type, 'submit');
    assert.equal(button.props.children, 'Go');
    assert.equal(destinations.length, 0);
    const html = renderToStaticMarkup(tree);
    assert.match(html, /<nav class="atlas-region-navigation" aria-label="3D anatomical regions">/);
    assert.match(html, /<form class="atlas-region-form"><label class="atlas-region-picker"><span>Region<\/span><select/);
    assert.match(html, /<button class="atlas-region-open" type="submit" aria-label="Open selected anatomical region">Go<\/button><\/form>/);
    assert.equal((html.match(/<option/g) ?? []).length, 15);
    assert.ok(!html.includes('atlas-region-links'));
  }
  const start = picker(AtlasRegionNavigation({ modality: '3d', selected: regions[0].id })).form;
  for (const destination of regions.slice(1)) {
    submit(start, destination.id);
    assert.equal(destinations.pop(), destination.href);
  }
  const next = picker(AtlasRegionNavigation({ modality: '3d', selected: regions[1].id })).form;
  submit(next, regions[0].id);
  assert.equal(destinations.pop(), regions[0].href);
  submit(start, regions[0].id);
  submit(start, 'not-a-region');
  submit(start, null);
  assert.equal(destinations.length, 0, 'same, unknown and missing selections do not navigate');
});

test('planned imaging choices remain identified, while navigation stays modality scoped', () => {
  destinations.length = 0;
  const regions = atlasRegionLinks('ct');
  const tree = AtlasRegionNavigation({ modality: 'ct', selected: 'head-neck' });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /CT anatomical regions/);
  assert.match(html, /Thorax · in preparation/);
  const { form, select } = picker(tree);
  assert.equal(form.key, 'ct:head-neck');
  assert.equal(select.props.defaultValue, 'head-neck');
  assert.equal(select.props.onChange, undefined);
  submit(form, 'thorax');
  assert.equal(destinations.pop(), regions.find(region => region.id === 'thorax')!.href);
  submit(form, 'shoulder-arm');
  assert.equal(destinations.length, 0, 'a 3D-only region cannot cross modality scope');
  for (const destination of regions.filter(region => region.id !== 'head-neck' && region.id !== 'thorax')) {
    submit(form, destination.id);
    assert.equal(destinations.pop(), destination.href);
  }
  const thoraxForm = picker(AtlasRegionNavigation({ modality: 'ct', selected: 'thorax' })).form;
  submit(thoraxForm, 'head-neck');
  assert.equal(destinations.pop(), regions.find(region => region.id === 'head-neck')!.href);
  assert.notEqual(form.key, thoraxForm.key,
    'route-selected region rekeys the uncontrolled form');
  assert.notEqual(form.key, picker(AtlasRegionNavigation({ modality: '3d', selected: 'head-neck' })).form.key,
    'modality change rekeys the uncontrolled form');
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
    './workspace-navigation.css': {},
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
