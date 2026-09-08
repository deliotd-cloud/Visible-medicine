import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeConnective } from './connective-curriculum-transition.mjs';
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
  'content/connective-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeConnective(context);
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
  FMA7875: ['right', 'thorax', 'cartilage', 'isa', ['FJ3333']],
  FMA8005: ['left', 'thorax', 'cartilage', 'isa', ['FJ3239']],
  FMA7886: ['right', 'thorax', 'cartilage', 'isa', ['FJ3335']],
  FMA8031: ['left', 'thorax', 'cartilage', 'isa', ['FJ3242']],
  FMA7913: ['right', 'thorax', 'cartilage', 'isa', ['FJ3337']],
  FMA8058: ['left', 'thorax', 'cartilage', 'isa', ['FJ3245']],
  FMA7976: ['right', 'thorax', 'cartilage', 'isa', ['FJ3339']],
  FMA8167: ['left', 'thorax', 'cartilage', 'isa', ['FJ3248']],
  FMA8070: ['right', 'thorax', 'cartilage', 'isa', ['FJ3341']],
  FMA8112: ['left', 'thorax', 'cartilage', 'isa', ['FJ3251']],
  FMA8194: ['right', 'thorax', 'cartilage', 'isa', ['FJ3343']],
  FMA8221: ['left', 'thorax', 'cartilage', 'isa', ['FJ3254']],
  FMA8248: ['right', 'thorax', 'cartilage', 'isa', ['FJ3345']],
  FMA8275: ['left', 'thorax', 'cartilage', 'isa', ['FJ3255']],
  FMA59503: ['midline', 'head-neck', 'cartilage', 'partof', ['FJ2557']],
  FMA59505: ['right', 'head-neck', 'cartilage', 'partof', ['FJ2554']],
  FMA59506: ['left', 'head-neck', 'cartilage', 'partof', ['FJ2555']],
  FMA59512: ['right', 'head-neck', 'cartilage', 'partof', ['FJ2558']],
  FMA59513: ['left', 'head-neck', 'cartilage', 'partof', ['FJ2556']],
  FMA55099: ['midline', 'head-neck', 'cartilage', 'isa', ['FJ2808']],
  FMA9615: ['midline', 'head-neck', 'cartilage', 'isa', ['FJ2440', 'FJ2769']],
  FMA55113: ['right', 'head-neck', 'cartilage', 'isa', ['FJ2792']],
  FMA55114: ['left', 'head-neck', 'cartilage', 'isa', ['FJ2775']],
  FMA23707: ['right', 'forearm', 'ligament', 'isa', ['FJ1476']],
  FMA23708: ['left', 'forearm', 'ligament', 'isa', ['FJ1476M']],
  FMA35192: ['right', 'leg', 'ligament', 'isa', ['FJ1392']],
  FMA35193: ['left', 'leg', 'ligament', 'isa', ['FJ1392M']],
  FMA55115: ['right', 'head-neck', 'cartilage', 'isa', ['FJ2793']],
  FMA55116: ['left', 'head-neck', 'cartilage', 'isa', ['FJ2776']],
  FMA55117: ['right', 'head-neck', 'cartilage', 'isa', ['FJ2795']],
  FMA55118: ['left', 'head-neck', 'cartilage', 'isa', ['FJ2773']],
  FMA49144: ['right', 'head-neck', 'ligament', 'isa', ['FJ1334']],
  FMA49145: ['left', 'head-neck', 'ligament', 'isa', ['FJ1284']],
  FMA49147: ['right', 'head-neck', 'ligament', 'isa', ['FJ1335']],
  FMA49148: ['left', 'head-neck', 'ligament', 'isa', ['FJ1292']],
  FMA55138: ['midline', 'head-neck', 'ligament', 'isa', ['FJ2790']],
  FMA55140: ['right', 'head-neck', 'ligament', 'isa', ['FJ2797']],
  FMA55141: ['left', 'head-neck', 'ligament', 'isa', ['FJ2779']],
  FMA55227: ['unspecified', 'head-neck', 'ligament', 'isa', ['FJ2771']],
  FMA55230: ['midline', 'head-neck', 'ligament', 'isa', ['FJ2807']],
  FMA55237: ['midline', 'head-neck', 'ligament', 'isa', ['FJ2789']],
  FMA72309: ['right', 'head-neck', 'ligament', 'isa', ['FJ2764']],
  FMA72311: ['left', 'head-neck', 'ligament', 'isa', ['FJ2763']],
};
same(api.connectiveLessons.length, 21);
same(
  api.connectiveLessons.flatMap((l) => l.fmaIds).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, region, category, tree, files]] of Object.entries(
  expected,
)) {
  const s = entry(fma);
  const l = api.connectiveLessons.find((l) => l.fmaIds.includes(fma));
  check(s && l);
  same(s.system, 'connective');
  same(s.category, category);
  same(l.category, category);
  same(s.laterality, side);
  same(l.region, region);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  same(s.regions, [region]);
  for (const t of api.contentTabs) {
    const result = api.connectiveLesson(s, t);
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
    { category: category === 'ligament' ? 'cartilage' : 'ligament' },
    { regions: ['hand'] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(api.connectiveLesson({ ...s, ...mutation }, 'function'), undefined);
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.connectiveLesson(s, t), undefined);
const lesson = (fma, t) => api.bodyLesson(entry(fma), t);
check(lesson('FMA7875', 'anatomy').body.includes('bony fusion'));
check(lesson('FMA7886', 'anatomy').body.includes('normally synovial'));
check(lesson('FMA9615', 'anatomy').bullets[0].includes('FJ2440 and FJ2769'));
check(lesson('FMA23707', 'function').body.includes('no fixed percentage'));
check(
  lesson('FMA35192', 'anatomy').bullets[0].includes(
    'not the entire ankle syndesmosis',
  ),
);
check(
  lesson('FMA49144', 'anatomy').bullets[0].includes(
    'does not establish a complete rectus pulley',
  ),
);
check(
  lesson('FMA55227', 'anatomy').bullets[0].includes(
    'laterality remains unspecified',
  ),
);
check(
  lesson('FMA55099', 'function').bullets[0].includes(
    'not the hormone-secreting thyroid gland',
  ),
);
check(
  lesson('FMA55237', 'function').body.includes('not the cricothyroid muscle'),
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
  ['FMA7875', 'anatomy', 'body'],
  ['FMA9615', 'function', 'readiness'],
  ['FMA23707', 'function', 'body'],
  ['FMA55227', 'anatomy', 'body'],
  ['FMA55140', 'ct', 'body'],
  ['FMA12515', 'anatomy', 'body'],
  ['FMA61970', 'function', 'readiness'],
  ['FMA19728', 'function', 'readiness'],
  ['FMA49144', 'function', 'body'],
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
  draft: 618,
  'identity-only': 404,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 674,
  'identity-only': 146,
  pending: 202,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'connective' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 43,
  lessonGroups: 21,
  explicitTopicEdits: 86,
  combinedPinnedCurriculumSections: 850,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Original draft teaching only; attachments, cricoid component union, cartilage/joint variation and membrane/fascial bundles remain unvalidated. No tissue mechanics, clinical approval or acquired imaging.',
};
await writeFile(
  new URL('docs/connective-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
