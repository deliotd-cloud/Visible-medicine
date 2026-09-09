import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = await build({
  stdin: {
    contents:
      "export * from 'three'; export * from './lib/study-views'; export * from './lib/study-camera'; export * from './lib/anatomy-load-retry'; export * from './lib/explode-layout.mjs'; export * from './app/dissection-data';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const a = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const catalog = JSON.parse(
  await readFile(
    new URL(
      '../public/models/bodyparts3d/full-body/catalog.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const shoulder = JSON.parse(
  await readFile(
    new URL('../public/models/bodyparts3d/manifest.json', import.meta.url),
    'utf8',
  ),
);
let checks = 0;
const check = (condition, message) => {
  checks++;
  assert.ok(condition, message);
};
const same = (left, right, message) => {
  checks++;
  assert.deepEqual(left, right, message);
};
const fails = (fn, message) => {
  checks++;
  assert.throws(fn, undefined, message);
};
const close = (left, right, message) =>
  check(Math.abs(left - right) < 1e-7, `${message}: ${left} / ${right}`);
const allSystems = {
  skeleton: true,
  muscles: true,
  organs: true,
  nerves: true,
  vessels: true,
  connective: true,
};
const inspection = {
  plane: 'coronal',
  position: 63,
  flipped: true,
  keepSelectedSolid: true,
  opacity: { muscles: 35 },
};
const camera = {
  direction: [0, 0, 1],
  up: [0, 1, 0],
  pan: [0.2, -0.4, 0.1],
  scale: 0.9,
};
const bodyRevision = `${catalog.sourceVersion}/${catalog.bundles
  .map((b) => `${b.id}:${b.sha256}`)
  .sort()
  .join('|')}`;
const base = {
  kind: 'body',
  region: 'whole-body',
  revision: bodyRevision,
  selectedId: catalog.structures[0].id,
  view: 'anterior',
  side: 'both',
  layer: 'cuff',
  systems: allSystems,
  hiddenIds: [],
  explode: 43,
  zoom: 0.85,
  isolated: false,
  focus: false,
  labels: true,
  ghostRemoved: true,
  illustrated: true,
  anchorSkeleton: true,
  showOrigins: true,
  plate: false,
  inspection,
  camera,
};
const bookmark = (id = 'study-1', state = base) => ({
  id,
  name: 'Posterior cuff — 深部',
  savedAt: '2026-09-06T12:00:00.000Z',
  state,
});
for (const keepSelectedUncut of [true, false]) {
  const state = { ...base, inspection: { ...inspection, keepSelectedUncut } };
  same(
    a.parseStudyView(state),
    state,
    'Selected-only cutaway exemption round-trips',
  );
}
for (const keepSelectedUncut of ['yes', 1, null, {}, []])
  same(
    a.parseStudyView({
      ...base,
      inspection: { ...inspection, keepSelectedUncut },
    }),
    null,
    'Malformed cutaway exemption rejected',
  );
same(a.decodeStudyBookmarks(null), [], 'Empty device store');
same(
  a.decodeStudyBookmarks(a.encodeStudyBookmarks([bookmark()])),
  [bookmark()],
  'Complete display round trip',
);
check(a.parseStudyView(base) !== base, 'Input cloned');
const unsafe = {
  ...base,
  patientName: 'do not store',
  url: 'https://example.invalid',
  systems: { ...allSystems, __proto__: { polluted: true } },
  inspection: { ...inspection, opacity: { muscles: 35, unknown: 90 } },
};
const cleaned = a.parseStudyView(unsafe);
check(
  !Object.hasOwn(cleaned, 'patientName') && !Object.hasOwn(cleaned, 'url'),
  'Unrecognised data excluded',
);
check(
  !Object.hasOwn(cleaned.inspection.opacity, 'unknown'),
  'Unknown system opacity excluded',
);
check(
  !Object.hasOwn(cleaned.systems, 'polluted'),
  'Inherited properties not copied',
);
for (const change of [
  { kind: 'patient' },
  { kind: ['body'] },
  { kind: ['shoulder'] },
  { view: ['anterior'] },
  { side: ['both'] },
  { layer: ['cuff'] },
  { inspection: { ...inspection, plane: ['coronal'] } },
  { region: '../thorax' },
  { revision: '' },
  { view: 'oblique' },
  { side: 'front' },
  { layer: 'skin' },
  { selectedId: 'https://example.invalid' },
  { selectedId: 'vm:anatomy:<script>' },
  { hiddenIds: ['made-up'] },
  { hiddenIds: [base.selectedId, base.selectedId] },
  { hiddenIds: Array.from({ length: 2049 }, () => base.selectedId) },
  { systems: { skeleton: true } },
  { explode: 101 },
  { explode: NaN },
  { zoom: Infinity },
  { zoom: 0 },
  { labels: 'yes' },
  { inspection: { ...inspection, plane: 'ct' } },
  { inspection: { ...inspection, position: -1 } },
  { inspection: { ...inspection, opacity: { muscles: NaN } } },
  { camera: { ...camera, scale: 0 } },
  { camera: { ...camera, direction: [0, 0, 0] } },
  { camera: { ...camera, up: [0, 0, 1] } },
  { camera: { ...camera, pan: [Infinity, 0, 0] } },
])
  check(
    a.parseStudyView({ ...base, ...change }) === null,
    `Reject malformed display state ${JSON.stringify(change)}`,
  );
for (const raw of [
  '{broken',
  'null',
  '{}',
  JSON.stringify({ version: 2, views: [] }),
  JSON.stringify({ version: 1, views: [bookmark(), bookmark()] }),
  JSON.stringify({ version: 1, views: [{ ...bookmark(), name: 'bad\nname' }] }),
  ' '.repeat(2_000_001),
])
  fails(
    () => a.decodeStudyBookmarks(raw),
    'Corrupt/unsupported data does not silently become an empty store',
  );
let raw = null;
const storage = {
  getItem: () => raw,
  setItem: (key, value) => {
    same(key, a.STUDY_STORAGE_KEY, 'Scoped storage key');
    raw = value;
  },
};
a.persistStudyBookmarks(storage, { type: 'save', bookmark: bookmark('first') });
a.persistStudyBookmarks(storage, {
  type: 'save',
  bookmark: bookmark('other-tab'),
});
a.persistStudyBookmarks(storage, { type: 'save', bookmark: bookmark('third') });
same(
  a.decodeStudyBookmarks(raw).map((b) => b.id),
  ['third', 'other-tab', 'first'],
  'Fresh read preserves another tab save',
);
const beforeQuota = raw;
fails(
  () =>
    a.persistStudyBookmarks(
      {
        ...storage,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      },
      { type: 'save', bookmark: bookmark('quota') },
    ),
  'Storage failure reaches UI before success',
);
same(raw, beforeQuota, 'Storage failure preserved all previous views');
a.persistStudyBookmarks(storage, { type: 'remove', id: 'other-tab' });
same(
  a.decodeStudyBookmarks(raw).map((b) => b.id),
  ['third', 'first'],
  'Remove one exact view only',
);
let full = [];
for (let n = 0; n < a.MAX_STUDY_VIEWS; n++)
  full = a.editStudyBookmarks(full, {
    type: 'save',
    bookmark: bookmark(`view-${n}`),
  });
fails(
  () =>
    a.editStudyBookmarks(full, {
      type: 'save',
      bookmark: bookmark('over-limit'),
    }),
  'No automatic eviction at capacity',
);
fails(
  () =>
    a.editStudyBookmarks([bookmark()], { type: 'save', bookmark: bookmark() }),
  'No duplicate overwrite',
);

for (const [region, profile] of Object.entries(a.dissectionProfiles)) {
  for (const side of ['both', 'left', 'right']) {
    const scopeItems = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    const scope = {
      kind: 'body',
      region,
      revision: bodyRevision,
      structureIds: scopeItems.map((s) => s.id),
    };
    for (const stage of profile.stages) {
      const dissection = { ...a.initialDissection, stageId: stage.id };
      const resolved = a.resolveDissection(scopeItems, profile, dissection);
      const state = {
        ...base,
        region,
        side,
        selectedId: resolved.visible[0]?.id ?? null,
        hiddenIds: resolved.removed.map((s) => s.id),
        view: stage.view,
      };
      const parsed = a.parseStudyView(JSON.parse(JSON.stringify(state)));
      check(
        !!parsed && a.compatibleStudyView(parsed, scope),
        `Valid source view ${region}/${side}/${stage.id}`,
      );
      const restored = a.dissectionReducer(a.initialDissection, {
        type: 'load-view',
        hiddenIds: parsed.hiddenIds,
      });
      same(
        a
          .resolveDissection(scopeItems, profile, restored)
          .visible.map((s) => s.id),
        resolved.visible.map((s) => s.id),
        'Explicit visibility survives stage recipe round trip',
      );
      const undone = a.dissectionReducer(restored, { type: 'undo' });
      const {
        history: _history,
        future: _future,
        ...loadedVisibility
      } = restored;
      same(
        undone,
        { ...a.initialDissection, future: [loadedVisibility] },
        'Undo restores the original visibility and keeps the loaded view available for Redo',
      );
      same(
        a.dissectionReducer(undone, { type: 'redo' }),
        restored,
        'Redo reapplies the exact loaded visibility and history',
      );
      check(
        !Object.hasOwn(parsed, 'history') && !Object.hasOwn(parsed, 'future'),
        'Bookmarks contain current visibility, never session history',
      );
      check(
        !a.compatibleStudyView(parsed, { ...scope, revision: 'changed' }),
        'Changed geometry blocks restore',
      );
      check(
        !a.compatibleStudyView(parsed, { ...scope, region: 'different' }),
        'Different region blocks restore',
      );
    }
  }
  const bounds = new a.Box3();
  for (const s of catalog.structures.filter(
    (s) => region === 'whole-body' || s.regions.includes(region),
  ))
    bounds.union(a.translatedBox(s.bounds));
  for (const direction of [
    [0, 0, 1],
    [0, 0, -1],
    [1, 0.2, 0.3],
    [-1, 0.1, 0],
    [0, 1, 0],
    [0, -1, 0],
  ]) {
    const up = Math.abs(direction[1]) === 1 ? [0, 0, 1] : [0, 1, 0];
    for (const aspect of [0.55, 1, 1.8])
      for (const scale of [0.3, 1, 1.6])
        for (const orthographic of [false, true]) {
          const cam = orthographic
            ? new a.OrthographicCamera()
            : new a.PerspectiveCamera(38, aspect, 0.01, 150);
          const pose = {
            direction: new a.Vector3(...direction).normalize().toArray(),
            up,
            pan: [0.5, -0.2, 0.1],
            scale,
          };
          const restored = a.restoreStudyCamera(cam, bounds, aspect, pose);
          const captured = a.captureStudyCamera(
            cam,
            restored.target,
            bounds,
            aspect,
          );
          check(!!captured, 'Camera can be captured after restore');
          for (const field of ['direction', 'up', 'pan'])
            for (let i = 0; i < 3; i++)
              close(captured[field][i], pose[field][i], `${region} ${field}`);
          close(captured.scale, scale, 'Framing scale retained');
          check(cam.near > 0 && cam.far > cam.near, 'Finite depth range');
        }
  }
}
for (const layer of ['cuff', 'surface', 'bones'])
  for (const view of ['anterior', 'posterior', 'lateral']) {
    const state = {
      ...base,
      kind: 'shoulder',
      region: 'shoulder-pilot',
      revision: shoulder.sha256,
      side: 'right',
      view,
      layer,
      selectedId: shoulder.parts[0].structureId,
      systems: { skeleton: true, muscles: true, 'soft-tissue': true },
    };
    check(!!a.parseStudyView(state), 'Shoulder state accepted');
    for (const keepSelectedUncut of [true, false]) {
      const next = {
        ...state,
        inspection: { ...state.inspection, keepSelectedUncut },
      };
      same(
        a.parseStudyView(next),
        next,
        'Shoulder preserves selected-only cutaway exemption',
      );
    }
    check(
      a.compatibleStudyView(state, {
        kind: 'shoulder',
        region: 'shoulder-pilot',
        revision: shoulder.sha256,
        structureIds: shoulder.parts.map((p) => p.structureId),
      }),
      'Shoulder source compatibility',
    );
  }
const failed = catalog.bundles.slice(0, 5).map((b) => b.id),
  required = catalog.bundles.slice(2, 8).map((b) => b.id);
same(
  a.anatomyRetryPlan(catalog.bundles, failed, required).map((b) => b.id),
  failed.slice(2),
  'Retry only failed bundles still requested',
);
same(
  a.anatomyRetryPlan(catalog.bundles, [], required),
  [],
  'Healthy assets never reloaded by retry',
);
same(
  a.anatomyRetryPlan(catalog.bundles, ['untrusted-id'], required),
  [],
  'Unknown retry target rejected',
);
console.log(
  JSON.stringify(
    {
      passed: true,
      checks,
      regions: Object.keys(a.dissectionProfiles).length,
      maximumLocalViews: a.MAX_STUDY_VIEWS,
      sourceGeometryChanged: false,
      clinicalValidation: false,
      browserInteractionTesting: false,
    },
    null,
    2,
  ),
);
