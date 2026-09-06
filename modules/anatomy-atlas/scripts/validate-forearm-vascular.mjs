import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Box3, Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { forearmVascularDefinitions } from './forearm-vascular-candidates.mjs';
import {
  forearmVascularAdmissions,
  forearmVascularSelections,
} from './forearm-vascular-selections.mjs';
import { ocularHistory } from './ocular-history.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceBoundsNear,
  compareSourceSurfaces,
} from './source-surface-audit.mjs';
import { meshSourceShape, shapeCandidate } from './vessel-shape-math.mjs';
import { cache } from './bodyparts-archive.mjs';
const rawSourceCheck = process.argv.includes('--raw-source');
let checks = 0,
  sourceTrianglesChecked = 0,
  recomputedSurfacePairs = 0;
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
const read = async (p) => JSON.parse(await fs.readFile(p));
const root = 'public/models/bodyparts3d/full-body/';
const catalogRaw = await fs.readFile(root + 'catalog.json'),
  catalog = JSON.parse(catalogRaw);
const inventory = await read('content/source-inventory.json');
const baseline = await read('content/forearm-vascular-baseline.json');
const audit = await read('content/forearm-vascular-source-audit.json');
same(
  hash(catalogRaw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(catalog.structures.length, 1022);
same(catalog.bundles.length, 86);
same(baseline.structures.length, 1018);
same(baseline.bundles.length, 85);
same(baseline.sourceCommit, 'baac701cffa779c6a652637a5d39d241bb081f9e');
same(
  baseline.catalogSha256,
  '8868c391ee285c13cfe54ffd3a5e4051d4a2e41d956a22acbaeb94bc8e4920a7',
);
same(
  baseline.inventorySha256,
  '339eb68f016a33545aac745d921e1a678927a6b3d813afb5f5a0eda75ce12fac',
);
const history = ocularHistory(catalog, inventory, baseline, baseline);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
for (const b of baseline.bundles) {
  same(
    catalog.bundles.find((v) => v.id === b.id),
    b,
  );
  same(hash(await fs.readFile(root + b.id + '.glb')), b.sha256);
}
const badCatalog = structuredClone(catalog);
badCatalog.structures[0].name += ' changed';
throws(() => ocularHistory(badCatalog, inventory, baseline, baseline));
const badInventory = structuredClone(inventory);
badInventory.tables[0].sha256 = '0'.repeat(64);
throws(() => ocularHistory(catalog, badInventory, baseline, baseline));
const badPolicy = structuredClone(baseline);
badPolicy.inventoryHolds.FMA37388 = 'changed';
throws(() => ocularHistory(catalog, inventory, badPolicy, baseline));
same(audit.sourceCommit, baseline.sourceCommit);
same(audit.catalogSha256, baseline.catalogSha256);
same(audit.inventorySha256, baseline.inventorySha256);
same(audit.sourceVersion, '4.0');
same(audit.license, 'CC-BY-4.0');
same(audit.credit, catalog.credit);
same(
  audit.sourceTableSha256,
  inventory.tables.find((t) => t.name === 'isa_element_parts.txt').sha256,
);
same(audit.results.length, 4);
same(audit.screened.length, 1018);
same(audit.comparedExistingStructures, 54);
same(audit.consideredPairs, 4078);
same(audit.comparisons.length, 96);
same(
  audit.comparisons.filter((r) => r.flagged),
  [],
);
same(audit.translatedShapeComparisons, []);
const additions = catalog.structures.filter((s) =>
  s.bundle.endsWith('-forearm-vascular'),
);
same(
  additions.map((s) => s.fmaId).sort(),
  [...forearmVascularAdmissions].sort(),
);
const isa = new Map(
  inventory.records.filter((r) => r.tree === 'isa').map((r) => [r.id, r]),
);
same(
  forearmVascularSelections(isa).map((s) => s.fma),
  forearmVascularAdmissions,
);
for (const [id] of forearmVascularDefinitions) {
  const altered = new Map(isa);
  altered.set(id, { ...isa.get(id), files: ['FJ2214'] });
  throws(() => forearmVascularSelections(altered));
}
const bundle = catalog.bundles.find(
  (b) => b.id === 'forearm-vessels-forearm-vascular',
);
same(bundle.bytes, 66352);
same(
  bundle.sha256,
  'afe5f1b4dc3d79fa05550ef1fc5cc28bc8502a2e2fbe7947ffdf3e61afff9782',
);
const data = await fs.readFile(root + bundle.id + '.glb');
same(data.length, bundle.bytes);
same(hash(data), bundle.sha256);
const { scene } = await new GLTFLoader().parseAsync(
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  '',
);
scene.updateMatrixWorld(true);
const exported = new Map();
scene.traverse((m) => {
  if (m.isMesh)
    exported.set(
      m.name,
      meshSourceShape(m, catalog.coordinateSystem.sourceToSceneColumnMajor),
    );
});
same(exported.size, 4);
const matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  ),
  inverse = matrix.clone().invert();
const rawShapes = new Map();
for (const [id, name, file] of forearmVascularDefinitions) {
  const r = audit.results.find((r) => r.fmaId === id),
    s = additions.find((s) => s.fmaId === id),
    definition = isa.get(id);
  same(r.name, name);
  same(r.file, file);
  same(definition.name, name);
  same(definition.files, [file]);
  same(definition.status, 'admitted');
  same(r.admitted, false);
  same(r.clinicalValidation, false);
  check(r.sideCentrePass);
  same(r.oppositeSideVertices, 0);
  same(r.degenerateTriangles, 0);
  same(r.renderedOwners, []);
  same(r.exactRenderedMatches, []);
  same(r.holds, []);
  same(
    r.aliases,
    history.inventory.records
      .filter((v) => v.files.includes(file))
      .map((v) => ({
        tree: v.tree,
        id: v.id,
        name: v.name,
        componentCount: v.files.length,
        candidateFiles: v.files.filter((f) => f === file),
        recordSha256: hash(JSON.stringify(v)),
      })),
  );
  same(s.sources, [{ file, sha256: r.sha256 }]);
  same(s.sourceName, name);
  same(s.sourceTree, 'isa');
  same(s.system, 'vessels');
  same(s.category, 'vessel');
  same(s.regions, ['forearm']);
  same(s.laterality, r.expectedSide);
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  check(s.coverageNote.includes('PART-OF'));
  check(s.coverageNote.includes('Unvalidated'));
  const bounds = new Box3(
    new Vector3(...r.bounds.min),
    new Vector3(...r.bounds.max),
  ).applyMatrix4(matrix);
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++)
      check(
        Math.abs(bounds[end].getComponent(k) - s.bounds[end][k]) < 0.000002,
      );
  for (const asset of inventory.assets.filter((a) => a.file === file)) {
    if (asset.tree === 'isa') {
      same(asset.sha256, r.sha256);
      same(asset.crc32, r.crc32);
    }
    same(asset.geometrySha256, r.geometrySha256);
    same(asset.representedBy, [s.id]);
  }
  if (rawSourceCheck) {
    const bytes = await fs.readFile(`${cache}/isa/${file}.obj`),
      shape = sourceObjShape(bytes);
    same(hash(bytes), r.sha256);
    same(bytes.length, r.bytes);
    same(geometryFingerprint(bytes), r.geometrySha256);
    same(shape.min, r.bounds.min);
    same(shape.max, r.bounds.max);
    same(shape.vertices.length, r.vertices);
    same(shape.faces.length, r.triangles);
    const actual = exported.get(id);
    same(actual.faces.length, shape.faces.length);
    for (let i = 0; i < shape.faces.length; i++) {
      const used = new Set();
      for (const vi of actual.faces[i]) {
        const point = actual.vertices[vi];
        const match = shape.faces[i].findIndex(
          (si, k) =>
            !used.has(k) &&
            Math.hypot(...point.map((v, a) => v - shape.vertices[si][a])) <
              0.0003,
        );
        check(match >= 0, 'Original source triangle corner retained');
        used.add(match);
      }
      sourceTrianglesChecked++;
    }
    rawShapes.set(id, shape);
  }
}
// Recompute the all-catalogue conservative screen, so omitted nearby neighbours
// cannot be hidden behind a green report count. No anatomy is translated here.
for (const row of audit.screened) {
  const s = history.catalog.structures.find((s) => s.fmaId === row.id);
  check(s);
  same(hash(JSON.stringify(s)), row.recordSha256);
  const box = new Box3(
    new Vector3(...s.bounds.min),
    new Vector3(...s.bounds.max),
  ).applyMatrix4(inverse);
  const envelope = {
    min: box.min.toArray(),
    max: box.max.toArray(),
    extent: box.getSize(new Vector3()).toArray(),
  };
  same(
    row.nearCandidates,
    audit.results
      .filter((c) =>
        sourceBoundsNear(
          { min: c.bounds.min, max: c.bounds.max },
          envelope,
          1.01,
        ),
      )
      .map((c) => c.fmaId),
  );
  same(
    row.translatedCandidates,
    s.system === 'vessels'
      ? audit.results
          .filter(
            (c) =>
              (c.expectedSide === s.laterality ||
                !['left', 'right'].includes(s.laterality)) &&
              shapeCandidate(c, envelope),
          )
          .map((c) => c.fmaId)
      : [],
  );
  if (
    rawSourceCheck &&
    (row.nearCandidates.length || row.translatedCandidates.length)
  ) {
    const parts = [];
    for (const f of s.sources) {
      const bytes = await fs.readFile(`${cache}/${s.sourceTree}/${f.file}.obj`);
      same(hash(bytes), f.sha256);
      parts.push(sourceObjShape(bytes));
    }
    rawShapes.set(s.fmaId, mergeSourceShapes(parts));
  }
}
const keys = new Set();
for (const r of audit.comparisons) {
  check(!keys.has(r.a + '/' + r.b));
  keys.add(r.a + '/' + r.b);
  same(r.exactTriangles, 0);
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
  }
  same(
    r.flagged,
    r.exactTriangles > 0 ||
      [r.aToB, r.bToA].some((d) => d.withinQuarterMm / d.samples >= 0.25),
  );
  if (rawSourceCheck) {
    same(compareSourceSurfaces(rawShapes.get(r.a), rawShapes.get(r.b)), {
      exactTriangles: r.exactTriangles,
      aToB: r.aToB,
      bToA: r.bToA,
      flagged: r.flagged,
    });
    recomputedSurfacePairs++;
  }
}
for (const r of audit.screened)
  for (const id of r.nearCandidates) check(keys.has(id + '/' + r.id));
for (let i = 0; i < audit.results.length; i++)
  for (let j = i + 1; j < audit.results.length; j++) {
    const a = audit.results[i],
      b = audit.results[j];
    if (
      sourceBoundsNear(
        { min: a.bounds.min, max: a.bounds.max },
        { min: b.bounds.min, max: b.bounds.max },
        1.01,
      )
    )
      check(keys.has(a.fmaId + '/' + b.fmaId));
  }
// Source branch aggregates must never be imported a second time.
for (const id of ['FMA22806', 'FMA77144', 'FMA22809', 'FMA22799'])
  check(!catalog.structures.some((s) => s.fmaId === id));
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/forearm-vascular-anatomy';export * from './app/dissection-data';export * from './app/body-content';export * from './lib/anatomy-practice';export * from './lib/anatomy-link-registry';export * from './lib/study-links';",
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
same(api.forearmVascularGroups.length, 2);
same(api.forearmVascularStudySets.length, 3);
for (const s of additions) {
  const group = api.forearmVascularGroupFor(s.fmaId);
  check(group);
  for (const tab of ['anatomy', 'function']) {
    const info = api.bodyContent(s, tab);
    same(info.body, group[tab]);
    same(info.citations, group.references);
    check(info.title.includes('draft'));
    check(info.bullets.includes(group.caution));
  }
  for (const tab of ['ct', 'mri', 'ultrasound'])
    check(api.bodyContent(s, tab).body.includes('No imaging study'));
  const link = api.bodyLinkEntries(catalog).find((e) => e.id === s.id);
  same(link.sources, s.sources);
  same(link.reference.kind, 'surface-bounds-centre');
}
const counts = {
  'common-interosseous-window': 12,
  'recurrent-interosseous-window': 12,
  'forearm-arterial-comparison': 16,
};
const loaded = catalog.bundles.map((b) => b.id);
let serial = 0;
for (const study of api.forearmVascularStudySets)
  for (const side of ['both', 'left', 'right']) {
    const profile = api.dissectionProfiles.forearm,
      scope = api.bodyStudyScope(catalog, 'forearm', side);
    const expected = scope.filter(
      (s) =>
        study.targetFmaIds.includes(s.fmaId) ||
        study.context.some((r) => api.matchesRule(s, r)),
    );
    const visible = api.stageStructures(scope, profile, study.id);
    same(visible, expected);
    same(api.stageStructures(scope, profile, 'free', study.id), expected);
    same(visible.length, counts[study.id] / (side === 'both' ? 1 : 2));
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
      const href = api.makeStudyLink(catalog, 'forearm', s.id, side, study.id);
      check(href);
      const resolved = api.resolveStudyLink(
        catalog,
        'forearm',
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
        visible.map((s) => s.id),
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
for (const s of history.catalog.structures)
  for (const region of ['whole-body', ...s.regions]) {
    const href = api.makeStudyLink(history.catalog, region, s.id, 'both');
    check(href);
    const resolved = api.resolveStudyLink(
      catalog,
      region,
      api.parseStudyLink(
        Object.fromEntries(new URL(href, 'https://atlas.invalid').searchParams),
      ),
    );
    same(resolved.status, 'ready');
    same(resolved.selected.id, s.id);
  }
const result = {
  passed: true,
  checks,
  rawSourceCheck,
  sourceTrianglesChecked,
  recomputedSurfacePairs,
  newEntries: 4,
  newBundles: 1,
  newAssetBytes: 66352,
  preservedRecords: 1018,
  preservedBundles: 85,
  screenedRecords: 1018,
  sourcePairComparisons: 96,
  flaggedPairs: 0,
  studyWindows: 3,
  focusViews: 3,
  clinicalValidation: false,
  browserInteractionTesting: false,
  catalogSha256: hash(catalogRaw),
  sourceAuditSha256: hash(
    await fs.readFile('content/forearm-vascular-source-audit.json'),
  ),
};
await fs.writeFile(
  'docs/forearm-vascular-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
