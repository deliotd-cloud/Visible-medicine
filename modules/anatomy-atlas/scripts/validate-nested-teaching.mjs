import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = await build({
  stdin: {
    contents: `export { bodyDisplayCatalog } from './lib/body-display-catalog';
    export { nestedStudyTargets } from './lib/nested-anatomy';
    export { nestedTeachingFor, nestedTopicLesson, nestedTeachingReferences } from './lib/nested-teaching';
    export { nestedConcepts } from './content/nested-teaching';
    export { NestedTeaching } from './app/nested-teaching';
    export { eyeCatalog as eye } from './lib/eye-layers';
    export { ventricleCatalog as ventricles } from './lib/ventricles';
    export { brainstemCatalog as brainstem } from './lib/brainstem';
    export { cerebralCatalog as cerebral } from './lib/cerebral';
    export { cardiacCatalog as cardiac } from './lib/cardiac';
    export { pulmonaryCatalog as pulmonary } from './lib/pulmonary';
    export { hepaticCatalog as hepatic } from './lib/hepatic';`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  require,
});
const api = scope.exports;
const copy = (value) => JSON.parse(JSON.stringify(value));
let checks = 0;
const check = (value, message) => {
  checks++;
  assert(value, message);
};
const same = (actual, expected, message) => {
  checks++;
  assert.deepEqual(copy(actual), copy(expected), message);
};
const catalog = api.bodyDisplayCatalog(
  JSON.parse(
    await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  ),
);
const targets = api.nestedStudyTargets(catalog);
const initial = JSON.stringify(catalog);
same(targets.length, 53);
same(api.nestedConcepts.length, 33);
same(new Set(api.nestedConcepts.map((c) => c.id)).size, 33);
// Captured from validated v103 source aaa85b4c, before the chamber extension.
const digest = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
same(
  digest(api.nestedConcepts.filter((c) => c.study !== 'cardiac')),
  'e64105fe2f4453e7074c2ef93c3ce009807c701d1895f4bff00831d7760173bf',
  'Unrelated nested teaching unchanged',
);
same(
  digest(
    api.nestedConcepts
      .filter((c) => c.study === 'cardiac')
      .map((c) => ({
        id: c.id,
        study: c.study,
        fmaIds: c.fmaIds,
        anatomy: c.sections.anatomy,
        function: c.sections.function,
        modelLimit: c.modelLimit,
        quiz: c.quiz,
      })),
  ),
  '1e4ee703f753c8b5f7324599618916f526ab73437abffd9bd85b271d9a80dd3f',
  'Existing cardiac identities, core notes, model limits and questions unchanged',
);
const topics = [
  'anatomy',
  'function',
  'clinical',
  'pathology',
  'ct',
  'mri',
  'ultrasound',
  'quiz',
];
const coverage = Object.fromEntries(
  topics.map((t) => [t, { draft: 0, pending: 0 }]),
);
const seen = new Set();
const answerKeys = new Set();
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}
for (const target of targets) {
  const parent = catalog.structures.find((s) => s.id === target.parentId);
  const selected = target.structure;
  const concept = api.nestedTeachingFor(parent, target.study, selected);
  check(concept, selected.id);
  seen.add(concept.id);
  check(concept.fmaIds.includes(selected.fmaId));
  for (const topic of topics) {
    const lesson = api.nestedTopicLesson(concept, topic);
    check(lesson.body.trim());
    check(Object.hasOwn(coverage[topic], lesson.readiness));
    coverage[topic][lesson.readiness]++;
    if (['ct', 'mri', 'ultrasound'].includes(topic)) {
      if (concept.study === 'cardiac') {
        same(lesson.readiness, 'draft');
        same(lesson.body, concept.imaging[topic].body);
        same(
          lesson.citations,
          concept.imaging[topic].references.map(
            (ref) => api.nestedTeachingReferences[ref].url,
          ),
        );
        check(lesson.note.includes('specialist review pending'));
        check(lesson.note.includes('No scan access or synchronization'));
      } else {
        same(lesson.readiness, 'pending');
        check(!lesson.citations?.length);
        check(!concept.imaging, 'No unrequested imaging expansion');
      }
      check(lesson.note.includes('not a scan'));
    } else if (topic === 'quiz' && concept.quiz.basis === 'model-scope') {
      same(lesson.citations, []);
      check(lesson.note.includes('source-model scope'));
    } else if (lesson.readiness === 'draft')
      check(
        lesson.citations.length > 0,
        `${concept.id}/${topic}: draft references`,
      );
  }
  const clean = JSON.stringify(concept);
  concept.quiz.answer = 'mutated';
  concept.fmaIds.push('FMA0');
  concept.sections.anatomy.references.length = 0;
  if (concept.imaging) {
    concept.imaging.ct.body = 'mutated imaging';
    concept.imaging.ct.references.length = 0;
  }
  same(
    JSON.stringify(api.nestedTeachingFor(parent, target.study, selected)),
    clean,
    'Detached teaching result',
  );
  for (const field of [
    'id',
    'name',
    'fmaId',
    'laterality',
    'bundle',
    'nodeName',
    'file',
  ]) {
    const changed = copy(selected);
    changed[field] = 'mismatch';
    same(
      api.nestedTeachingFor(parent, target.study, changed),
      null,
      `Changed child ${field}`,
    );
    const changedParent = copy(parent);
    changedParent[field] = 'mismatch';
    same(
      api.nestedTeachingFor(changedParent, target.study, selected),
      null,
      `Changed parent ${field}`,
    );
  }
  const geometry = copy(selected);
  geometry.center[0] += 0.001;
  same(api.nestedTeachingFor(parent, target.study, geometry), null);
  for (const field of ['file', 'sha256']) {
    const changed = copy(selected);
    changed.sources[0][field] = 'mismatch';
    same(
      api.nestedTeachingFor(parent, target.study, changed),
      null,
      `Changed source ${field}`,
    );
  }
  for (const otherStudy of [
    'eye',
    'ventricles',
    'brainstem',
    'cerebral',
  ].filter((s) => s !== target.study))
    same(api.nestedTeachingFor(parent, otherStudy, selected), null);
  const bundle = api[target.study].bundles.find(
    (b) => b.id === selected.bundle,
  );
  check(bundle, 'Runtime bundle found');
  const originalHash = bundle.sha256;
  bundle.sha256 = '0'.repeat(64);
  same(
    api.nestedTeachingFor(parent, target.study, selected),
    null,
    'Changed runtime GLB digest rejects lesson',
  );
  bundle.sha256 = originalHash;
  check(api.nestedTeachingFor(parent, target.study, selected));

  const props = { parent, study: target.study, selected };
  const tree = api.NestedTeaching(props);
  same(tree.type, 'details');
  check(!tree.props.open, 'Teaching collapsed by default');
  const nodes = elements(tree);
  const cleanConcept = JSON.parse(clean);
  if (target.study === 'cardiac') {
    for (const topic of ['ct', 'mri', 'ultrasound']) {
      const lesson = api.nestedTopicLesson(cleanConcept, topic);
      const sectionNode = nodes.find(
        (n) => n.props?.['aria-label'] === lesson.title,
      );
      check(sectionNode, 'Imaging section is present in existing topic tree');
      const sectionHtml = renderToStaticMarkup(sectionNode);
      check(sectionHtml.includes('Teaching references'));
      check(sectionHtml.includes('specialist review pending'));
      for (const url of lesson.citations) check(sectionHtml.includes(url));
      check(!sectionHtml.includes('Content pending'));
    }
  }
  const answer = nodes.find(
    (n) => n.props?.className === 'nested-teaching-answer',
  );
  check(answer && !answer.props.open, 'Answer collapsed');
  same(answer.key, `${target.study}:${selected.id}`);
  answerKeys.add(answer.key);
  same(
    nodes.filter((n) => n.props?.className === 'nested-teaching-section')
      .length,
    7,
  );
  const html = renderToStaticMarkup(
    React.createElement(api.NestedTeaching, props),
  );
  check(html.includes('Learn more'));
  check(html.includes('specialist review pending'));
  check(html.includes('Unscored recall practice'));
  check(html.includes('Teaching references'));
  check(!html.includes('undefined'));
  same(
    api.nestedTeachingFor(parent, target.study, { ...selected, id: 'unknown' }),
    null,
  );
}
same(seen.size, 33);
same(
  answerKeys.size,
  53,
  'Changing either study or side resets revealed answer',
);
same(coverage.pathology, { draft: 37, pending: 16 });
same(coverage.clinical, { draft: 41, pending: 12 });
for (const tab of ['anatomy', 'function', 'quiz'])
  same(coverage[tab], { draft: 53, pending: 0 });
for (const tab of ['ct', 'mri', 'ultrasound'])
  same(coverage[tab], { draft: 4, pending: 49 });
same(JSON.stringify(catalog), initial, 'Read-only catalog');
const wordsBySource = {};
const hosts = new Set([
  'www.heart.org',
  'www.radiologyinfo.org',
  'jcmr-online.biomedcentral.com',
  'www.asecho.org',
  'anatomy.ttuhscep.edu',
  'www.niddk.nih.gov',
  'training.seer.cancer.gov',
  'www.nhlbi.nih.gov',
  'www.vhlab.umn.edu',
  'www.nei.nih.gov',
  'www.niams.nih.gov',
  'www.ninds.nih.gov',
  'meshb.nlm.nih.gov',
  'meshb-prev.nlm.nih.gov',
  'nba.uth.tmc.edu',
]);
for (const concept of api.nestedConcepts) {
  check(concept.modelLimit.trim());
  check(concept.quiz.question.trim() && concept.quiz.answer.trim());
  same(
    concept.quiz.basis,
    concept.quiz.references.length ? 'primary-reference' : 'model-scope',
  );
  const sections = [
    ...Object.values(concept.sections),
    ...Object.values(concept.imaging ?? {}),
    {
      body: concept.quiz.question + ' ' + concept.quiz.answer,
      references: concept.quiz.references,
      readiness: 'draft',
      modelScope: concept.quiz.basis === 'model-scope',
    },
  ];
  for (const section of sections) {
    check(section.body.trim());
    if (section.readiness === 'draft' && !section.modelScope)
      check(section.references.length > 0);
    else same(section.references, []);
    for (const ref of section.references) {
      const source = api.nestedTeachingReferences[ref];
      check(source?.title && source.url);
      const url = new URL(source.url);
      check(url.protocol === 'https:' && hosts.has(url.hostname));
      wordsBySource[ref] =
        (wordsBySource[ref] ?? 0) + section.body.trim().split(/\s+/).length;
    }
  }
}
same(Object.keys(wordsBySource).length, 37);
same(
  new Set(Object.values(api.nestedTeachingReferences).map((ref) => ref.url))
    .size,
  37,
  'Do not split one source into duplicate reference keys',
);
for (const concept of api.nestedConcepts.filter((c) => c.study === 'cardiac')) {
  const missing = copy(concept);
  delete missing.imaging;
  for (const tab of ['ct', 'mri', 'ultrasound']) {
    const fallback = api.nestedTopicLesson(missing, tab);
    same(fallback.readiness, 'pending');
    check(!fallback.citations?.length);
    check(fallback.body.includes('have not yet been added'));
  }
}
for (const [ref, words] of Object.entries(wordsBySource))
  check(words <= 200, `Conservative source word budget: ${ref} ${words}`);
console.log({
  passed: true,
  checks,
  concepts: seen.size,
  representations: targets.length,
  references: Object.keys(wordsBySource).length,
  coverage,
  collapsedTeaching: true,
  browserAcceptance: false,
  clinicalApproval: false,
  externalImagingOrPaidLectureAccessAdded: false,
});
