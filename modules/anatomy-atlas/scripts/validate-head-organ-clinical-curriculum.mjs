import assert from 'node:assert/strict';
import { authoringBeforeDentalClinical } from './dental-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeHeadOrganClinical } from './head-organ-clinical-curriculum-transition.mjs';
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
  'content/head-organ-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeHeadOrganClinical(context);
const milestone = await authoringBeforeDentalClinical(context);
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
/** @type {Record<string, string[]>} */
const omittedByFma = {};
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  [
    'FMA13889',
    'unpaired',
    'isa',
    ['FJ1796'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  [
    'FMA12514',
    'right',
    'partof',
    [
      'FJ1336',
      'FJ1337',
      'FJ1340',
      'FJ1348',
      'FJ1356',
      'FJ1368',
      'FJ1371',
      'FJ1382',
    ],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  [
    'FMA12515',
    'left',
    'partof',
    [
      'FJ1282',
      'FJ1285',
      'FJ1286',
      'FJ1289',
      'FJ1297',
      'FJ1305',
      'FJ1317',
      'FJ1320',
      'FJ1331',
    ],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  [
    'FMA54640',
    'unpaired',
    'isa',
    ['FJ2761'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  ['FMA59102', 'right', 'isa', ['FJ1350'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59103', 'left', 'isa', ['FJ1299'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59802', 'right', 'isa', ['FJ2768'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59803', 'left', 'isa', ['FJ2766'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59804', 'right', 'isa', ['FJ2767'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59805', 'left', 'isa', ['FJ2765'], 'head-neck', ['head-neck'], 'organ'],
  [
    'FMA55130',
    'unpaired',
    'isa',
    ['FJ2770'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  ['FMA59582', 'right', 'isa', ['FJ1349'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59583', 'left', 'isa', ['FJ1298'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59555', 'right', 'isa', ['FJ1353'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59556', 'left', 'isa', ['FJ1302'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59545', 'right', 'isa', ['FJ1360'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA59546', 'left', 'isa', ['FJ1309'], 'head-neck', ['head-neck'], 'organ'],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.headOrganClinicalGroups.length, 10);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.headOrganClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
  const group = api.headOrganClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.headOrganClinicalLesson(s, t);
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
        .headOrganClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(api.headOrganClinicalLesson({ ...s, ...mutation }, t), undefined);
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.headOrganClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.headOrganClinicalGroups.find((g) => g.key === k);
same(ids.length, 17);
same(new Set(ids).size, 17);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  32,
);
same(expected.filter((e) => e[6] === 'organ').length, 17);
same(
  expected.filter((e) => e[2] === 'partof').map((e) => e[0]),
  ['FMA12514', 'FMA12515'],
);
same(
  [entry('FMA12514').sources.length, entry('FMA12515').sources.length],
  [8, 9],
);
check(entry('FMA12515').sources.some((p) => p.file === 'FJ1282'));
check(!entry('FMA12514').sources.some((p) => p.file === 'FJ1282'));
for (const f of ids) {
  same(entry(f).region, 'head-neck');
  same(entry(f).regions, ['head-neck']);
}
for (const [key, right, left] of [
  ['eyeballs', 'FMA12514', 'FMA12515'],
  ['lacrimal-glands', 'FMA59102', 'FMA59103'],
  ['submandibular-glands', 'FMA59802', 'FMA59803'],
  ['sublingual-glands', 'FMA59804', 'FMA59805'],
  ['canaliculi', 'FMA59582', 'FMA59583'],
  ['nasolacrimal-ducts', 'FMA59555', 'FMA59556'],
  ['lacrimal-sacs', 'FMA59545', 'FMA59546'],
]) {
  same(
    group(key).identities.map((i) => [i[0], i[1]]),
    [
      [right, 'right'],
      [left, 'left'],
    ],
  );
  check(
    entry(right).sources.every(
      (p) => !entry(left).sources.some((q) => q.file === p.file),
    ),
  );
}
check(
  group('pituitary').pathology.body.includes(
    'no clinical hormone-excess syndrome',
  ),
);
check(
  group('eyeballs').scope.includes(
    'Neither set independently identifies a retinal component',
  ),
);
check(group('eyeballs').clinical.body.includes('immediate eye-care'));
check(group('tongue').clinical.body.includes('three weeks'));
check(group('lacrimal-glands').pathology.body.includes('upper outer'));
check(group('submandibular-glands').pathology.body.includes('around meals'));
check(group('sublingual-glands').pathology.body.includes('saliva-containing'));
check(group('epiglottis').clinical.body.includes('999'));
check(
  group('canaliculi').scope.includes(
    'not independently modelled upper, lower and common',
  ),
);
check(
  group('nasolacrimal-ducts').pathology.body.includes('congenital or acquired'),
);
check(group('lacrimal-sacs').pathology.body.includes('inner eye corner'));
for (const f of [
  'FMA59582',
  'FMA59583',
  'FMA59555',
  'FMA59556',
  'FMA59545',
  'FMA59546',
])
  same(entry(f).sources.length, 1);
for (const tab of tabs) {
  same(api.bodyLesson(entry('FMA61970'), tab).readiness, 'pending');
  same(api.headOrganClinicalLesson(entry('FMA61970'), tab), undefined);
}
const pendingOrgans = catalog.structures.filter(
  (s) =>
    s.system === 'organs' &&
    milestone.bodyLesson(s, 'clinical').readiness === 'pending',
);
same(pendingOrgans.length, 28);
check(
  pendingOrgans.every(
    (s) => s.region === 'head-neck' && s.name.endsWith('tooth'),
  ),
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.headOrganClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.headOrganClinicalLesson(entry(f), tab), undefined);
  }
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'skeleton' &&
        milestone.bodyLesson(s, 'clinical').readiness === 'pending',
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
  check(
    indexes.isa.some(
      (r) =>
        r[0] === 'FMA58082' &&
        r[1] === 'anterior chamber of left eyeball' &&
        r[2] === 'FJ1282',
    ),
  );
  const ocularFiles = [
    ...entry('FMA12514').sources,
    ...entry('FMA12515').sources,
  ].map((p) => p.file);
  same(
    indexes.isa.filter(
      (r) => ocularFiles.includes(r[2]) && /retina/i.test(r[1]),
    ).length,
    0,
  );
}
const negatives = [
  ['FMA13889', 'clinical', 'body'],
  ['FMA12514', 'pathology', 'body'],
  ['FMA12515', 'clinical', 'body'],
  ['FMA54640', 'pathology', 'readiness'],
  ['FMA59102', 'clinical', 'body'],
  ['FMA59103', 'pathology', 'body'],
  ['FMA59802', 'clinical', 'body'],
  ['FMA59803', 'pathology', 'body'],
  ['FMA59804', 'clinical', 'body'],
  ['FMA59805', 'pathology', 'body'],
  ['FMA55130', 'clinical', 'body'],
  ['FMA59582', 'pathology', 'body'],
  ['FMA59583', 'clinical', 'body'],
  ['FMA59555', 'pathology', 'body'],
  ['FMA59556', 'clinical', 'body'],
  ['FMA59545', 'pathology', 'body'],
  ['FMA59546', 'clinical', 'body'],
  ['FMA13889', 'anatomy', 'body'],
  ['FMA55130', 'function', 'body'],
  ['FMA12514', 'ct', 'body'],
  ['FMA15900', 'clinical', 'body'],
  ['FMA7197', 'clinical', 'body'],
  ['FMA55680', 'clinical', 'body'],
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
        catalog.structures.filter(
          (s) => milestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
for (const t of tabs)
  same(counts(t), {
    draft: 674,
    'identity-only': 0,
    pending: 348,
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
  bodyRepresentations: 17,
  sourceComponents: 32,
  lessonGroups: 10,
  explicitTopicEdits: 34,
  combinedPinnedCurriculumSections: 2928,
  sourceIndexChecks,
  negativeCases: negatives.length,
  historicalMilestoneReadiness: Object.fromEntries(
    api.contentTabs.map((t) => [t, counts(t)]),
  ),
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  copyAndRecipeHash: curriculumHash(copy(api)),
  limitations:
    'Original head/neck organ clinical drafts; unequal eyeball sets and independently labelled tear passages remain exact. No complete retinal/ocular-layer dissection, validated lumen, paediatric anatomy, physiological simulation, diagnosis, procedure, patient scan or clinical approval.',
};
await writeFile(
  new URL('docs/head-organ-clinical-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
