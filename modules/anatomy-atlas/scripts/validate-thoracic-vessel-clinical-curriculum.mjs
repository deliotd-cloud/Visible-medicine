import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeThoracicVesselClinical } from './thoracic-vessel-clinical-curriculum-transition.mjs';
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
  'content/thoracic-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeThoracicVesselClinical(context);
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
  ['FMA3736', 'midline', 'isa', ['FJ3413'], 'thorax', ['thorax'], 'vessel'],
  ['FMA3768', 'midline', 'isa', ['FJ3411'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA87217',
    'unspecified',
    'isa',
    ['FJ1931'],
    'thorax',
    ['thorax'],
    'vessel',
  ],
  ['FMA4720', 'unspecified', 'isa', ['FJ3645'], 'thorax', ['thorax'], 'vessel'],
  ['FMA4838', 'unspecified', 'isa', ['FJ3416'], 'thorax', ['thorax'], 'vessel'],
  ['FMA4944', 'midline', 'isa', ['FJ3434'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA3932',
    'midline',
    'isa',
    ['FJ3417'],
    'thorax',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'vessel',
  ],
  [
    'FMA3953',
    'right',
    'isa',
    ['FJ3579'],
    'thorax',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'vessel',
  ],
  [
    'FMA4694',
    'left',
    'isa',
    ['FJ3479'],
    'thorax',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'vessel',
  ],
  [
    'FMA4751',
    'right',
    'isa',
    ['FJ3583'],
    'thorax',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'vessel',
  ],
  [
    'FMA4761',
    'left',
    'isa',
    ['FJ3482'],
    'thorax',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'vessel',
  ],
  [
    'FMA4755',
    'right',
    'isa',
    ['FJ3587'],
    'thorax',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'vessel',
  ],
  [
    'FMA4763',
    'left',
    'isa',
    ['FJ3486'],
    'thorax',
    ['thorax', 'shoulder-arm', 'head-neck'],
    'vessel',
  ],
  ['FMA3802', 'right', 'isa', ['FJ2723'], 'thorax', ['thorax'], 'vessel'],
  ['FMA3855', 'left', 'isa', ['FJ2737'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA3862',
    'left',
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
    'thorax',
    ['thorax'],
    'vessel',
  ],
  [
    'FMA3895',
    'left',
    'isa',
    ['FJ2649', 'FJ2650', 'FJ2651', 'FJ2652', 'FJ2653', 'FJ2654'],
    'thorax',
    ['thorax'],
    'vessel',
  ],
  ['FMA4707', 'unspecified', 'isa', ['FJ2656'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA4713',
    'unspecified',
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
    'thorax',
    ['thorax'],
    'vessel',
  ],
  ['FMA50872', 'right', 'isa', ['FJ3019'], 'thorax', ['thorax'], 'vessel'],
  ['FMA50873', 'left', 'isa', ['FJ2924'], 'thorax', ['thorax'], 'vessel'],
  ['FMA49914', 'right', 'isa', ['FJ3020'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA49916',
    'left',
    'isa',
    ['FJ2925', 'FJ2933'],
    'thorax',
    ['thorax'],
    'vessel',
  ],
  ['FMA49911', 'right', 'isa', ['FJ3040'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA49913',
    'left',
    'isa',
    ['FJ2944', 'FJ2950', 'FJ2955'],
    'thorax',
    ['thorax'],
    'vessel',
  ],
  ['FMA3969', 'right', 'isa', ['FJ1937'], 'thorax', ['thorax'], 'vessel'],
  ['FMA4068', 'left', 'isa', ['FJ1972'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA3988',
    'right',
    'isa',
    ['FJ1936'],
    'thorax',
    ['thorax', 'abdomen'],
    'vessel',
  ],
  [
    'FMA4083',
    'left',
    'isa',
    ['FJ1971'],
    'thorax',
    ['thorax', 'abdomen'],
    'vessel',
  ],
  [
    'FMA10692',
    'right',
    'isa',
    ['FJ1969'],
    'thorax',
    ['thorax', 'abdomen'],
    'vessel',
  ],
  [
    'FMA4077',
    'left',
    'isa',
    ['FJ1979'],
    'thorax',
    ['thorax', 'abdomen'],
    'vessel',
  ],
  ['FMA4758', 'right', 'isa', ['FJ1993'], 'thorax', ['thorax'], 'vessel'],
  [
    'FMA4772',
    'right',
    'isa',
    ['FJ1996'],
    'thorax',
    ['thorax', 'abdomen'],
    'vessel',
  ],
  [
    'FMA4786',
    'left',
    'isa',
    ['FJ1988'],
    'thorax',
    ['thorax', 'abdomen'],
    'vessel',
  ],
  ['FMA4149', 'midline', 'isa', ['FJ1934'], 'thorax', ['thorax'], 'vessel'],
  ['FMA10704', 'midline', 'isa', ['FJ3418'], 'thorax', ['thorax'], 'vessel'],
  ['FMA68109', 'midline', 'isa', ['FJ1933'], 'thorax', ['thorax'], 'vessel'],
  ['FMA71537', 'midline', 'isa', ['FJ3431'], 'thorax', ['thorax'], 'vessel'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.thoracicVesselClinicalGroups.length, 20);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.thoracicVesselClinicalGroups
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
    ['vessels', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
  );
  same(e.omittedSourceFiles, omittedByFma[f] ?? []);
  const group = api.thoracicVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.thoracicVesselClinicalLesson(s, t);
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
        .thoracicVesselClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
        api.thoracicVesselClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.thoracicVesselClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 38);
same(new Set(ids).size, 38);
same(new Set(expected.flatMap((e) => e[3])).size, 76);
same(expected.filter((e) => e[1] === 'left').length, 13);
same(expected.filter((e) => e[1] === 'right').length, 12);
same(expected.filter((e) => e[1] === 'midline').length, 8);
same(expected.filter((e) => e[1] === 'unspecified').length, 5);
same(expected.filter((e) => e[2] === 'partof').length, 1);
same(expected.filter((e) => e[2] === 'isa').length, 37);
same(
  expected.every((e) => e[6] === 'vessel'),
  true,
);
same(
  api.thoracicVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['ascending-aorta', 1],
    ['aortic-arch', 1],
    ['descending-thoracic-aorta', 1],
    ['superior-vena-cava', 1],
    ['azygos-system', 2],
    ['brachiocephalic-artery', 1],
    ['subclavian-arteries', 2],
    ['brachiocephalic-veins', 2],
    ['subclavian-veins', 2],
    ['coronary-arteries', 4],
    ['great-cardiac-vein', 1],
    ['middle-cardiac-vein', 1],
    ['pulmonary-arteries', 2],
    ['pulmonary-veins', 4],
    ['internal-thoracic-arteries', 2],
    ['superior-epigastric-arteries', 2],
    ['musculophrenic-arteries', 2],
    ['thoracoabdominal-wall-veins', 3],
    ['bronchial-arteries', 2],
    ['oesophageal-arteries', 2],
  ],
);
for (const g of api.thoracicVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
for (const [f, n] of [
  ['FMA3862', 18],
  ['FMA3895', 6],
  ['FMA4713', 14],
  ['FMA49916', 2],
  ['FMA49913', 3],
])
  same(entry(f).sources.length, n);
same(entry('FMA3862').sourceTree, 'partof');
for (const f of ['FMA87217', 'FMA4720', 'FMA4838', 'FMA4707', 'FMA4713'])
  same(entry(f).laterality, 'unspecified');
same(entry('FMA4944').laterality, 'midline');
check(entry('FMA10704').name.includes('Variant'));
same(
  catalog.structures.filter((s) => s.fmaId === 'FMA14177').length,
  0,
  'Variant alias must not duplicate the source',
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'thorax' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.thoracicVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.thoracicVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA3736', 'pathology', 'readiness'],
  ['FMA3768', 'clinical', 'body'],
  ['FMA87217', 'pathology', 'body'],
  ['FMA4720', 'clinical', 'body'],
  ['FMA4838', 'pathology', 'readiness'],
  ['FMA4944', 'clinical', 'body'],
  ['FMA3932', 'pathology', 'body'],
  ['FMA3953', 'clinical', 'body'],
  ['FMA4694', 'pathology', 'readiness'],
  ['FMA4751', 'clinical', 'body'],
  ['FMA4761', 'pathology', 'body'],
  ['FMA4755', 'clinical', 'body'],
  ['FMA4763', 'pathology', 'readiness'],
  ['FMA3802', 'clinical', 'body'],
  ['FMA3855', 'pathology', 'body'],
  ['FMA3862', 'clinical', 'body'],
  ['FMA3895', 'pathology', 'readiness'],
  ['FMA4707', 'clinical', 'body'],
  ['FMA4713', 'pathology', 'body'],
  ['FMA50872', 'clinical', 'body'],
  ['FMA50873', 'pathology', 'readiness'],
  ['FMA49914', 'clinical', 'body'],
  ['FMA49916', 'pathology', 'body'],
  ['FMA49911', 'clinical', 'body'],
  ['FMA49913', 'pathology', 'readiness'],
  ['FMA3969', 'clinical', 'body'],
  ['FMA4068', 'pathology', 'body'],
  ['FMA3988', 'clinical', 'body'],
  ['FMA4083', 'pathology', 'readiness'],
  ['FMA10692', 'clinical', 'body'],
  ['FMA4077', 'pathology', 'body'],
  ['FMA4758', 'clinical', 'body'],
  ['FMA4772', 'pathology', 'readiness'],
  ['FMA4786', 'clinical', 'body'],
  ['FMA4149', 'pathology', 'body'],
  ['FMA10704', 'clinical', 'body'],
  ['FMA68109', 'pathology', 'readiness'],
  ['FMA71537', 'clinical', 'body'],
  ['FMA3736', 'anatomy', 'body'],
  ['FMA10704', 'function', 'body'],
  ['FMA3862', 'ct', 'body'],
  ['FMA16037', 'clinical', 'body'],
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
    draft: 829,
    'identity-only': 0,
    pending: 193,
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
  bodyRepresentations: 38,
  sourceComponents: 76,
  lessonGroups: 20,
  explicitTopicEdits: 76,
  combinedPinnedCurriculumSections: 3238,
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
    'Original primary-thorax vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/thoracic-vessel-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
