import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  dissectionProfiles,
  initialDissection,
  dissectionReducer,
  resolveDissection,
  stageStructures,
} from '../app/dissection-data.ts';
import {
  dissectionSections,
  dissectionTransition,
  filterRemovedStructures,
} from '../lib/dissection-workbench.ts';

const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = JSON.parse(raw);
const original = JSON.stringify(catalog);
const ids = (items) => items.map((item) => item.id);
let checks = 0;
const rows = [];
function check(condition, message) {
  assert(condition, message);
  checks++;
}
function equal(a, b) {
  assert.deepEqual(a, b);
  checks++;
}
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  const { layers, windows } = dissectionSections(profile);
  equal(new Set([...layers, ...windows]), new Set(profile.stages));
  check(
    !layers.some((item) => item.kind === 'window'),
    'Window presented as a layer',
  );
  check(
    region === 'whole-body' ? layers.length === 0 : layers.length >= 3,
    region,
  );
  check(windows.length > 0, 'Missing windows');
  for (const side of ['both', 'right', 'left']) {
    const scope = catalog.structures.filter(
      (item) =>
        (region === 'whole-body' || item.regions.includes(region)) &&
        (side === 'both' ||
          item.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(item.laterality)),
    );
    let before = scope;
    for (const stage of layers) {
      const result = dissectionTransition(
        scope,
        profile,
        ids(before),
        stage.id,
      );
      check(
        result && result.visible.length > 0,
        `${region}/${stage.id}/${side}`,
      );
      equal(result.restored, []);
      equal(new Set([...result.removed, ...result.retained]), new Set(before));
      before = result.visible;
    }
    for (const stage of profile.stages) {
      let state = dissectionReducer(initialDissection, {
        type: 'stage',
        id: stage.id,
      });
      const canonical = resolveDissection(scope, profile, state);
      const manuallyRemoved = canonical.visible.slice(0, 2);
      for (const item of manuallyRemoved)
        state = dissectionReducer(state, { type: 'remove', id: item.id });
      // Actual visibility also honours switches; preview must count their reset.
      const visible = resolveDissection(scope, profile, state).visible.filter(
        (item) => item.system !== 'skeleton',
      );
      for (const target of profile.stages) {
        const transition = dissectionTransition(
          scope,
          profile,
          ids(visible),
          target.id,
        );
        const applied = dissectionReducer(state, {
          type: 'stage',
          id: target.id,
        });
        equal(
          transition.visible,
          resolveDissection(scope, profile, applied).visible,
        );
        equal(
          new Set([...transition.removed, ...transition.retained]),
          new Set(visible),
        );
        equal(
          new Set([...transition.restored, ...transition.retained]),
          new Set(transition.visible),
        );
        check(
          transition.removed.every(
            (item) => !transition.visible.includes(item),
          ),
          'Removal overlap',
        );
      }
      const removed = resolveDissection(scope, profile, state).removed;
      for (const system of [
        'all',
        ...Object.keys(
          catalog.systems ?? {
            skeleton: 1,
            muscles: 1,
            nerves: 1,
            organs: 1,
            vessels: 1,
            connective: 1,
          },
        ),
      ]) {
        const group = filterRemovedStructures(removed, '', system);
        check(
          group.every((item) => system === 'all' || item.system === system),
          'Wrong system',
        );
        const restored = dissectionReducer(state, {
          type: 'restore-many',
          ids: [...ids(group), ...ids(group)],
        });
        const result = resolveDissection(scope, profile, restored);
        check(
          group.every((item) => result.visible.includes(item)),
          'Batch restoration incomplete',
        );
        check(
          result.visible.every((item) => scope.includes(item)),
          'Scope escaped',
        );
        equal(restored.restored.length, new Set(restored.restored).size);
        if (group.length) {
          equal(
            restored.history.length,
            Math.min(40, state.history.length + 1),
          );
          equal(
            resolveDissection(
              scope,
              profile,
              dissectionReducer(restored, { type: 'undo' }),
            ),
            resolveDissection(scope, profile, state),
          );
        } else equal(restored, state);
      }
      for (const item of removed) {
        check(
          filterRemovedStructures(removed, item.fmaId.toLowerCase()).includes(
            item,
          ),
          'FMA search',
        );
        check(
          filterRemovedStructures(
            removed,
            `  ${item.name.toUpperCase()}  `,
          ).includes(item),
          'Name search',
        );
      }
      equal(filterRemovedStructures(removed, 'no-such-structure-12345'), []);
    }
    equal(dissectionTransition(scope, profile, [], 'no-such-stage'), null);
    // A focused window/manual state remains valid when entering the layer sequence.
    for (const focus of profile.focuses) {
      const focusState = dissectionReducer(initialDissection, {
        type: 'focus',
        id: focus.id,
      });
      const visible = resolveDissection(scope, profile, focusState).visible;
      const first = (layers.length ? layers : windows)[0];
      equal(
        dissectionTransition(scope, profile, ids(visible), first.id).visible,
        stageStructures(scope, profile, first.id),
      );
    }
  }
  rows.push({
    region,
    layerSteps: layers.length,
    studyWindows: windows.length,
    focusedViews: profile.focuses.length,
  });
}
equal(JSON.stringify(catalog), original);
const result = {
  passed: true,
  checks,
  catalogueStructures: catalog.structures.length,
  catalogSha256: createHash('sha256').update(raw).digest('hex'),
  regions: rows,
  sourceGeometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await writeFile(
  'docs/dissection-workbench-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
