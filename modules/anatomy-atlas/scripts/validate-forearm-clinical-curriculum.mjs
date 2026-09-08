import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
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
  'content/forearm-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeForearmClinical(context);
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
  ['FMA38507', 'right', ['FJ1472', 'FJ1517']],
  ['FMA38508', 'left', ['FJ1472M', 'FJ1517M']],
  ['FMA38470', 'right', ['FJ1475', 'FJ1499']],
  ['FMA38471', 'left', ['FJ1475M', 'FJ1499M']],
  ['FMA38516', 'right', ['FJ1484']],
  ['FMA38517', 'left', ['FJ1484M']],
  ['FMA38486', 'right', ['FJ1487']],
  ['FMA38487', 'left', ['FJ1487M']],
  ['FMA38498', 'right', ['FJ1489']],
  ['FMA38499', 'left', ['FJ1489M']],
  ['FMA38495', 'right', ['FJ1490']],
  ['FMA38496', 'left', ['FJ1490M']],
  ['FMA38504', 'right', ['FJ1491']],
  ['FMA38505', 'left', ['FJ1491M']],
  ['FMA38501', 'right', ['FJ1492']],
  ['FMA38502', 'left', ['FJ1492M']],
  ['FMA38525', 'right', ['FJ1493']],
  ['FMA38526', 'left', ['FJ1493M']],
  ['FMA38519', 'right', ['FJ1494']],
  ['FMA38520', 'left', ['FJ1494M']],
  ['FMA38522', 'right', ['FJ1495']],
  ['FMA38523', 'left', ['FJ1495M']],
  ['FMA38460', 'right', ['FJ1496']],
  ['FMA38461', 'left', ['FJ1496M']],
  ['FMA38479', 'right', ['FJ1497']],
  ['FMA38480', 'left', ['FJ1497M']],
  ['FMA38482', 'right', ['FJ1498']],
  ['FMA38484', 'left', ['FJ1498M']],
  ['FMA38463', 'right', ['FJ1502']],
  ['FMA38464', 'left', ['FJ1502M']],
  ['FMA38454', 'right', ['FJ1503']],
  ['FMA38455', 'left', ['FJ1503M']],
  ['FMA38513', 'right', ['FJ1505']],
  ['FMA38514', 'left', ['FJ1505M']],
  ['FMA38560', 'right', ['FJ1474']],
  ['FMA38561', 'left', ['FJ1474M']],
  ['FMA38562', 'right', ['FJ1516']],
  ['FMA38563', 'left', ['FJ1516M']],
  ['FMA38617', 'right', ['FJ1473']],
  ['FMA38618', 'left', ['FJ1473M']],
  ['FMA38619', 'right', ['FJ1518']],
  ['FMA38620', 'left', ['FJ1518M']],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.forearmClinicalGroups.length, 16);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.forearmClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(
  before.entries.map((e) => e.fmaId).sort(),
  [...ids].sort((a, b) => a.localeCompare(b)),
);
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
    ['muscles', 'muscle', side, 'forearm', ['forearm'], 'isa', file],
  );
  same(e.sourceIndexFiles, file);
  same(e.omittedSourceFiles, []);
  const group = api.forearmClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.forearmClinicalLesson(s, t);
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
        .forearmClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { regions: ['forearm', 'head-neck'] },
      { laterality: side === 'left' ? 'right' : 'left' },
      { fmaId: 'FMA_UNKNOWN' },
      { sourceTree: 'partof' },
      { sources: [] },
      { sources: [{ ...s.sources[0], file: 'WRONG' }] },
      { sources: [...s.sources, ...s.sources] },
      { sources: s.sources.slice(1) },
      {
        sources: s.sources.map((p, i) => ({
          ...p,
          file: i === s.sources.length - 1 ? 'WRONG' : p.file,
        })),
      },
      ...(s.sources.length > 1
        ? [
            { sources: [...s.sources].reverse() },
            { sources: s.sources.map(() => s.sources[0]) },
          ]
        : []),
    ])
      same(api.forearmClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.forearmClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.forearmClinicalGroups.find((g) => g.key === k);
check(group('ecu').pathology.bullets[0].includes('asymptomatic'));
check(group('fds').scope.includes('two source components'));
check(group('first-compartment').pathology.bullets[1].includes('not the EPL'));
check(group('brachioradialis').clinical.bullets[1].includes('does not cross'));
check(group('ecrb').pathology.body.includes('proximal ECRB'));
check(group('ecrl').clinical.body.includes('does not establish normal'));
check(
  group('digital-extensors').clinical.body.includes('every extension deficit'),
);
check(group('epl').clinical.body.includes('interphalangeal'));
check(group('fcr').clinical.bullets[0].includes('not a universal'));
check(group('fdp').clinical.bullets[0].includes('do not label the entire'));
check(group('fpl').pathology.bullets[0].includes('inflammatory'));
check(group('palmaris').pathology.body.includes('normal variant'));
check(group('quadratus').clinical.body.includes('pronator teres'));
check(group('supinator').pathology.bullets[0].includes('Pain-dominant'));
check(group('pronator-teres').clinical.bullets[0].includes('may be spared'));
check(group('fcu').scope.includes('whole-muscle'));
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
      file.map((part) => [f, entry(f).sourceName, part]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA38507', 'clinical', 'body'],
  ['FMA38470', 'pathology', 'readiness'],
  ['FMA38522', 'pathology', 'body'],
  ['FMA38620', 'clinical', 'readiness'],
  ['FMA38479', 'anatomy', 'body'],
  ['FMA38455', 'function', 'body'],
  ['FMA38513', 'mri', 'body'],
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
        catalog.structures.filter((s) => api.bodyLesson(s, t).readiness === r)
          .length,
      ],
    ),
  );
for (const t of tabs)
  same(counts(t), {
    draft: 85,
    'identity-only': 0,
    pending: 937,
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
  bodyRepresentations: 42,
  sourceComponents: 46,
  lessonGroups: 16,
  explicitTopicEdits: 84,
  combinedPinnedCurriculumSections: 1750,
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
    'Original short clinical overviews with shared tendon/compartment/head context; not a complete disease catalogue, individual tendon reconstruction, diagnosis, treatment rules, scan findings or clinical approval.',
};
await writeFile(
  new URL('docs/forearm-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
