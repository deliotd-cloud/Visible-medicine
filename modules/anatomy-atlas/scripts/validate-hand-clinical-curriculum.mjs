import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeHandClinical } from './hand-clinical-curriculum-transition.mjs';
import { authoringBeforeThighClinical } from './thigh-clinical-curriculum-transition.mjs';
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
  'content/hand-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeHandClinical(context);
const milestone = await authoringBeforeThighClinical(context);
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
  ['FMA37396', 'right', 'FJ1466'],
  ['FMA37397', 'left', 'FJ1466M'],
  ['FMA37398', 'right', 'FJ1470'],
  ['FMA37399', 'left', 'FJ1470M'],
  ['FMA37400', 'right', 'FJ1482'],
  ['FMA37401', 'left', 'FJ1482M'],
  ['FMA37386', 'right', 'FJ1483'],
  ['FMA37387', 'left', 'FJ1483M'],
  ['FMA37390', 'right', 'FJ1501'],
  ['FMA37391', 'left', 'FJ1501M'],
  ['FMA46121', 'right', 'FJ1481'],
  ['FMA46122', 'left', 'FJ1481M'],
  ['FMA46123', 'right', 'FJ1515'],
  ['FMA46124', 'left', 'FJ1515M'],
  ['FMA42398', 'right', 'FJ1510'],
  ['FMA42399', 'left', 'FJ1510M'],
  ['FMA42402', 'right', 'FJ1511'],
  ['FMA42403', 'left', 'FJ1511M'],
  ['FMA42404', 'right', 'FJ1509'],
  ['FMA42405', 'left', 'FJ1509M'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.handClinicalGroups.length, 9);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.handClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    ['muscles', 'muscle', side, 'hand', ['hand'], 'isa', [file]],
  );
  same(e.sourceIndexFiles, [file]);
  same(e.omittedSourceFiles, []);
  const group = api.handClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.handClinicalLesson(s, t);
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
        .handClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { regions: ['hand', 'head-neck'] },
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: 'partof' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
    ])
      same(api.handClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.handClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.handClinicalGroups.find((g) => g.key === k);
check(
  group('abductor-digiti-minimi').pathology.bullets[0].includes(
    'impaired adduction',
  ),
);
check(
  group('flexor-digiti-minimi').clinical.body.includes('not isolated bending'),
);
check(group('opponens-digiti-minimi').clinical.body.includes('metacarpal V'));
check(
  group('abductor-pollicis-brevis').clinical.bullets[1].includes(
    'outside the tunnel',
  ),
);
check(group('opponens-pollicis').pathology.body.includes('arthritis'));
check(group('adductor-pollicis').clinical.body.includes('compensatory'));
check(group('adductor-pollicis').scope.includes('whole-muscle'));
check(
  group('lumbricals').pathology.bullets[0].includes(
    'must not be labelled ulnar-only',
  ),
);
check(group('lumbricals').scope.includes('not four individually'));
check(group('palmar-interossei').scope.includes('disputed separate thumb'));
check(group('dorsal-interossei').clinical.body.includes('ADM supplies'));
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
  ['FMA37396', 'clinical', 'body'],
  ['FMA37386', 'pathology', 'readiness'],
  ['FMA46121', 'pathology', 'body'],
  ['FMA42405', 'clinical', 'readiness'],
  ['FMA37398', 'anatomy', 'body'],
  ['FMA37391', 'function', 'body'],
  ['FMA42398', 'mri', 'body'],
  ['FMA38507', 'clinical', 'body'],
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
    draft: 105,
    'identity-only': 0,
    pending: 917,
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
  bodyRepresentations: 20,
  sourceComponents: 20,
  lessonGroups: 9,
  explicitTopicEdits: 40,
  combinedPinnedCurriculumSections: 1790,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtHandClinicalMilestone: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHashAtHandClinicalMilestone: curriculumHash(copy(milestone)),
  limitations:
    'Original short hand clinical overviews with shared heads and intrinsic groups; not individually numbered muscles, segmented nerve territories, disease simulation, diagnosis, treatment rules or clinical approval.',
};
await writeFile(
  new URL('docs/hand-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
