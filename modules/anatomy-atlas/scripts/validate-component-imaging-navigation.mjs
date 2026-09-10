import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url),
  React = require('react');
let checks = 0;
const check = (value, message) => {
  checks++;
  assert(value, message);
};
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
let controlled = false,
  choice = '';
const bundled = await build({
  stdin: {
    contents: `
    export * from './lib/component-imaging-navigation';
    export { bodyDisplayCatalog } from './lib/body-display-catalog';
    export { nestedStudyTargets, resolveNestedTarget } from './lib/nested-anatomy';
    export { nestedTeachingFor } from './lib/nested-teaching';
    export { ComponentImagingNotes } from './app/component-imaging-notes';
    export { NestedTeaching } from './app/nested-teaching';
    export { EyeLayerView } from './app/eye-layers';
    export { VentricularView } from './app/ventricles';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [
    {
      name: 'gpu-only',
      setup(b) {
        b.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          contents:
            'export const BodyScene=()=>null; export const retryBodyAssets=()=>{};',
          loader: 'tsx',
        }));
      },
    },
  ],
});
const mod = { exports: {} };
runInNewContext(bundled.outputFiles[0].text, {
  module: mod,
  exports: mod.exports,
  console,
  process: { env: { NODE_ENV: 'test' } },
  require: (id) =>
    id === 'react'
      ? {
          ...React,
          useMemo: (fn, deps) =>
            controlled ? fn() : React.useMemo(fn, deps),
          useState: (initial) =>
            controlled
              ? [
                  choice,
                  (value) => {
                    choice = value;
                  },
                ]
              : React.useState(initial),
        }
      : require(id),
});
const api = mod.exports;
const catalog = api.bodyDisplayCatalog(
  JSON.parse(
    await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  ),
);
const before = JSON.stringify(catalog),
  targets = api.nestedStudyTargets(catalog);
const parents = [...new Set(targets.map((t) => t.parentId))];
const walk = (node, predicate, result = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node);
    React.Children.forEach(node.props.children, (child) =>
      walk(child, predicate, result),
    );
  }
  return result;
};
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'body.tsx',
  source,
  99,
  true,
  ts.ScriptKind.TSX,
);
let callback;
function visit(node) {
  if (
    ts.isVariableDeclaration(node) &&
    node.name.getText(ast) === 'openNested'
  )
    callback = node.initializer.arguments[0].getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
check(callback, 'Test the actual source-checked launcher');
const action = ts.transpile(
  `(${callback})(request, launcher, teachingTopic);`,
);
let drafts = 0,
  pending = 0;
const counts = { ct: 0, mri: 0, xray: 0, ultrasound: 0 };
for (const parentId of parents) {
  const parent = catalog.structures.find((s) => s.id === parentId);
  for (const topic of ['ct', 'mri', 'xray', 'ultrasound']) {
    const choices = api.componentImagingTargets(
      catalog,
      parentId,
      topic,
      'both',
    );
    const expected = targets.filter(
      (t) =>
        t.parentId === parentId &&
        api.nestedTeachingFor(parent, t.study, t.structure)?.imaging?.[topic]
          ?.readiness === 'draft',
    );
    same(
      Array.from(choices, (t) => t.structureId),
      Array.from(expected, (t) => t.structureId),
    );
    counts[topic] += choices.length;
    for (const target of targets.filter((t) => t.parentId === parentId)) {
      const available = choices.some(
        (t) =>
          t.structureId === target.structureId && t.study === target.study,
      );
      available ? drafts++ : pending++;
      same(
        !!api.resolveComponentImagingTarget(catalog, target, topic, 'both'),
        available,
      );
      const calls = [],
        launcher = { focus() {} };
      const env = {
        request: target,
        launcher,
        teachingTopic: topic,
        exam: false,
        catalog,
        regionStructures: catalog.structures,
        side: 'both',
        resolveNestedTarget: api.resolveNestedTarget,
        resolveComponentImagingTarget: api.resolveComponentImagingTarget,
        cameraRestore: { current: null },
        cameraCapture: { current: null },
        nestedReturnFocus: { current: null },
        copyRecoveryCamera: (value) => value,
        applySelection: (value) => calls.push(['parent', value]),
        setNestedSelection: (value) => calls.push(['child', value]),
        setEyeParent: (value) => calls.push(['eye', value.id]),
        setVentricleParent: (value) => calls.push(['organ', value.id]),
      };
      runInNewContext(action, env);
      same(calls.length, available ? 3 : 0);
      if (available) {
        same(calls[1][1].teachingTopic, topic);
        same(calls[1][1].structureId, target.structureId);
        same(calls[2][0], target.study === 'eye' ? 'eye' : 'organ');
        same(env.nestedReturnFocus.current, launcher);
      }
      for (const overrides of [
        { exam: true },
        { regionStructures: [] },
        { teachingTopic: 'xray' },
        { request: { ...target, sourceHash: '0'.repeat(64) } },
        { request: { ...target, parentHash: '0'.repeat(64) } },
        { request: { ...target, structureId: parentId } },
      ]) {
        calls.length = 0;
        runInNewContext(action, { ...env, ...overrides });
        same(
          calls.length,
          0,
          'Invalid launch cannot change selection or camera',
        );
      }
      const html = require('react-dom/server').renderToStaticMarkup(
        React.createElement(
          target.study === 'eye' ? api.EyeLayerView : api.VentricularView,
          {
            parent,
            study: target.study,
            initialSelectedId: target.structureId,
            initialTeachingTopic: topic,
          },
        ),
      );
      same(/class="nested-teaching" open=""/.test(html), available);
      if (available)
        check(
          html.includes(
            `${topic === 'ultrasound' ? 'Ultrasound' : topic.toUpperCase()} · teaching draft`,
          ),
        );
      const teaching = api.NestedTeaching({
        parent,
        study: target.study,
        selected: target.structure,
        initialTopic: topic,
      });
      const tabValues = walk(teaching, (n) => n.props.defaultValue).map(
        (n) => n.props.defaultValue,
      );
      same(tabValues[0], available ? 'imaging' : 'anatomy');
      if (available) check(tabValues.includes(topic));
    }
    const props = {
      catalog,
      parentId,
      topic,
      side: 'both',
      disabled: false,
      onOpen: (...args) => calls.push(args),
    };
    const calls = [];
    controlled = true;
    choice = '';
    let tree = api.ComponentImagingNotes(props);
    same(tree === null, choices.length === 0);
    if (choices.length) {
      check(!tree.props.open, 'Picker is collapsed by default');
      const picker = walk(
        tree,
        (n) => typeof n.props.onValueChange === 'function',
      )[0];
      const last = choices.at(-1);
      picker.props.onValueChange(`${last.study}:${last.structureId}`);
      tree = api.ComponentImagingNotes(props);
      const button = walk(
        tree,
        (n) => typeof n.props.onClick === 'function',
      )[0];
      const launcher = { focus() {} };
      button.props.onClick({ currentTarget: launcher });
      same(calls.length, 1);
      same(calls[0][0].structureId, last.structureId);
      same(calls[0][1], launcher);
      same(calls[0][2], topic);
      picker.props.onValueChange('forged');
      same(choice, `${last.study}:${last.structureId}`);
    }
    same(api.ComponentImagingNotes({ ...props, disabled: true }), null);
    same(api.ComponentImagingNotes({ ...props, topic: 'anatomy' }), null);
    controlled = false;
  }
  same(
    api.componentImagingTargets(catalog, parentId, 'xray', 'both').length,
    0,
  );
  same(
    api.componentImagingTargets(catalog, parentId, 'ct', 'unknown').length,
    0,
  );
  const altered = structuredClone(catalog);
  altered.structures.find((s) => s.id === parentId).sourceName += ' changed';
  same(
    api.componentImagingTargets(altered, parentId, 'ct', 'both').length,
    0,
  );
}
same(counts, { ct: 35, mri: 35, xray: 0, ultrasound: 28 });
same(drafts, 98);
same(pending, 178);
same(
  JSON.stringify(catalog),
  before,
  'Teaching navigation does not mutate source anatomy',
);
console.log(
  JSON.stringify({
    checks,
    parents: parents.length,
    draftRoutes: drafts,
    pendingNotOffered: pending,
    modalityRoutes: counts,
    browserQA: false,
  }),
);
