import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeFoot } from './foot-curriculum-transition.mjs';
import { authoringBeforePelvic } from './pelvic-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (v, label) => {
  checks++;
  assert(v, label);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson('content/foot-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const previous = await authoringBeforeFoot(context);
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
same(
  curriculumHash(copy(previous)),
  before.copyAndRecipeHash,
  'Every unrelated section and recipe preserved',
);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
  'Pinned transitions preserve original baseline',
);
const definitions = api.footMuscleLessons;
const ids = definitions.flatMap((l) => l.fmaIds);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same(definitions.length, 18);
same(ids.length, 36);
same(new Set(ids).size, 36);
same([...ids].sort(compare), before.entries.map((s) => s.fmaId).sort(compare));
same(definitions.filter((l) => l.representation === 'head').length, 4);
same(definitions.filter((l) => l.representation === 'variable-slip').length, 1);
for (const l of definitions) {
  same(l.fmaIds.length, 2);
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[field].trim().length > 8);
  check(l.references.length > 0);
  for (const url of l.references) same(new URL(url).protocol, 'https:');
  for (const fma of l.fmaIds) {
    const s = catalog.structures.find((s) => s.fmaId === fma);
    check(s);
    same(s.sources.length, 1);
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const lesson = api.footMuscleLesson(s, t);
      if (!before.tabs.includes(t)) {
        same(lesson, undefined);
        continue;
      }
      same(lesson, api.bodyLesson(s, t), 'Actual routing');
      same(lesson.readiness, 'draft');
      same(
        JSON.parse(JSON.stringify(lesson)),
        exported.content[t],
        'Actual exporter parity',
      );
      check(lesson.title.startsWith(s.name + ' ·'));
      check(lesson.note.includes('clinical review pending'));
      if (l.caution) check(lesson.note.includes(l.caution));
      check(
        api
          .footMuscleLesson({ ...s, coverageNote: 'Source warning' }, t)
          .note.endsWith('Source warning'),
      );
      same(lesson.citations, l.references);
      if (t === 'anatomy') {
        check(lesson.bullets.some((b) => b.includes(s.fmaId)));
        if (l.representation === 'head')
          check(lesson.body.includes('not the whole muscle'));
        if (l.representation === 'variable-slip')
          check(lesson.body.includes('variably separate'));
      } else check(lesson.bullets[1].includes('not rendered'));
      const unchanged = structuredClone(lesson);
      lesson.citations.push('mutation');
      lesson.bullets.push('mutation');
      same(api.bodyLesson(s, t), unchanged, 'Detached output arrays');
    }
    same(exported.validation.clinicalApproval, 'not-included');
    same(exported.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
  }
}
for (const s of catalog.structures)
  if (!ids.includes(s.fmaId))
    for (const t of api.contentTabs)
      same(api.footMuscleLesson(s, t), undefined);
const entry = (fma) => catalog.structures.find((s) => s.fmaId === fma);
const fixture = entry('FMA37717');
for (const change of [
  { system: 'nerves' },
  { regions: ['hand'] },
  { fmaId: 'FMA_UNKNOWN' },
])
  same(api.footMuscleLesson({ ...fixture, ...change }, 'anatomy'), undefined);
const lesson = (key) => definitions.find((l) => l.key === key);
const lumbricalIds = [
  ['FMA37717', 'FMA37718'],
  ['FMA37719', 'FMA37720'],
  ['FMA37485', 'FMA37486'],
  ['FMA37483', 'FMA37484'],
];
for (const [i, fmaIds] of lumbricalIds.entries()) {
  const l = lesson(`lumbrical-${i + 1}`);
  same(l.fmaIds, fmaIds);
  check(l.insertion.includes(`toe ${i + 2}`));
  check(l.insertion.startsWith('Medial'));
  same(
    l.motorSupply,
    i === 0 ? 'Medial plantar nerve.' : 'Lateral plantar nerve.',
  );
  check(l.action.includes('metatarsophalangeal'));
  check(l.action.includes('interphalangeal'));
}
const plantarIds = [
  ['FMA37745', 'FMA37746'],
  ['FMA37743', 'FMA37744'],
  ['FMA37741', 'FMA37742'],
];
for (const [i, fmaIds] of plantarIds.entries()) {
  const l = lesson(`plantar-interosseous-${i + 1}`);
  same(l.fmaIds, fmaIds);
  check(l.origin.includes(`metatarsal ${i + 3}`));
  check(l.insertion.includes(`toe ${i + 3}`));
  check(l.action.includes('second-toe axis'));
  same(l.motorSupply, 'Lateral plantar nerve.');
}
check(lesson('abductor-digiti-minimi').insertion.includes('proximal phalanx'));
check(lesson('opponens-digiti-minimi').insertion.includes('metatarsal 5'));
check(
  lesson('opponens-digiti-minimi').action.includes(
    'not established for this source',
  ),
);
check(lesson('opponens-digiti-minimi').caution.includes('does not validate'));
check(lesson('quadratus-plantae').insertion.includes('tendon apparatus'));
check(lesson('quadratus-plantae').caution.includes('Flexor accessorius'));
check(lesson('flexor-digitorum-brevis').insertion.includes('Middle phalanges'));
check(
  lesson('extensor-hallucis-brevis').insertion.includes('proximal phalanx'),
);
same(
  lesson('extensor-hallucis-brevis').motorSupply,
  'Deep fibular (peroneal) nerve.',
);
for (const [side, fmaIds] of Object.entries({
  medial: ['FMA45971', 'FMA45972'],
  lateral: ['FMA45973', 'FMA45974'],
})) {
  const l = lesson(`flexor-hallucis-brevis-${side}-head`);
  same(l.fmaIds, fmaIds);
  check(l.insertion.includes(`${side} sesamoid`));
}
check(
  lesson('flexor-hallucis-brevis-lateral-head').motorSupply.includes(
    'additional lateral plantar',
  ),
);
same(lesson('adductor-hallucis-oblique-head').fmaIds, ['FMA46018', 'FMA46019']);
same(lesson('adductor-hallucis-transverse-head').fmaIds, [
  'FMA46020',
  'FMA46021',
]);
check(lesson('adductor-hallucis-oblique-head').origin.includes('bases 2–4'));
check(
  lesson('adductor-hallucis-transverse-head').origin.includes(
    'joint ligaments',
  ),
);
const negatives = [
  [fixture, 'function', 'body'],
  [fixture, 'anatomy', 'readiness'],
  ...['FMA22548', 'FMA22452', 'FMA37396', 'FMA38479', 'FMA13398'].map((fma) => [
    entry(fma),
    'function',
    'body',
  ]),
  [fixture, 'ct', 'body'],
  [catalog.structures.find((s) => s.system === 'skeleton'), 'anatomy', 'body'],
];
for (const [s, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (candidate, tab) =>
      candidate.id === s.id && tab === t
        ? { ...api.bodyLesson(candidate, tab), [field]: 'unrecorded' }
        : api.bodyLesson(candidate, tab),
    bodyContent: (candidate, tab) =>
      candidate.id === s.id && tab === t && field === 'body'
        ? { ...api.bodyContent(candidate, tab), body: 'unrecorded' }
        : api.bodyContent(candidate, tab),
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
const footMilestoneApi = await authoringBeforePelvic(context);
const counts = (t, scope = catalog.structures) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        scope.filter((s) => footMilestoneApi.bodyLesson(s, t).readiness === r)
          .length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 407,
  'identity-only': 615,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 463,
  'identity-only': 146,
  pending: 413,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.system === 'muscles' &&
      s.regions.includes('foot') &&
      api.bodyLesson(s, 'function').readiness !== 'draft',
  ).length,
  0,
);
const regional = catalog.structures.filter((s) => s.regions.includes('foot'));
const report = {
  passed: true,
  checks,
  lessonDefinitions: 18,
  bodyRepresentations: 36,
  authoredSections: 72,
  combinedPinnedCurriculumSections: 424,
  bodyReadinessAtFootMilestone: {
    anatomy: counts('anatomy'),
    function: counts('function'),
  },
  footReadiness: {
    entries: regional.length,
    anatomy: counts('anatomy', regional),
    function: counts('function', regional),
  },
  negativeCases: negatives.length,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Software checks for identities, head/variable-slip limits, display/export and preservation; not anatomical accuracy, complete function, tendon/nerve mapping, clinical or device acceptance.',
};
await writeFile(
  new URL('docs/foot-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
