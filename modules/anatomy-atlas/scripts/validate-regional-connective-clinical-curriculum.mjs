import assert from 'node:assert/strict';
import { authoringBeforeThoracicVesselClinical } from './thoracic-vessel-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeRegionalConnectiveClinical } from './regional-connective-clinical-curriculum-transition.mjs';
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
  'content/regional-connective-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeRegionalConnectiveClinical(context);
const milestone = await authoringBeforeThoracicVesselClinical(context);
const copy = (a) => ({
  body: catalog.structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      a.contentTabs.map((t) => [t, a.bodyContent(s, t)]),
    ),
  })),
  shoulder: a.structures,
  dissectionProfiles: a.dissectionProfiles,
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
  [
    'FMA59503',
    'midline',
    'partof',
    ['FJ2557'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA59505',
    'right',
    'partof',
    ['FJ2554'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA59506',
    'left',
    'partof',
    ['FJ2555'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA59512',
    'right',
    'partof',
    ['FJ2558'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA59513',
    'left',
    'partof',
    ['FJ2556'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA55099',
    'midline',
    'isa',
    ['FJ2808'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA9615',
    'midline',
    'isa',
    ['FJ2440', 'FJ2769'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA55113',
    'right',
    'isa',
    ['FJ2792'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA55114',
    'left',
    'isa',
    ['FJ2775'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA55115',
    'right',
    'isa',
    ['FJ2793'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA55116',
    'left',
    'isa',
    ['FJ2776'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA55117',
    'right',
    'isa',
    ['FJ2795'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA55118',
    'left',
    'isa',
    ['FJ2773'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA49144',
    'right',
    'isa',
    ['FJ1334'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA49145',
    'left',
    'isa',
    ['FJ1284'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA49147',
    'right',
    'isa',
    ['FJ1335'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA49148',
    'left',
    'isa',
    ['FJ1292'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55138',
    'midline',
    'isa',
    ['FJ2790'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55140',
    'right',
    'isa',
    ['FJ2797'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55141',
    'left',
    'isa',
    ['FJ2779'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55227',
    'unspecified',
    'isa',
    ['FJ2771'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55230',
    'midline',
    'isa',
    ['FJ2807'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55237',
    'midline',
    'isa',
    ['FJ2789'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55245',
    'right',
    'isa',
    ['FJ2805'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA55246',
    'left',
    'isa',
    ['FJ2787'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA72309',
    'right',
    'isa',
    ['FJ2764'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  [
    'FMA72311',
    'left',
    'isa',
    ['FJ2763'],
    'head-neck',
    ['head-neck'],
    'ligament',
  ],
  ['FMA11336', 'midline', 'isa', ['FJ1448'], 'abdomen', ['abdomen'], 'fascia'],
  [
    'FMA49067',
    'right',
    'isa',
    ['FJ1380'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA49068',
    'left',
    'isa',
    ['FJ1329'],
    'head-neck',
    ['head-neck'],
    'cartilage',
  ],
  [
    'FMA49072',
    'right',
    'isa',
    ['FJ1342'],
    'head-neck',
    ['head-neck'],
    'tendon',
  ],
  ['FMA49073', 'left', 'isa', ['FJ1291'], 'head-neck', ['head-neck'], 'tendon'],
  [
    'FMA14643',
    'midline',
    'isa',
    ['FJ3396'],
    'abdomen',
    ['abdomen'],
    'membrane',
  ],
  [
    'FMA14647',
    'midline',
    'isa',
    ['FJ3398'],
    'abdomen',
    ['abdomen'],
    'membrane',
  ],
  [
    'FMA16549',
    'unspecified',
    'isa',
    ['FJ3397'],
    'abdomen',
    ['abdomen'],
    'membrane',
  ],
  [
    'FMA59091',
    'right',
    'isa',
    ['FJ1375'],
    'head-neck',
    ['head-neck'],
    'connective-tissue',
  ],
  [
    'FMA59092',
    'left',
    'isa',
    ['FJ1324'],
    'head-neck',
    ['head-neck'],
    'connective-tissue',
  ],
  [
    'FMA59089',
    'right',
    'isa',
    ['FJ1379'],
    'head-neck',
    ['head-neck'],
    'connective-tissue',
  ],
  [
    'FMA59090',
    'left',
    'isa',
    ['FJ1328'],
    'head-neck',
    ['head-neck'],
    'connective-tissue',
  ],
  [
    'FMA55133',
    'right',
    'isa',
    ['FJ2804'],
    'head-neck',
    ['head-neck'],
    'membrane',
  ],
  [
    'FMA55134',
    'left',
    'isa',
    ['FJ2786'],
    'head-neck',
    ['head-neck'],
    'membrane',
  ],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.regionalConnectiveClinicalGroups.length, 13);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.regionalConnectiveClinicalGroups
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
  const group = api.regionalConnectiveClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.regionalConnectiveClinicalLesson(s, t);
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
        .regionalConnectiveClinicalLesson(
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
        api.regionalConnectiveClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.regionalConnectiveClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 41);
same(new Set(ids).size, 41);
same(new Set(expected.flatMap((e) => e[3])).size, 42);
same(expected.filter((e) => e[1] === 'left').length, 15);
same(expected.filter((e) => e[1] === 'right').length, 15);
same(expected.filter((e) => e[1] === 'midline').length, 9);
same(expected.filter((e) => e[1] === 'unspecified').length, 2);
same(expected.filter((e) => e[2] === 'partof').length, 5);
same(expected.filter((e) => e[2] === 'isa').length, 36);
same(
  Object.fromEntries(
    [
      'cartilage',
      'ligament',
      'fascia',
      'tendon',
      'membrane',
      'connective-tissue',
    ].map((c) => [c, expected.filter((e) => e[6] === c).length]),
  ),
  {
    cartilage: 15,
    ligament: 14,
    fascia: 1,
    tendon: 2,
    membrane: 5,
    'connective-tissue': 4,
  },
);
same(
  api.regionalConnectiveClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['nasal-septum', 1],
    ['external-nasal-framework', 4],
    ['laryngeal-cartilages', 8],
    ['laryngeal-connective-support', 8],
    ['vocal-ligaments', 2],
    ['stylohyoid-chain', 2],
    ['orbital-check-ligaments', 4],
    ['superior-oblique-trochleae', 2],
    ['common-tendinous-rings', 2],
    ['eyelid-tarsal-plates', 4],
    ['linea-alba', 1],
    ['intestinal-mesenteries', 2],
    ['mesoappendix', 1],
  ],
);
for (const g of api.regionalConnectiveClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
same(
  entry('FMA9615').sources.map((s) => s.file),
  ['FJ2440', 'FJ2769'],
);
for (const f of ['FMA55227', 'FMA16549'])
  for (const tab of tabs)
    same(
      api.regionalConnectiveClinicalLesson(
        { ...entry(f), laterality: 'midline' },
        tab,
      ),
      undefined,
    );
for (const f of ['FMA59091', 'FMA59092', 'FMA59089', 'FMA59090'])
  same(entry(f).category, 'connective-tissue');
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'connective' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.regionalConnectiveClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.regionalConnectiveClinicalLesson(entry(f), tab), undefined);
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
  ['FMA59503', 'pathology', 'readiness'],
  ['FMA59505', 'clinical', 'body'],
  ['FMA59506', 'pathology', 'body'],
  ['FMA59512', 'clinical', 'body'],
  ['FMA59513', 'pathology', 'readiness'],
  ['FMA55099', 'clinical', 'body'],
  ['FMA9615', 'pathology', 'body'],
  ['FMA55113', 'clinical', 'body'],
  ['FMA55114', 'pathology', 'readiness'],
  ['FMA55115', 'clinical', 'body'],
  ['FMA55116', 'pathology', 'body'],
  ['FMA55117', 'clinical', 'body'],
  ['FMA55118', 'pathology', 'readiness'],
  ['FMA49144', 'clinical', 'body'],
  ['FMA49145', 'pathology', 'body'],
  ['FMA49147', 'clinical', 'body'],
  ['FMA49148', 'pathology', 'readiness'],
  ['FMA55138', 'clinical', 'body'],
  ['FMA55140', 'pathology', 'body'],
  ['FMA55141', 'clinical', 'body'],
  ['FMA55227', 'pathology', 'readiness'],
  ['FMA55230', 'clinical', 'body'],
  ['FMA55237', 'pathology', 'body'],
  ['FMA55245', 'clinical', 'body'],
  ['FMA55246', 'pathology', 'readiness'],
  ['FMA72309', 'clinical', 'body'],
  ['FMA72311', 'pathology', 'body'],
  ['FMA11336', 'clinical', 'body'],
  ['FMA49067', 'pathology', 'readiness'],
  ['FMA49068', 'clinical', 'body'],
  ['FMA49072', 'pathology', 'body'],
  ['FMA49073', 'clinical', 'body'],
  ['FMA14643', 'pathology', 'readiness'],
  ['FMA14647', 'clinical', 'body'],
  ['FMA16549', 'pathology', 'body'],
  ['FMA59091', 'clinical', 'body'],
  ['FMA59092', 'pathology', 'readiness'],
  ['FMA59089', 'clinical', 'body'],
  ['FMA59090', 'pathology', 'body'],
  ['FMA55133', 'clinical', 'body'],
  ['FMA55134', 'pathology', 'readiness'],
  ['FMA59503', 'anatomy', 'body'],
  ['FMA55227', 'function', 'body'],
  ['FMA9615', 'ct', 'body'],
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
        catalog.structures.filter(
          (s) => milestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
for (const t of tabs)
  same(counts(t), {
    draft: 791,
    'identity-only': 0,
    pending: 231,
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
  bodyRepresentations: 41,
  sourceComponents: 42,
  lessonGroups: 13,
  explicitTopicEdits: 82,
  combinedPinnedCurriculumSections: 3162,
  sourceIndexChecks,
  negativeCases: negatives.length,
  historicalMilestoneReadiness: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(api)),
  limitations:
    'Original abdominal/head-neck connective drafts; exact source trees, categories, unspecified sides and two-component cricoid preserved. No new geometry, operative route, physiological simulation, patient diagnosis, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/regional-connective-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
