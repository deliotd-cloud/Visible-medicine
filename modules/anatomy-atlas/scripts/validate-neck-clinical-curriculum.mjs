import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeNeckClinical } from './neck-clinical-curriculum-transition.mjs';
import { authoringBeforeLimbBoneClinical } from './limb-bone-clinical-curriculum-transition.mjs';
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
  'content/neck-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeNeckClinical(context);
const milestone = await authoringBeforeLimbBoneClinical(context);
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
  ['FMA13412', 'right', 'isa', ['FJ1460'], 'head-neck', ['head-neck']],
  ['FMA13411', 'left', 'isa', ['FJ1460M'], 'head-neck', ['head-neck']],
  ['FMA81752', 'right', 'isa', ['FJ1524'], 'spine', ['spine', 'head-neck']],
  ['FMA81753', 'left', 'isa', ['FJ1524M'], 'spine', ['spine', 'head-neck']],
  ['FMA22744', 'right', 'isa', ['FJ1526'], 'spine', ['spine']],
  ['FMA22745', 'left', 'isa', ['FJ1526M'], 'spine', ['spine']],
  ['FMA22754', 'right', 'isa', ['FJ1533'], 'spine', ['spine']],
  ['FMA22756', 'left', 'isa', ['FJ1533M'], 'spine', ['spine']],
  ['FMA22757', 'right', 'isa', ['FJ1534'], 'spine', ['spine']],
  ['FMA22758', 'left', 'isa', ['FJ1534M'], 'spine', ['spine']],
  ['FMA22876', 'right', 'isa', ['FJ1538'], 'spine', ['spine']],
  ['FMA22877', 'left', 'isa', ['FJ1538M'], 'spine', ['spine']],
  ['FMA22874', 'right', 'isa', ['FJ1539'], 'spine', ['spine']],
  ['FMA22875', 'left', 'isa', ['FJ1539M'], 'spine', ['spine']],
  ['FMA22728', 'right', 'isa', ['FJ1545'], 'spine', ['spine']],
  ['FMA22729', 'left', 'isa', ['FJ1545M'], 'spine', ['spine']],
  ['FMA22726', 'right', 'isa', ['FJ1546'], 'spine', ['spine']],
  ['FMA22727', 'left', 'isa', ['FJ1546M'], 'spine', ['spine']],
  ['FMA45740', 'left', 'isa', ['FJ1558'], 'head-neck', ['head-neck']],
  ['FMA46310', 'left', 'isa', ['FJ1561'], 'spine', ['spine']],
  ['FMA32537', 'left', 'isa', ['FJ1563'], 'spine', ['spine']],
  ['FMA32535', 'left', 'isa', ['FJ1564'], 'spine', ['spine']],
  ['FMA46314', 'left', 'isa', ['FJ1566'], 'spine', ['spine']],
  ['FMA32531', 'left', 'isa', ['FJ1567'], 'spine', ['spine']],
  ['FMA32533', 'left', 'isa', ['FJ1568'], 'spine', ['spine']],
  ['FMA46318', 'left', 'isa', ['FJ1569'], 'spine', ['spine']],
  ['FMA13393', 'left', 'isa', ['FJ1570'], 'head-neck', ['head-neck']],
  ['FMA13391', 'left', 'isa', ['FJ1571'], 'head-neck', ['head-neck']],
  ['FMA13389', 'left', 'isa', ['FJ1572'], 'head-neck', ['head-neck']],
  ['FMA13409', 'left', 'isa', ['FJ1573'], 'head-neck', ['head-neck']],
  ['FMA46309', 'right', 'isa', ['FJ1582'], 'spine', ['spine']],
  ['FMA32536', 'right', 'isa', ['FJ1584'], 'spine', ['spine']],
  ['FMA32534', 'right', 'isa', ['FJ1585'], 'spine', ['spine']],
  ['FMA45739', 'right', 'isa', ['FJ1587'], 'head-neck', ['head-neck']],
  ['FMA46313', 'right', 'isa', ['FJ1588'], 'spine', ['spine']],
  ['FMA32530', 'right', 'isa', ['FJ1589'], 'spine', ['spine']],
  ['FMA32532', 'right', 'isa', ['FJ1590'], 'spine', ['spine']],
  ['FMA46317', 'right', 'isa', ['FJ1591'], 'spine', ['spine']],
  ['FMA13392', 'right', 'isa', ['FJ1592'], 'head-neck', ['head-neck']],
  ['FMA13390', 'right', 'isa', ['FJ1593'], 'head-neck', ['head-neck']],
  ['FMA13388', 'right', 'isa', ['FJ1594'], 'head-neck', ['head-neck']],
  ['FMA13408', 'right', 'isa', ['FJ1595'], 'head-neck', ['head-neck']],
  ['FMA71307', 'midline', 'isa', ['FJ1550', 'FJ1550M'], 'spine', ['spine']],
  [
    'FMA71309',
    'midline',
    'isa',
    ['FJ1552', 'FJ1552M'],
    'spine',
    ['spine', 'head-neck'],
  ],
  [
    'FMA71442',
    'midline',
    'isa',
    ['FJ1549', 'FJ1549M'],
    'spine',
    ['spine', 'head-neck'],
  ],
  [
    'FMA71443',
    'midline',
    'isa',
    ['FJ1553', 'FJ1553M'],
    'spine',
    ['spine', 'head-neck'],
  ],
  ['FMA74077', 'right', 'isa', ['FJ1462'], 'spine', ['spine', 'thorax']],
  ['FMA74078', 'left', 'isa', ['FJ1462M'], 'spine', ['spine', 'thorax']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.neckClinicalGroups.length, 26);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.neckClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
  const group = api.neckClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.neckClinicalLesson(s, t);
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
        .neckClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { region: 'thorax' },
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
      same(api.neckClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.neckClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved at the historical neck milestone',
      );
    }
  }
const group = (k) => api.neckClinicalGroups.find((g) => g.key === k);
check(group('subclavius').scope.includes('shoulder-girdle'));
check(group('subclavius').pathology.bullets[0].includes('clot'));
check(
  group('cervical-rotator').scope.includes('one file is not one muscle slip'),
);
check(group('platysma').scope.includes('facial-expression'));
check(group('platysma').pathology.bullets[0].includes('Do not probe'));
check(group('anterior-scalene').clinical.body.includes('phrenic'));
check(group('middle-scalene').clinical.bullets[0].includes('safe needle'));
check(group('posterior-scalene').clinical.body.includes('second-rib'));
check(group('sternocleidomastoid').pathology.bullets[0].includes('mimic'));
check(
  group('sternocleidomastoid').clinical.bullets[0].includes('compensatory'),
);
check(
  group('longus-capitis').pathology.body.includes('must not be relabelled'),
);
check(
  group('rectus-capitis-anterior').clinical.bullets[0].includes(
    'anterior-ramus',
  ),
);
check(
  group('rectus-capitis-posterior-minor').scope.includes(
    'not separately segmented',
  ),
);
check(group('obliquus-capitis-inferior').clinical.body.includes('C1 motor'));
check(
  group('splenius-capitis').clinical.body.includes(
    'contralateral sternocleidomastoid',
  ),
);
check(group('longissimus-capitis').pathology.body.includes('weakness'));
check(group('longissimus-cervicis').pathology.bullets[0].includes('emergency'));
check(
  group('semispinalis-capitis').clinical.bullets[0].includes('nerve-block'),
);
check(
  group('iliocostalis-cervicis').clinical.body.includes(
    'rather than directly on the iliac crest',
  ),
);
check(
  group('lumbar-interspinales').clinical.body.includes(
    'lumbar set, not a cervical',
  ),
);
check(
  group('lumbar-interspinales').pathology.bullets[0].includes('bladder/bowel'),
);
check(
  group('anterior-cervical-intertransversarii').clinical.bullets[0].includes(
    'uniform nerve supply',
  ),
);
check(
  group('posterior-cervical-intertransversarii').scope.includes(
    'Bilateral grouped',
  ),
);
check(
  group('levatores-costarum-breves').scope.includes(
    'Longi candidates remain withheld',
  ),
);
same(ids.length, 48);
same(new Set(ids).size, 48);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  52,
);
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const t of tabs)
  same(
    catalog.structures
      .filter(
        (s) =>
          s.system === 'muscles' &&
          api.bodyLesson(s, t).readiness === 'pending',
      )
      .map((s) => s.fmaId),
    ['FMA19728'],
    'The broad perineal identity is the sole pending muscle introduction, not validated anatomy',
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
    same(rows.map((r) => r[2]).sort(), [...files].sort());
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA13412', 'clinical', 'body'],
  ['FMA45740', 'pathology', 'readiness'],
  ['FMA46310', 'clinical', 'body'],
  ['FMA71307', 'pathology', 'readiness'],
  ['FMA71442', 'clinical', 'body'],
  ['FMA74077', 'clinical', 'body'],
  ['FMA32537', 'anatomy', 'body'],
  ['FMA81752', 'function', 'body'],
  ['FMA13393', 'ultrasound', 'body'],
  ['FMA49057', 'clinical', 'body'],
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
        catalog.structures.filter(
          (s) => milestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
for (const t of tabs)
  same(counts(t), {
    draft: 371,
    'identity-only': 0,
    pending: 651,
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
  bodyRepresentations: 48,
  sourceComponents: 52,
  lessonGroups: 26,
  explicitTopicEdits: 96,
  combinedPinnedCurriculumSections: 2322,
  sourceIndexChecks,
  negativeCases: negatives.length,
  readinessScope:
    'Historical neck milestone; current direct/export assertions remain active',
  bodyReadiness: Object.fromEntries(api.contentTabs.map((t) => [t, counts(t)])),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(milestone)),
  limitations:
    'Original short neck/remaining axial muscle clinical drafts; not validated disease localisation, nerve courses, joint stability, muscle activation, procedural corridors, patient scans or clinical approval.',
};
await writeFile(
  new URL('docs/neck-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
