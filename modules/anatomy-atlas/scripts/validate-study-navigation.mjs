import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  relatedStudyViews,
  structureNavigationIndex,
  filterStudyStructures,
} from '../lib/study-navigation.ts';
import {
  dissectionProfiles,
  matchesRule,
  stageStructures,
  initialDissection,
  dissectionReducer,
  resolveDissection,
} from '../app/dissection-data.ts';

const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = JSON.parse(raw);
const before = JSON.stringify(catalog);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
let assertions = 0;
const same = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions++;
};
const check = (value, message) => {
  assert.ok(value, message);
  assertions++;
};
const ids = (items) => items.map((item) => item.id);
same(
  hash(raw),
  '8868c391ee285c13cfe54ffd3a5e4051d4a2e41d956a22acbaeb94bc8e4920a7',
);
const rows = [];
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  for (const side of ['both', 'right', 'left']) {
    const scope = catalog.structures.filter(
      (item) =>
        (region === 'whole-body' || item.regions.includes(region)) &&
        (side === 'both' ||
          item.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(item.laterality)),
    );
    let selectionsWithGroups = 0;
    let memberships = 0;
    same(relatedStudyViews(scope, profile, null), []);
    same(relatedStudyViews(scope, profile, 'nonexistent'), []);
    same(relatedStudyViews([], profile, scope[0]?.id), []);
    for (const item of scope) {
      const views = relatedStudyViews(scope, profile, item.id);
      if (views.length) selectionsWithGroups++;
      memberships += views.length;
      const expected = profile.focuses.filter(
        (focus) =>
          (matchesRule(item, focus.rule) ||
            focus.context?.some((rule) => matchesRule(item, rule))) &&
          scope.some((s) => matchesRule(s, focus.rule)),
      );
      same(
        new Set(views.map((view) => view.focusId)),
        new Set(expected.map((focus) => focus.id)),
      );
      same(new Set(views.map((view) => view.focusId)).size, views.length);
      for (const view of views) {
        const focus = profile.focuses.find(
          (focus) => focus.id === view.focusId,
        );
        same(view.role, matchesRule(item, focus.rule) ? 'target' : 'context');
        same(
          view.targets,
          scope.filter((s) => matchesRule(s, focus.rule)),
        );
        same(
          view.context,
          scope.filter(
            (s) =>
              !matchesRule(s, focus.rule) &&
              focus.context?.some((rule) => matchesRule(s, rule)),
          ),
        );
        same(
          view.visibleIds,
          ids(stageStructures(scope, profile, 'free', focus.id)),
        );
        check(
          view.visibleIds.includes(item.id),
          'Retained selection must be included by the opened recipe',
        );
        check(
          [...view.targets, ...view.context].every((s) => scope.includes(s)),
          'Scope/side/source identity leak',
        );
        same(
          new Set(ids([...view.targets, ...view.context])).size,
          view.targets.length + view.context.length,
        );
        check(
          view.context.every((s) => !view.targets.includes(s)),
          'Targets and context must be disjoint',
        );
        const removedState = dissectionReducer(initialDissection, {
          type: 'remove',
          id: item.id,
        });
        const focusedState = dissectionReducer(removedState, {
          type: 'focus',
          id: focus.id,
        });
        same(
          ids(resolveDissection(scope, profile, focusedState).visible),
          view.visibleIds,
        );
        same(dissectionReducer(focusedState, { type: 'undo' }), removedState);
      }
      // Search must find stable public IDs as well as FMA labels and source names.
      check(filterStudyStructures(scope, item.id).includes(item));
      check(
        filterStudyStructures(
          scope,
          `  ${item.fmaId.toLowerCase()}  `,
        ).includes(item),
      );
      check(filterStudyStructures(scope, item.sourceName).includes(item));
    }
    const enabled = new Set(ids(scope.filter((_, i) => i % 3 === 0)));
    same(
      filterStudyStructures(scope, '', 'all', enabled),
      scope.filter((item) => enabled.has(item.id)),
    );
    same(filterStudyStructures(scope, '', 'unknown'), []);
    same(filterStudyStructures(scope, 'not-an-anatomical-source-identity'), []);
    for (const system of [
      'skeleton',
      'muscles',
      'nerves',
      'vessels',
      'organs',
      'connective',
    ]) {
      same(
        filterStudyStructures(scope, '', system),
        scope.filter((item) => item.system === system),
      );
      same(
        filterStudyStructures(scope, '', system, enabled),
        scope.filter((item) => item.system === system && enabled.has(item.id)),
      );
    }
    rows.push({
      region,
      side,
      structures: scope.length,
      selectionsWithGroups,
      memberships,
    });
  }
}
for (let count = 0; count <= catalog.structures.length; count++) {
  for (const index of [-1, 0, Math.floor(count / 2), count - 1, count + 2]) {
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
      const result = structureNavigationIndex(key, index, count);
      if (!count) same(result, null);
      else check(Number.isInteger(result) && result >= 0 && result < count);
    }
    same(structureNavigationIndex('Enter', index, count), null);
    same(structureNavigationIndex(' ', index, count), null);
    same(structureNavigationIndex('ArrowLeft', index, count), null);
    same(structureNavigationIndex('Tab', index, count), null);
  }
  if (count) {
    same(structureNavigationIndex('End', 0, count), count - 1);
    same(structureNavigationIndex('Home', count - 1, count), 0);
    same(structureNavigationIndex('ArrowDown', count - 1, count), count - 1);
    same(structureNavigationIndex('ArrowUp', 0, count), 0);
  }
}
for (const invalid of [-1, NaN, Infinity, 1.5])
  same(structureNavigationIndex('Home', 0, invalid), null);
same(
  JSON.stringify(catalog),
  before,
  'Navigation cannot mutate source anatomy',
);

// Offline component wiring guards; these are not browser/assistive-device tests.
const component = await readFile('app/structure-navigator.tsx', 'utf8');
for (const text of [
  '<ul',
  '<button',
  'aria-current',
  'tabIndex={active?.id === item.id ? 0 : -1}',
  'event.nativeEvent.isComposing',
  'event.metaKey',
  'event.repeat',
  "event.key === 'Enter'",
  'setActiveId(item.id)',
])
  check(component.includes(text), text);
const explorer = await readFile('app/body-explorer.tsx', 'utf8');
check(
  explorer.includes(
    'if (exam || !regionStructures.some((item) => item.id === id)) return;',
  ),
);
check(
  explorer.includes(
    'exam ? [] : relatedStudyViews(regionStructures, profile, selectedId)',
  ),
);
check(!explorer.includes('<aside className="body-info" aria-live="polite">'));
const inventory = JSON.parse(
  await readFile('content/source-inventory.json', 'utf8'),
);
const smallConnectiveNameMatches = inventory.records.filter(
  (record) =>
    record.tree === 'isa' &&
    record.status === 'unused-available' &&
    record.files.length <= 2 &&
    /ligament|capsule|retinaculum|aponeurosis|fascia|menisc|bursa|omentum/i.test(
      record.name,
    ),
);
same(smallConnectiveNameMatches.length, 3);
check(
  smallConnectiveNameMatches.every((record) =>
    record.name.includes('artery to posterior limb'),
  ),
);
const report = {
  passed: true,
  assertions,
  catalogSha256: hash(raw),
  rows,
  sourceIndexCheck: {
    query:
      'Unused available ISA definitions with at most two components and connective-tissue name terms',
    matches: smallConnectiveNameMatches.map(({ id, name, files }) => ({
      id,
      name,
      files,
    })),
    conclusion:
      'All three are arterial branches named for the internal capsule, not missing connective surfaces. No admission or existing hold changed.',
    exhaustiveAnatomicalAdjudication: false,
  },
  sourceGeometryChanged: false,
  newDependencies: false,
  browserInteractionTesting: false,
  assistiveTechnologyTesting: false,
  clinicalValidation: false,
};
await writeFile(
  'docs/study-navigation-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      ...report,
      rows: rows.length,
      sourceIndexCheck: report.sourceIndexCheck.conclusion,
    },
    null,
    2,
  ),
);
