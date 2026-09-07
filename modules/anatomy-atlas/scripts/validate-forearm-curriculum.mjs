import assert from 'node:assert/strict';
import { authoringBeforeHand } from './hand-curriculum-transition.mjs';
import { writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import { authoringBeforeForearm } from './forearm-curriculum-transition.mjs';
import {
  curriculumHash,
  copyBeforeShoulderArmCurriculum,
} from './curriculum-transition.mjs';

let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (value, message) => {
  checks++;
  assert(value, message);
};
const context = await contentContext();
const { api, catalog, body } = context;
const before = await readContentJson('content/forearm-curriculum.before.json');
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const priorApi = await authoringBeforeForearm(context);
const displayed = (authoring) => ({
  body: catalog.structures.map((s) => ({
    id: s.id,
    sections: Object.fromEntries(
      api.contentTabs.map((t) => [t, authoring.bodyContent(s, t)]),
    ),
  })),
  shoulder: api.structures,
  dissectionProfiles: api.dissectionProfiles,
});
same(
  curriculumHash(displayed(priorApi)),
  before.copyAndRecipeHash,
  'All non-forearm copy and recipes preserved',
);
same(
  curriculumHash(await copyBeforeShoulderArmCurriculum(context)),
  baseline.copyAndRecipeHash,
  'Both explicit transitions preserve original baseline',
);
same(api.forearmMuscleLessons.length, 21);
const ids = api.forearmMuscleLessons.flatMap((l) => l.fmaIds);
same(ids.length, 42);
same(new Set(ids).size, 42);
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same([...ids].sort(compare), before.entries.map((s) => s.fmaId).sort(compare));
same(
  api.forearmMuscleLessons.filter((l) => l.representation === 'head').length,
  4,
);
const entry = (id) => catalog.structures.find((s) => s.fmaId === id);
const lesson = (key) => api.forearmMuscleLessons.find((l) => l.key === key);
for (const l of api.forearmMuscleLessons) {
  check(['muscle', 'head'].includes(l.representation));
  same(l.fmaIds.length, 2, 'Explicit bilateral IDs, not generated counterpart');
  for (const key of ['origin', 'insertion', 'action', 'motorSupply'])
    check(l[key].trim().length > 8);
  check(l.references.length > 0);
  for (const link of l.references) same(new URL(link).protocol, 'https:');
  for (const id of l.fmaIds) {
    const s = entry(id);
    check(s);
    const exported = body.find((r) => r.id === s.id);
    for (const t of api.contentTabs) {
      const direct = api.forearmMuscleLesson(s, t);
      if (t !== 'anatomy' && t !== 'function') {
        same(direct, undefined, 'Unsupported topics remain unchanged');
        continue;
      }
      same(
        direct,
        api.bodyLesson(s, t),
        'Actually routed into visible curriculum',
      );
      same(direct.readiness, 'draft');
      same(
        JSON.parse(JSON.stringify(direct)),
        exported.content[t],
        'Source-bound body export',
      );
      check(
        direct.title.startsWith(s.name + ' ·'),
        'Source side/part name retained',
      );
      check(direct.note.includes('clinical review pending'));
      if (s.coverageNote) check(direct.note.includes(s.coverageNote));
      if (l.caution) check(direct.note.includes(l.caution));
      same(direct.citations, l.references);
      if (t === 'anatomy') {
        check(direct.bullets.some((b) => b.includes(s.fmaId)));
        check(
          direct.bullets.some((b) =>
            b.includes(s.sources.length + ' source component'),
          ),
        );
        if (l.representation === 'head')
          check(direct.body.includes('not the whole muscle'));
      } else {
        check(direct.bullets[0].startsWith('Motor supply: '));
        check(direct.bullets[1].includes('not rendered'));
      }
      const original = structuredClone(direct);
      direct.citations.push('mutation-fixture');
      direct.bullets.push('mutation-fixture');
      same(api.bodyLesson(s, t), original, 'No mutation of authored source');
    }
    same(exported.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
    same(exported.validation.clinicalApproval, 'not-included');
  }
}
for (const s of catalog.structures) {
  if (!ids.includes(s.fmaId))
    for (const t of api.contentTabs)
      same(
        api.forearmMuscleLesson(s, t),
        undefined,
        'No neighbouring structure/name leakage',
      );
}
const fixture = entry('FMA38479');
same(
  api.forearmMuscleLesson({ ...fixture, system: 'nerves' }, 'anatomy'),
  undefined,
);
same(
  api.forearmMuscleLesson({ ...fixture, regions: ['hand'] }, 'anatomy'),
  undefined,
);
same(
  api.forearmMuscleLesson({ ...fixture, fmaId: 'FMA_UNKNOWN' }, 'anatomy'),
  undefined,
);
// Independent identity and high-risk concept checks; engineering guards only.
same(lesson('flexor-pollicis-longus').fmaIds, ['FMA38482', 'FMA38484']);
same(lesson('pronator-teres-humeral-head').fmaIds, ['FMA38560', 'FMA38561']);
same(lesson('pronator-teres-ulnar-head').fmaIds, ['FMA38562', 'FMA38563']);
check(lesson('pronator-teres-ulnar-head').origin.includes('coronoid'));
check(lesson('flexor-carpi-ulnaris-ulnar-head').origin.includes('Olecranon'));
for (const key of [
  'flexor-carpi-ulnaris-ulnar-head',
  'flexor-carpi-ulnaris-humeral-head',
]) {
  same(lesson(key).motorSupply, 'Ulnar nerve.');
  check(lesson(key).insertion.includes('ligament'));
}
check(
  lesson('flexor-digitorum-superficialis').insertion.includes(
    'middle phalanges',
  ),
);
check(
  lesson('flexor-digitorum-profundus').insertion.includes('distal phalanges'),
);
check(lesson('flexor-digitorum-profundus').motorSupply.includes('2–3'));
check(
  lesson('flexor-digitorum-profundus').motorSupply.includes(
    'ulnar nerve for fingers 4–5',
  ),
);
same(
  lesson('flexor-pollicis-longus').motorSupply,
  lesson('pronator-quadratus').motorSupply,
);
check(
  lesson('extensor-pollicis-brevis').insertion.includes('proximal phalanx'),
);
check(lesson('extensor-pollicis-longus').insertion.includes('distal phalanx'));
check(lesson('extensor-indicis').insertion.includes('Index-finger'));
check(lesson('extensor-carpi-radialis-longus').insertion.endsWith('II.'));
check(lesson('extensor-carpi-radialis-brevis').insertion.endsWith('III.'));
check(lesson('brachioradialis').action.includes('does not cross the wrist'));
for (const id of ['FMA38507', 'FMA38508', 'FMA38470', 'FMA38471'])
  same(
    entry(id).sources.length,
    2,
    'Preserve actual aggregate component count',
  );

// Mutations of current targets, older targets and untouched topics must fail.
const negatives = [
  [fixture, 'anatomy', 'body'],
  [fixture, 'function', 'readiness'],
  [entry('FMA13398'), 'function', 'body'],
  [fixture, 'ct', 'body'],
  [catalog.structures.find((s) => s.system === 'skeleton'), 'anatomy', 'body'],
];
for (const [s, t, field] of negatives) {
  const changed = {
    ...api,
    bodyLesson: (candidate, tab) => {
      const original = api.bodyLesson(candidate, tab);
      return candidate.id === s.id && tab === t
        ? { ...original, [field]: 'changed-fixture' }
        : original;
    },
    bodyContent: (candidate, tab) => {
      const original = api.bodyContent(candidate, tab);
      return candidate.id === s.id && tab === t && field === 'body'
        ? { ...original, body: 'changed-fixture' }
        : original;
    },
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
// Historical milestone counts; the hand suite validates current totals.
const forearmMilestoneApi = await authoringBeforeHand(context);
const counts = (t) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter(
          (s) => forearmMilestoneApi.bodyLesson(s, t).readiness === r,
        ).length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 269,
  'identity-only': 753,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 331,
  'identity-only': 146,
  pending: 545,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.regions.includes('forearm') &&
      s.system === 'muscles' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 21,
  bodyRepresentations: 42,
  authoredSections: 84,
  combinedPinnedCurriculumSections: 148,
  bodyReadinessAtForearmMilestone: {
    anatomy: counts('anatomy'),
    function: counts('function'),
  },
  negativeCases: negatives.length,
  previousShoulderCurriculumPreserved: true,
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Tests cover exact identity/part routing, current display/export parity, detached output, pinned before/after changes and regression safeguards. They do not establish clinical accuracy, attachment footprints, tendon-slip completeness, actual nerve courses or device acceptance.',
};
await writeFile(
  new URL('docs/forearm-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
