import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { hraDigest } from './hra-pelvis-source.mjs';
import { execFileSync } from 'node:child_process';
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
  hraPelvicContextReferenceTitles: contextTitles,
} = api;
const source = JSON.stringify(def),
  rows = def.surfaces.filter((s) => bindings[s.id]),
  urls = new Set(Object.values(references).map((r) => r.url));
assert.equal(rows.length, 41);
assert.equal(Object.keys(bindings).length, 41);
assert.equal(Object.keys(concepts).length, 28);
assert.equal(new Set(rows.map((s) => lessonFor(def, s).anatomy)).size, 28);
assert.equal(
  new Set(rows.map((s) => lessonFor(def, s).extended.selfCheck.question)).size,
  28,
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
    // Only the two exact existing renal ureters extend the pelvic context.
    assert(['VH_F_right_ureter', 'VH_F_left_ureter'].includes(s.sourceName));
    assert(lesson?.anatomy && lesson?.function);
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
  clinical: 41,
  pathology: 41,
  ct: 41,
  mri: 41,
  xray: 41,
  ultrasound: 41,
});
// The historical expansion retains its exact delivered lessons. The separate
// topic-completion test checks the current additive transition from this milestone.
const milestoneSource = execFileSync('git', ['show',
  '944f57b801471c3b005a64ec83314188b2f06cf5:content/hra-pelvic-teaching.ts'], { encoding: 'utf8' });
const milestoneBuild = await build({
  stdin: { contents: milestoneSource, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const milestoneApi = await import('data:text/javascript;base64,' +
  Buffer.from(milestoneBuild.outputFiles[0].text).toString('base64'));
// Explicit original expansion contract: all 31 earlier source lessons identical.
const oldSource = execFileSync(
  'git',
  [
    'show',
    '3e1c297abae999015f18c286847dd070d2fe86f6:content/hra-pelvic-teaching.ts',
  ],
  { encoding: 'utf8' },
);
const oldBuild = await build({
  stdin: { contents: oldSource, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const oldApi = await import(
  'data:text/javascript;base64,' +
    Buffer.from(oldBuild.outputFiles[0].text).toString('base64')
);
for (const [id, concept] of Object.entries(oldApi.hraPelvicLessonBindings)) {
  assert.equal(bindings[id], concept);
  assert.deepEqual(
    milestoneApi.authoredHraPelvicLesson(concept),
    oldApi.authoredHraPelvicLesson(concept),
  );
}
assert.equal(Object.keys(oldApi.hraPelvicLessonBindings).length, 31);
const additions = rows.filter((s) => !oldApi.hraPelvicLessonBindings[s.id]);
assert.deepEqual(
  additions.map((s) => s.slug).sort(),
  [
    'cervicovaginal-junction', 'rectum', 'fundus-of-urinary-bladder-dome',
    'fundus-of-urinary-bladder-base', 'urinary-bladder-neck-smooth-muscle',
    'left-uterine-artery', 'right-uterine-artery',
    'left-uterine-vein', 'right-uterine-vein', 'sacrum',
  ].sort(),
);
assert(concepts.vesicouterine.anatomy.includes('peritoneal recess'));
assert(concepts.vesicouterine.function.includes('rather than an organ'));
assert(concepts.suspensory.anatomy.includes('pelvic brim'));
assert(concepts.ovarianLigament.function.includes('not a duct'));
assert(concepts.mesosalpinx.anatomy.includes('uterine tube'));
assert(concepts.mesovarium.anatomy.includes('ovary'));
assert(concepts.junction.answer.includes('epithelial transition'));
assert(concepts.bladderBase.anatomy.includes('not a separate mesh of the internal trigone'));
assert(concepts.bladderNeck.anatomy.includes('skeletal external urethral sphincter'));
assert(concepts.rectum.answer.includes('different boundaries'));
assert(concepts.uterineArtery.answer.includes('uterine artery'));
assert(concepts.uterineVein.answer.includes('symptoms or reflux'));
assert(concepts.sacrum.answer.includes('radiographically occult'));
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
  actualLink = await import('vinext/shims/link'),
  React = require('react'),
  mod = { exports: {} },
  context = {
    module: mod,
    exports: mod.exports,
    require: id => id === 'next/link' ? { __esModule: true, ...actualLink } : require(id),
    URL,
    structuredClone,
    console,
    process: { env: { NODE_ENV: 'test' } },
  };
runInNewContext(component.outputFiles[0].text, context);
const render = require('react-dom/server').renderToStaticMarkup;
const paragraph = (body) => render(React.createElement('p', null, body));
let renderedTopics = 0;
for (const s of def.surfaces) {
  const lesson = lessonFor(def, s);
  for (const topic of ['anatomy', 'function', ...Object.keys(counts)]) {
    const html = render(
      React.createElement(mod.exports.SpecimenLearning, {
        definition: def,
        selected: s,
        initialTopic: topic,
        resolveLesson: lessonFor,
        referenceTitles: contextTitles,
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
    assert(body, s.id + ' ' + topic + ': every current topic authored');
    assert(html.includes(paragraph(body)), s.id + ' ' + topic);
    assert(!html.includes('teaching is pending for this source selection'));
    if (['ct', 'mri', 'xray', 'ultrasound'].includes(topic))
      assert(
        html.includes(
          'No patient images, scan alignment or measured pathology',
        ),
      );
    renderedTopics++;
  }
}
// All current surfaces have a lesson; an unknown source must still fail closed.
const missing = { ...def.surfaces[0], id: 'foreign-source-selection' };
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
    sourceBoundSelections: rows.length,
    distinctConcepts: Object.keys(concepts).length,
    topicDrafts: counts,
    totalExtendedDrafts: Object.values(counts).reduce((a, b) => a + b, 0),
    reusedRenalLessons: 2,
    pendingSelections: def.surfaces.filter(s => !lessonFor(def,s)).length,
    selfChecks: rows.length,
    preservedEarlierLessons: Object.keys(oldApi.hraPelvicLessonBindings).length,
    renderedTopics,
    geometryUnchanged: true,
    clinicalOrImagingApproval: false,
  }),
);
