import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  contentContext,
  contentValidator,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeHipImaging } from './hip-imaging-history.mjs';
import { authoringBeforeWristImaging } from './wrist-imaging-history.mjs';
const context = await contentContext(),
  { api, catalog, body, registry } = context;
const afterHip = authoringBeforeWristImaging(context);
const previous = authoringBeforeHipImaging(context),
  pins = await readContentJson('content/hip-imaging-pins.json'),
  before = await readContentJson('content/hip-imaging.before.json');
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(
  hash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        api.contentTabs.map((t) => [t, previous.bodyLesson(s, t)]),
      ),
    })),
    shoulder: api.structures,
    recipes: previous.dissectionProfiles,
  }),
  before.allLessonsAndRecipesHash,
  'Every earlier lesson and study recipe preserved',
);
assert.equal(pins.sourceVersion, catalog.sourceVersion);
assert.deepEqual(pins.coordinateSystem, catalog.coordinateSystem);
assert.deepEqual(
  pins.bundles,
  catalog.bundles.filter((b) => pins.bundles.some((p) => p.id === b.id)),
);
const admitted = new Map(pins.entries.map((e) => [e.identity.id, e]));
assert.equal(admitted.size, 26);
assert.equal(
  pins.entries.filter((e) => e.identity.laterality === 'right').length,
  13,
);
assert.equal(
  pins.entries.filter((e) => e.identity.laterality === 'left').length,
  13,
);
let sections = 0,
  unchangedSections = 0,
  rejectedBindings = 0,
  renders = 0;
const topics = new Set(),
  validate = await contentValidator(registry);
for (const s of catalog.structures) {
  const record = body.find((r) => r.id === s.id);
  assert(validate(record));
  for (const tab of api.contentTabs) {
    const lesson = api.hipImagingLesson(s, tab);
    if (!admitted.has(s.id) || !before.tabs.includes(tab)) {
      assert.equal(lesson, undefined);
      assert.deepEqual(afterHip.bodyLesson(s, tab), previous.bodyLesson(s, tab));
      unchangedSections++;
      continue;
    }
    sections++;
    topics.add(admitted.get(s.id).group + '/' + tab);
    assert.equal(previous.bodyLesson(s, tab).readiness, 'pending');
    assert.deepEqual(api.bodyLesson(s, tab), lesson);
    assert.deepEqual(record.content[tab], lesson);
    assert.equal(lesson.readiness, 'draft');
    assert(lesson.title.startsWith(s.name + ' · '));
    assert(
      lesson.note.includes('review pending') &&
        lesson.note.includes('No patient images') &&
        lesson.note.includes('paid-lecture access'),
    );
    assert.equal(lesson.bullets.length, 4);
    assert(lesson.citations.length > 0);
    for (const url of lesson.citations)
      assert.equal(new URL(url).protocol, 'https:');
    const expected = structuredClone(lesson);
    lesson.bullets.push('consumer mutation');
    lesson.citations.length = 0;
    assert.deepEqual(api.hipImagingLesson(s, tab), expected);
    assert.equal(record.validation.clinicalApproval, 'not-included');
    assert.deepEqual(record.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
  }
}
assert.equal(sections, 78);
assert.equal(topics.size, 18);
assert.equal(unchangedSections, 9120);
assert.deepEqual(
  Object.fromEntries(
    ['ct', 'mri', 'xray', 'ultrasound'].map((t) => [
      t,
      catalog.structures.filter((s) => afterHip.bodyLesson(s, t).readiness === 'draft').length,
    ]),
  ),
  { ct: 90, mri: 92, xray: 53, ultrasound: 41 },
);
const rows = (
  await readFile('../work/bodyparts3d/isa_element_parts.txt', 'utf8')
)
  .trim()
  .split(/\r?\n/)
  .map((l) => l.split('\t'));
for (const { identity: s } of pins.entries) {
  assert.equal(s.sourceTree, 'isa');
  assert.deepEqual(
    rows.filter((r) => r[0] === s.fmaId).map((r) => [r[1], r[2]]),
    [[s.sourceName, s.sources.map((p) => p.file).join(',')]],
  );
  for (const change of [
    (s) => {
      s.id += '-foreign';
    },
    (s) => {
      s.fmaId = 'FMA0';
    },
    (s) => {
      s.name += ' changed';
    },
    (s) => {
      s.sourceName += ' changed';
    },
    (s) => {
      s.laterality = s.laterality === 'left' ? 'right' : 'left';
    },
    (s) => {
      s.sourceTree = 'partof';
    },
    (s) => {
      s.system = 'nerves';
    },
    (s) => {
      s.category = 'nerve';
    },
    (s) => {
      s.region = 'leg';
    },
    (s) => {
      s.regions.push('leg');
    },
    (s) => {
      s.bundle += '-foreign';
    },
    (s) => {
      s.nodeName = 'FMA0';
    },
    (s) => {
      s.bounds.min[0] += 0.1;
    },
    (s) => {
      s.center[0] += 0.1;
    },
    (s) => {
      s.anchor[0] += 0.1;
    },
    (s) => {
      s.sources[0].file += '-foreign';
    },
    (s) => {
      s.sources[0].sha256 = '0'.repeat(64);
    },
    (s) => {
      s.provenance.sourceVersion = '3.0';
    },
    (s) => {
      s.provenance.license = 'unknown';
    },
    (s) => {
      s.validation.anatomicalReview = true;
    },
  ]) {
    const changed = structuredClone(s);
    change(changed);
    for (const tab of before.tabs) {
      assert.equal(api.hipImagingLesson(changed, tab), undefined);
      rejectedBindings++;
    }
  }
}
const find = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const fma of [
  'FMA45891',
  'FMA45892',
  'FMA43886',
  'FMA43887',
  'FMA38930',
  'FMA38931',
])
  for (const tab of before.tabs)
    assert.equal(api.hipImagingLesson(find(fma), tab), undefined);
assert(
  api
    .bodyLesson(find('FMA45888'), 'mri')
    .bullets[0].includes('short head does not arise'),
);
assert(
  api
    .bodyLesson(find('FMA22448'), 'ultrasound')
    .bullets[0].includes('not the semitendinosus'),
);
assert(
  api
    .bodyLesson(find('FMA22459'), 'mri')
    .bullets[0].includes('not independent'),
);
// Render the real existing notes callback, not a replacement view or browser session.
const require = createRequire(import.meta.url),
  React = require('react'),
  { renderToStaticMarkup } = require('react-dom/server');
const source = await readFile('app/body-explorer.tsx', 'utf8'),
  ast = ts.createSourceFile(
    'body.tsx',
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
assert(callback);
const js = ts.transpile(`(${callback})(topic)`, {
  jsx: ts.JsxEmit.React,
  target: ts.ScriptTarget.ES2022,
});
for (const { identity: selected } of pins.entries)
  for (const topic of before.tabs) {
    const html = renderToStaticMarkup(
      runInNewContext(js, {
        React,
        selected,
        topic,
        bodyContent: api.bodyContent,
        catalog,
        side: 'both',
        exam: false,
        ScanLine: () => null,
        WorkspaceModeButton: ({ children }) =>
          React.createElement('button', null, children),
        ComponentImagingNotes: (props) => {
          assert.equal(props.parentId, selected.id);
          assert.equal(props.topic, topic);
          return null;
        },
        openNested: () => {
          throw Error('Reading notes must not open another specimen');
        },
      }),
    );
    assert(html.includes('No imaging study loaded'));
    assert(html.includes('review pending'));
    assert(html.includes(selected.name));
    assert(html.includes('Reference 1'));
    renders++;
  }
console.log(
  JSON.stringify({
    selections: 26,
    sections,
    conceptTopics: topics.size,
    unchangedSections,
    rejectedBindings,
    sourceRowsVerified: 26,
    actualNoteRenders: renders,
    clinicalApproval: 'not-included',
  }),
);
