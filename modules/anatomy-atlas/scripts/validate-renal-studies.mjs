import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renalStudySets } from '../lib/renal-studies.ts';
import {
  dissectionProfiles,
  stageStructures,
  initialDissection,
  dissectionReducer,
  resolveDissection,
} from '../app/dissection-data.ts';
import { studyLibrary } from '../lib/study-library.ts';
import { relatedStudyViews } from '../lib/study-navigation.ts';
import {
  bodyStudyScope,
  makeStudyLink,
  parseStudyLink,
  resolveStudyLink,
} from '../lib/study-links.ts';
import { loadSourceHolds } from './load-source-holds.mjs';
import {
  preRenalRecipeProfiles,
  orbitalMotorProfilesHash,
  renalProfilesHash,
  preAcralBoneRecipeProfiles,
} from './recipe-history.mjs';

let checks = 0;
const same = (a, b, why) => {
  assert.deepEqual(a, b, why);
  checks++;
};
const check = (value, why) => {
  assert(value, why);
  checks++;
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const jsonHash = (value) => hash(JSON.stringify(value));
const { catalog, records, policy, evidence } = await loadSourceHolds();
const original = JSON.stringify(dissectionProfiles);
same(jsonHash(preAcralBoneRecipeProfiles(dissectionProfiles)), renalProfilesHash);
same(
  jsonHash(preRenalRecipeProfiles(dissectionProfiles)),
  orbitalMotorProfilesHash,
);

/** @type {Array<[string, string, string[]]>} */
const expected = [
  ['FMA7204', 'right kidney', ['FJ3147']],
  ['FMA7205', 'left kidney', ['FJ3145']],
  ['FMA14752', 'right renal artery', ['FJ2038']],
  ['FMA14753', 'left renal artery', ['FJ2046']],
  ['FMA15571', 'right ureter', ['FJ3146']],
  ['FMA15572', 'left ureter', ['FJ3144']],
  ['FMA15629', 'right adrenal gland', ['FJ3130']],
  ['FMA15630', 'left adrenal gland', ['FJ3129']],
  ['FMA3789', 'abdominal aorta', ['FJ1932']],
  ['FMA10951', 'inferior vena cava', ['FJ3441', 'FJ3659']],
];
const audited = [];
const compare = (a, b) => a.localeCompare(b);
const aggregateDefinitions = {
  FMA14752: ['FJ2038', 'FJ3576', 'FJ3581', 'FJ3582', 'FJ3584'],
  FMA14753: ['FJ2046', 'FJ3467', 'FJ3476', 'FJ3481'],
};
for (const [id, name, files] of expected) {
  const record = records.find((r) => r.tree === 'partof' && r.id === id);
  same(record.name, name);
  same(
    [...record.files].sort(compare),
    [...(aggregateDefinitions[id] ?? files)].sort(compare),
  );
  const members = catalog.structures.filter((s) => s.fmaId === id);
  same(members.length, 1);
  const member = members[0];
  const tree = ['FMA7204', 'FMA7205', 'FMA15571', 'FMA15572'].includes(id)
    ? 'partof'
    : 'isa';
  same(member.sourceTree, tree);
  const displayedDefinition = records.find(
    (r) => r.tree === tree && r.id === id,
  );
  same([...displayedDefinition.files].sort(compare), [...files].sort(compare));
  policy.assertNoKnownHolds([displayedDefinition]);
  checks++;
  same(member.sourceName, name);
  same(member.provenance.license, 'CC-BY-4.0');
  same(member.sources.map((s) => s.file).sort(compare), [...files].sort(compare));
  // Audit actual pinned OBJ bytes; no new geometry is exported or admitted.
  for (const source of member.sources) {
    const bytes = await readFile(
      `../work/bodyparts3d/${tree}/${source.file}.obj`,
    );
    same(hash(bytes), source.sha256, 'Existing raw source bytes unchanged');
  }
  audited.push({
    id: member.id,
    fmaId: id,
    sourceTree: member.sourceTree,
    sources: member.sources,
    sourceDefinitionFiles: displayedDefinition.files,
    partofDefinitionFiles: record.files,
    additionalPartofFilesNotIncluded: record.files.filter(
      (f) => !files.includes(f),
    ),
  });
}
const internalPattern =
  /renal cortex|cortex of.*kidney|renal medulla|medulla of.*kidney|renal pelvis|pelvis of.*kidney|renal pyramids?|renal caly|caly[xc].*kidney/i;
const internalLabels = records.filter((r) => internalPattern.test(r.name));
same(
  internalLabels,
  [],
  'Pinned ISA/PART-OF labels do not establish separate kidney internals',
);
for (const tree of ['isa', 'partof']) {
  same(records.find((r) => r.tree === tree && r.id === 'FMA7204').files, [
    'FJ3147',
  ]);
  same(records.find((r) => r.tree === tree && r.id === 'FMA7205').files, [
    'FJ3145',
  ]);
}
same(renalStudySets.length, 4);
const ids = new Set(
  renalStudySets.flatMap((s) => [
    ...s.targetFmaIds,
    ...s.context.flatMap((r) => r.fmaIds),
  ]),
);
same([...ids].sort(compare), expected.map(([id]) => id).sort(compare));
for (const region of ['abdomen', 'whole-body']) {
  const profile = dissectionProfiles[region];
  for (const side of ['both', 'left', 'right']) {
    const scope = bodyStudyScope(catalog, region, side);
    for (const study of renalStudySets) {
      same(profile.stages.filter((s) => s.id === study.id).length, 0);
      same(profile.focuses.filter((s) => s.id === study.id).length, 1);
      const targets = scope.filter((s) => study.targetFmaIds.includes(s.fmaId));
      const fmas = [
        ...study.targetFmaIds,
        ...study.context.flatMap((r) => r.fmaIds),
      ];
      const members = scope.filter((s) => fmas.includes(s.fmaId));
      const cards = studyLibrary(scope, profile).filter((c) =>
        c.recipes.some((r) => r.id === study.id),
      );
      same(cards.length, 1, 'One compact card, no duplicate window');
      same(cards[0].recipes.length, 1);
      same(
        cards[0].recipes[0].available,
        targets.length > 0,
        'Opposite-side empty target is unavailable',
      );
      same(cards[0].recipes[0].targets, targets);
      same(
        stageStructures(scope, profile, 'free', study.id),
        members,
        'Exact scoped membership',
      );
      for (const selected of members) {
        const related = relatedStudyViews(scope, profile, selected.id).find(
          (r) => r.focusId === study.id,
        );
        const href = makeStudyLink(
          catalog,
          region,
          selected.id,
          side,
          study.id,
        );
        if (!targets.length) {
          same(
            related,
            undefined,
            'Midline context cannot open a missing opposite kidney',
          );
          same(href, null);
          continue;
        }
        check(related, 'Reachable from each target/context member');
        same(related.targets, targets);
        const params = Object.fromEntries(
          new URL(href, 'https://atlas.test').searchParams,
        );
        const resolved = resolveStudyLink(
          catalog,
          region,
          parseStudyLink(params),
        );
        same(resolved.status, 'ready');
        same(resolved.selected.id, selected.id);
        same(
          resolved.visibleIds,
          members.map((s) => s.id),
        );
        const focused = dissectionReducer(initialDissection, {
          type: 'focus',
          id: study.id,
        });
        const removed = dissectionReducer(focused, {
          type: 'remove',
          id: selected.id,
        });
        check(
          !resolveDissection(scope, profile, removed).visible.some(
            (s) => s.id === selected.id,
          ),
        );
        const restored = dissectionReducer(removed, { type: 'undo' });
        same({ ...restored, future: [] }, focused);
        same(restored.future.length, 1);
        same(resolveDissection(scope, profile, restored).visible, members);
        same(dissectionReducer(restored, { type: 'redo' }), removed);
      }
      for (const selected of scope.filter((s) => !fmas.includes(s.fmaId)))
        check(
          !relatedStudyViews(scope, profile, selected.id).some(
            (r) => r.focusId === study.id,
          ),
          'No unrelated membership',
        );
    }
  }
}
for (const mutate of [
  (p) => p.abdomen.focuses.at(-1).rule.fmaIds.pop(),
  (p) => p['whole-body'].focuses.at(-1).context[0].fmaIds.push('FMA7203'),
  (p) => p.abdomen.references.pop(),
  (p) => {
    p.thorax.stages[0].description = 'changed';
  },
]) {
  const changed = structuredClone(dissectionProfiles);
  mutate(changed);
  assert.throws(() => preRenalRecipeProfiles(changed));
  checks++;
}
same(
  JSON.stringify(dissectionProfiles),
  original,
  'Runtime profiles are never mutated by testing',
);
const report = {
  checks,
  studySets: 4,
  focuses: 8,
  newStages: 0,
  sourceRepresentations: audited,
  sourceEvidence: evidence,
  profilesSha256: jsonHash(dissectionProfiles),
  previousProfilesSha256: orbitalMotorProfilesHash,
  missingInternalSourceLabelMatches: internalLabels,
  limitations: {
    clinicalApproval: false,
    browserAcceptance: false,
    newGeometry: false,
    internalRenalDissection: false,
    renalVeinsIncluded: false,
    scanCorrespondence: false,
  },
};
await writeFile(
  'docs/renal-studies-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    checks,
    studySets: 4,
    focuses: 8,
    sourceRepresentations: audited.length,
    clinicalApproval: false,
  }),
);
