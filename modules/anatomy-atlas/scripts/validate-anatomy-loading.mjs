import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
let assertions = 0;
const same = (a, b, message) => {
  assertions++;
  assert.deepEqual(a, b, message);
};
const check = (value, message) => {
  assertions++;
  assert(value, message);
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const built = await build({
  stdin: {
    contents:
      "export * from './lib/anatomy-load-state'; export * from './lib/anatomy-practice'; export * from './app/dissection-data';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(built.outputFiles[0].text).toString('base64')
);
const raw = await fs.readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  ),
  catalog = JSON.parse(raw);
same(
  hash(raw),
  'b9888bf57e7eee61638c2c6920677fe3e6b6bd55ad97df3d19f45829865c13d5',
);
const initialSnapshot = JSON.stringify({
  catalog,
  initial: api.initialAnatomyLoads,
  practice: api.initialPractice,
  profiles: api.dissectionProfiles,
});
const summary = api.anatomyLoadSummary;
same(
  summary(['a', 'b', 'c', 'a', ''], ['a', 'b', 'foreign'], ['b', 'outside']),
  { required: ['a', 'b', 'c'], loaded: ['a'], failed: ['b'], pending: ['c'] },
);
let state = api.initialAnatomyLoads;
same(api.anatomyLoadReducer(state, { type: 'loaded', id: '' }), state);
same(api.anatomyLoadReducer(state, { type: 'retry', ids: ['unused'] }), state);
for (const id of ['a', 'b', 'c'])
  state = api.anatomyLoadReducer(state, { type: 'loaded', id });
const healthy = state;
same(api.anatomyLoadReducer(state, { type: 'loaded', id: 'a' }), state);
state = api.anatomyLoadReducer(state, { type: 'failed', id: 'b' });
same(state, { loaded: ['a', 'c'], failed: ['b'] });
same(api.anatomyLoadReducer(state, { type: 'failed', id: 'b' }), state);
state = api.anatomyLoadReducer(state, { type: 'retry', ids: ['b', 'b'] });
same(state, { loaded: ['a', 'c'], failed: [] });
same(summary(['a', 'b', 'c'], state.loaded, state.failed).pending, ['b']);
state = api.anatomyLoadReducer(state, { type: 'loaded', id: 'b' });
same(state, { loaded: ['a', 'c', 'b'], failed: [] });
same(
  healthy,
  { loaded: ['a', 'b', 'c'], failed: [] },
  'Reducer does not mutate earlier state',
);
same(
  api.anatomyLoadReducer(
    { loaded: ['a'], failed: ['a'] },
    { type: 'loaded', id: 'a' },
  ),
  { loaded: ['a'], failed: [] },
);
same(
  api.anatomyLoadReducer(
    { loaded: ['a'], failed: ['a'] },
    { type: 'failed', id: 'a' },
  ),
  { loaded: [], failed: ['a'] },
);
const allSystems = Object.fromEntries(
  ['skeleton', 'muscles', 'nerves', 'organs', 'vessels', 'connective'].map(
    (s) => [s, true],
  ),
);
const variants = [
  allSystems,
  ...Object.keys(allSystems).map((system) =>
    Object.fromEntries(Object.keys(allSystems).map((s) => [s, s === system])),
  ),
  Object.fromEntries(Object.keys(allSystems).map((s) => [s, false])),
];
const loaded = catalog.bundles.map((b) => b.id),
  rows = [];
let recipeScopes = 0,
  renderScopes = 0,
  sessions = 0,
  serial = 0;
for (const [region, profile] of Object.entries(api.dissectionProfiles))
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['unpaired', 'midline', 'unspecified'].includes(s.laterality)),
    );
    const recipes = [
      ...profile.stages.map((s) => ({ stageId: s.id, focusId: null })),
      ...profile.focuses.map((f) => ({ stageId: 'free', focusId: f.id })),
    ];
    for (const recipe of recipes) {
      recipeScopes++;
      const shown = api.stageStructures(
        scope,
        profile,
        recipe.stageId,
        recipe.focusId,
      );
      const hidden = scope
        .filter((s) => !shown.some((v) => v.id === s.id))
        .map((s) => s.id);
      for (const systems of variants)
        for (const ghost of [false, true]) {
          renderScopes++;
          const expected = scope.filter(
            (s) => systems[s.system] && (!hidden.includes(s.id) || ghost),
          );
          same(
            api.renderedAnatomyStructures(scope, systems, hidden, ghost),
            expected,
          );
          const required = api.requestedAnatomyBundles(
            scope,
            systems,
            hidden,
            ghost,
          );
          same(required, [...new Set(expected.map((s) => s.bundle))]);
          const current = summary(
            required,
            required.filter((_, i) => i % 3 === 0),
            required.filter((_, i) => i % 3 === 1),
          );
          same(
            [...current.loaded, ...current.failed, ...current.pending].sort(
              (a, b) => a.localeCompare(b),
            ),
            [...required].sort((a, b) => a.localeCompare(b)),
          );
          same(
            new Set([...current.loaded, ...current.failed, ...current.pending])
              .size,
            required.length,
          );
          same(
            current.loaded.length +
              current.failed.length +
              current.pending.length,
            required.length,
          );
          check(current.loaded.every((id) => !current.failed.includes(id)));
        }
      for (const mode of ['find', 'name']) {
        const pool = api.practicePool(shown, loaded);
        const session = api.createPracticeSession(
          shown,
          loaded,
          { id: ++serial, mode, count: 5, sampling: 'all' },
          () => 0.314159,
        );
        same(
          Boolean(session),
          api.practiceCanStart(pool, mode),
          'Start affordance matches the session factory',
        );
        if (!session) continue;
        sessions++;
        const before = JSON.stringify(session);
        const rendered = scope.filter((s) =>
          api.practiceRenderIds(session).includes(s.id),
        );
        const required = api.requestedAnatomyBundles(
          rendered,
          allSystems,
          hidden,
          false,
        );
        check(required.length > 0);
        if (mode === 'name')
          same(required, [
            scope.find((s) => s.id === session.questions[0].target).bundle,
          ]);
        const targetBundle = required[0];
        let loads = { loaded: [...loaded], failed: [] };
        loads = api.anatomyLoadReducer(loads, {
          type: 'failed',
          id: targetBundle,
        });
        const broken = summary(required, loads.loaded, loads.failed);
        same(broken.failed, [targetBundle]);
        check(
          !api
            .practicePool(
              shown,
              summary(loaded, loads.loaded, loads.failed).loaded,
            )
            .some((s) => s.bundle === targetBundle),
          'Failed group cannot supply questions',
        );
        const ignored = summary(required, loads.loaded, [
          ...loads.failed,
          'out-of-scene',
        ]);
        same(ignored, broken, 'Unrelated failures do not pause this scene');
        loads = api.anatomyLoadReducer(loads, {
          type: 'retry',
          ids: [targetBundle],
        });
        same(summary(required, loads.loaded, loads.failed).pending, [
          targetBundle,
        ]);
        loads = api.anatomyLoadReducer(loads, {
          type: 'loaded',
          id: targetBundle,
        });
        same(summary(required, loads.loaded, loads.failed).loaded, required);
        same(
          JSON.stringify(session),
          before,
          'Load transitions retain the exact active question and answers',
        );
        let answered = api.practiceReducer(session, {
          type: 'answer',
          sessionId: session.id,
          index: 0,
          chosen: session.questions[0].target,
        });
        same(api.practiceScore(answered), 1);
        const answerSnapshot = JSON.stringify(answered);
        api.anatomyLoadReducer(loads, { type: 'failed', id: targetBundle });
        same(
          JSON.stringify(answered),
          answerSnapshot,
          'Load state is independent of saved answers',
        );
        answered = api.practiceReducer(answered, {
          type: 'next',
          sessionId: session.id,
          index: 0,
        });
        same(answered.responses.length, 1);
      }
    }
    rows.push({
      region,
      side,
      structures: scope.length,
      recipes: recipes.length,
    });
  }
const first = catalog.structures[0];
const duplicateNames = [
  first,
  { ...first, id: 'test:duplicate', name: first.name.toUpperCase() },
];
check(!api.practiceCanStart(duplicateNames, 'name'));
check(api.practiceCanStart(duplicateNames, 'find'));
check(!api.practiceCanStart([], 'find'));
check(!api.practiceCanStart([first], 'name'));
check(!api.practiceCanStart([first], 'invalid'));
same(
  api.createPracticeSession(duplicateNames, [first.bundle], {
    id: ++serial,
    mode: 'name',
    count: 5,
    sampling: 'all',
  }),
  null,
);
// Runtime wiring assertions, not browser simulations: handlers independently gate
// model picks, answer/skip and advancement, while exit remains available.
const explorer = (await fs.readFile('app/body-explorer.tsx', 'utf8')).replace(
  /\s+/g,
  ' ',
);
const scene = (await fs.readFile('app/body-scene.tsx', 'utf8')).replace(
  /\s+/g,
  ' ',
);
check(
  explorer.includes(
    'function submitPractice(chosen: string | null) { if (practicePaused) return;',
  ),
);
check(
  explorer.includes('function nextQuestion() { if (practicePaused) return;'),
);
check(
  explorer.includes(
    'if (exam || practiceBlocked || (retry && !retryIds.length)) return;',
  ),
);
check(explorer.includes('loadStatus.loaded.length'));
check(!explorer.includes('required.length - pending.length'));
check(explorer.includes('structures={sceneStructures}'));
check(explorer.includes('pending.length > 0 || loadStatus.failed.length > 0'));
check(explorer.includes('disabled={!exam && practiceBlocked}'));
check(explorer.includes('Practice paused: required anatomy is unavailable.'));
check(explorer.includes('Your answers are retained.'));
check(
  explorer.includes(
    'disabled={practicePaused} onClick={() => submitPractice(null)}',
  ),
);
check(explorer.includes('onClick={nextQuestion} disabled={practicePaused}'));
check(
  scene.includes(
    'renderedAnatomyStructures( props.structures, props.systems, props.hiddenIds, props.ghostRemoved && !props.exam, )',
  ),
);
same(
  JSON.stringify({
    catalog,
    initial: api.initialAnatomyLoads,
    practice: api.initialPractice,
    profiles: api.dissectionProfiles,
  }),
  initialSnapshot,
);
const result = {
  passed: true,
  assertions,
  scopes: rows.length,
  recipeScopes,
  renderScopes,
  sessions,
  rows,
  catalogSha256: hash(raw),
  sourceGeometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
  limitations:
    'Pure runtime-helper tests plus static handler/markup wiring checks. No browser fetch failure injection, WebGL/context-loss, touch or assistive-technology acceptance is claimed.',
};
await fs.writeFile(
  'docs/anatomy-loading-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log({ ...result, rows: rows.length });
