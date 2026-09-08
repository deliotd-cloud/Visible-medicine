import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeUpperLimbVessels } from './upper-limb-vessel-curriculum-transition.mjs';
import { authoringBeforeRegionalVessels } from './regional-vessel-curriculum-transition.mjs';
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
  'content/upper-limb-vessel-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeUpperLimbVessels(context);
const upperLimbMilestone = await authoringBeforeRegionalVessels(context);
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
// Exact pre-authoring catalogue observations checked against official v4 ISA/PART-OF rows.
// These identity checks do not establish geometry or clinical validity.
const expected = {
  FMA22655: ['right', ['shoulder-arm'], 'isa', ['FJ2268']],
  FMA22656: ['left', ['shoulder-arm'], 'isa', ['FJ2216']],
  FMA22691: ['right', ['shoulder-arm'], 'isa', ['FJ2271']],
  FMA22692: ['left', ['shoulder-arm'], 'isa', ['FJ2219']],
  FMA22696: ['right', ['shoulder-arm'], 'isa', ['FJ2277']],
  FMA22697: ['left', ['shoulder-arm'], 'isa', ['FJ2225']],
  FMA22682: ['right', ['shoulder-arm'], 'isa', ['FJ2264']],
  FMA22683: ['left', ['shoulder-arm'], 'isa', ['FJ2212']],
  FMA22685: ['right', ['shoulder-arm'], 'isa', ['FJ2291', 'FJ2292']],
  FMA22687: ['left', ['shoulder-arm'], 'isa', ['FJ2239', 'FJ2240']],
  FMA23180: ['right', ['shoulder-arm'], 'isa', ['FJ2273']],
  FMA23181: ['left', ['shoulder-arm'], 'isa', ['FJ2221']],
  FMA66321: ['right', ['shoulder-arm'], 'isa', ['FJ2305']],
  FMA66322: ['left', ['shoulder-arm'], 'isa', ['FJ2253']],
  FMA22733: ['right', ['forearm', 'hand'], 'isa', ['FJ2294']],
  FMA22734: ['left', ['forearm', 'hand'], 'isa', ['FJ2242']],
  FMA22797: ['right', ['forearm', 'hand'], 'isa', ['FJ2310']],
  FMA22798: ['left', ['forearm', 'hand'], 'isa', ['FJ2258']],
  FMA22812: ['right', ['forearm', 'hand'], 'isa', ['FJ2266']],
  FMA22813: ['left', ['forearm', 'hand'], 'isa', ['FJ2214']],
  FMA13325: ['right', ['forearm', 'shoulder-arm'], 'isa', ['FJ2272']],
  FMA13326: ['left', ['forearm', 'shoulder-arm'], 'isa', ['FJ2220']],
  FMA22909: ['right', ['forearm', 'shoulder-arm'], 'isa', ['FJ2270']],
  FMA22910: ['left', ['forearm', 'shoulder-arm'], 'isa', ['FJ2218']],
  FMA22839: ['right', ['hand'], 'isa', ['FJ2279']],
  FMA22840: ['left', ['hand'], 'isa', ['FJ2227']],
  FMA3992: [
    'right',
    ['shoulder-arm', 'head-neck', 'thorax'],
    'isa',
    ['FJ2307'],
  ],
  FMA4084: ['left', ['shoulder-arm', 'head-neck', 'thorax'], 'isa', ['FJ2255']],
  FMA5039: [
    'right',
    ['shoulder-arm', 'head-neck', 'thorax'],
    'isa',
    ['FJ2276'],
  ],
  FMA4086: ['left', ['shoulder-arm', 'head-neck', 'thorax'], 'isa', ['FJ2224']],
  FMA4057: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2284']],
  FMA10552: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2232']],
  FMA10698: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2303']],
  FMA10681: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2251']],
  FMA13330: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2269']],
  FMA13331: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2217']],
  FMA50859: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2302']],
  FMA50860: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2250']],
  FMA66563: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2304']],
  FMA66564: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2252']],
  FMA23063: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2361']],
  FMA23064: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2330']],
  FMA23068: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2263']],
  FMA23069: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2211']],
  FMA23072: ['right', ['shoulder-arm', 'thorax'], 'isa', ['FJ2282']],
  FMA23073: ['left', ['shoulder-arm', 'thorax'], 'isa', ['FJ2230']],
};
same(api.upperLimbVesselLessons.length, 46);
same(
  api.upperLimbVesselLessons.map((l) => l.fmaId).sort(),
  Object.keys(expected).sort(),
);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
for (const [fma, [side, regions, tree, files]] of Object.entries(expected)) {
  const s = entry(fma);
  const l = api.upperLimbVesselLessons.find((l) => l.fmaId === fma);
  check(s && l);
  same(s.system, 'vessels');
  same(s.category, 'vessel');
  same(s.region, regions[0]);
  same(l.regions, regions);
  same(s.regions, regions);
  same(s.laterality, side);
  same(s.sourceTree, tree);
  same(
    s.sources.map((p) => p.file),
    files,
  );
  for (const t of api.contentTabs) {
    const result = api.upperLimbVesselLesson(s, t);
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
    check(result.note.includes('not physiological displacement'));
    if (s.coverageNote) check(result.note.includes(s.coverageNote));
    check(
      api
        .upperLimbVesselLesson(
          { ...s, coverageNote: 'Coverage hold retained.' },
          t,
        )
        .note.includes('Coverage hold retained.'),
    );
    same(result.citations, l.references);
    check(result.citations.length > 0);
    for (const url of result.citations) same(new URL(url).protocol, 'https:');
    const original = structuredClone(result);
    result.bullets.push('mutation');
    result.citations.push('mutation');
    same(api.bodyLesson(s, t), original, 'Detached arrays');
    if (t === 'anatomy') {
      check(result.bullets[1].includes('not oxygenation'));
      check(result.bullets[2].includes(s.fmaId));
      check(result.bullets[2].includes(files.length + ' source component'));
    }
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
    { category: 'bone' },
    { region: 'thorax' },
    { laterality: side === 'left' ? 'right' : 'left' },
    { regions: [] },
    { fmaId: 'FMA_UNKNOWN' },
  ])
    same(
      api.upperLimbVesselLesson({ ...s, ...mutation }, 'anatomy'),
      undefined,
    );
  for (const missing of regions)
    same(
      api.upperLimbVesselLesson(
        { ...s, regions: regions.filter((r) => r !== missing) },
        'function',
      ),
      undefined,
      'Required region guarded',
    );
}
for (const s of catalog.structures)
  if (!expected[s.fmaId])
    for (const t of api.contentTabs)
      same(api.upperLimbVesselLesson(s, t), undefined);
const lesson = (fma, t = 'anatomy') => api.bodyLesson(entry(fma), t);
for (const [fma, t, fragment] of [
  ['FMA22655', 'anatomy', 'lower teres-major border'],
  ['FMA22691', 'anatomy', 'cubital fossa'],
  ['FMA22696', 'anatomy', 'radial groove'],
  ['FMA22682', 'anatomy', 'anterior to the proximal humerus'],
  ['FMA22685', 'anatomy', 'quadrangular space'],
  ['FMA23180', 'anatomy', 'triangular space'],
  ['FMA66321', 'function', 'latissimus dorsi'],
  ['FMA22733', 'anatomy', 'anatomical snuffbox'],
  ['FMA22797', 'anatomy', 'superficial to the flexor retinaculum'],
  ['FMA22812', 'anatomy', 'anterior to the interosseous membrane'],
  ['FMA13325', 'anatomy', 'usual axillary-vein junction'],
  ['FMA22909', 'anatomy', 'joins brachial veins'],
  ['FMA22839', 'anatomy', 'predominantly radial'],
  ['FMA3992', 'anatomy', 'subclavian branch'],
  ['FMA5039', 'function', 'upper posterior intercostal'],
  ['FMA4057', 'anatomy', 'variable origin'],
  ['FMA10698', 'function', 'rotator-cuff'],
  ['FMA13330', 'anatomy', 'continues as subclavian'],
  ['FMA50859', 'anatomy', 'external jugular'],
  ['FMA66563', 'anatomy', 'second axillary part'],
  ['FMA23063', 'anatomy', 'between pectoralis major and minor'],
  ['FMA23068', 'function', 'around the acromion'],
  ['FMA23072', 'anatomy', 'deltopectoral interval'],
])
  check(lesson(fma, t).body.includes(fragment));
for (const [fma, fragment] of [
  ['FMA22685', 'two source files'],
  ['FMA23180', 'not the quadrangular space'],
  ['FMA22733', 'no Allen test'],
  ['FMA22797', 'Not a carpal-tunnel route'],
  ['FMA22909', 'not formed simply by radial/ulnar deep veins'],
  ['FMA22839', 'not proof of a complete patent ring'],
  ['FMA3992', 'no fixed four-way'],
  ['FMA4086', 'side-specific source review'],
  ['FMA50860', 'universal terminal junction'],
  ['FMA66564', 'Parent trunk'],
])
  check(lesson(fma).bullets[0].includes(fragment));
for (const fma of ['FMA45097', 'FMA45098', 'FMA61970', 'FMA19728'])
  same(lesson(fma, 'function').readiness, 'pending');
const sourceComponents = Object.values(expected).reduce(
  (n, e) => n + e[3].length,
  0,
);
same(sourceComponents, 48);
let sourceIndexChecks = 0;
if (process.argv.includes('--source')) {
  const rowsByTree = {};
  for (const tree of ['isa', 'partof'])
    rowsByTree[tree] = (
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
  for (const [fma, [, , tree, files]] of Object.entries(expected)) {
    same(
      rowsByTree[tree].filter((row) => row[0] === fma),
      files.map((file) => [fma, entry(fma).name.toLowerCase(), file]),
    );
    sourceIndexChecks++;
  }
}
const negatives = [
  ['FMA22655', 'anatomy', 'body'],
  ['FMA22685', 'function', 'readiness'],
  ['FMA22812', 'anatomy', 'body'],
  ['FMA13325', 'function', 'body'],
  ['FMA22839', 'function', 'body'],
  ['FMA5039', 'ultrasound', 'body'],
  ['FMA23072', 'anatomy', 'body'],
  ['FMA14765', 'function', 'body'],
  ['FMA45097', 'function', 'readiness'],
  ['FMA45098', 'function', 'readiness'],
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
        catalog.structures.filter(
          (s) => upperLimbMilestone.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 922,
  'identity-only': 100,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 978,
  'identity-only': 40,
  pending: 4,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'vessels' &&
      ['shoulder-arm', 'forearm', 'hand'].includes(s.region) &&
      api.bodyLesson(s, 'anatomy').readiness === 'identity-only',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  bodyRepresentations: 46,
  sourceComponents,
  lessonGroups: 23,
  explicitTopicEdits: 92,
  combinedPinnedCurriculumSections: 1458,
  sourceIndexChecks,
  negativeCases: negatives.length,
  bodyReadinessAtUpperLimbMilestone: {
    anatomy: counts('anatomy'),
    function: counts('function'),
  },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Draft reference teaching only. Compound source membership, vascular variants, branch continuity, lumen patency and circulation require review. No acquired imaging, haemodynamic simulation or clinical approval.',
};
await writeFile(
  new URL('docs/upper-limb-vessel-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
