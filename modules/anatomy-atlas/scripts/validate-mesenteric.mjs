import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import {
  mesentericDefinitions,
  mesentericAdmissions,
  mesentericHeldIds,
} from './mesenteric-selections.mjs';
import { inventoryHolds } from './anatomy-inventory.mjs';
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
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const root = 'public/models/bodyparts3d/full-body/';
const catalog = await read(root + 'catalog.json'),
  baseline = await read('content/mesenteric-baseline.json'),
  audit = await read('content/mesenteric-source-audit.json'),
  inventory = await read('content/source-inventory.json');
same(baseline.sourceCommit, '85401e066e4f5479ca00e7177f2e8aa29676ec94');
same(
  baseline.catalogSha256,
  '9512052d74f333f3276aac1926c8537c428badcd237dd724a5822cd7c7a005cd',
);
same(audit.sourceCommit, baseline.sourceCommit);
same(baseline.structures.length, 925);
same(baseline.bundles.length, 74);
same(catalog.structures.length, 1006);
same(catalog.bundles.length, 82);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
for (const old of baseline.structures)
  same(
    hash(JSON.stringify(catalog.structures.find((s) => s.id === old.id))),
    old.sha256,
    'Every preceding field remains exact',
  );
for (const old of baseline.bundles) {
  same(
    catalog.bundles.find((b) => b.id === old.id),
    old,
  );
  same(hash(await fs.readFile(root + old.id + '.glb')), old.sha256);
}
const additions = catalog.structures.filter((s) =>
  s.bundle.endsWith('-mesenteric'),
);
same(additions.map((s) => s.fmaId).sort(), [...mesentericAdmissions].sort());
same(additions.length, 17);
same(additions.filter((s) => s.system === 'connective').length, 3);
same(additions.filter((s) => s.system === 'vessels').length, 14);
same(audit.results.length, 20);
same(audit.candidateTriangleOverlaps, []);
same(
  audit.nearOverlapDiagnostics.map((r) => [r.a, r.b]),
  [
    ['FMA14749', 'FMA66358'],
    ['FMA14809', 'FMA14819'],
  ],
);
same(audit.nearOverlapDiagnostics[0].aExisting, true);
for (const row of audit.nearOverlapDiagnostics) {
  check(
    row.aToB.withinQuarterMm / row.aToB.samples >= 0.25 ||
      row.bToA.withinQuarterMm / row.bToA.samples >= 0.25,
  );
  check(!mesentericAdmissions.includes(row.a));
  check(!mesentericAdmissions.includes(row.b));
}
for (const id of mesentericHeldIds) {
  check(inventoryHolds[id]);
  check(!catalog.structures.some((s) => s.fmaId === id));
  for (const record of inventory.records.filter((r) => r.id === id))
    same(record.status, 'held-source-review');
}
for (const [id, name, file] of mesentericDefinitions) {
  const a = audit.results.find((r) => r.fmaId === id);
  check(a);
  same(a.sourceName, name);
  same(a.file, file);
  same(a.sourceTree, 'isa');
  check(a.grossPositionPass);
  same(a.existingTriangleOverlaps, []);
  same(a.clinicalValidation, false);
  for (let k = 0; k < 3; k++) {
    check(a.bounds.min[k] >= a.grossEnvelope.min[k]);
    check(a.bounds.max[k] <= a.grossEnvelope.max[k]);
    check(a.bounds.min[k] < a.bounds.max[k]);
  }
  const s = additions.find((s) => s.fmaId === id);
  if (!s) {
    check(mesentericHeldIds.includes(id));
    continue;
  }
  same(s.sourceName, name);
  same(s.sources, [{ file, sha256: a.sha256 }]);
  same(s.sourceTree, 'isa');
  same(s.region, 'abdomen');
  same(s.regions, ['abdomen']);
  same(s.category, a.category);
  same(s.system, a.system);
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  check(s.coverageNote.includes('Unvalidated'));
  const asset = inventory.assets.find(
    (x) => x.tree === 'isa' && x.file === file,
  );
  same(asset.sha256, a.sha256);
  same(asset.geometrySha256, a.geometrySha256);
  same(asset.representedBy, [s.id]);
  check(
    !inventory.assets.some(
      (x) =>
        x.geometrySha256 === a.geometrySha256 &&
        x.representedBy.some((id) => id !== s.id),
    ),
  );
  check(!a.exactAliases.some((x) => inventoryHolds[x.fmaId]));
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++)
      check(
        Math.abs(a.sceneBounds[end][k] - s.bounds[end][k]) < 0.000002,
        'Original common transform',
      );
}
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/mesenteric-anatomy'; export * from './app/dissection-data'; export * from './app/body-content'; export * from './lib/anatomy-practice'; export * from './lib/anatomy-link-registry';",
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
  api.mesentericGroups.flatMap((g) => g.fmaIds).sort(),
  [...mesentericAdmissions].sort(),
);
same(api.mesentericMembraneIds.length, 3);
same(api.mesentericArteryIds.length, 9);
same(api.mesentericVeinIds.length, 5);
for (const s of additions) {
  const group = api.mesentericGroupFor(s.fmaId);
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
  const entry = api.bodyLinkEntries(catalog).find((e) => e.id === s.id);
  check(entry);
  same(entry.sources, s.sources);
  same(entry.reference.kind, 'surface-bounds-centre');
}
same(api.mesentericStudySets.length, 5);
const profile = api.dissectionProfiles.abdomen,
  loaded = catalog.bundles.map((b) => b.id);
let serial = 0;
const counts = {
  'mesenteric-surfaces': 7,
  'mesenteric-vessel-window': 17,
  'mesenteric-arteries': 11,
  'mesenteric-veins': 6,
  'appendix-mesentery': 4,
};
for (const study of api.mesentericStudySets) {
  const stage = profile.stages.find((s) => s.id === study.id),
    focus = profile.focuses.find((f) => f.id === study.id);
  check(stage && focus);
  same(focus.includeSkeleton, false);
  same(focus.rule.fmaIds, study.targetFmaIds);
  same(focus.context, study.context);
  for (const side of ['both', 'left', 'right']) {
    const scope = catalog.structures.filter(
      (s) =>
        s.regions.includes('abdomen') &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    const expected = scope.filter(
      (s) =>
        study.targetFmaIds.includes(s.fmaId) ||
        study.context.some((r) => api.matchesRule(s, r)),
    );
    const visible = api.stageStructures(scope, profile, study.id);
    same(visible, expected);
    same(api.stageStructures(scope, profile, 'free', study.id), expected);
    if (side === 'both') {
      same(visible.length, counts[study.id]);
      for (const landmark of study.landmarks)
        check(
          visible.some((s) => new RegExp(landmark, 'i').test(s.sourceName)),
        );
    }
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
}
const result = {
  passed: true,
  checks,
  newEntries: 17,
  mesentericSurfaces: 3,
  vesselSegments: 14,
  newBundles: 2,
  newAssetBytes: catalog.bundles
    .filter((b) => b.id.endsWith('-mesenteric'))
    .reduce((n, b) => n + b.bytes, 0),
  preservedRecords: 925,
  preservedBundles: 74,
  sourceHolds: mesentericHeldIds,
  studyWindows: 5,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/mesenteric-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
