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
import { authoringBeforeSpineImaging } from './spine-imaging-history.mjs';
import { authoringBeforeHipImaging } from './hip-imaging-history.mjs';
import { authoringBeforeWristImaging } from './wrist-imaging-history.mjs';

const context = await contentContext(),
  { api, catalog, body, registry } = context;
const previous = authoringBeforeSpineImaging(context);
// Remove the separately verified later hip transition for this historical comparison.
const afterSpine = authoringBeforeHipImaging(context);
const afterHip = authoringBeforeWristImaging(context);
const pins = await readContentJson('content/spine-imaging-pins.json');
const before = await readContentJson('content/spine-imaging.before.json');
let checks = 0,
  sections = 0,
  unchangedSections = 0,
  rejectedBindings = 0,
  renders = 0;
const same = (a, b, note) => {
  checks++;
  assert.deepEqual(a, b, note);
};
const check = (a, note) => {
  checks++;
  assert(a, note);
};
same(
  createHash('sha256')
    .update(
      JSON.stringify({
        body: catalog.structures.map((s) => ({
          id: s.id,
          sections: Object.fromEntries(
            api.contentTabs.map((t) => [t, previous.bodyLesson(s, t)]),
          ),
        })),
        shoulder: api.structures,
        recipes: api.dissectionProfiles,
      }),
    )
    .digest('hex'),
  before.allLessonsAndRecipesHash,
  'Exact reconstruction of all prior teaching and study recipes',
);
same(
  createHash('sha256')
    .update(await readFile('public/models/bodyparts3d/full-body/catalog.json'))
    .digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(pins.sourceVersion, catalog.sourceVersion);
same(pins.coordinateSystem, catalog.coordinateSystem);
same(
  pins.bundles,
  catalog.bundles.filter((b) => pins.bundles.some((p) => p.id === b.id)),
);
same(new Set(pins.entries.map((e) => e.identity.id)).size, 47);
same(new Set(pins.entries.map((e) => e.group)).size, 9);
same(pins.entries.filter((e) => e.identity.category === 'bone').length, 25);
same(pins.entries.filter((e) => e.identity.category !== 'bone').length, 22);
const byId = new Map(pins.entries.map((e) => [e.identity.id, e]));
const topics = new Set(),
  validate = await contentValidator(registry);
for (const s of catalog.structures) {
  const record = body.find((r) => r.id === s.id);
  for (const tab of api.contentTabs) {
    const lesson = api.spineImagingLesson(s, tab);
    if (!byId.has(s.id) || !before.tabs.includes(tab)) {
      same(lesson, undefined);
      same(afterSpine.bodyLesson(s, tab), previous.bodyLesson(s, tab));
      unchangedSections++;
      continue;
    }
    sections++;
    topics.add(byId.get(s.id).group + '/' + tab);
    same(lesson, api.bodyLesson(s, tab));
    same(
      lesson,
      record.content[tab],
      'Actual export must contain actual runtime teaching',
    );
    same(lesson.readiness, 'draft');
    same(previous.bodyLesson(s, tab).readiness, 'pending');
    check(lesson.title.startsWith(s.name + ' · '));
    check(lesson.title.endsWith(' · draft'));
    check(lesson.note.includes('review pending'));
    check(lesson.note.includes('No patient images'));
    check(lesson.note.includes('paid-lecture access'));
    for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
    const expected = structuredClone(lesson);
    lesson.bullets.push('mutation');
    lesson.citations.length = 0;
    same(api.spineImagingLesson(s, tab), expected, 'Detached consumer data');
  }
  check(validate(record));
  if (byId.has(s.id)) {
    same(record.validation.status, 'draft');
    same(record.validation.clinicalApproval, 'not-included');
    same(record.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
  }
}
same(sections, 141);
same(topics.size, 27);
same(unchangedSections, 9057);
same(
  Object.fromEntries(
    before.tabs.map((t) => [
      t,
      catalog.structures.filter(
        (s) => previous.bodyLesson(s, t).readiness === 'draft',
      ).length,
    ]),
  ),
  { ct: 17, mri: 19, xray: 6 },
);
same(
  Object.fromEntries(
    before.tabs.map((t) => [
      t,
      catalog.structures.filter((s) => afterHip.bodyLesson(s, t).readiness === 'draft').length,
    ]),
  ),
  { ct: 90, mri: 92, xray: 53 },
);

const sourceRows = (
  await readFile('../work/bodyparts3d/isa_element_parts.txt', 'utf8')
)
  .trim()
  .split(/\r?\n/)
  .map((l) => l.split('\t'));
for (const { identity: s } of pins.entries) {
  same(
    sourceRows.filter((r) => r[0] === s.fmaId).map((r) => [r[1], r[2]]),
    [[s.sourceName, s.sources.map((p) => p.file).join(',')]],
  );
  same(s.laterality, 'midline');
  same(s.sourceTree, 'isa');
  for (const mutate of [
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
      s.laterality = 'left';
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
      s.anchor[0] += 0.1;
    },
    (s) => {
      s.sources[0].file += '-foreign';
    },
    (s) => {
      s.sources[0].sha256 = '0'.repeat(64);
    },
    (s) => {
      s.sources.push(s.sources[0]);
    },
    (s) => {
      s.unreviewedMetadata = true;
    },
  ]) {
    const changed = structuredClone(s);
    mutate(changed);
    for (const tab of before.tabs) {
      same(api.spineImagingLesson(changed, tab), undefined);
      rejectedBindings++;
    }
  }
}
same(
  api.spineImagingLesson(
    {
      id: 'foreign',
      get name() {
        throw Error('Foreign fields traversed');
      },
    },
    'ct',
  ),
  undefined,
);
checks++;
assert.throws(
  () =>
    authoringBeforeSpineImaging({
      catalog,
      api: {
        ...api,
        bodyLesson(s, tab) {
          const lesson = api.bodyLesson(s, tab);
          return s.id === pins.entries[0].identity.id && tab === 'ct'
            ? { ...lesson, body: 'unrecorded change' }
            : lesson;
        },
      },
    }),
  /Unrecorded spinal imaging edit/,
);
checks++;
assert.throws(
  () =>
    previous.bodyLesson({ ...pins.entries[0].identity, name: 'foreign' }, 'ct'),
  /Historical lessons also require exact source identity/,
);
const find = (fma) => catalog.structures.find((s) => s.fmaId === fma);
check(
  api
    .bodyLesson(find('FMA25058'), 'mri')
    .bullets.some((b) => b.includes('no C1–C2')),
);
check(
  api
    .bodyLesson(find('FMA10081'), 'ct')
    .bullets.some((b) => b.includes('unresolved, not normally absent')),
);
check(
  api
    .bodyLesson(find('FMA16202'), 'xray')
    .bullets.some((b) => b.includes('not independently segmented')),
);
check(find('FMA25058').anchor[1] < find('FMA12520').anchor[1]);
check(find('FMA25058').anchor[1] > find('FMA12521').anchor[1]);

// Render the actual existing body-note callback, not a lookalike test component.
const require = createRequire(import.meta.url),
  React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
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
check(callback);
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
          same(props.parentId, selected.id);
          same(props.topic, topic);
          return null;
        },
        openNested: () => {
          throw Error('Reading teaching must not open another specimen');
        },
      }),
    );
    renders++;
    check(html.includes('No imaging study loaded'));
    check(html.includes('review pending'));
    check(html.includes(selected.name));
    check(html.includes('Reference 1'));
  }
console.log(
  JSON.stringify({
    checks,
    sections,
    conceptTopics: topics.size,
    unchangedSections,
    rejectedBindings,
    sourceRowsVerified: pins.entries.length,
    actualNoteRenders: renders,
    clinicalApproval: 'not-included',
  }),
);
