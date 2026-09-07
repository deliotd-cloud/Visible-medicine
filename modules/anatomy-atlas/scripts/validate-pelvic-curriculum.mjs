import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforePelvic } from './pelvic-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (v, label) => {
  checks++;
  assert(v, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson('content/pelvic-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforePelvic(context);
const copy = (a) => ({
  body: catalog.structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      api.contentTabs.map((t) => [t, a.bodyContent(s, t)]),
    ),
  })),
  shoulder: api.structures,
  dissectionProfiles: api.dissectionProfiles,
});
same(
  curriculumHash(copy(previous)),
  before.copyAndRecipeHash,
  'All unrelated sections and recipes preserved',
);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
  'Seven pinned transitions preserve original baseline',
);
same(api.pelvicCurriculumIds, ['FMA46444', 'FMA46443', 'FMA19728']);
const componentIds = {
  FMA46444: ['FJ1449M', 'FJ2542'],
  FMA46443: ['FJ2547'],
  FMA19728: ['FJ1450', 'FJ1450M', 'FJ2543', 'FJ2548'],
};
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const e of before.entries) {
  const s = entry(e.fmaId);
  same(
    s.sources.map((p) => p.file),
    componentIds[e.fmaId],
  );
  const exported = body.find((r) => r.id === s.id);
  for (const t of api.contentTabs) {
    const lesson = api.pelvicMuscleLesson(s, t);
    if (!before.tabs.includes(t)) {
      same(lesson, undefined);
      continue;
    }
    same(lesson, api.bodyLesson(s, t));
    same(JSON.parse(JSON.stringify(lesson)), exported.content[t]);
    same(
      lesson.readiness,
      e.fmaId === 'FMA19728' && t === 'function' ? 'pending' : 'draft',
    );
    check(lesson.title.startsWith(s.name + ' ·'));
    check(lesson.note.includes('clinical review pending'));
    check(lesson.note.includes('do not establish separate heads'));
    for (const url of lesson.citations) same(new URL(url).protocol, 'https:');
    check(
      api
        .pelvicMuscleLesson({ ...s, coverageNote: 'Source warning' }, t)
        .note.endsWith('Source warning'),
    );
    const original = structuredClone(lesson);
    lesson.bullets.push('mutation');
    lesson.citations.push('mutation');
    same(api.bodyLesson(s, t), original, 'Detached lesson arrays');
  }
  same(exported.validation.clinicalApproval, 'not-included');
  same(exported.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
}
for (const s of catalog.structures)
  if (!api.pelvicCurriculumIds.includes(s.fmaId))
    for (const t of api.contentTabs)
      same(api.pelvicMuscleLesson(s, t), undefined);
const fixture = entry('FMA46444');
for (const change of [
  { system: 'nerves' },
  { regions: ['thigh'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(api.pelvicMuscleLesson({ ...fixture, ...change }, 'anatomy'), undefined);
const category = entry('FMA19728');
check(category.id.includes(':thigh:midline:'));
same(category.region, 'pelvis');
check(
  api
    .bodyLesson(category, 'anatomy')
    .body.includes('not a separately identified superficial transverse'),
);
check(api.bodyLesson(category, 'function').body.includes('withheld'));
check(api.bodyLesson(category, 'function').bullets[0].includes('FMA21930'));
check(
  api.bodyLesson(fixture, 'function').bullets[1].includes('S4–S5 versus S3–S4'),
);

// Optional reproducible check against the already downloaded official v4 indexes.
// The ordinary test remains offline and portable without the work cache.
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  for (const tree of ['isa', 'partof']) {
    const rows = (
      await readFile(
        new URL(
          `../../work/bodyparts3d/${tree}_element_parts.txt`,
          import.meta.url,
        ),
        'utf8',
      )
    )
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split('\t'));
    const files = (fma) =>
      rows
        .filter((row) => row[0] === fma)
        .map((row) => row[2])
        .sort(compare);
    same(files('FMA21930'), [...componentIds.FMA19728].sort(compare));
    sourceIndexChecks++;
    if (tree === 'isa')
      for (const [fma, ids] of Object.entries(componentIds)) {
        same(files(fma), [...ids].sort(compare));
        sourceIndexChecks++;
      }
  }
}
const negatives = [
  [fixture, 'function', 'body'],
  [category, 'function', 'readiness'],
  [category, 'anatomy', 'body'],
  [fixture, 'ct', 'body'],
  ...[
    'FMA37717',
    'FMA22548',
    'FMA22452',
    'FMA37396',
    'FMA38479',
    'FMA13398',
  ].map((fma) => [entry(fma), 'function', 'body']),
  [catalog.structures.find((s) => s.system === 'skeleton'), 'anatomy', 'body'],
];
for (const [s, t, field] of negatives) {
  check(s);
  const changed = {
    ...api,
    bodyLesson: (candidate, tab) =>
      candidate.id === s.id && tab === t
        ? { ...api.bodyLesson(candidate, tab), [field]: 'unrecorded' }
        : api.bodyLesson(candidate, tab),
    bodyContent: (candidate, tab) =>
      candidate.id === s.id && tab === t && field === 'body'
        ? { ...api.bodyContent(candidate, tab), body: 'unrecorded' }
        : api.bodyContent(candidate, tab),
  };
  await assert.rejects(async () =>
    assert.equal(
      curriculumHash(
        await copyBeforeShoulderArmCurriculum({ ...context, api: changed }),
      ),
      baseline.copyAndRecipeHash,
    ),
  );
  checks++;
}
const counts = (t) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter((s) => api.bodyLesson(s, t).readiness === r)
          .length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 410,
  'identity-only': 612,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 465,
  'identity-only': 146,
  pending: 411,
  'generated-identification': 0,
});
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'muscles' &&
        s.regions.includes('pelvis') &&
        api.bodyLesson(s, 'function').readiness === 'pending',
    )
    .map((s) => s.fmaId),
  ['FMA19728'],
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 3,
  changedSections: 6,
  newDraftSections: 5,
  pendingFunctionClarifications: 1,
  combinedPinnedCurriculumSections: 430,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  negativeCases: negatives.length,
  sourceIndexChecks,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software and optional source-index checks, not mesh topology, attachment footprints, specific sphincter identity/layers, complete function or clinical/device acceptance.',
};
await writeFile(
  new URL('docs/pelvic-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
