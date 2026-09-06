import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { applyJunctionTransition } from './junction-transition.mjs';
import { junctionId } from './junction-selection.mjs';
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(a, b);
};
const check = (v) => {
  checks++;
  assert(v);
};
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const catalog = await read('public/models/bodyparts3d/full-body/catalog.json');
const inventory = await read('content/source-inventory.json');
const baseline = await read('content/junction-baseline.json');
const before = JSON.stringify(catalog);
const compiled = await build({
  stdin: {
    contents:
      "export * from './app/dissection-data'; export * from './app/body-content'; export * from './lib/anatomy-practice'; export * from './lib/intestinal-junction';",
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const profile = api.dissectionProfiles.abdomen;
const expected = ['FMA7200', 'FMA7201', 'FMA11338'];
const junction = catalog.structures.find((s) => s.id === junctionId);
let serial = 0;
for (const side of ['both', 'right', 'left']) {
  const scope = catalog.structures.filter(
    (s) =>
      s.regions.includes('abdomen') &&
      (side === 'both' ||
        s.laterality === side ||
        ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
  );
  for (const path of ['stage', 'focus']) {
    const state = api.dissectionReducer(api.initialDissection, {
      type: path,
      id: 'ileocecal-junction',
    });
    const visible = api.resolveDissection(scope, profile, state).visible;
    same(visible.map((s) => s.fmaId).sort(), [...expected].sort());
    for (const fma of expected) {
      const id = visible.find((s) => s.fmaId === fma).id;
      const removed = api.dissectionReducer(state, { type: 'remove', id });
      same(
        api
          .resolveDissection(scope, profile, removed)
          .visible.map((s) => s.fmaId)
          .sort(),
        expected.filter((f) => f !== fma).sort(),
      );
      same(api.dissectionReducer(removed, { type: 'undo' }), state);
      const restored = api.dissectionReducer(removed, { type: 'restore', id });
      same(api.resolveDissection(scope, profile, restored).visible, visible);
    }
    const freePractice = api.createPracticeSession(
      visible,
      catalog.bundles.map((b) => b.id),
      { id: ++serial, mode: 'name', count: 20, sampling: 'all' },
      () => 0.37,
    );
    check(freePractice);
    same(
      new Set(freePractice.questions.map((q) => q.target)),
      new Set(visible.map((s) => s.id)),
    );
    for (const mode of ['find', 'name']) {
      const practice = api.createPracticeSession(
        visible,
        catalog.bundles.map((b) => b.id),
        {
          id: ++serial,
          mode,
          count: 20,
          sampling: 'focus',
          focusIds: [junctionId],
        },
        () => 0.37,
      );
      if (mode === 'name') same(practice, null);
      else {
        same(practice.questions.length, 1);
        same(practice.questions[0].target, junctionId);
      }
    }
    // Switching to the source's digestive context must not silently drop its
    // newly independent component simply because its name lacks "intestine".
    check(
      api
        .stageStructures(scope, profile, 'free', 'digestive')
        .some((s) => s.id === junctionId),
    );
    check(
      api
        .stageStructures(scope, profile, 'free', 'appendiceal-context')
        .some((s) => s.id === junctionId),
    );
  }
}
for (const tab of ['anatomy', 'function']) {
  const content = api.bodyContent(junction, tab);
  check(content.title.includes('draft'));
  same(content.body, api.intestinalJunction[tab]);
  same(content.citations, api.intestinalJunction.references);
  check(content.bullets.includes(api.intestinalJunction.caution));
}
for (const tab of ['ct', 'mri', 'ultrasound'])
  check(api.bodyContent(junction, tab).body.includes('No imaging study'));
for (const tree of ['isa', 'partof']) {
  const asset = inventory.assets.find(
    (a) => a.tree === tree && a.file === 'FJ2599',
  );
  same(asset.representedBy, [junctionId]);
  check(asset.geometrySha256);
}
const geometryOwners = new Map();
for (const asset of inventory.assets.filter((a) => a.representedBy.length)) {
  check(asset.geometrySha256);
  for (const id of asset.representedBy) {
    const owner = geometryOwners.get(asset.geometrySha256);
    check(!owner || owner === id);
    geometryOwners.set(asset.geometrySha256, id);
  }
}
// Negative migration tests: no arbitrary shape/identity changes, unpinned
// historical revisions or unrelated prior-record changes are allowed.
await applyJunctionTransition(structuredClone(baseline), catalog);
for (const mutate of [
  (c) => {
    c.structures.find((s) => s.fmaId === 'FMA7200').anchor[0] += 0.01;
  },
  (c) => {
    c.structures.find((s) => s.fmaId === 'FMA7201').sources.pop();
  },
  (c) => {
    c.bundles.find((b) => b.id === 'abdomen-organs').sha256 = '0'.repeat(64);
  },
]) {
  const bad = structuredClone(catalog);
  mutate(bad);
  await assert.rejects(() =>
    applyJunctionTransition(structuredClone(baseline), bad),
  );
  checks++;
}
const badBaseline = structuredClone(baseline);
badBaseline.structures.find((s) => s.id.endsWith(':small-intestine')).sha256 =
  '0'.repeat(64);
await assert.rejects(() => applyJunctionTransition(badBaseline, catalog));
checks++;
same(JSON.stringify(catalog), before);
const result = {
  passed: true,
  checks,
  exactGeometryOwners: geometryOwners.size,
  studyWindow: 'Bowel junction window',
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/junction-study-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
