import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';
const compiled = await build({
  stdin: {
    contents: `export * from 'three'; export * from './lib/body-arrangement';
    export * from './lib/body-system-presets'; export * from './lib/explode-layout.mjs';
    export * from './lib/study-views'; export * from './lib/study-camera';
    export * from './lib/inspection-geometry'; export * from './lib/scene-labels';
    export * from './app/dissection-data'; export * from './lib/body-display-catalog';`,
    resolveDir: process.cwd(),
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
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = a.bodyDisplayCatalog(JSON.parse(raw)),
  original = JSON.stringify(catalog);
const views = [
  'anterior',
  'posterior',
  'left',
  'right',
  'superior',
  'inferior',
];
let checks = 0,
  pairs = 0,
  fits = 0,
  layouts = 0;
const check = (v, msg) => {
  assert(v, msg);
  checks++;
};
const equal = (x, y, msg) => {
  assert.deepEqual(x, y, msg);
  checks++;
};
const close = (x, y, msg) => check(Math.abs(x - y) < 1e-7, msg);
const vectorClose = (x, y) =>
  x.forEach((value, index) => close(value, y[index], 'Vector mismatch'));
const serialized = (map) =>
  [...map].map(([id, offset]) => [id, offset.toArray()]);
const all = a.bodyPresetSystems('all');
const base = {
  kind: 'body',
  region: 'whole-body',
  revision: 'test-geometry-revision',
  selectedId: null,
  view: 'anterior',
  side: 'both',
  layer: 'cuff',
  systems: all,
  hiddenIds: [],
  explode: 100,
  layout: 'tray',
  zoom: 1,
  isolated: false,
  focus: false,
  labels: true,
  ghostRemoved: false,
  illustrated: true,
  anchorSkeleton: false,
  showOrigins: false,
  plate: true,
  inspection: {
    plane: 'off',
    position: 50,
    flipped: false,
    keepSelectedSolid: true,
    opacity: {},
  },
  camera: null,
};
function projected(box, axes) {
  const points = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z])
        points.push(new a.Vector3(x, y, z));
  return {
    xmin: Math.min(...points.map((p) => p.dot(axes.right))),
    xmax: Math.max(...points.map((p) => p.dot(axes.right))),
    ymin: Math.min(...points.map((p) => p.dot(axes.up))),
    ymax: Math.max(...points.map((p) => p.dot(axes.up))),
    points,
  };
}
function verifyTray(items, origin, view, frame, exhaustive = false) {
  const axes = a.arrangementAxes(view),
    tray = a.arrangeBodyStructures(items, origin, view);
  equal(tray.offsets.size, items.length, 'One translation per catalogue entry');
  equal(
    serialized(
      a.arrangeBodyStructures([...items].reverse(), origin, view).offsets,
    ),
    serialized(tray.offsets),
    'Input order must not affect slots',
  );
  const boxes = items.map((item) => {
    const offset = a.bodyPresentationOffset(
      item,
      origin,
      100,
      'tray',
      false,
      tray.offsets,
    );
    vectorClose(offset.toArray(), tray.offsets.get(item.id).toArray());
    const box = a.translatedBox(item.bounds, offset),
      originalBox = a.translatedBox(item.bounds);
    vectorClose(
      box.getSize(new a.Vector3()).toArray(),
      originalBox.getSize(new a.Vector3()).toArray(),
    );
    close(
      box.getCenter(new a.Vector3()).sub(origin).dot(axes.direction),
      0,
      'Same projection plane',
    );
    check(offset.toArray().every(Number.isFinite), 'Finite display offset');
    return projected(box, axes);
  });
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const x = boxes[i],
        y = boxes[j];
      check(
        Math.max(x.xmin - y.xmax, y.xmin - x.xmax) >= tray.gap - 1e-7 ||
          Math.max(x.ymin - y.ymax, y.ymin - x.ymax) >= tray.gap - 1e-7,
        `Projected entries overlap at full arrangement: ${view}/${items[i].id}/${items[j].id}`,
      );
      pairs++;
    }
  const bounds = a.arrangementBounds(items, tray.offsets);
  if (bounds.isEmpty()) return;
  for (const aspect of [0.55, 1, 1.8]) {
    const cam = new a.OrthographicCamera();
    const pose = {
      direction: axes.direction.toArray(),
      up: axes.up.toArray(),
      pan: [0, 0, 0],
      scale: 1,
    };
    const restored = a.restoreStudyCamera(cam, bounds, aspect, pose);
    cam.updateMatrixWorld();
    for (const point of projected(bounds, axes).points) {
      const p = point.project(cam);
      check(
        Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95 && p.z < 1 && p.z > -1,
        'Tray geometry outside initial projection/depth range',
      );
    }
    const captured = a.captureStudyCamera(cam, restored.target, bounds, aspect);
    vectorClose(captured.direction, pose.direction);
    close(captured.scale, 1, 'Fit scale');
    cam.zoom = 2;
    close(
      a.relativeStudyScale(
        cam,
        restored.target,
        restored.fitDistance,
        restored.fitHalfHeight,
      ),
      0.5,
      'Wheel/pinch scale survives a layout/size update',
    );
    fits++;
    if (exhaustive)
      for (const scale of [0.1, 0.25, 1, 2, 10]) {
        const panned = { ...pose, pan: [0.25, -0.2, 0], scale };
        const result = a.restoreStudyCamera(cam, bounds, aspect, panned);
        cam.updateMatrixWorld();
        vectorClose(
          a.captureStudyCamera(cam, result.target, bounds, aspect).pan,
          panned.pan,
        );
        close(
          a.captureStudyCamera(cam, result.target, bounds, aspect).scale,
          scale,
          'Saved tray zoom',
        );
        for (const point of projected(bounds, axes).points) {
          const p = point.project(cam);
          check(
            p.z > -1 && p.z < 1,
            'Orthographic zoom must not move camera into surfaces',
          );
        }
        const saved = a.parseStudyView({
          ...base,
          view,
          camera: panned,
          zoom: scale,
        });
        check(saved && saved.layout === 'tray', 'Tray bookmark accepted');
        const aligned = a.planarStudyCamera(
          { ...panned, direction: [0.6, 0, 0.8] },
          pose.direction,
          pose.up,
        );
        vectorClose(aligned.direction, pose.direction);
        vectorClose(aligned.up, pose.up);
        equal(aligned.pan, panned.pan);
        equal(aligned.scale, panned.scale);
      }
  }
  if (exhaustive)
    for (const item of items) {
      for (const amount of [0, 1, 25, 40, 41, 70, 99, 100]) {
        for (const anchor of [false, true])
          vectorClose(
            a
              .bodyPresentationOffset(item, origin, amount, 'spatial', anchor)
              .toArray(),
            a
              .bodyOffset(
                item.center,
                origin,
                amount,
                anchor && item.system === 'skeleton',
              )
              .toArray(),
          );
        const offset = a.bodyPresentationOffset(
          item,
          origin,
          amount,
          'tray',
          true,
          tray.offsets,
        );
        check(offset.toArray().every(Number.isFinite), 'Transition finite');
        if (amount === 0)
          close(offset.length(), 0, 'Zero preserves assembled coordinates');
        if (amount === 40)
          vectorClose(
            offset.toArray(),
            a.bodyOffset(item.center, origin, 100).toArray(),
          );
        for (const plane of ['axial', 'coronal', 'sagittal']) {
          const inspection = { ...base.inspection, plane, position: 50 };
          const anchorPoint = new a.Vector3(...item.anchor);
          equal(
            a.pointRetained(anchorPoint, a.sectionPlanes(frame, inspection)),
            a.pointRetained(
              anchorPoint.clone().add(offset),
              a.sectionPlanes(frame, inspection, offset),
            ),
            'Section follows the source-local surface',
          );
        }
        // Labels now inherit the displaced parent instead of subtracting an
        // offset from a fixed column. Projection/column tests live in labels:test.
        const parent = new a.Group(),
          anchor = new a.Group();
        parent.position.copy(offset);
        anchor.position.fromArray(item.anchor);
        parent.add(anchor);
        vectorClose(
          anchor.getWorldPosition(new a.Vector3()).toArray(),
          new a.Vector3(...item.anchor).add(offset).toArray(),
        );
      }
    }
  layouts++;
}
for (const [region, profile] of Object.entries(a.dissectionProfiles))
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter(
      (item) =>
        (region === 'whole-body' || item.regions.includes(region)) &&
        (side === 'both' ||
          item.laterality === side ||
          ['unpaired', 'unspecified', 'midline'].includes(item.laterality)),
    );
    const frame = a.arrangementBounds(scope, new Map()),
      origin = frame.getCenter(new a.Vector3());
    for (const preset of a.bodySystemPresets) {
      const systems = a.bodyPresetSystems(preset.id);
      check(a.bodyPresetMatches(preset.id, systems), 'Preset matches itself');
      check(Object.values(systems).some(Boolean), 'Preset not empty');
      equal(
        Object.keys(systems).sort(),
        Object.keys(all).sort(),
        'All system switches declared',
      );
      const items = scope.filter((item) => systems[item.system]);
      for (const view of views)
        verifyTray(
          items,
          origin,
          view,
          frame,
          preset.id === 'all' && side === 'both',
        );
    }
    for (const stage of profile.stages) {
      const items = a.stageStructures(scope, profile, stage.id);
      verifyTray(items, origin, stage.view, frame);
    }
  }
equal(a.bodyPresetSystems('nonexistent'), null);
check(!a.bodyPresetMatches('nonexistent', all));
equal(a.arrangeBodyStructures([], new a.Vector3(), 'anterior').offsets.size, 0);
equal(a.parseStudyView(base), base, 'New tray bookmark round trip');
const legacy = { ...base, plate: false };
delete legacy.layout;
equal(
  a.parseStudyView(legacy),
  legacy,
  'Old bookmark preserves exact shape and spatial semantics',
);
for (const layout of [null, [], ['tray'], 'grid', 1, {}, 'spatial<script>'])
  equal(a.parseStudyView({ ...base, layout }), null, 'Invalid layout rejected');
equal(
  a.parseStudyView({ ...base, plate: false }),
  null,
  'Tray requires orthographic mode',
);
const shoulderTray = {
  ...base,
  kind: 'shoulder',
  region: 'shoulder-pilot',
  side: 'right',
  systems: { skeleton: true, muscles: true, 'soft-tissue': true },
};
equal(
  a.parseStudyView(shoulderTray),
  shoulderTray,
  'Dedicated shoulder tray bookmark',
);
equal(JSON.stringify(catalog), original, 'Catalogue untouched');
const result = {
  passed: true,
  checks,
  pairClearanceChecks: pairs,
  layouts,
  cameraFits: fits,
  structures: catalog.structures.length,
  catalogSha256: createHash('sha256').update(raw).digest('hex'),
  sourceGeometryChanged: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
  limitations:
    'Clearance is guaranteed for catalogue-entry bounding rectangles only at 100% in the aligned orthographic tray, not at intermediate amounts or within compound source groups.',
};
await writeFile(
  'docs/body-arrangement-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
