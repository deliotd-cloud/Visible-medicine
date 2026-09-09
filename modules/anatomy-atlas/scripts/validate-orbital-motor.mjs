import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { orbitalMotorStudySets } from '../lib/orbital-motor-studies.ts';
import {
  dissectionProfiles,
  stageStructures,
  initialDissection,
  dissectionReducer,
  resolveDissection,
} from '../app/dissection-data.ts';
import { relatedStudyViews } from '../lib/study-navigation.ts';
import {
  bodyStudyScope,
  makeStudyLink,
  parseStudyLink,
  resolveStudyLink,
  studyDestinations,
} from '../lib/study-links.ts';
import { studyLibrary } from '../lib/study-library.ts';
import {
  historicalRecipeProfiles,
  preOrbitalMotorProfilesHash,
  orbitalMotorProfilesHash,
} from './recipe-history.mjs';

let checks = 0;
const same = (a, b, why) => {
  checks++;
  assert.deepEqual(a, b, why);
};
const check = (v, why) => {
  checks++;
  assert(v, why);
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = JSON.parse(raw);
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const before = JSON.stringify(dissectionProfiles);
same(hash(before), orbitalMotorProfilesHash);
same(
  hash(JSON.stringify(historicalRecipeProfiles(dissectionProfiles))),
  preOrbitalMotorProfilesHash,
);
const expected = [
  [
    'orbital-motor-iii-superior',
    ['FMA52574', 'FMA52575'],
    ['FMA49044', 'FMA49045', 'FMA49048', 'FMA49049'],
  ],
  [
    'orbital-motor-iii-inferior',
    ['FMA52576', 'FMA52577'],
    ['FMA49056', 'FMA49057', 'FMA49046', 'FMA49047', 'FMA49050', 'FMA49051'],
  ],
  ['orbital-motor-iv', ['FMA50881', 'FMA50882'], ['FMA49052', 'FMA49053']],
];
same(orbitalMotorStudySets.length, expected.length);
const profile = dissectionProfiles['head-neck'];
const fmas = (items) => items.map((s) => s.fmaId).sort();
const eyes = ['FMA12514', 'FMA12515'];
const members = new Set([
  ...expected.flatMap(([, nerves, muscles]) => [...nerves, ...muscles]),
  ...eyes,
]);
same(members.size, 20);
const tables = Object.fromEntries(
  await Promise.all(
    ['isa', 'partof'].map(async (tree) => [
      tree,
      (
        await readFile(
          `LICENSES/bodyparts3d-v4-index/${tree}_element_parts.txt`,
          'utf8',
        )
      )
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((row) => row.split('\t')),
    ]),
  ),
);
for (const fma of members) {
  const s = catalog.structures.find((s) => s.fmaId === fma);
  check(s && ['right', 'left'].includes(s.laterality));
  same(s.regions, ['head-neck']);
  same(
    s.sources.map((p) => p.file).sort(),
    tables[s.sourceTree]
      .filter((row) => row[0] === fma)
      .map((row) => row[2])
      .sort(),
    'Complete official component membership',
  );
}
for (const [id, nerves, muscles] of expected) {
  const study = orbitalMotorStudySets.find((s) => s.id === id);
  same(study.targetFmaIds, nerves);
  same(study.context, [{ fmaIds: [...muscles, ...eyes] }]);
  same(profile.stages.filter((s) => s.id === id).length, 1);
  same(profile.focuses.filter((s) => s.id === id).length, 1);
  same(profile.focuses.find((s) => s.id === id).includeSkeleton, false);
  for (const side of ['both', 'left', 'right']) {
    const scope = bodyStudyScope(catalog, 'head-neck', side);
    const allowed = scope.filter((s) =>
      [...nerves, ...muscles, ...eyes].includes(s.fmaId),
    );
    const actual = stageStructures(scope, profile, id);
    same(fmas(actual), fmas(allowed));
    same(
      stageStructures(scope, profile, 'free', id),
      actual,
      'Window and focus are the same visible set',
    );
    same(
      actual.length,
      (nerves.length + muscles.length + eyes.length) /
        (side === 'both' ? 1 : 2),
    );
    same(
      actual.filter((s) => s.system === 'nerves').length,
      side === 'both' ? 2 : 1,
    );
    check(
      actual.every((s) => s.system !== 'skeleton'),
      'No automatic skull obscures the small nerve surfaces',
    );
    const cards = studyLibrary(scope, profile).filter((c) =>
      c.recipes.some((r) => r.id === id),
    );
    same(
      cards.length,
      1,
      'Existing library groups equivalent window/focus without duplicate cards',
    );
    same(cards[0].recipes.map((r) => r.kind).sort(), ['focus', 'window']);
    for (const selected of actual) {
      const view = relatedStudyViews(scope, profile, selected.id).find(
        (v) => v.focusId === id,
      );
      check(view, 'Reachable from each member through Study together');
      same(view.role, nerves.includes(selected.fmaId) ? 'target' : 'context');
      same(
        fmas(view.targets),
        fmas(scope.filter((s) => nerves.includes(s.fmaId))),
      );
      same(
        fmas(view.context),
        fmas(scope.filter((s) => [...muscles, ...eyes].includes(s.fmaId))),
      );
      const removed = dissectionReducer(initialDissection, {
        type: 'remove',
        id: selected.id,
      });
      const focused = dissectionReducer(removed, { type: 'focus', id });
      same(resolveDissection(scope, profile, focused).visible, actual);
      same(dissectionReducer(focused, { type: 'undo' }), removed);
      const href = makeStudyLink(catalog, 'head-neck', selected.id, side, id);
      check(href?.startsWith('/regions/head-neck?'));
      const url = new URL(href, 'https://atlas.test');
      const link = resolveStudyLink(
        catalog,
        'head-neck',
        parseStudyLink(Object.fromEntries(url.searchParams)),
      );
      same(link.status, 'ready');
      same(link.selected.id, selected.id);
      same(
        link.visibleIds,
        actual.map((s) => s.id),
      );
      check(
        studyDestinations(catalog, selected, 'whole-body', side).some(
          (d) =>
            d.region === 'head-neck' && d.focuses.some((f) => f.focusId === id),
        ),
        'Whole-body selection links to this regional study',
      );
    }
    for (const excluded of scope.filter((s) => !allowed.includes(s)))
      check(
        !relatedStudyViews(scope, profile, excluded.id).some(
          (v) => v.focusId === id,
        ),
        'No invented relationship through proximity or a similar name',
      );
  }
}
let rejected = 0;
for (const mutate of [
  (p) =>
    p['head-neck'].focuses
      .find((f) => f.id === expected[0][0])
      .rule.fmaIds.pop(),
  (p) =>
    p['head-neck'].stages
      .find((f) => f.id === expected[0][0])
      .only[1].fmaIds.push('FMA49054'),
  (p) =>
    (p['head-neck'].focuses.find(
      (f) => f.id === expected[0][0],
    ).includeSkeleton = true),
  (p) => p['head-neck'].references.pop(),
  (p) => (p['head-neck'].stages[0].title = 'Changed legacy recipe'),
  (p) => (p.thorax.stages[0].description = 'Unrelated change'),
  (p) => p['head-neck'].focuses.push({ ...p['head-neck'].focuses.at(-1) }),
]) {
  const changed = structuredClone(dissectionProfiles);
  mutate(changed);
  assert.throws(() => historicalRecipeProfiles(changed));
  checks++;
  rejected++;
}
same(
  JSON.stringify(dissectionProfiles),
  before,
  'All operations are non-mutating',
);
const report = {
  checks,
  rejectedProfileChanges: rejected,
  studyViews: 3,
  sourceRepresentations: members.size,
  sides: ['both', 'left', 'right'],
  catalogSha256: hash(raw),
  profilesSha256: hash(before),
  previousProfilesSha256: preOrbitalMotorProfilesHash,
  verified: [
    'Exact source membership',
    'Same-side scope',
    'No unrelated context',
    'Existing window/focus library integration',
    'Study-together membership',
    'Dissection restore/Undo',
    'Source-pinned deep links from whole body',
    'Every previous recipe preserved',
  ],
  limitations: {
    clinicalApproval: false,
    newGeometry: false,
    endpointContinuity: false,
    eyeMovementSimulation: false,
    browserAcceptance: false,
  },
};
await writeFile(
  'docs/orbital-motor-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
