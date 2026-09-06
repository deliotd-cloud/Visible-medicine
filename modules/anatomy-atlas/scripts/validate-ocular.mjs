import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Box3, Vector3, Matrix4 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  ocularDefinitions,
  ocularAdmissions,
  ocularSelections,
} from './ocular-selections.mjs';
import { inventoryHolds, geometryFingerprint } from './anatomy-inventory.mjs';
import { cache } from './bodyparts-archive.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceTriangleSet,
  sourceBoundsNear,
  compareSourceSurfaces,
} from './source-surface-audit.mjs';
import { prepareShape, meshSourceShape } from './vessel-shape-math.mjs';
import { ocularHistory } from './ocular-history.mjs';

const rawSourceCheck = process.argv.includes('--raw-source');
let checks = 0,
  sourceTrianglesChecked = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const read = async (path) => JSON.parse(await fs.readFile(path));
const root = 'public/models/bodyparts3d/full-body/';
const catalogRaw = await fs.readFile(root + 'catalog.json'),
  catalog = JSON.parse(catalogRaw);
const baseline = await read('content/ocular-baseline.json'),
  preparation = await read('content/ocular-candidate-audit.json'),
  audit = await read('content/ocular-geometry-audit.json'),
  inventory = await read('content/source-inventory.json');
same(
  hash(catalogRaw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(catalog.structures.length, 1022);
same(catalog.bundles.length, 86);
same(baseline.structures.length, 1006);
same(baseline.bundles.length, 82);
same(baseline.sourceCommit, '7a517628613ce287d156646bf3fc6ef1cdc714d8');
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
const { catalog: previous } = ocularHistory(
  catalog,
  inventory,
  baseline,
  preparation,
);
for (const b of baseline.bundles) {
  same(
    catalog.bundles.find((x) => x.id === b.id),
    b,
  );
  same(hash(await fs.readFile(root + b.id + '.glb')), b.sha256);
}
same(audit.sourceCommit, baseline.sourceCommit);
same(
  hash(await fs.readFile('content/ocular-geometry-audit.json')),
  'fe40911b0bd571551dbf6df931b874294c579aabb8f4f24447757819304526d5',
);
same(audit.catalogSha256, baseline.catalogSha256);
same(
  audit.preparationSha256,
  hash(await fs.readFile('content/ocular-candidate-audit.json')),
);
same(audit.existingStructures, 263);
same(audit.considered, 2675);
same(audit.pruned, 2538);
same(audit.comparisons.length, 137);
same(
  audit.comparisons.filter((r) => r.flagged),
  [],
);
same(audit.translatedShapeComparisons, []);
same(audit.results.length, 10);
same(audit.license, 'CC-BY-4.0');
same(audit.sourceVersion, '4.0');
for (const r of audit.comparisons) {
  same(r.exactTriangles, 0);
  check(ocularAdmissions.includes(r.a) || ocularAdmissions.includes(r.b));
  for (const d of [r.aToB, r.bToA]) {
    check(d.samples > 0 && d.samples <= 128);
    check(Number.isFinite(d.medianMm) && d.medianMm >= 0);
    check(Number.isFinite(d.maxMm) && d.maxMm >= d.medianMm);
    check(
      d.withinTenthMm <= d.withinQuarterMm &&
        d.withinQuarterMm <= d.withinOneMm &&
        d.withinOneMm <= d.samples,
    );
    same(d.closePointBounds !== null, d.withinQuarterMm > 0);
    check(d.withinQuarterMm / d.samples < 0.25);
  }
}

// Independent source-coordinate fixtures: no clinical conclusions from these.
const plane = sourceObjShape(
  Buffer.from('v 0 0 0\nv 10 0 0\nv 10 6 0\nv 0 6 0\nf 1 2 3\nf -4 -2 -1\n'),
);
const saved = JSON.stringify({ vertices: plane.vertices, faces: plane.faces });
const duplicate = compareSourceSurfaces(plane, plane);
same(duplicate.exactTriangles, 2);
check(duplicate.flagged);
same(duplicate.aToB.maxMm, 0);
const remeshed = prepareShape(
  [...plane.vertices, [5, 3, 0]],
  [
    [0, 1, 4],
    [1, 2, 4],
    [2, 3, 4],
    [3, 0, 4],
  ],
);
const equivalent = compareSourceSurfaces(plane, remeshed);
same(equivalent.exactTriangles, 0);
check(equivalent.flagged);
same(equivalent.aToB.maxMm, 0);
same(equivalent.bToA.maxMm, 0);
const moved = prepareShape(
  plane.vertices.map(([x, y, z]) => [x, y, z + 3]),
  plane.faces,
);
check(!sourceBoundsNear(plane, moved));
check(!compareSourceSurfaces(plane, moved).flagged);
same(compareSourceSurfaces(plane, moved).aToB.medianMm, 3);
const near = prepareShape(
  plane.vertices.map(([x, y, z]) => [x, y, z + 0.2]),
  plane.faces,
);
check(sourceBoundsNear(plane, near));
check(compareSourceSurfaces(plane, near).flagged);
const line = prepareShape(
  [
    [0, 0, 0],
    [5, 0, 0],
    [10, 0, 0],
  ],
  [[0, 1, 2]],
);
check(Number.isFinite(compareSourceSurfaces(plane, line).aToB.maxMm));
const merged = mergeSourceShapes([plane, moved]);
same(merged.faces.length, 4);
same(merged.vertices.length, 8);
same(sourceTriangleSet(merged).size, 4);
same(JSON.stringify({ vertices: plane.vertices, faces: plane.faces }), saved);
for (const bad of [
  'v NaN 0 0\nf 1 1 1',
  'v 0 0 0\nf 1 2 3',
  'v 0 0 0\nf 0 1 1',
  'v 0 0 0\nf 1 1 1 1',
  '',
]) {
  checks++;
  assert.throws(() => sourceObjShape(Buffer.from(bad)));
}

const additions = catalog.structures.filter((s) =>
  s.bundle.endsWith('-ocular-detail'),
);
same(
  additions.map((s) => s.fmaId).sort(compare),
  [...ocularAdmissions].sort(compare),
);
same(
  ocularSelections(
    new Map(
      inventory.records.filter((r) => r.tree === 'isa').map((r) => [r.id, r]),
    ),
  ).map((s) => s.fma),
  ocularAdmissions,
);
same(additions.filter((s) => s.system === 'organs').length, 6);
same(additions.filter((s) => s.system === 'connective').length, 4);
same(additions.filter((s) => s.laterality === 'right').length, 5);
same(additions.filter((s) => s.laterality === 'left').length, 5);
const shapes = new Map();
for (const b of catalog.bundles.filter((b) =>
  b.id.endsWith('-ocular-detail'),
)) {
  const bytes = await fs.readFile(root + b.id + '.glb');
  same(bytes.length, b.bytes);
  same(hash(bytes), b.sha256);
  const { scene } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  scene.updateMatrixWorld(true);
  scene.traverse((mesh) => {
    if (mesh.isMesh) {
      check(!shapes.has(mesh.name));
      shapes.set(
        mesh.name,
        meshSourceShape(
          mesh,
          catalog.coordinateSystem.sourceToSceneColumnMajor,
        ),
      );
    }
  });
}
same(shapes.size, 10);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
for (const [id, name, files] of ocularDefinitions) {
  const s = additions.find((s) => s.fmaId === id),
    p = preparation.results.find((r) => r.fmaId === id),
    a = audit.results.find((r) => r.fmaId === id),
    shape = shapes.get(id);
  same(s.sourceName, name);
  same(s.sources, [{ file: files[0], sha256: p.sha256 }]);
  same(s.region, 'head-neck');
  same(s.regions, ['head-neck']);
  same(s.sourceTree, 'isa');
  same(
    s.category,
    name.includes('tarsal plate') ? 'connective-tissue' : 'organ',
  );
  same(s.system, a.system);
  same(s.laterality, p.expectedSide);
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  check(s.coverageNote.includes('Unvalidated'));
  check(!inventoryHolds[id]);
  same(a.name, name);
  same(a.admitted, false);
  same(a.clinicalValidation, false);
  check(a.lateralityPass);
  same(a.bounds, p.sourceBounds);
  same(a.vertices, p.vertices);
  same(a.triangles, p.triangles);
  same(p.degenerateTriangles, 0);
  // Bounded engineering envelope in source mm; not tissue-boundary validation.
  check(a.bounds.min[2] > 1400 && a.bounds.max[2] < 1700);
  check(a.bounds.min[0] > -100 && a.bounds.max[0] < 100);
  const bounds = new Box3(
    new Vector3(...a.bounds.min),
    new Vector3(...a.bounds.max),
  ).applyMatrix4(matrix);
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++)
      check(
        Math.abs(bounds[end].getComponent(k) - s.bounds[end][k]) < 0.000002,
      );
  same(shape.faces.length, p.triangles);
  for (const asset of inventory.assets.filter((x) => x.file === files[0])) {
    if (asset.tree === 'isa') same(asset.sha256, p.sha256);
    check(/^[a-f0-9]{64}$/.test(asset.sha256));
    same(asset.geometrySha256, p.geometrySha256);
    same(asset.representedBy, [s.id]);
  }
  same(
    inventory.records.find((r) => r.tree === 'isa' && r.id === id).status,
    'admitted',
  );
  if (rawSourceCheck) {
    const bytes = await fs.readFile(`${cache}/isa/${files[0]}.obj`);
    same(hash(bytes), p.sha256);
    same(geometryFingerprint(bytes), p.geometrySha256);
    const original = sourceObjShape(bytes);
    same(original.min, a.bounds.min);
    same(original.max, a.bounds.max);
    same(original.faces.length, shape.faces.length);
    // Every face/corner, not just bounds: unchanged source geometry within the
    // exported Float32 common-transform tolerance (0.0003 source millimetres).
    for (let i = 0; i < original.faces.length; i++) {
      const used = new Set();
      for (const vi of shape.faces[i]) {
        const v = shape.vertices[vi];
        const k = original.faces[i].findIndex(
          (oi, k) =>
            !used.has(k) &&
            Math.hypot(...v.map((n, axis) => n - original.vertices[oi][axis])) <
              0.0003,
        );
        check(
          k >= 0,
          'Every exported corner matches its original source triangle',
        );
        used.add(k);
      }
      sourceTrianglesChecked++;
    }
  }
}
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/ocular-anatomy'; export * from './app/dissection-data'; export * from './app/body-content'; export * from './lib/anatomy-practice'; export * from './lib/anatomy-link-registry'; export * from './lib/study-links';",
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
same(
  api.ocularGroups.flatMap((g) => g.fmaIds).sort(compare),
  [...ocularAdmissions].sort(compare),
);
for (const s of additions) {
  const group = api.ocularGroupFor(s.fmaId);
  for (const tab of ['anatomy', 'function']) {
    const c = api.bodyContent(s, tab);
    check(c.title.includes('draft'));
    same(c.body, group[tab]);
    same(c.citations, group.references);
    check(c.bullets.includes(group.caution));
  }
  for (const tab of ['ct', 'mri', 'ultrasound'])
    check(api.bodyContent(s, tab).body.includes('No imaging study'));
  const entry = api.bodyLinkEntries(catalog).find((e) => e.id === s.id);
  check(entry);
  same(entry.sources, s.sources);
  same(entry.reference.kind, 'surface-bounds-centre');
}
same(api.ocularStudySets.length, 3);
const counts = {
  'eyelid-tarsal-window': 8,
  'lacrimal-drainage-window': 10,
  'nasolacrimal-bone-window': 8,
};
const loaded = catalog.bundles.map((b) => b.id);
let serial = 0;
for (const study of api.ocularStudySets)
  for (const side of ['both', 'left', 'right']) {
    const profile = api.dissectionProfiles['head-neck'],
      focus = profile.focuses.find((f) => f.id === study.id);
    check(profile.stages.some((s) => s.id === study.id));
    same(focus.includeSkeleton, false);
    same(focus.rule.fmaIds, study.targetFmaIds);
    same(focus.context, study.context);
    const scope = api.bodyStudyScope(catalog, 'head-neck', side),
      expected = scope.filter(
        (s) =>
          study.targetFmaIds.includes(s.fmaId) ||
          study.context.some((r) => api.matchesRule(s, r)),
      ),
      visible = api.stageStructures(scope, profile, study.id);
    same(visible, expected);
    same(api.stageStructures(scope, profile, 'free', study.id), expected);
    same(visible.length, counts[study.id] / (side === 'both' ? 1 : 2));
    for (const landmark of study.landmarks)
      check(visible.some((s) => new RegExp(landmark, 'i').test(s.sourceName)));
    const state = api.dissectionReducer(api.initialDissection, {
      type: 'stage',
      id: study.id,
    });
    for (const s of visible) {
      const removed = api.dissectionReducer(state, {
        type: 'remove',
        id: s.id,
      });
      same(
        api.resolveDissection(scope, profile, removed).visible,
        visible.filter((v) => v.id !== s.id),
      );
      same(api.dissectionReducer(removed, { type: 'undo' }), state);
      same(
        api.resolveDissection(
          scope,
          profile,
          api.dissectionReducer(removed, { type: 'restore', id: s.id }),
        ).visible,
        visible,
      );
      const href = api.makeStudyLink(
        catalog,
        'head-neck',
        s.id,
        side,
        study.id,
      );
      check(href);
      const linked = api.resolveStudyLink(
        catalog,
        'head-neck',
        api.parseStudyLink(
          Object.fromEntries(
            new URL(href, 'https://atlas.invalid').searchParams,
          ),
        ),
      );
      same(linked.status, 'ready');
      same(linked.selected.id, s.id);
      same(
        linked.visibleIds,
        visible.map((v) => v.id),
      );
    }
    const targets = visible.filter((s) => study.targetFmaIds.includes(s.fmaId));
    for (const mode of ['find', 'name']) {
      const session = api.createPracticeSession(
        visible,
        loaded,
        {
          id: ++serial,
          mode,
          count: 20,
          sampling: 'focus',
          focusIds: targets.map((s) => s.id),
        },
        () => 0.37,
      );
      if (mode === 'name' && targets.length < 2) {
        same(session, null);
        continue;
      }
      check(session);
      same(session.questions.length, targets.length);
      for (const q of session.questions)
        check(targets.some((s) => s.id === q.target));
    }
  }
for (const s of previous.structures)
  for (const region of ['whole-body', ...s.regions]) {
    const href = api.makeStudyLink(previous, region, s.id, 'both');
    check(href);
    const result = api.resolveStudyLink(
      catalog,
      region,
      api.parseStudyLink(
        Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams),
      ),
    );
    same(result.status, 'ready');
    same(result.selected.id, s.id);
  }
const result = {
  passed: true,
  checks,
  rawSourceCheck,
  sourceTrianglesChecked,
  newEntries: 10,
  organEntries: 6,
  connectiveEntries: 4,
  newBundles: 2,
  newAssetBytes: catalog.bundles
    .filter((b) => b.id.endsWith('-ocular-detail'))
    .reduce((n, b) => n + b.bytes, 0),
  preservedRecords: 1006,
  preservedBundles: 82,
  studyWindows: 3,
  focusViews: 3,
  clinicalValidation: false,
  browserInteractionTesting: false,
  catalogSha256: hash(catalogRaw),
  geometryAuditSha256: hash(
    await fs.readFile('content/ocular-geometry-audit.json'),
  ),
};
await fs.writeFile(
  'docs/ocular-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
