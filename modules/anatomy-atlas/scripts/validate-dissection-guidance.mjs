import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import ts from 'typescript';
import { runInNewContext } from 'node:vm';
import { build, transformSync } from 'esbuild';
import {
  dissectionGuidance,
  dissectionLandmarks,
  guidanceRecipeAction,
  dissectionOrientation,
} from '../lib/dissection-guidance.ts';
import {
  dissectionProfiles,
  initialDissection,
  stageStructures,
  matchesRule,
  dissectionReducer,
  resolveDissection,
} from '../app/dissection-data.ts';
import { dissectionSections } from '../lib/dissection-workbench.ts';
let assertions = 0;
const same = (a, b, m) => {
  assertions++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  assertions++;
  assert(v, m);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const ids = (items) => items.map((s) => s.id);
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  catalog = JSON.parse(raw);
const original = JSON.stringify({ catalog, profiles: dissectionProfiles });
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(
  hash(JSON.stringify(dissectionProfiles)),
  'd127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c',
);
same(Object.keys(dissectionOrientation), [
  'anterior',
  'posterior',
  'right',
  'left',
  'superior',
  'inferior',
]);
const allLoaded = catalog.bundles.map((b) => b.id),
  rows = [];
let recipeScopes = 0,
  variants = 0,
  actions = 0;
for (const [region, profile] of Object.entries(dissectionProfiles))
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['unpaired', 'midline', 'unspecified'].includes(s.laterality)),
    );
    const recipes = [
      ...profile.stages.map((s) => ({ ...initialDissection, stageId: s.id })),
      ...profile.focuses.map((f) => ({
        ...initialDissection,
        stageId: 'free',
        focusId: f.id,
      })),
    ];
    const { layers } = dissectionSections(profile);
    for (const state of recipes) {
      recipeScopes++;
      const expected = stageStructures(
        scope,
        profile,
        state.stageId,
        state.focusId,
      );
      const focus = profile.focuses.find((f) => f.id === state.focusId);
      const recipe =
        focus ?? profile.stages.find((s) => s.id === state.stageId);
      const removed = scope.filter((s) => !expected.includes(s));
      const cases = [
        { visible: expected, removed },
        {
          visible: expected.slice(1),
          removed: [...removed, ...expected.slice(0, 1)],
        },
        { visible: expected.filter((s) => s.system !== 'skeleton'), removed },
        { visible: scope, removed: [] },
        { visible: [], removed: scope },
      ];
      for (const c of cases)
        for (const loadMode of ['ready', 'pending', 'failed', 'mixed']) {
          variants++;
          const loaded = loadMode === 'pending' ? [] : allLoaded;
          const failed =
            loadMode === 'failed'
              ? allLoaded
              : loadMode === 'mixed'
                ? allLoaded.filter((_, i) => i % 2 === 0)
                : [];
          const snapshot = JSON.stringify({ scope, state, c, loaded, failed });
          const guide = dissectionGuidance(
            scope,
            profile,
            state,
            [...ids(c.visible), 'foreign'],
            [...ids(c.removed), 'foreign'],
            loaded,
            failed,
          );
          same(guide.expected, expected);
          same(guide.visible, c.visible);
          same(
            guide.members.map((m) => m.structure),
            expected,
          );
          same(
            guide.missing,
            expected.filter((s) => !c.visible.includes(s)),
          );
          same(
            guide.added,
            c.visible.filter((s) => !expected.includes(s)),
          );
          same(guide.recipe, {
            id: recipe.id,
            title: recipe.title,
            kind: focus ? 'focus' : 'stage',
            view: recipe.view,
          });
          same(
            guide.counts.ready + guide.counts.pending + guide.counts.failed,
            c.visible.length,
          );
          same(guide.counts.removed, c.removed.length);
          same(
            guide.counts.ready +
              guide.counts.pending +
              guide.counts.failed +
              guide.counts.removed +
              guide.counts.systemOff,
            scope.length,
          );
          for (const { structure: s, status, role } of guide.members) {
            const expectedStatus = c.removed.includes(s)
              ? 'removed'
              : !c.visible.includes(s)
                ? 'system-off'
                : failed.includes(s.bundle)
                  ? 'failed'
                  : loaded.includes(s.bundle)
                    ? 'ready'
                    : 'pending';
            same(status, expectedStatus);
            same(
              role,
              focus
                ? matchesRule(s, focus.rule)
                  ? 'target'
                  : 'context'
                : 'member',
            );
          }
          if (focus) {
            same(
              guide.targets,
              scope.filter((s) => matchesRule(s, focus.rule)),
            );
            same(
              guide.context,
              expected.filter((s) => !matchesRule(s, focus.rule)),
            );
            same(
              new Set([...ids(guide.targets), ...ids(guide.context)]),
              new Set(ids(expected)),
            );
          } else {
            same(guide.targets, null);
            same(guide.context, null);
          }
          const oldLandmarks = [
            ...new Map(
              (recipe.landmarks ?? [])
                .flatMap((p) =>
                  scope
                    .filter((s) => new RegExp(p, 'i').test(s.sourceName))
                    .slice(0, 2),
                )
                .map((s) => [s.id, s]),
            ).values(),
          ].slice(0, 8);
          same(
            guide.landmarks.map((m) => m.structure),
            oldLandmarks,
          );
          same(
            dissectionLandmarks(c.visible, recipe.landmarks ?? []),
            [
              ...new Map(
                (recipe.landmarks ?? [])
                  .flatMap((p) =>
                    c.visible
                      .filter((s) => new RegExp(p, 'i').test(s.sourceName))
                      .slice(0, 2),
                  )
                  .map((s) => [s.id, s]),
              ).values(),
            ].slice(0, 8),
            'Scene label selection preserves the exact old visible-only policy',
          );
          const index = focus
            ? -1
            : layers.findIndex((s) => s.id === state.stageId);
          const next = index >= 0 ? layers[index + 1] : null;
          same(guide.next?.stage.id ?? null, next?.id ?? null);
          same(guide.finalLayer, index >= 0 && index === layers.length - 1);
          for (const kind of ['recipe', 'next']) {
            same(guidanceRecipeAction(guide, kind, true), null);
            const action = guidanceRecipeAction(guide, kind, false);
            if (action) {
              actions++;
              const restored = dissectionReducer(state, {
                type: action.kind === 'focus' ? 'focus' : 'stage',
                id: action.id,
              });
              const after = resolveDissection(scope, profile, restored);
              same(
                after.visible,
                kind === 'recipe' ? expected : guide.next.visible,
              );
              same(restored.removed, []);
              same(restored.restored, []);
              check(after.visible.every((s) => scope.includes(s)));
            }
          }
          same(guidanceRecipeAction(guide, 'invalid', false), null);
          same(JSON.stringify({ scope, state, c, loaded, failed }), snapshot);
        }
    }
    const free = dissectionGuidance(
      scope,
      profile,
      { ...initialDissection, stageId: 'free' },
      ids(scope),
      [],
      allLoaded,
      [],
    );
    same(free.recipe, null);
    same(free.members, []);
    same(free.next, null);
    same(guidanceRecipeAction(free, 'recipe', false), null);
    const invalid = dissectionGuidance(
      scope,
      profile,
      { ...initialDissection, focusId: 'missing' },
      ids(scope),
      [],
      allLoaded,
      [],
    );
    same(invalid.recipe, null);
    same(invalid.expected, []);
    same(invalid.next, null);
    const empty = dissectionGuidance(
      [],
      profile,
      initialDissection,
      [],
      [],
      [],
      [],
    );
    same(guidanceRecipeAction(empty, 'recipe', false), null);
    same(guidanceRecipeAction(empty, 'next', false), null);
    rows.push({
      region,
      side,
      structures: scope.length,
      recipes: recipes.length,
    });
  }
// Execute the actual camera handler with spies, not a reimplementation.
const explorer = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile(
  'explorer.tsx',
  explorer,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
function handler(name) {
  let found;
  function walk(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name)
      found = node.getText(ast);
    ts.forEachChild(node, walk);
  }
  walk(ast);
  check(found);
  return transformSync(found, { loader: 'ts', format: 'esm' }).code;
}
const orient = handler('reorientDissection');
for (const view of Object.keys(dissectionOrientation))
  for (const exam of [false, true])
    for (const hasRecipe of [false, true]) {
      const calls = [],
        cameraRestore = { current: { saved: true } };
      const spy = (name) => (arg) =>
        calls.push([name, typeof arg === 'function' ? arg(12) : arg]);
      runInNewContext(orient + '; reorientDissection();', {
        exam,
        cameraRestore,
        setFocus: spy('focus'),
        setZoom: spy('zoom'),
        setView: spy('view'),
        guidance: { recipe: hasRecipe ? { view } : null },
        view: 'posterior',
        setReset: spy('reset'),
      });
      same(
        calls,
        exam
          ? []
          : [
              ['focus', false],
              ['zoom', 1],
              ['view', hasRecipe ? view : 'posterior'],
              ['reset', 13],
            ],
      );
      same(cameraRestore.current, exam ? { saved: true } : null);
    }
const open = handler('openGuidanceRecipe');
for (const exam of [false, true])
  for (const kind of ['recipe', 'next']) {
    const profile = dissectionProfiles.hand,
      scope = catalog.structures.filter((s) => s.regions.includes('hand'));
    const guide = dissectionGuidance(
        scope,
        profile,
        initialDissection,
        ids(scope),
        [],
        allLoaded,
        [],
      ),
      calls = [];
    runInNewContext(open + '; openGuidanceRecipe(kind);', {
      guidanceRecipeAction,
      guidance: guide,
      exam,
      kind,
      changeFocus: (id) => calls.push(['focus', id]),
      changeStage: (id) => calls.push(['stage', id]),
    });
    const action = guidanceRecipeAction(guide, kind, exam);
    same(calls, action ? [[action.kind, action.id]] : []);
  }
// Render the real presentation with installed primitives. No browser/DOM QA.
const scratch = await mkdtemp(
    fileURLToPath(
      new URL('../node_modules/vm-guidance-check-', import.meta.url),
    ),
  ),
  file = join(scratch, 'render.cjs');
let render;
try {
  await build({
    stdin: {
      contents:
        "import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {DissectionOrientation} from './app/dissection-orientation'; export const render=(props)=>renderToStaticMarkup(createElement(DissectionOrientation,props));",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: file,
    external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
  });
  render = createRequire(import.meta.url)(file).render;
} finally {
  await unlink(file).catch((e) => {
    if (e.code !== 'ENOENT') throw e;
  });
  await rmdir(scratch);
}
let markupCases = 0;
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  const scope = catalog.structures.filter(
    (s) => region === 'whole-body' || s.regions.includes(region),
  );
  for (const state of [
    initialDissection,
    { ...initialDissection, stageId: 'free', focusId: profile.focuses[0].id },
    { ...initialDissection, stageId: 'free' },
  ]) {
    const shown = stageStructures(scope, profile, state.stageId, state.focusId);
    const visible = shown.slice(1),
      removed = scope.filter((s) => !visible.includes(s));
    const guide = dissectionGuidance(
      scope,
      profile,
      state,
      ids(visible),
      ids(removed),
      [],
      [],
    );
    const noAction = () => {
      throw Error('Rendering must not act on the model');
    };
    const props = {
      guide,
      side: 'both',
      view: 'posterior',
      onOrient: noAction,
      onRecipe: noAction,
      onSelect: noAction,
    };
    const html = render(props);
    markupCases++;
    check(html.includes('Orient this dissection'));
    check(html.includes('Camera preset'));
    check(html.includes('from behind'));
    check(html.includes('not visible pixels'));
    check(html.includes('selected-only framing'));
    same(
      (html.match(/class="dissection-member-list"/g) ?? []).length,
      guide.recipe ? 1 : 0,
    );
    if (guide.recipe) {
      check(html.includes('Find a recipe member'));
      check(html.includes('aria-live="polite"'));
    }
    if (guide.targets) check(html.includes('recipe targets'));
    if (guide.next) check(html.includes('Open next layer'));
    same(render({ ...props, disabled: true }), '');
    markupCases++;
  }
}
check(explorer.includes('onOrient={reorientDissection}'));
check(explorer.includes('onRecipe={openGuidanceRecipe}'));
check(explorer.includes('onSelect={select}'));
same(JSON.stringify({ catalog, profiles: dissectionProfiles }), original);
const result = {
  passed: true,
  assertions,
  scopes: rows.length,
  recipeScopes,
  variants,
  actions,
  markupCases,
  rows,
  catalogSha256: hash(raw),
  profilesSha256: hash(JSON.stringify(dissectionProfiles)),
  geometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
  limitations:
    'Pure guidance/state tests, actual extracted handler execution with spies, and server-rendered markup. No browser interaction, camera-pixel, label occlusion, touch or assistive-technology acceptance is claimed.',
};
await writeFile(
  'docs/dissection-guidance-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log({ ...result, rows: rows.length });
