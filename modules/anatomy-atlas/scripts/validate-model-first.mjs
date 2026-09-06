/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Explicit hook injection tests responsive panel state without a browser. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import ts from 'typescript';
import { dissectionProfiles } from '../app/dissection-data.ts';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
let checks = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const source = (await fs.readFile('app/body-explorer.tsx', 'utf8')).replace(
  /\r\n/g,
  '\n',
);
const printer = ts.createPrinter({ removeComments: true });
function bindings(text) {
  const ast = ts.createSourceFile(
    'body.tsx',
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const functions = {},
    callbacks = [];
  const canonical = (n) => printer.printNode(ts.EmitHint.Unspecified, n, ast);
  function visit(n) {
    if (ts.isFunctionDeclaration(n) && n.name && n.name.text !== 'BodyExplorer')
      functions[n.name.text] = hash(canonical(n));
    if (ts.isJsxAttribute(n) && /^on[A-Z]/.test(n.name.text) && n.initializer) {
      const value = canonical(n.initializer);
      // The old mobile region dropdown is replaced by the existing named links.
      if (!value.includes('window.location.assign'))
        callbacks.push(n.name.text + '/' + hash(value));
    }
    ts.forEachChild(n, visit);
  }
  visit(ast);
  return { functions, callbacks: callbacks.sort(compare) };
}
const baseCommit = '40e47408c40fe140e1a162a7fc011ce346d4be4f';
const baselinePath = 'content/model-first-baseline.json';
if (process.argv.includes('--record-baseline')) {
  const before = execFileSync(
    'git',
    ['show', baseCommit + ':app/body-explorer.tsx'],
    { maxBuffer: 2e6 },
  ).toString();
  const baseline = {
    sourceCommit: baseCommit,
    sourceSha256: hash(before),
    ...bindings(before),
  };
  const existing = await fs.readFile(baselinePath, 'utf8').catch(() => null);
  if (existing) same(JSON.parse(existing), baseline);
  await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
}
const baseline = JSON.parse(await fs.readFile(baselinePath));
same(
  hash(JSON.stringify(baseline)),
  '4311b7a578d31acb4af1d298fa3bdb71415739b91b4ca357d6216bfb75993ef1',
  'Pinned portable handler baseline',
);
same(baseline.sourceCommit, baseCommit);
same(
  bindings(source).functions,
  baseline.functions,
  'All named domain handlers preserved',
);
same(
  bindings(source).callbacks,
  baseline.callbacks,
  'All retained control callbacks preserved',
);
const raw = await fs.readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  ),
  catalog = JSON.parse(raw);
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(
  hash(JSON.stringify(dissectionProfiles)),
  'd127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c',
);
for (const b of catalog.bundles)
  same(
    hash(
      await fs.readFile('public/models/bodyparts3d/full-body/' + b.id + '.glb'),
    ),
    b.sha256,
  );

// Render the actual loaded explorer on the server. Only initial catalogue and
// selection data are injected; Next navigation and the GPU canvas are doubles.
const require = createRequire(import.meta.url),
  React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = await build({
  entryPoints: ['app/body-explorer.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: [
    'react',
    'react/*',
    'react-dom',
    'react-dom/*',
    'next/link',
    'next/dynamic',
    'next/image',
  ],
  loader: { '.css': 'empty' },
  plugins: [
    {
      name: 'loaded-explorer-fixture',
      setup(b) {
        b.onLoad({ filter: /body-explorer\.tsx$/ }, () => ({
          contents: source
            .replace(
              'useState<BodyCatalog | null>(null)',
              'useState<BodyCatalog | null>(globalThis.__atlasCatalog)',
            )
            .replace(
              'useState<string | null>(null),\n    [systems,',
              'useState<string | null>(globalThis.__atlasSelected),\n    [systems,',
            ),
          loader: 'tsx',
        }));
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents: 'export const BodyScene = () => null;',
          loader: 'tsx',
        }));
      },
    },
  ],
});
const vmModule = { exports: {} };
const context = {
  module: vmModule,
  exports: vmModule.exports,
  console,
  URLSearchParams,
  __atlasCatalog: catalog,
  __atlasSelected: null,
  process: { env: { NODE_ENV: 'test' } },
  require: (id) =>
    id === 'next/link'
      ? ({ children, href, prefetch: _prefetch, ...props }) =>
          React.createElement('a', { ...props, href }, children)
      : id === 'next/dynamic'
        ? () => () => React.createElement('div', { 'data-scene-double': true })
        : id === 'next/image'
          ? ({
              priority: _priority,
              unoptimized: _unoptimized,
              fill: _fill,
              ...props
            }) => React.createElement('img', props)
          : require(id),
};
runInNewContext(compiled.outputFiles[0].text, context);
let markupCases = 0;
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
  const items = catalog.structures.filter(
    (s) => region === 'whole-body' || s.regions.includes(region),
  );
  for (const selected of [null, items[0].id]) {
    context.__atlasSelected = selected;
    const html = renderToStaticMarkup(
      React.createElement(vmModule.exports.default, { initialRegion: region }),
    );
    const railStart = html.indexOf(
      '<aside class="body-rail anatomy-control-rail"',
    );
    const modelStart = html.indexOf('<section class="body-workspace"');
    const infoStart = html.indexOf('<aside class="body-info"');
    check(railStart >= 0 && railStart < modelStart && modelStart < infoStart);
    const rail = html.slice(railStart, modelStart),
      model = html.slice(modelStart, infoStart),
      info = html.slice(infoStart);
    same(
      (rail.match(/role="switch"/g) ?? []).length,
      9,
      'Six system switches, ghost context, plate view and cutaway',
    );
    for (const feature of [
      'Anatomical systems',
      'Guided dissection controls',
      'Quick anatomy views',
      'Model arrangement',
      'Saved study views',
      'Imaging link',
    ])
      check(rail.includes(feature), feature + ' stays in the control rail');
    for (const feature of [
      'body-system-bar',
      'dissection-deck',
      'body-layout-controls',
      'body-preset-row',
      'vm-inspection',
      'vm-study-views',
    ])
      check(!model.includes(feature), feature + ' no longer pushes model down');
    check(model.includes('data-scene-double'));
    check(model.includes('Exploded separation'));
    check(model.includes('CC BY 4.0'));
    check(model.includes('REVIEW PENDING'));
    for (const className of [
      'body-region-picker',
      'body-study-tools',
      'body-display-tools',
    ])
      check(
        rail.includes(`<details class="${className}">`),
        className + ' starts closed',
      );
    check(
      info.indexOf('FIND A STRUCTURE') < info.indexOf('vm-practice-options'),
    );
    check(info.includes('<details class="dissection-guide-fold">'));
    check(info.includes('<details class="body-structure-browser">'));
    check(!info.includes('body-summary-grid'));
    if (selected) {
      check(
        info.includes(renderToStaticMarkup(items[0].name)),
        region + ' selection rendered',
      );
      check(
        info.indexOf('body-content-tabs') >= 0 &&
          info.indexOf('body-content-tabs') <
            info.indexOf('class="related-study'),
        region + ' selected notes before related study',
      );
    }
    markupCases++;
  }
}

// Exercise the real responsive component's state and effect callbacks. The Sheet
// primitive provides focus trapping/Escape; actual browser acceptance is separate.
let injected = false,
  values,
  stateIndex,
  effect,
  listener,
  removed = 0,
  media;
const shim = {
  ...React,
  useState: (initial) => {
    if (!injected) return React.useState(initial);
    const i = stateIndex++;
    return [
      values[i] ?? initial,
      (next) => {
        values[i] = typeof next === 'function' ? next(values[i]) : next;
      },
    ];
  },
  useEffect: (fn, deps) =>
    injected ? (effect = fn) : React.useEffect(fn, deps),
};
const panelBuild = await build({
  entryPoints: ['app/anatomy-control-rail.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
  loader: { '.css': 'empty' },
});
const panelModule = { exports: {} };
runInNewContext(panelBuild.outputFiles[0].text, {
  module: panelModule,
  exports: panelModule.exports,
  console,
  process: { env: { NODE_ENV: 'test' } },
  window: {
    matchMedia: (query) => {
      same(query, media.query);
      return media;
    },
  },
  require: (id) => (id === 'react' ? shim : require(id)),
});
const walk = (node, test, found = []) => {
  if (React.isValidElement(node)) {
    if (test(node)) found.push(node);
    React.Children.forEach(node.props.children, (c) => walk(c, test, found));
  }
  return found;
};
let panelCases = 0;
for (const info of [false, true])
  for (const practice of [false, true]) {
    values = [false, false];
    stateIndex = 0;
    injected = true;
    media = {
      query: info ? '(max-width: 700px)' : '(max-width: 1100px)',
      matches: false,
      addEventListener: (name, fn) => {
        same(name, 'change');
        listener = fn;
      },
      removeEventListener: (name, fn) => {
        same(name, 'change');
        same(fn, listener);
        removed++;
      },
    };
    const child = React.createElement('input', { defaultValue: 'local draft' });
    const wrapper = info
      ? panelModule.exports.AnatomyInfoPanel({ children: child, practice })
      : panelModule.exports.AnatomyControlRail({ children: child });
    const render = () => {
      stateIndex = 0;
      return wrapper.type(wrapper.props);
    };
    same(render().type, 'aside');
    const cleanup = effect();
    media.matches = true;
    listener();
    same(values, [true, false]);
    let tree = render();
    same(tree.props.open, false);
    tree.props.onOpenChange(true);
    tree = render();
    same(tree.props.open, true);
    same(walk(tree, (n) => n.props.keepMounted === true).length, 1);
    same(walk(tree, (n) => n === child).length, 1, 'Single controls instance');
    same(
      walk(tree, (n) => n.props['data-side'] === (info ? 'right' : 'left'))
        .length,
      1,
    );
    tree.props.onOpenChange(false);
    same(render().props.open, false);
    same(
      walk(render(), (n) => n === child).length,
      1,
      'Closing retains child element',
    );
    values[1] = true;
    media.matches = false;
    listener();
    same(values, [false, false]);
    same(render().type, 'aside');
    cleanup();
    injected = false;
    panelCases++;
  }
same(removed, 4);
const css = await fs.readFile('app/body-explorer.css', 'utf8');
for (const snippet of [
  "'controls model info'",
  "'controls-launcher info-launcher' 'model model'",
  'grid-template-columns: minmax(0, 1fr);',
  '.anatomy-controls-popup[data-closed]',
  '@media (max-height: 580px)',
])
  check(css.includes(snippet));
// Resolve exact-class declarations through media rules and source order. This is
// a bounded cascade test, not a browser layout engine or pixel measurement.
const stylesheet = require('postcss').parse(css);
const dimensions = [
  [1600, 1000],
  [1200, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [320, 568],
  [844, 390],
];
function declarations(selector, width, height) {
  const values = {};
  stylesheet.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type !== 'atrule') continue;
      if (parent.name !== 'media') return;
      const condition = /^\((min|max)-(width|height): (\d+)px\)$/.exec(
        parent.params,
      );
      if (!condition) return;
      const size = condition[2] === 'width' ? width : height;
      if (
        condition[1] === 'max'
          ? size > Number(condition[3])
          : size < Number(condition[3])
      )
        return;
    }
    rule.walkDecls((declaration) => {
      values[declaration.prop] = declaration.value;
    });
  });
  return values;
}
for (const [width, height] of dimensions) {
  const app = declarations('.body-app', width, height),
    layout = declarations('.body-layout', width, height);
  same(app.display, 'flex');
  same(app['flex-direction'], 'column');
  same(app.height, '100dvh');
  same(app['min-height'], '0');
  same(layout.display, 'grid');
  same(layout.height, 'auto');
  same(layout['min-height'], '0');
  same(layout.overflow, 'hidden');
  same(
    layout['grid-template-areas'],
    width <= 700
      ? "'controls-launcher info-launcher' 'model model'"
      : width <= 1100
        ? "'controls-launcher info' 'model info'"
        : "'controls model info'",
  );
  same(declarations('.body-workspace', width, height)['min-height'], '0');
  const canvas = declarations('.body-canvas', width, height);
  same(canvas.height, 'auto');
  same(canvas.flex, height <= 580 ? '1 0 300px' : '1 1 0');
  same(canvas['min-height'], width <= 700 ? '280px' : '300px');
}
const result = {
  passed: true,
  checks,
  markupCases,
  panelCases,
  stylesheetViewportCases: dimensions.length,
  preservedNamedHandlers: Object.keys(baseline.functions).length,
  preservedControlCallbacks: baseline.callbacks.length,
  regions: 11,
  wholeBody: true,
  sourceGeometryChanged: false,
  catalogSha256: hash(raw),
  clinicalValidation: false,
  browserInteractionTesting: false,
  limitations:
    'Actual loaded explorer server markup with catalogue/selection fixtures and a GPU double; injected responsive hooks; source-handler preservation and stylesheet assertions. No pixel layout, browser focus/Escape, touch, zoom or scroll measurements are claimed.',
};
await fs.writeFile(
  'docs/model-first-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
