import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  spinalLevelDefinitions,
  spinalLevelStudySets,
  spinalLevelReferences,
} from '../lib/spinal-level-studies.ts';
import {
  dissectionProfiles,
  initialDissection,
  dissectionReducer,
  resolveDissection,
  stageStructures,
} from '../app/dissection-data.ts';
import { relatedStudyViews } from '../lib/study-navigation.ts';
import { studyLibrary, filterStudyLibrary } from '../lib/study-library.ts';
import {
  parseStudyLink,
  makeStudyLink,
  resolveStudyLink,
} from '../lib/study-links.ts';
import {
  preSpinalLevelRecipeProfiles,
  acralBoneProfilesHash,
  spinalLevelProfilesHash,
} from './recipe-history.mjs';

let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  profile = dissectionProfiles.spine;
const before = JSON.stringify(dissectionProfiles);
same(hash(before), spinalLevelProfilesHash);
same(
  hash(JSON.stringify(preSpinalLevelRecipeProfiles(dissectionProfiles))),
  acralBoneProfilesHash,
);
const expected = [
  ['spine-c1-c2', ['atlas', 'axis']],
  [
    'spine-c5-c6',
    [
      'fifth cervical vertebra',
      'sixth cervical vertebra',
      'intervertebral disk of fifth cervical vertebra',
    ],
  ],
  [
    'spine-c7-t1',
    [
      'seventh cervical vertebra',
      'first thoracic vertebra',
      'intervertebral disk of seventh cervical vertebra',
    ],
  ],
  ['spine-t12-l1', ['twelfth thoracic vertebra', 'first lumbar vertebra']],
  [
    'spine-l4-l5',
    [
      'fourth lumbar vertebra',
      'fifth lumbar vertebra',
      'intervertebral disk of fourth lumbar vertebra',
    ],
  ],
  [
    'spine-l5-s1',
    [
      'fifth lumbar vertebra',
      'sacrum',
      'intervertebral disk of fifth lumbar vertebra',
    ],
  ],
];
same(
  spinalLevelStudySets.map((s) => s.id),
  expected.map(([id]) => id),
);
same(new Set(spinalLevelStudySets.flatMap((s) => s.targetFmaIds)).size, 15);
for (const ref of spinalLevelReferences)
  same(profile.references.includes(ref), true);
let scopes = 0,
  links = 0;
for (const [id, names] of expected) {
  const study = spinalLevelStudySets.find((s) => s.id === id);
  const definition = spinalLevelDefinitions.find((s) => s.id === id);
  same(study.regions, ['spine']);
  same(study.context, []);
  same(profile.stages.filter((s) => s.id === id).length, 1);
  same(profile.focuses.filter((s) => s.id === id).length, 1);
  same(profile.stages.find((s) => s.id === id).kind, 'window');
  same(study.inspect.includes('Return separation to 0%'), true);
  same(study.inspect.includes('No scan is registered'), true);
  const records = study.targetFmaIds.map((id) =>
    catalog.structures.find((s) => s.fmaId === id),
  );
  same(
    records.map((s) => s.sourceName),
    names,
  );
  same(
    records.every((s) => s.laterality === 'midline'),
    true,
  );
  same(records.filter((s) => s.system === 'skeleton').length, 2);
  if (definition.disc) {
    const [upper, lower, disc] = records;
    same(disc.system, 'connective');
    same(disc.fmaId, definition.disc);
    same(
      upper.center[1] > disc.center[1] && disc.center[1] > lower.center[1],
      true,
      'Position sanity check, not segmentation validation',
    );
  } else
    same(
      records.every((s) => s.system === 'skeleton'),
      true,
    );
  for (const side of ['both', 'right', 'left']) {
    scopes++;
    const scope = catalog.structures.filter(
      (s) =>
        s.regions.includes('spine') &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    const visible = stageStructures(scope, profile, id);
    same(visible.map((s) => s.fmaId).sort(), [...study.targetFmaIds].sort());
    same(stageStructures(scope, profile, 'free', id), visible);
    same(
      visible.some((s) => s.system === 'nerves' || s.system === 'muscles'),
      false,
    );
    const cards = studyLibrary(scope, profile),
      matching = cards.filter((c) => c.recipes.some((r) => r.id === id));
    same(matching.length, 1);
    same(matching[0].recipes.length, 2);
    same(filterStudyLibrary(cards, id.slice('spine-'.length)).some((c) => c.key === matching[0].key), true, 'ASCII level search, including L5-S1');
    same(
      matching[0].recipes.every((r) => r.available),
      true,
    );
    same(
      filterStudyLibrary(cards, study.title).some(
        (c) => c.key === matching[0].key,
      ),
      true,
    );
    for (const selected of visible) {
      const related = relatedStudyViews(scope, profile, selected.id).find(
        (r) => r.focusId === id,
      );
      same(related?.role, 'target');
      same(
        related?.visibleIds,
        visible.map((s) => s.id),
      );
      const link = makeStudyLink(catalog, 'spine', selected.id, side, id);
      same(typeof link, 'string');
      const url = new URL(link, 'https://atlas.invalid');
      same(url.pathname, '/regions/spine');
      const parsed = parseStudyLink(Object.fromEntries(url.searchParams));
      const result = resolveStudyLink(catalog, 'spine', parsed);
      same(result.status, 'ready');
      same(
        result.visibleIds,
        visible.map((s) => s.id),
      );
      same(result.view, definition.view);
      same(result.selected.id, selected.id);
      const stale = structuredClone(parsed);
      stale.request.sourceHash = '0'.repeat(64);
      same(resolveStudyLink(catalog, 'spine', stale).status, 'rejected');
      same(resolveStudyLink(catalog, 'hand', parsed).status, 'rejected');
      links++;
    }
    const focus = dissectionReducer(initialDissection, { type: 'focus', id });
    const removed = dissectionReducer(focus, {
      type: 'remove',
      id: visible[0].id,
    });
    same(resolveDissection(scope, profile, removed).visible, visible.slice(1));
    const undo = dissectionReducer(removed, { type: 'undo' });
    same(resolveDissection(scope, profile, undo).visible, visible);
    same(
      resolveDissection(
        scope,
        profile,
        dissectionReducer(undo, { type: 'redo' }),
      ).visible,
      visible.slice(1),
    );
    same(
      resolveDissection(
        scope,
        profile,
        dissectionReducer(removed, { type: 'reset' }),
      ).visible,
      scope,
    );
  }
}
same(
  spinalLevelDefinitions.filter((s) => !s.disc).map((s) => s.discScope),
  ['not-an-anatomical-disc-level', 'source-disc-unresolved'],
);
same(
  spinalLevelStudySets
    .find((s) => s.id === 'spine-t12-l1')
    .inspect.includes('source-coverage gap'),
  true,
);
same(
  spinalLevelStudySets
    .find((s) => s.id === 'spine-l5-s1')
    .description.includes('entire fused sacrum'),
  true,
);
for (const mutate of [
  (p) => {
    p.thorax.title += ' changed';
  },
  (p) => {
    p.spine.focuses
      .find((s) => s.id === 'spine-c5-c6')
      .rule.fmaIds.push('FMA78497');
  },
  (p) => {
    p.spine.stages.find((s) => s.id === 'spine-t12-l1').inspect =
      'Disc is normally absent';
  },
]) {
  const altered = structuredClone(dissectionProfiles);
  mutate(altered);
  assert.throws(() => preSpinalLevelRecipeProfiles(altered));
  checks++;
}
same(JSON.stringify(dissectionProfiles), before);
console.log(
  JSON.stringify({
    checks,
    studyViews: 6,
    sideScopes: scopes,
    sourceBoundLinks: links,
    reusedRepresentations: 15,
    newMeshes: 0,
    clinicalValidation: false,
    browserTesting: false,
  }),
);
