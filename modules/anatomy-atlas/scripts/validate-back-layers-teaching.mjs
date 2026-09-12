import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/back-layers.ts'; export * from './lib/back-layers-teaching.ts'; export * from './content/back-layers-clinical.ts'; export * from './content/back-layers-teaching.ts'; export * from './content/back-bone-teaching.ts'; export { kneeDefinition } from './lib/um-limb-studies.ts'; export { specimenTeachingFor } from './lib/um-limb-teaching.ts';",
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
  backLayersDefinition: def,
  backLayersTeachingFor: lessonFor,
  kneeDefinition: knee,
} = api;
const copy = (v) => JSON.parse(JSON.stringify(v));
let checks = 0;
const ok = (v) => {
    assert(v);
    checks++;
  },
  same = (a, b) => {
    assert.deepEqual(a, b);
    checks++;
  };
const before = JSON.stringify(def),
  muscles = def.surfaces.filter((s) => s.tissue === 'muscle');
const topics = [
  'anatomy',
  'function',
  'clinical',
  'pathology',
  'ct',
  'mri',
  'xray',
  'ultrasound',
];
const labels = {
  clinical: 'Clinical',
  pathology: 'Pathology',
  ct: 'CT',
  mri: 'MRI',
  xray: 'X-ray',
  ultrasound: 'Ultrasound',
};
const counts = {
  clinical: 0,
  pathology: 0,
  ct: 0,
  mri: 0,
  xray: 0,
  ultrasound: 0,
};
const urls = new Set(Object.keys(api.backLayersReferences));
same(muscles.length, 14);
same(
  Object.keys(api.backLayersLessonIds).sort(),
  muscles.map((s) => s.fmaId).sort(),
);
same(Object.keys(api.backLayersClinical).sort(), [
  'latissimus',
  'multifidus',
  'rhomboidMajor',
  'rhomboidMinor',
  'trapezius',
]);
same(
  Object.values(api.backLayersClinical).reduce(
    (n, l) => n + Object.keys(l.topics).length,
    0,
  ),
  17,
);
for (const s of def.surfaces) {
  const lesson = lessonFor(def, s);
  if (s.tissue !== 'muscle') {
    ok(lesson?.anatomy);
    continue;
  }
  ok(lesson);
  const base = api.backLayersLessons[api.backLayersLessonIds[s.fmaId]];
  ok(lesson.anatomy.startsWith(base.anatomy));
  ok(lesson.function.startsWith(base.function));
  for (const field of ['proximal', 'distal', 'motor'])
    ok(lesson.attachments[field].length > 15);
  for (const [topic, draft] of Object.entries(lesson.extended.topics)) {
    counts[topic]++;
    same(draft.readiness, 'draft');
    ok(draft.body.length > 100);
    ok(draft.references.length > 0);
    ok(
      draft.references.every(
        (u) => urls.has(u) && new URL(u).protocol === 'https:',
      ),
    );
  }
  ok(lesson.extended.modelLimit.length > 90);
  ok(lesson.extended.selfCheck.question.length > 35);
  ok(lesson.extended.selfCheck.references.every((u) => urls.has(u)));
  if (s.sourceName.includes('multifidus'))
    ok(
      lesson.function.includes(
        `towards the ${s.laterality === 'right' ? 'left' : 'right'};`,
      ),
    );
  const part = api.backLayersPartNotes[s.fmaId];
  if (part) ok(lesson.function.includes(part));
  const intact = copy(lesson);
  lesson.anatomy = 'changed';
  lesson.attachments.motor = 'changed';
  lesson.extended.topics.mri.body = 'changed';
  lesson.extended.topics.mri.references.push('changed');
  lesson.extended.selfCheck.answer = 'changed';
  lesson.extended.selfCheck.references.push('changed');
  same(lessonFor(def, s), intact);
  for (const field of [
    'id',
    'fmaId',
    'sourceName',
    'name',
    'laterality',
    'tissue',
    'bundle',
    'nodeName',
  ])
    same(lessonFor(def, { ...s, [field]: 'foreign' }), null);
  same(
    lessonFor(def, {
      ...s,
      sources: [{ ...s.sources[0], sha256: '0'.repeat(64) }],
    }),
    null,
  );
}
same(counts, {
  clinical: 14,
  pathology: 12,
  ct: 2,
  mri: 14,
  xray: 0,
  ultrasound: 4,
});
same(Object.keys(api.backLayersPartNotes).sort(), [
  'FMA33581',
  'FMA33583',
  'FMA33584',
  'FMA33585',
  'FMA33586',
  'FMA33587',
]);
same(new Set(Object.values(api.backLayersPartNotes)).size, 3);
const mutations = [
  (d) => (d.key = 'foreign'),
  (d) => (d.source.version = '4.0'),
  (d) => (d.source.license = 'MIT'),
  (d) => (d.catalog.coordinateSystem.sourceToSceneColumnMajor[12] += 0.5),
  (d) => (d.catalog.bundles[0].sha256 = '0'.repeat(64)),
  (d) => (d.catalog.bundles[0].url = '/foreign.glb'),
  (d) => (d.surfaces[0].sources[0].sha256 = '0'.repeat(64)),
  (d) => (d.catalog.structures[0].anchor[0] += 0.1),
  (d) => d.studies[0].ids.pop(),
  (d) => d.surfaces.reverse(),
];
for (const mutate of mutations) {
  const bad = copy(def);
  mutate(bad);
  same(lessonFor(bad, muscles[0]), null);
}
same(lessonFor(knee, muscles[0]), null);
same(lessonFor(def, knee.surfaces[0]), null);
same(JSON.stringify(def), before);
// Actual Learn component; stub only the unrelated WebGL boundary. Not device QA.
const component = await componentBuild({
  stdin: {
    contents:
      "export { BackLayersTeaching, backLayersSupplement } from './app/back-layers-study.tsx'; export { KneeSpecimenView } from './app/um-knee-study.tsx';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  plugins: [
    {
      name: 'scene-boundary',
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
    URLSearchParams,
    console,
    process: { env: { NODE_ENV: 'test' } },
  };
runInNewContext(component.outputFiles[0].text, context);
const render = (name, props) =>
  require('react-dom/server').renderToStaticMarkup(
    React.createElement(mod.exports[name], props),
  );
const escape = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
let topicRenders = 0,
  pendingRenders = 0;
for (const surface of muscles)
  for (const topic of topics) {
    const lesson = lessonFor(def, surface),
      html = render('BackLayersTeaching', {
        surface,
        definition: def,
        initialTopic: topic,
      });
    topicRenders++;
    const body = ['anatomy', 'function'].includes(topic)
      ? lesson[topic]
      : lesson.extended.topics[topic]?.body;
    if (body) ok(html.includes(escape(body)));
    else {
      ok(html.includes(labels[topic] + ' teaching is pending'));
      pendingRenders++;
    }
    ok(html.includes('specialist review pending'));
    ok(html.includes('Clinical self-check'));
    same(html.includes('Teaching unavailable'), false);
    if (topic === 'anatomy') {
      ok(html.includes('<dt>Origin</dt>'));
      ok(html.includes('<dt>Insertion</dt>'));
    }
    if (['ct', 'mri', 'xray', 'ultrasound'].includes(topic))
      ok(
        html.includes(
          'No patient images, scan alignment or measured pathology',
        ),
      );
  }
same(topicRenders, 112);
same(pendingRenders, 38);
same(
  /<details[^>]* open/.test(
    render('BackLayersTeaching', { surface: muscles[0], definition: def }),
  ),
  false,
);
const bones = def.surfaces.filter((s) => s.tissue === 'skeleton');
same(bones.length, 34);
same(
  Object.keys(api.backBoneBindings).sort(),
  bones.map((s) => s.fmaId).sort(),
);
same(Object.keys(api.backBoneConcepts).length, 12);
const boneCounts = {
  clinical: 0,
  pathology: 0,
  ct: 0,
  mri: 0,
  xray: 0,
  ultrasound: 0,
};
let boneTopicRenders = 0,
  bonePendingRenders = 0,
  boneRejections = 0;
for (const bone of bones) {
  const lesson = lessonFor(def, bone),
    saved = copy(lesson);
  same(
    lesson.attachments,
    undefined,
    'No fictitious bone motor supply/attachment fields',
  );
  same(lesson, api.authoredBackBoneLesson(api.backBoneBindings[bone.fmaId]));
  for (const url of [
    ...lesson.references,
    ...lesson.extended.selfCheck.references,
  ])
    ok(urls.has(url));
  for (const [topic, draft] of Object.entries(lesson.extended.topics)) {
    boneCounts[topic]++;
    same(draft.readiness, 'draft');
    ok(draft.body.length > 100);
    ok(
      draft.references.length > 0 && draft.references.every((u) => urls.has(u)),
    );
    draft.body = 'changed';
    draft.references.push('changed');
  }
  lesson.references.push('changed');
  lesson.extended.selfCheck.answer = 'changed';
  lesson.extended.selfCheck.references.push('changed');
  same(
    lessonFor(def, bone),
    saved,
    'Bone records detach nested arrays and topic data',
  );
  for (const field of [
    'id',
    'fmaId',
    'sourceName',
    'name',
    'laterality',
    'tissue',
    'bundle',
    'nodeName',
  ]) {
    same(lessonFor(def, { ...bone, [field]: 'foreign' }), null);
    boneRejections++;
  }
  const changed = copy(bone);
  changed.sources[0].sha256 = '0'.repeat(64);
  same(lessonFor(def, changed), null);
  boneRejections++;
  same(lessonFor(knee, bone), null);
  boneRejections++;
  same(
    /<details[^>]* open/.test(
      render('BackLayersTeaching', { surface: bone, definition: def }),
    ),
    false,
  );
  for (const topic of topics) {
    const html = render('BackLayersTeaching', {
      surface: bone,
      definition: def,
      initialTopic: topic,
    });
    boneTopicRenders++;
    const body = ['anatomy', 'function'].includes(topic)
      ? saved[topic]
      : saved.extended.topics[topic]?.body;
    if (body) ok(html.includes(escape(body)));
    else {
      ok(html.includes(labels[topic] + ' teaching is pending'));
      bonePendingRenders++;
    }
    ok(html.includes('specialist review pending'));
    ok(html.includes(escape(saved.extended.selfCheck.question)));
    same(html.includes('Teaching unavailable'), false);
    same(html.includes('<dt>Origin</dt>'), false);
    same(html.includes('<dt>Motor supply</dt>'), false);
    if (['ct', 'mri', 'xray', 'ultrasound'].includes(topic))
      ok(
        html.includes(
          'No patient images, scan alignment or measured pathology',
        ),
      );
  }
}
same(boneCounts, {
  clinical: 33,
  pathology: 26,
  ct: 33,
  mri: 27,
  xray: 26,
  ultrasound: 0,
});
same(boneTopicRenders, 272);
same(bonePendingRenders, 59);
same(JSON.stringify(def), before);
const bad = copy(def);
bad.catalog.coordinateSystem.sourceToSceneColumnMajor[12] += 0.5;
for (const bone of bones) same(lessonFor(bad, bone), null);
ok(
  render('BackLayersTeaching', {
    surface: muscles[0],
    definition: bad,
  }).includes('Teaching unavailable'),
);
ok(
  render('KneeSpecimenView', {
    specimen: bad,
    supplement: mod.exports.backLayersSupplement,
  }).includes('Teaching unavailable'),
);
console.log(
  JSON.stringify({
    checks,
    muscles: muscles.length,
    extendedTopics: counts,
    distinctTopicTexts: 17,
    topicRenders,
    pendingRenders,
    bones: bones.length,
    boneConcepts: Object.keys(api.backBoneConcepts).length,
    boneExtendedTopics: boneCounts,
    boneTopicRenders,
    bonePendingRenders,
    boneRejections,
    sourceFrameMutationsRejected: mutations.length,
    browserOrClinicalAcceptance: false,
  }),
);
