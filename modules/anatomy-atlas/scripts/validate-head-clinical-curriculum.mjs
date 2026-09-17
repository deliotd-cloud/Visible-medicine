import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeNeckClinical } from './neck-clinical-curriculum-transition.mjs';
import { authoringBeforeHeadClinical } from './head-clinical-curriculum-transition.mjs';
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
  'content/head-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const milestone = await authoringBeforeNeckClinical(context);
const previous = await authoringBeforeHeadClinical(context);
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
/** @type {Array<[string, string, string, string[], string, string[]]>} */
const expected = [
  ['FMA49051', 'left', 'isa', ['FJ1294'], 'head-neck', ['head-neck']],
  ['FMA49047', 'left', 'isa', ['FJ1295'], 'head-neck', ['head-neck']],
  ['FMA49055', 'left', 'isa', ['FJ1304'], 'head-neck', ['head-neck']],
  ['FMA49049', 'left', 'isa', ['FJ1306'], 'head-neck', ['head-neck']],
  ['FMA49057', 'left', 'isa', ['FJ1308'], 'head-neck', ['head-neck']],
  ['FMA49053', 'left', 'isa', ['FJ1322'], 'head-neck', ['head-neck']],
  ['FMA49045', 'left', 'isa', ['FJ1323'], 'head-neck', ['head-neck']],
  ['FMA49050', 'right', 'isa', ['FJ1345'], 'head-neck', ['head-neck']],
  ['FMA49046', 'right', 'isa', ['FJ1346'], 'head-neck', ['head-neck']],
  ['FMA49054', 'right', 'isa', ['FJ1355'], 'head-neck', ['head-neck']],
  ['FMA49048', 'right', 'isa', ['FJ1357'], 'head-neck', ['head-neck']],
  ['FMA49056', 'right', 'isa', ['FJ1359'], 'head-neck', ['head-neck']],
  ['FMA49052', 'right', 'isa', ['FJ1373'], 'head-neck', ['head-neck']],
  ['FMA49044', 'right', 'isa', ['FJ1374'], 'head-neck', ['head-neck']],
  [
    'FMA46293',
    'left',
    'isa',
    ['FJ1555', 'FJ1560', 'FJ1578'],
    'head-neck',
    ['head-neck'],
  ],
  [
    'FMA46292',
    'right',
    'isa',
    ['FJ1556', 'FJ1579'],
    'head-neck',
    ['head-neck'],
  ],
  ['FMA46327', 'left', 'isa', ['FJ1559'], 'head-neck', ['head-neck']],
  ['FMA46322', 'left', 'isa', ['FJ1562'], 'head-neck', ['head-neck']],
  ['FMA13349', 'left', 'isa', ['FJ1565'], 'head-neck', ['head-neck']],
  ['FMA13347', 'left', 'isa', ['FJ1574'], 'head-neck', ['head-neck']],
  ['FMA13351', 'left', 'isa', ['FJ1575'], 'head-neck', ['head-neck']],
  ['FMA45827', 'left', 'isa', ['FJ1576'], 'head-neck', ['head-neck']],
  ['FMA13353', 'left', 'isa', ['FJ1577'], 'head-neck', ['head-neck']],
  ['FMA46326', 'right', 'isa', ['FJ1580'], 'head-neck', ['head-neck']],
  ['FMA46321', 'right', 'isa', ['FJ1583'], 'head-neck', ['head-neck']],
  ['FMA13348', 'right', 'isa', ['FJ1586'], 'head-neck', ['head-neck']],
  ['FMA13346', 'right', 'isa', ['FJ1596'], 'head-neck', ['head-neck']],
  ['FMA13350', 'right', 'isa', ['FJ1597'], 'head-neck', ['head-neck']],
  ['FMA45826', 'right', 'isa', ['FJ1598'], 'head-neck', ['head-neck']],
  ['FMA13352', 'right', 'isa', ['FJ1599'], 'head-neck', ['head-neck']],
  ['FMA46702', 'left', 'isa', ['FJ2738'], 'head-neck', ['head-neck']],
  ['FMA46704', 'left', 'isa', ['FJ2739'], 'head-neck', ['head-neck']],
  ['FMA46636', 'left', 'isa', ['FJ2740'], 'head-neck', ['head-neck']],
  ['FMA46729', 'left', 'isa', ['FJ2741'], 'head-neck', ['head-neck']],
  ['FMA46672', 'left', 'isa', ['FJ2743'], 'head-neck', ['head-neck']],
  ['FMA46670', 'left', 'isa', ['FJ2745'], 'head-neck', ['head-neck']],
  ['FMA46668', 'left', 'isa', ['FJ2746'], 'head-neck', ['head-neck']],
  ['FMA46632', 'left', 'isa', ['FJ2747'], 'head-neck', ['head-neck']],
  ['FMA46732', 'left', 'isa', ['FJ2748'], 'head-neck', ['head-neck']],
  ['FMA46698', 'right', 'isa', ['FJ2750'], 'head-neck', ['head-neck']],
  ['FMA46703', 'right', 'isa', ['FJ2751'], 'head-neck', ['head-neck']],
  ['FMA46635', 'right', 'isa', ['FJ2752'], 'head-neck', ['head-neck']],
  ['FMA46728', 'right', 'isa', ['FJ2753'], 'head-neck', ['head-neck']],
  ['FMA46671', 'right', 'isa', ['FJ2755'], 'head-neck', ['head-neck']],
  ['FMA46669', 'right', 'isa', ['FJ2757'], 'head-neck', ['head-neck']],
  ['FMA46667', 'right', 'isa', ['FJ2758'], 'head-neck', ['head-neck']],
  ['FMA46631', 'right', 'isa', ['FJ2759'], 'head-neck', ['head-neck']],
  ['FMA46731', 'right', 'isa', ['FJ2760'], 'head-neck', ['head-neck']],
  ['FMA46733', 'midline', 'isa', ['FJ2762'], 'head-neck', ['head-neck']],
  ['FMA46581', 'left', 'isa', ['FJ2778'], 'head-neck', ['head-neck']],
  ['FMA46585', 'left', 'isa', ['FJ2780'], 'head-neck', ['head-neck']],
  ['FMA46578', 'left', 'isa', ['FJ2782'], 'head-neck', ['head-neck']],
  ['FMA46590', 'left', 'isa', ['FJ2784', 'FJ2785'], 'head-neck', ['head-neck']],
  ['FMA46593', 'left', 'isa', ['FJ2788'], 'head-neck', ['head-neck']],
  ['FMA46580', 'right', 'isa', ['FJ2796'], 'head-neck', ['head-neck']],
  ['FMA46584', 'right', 'isa', ['FJ2798'], 'head-neck', ['head-neck']],
  ['FMA46577', 'right', 'isa', ['FJ2800'], 'head-neck', ['head-neck']],
  [
    'FMA46589',
    'right',
    'isa',
    ['FJ2802', 'FJ2803'],
    'head-neck',
    ['head-neck'],
  ],
  ['FMA46592', 'right', 'isa', ['FJ2806'], 'head-neck', ['head-neck']],
  ['FMA46582', 'midline', 'isa', ['FJ2809'], 'head-neck', ['head-neck']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.headClinicalGroups.length, 29);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.headClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
  const group = api.headClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.headClinicalLesson(s, t);
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
        .headClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(api.headClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.headClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.headClinicalGroups.find((g) => g.key === k);
check(group('medial-rectus').pathology.body.includes('Internuclear'));
check(group('medial-rectus').pathology.bullets[0].includes('may be preserved'));
check(group('inferior-oblique').pathology.body.includes('Brown syndrome'));
check(
  group('inferior-rectus').pathology.bullets[0].includes(
    'does not by itself prove',
  ),
);
check(group('superior-rectus').clinical.bullets[0].includes('pupil-sparing'));
check(
  group('levator-palpebrae').clinical.bullets[0].includes('superior tarsal'),
);
check(
  group('digastric').scope.includes('file count is not a count of bellies'),
);
check(group('geniohyoid').clinical.body.includes('C1 fibres'));
check(group('thyrohyoid').clinical.body.includes('C1 fibres'));
check(
  group('sternothyroid').clinical.body.includes(
    'not insertion into the thyroid gland',
  ),
);
check(group('stylohyoid').pathology.body.includes('ligament'));
check(group('mylohyoid').pathology.body.includes('Ludwig'));
check(group('genioglossus').pathology.bullets[0].includes('supranuclear'));
check(group('tensor-veli').clinical.body.includes('V3'));
check(group('stylopharyngeus').clinical.body.includes('(IX)'));
check(group('superior-constrictor').scope.includes('middle constrictors'));
check(
  group('inferior-constrictor').pathology.body.includes('mucosa/submucosa'),
);
check(group('posterior-cricoarytenoid').clinical.body.includes('abducts'));
check(
  group('posterior-cricoarytenoid').pathology.bullets[0].includes('emergency'),
);
check(group('laryngeal-adductors').clinical.body.includes('adduction'));
check(group('thyroarytenoid').scope.includes('Two source files'));
check(group('vocalis').clinical.body.includes('connective vocal ligament'));
same(ids.length, 60);
same(new Set(ids).size, 60);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  65,
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
  ['FMA49057', 'clinical', 'body'],
  ['FMA49045', 'pathology', 'readiness'],
  ['FMA46293', 'clinical', 'body'],
  ['FMA46590', 'pathology', 'readiness'],
  ['FMA46582', 'clinical', 'body'],
  ['FMA49047', 'anatomy', 'body'],
  ['FMA46702', 'function', 'body'],
  ['FMA46578', 'ultrasound', 'body'],
  ['FMA9756', 'clinical', 'body'],
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
    draft: 323,
    'identity-only': 0,
    pending: 699,
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
  bodyRepresentations: 60,
  sourceComponents: 65,
  lessonGroups: 29,
  explicitTopicEdits: 120,
  combinedPinnedCurriculumSections: 2226,
  sourceIndexChecks,
  negativeCases: negatives.length,
  readinessScope:
    'Historical head milestone; current direct/export assertions remain active',
  bodyReadiness: Object.fromEntries(api.contentTabs.map((t) => [t, counts(t)])),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(milestone)),
  limitations:
    'Original short orbital/swallowing/voice clinical drafts; not validated eye motility, tendon restriction, nerve lesions, swallow physiology, vocal-fold motion, procedural corridors, patient scans or clinical approval.',
};
await writeFile(
  new URL('docs/head-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
