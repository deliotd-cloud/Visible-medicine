import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { axialDefinitions, axialHeldDefinitions } from './axial-selections.mjs';
import { inventoryHolds } from './anatomy-inventory.mjs';
import { applyJunctionTransition } from './junction-transition.mjs';
let checks = 0;
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const read = async (p) => JSON.parse(await fs.readFile(p, 'utf8'));
const catalog = await read('public/models/bodyparts3d/full-body/catalog.json');
const baseline = await read('content/axial-baseline.json');
const evidence = await read('content/axial-source-audit.json');
const inventory = await read('content/source-inventory.json');
same(baseline.sourceCommit, 'e007550faec7c75947569c2a30fa1a032c7bf5f0');
same(evidence.sourceCommit, baseline.sourceCommit);
same(baseline.structures.length, 881);
same(baseline.bundles.length, 67);
same(catalog.structures.length, 984);
same(catalog.bundles.length, 80);
same(catalog.coordinateSystem, baseline.coordinateSystem);
same(catalog.excluded, baseline.excluded);
await applyJunctionTransition(baseline, catalog);
for (const old of baseline.structures) {
  const current = catalog.structures.find((s) => s.id === old.id);
  check(current);
  same(
    hash(JSON.stringify(current)),
    old.sha256,
    'Earlier identity and every catalogue field preserved',
  );
}
for (const old of baseline.bundles) {
  same(
    catalog.bundles.find((b) => b.id === old.id),
    old,
  );
  same(
    hash(
      await fs.readFile(
        'public/models/bodyparts3d/full-body/' + old.id + '.glb',
      ),
    ),
    old.sha256,
    'Prior GLB preserved byte-for-byte',
  );
}
const additions = catalog.structures.filter((s) =>
  s.bundle.endsWith('-axial-detail'),
);
same(additions.length, 11);
same(evidence.results.length, 11);
same(evidence.results.flatMap((r) => r.sources).length, 15);
const fingerprints = new Set();
for (const [fma, name, files, system, region, extra] of axialDefinitions) {
  const s = additions.find((s) => s.fmaId === fma);
  check(s);
  same(s.sourceName, name);
  same(s.system, system);
  same(s.region, region);
  check([region, ...extra].every((r) => s.regions.includes(r)));
  check(s.regions.every((r) => catalog.regions.some((x) => x.id === r)));
  same(
    s.sources.map((x) => x.file),
    files,
  );
  same(s.sourceTree, 'isa');
  same(
    s.category,
    system === 'muscles'
      ? 'muscle'
      : /retinaculum/.test(name)
        ? 'ligament'
        : 'fascia',
  );
  check(s.bundle.endsWith('-axial-detail'));
  same(s.provenance, {
    method: 'licensed-source-mesh',
    license: 'CC-BY-4.0',
    sourceVersion: '4.0',
    recovered: true,
  });
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  check(s.coverageNote.includes('Unvalidated'));
  if (files.length > 1) {
    same(s.laterality, 'midline');
    check(s.coverageNote.includes('both sides'));
  }
  const audit = evidence.results.find((r) => r.fmaId === fma);
  same(audit.sourceName, name);
  same(audit.clinicalValidation, false);
  same(
    audit.sources.map((f) => f.file),
    files,
  );
  for (const f of audit.sources) {
    const a = inventory.assets.find(
      (a) => a.tree === 'isa' && a.file === f.file,
    );
    same(f.sha256, a.sha256);
    same(f.geometrySha256, a.geometrySha256);
    same(a.representedBy, [s.id], 'No exact duplicate rendered surface');
    same(s.sources.find((x) => x.file === f.file).sha256, f.sha256);
    check(!fingerprints.has(f.geometrySha256));
    fingerprints.add(f.geometrySha256);
    check([...f.bounds.min, ...f.bounds.max].every(Number.isFinite));
    const e = audit.grossEnvelope;
    check(f.bounds.min[0] >= -e.x && f.bounds.max[0] <= e.x);
    check(f.bounds.min[2] >= e.z[0] && f.bounds.max[2] <= e.z[1]);
    if (s.laterality === 'left') check(f.bounds.min[0] + f.bounds.max[0] > 0);
    if (s.laterality === 'right') check(f.bounds.min[0] + f.bounds.max[0] < 0);
    same(f.sceneBounds, {
      min: [
        f.bounds.min[0] * 0.01,
        (f.bounds.min[2] - 800) * 0.01,
        -(f.bounds.max[1] + 50) * 0.01,
      ],
      max: [
        f.bounds.max[0] * 0.01,
        (f.bounds.max[2] - 800) * 0.01,
        -(f.bounds.min[1] + 50) * 0.01,
      ],
    });
  }
  for (const end of ['min', 'max'])
    for (let k = 0; k < 3; k++)
      check(
        Math.abs(
          Math[end](...audit.sources.map((f) => f.sceneBounds[end][k])) -
            s.bounds[end][k],
        ) < 0.000002,
        'Unchanged common transform',
      );
}
same(evidence.held.length, 2);
for (const [fma, name, files] of axialHeldDefinitions) {
  check(inventoryHolds[fma]);
  check(!catalog.structures.some((s) => s.fmaId === fma));
  same(
    evidence.held.find((r) => r.fmaId === fma).sources.map((f) => f.file),
    files,
  );
  check(
    !catalog.structures.some((s) =>
      s.sources.some((f) => files.includes(f.file)),
    ),
  );
  check(
    inventory.records.some(
      (r) =>
        r.id === fma && r.name === name && r.status === 'held-source-review',
    ),
  );
}
check(!catalog.structures.some((s) => inventoryHolds[s.fmaId]));
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/axial-anatomy'; export * from './app/dissection-data'; export * from './app/body-content';",
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
  api.axialGroups.flatMap((g) => g.fmaIds).sort(),
  additions.map((s) => s.fmaId).sort(),
);
same(api.axialStudySets.length, 6);
for (const s of additions) {
  const g = api.axialGroupFor(s.fmaId);
  check(g);
  for (const tab of ['anatomy', 'function']) {
    const lesson = api.bodyContent(s, tab);
    check(lesson.title.includes('draft'));
    check(lesson.note.includes('Unvalidated'));
    same(lesson.body, g[tab]);
    check(lesson.bullets.includes(g.caution));
    check(lesson.citations.every((c) => c.startsWith('https://')));
  }
  for (const tab of ['ct', 'mri', 'ultrasound'])
    check(api.bodyContent(s, tab).body.includes('No imaging study'));
}
for (const study of api.axialStudySets)
  for (const region of study.regions) {
    const profile = api.dissectionProfiles[region];
    const focus = profile.focuses.find((f) => f.id === study.id);
    check(focus);
    same(focus.includeSkeleton, false);
    same(focus.context, study.context);
    for (const side of ['both', 'left', 'right']) {
      const scope = catalog.structures.filter(
        (s) =>
          s.regions.includes(region) &&
          (side === 'both' ||
            s.laterality === side ||
            ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
      );
      const expected = scope.filter(
        (s) =>
          study.targetFmaIds.includes(s.fmaId) ||
          study.context.some((r) => api.matchesRule(s, r)),
      );
      const visible = api.stageStructures(scope, profile, 'free', study.id);
      same(
        visible.map((s) => s.id),
        expected.map((s) => s.id),
      );
      check(visible.some((s) => study.targetFmaIds.includes(s.fmaId)));
      check(visible.length < scope.length, 'Window removes unrelated anatomy');
      for (const target of scope.filter((s) =>
        study.targetFmaIds.includes(s.fmaId),
      ))
        check(visible.includes(target));
      for (const pattern of study.landmarks)
        check(visible.some((s) => new RegExp(pattern).test(s.sourceName)));
      if (region === study.regions[0])
        same(
          api.stageStructures(scope, profile, study.id).map((s) => s.id),
          visible.map((s) => s.id),
        );
      let state = api.dissectionReducer(api.initialDissection, {
        type: 'focus',
        id: study.id,
      });
      const original = api
        .resolveDissection(scope, profile, state)
        .visible.map((s) => s.id);
      const target = visible.find((s) => study.targetFmaIds.includes(s.fmaId));
      state = api.dissectionReducer(state, { type: 'remove', id: target.id });
      check(
        !api
          .resolveDissection(scope, profile, state)
          .visible.some((s) => s.id === target.id),
      );
      state = api.dissectionReducer(state, { type: 'undo' });
      same(
        api.resolveDissection(scope, profile, state).visible.map((s) => s.id),
        original,
      );
    }
  }
console.log({
  checks,
  additions: 11,
  components: 15,
  preservedStructures: 879,
  preservedBundles: 66,
  documentedJunctionChanges: { records: 2, bundles: 1 },
  sourceHolds: 2,
  studyWindows: 6,
  focusedViews: 8,
  clinicalValidation: false,
});
