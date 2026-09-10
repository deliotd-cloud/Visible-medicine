/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled hooks exercise actual search closures. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';
import {
  nestedStudyTargets,
  resolveNestedTarget,
} from '../lib/nested-anatomy.ts';
import {
  atlasSearchIndex,
  filterAtlasSearch,
} from '../lib/atlas-navigation.ts';
import {
  bodyStudyScope,
  makeStudyLink,
  parseStudyLink,
  resolveStudyLink,
} from '../lib/study-links.ts';
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (a, message) => {
  checks++;
  assert(a, message);
};
const require = createRequire(import.meta.url),
  React = require('react');
const compiled = await build({
  stdin: {
    contents: `export { bodyDisplayCatalog } from './lib/body-display-catalog';
    export { EyeLayerView } from './app/eye-layers';
    export { VentricularView } from './app/ventricles';
    export { AtlasSearch } from './app/atlas-workspace';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'only-gpu-fixture',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents:
            'export const BodyScene=(props)=>{globalThis.__scene=props;return null}; export const retryBodyAssets=()=>{};',
          loader: 'tsx',
        }));
      },
    },
  ],
});
let active = false,
  cursor = 0,
  refCursor = 0,
  states = [],
  refs = [];
const shim = {
  ...React,
  useState: (value) => {
    if (!active) return React.useState(value);
    const i = cursor++;
    if (!(i in states))
      states[i] = typeof value === 'function' ? value() : value;
    return [
      states[i],
      (next) => {
        states[i] = typeof next === 'function' ? next(states[i]) : next;
      },
    ];
  },
  useRef: (value) => {
    if (!active) return React.useRef(value);
    const i = refCursor++;
    return refs[i] ?? (refs[i] = { current: value });
  },
  useContext: (value) => (active ? workspace : React.useContext(value)),
  useMemo: (fn, deps) => (active ? fn() : React.useMemo(fn, deps)),
  useId: () => (active ? 'nested-search-test' : React.useId()),
};
const uiModule = { exports: {} },
  uiEnv = {
    module: uiModule,
    exports: uiModule.exports,
    console,
    URLSearchParams,
    process: { env: { NODE_ENV: 'test' } },
    require: (id) =>
      id === 'react' ? shim : id === 'next/link' ? () => null : require(id),
  };
runInNewContext(compiled.outputFiles[0].text, uiEnv);
const api = uiModule.exports;
const raw = JSON.parse(
  await readFile('public/models/bodyparts3d/full-body/catalog.json'),
);
const catalog = api.bodyDisplayCatalog(raw),
  before = JSON.stringify(catalog);
const targets = nestedStudyTargets(catalog);
same(targets.length, 46);
same(
  Object.fromEntries(
    ['eye', 'ventricles', 'brainstem', 'cerebral', 'cardiac', 'pulmonary'].map(
      (study) => [study, targets.filter((t) => t.study === study).length],
    ),
  ),
  {
    eye: 15,
    ventricles: 4,
    brainstem: 4,
    cerebral: 14,
    cardiac: 4,
    pulmonary: 5,
  },
);
same(new Set(targets.map((t) => t.structureId)).size, 46);
const parse = (href) => {
  const url = new URL(href, 'https://atlas.invalid');
  return { url, parsed: parseStudyLink(Object.fromEntries(url.searchParams)) };
};
let directActions = 0,
  linkedActions = 0;
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
  for (const side of ['both', 'left', 'right']) {
    const index = atlasSearchIndex(catalog, region, side);
    const nested = index.filter((e) => e.key.startsWith('nested:'));
    same(nested.length, 46);
    for (const target of targets) {
      const entry = nested.find(
        (e) => e.key === `nested:${target.study}:${target.structureId}`,
      );
      same(entry.label, target.structure.name);
      check(
        filterAtlasSearch(index, target.structure.fmaId, 'structure').includes(
          entry,
        ),
      );
      check(
        filterAtlasSearch(index, target.structureId, 'structure').includes(
          entry,
        ),
      );
      if (entry.action.type === 'dissect') {
        check(
          bodyStudyScope(catalog, region, side).some(
            (s) => s.id === target.parentId,
          ),
        );
        same(
          resolveNestedTarget(
            catalog,
            target.parentId,
            entry.action.target,
            side,
          ),
          target,
        );
        directActions++;
      } else {
        same(entry.action.type, 'link');
        const { url, parsed } = parse(entry.action.href);
        same(url.origin, 'https://atlas.invalid');
        same(url.pathname, '/regions/' + target.structure.region);
        const result = resolveStudyLink(
          catalog,
          target.structure.region,
          parsed,
        );
        same(result.status, 'ready');
        same(result.selected.id, target.parentId);
        same(result.nested.structureId, target.structureId);
        same(result.nested.study, target.study);
        linkedActions++;
      }
    }
  }
}

for (const target of targets) {
  const targetRegion = target.structure.region;
  const href = makeStudyLink(
    catalog,
    targetRegion,
    target.parentId,
    'both',
    null,
    target,
  );
  const { url, parsed } = parse(href),
    params = Object.fromEntries(url.searchParams);
  same(params.study, '2');
  same(
    resolveStudyLink(catalog, targetRegion, parsed).nested.structureId,
    target.structureId,
  );
  for (const key of ['detail', 'part', 'partSource']) {
    const omitted = { ...params };
    delete omitted[key];
    same(parseStudyLink(omitted).status, 'invalid');
    for (const value of [
      '',
      [params[key]],
      ['one', 'two'],
      '<script>',
      'x'.repeat(10000),
    ])
      same(parseStudyLink({ ...params, [key]: value }).status, 'invalid');
  }
  for (const extra of [
    { study: '1' },
    { focus: 'arteries' },
    { detail: '__proto__' },
  ])
    same(parseStudyLink({ ...params, ...extra }).status, 'invalid');
  for (const extra of [
    { part: 'missing' },
    { partSource: '0'.repeat(64) },
    { source: '0'.repeat(64) },
    { structure: 'missing' },
  ])
    same(
      resolveStudyLink(
        catalog,
        targetRegion,
        parseStudyLink({ ...params, ...extra }),
      ).status,
      'rejected',
    );
  for (const study of [
    'eye',
    'ventricles',
    'brainstem',
    'cerebral',
    'cardiac',
    'pulmonary',
  ].filter((s) => s !== target.study))
    same(
      makeStudyLink(catalog, targetRegion, target.parentId, 'both', null, {
        ...target,
        study,
      }),
      null,
    );
  if (['left', 'right'].includes(target.structure.laterality)) {
    const opposite = target.structure.laterality === 'left' ? 'right' : 'left';
    same(
      makeStudyLink(
        catalog,
        targetRegion,
        target.parentId,
        opposite,
        null,
        target,
      ),
      null,
    );
  }
  const stale = structuredClone(catalog);
  stale.structures.find((s) => s.id === target.parentId).sources[0].sha256 =
    '0'.repeat(64);
  same(resolveStudyLink(stale, targetRegion, parsed).status, 'rejected');
  const parent = catalog.structures.find((s) => s.id === target.parentId);
  const props = {
    parent,
    initialSelectedId: target.structureId,
    study: target.study,
  };
  require('react-dom/server').renderToStaticMarkup(
    React.createElement(
      target.study === 'eye' ? api.EyeLayerView : api.VentricularView,
      props,
    ),
  );
  same(uiEnv.__scene.selectedId, target.structureId);
  same(
    uiEnv.__scene.isolated,
    true,
    'Search-selected child is not buried behind an opaque shell',
  );
  same(uiEnv.__scene.explode, 0);
  check(!uiEnv.__scene.hiddenIds.includes(target.structureId));
  check(uiEnv.__scene.landmarks.includes(target.structureId));
  for (const invalid of ['missing', target.parentId]) {
    require('react-dom/server').renderToStaticMarkup(
      React.createElement(
        target.study === 'eye' ? api.EyeLayerView : api.VentricularView,
        { ...props, initialSelectedId: invalid },
      ),
    );
    check(uiEnv.__scene.selectedId !== invalid);
    same(uiEnv.__scene.isolated, false);
  }
}
same(
  JSON.stringify(catalog),
  before,
  'Index, links and SSR do not mutate the catalog',
);

// Execute actual search events, including the exam guard and focus handover.
const walk = (node, predicate, result = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node);
    React.Children.forEach(node.props.children, (child) =>
      walk(child, predicate, result),
    );
  }
  return result;
};
const calls = [],
  searchLauncher = { focus() {} };
const workspace = {
  mode: 'explore',
  exam: false,
  chooseMode: (mode) => calls.push(['mode', mode]),
  showInfo: () => calls.push(['info']),
};
const props = {
  catalog,
  region: 'head-neck',
  side: 'both',
  onDissect: (target, launcher) => calls.push(['dissect', target, launcher]),
  onSelect: () => {
    throw Error('Nested search must not publish a root selection');
  },
};
for (const entry of atlasSearchIndex(catalog, 'head-neck', 'both').filter(
  (e) => e.action.type === 'dissect',
)) {
  states = [true, entry.label, 'structure', 100, null];
  refs = [{ current: searchLauncher }, { current: false }];
  cursor = 0;
  refCursor = 0;
  active = true;
  const tree = api.AtlasSearch(props);
  active = false;
  const button = walk(
    tree,
    (n) => n.type === 'button' && n.key === entry.key,
  )[0];
  check(button);
  calls.length = 0;
  workspace.exam = true;
  button.props.onClick();
  same(calls, []);
  workspace.exam = false;
  button.props.onClick();
  same(calls.length, 1);
  same(calls[0][0], 'dissect');
  same(JSON.stringify(calls[0][1]), JSON.stringify(entry.action.target));
  same(calls[0][2], searchLauncher);
  same(states[0], false);
  const dialog = walk(
    tree,
    (n) => n.props.className === 'atlas-search-dialog',
  )[0];
  same(
    dialog.props.finalFocus(),
    false,
    'Search closing must not steal nested-dialog focus',
  );
  tree.props.onOpenChange(true);
  same(
    dialog.props.finalFocus(),
    searchLauncher,
    'Ordinary search close returns to trigger',
  );
}

// Execute BodyExplorer's real source-checked action and return handlers.
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  source,
  99,
  true,
  ts.ScriptKind.TSX,
);
const callbacks = {};
let loadedCallback;
function visit(n) {
  if (
    ts.isCallExpression(n) &&
    ts.isPropertyAccessExpression(n.expression) &&
    n.expression.name.text === 'then' &&
    n.arguments[0]?.getText(ast).includes('const value = bodyDisplayCatalog')
  )
    loadedCallback = n.arguments[0].getText(ast);
  if (
    ts.isVariableDeclaration(n) &&
    ['openNested', 'closeEyeLayers', 'closeVentricles'].includes(
      n.name.getText(ast),
    )
  )
    callbacks[n.name.getText(ast)] = n.initializer.arguments[0].getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
check(
  loadedCallback,
  'Loaded catalog must initialize nested links before the scene mounts',
);
let loadedLinkCases = 0;
for (const target of targets) {
  const { parsed } = parse(
    makeStudyLink(
      catalog,
      target.structure.region,
      target.parentId,
      'both',
      null,
      target,
    ),
  );
  for (const accepted of [true, false]) {
    const changes = {};
    const link = structuredClone(parsed);
    if (!accepted) link.request.nested.sourceHash = '0'.repeat(64);
    const env = {
      data: raw,
      bodyDisplayCatalog: api.bodyDisplayCatalog,
      bodyLinkEntries: () => {},
      active: true,
      appliedStudyLink: { current: false },
      initialRegion: target.structure.region,
      studyLink: link,
      resolveStudyLink,
      allBodySystems: {},
      ...Object.fromEntries(
        [
          'setSide',
          'setSelectedId',
          'setSystems',
          'dispatch',
          'setView',
          'setNestedSelection',
          'setEyeParent',
          'setVentricleParent',
          'setSelectionNotice',
          'setLinkIssue',
          'setLinkedStudyReady',
          'setCatalog',
        ].map((name) => [
          name,
          (value) => {
            changes[name] = value;
          },
        ]),
      ),
    };
    const js = ts.transpileModule(`(${loadedCallback})(data);`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText;
    runInNewContext(js, env);
    same(changes.setLinkedStudyReady, true);
    same(env.appliedStudyLink.current, true);
    if (accepted) {
      same(changes.setSelectedId, target.parentId);
      same(changes.setNestedSelection.structureId, target.structureId);
      same(
        changes[target.study === 'eye' ? 'setEyeParent' : 'setVentricleParent']
          .id,
        target.parentId,
      );
      check(!changes.setLinkIssue);
      delete changes.setNestedSelection;
      runInNewContext(js, env);
      same(
        changes.setNestedSelection,
        undefined,
        'Already applied URL cannot reopen closed work',
      );
    } else {
      same(changes.setSelectedId, undefined);
      same(changes.setNestedSelection, undefined);
      check(changes.setLinkIssue);
    }
    loadedLinkCases++;
  }
}
const execute = (name, env) =>
  runInNewContext(
    ts.transpileModule(
      `(${callbacks[name]})(${name === 'openNested' ? 'request, launcher' : ''});`,
      { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
    ).outputText,
    env,
  );
for (const target of targets) {
  const events = [],
    camera = { pan: [1, 2, 3], distance: 4 };
  let focused = 0;
  const env = {
    request: target,
    launcher: { focus: () => focused++ },
    exam: false,
    catalog,
    regionStructures: bodyStudyScope(catalog, target.structure.region, 'both'),
    side: 'both',
    resolveNestedTarget,
    copyRecoveryCamera: structuredClone,
    cameraCapture: { current: camera },
    cameraRestore: { current: null },
    nestedReturnFocus: { current: null },
    applySelection: (id) => events.push(['parent', id]),
    setNestedSelection: (value) =>
      events.push(['nested', value?.structureId ?? null]),
    setEyeParent: (value) => events.push(['eye', value?.id ?? null]),
    setVentricleParent: (value) => events.push(['brain', value?.id ?? null]),
    requestAnimationFrame: (fn) => fn(),
    eyeLauncher: { current: null },
    ventricleLauncher: { current: null },
  };
  for (const invalid of [
    { exam: true },
    { catalog: null },
    { regionStructures: [] },
    { request: { ...target, parentHash: '0'.repeat(64) } },
    { request: { ...target, sourceHash: '0'.repeat(64) } },
  ]) {
    execute('openNested', { ...env, ...invalid });
    same(events, []);
  }
  execute('openNested', env);
  same(events, [
    ['parent', target.parentId],
    ['nested', target.structureId],
    [target.study === 'eye' ? 'eye' : 'brain', target.parentId],
  ]);
  same(env.cameraRestore.current, camera);
  check(env.cameraRestore.current !== camera);
  execute(target.study === 'eye' ? 'closeEyeLayers' : 'closeVentricles', env);
  same(focused, 1);
  same(env.nestedReturnFocus.current, null);
  same(events.at(-1), ['nested', null]);
}
const report = {
  passed: true,
  checks,
  selectableNestedParts: targets.length,
  directActions,
  linkedActions,
  loadedLinkCases,
  sourceBoundLinkVersion: 2,
  unchangedRootStudyLinks: true,
  geometryChanged: false,
  clinicalApproval: false,
  browserInteractionTesting: false,
  imagingEventsAdded: false,
  lectureAccessChanged: false,
  limitations: `Source-bound routes, real search/launcher closures and ${targets.length * 3} SSR child-selection cases. Browser keyboard/focus, mobile and GPU acceptance remain pending.`,
};
await writeFile(
  'docs/nested-navigation-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
