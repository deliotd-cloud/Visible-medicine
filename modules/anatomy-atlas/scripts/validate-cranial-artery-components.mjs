/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled harness callbacks forward the tested component's dependency arrays; not browser/GPU acceptance. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
// The application resolves next/link through Vinext. Use that installed
// implementation here as well; do not replace links with empty test stubs.
import * as frameworkLink from 'vinext/shims/link';
const require = createRequire(import.meta.url),
  React = require('react');
const copy = (v) => JSON.parse(JSON.stringify(v));
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(copy(a), copy(b));
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const compiled = await build({
  stdin: {
    contents: `export * from './lib/cranial-artery-components'; export * from './lib/nested-anatomy'; export * from './lib/study-links'; export * from './lib/nested-teaching'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {FemoralComponentView,default as Components} from './app/femoral-components'; export {default as Router} from './app/ventricles'; export {CutawayControls} from './app/cutaway-controls'; export {initialInspection} from './lib/inspection-state';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  plugins: [
    {
      name: 'gpu-only',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents:
            'export const BodyScene=()=>null; export const retryBodyAssets=urls=>globalThis.retried=urls;',
          loader: 'tsx',
        }));
      },
    },
  ],
});
let active = false,
  cursor = 0,
  slots = [];
const shim = {
  ...React,
  useState(value) {
    if (!active) return React.useState(value);
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
    return [
      slots[i],
      (next) => {
        slots[i] = typeof next === 'function' ? next(slots[i]) : next;
      },
    ];
  },
  useReducer(reducer, arg, init) {
    if (!active) return React.useReducer(reducer, arg, init);
    const i = cursor++;
    if (!(i in slots)) slots[i] = init ? init(arg) : arg;
    return [
      slots[i],
      (action) => {
        slots[i] = reducer(slots[i], action);
      },
    ];
  },
  useMemo: (fn, deps) => (active ? fn() : React.useMemo(fn, deps)),
  useCallback: (fn, deps) => (active ? fn : React.useCallback(fn, deps)),
};
const scope = { exports: {} },
  env = {
    module: scope,
    exports: scope.exports,
    URL,
    URLSearchParams,
    require: (id) =>
      id === 'react' ? shim : id === 'next/link' ? frameworkLink : require(id),
  };
runInNewContext(compiled.outputFiles[0].text, env);
const api = scope.exports,
  study = 'cranial-artery-components';
const root = api.bodyDisplayCatalog(
    JSON.parse(
      await readFile(
        'public/models/bodyparts3d/full-body/catalog.json',
        'utf8',
      ),
    ),
  ),
  before = JSON.stringify(root);
// Later, separately audited source additions are not cranial fragments. Match
// their complete records and retain the original count for everything else.
const laterAdditions = [
  'corpus-spongiosum',
  'short-ciliary',
  'anterior-cardiac-vein',
];
for (const bundle of laterAdditions) {
  const source = JSON.parse(
    await readFile(`public/models/bodyparts3d/${bundle}/catalog.json`, 'utf8'),
  );
  same(source.structures.length, 1);
  same(root.structures.filter((s) => s.bundle === bundle), source.structures);
}
same(
  root.structures.filter((s) => !laterAdditions.includes(s.bundle)).length,
  1101,
);
const targets = api.nestedStudyTargets(root).filter((t) => t.study === study);
same(targets.length, 29);
same(new Set(targets.map((t) => t.structureId)).size, 29);
const catalog = api.cranialArteryComponentCatalog;
for (const parent of catalog.parents) {
  const parts = api.cranialArteryComponentsFor(parent);
  same(parts.length, parent.fmaId === 'FMA50082' ? 3 : 13);
  same(
    parts.flatMap((p) => p.sources),
    parent.sources,
  );
  check(
    parts.every(
      (p) =>
        p.parentId === parent.id &&
        p.parentFmaId === parent.fmaId &&
        p.fmaId === parent.fmaId &&
        p.laterality === parent.laterality &&
        p.role === 'source-part',
    ),
  );
  check(parts.every((p) => !root.structures.some((s) => s.id === p.id)));
  same(
    parts.map((p) => p.sourceOrder),
    Array.from({ length: parts.length }, (_, i) => i + 1),
  );
  const changed = api.cranialArteryComponentsFor(parent);
  changed[0].sources[0].sha256 = 'x';
  same(api.cranialArteryComponentsFor(parent), parts);
  for (const mutate of [
    (p) => p.sources.pop(),
    (p) => p.sources.reverse(),
    (p) => (p.sources[0].sha256 = 'x'),
    (p) => p.center[0]++,
    (p) => p.anchor[0]++,
    (p) => p.bounds.min[0]++,
    (p) => (p.name += 'x'),
    (p) => (p.sourceTree = 'x'),
    (p) => (p.nodeName += 'x'),
    (p) => (p.bundle = 'foreign'),
    (p) => (p.laterality = 'midline'),
    (p) => (p.id = 'foreign'),
  ]) {
    const bad = copy(parent);
    mutate(bad);
    same(api.cranialArteryComponentsFor(bad), []);
    same(api.cranialArteryComponentViewCatalog(bad).bundles, []);
  }
  for (const field of ['sha256', 'url', 'bytes', 'structures']) {
    const bad = copy(root),
      bundle = bad.bundles.find((b) => b.id === parent.bundle);
    bundle[field] =
      typeof bundle[field] === 'number'
        ? bundle[field] + 1
        : bundle[field] + 'x';
    same(
      api.nestedStudyTargets(bad).filter((t) => t.study === study).length,
      0,
    );
  }
  const routed = api.Router({ parent, onClose() {} });
  same(routed.props.study, study);
  check(routed.type === api.Components);
  for (const part of parts) {
    same(
      api.nestedTeachingFor(parent, study, part),
      null,
      'No inherited parent lesson as child teaching',
    );
    const target = targets.find((t) => t.structureId === part.id);
    for (const region of ['head-neck', 'whole-body'])
      for (const side of ['both', 'right', 'left']) {
        const href = api.makeStudyLink(
          root,
          region,
          parent.id,
          side,
          null,
          target,
        );
        if (side !== 'both' && side !== parent.laterality) {
          same(href, null);
          continue;
        }
        check(href);
        const query = Object.fromEntries(
          new URL(href, 'https://atlas.invalid').searchParams,
        );
        const resolved = api.resolveStudyLink(
          root,
          region,
          api.parseStudyLink(query),
        );
        same(resolved.status, 'ready');
        same(resolved.nested.structureId, part.id);
        for (const field of ['source', 'partSource']) {
          const bad = { ...query, [field]: '0'.repeat(64) };
          same(
            api.resolveStudyLink(root, region, api.parseStudyLink(bad)).status,
            'rejected',
          );
        }
        same(
          api.resolveStudyLink(
            root,
            region,
            api.parseStudyLink({ ...query, part: parent.id }),
          ).status,
          'rejected',
        );
      }
    same(
      api.resolveNestedTarget(
        root,
        parent.id,
        { ...target, sourceHash: '0'.repeat(64) },
        parent.laterality,
      ),
      null,
    );
  }
  const nodes = (n) =>
    !n || typeof n !== 'object'
      ? []
      : Array.isArray(n)
        ? n.flatMap(nodes)
        : [n, ...nodes(n.props?.children)];
  const text = (n) =>
    typeof n === 'string'
      ? n
      : !n
        ? ''
        : Array.isArray(n)
          ? n.map(text).join('')
          : text(n.props?.children);
  for (const initialSelectedId of [undefined, parts.at(-1).id]) {
    slots = [];
    let tree;
    const render = () => {
      active = true;
      cursor = 0;
      try {
        tree = api.FemoralComponentView({ parent, study, initialSelectedId });
      } finally {
        active = false;
      }
    };
    const scene = () =>
      nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
    const button = (label) => {
      const n = nodes(tree).find(
        (n) => n.props?.onClick && text(n).trim() === label,
      );
      check(n, label);
      return n.props;
    };
    const control = (label) => {
      const n = nodes(tree).find((n) => n.props?.['aria-label'] === label);
      check(n, label);
      return n.props;
    };
    render();
    same(scene().structures, parts);
    same(scene().explode, 0);
    same(scene().isolated, !!initialSelectedId);
    same(scene().inspection, api.initialInspection);
    same(scene().selectedId, initialSelectedId ?? parts[0].id);
    const frame = copy(scene().inspectionBounds);
    check(button('Frame selected').disabled);
    scene().onLoaded();
    scene().onRendererHealth('ready');
    render();
    check(!button('Frame selected').disabled);
    for (const part of parts) {
      control(`Show ${part.name.toLowerCase()}`).onCheckedChange(false);
      render();
    }
    same(scene().hiddenIds.length, parts.length);
    same(scene().selectedId, null);
    same(scene().inspectionBounds, frame);
    check(control('Artery component separation').disabled);
    button('Show all').onClick();
    render();
    same(scene().hiddenIds, []);
    control(`Show ${parts[0].name.toLowerCase()}`).onCheckedChange(false);
    render();
    same(scene().hiddenIds, [parts[0].id]);
    button('Undo').onClick();
    render();
    same(scene().hiddenIds, []);
    button('Redo').onClick();
    render();
    same(scene().hiddenIds, [parts[0].id]);
    scene().onSelect(parts[0].id);
    render();
    same(scene().hiddenIds, []);
    check(button('Redo').disabled);
    const old = scene().selectedId;
    scene().onSelect('foreign');
    render();
    same(scene().selectedId, old);
    for (const layout of ['extract', 'spatial', 'tray']) {
      nodes(tree)
        .find(
          (n) =>
            n.props?.onValueChange &&
            nodes(n).some(
              (c) => c.props?.['aria-label'] === 'Artery separation mechanism',
            ),
        )
        .props.onValueChange(layout);
      render();
      same(scene().layout, layout);
      same(scene().explode, 0);
      control('Artery component separation').onValueChange([100]);
      render();
      same(scene().explode, 100);
      for (const bad of [[], [NaN], [Infinity]]) {
        control('Artery component separation').onValueChange(bad);
        render();
        same(scene().explode, 100);
      }
      button('Restore source position').onClick();
      render();
      same(scene().explode, 0);
    }
    for (const plane of ['axial', 'coronal', 'sagittal']) {
      nodes(tree)
        .find((n) => n.type === api.CutawayControls)
        .props.onChange({ ...api.initialInspection, plane, position: 75 });
      render();
      same(scene().inspection.plane, plane);
      same(scene().inspectionBounds, frame);
      button('Restore source position').onClick();
      render();
      same(scene().inspection, api.initialInspection);
    }
    button('Fade others').onClick();
    render();
    check(scene().isolated);
    button('Reassemble').onClick();
    render();
    same(scene().isolated, false);
    same(scene().hiddenIds, []);
    scene().onFailure();
    render();
    check(button('Frame selected').disabled);
    button('Retry').onClick();
    render();
    same(scene().retries[study], 1);
    same(
      env.retried,
      catalog.bundles.map((b) => b.url),
    );
    const markup = require('react-dom/server').renderToStaticMarkup(
      React.createElement(api.FemoralComponentView, {
        parent,
        study,
        initialSelectedId,
      }),
    );
    check(markup.includes('Source part 01'));
    check(markup.includes('no independent clinical lesson'));
    check(!markup.includes('Lateral circumflex'));
    check(!markup.includes('Study view'));
    check(
      !/<details[^>]*\bopen(?:[\s=>])/.test(markup),
      'Advanced controls initially collapsed',
    );
  }
  for (const props of [
    { parent: { ...parent, id: 'foreign' }, study },
    { parent, study, initialSelectedId: 'foreign' },
  ]) {
    const markup = require('react-dom/server').renderToStaticMarkup(
      React.createElement(api.FemoralComponentView, props),
    );
    check(markup.includes('source binding is unavailable'));
    check(!markup.includes('Source part 01'));
  }
}
same(JSON.stringify(root), before);
console.log(
  JSON.stringify({
    checks,
    parents: 3,
    parts: 29,
    rootStructures: root.structures.length,
    nestedTargets: 104,
    clinicalApproval: false,
    browserOrGPUAcceptance: false,
    imagingResourcesAdded: 0,
  }),
);
