import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  contentContext,
  contentRoot,
  contentValidator,
} from './content-contract-tools.mjs';
import { build } from './workspace-test-build.mjs';
import { authoringBeforePelvicOrganImaging } from './pelvic-organ-imaging-history.mjs';
import transition from '../content/pelvic-organ-imaging.transition.json' with { type: 'json' };
import {
  pelvicOrganImagingTopics,
  pelvicOrganReferences,
  pelvicOrganLandmarks,
  pelvicOrganLandmarkReferences,
  pelvicOrganLimits,
} from '../content/pelvic-organ-imaging.ts';

const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const context = await contentContext(),
  { api } = context,
  rawCatalog = context.catalog,
  catalog = api.bodyDisplayCatalog(rawCatalog);
const original = JSON.stringify(catalog);
const pins = JSON.parse(
  await readFile('content/pelvic-organ-imaging-pins.json', 'utf8'),
);
const expected = {
  bladder: [['FMA15900', 'unpaired', 'FJ3149']],
  prostate: [['FMA9600', 'unpaired', 'FJ3139']],
  seminalVesicle: [
    ['FMA19387', 'right', 'FJ3143'],
    ['FMA19388', 'left', 'FJ3137'],
  ],
  ureter: [
    ['FMA15571', 'right', 'FJ3146'],
    ['FMA15572', 'left', 'FJ3144'],
  ],
  urethra: [['FMA19667', 'unpaired', 'FJ3148']],
  testis: [
    ['FMA7211', 'right', 'FJ3142'],
    ['FMA7212', 'left', 'FJ3138'],
  ],
  epididymis: [
    ['FMA18256', 'right', 'FJ3141'],
    ['FMA18257', 'left', 'FJ3136'],
  ],
};
assert.equal(pins.entries.length, 11);
for (const [group, rows] of Object.entries(expected)) {
  const found = pins.entries
    .filter((e) => e.group === group)
    .map((e) => [
      e.identity.fmaId,
      e.identity.laterality,
      e.identity.sources.map((s) => s.file).join(','),
    ]);
  assert.deepEqual(found.sort(), [...rows].sort());
}
const tables = Object.fromEntries(
  await Promise.all(
    ['isa', 'partof'].map(async (tree) => [
      tree,
      (
        await readFile(
          '../work/bodyparts3d/' + tree + '_element_parts.txt',
          'utf8',
        )
      )
        .trim()
        .split(/\r?\n/)
        .map((r) => r.split('\t')),
    ]),
  ),
);
for (const e of pins.entries) {
  assert.deepEqual(
    catalog.structures.find((s) => s.id === e.identity.id),
    e.identity,
  );
  assert.deepEqual(
    context.catalog.structures.find((s) => s.id === e.identity.id),
    e.identity,
  );
  const rows = tables[e.identity.sourceTree].filter(
    (r) => r[0] === e.identity.fmaId,
  );
  assert.deepEqual(
    [...new Set(rows.map((r) => r[1]))],
    [e.identity.sourceName],
  );
  assert.deepEqual(
    rows.flatMap((r) => r[2].split(',')).sort(),
    e.identity.sources.map((s) => s.file).sort(),
  );
  assert.deepEqual(e.topics, ['ct', 'mri', 'ultrasound', 'xray']);
  assert.deepEqual(
    e.identity.regions,
    e.group === 'ureter' ? ['abdomen', 'pelvis'] : ['pelvis'],
  );
}
assert.equal(pins.sourceVersion, catalog.sourceVersion);
assert.equal(pins.license, catalog.license);
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

// Reconstruct the recorded pending placements for live per-selection checks.
// Later teaching remains live here and is intentionally not compared with an
// old whole-corpus hash.
const before = (s, t) => {
  const e = pins.entries.find((e) => e.identity.id === s.id);
  if (!e?.topics.includes(t)) return api.bodyLesson(s, t);
  assert.deepEqual(s, e.identity);
  assert.equal(e.previous[t].readiness, 'pending');
  return e.previous[t];
};
const historicalSnapshot = (historical) => ({
  body: historical.bodyDisplayCatalog(rawCatalog).structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      api.contentTabs.map((t) => [t, historical.bodyLesson(s, t)]),
    ),
  })),
  shoulder: historical.structures,
  recipes: historical.dissectionProfiles,
});
const root = fileURLToPath(contentRoot);
async function historicalApi(commit) {
  const compiled = await build({
    stdin: {
      contents:
        "export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {dissectionProfiles} from './app/dissection-data'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    plugins: [
      {
        name: 'exact-pelvic-imaging-history',
        setup(builder) {
          builder.onLoad({ filter: /.*/, namespace: 'workspace-test' }, (args) => {
            const path = relative(root, args.path).replaceAll('\\', '/');
            if (path.startsWith('node_modules/')) return;
            assert(!path.startsWith('../'));
            return {
              contents: execFileSync('git', ['show', commit + ':' + path], {
                cwd: root,
                encoding: 'utf8',
                maxBuffer: 16e6,
              }),
              loader:
                { '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' }[
                  extname(path)
                ] || 'js',
              resolveDir: dirname(args.path),
            };
          });
        },
      },
    ],
  });
  return import(
    'data:text/javascript;base64,' +
      Buffer.from(compiled.outputFiles[0].text).toString('base64')
  );
}
const historicalBefore = await historicalApi(pins.sourceCommit);
const historicalAfter = await historicalApi(transition.sourceCommit);
assert.deepEqual(
  historicalAfter.bodyDisplayCatalog(rawCatalog),
  historicalBefore.bodyDisplayCatalog(rawCatalog),
  'Historical source catalog changed during the recorded teaching transition',
);
assert.equal(
  hash(historicalSnapshot(historicalBefore)),
  pins.previousAllLessonsAndRecipesHash,
  'Exact original teaching/recipes changed',
);
assert.deepEqual(
  historicalSnapshot(
    authoringBeforePelvicOrganImaging({
      api: historicalAfter,
      catalog: rawCatalog,
    }),
  ),
  historicalSnapshot(historicalBefore),
  'Historical adapter did not reconstruct the exact original snapshot',
);
const records = api.bodyContentRecords(catalog),
  registry = new Map(
    records.map((r) => [r.representationScope + '|' + r.id, r]),
  ),
  validate = await contentValidator(registry);
let placements = 0,
  unchanged = 0,
  rejected = 0;
for (const s of catalog.structures) {
  const e = pins.entries.find((e) => e.identity.id === s.id),
    record = records.find((r) => r.id === s.id);
  assert(validate(record));
  for (const t of api.contentTabs) {
    const lesson = api.pelvicOrganImagingLesson(s, t);
    if (!e?.topics.includes(t)) {
      assert.equal(lesson, undefined);
      assert.deepEqual(api.bodyLesson(s, t), before(s, t));
      unchanged++;
      continue;
    }
    placements++;
    assert.equal(lesson.readiness, 'draft');
    assert.equal(before(s, t).readiness, 'pending');
    assert.deepEqual(api.bodyLesson(s, t), lesson);
    assert.deepEqual(record.content[t], lesson);
    assert.equal(record.validation.clinicalApproval, 'not-included');
    assert.match(lesson.note, /review pending/);
    assert.match(lesson.note, /No patient images/);
    assert.match(lesson.note, /paid-lecture access/);
    assert(lesson.bullets.includes(pelvicOrganLandmarks[e.group]));
    assert(lesson.bullets.includes(pelvicOrganLimits[e.group]));
    const copy = structuredClone(lesson);
    lesson.bullets.length = 0;
    lesson.citations.push('mutation');
    assert.deepEqual(api.pelvicOrganImagingLesson(s, t), copy);
  }
}
assert.equal(placements, 44);
assert.equal(unchanged, catalog.structures.length * 9 - 44);
for (const e of pins.entries)
  for (const mutate of [
    (s) => (s.id += 'foreign'),
    (s) => (s.name += ' changed'),
    (s) => (s.fmaId = 'FMA000'),
    (s) => (s.laterality = 'midline'),
    (s) => (s.region = 'head-neck'),
    (s) => s.regions.push('hand'),
    (s) => (s.sources[0].sha256 = 'changed'),
    (s) => (s.sources[0].file = 'foreign'),
    (s) => (s.sourceTree = s.sourceTree === 'isa' ? 'partof' : 'isa'),
    (s) => (s.bundle = 'foreign'),
    (s) => (s.nodeName = 'foreign'),
    (s) => (s.anchor[0] += 0.1),
    (s) => (s.bounds.min[0] += 0.1),
    (s) => (s.validation.anatomicalReview = true),
  ]) {
    const bad = structuredClone(e.identity);
    mutate(bad);
    for (const t of e.topics) {
      assert.equal(api.pelvicOrganImagingLesson(bad, t), undefined);
      assert.equal(api.bodyLesson(bad, t).readiness, 'pending');
      rejected++;
    }
  }
const budgets = {},
  unique = new Map(),
  wordCount = (s) => s.match(/\S+/g)?.length || 0;
for (const [group, text] of Object.entries(pelvicOrganLandmarks)) {
  const key = pelvicOrganLandmarkReferences[group];
  budgets[key] = (budgets[key] || 0) + wordCount(text);
}
for (const group of Object.values(pelvicOrganImagingTopics))
  for (const topic of Object.values(group))
    unique.set(JSON.stringify(topic), topic);
for (const topic of unique.values())
  for (const key of topic.references)
    budgets[key] =
      (budgets[key] || 0) + wordCount([topic.body, ...topic.bullets].join(' '));
for (const [key, count] of Object.entries(budgets)) {
  assert(count <= 200, key + ': ' + count);
  assert.equal(new URL(pelvicOrganReferences[key]).protocol, 'https:');
}
// 28 group/modality slots minus three repeated plain-film slots and one shared scrotal-CT slot.
assert.equal(unique.size, 24);
assert.match(
  pelvicOrganImagingTopics.urethra.xray.body,
  /Retrograde urethrography/,
);
assert.match(pelvicOrganImagingTopics.urethra.ultrasound.body, /specialised/i);
assert.match(pelvicOrganLandmarks.testis, /not within the pelvic cavity/);
assert.match(pelvicOrganLandmarks.urethra, /not a female/);
assert.match(pelvicOrganImagingTopics.prostate.mri.bullets[1], /No PI-RADS/);

// Execute the unchanged application's actual notes callback with the new resolver.
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
const js = ts.transpile('(' + callback + ')(topic)', {
  jsx: ts.JsxEmit.React,
  target: ts.ScriptTarget.ES2022,
});
let renders = 0;
for (const { identity: selected, topics } of pins.entries)
  for (const topic of topics) {
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
          throw Error('Reading does not open a specimen');
        },
      }),
    );
    assert(
      html.includes(selected.name) &&
        html.includes('No imaging study loaded') &&
        html.includes('review pending'),
    );
    for (const href of api.pelvicOrganImagingLesson(selected, topic).citations)
      assert(html.includes(href.replaceAll('&', '&amp;')));
    renders++;
  }
const preserved = [
  'app/body-explorer.tsx',
  'app/body-scene.tsx',
  'app/dissection-data.ts',
  'app/anatomy-data.ts',
  'app/local-imaging-workbench.tsx',
  'lib/body-display-catalog.ts',
  'lib/abdominal-organ-imaging.ts',
  'lib/pelvic-organ-clinical-curriculum.ts',
  'lib/organ-curriculum.ts',
  'lib/arm-attachments.ts',
  'package.json',
  'package-lock.json',
  'public/models/bodyparts3d/full-body/catalog.json',
  'drizzle/0002_specimen_review_events.sql',
];
for (const path of preserved)
  assert.equal(
    execFileSync('git', ['show', transition.sourceCommit + ':' + path], {
      encoding: 'utf8',
      maxBuffer: 16e6,
    }).replaceAll('\r\n', '\n'),
    execFileSync('git', ['show', pins.sourceCommit + ':' + path], {
      encoding: 'utf8',
      maxBuffer: 16e6,
    }).replaceAll('\r\n', '\n'),
    path + ' preserved across the recorded historical transition',
  );
assert.equal(JSON.stringify(catalog), original);
const report = {
  schemaVersion: 1,
  sourceCommit: pins.sourceCommit,
  selections: 11,
  groups: 7,
  distinctTopicTexts: unique.size,
  placements,
  modalities: { ct: 11, mri: 11, ultrasound: 11, xray: 11 },
  unchangedSections: unchanged,
  rejectedBindings: rejected,
  sourceRows: 11,
  modelHashes: pins.bundles.length,
  actualNoteRenders: renders,
  historicalSourceVerified: true,
  sourceWordCounts: budgets,
  preservedPaths: preserved,
  clinicalApproval: false,
  browserTesting: false,
  realImaging: false,
};
await writeFile(
  'docs/pelvic-organ-imaging-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report));
