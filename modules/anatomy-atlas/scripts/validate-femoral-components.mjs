/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- Controlled view callbacks, not browser/GPU acceptance. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url),
  React = require('react');
const copy = (v) => JSON.parse(JSON.stringify(v));
let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(copy(a), copy(b), message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const compiled = await build({
  stdin: {
    contents: `export * from './lib/femoral-components'; export * from './lib/nested-anatomy';
    export * from './lib/nested-teaching'; export {bodyDisplayCatalog} from './lib/body-display-catalog';
    export {FemoralComponentView,default as FemoralComponents} from './app/femoral-components';
    export {default as DissectionRouter} from './app/ventricles';
    export {CutawayControls} from './app/cutaway-controls'; export {initialInspection} from './lib/inspection-state';
    export {NestedTeaching} from './app/nested-teaching';`,
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
    if (!(i in slots))
      slots[i] = typeof value === 'function' ? value() : value;
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
      (a) => {
        slots[i] = reducer(slots[i], a);
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
    URLSearchParams,
    require: (id) =>
      id === 'react'
        ? shim
        : id === 'next/link'
          ? ({ children, ...props }) => React.createElement('a', props, children)
          : require(id),
  };
runInNewContext(compiled.outputFiles[0].text, env);
const api = scope.exports,
  hash = (b) => createHash('sha256').update(b).digest('hex');
const rootBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(rootBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = api.bodyDisplayCatalog(JSON.parse(rootBytes)),
  before = JSON.stringify(root);
same(root.structures.length, 1104);
const targets = api
  .nestedStudyTargets(root)
  .filter((t) => t.study === 'femoral-components');
same(targets.length, 4);
same(api.nestedStudyTargets(root).length, 106);
const catalog = api.femoralComponentCatalog;
same(catalog.clinicalApproval, false);
const lateralIdentity = {
  right: {
    name: 'Right lateral circumflex femoral artery',
    fmaId: 'FMA20801',
    sourceFile: 'FJ2158',
  },
  left: {
    name: 'Left lateral circumflex femoral artery',
    fmaId: 'FMA20802',
    sourceFile: 'FJ2078',
  },
};
const clinicalSources = {
  clinical: 'femoralComponentVariation',
  pathology: 'femoralComponentInjury',
};
const elements = (node) =>
  !node || typeof node !== 'object'
    ? []
    : Array.isArray(node)
      ? node.flatMap(elements)
      : [node, ...elements(node.props?.children)];
for (const b of catalog.bundles) {
  const bytes = await readFile(
    'public' + new URL(b.url, 'https://atlas.invalid').pathname,
  );
  same(hash(bytes), b.sha256);
  same(bytes.length, b.bytes);
}
const parents = catalog.parents.map((p) =>
  root.structures.find((s) => s.id === p.id),
);
for (const parent of parents) {
  const parts = api.femoralComponentsFor(parent),
    view = api.femoralComponentViewCatalog(parent);
  same(parts.length, 2);
  same(view.structures, parts);
  same(view.bundles.length, 1);
  check(
    parts.every(
      (s) => s.laterality === parent.laterality && s.parentId === parent.id,
    ),
  );
  check(
    parts.every((s) => !root.structures.some((p) => p.id === s.id)),
    'Nested parts do not duplicate root tissue',
  );
  same(
    parts.flatMap((s) => s.sources),
    parent.sources,
  );
  for (const mutate of [
    (p) => p.sources.pop(),
    (p) => (p.sources[0].sha256 = 'x'),
    (p) => p.center[0]++,
    (p) => p.anchor[0]++,
    (p) => p.bounds.min[0]++,
    (p) => (p.name += 'x'),
    (p) => (p.nodeName += 'x'),
    (p) => (p.bundle = 'foreign'),
    (p) => (p.laterality = 'midline'),
    (p) => (p.region = 'head-neck'),
  ]) {
    const bad = copy(parent);
    mutate(bad);
    same(api.femoralComponentsFor(bad), []);
    same(api.femoralComponentViewCatalog(bad).bundles, []);
  }
  for (const part of parts) {
    same(part.validation, {
      status: 'unvalidated',
      anatomicalReview: false,
    });
    const t = targets.find((t) => t.structureId === part.id);
    same(api.resolveNestedTarget(root, parent.id, t, parent.laterality), t);
    same(
      api.resolveNestedTarget(
        root,
        parent.id,
        t,
        parent.laterality === 'left' ? 'right' : 'left',
      ),
      null,
    );
    const lesson = api.nestedTeachingFor(
      parent,
      'femoral-components',
      part,
    );
    check(lesson);
    same(
      lesson.id,
      part.role === 'remainder'
        ? 'femoral-source-remainder'
        : 'femoral-lateral-source',
    );
    same(lesson.quiz.basis, 'model-scope');
    same(
      lesson.modelLimit,
      part.role === 'remainder'
        ? 'Uses the aggregate FMA reference only for provenance; the component ID and single-file binding identify this partial representation. Do not infer complete deep-femoral anatomy.'
        : 'One source-labelled component within the existing deep-femoral aggregate. Clinical boundaries and vessel junctions are unvalidated; no complete branch network is implied.',
    );
    if (part.role === 'lateral-circumflex') {
      const identity = lateralIdentity[parent.laterality];
      same(part.name, identity.name);
      same(part.fmaId, identity.fmaId);
      same(part.sources.map((source) => source.file), [identity.sourceFile]);
      same(part.laterality, parent.laterality);
      same(part.parentId, parent.id);
      for (const [topic, reference] of Object.entries(clinicalSources)) {
        const section = lesson.sections[topic];
        const source = api.nestedTeachingReferences[reference];
        check(source?.title && source?.url, `${topic} primary reference`);
        check(new URL(source.url).protocol === 'https:');
        same(section.readiness, 'draft');
        same(section.references, [reference]);
        check(section.body.trim().length > 0);
        const resolved = api.nestedTopicLesson(lesson, topic);
        same(resolved.readiness, 'draft');
        same(resolved.body, section.body);
        same(resolved.citations, [source.url]);
      }
    } else {
      for (const topic of Object.keys(clinicalSources)) {
        const section = lesson.sections[topic];
        same(section.readiness, 'pending');
        same(section.references, []);
        const resolved = api.nestedTopicLesson(lesson, topic);
        same(resolved.readiness, 'pending');
        same(resolved.citations, []);
      }
    }
    for (const tab of ['ct', 'mri', 'xray', 'ultrasound'])
      same(api.nestedTopicLesson(lesson, tab).readiness, 'pending');
    for (const mutate of [
      (s) => (s.role = 'foreign'),
      (s) => (s.id = parent.id),
      (s) => (s.name = 'foreign'),
      (s) => (s.fmaId = 'FMA0'),
      (s) => (s.laterality = s.laterality === 'left' ? 'right' : 'left'),
      (s) => (s.sources[0].file = 'foreign'),
      (s) => (s.sources[0].sha256 = 'x'),
      (s) => s.anchor[0]++,
      (s) => (s.parentId = parents.find((p) => p.id !== parent.id).id),
    ]) {
      const bad = copy(part);
      mutate(bad);
      same(api.nestedTeachingFor(parent, 'femoral-components', bad), null);
    }
    lesson.sections.anatomy.body = 'mutated';
    check(
      api.nestedTeachingFor(parent, 'femoral-components', part).sections
        .anatomy.body !== 'mutated',
    );
    const ui = api.NestedTeaching({
      parent,
      study: 'femoral-components',
      selected: part,
    });
    same(ui.type, 'details');
    check(!ui.props.open);
    const renderedSections = elements(ui).filter(
      (node) => node.type === 'section' &&
        node.props?.className === 'nested-teaching-section',
    );
    for (const [topic, reference] of Object.entries(clinicalSources)) {
      const resolved = api.nestedTopicLesson(lesson, topic);
      const sectionNode = renderedSections.find(
        (node) => node.props['aria-label'] === resolved.title,
      );
      check(sectionNode, `${part.name} ${topic} section rendered`);
      const markup = require('react-dom/server').renderToStaticMarkup(sectionNode);
      check(markup.includes(resolved.body));
      if (part.role === 'lateral-circumflex') {
        const source = api.nestedTeachingReferences[reference];
        check(markup.includes('Teaching references'));
        check(markup.includes(source.title));
        check(markup.includes(source.url.replaceAll('&', '&amp;')));
        check(!markup.includes('Content pending'));
      } else {
        check(markup.includes('Content pending'));
        check(!markup.includes('Teaching references'));
      }
    }
  }
  const originalHash = catalog.bundles[0].sha256;
  catalog.bundles[0].sha256 = '0'.repeat(64);
  same(api.nestedTeachingFor(parent, 'femoral-components', parts[0]), null);
  catalog.bundles[0].sha256 = originalHash;
  const badRoot = copy(root);
  badRoot.bundles.find((b) => b.id === parent.bundle).sha256 = '0'.repeat(
    64,
  );
  same(
    api
      .nestedStudyTargets(badRoot)
      .filter((t) => t.study === 'femoral-components').length,
    0,
  );
  check(
    api.DissectionRouter({ parent, onClose() {} }).type ===
      api.FemoralComponents,
  );
  const badParent = { ...parent, id: 'foreign' };
  check(
    api.DissectionRouter({
      parent: badParent,
      initialStudy: 'femoral-components',
      onClose() {},
    }).type === api.FemoralComponents,
    'No brain fallback',
  );
  check(
    require('react-dom/server')
      .renderToStaticMarkup(
        React.createElement(api.FemoralComponentView, {
          parent: badParent,
        }),
      )
      .includes('source binding is unavailable'),
  );
  for (const initialSelectedId of [undefined, ...parts.map((p) => p.id)]) {
    slots = [];
    let tree;
    const render = () => {
      active = true;
      cursor = 0;
      try {
        tree = api.FemoralComponentView({ parent, initialSelectedId });
      } finally {
        active = false;
      }
    };
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
    const scene = () =>
      nodes(tree).find((n) => n.props?.catalog && n.props?.landmarks).props;
    const button = (label) => {
      const n = nodes(tree).find(
        (n) => n.props?.onClick && text(n).trim() === label,
      );
      check(n, 'Button ' + label);
      return n.props;
    };
    const control = (label) => {
      const n = nodes(tree).find((n) => n.props?.['aria-label'] === label);
      check(n, 'Control ' + label);
      return n.props;
    };
    const changeVisibility = (part, visible) => {
      control(`Show ${part.name.toLowerCase()}`).onCheckedChange(visible);
      render();
    };
    render();
    same(scene().structures.length, 2);
    same(scene().explode, 0);
    same(scene().isolated, !!initialSelectedId);
    same(scene().inspection, api.initialInspection);
    const frame = copy(scene().inspectionBounds);
    check(button('Frame selected').disabled);
    scene().onLoaded();
    scene().onRendererHealth('ready');
    render();
    check(!button('Frame selected').disabled);
    const selected = parts.find((s) => s.id === scene().selectedId),
      other = parts.find((s) => s.id !== selected.id);
    changeVisibility(selected, false);
    same(scene().selectedId, null);
    check(control('Artery component separation').disabled);
    changeVisibility(other, false);
    same(scene().hiddenIds.length, 2);
    same(scene().inspectionBounds, frame);
    button('Show all').onClick();
    render();
    same(scene().hiddenIds, []);
    changeVisibility(selected, false);
    const hidden = copy(scene().hiddenIds);
    button('Undo').onClick();
    render();
    same(scene().hiddenIds, []);
    button('Redo').onClick();
    render();
    same(scene().hiddenIds, hidden);
    scene().onSelect(selected.id);
    render();
    same(scene().hiddenIds, []);
    check(button('Redo').disabled);
    for (const layout of ['extract', 'spatial', 'tray']) {
      nodes(tree)
        .find(
          (n) =>
            n.props?.onValueChange &&
            nodes(n).some(
              (c) =>
                c.props?.['aria-label'] === 'Artery separation mechanism',
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
      changeVisibility(other, false);
      same(scene().inspectionBounds, frame);
      button('Restore source position').onClick();
      render();
      same(scene().inspection, api.initialInspection);
      changeVisibility(other, true);
    }
    scene().onFailure();
    render();
    check(button('Frame selected').disabled);
    button('Retry').onClick();
    render();
    same(scene().retries['femoral-components'], 1);
    same(
      env.retried,
      catalog.bundles.map((b) => b.url),
    );
    button('Reassemble').onClick();
    render();
    same(scene().explode, 0);
    same(scene().hiddenIds, []);
    same(scene().isolated, false);
    const markup = require('react-dom/server').renderToStaticMarkup(
      React.createElement(api.FemoralComponentView, {
        parent,
        initialSelectedId,
      }),
    );
    check(markup.includes('Source remainder'));
    check(
      !/<details[^>]*\bopen(?:[\s=>])/.test(markup),
      'Advanced controls initially collapsed',
    );
  }
}
same(JSON.stringify(root), before, 'Root data remains unchanged');
const bodyUI = await readFile('app/body-explorer.tsx', 'utf8');
check(
  bodyUI.includes('Explore artery components') &&
    bodyUI.includes('femoralComponentsFor(selected).length > 0'),
);
console.log(
  JSON.stringify({
    checks,
    parents: 2,
    components: 4,
    rootStructures: 1104,
    nestedTargets: 106,
    clinicalApproval: false,
    browserOrGPUAcceptance: false,
    imagingResourcesAdded: 0,
  }),
);
