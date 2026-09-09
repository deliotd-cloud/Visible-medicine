import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeAcralBoneClinical } from './acral-bone-clinical-curriculum-transition.mjs';
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
  'content/acral-bone-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeAcralBoneClinical(context);
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
  ['FMA32653', 'left', 'isa', ['FJ3179'], 'foot', ['foot']],
  ['FMA32655', 'left', 'isa', ['FJ3180'], 'foot', ['foot']],
  ['FMA32657', 'left', 'isa', ['FJ3181'], 'foot', ['foot']],
  ['FMA32651', 'left', 'isa', ['FJ3182'], 'foot', ['foot']],
  ['FMA23953', 'left', 'isa', ['FJ3183'], 'hand', ['hand']],
  ['FMA23959', 'left', 'isa', ['FJ3184'], 'hand', ['hand']],
  ['FMA32659', 'left', 'isa', ['FJ3185'], 'foot', ['foot']],
  ['FMA23955', 'left', 'isa', ['FJ3186'], 'hand', ['hand']],
  ['FMA23957', 'left', 'isa', ['FJ3187'], 'hand', ['hand']],
  ['FMA23951', 'left', 'isa', ['FJ3188'], 'hand', ['hand']],
  ['FMA32652', 'right', 'isa', ['FJ3189'], 'foot', ['foot']],
  ['FMA32654', 'right', 'isa', ['FJ3190'], 'foot', ['foot']],
  ['FMA32656', 'right', 'isa', ['FJ3191'], 'foot', ['foot']],
  ['FMA32650', 'right', 'isa', ['FJ3192'], 'foot', ['foot']],
  ['FMA24460', 'right', 'isa', ['FJ3193'], 'hand', ['hand']],
  ['FMA24463', 'right', 'isa', ['FJ3194'], 'hand', ['hand']],
  ['FMA32658', 'right', 'isa', ['FJ3195'], 'foot', ['foot']],
  ['FMA24461', 'right', 'isa', ['FJ3196'], 'hand', ['hand']],
  ['FMA24462', 'right', 'isa', ['FJ3197'], 'hand', ['hand']],
  ['FMA24459', 'right', 'isa', ['FJ3198'], 'hand', ['hand']],
  ['FMA24465', 'left', 'isa', ['FJ3240'], 'hand', ['hand']],
  ['FMA24508', 'left', 'isa', ['FJ3241'], 'foot', ['foot']],
  ['FMA24467', 'left', 'isa', ['FJ3243'], 'hand', ['hand']],
  ['FMA24510', 'left', 'isa', ['FJ3244'], 'foot', ['foot']],
  ['FMA24469', 'left', 'isa', ['FJ3246'], 'hand', ['hand']],
  ['FMA24512', 'left', 'isa', ['FJ3247'], 'foot', ['foot']],
  ['FMA24471', 'left', 'isa', ['FJ3249'], 'hand', ['hand']],
  ['FMA24514', 'left', 'isa', ['FJ3250'], 'foot', ['foot']],
  ['FMA24473', 'left', 'isa', ['FJ3252'], 'hand', ['hand']],
  ['FMA24516', 'left', 'isa', ['FJ3253'], 'foot', ['foot']],
  ['FMA24498', 'left', 'isa', ['FJ3256'], 'foot', ['foot']],
  ['FMA24447', 'left', 'isa', ['FJ3257'], 'hand', ['hand']],
  ['FMA24529', 'left', 'isa', ['FJ3258'], 'foot', ['foot']],
  ['FMA24449', 'left', 'isa', ['FJ3261'], 'hand', ['hand']],
  ['FMA24524', 'left', 'isa', ['FJ3264'], 'foot', ['foot']],
  ['FMA24526', 'left', 'isa', ['FJ3267'], 'foot', ['foot']],
  ['FMA24438', 'left', 'isa', ['FJ3268'], 'hand', ['hand']],
  ['FMA24522', 'left', 'isa', ['FJ3271'], 'foot', ['foot']],
  ['FMA24442', 'left', 'isa', ['FJ3276'], 'hand', ['hand']],
  ['FMA24436', 'left', 'isa', ['FJ3278'], 'hand', ['hand']],
  ['FMA24483', 'left', 'isa', ['FJ3280'], 'foot', ['foot']],
  ['FMA24444', 'left', 'isa', ['FJ3283'], 'hand', ['hand']],
  ['FMA24445', 'left', 'isa', ['FJ3284'], 'hand', ['hand']],
  ['FMA24440', 'left', 'isa', ['FJ3285'], 'hand', ['hand']],
  ['FMA23942', 'left', 'isa', ['FJ3291'], 'hand', ['hand']],
  ['FMA24457', 'right', 'isa', ['FJ3292'], 'hand', ['hand']],
  ['FMA32643', 'left', 'isa', ['FJ3293'], 'foot', ['foot']],
  ['FMA32645', 'left', 'isa', ['FJ3294'], 'foot', ['foot']],
  ['FMA32647', 'left', 'isa', ['FJ3295'], 'foot', ['foot']],
  ['FMA23938', 'left', 'isa', ['FJ3296'], 'hand', ['hand']],
  ['FMA23944', 'left', 'isa', ['FJ3297'], 'hand', ['hand']],
  ['FMA230988', 'left', 'isa', ['FJ3298'], 'foot', ['foot']],
  ['FMA23940', 'left', 'isa', ['FJ3299'], 'hand', ['hand']],
  ['FMA32642', 'right', 'isa', ['FJ3300'], 'foot', ['foot']],
  ['FMA32644', 'right', 'isa', ['FJ3301'], 'foot', ['foot']],
  ['FMA32646', 'right', 'isa', ['FJ3302'], 'foot', ['foot']],
  ['FMA24455', 'right', 'isa', ['FJ3303'], 'hand', ['hand']],
  ['FMA24458', 'right', 'isa', ['FJ3304'], 'hand', ['hand']],
  ['FMA230986', 'right', 'isa', ['FJ3305'], 'foot', ['foot']],
  ['FMA24456', 'right', 'isa', ['FJ3306'], 'hand', ['hand']],
  ['FMA24501', 'left', 'isa', ['FJ3307'], 'foot', ['foot']],
  ['FMA24500', 'right', 'isa', ['FJ3308'], 'foot', ['foot']],
  ['FMA43253', 'right', 'isa', ['FJ3310'], 'foot', ['foot']],
  ['FMA32637', 'left', 'isa', ['FJ3311'], 'foot', ['foot']],
  ['FMA32639', 'left', 'isa', ['FJ3312'], 'foot', ['foot']],
  ['FMA71915', 'left', 'isa', ['FJ3313'], 'hand', ['hand']],
  ['FMA66791', 'left', 'isa', ['FJ3314'], 'hand', ['hand']],
  ['FMA32641', 'left', 'isa', ['FJ3315'], 'foot', ['foot']],
  ['FMA71908', 'left', 'isa', ['FJ3316'], 'hand', ['hand']],
  ['FMA71916', 'left', 'isa', ['FJ3317'], 'hand', ['hand']],
  ['FMA65470', 'left', 'isa', ['FJ3318'], 'hand', ['hand']],
  ['FMA32634', 'right', 'isa', ['FJ3319'], 'foot', ['foot']],
  ['FMA32636', 'right', 'isa', ['FJ3320'], 'foot', ['foot']],
  ['FMA32638', 'right', 'isa', ['FJ3321'], 'foot', ['foot']],
  ['FMA24451', 'right', 'isa', ['FJ3322'], 'hand', ['hand']],
  ['FMA24454', 'right', 'isa', ['FJ3323'], 'hand', ['hand']],
  ['FMA32640', 'right', 'isa', ['FJ3324'], 'foot', ['foot']],
  ['FMA24452', 'right', 'isa', ['FJ3325'], 'hand', ['hand']],
  ['FMA24453', 'right', 'isa', ['FJ3326'], 'hand', ['hand']],
  ['FMA24450', 'right', 'isa', ['FJ3327'], 'hand', ['hand']],
  ['FMA32635', 'left', 'isa', ['FJ3328'], 'foot', ['foot']],
  ['FMA43254', 'left', 'isa', ['FJ3329'], 'foot', ['foot']],
  ['FMA24464', 'right', 'isa', ['FJ3350'], 'hand', ['hand']],
  ['FMA24507', 'right', 'isa', ['FJ3351'], 'foot', ['foot']],
  ['FMA24466', 'right', 'isa', ['FJ3352'], 'hand', ['hand']],
  ['FMA24509', 'right', 'isa', ['FJ3353'], 'foot', ['foot']],
  ['FMA24468', 'right', 'isa', ['FJ3354'], 'hand', ['hand']],
  ['FMA24511', 'right', 'isa', ['FJ3355'], 'foot', ['foot']],
  ['FMA24470', 'right', 'isa', ['FJ3356'], 'hand', ['hand']],
  ['FMA24513', 'right', 'isa', ['FJ3357'], 'foot', ['foot']],
  ['FMA24472', 'right', 'isa', ['FJ3358'], 'hand', ['hand']],
  ['FMA24515', 'right', 'isa', ['FJ3359'], 'foot', ['foot']],
  ['FMA24497', 'right', 'isa', ['FJ3360'], 'foot', ['foot']],
  ['FMA24446', 'right', 'isa', ['FJ3361'], 'hand', ['hand']],
  ['FMA24528', 'right', 'isa', ['FJ3364'], 'foot', ['foot']],
  ['FMA24448', 'right', 'isa', ['FJ3367'], 'hand', ['hand']],
  ['FMA24523', 'right', 'isa', ['FJ3370'], 'foot', ['foot']],
  ['FMA24525', 'right', 'isa', ['FJ3373'], 'foot', ['foot']],
  ['FMA24437', 'right', 'isa', ['FJ3374'], 'hand', ['hand']],
  ['FMA24521', 'right', 'isa', ['FJ3377'], 'foot', ['foot']],
  ['FMA24441', 'right', 'isa', ['FJ3382'], 'hand', ['hand']],
  ['FMA24435', 'right', 'isa', ['FJ3383'], 'hand', ['hand']],
  ['FMA24482', 'right', 'isa', ['FJ3385'], 'foot', ['foot']],
  ['FMA24443', 'right', 'isa', ['FJ3388'], 'hand', ['hand']],
  ['FMA23725', 'right', 'isa', ['FJ3389'], 'hand', ['hand']],
  ['FMA24439', 'right', 'isa', ['FJ3390'], 'hand', ['hand']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.acralBoneClinicalGroups.length, 28);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.acralBoneClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    ['skeleton', 'bone', side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files].sort(),
  );
  same(e.omittedSourceFiles, []);
  const group = api.acralBoneClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.acralBoneClinicalLesson(s, t);
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
        .acralBoneClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { category: 'tendon' },
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
      same(api.acralBoneClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.acralBoneClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.acralBoneClinicalGroups.find((g) => g.key === k);

check(group('scaphoid').pathology.body.includes('invisible on initial'));
check(group('lunate').pathology.body.includes('multifactorial'));
check(group('triquetrum').scope.includes('distinct bones'));
check(group('pisiform').scope.includes('sesamoid'));
check(group('trapezium').pathology.body.includes('do not always'));
check(group('central-carpals').pathology.body.includes('coexist'));
check(group('hamate').scope.includes('one hamate'));
check(group('thumb-metacarpal').scope.includes('separate joint'));
check(group('central-metacarpals').pathology.body.includes('rotation'));
check(group('fifth-metacarpal').pathology.body.includes('not every'));
check(group('thumb-proximal-phalanx').scope.includes('no middle'));
check(group('finger-proximal-phalanges').scope.includes('digit and segment'));
check(
  group('finger-middle-phalanges').pathology.bullets[0].includes(
    'not interchangeable',
  ),
);
check(
  group('finger-distal-phalanges').pathology.body.includes('with or without'),
);
check(group('thumb-distal-phalanx').scope.includes('IP joint'));
check(group('talus').pathology.bullets[0].includes('not inevitable'));
check(group('calcaneus').pathology.body.includes('spine'));
check(group('navicular').scope.includes('not the wrist'));
check(group('cuboid').clinical.bullets[0].includes('not a correction'));
check(group('cuneiforms').pathology.body.includes('ligamentous'));
check(group('first-metatarsal').scope.includes('not the hallux IP'));
check(group('second-metatarsal').pathology.body.includes('most commonly'));
check(group('second-metatarsal').pathology.bullets[0].includes('not assumed'));
check(
  group('third-fourth-metatarsals').pathology.body.includes(
    'plain radiographs',
  ),
);
check(group('fifth-metatarsal').pathology.body.includes('different'));
check(group('hallux-proximal-phalanx').scope.includes('no middle'));
check(
  group('lesser-toe-proximal-phalanges').pathology.body.includes(
    'not necessarily',
  ),
);
check(group('lesser-toe-middle-phalanges').pathology.body.includes('PIP'));
check(group('toe-distal-phalanges').pathology.bullets[0].includes('emergency'));
same(ids.length, 106);
same(new Set(ids).size, 106);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  106,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.acralBoneClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.acralBoneClinicalLesson(entry(f), tab), undefined);
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
    same(rows.map((r) => r[2]).sort(), [...files].sort());
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA24436', 'clinical', 'body'],
  ['FMA24438', 'pathology', 'readiness'],
  ['FMA24440', 'clinical', 'body'],
  ['FMA24442', 'pathology', 'body'],
  ['FMA24444', 'clinical', 'body'],
  ['FMA24447', 'pathology', 'body'],
  ['FMA24449', 'clinical', 'body'],
  ['FMA24465', 'pathology', 'body'],
  ['FMA24467', 'clinical', 'body'],
  ['FMA24473', 'pathology', 'body'],
  ['FMA65470', 'clinical', 'body'],
  ['FMA71915', 'pathology', 'body'],
  ['FMA23942', 'clinical', 'body'],
  ['FMA23953', 'pathology', 'body'],
  ['FMA23951', 'clinical', 'body'],
  ['FMA24483', 'pathology', 'body'],
  ['FMA24498', 'clinical', 'body'],
  ['FMA24501', 'pathology', 'body'],
  ['FMA24529', 'clinical', 'body'],
  ['FMA24524', 'pathology', 'body'],
  ['FMA24508', 'clinical', 'body'],
  ['FMA24510', 'pathology', 'body'],
  ['FMA24512', 'clinical', 'body'],
  ['FMA24516', 'pathology', 'body'],
  ['FMA43253', 'clinical', 'body'],
  ['FMA32637', 'pathology', 'body'],
  ['FMA32643', 'clinical', 'body'],
  ['FMA32653', 'pathology', 'body'],
  ['FMA24435', 'anatomy', 'body'],
  ['FMA24482', 'function', 'body'],
  ['FMA24507', 'ultrasound', 'body'],
  ['FMA45097', 'clinical', 'readiness'],
  ['FMA45098', 'pathology', 'readiness'],
  ...legacyRightShoulder.map((f) => [f, 'clinical', 'body']),
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
  await assert.rejects(
    async () => {
      // Readiness is omitted from the displayed-copy hash: test held states directly.
      for (const held of ['FMA45097', 'FMA45098'])
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
    draft: 569,
    'identity-only': 0,
    pending: 453,
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
  bodyRepresentations: 106,
  sourceComponents: 106,
  lessonGroups: 28,
  explicitTopicEdits: 212,
  combinedPinnedCurriculumSections: 2718,
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
    'Original short hand/foot bone clinical drafts; two grouped foot-sesamoid identities remain pending. Not fracture reconstruction, ligament/tendon testing, measured loading or perfusion, patient scans, procedural guidance or clinical approval.',
};
await writeFile(
  new URL('docs/acral-bone-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
