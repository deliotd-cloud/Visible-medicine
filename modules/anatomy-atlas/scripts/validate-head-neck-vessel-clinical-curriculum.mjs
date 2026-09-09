import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeHeadNeckVesselClinical } from './head-neck-vessel-clinical-curriculum-transition.mjs';
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
  'content/head-neck-vessel-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeHeadNeckVesselClinical(context);
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
  [
    'FMA3941',
    'right',
    'isa',
    ['FJ3564'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4058',
    'left',
    'isa',
    ['FJ3483'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA3949',
    'right',
    'isa',
    ['FJ1682'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4062',
    'left',
    'isa',
    ['FJ1682M'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA3958',
    'right',
    'isa',
    ['FJ1725'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4066',
    'left',
    'isa',
    ['FJ1725M'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4754',
    'right',
    'isa',
    ['FJ3585'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA4762',
    'left',
    'isa',
    ['FJ3485'],
    'head-neck',
    ['head-neck', 'thorax'],
    'vessel',
  ],
  [
    'FMA50542',
    'midline',
    'isa',
    ['FJ1672', 'FJ1844'],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
  [
    'FMA50169',
    'midline',
    'isa',
    ['FJ1655'],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
  [
    'FMA50029',
    'right',
    'isa',
    ['FJ1654'],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
  [
    'FMA50030',
    'left',
    'isa',
    ['FJ1654M'],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
  [
    'FMA50584',
    'right',
    'partof',
    [
      'FJ1661',
      'FJ1675',
      'FJ1677',
      'FJ1678',
      'FJ1680',
      'FJ1687',
      'FJ1691',
      'FJ1720',
      'FJ1727',
    ],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
  [
    'FMA50585',
    'left',
    'partof',
    [
      'FJ1661M',
      'FJ1675M',
      'FJ1677M',
      'FJ1678M',
      'FJ1680M',
      'FJ1687M',
      'FJ1691M',
      'FJ1720M',
      'FJ1727M',
    ],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
  [
    'FMA50085',
    'right',
    'isa',
    ['FJ1713'],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
  [
    'FMA50086',
    'left',
    'isa',
    ['FJ1713M'],
    'head-neck',
    ['head-neck'],
    'vessel',
  ],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.headNeckVesselClinicalGroups.length, 9);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.headNeckVesselClinicalGroups
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
  const group = api.headNeckVesselClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.headNeckVesselClinicalLesson(s, t);
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
        .headNeckVesselClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
        api.headNeckVesselClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.headNeckVesselClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
same(ids.length, 16);
same(new Set(ids).size, 16);
same(new Set(expected.flatMap((e) => e[3])).size, 33);
same(expected.filter((e) => e[1] === 'left').length, 7);
same(expected.filter((e) => e[1] === 'right').length, 7);
same(expected.filter((e) => e[1] === 'midline').length, 2);
same(expected.filter((e) => e[2] === 'isa').length, 14);
same(expected.filter((e) => e[2] === 'partof').length, 2);
same(
  expected.every((e) => e[6] === 'vessel'),
  true,
);
same(expected.flatMap((e) => e[3]).filter((f) => f.endsWith('M')).length, 13);
same(
  api.headNeckVesselClinicalGroups.map((g) => [g.key, g.identities.length]),
  [
    ['common-carotid-arteries', 2],
    ['internal-carotid-arteries', 2],
    ['vertebral-arteries', 2],
    ['internal-jugular-veins', 2],
    ['basilar-artery', 1],
    ['anterior-communicating-artery', 1],
    ['anterior-cerebral-arteries', 2],
    ['posterior-cerebral-arteries', 2],
    ['posterior-communicating-arteries', 2],
  ],
);
for (const g of api.headNeckVesselClinicalGroups) {
  check(g.pathology.body.length > 100);
  check(g.clinical.body.length > 100);
}
for (const [f, n] of [
  ['FMA50542', 2],
  ['FMA50584', 9],
  ['FMA50585', 9],
])
  same(entry(f).sources.length, n);
for (const f of ['FMA50584', 'FMA50585']) same(entry(f).sourceTree, 'partof');
for (const f of ['FMA50542', 'FMA50169']) same(entry(f).laterality, 'midline');
same(entry('FMA4062').sources[0].file, 'FJ1682M');
same(entry('FMA4066').sources[0].file, 'FJ1725M');
same(
  api.headNeckVesselClinicalGroups
    .find((g) => g.key === 'posterior-communicating-arteries')
    .pathology.body.includes('pupil sparing alone cannot exclude'),
  true,
);
same(
  api.headNeckVesselClinicalGroups
    .find((g) => g.key === 'posterior-cerebral-arteries')
    .pathology.body.includes('both eyes'),
  true,
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      s.region === 'head-neck' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.headNeckVesselClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.headNeckVesselClinicalLesson(entry(f), tab), undefined);
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
  ['FMA3941', 'pathology', 'readiness'],
  ['FMA4058', 'clinical', 'body'],
  ['FMA3949', 'pathology', 'body'],
  ['FMA4062', 'clinical', 'body'],
  ['FMA3958', 'pathology', 'readiness'],
  ['FMA4066', 'clinical', 'body'],
  ['FMA4754', 'pathology', 'body'],
  ['FMA4762', 'clinical', 'body'],
  ['FMA50542', 'pathology', 'readiness'],
  ['FMA50169', 'clinical', 'body'],
  ['FMA50029', 'pathology', 'body'],
  ['FMA50030', 'clinical', 'body'],
  ['FMA50584', 'pathology', 'readiness'],
  ['FMA50585', 'clinical', 'body'],
  ['FMA50085', 'pathology', 'body'],
  ['FMA50086', 'clinical', 'body'],
  ['FMA3941', 'anatomy', 'body'],
  ['FMA50585', 'function', 'body'],
  ['FMA4754', 'ct', 'body'],
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
    draft: 896,
    'identity-only': 0,
    pending: 126,
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
  bodyRepresentations: 16,
  sourceComponents: 33,
  lessonGroups: 9,
  explicitTopicEdits: 32,
  combinedPinnedCurriculumSections: 3372,
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
    'Original primary-head-neck vessel drafts; exact source trees, categories, sides, ordered components and cross-region memberships retained. No new geometry, validated lumen, measured flow, procedural route, scan or clinical approval.',
};
await writeFile(
  new URL(
    'docs/head-neck-vessel-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
