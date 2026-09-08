import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeTrunkClinical } from './trunk-clinical-curriculum-transition.mjs';
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
  'content/trunk-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeTrunkClinical(context);
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
/** @type {Array<[string, string, string, string[], string, string[]]>} */
const expected = [
  ['FMA46444', 'left', 'isa', ['FJ1449M', 'FJ2542'], 'pelvis', ['pelvis']],
  ['FMA9756', 'midline', 'isa', ['FJ1451', 'FJ1451M'], 'thorax', ['thorax']],
  ['FMA13336', 'right', 'isa', ['FJ1452'], 'abdomen', ['abdomen']],
  ['FMA13337', 'left', 'isa', ['FJ1452M'], 'abdomen', ['abdomen']],
  ['FMA9758', 'midline', 'isa', ['FJ1454', 'FJ1454M'], 'thorax', ['thorax']],
  ['FMA9757', 'midline', 'isa', ['FJ1455', 'FJ1455M'], 'thorax', ['thorax']],
  ['FMA13375', 'right', 'isa', ['FJ1456'], 'thorax', ['thorax']],
  ['FMA13376', 'left', 'isa', ['FJ1456M'], 'thorax', ['thorax']],
  ['FMA9761', 'right', 'isa', ['FJ1461'], 'thorax', ['thorax']],
  ['FMA9762', 'left', 'isa', ['FJ1461M'], 'thorax', ['thorax']],
  ['FMA23089', 'right', 'isa', ['FJ1522'], 'spine', ['spine', 'abdomen']],
  ['FMA23090', 'left', 'isa', ['FJ1522M'], 'spine', ['spine', 'abdomen']],
  [
    'FMA23083',
    'midline',
    'isa',
    ['FJ1525', 'FJ1525M'],
    'spine',
    ['spine', 'thorax'],
  ],
  ['FMA22740', 'right', 'isa', ['FJ1527'], 'spine', ['spine']],
  ['FMA22741', 'left', 'isa', ['FJ1527M'], 'spine', ['spine']],
  ['FMA22742', 'right', 'isa', ['FJ1528'], 'spine', ['spine']],
  ['FMA22743', 'left', 'isa', ['FJ1528M'], 'spine', ['spine']],
  ['FMA22751', 'right', 'isa', ['FJ1535'], 'spine', ['spine']],
  ['FMA22753', 'left', 'isa', ['FJ1535M'], 'spine', ['spine']],
  ['FMA22872', 'right', 'isa', ['FJ1540'], 'spine', ['spine']],
  ['FMA22873', 'left', 'isa', ['FJ1540M'], 'spine', ['spine']],
  ['FMA13405', 'right', 'isa', ['FJ1541'], 'spine', ['spine']],
  ['FMA13406', 'left', 'isa', ['FJ1541M'], 'spine', ['spine']],
  ['FMA13403', 'right', 'isa', ['FJ1542'], 'spine', ['spine']],
  ['FMA13404', 'left', 'isa', ['FJ1542M'], 'spine', ['spine']],
  [
    'FMA77179',
    'midline',
    'isa',
    ['FJ1543', 'FJ1543M', 'FJ1544', 'FJ1544M'],
    'spine',
    ['spine'],
  ],
  [
    'FMA22850',
    'midline',
    'isa',
    ['FJ1547', 'FJ1547M'],
    'spine',
    ['spine', 'abdomen'],
  ],
  [
    'FMA22851',
    'midline',
    'isa',
    ['FJ1548', 'FJ1548M'],
    'spine',
    ['spine', 'abdomen'],
  ],
  ['FMA22890', 'right', 'isa', ['FJ1551'], 'spine', ['spine']],
  ['FMA22891', 'left', 'isa', ['FJ1551M'], 'spine', ['spine']],
  ['FMA46443', 'right', 'isa', ['FJ2547'], 'pelvis', ['pelvis']],
  ['FMA13295', 'midline', 'isa', ['FJ3131'], 'thorax', ['thorax']],
  ['FMA33581', 'right', 'isa', ['FJ1520'], 'spine', ['spine']],
  ['FMA33583', 'left', 'isa', ['FJ1520M'], 'spine', ['spine']],
  ['FMA33584', 'right', 'isa', ['FJ1554'], 'spine', ['spine']],
  ['FMA33585', 'left', 'isa', ['FJ1554M'], 'spine', ['spine']],
  ['FMA33586', 'right', 'isa', ['FJ1521'], 'spine', ['spine']],
  ['FMA33587', 'left', 'isa', ['FJ1521M'], 'spine', ['spine']],
  ['FMA13373', 'right', 'partof', ['FJ1446', 'FJ1464'], 'thorax', ['thorax']],
  ['FMA13374', 'left', 'partof', ['FJ1446M', 'FJ1464M'], 'thorax', ['thorax']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.trunkClinicalGroups.length, 17);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.trunkClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(before.entries.map((e) => e.fmaId).sort(), [...ids].sort());
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, tree, files, region, regions] of expected) {
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
    ['muscles', 'muscle', side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files].sort(),
  );
  same(e.omittedSourceFiles, []);
  const group = api.trunkClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.trunkClinicalLesson(s, t);
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
        .trunkClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { system: 'bones' },
      { category: 'tendon' },
      { region: 'head-neck' },
      { regions: [] },
      { regions: [...regions, 'head-neck'] },
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
      same(api.trunkClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.trunkClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.trunkClinicalGroups.find((g) => g.key === k);
check(group('internal-intercostal').clinical.body.includes('parasternal'));
check(
  group('innermost-intercostal').clinical.bullets[0].includes('Do not use'),
);
check(group('external-oblique').scope.includes('deeper abdominal-wall'));
check(group('pectoralis-major').scope.includes('absent, not torn'));
check(
  group('pectoralis-major').clinical.bullets[0].includes('dedicated coverage'),
);
check(group('diaphragm').pathology.body.includes('not specific for paralysis'));
check(group('diaphragm').clinical.bullets[0].includes('Dynamic ultrasound'));
check(group('trapezius').pathology.body.includes('Spinal accessory'));
check(
  group('serratus-posterior').scope.includes('respiratory role is debated'),
);
check(
  group('serratus-posterior').pathology.bullets[0].includes('Do not transfer'),
);
check(group('erector-spinae').scope.includes('unresolved spinalis'));
check(
  group('erector-spinae').pathology.bullets[0].includes('emergency assessment'),
);
check(group('thoracic-interspinales').scope.includes('sparse and variable'));
check(group('coccygeus').pathology.bullets[0].includes('impaired relaxation'));
check(group('coccygeus').clinical.bullets[1].includes('interstitial cystitis'));
check(group('coccygeus').scope.includes('two components and right one'));
same(ids.length, 40);
same(new Set(ids).size, 40);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  52,
);
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
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
    same(rows.map((r) => r[2]).sort(), [...files].sort());
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA9756', 'clinical', 'body'],
  ['FMA13295', 'pathology', 'readiness'],
  ['FMA13373', 'clinical', 'body'],
  ['FMA46444', 'pathology', 'readiness'],
  ['FMA22850', 'anatomy', 'body'],
  ['FMA77179', 'function', 'body'],
  ['FMA13295', 'ultrasound', 'body'],
  ['FMA37717', 'clinical', 'body'],
  ...unresolved.map((f) => [f, 'function', 'readiness']),
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
for (const t of tabs)
  same(counts(t), {
    draft: 263,
    'identity-only': 0,
    pending: 759,
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
  bodyRepresentations: 40,
  sourceComponents: 52,
  lessonGroups: 17,
  explicitTopicEdits: 80,
  combinedPinnedCurriculumSections: 2106,
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
    'Original short trunk/coccygeus clinical drafts; not validated muscle lesions, respiratory mechanics, procedural corridors, pelvic-floor function, patient scans or clinical approval.',
};
await writeFile(
  new URL('docs/trunk-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
