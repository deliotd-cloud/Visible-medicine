import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { atlasRegionLinks } from '../lib/atlas-navigation.ts';
import type { AtlasModalityId } from '../lib/atlas-navigation.ts';

const require = createRequire(import.meta.url);
let pathname = '/atlas/3d';
const destinations: string[] = [];
const documentDestinations: string[] = [];
let pageHref = '/atlas/3d';
const pageShowListeners = new Set<() => void>();
const pendingRestores = new Map<number, () => void>();
let restoreSequence = 0;
function flushRestores() {
  const callbacks = [...pendingRestores.values()];
  pendingRestores.clear();
  for (const callback of callbacks) callback();
}
const browserWindow = {
  setTimeout: (callback: () => void, delay: number) => {
    assert.equal(delay, 0, 'restoration is deferred beyond native history dispatch');
    pendingRestores.set(++restoreSequence, callback);
    return restoreSequence;
  },
  clearTimeout: (id: number) => { pendingRestores.delete(id); },
  location: {
    get pathname() { return new URL(pageHref, 'https://atlas.invalid').pathname; },
    get search() { return new URL(pageHref, 'https://atlas.invalid').search; },
    assign: (destination: string) => documentDestinations.push(destination),
  },
  addEventListener: (name: string, listener: () => void) => {
    if (name === 'pageshow') pageShowListeners.add(listener);
  },
  removeEventListener: (name: string, listener: () => void) => {
    if (name === 'pageshow') pageShowListeners.delete(listener);
  },
};
type SelectNode = { value: string };
let mountedHooks: {
  ref: { current: SelectNode | null };
  dependencies?: readonly unknown[];
  cleanup?: () => void;
  pending?: () => (() => void) | undefined;
} | null = null;
const reactHooks = {
  ...React,
  useRef: () => mountedHooks?.ref ?? { current: null },
  useEffect: (effect: () => (() => void) | undefined, dependencies: readonly unknown[]) => {
    const hooks = mountedHooks;
    if (!hooks) return;
    if (hooks.dependencies?.length === dependencies.length &&
        hooks.dependencies.every((value, index) => Object.is(value, dependencies[index]))) return;
    hooks.cleanup?.();
    hooks.cleanup = undefined;
    hooks.dependencies = dependencies;
    hooks.pending = effect;
  },
};

function compile(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const loaded = { exports: {} as Record<string, unknown> };
  new Function('require', 'module', 'exports', 'window', code)(
    (name: string) => name in mocks ? mocks[name] : require(name), loaded, loaded.exports,
    browserWindow,
  );
  return loaded.exports;
}

const navigation = {
  usePathname: () => pathname,
  useRouter: () => ({ push: (destination: string) => destinations.push(destination) }),
};
const { AtlasRegionNavigation } = compile('components/AtlasRegionNavigation.tsx', {
  react: reactHooks,
  'next/navigation': navigation,
  '../lib/atlas-navigation': require('../lib/atlas-navigation.ts'),
}) as { AtlasRegionNavigation: (props: { modality: AtlasModalityId; selected: string }) => React.ReactElement<{ children: React.ReactNode }> };

type SubmitEvent = { preventDefault: () => void; currentTarget: { elements: { namedItem: (name: string) => { value: string } | null } } };
type RegionForm = React.ReactElement<{ children: React.ReactNode; onSubmit: (event: SubmitEvent) => void }>;
type RegionSelect = React.ReactElement<{ ref: { current: SelectNode | null }; name: string; defaultValue: string; onChange?: unknown; children: React.ReactNode }>;
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

function renderMountedPicker(modality: AtlasModalityId, selected: string, existingNode?: SelectNode) {
  assert(mountedHooks);
  const tree = AtlasRegionNavigation({ modality, selected });
  const parts = picker(tree);
  const node = existingNode ?? { value: selected };
  parts.select.props.ref.current = node;
  const pending = mountedHooks.pending;
  mountedHooks.pending = undefined;
  if (pending) mountedHooks.cleanup = pending();
  return { ...parts, node };
}

test('pageshow restores current route choice without clearing ordinary pending selection', () => {
  assert.equal(pageShowListeners.size, 0);
  mountedHooks = { ref: { current: null } };
  pageHref = '/atlas/3d';
  try {
    const wholeBody = renderMountedPicker('3d', 'whole-body', { value: 'head-neck' });
    assert.equal(pageShowListeners.size, 1);
    assert.equal(wholeBody.node.value, 'whole-body', 'initial history-restored form value is corrected even if pageshow fired before subscription');
    wholeBody.node.value = 'head-neck';
    flushRestores();
    assert.equal(wholeBody.node.value, 'whole-body', 'native state restored after mount is corrected on the next task');
    wholeBody.node.value = 'head-neck';
    renderMountedPicker('3d', 'whole-body', wholeBody.node);
    assert.equal(wholeBody.node.value, 'head-neck', 'ordinary rerender does not reset user choice');
    const restoredNode = mountedHooks.ref.current!;
    restoredNode.value = 'head-neck';
    const oldListener = [...pageShowListeners][0];
    pageHref = '/atlas/head-neck-3d';
    oldListener();
    flushRestores();
    assert.equal(restoredNode.value, 'head-neck', 'old route does not overwrite another route');
    pageHref = '/atlas/3d';
    oldListener();
    assert.equal(restoredNode.value, 'whole-body', 'Back restores the current route choice');
    restoredNode.value = 'head-neck';
    flushRestores();
    assert.equal(restoredNode.value, 'whole-body', 'native values restored after pageshow do not overwrite the route reset');
    oldListener();
    assert.equal(pendingRestores.size, 1);
    const staleRestore = [...pendingRestores.values()][0];

    pageHref = '/atlas/head-neck-3d';
    const head = renderMountedPicker('3d', 'head-neck');
    assert.equal(pageShowListeners.size, 1, 'scope change removes the old listener');
    assert.equal(pendingRestores.size, 1, 'scope change cancels the old queued restore before scheduling the new one');
    flushRestores();
    head.node.value = 'spine';
    oldListener();
    staleRestore();
    assert.equal(head.node.value, 'spine', 'stale listener cannot change a new scope');
    [...pageShowListeners][0]();
    assert.equal(head.node.value, 'head-neck', 'head route is restored after document load');
    head.node.value = 'spine';
    pageHref = '/atlas/3d';
    flushRestores();
    assert.equal(head.node.value, 'spine', 'queued work rechecks ownership after navigation');

    pageHref = '/atlas/3d?region=shoulder-arm';
    const shoulder = renderMountedPicker('3d', 'shoulder-arm');
    shoulder.node.value = 'head-neck';
    [...pageShowListeners][0]();
    assert.equal(shoulder.node.value, 'shoulder-arm', 'query-scoped route is matched exactly');
    flushRestores();
    shoulder.node.value = 'spine';
    pageHref = '/atlas/3d?region=forearm';
    [...pageShowListeners][0]();
    assert.equal(shoulder.node.value, 'spine', 'another query scope cannot reset the picker');
  } finally {
    const stale = [...pageShowListeners][0];
    const node = mountedHooks.ref.current;
    const staleRestore = [...pendingRestores.values()][0];
    mountedHooks.cleanup?.();
    assert.equal(pageShowListeners.size, 0, 'unmount removes the listener');
    assert.equal(pendingRestores.size, 0, 'unmount cancels queued work');
    if (node && stale) {
      node.value = 'spine';
      stale();
      staleRestore?.();
      assert.equal(node.value, 'spine', 'unmounted listener is inert');
      assert.equal(pendingRestores.size, 0, 'unmounted callbacks cannot queue new work');
    }
    mountedHooks = null;
    pageHref = '/atlas/3d';
  }
});

test('native region picker keeps every ordered 3D destination and navigates only after submit', () => {
  destinations.length = 0;
  documentDestinations.length = 0;
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
    assert.equal(documentDestinations.length, 0);
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
    if (destination.id === 'head-neck') {
      assert.equal(documentDestinations.pop(), destination.href);
      assert.equal(destinations.length, 0, 'head entry does not use the client router');
    } else {
      assert.equal(destinations.pop(), destination.href);
      assert.equal(documentDestinations.length, 0, 'other destinations retain client navigation');
    }
  }
  const next = picker(AtlasRegionNavigation({ modality: '3d', selected: regions[1].id })).form;
  submit(next, regions[0].id);
  assert.equal(destinations.pop(), regions[0].href);
  submit(start, regions[0].id);
  submit(start, 'not-a-region');
  submit(start, null);
  assert.equal(destinations.length, 0, 'same, unknown and missing selections do not navigate');
  assert.equal(documentDestinations.length, 0);
});

test('only explicit valid3D head submission crosses the document boundary', () => {
  destinations.length = 0;
  documentDestinations.length = 0;
  for (const current of atlasRegionLinks('3d').filter(region => region.id !== 'head-neck')) {
    const { form, select } = picker(AtlasRegionNavigation({ modality: '3d', selected: current.id }));
    assert.equal(select.props.onChange, undefined);
    submit(form, 'head-neck');
    assert.deepEqual(documentDestinations.splice(0), ['/atlas/head-neck-3d']);
    assert.equal(destinations.length, 0);
  }
  const same = picker(AtlasRegionNavigation({ modality: '3d', selected: 'head-neck' })).form;
  for (const value of ['head-neck', 'https://foreign.invalid', '//foreign.invalid', '/atlas/head-neck-3d', 'head-neck?unexpected=true', null]) submit(same, value);
  assert.equal(documentDestinations.length, 0);
  assert.equal(destinations.length, 0);
  for (const modality of ['ct', 'mri', 'ultrasound', 'x-ray'] as const) {
    const form = picker(AtlasRegionNavigation({ modality, selected: 'thorax' })).form;
    submit(form, 'head-neck');
    assert.equal(destinations.pop(), atlasRegionLinks(modality).find(region => region.id === 'head-neck')!.href);
    assert.equal(documentDestinations.length, 0, 'imaging routes retain their own navigation');
  }
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
