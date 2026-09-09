import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeAxialConnectiveClinical } from './axial-connective-clinical-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, l) => {
  checks++;
  assert.deepEqual(a, b, l);
};
const check = (v, l) => {
  checks++;
  assert(v, l);
};
const context = await contentContext(),
  { api, catalog, body } = context;
const before = await readContentJson(
  'content/axial-connective-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeAxialConnectiveClinical(context);
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
same(curriculumHash(copy(previous)), before.copyAndRecipeHash);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
);
// Independently observed official source rows, not inferred from runtime lessons.
/** @type {Record<string, string[]>} */
const omittedByFma = {};
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  ['FMA7875', 'right', 'isa', ['FJ3333'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8005', 'left', 'isa', ['FJ3239'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA7886', 'right', 'isa', ['FJ3335'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8031', 'left', 'isa', ['FJ3242'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA7913', 'right', 'isa', ['FJ3337'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8058', 'left', 'isa', ['FJ3245'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA7976', 'right', 'isa', ['FJ3339'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8167', 'left', 'isa', ['FJ3248'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8070', 'right', 'isa', ['FJ3341'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8112', 'left', 'isa', ['FJ3251'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8194', 'right', 'isa', ['FJ3343'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8221', 'left', 'isa', ['FJ3254'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8248', 'right', 'isa', ['FJ3345'], 'thorax', ['thorax'], 'cartilage'],
  ['FMA8275', 'left', 'isa', ['FJ3255'], 'thorax', ['thorax'], 'cartilage'],
  [
    'FMA25058',
    'midline',
    'isa',
    ['FJ3202'],
    'spine',
    ['spine', 'head-neck'],
    'cartilage',
  ],
  [
    'FMA13896',
    'midline',
    'isa',
    ['FJ3213'],
    'spine',
    ['spine', 'head-neck'],
    'cartilage',
  ],
  [
    'FMA13897',
    'midline',
    'isa',
    ['FJ3218'],
    'spine',
    ['spine', 'head-neck'],
    'cartilage',
  ],
  [
    'FMA13898',
    'midline',
    'isa',
    ['FJ3219'],
    'spine',
    ['spine', 'head-neck'],
    'cartilage',
  ],
  [
    'FMA13899',
    'midline',
    'isa',
    ['FJ3220'],
    'spine',
    ['spine', 'head-neck'],
    'cartilage',
  ],
  [
    'FMA13900',
    'midline',
    'isa',
    ['FJ3221'],
    'spine',
    ['spine', 'head-neck'],
    'cartilage',
  ],
  [
    'FMA10458',
    'midline',
    'isa',
    ['FJ3222'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13495',
    'midline',
    'isa',
    ['FJ3223'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13500',
    'midline',
    'isa',
    ['FJ3224'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13501',
    'midline',
    'isa',
    ['FJ3203'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13502',
    'midline',
    'isa',
    ['FJ3204'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13503',
    'midline',
    'isa',
    ['FJ3205'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13504',
    'midline',
    'isa',
    ['FJ3206'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13505',
    'midline',
    'isa',
    ['FJ3207'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13506',
    'midline',
    'isa',
    ['FJ3208'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13507',
    'midline',
    'isa',
    ['FJ3209'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA13508',
    'midline',
    'isa',
    ['FJ3210'],
    'spine',
    ['spine', 'thorax'],
    'cartilage',
  ],
  [
    'FMA16033',
    'midline',
    'isa',
    ['FJ3212'],
    'spine',
    ['spine', 'abdomen'],
    'cartilage',
  ],
  [
    'FMA16034',
    'midline',
    'isa',
    ['FJ3214'],
    'spine',
    ['spine', 'abdomen'],
    'cartilage',
  ],
  [
    'FMA16035',
    'midline',
    'isa',
    ['FJ3215'],
    'spine',
    ['spine', 'abdomen'],
    'cartilage',
  ],
  [
    'FMA16036',
    'midline',
    'isa',
    ['FJ3216'],
    'spine',
    ['spine', 'abdomen'],
    'cartilage',
  ],
  [
    'FMA16037',
    'midline',
    'isa',
    ['FJ3217'],
    'spine',
    ['spine', 'abdomen'],
    'cartilage',
  ],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.axialConnectiveClinicalGroups.length, 4);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.axialConnectiveClinicalGroups
    .flatMap((g) => g.identities)
    .sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(before.entries.map((e) => e.fmaId).sort(), [...ids].sort());
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, tree, files, region, regions, category] of expected) {
  const s = entry(f),
    e = before.entries.find((e) => e.fmaId === f);
  same(
    [
      s.system,
      s.category,
      s.laterality,
      s.region,
      s.regions,
      s.sourceTree,
      s.sources.map((p) => p.file),
    ],
    ['connective', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
  );
  same(e.omittedSourceFiles, omittedByFma[f] ?? []);
  const group = api.axialConnectiveClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.axialConnectiveClinicalLesson(s, t);
    same(result, api.bodyLesson(s, t));
    same(result.readiness, 'draft');
    same(result.body, group[t].body);
    same(result.bullets, [...group[t].bullets, group.scope]);
    same(result.citations, group.references);
    check(result.title.startsWith(s.name + ' ·'));
    check(result.note.includes('clinical review pending'));
    check(result.note.includes('not a patient diagnosis'));
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .axialConnectiveClinicalLesson(
          { ...s, coverageNote: 'Keep warning' },
          t,
        )
        .note.includes('Keep warning'),
    );
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const detached = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), detached);
    same(JSON.parse(JSON.stringify(detached)), record.content[t]);
    same(record.validation.clinicalApproval, 'not-included');
    same(record.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
    for (const mutation of [
      { system: 'muscles' },
      { category: category === 'ligament' ? 'fascia' : 'ligament' },
      { region: region === 'thorax' ? 'spine' : 'thorax' },
      { regions: [] },
      { regions: [...regions, 'thorax'] },
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: tree === 'isa' ? 'partof' : 'isa' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
      ...(s.sources.length > 1
        ? [
            { sources: s.sources.slice(1) },
            { sources: [...s.sources].reverse() },
          ]
        : []),
      ...(s.regions.length > 1 ? [{ regions: [...s.regions].reverse() }] : []),
    ])
      same(
        api.axialConnectiveClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.axialConnectiveClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 36);
same(new Set(ids).size, 36);
same(new Set(expected.flatMap((e) => e[3])).size, 36);
same(expected.filter((e) => e[1] === 'left').length, 7);
same(expected.filter((e) => e[1] === 'right').length, 7);
same(expected.filter((e) => e[1] === 'midline').length, 22);
same(expected.filter((e) => e[6] === 'cartilage').length, 36);
same(
  api.axialConnectiveClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['costal-cartilages', 14],
    ['cervical-discs', 6],
    ['thoracic-discs', 11],
    ['lumbar-discs', 5],
  ],
);
for (const g of api.axialConnectiveClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
  if (g.key.includes('discs'))
    check(g.scope.includes('segmented') || g.scope.includes('segmentation'));
}
check(api.axialConnectiveClinicalGroups[0].clinical.body.includes('call 999'));
check(
  api.axialConnectiveClinicalGroups[2].scope.includes('not proof of complete'),
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'connective' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  41,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.axialConnectiveClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.axialConnectiveClinicalLesson(entry(f), tab), undefined);
  }
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'skeleton' &&
        api.bodyLesson(s, 'clinical').readiness === 'pending',
    )
    .map((s) => s.fmaId)
    .sort(),
  ['FMA45097', 'FMA45098'],
);
const unresolved = ['FMA45097', 'FMA45098', 'FMA19728', 'FMA61970'];
for (const f of unresolved)
  same(api.bodyLesson(entry(f), 'function').readiness, 'pending');
for (const f of unresolved.slice(0, 2))
  same(api.bodyLesson(entry(f), 'anatomy').readiness, 'identity-only');
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const indexes = {};
  for (const tree of ['isa', 'partof'])
    indexes[tree] = (
      await readFile(
        new URL(
          '../../work/bodyparts3d/' + tree + '_element_parts.txt',
          import.meta.url,
        ),
        'utf8',
      )
    )
      .trim()
      .split(/\r?\n/)
      .map((l) => l.split('\t'));
  for (const [f, , tree, files] of expected) {
    const rows = indexes[tree].filter((r) => r[0] === f);
    same(
      rows.map((r) => r[2]).sort(),
      [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
    );
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}

const negatives = [
  ['FMA7875', 'pathology', 'readiness'],
  ['FMA8005', 'clinical', 'body'],
  ['FMA7886', 'pathology', 'body'],
  ['FMA8031', 'clinical', 'body'],
  ['FMA7913', 'pathology', 'readiness'],
  ['FMA8058', 'clinical', 'body'],
  ['FMA7976', 'pathology', 'body'],
  ['FMA8167', 'clinical', 'body'],
  ['FMA8070', 'pathology', 'readiness'],
  ['FMA8112', 'clinical', 'body'],
  ['FMA8194', 'pathology', 'body'],
  ['FMA8221', 'clinical', 'body'],
  ['FMA8248', 'pathology', 'readiness'],
  ['FMA8275', 'clinical', 'body'],
  ['FMA25058', 'pathology', 'body'],
  ['FMA13896', 'clinical', 'body'],
  ['FMA13897', 'pathology', 'readiness'],
  ['FMA13898', 'clinical', 'body'],
  ['FMA13899', 'pathology', 'body'],
  ['FMA13900', 'clinical', 'body'],
  ['FMA10458', 'pathology', 'readiness'],
  ['FMA13495', 'clinical', 'body'],
  ['FMA13500', 'pathology', 'body'],
  ['FMA13501', 'clinical', 'body'],
  ['FMA13502', 'pathology', 'readiness'],
  ['FMA13503', 'clinical', 'body'],
  ['FMA13504', 'pathology', 'body'],
  ['FMA13505', 'clinical', 'body'],
  ['FMA13506', 'pathology', 'readiness'],
  ['FMA13507', 'clinical', 'body'],
  ['FMA13508', 'pathology', 'body'],
  ['FMA16033', 'clinical', 'body'],
  ['FMA16034', 'pathology', 'readiness'],
  ['FMA16035', 'clinical', 'body'],
  ['FMA16036', 'pathology', 'body'],
  ['FMA16037', 'clinical', 'body'],
  ['FMA25058', 'anatomy', 'body'],
  ['FMA13900', 'function', 'body'],
  ['FMA16037', 'ct', 'body'],
  ['FMA258847', 'clinical', 'body'],
  ['FMA45097', 'clinical', 'readiness'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'clinical', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
  ['FMA61970', 'clinical', 'readiness'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'clinical', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
  ['FMA13322', 'clinical', 'body'],
  ['FMA23130', 'clinical', 'body'],
  ['FMA13395', 'clinical', 'body'],
];
for (const [f, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === f && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]:
              field === 'readiness'
                ? ids.includes(f)
                  ? 'pending'
                  : 'draft'
                : 'unrecorded',
          }
        : api.bodyLesson(s, tab),
    bodyContent: (s, tab) =>
      s.fmaId === f && tab === t && field === 'body'
        ? { ...api.bodyContent(s, tab), body: 'unrecorded' }
        : api.bodyContent(s, tab),
  };
  await assert.rejects(
    async () => {
      // Readiness is omitted from the displayed-copy hash: test held states directly.
      for (const held of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
        for (const tab of tabs)
          assert.equal(
            changed.bodyLesson(entry(held), tab).readiness,
            'pending',
          );
      assert.equal(
        curriculumHash(
          await copyBeforeShoulderArmCurriculum({ ...context, api: changed }),
        ),
        baseline.copyAndRecipeHash,
      );
    },
    f + ' / ' + t + ' / ' + field,
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
for (const t of tabs)
  same(counts(t), {
    draft: 750,
    'identity-only': 0,
    pending: 272,
    'generated-identification': 0,
  });
for (const t of ['ct', 'mri', 'ultrasound'])
  same(counts(t), {
    draft: 11,
    'identity-only': 0,
    pending: 1011,
    'generated-identification': 0,
  });
same(counts('anatomy'), {
  draft: 1020,
  'identity-only': 2,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 1018,
  'identity-only': 0,
  pending: 4,
  'generated-identification': 0,
});
same(counts('quiz'), {
  draft: 11,
  'identity-only': 0,
  pending: 0,
  'generated-identification': 1011,
});
for (const f of api.shoulderArmLessons.flatMap((l) => l.fmaIds))
  for (const t of tabs) same(api.bodyLesson(entry(f), t).readiness, 'draft');
const report = {
  passed: true,
  checks,
  bodyRepresentations: 36,
  sourceComponents: 36,
  lessonGroups: 4,
  explicitTopicEdits: 72,
  combinedPinnedCurriculumSections: 3080,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: Object.fromEntries(api.contentTabs.map((t) => [t, counts(t)])),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(api)),
  limitations:
    'Original axial connective Clinical/Pathology drafts; exact costal sides and source disc names retained. No validated radiological level annotation, new geometry, internal disc segmentation, patient diagnosis, procedure, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/axial-connective-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
