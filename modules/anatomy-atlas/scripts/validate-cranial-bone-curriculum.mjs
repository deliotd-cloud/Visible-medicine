import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeCranialBones } from './cranial-bone-curriculum-transition.mjs';
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
const before = await readContentJson(
  'content/cranial-bone-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeCranialBones(context);
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
  FMA52749: ['midline', 'head-neck', 'bone', 'isa', ['FJ2772', 'FJ3201']],
  FMA52740: ['midline', 'head-neck', 'bone', 'isa', ['FJ3199']],
  FMA52734: ['midline', 'head-neck', 'bone', 'isa', ['FJ3200']],
  FMA54737: ['right', 'head-neck', 'bone', 'isa', ['FJ3369']],
  FMA54738: ['left', 'head-neck', 'bone', 'isa', ['FJ3263']],
  FMA53645: ['right', 'head-neck', 'bone', 'isa', ['FJ3371']],
  FMA53646: ['left', 'head-neck', 'bone', 'isa', ['FJ3265']],
  FMA53649: ['right', 'head-neck', 'bone', 'isa', ['FJ3375']],
  FMA53650: ['left', 'head-neck', 'bone', 'isa', ['FJ3269']],
  FMA53647: ['right', 'head-neck', 'bone', 'isa', ['FJ3378']],
  FMA53648: ['left', 'head-neck', 'bone', 'isa', ['FJ3272']],
  FMA53655: ['right', 'head-neck', 'bone', 'isa', ['FJ3379']],
  FMA53656: ['left', 'head-neck', 'bone', 'isa', ['FJ3273']],
  FMA52788: ['right', 'head-neck', 'bone', 'isa', ['FJ3380']],
  FMA52789: ['left', 'head-neck', 'bone', 'isa', ['FJ3274']],
  FMA52738: ['right', 'head-neck', 'bone', 'isa', ['FJ3386']],
  FMA52739: ['left', 'head-neck', 'bone', 'isa', ['FJ3281']],
  FMA52892: ['right', 'head-neck', 'bone', 'isa', ['FJ3392']],
  FMA52893: ['left', 'head-neck', 'bone', 'isa', ['FJ3287']],
  FMA52748: ['midline', 'head-neck', 'bone', 'isa', ['FJ3289']],
  FMA52735: ['midline', 'head-neck', 'bone', 'isa', ['FJ3309']],
  FMA52736: ['midline', 'head-neck', 'bone', 'isa', ['FJ3394']],
  FMA9710: ['midline', 'head-neck', 'bone', 'isa', ['FJ3395']],
};
same(api.cranialBoneLessons.length, 15);
same(
  api.cranialBoneLessons.flatMap((l) => l.fmaIds).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, region, category, tree, files]] of Object.entries(
  expected,
)) {
  const s = entry(fma);
  const l = api.cranialBoneLessons.find((l) => l.fmaIds.includes(fma));
  check(s && l);
  same(s.system, 'skeleton');
  same(s.category, category);
  same(s.region, 'head-neck');
  same(s.laterality, side);

  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  same(s.regions, [region]);
  for (const t of api.contentTabs) {
    const result = api.cranialBoneLesson(s, t);
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
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .cranialBoneLesson({ ...s, coverageNote: 'Coverage hold retained.' }, t)
        .note.includes('Coverage hold retained.'),
    );
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
    { laterality: side === 'left' ? 'right' : 'left' },
    { region: 'hand' },
    { category: category === 'ligament' ? 'cartilage' : 'ligament' },
    { regions: ['hand'] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.cranialBoneLesson({ ...s, ...mutation }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.cranialBoneLesson(s, t), undefined);
const lesson = (fma, t) => api.bodyLesson(entry(fma), t);
check(lesson('FMA52734', 'anatomy').body.includes('orbital roofs'));
check(lesson('FMA52788', 'anatomy').body.includes('sagittal suture'));
check(
  lesson('FMA52735', 'anatomy').body.includes('condyles articulate with C1'),
);
check(lesson('FMA52738', 'anatomy').bullets[0].includes('ossicular chain'));
check(lesson('FMA52736', 'anatomy').body.includes('sella turcica'));
check(
  lesson('FMA52740', 'anatomy').bullets[0].includes(
    'inferior nasal concha is a separate bone',
  ),
);
check(
  lesson('FMA54737', 'function').body.includes(
    'Bone itself does not secrete mucus',
  ),
);
check(
  lesson('FMA53645', 'anatomy').bullets[0].includes(
    'bone, sac and tear-producing gland',
  ),
);
check(lesson('FMA53655', 'anatomy').bullets[0].includes('not the soft palate'));
check(
  lesson('FMA52748', 'function').bullets[0].includes(
    'not independently moving left/right halves',
  ),
);
check(lesson('FMA52749', 'anatomy').bullets[0].includes('FJ2772 and FJ3201'));
check(lesson('FMA52749', 'anatomy').bullets[2].includes('2 source components'));
check(
  lesson('FMA52749', 'anatomy').bullets[0].includes(
    'not part of the skull proper',
  ),
);
same(
  Object.values(expected).reduce((n, e) => n + e[4].length, 0),
  24,
);
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
  for (const [fma, [, , , tree, files]] of Object.entries(expected)) {
    same(
      rowsByTree[tree].filter((row) => row[0] === fma),
      files.map((file) => [fma, entry(fma).name.toLowerCase(), file]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA52749', 'anatomy', 'body'],
  ['FMA52740', 'function', 'readiness'],
  ['FMA53645', 'anatomy', 'body'],
  ['FMA52736', 'function', 'body'],
  ['FMA52748', 'ct', 'body'],
  ['FMA54737', 'function', 'body'],
  ['FMA7857', 'anatomy', 'body'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
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
  draft: 693,
  'identity-only': 329,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 749,
  'identity-only': 146,
  pending: 127,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'skeleton' &&
      s.region === 'head-neck' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 23,
  sourceComponents: 24,
  lessonGroups: 15,
  explicitTopicEdits: 46,
  combinedPinnedCurriculumSections: 1000,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original draft teaching only; skull landmarks, hyoid component union, cranial canals, sinuses, ear/TMJ and neurovascular relationships remain unvalidated. No bone interiors, physiological jaw/swallowing motion, clinical approval or acquired imaging.',
};
await writeFile(
  new URL('docs/cranial-bone-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
