import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import {
  contentContext,
  contentRoot,
  readContentJson,
} from './content-contract-tools.mjs';
import {
  copyBeforeShoulderArmCurriculum,
  curriculumHash,
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
const before = await readContentJson(
  'content/shoulder-arm-curriculum.before.json',
);
const baseline = await readContentJson(
  'content/content-contract-baseline.json',
);
const restored = await copyBeforeShoulderArmCurriculum(context);
same(
  curriculumHash(restored),
  baseline.copyAndRecipeHash,
  'Preserve every other body/shoulder topic and dissection recipe',
);
same(api.shoulderArmLessons.length, 20);
const ids = api.shoulderArmLessons.flatMap((l) => l.fmaIds);
const compareIds = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
same(ids.length, 32);
same(new Set(ids).size, 32, 'No duplicated identity');
same(
  [...ids].sort(compareIds),
  before.entries.map((s) => s.fmaId).sort(compareIds),
  'Exactly the previously pending targets',
);
const byFma = (id) => catalog.structures.find((s) => s.fmaId === id);
const byKey = (key) => api.shoulderArmLessons.find((l) => l.key === key);
for (const lesson of api.shoulderArmLessons) {
  for (const field of ['origin', 'insertion', 'action', 'motorSupply'])
    check(lesson[field].trim().length > 10, 'Authored ' + field);
  check(lesson.references.length > 0, 'Source citations');
  for (const link of lesson.references) same(new URL(link).protocol, 'https:');
  for (const id of lesson.fmaIds) {
    const s = byFma(id);
    check(s, 'Real source identity');
    const record = body.find((r) => r.id === s.id);
    for (const tab of api.contentTabs) {
      const direct = api.shoulderArmLesson(s, tab);
      if (tab !== 'anatomy' && tab !== 'function') {
        same(
          direct,
          undefined,
          'Never invent scan/pathology/clinical/quiz text',
        );
        continue;
      }
      same(direct.readiness, 'draft');
      same(api.bodyLesson(s, tab), direct, 'Actual display authoring path');
      same(
        JSON.parse(JSON.stringify(direct)),
        record.content[tab],
        'Actual source-bound export',
      );
      check(
        direct.title.startsWith(s.name + ' ·'),
        'Retain specific source-side/part title',
      );
      check(direct.note.includes('review pending'), 'Explicit review boundary');
      if (s.coverageNote)
        check(
          direct.note.includes(s.coverageNote),
          'Retain source-specific caveat',
        );
      same(direct.citations, lesson.references);
      same(
        Object.hasOwn(api.bodyContent(s, tab), 'readiness'),
        false,
        'Display shape remains compatible',
      );
      if (tab === 'anatomy') {
        check(
          direct.bullets.some((b) => b.includes(s.fmaId)),
          'Source identity visible',
        );
        if (lesson.representation !== 'muscle')
          check(
            direct.body.includes('not the whole muscle'),
            'Do not overstate one part',
          );
      } else {
        check(direct.bullets[0].startsWith('Motor supply: '));
        check(
          direct.bullets[1].includes('not rendered'),
          'Nerve teaching is not nerve geometry',
        );
      }
      const clean = structuredClone(api.bodyLesson(s, tab));
      direct.citations.push('mutation-fixture');
      direct.bullets.push('mutation-fixture');
      same(
        api.bodyLesson(s, tab),
        clean,
        'Returned lessons cannot mutate source definitions',
      );
    }
    same(
      record.validation.materialRevisions,
      { geometry: null, teaching: null, imaging: null },
      'No pilot review borrowed',
    );
  }
}
for (const s of catalog.structures) {
  if (!ids.includes(s.fmaId))
    for (const tab of api.contentTabs)
      same(
        api.shoulderArmLesson(s, tab),
        undefined,
        'No name/side/group inference',
      );
}
const fixture = byFma('FMA13398');
same(
  api.shoulderArmLesson({ ...fixture, system: 'nerves' }, 'anatomy'),
  undefined,
);
same(
  api.shoulderArmLesson({ ...fixture, regions: ['head-neck'] }, 'anatomy'),
  undefined,
);
same(
  api.shoulderArmLesson({ ...fixture, fmaId: 'FMA_UNKNOWN' }, 'anatomy'),
  undefined,
);
same(byKey('biceps-short-head').fmaIds, ['FMA37684', 'FMA37685']);
same(
  byKey('biceps-long-head').fmaIds,
  ['FMA37687'],
  'Existing right pilot record is not overwritten',
);
same(byKey('triceps-medial-head').fmaIds, ['FMA37695', 'FMA37696']);
same(byKey('triceps-lateral-head').fmaIds, ['FMA37697', 'FMA37698']);
check(byKey('triceps-medial-head').origin.includes('below'));
check(byKey('triceps-lateral-head').origin.includes('above'));
check(byKey('triceps-long-head').origin.includes('Infraglenoid'));
check(byKey('subscapularis').insertion.includes('Lesser'));
check(byKey('infraspinatus').insertion.includes('Greater'));
check(byKey('teres-major').action.includes('not a rotator-cuff'));
check(
  byKey('brachialis').motorSupply.includes('radial'),
  'Retain dual-innervation caveat',
);

// Prove the preservation gate rejects actual out-of-scope and in-scope edits.
for (const target of [
  fixture,
  catalog.structures.find((s) => !ids.includes(s.fmaId)),
]) {
  const changed = {
    ...api,
    bodyLesson: (s, t) =>
      s.id === target.id && t === 'anatomy'
        ? { ...api.bodyLesson(s, t), body: 'changed fixture' }
        : api.bodyLesson(s, t),
    bodyContent: (s, t) =>
      s.id === target.id && t === 'anatomy'
        ? { ...api.bodyContent(s, t), body: 'changed fixture' }
        : api.bodyContent(s, t),
  };
  await assert.rejects(async () =>
    same(
      curriculumHash(
        await copyBeforeShoulderArmCurriculum({ ...context, api: changed }),
      ),
      baseline.copyAndRecipeHash,
    ),
  );
  checks++;
}
const counts = (tab) =>
  Object.fromEntries(
    ['draft', 'identity-only', 'pending', 'generated-identification'].map(
      (r) => [
        r,
        catalog.structures.filter((s) => api.bodyLesson(s, tab).readiness === r)
          .length,
      ],
    ),
  );
same(counts('anatomy'), {
  draft: 227,
  'identity-only': 795,
  pending: 0,
  'generated-identification': 0,
});
same(counts('function'), {
  draft: 289,
  'identity-only': 146,
  pending: 587,
  'generated-identification': 0,
});
same(
  catalog.structures.filter(
    (s) =>
      s.regions.includes('shoulder-arm') &&
      s.system === 'muscles' &&
      api.bodyLesson(s, 'function').readiness === 'pending',
  ).length,
  0,
);
const report = {
  passed: true,
  checks,
  lessonDefinitions: 20,
  bodyRepresentations: 32,
  authoredSections: 64,
  bodyReadiness: { anatomy: counts('anatomy'), function: counts('function') },
  unrelatedCopyAndRecipesPreserved: true,
  sourceGeometryChanged: false,
  clinicalApproval: false,
  scanContentAdded: false,
  browserTesting: false,
  limitations:
    'Checks identity/part routing, display/export parity, pinned copy transition and safeguards. They do not establish medical correctness, precise attachment footprints, clinical approval or rendered nerve courses.',
};
await writeFile(
  new URL('docs/shoulder-arm-curriculum-validation.json', contentRoot),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
