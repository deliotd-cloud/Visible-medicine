import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeThighClinical } from './thigh-clinical-curriculum-transition.mjs';
import { authoringBeforeLegClinical } from './leg-clinical-curriculum-transition.mjs';
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
  'content/thigh-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeThighClinical(context);
const milestone = await authoringBeforeLegClinical(context);
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
const expected = [
  ['FMA22452', 'right', 'FJ1401', 'thigh', ['thigh']],
  ['FMA22454', 'left', 'FJ1401M', 'thigh', ['thigh']],
  ['FMA22456', 'right', 'FJ1402', 'thigh', ['thigh']],
  ['FMA22457', 'left', 'FJ1402M', 'thigh', ['thigh']],
  ['FMA22459', 'right', 'FJ1403', 'thigh', ['thigh']],
  ['FMA22460', 'left', 'FJ1403M', 'thigh', ['thigh']],
  ['FMA43886', 'right', 'FJ1404', 'thigh', ['thigh']],
  ['FMA43887', 'left', 'FJ1404M', 'thigh', ['thigh']],
  ['FMA22336', 'right', 'FJ1416', 'thigh', ['thigh', 'pelvis']],
  ['FMA22337', 'left', 'FJ1416M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22334', 'right', 'FJ1417', 'thigh', ['thigh', 'pelvis']],
  ['FMA22335', 'left', 'FJ1417M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22328', 'right', 'FJ1418', 'thigh', ['thigh', 'pelvis']],
  ['FMA22329', 'left', 'FJ1418M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22330', 'right', 'FJ1419', 'thigh', ['thigh', 'pelvis']],
  ['FMA22331', 'left', 'FJ1419M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22332', 'right', 'FJ1420', 'thigh', ['thigh', 'pelvis']],
  ['FMA22333', 'left', 'FJ1420M', 'thigh', ['thigh', 'pelvis']],
  ['FMA43883', 'right', 'FJ1421', 'thigh', ['thigh']],
  ['FMA43884', 'left', 'FJ1421M', 'thigh', ['thigh']],
  ['FMA22322', 'right', 'FJ1422', 'thigh', ['thigh', 'pelvis']],
  ['FMA22323', 'left', 'FJ1422M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22326', 'right', 'FJ1425', 'thigh', ['thigh', 'pelvis']],
  ['FMA22327', 'left', 'FJ1425M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22324', 'right', 'FJ1426', 'thigh', ['thigh', 'pelvis']],
  ['FMA22325', 'left', 'FJ1426M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22450', 'right', 'FJ1427', 'thigh', ['thigh']],
  ['FMA22451', 'left', 'FJ1427M', 'thigh', ['thigh']],
  ['FMA22340', 'right', 'FJ1428', 'thigh', ['thigh', 'pelvis']],
  ['FMA22341', 'left', 'FJ1428M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22342', 'right', 'FJ1431', 'spine', ['spine', 'thigh']],
  ['FMA22343', 'left', 'FJ1431M', 'spine', ['spine', 'thigh']],
  ['FMA22338', 'right', 'FJ1432', 'thigh', ['thigh', 'pelvis']],
  ['FMA22339', 'left', 'FJ1432M', 'thigh', ['thigh', 'pelvis']],
  ['FMA22354', 'right', 'FJ1434', 'thigh', ['thigh']],
  ['FMA22355', 'left', 'FJ1434M', 'thigh', ['thigh']],
  ['FMA22448', 'right', 'FJ1435', 'thigh', ['thigh']],
  ['FMA22449', 'left', 'FJ1435M', 'thigh', ['thigh']],
  ['FMA22358', 'right', 'FJ1436', 'thigh', ['thigh']],
  ['FMA22359', 'left', 'FJ1436M', 'thigh', ['thigh']],
  ['FMA22425', 'right', 'FJ1438', 'thigh', ['thigh']],
  ['FMA22426', 'left', 'FJ1438M', 'thigh', ['thigh']],
  ['FMA38928', 'right', 'FJ1433', 'thigh', ['thigh']],
  ['FMA38929', 'left', 'FJ1433M', 'thigh', ['thigh']],
  ['FMA38930', 'right', 'FJ1442', 'thigh', ['thigh']],
  ['FMA38931', 'left', 'FJ1442M', 'thigh', ['thigh']],
  ['FMA38932', 'right', 'FJ1443', 'thigh', ['thigh']],
  ['FMA38933', 'left', 'FJ1443M', 'thigh', ['thigh']],
  ['FMA38934', 'right', 'FJ1441', 'thigh', ['thigh']],
  ['FMA38935', 'left', 'FJ1441M', 'thigh', ['thigh']],
  ['FMA45888', 'right', 'FJ1395', 'thigh', ['thigh']],
  ['FMA45889', 'left', 'FJ1395M', 'thigh', ['thigh']],
  ['FMA45891', 'right', 'FJ1444', 'thigh', ['thigh']],
  ['FMA45892', 'left', 'FJ1444M', 'thigh', ['thigh']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.thighClinicalGroups.length, 20);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.thighClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(
  before.entries.map((e) => e.fmaId).sort(),
  [...ids].sort((a, b) => a.localeCompare(b)),
);
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, file, region, regions] of expected) {
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
    ['muscles', 'muscle', side, region, regions, 'isa', [file]],
  );
  same(e.sourceIndexFiles, [file]);
  same(e.omittedSourceFiles, []);
  const group = api.thighClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.thighClinicalLesson(s, t);
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
        .thighClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { regions: ['thigh', 'head-neck'] },
      { regions: [...s.regions, ...s.regions] },
      ...(s.regions.length > 1
        ? [
            { regions: [...s.regions].reverse() },
            { regions: s.regions.slice(0, 1) },
          ]
        : []),
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: 'partof' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
    ])
      same(api.thighClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.thighClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.thighClinicalGroups.find((g) => g.key === k);
check(group('adductors').clinical.body.includes('does not identify one'));
check(group('magnus-minimus').scope.includes('variably separate'));
check(group('gracilis').pathology.bullets[0].includes('not proof'));
check(group('pectineus').clinical.bullets[0].includes('usually femoral'));
check(group('gemelli-obturator-internus').scope.includes('No sciatic'));
check(
  group('obturator-externus').clinical.bullets[0].includes('not prevalence'),
);
check(
  group('gluteus-maximus').clinical.bullets[0].includes('inferior-gluteal'),
);
check(group('hip-abductors').clinical.body.includes('unsupported side'));
check(group('hip-abductors').clinical.bullets[0].includes('supported hip'));
check(group('iliacus').clinical.bullets[0].includes('different motor'));
check(group('psoas').scope.includes('spine and thigh'));
check(group('piriformis').pathology.bullets[0].includes('not synonymous'));
check(
  group('quadratus-femoris').pathology.bullets[0].includes('without symptoms'),
);
check(
  group('sartorius').clinical.bullets[0].includes('not one of the hamstring'),
);
check(group('semimembranosus').clinical.body.includes('differs from the pes'));
check(
  group('semitendinosus').pathology.bullets[0].includes(
    'different clinical locations',
  ),
);
check(
  group('tfl').scope.includes('fascial') ||
    group('tfl').scope.includes('iliotibial tract'),
);
check(group('rectus-femoris').clinical.body.includes('vasti do not'));
check(group('vasti').clinical.bullets[1].includes('above the patella'));
check(group('biceps-long').clinical.body.includes('tibial division'));
check(group('biceps-short').pathology.bullets[0].includes('no ischial origin'));
const unresolved = ['FMA45097', 'FMA45098', 'FMA19728', 'FMA61970'];
for (const f of unresolved)
  same(api.bodyLesson(entry(f), 'function').readiness, 'pending');
for (const f of unresolved.slice(0, 2))
  same(api.bodyLesson(entry(f), 'anatomy').readiness, 'identity-only');
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rows = (
    await readFile(
      new URL('../../work/bodyparts3d/isa_element_parts.txt', import.meta.url),
      'utf8',
    )
  )
    .trim()
    .split(/\r?\n/)
    .map((l) => l.split('\t'));
  for (const [f, , file] of expected) {
    same(
      rows.filter((r) => r[0] === f),
      [[f, entry(f).sourceName, file]],
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA22452', 'clinical', 'body'],
  ['FMA22330', 'pathology', 'readiness'],
  ['FMA22342', 'pathology', 'body'],
  ['FMA45892', 'clinical', 'readiness'],
  ['FMA43886', 'anatomy', 'body'],
  ['FMA38935', 'function', 'body'],
  ['FMA22324', 'mri', 'body'],
  ['FMA37396', 'clinical', 'body'],
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
    draft: 159,
    'identity-only': 0,
    pending: 863,
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
  bodyRepresentations: 54,
  sourceComponents: 54,
  lessonGroups: 20,
  explicitTopicEdits: 108,
  combinedPinnedCurriculumSections: 1898,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtThighClinicalMilestone: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHashAtThighClinicalMilestone: curriculumHash(copy(milestone)),
  limitations:
    'Original short hip/thigh clinical overviews with shared tendon/head/portion context and exact cross-region memberships; not validated lesions, nerve territories, disease simulation, diagnosis, treatment rules or clinical approval.',
};
await writeFile(
  new URL('docs/thigh-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
