import assert from 'node:assert/strict';
import { authoringBeforeThoracicOrganClinical } from './thoracic-organ-clinical-curriculum-transition.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeCentralNeuralClinical } from './central-neural-clinical-curriculum-transition.mjs';
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
  'content/central-neural-clinical-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeCentralNeuralClinical(context);
const milestone = await authoringBeforeThoracicOrganClinical(context);
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
/** @type {Array<[string, string, string, string[], string, string[], string]>} */
const expected = [
  [
    'FMA50801',
    'midline',
    'partof',
    [
      'FJ1730',
      'FJ1731',
      'FJ1732',
      'FJ1733',
      'FJ1738',
      'FJ1739',
      'FJ1740',
      'FJ1743',
      'FJ1744',
      'FJ1745',
      'FJ1746',
      'FJ1747',
      'FJ1748',
      'FJ1749',
      'FJ1750',
      'FJ1751',
      'FJ1758',
      'FJ1759',
      'FJ1760',
      'FJ1762',
      'FJ1767',
      'FJ1769',
      'FJ1770',
      'FJ1775',
      'FJ1779',
      'FJ1780',
      'FJ1781',
      'FJ1783',
      'FJ1784',
      'FJ1785',
      'FJ1786',
      'FJ1787',
      'FJ1788',
      'FJ1789',
      'FJ1790',
      'FJ1791',
      'FJ1792',
      'FJ1795',
      'FJ1797',
      'FJ1798',
      'FJ1800',
      'FJ1801',
      'FJ1806',
      'FJ1807',
      'FJ1808',
      'FJ1810',
      'FJ1814',
      'FJ1817',
      'FJ1822',
      'FJ1826',
      'FJ1828',
      'FJ1830',
      'FJ1831',
      'FJ1833',
      'FJ1834',
      'FJ1835',
      'FJ1836',
      'FJ1841',
      'FJ1842',
    ],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  ['FMA78497', 'midline', 'isa', ['FJ1737'], 'spine', ['spine'], 'space'],
  ['FMA72826', 'right', 'isa', ['FJ1802'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72827', 'left', 'isa', ['FJ1754'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72828', 'right', 'isa', ['FJ1823'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72829', 'left', 'isa', ['FJ1776'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72830', 'right', 'isa', ['FJ1805'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72831', 'left', 'isa', ['FJ1757'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72832', 'right', 'isa', ['FJ1829'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72833', 'left', 'isa', ['FJ1753'], 'head-neck', ['head-neck'], 'organ'],
  [
    'FMA258714',
    'right',
    'isa',
    ['FJ1827'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  ['FMA258716', 'left', 'isa', ['FJ1782'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA73303', 'right', 'isa', ['FJ1813'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA73304', 'left', 'isa', ['FJ1766'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA73309', 'right', 'isa', ['FJ1816'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA73310', 'left', 'isa', ['FJ1816M'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72924', 'right', 'isa', ['FJ1804'], 'head-neck', ['head-neck'], 'organ'],
  ['FMA72925', 'left', 'isa', ['FJ1756'], 'head-neck', ['head-neck'], 'organ'],
  [
    'FMA61961',
    'midline',
    'isa',
    ['FJ1734'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  [
    'FMA62072',
    'midline',
    'isa',
    ['FJ1799'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  [
    'FMA86464',
    'midline',
    'isa',
    ['FJ1742'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  [
    'FMA61934',
    'midline',
    'isa',
    ['FJ1755', 'FJ1803'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
  [
    'FMA74877',
    'midline',
    'isa',
    ['FJ1768', 'FJ1815'],
    'head-neck',
    ['head-neck'],
    'organ',
  ],
];
const ids = expected.map((e) => e[0]),
  tabs = ['pathology', 'clinical'];
same(api.centralNeuralClinicalGroups.length, 15);
const byIdentity = (a, b) => a[0].localeCompare(b[0]);
same(
  api.centralNeuralClinicalGroups.flatMap((g) => g.identities).sort(byIdentity),
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
    ['nerves', category, side, region, regions, tree, files],
  );
  same(
    [...e.sourceIndexFiles].sort((a, b) => a.localeCompare(b)),
    [...files].sort(),
  );
  same(e.omittedSourceFiles, []);
  const group = api.centralNeuralClinicalGroups.find((g) =>
    g.identities.some((i) => i[0] === f),
  );
  const record = body.find((r) => r.id === s.id);
  for (const t of tabs) {
    const result = api.centralNeuralClinicalLesson(s, t);
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
        .centralNeuralClinicalLesson({ ...s, coverageNote: 'Keep warning' }, t)
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
      same(
        api.centralNeuralClinicalLesson({ ...s, ...mutation }, t),
        undefined,
      );
  }
}
for (const s of catalog.structures)
  for (const t of api.contentTabs) {
    if (!ids.includes(s.fmaId) || !tabs.includes(t)) {
      same(api.centralNeuralClinicalLesson(s, t), undefined);
      same(
        milestone.bodyLesson(s, t),
        previous.bodyLesson(s, t),
        'Every unrelated section preserved',
      );
    }
  }
const group = (k) => api.centralNeuralClinicalGroups.find((g) => g.key === k);

check(group('brain').pathology.body.includes('bleeding'));
check(group('central-canal').pathology.body.includes('not be diagnosed'));
check(group('caudate').pathology.body.includes('Huntington'));
check(group('putamen').pathology.body.includes('substantia nigra'));
check(group('pallidum').pathology.body.includes('other causes'));
check(group('amygdala').pathology.body.includes('networks'));
check(group('thalamus').pathology.body.includes('not inevitable'));
check(group('lateral-geniculate').clinical.body.includes('both eyes'));
check(group('medial-geniculate').clinical.body.includes('one-ear'));
check(group('fornix').pathology.body.includes('unilateral'));
check(
  group('anterior-commissure').pathology.body.includes(
    'other brain malformations',
  ),
);
check(group('posterior-commissure').pathology.body.includes('Dorsal-midbrain'));
check(group('corpus-callosum').pathology.body.includes('developmental'));
check(group('choroid-plexus').pathology.body.includes('hydrocephalus'));
check(group('mammillary').pathology.body.includes('thiamine'));
same(ids.length, 23);
same(new Set(ids).size, 23);
same(
  expected.reduce((n, e) => n + e[3].length, 0),
  83,
);
same(expected.filter((e) => e[6] === 'organ').length, 22);
same(expected.filter((e) => e[6] === 'space').length, 1);
same(entry('FMA50801').sources.length, 59);
for (const f of ['FMA61934', 'FMA74877']) {
  same(entry(f).laterality, 'midline');
  same(entry(f).sources.length, 2);
}
same(entry('FMA73310').sources[0].file, 'FJ1816M');
for (const tab of tabs) {
  same(api.bodyLesson(entry('FMA61970'), tab).readiness, 'pending');
  same(api.centralNeuralClinicalLesson(entry('FMA61970'), tab), undefined);
}
same(
  catalog.structures
    .filter(
      (s) =>
        s.system === 'nerves' &&
        api.bodyLesson(s, 'clinical').readiness === 'pending',
    )
    .map((s) => s.fmaId),
  ['FMA61970'],
);
check(group('brain').clinical.bullets.some((b) => b.includes('999')));
check(
  group('mammillary').clinical.bullets.some((b) =>
    b.includes('medical emergency'),
  ),
);
const legacyRightShoulder = ['FMA13322', 'FMA23130', 'FMA13395'];
for (const f of legacyRightShoulder)
  for (const t of tabs) {
    same(api.centralNeuralClinicalLesson(entry(f), t), undefined);
    same(api.bodyLesson(entry(f), t), previous.bodyLesson(entry(f), t));
  }
for (const t of tabs)
  same(api.bodyLesson(entry('FMA19728'), t).readiness, 'pending');
for (const f of ['FMA45097', 'FMA45098'])
  for (const tab of tabs) {
    same(api.bodyLesson(entry(f), tab).readiness, 'pending');
    same(api.centralNeuralClinicalLesson(entry(f), tab), undefined);
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
    same(rows.map((r) => r[2]).sort(), [...files].sort());
    for (const file of files) {
      check(rows.some((r) => r[1] === entry(f).sourceName && r[2] === file));
      sourceIndexChecks++;
    }
  }
}
const negatives = [
  ['FMA50801', 'clinical', 'body'],
  ['FMA78497', 'pathology', 'readiness'],
  ['FMA72826', 'clinical', 'body'],
  ['FMA72828', 'pathology', 'body'],
  ['FMA72830', 'clinical', 'body'],
  ['FMA72832', 'pathology', 'body'],
  ['FMA258714', 'clinical', 'body'],
  ['FMA73303', 'pathology', 'body'],
  ['FMA73309', 'clinical', 'body'],
  ['FMA72924', 'pathology', 'body'],
  ['FMA61961', 'clinical', 'body'],
  ['FMA62072', 'pathology', 'body'],
  ['FMA86464', 'clinical', 'body'],
  ['FMA61934', 'pathology', 'body'],
  ['FMA74877', 'clinical', 'body'],
  ['FMA50801', 'anatomy', 'body'],
  ['FMA61934', 'function', 'body'],
  ['FMA78497', 'ultrasound', 'body'],
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
    draft: 622,
    'identity-only': 0,
    pending: 400,
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
  bodyRepresentations: 23,
  sourceComponents: 83,
  lessonGroups: 15,
  explicitTopicEdits: 46,
  combinedPinnedCurriculumSections: 2824,
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
    'Original central neural clinical drafts; forniceal commissure and all unresolved identity/function holds remain unchanged. Not nuclear or tract segmentation, symptom prediction, perimetry, audiology, memory testing, procedural targets, patient scans or clinical approval.',
};
await writeFile(
  new URL(
    'docs/central-neural-clinical-curriculum-validation.json',
    contentRoot,
  ),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
