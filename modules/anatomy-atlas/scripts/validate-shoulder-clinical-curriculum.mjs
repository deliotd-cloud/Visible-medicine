import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeShoulderClinical } from './shoulder-clinical-curriculum-transition.mjs';
import { authoringBeforeScapularArmClinical } from './scapular-arm-clinical-curriculum-transition.mjs';
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
  'content/shoulder-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeShoulderClinical(context);
const milestone = await authoringBeforeScapularArmClinical(context);
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
  ['FMA13398', 'right', 'FJ1459'],
  ['FMA13399', 'left', 'FJ1459M'],
  ['FMA32548', 'left', 'FJ1500M'],
  ['FMA13415', 'left', 'FJ1504M'],
  ['FMA32545', 'left', 'FJ1506M'],
  ['FMA32554', 'left', 'FJ1508M'],
  ['FMA34681', 'left', 'FJ1468M'],
  ['FMA34683', 'left', 'FJ1467M'],
  ['FMA34685', 'left', 'FJ1513M'],
  ['FMA37684', 'right', 'FJ1512'],
  ['FMA37685', 'left', 'FJ1512M'],
  ['FMA37687', 'left', 'FJ1478M'],
  ['FMA37695', 'right', 'FJ1480'],
  ['FMA37696', 'left', 'FJ1480M'],
  ['FMA37697', 'right', 'FJ1477'],
  ['FMA37698', 'left', 'FJ1477M'],
  ['FMA37699', 'right', 'FJ1479'],
  ['FMA37700', 'left', 'FJ1479M'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.shoulderClinicalGroups.length, 9);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.shoulderClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
  const group = api.shoulderClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.shoulderClinicalLesson(s, t);
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
        .shoulderClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(api.shoulderClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.shoulderClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.shoulderClinicalGroups.find((g) => g.key === k);
check(group('supraspinatus').pathology.bullets[0].includes('entire width'));
check(group('biceps-short').pathology.body.includes('long-head'));
check(
  group('biceps-long').pathology.bullets[1].includes('towards the shoulder'),
);
check(
  group('teres-minor').clinical.bullets[1].includes(
    'not part of the rotator cuff',
  ),
);
check(
  group('infraspinatus').pathology.bullets[1].includes('spare supraspinatus'),
);
check(group('deltoid').scope.includes('One deltoid portion'));
check(group('triceps').scope.includes('One muscle head'));
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
  ['FMA13398', 'clinical', 'body'],
  ['FMA32545', 'pathology', 'readiness'],
  ['FMA37687', 'pathology', 'body'],
  ['FMA37700', 'clinical', 'readiness'],
  ['FMA13399', 'anatomy', 'body'],
  ['FMA34681', 'function', 'body'],
  ['FMA37685', 'mri', 'body'],
  ['FMA37705', 'clinical', 'body'],
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
    draft: 29,
    'identity-only': 0,
    pending: 993,
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
const report = {
  passed: true,
  checks,
  bodyRepresentations: 18,
  sourceComponents: 18,
  lessonGroups: 9,
  explicitTopicEdits: 36,
  combinedPinnedCurriculumSections: 1638,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtShoulderClinicalMilestone: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHashAtShoulderClinicalMilestone: curriculumHash(copy(milestone)),
  limitations:
    'Shared clinical teaching for muscle heads/portions; not individual tendon lesions, acquired studies, diagnostic algorithms, reviewed questions or clinical acceptance.',
};
await writeFile(
  new URL('docs/shoulder-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
