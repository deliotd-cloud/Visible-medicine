import assert from 'node:assert/strict';
import { authoringBeforeCranialBoneClinical } from './cranial-bone-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeAxialBoneClinical } from './axial-bone-clinical-curriculum-transition.mjs';
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
  'content/axial-bone-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeAxialBoneClinical(context);
const milestone = await authoringBeforeCranialBoneClinical(context);
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
  ['FMA10037', 'midline', 'isa', ['FJ3154'], 'spine', ['spine', 'thorax']],
  ['FMA10059', 'midline', 'isa', ['FJ3155'], 'spine', ['spine', 'thorax']],
  ['FMA10081', 'midline', 'isa', ['FJ3156'], 'spine', ['spine', 'thorax']],
  ['FMA13072', 'midline', 'isa', ['FJ3157'], 'spine', ['spine', 'abdomen']],
  ['FMA9165', 'midline', 'isa', ['FJ3158'], 'spine', ['spine', 'thorax']],
  ['FMA13073', 'midline', 'isa', ['FJ3159'], 'spine', ['spine', 'abdomen']],
  ['FMA9187', 'midline', 'isa', ['FJ3160'], 'spine', ['spine', 'thorax']],
  ['FMA12521', 'midline', 'isa', ['FJ3161'], 'spine', ['spine', 'head-neck']],
  ['FMA13074', 'midline', 'isa', ['FJ3162'], 'spine', ['spine', 'abdomen']],
  ['FMA9209', 'midline', 'isa', ['FJ3163'], 'spine', ['spine', 'thorax']],
  ['FMA12522', 'midline', 'isa', ['FJ3164'], 'spine', ['spine', 'head-neck']],
  ['FMA13075', 'midline', 'isa', ['FJ3165'], 'spine', ['spine', 'abdomen']],
  ['FMA9248', 'midline', 'isa', ['FJ3166'], 'spine', ['spine', 'thorax']],
  ['FMA12523', 'midline', 'isa', ['FJ3167'], 'spine', ['spine', 'head-neck']],
  ['FMA13076', 'midline', 'isa', ['FJ3168'], 'spine', ['spine', 'abdomen']],
  ['FMA9922', 'midline', 'isa', ['FJ3169'], 'spine', ['spine', 'thorax']],
  ['FMA12524', 'midline', 'isa', ['FJ3170'], 'spine', ['spine', 'head-neck']],
  ['FMA9945', 'midline', 'isa', ['FJ3171'], 'spine', ['spine', 'thorax']],
  ['FMA12525', 'midline', 'isa', ['FJ3172'], 'spine', ['spine', 'head-neck']],
  ['FMA9968', 'midline', 'isa', ['FJ3173'], 'spine', ['spine', 'thorax']],
  ['FMA9991', 'midline', 'isa', ['FJ3174'], 'spine', ['spine', 'thorax']],
  ['FMA10014', 'midline', 'isa', ['FJ3175'], 'spine', ['spine', 'thorax']],
  ['FMA12519', 'midline', 'isa', ['FJ3176'], 'spine', ['spine', 'head-neck']],
  ['FMA12520', 'midline', 'isa', ['FJ3177'], 'spine', ['spine', 'head-neck']],
  ['FMA8472', 'left', 'isa', ['FJ3225'], 'thorax', ['thorax']],
  ['FMA8532', 'left', 'isa', ['FJ3226'], 'thorax', ['thorax']],
  ['FMA8534', 'left', 'isa', ['FJ3227'], 'thorax', ['thorax']],
  ['FMA7987', 'left', 'isa', ['FJ3228'], 'thorax', ['thorax']],
  ['FMA8012', 'left', 'isa', ['FJ3229'], 'thorax', ['thorax']],
  ['FMA8039', 'left', 'isa', ['FJ3230'], 'thorax', ['thorax']],
  ['FMA8148', 'left', 'isa', ['FJ3231'], 'thorax', ['thorax']],
  ['FMA8093', 'left', 'isa', ['FJ3232'], 'thorax', ['thorax']],
  ['FMA8202', 'left', 'isa', ['FJ3233'], 'thorax', ['thorax']],
  ['FMA8256', 'left', 'isa', ['FJ3234'], 'thorax', ['thorax']],
  ['FMA8310', 'left', 'isa', ['FJ3235'], 'thorax', ['thorax']],
  ['FMA8391', 'left', 'isa', ['FJ3236'], 'thorax', ['thorax']],
  ['FMA8445', 'right', 'isa', ['FJ3330'], 'thorax', ['thorax']],
  ['FMA8531', 'right', 'isa', ['FJ3331'], 'thorax', ['thorax']],
  ['FMA8533', 'right', 'isa', ['FJ3332'], 'thorax', ['thorax']],
  ['FMA7857', 'right', 'isa', ['FJ3334'], 'thorax', ['thorax']],
  ['FMA7882', 'right', 'isa', ['FJ3336'], 'thorax', ['thorax']],
  ['FMA7909', 'right', 'isa', ['FJ3338'], 'thorax', ['thorax']],
  ['FMA7957', 'right', 'isa', ['FJ3340'], 'thorax', ['thorax']],
  ['FMA8066', 'right', 'isa', ['FJ3342'], 'thorax', ['thorax']],
  ['FMA8175', 'right', 'isa', ['FJ3344'], 'thorax', ['thorax']],
  ['FMA8229', 'right', 'isa', ['FJ3346'], 'thorax', ['thorax']],
  ['FMA8283', 'right', 'isa', ['FJ3347'], 'thorax', ['thorax']],
  ['FMA8364', 'right', 'isa', ['FJ3348'], 'thorax', ['thorax']],
  [
    'FMA16202',
    'midline',
    'isa',
    ['FJ3393'],
    'spine',
    ['spine', 'pelvis', 'thigh'],
  ],
  ['FMA7486', 'midline', 'isa', ['FJ3290'], 'thorax', ['thorax']],
  ['FMA7487', 'midline', 'isa', ['FJ3178'], 'thorax', ['thorax']],
  ['FMA7488', 'midline', 'isa', ['FJ3153'], 'thorax', ['thorax']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.axialBoneClinicalGroups.length, 15);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.axialBoneClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
  const group = api.axialBoneClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.axialBoneClinicalLesson(s, t);
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
        .axialBoneClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(api.axialBoneClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.axialBoneClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved at the historical axial-bone milestone',
      );
    }
  }
const group = (k) => api.axialBoneClinicalGroups.find((g) => g.key === k);

check(group('atlas').scope.includes('not a body-bearing'));
check(group('atlas').clinical.bullets[0].includes('transverse ligament'));
check(group('axis').pathology.body.includes('odontoid'));
check(group('axis').clinical.body.includes('C2–C3'));
check(group('subaxial-cervical').clinical.bullets[0].includes('MRI after CT'));
check(
  group('thoracic-vertebrae').pathology.bullets[0].includes(
    'other bone-weakening',
  ),
);
check(group('thoracolumbar-junction').pathology.body.includes('distraction'));
check(
  group('thoracolumbar-junction').pathology.bullets[0].includes(
    'neither every',
  ),
);
check(group('lumbar-vertebrae').pathology.body.includes('thickened ligaments'));
check(group('lumbar-vertebrae').clinical.bullets[0].includes('emergency'));
check(
  group('lumbosacral-junction').pathology.body.includes('does not inevitably'),
);
check(
  group('lumbosacral-junction').pathology.bullets[0].includes('without a pars'),
);
check(group('sacrum').scope.includes('One fused sacrum'));
check(group('sacrum').pathology.body.includes('difficult to see'));
check(group('first-rib').pathology.body.includes('not inevitable'));
check(group('second-rib').pathology.body.includes('deep breathing'));
check(
  group('ribs-three-to-ten').pathology.bullets[0].includes('three consecutive'),
);
check(
  group('ribs-three-to-ten').clinical.bullets[0].includes(
    'intact reference bones',
  ),
);
check(group('floating-ribs').scope.includes('does not mean fractured'));
check(group('floating-ribs').pathology.bullets[0].includes('emergency'));
check(group('manubrium').clinical.bullets[0].includes('not because'));
check(group('sternal-body').pathology.body.includes('does not establish'));
check(group('xiphoid').pathology.body.includes('normal variant'));
same(ids.length, 52);
same(new Set(ids).size, 52);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  52,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.axialBoneClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
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
  ['FMA12519', 'clinical', 'body'],
  ['FMA12520', 'pathology', 'readiness'],
  ['FMA12525', 'clinical', 'body'],
  ['FMA10081', 'pathology', 'body'],
  ['FMA16202', 'clinical', 'body'],
  ['FMA7857', 'pathology', 'body'],
  ['FMA8039', 'clinical', 'body'],
  ['FMA7487', 'clinical', 'body'],
  ['FMA7488', 'pathology', 'body'],
  ['FMA7486', 'anatomy', 'body'],
  ['FMA9165', 'function', 'body'],
  ['FMA12522', 'ultrasound', 'body'],
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
    draft: 440,
    'identity-only': 0,
    pending: 582,
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
  bodyRepresentations: 52,
  sourceComponents: 52,
  lessonGroups: 15,
  explicitTopicEdits: 104,
  combinedPinnedCurriculumSections: 2460,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: Object.fromEntries(api.contentTabs.map((t) => [t, counts(t)])),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  countsScope:
    'Historical axial-bone milestone; current direct/export assertions remain active',
  copyAndRecipeHash: curriculumHash(copy(milestone)),
  limitations:
    'Original short vertebral/sacral/rib/sternal clinical drafts; not validated fractures, neural lesions, joint or ligament stability, breathing mechanics, patient scans, procedural guidance or clinical approval.',
};
await writeFile(
  new URL('docs/axial-bone-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
