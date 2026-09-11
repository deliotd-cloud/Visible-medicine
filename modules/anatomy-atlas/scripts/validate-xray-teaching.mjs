import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { authoringBeforeSpineImaging } from './spine-imaging-history.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  contentContext,
  contentValidator,
  readContentJson,
} from './content-contract-tools.mjs';

const context = await contentContext();
const { catalog, shoulder, body, registry } = context;
// Test this historical milestone after explicitly verifying/reversing the later pass.
// Export validation below still uses today's unmodified runtime records.
const api = authoringBeforeSpineImaging(context);
const pins = await readContentJson('content/shoulder-xray-bindings.json');
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(a, b);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const hash = (v) => createHash('sha256').update(v).digest('hex');
same(
  hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const oldTabs = api.contentTabs.filter((t) => t !== 'xray');
same(oldTabs, [
  'anatomy',
  'function',
  'ct',
  'mri',
  'ultrasound',
  'pathology',
  'clinical',
  'quiz',
]);
// Preserve ALL pre-existing body lessons and shoulder data, not just counts.
const oldShoulder = api.structures.map((s) => {
  const { xray, ...sections } = s.sections;
  return { ...s, sections };
});
same(
  hash(
    JSON.stringify({
      body: catalog.structures.map((s) => ({
        id: s.id,
        lessons: oldTabs.map((t) => [t, api.bodyLesson(s, t)]),
      })),
      shoulder: oldShoulder,
    }),
  ),
  '8bf1efba7e1e8b4d612ab5b5b045fa1d40df41d04cb40c8bfee1836c05ab1933',
);
same(pins.structures.length, 6);
const ids = new Set(pins.structures.map((p) => p.id));
for (const s of catalog.structures) {
  const lesson = api.bodyLesson(s, 'xray');
  same(lesson.readiness, ids.has(s.id) ? 'draft' : 'pending');
  check(lesson.title.includes('X-ray'));
  if (ids.has(s.id)) {
    same(
      s,
      pins.structures.find((p) => p.id === s.id),
    );
    same(lesson.citations.length, 3);
    for (const mutate of [
      (t) => {
        t.id += '-foreign';
      },
      (t) => {
        t.fmaId = 'FMA0';
      },
      (t) => {
        t.laterality = t.laterality === 'left' ? 'right' : 'left';
      },
      (t) => {
        t.sources[0].sha256 = '0'.repeat(64);
      },
      (t) => {
        t.sourceTree = 'partof';
      },
      (t) => {
        t.bundle += '-foreign';
      },
      (t) => {
        t.bounds.min[0] += 0.1;
      },
      (t) => {
        t.sources.push(t.sources[0]);
      },
      (t) => {
        t.name += ' changed';
      },
    ]) {
      const changed = structuredClone(s);
      mutate(changed);
      same(api.bodyLesson(changed, 'xray').readiness, 'pending');
    }
    lesson.bullets.push('mutated');
    lesson.citations.length = 0;
    same(api.bodyLesson(s, 'xray').citations.length, 3);
    check(!api.bodyLesson(s, 'xray').bullets.includes('mutated'));
  }
}
same(
  api.bodyLesson(
    {
      id: 'foreign',
      get name() {
        throw Error('Unrelated data traversed');
      },
    },
    'xray',
  ).readiness,
  'pending',
);
same(
  catalog.structures.filter(
    (s) => api.bodyLesson(s, 'xray').readiness === 'draft',
  ).length,
  6,
);
same(body.filter((r) => r.content.xray.readiness === 'draft').length, 53);
same(shoulder.filter((r) => r.content.xray.readiness === 'draft').length, 3);
same(shoulder.filter((r) => r.content.xray.readiness === 'pending').length, 6);
const validate = await contentValidator(registry);
for (const record of [...body, ...shoulder]) check(validate(record));
// Optional additive v2 field: old eight-topic records remain structurally valid.
const legacy = structuredClone(shoulder[0]);
delete legacy.content.xray;
const validateShape = new Ajv2020({ strict: true }).compile(
  await readContentJson('content/schema/anatomy-structure.schema.json'),
);
check(validateShape(legacy));
// Structural backwards compatibility never bypasses the current content revision.
checks++;
assert.throws(() => validate(legacy), /Teaching differs/);
const invalid = structuredClone(shoulder[0]);
invalid.content.xray.readiness = 'approved';
checks++;
assert.throws(() => validate(invalid));

const require = createRequire(import.meta.url),
  React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = await readFile('app/shoulder-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'shoulder.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let callback;
function visit(n) {
  if (
    ts.isJsxElement(n) &&
    n.openingElement.tagName.getText(ast) === 'GroupedAnatomyNotes'
  )
    callback = n.children
      .find((c) => ts.isJsxExpression(c))
      ?.expression?.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
check(callback);
const js = ts.transpile(`(${callback})('xray')`, {
  jsx: ts.JsxEmit.React,
  target: ts.ScriptTarget.ES2022,
});
for (const selected of api.structures) {
  const tree = runInNewContext(js, {
    React,
    selected,
    ScanLine: () => null,
    syncPlane: null,
    toggleSync: () => {
      throw Error('X-ray must not expose a slice plane');
    },
  });
  const html = renderToStaticMarkup(tree);
  check(html.includes('No X-ray study loaded'));
  check(!html.includes('Preview 3D reference plane'));
  same(
    (html.match(/href=/g) ?? []).length,
    selected.category === 'bone' ? 3 : 0,
  );
  check(
    html.includes(
      selected.category === 'bone' ? 'orientation' : 'teaching pending',
    ),
  );
}
const workspace = await readFile('app/atlas-workspace.tsx', 'utf8');
const groupAst = ts.createSourceFile(
  'groups.tsx',
  workspace,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let groupsText;
function findGroups(n) {
  if (ts.isVariableDeclaration(n) && n.name.getText(groupAst) === 'noteGroups')
    groupsText = n.initializer.getText(groupAst);
  ts.forEachChild(n, findGroups);
}
findGroups(groupAst);
check(groupsText);
const groups = JSON.parse(JSON.stringify(runInNewContext(`(${groupsText})`)));
same(
  groups.map((g) => g.id),
  ['anatomy', 'clinical', 'imaging'],
);
same(groups.find((g) => g.id === 'imaging').sections, [
  ['ct', 'CT'],
  ['mri', 'MRI'],
  ['xray', 'X-ray'],
  ['ultrasound', 'Ultrasound'],
]);
same(
  (await readContentJson('content/learning-resources.v1.json')).resources
    .length,
  0,
);
console.log(
  JSON.stringify({
    checks,
    milestoneBodyDrafts: 6,
    milestoneBodyPending: 1016,
    currentBodyDrafts: 53,
    shoulderDrafts: 3,
    shoulderPending: 6,
    originalEightTopicsPreserved: true,
    browserQA: false,
  }),
);
