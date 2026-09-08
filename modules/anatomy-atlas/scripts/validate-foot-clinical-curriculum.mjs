import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeFootClinical } from './foot-clinical-curriculum-transition.mjs';
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
  'content/foot-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeFootClinical(context);
const milestone = await authoringBeforeTrunkClinical(context);
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
  ['FMA37717', 'right', 'FJ1383'],
  ['FMA37718', 'left', 'FJ1383M'],
  ['FMA37719', 'right', 'FJ1385'],
  ['FMA37720', 'left', 'FJ1385M'],
  ['FMA37485', 'right', 'FJ1387'],
  ['FMA37486', 'left', 'FJ1387M'],
  ['FMA37483', 'right', 'FJ1389'],
  ['FMA37484', 'left', 'FJ1389M'],
  ['FMA37745', 'right', 'FJ1384'],
  ['FMA37746', 'left', 'FJ1384M'],
  ['FMA37743', 'right', 'FJ1386'],
  ['FMA37744', 'left', 'FJ1386M'],
  ['FMA37741', 'right', 'FJ1388'],
  ['FMA37742', 'left', 'FJ1388M'],
  ['FMA37463', 'right', 'FJ1390'],
  ['FMA37464', 'left', 'FJ1390M'],
  ['FMA37471', 'right', 'FJ1391'],
  ['FMA37472', 'left', 'FJ1391M'],
  ['FMA86034', 'right', 'FJ1399'],
  ['FMA86035', 'left', 'FJ1399M'],
  ['FMA37459', 'right', 'FJ1400'],
  ['FMA37460', 'left', 'FJ1400M'],
  ['FMA51144', 'right', 'FJ1407'],
  ['FMA51145', 'left', 'FJ1407M'],
  ['FMA37465', 'right', 'FJ1412'],
  ['FMA37466', 'left', 'FJ1412M'],
  ['FMA37461', 'right', 'FJ1413'],
  ['FMA37462', 'left', 'FJ1413M'],
  ['FMA45971', 'right', 'FJ1396'],
  ['FMA45972', 'left', 'FJ1396M'],
  ['FMA45973', 'right', 'FJ1393'],
  ['FMA45974', 'left', 'FJ1393M'],
  ['FMA46018', 'right', 'FJ1398'],
  ['FMA46019', 'left', 'FJ1398M'],
  ['FMA46020', 'right', 'FJ1445'],
  ['FMA46021', 'left', 'FJ1445M'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.footClinicalGroups.length, 12);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.footClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    ['muscles', 'muscle', side, 'foot', ['foot'], 'isa', [file]],
  );
  same(e.sourceIndexFiles, [file]);
  same(e.omittedSourceFiles, []);
  const group = api.footClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.footClinicalLesson(s, t);
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
        .footClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { regions: ['foot', 'head-neck'] },
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: 'partof' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
    ])
      same(api.footClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.footClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.footClinicalGroups.find((g) => g.key === k);

check(group('first-lumbrical').clinical.body.includes('medial plantar'));
check(group('lateral-lumbricals').clinical.body.includes('lateral plantar'));
check(group('lateral-lumbricals').clinical.body.includes('median/ulnar'));
check(group('plantar-interossei').clinical.body.includes('second-toe axis'));
check(group('plantar-interossei').scope.includes('absent dorsal interossei'));
check(
  group('abductor-digiti-minimi').pathology.bullets[0].includes(
    'association uncertain',
  ),
);
check(
  group('abductor-digiti-minimi').references.includes(
    'https://pubmed.ncbi.nlm.nih.gov/40836398/',
  ),
);
check(
  group('flexor-digiti-minimi-brevis').clinical.body.includes(
    'not the distal toe joint',
  ),
);
check(
  group('opponens-digiti-minimi').clinical.body.includes('not the hypothenar'),
);
check(
  group('opponens-digiti-minimi').pathology.bullets[0].includes(
    'No structure-specific disease pattern',
  ),
);
check(
  group('abductor-hallucis').clinical.bullets[0].includes(
    'not a nerve-conduction test',
  ),
);
check(
  group('extensor-hallucis-brevis').clinical.bullets[0].includes(
    'deep fibular',
  ),
);
check(
  group('quadratus-plantae').clinical.body.includes(
    'rather than attaching directly',
  ),
);
check(
  group('flexor-digitorum-brevis').pathology.bullets[0].includes(
    'proximal interphalangeal',
  ),
);
check(group('flexor-hallucis-brevis').scope.includes('unresolved sesamoid'));
check(
  group('flexor-hallucis-brevis').clinical.bullets[0].includes(
    'not automatically a fracture',
  ),
);
check(
  group('adductor-hallucis').clinical.bullets[0].includes(
    'does not simulate corrective surgery',
  ),
);
same(
  catalog.structures
    .filter((s) => s.system === 'muscles' && s.regions.includes('foot'))
    .map((s) => s.fmaId)
    .sort(),
  [...ids].sort(),
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
  ['FMA37717', 'clinical', 'body'],
  ['FMA37463', 'pathology', 'readiness'],
  ['FMA45971', 'pathology', 'body'],
  ['FMA86035', 'clinical', 'readiness'],
  ['FMA37745', 'anatomy', 'body'],
  ['FMA51145', 'function', 'body'],
  ['FMA37465', 'mri', 'body'],
  ['FMA22544', 'clinical', 'body'],
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
    draft: 223,
    'identity-only': 0,
    pending: 799,
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
  bodyRepresentations: 36,
  sourceComponents: 36,
  lessonGroups: 12,
  explicitTopicEdits: 72,
  combinedPinnedCurriculumSections: 2026,
  sourceIndexChecks,
  negativeCases: negatives.length,
  historicalProjectionOnly: true,
  historicalMilestoneBodyReadiness: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(milestone)),
  limitations:
    'Original short intrinsic-foot clinical drafts; not validated deformities, tendon lesions, nerve territories, sesamoid identities, diagnosis, treatment rules or clinical approval.',
};
await writeFile(
  new URL('docs/foot-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
