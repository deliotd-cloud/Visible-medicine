import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeOrgans } from './organ-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (a, label) => {
  checks++;
  assert(a, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson('content/organ-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeOrgans(context);
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
// Independent observations from exact ISA/PART-OF rows, not derived from lessons.
// Laterality, region and membership are source facts, not clinical validation.
const expected = {
  FMA9600: ['unpaired', 'pelvis', 'partof', ['FJ3139']],
  FMA7211: ['right', 'pelvis', 'isa', ['FJ3142']],
  FMA7212: ['left', 'pelvis', 'isa', ['FJ3138']],
  FMA19387: ['right', 'pelvis', 'isa', ['FJ3143']],
  FMA19388: ['left', 'pelvis', 'isa', ['FJ3137']],
  FMA15571: ['right', 'abdomen', 'partof', ['FJ3146']],
  FMA15572: ['left', 'abdomen', 'partof', ['FJ3144']],
  FMA9607: ['unpaired', 'thorax', 'partof', ['FJ3150', 'FJ3151']],
  FMA13889: ['unpaired', 'head-neck', 'isa', ['FJ1796']],
  FMA12514: [
    'right',
    'head-neck',
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
  ],
  FMA12515: [
    'left',
    'head-neck',
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
  ],
  FMA14544: ['unpaired', 'pelvis', 'isa', ['FJ2571']],
  FMA54640: ['unpaired', 'head-neck', 'isa', ['FJ2761']],
  FMA59102: ['right', 'head-neck', 'isa', ['FJ1350']],
  FMA59103: ['left', 'head-neck', 'isa', ['FJ1299']],
  FMA59802: ['right', 'head-neck', 'isa', ['FJ2768']],
  FMA59803: ['left', 'head-neck', 'isa', ['FJ2766']],
  FMA59804: ['right', 'head-neck', 'isa', ['FJ2767']],
  FMA59805: ['left', 'head-neck', 'isa', ['FJ2765']],
  FMA18256: ['right', 'pelvis', 'isa', ['FJ3141']],
  FMA18257: ['left', 'pelvis', 'isa', ['FJ3136']],
  FMA19667: ['unpaired', 'pelvis', 'isa', ['FJ3148']],
  FMA14542: ['unpaired', 'abdomen', 'isa', ['FJ2565']],
};
same(api.organLessons.length, 15);
same(
  api.organLessons.flatMap((l) => l.fmaIds).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, region, tree, files]] of Object.entries(expected)) {
  const s = entry(fma);
  const l = api.organLessons.find((l) => l.fmaIds.includes(fma));
  check(s && l);
  same(s.system, 'organs');
  same(s.category, 'organ');
  same(s.laterality, side);
  same(l.region, region);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  same(
    s.regions,
    ['FMA15571', 'FMA15572', 'FMA14542'].includes(fma)
      ? ['abdomen', 'pelvis']
      : [region],
  );
  for (const t of api.contentTabs) {
    const result = api.organLesson(s, t);
    if (!before.tabs.includes(t)) {
      same(result, undefined);
      continue;
    }
    same(result, api.bodyLesson(s, t));
    same(
      JSON.parse(JSON.stringify(result)),
      body.find((r) => r.id === s.id).content[t],
    );
    same(result.readiness, 'draft');
    same(result.body, l[t]);
    same(result.bullets[0], l.distinction);
    check(result.note.includes('clinical review pending'));
    check(result.note.includes(s.coverageNote));
    check(result.note.includes('not tissue interiors'));
    same(result.citations, l.references);
    check(result.citations.length > 0);
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const original = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), original, 'Detached arrays');
  }
  const record = body.find((r) => r.id === s.id);
  same(record.validation.clinicalApproval, 'not-included');
  same(record.validation.materialRevisions, {
    geometry: null,
    teaching: null,
    imaging: null,
  });
  for (const mutation of [
    { system: 'nerves' },
    { category: 'space' },
    { regions: ['hand'] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.organLesson({ ...s, ...mutation }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs) same(api.organLesson(s, t), undefined);
const lesson = (fma, t) => api.bodyLesson(entry(fma), t);
check(
  lesson('FMA12515', 'anatomy').bullets[0].includes(
    'left has nine including FJ1282',
  ),
);
check(
  lesson('FMA12514', 'anatomy').bullets[0].includes(
    'Neither set independently identifies a retinal component',
  ),
);
check(lesson('FMA19667', 'anatomy').body.includes('does not represent female'));
check(
  lesson('FMA13889', 'function').body.includes('does not synthesise those two'),
);
check(
  lesson('FMA7211', 'anatomy').bullets[0].includes(
    'does not mean the testis lies inside the pelvic cavity',
  ),
);
check(lesson('FMA9607', 'anatomy').bullets[0].includes('Two source lobes'));
same(lesson('FMA61970', 'function').readiness, 'pending');
same(lesson('FMA19728', 'function').readiness, 'pending');
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rowsByTree = {};
  for (const tree of ['isa', 'partof'])
    rowsByTree[tree] = (
      await readFile(
        new URL(
          `../../work/bodyparts3d/${tree}_element_parts.txt`,
          import.meta.url,
        ),
        'utf8',
      )
    )
      .trim()
      .split(/\r?\n/)
      .map((l) => l.split('\t'));
  for (const [fma, [, , tree, files]] of Object.entries(expected)) {
    same(
      rowsByTree[tree].filter((row) => row[0] === fma),
      files.map((file) => [fma, entry(fma).name.toLowerCase(), file]),
    );
    sourceIndexChecks++;
  }
  for (const row of [
    ['FMA58082', 'anterior chamber of left eyeball', 'FJ1282'],
    ['FMA71194', 'right lobe of thymus', 'FJ3151'],
    ['FMA71195', 'left lobe of thymus', 'FJ3150'],
  ]) {
    check(
      rowsByTree.isa.some((r) => JSON.stringify(r) === JSON.stringify(row)),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA12515', 'anatomy', 'body'],
  ['FMA9600', 'function', 'readiness'],
  ['FMA19667', 'anatomy', 'body'],
  ['FMA13889', 'function', 'body'],
  ['FMA7211', 'ct', 'body'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
  ['FMA13373', 'function', 'body'],
];
for (const [fma, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (s, tab) =>
      s.fmaId === fma && tab === t
        ? {
            ...api.bodyLesson(s, tab),
            [field]:
              field === 'readiness'
                ? expected[fma]
                  ? 'pending'
                  : 'draft'
                : 'unrecorded',
          }
        : api.bodyLesson(s, tab),
    bodyContent: (s, tab) =>
      s.fmaId === fma && tab === t && field === 'body'
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
same(counts('anatomy'), {
  draft: 575,
  'identity-only': 447,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 631,
  'identity-only': 146,
  pending: 245,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'organs' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 23,
  lessonGroups: 15,
  explicitTopicEdits: 46,
  combinedPinnedCurriculumSections: 764,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original draft teaching only; eye component asymmetry, absent independent retinal label, fixed-age thymus, adult-male tract and internal-layer limitations retained. Full anatomy and clinical content are not complete.',
};
await writeFile(
  new URL('docs/organ-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
