import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeSpinalBones } from './spinal-bone-curriculum-transition.mjs';
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
  'content/spinal-bone-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeSpinalBones(context);
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
  FMA12519: ['midline', 'head-neck', 'bone', 'isa', ['FJ3176']],
  FMA12520: ['midline', 'head-neck', 'bone', 'isa', ['FJ3177']],
  FMA12521: ['midline', 'head-neck', 'bone', 'isa', ['FJ3161']],
  FMA12522: ['midline', 'head-neck', 'bone', 'isa', ['FJ3164']],
  FMA12523: ['midline', 'head-neck', 'bone', 'isa', ['FJ3167']],
  FMA12524: ['midline', 'head-neck', 'bone', 'isa', ['FJ3170']],
  FMA12525: ['midline', 'head-neck', 'bone', 'isa', ['FJ3172']],
  FMA9165: ['midline', 'thorax', 'bone', 'isa', ['FJ3158']],
  FMA9187: ['midline', 'thorax', 'bone', 'isa', ['FJ3160']],
  FMA9209: ['midline', 'thorax', 'bone', 'isa', ['FJ3163']],
  FMA9248: ['midline', 'thorax', 'bone', 'isa', ['FJ3166']],
  FMA9922: ['midline', 'thorax', 'bone', 'isa', ['FJ3169']],
  FMA9945: ['midline', 'thorax', 'bone', 'isa', ['FJ3171']],
  FMA9968: ['midline', 'thorax', 'bone', 'isa', ['FJ3173']],
  FMA9991: ['midline', 'thorax', 'bone', 'isa', ['FJ3174']],
  FMA10014: ['midline', 'thorax', 'bone', 'isa', ['FJ3175']],
  FMA10037: ['midline', 'thorax', 'bone', 'isa', ['FJ3154']],
  FMA10059: ['midline', 'thorax', 'bone', 'isa', ['FJ3155']],
  FMA10081: ['midline', 'thorax', 'bone', 'isa', ['FJ3156']],
  FMA13072: ['midline', 'abdomen', 'bone', 'isa', ['FJ3157']],
  FMA13073: ['midline', 'abdomen', 'bone', 'isa', ['FJ3159']],
  FMA13074: ['midline', 'abdomen', 'bone', 'isa', ['FJ3162']],
  FMA13075: ['midline', 'abdomen', 'bone', 'isa', ['FJ3165']],
  FMA13076: ['midline', 'abdomen', 'bone', 'isa', ['FJ3168']],
  FMA16202: ['midline', 'pelvis', 'bone', 'isa', ['FJ3393']],
};
same(api.spinalBoneLessons.length, 13);
same(
  api.spinalBoneLessons.flatMap((l) => l.fmaIds).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, region, category, tree, files]] of Object.entries(
  expected,
)) {
  const s = entry(fma);
  const l = api.spinalBoneLessons.find((l) => l.fmaIds.includes(fma));
  check(s && l);
  same(s.system, 'skeleton');
  same(s.category, category);
  same(s.region, 'spine');
  same(s.laterality, side);

  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  same(s.regions, ['spine', region, ...(fma === 'FMA16202' ? ['thigh'] : [])]);
  for (const t of api.contentTabs) {
    const result = api.spinalBoneLesson(s, t);
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
        .spinalBoneLesson({ ...s, coverageNote: 'Coverage hold retained.' }, t)
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
    { laterality: 'left' },
    { region: 'thorax' },
    { category: category === 'ligament' ? 'cartilage' : 'ligament' },
    { regions: ['hand'] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.spinalBoneLesson({ ...s, ...mutation }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.spinalBoneLesson(s, t), undefined);
const lesson = (fma, t) => api.bodyLesson(entry(fma), t);
check(
  lesson('FMA12519', 'anatomy').bullets[0].includes(
    'no C1–C2 intervertebral disc',
  ),
);
check(lesson('FMA12520', 'anatomy').bullets[0].includes('dens remains part'));
check(lesson('FMA12525', 'anatomy').bullets[0].includes('variants occur'));
check(lesson('FMA10014', 'anatomy').body.includes('may be absent'));
check(lesson('FMA10037', 'anatomy').bullets[0].includes('does not certify'));
check(
  lesson('FMA10059', 'anatomy').body.includes(
    'without a transverse costal facet',
  ),
);
check(lesson('FMA10081', 'anatomy').body.includes('lumbar-like'));
check(lesson('FMA13076', 'function').bullets[0].includes('not establish'));
check(
  lesson('FMA16202', 'anatomy').bullets[0].includes(
    'not five independently dissectible',
  ),
);
check(
  lesson('FMA13072', 'anatomy').bullets[0].includes(
    'not a solid spinal-cord mesh',
  ),
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
  ['FMA12519', 'anatomy', 'body'],
  ['FMA12520', 'function', 'readiness'],
  ['FMA12525', 'anatomy', 'body'],
  ['FMA10037', 'function', 'body'],
  ['FMA13076', 'ct', 'body'],
  ['FMA16202', 'function', 'body'],
  ['FMA7875', 'anatomy', 'body'],
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
  draft: 643,
  'identity-only': 379,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 699,
  'identity-only': 146,
  pending: 177,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'skeleton' &&
      s.region === 'spine' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 25,
  lessonGroups: 13,
  explicitTopicEdits: 50,
  combinedPinnedCurriculumSections: 900,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original draft teaching only; landmarks, facet variants, numbering, fused sacral representation and neural/ligament relationships remain unvalidated. No bone interiors, physiological motion, clinical approval or acquired imaging.',
};
await writeFile(
  new URL('docs/spinal-bone-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
