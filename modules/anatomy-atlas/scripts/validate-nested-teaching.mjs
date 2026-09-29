import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import { nestedBeforeClinicalReferenceRevision } from './clinical-reference-revision-history.mjs';
import { nestedBeforePulmonaryImaging } from './pulmonary-imaging-history.mjs';
import { nestedBeforePulmonaryXray } from './pulmonary-xray-history.mjs';

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
    export { hepaticCatalog as hepatic } from './lib/hepatic';
    export { renalCatalog as renal } from './lib/renal';
    export { pancreaticCatalog as pancreatic } from './lib/pancreatic';
    export { cricothyroidCatalog as cricothyroid } from './lib/cricothyroid';
    export { visualPathwayCatalog as 'visual-pathway' } from './lib/visual-pathway';`,
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
  URLSearchParams,
  module: scope,
  exports: scope.exports,
  require,
});
const api = {
  ...scope.exports,
  nestedConcepts: scope.exports.nestedConcepts.filter(c => c.study !== 'femoral-components' && c.study !== 'coronary-venous'),
  nestedTeachingReferences: Object.fromEntries(Object.entries(scope.exports.nestedTeachingReferences).filter(([key]) => !['femoralComponentAnatomy', 'femoralComponentVariation', 'femoralComponentInjury', 'coronaryVenousAnatomy', 'coronaryVenousHeart', 'coronarySinusImaging', 'smallCardiacVariation'].includes(key))),
};
// Exact two-field extension; verify new bytes before restoring older snapshots.
const eyeUsHashes = {
  'eye-lens': 'c71308116b8adbda8d67d4b9dec4bd53db697052e60c88ce73d96682921a3e14',
  'eye-sclera': 'a147afbfcbe303730892a7399f793f8d1d90e7ca88765331aff4da34a7b8181d',
};
const beforeEyeUs = {
  ...api,
  nestedConcepts: api.nestedConcepts.map(c => {
    if (!Object.hasOwn(eyeUsHashes, c.id)) return c;
    assert.equal(createHash('sha256').update(JSON.stringify(c.imaging.ultrasound)).digest('hex'), eyeUsHashes[c.id]);
    const { ultrasound: _added, ...imaging } = c.imaging;
    return { ...c, imaging };
  }),
  nestedTeachingReferences: Object.fromEntries(Object.entries(api.nestedTeachingReferences)
    .filter(([key]) => !['lensBiometryUBM', 'posteriorScleraBScan'].includes(key))),
};
const historicalApi = nestedBeforeClinicalReferenceRevision(nestedBeforePulmonaryImaging(nestedBeforePulmonaryXray(beforeEyeUs)));
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
// Preserve this historical corpus and its pinned digests; supplemental femoral
// lessons and their UI/source guards are covered in validate-femoral-components.
// Unnamed cranial source partitions have no independent teaching concepts;
// their absence of inherited lessons is tested in validate-cranial-artery-components.
// The two hippocampal additions are geometry-only; their pending lessons are
// checked independently in validate-hippocampi, not added to this legacy corpus.
const targets = api.nestedStudyTargets(catalog).filter(t => !['femoral-components', 'cranial-artery-components', 'coronary-venous'].includes(t.study)
  && !(t.study === 'cerebral' && ['FMA72714', 'FMA72713'].includes(t.structure.fmaId)));
const initial = JSON.stringify(catalog);
same(targets.length, 71);
same(api.nestedConcepts.length, 42);
same(new Set(api.nestedConcepts.map((c) => c.id)).size, 42);
const priorConcepts = historicalApi.nestedConcepts.filter((c) => c.study !== 'cricothyroid' && c.id !== 'inferior-collicular-brachia');
same(priorConcepts.length, 40);
const savedPins = JSON.parse(await readFile('content/nested-teaching-bindings.v1.json'));
same(savedPins.bindings.filter((b) => b.study === 'coronary-venous').length, 2);
const allPins = { ...savedPins, bindings: savedPins.bindings.filter((b) => b.study !== 'coronary-venous') };
same(allPins.bindings.length, 71);
same(allPins.parents.length, 11);
const legacyPins = {
  ...allPins,
  parents: allPins.parents.filter((p) => p.id !== api.cricothyroid.parent.id),
  bindings: allPins.bindings.filter((b) => b.study !== 'cricothyroid' && b.conceptId !== 'inferior-collicular-brachia'),
};
const hepaticVascularIds = new Set(['hepatic-arterial', 'hepatic-portal']);
// Project only the four new modality fields out before checking the v121 digest.
const beforeHepaticVascularImaging = priorConcepts.map((c) => {
  if (!hepaticVascularIds.has(c.id)) return c;
  const { ct: _newCT, mri: _newMRI, ...previousImaging } = c.imaging;
  return { ...c, imaging: previousImaging };
});
// Only these four explicitly authored modality fields extend the complete v121 baseline.
const beforeDuctImaging = beforeHepaticVascularImaging.map((c) => {
  if (c.id === 'pancreatic-ductal-system') {
    const { imaging: _newImaging, ...previous } = c;
    return previous;
  }
  if (c.id === 'hepatic-biliary') {
    const { ct: _newCT, ...previousImaging } = c.imaging;
    return { ...c, imaging: previousImaging };
  }
  return c;
});
const visualImagingIds = new Set([
  'visual-optic-chiasm',
  'visual-optic-tracts',
]);
const beforeVisualImaging = beforeDuctImaging
  .filter((c) => c.study !== 'pancreatic')
  .map((c) => {
    if (!visualImagingIds.has(c.id)) return c;
    const { imaging: _newImaging, ...previous } = c;
    return previous;
  });
const eyeImagingScope = {
  'eye-cornea': ['ultrasound'],
  'eye-iris': ['ultrasound'],
  'eye-lens': ['ct', 'ultrasound'],
  'eye-zonule': ['ultrasound'],
  'eye-vitreous': ['ultrasound'],
  'eye-choroid': ['ultrasound', 'mri'],
  'eye-sclera': ['ct', 'mri', 'ultrasound'],
  'eye-chamber': ['ultrasound'],
};
// Remove only the eight newly authored eye-imaging fields to reconstruct v116.
const beforeEyeImaging = beforeVisualImaging.map((c) => {
  if (!Object.hasOwn(eyeImagingScope, c.id)) return c;
  const { imaging: _newImaging, ...previous } = c;
  return previous;
});
const brainImagingIds = new Set([
  'ventricular-lateral',
  'ventricular-third',
  'ventricular-fourth',
  'brainstem-midbrain',
  'brainstem-pons',
  'brainstem-medulla',
  'brainstem-cerebellum',
]);
// Project only the seven intentional new imaging fields out of the v115 baseline.
// Identity, core teaching, quizzes and every earlier modality must remain exact.
const previousConcepts = beforeEyeImaging.map((c) => {
  if (!brainImagingIds.has(c.id)) return c;
  const { imaging: _newImaging, ...previous } = c;
  return previous;
});
const retainedConcepts = previousConcepts.filter(
  (c) => c.study !== 'visual-pathway',
);
const renalConceptIds = [
  'renal-ureteric-arteries',
  'renal-inferior-suprarenal-artery',
  'renal-veins',
  'renal-suprarenal-veins',
];
same(
  historicalApi.nestedConcepts.filter((c) => c.study === 'renal').map((c) => c.id),
  renalConceptIds,
);
// Captured from validated v108 source 649dfc3d, before this cerebral extension.
const digest = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
same(
  digest(beforeDuctImaging),
  'c0b79048174d7a3f5cd8209181325f242cc49c255b3adcf4003a141bd85b9444',
  'All v121 teaching, identities, quizzes and limits retained outside four added modality fields',
);
const addedDuctReferences = new Set([
  'hepaticLIRADSPhases',
  'femoralComponentAnatomy',
  'femoralComponentVariation',
  'femoralComponentInjury',
  'auditoryBrachium',
  'pancreaticImagingDiagnosis',
  'pancreaticMRCP',
  'pancreaticUltrasoundWindow',
  'hepaticBiliaryCT',
  'cricothyroidUniversity',
  'cricothyroidBellies',
  'cricothyroidParalysis',
]);
same(
  digest(
    Object.fromEntries(
      Object.entries(historicalApi.nestedTeachingReferences).filter(
        ([key]) => !addedDuctReferences.has(key),
      ),
    ),
  ),
  'c644091ce653a697f6e79bdad804d69ae5e329a793c2e52ef6d330ea059ddceb',
  'Every existing reference remains exact',
);
same(
  createHash('sha256')
    .update(JSON.stringify(legacyPins, null, 2) + '\n')
    .digest('hex'),
  '1958e42e9f84f80d20bfcbc09d339d134e1f47e153af53726adbb632e1089148',
  'All 65 source bindings and ten parents are unchanged; no repinning for prose',
);
same(
  digest(beforeVisualImaging),
  'de6f9b2668bb1ad459fa3e03c08e39217d612c10eb9ae27b3615b3052dcb02d4',
  'Complete v117 teaching retained except two explicitly added imaging fields',
);
same(api.nestedConcepts.filter((c) => visualImagingIds.has(c.id)).length, 2);
same(
  digest(beforeEyeImaging),
  'fe48b99e9beca00af5e9d0da1f6bb88e64e98fbce7d5114e59c0e736af2cc0c9',
  'Complete v116 teaching retained except eight explicitly added imaging fields',
);
same(
  api.nestedConcepts.filter((c) => Object.hasOwn(eyeImagingScope, c.id)).length,
  8,
);
same(
  digest(previousConcepts),
  '7909676e839dfbc412cd742e5885df92da1539b55a41d63661de723a99a0d322',
  'Complete v115 teaching retained except seven explicitly added imaging fields',
);
same(api.nestedConcepts.filter((c) => brainImagingIds.has(c.id)).length, 7);
const currentPins = legacyPins;
const pins = {
  ...currentPins,
  parents: currentPins.parents.filter((p) => p.id !== api.pancreatic.parent.id),
  bindings: currentPins.bindings.filter((b) => b.study !== 'pancreatic'),
};
same(currentPins.bindings.length, 65);
same(currentPins.parents.length, 10);
same(
  createHash('sha256')
    .update(JSON.stringify(pins, null, 2) + '\n')
    .digest('hex'),
  '4ae3bf423a67da6eee5541579dea469297b22f04d8f2c7889ed40456a3084fb3',
  'All 63 earlier source bindings and nine parents remain byte-equivalent',
);
// Captured from v112, before renal Pathology/CT/MRI/US authoring.
same(
  digest(retainedConcepts.filter((c) => c.study !== 'renal')),
  'dd440ef1198291f2be25b6949f5650c8c7fca2f448ae0863c395f208cebcd8ab',
  'All non-renal teaching remains unchanged',
);
same(
  digest(
    historicalApi.nestedConcepts
      .filter((c) => c.study === 'renal')
      .map((c) => ({
        id: c.id,
        study: c.study,
        fmaIds: c.fmaIds,
        anatomy: c.sections.anatomy,
        function: c.sections.function,
        clinical: c.sections.clinical,
        modelLimit: c.modelLimit,
        quiz: c.quiz,
      })),
  ),
  '211229ef9ddb9cdf2aff4f1a01b2cfedf3744c02f279d0fc5892ade7e6ac8eba',
  'Renal identities, core teaching, limitations and recall questions unchanged',
);
same(
  createHash('sha256')
    .update(
      JSON.stringify(
        {
          ...pins,
          bindings: pins.bindings.filter((b) => b.study !== 'visual-pathway'),
        },
        null,
        2,
      ) + '\n',
    )
    .digest('hex'),
  '081abf168557c14a16f770f7bcc5d2d0e338e0e3f83c2d1bc333ae08ace00ed0',
  'All 60 existing teaching source bindings and parents remain byte-equivalent',
);
same(
  digest(
    retainedConcepts
      .filter((c) => !renalConceptIds.includes(c.id))
      .filter(
        (c) =>
          !['cerebral-insula', 'cerebral-superior-temporal-anterior'].includes(
            c.id,
          ),
      ),
  ),
  '93ba424b634421287a413acb087ab872d8a27135ff6d4c8d054040304b2bb8fb',
  'Unrelated nested teaching unchanged',
);
same(
  digest(
    historicalApi.nestedConcepts
      .filter((c) =>
        ['cerebral-insula', 'cerebral-superior-temporal-anterior'].includes(
          c.id,
        ),
      )
      .map((c) => ({
        id: c.id,
        study: c.study,
        fmaIds: c.fmaIds,
        anatomy: c.sections.anatomy,
        function: c.sections.function,
        clinical: c.sections.clinical,
        modelLimit: c.modelLimit,
        quiz: c.quiz,
      })),
  ),
  '8c792cb82ecd7ba1e2c929d13437c9d04c49344c5f0276d0845169dd200022c0',
  'Cerebral identities, existing anatomy/function/clinical, limits and questions unchanged',
);
same(
  digest(
    historicalApi.nestedConcepts
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
    historicalApi.nestedConcepts
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
    historicalApi.nestedConcepts
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
  'xray',
  'ultrasound',
  'quiz',
];
const coverage = Object.fromEntries(
  topics.map((t) => [t, { draft: 0, pending: 0 }]),
);
const seen = new Set();
const answerKeys = new Set();
let hepaticVascularPlacements = 0;
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
  if (hepaticVascularIds.has(concept.id)) {
    hepaticVascularPlacements++;
    same(Object.keys(concept.imaging).sort(), ['ct', 'mri', 'ultrasound']);
    for (const topic of ['ct', 'mri']) {
      same(concept.imaging[topic].references, ['hepaticLIRADSPhases']);
      check(concept.imaging[topic].body.includes(topic === 'ct' ? 'CT' : 'MRI'));
      check(concept.imaging[topic].body.includes('phase'));
    }
  }
  seen.add(concept.id);
  check(concept.fmaIds.includes(selected.fmaId));
  const expectedImaging =
    concept.study === 'pancreatic'
      ? ['ct', 'mri', 'ultrasound']
      : ((visualImagingIds.has(concept.id)
          ? ['mri']
          : eyeImagingScope[concept.id]) ??
        (brainImagingIds.has(concept.id)
          ? ['ct', 'mri']
          : concept.study === 'renal'
            ? ['renal-veins', 'renal-ureteric-arteries'].includes(concept.id)
              ? ['ct', 'mri', 'ultrasound']
              : ['ct', 'mri']
            : concept.study === 'cardiac'
              ? ['ct', 'mri', 'ultrasound']
              : concept.study === 'hepatic'
                ? concept.id === 'hepatic-venous-tributary'
                  ? ['ct', 'mri', 'ultrasound']
                  : concept.id === 'hepatic-biliary'
                    ? ['ct', 'mri', 'ultrasound']
                    : hepaticVascularIds.has(concept.id)
                      ? ['ct', 'mri', 'ultrasound']
                    : ['ultrasound']
                : concept.study === 'pulmonary'
                  ? ['ct', 'mri', 'ultrasound', 'xray']
                  : concept.id === 'cerebral-insula'
                    ? ['ct', 'mri']
                    : concept.id === 'cerebral-superior-temporal-anterior'
                      ? ['mri']
                      : []));
  same(
    Object.keys(concept.imaging ?? {}).sort(),
    [...expectedImaging].sort((a, b) => a.localeCompare(b)),
    'Explicit authored modality scope',
  );
  for (const topic of topics) {
    const lesson = api.nestedTopicLesson(concept, topic);
    check(lesson.body.trim());
    check(Object.hasOwn(coverage[topic], lesson.readiness));
    coverage[topic][lesson.readiness]++;
    if (['ct', 'mri', 'xray', 'ultrasound'].includes(topic)) {
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
    'cardiac',
    'pulmonary',
    'hepatic',
    'renal',
    'pancreatic',
    'visual-pathway',
    'cricothyroid',
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
  if (
    ['hepatic', 'pulmonary', 'renal', 'visual-pathway', 'pancreatic', 'cricothyroid'].includes(
      target.study,
    )
  ) {
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
    8,
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
same(seen.size, 42);
same(hepaticVascularPlacements, 4, 'Four exact right/left source placements carry both new modalities');
same(
  answerKeys.size,
  71,
  'Changing either study or side resets revealed answer',
);
same(coverage.pathology, { draft: 69, pending: 2 });
same(coverage.clinical, { draft: 69, pending: 2 });
for (const tab of ['anatomy', 'function', 'quiz'])
  same(coverage[tab], { draft: 71, pending: 0 });
same(coverage.ct, { draft: 39, pending: 32 });
same(coverage.mri, { draft: 44, pending: 27 });
same(coverage.xray, { draft: 5, pending: 66 });
same(coverage.ultrasound, { draft: 37, pending: 34 });
same(JSON.stringify(catalog), initial, 'Read-only catalog');
const wordsBySource = {};
const hosts = new Set([
  'oac22.hsc.uth.tmc.edu',
  'uroweb.org',
  'cdt.amegroups.org',
  'academic.oup.com',
  'www.nia.nih.gov',
  'www.cdc.gov',
  'www.brit-thoracic.org.uk',
  'pubmed.ncbi.nlm.nih.gov',
  'pmc.ncbi.nlm.nih.gov',
  'aasldpubs.onlinelibrary.wiley.com',
  'www.aium.org',
  'www.heart.org',
  'www.radiologyinfo.org',
  'ehealth.kcl.ac.uk',
  'edge.sitecorecloud.io',
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
  'link.springer.com',
  'creativecommons.org',
  'doi.org',
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
      // Licence text establishes reuse terms; it is not a factual clinical source.
      if (ref !== 'renalReuseLicense')
        wordsBySource[ref] =
          (wordsBySource[ref] ?? 0) + section.body.trim().split(/\s+/).length;
    }
  }
}
same(Object.keys(wordsBySource).length, 89);
same(
  new Set(Object.values(api.nestedTeachingReferences).map((ref) => ref.url))
    .size,
  90,
  'Do not split one source into duplicate reference keys',
);
for (const concept of api.nestedConcepts.filter((c) => c.imaging)) {
  const missing = copy(concept);
  delete missing.imaging;
  for (const tab of ['ct', 'mri', 'xray', 'ultrasound']) {
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
