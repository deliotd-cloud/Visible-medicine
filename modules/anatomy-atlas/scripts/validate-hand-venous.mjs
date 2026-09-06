import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Box3, Vector3, Matrix4 } from 'three';
import {
  handVenousDefinitions,
  handVenousAdmissions,
  handVenousHeldIds,
  handVenousSelections,
} from './hand-venous-selections.mjs';
import { inventoryHolds, geometryFingerprint } from './anatomy-inventory.mjs';
import { cache } from './bodyparts-archive.mjs';
const rawSourceCheck = process.argv.includes('--raw-source');
let checks = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (a, m) => {
  checks++;
  assert(a, m);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const root = 'public/models/bodyparts3d/full-body/';
const catalog = await read(root + 'catalog.json'),
  baseline = await read('content/hand-venous-baseline.json'),
  audit = await read('content/hand-venous-source-audit.json'),
  inventory = await read('content/source-inventory.json');
same(baseline.sourceCommit, '6f7fe0df4124d13b029404ab3502c026b2d39230');
same(
  baseline.catalogSha256,
  '6402d7b654eaddb137fea383d796e64cd7674117d525492d89aa8daa31fe6593',
);
same(audit.sourceCommit, baseline.sourceCommit);
same(baseline.structures.length, 984);
same(baseline.bundles.length, 80);
same(catalog.structures.length, 1022);
same(catalog.bundles.length, 86);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
for (const old of baseline.structures)
  same(
    hash(JSON.stringify(catalog.structures.find((s) => s.id === old.id))),
    old.sha256,
    'Every previous field remains exact',
  );
for (const old of baseline.bundles) {
  same(
    catalog.bundles.find((b) => b.id === old.id),
    old,
  );
  same(hash(await fs.readFile(root + old.id + '.glb')), old.sha256);
}
const additions = catalog.structures.filter((s) =>
  s.bundle.endsWith('-hand-venous'),
);
same(
  additions.map((s) => s.fmaId).sort(compare),
  [...handVenousAdmissions].sort(compare),
);
same(
  handVenousSelections(
    new Map(
      inventory.records.filter((r) => r.tree === 'isa').map((r) => [r.id, r]),
    ),
  )
    .map((s) => s.fma)
    .sort(compare),
  [...handVenousAdmissions].sort(compare),
);
same(additions.length, 14);
same(additions.filter((s) => s.system === 'vessels').length, 14);
same(additions.filter((s) => s.system === 'organs').length, 0);
same(
  additions.reduce((n, s) => n + s.sources.length, 0),
  24,
);
same(audit.results.length, 16);
same(audit.comparisons.length, 597);
same(audit.license, 'CC-BY-4.0');
check(audit.distanceMethod.includes('segment/point fallback'));
for (const row of audit.comparisons) {
  same(row.exactTriangles, 0);
  for (const d of [row.aToB, row.bToA]) {
    check(d.samples > 0 && d.samples <= 128);
    check(Number.isFinite(d.medianMm) && d.medianMm >= 0);
    check(Number.isFinite(d.maxMm) && d.maxMm >= d.medianMm);
    check(d.withinQuarterMm <= d.withinOneMm && d.withinOneMm <= d.samples);
    same(d.closePointBounds !== null, d.withinQuarterMm > 0);
    if (d.closePointBounds)
      for (const end of ['min', 'max'])
        check(d.closePointBounds[end].every(Number.isFinite));
  }
}
same(
  audit.comparisons.filter((r) => r.flagged),
  [],
);
same(additions.filter((s) => s.laterality === 'right').length, 7);
same(additions.filter((s) => s.laterality === 'left').length, 7);
for (const alias of [
  'FMA23046',
  'FMA85111',
  'FMA37378',
  'FMA37388',
  'FMA37389',
])
  check(!catalog.structures.some((s) => s.fmaId === alias));
for (const id of handVenousHeldIds) {
  check(inventoryHolds[id]);
  check(!catalog.structures.some((s) => s.fmaId === id));
  for (const row of inventory.records.filter((r) => r.id === id))
    same(row.status, 'held-source-review');
}
for (const id of ['FMA46622', 'FMA46633', 'FMA46634'])
  check(!catalog.structures.some((s) => s.fmaId === id));
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
for (const [
  id,
  name,
  files,
  region = 'hand',
  system = 'vessels',
  category = 'vessel',
] of handVenousDefinitions) {
  const a = audit.results.find((r) => r.fmaId === id);
  same(a.name, name);
  same(a.region, region);
  same(a.system, system);
  same(
    a.files.map((f) => f.file),
    files,
  );
  check(a.grossPositionPass);
  check(a.lateralityPass);
  const side = name.includes('right') ? 'right' : 'left';
  check(side === 'right' ? a.bounds.max[0] < 0 : a.bounds.min[0] > 0);
  same(a.clinicalValidation, false);
  same(a.admitted, false, 'Audit alone never admits');
  for (const f of a.files) same(f.canonicalDuplicateOwners, []);
  const s = additions.find((s) => s.fmaId === id);
  if (!s) {
    check(handVenousHeldIds.includes(id));
    continue;
  }
  same(a.degenerateTriangles, 0);
  same(s.sourceName, name);
  same(s.laterality, side);
  same(s.region, region);
  same(s.regions, [region]);
  same(s.system, system);
  same(s.category, category);
  same(s.sourceTree, 'isa');
  same(
    s.sources,
    a.files.map(({ file, sha256 }) => ({ file, sha256 })),
  );
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  check(s.coverageNote.includes('Unvalidated'));
  const bounds = new Box3(
    new Vector3(...a.bounds.min),
    new Vector3(...a.bounds.max),
  ).applyMatrix4(matrix);
  const rawBounds = new Box3();
  for (const f of a.files) {
    if (rawSourceCheck) {
      const bytes = await fs.readFile(`${cache}/isa/${f.file}.obj`);
      same(hash(bytes), f.sha256);
      same(geometryFingerprint(bytes), f.geometrySha256);
      for (const line of bytes.toString().split(/\r?\n/))
        if (line.startsWith('v '))
          rawBounds.expandByPoint(
            new Vector3(
              ...line.trim().split(/\s+/).slice(1).map(Number),
            ).applyMatrix4(matrix),
          );
    }
    const asset = inventory.assets.find(
      (x) => x.tree === 'isa' && x.file === f.file,
    );
    same(asset.sha256, f.sha256);
    same(asset.geometrySha256, f.geometrySha256);
    same(asset.crc32, f.crc32);
    same(asset.representedBy, [s.id]);
    check(
      !inventory.assets.some(
        (x) =>
          x.geometrySha256 === f.geometrySha256 &&
          x.representedBy.some((id) => id !== s.id),
      ),
    );
  }
  if (rawSourceCheck)
    for (const end of ['min', 'max'])
      for (let k = 0; k < 3; k++)
        check(
          Math.abs(
            rawBounds[end].getComponent(k) - bounds[end].getComponent(k),
          ) < 1e-9,
          'Raw vertices agree with pinned source bounds',
        );
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++)
      check(
        Math.abs(bounds[end].getComponent(k) - s.bounds[end][k]) < 0.000002,
        'Original common transform',
      );
}
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/hand-venous-anatomy'; export * from './app/dissection-data'; export * from './app/body-content'; export * from './lib/anatomy-practice'; export * from './lib/anatomy-link-registry'; export * from './lib/study-links';",
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
  api.handVenousGroups.flatMap((g) => g.fmaIds).sort(compare),
  [...handVenousAdmissions].sort(compare),
);
for (const s of additions) {
  const group = api.handVenousGroupFor(s.fmaId);
  check(group);
  for (const tab of ['anatomy', 'function']) {
    const c = api.bodyContent(s, tab);
    check(c.title.includes('draft'));
    same(c.body, group[tab]);
    same(c.citations, group.references);
    check(c.bullets.includes(group.caution));
  }
  for (const tab of ['ct', 'mri', 'ultrasound'])
    check(api.bodyContent(s, tab).body.includes('No imaging study'));
  const e = api.bodyLinkEntries(catalog).find((e) => e.id === s.id);
  check(e);
  same(e.sources, s.sources);
  same(e.reference.kind, 'surface-bounds-centre');
}
same(api.handVenousStudySets.length, 4);
const counts = {
  'palmar-venous-arches-window': { both: 10, left: 5, right: 5 },
  'dorsal-hand-veins-window': { both: 12, left: 6, right: 6 },
  'palmar-digital-veins-window': { both: 12, left: 6, right: 6 },
  'hand-arteries-veins-exposed': { both: 42, left: 20, right: 22 },
};
const loaded = catalog.bundles.map((b) => b.id);
let serial = 0;
for (const study of api.handVenousStudySets)
  for (const region of study.regions) {
    const profile = api.dissectionProfiles[region],
      focus = profile.focuses.find((f) => f.id === study.id),
      stage = profile.stages.find((s) => s.id === study.id);
    check(focus && stage);
    same(focus.includeSkeleton, false);
    same(focus.rule.fmaIds, study.targetFmaIds);
    same(focus.context, study.context);
    for (const side of ['both', 'left', 'right']) {
      const scope = api.bodyStudyScope(catalog, region, side),
        expected = scope.filter(
          (s) =>
            study.targetFmaIds.includes(s.fmaId) ||
            study.context.some((r) => api.matchesRule(s, r)),
        ),
        visible = api.stageStructures(scope, profile, study.id);
      same(visible, expected);
      same(api.stageStructures(scope, profile, 'free', study.id), expected);
      same(visible.length, counts[study.id][side]);
      for (const landmark of study.landmarks)
        check(
          visible.some((s) => new RegExp(landmark, 'i').test(s.sourceName)),
        );
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
        const href = api.makeStudyLink(catalog, region, s.id, side, study.id);
        check(href);
        const linked = api.resolveStudyLink(
          catalog,
          region,
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
      const targets = visible.filter((s) =>
        study.targetFmaIds.includes(s.fmaId),
      );
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
        same(session.questions.length, Math.min(20, targets.length));
        for (const q of session.questions)
          check(targets.some((s) => s.id === q.target));
      }
    }
  }
// Reconstruct only from records already checked byte-for-byte against the pinned
// baseline, so this regression also runs in the GitHub snapshot without Site history.
const previous = {
  ...catalog,
  bundles: baseline.bundles,
  structures: baseline.structures.map((old) =>
    catalog.structures.find((s) => s.id === old.id),
  ),
};
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
  newEntries: 14,
  vesselEntries: 14,
  rightEntries: 7,
  leftEntries: 7,
  sourceComponents: 24,
  newBundles: 1,
  newAssetBytes: catalog.bundles
    .filter((b) => b.id.endsWith('-hand-venous'))
    .reduce((n, b) => n + b.bytes, 0),
  preservedRecords: 984,
  preservedBundles: 80,
  sourceHolds: handVenousHeldIds,
  studyWindows: 4,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/hand-venous-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
