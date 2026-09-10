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
// Captured from validated v105 source 60c5a98d, before the lung extension.
const digest = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
same(
  digest(api.nestedConcepts.filter((c) => c.study !== 'pulmonary')),
  'd2182f88e1d627af7d12ac4f02b9faa51160b8f4a82b4d676b071800a6a593ef',
  'Unrelated nested teaching unchanged',
);
same(
  digest(
    api.nestedConcepts
      .filter((c) => c.study === 'pulmonary')
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
  '6988daf730eb7fe5b9a47855c68ccf7d338d08739c6747f96948e339cd19d7e1',
  'Existing pulmonary identities, core notes, limits and questions unchanged',
);
same(
  digest(
    api.nestedConcepts
      .filter((c) => c.study === 'hepatic')
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
  '8077a5db3724a8589a691b9c0b830fc1a524b467e8450249a5f01f9d4f02c013',
  'Existing liver identities, core notes, limits and questions unchanged',
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
  const expectedImaging =
    concept.study === 'cardiac'
      ? ['ct', 'mri', 'ultrasound']
      : concept.study === 'hepatic'
        ? concept.id === 'hepatic-venous-tributary'
          ? ['ct', 'mri', 'ultrasound']
          : concept.id === 'hepatic-biliary'
            ? ['mri', 'ultrasound']
            : ['ultrasound']
        : concept.study === 'pulmonary'
          ? ['ct']
          : [];
  same(
    Object.keys(concept.imaging ?? {}).sort(),
    [...expectedImaging].sort(),
    'Explicit authored modality scope',
  );
  for (const topic of topics) {
    const lesson = api.nestedTopicLesson(concept, topic);
    check(lesson.body.trim());
    check(Object.hasOwn(coverage[topic], lesson.readiness));
    coverage[topic][lesson.readiness]++;
    if (['ct', 'mri', 'ultrasound'].includes(topic)) {
      if (expectedImaging.includes(topic)) {
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
        check(!concept.imaging?.[topic], 'No unrequested imaging expansion');
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
  for (const section of Object.values(concept.imaging ?? {})) {
    section.body = 'mutated imaging';
    section.references.length = 0;
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
  if (expectedImaging.length) {
    for (const topic of expectedImaging) {
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
  if (['hepatic', 'pulmonary'].includes(target.study)) {
    for (const topic of ['clinical', 'pathology']) {
      const lesson = api.nestedTopicLesson(cleanConcept, topic);
      const sectionNode = nodes.find(
        (n) => n.props?.['aria-label'] === lesson.title,
      );
      check(sectionNode, 'Organ clinical section in existing panel');
      const sectionHtml = renderToStaticMarkup(sectionNode);
      same(lesson.readiness, 'draft');
      check(sectionHtml.includes('Teaching references'));
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
    api.nestedTeachingFor(parent, target.study, {
      ...selected,
      id: 'unknown',
    }),
    null,
  );
}
same(seen.size, 33);
same(
  answerKeys.size,
  53,
  'Changing either study or side resets revealed answer',
);
same(coverage.pathology, { draft: 49, pending: 4 });
same(coverage.clinical, { draft: 53, pending: 0 });
for (const tab of ['anatomy', 'function', 'quiz'])
  same(coverage[tab], { draft: 53, pending: 0 });
same(coverage.ct, { draft: 10, pending: 43 });
same(coverage.mri, { draft: 7, pending: 46 });
same(coverage.ultrasound, { draft: 11, pending: 42 });
same(JSON.stringify(catalog), initial, 'Read-only catalog');
const wordsBySource = {};
const hosts = new Set([
  'www.cdc.gov',
  'www.brit-thoracic.org.uk',
  'pubmed.ncbi.nlm.nih.gov',
  'aasldpubs.onlinelibrary.wiley.com',
  'www.aium.org',
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
same(Object.keys(wordsBySource).length, 48);
same(
  new Set(Object.values(api.nestedTeachingReferences).map((ref) => ref.url))
    .size,
  48,
  'Do not split one source into duplicate reference keys',
);
for (const concept of api.nestedConcepts.filter((c) => c.imaging)) {
  const missing = copy(concept);
  delete missing.imaging;
  for (const tab of ['ct', 'mri', 'ultrasound']) {
    const fallback = api.nestedTopicLesson(missing, tab);
    same(fallback.readiness, 'pending');
    check(!fallback.citations?.length);
    check(fallback.body.includes('have not yet been added'));
  }
  for (const tab of Object.keys(concept.imaging)) {
    const partial = copy(concept);
    delete partial.imaging[tab];
    same(api.nestedTopicLesson(partial, tab).readiness, 'pending');
    for (const retained of Object.keys(partial.imaging))
      same(
        api.nestedTopicLesson(partial, retained),
        api.nestedTopicLesson(concept, retained),
        'Removing one modality does not borrow or erase another',
      );
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
