import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeThoracicBones } from './thoracic-bone-curriculum-transition.mjs';
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
  'content/thoracic-bone-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeThoracicBones(context);
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
  FMA7857: ['right', 'thorax', 'bone', 'isa', ['FJ3334']],
  FMA7987: ['left', 'thorax', 'bone', 'isa', ['FJ3228']],
  FMA7882: ['right', 'thorax', 'bone', 'isa', ['FJ3336']],
  FMA8012: ['left', 'thorax', 'bone', 'isa', ['FJ3229']],
  FMA7909: ['right', 'thorax', 'bone', 'isa', ['FJ3338']],
  FMA8039: ['left', 'thorax', 'bone', 'isa', ['FJ3230']],
  FMA7957: ['right', 'thorax', 'bone', 'isa', ['FJ3340']],
  FMA8148: ['left', 'thorax', 'bone', 'isa', ['FJ3231']],
  FMA8066: ['right', 'thorax', 'bone', 'isa', ['FJ3342']],
  FMA8093: ['left', 'thorax', 'bone', 'isa', ['FJ3232']],
  FMA8175: ['right', 'thorax', 'bone', 'isa', ['FJ3344']],
  FMA8202: ['left', 'thorax', 'bone', 'isa', ['FJ3233']],
  FMA8229: ['right', 'thorax', 'bone', 'isa', ['FJ3346']],
  FMA8256: ['left', 'thorax', 'bone', 'isa', ['FJ3234']],
  FMA8283: ['right', 'thorax', 'bone', 'isa', ['FJ3347']],
  FMA8310: ['left', 'thorax', 'bone', 'isa', ['FJ3235']],
  FMA8364: ['right', 'thorax', 'bone', 'isa', ['FJ3348']],
  FMA8391: ['left', 'thorax', 'bone', 'isa', ['FJ3236']],
  FMA8445: ['right', 'thorax', 'bone', 'isa', ['FJ3330']],
  FMA8472: ['left', 'thorax', 'bone', 'isa', ['FJ3225']],
  FMA8531: ['right', 'thorax', 'bone', 'isa', ['FJ3331']],
  FMA8532: ['left', 'thorax', 'bone', 'isa', ['FJ3226']],
  FMA8533: ['right', 'thorax', 'bone', 'isa', ['FJ3332']],
  FMA8534: ['left', 'thorax', 'bone', 'isa', ['FJ3227']],
  FMA7486: ['midline', 'thorax', 'bone', 'isa', ['FJ3290']],
  FMA7487: ['midline', 'thorax', 'bone', 'isa', ['FJ3178']],
  FMA7488: ['midline', 'thorax', 'bone', 'isa', ['FJ3153']],
};
same(api.thoracicBoneLessons.length, 15);
same(
  api.thoracicBoneLessons.flatMap((l) => l.fmaIds).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, region, category, tree, files]] of Object.entries(
  expected,
)) {
  const s = entry(fma);
  const l = api.thoracicBoneLessons.find((l) => l.fmaIds.includes(fma));
  check(s && l);
  same(s.system, 'skeleton');
  same(s.category, category);
  same(s.region, 'thorax');
  same(s.laterality, side);

  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  same(s.regions, [region]);
  for (const t of api.contentTabs) {
    const result = api.thoracicBoneLesson(s, t);
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
        .thoracicBoneLesson(
          { ...s, coverageNote: 'Coverage hold retained.' },
          t,
        )
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
    same(api.thoracicBoneLesson({ ...s, ...mutation }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.thoracicBoneLesson(s, t), undefined);
const lesson = (fma, t) => api.bodyLesson(entry(fma), t);
check(lesson('FMA7857', 'anatomy').body.includes('T1'));
check(lesson('FMA7882', 'anatomy').body.includes('sternal angle'));
for (const [fma, n] of [
  ['FMA7909', 3],
  ['FMA7957', 4],
  ['FMA8066', 5],
  ['FMA8175', 6],
  ['FMA8229', 7],
  ['FMA8283', 8],
  ['FMA8364', 9],
]) {
  check(lesson(fma, 'anatomy').body.includes('T' + (n - 1) + ' and T' + n));
  check(lesson(fma, 'anatomy').body.includes('T' + n + ' transverse process'));
}
check(lesson('FMA8310', 'anatomy').bullets[0].includes('vary'));
check(lesson('FMA8472', 'anatomy').body.includes('unattached tip'));
check(
  lesson('FMA8531', 'anatomy').body.includes('lacks a costotransverse joint'),
);
check(
  lesson('FMA8533', 'anatomy').body.includes('no anterior sternal attachment'),
);
check(
  lesson('FMA7486', 'anatomy').bullets[0].includes('not the whole breastbone'),
);
check(lesson('FMA7487', 'anatomy').bullets[0].includes('universal fusion age'));
check(lesson('FMA7488', 'anatomy').bullets[0].includes('not an age-resolved'));
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
  ['FMA7857', 'anatomy', 'body'],
  ['FMA7882', 'function', 'readiness'],
  ['FMA8283', 'anatomy', 'body'],
  ['FMA8445', 'function', 'body'],
  ['FMA7486', 'ct', 'body'],
  ['FMA7488', 'function', 'body'],
  ['FMA12519', 'anatomy', 'body'],
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
  draft: 670,
  'identity-only': 352,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 726,
  'identity-only': 146,
  pending: 150,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'skeleton' &&
      s.region === 'thorax' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 27,
  lessonGroups: 15,
  explicitTopicEdits: 54,
  combinedPinnedCurriculumSections: 954,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original draft teaching only; rib/sternal landmarks, facet and costal-margin variants, maturity, joint and neurovascular relationships remain unvalidated. No bone interiors, physiological breathing, clinical approval or acquired imaging.',
};
await writeFile(
  new URL('docs/thoracic-bone-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
