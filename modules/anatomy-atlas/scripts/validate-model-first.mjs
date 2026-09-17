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
import {
  modelFirstCallbackMigrations,
  modelFirstHandlerMigrations,
} from './model-first-migrations.mjs';

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
for (const [name, migration] of Object.entries(modelFirstHandlerMigrations)) {
  check(/^[a-f0-9]{64}$/.test(migration.sha256), `${name} exact SHA-256 pin`);
  check(migration.commits.length > 0, `${name} migration provenance`);
  check(migration.evidence.length > 0, `${name} executable evidence`);
}
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
    // 12bf83e also pauses Next when required geometry is unavailable;
    // renderer:test executes both ready and paused cases.
    nextQuestion:
      '5191a6319312a6f35511bc198ca3a8562e47356c01cc407a46f702dbe769e6e6',
    // Source-bound study transitions clear pending camera restoration and reject
    // invalid/source-changed recipes. limb-vascular-studies:test executes all
    // three handlers; limbic-landmarks:test covers the current source guard.
    changeStage:
      'fb9a7f674da920c75b726868d4fe994cb7bc77fdff0c4891f94f9ec4bc138cdd',
    changeFocus:
      'b39d4aac46b371a7092cd176d85be01ad20151eb56f2dfc4fa5d8e0dce73b8ff',
    openRelatedStudy:
      'bbefb9f74080439dc8d039d7a5c7f93e955b2918dc1c17f1747c149ddb929c57',
    // Separate source-bound relationship actions, not replacement anatomy or
    // imaging events. Their motor/arterial/venous suites execute actual handlers.
    exploreMotorGroup:
      '324e2f60c0f0b05577b2816d667ac3c87fbe4d37fa8253e65cddf109e9e68090',
    showArterialConnections:
      '39da3ffefc1ee1224d6ae555293d61ac5e08c36907634de0574338723d1ab336',
    showVenousDrainage:
      '8137daefccbe17cb9e054def68be59c6cc5ec5e35a1002d30dbf22605de47cd2',
    // Existing hand/foot partner action is executed by hand-joints:test and
    // foot-joints:test; vessel-visibility:test executes the new scoped action.
    showJointPartners:
      '7bb95249076a04558f7ee3aa5aa223179979c194676f8a57efea3ced6ef88edf',
    // Bounded dissection history: actual Undo/Redo handlers are exercised by
    // dissection-history:test, including empty-stack and practice guards.
    undoDissection:
      'c0fdb9b5834ce86baf29f0a3f23711f2dee0126bdb139c961944f5cbad85441c',
    redoDissection:
      'ad3ec5d87baeb4b2b0ecb7bb62575cdae423454acb62c2bb3a2f8e51ae0b913f',
    ...Object.fromEntries(
      Object.entries(modelFirstHandlerMigrations).map(([name, migration]) => [
        name,
        migration.sha256,
      ]),
    ),
  },
  'Named handlers preserved except explicit documented functional migrations',
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
  // Slider primitive now accepts either a number or array; test both below.
  'onValueChange/5c7fe06f7313ada67c21df2ed3c759b1c6e98d94f6951f412b4b2f27d07a3ccb',
]) {
  const index = migratedCallbacks.indexOf(retired);
  check(index >= 0);
  migratedCallbacks.splice(index, 1);
}
migratedCallbacks.push(
  // Explicit compact vessel control and existing joint navigator additions.
  // These suites execute the actual components/handlers, not only these hashes.
  'onEnabled/61561ba3764844c4042219fbae20e9358d4bf57b393d21f3c0176f148a061cec',
  'onVisibility/f687fb19d10639c286081bba6d1f8ee7fece58acdba09643f1943230e5ffb8c8',
  'onUndo/264f0af4a85c26e0e12899dc9c9ff0ee9198afb82192533289be2e3329a9c468',
  'onRedo/8676ea82820286a822f522e5b4085358175c84ed30c8a0e96be77ae3e45036c2',
  'onSelect/610c7aa707c1e7792cda3854a7ec79d0a63ef3319881a1625f5f6eae7a2cf70d',
  'onShow/99d3249e3d27ba107c43425a6194dc58fa387f7c786aac6f6f90c0c4544b377c',
  // The kidney reference adds only its guarded launcher and close binding.
  // hra-renal:test executes both callbacks, exam rejection and focus restoration.
  'onClick/48aabf4b223b1259418d5aa371a737011f2fe0da3993fe0b87e9c60d2e3f72cd',
  'onClose/5380572838098e48b319041df3d7a8df475a01498783e7069ceeabc1027a6ebb',
  // Source-bound child search is executed by nested-navigation:test. All original
  // launcher bindings and the portable baseline remain unchanged.
  'onDissect/4b3e76ba12a91c7a45ae6b7e2e9dfb7ab63f951831d4d099633f0bad2245a109',
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
  // Four independent specimen viewers: no coordinate-frame merging.
  'onClick/0cb7961dc2204188428ad45fd7e7aed09b66c8c55e775b3799ec6cad793a65a4',
  'onClick/1feeb949b3ec5cc16ea341f35cbf19bcbf4df7abade7e832efee2d3abf5bb359',
  'onClick/432739e4dd819ff700ef87c977cb5bec767312519f872117c90934c48b22c9d8',
  'onClick/63020d7f4710b1ad9249d46dfd02afe329bd3d2063fce023c26111bdb767866c',
  'onClose/3baf6677f0e63d874012c20a0d06aa4b03478412a8fd57f5219a4c0a9efd5034',
  'onClose/48e967aa6633e392b02598e5a9c32b16624e7f1afb33fb5effa8e6256a133bc6',
  'onClose/68bd6e3b4cbf85dbdd0992f9434a1a1a851352a678fedc16f0a92e9bd02d4b77',
  'onClose/a1d51e93091f2f72be4b109b2bf978e79cae392d27234a97e1108816a46c3428',
  'onExplore/c465a55708205fb80644de860c9943288f899e3ceed23a442744172a0fdb838f',
  'onOpen/4b3e76ba12a91c7a45ae6b7e2e9dfb7ab63f951831d4d099633f0bad2245a109',
  'onShow/66f71e9d14b988b74272c012ac3850a7e4ae6d08570863ec15a9f8a60f354aa8',
  'onShow/83affed5814e29a1b3d1a2efa2b55e9c9b4115d298a85ba5f938ce5441c5504b',
  // Motor, arterial and venous panels retain the existing guarded selection.
  ...Array(3).fill(
    'onSelect/610c7aa707c1e7792cda3854a7ec79d0a63ef3319881a1625f5f6eae7a2cf70d',
  ),
  'onValueChange/47c85b1c47a0ca99aa3cbfb9b61caa74d53dcf5c945ab3c7a766cac596813974',
);
for (const migration of modelFirstCallbackMigrations) {
  for (const retired of migration.remove) {
    const index = migratedCallbacks.indexOf(retired);
    check(index >= 0, `${migration.commit} retired callback remains pinned`);
    migratedCallbacks.splice(index, 1);
  }
  migratedCallbacks.push(...migration.add);
}
same(
  bindings(source).callbacks,
  migratedCallbacks.sort(compare),
  'Retained callbacks and explicit navigation/explosion bindings',
);
// Execute the actual migrated slider callback, rather than only approving its
// hash. Both primitive value forms must yield a finite scalar separation.
const explorerAst = ts.createSourceFile(
  'body.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const explodeCallbacks = [];
function findExplodeCallback(node) {
  if (
    ts.isJsxAttribute(node) &&
    node.name.text === 'onValueChange' &&
    ts.isJsxExpression(node.initializer) &&
    node.initializer.expression &&
    node.initializer.expression.getText(explorerAst).includes('setExplode')
  )
    explodeCallbacks.push(node.initializer.expression.getText(explorerAst));
  ts.forEachChild(node, findExplodeCallback);
}
findExplodeCallback(explorerAst);
same(explodeCallbacks.length, 1);
for (const value of [0, 50, 100, [0], [50], [100]]) {
  const emitted = [];
  runInNewContext(`(${explodeCallbacks[0]})(value)`, {
    value,
    setExplode: (next) => emitted.push(next),
  });
  same(emitted, [Array.isArray(value) ? value[0] : value]);
}
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
          contents: (
            source + '\nexport { bodyDisplayCatalog as __testDisplayCatalog };'
          )
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
        // The runtime session hook owns mode since 6786ed3c. Keep the loaded
        // explorer path, but inject the requested fixture mode explicitly.
        b.onLoad({ filter: /workspace-session\.ts$/ }, () => ({
          contents:
            'export function useWorkspaceSession() { return { mode: globalThis.__atlasMode, chooseMode() {} }; }',
          loader: 'ts',
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
// Use the same admitted source catalogue as the running app. The archival root
// catalogue and its geometry hashes remain pinned separately above.
const displayCatalog = vmModule.exports.__testDisplayCatalog(catalog);
context.__atlasCatalog = displayCatalog;
const originalIds = new Set(catalog.structures.map((s) => s.id));
let supplementalSelectionCases = 0;
let markupCases = 0;
for (const mode of ['explore', 'dissect', 'practice'])
  for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
    context.__atlasMode = mode;
    const items = displayCatalog.structures.filter(
      (s) => region === 'whole-body' || s.regions.includes(region),
    );
    const supplement = items.find((s) => !originalIds.has(s.id));
    for (const selected of [
      null,
      items[0].id,
      ...(supplement ? [supplement.id] : []),
    ]) {
      context.__atlasSelected = selected;
      if (selected === supplement?.id) supplementalSelectionCases++;
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
          info.includes(
            renderToStaticMarkup(items.find((s) => s.id === selected).name),
          ),
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

// Nested launchers and source limitations appear only on their exact parent in the real
// loaded explorer markup, including whole-body navigation.
let nestedLauncherMarkupCases = 0;
context.__atlasMode = 'explore';
for (const region of ['whole-body', 'regional'])
  for (const fma of [
    'FMA50801',
    'FMA12515',
    'FMA7088',
    'FMA7309',
    'FMA7310',
    'FMA7197',
  ]) {
    context.__atlasSelected = catalog.structures.find(
      (s) => s.fmaId === fma,
    ).id;
    const html = renderToStaticMarkup(
      React.createElement(vmModule.exports.default, {
        initialRegion:
          region === 'regional'
            ? ['FMA50801', 'FMA12515'].includes(fma)
              ? 'head-neck'
              : fma === 'FMA7197'
                ? 'abdomen'
                : 'thorax'
            : region,
      }),
    );
    same(html.includes('Dissect brain'), fma === 'FMA50801');
    same(html.includes('Explore eye layers'), fma === 'FMA12515');
    same(html.includes('Explore heart chambers'), fma === 'FMA7088');
    const isLung = ['FMA7309', 'FMA7310'].includes(fma);
    same(html.includes('Explore liver branches'), fma === 'FMA7197');
    same(
      html.includes('Liver segment boundaries are not validated'),
      fma === 'FMA7197',
    );
    same(html.includes('Explore lung branches'), isLung);
    same(html.includes('This model shows airway and vessel branches.'), isLung);
    if (isLung)
      check(
        html.indexOf('This model shows airway and vessel branches.') <
          html.indexOf('Explore lung branches'),
      );
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
  supplementalSelectionCases,
  displayStructures: displayCatalog.structures.length,
  archivalStructures: catalog.structures.length,
  nestedLauncherMarkupCases,
  panelCases,
  stylesheetViewportCases: dimensions.length,
  preservedNamedHandlers: Object.entries(baseline.functions).filter(
    ([name, fingerprint]) => bindings(source).functions[name] === fingerprint,
  ).length,
  pinnedHandlerMigrations: Object.keys(modelFirstHandlerMigrations).length,
  pinnedCallbackMigrationGroups: modelFirstCallbackMigrations.length,
  pinnedCallbackRemovals: modelFirstCallbackMigrations.reduce(
    (count, migration) => count + migration.remove.length,
    0,
  ),
  pinnedCallbackAdditions: modelFirstCallbackMigrations.reduce(
    (count, migration) => count + migration.add.length,
    0,
  ),
  injectedWorkspaceSessionModeFixture: true,
  explicitDissectionHistoryHandlerMigration: 1,
  addedDissectionRedoHandler: 1,
  addedDissectionRedoCallback: 1,
  explicitReasoningHandlerMigrations: 3,
  explicitReasoningSelectorMigration: 1,
  explicitExplosionHandlerMigration: 1,
  explicitSourceStudyHandlerMigrations: 3,
  addedRelationshipHandlers: 3,
  addedJointPartnerHandler: 1,
  addedVesselVisibilityHandler: 1,
  addedVesselVisibilityCallbacks: 4,
  addedJointPartnerCallbacks: 2,
  explicitQuizLoadingGuardMigration: 1,
  addedIndependentSpecimenCallbacks: 8,
  addedRenalSpecimenCallbacks: 2,
  addedRelationshipCallbacks: 6,
  addedComponentImagingCallback: 1,
  explicitSliderValueMigration: 1,
  actualSliderValueCases: 6,
  preservedControlCallbacks: baseline.callbacks.length - 8,
  addedEyeLayerCallbacks: 2,
  addedVentricularCallbacks: 2,
  addedNestedSearchCallback: 1,
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
    'Actual loaded explorer server markup with catalogue/selection and workspace-session mode fixtures plus a GPU double; injected responsive hooks; source-handler preservation and stylesheet assertions. No pixel layout, browser focus/Escape, touch, zoom or scroll measurements are claimed.',
};
await fs.writeFile(
  'docs/model-first-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
