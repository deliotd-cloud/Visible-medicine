import assert from 'node:assert/strict';
import { historicalRecipeProfiles } from './recipe-history.mjs';
import { readFile, writeFile, mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {
  dissectionProfiles,
  initialDissection,
  dissectionReducer,
  resolveDissection,
  stageStructures,
  matchesRule,
} from '../app/dissection-data.ts';
import { dissectionSections } from '../lib/dissection-workbench.ts';
import {
  studyLibrary,
  filterStudyLibrary,
  studyRecipePreview,
  studyLibraryAction,
  studyRecipeActive,
} from '../lib/study-library.ts';
import { thoraxRespiratoryBindings, thoraxRespiratoryStudies } from '../content/thorax-respiratory-study.ts';

const hash = (text) => createHash('sha256').update(text).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = JSON.parse(raw);
const original = JSON.stringify(catalog),
  originalProfiles = JSON.stringify(dissectionProfiles);
let assertions = 0;
const same = (a, b, message) => {
  assert.deepEqual(a, b, message);
  assertions++;
};
const check = (ok, message) => {
  assert(ok, message);
  assertions++;
};
const ids = (entries) => entries.map((entry) => entry.id);
const keys = (cards) =>
  cards.flatMap((card) => card.recipes.map((recipe) => recipe.key));
const thoraxBundle = catalog.bundles.filter((bundle) => bundle.id === 'thorax-muscles');
same(thoraxBundle.length, 1, 'One pinned thorax muscle bundle');
same(thoraxBundle[0].sha256, '3bbf7759e54e34272175de042ef4e26c24412b9f073a2f8eea3ce4fe79ebb682');
same(thoraxBundle[0].structures, 8);
const thoraxScope = catalog.structures.filter((s) => s.regions.includes('thorax'));
const sourceBinding = (s) => ({
  id: s.id, fmaId: s.fmaId, bundle: s.bundle,
  nodeName: s.nodeName, sources: s.sources,
});
for (const expected of thoraxRespiratoryBindings) {
  const found = thoraxScope.filter((s) => s.id === expected.id || s.fmaId === expected.fmaId);
  same(found.length, 1, `Unique ${expected.fmaId}`);
  same(sourceBinding(found[0]), expected, `Pinned identity, bundle and source files: ${expected.fmaId}`);
}
const thoraxProfile = dissectionProfiles.thorax;
let guided = initialDissection;
for (const study of thoraxRespiratoryStudies) {
  const focus = thoraxProfile.focuses.filter((entry) => entry.id === study.id);
  same(focus.length, 1);
  const expected = thoraxScope.filter((s) => study.fmaIds.includes(s.fmaId));
  same(ids(stageStructures(thoraxScope, thoraxProfile, 'free', study.id)), ids(expected));
  for (const side of ['left', 'right']) {
    const sideScope = thoraxScope.filter((s) =>
      s.laterality === side || ['midline', 'unpaired', 'unspecified'].includes(s.laterality));
    same(ids(stageStructures(sideScope, thoraxProfile, 'free', study.id)), ids(expected),
      'Midline compound source remains available under either side filter');
  }
  same(studyLibraryAction(thoraxScope, thoraxProfile, `focus:${study.id}`, false), { kind: 'focus', id: study.id });
  const mutated = thoraxScope.map((s) => s.fmaId === study.fmaIds[0]
    ? { ...s, bundle: 'wrong-bundle' } : s);
  same(stageStructures(mutated, thoraxProfile, 'free', study.id), [], 'Changed source binding fails closed');
  same(studyLibraryAction(mutated, thoraxProfile, `focus:${study.id}`, false), null);
  const required = thoraxScope.find((s) => s.fmaId === study.fmaIds[0]);
  same(stageStructures(thoraxScope.filter((s) => s !== required), thoraxProfile, 'free', study.id), [],
    'Missing required source fails closed');
  same(stageStructures([...thoraxScope, required], thoraxProfile, 'free', study.id), [],
    'Duplicate required source fails closed');
  const previous = guided;
  guided = dissectionReducer(guided, { type: 'focus', id: study.id });
  same(ids(resolveDissection(thoraxScope, thoraxProfile, guided).visible), ids(expected));
  same(dissectionReducer(guided, { type: 'undo' }).focusId, previous.focusId);
  same(dissectionReducer(dissectionReducer(guided, { type: 'undo' }), { type: 'redo' }).focusId, study.id);
}
same(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(
  hash(JSON.stringify(historicalRecipeProfiles(dissectionProfiles))),
  'd127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c',
);
const systems = [
  'skeleton',
  'muscles',
  'nerves',
  'organs',
  'vessels',
  'connective',
];
const rows = [];
let totalCards = 0,
  totalRecipes = 0;
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  const { windows } = dissectionSections(profile);
  const expectedKeys = [
    ...windows.map((s) => `window:${s.id}`),
    ...profile.focuses.map((f) => `focus:${f.id}`),
  ];
  const empty = studyLibrary([], profile);
  same(new Set(keys(empty)), new Set(expectedKeys));
  for (const recipe of empty.flatMap((card) => card.recipes)) {
    same(recipe.visible, []);
    same(recipe.available, false);
    same(studyLibraryAction([], profile, recipe.key, false), null);
  }
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    const cards = studyLibrary(scope, profile),
      beforeCards = JSON.stringify(cards);
    same(
      cards.map((card) => card.key),
      empty.map((card) => card.key),
      'Grouping independent of side and accidental empty-set equivalence',
    );
    same(new Set(keys(cards)), new Set(expectedKeys));
    same(keys(cards).length, expectedKeys.length);
    same(new Set(cards.map((card) => card.key)).size, cards.length);
    for (const card of cards) {
      check(card.recipes.length >= 1 && card.recipes.length <= 2);
      for (const recipe of card.recipes) {
        const focus =
          recipe.kind === 'focus'
            ? profile.focuses.find((f) => f.id === recipe.id)
            : null;
        const wanted = stageStructures(
          scope,
          profile,
          focus ? 'free' : recipe.id,
          focus?.id,
        );
        same(recipe.visible, wanted);
        same(
          recipe.targets,
          focus ? wanted.filter((s) => matchesRule(s, focus.rule)) : null,
        );
        same(
          recipe.available,
          wanted.length > 0 && (!focus || recipe.targets.length > 0),
        );
        if (card.recipes.length === 2)
          same(
            ids(recipe.visible),
            ids(card.recipes[0].visible),
            'Combined buttons retain exactly the same source entries',
          );
        const action = studyLibraryAction(scope, profile, recipe.key, false);
        same(
          action,
          recipe.available ? { kind: recipe.kind, id: recipe.id } : null,
        );
        same(
          studyLibraryAction(scope, profile, recipe.key, true),
          null,
          'Exam gate',
        );
        let state = dissectionReducer(initialDissection, {
          type: 'stage',
          id: 'assembled',
        });
        for (const s of scope.slice(0, 2))
          state = dissectionReducer(state, { type: 'remove', id: s.id });
        const before = resolveDissection(scope, profile, state).visible.filter(
          (s) => s.system !== 'skeleton',
        );
        const after = dissectionReducer(state, {
          type: recipe.kind === 'focus' ? 'focus' : 'stage',
          id: recipe.id,
        });
        same(resolveDissection(scope, profile, after).visible, recipe.visible);
        check(studyRecipeActive(recipe, after));
        same(
          studyRecipeActive(recipe, {
            ...after,
            focusId: 'missing',
            stageId: 'missing',
          }),
          false,
        );
        for (const [loaded, failed] of [
          [[], []],
          [catalog.bundles.map((b) => b.id), []],
          [
            catalog.bundles.filter((_, i) => i % 2 === 0).map((b) => b.id),
            catalog.bundles.slice(0, 5).map((b) => b.id),
          ],
        ]) {
          const snapshot = JSON.stringify(state);
          const p = studyRecipePreview(
            recipe,
            scope,
            [...ids(before), 'not-in-this-scope'],
            loaded,
            failed,
          );
          same(
            p.hide,
            before.filter((s) => !recipe.visible.includes(s)),
          );
          same(
            p.restore,
            recipe.visible.filter((s) => !before.includes(s)),
          );
          same(
            p.keep,
            recipe.visible.filter((s) => before.includes(s)),
          );
          same(
            new Set([...ids(p.keep), ...ids(p.restore)]),
            new Set(ids(recipe.visible)),
          );
          same(new Set([...ids(p.hide), ...ids(p.keep)]), new Set(ids(before)));
          same(
            p.loaded,
            recipe.visible.filter(
              (s) => loaded.includes(s.bundle) && !failed.includes(s.bundle),
            ),
          );
          same(
            p.failed,
            recipe.visible.filter((s) => failed.includes(s.bundle)),
          );
          same(
            p.waiting,
            recipe.visible.filter(
              (s) => !loaded.includes(s.bundle) && !failed.includes(s.bundle),
            ),
          );
          same(
            p.loaded.length + p.failed.length + p.waiting.length,
            recipe.visible.length,
          );
          same(
            JSON.stringify(state),
            snapshot,
            'Preview never mutates current dissection',
          );
        }
        for (const s of [recipe.visible[0], recipe.visible.at(-1)].filter(
          Boolean,
        ))
          check(
            keys(filterStudyLibrary(cards, s.fmaId)).includes(recipe.key),
            'Search includes exact retained source IDs',
          );
        check(
          keys(filterStudyLibrary(cards, recipe.id)).includes(recipe.key),
          'Recipe identity search',
        );
      }
    }
    for (const system of ['all', ...systems])
      for (const kind of ['all', 'window', 'focus']) {
        const result = filterStudyLibrary(cards, '', system, kind);
        const expected = cards.flatMap((card) =>
          card.recipes
            .filter(
              (recipe) =>
                (system === 'all' ||
                  recipe.visible.some((s) => s.system === system)) &&
                (kind === 'all' || recipe.kind === kind),
            )
            .map((recipe) => recipe.key),
        );
        same(keys(result), expected);
        for (const sort of ['authored', 'small-first', 'large-first', 'name']) {
          const sorted = filterStudyLibrary(cards, '', system, kind, sort);
          same(new Set(keys(sorted)), new Set(expected));
          for (let i = 1; i < sorted.length; i++) {
            const a = sorted[i - 1],
              b = sorted[i];
            if (sort === 'small-first')
              check(a.recipes[0].visible.length <= b.recipes[0].visible.length);
            if (sort === 'large-first')
              check(a.recipes[0].visible.length >= b.recipes[0].visible.length);
            if (sort === 'name')
              check(a.title.localeCompare(b.title, 'en') <= 0);
            if (sort === 'authored') check(a.order < b.order);
          }
        }
      }
    same(filterStudyLibrary(cards, 'no-such-anatomy-xyz'), []);
    same(
      filterStudyLibrary(cards, '[.*'),
      [],
      'Search input is literal, not regex',
    );
    same(filterStudyLibrary(cards, '', 'invalid-system'), []);
    same(filterStudyLibrary(cards, '', 'all', 'invalid-kind'), []);
    same(keys(filterStudyLibrary(cards, '  ')), keys(cards));
    for (const key of [
      '',
      '__proto__',
      'focus:missing',
      'window:../../outside',
      'assembled',
    ])
      same(studyLibraryAction(scope, profile, key, false), null);
    same(
      JSON.stringify(cards),
      beforeCards,
      'Search/sort/action planning preserves its source cards',
    );
    rows.push({
      region,
      side,
      groups: cards.length,
      recipes: expectedKeys.length,
      combinedGroups: cards.filter((card) => card.recipes.length === 2).length,
    });
    if (side === 'both') {
      totalCards += cards.length;
      totalRecipes += expectedKeys.length;
    }
  }
}
// Equal rendered membership alone is never enough to merge distinct recipes.
const originalProfile = dissectionProfiles.abdomen;
const pair = originalProfile.stages.find(
  (s) => s.id === 'pancreatic-source-window',
);
const focus = originalProfile.focuses.find((f) => f.id === pair.id);
const synthetic = { ...originalProfile, stages: [pair], focuses: [focus] };
same(studyLibrary([], synthetic).length, 1);
for (const change of [
  { title: 'Another lesson' },
  { view: 'posterior' },
  { id: 'different-id' },
  { includeSkeleton: true },
  { context: [] },
])
  same(
    studyLibrary([], { ...synthetic, focuses: [{ ...focus, ...change }] })
      .length,
    2,
  );
same(JSON.stringify(catalog), original);
same(JSON.stringify(dissectionProfiles), originalProfiles);

// Server-render the real component with the installed primitives; no browser/DOM QA.
const renderScratch = await mkdtemp(
  fileURLToPath(
    new URL('../node_modules/vm-study-library-check-', import.meta.url),
  ),
);
const renderFile = join(renderScratch, 'render.cjs');
let renderLibrary;
try {
  await build({
    stdin: {
      contents:
        "import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {StudyLibrary} from './app/study-library'; export const renderLibrary = (props) => renderToStaticMarkup(createElement(StudyLibrary, props));",
      resolveDir: fileURLToPath(new URL('../', import.meta.url)),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: renderFile,
    external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
  });
  renderLibrary = createRequire(import.meta.url)(renderFile).renderLibrary;
} finally {
  // Remove only this newly created test bundle and then its empty directory.
  await unlink(renderFile).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  await rmdir(renderScratch);
}
let markupCases = 0;
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  const scope = catalog.structures.filter(
    (s) => region === 'whole-body' || s.regions.includes(region),
  );
  const props = {
    profile,
    state: initialDissection,
    structures: scope,
    visibleIds: ids(scope),
    loaded: [],
    failed: [],
    onStage: () => {
      throw Error('Rendering applied a stage');
    },
    onFocus: () => {
      throw Error('Rendering applied a focus');
    },
  };
  const html = renderLibrary({ ...props, disabled: false });
  check(html.includes('aria-label="Study view library"'));
  check(html.includes('type="search"'));
  check(html.includes('maxLength="256"'));
  check(html.includes('aria-live="polite"'));
  check(html.includes('Fewest structures first'));
  same(
    (html.match(/aria-expanded="false"/g) ?? []).length,
    studyLibrary(scope, profile).length,
  );
  const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(
    (m) => m[1],
  );
  for (const id of controls) check(html.includes(`id="${id}"`));
  const hidden = renderLibrary({ ...props, disabled: true });
  check(hidden.includes('End practice'));
  check(!hidden.includes('<button'));
  check(!hidden.includes('FMA'));
  check(!hidden.includes('<select'));
  markupCases += 2;
}
const controlsSource = await readFile('app/dissection-controls.tsx', 'utf8');
check(controlsSource.includes('setLibraryOpen((value) => !value)'));
check(!controlsSource.includes('onStage(windows[0].id)'));
check(!controlsSource.includes('aria-label="Focused compartment view"'));
check(controlsSource.includes('libraryTrigger.current?.focus()'));
check(controlsSource.includes('hidden={!libraryOpen}'));
check(
  controlsSource.includes('libraryOpened &&'),
  'Keep filter state mounted after first opening',
);
const result = {
  passed: true,
  assertions,
  scopes: rows.length,
  groups: totalCards,
  sourceRecipes: totalRecipes,
  combinedGroups: totalRecipes - totalCards,
  markupCases,
  rows,
  sourceGeometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
  sourceCatalogSha256: hash(raw),
  dissectionProfilesSha256: hash(originalProfiles),
};
await writeFile(
  'docs/study-library-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log({ ...result, rows: rows.length });
