import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeLimbBones } from './limb-bone-curriculum-transition.mjs';
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
  'content/limb-bone-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeLimbBones(context);
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
  FMA16586: ['right', 'pelvis', 'bone', 'isa', ['FJ3152']],
  FMA13323: ['left', 'shoulder-arm', 'bone', 'isa', ['FJ3237']],
  FMA24475: ['left', 'thigh', 'bone', 'isa', ['FJ3259']],
  FMA24481: ['left', 'leg', 'bone', 'isa', ['FJ3260']],
  FMA23131: ['left', 'shoulder-arm', 'bone', 'isa', ['FJ3262']],
  FMA24487: ['left', 'leg', 'bone', 'isa', ['FJ3275']],
  FMA23465: ['left', 'forearm', 'bone', 'isa', ['FJ3277']],
  FMA13396: ['left', 'shoulder-arm', 'bone', 'isa', ['FJ3279']],
  FMA24478: ['left', 'leg', 'bone', 'isa', ['FJ3282']],
  FMA23468: ['left', 'forearm', 'bone', 'isa', ['FJ3286']],
  FMA16587: ['left', 'pelvis', 'bone', 'isa', ['FJ3288']],
  FMA23464: ['right', 'forearm', 'bone', 'isa', ['FJ3349']],
  FMA24474: ['right', 'thigh', 'bone', 'isa', ['FJ3365']],
  FMA24480: ['right', 'leg', 'bone', 'isa', ['FJ3366']],
  FMA24486: ['right', 'leg', 'bone', 'isa', ['FJ3381']],
  FMA24477: ['right', 'leg', 'bone', 'isa', ['FJ3387']],
  FMA23467: ['right', 'forearm', 'bone', 'isa', ['FJ3391']],
};
const expectedRegions = {
  FMA16586: ['pelvis', 'thigh'],
  FMA13323: ['shoulder-arm'],
  FMA24475: ['thigh', 'pelvis', 'leg'],
  FMA24481: ['leg'],
  FMA23131: ['shoulder-arm', 'forearm'],
  FMA24487: ['leg'],
  FMA23465: ['forearm'],
  FMA13396: ['shoulder-arm'],
  FMA24478: ['leg'],
  FMA23468: ['forearm'],
  FMA16587: ['pelvis', 'thigh'],
  FMA23464: ['forearm'],
  FMA24474: ['thigh', 'pelvis', 'leg'],
  FMA24480: ['leg'],
  FMA24486: ['leg'],
  FMA24477: ['leg'],
  FMA23467: ['forearm'],
};
same(api.limbBoneLessons.length, 10);
same(
  api.limbBoneLessons.flatMap((l) => l.bindings.map(([fma]) => fma)).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, region, category, tree, files]] of Object.entries(
  expected,
)) {
  const s = entry(fma);
  const l = api.limbBoneLessons.find((l) =>
    l.bindings.some(([id]) => id === fma),
  );
  check(s && l);
  same(s.system, 'skeleton');
  same(s.category, category);
  same(s.region, region);
  same(s.laterality, side);

  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  same(s.regions, expectedRegions[fma]);
  for (const t of api.contentTabs) {
    const result = api.limbBoneLesson(s, t);
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
        .limbBoneLesson({ ...s, coverageNote: 'Coverage hold retained.' }, t)
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
    same(api.limbBoneLesson({ ...s, ...mutation }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs) same(api.limbBoneLesson(s, t), undefined);
const lesson = (fma, t) => api.bodyLesson(entry(fma), t);
check(lesson('FMA13323', 'anatomy').body.includes('sternoclavicular'));
check(
  lesson('FMA13396', 'function').body.includes('not a true synovial joint'),
);
check(lesson('FMA23131', 'anatomy').body.includes('trochlea meets the ulnar'));
check(
  lesson('FMA23464', 'function').body.includes(
    'radius crosses relative to the ulna',
  ),
);
check(
  lesson('FMA23468', 'anatomy').bullets[0].includes(
    'no direct carpal articulation',
  ),
);
check(
  lesson('FMA16586', 'anatomy').bullets[0].includes(
    'not three independently dissectible',
  ),
);
check(
  lesson('FMA24475', 'anatomy').bullets[0].includes('pelvis, thigh and leg'),
);
check(lesson('FMA24477', 'anatomy').body.includes('medial malleolus'));
check(lesson('FMA24480', 'anatomy').body.includes('lateral malleolus'));
check(lesson('FMA24481', 'function').body.includes('smaller contribution'));
check(
  lesson('FMA24480', 'anatomy').bullets[0].includes(
    'does not articulate with the femur',
  ),
);
check(lesson('FMA24486', 'function').body.includes('mechanical advantage'));
check(
  lesson('FMA24487', 'anatomy').bullets[0].includes(
    'does not directly articulate with the tibia',
  ),
);
for (const [fma, regions] of Object.entries(expectedRegions))
  if (regions.length > 1)
    for (const missing of regions)
      same(
        api.limbBoneLesson(
          { ...entry(fma), regions: regions.filter((r) => r !== missing) },
          'anatomy',
        ),
        undefined,
        'Every required region guarded',
      );
// Right shoulder pilot content remains authoritative, not overwritten by a mirrored draft.
for (const fma of ['FMA13322', 'FMA13395', 'FMA23130']) {
  same(api.limbBoneLesson(entry(fma), 'anatomy'), undefined);
  same(lesson(fma, 'anatomy'), previous.bodyLesson(entry(fma), 'anatomy'));
  same(lesson(fma, 'function'), previous.bodyLesson(entry(fma), 'function'));
}
same(
  Object.values(expected).reduce((n, e) => n + e[4].length, 0),
  17,
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
  ['FMA13323', 'anatomy', 'body'],
  ['FMA23464', 'function', 'readiness'],
  ['FMA23468', 'anatomy', 'body'],
  ['FMA16586', 'function', 'body'],
  ['FMA24474', 'ct', 'body'],
  ['FMA24480', 'function', 'body'],
  ['FMA24486', 'anatomy', 'body'],
  ['FMA13322', 'anatomy', 'body'],
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
  draft: 710,
  'identity-only': 312,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 766,
  'identity-only': 146,
  pending: 110,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'skeleton' &&
      !['hand', 'foot'].includes(s.region) &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 17,
  sourceComponents: 17,
  lessonGroups: 10,
  explicitTopicEdits: 34,
  combinedPinnedCurriculumSections: 1034,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original draft teaching only; limb landmarks, joint surfaces, attachment footprints and neurovascular relationships remain unvalidated. No bone interiors, physiological motion, clinical approval or acquired imaging.',
};
await writeFile(
  new URL('docs/limb-bone-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
