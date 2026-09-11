import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { hraDigest } from './hra-pelvis-source.mjs';
const compiled = await build({
  stdin: {
    contents:
      "export * from './content/hra-pelvic-teaching.ts'; export * from './lib/hra-pelvis-teaching.ts'; export { hraPelvisDefinition } from './lib/hra-pelvis.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const {
  hraPelvisDefinition: def,
  hraPelvicTeaching: lessonFor,
  hraPelvicLessonBindings: bindings,
  hraPelvicConcepts: concepts,
  hraPelvicReferences: references,
  hraPelvicReferenceTitles: titles,
} = api;
const source = JSON.stringify(def),
  rows = def.surfaces.filter((s) => bindings[s.id]),
  urls = new Set(Object.values(references).map((r) => r.url));
assert.equal(rows.length, 17);
assert.equal(Object.keys(bindings).length, 17);
assert.equal(Object.keys(concepts).length, 12);
assert.equal(new Set(rows.map((s) => lessonFor(def, s).anatomy)).size, 12);
assert.equal(
  new Set(rows.map((s) => lessonFor(def, s).extended.selfCheck.question)).size,
  12,
);
const counts = {
  clinical: 0,
  pathology: 0,
  ct: 0,
  mri: 0,
  xray: 0,
  ultrasound: 0,
};
for (const s of def.surfaces) {
  const lesson = lessonFor(def, s);
  if (!bindings[s.id]) {
    assert.equal(lesson, null);
    continue;
  }
  assert.equal(lesson.anatomy, concepts[bindings[s.id]].anatomy);
  assert.equal(lesson.function, concepts[bindings[s.id]].function);
  assert(lesson.extended.modelLimit.includes('No measured tissue signal'));
  for (const url of [
    ...lesson.references,
    ...lesson.extended.selfCheck.references,
  ])
    assert(urls.has(url) && url.startsWith('https://'));
  for (const [topic, draft] of Object.entries(lesson.extended.topics)) {
    counts[topic]++;
    assert.equal(draft.readiness, 'draft');
    assert(draft.body && draft.references.length);
    assert(draft.references.every((url) => urls.has(url)));
  }
  // Caller mutation cannot change a later lesson or spread across paired sides.
  lesson.extended.topics.mri.body = 'corrupted';
  lesson.anatomy = 'corrupted';
  assert.notEqual(lessonFor(def, s).anatomy, 'corrupted');
  assert.notEqual(lessonFor(def, s).extended.topics.mri.body, 'corrupted');
  for (const field of [
    'id',
    'name',
    'slug',
    'tissue',
    'laterality',
    'nodeName',
  ])
    assert.equal(lessonFor(def, { ...s, [field]: 'foreign' }), null);
}
assert.deepEqual(counts, {
  clinical: 17,
  pathology: 17,
  ct: 2,
  mri: 17,
  xray: 0,
  ultrasound: 16,
});
for (const change of [
  (d) => (d.source.version = 'other'),
  (d) => (d.catalog.bundles[0].sha256 = '0'.repeat(64)),
  (d) => (d.catalog.coordinateSystem.sourceToSceneColumnMajor[0] *= -1),
  (d) => d.studies[0].ids.pop(),
]) {
  const bad = JSON.parse(source);
  change(bad);
  for (const s of rows) assert.equal(lessonFor(bad, s), null);
}
assert.equal(JSON.stringify(def), source);
assert.equal(
  hraDigest(await readFile('public/models/hra-pelvis/pelvis.glb')),
  'f18f1f0e3c6e8c0562b6b66864a8d786ffdb9e6a688da9288550fad6e491b866',
);
const component = await componentBuild({
  stdin: {
    contents: "export { SpecimenLearning } from './app/um-limb-learning.tsx';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  plugins: [
    {
      name: 'unused-scene',
      setup(tool) {
        tool.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
          loader: 'js',
          contents:
            'export function BodyScene(){return null;} export function retryBodyAssets(){}',
        }));
      },
    },
  ],
});
const require = createRequire(import.meta.url),
  React = require('react'),
  mod = { exports: {} },
  context = {
    module: mod,
    exports: mod.exports,
    require,
    URL,
    console,
    process: { env: { NODE_ENV: 'test' } },
  };
runInNewContext(component.outputFiles[0].text, context);
const render = require('react-dom/server').renderToStaticMarkup;
const paragraph = (body) => render(React.createElement('p', null, body));
let renderedTopics = 0;
for (const s of rows) {
  const lesson = lessonFor(def, s);
  for (const topic of ['anatomy', 'function', ...Object.keys(counts)]) {
    const html = render(
      React.createElement(mod.exports.SpecimenLearning, {
        definition: def,
        selected: s,
        initialTopic: topic,
        resolveLesson: lessonFor,
        referenceTitles: titles,
      }),
    );
    assert(html.includes('Teaching draft'));
    assert(html.includes('Clinical self-check'));
    const body =
      topic === 'anatomy'
        ? lesson.anatomy
        : topic === 'function'
          ? lesson.function
          : lesson.extended.topics[topic]?.body;
    if (body) assert(html.includes(paragraph(body)), s.id + ' ' + topic);
    else assert(html.includes('teaching is pending for this source selection'));
    if (['ct', 'mri', 'xray', 'ultrasound'].includes(topic))
      assert(
        html.includes(
          'No patient images, scan alignment or measured pathology',
        ),
      );
    renderedTopics++;
  }
}
const missing = def.surfaces.find((s) => !bindings[s.id]);
assert(
  render(
    React.createElement(mod.exports.SpecimenLearning, {
      definition: def,
      selected: missing,
      initialTopic: 'mri',
      resolveLesson: lessonFor,
    }),
  ).includes('Teaching unavailable for this source binding'),
);
console.log(
  JSON.stringify({
    sourceBoundSelections: 17,
    distinctConcepts: 12,
    topicDrafts: counts,
    totalExtendedDrafts: Object.values(counts).reduce((a, b) => a + b, 0),
    pendingSelections: 24,
    selfChecks: 17,
    renderedTopics,
    geometryUnchanged: true,
    clinicalOrImagingApproval: false,
  }),
);
