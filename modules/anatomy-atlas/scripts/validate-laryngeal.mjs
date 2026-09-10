import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Matrix4, Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { inventoryHolds, geometryFingerprint } from './anatomy-inventory.mjs';
import { laryngealDefinitions } from './laryngeal-candidates.mjs';
import {
  laryngealAdmissions,
  laryngealHeldIds,
  laryngealSelections,
} from './laryngeal-selections.mjs';
import { ocularHistory } from './ocular-history.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { meshSourceShape } from './vessel-shape-math.mjs';
import { cache } from './bodyparts-archive.mjs';
const rawSourceCheck = process.argv.includes('--raw-source');
let checks = 0,
  sourceTrianglesChecked = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const throws = (fn) => {
  checks++;
  assert.throws(fn);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const read = async (p) => JSON.parse(await fs.readFile(p));
const root = 'public/models/bodyparts3d/full-body/';
const catalogRaw = await fs.readFile(root + 'catalog.json'),
  catalog = JSON.parse(catalogRaw),
  inventory = await read('content/source-inventory.json'),
  baseline = await read('content/laryngeal-baseline.json'),
  audit = await read('content/laryngeal-source-audit.json');
same(
  hash(catalogRaw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(
  hash(await fs.readFile('content/laryngeal-source-audit.json')),
  '6595ce03a7392c482e5f965f2693ab84dc14221fd4a5fa2176d588f00ca7cae8',
);
same(catalog.structures.length, 1022);
same(catalog.bundles.length, 86);
same(baseline.structures.length, 1016);
same(baseline.bundles.length, 84);
same(baseline.sourceCommit, '67d08d64cc681552d284512745a158aa458a50da');
same(
  baseline.catalogSha256,
  '01a253d3d67a933d41bb3b08693ab13279b4e12c0767f2e4b8d68fa9f6078d86',
);
same(
  baseline.inventorySha256,
  '2d86813da40c4b48b641b995fc494ac2c05b4b2bc9320ccaa4791d7e1aa01ba7',
);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
const historical = ocularHistory(catalog, inventory, baseline, baseline);
for (const b of baseline.bundles) {
  same(
    catalog.bundles.find((v) => v.id === b.id),
    b,
  );
  same(hash(await fs.readFile(root + b.id + '.glb')), b.sha256);
}
// Negative fixtures prove historical reconstruction is not merely a fallback to
// current policy or a convenient subset. Both complete old hashes must agree.
const changedPolicy = structuredClone(baseline);
changedPolicy.inventoryHolds.FMA55619 = inventoryHolds.FMA55619;
throws(() => ocularHistory(catalog, inventory, changedPolicy, baseline));
const changedCatalogue = structuredClone(catalog);
changedCatalogue.structures[0].name += ' altered';
throws(() => ocularHistory(changedCatalogue, inventory, baseline, baseline));
const changedInventory = structuredClone(inventory);
changedInventory.tables[0].sha256 = '0'.repeat(64);
throws(() => ocularHistory(catalog, changedInventory, baseline, baseline));
same(audit.sourceCommit, baseline.sourceCommit);
same(audit.catalogSha256, baseline.catalogSha256);
same(audit.inventorySha256, baseline.inventorySha256);
same(audit.existingStructures, 273);
same(audit.considered, 2212);
same(audit.pruned, 2013);
same(audit.comparisons.length, 199);
same(audit.results.length, 8);
same(audit.translatedShapeComparisons, []);
same(audit.license, 'CC-BY-4.0');
same(audit.sourceVersion, '4.0');
same(audit.credit, catalog.credit);
same(
  audit.sourceTableSha256,
  inventory.tables.find((t) => t.name === 'isa_element_parts.txt').sha256,
);
same(
  audit.comparisons.filter((r) => r.flagged).map((r) => [r.a, r.b]),
  [
    ['FMA46632', 'FMA55620'],
    ['FMA46631', 'FMA55619'],
    ['FMA46593', 'FMA55252'],
    ['FMA46592', 'FMA55251'],
    ['FMA55118', 'FMA46605'],
    ['FMA55245', 'FMA55251'],
    ['FMA55246', 'FMA55252'],
  ],
);
for (const row of audit.comparisons) {
  same(row.exactTriangles, 0);
  for (const d of [row.aToB, row.bToA]) {
    check(d.samples > 0 && d.samples <= 128);
    check(Number.isFinite(d.medianMm) && d.medianMm >= 0);
    check(Number.isFinite(d.maxMm) && d.maxMm >= d.medianMm);
    check(
      d.withinTenthMm <= d.withinQuarterMm &&
        d.withinQuarterMm <= d.withinOneMm &&
        d.withinOneMm <= d.samples,
    );
    same(d.closePointBounds !== null, d.withinQuarterMm > 0);
  }
  same(
    row.flagged,
    [row.aToB, row.bToA].some((d) => d.withinQuarterMm / d.samples >= 0.25),
  );
}
const additions = catalog.structures.filter((s) =>
  s.bundle.endsWith('-laryngeal-detail'),
);
same(
  additions.map((s) => s.fmaId).sort(compare),
  [...laryngealAdmissions].sort(compare),
);
const isa = new Map(
  inventory.records.filter((r) => r.tree === 'isa').map((r) => [r.id, r]),
);
same(
  laryngealSelections(isa).map((s) => s.fma),
  laryngealAdmissions,
);
const badIsa = new Map(isa);
badIsa.set('FMA55133', { ...isa.get('FMA55133'), files: ['FJ2786'] });
throws(() => laryngealSelections(badIsa));
const bundle = catalog.bundles.find(
    (b) => b.id === 'head-neck-connective-laryngeal-detail',
  ),
  data = await fs.readFile(root + bundle.id + '.glb');
same(bundle.bytes, 178112);
same(data.length, bundle.bytes);
same(hash(data), bundle.sha256);
const { scene } = await new GLTFLoader().parseAsync(
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  '',
);
scene.updateMatrixWorld(true);
const shapes = new Map();
scene.traverse((mesh) => {
  if (mesh.isMesh)
    shapes.set(
      mesh.name,
      meshSourceShape(mesh, catalog.coordinateSystem.sourceToSceneColumnMajor),
    );
});
same(shapes.size, 2);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
for (const [id, name, file, system, category] of laryngealDefinitions) {
  const row = audit.results.find((r) => r.fmaId === id),
    definition = isa.get(id);
  same(row.name, name);
  same(row.file, file);
  same(row.system, system);
  same(row.category, category);
  same(definition.name, name);
  same(definition.files, [file]);
  same(row.admitted, false);
  same(row.clinicalValidation, false);
  check(row.sideCentrePass);
  check(row.grossEnvelopePass);
  same(row.renderedOwners, []);
  same(row.exactRenderedMatches, []);
  same(row.holds, []);
  same(
    row.aliases,
    historical.inventory.records
      .filter((r) => r.files.includes(file))
      .map((r) => ({
        tree: r.tree,
        id: r.id,
        name: r.name,
        componentCount: r.files.length,
        candidateFiles: r.files.filter((f) => f === file),
        recordSha256: hash(JSON.stringify(r)),
      })),
  );
  const s = additions.find((s) => s.fmaId === id);
  if (s) {
    check(laryngealAdmissions.includes(id));
    same(s.sources, [{ file, sha256: row.sha256 }]);
    same(s.sourceName, name);
    same(s.category, 'membrane');
    same(s.system, 'connective');
    same(s.regions, ['head-neck']);
    same(s.sourceTree, 'isa');
    same(s.laterality, row.expectedSide);
    same(s.validation, { status: 'unvalidated', anatomicalReview: false });
    same(s.provenance, {
      method: 'licensed-source-mesh',
      license: 'CC-BY-4.0',
      sourceVersion: '4.0',
      recovered: true,
    });
    check(s.coverageNote.includes('Unvalidated'));
    same(row.degenerateTriangles, 0);
    same(row.oppositeSideFragments.vertices, 0);
    same(row.oppositeSideFragments.triangles, 0);
    same(row.oppositeSideFragments.triangleAreaMm2, 0);
    check(
      !audit.comparisons.some((r) => r.flagged && (r.a === id || r.b === id)),
    );
    const transformed = new Box3(
      new Vector3(...row.bounds.min),
      new Vector3(...row.bounds.max),
    ).applyMatrix4(matrix);
    for (const end of ['min', 'max'])
      for (let k = 0; k < 3; k++)
        check(
          Math.abs(transformed[end].getComponent(k) - s.bounds[end][k]) <
            0.000002,
        );
    same(definition.status, 'admitted');
    for (const asset of inventory.assets.filter((a) => a.file === file)) {
      if (asset.tree === 'isa') {
        same(asset.sha256, row.sha256);
        same(asset.crc32, row.crc32);
      }
      same(asset.geometrySha256, row.geometrySha256);
      same(asset.representedBy, [s.id]);
    }
  } else {
    check(laryngealHeldIds.includes(id));
    check(inventoryHolds[id]);
    same(definition.status, 'held-source-review');
    check(
      !catalog.structures.some((s) => s.sources.some((f) => f.file === file)),
    );
    for (const asset of inventory.assets.filter((a) => a.file === file))
      same(asset.representedBy, []);
  }
  if (rawSourceCheck) {
    const bytes = await fs.readFile(`${cache}/isa/${file}.obj`);
    same(hash(bytes), row.sha256);
    same(bytes.length, row.bytes);
    same(geometryFingerprint(bytes), row.geometrySha256);
    const shape = sourceObjShape(bytes);
    same(shape.min, row.bounds.min);
    same(shape.max, row.bounds.max);
    same(shape.vertices.length, row.vertices);
    same(shape.faces.length, row.triangles);
    same(
      shape.triangles.filter((t) => t.degenerate).length,
      row.degenerateTriangles,
    );
    const opposite = new Set(
      shape.vertices.flatMap((v, i) =>
        (row.expectedSide === 'right' ? v[0] > 0 : v[0] < 0) ? [i] : [],
      ),
    );
    const faces = shape.faces.flatMap((f, i) =>
      f.some((v) => opposite.has(v)) ? [i] : [],
    );
    same(opposite.size, row.oppositeSideFragments.vertices);
    same(faces.length, row.oppositeSideFragments.triangles);
    same(
      faces.reduce((n, i) => n + shape.triangles[i].triangle.getArea(), 0),
      row.oppositeSideFragments.triangleAreaMm2,
    );
    if (s) {
      const exported = shapes.get(id);
      same(exported.faces.length, shape.faces.length);
      for (let i = 0; i < shape.faces.length; i++) {
        const used = new Set();
        for (const vi of exported.faces[i]) {
          const v = exported.vertices[vi];
          const k = shape.faces[i].findIndex(
            (oi, k) =>
              !used.has(k) &&
              Math.hypot(...v.map((n, axis) => n - shape.vertices[oi][axis])) <
                0.0003,
          );
          check(
            k >= 0,
            'Every exported triangle corner retains original source geometry',
          );
          used.add(k);
        }
        sourceTrianglesChecked++;
      }
    }
  }
}
const byId = (id) => audit.results.find((r) => r.fmaId === id);
same(byId('FMA55252').oppositeSideFragments.vertices, 52);
same(byId('FMA55252').oppositeSideFragments.triangles, 18);
check(
  Math.abs(
    byId('FMA55252').oppositeSideFragments.triangleAreaMm2 -
      0.007293357319174836,
  ) < 1e-12,
);
same(byId('FMA46604').oppositeSideFragments.vertices, 108);
same(byId('FMA46604').oppositeSideFragments.triangles, 36);
check(
  Math.abs(
    byId('FMA46604').oppositeSideFragments.triangleAreaMm2 -
      0.0034566346446919818,
  ) < 1e-12,
);
for (const id of ['FMA55619', 'FMA55620'])
  for (const parent of ['FMA9657', 'FMA50705', 'FMA67112'])
    check(byId(id).aliases.some((r) => r.id === parent));
for (const id of ['FMA55077', 'FMA46633', 'FMA46634', 'FMA46622'])
  check(!catalog.structures.some((s) => s.fmaId === id));

const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/laryngeal-anatomy';export * from './app/dissection-data';export * from './app/body-content';export * from './lib/anatomy-practice';export * from './lib/anatomy-link-registry';export * from './lib/study-links';",
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
same(api.laryngealGroups.length, 4);
same(api.laryngealStudySets.length, 4);
for (const group of api.laryngealGroups)
  for (const id of group.fmaIds) {
    const s = catalog.structures.find((s) => s.fmaId === id);
    check(s);
    for (const tab of ['anatomy', 'function']) {
      const content = api.bodyContent(s, tab);
      check(content.title.includes('draft'));
      same(content.body, group[tab]);
      same(content.citations, group.references);
      check(content.bullets.includes(group.caution));
    }
    for (const tab of ['ct', 'mri', 'ultrasound'])
      check(api.bodyContent(s, tab).body.includes('No imaging study'));
  }
for (const s of additions) {
  const entry = api.bodyLinkEntries(catalog).find((e) => e.id === s.id);
  check(entry);
  same(entry.sources, s.sources);
  same(entry.reference.kind, 'surface-bounds-centre');
}
const counts = {
    'thyrohyoid-membrane-window': [7, 5],
    'vocal-ligament-muscle-window': [8, 5],
    'posterior-laryngeal-muscle-window': [10, 6],
    'pharyngeal-muscle-window': [12, 7],
  },
  loaded = catalog.bundles.map((b) => b.id);
let serial = 0;
for (const study of api.laryngealStudySets)
  for (const side of ['both', 'left', 'right']) {
    const profile = api.dissectionProfiles['head-neck'],
      focus = profile.focuses.find((f) => f.id === study.id);
    check(profile.stages.some((s) => s.id === study.id));
    same(focus.rule.fmaIds, study.targetFmaIds);
    same(focus.includeSkeleton, false);
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
    same(visible.length, counts[study.id][side === 'both' ? 0 : 1]);
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
      const undone = api.dissectionReducer(removed, { type: 'undo' });
      // Undo restores the visible state AND retains the removed state for Redo.
      // This older test predates the shared workbench's redo history.
      same(undone, {
        ...state,
        future: [{
          stageId: removed.stageId,
          focusId: removed.focusId,
          removed: removed.removed,
          restored: removed.restored,
        }],
      });
      same(api.dissectionReducer(undone, { type: 'redo' }), removed);
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
      const resolved = api.resolveStudyLink(
        catalog,
        'head-neck',
        api.parseStudyLink(
          Object.fromEntries(
            new URL(href, 'https://atlas.invalid').searchParams,
          ),
        ),
      );
      same(resolved.status, 'ready');
      same(resolved.selected.id, s.id);
      same(
        resolved.visibleIds,
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
for (const s of historical.catalog.structures)
  for (const region of ['whole-body', ...s.regions]) {
    const href = api.makeStudyLink(historical.catalog, region, s.id, 'both');
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
  candidates: 8,
  newEntries: 2,
  newBundles: 1,
  newAssetBytes: 178112,
  preservedRecords: 1016,
  preservedBundles: 84,
  heldIds: laryngealHeldIds,
  sourcePairComparisons: 199,
  flaggedPairs: 7,
  studyWindows: 4,
  focusViews: 4,
  clinicalValidation: false,
  browserInteractionTesting: false,
  catalogSha256: hash(catalogRaw),
  sourceAuditSha256: hash(
    await fs.readFile('content/laryngeal-source-audit.json'),
  ),
};
await fs.writeFile(
  'docs/laryngeal-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
