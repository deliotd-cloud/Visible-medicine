import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeScapularArmClinical } from './scapular-arm-clinical-curriculum-transition.mjs';
import { authoringBeforeForearmClinical } from './forearm-clinical-curriculum-transition.mjs';
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
  'content/scapular-arm-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeScapularArmClinical(context);
const milestone = await authoringBeforeForearmClinical(context);
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
const expected = [
  ['FMA37705', 'right', 'FJ1485'],
  ['FMA37706', 'left', 'FJ1485M'],
  ['FMA37668', 'right', 'FJ1486'],
  ['FMA37669', 'left', 'FJ1486M'],
  ['FMA37665', 'right', 'FJ1488'],
  ['FMA37666', 'left', 'FJ1488M'],
  ['FMA32551', 'right', 'FJ1507'],
  ['FMA32552', 'left', 'FJ1507M'],
  ['FMA32540', 'right', 'FJ1532'],
  ['FMA32541', 'left', 'FJ1532M'],
  ['FMA13381', 'right', 'FJ1536'],
  ['FMA13382', 'left', 'FJ1536M'],
  ['FMA13383', 'right', 'FJ1537'],
  ['FMA13384', 'left', 'FJ1537M'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.scapularArmClinicalGroups.length, 6);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.scapularArmClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(before.entries.map((e) => e.fmaId).sort(), [...ids].sort());
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, file] of expected) {
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
    [
      'muscles',
      'muscle',
      side,
      'shoulder-arm',
      ['shoulder-arm'],
      'isa',
      [file],
    ],
  );
  same(e.sourceIndexFiles, [file]);
  same(e.omittedSourceFiles, []);
  const group = api.scapularArmClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.scapularArmClinicalLesson(s, t);
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
        .scapularArmClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { regions: ['shoulder-arm', 'head-neck'] },
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: 'partof' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
    ])
      same(api.scapularArmClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.scapularArmClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.scapularArmClinicalGroups.find((g) => g.key === k);
check(group('anconeus').scope.includes('not an accessory'));
check(group('anconeus').pathology.bullets[0].includes('other elbow injuries'));
check(group('brachialis').clinical.bullets[1].includes('limited evidence'));
check(
  group('coracobrachialis').clinical.bullets[0].includes(
    'own action is at the shoulder',
  ),
);
check(
  group('teres-major').pathology.bullets[1].includes(
    'not a rotator-cuff muscle',
  ),
);
check(
  group('levator').clinical.bullets[0].includes('cervical as well as dorsal'),
);
check(group('rhomboids').scope.includes('group-level'));
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
  ['FMA37705', 'clinical', 'body'],
  ['FMA37668', 'pathology', 'readiness'],
  ['FMA32551', 'pathology', 'body'],
  ['FMA13384', 'clinical', 'readiness'],
  ['FMA37665', 'anatomy', 'body'],
  ['FMA32541', 'function', 'body'],
  ['FMA13381', 'mri', 'body'],
  ['FMA13398', 'clinical', 'body'],
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
    draft: 43,
    'identity-only': 0,
    pending: 979,
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
  bodyRepresentations: 14,
  sourceComponents: 14,
  lessonGroups: 6,
  explicitTopicEdits: 28,
  combinedPinnedCurriculumSections: 1666,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtScapularArmClinicalMilestone: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHashAtScapularArmClinicalMilestone: curriculumHash(
    copy(milestone),
  ),
  limitations:
    'Original short clinical overviews, including rare case-report evidence and shared rhomboid context; not prevalence, diagnosis, treatment rules, scan findings or clinical approval.',
};
await writeFile(
  new URL('docs/scapular-arm-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
