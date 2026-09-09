import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforePelvicOrganClinical } from './pelvic-organ-clinical-curriculum-transition.mjs';
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
  'content/pelvic-organ-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforePelvicOrganClinical(context);
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
/** @type {Record<string, string[]>} */
const omittedByFma = {};
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  ['FMA15900', 'unpaired', 'partof', ['FJ3149'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA9600', 'unpaired', 'partof', ['FJ3139'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA7211', 'right', 'isa', ['FJ3142'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA7212', 'left', 'isa', ['FJ3138'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA19387', 'right', 'isa', ['FJ3143'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA19388', 'left', 'isa', ['FJ3137'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA14544', 'unpaired', 'isa', ['FJ2571'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA18256', 'right', 'isa', ['FJ3141'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA18257', 'left', 'isa', ['FJ3136'], 'pelvis', ['pelvis'], 'organ'],
  ['FMA19667', 'unpaired', 'isa', ['FJ3148'], 'pelvis', ['pelvis'], 'organ'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.pelvicOrganClinicalGroups.length, 7);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.pelvicOrganClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
  [...expected].sort(byIdentity),
);
same(before.entries.map((e) => e.fmaId).sort(), [...ids].sort());
const entry = (f) => catalog.structures.find((s) => s.fmaId === f);
for (const [f, side, tree, files, region, regions, category] of expected) {
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
    ['organs', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
  );
  same(e.omittedSourceFiles, omittedByFma[f] ?? []);
  const group = api.pelvicOrganClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.pelvicOrganClinicalLesson(s, t);
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
        .pelvicOrganClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      { category: category === 'organ' ? 'space' : 'organ' },
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
      same(api.pelvicOrganClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.pelvicOrganClinicalLesson(s, t), undefined);
      same(
        api.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.pelvicOrganClinicalGroups.find((g) => g.key === k);
same(ids.length, 10);
same(new Set(ids).size, 10);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  10,
);
same(expected.filter((e) => e[6] === 'organ').length, 10);
same(
  expected.filter((e) => e[2] === 'partof').map((e) => e[0]),
  ['FMA15900', 'FMA9600'],
);
for (const f of ids) {
  same(entry(f).region, 'pelvis');
  same(entry(f).regions, ['pelvis']);
  same(entry(f).sources.length, 1);
}
for (const [key, right, left] of [
  ['testes', 'FMA7211', 'FMA7212'],
  ['seminal-vesicles', 'FMA19387', 'FMA19388'],
  ['epididymides', 'FMA18256', 'FMA18257'],
]) {
  same(
    group(key).identities.map((i) => [i[0], i[1]]),
    [
      [right, 'right'],
      [left, 'left'],
    ],
  );
  check(entry(right).sources[0].file !== entry(left).sources[0].file);
}
check(group('bladder').pathology.body.includes('kidneys'));
check(group('prostate').pathology.body.includes('non-cancerous'));
check(
  group('prostate').pathology.bullets.some((b) =>
    b.includes('not reliably track prostate size'),
  ),
);
check(
  group('testes').scope.includes(
    'not a claim that the testis lies within the pelvic cavity',
  ),
);
check(group('testes').clinical.body.includes('999'));
check(
  group('seminal-vesicles').pathology.bullets.some((b) =>
    b.includes('several parts'),
  ),
);
check(group('rectum').pathology.body.includes('little inflammation'));
check(group('rectum').clinical.body.includes('Tenesmus'));
check(
  group('epididymides').clinical.body.includes(
    'must not be dismissed as infection',
  ),
);
check(group('epididymides').clinical.body.includes('999'));
check(group('urethra').scope.includes('not female urethral anatomy'));
check(
  group('urethra').pathology.body.includes('inadequate bladder contraction'),
);
same(
  catalog.structures
    .filter((s) => s.sources.some((p) => p.file === 'FJ2571'))
    .map((s) => s.fmaId),
  ['FMA14544'],
);
check(!entry('FMA7201').sources.some((p) => p.file === 'FJ2571'));
same(
  api.bodyLesson(entry('FMA7201'), 'clinical'),
  previous.bodyLesson(entry('FMA7201'), 'clinical'),
);
for (const tab of tabs) {
  same(api.bodyLesson(entry('FMA61970'), tab).readiness, 'pending');
  same(api.pelvicOrganClinicalLesson(entry('FMA61970'), tab), undefined);
}
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'organs' &&
      s.region === 'pelvis' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  0,
);
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'organs' &&
      api.bodyLesson(s, 'clinical').readiness === 'pending',
  ).length,
  45,
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.pelvicOrganClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.pelvicOrganClinicalLesson(entry(f), tab), undefined);
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
    same(
      rows.map((r) => r[2]).sort(),
      [...files, ...(omittedByFma[f] ?? [])].sort((a, b) => a.localeCompare(b)),
    );
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA15900', 'clinical', 'body'],
  ['FMA9600', 'pathology', 'body'],
  ['FMA7211', 'clinical', 'body'],
  ['FMA7212', 'pathology', 'readiness'],
  ['FMA19387', 'clinical', 'body'],
  ['FMA19388', 'pathology', 'body'],
  ['FMA14544', 'clinical', 'body'],
  ['FMA18256', 'pathology', 'body'],
  ['FMA18257', 'clinical', 'body'],
  ['FMA19667', 'pathology', 'body'],
  ['FMA15900', 'anatomy', 'body'],
  ['FMA9600', 'function', 'body'],
  ['FMA7211', 'ct', 'body'],
  ['FMA7197', 'clinical', 'body'],
  ['FMA7088', 'clinical', 'body'],
  ['FMA45097', 'clinical', 'readiness'],
  ['FMA45098', 'clinical', 'readiness'],
  ['FMA61970', 'clinical', 'readiness'],
  ['FMA19728', 'clinical', 'readiness'],
  ['FMA13322', 'clinical', 'body'],
  ['FMA23130', 'clinical', 'body'],
  ['FMA13395', 'clinical', 'body'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
  ['FMA61970', 'function', 'readiness'],
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
      for (const held of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
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
    draft: 657,
    'identity-only': 0,
    pending: 365,
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
  bodyRepresentations: 10,
  sourceComponents: 10,
  lessonGroups: 7,
  explicitTopicEdits: 20,
  combinedPinnedCurriculumSections: 2894,
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
    'Original pelvic organ clinical drafts; exact paired sides, adult-male source scope and separately owned rectum remain unchanged. No female anatomy, validated lumen, perfusion, fertility, disease simulation, procedural plan, patient scan or clinical approval.',
};
await writeFile(
  new URL('docs/pelvic-organ-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
