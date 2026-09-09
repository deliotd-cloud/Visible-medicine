import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeHandVesselClinical } from './hand-vessel-clinical-curriculum-transition.mjs';
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
  'content/hand-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeHandVesselClinical(context);
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
  ['FMA22839', 'right', 'isa', ['FJ2279'], 'hand', ['hand'], 'vessel'],
  ['FMA22840', 'left', 'isa', ['FJ2227'], 'hand', ['hand'], 'vessel'],
  ['FMA22835', 'right', 'isa', ['FJ2300'], 'hand', ['hand'], 'vessel'],
  ['FMA22837', 'left', 'isa', ['FJ2248'], 'hand', ['hand'], 'vessel'],
  ['FMA22864', 'right', 'isa', ['FJ2289'], 'hand', ['hand'], 'vessel'],
  ['FMA22865', 'left', 'isa', ['FJ2237'], 'hand', ['hand'], 'vessel'],
  [
    'FMA22905',
    'right',
    'isa',
    ['FJ2371', 'FJ2372'],
    'hand',
    ['hand'],
    'vessel',
  ],
  ['FMA22907', 'left', 'isa', ['FJ2338', 'FJ2339'], 'hand', ['hand'], 'vessel'],
  [
    'FMA22777',
    'right',
    'isa',
    ['FJ2342', 'FJ2363'],
    'hand',
    ['hand'],
    'vessel',
  ],
  ['FMA22778', 'left', 'isa', ['FJ2314', 'FJ2332'], 'hand', ['hand'], 'vessel'],
  ['FMA22856', 'right', 'isa', ['FJ2343'], 'hand', ['hand'], 'vessel'],
  ['FMA85118', 'left', 'isa', ['FJ2315'], 'hand', ['hand'], 'vessel'],
  ['FMA85119', 'right', 'isa', ['FJ2344'], 'hand', ['hand'], 'vessel'],
  ['FMA85120', 'left', 'isa', ['FJ2316'], 'hand', ['hand'], 'vessel'],
  ['FMA85121', 'right', 'isa', ['FJ2345'], 'hand', ['hand'], 'vessel'],
  ['FMA85122', 'left', 'isa', ['FJ2317'], 'hand', ['hand'], 'vessel'],
  ['FMA85123', 'right', 'isa', ['FJ2370'], 'hand', ['hand'], 'vessel'],
  ['FMA85124', 'left', 'isa', ['FJ2337'], 'hand', ['hand'], 'vessel'],
  ['FMA22858', 'right', 'isa', ['FJ2365'], 'hand', ['hand'], 'vessel'],
  ['FMA22860', 'left', 'isa', ['FJ2334'], 'hand', ['hand'], 'vessel'],
  ['FMA23050', 'right', 'isa', ['FJ2364'], 'hand', ['hand'], 'vessel'],
  ['FMA23051', 'left', 'isa', ['FJ2333'], 'hand', ['hand'], 'vessel'],
  ['FMA23052', 'right', 'isa', ['FJ2369'], 'hand', ['hand'], 'vessel'],
  ['FMA23054', 'right', 'isa', ['FJ2368'], 'hand', ['hand'], 'vessel'],
  ['FMA23055', 'left', 'isa', ['FJ2336'], 'hand', ['hand'], 'vessel'],
  ['FMA85112', 'right', 'isa', ['FJ2367'], 'hand', ['hand'], 'vessel'],
  ['FMA85115', 'right', 'isa', ['FJ2366'], 'hand', ['hand'], 'vessel'],
  ['FMA85116', 'left', 'isa', ['FJ2335'], 'hand', ['hand'], 'vessel'],
  ['FMA22912', 'right', 'isa', ['FJ2281'], 'hand', ['hand'], 'vessel'],
  ['FMA22913', 'left', 'isa', ['FJ2229'], 'hand', ['hand'], 'vessel'],
  ['FMA22915', 'right', 'isa', ['FJ2301'], 'hand', ['hand'], 'vessel'],
  ['FMA22916', 'left', 'isa', ['FJ2249'], 'hand', ['hand'], 'vessel'],
  ['FMA62506', 'right', 'isa', ['FJ2280'], 'hand', ['hand'], 'vessel'],
  ['FMA62507', 'left', 'isa', ['FJ2228'], 'hand', ['hand'], 'vessel'],
  [
    'FMA22920',
    'right',
    'isa',
    ['FJ2290', 'FJ2350', 'FJ2353'],
    'hand',
    ['hand'],
    'vessel',
  ],
  [
    'FMA22921',
    'left',
    'isa',
    ['FJ2238', 'FJ2320', 'FJ2323'],
    'hand',
    ['hand'],
    'vessel',
  ],
  [
    'FMA85096',
    'right',
    'isa',
    ['FJ2354', 'FJ2355'],
    'hand',
    ['hand'],
    'vessel',
  ],
  ['FMA85097', 'left', 'isa', ['FJ2324', 'FJ2325'], 'hand', ['hand'], 'vessel'],
  [
    'FMA85098',
    'right',
    'isa',
    ['FJ2356', 'FJ2357'],
    'hand',
    ['hand'],
    'vessel',
  ],
  ['FMA85099', 'left', 'isa', ['FJ2326', 'FJ2340'], 'hand', ['hand'], 'vessel'],
  [
    'FMA85100',
    'right',
    'isa',
    ['FJ2358', 'FJ2359'],
    'hand',
    ['hand'],
    'vessel',
  ],
  ['FMA85101', 'left', 'isa', ['FJ2327', 'FJ2328'], 'hand', ['hand'], 'vessel'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.handVesselClinicalGroups.length, 12);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.handVesselClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
  const group = api.handVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.handVesselClinicalLesson(s, t);
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
        .handVesselClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(api.handVesselClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.handVesselClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 42);
same(new Set(ids).size, 42);
same(new Set(expected.flatMap((e) => e[3])).size, 56);
same(expected.filter((e) => e[1] === 'left').length, 20);
same(expected.filter((e) => e[1] === 'right').length, 22);
same(expected.filter((e) => e[1] === 'midline').length, 0);
same(expected.filter((e) => e[2] === 'isa').length, 42);
same(expected.filter((e) => e[2] === 'partof').length, 0);
same(
  expected.every((e) => e[6] === 'vessel'),
  true,
);
same(expected.flatMap((e) => e[3]).filter((f) => f.endsWith('M')).length, 0);
same(
  api.handVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['deep-palmar-arterial-arches', 2],
    ['superficial-palmar-arterial-arches', 2],
    ['palmar-metacarpal-arteries', 2],
    ['princeps-pollicis-arteries', 2],
    ['radialis-indicis-arteries', 2],
    ['common-palmar-digital-arteries', 8],
    ['proper-palmar-digital-arteries', 10],
    ['deep-palmar-venous-arches', 2],
    ['superficial-palmar-venous-arches', 2],
    ['dorsal-hand-venous-networks', 2],
    ['palmar-metacarpal-veins', 2],
    ['proper-palmar-digital-veins', 6],
  ],
);
for (const g of api.handVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
const groupByKey = (key) =>
  api.handVesselClinicalGroups.find((g) => g.key === key);
same(
  groupByKey('proper-palmar-digital-arteries').identities.filter(
    (i) => i[1] === 'right',
  ).length,
  6,
);
same(
  groupByKey('proper-palmar-digital-arteries').identities.filter(
    (i) => i[1] === 'left',
  ).length,
  4,
);
for (const f of [
  'FMA22905',
  'FMA22907',
  'FMA22777',
  'FMA22778',
  'FMA85096',
  'FMA85097',
  'FMA85098',
  'FMA85099',
  'FMA85100',
  'FMA85101',
])
  same(entry(f).sources.length, 2);
for (const f of ['FMA22920', 'FMA22921']) same(entry(f).sources.length, 3);
check(
  groupByKey('common-palmar-digital-arteries').scope.includes(
    'not equated automatically',
  ),
);
check(
  groupByKey('radialis-indicis-arteries').scope.includes(
    'not evidence of duplicated arteries',
  ),
);
check(
  groupByKey('proper-palmar-digital-arteries').scope.includes(
    'not the current screen side',
  ),
);
check(
  groupByKey('deep-palmar-venous-arches').pathology.bullets.some((b) =>
    b.includes('not a diagnosis of isolated'),
  ),
);
check(
  groupByKey('superficial-palmar-venous-arches').scope.includes(
    'does not establish a subcutaneous plane',
  ),
);
check(
  groupByKey('proper-palmar-digital-veins').pathology.body.includes(
    'skin-coloured',
  ),
);
check(
  groupByKey('proper-palmar-digital-arteries').pathology.bullets.some((b) =>
    b.includes('selected well-perfused'),
  ),
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'hand' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.handVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.handVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA22839', 'pathology', 'readiness'],
  ['FMA22840', 'clinical', 'body'],
  ['FMA22835', 'pathology', 'body'],
  ['FMA22837', 'clinical', 'body'],
  ['FMA22864', 'pathology', 'readiness'],
  ['FMA22865', 'clinical', 'body'],
  ['FMA22905', 'pathology', 'body'],
  ['FMA22907', 'clinical', 'body'],
  ['FMA22777', 'pathology', 'readiness'],
  ['FMA22778', 'clinical', 'body'],
  ['FMA22856', 'pathology', 'body'],
  ['FMA85118', 'clinical', 'body'],
  ['FMA85119', 'pathology', 'readiness'],
  ['FMA85120', 'clinical', 'body'],
  ['FMA85121', 'pathology', 'body'],
  ['FMA85122', 'clinical', 'body'],
  ['FMA85123', 'pathology', 'readiness'],
  ['FMA85124', 'clinical', 'body'],
  ['FMA22858', 'pathology', 'body'],
  ['FMA22860', 'clinical', 'body'],
  ['FMA23050', 'pathology', 'readiness'],
  ['FMA23051', 'clinical', 'body'],
  ['FMA23052', 'pathology', 'body'],
  ['FMA23054', 'clinical', 'body'],
  ['FMA23055', 'pathology', 'readiness'],
  ['FMA85112', 'clinical', 'body'],
  ['FMA85115', 'pathology', 'body'],
  ['FMA85116', 'clinical', 'body'],
  ['FMA22912', 'pathology', 'readiness'],
  ['FMA22913', 'clinical', 'body'],
  ['FMA22915', 'pathology', 'body'],
  ['FMA22916', 'clinical', 'body'],
  ['FMA62506', 'pathology', 'readiness'],
  ['FMA62507', 'clinical', 'body'],
  ['FMA22920', 'pathology', 'body'],
  ['FMA22921', 'clinical', 'body'],
  ['FMA85096', 'pathology', 'readiness'],
  ['FMA85097', 'clinical', 'body'],
  ['FMA85098', 'pathology', 'body'],
  ['FMA85099', 'clinical', 'body'],
  ['FMA85100', 'pathology', 'readiness'],
  ['FMA85101', 'clinical', 'body'],
  ['FMA22839', 'anatomy', 'body'],
  ['FMA85101', 'function', 'body'],
  ['FMA22920', 'ct', 'body'],
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
    draft: 986,
    'identity-only': 0,
    pending: 36,
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
  bodyRepresentations: 42,
  sourceComponents: 56,
  lessonGroups: 12,
  explicitTopicEdits: 84,
  combinedPinnedCurriculumSections: 3552,
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
    'Original primary-hand vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL('docs/hand-vessel-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
