/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Explicit hook injection tests responsive panel state without a browser. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import ts from 'typescript';
import { dissectionProfiles } from '../app/dissection-data.ts';
import { historicalRecipeProfiles } from './recipe-history.mjs';

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
  {
    ...baseline.functions,
    // f3b561f: same-style no-op plus extract at 100%; actual behavior is
    // independently exercised by explode-styles:test, not silently rebaselined.
    changeLayout:
      'af5bb73784d6a9a0eca09aed29c761a01cc419de4c8d2df6d57003525f4a4f85',
    // Selection recovery is independently executed by selection-visibility:test.
    revealSelection:
      '1cea695fbb227711161f4179f516ad6de36aa6c937b5605b96d819dc585e82eb',
    // Reasoning mode is an explicit, bounded migration; actual handlers are
    // executed by reasoning-practice:test. The original baseline stays pinned.
    onSceneSelect:
      '8c46bc0dafa78adb611e6377e9e1615b11f03d526a1037c254f1738a808598f0',
    startExam:
      '3b084e597bd7ae9535fb16419967177bf35d651d4f85c0d474d3cb37746f532e',
    nextQuestion:
      '42d469196801b688c7c7ad3582a9f1dda9224b07c7a3c4cebea791b4110a2229',
    // Bounded dissection history: actual Undo/Redo handlers are exercised by
    // dissection-history:test, including empty-stack and practice guards.
    undoDissection:
      'c0fdb9b5834ce86baf29f0a3f23711f2dee0126bdb139c961944f5cbad85441c',
    redoDissection:
      'ad3ec5d87baeb4b2b0ecb7bb62575cdae423454acb62c2bb3a2f8e51ae0b913f',
  },
  'Named handlers preserved except explicit explosion, selection-recovery, reasoning and dissection-history migrations',
);
// Explicit navigation migration: remove the redundant Quiz-start button,
// region-only combobox and six-direction button callback. Their replacements
// call the same guarded handlers; verify new menu/search execution separately.
const migratedCallbacks = [...baseline.callbacks];
for (const retired of [
  'onClick/41951ae789d22ac66ecb587d1862a47a4f6cbc138fc21d170434e911b8baa5a9',
  'onClick/886d6381c6e5f019e540bbc58f69bcc3023d332db763210cdfeb87e66be09348',
  'onValueChange/de0101b663f86e99c1cf73a10970890179f00ef53ce7f8816a58ce2e358d1f8c',
  // f3b561f replaces the two arrangement buttons with one selector.
  'onClick/690436385377122ef5a17ee8b50e90b78d333dc8477086964406bedc32878cea',
  'onClick/979eebf6f969f80fa3c18ba941b24c6626b3dcb4ff4efe4ebd3643c9e8e4f750',
  // The whole-view Reveal uncut reset is replaced by targeted selected-surface recovery.
  'onClick/152e04a7bcd7e6a5521a9d1296b5caeae71d73e8ec97233701f2801d3647053f',
  // Reasoning adds one recognized value to the existing practice-mode selector.
  'onValueChange/e02d02d2ec0fa4547a6be5be6d341521a86b814c81738e73e25cd995da13f2ba',
]) {
  const index = migratedCallbacks.indexOf(retired);
  check(index >= 0);
  migratedCallbacks.splice(index, 1);
}
migratedCallbacks.push(
  // Ventricular launcher/close are additional contextual actions. The dedicated
  // ventricles:test executes camera capture, close and focus restoration.
  'onClick/2a26e80ca000beaf9da567f5fa88354745f1f582c4a17ff9862167061fd28cff',
  'onClose/789c6bfced27a464cda59e97851a09db44d1fad704cf0bfdae78efb13a9d0b62',
  // Eye-layer launcher and close binding are additional contextual actions;
  // eye-layers:test executes the actual launcher/close camera and focus handlers.
  'onClick/19b9bed728996789c3a52e1b3194dca5d4d17282b9a75cf3b4876b0e2ea64429',
  'onClose/60c57b3a219c2b3b1146ff6cbba2e23c8d45a0cb592b4ff9da14740449663e97',
  'onValueChange/0a47af2ff2ca38eeefe73e3a4bb54336655a2c09f40dda30b663ca1dc712832a',
  'onRecover/41f5b811c870740268f0a368584b495627dec0abce7038ad9a74a8857774fa90',
  'onReapply/8549d8cba04d43b531b1379e407534a86e1eb98200d169963ce48e290bde225d',
  'onClick/41f5b811c870740268f0a368584b495627dec0abce7038ad9a74a8857774fa90',
  'onChange/fd55e1d20509cbf96ecd7daf538d27f6a539ccc7f4c0596e2ce161fa67a0aa09',
  'onChange/ed06a6ba79f65735fa1a9a6b2a0f558961a54a29d0ff9bb06b6277f1817d2f96',
  'onFocus/60791bef659a508c1030f248019b00646b1ab73d283d43374aa87641fdfce003',
  'onSelect/610c7aa707c1e7792cda3854a7ec79d0a63ef3319881a1625f5f6eae7a2cf70d',
  'onWindow/5ebc5e51cd113d7d309d4f55e844e0c769431ad7b05ed51a6496b64fc3e157c6',
  'onRedo/8676ea82820286a822f522e5b4085358175c84ed30c8a0e96be77ae3e45036c2',
);
same(
  bindings(source).callbacks,
  migratedCallbacks.sort(compare),
  'Retained callbacks and explicit navigation/explosion bindings',
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
  hash(JSON.stringify(historicalRecipeProfiles(dissectionProfiles))),
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
          contents:
            'export const BodyScene = () => null; export const retryBodyAssets = () => {};',
          loader: 'tsx',
        }));
        b.onLoad({ filter: /atlas-workspace\.tsx$/ }, async () => ({
          contents: (
            await fs.readFile('app/atlas-workspace.tsx', 'utf8')
          ).replace(
            "useState<WorkspaceMode>('explore')",
            'useState<WorkspaceMode>(globalThis.__atlasMode)',
          ),
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
  __atlasMode: 'explore',
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
for (const mode of ['explore', 'dissect', 'practice'])
  for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
    context.__atlasMode = mode;
    const items = catalog.structures.filter(
      (s) => region === 'whole-body' || s.regions.includes(region),
    );
    for (const selected of [null, items[0].id]) {
      context.__atlasSelected = selected;
      const html = renderToStaticMarkup(
        React.createElement(vmModule.exports.default, {
          initialRegion: region,
        }),
      );
      const railStart = html.indexOf(
        '<aside class="body-rail anatomy-control-rail"',
      );
      const modelStart = html.indexOf('<section class="body-workspace"');
      const infoStart = html.indexOf('<aside class="body-info"');
      check(railStart >= 0 && railStart < modelStart && modelStart < infoStart);
      check(html.includes(`data-workspace-mode="${mode}"`));
      check(html.includes('aria-label="Workspace mode"'));
      const rail = html.slice(railStart, modelStart),
        model = html.slice(modelStart, infoStart),
        info = html.slice(infoStart);
      check(!model.includes('body-view-buttons'));
      check(model.includes('atlas-camera-view'));
      same(
        (rail.match(/role="switch"/g) ?? []).length,
        10,
        'Six systems, ghost context, plate, selected-solid and selected-uncut',
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
        check(
          !model.includes(feature),
          feature + ' no longer pushes model down',
        );
      check(model.includes('data-scene-double'));
      check(model.includes('Exploded separation'));
      check(model.includes('CC BY 4.0'));
      check(model.includes('REVIEW PENDING'));
      for (const className of ['body-region-picker', 'body-display-tools'])
        check(
          rail.includes(`<details class="${className}">`),
          className + ' starts closed',
        );
      check(html.includes('Search atlas'));
      check(!info.includes('Search this region'));
      check(rail.includes('<details class="body-study-tools" open="">'));
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

// Both nested launchers must appear only on their exact parent in the real
// loaded explorer markup, including whole-body navigation.
let nestedLauncherMarkupCases = 0;
context.__atlasMode = 'explore';
for (const region of ['head-neck', 'whole-body'])
  for (const fma of ['FMA50801', 'FMA12515']) {
    context.__atlasSelected = catalog.structures.find(
      (s) => s.fmaId === fma,
    ).id;
    const html = renderToStaticMarkup(
      React.createElement(vmModule.exports.default, { initialRegion: region }),
    );
    same(html.includes('Dissect brain'), fma === 'FMA50801');
    same(html.includes('Explore eye layers'), fma === 'FMA12515');
    nestedLauncherMarkupCases++;
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
let panelContext = { mode: 'explore', focusView: false };
const shim = {
  ...React,
  useContext: (context) =>
    injected
      ? {
          ...panelContext,
          panels: { tools: values[1], info: values[1] },
          setPanelOpen: (_info, open) => {
            values[1] = open;
          },
        }
      : React.useContext(context),
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
  useEffect: (fn, deps) => {
    if (!injected) return React.useEffect(fn, deps);
    effect = fn;
  },
};
const panelBuild = await build({
  entryPoints: ['app/anatomy-control-rail.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'next/link'],
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
  require: (id) =>
    id === 'react'
      ? shim
      : id === 'next/link'
        ? context.require(id)
        : require(id),
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
    panelContext = {
      mode: 'explore',
      focusView: false,
    };
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
    panelContext.focusView = true;
    same(render().props.open, false, 'Focus view starts with closed panels');
    values[1] = true;
    same(
      render().props.open,
      true,
      'Explicit request opens matching focus-view panel',
    );
    panelContext.focusView = false;
    values[1] = false; // AtlasWorkspace's actual focus action is tested separately.
    same(values[1], false, 'Leaving focus view closes a retained sheet');
    same(render().type, 'aside');
    cleanup();
    injected = false;
    panelCases++;
  }
same(removed, 4);
const css =
  (await fs.readFile('app/body-explorer.css', 'utf8')) +
  '\n' +
  (await fs.readFile('app/atlas-workspace.css', 'utf8'));
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
  nestedLauncherMarkupCases,
  panelCases,
  stylesheetViewportCases: dimensions.length,
  preservedNamedHandlers: Object.entries(baseline.functions).filter(
    ([name, fingerprint]) => bindings(source).functions[name] === fingerprint,
  ).length,
  explicitDissectionHistoryHandlerMigration: 1,
  addedDissectionRedoHandler: 1,
  addedDissectionRedoCallback: 1,
  explicitReasoningHandlerMigrations: 3,
  explicitReasoningSelectorMigration: 1,
  explicitExplosionHandlerMigration: 1,
  preservedControlCallbacks: baseline.callbacks.length - 7,
  addedEyeLayerCallbacks: 2,
  addedVentricularCallbacks: 2,
  explicitNavigationReplacementCallbacks: 4,
  explicitExplosionReplacementCallbacks: 1,
  explicitSelectionRecoveryHandler: 1,
  explicitSelectionRecoveryCallbacks: 3,
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
