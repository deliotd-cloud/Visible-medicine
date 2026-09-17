import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeLegClinical } from './leg-clinical-curriculum-transition.mjs';
import { authoringBeforeFootClinical } from './foot-clinical-curriculum-transition.mjs';
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
  'content/leg-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeLegClinical(context);
const milestone = await authoringBeforeFootClinical(context);
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
  ['FMA22548', 'right', 'FJ1406'],
  ['FMA22549', 'left', 'FJ1406M'],
  ['FMA22546', 'right', 'FJ1408'],
  ['FMA22547', 'left', 'FJ1408M'],
  ['FMA22554', 'right', 'FJ1409'],
  ['FMA22555', 'left', 'FJ1409M'],
  ['FMA22552', 'right', 'FJ1410'],
  ['FMA22553', 'left', 'FJ1410M'],
  ['FMA22550', 'right', 'FJ1411'],
  ['FMA22551', 'left', 'FJ1411M'],
  ['FMA65016', 'right', 'FJ1414'],
  ['FMA65017', 'left', 'FJ1414M'],
  ['FMA65014', 'right', 'FJ1415'],
  ['FMA65015', 'left', 'FJ1415M'],
  ['FMA22560', 'right', 'FJ1429'],
  ['FMA22561', 'left', 'FJ1429M'],
  ['FMA22591', 'right', 'FJ1430'],
  ['FMA22592', 'left', 'FJ1430M'],
  ['FMA22558', 'right', 'FJ1437'],
  ['FMA22559', 'left', 'FJ1437M'],
  ['FMA22544', 'right', 'FJ1439'],
  ['FMA22545', 'left', 'FJ1439M'],
  ['FMA65018', 'right', 'FJ1440'],
  ['FMA65019', 'left', 'FJ1440M'],
  ['FMA45957', 'right', 'FJ1397'],
  ['FMA45958', 'left', 'FJ1397M'],
  ['FMA45960', 'right', 'FJ1394'],
  ['FMA45961', 'left', 'FJ1394M'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.legClinicalGroups.length, 13);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.legClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    ['muscles', 'muscle', side, 'leg', ['leg'], 'isa', [file]],
  );
  same(e.sourceIndexFiles, [file]);
  same(e.omittedSourceFiles, []);
  const group = api.legClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.legClinicalLesson(s, t);
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
        .legClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { regions: ['leg', 'head-neck'] },
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: 'partof' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
    ])
      same(api.legClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.legClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.legClinicalGroups.find((g) => g.key === k);
check(
  group('extensor-digitorum-longus').clinical.body.includes('motor/sensory'),
);
check(
  group('extensor-hallucis-longus').pathology.bullets[0].includes(
    'does not prove an L5',
  ),
);
check(
  group('fibularis-brevis').clinical.bullets[1].includes(
    'cannot demonstrate dynamic',
  ),
);
check(
  group('fibularis-longus').clinical.bullets[0].includes(
    'does not establish that variant',
  ),
);
check(
  group('fibularis-tertius').clinical.body.includes('anterior compartment'),
);
check(
  group('fibularis-tertius').clinical.bullets[0].includes(
    'not be assigned the superficial',
  ),
);
check(
  group('flexor-digitorum-longus').clinical.bullets[0].includes(
    'one digital slip',
  ),
);
check(
  group('flexor-hallucis-longus').clinical.bullets[0].includes(
    'does not establish prevalence',
  ),
);
check(group('plantaris').pathology.body.includes('not automatically'));
check(group('plantaris').clinical.bullets[1].includes('excludes thrombosis'));
check(
  group('popliteus').clinical.bullets[0].includes('does not cross the ankle'),
);
check(group('soleus').clinical.body.includes('not the knee'));
check(group('soleus').clinical.bullets[1].includes('does not model pressure'));
check(
  group('tibialis-anterior').pathology.bullets[0].includes('not synonymous'),
);
check(
  group('tibialis-posterior').pathology.bullets[0].includes('multi-structure'),
);
check(
  group('gastrocnemius').clinical.bullets[1].includes(
    'not a separate Achilles subtendon',
  ),
);
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
  ['FMA22548', 'clinical', 'body'],
  ['FMA22546', 'pathology', 'readiness'],
  ['FMA45957', 'pathology', 'body'],
  ['FMA65019', 'clinical', 'readiness'],
  ['FMA22554', 'anatomy', 'body'],
  ['FMA22553', 'function', 'body'],
  ['FMA65014', 'mri', 'body'],
  ['FMA22452', 'clinical', 'body'],
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
    draft: 187,
    'identity-only': 0,
    pending: 835,
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
  bodyRepresentations: 28,
  sourceComponents: 28,
  lessonGroups: 13,
  explicitTopicEdits: 56,
  combinedPinnedCurriculumSections: 1954,
  sourceIndexChecks,
  negativeCases: negatives.length,
  historicalMilestoneBodyReadiness: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  historicalProjectionOnly: true,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(milestone)),
  limitations:
    'Original short lower-leg clinical drafts, including shared gastrocnemius/Achilles context; not validated tendon lesions, nerve territories, compartment pressures, diagnosis, treatment rules or clinical approval.',
};
await writeFile(
  new URL('docs/leg-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
