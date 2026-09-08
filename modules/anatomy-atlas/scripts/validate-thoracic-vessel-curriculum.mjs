import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeThoracicVessels } from './thoracic-vessel-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (a, label) => {
  checks++;
  assert(a, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson(
  'content/thoracic-vessel-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeThoracicVessels(context);
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
// Exact pre-authoring catalogue observations checked against official v4 ISA/PART-OF rows.
// These identity checks do not establish geometry or clinical validity.
const expected = {
  FMA3736: ['midline', ['thorax'], 'isa', ['FJ3413']],
  FMA3768: ['midline', ['thorax'], 'isa', ['FJ3411']],
  FMA87217: ['unspecified', ['thorax'], 'isa', ['FJ1931']],
  FMA4720: ['unspecified', ['thorax'], 'isa', ['FJ3645']],
  FMA4838: ['unspecified', ['thorax'], 'isa', ['FJ3416']],
  FMA4944: ['midline', ['thorax'], 'isa', ['FJ3434']],
  FMA3932: [
    'midline',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'isa',
    ['FJ3417'],
  ],
  FMA3953: [
    'right',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'isa',
    ['FJ3579'],
  ],
  FMA4694: ['left', ['thorax', 'shoulder-arm', 'head-neck'], 'isa', ['FJ3479']],
  FMA4751: [
    'right',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'isa',
    ['FJ3583'],
  ],
  FMA4761: ['left', ['thorax', 'shoulder-arm', 'head-neck'], 'isa', ['FJ3482']],
  FMA4755: [
    'right',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'isa',
    ['FJ3587'],
  ],
  FMA4763: ['left', ['thorax', 'shoulder-arm', 'head-neck'], 'isa', ['FJ3486']],
  FMA3802: ['right', ['thorax'], 'isa', ['FJ2723']],
  FMA3855: ['left', ['thorax'], 'isa', ['FJ2737']],
  FMA3862: [
    'left',
    ['thorax'],
    'partof',
    [
      'FJ2631',
      'FJ2632',
      'FJ2633',
      'FJ2634',
      'FJ2635',
      'FJ2636',
      'FJ2637',
      'FJ2638',
      'FJ2639',
      'FJ2640',
      'FJ2641',
      'FJ2642',
      'FJ2643',
      'FJ2644',
      'FJ2645',
      'FJ2646',
      'FJ2647',
      'FJ2648',
    ],
  ],
  FMA3895: [
    'left',
    ['thorax'],
    'isa',
    ['FJ2649', 'FJ2650', 'FJ2651', 'FJ2652', 'FJ2653', 'FJ2654'],
  ],
  FMA4707: ['unspecified', ['thorax'], 'isa', ['FJ2656']],
  FMA4713: [
    'unspecified',
    ['thorax'],
    'isa',
    [
      'FJ2678',
      'FJ2679',
      'FJ2680',
      'FJ2681',
      'FJ2682',
      'FJ2683',
      'FJ2684',
      'FJ2685',
      'FJ2686',
      'FJ2687',
      'FJ2688',
      'FJ2689',
      'FJ2690',
      'FJ2691',
    ],
  ],
  FMA50872: ['right', ['thorax'], 'isa', ['FJ3019']],
  FMA50873: ['left', ['thorax'], 'isa', ['FJ2924']],
  FMA49914: ['right', ['thorax'], 'isa', ['FJ3020']],
  FMA49916: ['left', ['thorax'], 'isa', ['FJ2925', 'FJ2933']],
  FMA49911: ['right', ['thorax'], 'isa', ['FJ3040']],
  FMA49913: ['left', ['thorax'], 'isa', ['FJ2944', 'FJ2950', 'FJ2955']],
  FMA3969: ['right', ['thorax'], 'isa', ['FJ1937']],
  FMA4068: ['left', ['thorax'], 'isa', ['FJ1972']],
  FMA3988: ['right', ['thorax', 'abdomen'], 'isa', ['FJ1936']],
  FMA4083: ['left', ['thorax', 'abdomen'], 'isa', ['FJ1971']],
  FMA10692: ['right', ['thorax', 'abdomen'], 'isa', ['FJ1969']],
  FMA4077: ['left', ['thorax', 'abdomen'], 'isa', ['FJ1979']],
  FMA4758: ['right', ['thorax'], 'isa', ['FJ1993']],
  FMA4772: ['right', ['thorax', 'abdomen'], 'isa', ['FJ1996']],
  FMA4786: ['left', ['thorax', 'abdomen'], 'isa', ['FJ1988']],
};
same(api.thoracicVesselLessons.length, 29);
same(
  api.thoracicVesselLessons
    .flatMap((l) => l.bindings.map(([fma]) => fma))
    .sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, regions, tree, files]] of Object.entries(expected)) {
  const s = entry(fma);
  const l = api.thoracicVesselLessons.find((l) =>
    l.bindings.some(([id]) => id === fma),
  );
  check(s && l);
  same(s.system, 'vessels');
  same(s.category, 'vessel');
  same(s.region, 'thorax');
  same(s.regions, regions);
  same(s.laterality, side);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  for (const t of api.contentTabs) {
    const result = api.thoracicVesselLesson(s, t);
    if (!before.tabs.includes(t)) {
      same(result, undefined);
      continue;
    }
    same(result, api.bodyLesson(s, t));
    same(
      JSON.parse(JSON.stringify(result)),
      body.find((r) => r.id === s.id).content[t],
    );
    same(result.readiness, 'draft');
    same(result.body, l[t]);
    same(result.bullets[0], l.distinction);
    check(result.note.includes('clinical review pending'));
    check(result.note.includes('not physiological displacement'));
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .thoracicVesselLesson(
          { ...s, coverageNote: 'Coverage hold retained.' },
          t,
        )
        .note.includes('Coverage hold retained.'),
    );
    same(result.citations, l.references);
    check(result.citations.length > 0);
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const original = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), original, 'Detached arrays');
    if (t === 'anatomy') {
      check(result.bullets[1].includes('not oxygenation'));
      check(result.bullets[2].includes(s.fmaId));
      check(result.bullets[2].includes(files.length + ' source component'));
    }
  }
  const record = body.find((r) => r.id === s.id);
  same(record.validation.clinicalApproval, 'not-included');
  same(record.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const mutation of [
    { system: 'nerves' },
    { category: 'bone' },
    { region: 'abdomen' },
    { laterality: side === 'left' ? 'right' : 'left' },
    { regions: [] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.thoracicVesselLesson({ ...s, ...mutation }, 'anatomy'), undefined);
  for (const missing of regions)
    same(
      api.thoracicVesselLesson(
        { ...s, regions: regions.filter((r) => r !== missing) },
        'function',
      ),
      undefined,
      'Required region guarded',
    );
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.thoracicVesselLesson(s, t), undefined);
const lesson = (fma, t = 'anatomy') => api.bodyLesson(entry(fma), t);
for (const [fma, t, fragment] of [
  ['FMA3932', 'anatomy', 'right common carotid'],
  ['FMA3953', 'anatomy', 'brachiocephalic division'],
  ['FMA4694', 'anatomy', 'directly from the arch'],
  ['FMA4761', 'anatomy', 'behind the manubrium'],
  ['FMA4755', 'anatomy', 'anterior to anterior scalene'],
  ['FMA3862', 'anatomy', 'LAD'],
  ['FMA3895', 'anatomy', 'left atrioventricular'],
  ['FMA4707', 'anatomy', 'anterior interventricular'],
  ['FMA4713', 'anatomy', 'posterior interventricular'],
  ['FMA50872', 'anatomy', 'anterior to the right main bronchus'],
  ['FMA50873', 'anatomy', 'superior to the left main bronchus'],
  ['FMA50873', 'function', 'deoxygenated'],
  ['FMA49914', 'anatomy', 'upper- and middle-lobe'],
  ['FMA49916', 'anatomy', 'lingula'],
  ['FMA49911', 'anatomy', 'right hilum'],
  ['FMA49913', 'anatomy', 'left hilum'],
  ['FMA49913', 'function', 'oxygenated'],
  ['FMA3988', 'anatomy', 'anterior abdominal wall'],
  ['FMA10692', 'anatomy', 'costal margin'],
  ['FMA4786', 'function', 'venous return'],
])
  check(lesson(fma, t).body.includes(fragment));
check(lesson('FMA4758').bullets[0].includes('termination descriptions differ'));
check(lesson('FMA4944').bullets[0].includes('recorded as midline'));
check(lesson('FMA3862').bullets[0].includes('dominance'));
check(lesson('FMA49916').bullets[0].includes('not independently assigned'));
for (const fma of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
  same(lesson(fma, 'function').readiness, 'pending');
const sourceComponents = Object.values(expected).reduce(
  (n, e) => n + e[3].length,
  0,
);
same(sourceComponents, 72);
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rowsByTree = {};
  for (const tree of ['isa', 'partof'])
    rowsByTree[tree] = (
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
  for (const [fma, [, , tree, files]] of Object.entries(expected)) {
    same(
      rowsByTree[tree].filter((row) => row[0] === fma),
      files.map((file) => [fma, entry(fma).name.toLowerCase(), file]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA3736', 'anatomy', 'body'],
  ['FMA4944', 'function', 'readiness'],
  ['FMA4694', 'anatomy', 'body'],
  ['FMA3862', 'anatomy', 'body'],
  ['FMA50873', 'function', 'body'],
  ['FMA49914', 'ct', 'body'],
  ['FMA4758', 'anatomy', 'body'],
  ['FMA4149', 'function', 'body'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
];
for (const [fma, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === fma && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]:
              field === 'readiness'
                ? expected[fma]
                  ? 'pending'
                  : 'draft'
                : 'unrecorded',
          }
        : api.bodyLesson(s, tab),
    bodyContent: (s, tab) =>
      s.fmaId === fma && tab === t && field === 'body'
        ? { ...api.bodyContent(s, tab), body: 'unrecorded' }
        : api.bodyContent(s, tab),
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
  draft: 850,
  'identity-only': 172,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 906,
  'identity-only': 112,
  pending: 4,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'thorax' &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 34,
  sourceComponents,
  lessonGroups: 29,
  explicitTopicEdits: 68,
  combinedPinnedCurriculumSections: 1314,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Draft reference teaching only. Compound source membership, vascular variants, branch continuity, lumen patency and circulation require review. No acquired imaging, haemodynamic simulation or clinical approval.',
};
await writeFile(
  new URL('docs/thoracic-vessel-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
