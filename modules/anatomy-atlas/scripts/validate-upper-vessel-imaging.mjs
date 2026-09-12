import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { bodyDisplayCatalog } from '../lib/body-display-catalog.ts';
import {
  authoringBeforeUpperVesselImaging,
  upperVesselContentHash as hash,
} from './upper-vessel-imaging-history.mjs';
import {
  upperVesselImagingTopics,
  upperVesselImagingReferences,
} from '../content/upper-vessel-imaging.ts';
const context = await contentContext(),
  { api } = context;
const catalog = bodyDisplayCatalog(context.catalog),
  initial = JSON.stringify(catalog);
const before = authoringBeforeUpperVesselImaging({ api, catalog });
const pins = JSON.parse(
  await readFile('content/upper-vessel-imaging-pins.json'),
);
assert.equal(
  hash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        api.contentTabs.map((t) => [t, before.bodyLesson(s, t)]),
      ),
    })),
    shoulder: api.structures,
    recipes: before.dissectionProfiles,
  }),
  pins.previousAllLessonsAndRecipesHash,
  'All earlier body/shoulder teaching and recipes retained',
);
assert.equal(pins.sourceVersion, catalog.sourceVersion);
assert.deepEqual(pins.coordinateSystem, catalog.coordinateSystem);
for (const b of pins.bundles) {
  assert.deepEqual(
    catalog.bundles.find((x) => x.id === b.id),
    b,
  );
  assert.equal(
    createHash('sha256')
      .update(await readFile('public' + b.url.split('?')[0]))
      .digest('hex'),
    b.sha256,
  );
}
assert.equal(pins.entries.length, 14);
assert.equal(
  pins.entries.filter((e) => e.identity.laterality === 'left').length,
  7,
);
const body = api.bodyContentRecords(catalog),
  registry = new Map(
    [...context.shoulder, ...body].map((r) => [
      r.representationScope + '|' + r.id,
      r,
    ]),
  );
const validate = await contentValidator(registry),
  selected = new Map(pins.entries.map((e) => [e.identity.id, e]));
let sections = 0,
  unchanged = 0,
  rejected = 0,
  renders = 0;
const counts = { ct: 0, mri: 0, ultrasound: 0 };
// The shape schema accepts safe local versioned paths; the independently loaded
// registry still rejects foreign paths and changed versions even if well-formed.
const veinRecord = body.find((r) => r.id.includes('medial-brachial-vein'));
for (const path of [
  'https://external.invalid/model.glb', '/models/bodyparts3d/../model.glb',
  '/models/bodyparts3d/x/y/model.glb', '/models/bodyparts3d/x.glb?url=remote',
  '/models/bodyparts3d/brachial-veins/other.glb',
  '/models/bodyparts3d/brachial-veins/brachial-veins.glb?v=' + '0'.repeat(64),
]) {
  const bad = structuredClone(veinRecord); bad.meshBindings[0].assetPath = path;
  assert.throws(() => validate(bad));
}
for (const s of catalog.structures)
  for (const tab of api.contentTabs) {
    const entry = selected.get(s.id),
      lesson = api.upperVesselImagingLesson(s, tab);
    if (!entry?.topics.includes(tab)) {
      assert.equal(lesson, undefined);
      assert.deepEqual(api.bodyLesson(s, tab), before.bodyLesson(s, tab));
      unchanged++;
      continue;
    }
    sections++;
    counts[tab]++;
    assert.equal(lesson.readiness, 'draft');
    assert.equal(before.bodyLesson(s, tab).readiness, 'pending');
    assert.deepEqual(api.bodyLesson(s, tab), lesson);
    const record = body.find((r) => r.id === s.id);
    assert(validate(record));
    assert.deepEqual(record.content[tab], lesson);
    assert.equal(record.validation.clinicalApproval, 'not-included');
    assert.match(lesson.note, /review pending/);
    assert.match(lesson.note, /No patient images/);
    assert.match(lesson.note, /paid-lecture access/);
    const copy = structuredClone(lesson);
    lesson.bullets.length = 0;
    lesson.citations.push('changed');
    assert.deepEqual(api.upperVesselImagingLesson(s, tab), copy);
  }
assert.equal(sections, 34);
assert.deepEqual(counts, { ct: 10, mri: 10, ultrasound: 14 });
for (const e of pins.entries)
  for (const mutate of [
    (s) => {
      s.id += '-changed';
    },
    (s) => {
      s.fmaId = 'FMA999';
    },
    (s) => {
      s.laterality = 'unspecified';
    },
    (s) => {
      s.sourceName += '-changed';
    },
    (s) => {
      s.sources[0].sha256 = 'changed';
    },
    (s) => {
      s.bundle = 'other';
    },
    (s) => {
      s.regions = [];
    },
    (s) => {
      s.bounds.min[0] += 1;
    },
  ]) {
    const bad = structuredClone(e.identity);
    mutate(bad);
    for (const tab of ['ct', 'mri', 'ultrasound']) {
      assert.equal(api.upperVesselImagingLesson(bad, tab), undefined);
      rejected++;
    }
  }
const budgets = {};
for (const group of Object.values(upperVesselImagingTopics))
  for (const topic of Object.values(group))
    for (const key of topic.references)
      budgets[key] =
        (budgets[key] ?? 0) +
        [topic.body, ...topic.bullets].join(' ').split(/\s+/).length;
for (const [key, words] of Object.entries(budgets)) {
  assert(words <= 200, key + ': ' + words);
  assert.equal(new URL(upperVesselImagingReferences[key]).protocol, 'https:');
}
// Execute the real existing notes render callback; do not substitute a new UI.
const require = createRequire(import.meta.url),
  React = require('react');
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
const js = ts.transpile('(' + callback + ')(topic)', {
  jsx: ts.JsxEmit.React,
  target: ts.ScriptTarget.ES2022,
});
for (const e of pins.entries)
  for (const topic of ['ct', 'mri', 'ultrasound']) {
    const selected = e.identity;
    const html = require('react-dom/server').renderToStaticMarkup(
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
        ComponentImagingNotes: () => null,
        openNested: () => {
          throw Error('Reading cannot open anatomy');
        },
      }),
    );
    assert(html.includes('No imaging study loaded'));
    renders++;
    const lesson = api.upperVesselImagingLesson(selected, topic);
    if (e.topics.includes(topic)) {
      assert(html.includes('review pending'));
      for (const href of lesson.citations) assert(html.includes(href));
    } else {
      assert.equal(lesson, undefined);
      assert.equal(api.bodyLesson(selected, topic).readiness, 'pending');
    }
  }
assert.equal(JSON.stringify(catalog), initial);
console.log(
  JSON.stringify({
    selections: pins.entries.length,
    distinctTopicTexts: 10,
    sections,
    counts,
    unchangedSections: unchanged,
    sourceRejections: rejected,
    actualNotesRenders: renders,
    sourceWordCounts: budgets,
    geometryChanged: false,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
